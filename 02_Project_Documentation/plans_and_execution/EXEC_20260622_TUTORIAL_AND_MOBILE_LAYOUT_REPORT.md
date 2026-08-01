# 新手教程定位优化与移动端抽屉布局修缮执行报告

## 1. 概述
在 2026-06-22 的迭代优化中，我们针对玩家反馈的「新手教程引导不准、无法对应具体模块按钮、部分区域截断显示不全」等痛点进行了专项修缮。通过扩展星图渲染器坐标映射、细分教程步骤、重构移动端弹性盒模型，彻底解决了教程体验不佳与移动端布局截断的问题。

---

## 2. 核心优化与修复细节

### 2.1 星图星辰动态精准高亮 (Bug 1 & Step 3)
- **问题分析**：在原有的教程中，引导玩家点击地球，但高亮区域却是整个星图视口（`starmap-viewport`），或者在未选中地球时就直接高亮了右侧面板的「采矿场」按钮。这在空间布局上是脱节的，且在移动端由于面板滑出遮挡星图，玩家根本看不到被遮挡的地球。
- **解决方案**：
  - **动态视口映射**：在 [StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L810-L819) 中实现了 `getStarScreenCoords` 方法。该方法根据行星的世界坐标（`rs.x`, `rs.y`）、星图当前的缩放系数（`zoomLevel`）、平移位移（`panX`, `panY`）以及 Canvas 视口的物理盒模型（`getBoundingClientRect`），计算出特定星体在当前屏幕视口中的具体相对像素坐标。
  - **步骤逻辑拆分**：将行星指令引导细分为两个独立步骤：
    1. **第 3 步（行星观测与选择）**：高亮目标设为 `earth-star`，引导卡片居左，在主星图中央动态锁定并高亮 **地球**（支持在地球公转轨道运动时动态跟随高亮框和指引箭头）。
    2. **第 4 步（行星开发建设）**：点击地球后，触发自动打开右侧开发面板（移动端拉起抽屉），高亮精准聚焦在 **采矿场** 按钮上（`btn-build-stope`）。
  - **单例注册**：在 [StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx#L23-L42) 中将渲染器注册到 `window.activeStarMapRenderer`，以便教程子系统跨组件查询。

### 2.2 政府部门按钮精确对齐 (Step 5)
- **问题分析**：第 5 步（内阁政府管理中枢）在引导任命部长时，高亮的是整个左侧侧边栏区域（`gov-cabinets-sidebar`），导致玩家不知道具体应该点哪里，这对于具体的操作指引不够聚焦。
- **解决方案**：
  - 在 [GovManagement.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/GovManagement.tsx#L141-L230) 中为各个部门入口按钮添加了明确的 `data-tutorial-id`（例如：`btn-gov-finance-dept`）。
  - 修改教程第 5 步的高亮目标为 `btn-gov-finance-dept`（进入中央计划局），精准高亮该任命按钮，并将描述更新为指导玩家点击此处以任命部长。

### 2.3 过渡动画中的位置抖动与隐藏元素高亮修复
- **问题分析**：在侧边栏抽屉滑动滑出或标签页切换的过渡期间，由于坐标是一次性计算的，且动画有延时（如 300ms），会导致高亮框滞留在屏幕外或者发生错位。此外，如果高亮目标元素在 DOM 中但尚未渲染完成（宽度/高度为 0），会导致教程高亮框缩成一个点并定位在屏幕左上角 `(0, 0)`。
- **解决方案**：
  - **持续动画锁定**：重构 [Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx#L201-L205) 中 `useEffect` 的计算逻辑，在进入新步骤的前 1000 毫秒内，在 `requestAnimationFrame` 渲染循环中持续调用 `scrollIntoView`，确保在抽屉滑出和动画过渡完全结束后，高亮锚点与元素物理位置能自动精准对齐。
  - **防虚空绘制**：在计算坐标时，如果检测到元素的 bounding rect `width === 0` 或 `height === 0`，将高亮区域安全设置为 `null`（隐去遮罩），避免产生错误的左上角小斑点，直至元素真正就绪。

### 2.4 移动端抽屉布局截断及双滚动条修复 (Mobile Inspector)
- **问题分析**：移动端右侧面板以 `drawer-panel` 抽屉形式拉起。原有的 `.drawer-panel` 样式使用的是 `overflow-y: auto`。而抽屉头部渲染了关闭按钮，下方挂载了高度为 `h-full` (100% 视口高度) 的 `RightInspector`。这导致了总内容高度超出了 100% 视口（多了关闭按钮的高度），触发了抽屉面板的外层滚动，导致底部的威慑度指标条（全局战略威慑平衡）被截断到屏幕下方看不见，产生了糟糕的双滚动条体验。
- **解决方案**：
  - **盒模型弹性化**：在 [index.css](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/index.css#L274-L276) 中，将 `.drawer-panel` 改造为弹性列容器（`display: flex; flex-direction: column; overflow: hidden;`），禁止外层面板产生滚动。
  - **剩余高度约束**：在 [App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx#L393-L404) 中使用 `<div className="flex-1 min-h-0">` 容器包裹 `<RightInspector />`。由于外层容器被限高且为 flex，该包装层会自动占据除了关闭按钮之外的剩余视口高度，并强制 `RightInspector` 在其内部的 Tab 列表区域滚动，完全消除了底部截断和外层滚动条，保证了移动端操作面板의完全显示。

---

## 3. 测试与验证结果

### 3.1 类型检查与编译构建
- 运行类型检查命令：
  ```bash
  npx tsc --noEmit
  ```
  **结果**：编译通过，无任何语法或 TypeScript 类型报错。

### 3.2 单元与集成测试运行
- 运行项目全量 Vitest 测试套件：
  ```bash
  npx vitest run
  ```
  **结果**：**825 / 825 个测试用例全部一次性通过**（包括核心逻辑、存档管理、事件控制和 UI 渲染组件测试）。

---

## 4. 交付文件清单
- **渲染器接口**：[StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L810-L819) (`getStarScreenCoords` 屏幕空间坐标换算)
- **星图注册层**：[StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx#L23-L42) (`window.activeStarMapRenderer` 全局挂载与清理)
- **教程引导核心**：[Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx) (拆分步骤、精确高亮、动画持续 scroll-into-view)
- **内阁总署界面**：[GovManagement.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/GovManagement.tsx#L141-L230) (为各内阁部门挂载独立引导 ID)
- **容器与抽屉布局**：[App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx#L393-L404) (`flex-1 min-h-0` 移动端抽屉高度约束)
- **样式修正**：[index.css](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/index.css#L274-L276) (`.drawer-panel` 弹性重构)
