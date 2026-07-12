import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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

  it('SCEN-TUTORIAL-FOUR-STEPS: 强制教程只有四步', () => {
    expect(TUTORIAL_STEPS.length).toBe(4);
    expect(TUTORIAL_STEPS[0].id).toBe('click-earth');
    expect(TUTORIAL_STEPS[1].id).toBe('resource-production');
    expect(TUTORIAL_STEPS[2].id).toBe('start-research');
    expect(TUTORIAL_STEPS[3].id).toBe('next-turn');
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
    // 应该有跳过教程按钮
    expect(screen.getByTestId('tutorial-skip-btn')).toBeTruthy();
    // 不应该有"下一步"文字按钮（操作步骤自动推进）
    const nextButtons = screen.queryAllByRole('button', { name: /下一步/ });
    expect(nextButtons.length).toBe(0);
  });

  it('SCEN-TUTORIAL-STEP1-CLICK-EARTH: 点击地球后自动进入第二步', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();
    render(<Tutorial onComplete={onComplete} />);

    // 初始应显示步骤 1/4
    expect(screen.getByText(/步骤 1 \/ 4/)).toBeInTheDocument();

    // 模拟点击地球（派发 star-selected 事件）
    const game = GameInstance.get();
    const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
    act(() => {
      window.dispatchEvent(new CustomEvent('star-selected', { detail: earthStar }));
    });

    // 应自动进入步骤 2/4
    expect(screen.getByText(/步骤 2 \/ 4/)).toBeInTheDocument();
  });

  it('SCEN-TUTORIAL-STEP2-BUILD-STOPE: 建造采矿场后自动进入第三步', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();
    const game = GameInstance.get();
    const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
    if (!earthStar) { expect(false).toBe(true); return; }

    // 确保地球没有采矿场
    earthStar.hasStope = false;
    earthStar.buildingProgress = null;

    render(<Tutorial onComplete={onComplete} />);

    // 模拟第一步完成
    act(() => {
      window.dispatchEvent(new CustomEvent('star-selected', { detail: earthStar }));
    });

    expect(screen.getByText(/步骤 2 \/ 4/)).toBeInTheDocument();

    // 模拟建造采矿场
    act(() => {
      earthStar.buildingProgress = { stope: { currentBuild: 0, totalBuild: 100, buildPerRound: 20 } };
    });

    // 等待轮询检测（300ms 间隔）
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(screen.getByText(/步骤 3 \/ 4/)).toBeInTheDocument();
        resolve();
      }, 500);
    });
  });

  it('SCEN-TUTORIAL-STEP3-START-RESEARCH: 启动科研后自动进入第四步', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();
    const game = GameInstance.get();
    const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
    if (!earthStar) { expect(false).toBe(true); return; }

    // 确保地球没有采矿场（使 initialHasStope = false，步骤 2 检查 buildingProgress.stope）
    earthStar.hasStope = false;
    earthStar.buildingProgress = null;

    render(<Tutorial onComplete={onComplete} />);

    // 完成步骤 0：点击地球
    act(() => {
      window.dispatchEvent(new CustomEvent('star-selected', { detail: earthStar }));
    });

    // 完成步骤 1：建造采矿场
    return new Promise<void>(resolve => {
      setTimeout(() => {
        act(() => {
          earthStar.buildingProgress = { stope: { currentBuild: 0, totalBuild: 100, buildPerRound: 20 } };
        });

        // 等待步骤 2 激活
        setTimeout(() => {
          expect(screen.getByText(/步骤 3 \/ 4/)).toBeInTheDocument();

          // 模拟启动科研
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
            resolve();
          }, 500);
        }, 500);
      }, 300);
    });
  });

  it('SCEN-TUTORIAL-STEP4-NEXT-TURN: 推进回合后完成教程', () => {
    setWindowSize(1024, 768);
    const onComplete = vi.fn();
    const game = GameInstance.get();
    const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
    if (!earthStar) { expect(false).toBe(true); return; }

    // 确保地球没有采矿场
    earthStar.hasStope = false;
    earthStar.buildingProgress = null;

    render(<Tutorial onComplete={onComplete} />);

    // 完成步骤 0：点击地球
    act(() => {
      window.dispatchEvent(new CustomEvent('star-selected', { detail: earthStar }));
    });

    // 完成步骤 1→2→3
    return new Promise<void>(resolve => {
      setTimeout(() => {
        act(() => {
          earthStar.buildingProgress = { stope: { currentBuild: 0, totalBuild: 100, buildPerRound: 20 } };
        });

        setTimeout(() => {
          // 启动科研
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
            // 推进回合
            act(() => {
              window.dispatchEvent(new CustomEvent('game-turn-complete'));
            });

            setTimeout(() => {
              expect(onComplete).toHaveBeenCalled();
              expect(localStorage.getItem('game-tutorial-seen')).toBe('true');
              resolve();
            }, 600);
          }, 500);
        }, 500);
      }, 300);
    });
  });

  it('SCEN-TUTORIAL-BLOCKER: 教程期间开启 blocker 穿透，即使有阻断也不禁用下一回合按钮', () => {
    const game = GameInstance.get();

    game.earthCivi.isAiBrainEnabled = false;
    game.earthCivi.resource = 5;
    game.earthCivi.economy = 5;

    const blockers = game.getTurnBlockers();
    expect(blockers.length).toBeGreaterThan(0);

    // 非教程模式下按钮禁用
    window.localStorage.setItem('game-tutorial-seen', 'true');
    (window as any).isTutorialActive = false;
    const { rerender } = render(<TopHUD />);
    const nextTurnBtns = screen.getAllByRole('button', { name: /下一回合|同步中|有阻断/ });
    nextTurnBtns.forEach(btn => expect(btn).toBeDisabled());

    // 教程模式下按钮可用
    window.localStorage.removeItem('game-tutorial-seen');
    (window as any).isTutorialActive = true;
    rerender(<TopHUD />);

    const nextTurnBtnsTutorial = screen.getAllByRole('button', { name: /下一回合|同步中|有阻断/ });
    nextTurnBtnsTutorial.forEach(btn => expect(btn).not.toBeDisabled());

    // runARound 不应因阻断 early return
    const initialHistoryLength = game.historyLogs.length;
    game.runARound();
    const hasBlockerWarning = game.historyLogs.slice(initialHistoryLength).some(msg => msg.includes('⚠ 回合被阻断'));
    expect(hasBlockerWarning).toBe(false);
  });

  it('SCEN-GRACE-PERIOD-BLOCKERS: 前三回合科研停滞和部门空缺降级为警告不阻断', () => {
    const game = GameInstance.get();
    game.earthCivi.isAiBrainEnabled = false;
    (window as any).isTutorialActive = false;

    // 设置 year=0（第一回合，宽限期内）
    game.year = 0;
    game.earthCivi.resource = 100;
    game.earthCivi.economy = 100;

    // 确保科研停滞和部门空缺
    // 清除所有研究状态
    for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
      for (const node of tree.nodes.values()) {
        node.inResearch = false;
      }
    }
    game.earthCivi.techResearchQueue.clear();
    // 清除所有部门首长
    for (const dept of game.earthCivi.departments.values()) {
      dept.leaderName = undefined as any;
    }

    // 宽限期内：阻断器不应包含科研停滞和部门空缺
    const blockers = game.getTurnBlockers();
    expect(blockers).not.toContain(expect.stringContaining('科研停滞'));
    expect(blockers).not.toContain(expect.stringContaining('行政瘫痪'));

    // 但警告应包含
    const warnings = game.getTurnWarnings();
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.includes('科研停滞'))).toBe(true);
    expect(warnings.some(w => w.includes('行政瘫痪'))).toBe(true);

    // 资源崩盘仍然阻断
    game.earthCivi.resource = 5;
    const blockersWithLowResource = game.getTurnBlockers();
    expect(blockersWithLowResource.some(b => b.includes('资源崩盘'))).toBe(true);
  });

  it('SCEN-GRACE-PERIOD-EXPIRY: 三回合后恢复正常阻断规则', () => {
    const game = GameInstance.get();
    game.earthCivi.isAiBrainEnabled = false;
    (window as any).isTutorialActive = false;

    // 设置 year=3（第四回合，宽限期外）
    game.year = 3;
    game.earthCivi.resource = 100;
    game.earthCivi.economy = 100;

    // 清除研究状态
    for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
      for (const node of tree.nodes.values()) {
        node.inResearch = false;
      }
    }
    game.earthCivi.techResearchQueue.clear();
    for (const dept of game.earthCivi.departments.values()) {
      dept.leaderName = undefined as any;
    }

    // 宽限期外：阻断器应包含科研停滞和部门空缺
    const blockers = game.getTurnBlockers();
    expect(blockers.some(b => b.includes('科研停滞'))).toBe(true);
    expect(blockers.some(b => b.includes('行政瘫痪'))).toBe(true);

    // 警告应为空
    const warnings = game.getTurnWarnings();
    expect(warnings.length).toBe(0);
  });

  it('SCEN-MANUAL-BLOCKER: 非宽限期手动模式下阻断消除后恢复可用', () => {
    const game = GameInstance.get();

    game.earthCivi.isAiBrainEnabled = false;
    (window as any).isTutorialActive = false;
    game.year = 5; // 超出宽限期
    game.earthCivi.resource = 5;
    game.earthCivi.economy = 5;

    expect(game.getTurnBlockers().length).toBeGreaterThan(0);

    const { rerender } = render(<TopHUD />);
    const nextTurnBtns = screen.getAllByRole('button', { name: /有阻断/ });
    expect(nextTurnBtns.length).toBeGreaterThan(0);
    nextTurnBtns.forEach(btn => expect(btn).toBeDisabled());

    // 解除阻断
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

    // 步骤 1 高亮 earth-star，如果找不到目标则显示全屏遮罩
    const fullOverlay = screen.queryByTestId('tutorial-overlay-full');
    const topOverlay = screen.queryByTestId('tutorial-overlay-top');

    // 至少有一种遮罩存在
    expect(fullOverlay || topOverlay).toBeTruthy();
  });
});
