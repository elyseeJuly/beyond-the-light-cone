# Legend of Uni - Event Audit & Timeline Overhaul Implementation Plan

We will perform a comprehensive audit and overhaul of all game events and timelines, focusing on event logic, era alignment, and making player values influence events. As per instructions, we will not generate or add new CG image assets.

## User Review Required

> [!IMPORTANT]
> - **Epoch & Year Synchronization**: We will change the fixed event trigger logic from exact year matching (`e.inYear === currentYear`) to chronological sequence matching (`currentYear >= e.inYear && checkFilterConditions(e.triggerCondition)`). This ensures transition events (like entering Deterrence) only trigger when both the year is reached and the player's dynamic epoch matches.
> - **Wade, Cheng Xin, and Character Lifetimes**: We will correct the `isPersonAliveInEpoch` lifetime mapping. Wade, Cheng Xin, and Yun Tianming will no longer be marked dead in the `CRISIS` epoch. Luo Ji, Hines, and Zhuang Yan will be correctly marked dead in the epochs following their canonical deaths.
> - **Bidirectional Values to Events**: We will enable the random event system to evaluate numeric preconditions (like `minEconomy`, `minCulture`, `maxTreachery`, `minDeterrence`) using the existing `checkFilterConditions` engine.
> - **NO New CG Assets**: We will not generate new CG images or map new CG files.

## Proposed Changes

### Component 1: Event System Logic

#### [MODIFY] [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts)
- Correct character lifetimes in `isPersonAliveInEpoch`.
- Update `checkRandomEvents()` to check numeric and flag conditions in `triggerCondition` using `checkFilterConditions()` (excluding the `probability` field which is used for candidate weighting).
- Update `checkEvents()` to check conditions on fixed history events via `checkFilterConditions`, allowing events to wait for epoch alignment.

### Component 2: Event Data Files

#### [MODIFY] [events.json](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/data/events.json)
- Expand historical events with 6 new major milestones:
  1. **Year 80**: Staircase Project (阶梯计划) - Wade proposes sending Yun Tianming's brain; unlocks Wade, reduces economy, sets flag.
  2. **Year 205**: Doomsday Battle (末日之战) - droplet attacks fleet; reduces military/prestige, increases treachery.
  3. **Year 210**: Deterrence Established (威慑建立) - Luo Ji threatens Trisolaris; increases prestige, reduces treachery.
  4. **Year 220**: Deterrence Broken (威慑中止) - Cheng Xin takes over, droplets attack antennas; reduces prestige/population, increases treachery.
  5. **Year 230**: Gravitational Wave Broadcast (引力波广播) - Gravity broadcasts coordinates.
  6. **Year 280**: Bunker World Completed (掩体世界落成) - space cities constructed; increases population/economy.
- Add dynamic trigger conditions to fixed events so they wait until their corresponding epoch is active before triggering.

#### [MODIFY] [randomevents.json](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/data/randomevents.json)
- Add numeric constraints (e.g. `minEconomy`, `minCulture`, `maxTreachery`, `minDeterrence`) to key random events to make them bidirectionally reactive.
- Ensure epoch tags for random events match character lifetimes.

### Component 3: Ending Conditions & Core Logic

#### [MODIFY] [Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts)
- Adjust conditions for victory endings to match overhauled timelines.

### Component 4: Documentation & Git Sync

#### [NEW] [AUDIT_20260608_EVENT_TIMELINE_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260608_EVENT_TIMELINE_AUDIT.md)
- Complete local documentation detailing the audit results, character lifetimes, and overhaul design.
- Stage and commit all changes, then push to GitHub remote branch `main`.

## Verification Plan

### Automated Tests
- Run `npm run test` to verify the vitest test suite.
- Run `npm run typecheck` to verify TypeScript compile-time correctness.

### Manual Verification
- Autoplay/run through the simulator to verify that events trigger at correct years and epochs.
