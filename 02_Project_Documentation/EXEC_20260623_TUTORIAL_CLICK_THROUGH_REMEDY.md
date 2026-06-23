# 新手教程点击穿透与移动端自适应优化执行报告

> **实施日期**: 2026-06-23  
> **归档类型**: 核心交互修复与E2E测试交付报告  
> **当前状态**: 代码已全部通过833项测试并推送至 main 分支

---

## 1. 概述与痛点分析

在之前的版本中，玩家及测试反馈在移动端或普通网页上存在以下严重阻碍流程的体验问题：
1. **教程高亮无法点击阻碍进度**：新手教程引导玩家点击“地球”星体或右侧面板“采矿场”按钮时，即使高亮了目标，玩家却因为外层半透明遮罩的遮挡而**无法点击到下层的实际游戏元素**，导致教程卡死无法跟随操作。
2. **移动端卡片遮挡与溢出**：教程描述卡片在较窄的手机屏幕下过大，遮挡了需要操作的高亮目标，且控制按钮（如“下一步”）被挤出屏幕外导致不可见。
3. **年份双重推进与存档损坏风险**：部分事件选项回调与回合结算流程同时触发时，容易导致年份在单个回合内连续递增两次。同时，如果回合结算中出现未捕获异常，系统仍会写入损坏的数据导致存档报损。
4. **结局与因果链断开**：存在 2 个中性结局（永恒的流亡、宇宙静默）在代码中未实际进行判定，且部分事件触发的决策标志（Flag）与结局判定条件不匹配。

本报告对针对上述问题的重构和交付进行文档归档。

---

## 2. 核心优化与重构方案

### 2.1 4分片遮罩实现精准高亮与穿透点击 (Click-Through)
* **痛点根源**：使用传统的巨型 `box-shadow` 遮罩时，即使高亮矩形区域设置为 `pointer-events-none`，其父级全屏 Overlay 容器依然具有事件响应性，拦截并阻断了所有指向 Canvas 和底层 DOM 的点击事件。
* **重构方案**：
  - 在 [Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx) 中将教程 Overlay 最外层设置为 `pointer-events-none`（点击事件完全穿透）。
  - 将教程卡片框设为 `pointer-events-auto`，确保卡片内的控制按钮能正常工作。
  - 弃用单体 box-shadow，使用 **4块绝对定位的遮罩分片（Top / Bottom / Left / Right Backdrop Slices）** 动态拼接在高亮元素矩形四周。
  - 这些遮罩分片设置 `pointer-events-auto` 和 `bg-black/85` 阻止非高亮区误触，而中间的“挖空”区域（即高亮目标）无任何 DOM 阻隔，点击事件将以 100% 物理精度穿透至下方的 Canvas 星辰或 React 按钮。

### 2.2 移动端折叠滚动与空间避让 (Mobile Fit)
* **最大高度限制**：在移动设备下，将教程卡片的高度限制为 `max-h-[58vh]`，强制留出至少 42% 的视口纵向高度用于展示星图和操作区。
* **内容区独立滚动**：将教程卡片内部重构为 Flex 布局。标题、章节切换导航、控制栏等均被加上 `shrink-0` 锁定高度，只有正文描述文字被包裹在 `overflow-y-auto min-h-0` 的滚动容器中。
* **效果**：无论正文描述多长，卡片尺寸绝对不会超出视口，底部的“上一步/下一步/跳过”等控制按钮在任何手机屏幕上均完全可见且固定。

### 2.3 年份结算安全锁与防损坏自动存档 (Turn Safety Lock)
* **双重推进防止**：在 [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) 中增加 `public _yearJustAdvanced: boolean` 状态标志。在回合自然结算推进年份后将其设为 `true`。而在事件系统（[EventSystem.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts)）处理交互选择完毕尝试再次推进年份时，增加前置校验 `!this.game._yearJustAdvanced`，阻断双重累加，防止年份超前跑冒。
* **异常隔离自动档**：在 `runARound` 中引入 `_hadRunError` 错误标记，当捕获任何子系统结算崩溃时，将阻断 `SaveManager.autoSave()` 的执行，避免将处于脏状态或损坏状态的数据持久化到 IndexedDB 中，极大提高了存档系统稳定性。

