# Execution Plan: 'Starsea Phonograph' Music Gallery & Custom BGM Selection
> **Date**: 2026-06-16  
> **Status**: Completed  
> **Category**: Active Execution Plan (`EXEC_`)

This plan details the design and implementation steps to add a music appreciation section (named **「星海留声机」/ Starsea Phonograph**) inside the Museum Gallery (岁月史书), allowing players to listen to unlocked game tracks and set their preferred gameplay tracks as custom background music.

## Proposed Changes

### 1. BgmPlayer Refactoring
- Keep track of `customBgmPath` state initialized from `localStorage.getItem('game-custom-bgm')`.
- Modify the BGM selection logic inside the audio loading `useEffect` to use `customBgmPath` if present, falling back to the era BGM (`ERA_BGM_PATHS[epochKey]`).
- Add `customBgmPath` to the `useEffect` dependency array so the BGM reloads dynamically when a new custom track is set.
- Add event listeners for:
  - `'bgm-settings-changed'`: Syncs `customBgmPath` state, volume, and mute states.
  - `'pause-main-bgm'`: Pauses the active gameplay audio stream and sets `isPlaying` to `false`.
- Update the display text at the bottom to show the custom track's title (e.g., `《危机之潮 (自定义)》`) when a custom BGM is active.

### 2. Museum Gallery Tabbed Overhaul
- Refactor the gallery into a tabbed layout:
  - **「星历纪实」 (Chronicles & Collection)**: Current layout containing the Ending Grid and the History list.
  - **「星海留声机」 (Starsea Phonograph)**: The new music appreciation and custom BGM panel.
- Define a comprehensive soundtrack catalog array containing all 19 tracks (7 Era BGMs, 6 Victory BGMs, 4 Defeat BGMs, 2 Special Vocal Themes) with names, paths, descriptions, and unlock check helpers.
- Implement a local preview player using a React ref `previewAudioRef`.
- Play/pause preview tracks on click, dispatching `'pause-main-bgm'` to pause the main game audio before starting the preview.
- Render a customized music player controller dashboard (showing active spectrum/spinning disc visualization, track info, progress bar, seek controls, and play controls).
- Render "Set as BGM" and "Clear Custom" buttons for gameplay tracks:
  - Sets/removes `'game-custom-bgm'` in `localStorage`.
  - Dispatches `'bgm-settings-changed'` to update the main `BgmPlayer` immediately.
- Prevent audio leakage: guarantee that the preview player pauses and cleans up when the gallery is closed.

---

## Verification Plan

### Automated Tests
- Run tests to ensure no regression in existing game components:
  `npm run test`
- Build the project to verify TypeScript compilation and bundle generation:
  `npm run build`

### Manual Verification
- **Unlock Checking**: Verify ending tracks are displayed as locked/unlocked correctly depending on localStorage history.
- **Audio Overlap**: Verify playing a track in the Starsea Phonograph automatically pauses the main game BGM.
- **Custom BGM Setting**: Set a custom BGM (e.g., "危机之潮") and verify that the main BGM updates to that track and its title is displayed.
- **Auto-Switching Restoration**: Click "恢复自动切换" (Restore Auto-switching) and verify BGM returns to the current era BGM.
- **Ending Theme Limitation**: Verify that ending themes do not display the "Set as BGM" button.
- **Component Cleanup**: Open the gallery, play a preview song, close the gallery, and verify the preview song stops playing immediately.
