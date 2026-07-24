# Audit / 新手教程实现审计（用户原始结论）

> 日期：2026-07-21 触发，2026-07-24 归档
> 审计基线：main 分支源码、教程历史修复记录及自动化测试
> 审计性质：静态审计（不包含动态运行时埋点）
> 审计触发会话：session 6a62bc3ef41301e8ce7b0321

## 0. 审计范围与方法

本次审计针对《光锥之外》新手教程（Tutorial）子系统的实现质量进行静态审计，覆盖：

- `src/components/Tutorial.tsx`（教程主组件，680 行）
- `src/components/StoryModal.tsx`（故事弹窗，与教程耦合）
- `src/ui/StarMapRenderer.ts`（星图渲染，命中与坐标）
- `src/components/StarMap.tsx`（星图容器）
- `src/App.tsx`（教程启动入口、onComplete 回调链）
- `src/test/e2e-playwright/tutorial-*.spec.ts`（E2E 测试覆盖）
- `src/test/scenarios/TutorialRemedy.scenario.test.tsx`（场景测试）

审计方法：源码静态阅读 + 历史修复记录回溯 + 测试用例覆盖度比对 + 跨文件依赖追踪。

## 1. 总体结论

当前教程并不是简单的"还有几个按钮失效"，而是存在一个更系统性的问题：**测试中的流程已经跑通，但真实玩家的点击、缩放、弹窗和状态变化并没有被测试覆盖**。教程的核心问题不是内容太长，而是：

1. 坐标系统不统一
2. 教程通过旁路事件绕过真实交互
3. 测试同样绕过真实交互
4. 启动/提示/任务清单依赖共享布尔状态和延迟副作用
5. 目标丢失时缺少恢复路径

## 2. P0 级流程故障

### P0-1 移动端横屏坐标存在双重错位

- **现象**：移动端横屏（`max-height: 500px` + `orientation: landscape`）下，`.mobile-landscape-scale` 类对根容器施加 `transform: scale(0.85)`，导致 DOM 元素与 Canvas 星球坐标双重错位。
- **DOM 错位**：DOM 元素的 `getBoundingClientRect()` 返回的是缩放后的视口坐标，但教程高亮框计算时未除以缩放系数，导致高亮框中心与目标元素中心偏差超过 4px。
- **Canvas 错位**：`StarMapRenderer` 的 `getStarScreenCoords()` 返回的是 Canvas 内部坐标，未转换为视口坐标，导致地球点击命中区域偏移。
- **影响**：教程步骤 1（点击地球）在移动端横屏下命中率显著降低，玩家点击高亮框内位置但未触发选中。

### P0-2 地球"自动居中"公式不正确

- **现象**：`focusOnStar()` 在缩放容器内计算居中位置时使用了未考虑 transform-origin 的公式，导致地球居中到屏幕中央偏移。
- **根因**：`focusOnStar` 假设视口与 Canvas 1:1 映射，但 `transform: scale(0.85)` 改变了实际渲染尺寸。
- **影响**：教程步骤 1 启动时地球未真正居中，玩家在银河系区域可能完全看不到地球。

### P0-3 星图真实命中区域异常巨大

- **现象**：`StarMapRenderer` 的星球命中算法使用 `visualRadius + 100px` 作为命中半径，导致地球的命中区域为 `60 + 100 = 160px`（应为约 60px）。
- **根因**：历史修复中为提升移动端点击体验而过度放宽命中区，但未区分教程步骤与常规游戏。
- **影响**：玩家在教程步骤 1 中可能误触其他星球，或在常规游戏中误选地球周边目标。

### P0-4 所谓 E2E 测试没有真正执行教程

- **现象**：`tutorial-guided.spec.ts` 等 E2E 测试使用 `page.evaluate()` 直接派发 `star-selected` 事件、直接修改 `GameInstance` 状态，而非模拟真实用户点击。
- **影响**：测试通过但未覆盖真实交互链路（坐标转换、命中检测、React 事件传播），导致 P0-1/P0-2/P0-3 在 CI 中未被发现。
- **根因**：测试编写者为绕过坐标系统问题而采用旁路方式，但未在注释中标记此为临时方案。

## 3. 流程架构问题

### 3.1 教程启动依赖延迟副作用

