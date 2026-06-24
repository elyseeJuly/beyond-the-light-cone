# Beginner Tutorial Alignment with Latest UI - Implementation Plan

Modify the beginner tutorial (`Tutorial.tsx`) steps and interactions to perfectly match the latest Web Rebuild UI layout, button labels, and terms. Correct physical locations (e.g., "Top-Right" instead of "Bottom-Right" for the Next Turn button) and department titles, while adding automatic closing of the legacy popup modal container on step transitions.

## User Review Required

> [!IMPORTANT]
> The tutorial will now automatically hide the legacy `#modal-container` popup whenever transitioning between tutorial steps. This ensures that opening a department manager or wallfacer panel during a guided step will not permanently block the screen and overlap with subsequent steps (such as the tech tree or diplomacy).

## Proposed Changes

---

### UI Components

#### [MODIFY] [Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx)
- **Step 6 Tip**: Change "右下角" (bottom-right) to "右上角" (top-right) for the "下一回合" (Next Turn) button location.
- **Step 7 Description**: Update "任命科学、国防、文化、社会部长" to "任命经济、军事、科研与文化部的负责人", and update "点击右侧的「进入中央计划局」" to "点击下方的「进入中央计划局 (分配与扩产)」".
- **Step 8 Description**: Clarify that the Physics tab's starting tech "天文观测" (Astronomical Observation) is highlighted, and we need to work up to "550W量子计算机".
- **Step 9 Description**: Mention the button name explicitly: "点击下方的「召开面壁计划战略听证会」".
- **Step 10 Description**: Rewrite the step description to match the actual Intelligence Center (Crisis/Diplomatic/Research log streams) rather than pretending you conduct negotiations directly in the log viewer. Explain that active negotiation/trading is done in the Government Diplomacy tab, and point out the alert notification badges.
- **Step 12 Summary**: Fix typos and mixed English/Chinese terms (e.g. change "四个部门 of 执掌官员" to "各部门 of 负责人", and "不条在无前置矿场时连续建造工厂，防止 resource 枯竭" to "不要在没有采矿场的情况下连续建造加工厂，防止资源枯竭").
- **Automatic Modal Dismissal**: Add a DOM hook inside the step transition `useEffect` to ensure `document.getElementById('modal-container')?.classList.add('hidden')` is triggered on step changes.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to verify type checking.
- Run `npx vitest run` to verify all unit/integration tests pass.
- Run `npx playwright test` to verify all E2E browser tests pass, including the guided tutorial test.

### Manual Verification
- Walk through the guided tutorial in the browser.
- Verify that clicking "进入中央计划局 (分配与扩产)" opens the modal, and clicking "下一步" in the tutorial card successfully closes the modal and switches to the tech tree view without visual overlap.
