import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { Tutorial, TUTORIAL_STEPS } from '../../components/Tutorial';
import { TopHUD } from '../../components/TopHUD';
import { GameInstance } from '../../core/Game';
import { isTutorialCompleted, resetTutorialProgress } from '../../components/tutorial/tutorialProgress';

describe('Tutorial UI & Blocker Remediation Scenarios', () => {
  beforeEach(() => {
    resetTutorialProgress();
    (window as any).isTutorialActive = false;
    GameInstance.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (window as any).activeStarMapRenderer;
    (window as any).isTutorialActive = false;
  });

  it('SCEN-TUTORIAL-9-STEPS: 教程覆盖 9 步智脑校准路径', () => {
    expect(TUTORIAL_STEPS.map(step => step.id)).toEqual([
      'welcome',
      'click-earth',
      'read-status',
      'build-stope',
      'resource-production',
      'start-research',
      'next-turn',
      'resolve-event',
      'tutorial-end',
    ]);
  });

  it('SCEN-TUTORIAL-WELCOME: 序幕手动开始校准后进入选中家园步骤', () => {
    vi.useFakeTimers();
    render(<Tutorial onComplete={vi.fn()} />);

    expect(screen.getByText('序幕')).toBeInTheDocument();
    expect(screen.getByText(/三体舰队启航。智脑战略系统初始化完成/)).toBeInTheDocument();

    // welcome 步骤为手动推进，点击「开始校准」按钮进入步骤 1
    fireEvent.click(screen.getByRole('button', { name: /开始校准/ }));

    expect(screen.getByText('步骤 1 / 8')).toBeInTheDocument();
    expect(screen.getByText('选中家园星系')).toBeInTheDocument();
  });

  it('SCEN-TUTORIAL-STEP1-HOTSPOT: 选中地球后进入状态阅读步骤', () => {
    vi.useFakeTimers();
    (window as any).activeStarMapRenderer = {
      focusOnStar: vi.fn(),
      setTutorialPulse: vi.fn(),
      getStarScreenCoords: vi.fn(() => ({ x: 512, y: 384 })),
    };
    render(<Tutorial onComplete={vi.fn()} />);

    // welcome 步骤手动推进
    fireEvent.click(screen.getByRole('button', { name: /开始校准/ }));
    // 推进 RAF 让 highlightRect 更新
    act(() => vi.advanceTimersByTime(100));

    fireEvent.click(screen.getByTestId('tutorial-earth-hotspot'));

    expect(screen.getByText('步骤 2 / 8')).toBeInTheDocument();
    expect(screen.getByText('监控三维产出')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下一步/ })).toBeInTheDocument();
  });

  it('SCEN-TUTORIAL-FULL-PATH: 资源调配必须实际变化后才进入科技步骤', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const game = GameInstance.get();
    const initialMiningRatio = game.earthCivi.miningRatio;
    (window as any).activeStarMapRenderer = {
      focusOnStar: vi.fn(),
      setTutorialPulse: vi.fn(),
      getStarScreenCoords: vi.fn(() => ({ x: 512, y: 384 })),
    };
    render(<Tutorial onComplete={onComplete} />);

    // welcome → click-earth
    fireEvent.click(screen.getByRole('button', { name: /开始校准/ }));
    act(() => vi.advanceTimersByTime(100));
    fireEvent.click(screen.getByTestId('tutorial-earth-hotspot'));
    // click-earth → read-status
    fireEvent.click(screen.getByRole('button', { name: /下一步/ }));
    // read-status → build-stope（地球初始已有采矿场，validate 直接通过）
    act(() => vi.advanceTimersByTime(100));
    fireEvent.click(screen.getByRole('button', { name: /下一步/ }));
    // build-stope → resource-production
    expect(screen.getByText('调配劳力分配')).toBeInTheDocument();

    // resource-production 是 MANUAL_ADVANCE，需先满足 validate 再手动点击「下一步」
    act(() => {
      game.earthCivi.miningRatio = initialMiningRatio + 1;
      vi.advanceTimersByTime(300);
    });
    // validate 通过后 actionValidated=true，点击「下一步」推进至 start-research
    fireEvent.click(screen.getByRole('button', { name: /下一步/ }));
    expect(screen.getByText('启动科技演进')).toBeInTheDocument();

    // start-research 同样为 MANUAL_ADVANCE：满足 inResearch 条件后需手动点击「下一步」
    for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
      const node = [...tree.nodes.values()].find(item => !item.finished);
      if (node) {
        node.inResearch = true;
        break;
      }
    }
    act(() => vi.advanceTimersByTime(300));
    fireEvent.click(screen.getByRole('button', { name: /下一步/ }));
    expect(screen.getByText('执行首回合决策')).toBeInTheDocument();

    act(() => window.dispatchEvent(new CustomEvent('game-turn-complete')));
    expect(screen.getByText('应对突发危机')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /下一步/ }));
    expect(screen.getByText('智脑校准完毕')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /完成校准/ }));
    act(() => vi.advanceTimersByTime(400));

    expect(onComplete).toHaveBeenCalledOnce();
    expect(isTutorialCompleted()).toBe(true);
  });

  it('SCEN-TUTORIAL-BLOCKER: 教程期间允许玩家越过回合阻断', () => {
    const game = GameInstance.get();
    game.earthCivi.isAiBrainEnabled = false;
    game.earthCivi.resource = 5;
    game.earthCivi.economy = 5;

    expect(game.getTurnBlockers().length).toBeGreaterThan(0);
    (window as any).isTutorialActive = true;
    // 模拟教程处于 next-turn 步骤（此时下一回合按钮应可用）
    (window as any).currentTutorialStepId = 'next-turn';
    render(<TopHUD />);

    // 教程期间 turnBlockers 被清空，按钮不被阻断条件禁用
    const nextTurnBtn = screen.getAllByRole('button', { name: /下一回合|同步逻辑中|有阻断|教程指引中/ });
    nextTurnBtn.forEach(button => expect(button).not.toBeDisabled());
  });

  it('SCEN-TUTORIAL-CLICK-THROUGH: 教程渲染可交互遮罩', () => {
    render(<Tutorial onComplete={vi.fn()} />);
    expect(screen.getByTestId('tutorial-overlay-full')).toBeInTheDocument();
  });
});
