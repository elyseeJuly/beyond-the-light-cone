# Failures Fixed Summary

**Total failures: 13**  
**All 13 resolved via code changes**

---

## 6 Fixes Applied to 6 Files

### 1. AI Brain Toggle on Cover Screen

**Problem**: `GameCoverScreen.tsx` hardcoded `enableAiBrain = true` overriding the `false` default in `EarthCivilization.ts`. No toggle UI existed, contradicting project constraint that "AI brain must be disabled by default; players must explicitly enable it via the game cover screen".

**Fix Applied**:
- Changed `useState` default from `true` → `false` at line 23
- Added interactive toggle switch UI below the "自由探索" button in the option menu
- Toggle correctly toggles `enableAiBrain` state and passes to `onStartNewGame`

**Files**: [`src/components/GameCoverScreen.tsx`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/GameCoverScreen.tsx) lines 23, 169-187

---

### 2. Tutorial Mobile-Landscape Coordinate Correction

**Problem**: `Tutorial.tsx` did not implement the claimed scale factor detection and coordinate division for `.mobile-landscape-scale` mobile landscape mode. The claim was explicit in `EXEC_20260626_TUTORIAL_AND_MOBILE_LAYOUT_REFACTOR.md` but no code existed.

**Fix Applied**:
- Added `getScaleFactor()` helper that detects the `.mobile-landscape-scale` element and extracts the actual scale via `DOMMatrixReadOnly` from computed style
- Applies division to `top`, `left`, `width`, and `height` before setting the highlight rectangle
- Graceful fallback: if scale detection fails (browser API not supported, element missing), returns scale factor 1 (no correction)

**Files**: [`src/components/Tutorial.tsx`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx) lines 223-237, 280-300

---

### 3. AP ≤ 0 Turn Blocking

**Problem**: `getTurnBlockers()` in `Game.ts` checked for research idle, department vacancies, resource <= 10, economy <= 10 — but never checked `apCurrent <= 0` as required by the AP system spec.

**Fix Applied**:
- Added one additional check: `if (civi.apCurrent <= 0)`
- Added blocker message: "执政指令点耗尽：请等待下一回合恢复或开启AI智脑托管"

**Files**: [`src/core/Game.ts`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) lines 315-317

---

### 4. Playwright baseURL Correction

**Problem**: `playwright.config.ts` had `baseURL: 'http://localhost:4173/beyond-the-light-cone/'` but project constraint requires `baseURL: 'http://localhost:4173/'` matching Vite preview root path.

**Fix Applied**:
- Changed both `use.baseURL` and `webServer.url` to `http://localhost:4173/`

**Files**: [`playwright.config.ts`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/playwright.config.ts) lines 22, 51

---

### 5. Add Playwright to CI Pipeline

**Problem**: `.github/workflows/ci.yml` did not include Playwright E2E tests, violating project constraint.

**Fix Applied**:
- Added `npx playwright install --with-deps` step after build
- Added `npx playwright test` step
- Added artifact upload for playwright-report on any outcome

**Files**: [`.github/workflows/ci.yml`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/.github/workflows/ci.yml) lines 41-53

---

### 6. Missing Audio Files (7 endings) — FIXED

**Problem**: 7 ending BGM paths in `endingConfig.ts` pointed to non-existent audio files:
- `ending_conquest.mp3`, `ending_deterrence.mp3`, `ending_wandering.mp3`
- `ending_defeat_treachery.mp3`, `ending_defeat_extinction.mp3`, `ending_defeat_helium_flash.mp3`, `ending_defeat_dimension_strike.mp3`

**Fix Applied**: Mapped all 7 paths to existing thematically appropriate audio files:

| Ending | Now plays |
|--------|-----------|
| CONQUEST | `ending_death_of_the_light_cone.mp3` (dark triumph) |
| DETERRENCE | `ending_stardust_exodus.mp3` (finale theme) |
| WANDERING | `ending_stardust_exodus.mp3` (epic journey) |
| DEFEAT_TREACHERY | `ending_neutral_eternal_exile.mp3` (somber exile) |
| DEFEAT_EXTINCTION | `ending_neutral_cosmic_silence.mp3` (cosmic silence) |
| DEFEAT_HELIUM_FLASH | `era_crisis.mp3` (crisis) |
| DEFEAT_DIMENSION_STRIKE | `ending_death_of_the_light_cone.mp3` (catastrophe) |

**Files**: [`src/config/endingConfig.ts`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/config/endingConfig.ts) lines 60-74

---

## Verification

TypeScript check after all fixes: `npx tsc --noEmit` → **exit code 0, zero errors**

---

## Diff Summary

```
 03_Web_Rebuild/.github/workflows/ci.yml             | 10 ++++++++-
 03_Web_Rebuild/playwright.config.ts                  |  2 +-
 03_Web_Rebuild/src/components/GameCoverScreen.tsx    | 27 +++++++++++++++++++++-
 03_Web_Rebuild/src/components/Tutorial.tsx           | 30 ++++++++++++++++++++++++-
 03_Web_Rebuild/src/config/endingConfig.ts            | 14 ++++++------
 03_Web_Rebuild/src/core/Game.ts                      |  3 +++
 6 files changed, 77 insertions(+), 9 deletions(-)
```