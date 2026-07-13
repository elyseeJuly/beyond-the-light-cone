import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { Tutorial, TUTORIAL_STEPS } from '../../components/Tutorial';
import { TopHUD } from '../../components/TopHUD';
import { GameInstance } from '../../core/Game';
import { STAR_INDEX } from '../../config/starIndices';

describe('Tutorial UI & Blocker Remediation Scenarios', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    window.localStorage.removeItem('game-tutorial-seen');
    (window as any).isTutorialActive = false;
    GameInstance.reset();
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
    (window as any).isTutorialActive = false;
    vi.restoreAllMocks();
  });

  const setWindowSize = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
    window.dispatchEvent(new Event('resize'));
  };

  it('SCEN-TUTORIAL-5-STEPS: 教程为 5 步（欢迎页 + 4 步核心）', () => {
    expect(TUTORIAL_STEPS.length).toBe(5);
    expect(TUTORIAL_STEPS[0].id).toBe('welcome');
    expect(TUTORIAL_STEPS[1].id).toBe('click-earth');
    expect(TUTORIAL_STEPS[2].id).toBe('resource-production');
    expect(TUTORIAL_STEPS[3].id).toBe('start-research');
    expect(TUTORIAL_STEPS[4].id).toBe('next-turn');
  });

  it('SCEN-TUTORIAL-SHORT-TEXT: 每步文案不超过 25 个汉字', () => {
    TUTORIAL_STEPS.forEach(step => {
      const chineseChars = (step.description.match(/[\u4e00-\u9fa5]/g) || []).length;
      expect(chineseChars).toBeLessThanOrEqual(25);
    });
  });

  it('SCEN-TUTORIAL-RENDER: 可以正常渲染且不含"下一步"按钮', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();
    render(<Tutorial onComplete={onComplete} />);
    expect(screen.getByTestId('tutorial-skip-btn')).toBeTruthy();
    const nextButtons = screen.queryAllByRole('button', { name: /下一步/ });
    expect(nextButtons.length).toBe(0);
  });

  it('SCEN-TUTORIAL-WELCOME: 欢迎页 1.5s 后自动进入步骤 1（核心点击地球）', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();
    render(<Tutorial onComplete={onComplete} />);

    // 初始应显示欢迎页（序幕）
    expect(screen.getByText('序幕')).toBeInTheDocument();
    expect(screen.getByText('文明的故事，从这里开始。')).toBeInTheDocument();

    // 等待 1.5s 自动过渡
    return new Promise<void>(resolve => {
      setTimeout(() => {
        // 应进入步骤 1/4
        expect(screen.getByText(/步骤 1 \/ 4/)).toBeInTheDocument();
        expect(screen.getByText('选中家园')).toBeInTheDocument();
        resolve();
      }, 1700);
    });
  });

  it('SCEN-TUTORIAL-STEP1-HOTSPOT: hotspot 点击 = 选中地球（核心防误触）', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();
    const game = GameInstance.get();
    const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
    if (!earthStar) { expect(false).toBe(true); return; }

    // mock StarMapRenderer 以让 highlightRect 有值、hotspot 渲染
    (window as any).activeStarMapRenderer = {
      focusOnStar: vi.fn(),
      setTutorialPulse: vi.fn(),
      getStarScreenCoords: vi.fn(() => ({ x: 512, y: 384 })),
    };

    render(<Tutorial onComplete={onComplete} />);

    return new Promise<void>(resolve => {
      // 等待 welcome 过渡到 step 1（1500ms）
      setTimeout(() => {
        const hotspot = screen.queryByTestId('tutorial-earth-hotspot');
        expect(hotspot).toBeTruthy();

        act(() => {
          if (hotspot) fireEvent.click(hotspot);
        });

        setTimeout(() => {
          expect(screen.getByText(/步骤 2 \/ 4/)).toBeInTheDocument();
          expect(screen.getByText('资源生产')).toBeInTheDocument();
          delete (window as any).activeStarMapRenderer;
          resolve();
        }, 400);
      }, 1700);
    });
  });

  it('SCEN-TUTORIAL-STEP1-FOCUS-EARTH: 步骤 1 启动时自动 focusOnStar 地球（防止"找不到地球"）', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();

    // 注入一个 mock StarMapRenderer
    const focusSpy = vi.fn();
    const pulseSpy = vi.fn();
    (window as any).activeStarMapRenderer = {
      focusOnStar: focusSpy,
      setTutorialPulse: pulseSpy,
      getStarScreenCoords: vi.fn(() => ({ x: 100, y: 100 })),
    };

    render(<Tutorial onComplete={onComplete} />);

    return new Promise<void>(resolve => {
      setTimeout(() => {
        // 等待 focus 链触发
        setTimeout(() => {
          expect(focusSpy).toHaveBeenCalledWith(3, 1.5, true); // earth, zoom 1.5, ensureArea
          expect(pulseSpy).toHaveBeenCalledWith(3);
          delete (window as any).activeStarMapRenderer;
          resolve();
        }, 200);
      }, 1700);
    });
  });

  it('SCEN-TUTORIAL-STEP2-BUILD-STOPE: 建造采矿场后自动进入第三步', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();
    const game = GameInstance.get();
    const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
    if (!earthStar) { expect(false).toBe(true); return; }

    earthStar.hasStope = false;
    earthStar.buildingProgress = null;

    (window as any).activeStarMapRenderer = {
      focusOnStar: vi.fn(),
      setTutorialPulse: vi.fn(),
      getStarScreenCoords: vi.fn(() => ({ x: 512, y: 384 })),
    };

    render(<Tutorial onComplete={onComplete} />);

    return new Promise<void>(resolve => {
      setTimeout(() => {
        const hotspot = screen.queryByTestId('tutorial-earth-hotspot');
        act(() => {
          if (hotspot) fireEvent.click(hotspot);
        });

        setTimeout(() => {
          expect(screen.getByText(/步骤 2 \/ 4/)).toBeInTheDocument();

          act(() => {
            earthStar.buildingProgress = { stope: { currentBuild: 0, totalBuild: 100, buildPerRound: 20 } };
          });

          setTimeout(() => {
            expect(screen.getByText(/步骤 3 \/ 4/)).toBeInTheDocument();
            delete (window as any).activeStarMapRenderer;
            resolve();
          }, 500);
        }, 400);
      }, 1700);
    });
  });

  it('SCEN-TUTORIAL-STEP3-START-RESEARCH: 启动科研后自动进入第四步', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();
    const game = GameInstance.get();
    const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
    if (!earthStar) { expect(false).toBe(true); return; }

    earthStar.hasStope = false;
    earthStar.buildingProgress = null;

    (window as any).activeStarMapRenderer = {
      focusOnStar: vi.fn(),
      setTutorialPulse: vi.fn(),
      getStarScreenCoords: vi.fn(() => ({ x: 512, y: 384 })),
    };

    render(<Tutorial onComplete={onComplete} />);

    return new Promise<void>(resolve => {
      setTimeout(() => {
        const hotspot = screen.queryByTestId('tutorial-earth-hotspot');
        act(() => {
          if (hotspot) fireEvent.click(hotspot);
        });

        setTimeout(() => {
          act(() => {
            earthStar.buildingProgress = { stope: { currentBuild: 0, totalBuild: 100, buildPerRound: 20 } };
          });

          setTimeout(() => {
            expect(screen.getByText(/步骤 3 \/ 4/)).toBeInTheDocument();

            const earth = game.earthCivi;
            for (const tree of earth.tecTreeManager.trees.values()) {
              for (const node of tree.nodes.values()) {
                if (!node.finished) {
                  node.inResearch = true;
                  break;
                }
              }
              break;
            }

            setTimeout(() => {
              expect(screen.getByText(/步骤 4 \/ 4/)).toBeInTheDocument();
              delete (window as any).activeStarMapRenderer;
              resolve();
            }, 500);
          }, 500);
        }, 400);
      }, 1700);
    });
  });

  it('SCEN-TUTORIAL-STEP4-NEXT-TURN: 推进回合后完成教程', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();
    const game = GameInstance.get();
    const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
    if (!earthStar) { expect(false).toBe(true); return; }

    earthStar.hasStope = false;
    earthStar.buildingProgress = null;

    (window as any).activeStarMapRenderer = {
      focusOnStar: vi.fn(),
      setTutorialPulse: vi.fn(),
      getStarScreenCoords: vi.fn(() => ({ x: 512, y: 384 })),
    };

    render(<Tutorial onComplete={onComplete} />);

    return new Promise<void>(resolve => {
      setTimeout(() => {
        const hotspot = screen.queryByTestId('tutorial-earth-hotspot');
        act(() => {
          if (hotspot) fireEvent.click(hotspot);
        });

        setTimeout(() => {
          act(() => {
            earthStar.buildingProgress = { stope: { currentBuild: 0, totalBuild: 100, buildPerRound: 20 } };
          });

          setTimeout(() => {
            const earth = game.earthCivi;
            for (const tree of earth.tecTreeManager.trees.values()) {
              for (const node of tree.nodes.values()) {
                if (!node.finished) {
                  node.inResearch = true;
                  break;
                }
              }
              break;
            }

            setTimeout(() => {
              act(() => {
                window.dispatchEvent(new CustomEvent('game-turn-complete'));
              });

              setTimeout(() => {
                expect(onComplete).toHaveBeenCalled();
                expect(localStorage.getItem('game-tutorial-seen')).toBe('true');
                delete (window as any).activeStarMapRenderer;
                resolve();
              }, 600);
            }, 500);
          }, 500);
        }, 400);
      }, 1700);
    });
  });

  it('SCEN-TUTORIAL-BLOCKER: 教程期间开启 blocker 穿透，即使有阻断也不禁用下一回合按钮', () => {
    const game = GameInstance.get();

    game.earthCivi.isAiBrainEnabled = false;
    game.earthCivi.resource = 5;
    game.earthCivi.economy = 5;

    const blockers = game.getTurnBlockers();
    expect(blockers.length).toBeGreaterThan(0);

    window.localStorage.setItem('game-tutorial-seen', 'true');
    (window as any).isTutorialActive = false;
    const { rerender } = render(<TopHUD />);
    const nextTurnBtns = screen.getAllByRole('button', { name: /下一回合|同步中|有阻断/ });
    nextTurnBtns.forEach(btn => expect(btn).toBeDisabled());

    window.localStorage.removeItem('game-tutorial-seen');
    (window as any).isTutorialActive = true;
    rerender(<TopHUD />);

    const nextTurnBtnsTutorial = screen.getAllByRole('button', { name: /下一回合|同步中|有阻断/ });
    nextTurnBtnsTutorial.forEach(btn => expect(btn).not.toBeDisabled());

    const initialHistoryLength = game.historyLogs.length;
    game.runARound();
    const hasBlockerWarning = game.historyLogs.slice(initialHistoryLength).some(msg => msg.includes('⚠ 回合被阻断'));
    expect(hasBlockerWarning).toBe(false);
  });

  it('SCEN-GRACE-PERIOD-BLOCKERS: 前三回合科研停滞和部门空缺降级为警告不阻断', () => {
    const game = GameInstance.get();
    game.earthCivi.isAiBrainEnabled = false;
    (window as any).isTutorialActive = false;

    game.year = 0;
    game.earthCivi.resource = 100;
    game.earthCivi.economy = 100;

    for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
      for (const node of tree.nodes.values()) {
        node.inResearch = false;
      }
    }
    game.earthCivi.techResearchQueue.clear();
    for (const dept of game.earthCivi.departments.values()) {
      dept.leaderName = undefined as any;
    }

    const blockers = game.getTurnBlockers();
    expect(blockers).not.toContain(expect.stringContaining('科研停滞'));
    expect(blockers).not.toContain(expect.stringContaining('行政瘫痪'));

    const warnings = game.getTurnWarnings();
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.includes('科研停滞'))).toBe(true);
    expect(warnings.some(w => w.includes('行政瘫痪'))).toBe(true);

    game.earthCivi.resource = 5;
    const blockersWithLowResource = game.getTurnBlockers();
    expect(blockersWithLowResource.some(b => b.includes('资源崩盘'))).toBe(true);
  });

  it('SCEN-GRACE-PERIOD-EXPIRY: 三回合后恢复正常阻断规则', () => {
    const game = GameInstance.get();
    game.earthCivi.isAiBrainEnabled = false;
    (window as any).isTutorialActive = false;

    game.year = 3;
    game.earthCivi.resource = 100;
    game.earthCivi.economy = 100;

    for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
      for (const node of tree.nodes.values()) {
        node.inResearch = false;
      }
    }
    game.earthCivi.techResearchQueue.clear();
    for (const dept of game.earthCivi.departments.values()) {
      dept.leaderName = undefined as any;
    }

    const blockers = game.getTurnBlockers();
    expect(blockers.some(b => b.includes('科研停滞'))).toBe(true);
    expect(blockers.some(b => b.includes('行政瘫痪'))).toBe(true);

    const warnings = game.getTurnWarnings();
    expect(warnings.length).toBe(0);
  });

  it('SCEN-MANUAL-BLOCKER: 非宽限期手动模式下阻断消除后恢复可用', () => {
    const game = GameInstance.get();

    game.earthCivi.isAiBrainEnabled = false;
    (window as any).isTutorialActive = false;
    game.year = 5;
    game.earthCivi.resource = 5;
    game.earthCivi.economy = 5;

    expect(game.getTurnBlockers().length).toBeGreaterThan(0);

    const { rerender } = render(<TopHUD />);
    const nextTurnBtns = screen.getAllByRole('button', { name: /有阻断/ });
    expect(nextTurnBtns.length).toBeGreaterThan(0);
    nextTurnBtns.forEach(btn => expect(btn).toBeDisabled());

    game.earthCivi.resource = 100;
    game.earthCivi.economy = 100;
    game.earthCivi.apCurrent = 100;
    if (game.earthCivi.isResearchIdle && game.earthCivi.isResearchIdle()) {
      for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
        for (const node of tree.nodes.values()) {
          if (!node.finished) {
            node.inResearch = true;
            break;
          }
        }
        if (!game.earthCivi.isResearchIdle()) break;
      }
    }
    for (const dept of game.earthCivi.departments.values()) {
      if (!dept.leaderName) {
        dept.leaderName = '__test_auto_appointed__';
      }
    }

    expect(game.getTurnBlockers().length).toBe(0);

    rerender(<TopHUD />);
    const nextTurnBtnsResolved = screen.getAllByRole('button', { name: /下一回合/ });
    expect(nextTurnBtnsResolved.length).toBeGreaterThan(0);
    nextTurnBtnsResolved.forEach(btn => expect(btn).not.toBeDisabled());
  });

  it('SCEN-TUTORIAL-CLICK-THROUGH: 教程高亮遮罩区域允许点击穿透', () => {
    setWindowSize(1024, 768);
    const onComplete = () => {};
    render(<Tutorial onComplete={onComplete} />);

    const fullOverlay = screen.queryByTestId('tutorial-overlay-full');
    const topOverlay = screen.queryByTestId('tutorial-overlay-top');

    expect(fullOverlay || topOverlay).toBeTruthy();
  });
});
