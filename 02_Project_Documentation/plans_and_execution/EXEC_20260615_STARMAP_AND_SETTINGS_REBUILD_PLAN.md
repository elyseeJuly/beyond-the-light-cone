# LegendOfUni UI/UX Rebuilding: Star Map & Settings Integration Plan
> **Execution Date**: 2026-06-15  
> **Status**: APPROVED  
> **Archived File**: `02_Project_Documentation/EXEC_20260615_STARMAP_AND_SETTINGS_REBUILD_PLAN.md`

This plan defines the UI/UX overhauls for the Star Map system, dynamic colony symbols, territory boundaries, Settings Modal consolidation, and visual unification of modals to align with the "Galactic Civilization Archive" style guide.

---

## 1. Core Objectives

1. **Complete Star Map Viewports**:
   - Introduce active StarArea selector tabs: `[太阳系] | [50光年] | [1万光年] | [银河系]`.
   - Implement area filtering so only stars in the active region are rendered.
   - Design custom scattered coordinates for extra-solar modes and a double-arm spiral galaxy layout for the Galaxy view.
   - Render coordinate radar crosshair lines and tick labels.
   - Draw faint tactical connections (constellations) in 50LY & 10kLY modes.

2. **Dynamic Colony Symbols & Territorial Boundaries**:
   - Compute colony symbols dynamically: minor outpost (`○`), industrial colony (`△`), metropolis (`◇`) based on population and structures.
   - Draw pulsing dashed territory rings and ownership tags next to colonized stars with faction-specific colors (Player: Cyan; Trisolaris: Red; others: Green/Gold).

3. **Settings Consolidation**:
   - Clean up duplicate shortcuts from `LeftHub.tsx` bottom toolbar.
   - Trigger the React `SettingsModal.tsx` on gear button click, bypassing the legacy HTML `SystemMenuPanel.ts`.

4. **Unified Modal UX**:
   - Apply the dark holographic archive styling (deep space `#070B14`, divider `#243245`, primary `#00B8FF`, glass-archive panels, and rectangular corners) to `FleetModal.tsx`, `BattleScreen.tsx`, and `Tutorial.tsx`.

---

## 2. File Modifiers

- **[LeftHub.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/LeftHub.tsx)**: Removed duplicate buttons and configured gear settings dispatcher.
- **[App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx)**: Mounted `SettingsModal` controlled by global event `open-settings`.
- **[StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx)**: Added star area selector tabs and wired state transitions.
- **[StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts)**: Configured spiral coordinate layouts, constellation lines, coordinate grid overlay, pulsing territory rings, and dynamic colony symbols.
- **[FleetModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/FleetModal.tsx)**: Styled layout with glass-archive background, thin `#243245` borders, and Outlined icons.
- **[BattleScreen.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/BattleScreen.tsx)**: Refactored cyan gradients and retro grid styles into deep-space archive styling.
- **[Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx)**: Unified gradient card colors into the glass-archive design system.
