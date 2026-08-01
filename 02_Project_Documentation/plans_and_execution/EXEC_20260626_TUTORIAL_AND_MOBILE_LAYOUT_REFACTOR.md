# Mobile UI and Tutorial Refactoring Report
> **Establishment Date**: 2026-06-26  
> **Target Directory**: `02_Project_Documentation/`  
> **Category**: Execution & Implementation Report

## 1. Overview & Purpose
This document summarizes the changes made to the mobile adaptive layout system and the tutorial system in `03_Web_Rebuild`. The previous layout system failed to account for mobile devices in landscape orientation, causing the UI to default to desktop sizing which resulted in severe visual overflow. Additionally, the tutorial system contained hardcoded target selectors and lacked sufficient device filtering, leading to broken guidance flows on mobile devices.

## 2. Mobile Adaptive Layout Solutions
### 2.1 Breakpoint System Overhaul
*   **File Modified:** `src/hooks/useBreakpoint.ts`
*   **Changes:** Introduced `isMobileLandscape` detection logic. Previously, breakpoints relied solely on screen width. We implemented touch capability checking (`navigator.maxTouchPoints > 0`) combined with height constraints (`height <= 500`) to accurately detect mobile landscape devices even when their width exceeds the standard 768px threshold. 

### 2.2 Global CSS Scaling
*   **File Modified:** `src/index.css`, `src/App.tsx`
*   **Changes:** To preserve the intended horizontal layout of the game, rather than pushing everything into mobile drawers, we implemented a global scale down for mobile landscape devices. The `.mobile-landscape-scale` class scales the entire application wrapper by a factor of `0.85` via CSS `transform`, allowing the full desktop-class UI to fit within small mobile landscape viewports without truncating essential components like `LeftHub` and `RightInspector`.

### 2.3 Fluid Sidebar Constraints
*   **File Modified:** `src/index.css`
*   **Changes:** Replaced fixed pixel widths on sidebars (`LeftHub` and `RightInspector`) with responsive `clamp()` functions during tablet and scaled-landscape modes, ensuring fluid resizing that prevents UI cutoff.

### 2.4 Orientation Locking
*   **File Modified:** `src/components/OrientationPrompt.tsx`
*   **Changes:** Implemented the `screen.orientation.lock('landscape')` API call. Where supported (primarily Android browsers and PWAs), this automatically locks the device into the intended landscape layout without requiring manual user rotation.

## 3. Tutorial Guidance Logic Overhaul
### 3.1 Device-Aware Coordinate Scaling
*   **File Modified:** `src/components/Tutorial.tsx`
*   **Changes:** Because the Tutorial component utilizes `getBoundingClientRect()` to compute exact overlay dimensions, these coordinates represent physical screen pixels. With the introduction of the `.mobile-landscape-scale` transform on the app wrapper, the tutorial overlay's coordinate grid desynchronized from the app's visual elements. We updated `updateRect` to detect the scale factor dynamically and divide all coordinate calculations by `0.85` when the scaling class is present.

### 3.2 Mis-Interaction Prevention (Cutout Interceptor)
*   **File Modified:** `src/components/Tutorial.tsx`
*   **Changes:** The tutorial's previous design allowed users to click through the highlight cutout directly onto the underlying game UI. However, because the tutorial behaves linearly (advancing only via the "Next Step" button rather than reacting to actual UI clicks), clicking underlying elements would prematurely open drawers or change game state, causing the tutorial highlights to lose their context. 
*   **Solution:** We introduced a transparent `div` with `pointer-events-auto` exactly covering the highlighted cutout area. This safely intercepts user clicks, preventing premature UI manipulation and enforcing the linear flow of the tutorial, thereby completely resolving the "strange" guidance logic.

## 4. Stability Validation
*   No TypeScript or ESLint errors persist.
*   Production build (`npm run build`) completed successfully with zero compilation issues.
*   The overall integration ensures that both Android and iOS users receive a resilient, auto-scaled horizontal layout that remains faithful to the core desktop experience.
