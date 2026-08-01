# Critical Issues Implementation Plan
> **Date**: 2026-06-12  
> **Author**: Antigravity AI  
> **Target Directory**: `03_Web_Rebuild/`

This plan details the changes required to resolve the six critical issues identified in the game simulation.

## Proposed Changes

### Component: Asset Generation & Loading

#### [NEW] [sophon_portrait (Asset)](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/public/images/unified_sophon_1778921509458.png)
- Regenerate the Sophon portrait in Gongbi Cyberpunk (工笔赛博) style to replace `/public/images/unified_sophon_1778921509458.png`.

#### [MODIFY] [endingConfig.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/config/endingConfig.ts)
- Import `getImageUrl` from `../utils/assetUrl`.
- Wrap all 9 `sceneImage` paths using `getImageUrl()` to ensure asset resolution works correctly under production/Tauri.

#### [MODIFY] [BgmPlayer.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/BgmPlayer.tsx)
- Import `getAssetUrl` from `../utils/assetUrl`.
- Wrap `GAMEPLAY_BGM_PATH` with `getAssetUrl` when initializing the Audio constructor.

#### [MODIFY] [CreditsRoll.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/ending/CreditsRoll.tsx)
- Import `getAssetUrl` from `../../utils/assetUrl`.
- Wrap `FINALE_THEME_PATH` with `getAssetUrl` when initializing the Audio constructor.

---

### Component: UI Layout & Collapsible Menu

#### [MODIFY] [LeftHub.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/LeftHub.tsx)
- Add state `const [isCollapsed, setIsCollapsed] = useState(true)` for the event diversity stats block.
- Render a toggle arrow beside the title "事件多样性观测" to toggle collapse/expand state, saving space and preventing layout blocking.

---

### Component: Space Travel & Star Map

#### [MODIFY] [FleetModal.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/FleetModal.tsx)
- Populate `knownStars` with all Solar System planets (indices 0 to 10) by default.
- Dynamically add nearby interstellar systems (indices 11 to 17) if the player has researched `"50光年远镜"`, `"10%光速飞船"`, or `"太阳波放大器50光年"`.
- Calculate fleet travel ETA dynamically based on propulsion technology (Chemical propulsion, 10% light speed, 50% light speed, 99% light speed, light speed).

---

### Component: Core Engine & Diplomacy Refactoring

#### [MODIFY] [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts)
- Modify `mapAvatar()`: Replace relative/absolute image prefix `replace(/^\/?images\//, "")` to correctly identify events CGs and load overlays.

#### [MODIFY] [AlienCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/AlienCivilization.ts)
- Add `public unlocked: boolean = false` field to `AlienCivilization` class.
- In `AlienCiviManager.init()`, set `"三体"` to `unlocked = true` by default. Set others to `false`.

#### [MODIFY] [Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts)
- Implement `updateDiplomacyUnlocks()` to unlock Singer, Magic Ring, Fringe World, and Zeroers based on technology milestones and epoch changes.
- Call `updateDiplomacyUnlocks()` at the end of each turn update in `runARound()`.
- Scan triggered events for keywords to dynamically trigger reactive unlocks.
- Refactor Trisolaris (`"三体"`) diplomacy options to directly integrate with deterrence value, Wallfacers, and Swordholders.

#### [MODIFY] [DiplomacyPanel.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/DiplomacyPanel.tsx)
- Pass `unlocked` status to list items, and render locked civilizations as disabled placeholder channels (e.g. `【未知信道: 探测01】未建立通信信道`).

#### [MODIFY] [WallfacerPanel.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/WallfacerPanel.ts)
- Replace page reload with proper game over triggering when clicking "⚠️ 广播宇宙坐标 (终极威慑)", resolving into HIDDEN victory if escape conditions are met, or EXTINCTION defeat otherwise.

---

## Verification Plan

### Automated Tests
Add verification suite inside `src/test/core/IssueResolutions.test.ts`.

### Manual Verification
1. Open Star Map and verify Mercury/Venus/Moon/Pluto dispatch.
2. Complete tech and confirm Proxima Centauri unlock.
3. Verify locked placeholders in Diplomacy Panel.
4. Desperate broadcast triggers proper Cinematic End Game screen.
