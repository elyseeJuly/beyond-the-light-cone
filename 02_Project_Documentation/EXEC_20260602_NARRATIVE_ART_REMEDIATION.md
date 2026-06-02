# EXEC_20260602_NARRATIVE_ART_REMEDIATION

## Overview
This document logs the remediation of narrative event repetition, art asset inconsistences, and narrative event thresholds.

## 1. Event Repetition Fix
- **File**: `03_Web_Rebuild/src/core/EventCadence.ts`
- **Change**: Hardcapped `maxTriggers` to 1 in `normalizeEventMeta` to prevent any random event from repeating across turns.
- **File**: `03_Web_Rebuild/src/core/GameEventManager.ts`
- **Change**: Removed `cooldownYears` from 10 conditional narrative events so they trigger exactly once when their conditions are met.
- **File**: `03_Web_Rebuild/src/core/Game.ts`
- **Change**: Persisted `triggeredFilteredIds` in save files so that milestone events are not reset across sessions.

## 2. Art Asset Unification
- **File**: `03_Web_Rebuild/src/core/GameEventManager.ts`
- **Change**: Fixed `mapAvatar` to point 10 existing character mappings to `unified_*.png` assets instead of `character_*.png`. Also added missing split-keys `lin` and `guan`.
- **File**: `03_Web_Rebuild/src/data/persons.json`
- **Change**: Replaced 23 legacy `faceFile` strings with unified counterparts to ensure UI character cards display correctly.
- **File**: `03_Web_Rebuild/src/data/randomevents.json`
- **Change**: Stripped absolute `/images/` path bypasses from 8 dialog queues to ensure they are handled properly by the mapping layer.

## 3. CG Trigger Accessibility
- **File**: `03_Web_Rebuild/src/core/GameEventManager.ts`
- **Change**: Relaxed requirements for certain CG events so players have a better chance of viewing them:
  - `wallfacer_election`: Lowered `minCulture` to 10.
  - `sophon_blockade`: Extended `maxYear` to 300.

## 4. Verification & Testing
- **Test Suite**: Ran `npm run test` using Vitest.
- **Result**: All 246 tests passed successfully.
- **Assets**: Deleted unused legacy character `.png` files to reclaim disk space.
