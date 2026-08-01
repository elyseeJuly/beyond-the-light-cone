# Walkthrough: 'Starsea Phonograph' Music Gallery & Custom BGM Selection
> **Date**: 2026-06-16  
> **Status**: Completed  
> **Category**: Active Execution Walkthrough (`EXEC_`)

This walkthrough documents the successful implementation of the **「星海留声机」 (Starsea Phonograph)** music appreciation section in the Museum Gallery, and the custom gameplay BGM selection feature.

---

## 🛠️ Changes Implemented

### 1. Music Appreciation Section (Starsea Phonograph)
- **File**: [MuseumGallery.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/MuseumGallery.tsx)
- **Details**:
  - Overhauled the gallery component to support a tabbed layout: **「星历纪实」 (Chronicles & Collection)** and **「星海留声机」 (Starsea Phonograph)**.
  - Implemented a complete soundtrack catalog array containing 19 registered tracks:
    - **7 Era BGMs** (unlocked by default, selectable as gameplay background music).
    - **2 Vocal Themes** (unlocked via specific endings/achievements, can only be auditioned/previewed).
    - **10 Ending Specific Tracks** (unlocked when the corresponding victory or defeat ending has been unlocked).
  - Built a local preview player utilizing a React ref `previewAudioRef` to prevent memory leaks and handle proper playback cleanup when the gallery is closed.
  - Designed an immersive holographic player interface complete with:
    - Concentric-lined vinyl disc spinning animation (which halts when audio is paused).
    - An interactive tone arm/stylus that sweeps onto the vinyl surface during active play.
    - Dynamic bouncing sound wave bars showing active auditioning.
    - Full playback progress sliders, seek handlers, and interactive volume sliders.
  - Allowed players to configure unlocked gameplay tracks as their custom background music, which saves the choice under `game-custom-bgm` in `localStorage`.
  - Added a "Restore Auto-switching" option to clear custom selections and return to dynamic era BGM logic.
  - **Overlap Prevention on BGM selection change**: Added a listener update so that if a player changes/clears custom BGM settings while previewing, the main gameplay BGM is instantly re-paused to prevent dual audio streams.

### 2. Gameplay BGM Real-time Integration & Overlap Fixing
- **File**: [BgmPlayer.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/BgmPlayer.tsx)
- **Details**:
  - Synced local state `customBgmPath` with `localStorage.getItem('game-custom-bgm')`.
  - Updated BGM selection logic: loads the user's custom BGM choice if available, falling back to the current game era's BGM.
  - Added event listeners for:
    - `'bgm-settings-changed'`: Instantly updates BGM states (mute, volume, custom path selection) without page reloads.
    - `'pause-main-bgm'`: Pauses the background music while the player auditions tracks in the gallery.
  - **Overlap Bug Fix**: Resolved a race condition where the `click` event used to play a preview track bubbled up to `window` and triggered the autoplay interaction resume handler, immediately restarting the gameplay BGM. Corrected the autoplay handler to only attach click listeners when BGM is actually supposed to be playing (`isPlaying` is true) but blocked, preventing paused BGMs from auto-resuming.
  - **Explicit Pause Call**: Direct synchronous call to `.pause()` on the main BGM player's HTMLAudioElement inside the event handler, bypassing React's render cycles.
  - Configured custom BGM song title badges (e.g. `《危机之潮 (自定义)》`) to clearly show when custom BGM overrides the auto-switching logic.

---

## 🧪 Verification & Test Results

### 1. Build and Compilation
- **Command**: `npm run build`
- **Result**: Successfully compiled and generated production chunks.
```bash
vite v8.0.12 building client environment for production...
dist/index.html                   0.77 kB │ gzip:   0.46 kB
dist/assets/index-q9fBOpWw.css  121.46 kB │ gzip:  17.68 kB
dist/assets/index-DlxdlY9i.js   943.78 kB │ gzip: 288.53 kB
✓ built in 1.52s
```

### 2. Unit Tests
- **Command**: `npm run test`
- **Result**: **504 tests successfully passed (100% success rate)** across all test suites, including audio configuration checks.
```bash
 Test Files  31 passed (31)
      Tests  504 passed (504)
   Start at  17:37:10
   Duration  12.56s
```
