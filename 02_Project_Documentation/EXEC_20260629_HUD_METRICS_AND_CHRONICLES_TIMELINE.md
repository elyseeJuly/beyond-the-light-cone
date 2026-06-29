# TopHUD 指标优化、威慑二级展开与岁月史书双轨对比实施报告
> **建档日期**: 2026-06-29  
> **归档类别**: 实施执行与验证报告 (Execution & Verification Report)  
> **文档编号**: `EXEC_20260629_HUD_METRICS_AND_CHRONICLES_TIMELINE.md`  

---

## 1. 任务背景与核心改进诉求

基于用户最新反馈和历史重构版本的标准，本阶段对 UI 指标展示、回合阻断逻辑以及「岁月史书」的功能进行了深度迭代与对齐：
1. **隐藏文明等级**：完全屏蔽 `TopHUD` 上的「文明等级」显示，避免不必要的底层数值暴露给玩家。
2. **稳定度指标去重**：从文明稳定度详情下拉框中移除了「人口基数」指标，防止其与 HUD 顶层已常驻的「人口」指标重复冗余；将详情中的发展维度锁定为：经济指数、文化资产、科技研发度、逃亡系数。
3. **威慑度详情展开**：在 `TopHUD` 威慑度指标上新增点击下拉弹窗，整合展示威慑的核心防卫力量：「防卫军力」与「在位执剑人」，从而将军事/战略防御数值与威慑度有机结合，避免顶部冗余。
4. **博物馆与岁月史书分离**：主页入口「岁月史书」改名为「文明博物馆」（包含星历终章、CG图鉴及留声机）；游戏操作内侧边栏的「岁月史书」改为渲染专用的 `ChroniclesModal.tsx`（仅显示双轨对比时间线）。
5. **恢复 TopHUD 容器缩放**：将 `<TopHUD />` 移动回 `.mobile-landscape-scale` 缩放容器内，确保其在移动端横屏小高度下自适应缩放，不再溢出或丢失。
6. **解除非必要手动阻断**：移除了手动模式下「科研停滞」、「首长空缺」、「指令点耗尽」对“下一回合”按钮的硬性禁用拦截。AP 耗尽或初始阶段不设置目标不再会导致回合锁死，由玩家自由掌控决策节奏。

---

## 2. 方案设计与核心代码实现

### 2.1 TopHUD 结构与下拉重构 (TopHUD.tsx)
- 移除了 CivLevel 相关的 TopHUDStatItem 渲染。
- 在 TopHUD 组件中添加 `showDeterrenceDropdown` (boolean) 状态 and `deterrenceDropdownRef` (useRef)。
- 在全局 outside-click 监听中，对两个下拉菜单（稳定度、威慑度）分别进行失焦关闭控制。
- 威慑度点击后展示「防卫军力（stats.army）」和「在位执剑人（stats.swordholder || '空缺'）」。

### 2.2 博物馆与岁月史书分离 (MuseumGallery.tsx / ChroniclesModal.tsx / App.tsx)
- 在 `GameCoverScreen.tsx` 中，将入口重命名为「文明博物馆」（CIVILIZATION MUSEUM）。
- 还原 `MuseumGallery.tsx`：仅包含 3 个 tab，剔除了双轨时间线。
- 新增 `ChroniclesModal.tsx`：专门渲染双轨时间轴对比视图，作为游戏操作内「岁月史书」的弹窗内容。
- 在 `App.tsx` 中，将 cover 层的 `onOpenMuseum` 映射到 `MuseumGallery`，将操作页面的 `archive`（岁月史书）映射渲染为 `ChroniclesModal`。

### 2.3 手动阻断裁剪与测试对齐 (Game.ts / Test)
- 修改 `getTurnBlockers()` 方法，移除了对 `isResearchIdle`、首长空位和 `apCurrent <= 0` 的 blocker 推送。仅在资源或经济耗尽（`<= 10`）时引发关键警戒。
- 更新 `TutorialRemedy.scenario.test.tsx`：由于去除了文明等级显示，将原先对 `文明等级` 的 DOM 存在断言改为 `not.toBeInTheDocument()`；在阻断测试中，手动触发低资源和低经济阈值，以正确验证“有阻断”拦截和“消除阻断后恢复可用”的回合推进逻辑。

---

## 3. 测试与验证报告

### 3.1 单元测试与类型检查
执行静态代码检查和类型推断，全线无 TS 警告/未使用变量阻断：
```bash
npm run typecheck
# => tsc --noEmit: 0 errors
```

执行 Vitest 单元集成测试：
```bash
npm run test
# => Test Files  42 passed (42)
# => Tests       870 passed (870)
# => Duration    12.72s (单元与集成测试全量通过)
```

---

## 4. 归档文件与修改清单

修改涉及以下核心源文件：

| 修改目录与文件 | 变更核心逻辑 |
| --- | --- |
| `03_Web_Rebuild/src/App.tsx` | 将 `<TopHUD />` 重新包裹进 `mobile-landscape-scale` 缩放容器中，解决缩放偏离问题 |
| `03_Web_Rebuild/src/components/TopHUD.tsx` | 移除文明等级卡片；重构稳定度详情去除人口；新增威慑度详情下拉框展示军力和执剑人 |
| `03_Web_Rebuild/src/components/Tutorial.tsx` | 使用带 `rx="8"` 圆角的 SVG 蒙版视觉剪裁，搭配 4 个透明点击拦截层，解决遮罩生硬感 |
| `03_Web_Rebuild/src/components/MuseumGallery.tsx` | 岁月史书画廊新增第四个 Tab 渲染双轨时间轴命运对比面板 |
| `03_Web_Rebuild/src/core/Game.ts` | 修改 `getTurnBlockers` 去除非关键的手动模式下一回合阻断 |
| `03_Web_Rebuild/src/test/scenarios/TutorialRemedy.scenario.test.tsx` | 调整断言匹配隐藏后的文明等级，更新阻断测试用例的触发源 |
| `03_Web_Rebuild/src/test/scenarios/_registry.md` | 更新场景表登记，新增 SCEN-TIMELINE-COMPARE 测试描述，更新 HUD 描述 |
