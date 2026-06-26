# Mobile UI and Tutorial Implementation Plan
> **Establishment Date**: 2026-06-26  
> **Target Directory**: `02_Project_Documentation/`  
> **Category**: Execution & Implementation Report

## 1. 核心问题定位

### 1.1 移动端 UI 布局缺陷
*   **断点判定逻辑失效**：`useBreakpoint.ts` 仅依赖宽度判断（`< 768px` 为 mobile）。移动端横屏时，宽度通常大于 768px，导致系统误判为平板/桌面端，直接加载固定宽度的桌面布局，引发严重溢出。
*   **固定像素硬编码**：`App.tsx` 和相关组件（`LeftHub`, `RightInspector`）大量使用固定像素（如 280px, 320px）。缺乏基于视口的弹性缩放（`vw`/`vh` 或 CSS `scale()`）。
*   **横屏适配缺失**：`OrientationPrompt.tsx` 提示用户横屏，但横屏后的实际布局并未做专门优化，垂直空间（高度通常不足 400px）被顶部 HUD 和其他元素过度挤压。
*   **组件暴力隐藏**：移动端直接隐藏了右侧面板（`RightInspector`）和底部事件栏（`BottomEventBar`），导致核心信息缺失，且依赖这些元素的逻辑（如新手教程）直接断裂。

### 1.2 新手教程 (Tutorial) 逻辑断裂
*   **目标元素缺失**：教程步骤中硬编码了目标选择器（如 `#right-inspector`, `#bottom-events`）。由于这些元素在移动端被强行隐藏，`document.querySelector` 返回 null，导致高亮框失效，教程上下文脱节。
*   **提示框尺寸溢出**：提示框宽度被硬编码为 320px，未做边界检测（Bounds Clamping），在小屏幕边缘容易溢出屏幕可视区域。
*   **缺乏设备分发逻辑**：PC与移动端共用同一套 14 步教程。移动端的交互路径（如需先点击底部导航，再在抽屉中操作）与教程指引完全不匹配。

---

## 2. 迭代修复方案与技术规范

### 2.1 断点与视口重构
*   **重写 `useBreakpoint.ts`**：引入对设备特征（Touch Device、User Agent）与屏幕方向（Orientation）的综合判定。
    *   新增 `isMobileLandscape` 状态：当检测为移动设备且 `width > height` 时触发。
*   **全局缩悉机制**：对于 `isMobileLandscape` 场景，放弃重写整套布局，采用 CSS `transform: scale()` 或 `zoom`（结合 `transform-origin`）对核心桌面布局进行全局等比缩放，确保横屏下能完整展示全景 UI，充分利用游戏原生横屏设计。
*   **Safe Area 适配**：在 `index.css` 全局补充 `env(safe-area-inset-*)`，修复刘海屏/挖孔屏的遮挡问题。

### 2.2 核心 UI 组件响应式改造
*   **面板尺寸弹性化**：将 `LeftHub`、`RightInspector` 的固定宽度重构为 CSS 变量控制，引入 `clamp(200px, 20vw, 280px)` 替代固定值。
*   **高度极限压缩**：针对移动端横屏（高度极小），为 `TopHUD` 和 `BottomEventBar` 增加高度压缩类（例如 `< 400px` 视口高度时，字体图标缩减 15%-20%，紧凑内边距）。
*   **移动端操作路径收编**：移动端竖屏维持 BottomNav + Drawer 逻辑；移动端横屏加载缩放版的桌面布局，保证信息密度。

### 2.3 新手教程 (Tutorial.tsx) 逻辑重构
*   **渲染层增强**：
    *   **边界约束 (Bounds Clamping)**：强制检测外层 `.mobile-landscape-scale` 的缩放状态，除以 0.85 缩放系数修正坐标系漂移。
    *   **防误触隔离层**：为了避免教程播片过程中的逻辑诡异（例如提示用户点击，但实际点击后会提前唤出底层面板），在高亮遮罩区域（Cutout）上方，新增一层透明但拦截事件的隔离层（`pointer-events-auto`），断绝教程指引与底层系统状态脱轨的可能性。

### 2.4 具体执行步骤

1.  **第一阶段：底层尺寸与 CSS 修正**
    *   修改 `useBreakpoint.ts` 侦测横屏与触摸特征。
    *   修改 `index.css` 增加横屏等比例缩放的类支持。
2.  **第二阶段：组件布局调优**
    *   调整 `App.tsx` 让横屏设备渲染带比例缩放的完整桌面端节点。
    *   调整 `OrientationPrompt.tsx` 调用 `screen.orientation.lock()`。
3.  **第三阶段：Tutorial 健壮性改造**
    *   更新 `Tutorial.tsx` 增加 `scale` 的除法修正坐标计算。
    *   更新 `Tutorial.tsx` 增加居中透明的防误触层阻断交互。