- **现象**：教程启动依赖 `setTimeout(..., 500)` 延迟副作用等待 StarMapRenderer 挂载，而非明确的挂载完成信号。
- **影响**：在低端设备上 500ms 可能不足以完成 Canvas 初始化，导致 `focusOnStar` 调用失败。

### 3.2 目标缺失时会直接锁死整屏

- **现象**：当步骤配置了 `highlightTarget` 但目标元素未渲染时，教程渲染全屏拦截遮罩（`pointer-events-auto`），玩家无法操作游戏 UI。
- **影响**：若目标元素因状态切换延迟挂载（如 `right-inspector` 在 `star-selected` 派发后才渲染），玩家被锁屏直到超时。

### 3.3 教程依赖轮询可变单例状态

- **现象**：`Tutorial.tsx` 通过 `setInterval(checkCondition, 300)` 轮询 `GameInstance` 状态判断步骤完成，而非监听语义事件。
- **影响**：
  - 轮询消耗 CPU（移动端掉帧）
  - 300ms 延迟导致步骤完成反馈滞后
  - 状态变化若未派发 `game-state-changed` 事件，轮询是唯一兜底，但容易被遗漏

### 3.4 三套新手系统会互相竞争

- **现象**：三套新手引导系统（Tutorial / BeginnerTasks / ContextualTips）共享 `game-tutorial-seen` 布尔状态，且各自有独立的副作用管理。
- **影响**：
  - Tutorial 完成后 `game-tutorial-seen=true` 触发 BeginnerTasks 显示，但两者无明确交接
  - ContextualTips 的 Toast 可能与 Tutorial 卡片在视觉上冲突
  - 状态管理分散，难以追踪教程流程的全貌

## 4. 推荐优化方案

按依赖关系与风险等级排序，推荐分三阶段推进：

### 第一阶段：先修复所有 P0 流程故障（坐标几何 + 真实 E2E）

- 统一坐标转换层（`canvasToViewport` / `viewportToCanvas`）
- 修复 `focusOnStar` 居中公式
- 重设计星球命中算法
- 重写 E2E 测试为真实用户交互
- 修复目标缺失时锁屏问题

### 第二阶段：改造成明确的教程状态机

- 抽出 `tutorialMachine` / `tutorialSteps` / `tutorialGeometry` 三模块
- 引入 `SemanticTutorialEvent` 枚举替代字符串 stepId 分支
- 目标缺失超时恢复（3s + Toast 提示）
- 启动副作用去 500ms 延迟（改为明确挂载信号或保留 welcome 1.5s 仪式感）

### 第三阶段：重新组织新手体验

- 序幕明确按钮（已有「重新构想 (开启引导)」/「自由探索 (跳过引导)」双入口）
- 步骤文案/成本提示（build-stope/resource-production/start-research 显示资源/AP 消耗）
- TutorialProgress 版本化（教程改版后老玩家重新触发）
- 三套新手系统语义分离（Tutorial 线性序章 / MissionLog 纪元任务链 / ContextualTips 智脑 Toast）

## 5. 最终判断

当前教程的核心问题不是内容太长，而是：

- **坐标系统不统一**：DOM 与 Canvas 各自为政，移动端横屏缩放未纳入计算
- **教程通过旁路事件绕过真实交互**：`page.evaluate` 直接修改状态，测试通过但未覆盖真实链路
- **测试同样绕过真实交互**：与教程实现同源问题
- **启动/提示/任务清单依赖共享布尔状态和延迟副作用**：`game-tutorial-seen` 单一布尔值无法区分版本，500ms 延迟不可靠
- **目标丢失时缺少恢复路径**：目标元素未渲染时锁屏，无超时跳过机制

## 6. 关联文档

- 审计研究文档：`AUDIT_20260721_TUTORIAL_SYSTEM_RESEARCH.md`
- 重设计规范：`SPEC_20260721_TUTORIAL_REDESIGN.md`
- 实现审查文档：`AUDIT_20260721_TUTORIAL_IMPLEMENTATION_REVIEW.md`
- 三阶段执行报告：`EXEC_20260724_TUTORIAL_THREE_PHASE_REFACTOR.md`
- 发布说明：`RELEASE_20260724_TUTORIAL_STATE_MACHINE_REFACTOR.md`
