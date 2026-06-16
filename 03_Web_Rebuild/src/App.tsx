import React, { useState, useEffect, useRef } from 'react';
import { TopHUD } from './components/TopHUD';
import { LeftHub, ActiveViewType } from './components/LeftHub';
import { RightInspector } from './components/RightInspector';
import { StarMap } from './components/StarMap';
import { IntelligenceCenter } from './components/IntelligenceCenter';
import { GovManagement } from './components/GovManagement';
import { CivilizationArchive } from './components/CivilizationArchive';
import { BottomEventBar } from './components/BottomEventBar';
import { TecTreeView } from './ui/TecTreeView';
import { TecTreeType } from './types/enums';
import { StoryModal } from './components/StoryModal';
import { Tutorial } from './components/Tutorial';
import { GameInstance } from './core/Game';
import { GameEventPayload } from './types/narrative';
import { EndGameScreen } from './components/EndGameScreen';
import { FleetModal } from './components/FleetModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { BattleScreen } from './components/BattleScreen';
import { AtmosphereProvider } from './components/AtmosphereProvider';
import { TechUnlockModal } from './components/TechUnlockModal';
import { MuseumGallery } from './components/MuseumGallery';
import { preloadCoreImages } from './utils/assetUrl';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveViewType>('starmap');
  const [currentEvent, setCurrentEvent] = useState<GameEventPayload | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showMuseum, setShowMuseum] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('game-tutorial-seen'));
  const [showFleetModal, setShowFleetModal] = useState(false);
  const [showBattleScreen, setShowBattleScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [unlockedTech, setUnlockedTech] = useState<{ name: string; treeType: string } | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  const atmosphereEngineRef = useRef<any>(null);

  useEffect(() => {
    preloadCoreImages();
    const handleOpenTutorial = () => setShowTutorial(true);
    const handleOpenFleetModal = () => setShowFleetModal(true);
    const handleBattleTriggered = () => setShowBattleScreen(true);
    const handleOpenSettings = () => setShowSettings(true);
    const handleOpenMuseum = () => setShowMuseum(true);
    const handleTechCompleted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.techName) {
        setUnlockedTech({ name: detail.techName, treeType: detail.treeType });
      }
    };
    const handleActiveViewChanged = (e: Event) => {
      const view = (e as CustomEvent).detail as ActiveViewType;
      if (view) {
        setActiveView(view);
      }
    };
    
    window.addEventListener('open-tutorial', handleOpenTutorial);
    window.addEventListener('open-fleet-modal', handleOpenFleetModal);
    window.addEventListener('battle-triggered', handleBattleTriggered);
    window.addEventListener('open-settings', handleOpenSettings);
    window.addEventListener('open-museum', handleOpenMuseum);
    window.addEventListener('game:tech:completed', handleTechCompleted);
    window.addEventListener('change-active-view', handleActiveViewChanged);
    
    return () => {
      window.removeEventListener('open-tutorial', handleOpenTutorial);
      window.removeEventListener('open-fleet-modal', handleOpenFleetModal);
      window.removeEventListener('battle-triggered', handleBattleTriggered);
      window.removeEventListener('open-settings', handleOpenSettings);
      window.removeEventListener('open-museum', handleOpenMuseum);
      window.removeEventListener('game:tech:completed', handleTechCompleted);
      window.removeEventListener('change-active-view', handleActiveViewChanged);
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

    const game = GameInstance.get();
    atmosphereEngineRef.current = game.atmosphereEngine;

    // Global Error Monitor
    const globalErrorHandler = (event: ErrorEvent) => {
      const game = GameInstance.get();
      game.addHistory(`【系统崩溃】捕获到全局异常: ${event.message}`);
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

  // Handle dynamic era theme classes
  useEffect(() => {
    const updateEpoch = () => {
      try {
        const game = GameInstance.get();
        setCurrentEpoch(game.epoch);
      } catch {}
    };

    updateEpoch();
    window.addEventListener('game-loaded', updateEpoch);
    window.addEventListener('game-turn-complete', updateEpoch);

    return () => {
      window.removeEventListener('game-loaded', updateEpoch);
      window.removeEventListener('game-turn-complete', updateEpoch);
    };
  }, []);

  useEffect(() => {
    const eraThemes = ['theme-crisis', 'theme-expansion', 'theme-golden', 'theme-decline', 'theme-end'];
    eraThemes.forEach(theme => document.body.classList.remove(theme));

    let activeTheme = 'theme-crisis';
    if (currentEpoch === 1) activeTheme = 'theme-expansion';
    else if (currentEpoch === 2) activeTheme = 'theme-golden';
    else if (currentEpoch === 3) activeTheme = 'theme-decline';
    else if (currentEpoch >= 4) activeTheme = 'theme-end';

    document.body.classList.add(activeTheme);
  }, [currentEpoch]);

  // Handle tech tree rendering
  useEffect(() => {
    if (activeView === 'techtree') {
      const container = document.getElementById('tech-tree-container');
      if (container) {
        const view = new TecTreeView(container);
        view.render(container, TecTreeType.PHYSICS); // Default to Physics
      }
    }
  }, [activeView]);

  // Keyboard Shortcuts & Accessibility Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

      // View switcher shortcuts
      if (e.code === 'KeyM') {
        e.preventDefault();
        setActiveView('starmap');
      }
      if (e.code === 'KeyI') {
        e.preventDefault();
        setActiveView('intelligence');
      }
      if (e.code === 'KeyT') {
        e.preventDefault();
        setActiveView('techtree');
      }
      if (e.code === 'KeyG') {
        e.preventDefault();
        setActiveView('government');
      }
      if (e.code === 'KeyA') {
        e.preventDefault();
        setActiveView('archive');
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
        <div className="flex flex-col h-screen overflow-hidden bg-[#070B14] text-[#DDEEFF] font-sans selection:bg-[var(--color-primary)] selection:text-black">
          
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

          {showSettings && (
            <SettingsModal onClose={() => setShowSettings(false)} />
          )}

          {/* Top HUD (72px height) */}
          <TopHUD />

          {/* Main Layout Body */}
          <main className="flex-1 flex overflow-hidden">
            {/* Left Hub (240px width) */}
            <LeftHub activeView={activeView} setActiveView={setActiveView} />

            {/* Dynamic Center Viewport */}
            <div className="flex-1 relative overflow-hidden bg-black/25">
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
              ) : activeView === 'intelligence' ? (
                <IntelligenceCenter />
              ) : activeView === 'government' ? (
                <GovManagement />
              ) : (
                <CivilizationArchive />
              )}
            </div>

            {/* Right Contextual Inspector (320px width) */}
            <RightInspector />
          </main>

          {/* Bottom Event Bar (40px height) */}
          <BottomEventBar />

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

          {/* Global Scanline Overlay (2s cycle from top to bottom, 3% opacity) */}
          <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <div className="absolute inset-x-0 h-[3px] bg-white/5 opacity-[0.03] animate-scan-line-global" />
          </div>

          <style>{`
            @keyframes scanLineGlobal {
              0% { top: -5%; }
              100% { top: 105%; }
            }
            .animate-scan-line-global {
              animation: scanLineGlobal 3s linear infinite;
            }
          `}</style>
        </div>
      </AtmosphereProvider>
    </ErrorBoundary>
  );
};

export default App;
