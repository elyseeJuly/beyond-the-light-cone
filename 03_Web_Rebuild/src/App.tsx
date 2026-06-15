import React, { useState, useEffect, useRef } from 'react';
import { TopHUD } from './components/TopHUD';
import { LeftHub } from './components/LeftHub';
import { RightInspector } from './components/RightInspector';
import { StarMap } from './components/StarMap';
import { TimelineViewer } from './components/TimelineViewer';
import { TecTreeView } from './ui/TecTreeView';
import { TecTreeType } from './types/enums';
import { StoryModal } from './components/StoryModal';
import { Tutorial } from './components/Tutorial';
import { GameInstance } from './core/Game';
import { GameEventPayload } from './types/narrative';
import { EndGameScreen } from './components/EndGameScreen';
import { AnnouncementBoard } from './components/AnnouncementBoard';
import { FleetModal } from './components/FleetModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { BattleScreen } from './components/BattleScreen';
import { DiplomacyPanel } from './components/DiplomacyPanel';
import { AtmosphereProvider } from './components/AtmosphereProvider';
import { TechUnlockModal } from './components/TechUnlockModal';
import { MuseumGallery } from './components/MuseumGallery';
import { preloadCoreImages } from './utils/assetUrl';

export const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('game-theme');
    return saved !== null ? saved === 'dark' : false;
  });
  const [showInspector] = useState(true);
  const [activeView, setActiveView] = useState<'starmap' | 'techtree' | 'timeline' | 'diplomacy'>('starmap');
  const [currentEvent, setCurrentEvent] = useState<GameEventPayload | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showMuseum, setShowMuseum] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('game-tutorial-seen'));
  const [showFleetModal, setShowFleetModal] = useState(false);
  const [showBattleScreen, setShowBattleScreen] = useState(false);
  const [unlockedTech, setUnlockedTech] = useState<{ name: string; treeType: string } | null>(null);

  const atmosphereEngineRef = useRef<any>(null);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('game-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    preloadCoreImages();
    const handleThemeChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.isDark === 'boolean') {
        setIsDarkMode(detail.isDark);
      }
    };
    const handleOpenTutorial = () => setShowTutorial(true);
    const handleOpenFleetModal = () => setShowFleetModal(true);
    const handleBattleTriggered = () => setShowBattleScreen(true);
    const handleTechCompleted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.techName) {
        setUnlockedTech({ name: detail.techName, treeType: detail.treeType });
      }
    };
    
    window.addEventListener('theme-change', handleThemeChange);
    window.addEventListener('open-tutorial', handleOpenTutorial);
    window.addEventListener('open-fleet-modal', handleOpenFleetModal);
    window.addEventListener('battle-triggered', handleBattleTriggered);
    window.addEventListener('game:tech:completed', handleTechCompleted);
    
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
      window.removeEventListener('open-tutorial', handleOpenTutorial);
      window.removeEventListener('open-fleet-modal', handleOpenFleetModal);
      window.removeEventListener('battle-triggered', handleBattleTriggered);
      window.removeEventListener('game:tech:completed', handleTechCompleted);
    };
  }, []);

  // Listen for story events and game over
  useEffect(() => {
    const handleEvent = () => {
      const game = GameInstance.get();
      setCurrentEvent(game.currentEvent);
    };

    const handleGameOver = () => {
      setIsGameOver(true);
    };

    const handleObserverMode = () => {
      setIsGameOver(false);
    };

    window.addEventListener('game-event-triggered', handleEvent);
    window.addEventListener('game-turn-complete', handleEvent);
    window.addEventListener('game-loaded', handleEvent);
    window.addEventListener('game-over', handleGameOver);
    window.addEventListener('observer-mode-activated', handleObserverMode);
    
    // Auto-load on mount
    if (GameInstance.loadGame()) {
      console.log("Auto-loaded save data");
    }

    // Initialize atmosphere engine ref for provider
    const game = GameInstance.get();
    atmosphereEngineRef.current = game.atmosphereEngine;

    // Global Error Monitor
    const globalErrorHandler = (event: ErrorEvent) => {
      const game = GameInstance.get();
      game.addHistory(`【系统崩溃】捕获到全局异常: ${event.message}`);
      // 尝试释放处理锁
      game.isProcessing = false;
    };
    window.addEventListener('error', globalErrorHandler);

    return () => {
      window.removeEventListener('game-event-triggered', handleEvent);
      window.removeEventListener('game-turn-complete', handleEvent);
      window.removeEventListener('game-loaded', handleEvent);
      window.removeEventListener('game-over', handleGameOver);
      window.removeEventListener('observer-mode-activated', handleObserverMode);
      window.removeEventListener('error', globalErrorHandler);
    };
  }, []);


  // Handle tech tree rendering
  useEffect(() => {
    if (activeView === 'techtree') {
      const container = document.getElementById('tech-tree-container');
      if (container) {
        const view = new TecTreeView(container);
        view.render(container, TecTreeType.PHYSICS); // Default to Physics for now
      }
    }
  }, [activeView]);

  // Keyboard Shortcuts & Accessibility Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses when typing in input/select fields
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'SELECT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const game = GameInstance.get();

      // Space: Next Turn or Proceed Story
      if (e.code === 'Space') {
        e.preventDefault();
        const proceedBtn = document.querySelector('.story-proceed-btn') as HTMLButtonElement | null;
        const ackBtn = document.querySelector('.story-acknowledge-btn') as HTMLButtonElement | null;
        if (proceedBtn) {
          proceedBtn.click();
        } else if (ackBtn) {
          ackBtn.click();
        } else if (!game.currentEvent && !game.isProcessing && !isGameOver) {
          // Next Turn
          game.runARound();
          window.dispatchEvent(new CustomEvent('game-turn-complete'));
        }
      }

      // Choice hotkeys: 1, 2, 3
      if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
        const index = parseInt(e.code.replace('Digit', '')) - 1;
        const choiceBtns = document.querySelectorAll('.story-choice-btn') as NodeListOf<HTMLButtonElement>;
        if (choiceBtns && choiceBtns[index]) {
          e.preventDefault();
          choiceBtns[index].click();
        }
      }

      // View switcher: M, T, H, D
      if (e.code === 'KeyM') {
        e.preventDefault();
        setActiveView('starmap');
      }
      if (e.code === 'KeyT') {
        e.preventDefault();
        setActiveView('techtree');
      }
      if (e.code === 'KeyH') {
        e.preventDefault();
        setActiveView('timeline');
      }
      if (e.code === 'KeyD') {
        e.preventDefault();
        setActiveView('diplomacy');
      }

      // Fleet center: F
      if (e.code === 'KeyF') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-fleet-modal'));
      }

      // Escape key: Close modals
      if (e.code === 'Escape') {
        e.preventDefault();
        const fleetCloseBtn = document.querySelector('.fleet-modal-close-btn') as HTMLButtonElement | null;
        if (fleetCloseBtn) {
          fleetCloseBtn.click();
        }
        const tutorialCloseBtn = document.querySelector('.tutorial-modal-close-btn') as HTMLButtonElement | null;
        if (tutorialCloseBtn) {
          tutorialCloseBtn.click();
        }
        setUnlockedTech(null);
      }

      // Ctrl + Alt + C: Toggle High Contrast Mode
      if (e.code === 'KeyC' && e.ctrlKey && e.altKey) {
        e.preventDefault();
        const active = !document.body.classList.contains('high-contrast');
        window.dispatchEvent(new CustomEvent('high-contrast-changed', { detail: active }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, isGameOver]);

  return (
    <ErrorBoundary>
      <AtmosphereProvider engineRef={atmosphereEngineRef}>
      <div className="flex flex-col h-screen overflow-hidden bg-white text-gray-900 dark:bg-[#0b0c10] dark:text-[#c5c6c7] transition-colors duration-300 font-sans selection:bg-cyan-900 selection:text-white">
        
        {/* Story Modal - Rendered globally */}
        {currentEvent && (
          <StoryModal
            event={currentEvent}
          onClose={() => {
            GameInstance.get().currentEvent = null;
            GameInstance.get().processNextEvent();
            window.dispatchEvent(new CustomEvent('game-turn-complete'));
          }}
        />
      )}

      {showTutorial && (
        <Tutorial onComplete={() => setShowTutorial(false)} />
      )}

      {unlockedTech && (
        <TechUnlockModal tech={unlockedTech} onClose={() => setUnlockedTech(null)} />
      )}

      {showFleetModal && (
        <FleetModal onClose={() => setShowFleetModal(false)} />
      )}

      {showBattleScreen && (
        <BattleScreen onClose={() => setShowBattleScreen(false)} />
      )}

      {isGameOver && <EndGameScreen />}

      {showMuseum && (
        <MuseumGallery onClose={() => setShowMuseum(false)} />
      )}

      {/* Top HUD */}
      <TopHUD />

      {/* PDC Tactical Bulletin Board */}
      <AnnouncementBoard />

      {/* Main Layout Body */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Hub */}
        <LeftHub activeView={activeView} setActiveView={setActiveView} onOpenMuseum={() => setShowMuseum(true)} />

        {/* Dynamic Center Viewport */}
        <div className="flex-1 relative overflow-hidden bg-black/20">
          {activeView === 'starmap' ? (
            <>
              <StarMap />
              <canvas id="star-canvas-react" className="absolute inset-0 w-full h-full pointer-events-none" />
            </>
          ) : activeView === 'techtree' ? (
            <div className="h-full w-full p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[var(--color-primary)]">科技研发中心</h1>
                  <p className="text-[var(--text-secondary)] mt-2">基础物理已被锁定，重点转向应用技术与太空作战理论。</p>
                </div>
                <div id="tech-tree-container" className="min-h-[500px]">
                  {/* Tech tree content will be rendered here by legacy logic */}
                </div>
              </div>
            </div>
          ) : activeView === 'diplomacy' ? (
            <div className="h-full w-full p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-[var(--color-primary)]">联络与威慑中心</h1>
                  <p className="text-[var(--text-secondary)] mt-2">监控并接触已知的三维异星文明，控制威慑平衡。</p>
                </div>
                <DiplomacyPanel />
              </div>
            </div>
          ) : (
            <TimelineViewer />
          )}


        </div>

        {/* Right Contextual Inspector */}
        {showInspector && <RightInspector />}
      </main>

      {/* Legacy Modal System Bridge */}
      <div id="modal-container" className="modal-overlay hidden">
        <div className="modal-box">
          <div className="modal-header">
            <h2 id="modal-title">System Modal</h2>
            <button className="btn-close" onClick={() => document.getElementById('modal-container')?.classList.add('hidden')}>&times;</button>
          </div>
          <div id="modal-content" className="modal-content">
            {/* Legacy content injected here */}
          </div>
        </div>
      </div>

      {/* Background Gradients for Sci-Fi Feel */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_rgba(0,229,255,0.05)_0%,_transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,_rgba(13,71,161,0.05)_0%,_transparent_50%)]"></div>
      </div>
    </div>
    </AtmosphereProvider>
    </ErrorBoundary>
  );
};

export default App;
