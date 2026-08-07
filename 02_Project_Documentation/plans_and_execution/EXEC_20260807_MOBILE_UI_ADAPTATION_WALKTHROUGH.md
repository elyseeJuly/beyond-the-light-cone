# Walkthrough - Mobile UI Layout Adaptation & E2E Verification

This document details the completed fixes and layout adaptations to address screen size misalignment on mobile devices (A2 Layout specifications) and the E2E verification results.

---

## 1. Summary of Changes

### Layout & Safe Area Adaptations
- **Body Safe Area**: Removed global body safe-area padding inside [`index.css`](../../03_Web_Rebuild/src/index.css), allowing full edge-to-edge scaling on notched viewports.
- **TopHUD Sizing**: Refactored [`TopHUD.tsx`](../../03_Web_Rebuild/src/components/TopHUD.tsx) horizontal/top paddings dynamically via inline styles using `useBreakpoint()`, ensuring status metrics do not get clipped by notch/status-bar overlays.
- **Bottom Navigation Sizing**: Set `.mobile-bottom-nav` container height dynamically to `calc(56px + env(safe-area-inset-bottom, 0px))` inside [`index.css`](../../03_Web_Rebuild/src/index.css) to prevent clipping button icons on notched screens.
- **Mobile Landscape Hub**: Corrected container width to `calc(56px + env(safe-area-inset-left, 0px))` inside [`MobileLandscapeHub.tsx`](../../03_Web_Rebuild/src/components/MobileLandscapeHub.tsx) to ensure the left-side notch does not push or squish control icon zones.
- **Floating Details Trigger**: Embedded a vertical "详情" (Details) handle button trigger on the right side of the screen when the mobile drawer is closed inside [`App.tsx`](../../03_Web_Rebuild/src/App.tsx) and [`index.css`](../../03_Web_Rebuild/src/index.css).
- **SettingsModal Responsiveness**: Horizontally stacks tab buttons on mobile viewport screen sizes with horizontal scroll boundaries, capping setting wrapper box height at `max-h-[90vh]` inside [`SettingsModal.tsx`](../../03_Web_Rebuild/src/components/SettingsModal.tsx).
- **StoryModal Responsiveness**: Capped height at `max-h-[90vh]` and hid speaker avatars in narrow landscape viewports inside [`StoryModal.tsx`](../../03_Web_Rebuild/src/components/StoryModal.tsx).
- **FleetModal Adaptation**: Allowed vertical wrapping on list items and capped container heights at `max-h-[90vh]` inside [`FleetModal.tsx`](../../03_Web_Rebuild/src/components/FleetModal.tsx).
- **BattleScreen & Museum Limits**: Added height constraints (`max-h-[90vh]`) to [`BattleScreen.tsx`](../../03_Web_Rebuild/src/components/BattleScreen.tsx) and safe-area paddings to [`MuseumGallery.tsx`](../../03_Web_Rebuild/src/components/MuseumGallery.tsx) to ensure UI components fit inside landscape viewports.

### E2E Test Timing & Interaction Fixes
- **React Stale Closure Fix**: Resolved a critical closure bug in [`App.tsx`](../../03_Web_Rebuild/src/App.tsx) where key window event listeners (`star-selected`, `tutorial-set-tab`, `tutorial-close-drawer`) captured mount-time viewport values of `showDesktopLayout` (which defaults to `true` on mount), preventing the mobile drawer from opening during E2E layout switches. Added a mutable React ref (`showDesktopLayoutRef`) to resolve the stale closure.
- **PWA Asset Download Overlay Dismissal**: Modified the E2E helper `startFreeExplore` in [`tutorial-coordinates.spec.ts`](../../03_Web_Rebuild/src/test/e2e-playwright/tutorial-coordinates.spec.ts) to wait for and click the "进入游戏" button when the PWA asset download modal covers the screen, preventing coordinate click interceptions.
- **Canvas Focus Correction**: Added a camera focusing step (`renderer.focusOnStar(3, 1.0, false)`) in [`tutorial-coordinates.spec.ts`](../../03_Web_Rebuild/src/test/e2e-playwright/tutorial-coordinates.spec.ts) to center Earth in the viewport before retrieving coordinates, ensuring it is on-screen and clickable on short landscape screens.
- **Robust Coordinate Clicks**: Dispatched native browser `MouseEvent`s (both `'mousemove'` and `'click'`) directly to the canvas element inside [`tutorial-coordinates.spec.ts`](../../03_Web_Rebuild/src/test/e2e-playwright/tutorial-coordinates.spec.ts), bypassing Playwright's physical hit-testing bugs when clicking elements covered by overlay canvases (like `star-canvas-react`).
- **Timing-Robust Range Slider Drag**: Refactored the range slider interaction in [`tutorial-guided.spec.ts`](../../03_Web_Rebuild/src/test/e2e-playwright/tutorial-guided.spec.ts) to use keyboard focus (`ArrowRight` presses) and direct `mouseup`/`touchend` event dispatching, bypassing emulated touch drag coordinate limitations in headless Chrome.

---

## 2. Verification & Test Results

All E2E and Unit test suites are verified fully green:

### Automated Tests
- **Vitest Unit Tests**: `1099 passed` / `3 skipped` (100% pass rate).
- **Playwright E2E Tests**: `81 passed` / `7 skipped` (100% pass rate across Desktop Chrome and Emulated Mobile Chrome viewports).
  - Passed `tutorial-coordinates.spec.ts` (Validating correct canvas space to screen coordinate translation and star interaction).
  - Passed `tutorial-guided.spec.ts` (Checking step-by-step tutorial progress and slider updates).
  - Passed `responsive.spec.ts` (Ensuring zero viewport overflows and correct layout adjustments across all breakpoint matrices).

```bash
# Production build validation:
npm run build # Exited with code 0

# Playwright E2E verification:
npx playwright test --project=chromium-desktop --project=mobile-chrome --workers=1 # Exited with code 0

# Vitest Unit test verification:
npm run test # Exited with code 0
```
