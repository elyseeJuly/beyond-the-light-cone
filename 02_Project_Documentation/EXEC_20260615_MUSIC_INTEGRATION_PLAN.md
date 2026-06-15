# Implementation Plan: Music Project Archiving and BGM Slots Pre-configuration
> **Session Date**: 2026-06-15  
> **Status**: Completed  
> **Category**: Execution Plan (`EXEC_`)

This plan details the steps taken to rename the OST planning document according to the naming standards, rename `stardust.mp3` to `stardust Exodus.mp3`, and pre-configure all dynamic era BGM and ending BGM slots in the code with self-healing fallback mechanisms.

## Proposed Changes

### 1. Document Archiving & Renaming

Rename the OST planning document in `02_Project_Documentation` to follow the standard category-date-name naming formula:

- **From**: `02_Project_Documentation/《光锥之外：纪元往事》OST企划书(V1.3).md`
- **To**: `02_Project_Documentation/SPEC_20260615_EPOCH_CHRONICLES_OST.md`

Update the master inventory list in [SPEC_20260519_DOCUMENTATION_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260519_DOCUMENTATION_STANDARDS.md) to register this new specification file.

### 2. Audio File Renaming

Rename the local audio files from `stardust.mp3` to `stardust Exodus.mp3`:

- `03_Web_Rebuild/public/audio/stardust.mp3` -> `03_Web_Rebuild/public/audio/stardust Exodus.mp3`
- `03_Web_Rebuild/dist/audio/stardust.mp3` -> `03_Web_Rebuild/dist/audio/stardust Exodus.mp3`

### 3. Code Modifications

#### [MODIFY] [endingConfig.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/config/endingConfig.ts)
- Update `FINALE_THEME_PATH` to `/audio/stardust Exodus.mp3`.
- Define `ERA_BGM_PATHS` mapping each of the 6 game eras (`CRISIS`, `DETERRENCE`, `BROADCAST`, `BUNKER`, `GALAXY`, `STARDUST`) to their respective music paths.
- Define `ENDING_BGM_PATHS` mapping each of the 9 endings to their respective music paths.

#### [MODIFY] [TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx)
- Pass the current `epoch` index to the `<BgmPlayer>` component.

#### [MODIFY] [BgmPlayer.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/BgmPlayer.tsx)
- Accept `epoch` prop.
- Dynamically attempt to load the BGM path of the current epoch.
- If the file loading errors, gracefully degrade to `years_base.mp3`. If that also fails, degrade to silent mode.
- Reload and play the correct BGM when the epoch changes.

#### [MODIFY] [EndGameScreen.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/EndGameScreen.tsx)
- Dynamically attempt to load the ending-specific BGM path.
- If the file loading errors, gracefully degrade to `stardust Exodus.mp3` (`FINALE_THEME_PATH`). If that fails, degrade to silent mode.

---

## Verification Plan

### Automated Tests
- Run unit tests to verify that components still build and run successfully:
  `npm run test`
- Verify compilation with:
  `npm run build` inside `03_Web_Rebuild/`

### Manual Verification
- Check console logs to ensure audio system falls back gracefully if specific files are missing.
- Verify that renaming is successful and links work correctly.
