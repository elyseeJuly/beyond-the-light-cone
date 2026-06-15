# Walkthrough: Music Project Archiving & BGM Integration
> **Session Date**: 2026-06-15  
> **Status**: Completed  
> **Category**: Execution Walkthrough (`EXEC_`)

We have successfully archived the music planning documents according to standard specification rules, renamed `stardust.mp3` to `stardust Exodus.mp3`, and pre-configured all BGM slots for different eras and endings in the codebase.

## 🎵 Music File Configuration Directory

All music files must be placed inside the public audio assets folder:
👉 `03_Web_Rebuild/public/audio/`

## 🗃️ Complete Music Filename Inventory

To integrate new music into the game in the future, simply place your audio files in `03_Web_Rebuild/public/audio/` with the exact filenames listed below. The game will automatically detect, play, and fall back gracefully if they are missing.

### 1. Gameplay Dynamic Era BGMs

| Game Era | Filename Required | Description | Default Fallback (If Missing) |
| :--- | :--- | :--- | :--- |
| **Default Main Theme** | `years_base.mp3` | Main gameplay BGM | Silent Mode |
| **危机纪元 (Crisis Era)** | `era_crisis.mp3` | Dynamic BGM for Crisis Era | `years_base.mp3` |
| **威慑纪元 (Deterrence Era)** | `era_deterrence.mp3` | Dynamic BGM variation for Deterrence Era | `years_base.mp3` |
| **广播纪元 (Broadcast Era)** | `era_broadcast.mp3` | Dynamic BGM for Broadcast Era | `years_base.mp3` |
| **掩体纪元 (Bunker Era)** | `era_bunker.mp3` | Dynamic BGM for Bunker Era | `years_base.mp3` |
| **银河纪元 (Galaxy Era)** | `era_galaxy.mp3` | Dynamic BGM for Galaxy Era | `years_base.mp3` |
| **星屑纪元 (Stardust Era)** | `era_stardust.mp3` | Dynamic BGM for Stardust Era | `years_base.mp3` |

### 2. Ending & Credits Theme Songs

| Ending / Stage | Filename Required | Description | Fallback (If Missing) |
| :--- | :--- | :--- | :--- |
| **Default Ending Song** | `stardust Exodus.mp3` | Main True Ending & Epilogue song | Silent Mode |
| **征服胜利 (Conquest)** | `ending_conquest.mp3` | Victory theme | `stardust Exodus.mp3` |
| **威慑胜利 (Deterrence)** | `ending_deterrence.mp3` | Peace theme | `stardust Exodus.mp3` |
| **黑域胜利 (Dark Domain)** | `ending_dark_domain.mp3` | *Death of the Light Cone* (光锥之死) | `stardust Exodus.mp3` |
| **流浪胜利 (Wandering)** | `ending_wandering.mp3` | Journey theme | `stardust Exodus.mp3` |
| **数字永生 (Digital)** | `ending_digital.mp3` | *Ghost in the Quantum* (量子幽灵) | `stardust Exodus.mp3` |
| **隐藏结局 (Hidden)** | `ending_hidden.mp3` | *The Last Archive* (最后的档案) | `stardust Exodus.mp3` |
| **全图鉴白金 (Platinum)** | `credits_platinum.mp3` | *A Past Within the Light Cone* (制作人员名单) | `stardust Exodus.mp3` |
| **逃亡瓦解 (Treachery)** | `ending_defeat_treachery.mp3` | Defeat theme | `stardust Exodus.mp3` |
| **文明灭绝 (Extinction)** | `ending_defeat_extinction.mp3` | Defeat theme | `stardust Exodus.mp3` |
| **太阳氦闪 (Helium Flash)** | `ending_defeat_helium_flash.mp3` | Defeat theme | `stardust Exodus.mp3` |
| **降维打击 (Dimension)** | `ending_defeat_dimension_strike.mp3` | Defeat theme | `stardust Exodus.mp3` |

---

## 📝 Document Archiving Report

According to the **Global Development & Archive Standard (V1.0)**:
1. `《光锥之外：纪元往事》OST企划书(V1.3).md` has been successfully renamed to:
   [SPEC_20260615_EPOCH_CHRONICLES_OST.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260615_EPOCH_CHRONICLES_OST.md)
2. Registered the new specification document under Section 4.1 in:
   [SPEC_20260519_DOCUMENTATION_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260519_DOCUMENTATION_STANDARDS.md)

---

## 💻 Code Changes Summary

- **[endingConfig.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/config/endingConfig.ts)**: Configured path constants for BGM files and mapped them by era enum keys and ending keys.
- **[TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx)**: Exposed the game epoch index state to feed the background music manager.
- **[BgmPlayer.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/BgmPlayer.tsx)**: Embedded dynamic era BGM loading logic with graceful fallback to `years_base.mp3`.
- **[EndGameScreen.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/EndGameScreen.tsx)**: Custom ending themes support with fallback to `stardust Exodus.mp3`.
- **[CreditsRoll.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/ending/CreditsRoll.tsx)**: Updated user-facing warnings and titles.

## 🧪 Verification & Build Status

- **Typecheck & Production Build**: Run successfully with `npm run build` (0 typescript or bundler errors).
- **Unit Tests**: Run successfully with `npm run test` (All 502 tests passed!).
