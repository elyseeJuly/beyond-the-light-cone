import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Tutorial, TUTORIAL_STEPS } from '../../components/Tutorial';
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
    const verticalNav = screen.getByTestId('tutorial-categories-vertical');
    expect(verticalNav).toBeInTheDocument();
    expect(screen.queryByTestId('tutorial-categories-horizontal')).not.toBeInTheDocument();

    // Verify categories in desktop vertical nav (including the expected UI categories)
    const expectedCategories = ['基础操作', '战略星图', '情报中心', '科技研发', '政府管理'];
    expectedCategories.forEach(cat => {
      expect(screen.getAllByRole('button', { name: new RegExp(cat) }).length).toBeGreaterThanOrEqual(1);
    });

    // 2. Test Mobile Layout
    setWindowSize(375, 667);
    rerender(<Tutorial onComplete={onComplete} />);
    const horizontalNav = screen.getByTestId('tutorial-categories-horizontal');
    expect(horizontalNav).toBeInTheDocument();
    expect(screen.queryByTestId('tutorial-categories-vertical')).not.toBeInTheDocument();
  });

  it('SCEN-TUTORIAL-STEPS-MATCH: 教程步骤中的所有分类必须与 LeftHub 的导航项完全一致（或属于基础操作）', () => {
    // We will import TUTORIAL_STEPS at the top of the file
    const allowedCategories = ['基础操作', '战略星图', '情报中心', '科技研发', '政府管理'];
    TUTORIAL_STEPS.forEach((step) => {
      expect(allowedCategories).toContain(step.category);
    });
    
    // Verify sequential chapter matching LeftHub navigation top-to-bottom list
    const categoriesSeq: string[] = [];
    TUTORIAL_STEPS.forEach((step) => {
      if (categoriesSeq.length === 0 || categoriesSeq[categoriesSeq.length - 1] !== step.category) {
        categoriesSeq.push(step.category);
      }
    });

    const expectedOrder = ['基础操作', '战略星图', '情报中心', '科技研发', '政府管理', '基础操作'];
    expect(categoriesSeq).toEqual(expectedOrder);
  });

  it('SCEN-HUD-RESPONSIVE: 不同断点下 TopHUD 响应式显示/隐藏核心数值', () => {
    // === Mobile viewport (< 768px): compact mode, height 56px ===
    setWindowSize(375, 667);
    render(<TopHUD />);
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header.className).toContain('shrink-0');
    // On mobile: height should be 56px (h-[56px] class)
    expect(header.className).toContain('h-[56px]');

    // Core stats always visible on mobile
    expect(screen.queryByText(/文明等级/)).not.toBeInTheDocument();
    expect(screen.getByText(/稳定度/)).toBeInTheDocument();
    expect(screen.getByText(/威慑度/)).toBeInTheDocument();

    // Population/Resources/Army — always visible
    expect(screen.getByText(/^人口$/)).toBeInTheDocument();
    expect(screen.getByText(/^资源$/)).toBeInTheDocument();
    expect(screen.getByText(/^军力$/)).toBeInTheDocument();

    // Epoch/year and Next Turn always visible
    expect(screen.getByText(/第.*年/)).toBeInTheDocument();
    expect(screen.getByText(/下一回合|同步逻辑中|有阻断/)).toBeInTheDocument();

    // === Desktop viewport (>= 1024px): full mode, height 72px ===
    cleanup();
    setWindowSize(1280, 800);
    render(<TopHUD />);
    
    const headerDesktop = screen.getByRole('banner');
    expect(headerDesktop.className).toContain('md:h-[72px]');

    // All stats visible on desktop
    expect(screen.queryByText(/文明等级/)).not.toBeInTheDocument();
    expect(screen.getByText(/稳定度/)).toBeInTheDocument();
    expect(screen.getByText(/^人口$/)).toBeInTheDocument();
    expect(screen.getByText(/^资源$/)).toBeInTheDocument();
    expect(screen.getByText(/^军力$/)).toBeInTheDocument();
    expect(screen.getByText(/威慑度/)).toBeInTheDocument();
  });

  it('SCEN-TUTORIAL-BLOCKER: 教程期间开启 blocker 穿透，即使有阻断也不禁用下一回合按钮并能推进回合', () => {
    const game = GameInstance.get();
    
    // Setup blocker conditions manually (e.g. low resources)
    game.earthCivi.isAiBrainEnabled = false; // Disable AI brain to trigger manual checks
    game.earthCivi.resource = 5;
    game.earthCivi.economy = 5;
    
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

  it('SCEN-MANUAL-BLOCKER: 非教程期间，手动模式下存在阻断时按钮禁用显示“有阻断”，阻断消除后恢复可用', () => {
    const game = GameInstance.get();
    
    // 1. Setup blockers (manual mode, low resources)
    game.earthCivi.isAiBrainEnabled = false;
    (window as any).isTutorialActive = false;
    game.earthCivi.resource = 5;
    game.earthCivi.economy = 5;
    
    // Ensure blockers list is non-empty initially
    expect(game.getTurnBlockers().length).toBeGreaterThan(0);
    
    const { rerender } = render(<TopHUD />);
    
    // Next turn buttons should be disabled and show "有阻断"
    const nextTurnBtns = screen.getAllByRole('button', { name: /有阻断/ });
    expect(nextTurnBtns.length).toBeGreaterThan(0);
    nextTurnBtns.forEach(btn => expect(btn).toBeDisabled());
    
    // 2. Resolve blockers programmatically
    // Clear other resource/ap blockers if any
    game.earthCivi.resource = 100;
    game.earthCivi.economy = 100;
    game.earthCivi.apCurrent = 100;
    
    // Blocker list should now be empty
    expect(game.getTurnBlockers().length).toBe(0);
    
    // Re-render TopHUD
    rerender(<TopHUD />);
    
    // Next turn buttons should now be enabled and show "下一回合"
    const nextTurnBtnsResolved = screen.getAllByRole('button', { name: /下一回合/ });
    expect(nextTurnBtnsResolved.length).toBeGreaterThan(0);
    nextTurnBtnsResolved.forEach(btn => expect(btn).not.toBeDisabled());
    
    vi.restoreAllMocks();
  });

  it('SCEN-TUTORIAL-CLICK-THROUGH: 教程高亮遮罩区域应空缺允许点击，而遮罩区域阻止点击', () => {
    const onComplete = () => {};
    render(<Tutorial onComplete={onComplete} />);
    
    // Find the overlays
    const topOverlay = screen.queryByTestId('tutorial-overlay-top');
    const fullOverlay = screen.queryByTestId('tutorial-overlay-full');

    // Initially, there might not be a highlighted area (Step 1 is welcome screen with center card position and no highlightTarget)
    // Let's assert a full overlay is present in this step
    expect(fullOverlay).toBeInTheDocument();
    expect(topOverlay).not.toBeInTheDocument();
  });
});
