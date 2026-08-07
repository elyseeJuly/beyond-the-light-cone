# 移动端 UI 尺寸与布局自适应适配计划

针对实机游玩中出现的“不适配尺寸”问题，我们对代码库中的响应式逻辑、安全区（Safe Area）处理、模态窗口（Modals）高度硬编码以及移动端交互缺陷进行了深度审计。发现若干导致界面截断、文字溢出和操作阻断的致命问题，并在此提出系统性适配方案。

## 核心缺陷与解决方案

### 1. 全局视口裁剪与双重安全区冲突 (P0)
*   **缺陷**：`index.css` 的 `body` 节点被硬编码了 `env(safe-area-inset-*)` 边距。同时，主容器 `App.tsx` 设置了 `h-screen w-screen`。由于父级 `body` 产生边距，子级容器在布局上超出 `body` 的内容区，导致其底部（底部导航栏）和右侧（详情面板）被**强行裁剪**（iOS 物理实机上最多截断 59px）。
*   **解决**：移除 `body` 上的安全区边距，让主背景图 and 全局节点铺满物理全屏（沉浸式设计）；由各边缘组件（`TopHUD`、`MobileBottomNav`、`MobileLandscapeHub`、`.drawer-panel`）自行并在内部计算安全区距离。

### 2. 模态框横屏高度溢出 & 竖屏宽度溢出 (P0)
*   **缺陷**：
    *   `StoryModal` 在横屏手机（宽度 >= 768px，高度 <= 500px）中会因触发 `md:` 响应式断点，高度被硬编码为 `md:h-[520px]`，远超手机横屏的物理高度（通常仅约 390px），导致下方决策按钮被截断，游玩进度受阻。
    *   `SettingsModal` 硬编码了 `w-[720px] h-[520px]`；`FleetModal` 与 `BattleScreen` 硬编码了 `h-[560px]`。这些窗口在手机竖屏和横屏上均会出现严重的上下/左右溢出，导致按钮无法点击。
*   **解决**：
    *   为所有 Modal 卡片容器应用 `max-h-[90vh]`（或 `max-h-[calc(100vh-32px)]`），确保其高度随屏幕高度自动等比例缩小。
    *   将 `SettingsModal` 宽度改为 `w-full max-w-[720px]`，并在手机端（`width < 768px`）将左右布局（侧边栏+设置项）自动重构为**垂直布局**：顶部为可左右滑动的横向 Tab 栏（`flex-row overflow-x-auto`），下方展示设置项，极大释放横向 and 纵向空间。
    *   在 `StoryModal` 中添加横屏专用媒体查询，当 `max-height: 500px` 时，隐藏左侧大人物肖像（保留右侧关键文本和选项），收缩内外边距，确保剧情文本和选项 100% 完整显示。

### 3. 移动端 Inspector 抽屉关闭后无法重新打开 (P1)
*   **缺陷**：在移动端（横屏或竖屏），若关闭了右侧的 `RightInspector` 抽屉，除了返回星图点击星球外，在科技树、政府管理、情报中心等没有星球可点的页面中，**没有任何按钮**能再次呼出该抽屉，导致玩家无法在这些页面查看资源、管理劳动力或查看舰队。
*   **解决**：当 `mobileDrawerOpen === false` 时，在屏幕右侧边缘渲染一个半透明的“详情 ◀”胶囊拉手按钮（`vertical-lr` 竖向排版），符合 SPEC A2 规范，允许玩家随时一键拉起 Inspector 详情面板。

### 4. 安全区尺寸硬编码导致元素挤压/变形 (P1)
*   **缺陷**：
    *   `MobileBottomNav` 虽使用了安全区，但高度固定为 `height: 56px`。当安全区占用 34px 时，内容区高度被极速压缩至 `22px`，导致图标与文字重叠溢出。
    *   `MobileLandscapeHub` 宽度固定为 `56px`，在左侧安全区（刘海）生效时，其 `padding-left` 大于宽度，导致触控按钮挤压为负宽度变形。
*   **解决**：将高度与宽度改为动态计算：
    *   `MobileBottomNav` 高度设为 `calc(56px + env(safe-area-inset-bottom, 0px))`。
    *   `MobileLandscapeHub` 宽度设为 `calc(56px + env(safe-area-inset-left, 0px))`。

---

## Proposed Changes

### [03_Web_Rebuild]

