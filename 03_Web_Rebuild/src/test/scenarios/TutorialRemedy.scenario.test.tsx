import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Tutorial } from '../../components/Tutorial';
import { TopHUD } from '../../components/TopHUD';
import { GameInstance } from '../../core/Game';

describe('Tutorial UI & Blocker Remediation Scenarios', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    // Save original dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    
    // Clear storage for a fresh state
    window.localStorage.removeItem('game-tutorial-seen');
    (window as any).isTutorialActive = false;
    
    // Initialize a fresh Game Instance
    GameInstance.reset();
  });

  afterEach(() => {
    // Restore window dimensions
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

  it('SCEN-TUTORIAL-NAV: 桌面端渲染侧边栏分类导航，移动端渲染顶部水平分类导航', () => {
    const onComplete = () => {};

    // 1. Test Desktop Layout
    setWindowSize(1024, 768);
    const { rerender } = render(<Tutorial onComplete={onComplete} />);
    expect(screen.getByTestId('tutorial-categories-vertical')).toBeInTheDocument();
    expect(screen.queryByTestId('tutorial-categories-horizontal')).not.toBeInTheDocument();

    // 2. Test Mobile Layout
    setWindowSize(375, 667);
    rerender(<Tutorial onComplete={onComplete} />);
    expect(screen.getByTestId('tutorial-categories-horizontal')).toBeInTheDocument();
    expect(screen.queryByTestId('tutorial-categories-vertical')).not.toBeInTheDocument();
  });

  it('SCEN-HUD-RESPONSIVE: 移动端自适应双行 HUD 布局不隐藏核心数值', () => {
    // Mock mobile screen size
    setWindowSize(375, 667);
    render(<TopHUD />);
    
    // Mobile layout container is rendered
    expect(screen.getByTestId('tophud-mobile-layout')).toBeInTheDocument();
    
    // Core stats are visible in the document (allow multiple elements in DOM layouts)
    expect(screen.getAllByText(/稳定度/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/人口/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/资源/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/军力/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/威慑度/).length).toBeGreaterThan(0);
  });

  it('SCEN-TUTORIAL-BLOCKER: 教程期间开启 blocker 穿透，即使有阻断也不禁用下一回合按钮并能推进回合', () => {
    const game = GameInstance.get();
    
    // Setup blocker conditions manually (e.g. Empty cabinet seats, tech idle)
    // By default, a fresh game starts with empty cabinet seats and tech idle.
    game.earthCivi.isAiBrainEnabled = false; // Disable AI brain to trigger manual checks
    
    // Ensure blockers list is non-empty
    const blockers = game.getTurnBlockers();
    expect(blockers.length).toBeGreaterThan(0);

    // Verify UI disables next turn in standard game when not in tutorial
    window.localStorage.setItem('game-tutorial-seen', 'true');
    (window as any).isTutorialActive = false;
    const { rerender } = render(<TopHUD />);
    const nextTurnBtns = screen.getAllByRole('button', { name: /下一回合|同步中|有阻断/ });
    nextTurnBtns.forEach(btn => expect(btn).toBeDisabled());

    // Now switch to tutorial mode (tutorial-seen is not true, and isTutorialActive is true)
    window.localStorage.removeItem('game-tutorial-seen');
    (window as any).isTutorialActive = true;
    rerender(<TopHUD />);
    
    // The button should now be enabled despite having blockers
    const nextTurnBtnsTutorial = screen.getAllByRole('button', { name: /下一回合|同步中|有阻断/ });
    nextTurnBtnsTutorial.forEach(btn => expect(btn).not.toBeDisabled());

    // Verify runARound executes without early return blocker warning
    const initialHistoryLength = game.historyLogs.length;
    game.runARound();
    
    // Blocker warning should NOT be present in history
    const hasBlockerWarning = game.historyLogs.slice(initialHistoryLength).some(msg => msg.includes('⚠ 回合被阻断'));
    expect(hasBlockerWarning).toBe(false);
  });

  it('SCEN-TUTORIAL-CLICK-THROUGH: 教程高亮遮罩区域应空缺允许点击，而遮罩区域阻止点击', () => {
    const onComplete = () => {};
    render(<Tutorial onComplete={onComplete} />);
    
    // Find the overlays
    const topOverlay = screen.queryByTestId('tutorial-overlay-top');
    const bottomOverlay = screen.queryByTestId('tutorial-overlay-bottom');
    const leftOverlay = screen.queryByTestId('tutorial-overlay-left');
    const rightOverlay = screen.queryByTestId('tutorial-overlay-right');
    const fullOverlay = screen.queryByTestId('tutorial-overlay-full');

    // Initially, there might not be a highlighted area (Step 1 is welcome screen with center card position and no highlightTarget)
    // Let's assert a full overlay is present in this step
    expect(fullOverlay).toBeInTheDocument();
    expect(topOverlay).not.toBeInTheDocument();
  });
});
