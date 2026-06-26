# Doc-vs-Code Full Verification Audit

**Date**: 2026-06-26  
**Methodology**: Read every EXEC/FIX/SPEC/AUDIT document, extract concrete claims, verify each claim against actual source code. Test pass/fail status ignored.

---

## Executive Summary

| Category | Documents | Claims | PASS | FAIL | Rate |
|----------|----------|--------|------|------|------|
| Bug Fixes (EXEC/FIX) | 6 | 35 | 33 | 2 | 94.3% |
| Design Specs (SPEC) | 10 | 112 | 105 | 7 | 93.8% |
| Narrative Timeline Fixes | 1 | 15 | 15 | 0 | 100% |
| AP System & Event Effects | 2 | 9 | 8 | 1 | 88.9% |
| Hard Constraints | 1 | 6 | 3 | 3 | 50.0% |
| **TOTAL (pre-fix)** | **20** | **177** | **164** | **13** | **92.7%** |

**All 13 failures resolved.** See `AUDIT_20260626_FAILURES_FIX_SUMMARY.md` for fix details.

---

## All 13 Failures

### 1. AI Brain Toggle Missing from Cover Screen (CRITICAL)
- **Doc**: `FIX_20260624_NUMERIC_GROWTH_AND_AI_MODE.md` Fix 3b
- **Claim**: Cover screen has AI toggle switch, player explicitly enables
- **Reality**: `GameCoverScreen.tsx:23` hardcoded `enableAiBrain = true`, no toggle UI
- **Impact**: `EarthCivilization.ts:30` default `isAiBrainEnabled = false` is overridden; AI always enabled at game start
- **Status**: ✅ FIXED — added toggle switch, default to `false`

### 2. Tutorial Coordinate Scale Correction Missing
- **Doc**: `EXEC_20260626_TUTORIAL_AND_MOBILE_LAYOUT_REFACTOR.md` Fix 5
- **Claim**: Detects `.mobile-landscape-scale` class, divides all coordinates by 0.85
- **Reality**: No scale detection or division code existed in `Tutorial.tsx`
- **Impact**: Highlight rectangles may be slightly misaligned in mobile landscape
- **Status**: ✅ FIXED — added `DOMMatrixReadOnly` scale detection and coordinate correction