#### [MODIFY] [index.css](../../03_Web_Rebuild/src/index.css)
*   移除 `body` 上的安全区 padding 属性。
*   修复 `.mobile-bottom-nav` 的高度为动态计算，清除挤压。
*   为 `.drawer-panel` 增加 `padding-bottom` 和 `padding-right` 安全区适配。
*   为 Modal 机制和各种模态卡片添加自适应滚动和最大高度限制规则。

#### [MODIFY] [App.tsx](../../03_Web_Rebuild/src/App.tsx)
*   在右侧抽屉未打开且处于移动端模式时，渲染半透明的“详情 ◀”胶囊按钮（符合 SPEC A2 规范），并考虑 safe-area 偏移。

#### [MODIFY] [TopHUD.tsx](../../03_Web_Rebuild/src/components/TopHUD.tsx)
*   将 `TopHUD` 顶部和两侧内边距重构为安全区适配（`paddingTop: env(safe-area-inset-top)` 等），且高度改为动态适应，防止在刘海屏下内容被刘海遮挡。

#### [MODIFY] [StarMap.tsx](../../03_Web_Rebuild/src/components/StarMap.tsx)
*   对于 `isMobileLandscape`，将缩放控制按钮的 `bottom-[72px]` 调优为 `bottom-4`，释放宝贵的中央星图垂直空间。

#### [MODIFY] [MobileLandscapeHub.tsx](../../03_Web_Rebuild/src/components/MobileLandscapeHub.tsx)
*   将 `width` 从 56px 改为 `calc(56px + env(safe-area-inset-left, 0px))`，防止左侧刘海引发宽度塌陷。

#### [MODIFY] [SettingsModal.tsx](../../03_Web_Rebuild/src/components/SettingsModal.tsx)
*   支持卡片宽高度自适应、最大高度截断及内部滚动。
*   重构为移动端自适应布局：当屏幕较窄时，左侧导航栏变为顶部水平滚动 Tab 栏，内容区变为垂直流式呈现。

#### [MODIFY] [StoryModal.tsx](../../03_Web_Rebuild/src/components/StoryModal.tsx)
*   使用 `max-h-[90vh]` 并增加横屏专用 CSS 样式，在低高度下自动隐藏肖像、压缩 padding、调小字体，确保剧情完全可读且按钮完全可点。

#### [MODIFY] [FleetModal.tsx](../../03_Web_Rebuild/src/components/FleetModal.tsx)
*   卡片高度应用 `max-h-[90vh]`。
*   将舰队条目内的布局从横向 `flex-row` 调整为 `flex-col sm:flex-row`，当在窄屏手机上时，自动转为垂直流，以防“折跃目标”选择下拉框和派遣按钮挤出屏幕。

#### [MODIFY] [BattleScreen.tsx](../../03_Web_Rebuild/src/components/BattleScreen.tsx)
*   卡片高度应用 `max-h-[90vh]` 保证完全展示。

#### [MODIFY] [MuseumGallery.tsx](../../03_Web_Rebuild/src/components/MuseumGallery.tsx)
*   为全屏画廊层增加 `env(safe-area-inset-*)` 边距，防止四周的内容（如关闭按钮、顶部标题）贴在屏幕边缘被刘海遮挡。

---

## Verification Plan

### Automated Tests
1. 运行响应式布局 Playwright 测试套件：
   ```bash
   npx playwright test src/test/e2e-playwright/responsive.spec.ts --project=chromium-desktop --workers=1
   ```
2. 运行单元与集成测试以确保没有代码破损：
   ```bash
   npm run test
   ```
3. 检查 TypeScript 类型正确性：
   ```bash
   npm run typecheck
   ```

### Manual Verification
*   在各种模拟设备视口（iPhone SE 320x568 竖屏、iPhone 14 Pro Max 932x430 横屏等）下测试：
    1. 进入游戏封面，验证标题和设置是否显示正常。
    2. 进入游戏，切换到“科技”和“政府”页面，关闭 Inspector 抽屉，验证右侧“详情”胶囊按钮出现；点击胶囊按钮，验证抽屉能被重新拉出。
    3. 打开“设置”模态窗口，验证其在竖屏下能够完美转化为横向滚动 Tab 结构且无任何内容切边。
    4. 打开“舰队 modal”和触发事件“StoryModal”，验证其高度完美适配视口，文本和选项按钮 100% 完整呈现在视口中央。
