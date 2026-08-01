# Plan — Fix TopHUD Status Bar Freezing Bug

- **Date**: 2026-07-03
- **Objective**: Fix the TopHUD UI not updating by adding a polling mechanism alongside the event system in TopHUD, and preventing serialization blocks in `Game.ts`'s turn history generation by ignoring the `flagManager` property.

## Proposed Changes

### Core Logic
#### [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts)
- Add `'flagManager'` to the `JSON.stringify` exclusion list in `runARound()`'s `turnHistory` generator to prevent serializing the `FlagManager` instance (which contains references that are already serialized elsewhere and could block performance or cause exceptions).

### UI Component
#### [TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx)
- Replace the simple `forceUpdate` trigger state with a `tick` counter state.
- Add a 500ms `setInterval` polling hook to update the `tick` counter, ensuring updates even if event listeners fail to catch them.
- Retain the event listeners for immediate updates by having them also increment the `tick` counter.
- Add `data-tick={tick}` to the `<header>` element to guarantee that state updates trigger re-renders.

### Scenario Registry & Documentation
#### [_registry.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/_registry.md)
- Log the fix in the change log under the current date.

---

## Verification Plan

### Automated Tests
- Run `npm test` inside `03_Web_Rebuild` to ensure all existing tests pass and no regressions occur.
- Run `npx tsc --noEmit` inside `03_Web_Rebuild` to verify type safety.