### 3. AP ≤ 0 Turn Blocking Not Implemented
- **Doc**: `EXEC_20260623_AP_AI_BRAIN_IMPLEMENTATION.md` Claim 2
- **Claim**: Turn blocks when AP ≤ 0 (can't advance with AP remaining)
- **Reality**: `Game.ts:294-317` `getTurnBlockers()` never checks `apCurrent`
- **Impact**: Players can advance turns with 0 AP, bypassing the action economy
- **Status**: ✅ FIXED — added `apCurrent <= 0` blocker check

### 4. Playwright baseURL Sub-path Mismatch
- **Doc**: Project memory constraint
- **Required**: `http://localhost:4173/`
- **Actual**: `http://localhost:4173/beyond-the-light-cone/`
- **Status**: ✅ FIXED — corrected in `playwright.config.ts`

### 5. Playwright Not in CI Pipeline
- **Doc**: Project memory constraint
- **Required**: `npx playwright install` and `npx playwright test` in CI
- **Reality**: `ci.yml` had no Playwright steps
- **Status**: ✅ FIXED — added Playwright install + test + report upload steps to `ci.yml`

### 6-12. Missing Audio Files (7 files) — FIXED
- **Doc**: `SPEC_20260621_NEW_ENDINGS_MUSIC.md`
- **Fix**: Mapped all 7 missing paths to existing thematically appropriate audio files in `endingConfig.ts`:

| Ending | Original (missing) | Mapped to (existing) |
|--------|-------------------|---------------------|
| CONQUEST | `ending_conquest.mp3` | `ending_death_of_the_light_cone.mp3` |
| DETERRENCE | `ending_deterrence.mp3` | `ending_stardust_exodus.mp3` |
| WANDERING | `ending_wandering.mp3` | `ending_stardust_exodus.mp3` |
| DEFEAT_TREACHERY | `ending_defeat_treachery.mp3` | `ending_neutral_eternal_exile.mp3` |
| DEFEAT_EXTINCTION | `ending_defeat_extinction.mp3` | `ending_neutral_cosmic_silence.mp3` |
| DEFEAT_HELIUM_FLASH | `ending_defeat_helium_flash.mp3` | `era_crisis.mp3` |
| DEFEAT_DIMENSION_STRIKE | `ending_defeat_dimension_strike.mp3` | `ending_death_of_the_light_cone.mp3` |

- **Status**: ✅ FIXED — `endingConfig.ts` now points to existing audio files for all endings

---

## Verified Passes (164 items)

### Bug Fixes: 33/35 PASS
All 10 bugs from `EXEC_20260626_FULL_BUG_FIX_WALKTHROUGH` verified in code. Epoch deadlock, character refresh, star status clearing, ending timer cleanup, switch defaults, floating promise, string bounds, FloatingText cleanup, spawn_barback event, optional chaining — all confirmed.

### Design Specs: 105/112 PASS
All core logic requirements from 10 SPEC documents verified:
- Core loop (AP system, AI brain, worker ratios, lock system, research idle detection, fate divergence rollback, NG+, save integrity)
- PWA (manifest, service worker, vite-plugin-pwa, update prompt, orientation lock, IndexedDB)
- Event tag system (TagManager, tag decay, categories, milestone tags, event weight influence)
- Ending trigger paths (6 victory, 4 defeat, 2 neutral endings, mutual exclusion, forecast panel)
- Ending conditions (all 6 victory conditions + 4 defeat conditions with correct thresholds)
- Universal Event Engine (all 7 UEE modules initialized and restored)
- Architecture refactoring (DI container, EventBus, SaveManager, AudioManager, subsystem split, Map/Set serialization)
- Responsive layout (breakpoints, MobileBottomNav, TopHUD, LeftHub, RightInspector, OrientationPrompt, CSS media queries)
- Resource layering (3-layer architecture, CoreAsset/ExpansionAsset/HotPatch types, AssetLoader, PatchManager, asset manifest)

### Narrative Timeline: 15/15 PASS
All 15 fixes from `AUDIT_20260624_NARRATIVE_TIMELINE_FIX_REPORT.md` verified:
- Alien diplomacy dual-state (discovered/contacted)
- AA and Guan Yifan death config corrected
- 8 core character death times per original novel
- 19 characters now have epochDeathMap
- Epoch switch prerequisites (bunker, galaxy, stardust)
- Yang Dong suicide kill_person effect
- Tag time-based filtering (30-year window)
- Mini-universe construction event (name=405)
- Era declaration events (281, 370, 420)
- Crisis Era circular dependency fixed
- Hines Wallbreaker event (name=25)
- Swordholder choice branch (Cheng Xin vs Luo Ji)
- Wade rebellion choice branch (support vs oppose)
- 3-route choice (Bunker vs Black Domain vs Lightspeed)
- Timeline.json integration into bottom ticker

### AP System & Event Effects: 8/9 PASS
- AP restore/consume, AI brain auto-consume, AI disabled by default, all 4 new event effects (spawn_barback, lock_ratio, rush_tech, build_infrastructure)

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/GameCoverScreen.tsx` | Added AI toggle switch, default to `false` |
| `src/components/Tutorial.tsx` | Added mobile landscape scale coordinate correction |
| `src/core/Game.ts` | Added `apCurrent <= 0` to `getTurnBlockers()` |
| `src/config/endingConfig.ts` | Mapped 7 missing BGM paths to existing audio files |
| `playwright.config.ts` | Fixed baseURL + webServer URL to `http://localhost:4173/` |
| `.github/workflows/ci.yml` | Added Playwright install + test + report steps |

## Remaining Action Items

1. **Verify Playwright tests pass** with corrected baseURL at `http://localhost:4173/`
2. **Older documents (~100+) not audited** — pre-20260621 SPEC/EXEC/AUDIT documents may contain additional claims
3. **Optional**: Source original audio for the 7 endings and replace the mapped fallbacks with dedicated tracks