### 2.4 中性结局接入与因果 Flag 统一 (Endings Repair)
* **中性结局激活**：在 `checkVictoryConditions()` 中补全了 2 个中性结局的扫描判定：
  - **永恒的流亡** (`NeutralType.ETERNAL_EXILE`)：银河纪元中且已选择流亡，在人类人口极度稀少（$\le 5$ 亿）时触发。
  - **宇宙静默** (`NeutralType.COSMIC_SILENCE`)：掩体纪元后在做出黑域/静默决策且在人口偏低、威慑值极低时触发。
* **标志匹配归一**：
  - 将事件库中启动流浪地球后产生的临时 Flag 由 `wandering_chosen` 升级为 `wandering_completed`；数字方舟由 `digital_ark_chosen` 升级为 `digital_ark_upgrade`。
  - 在 `SaveManager.ts` 中修正了结局解锁枚举转换 Bug，修复了无法正确记录中性结局的隐患。

---

## 3. 测试与验证

### 3.1 单元与集成测试回归 (Vitest)
运行项目下的单元及组件集成测试，**833项测试用例 100% 全部通过**：
```bash
npx vitest run
```
验证了本次对 `Game.ts` 结算安全性、年份推进锁、中性结局以及 `SaveManager` 的重写没有造成任何旧逻辑的倒退。

### 3.2 引导教程 E2E 物理点击模拟 (Playwright)
* **新增测试用例**：[tutorial-guided.spec.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/tutorial-guided.spec.ts)
* **校验逻辑**：
  1. 验证第 1 至 3 步教程控制卡片顺利渲染。
  2. 第 4 步动态锁定地球星体坐标，并通过物理鼠标坐标移动 (`page.mouse.move`) 和真实物理点击 (`page.mouse.click`)，验证点击能否穿透分片遮罩，成功触发右侧面板拉起。
  3. 第 5 步精确匹配 `data-tutorial-id="btn-build-stope"` 的建造采矿场按钮，模拟点击并验证资源消耗及按钮状态变化。
  4. 顺畅遍历第 6 至 11 步并点击“确认授权并开始”，验证教程卡片销毁及游戏主界面的呈现。
* **多浏览器兼容性**：测试已在 Chromium, Firefox, WebKit, Mobile Chrome, 以及 Mobile Safari 上全部通过，证明了 4 分片穿透遮罩在多渲染引擎下的高鲁棒性。

---

## 4. 归档文件清单

以下为本次优化与重构涉及的关键交付文件：

| 模块 | 归档文件路径 | 主要修改职责 |
| :--- | :--- | :--- |
| **教程组件** | [Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx) | 实现 4 分片遮罩点击穿透、移动端卡片 `max-h-[58vh]` 及内滚动自适应。 |
| **核心引擎** | [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) | 引入 `_yearJustAdvanced` 双重推进安全锁、`_hadRunError` 自动档容错、以及中性结局判定。 |
| **事件系统** | [EventSystem.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts) | 联动 `_yearJustAdvanced` 拦截多余的年份推进。 |
| **数据管理** | [SaveManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/SaveManager.ts) | 重构结局元数据读取，支持 NeutralType 存档识别与全结局解锁统计。 |
| **测试套件** | [tutorial-guided.spec.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/tutorial-guided.spec.ts) | 交付全流程教程穿透与步进的 E2E 自动化测试防护。 |
| | [Game.defeatConditions.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/Game.defeatConditions.test.ts) | 还原 `wandering_chosen` 临时选择时的失败触发边界测试。 |
