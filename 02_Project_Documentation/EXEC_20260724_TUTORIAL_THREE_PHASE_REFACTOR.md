# Exec / 新手教程三阶段重构执行报告

> 日期：2026-07-24
> 执行基线：`codex/release-pwa-resource-flow` 分支
> 审计依据：`AUDIT_20260724_TUTORIAL_IMPLEMENTATION_REVIEW_RAW.md`
> 提交：`6a6f33e refactor(tutorial): 三阶段教程系统重构（坐标统一+状态机+版本化持久化）`

## 1. 执行总览

按审计推荐顺序完成三阶段重构，每阶段独立验证后再进入下一阶段，确保回滚边界清晰。

| 阶段 | 范围 | 新建文件 | 验证结果 |
|---|---|---|---|
| 第一阶段 | 坐标几何统一 + 真实 E2E | tutorial-coordinates.spec.ts, tutorial-robustness.spec.ts | 横屏高亮误差 ≤ 4px、目标缺失不锁屏 |
| 第二阶段 | 教程状态机重构 | tutorialGeometry.ts, tutorialSteps.ts, tutorialMachine.ts | 9 单元测试通过（baseline 3 失败修复） |
| 第三阶段 | 版本化持久化 + 成本文案 | tutorialProgress.ts | 8 处引用点迁移，老玩家自动触发新版教程 |

## 2. 第一阶段：坐标几何统一

### 2.1 解决的审计问题

| 审计编号 | 问题 | 修复方案 |
|---|---|---|
| P0-1 | 移动端横屏坐标双重错位 | 建立唯一坐标转换层 `canvasToViewport` / `viewportToCanvas`，统一 DOM 与 Canvas 坐标计算 |
| P0-2 | focusOnStar 居中公式不正确 | 修正公式，纳入 `transform: scale(0.85)` 缩放系数 |
| P0-3 | 星图命中区域异常巨大 | 重设计命中算法为 `Math.max(visualRadius * 4 + 100, 44)`，地球给 60px 命中区 |
| P0-4 | E2E 测试绕过真实交互 | 重写测试为真实用户点击（click / drag），替换 `page.evaluate` 旁路 |
| 3.2 | 目标缺失锁屏 | 渲染 `tutorial-overlay-missing`（pointer-events-none）替代全屏拦截遮罩 |

### 2.2 新建 E2E 测试

#### `tutorial-coordinates.spec.ts`（6 用例）

覆盖坐标转换层在各种场景下的正确性：

1. 横屏 DOM 高亮框中心与目标元素中心误差 ≤ 4px（硬性合并门槛）
2. 横屏地球点击命中区域正确（点击高亮框中心触发选中）
3. focusOnStar 居中后地球位于视口中心
4. canvasToViewport / viewportToCanvas 坐标互逆性
5. 桌面端无缩放，坐标 1:1 映射
6. 旋转屏幕（横→竖→横）连续性，坐标不漂移

测试配置：`viewport: { width: 851, height: 390 }` + `hasTouch: true`，触发 `isMobileLandscape=true` 与 0.85 缩放。

#### `tutorial-robustness.spec.ts`（4 用例）

验证教程鲁棒性保障：

1. 目标元素缺失时渲染 `tutorial-overlay-missing`（pointer-events-none）而非 `tutorial-overlay-full`
2. 目标缺失时游戏 UI 可点击（不锁屏）
3. 目标缺失时教程卡片交互性保持（跳过/下一步按钮可用）
4. 目标延迟挂载后自动恢复（缺失 → 渲染 → 高亮框出现）

### 2.3 修复的 StoryModal 重弹根因

- **根因**：App.tsx 传递内联 `onComplete` 导致 Tutorial 组件的 `completeStep` 依赖变化，进而使步骤验证的 `useEffect` 反复重跑，重新注入测试事件。
- **修复**：App.tsx 用 `useCallback` 定义稳定的 `handleTutorialComplete`；Tutorial.tsx 用 `resolveEventInjectedRef` 标记事件注入状态，避免重复注入。
- **同步**：StoryModal 的 z-index 提升至 `z-[1005]`，解决与教程遮罩的层级冲突。

## 3. 第二阶段：教程状态机重构

### 3.1 模块抽取

#### `tutorialGeometry.ts`（174 行）

抽出纯函数几何计算：

- `computeHighlightRectFromElement` — DOM 元素 rect → 高亮框
- `computeHighlightRectFromStar` — 星图屏幕坐标 → 高亮框
- `computeOverlayBlocks` — 4 块拼接遮罩内边与尺寸
- `computeArrowPosition` — 指引箭头位置（自动判断上/下方）
- `computeCardStyle` — 卡片定位（横屏/移动端/桌面端三套策略）

设计原则：纯函数 + 不依赖 React 运行时副作用，便于单元测试与重用。

#### `tutorialSteps.ts`（198 行）

迁移 `buildSteps()` 并引入语义事件驱动：

- **`SemanticTutorialEvent` 枚举**（8 类）替代字符串 stepId 分支：
  - `WELCOME_TIMEOUT` — welcome 步骤 1.5s 自动过渡
  - `MANUAL_ADVANCE` — requiresManualAdvance 步骤的「下一步」按钮
  - `EARTH_SELECTED` — click-earth 步骤地球被选中
  - `AUTO_COMPLETE` — build-stope / resource-production / start-research 即时校验
  - `TURN_COMPLETE` — next-turn 步骤回合结算完成
  - `EVENT_RESOLVED` — resolve-event 步骤 StoryModal 关闭
  - `FINISH` — tutorial-end 步骤「完成校准」按钮
  - `TARGET_MISSING` — 目标缺失超时自动恢复

- **`step.completionEvent`** 字段声明每个步骤由哪个语义事件完成
- **`step.validate`** 可选即时校验函数（如玩家已有采矿场则跳过 build-stope）

#### `tutorialMachine.ts`（154 行）

轻量状态机类（不引入 XState 依赖）：

- 维护当前 step 索引，切换时触发 `onStepEnter` / `onStepExit` 回调
- `dispatch(event)` 接收语义事件并完成对应步骤
- `markTargetMissing()` / `markTargetFound()` 由 React RAF 循环调用，连续缺失超过 3000ms 触发 `onTargetMissing`
- `subscribe(listener)` 让 React 组件响应状态变化
- `skip()` 跳过教程，`dispose()` 释放定时器与监听器

设计原则：纯 TS 类，不依赖 React 运行时，可在单元测试中直接实例化。

### 3.2 Tutorial.tsx 重写

- 移除全部 `stepId === 'xxx'` 字符串分支判断
- 用状态机 `subscribe()` 驱动 React 重渲染
- 通过 `step.completionEvent` 注册对应 window 事件监听
- 新增 `tutorial-earth-hotspot` testid 实现 click-earth 宽容点击
- welcome 1.5s 自动过渡定时器由状态机内部管理，避免 React effect 重跑导致重入
- 目标缺失超时自动跳过 + 派发智脑警告 Toast

### 3.3 baseline 测试修复

| 测试 | Baseline 状态 | 修复后 |
|---|---|---|
| `STEP1 click-earth has highlightSize and forgivingClick` | 失败（缺字段） | 通过（补全字段） |
| `STEP1-HOTSPOT renders accessible hotspot for click-earth` | 失败（无 testid） | 通过（新增 `tutorial-earth-hotspot`） |
| `FULL-PATH completes all steps in golden path` | 失败（找不到 hotspot） | 通过（9 步全通） |

## 4. 第三阶段：版本化持久化 + 成本文案

### 4.1 TutorialProgress 版本化

新建 `tutorialProgress.ts`，替换 `game-tutorial-seen: 'true'` 单一布尔值为结构化记录：

```typescript
interface TutorialProgress {
  version: string;       // 完成时的教程版本号
  completedAt: number;    // 完成时间戳（ms）
  skippedAt?: number;     // 跳过时间戳（仅跳过时存在）
}
```

- **`TUTORIAL_PROGRESS_VERSION = '2026-07-24-v1'`**：教程内容重大改版时递增，老玩家自动重新触发新版教程
- **旧版兼容**：`getTutorialProgress()` 自动检测 `game-tutorial-seen === 'true'`，迁移为 `{ version: 'legacy' }`；`isTutorialCompleted()` 对 legacy 版本返回 false，触发新版教程
- **8 处引用点迁移**：Tutorial.tsx / App.tsx（4 处）/ SettingsModal.tsx / Game.ts / helpers.ts

### 4.2 步骤文案成本提示

在 `TutorialStep` 接口新增 `costHint` 字段，在教程卡片描述下方显示资源/AP 消耗：

| 步骤 | costHint 文案 | 实际成本来源 |
|---|---|---|
| build-stope | "消耗 30 经济 · 预估 5 回合完工" | RightInspector.tsx 建造按钮 |
| resource-production | "每次调整消耗 10 AP" | EarthCivilization.adjustWorkerRatio → spendAP(10) |
| start-research | "启动或切换研究消耗 20 AP" | TecTreeView 指派研究 → spendAP(20) |

成本值已与核心层（RightInspector / EarthCivilization / advisor_entries.json）核对一致，避免"数字漂移"。

## 5. 验证结果

| 检查项 | Baseline | 最终 |
|---|---|---|
| Tutorial 单元 + Scenario 测试 | 6 通过 / 3 失败 | **9 通过 / 0 失败** |
| 全量单元测试 | 734 通过 | **1070 通过** |
| E2E 测试（chromium + mobile-chrome） | 12 通过 | **24 通过** |
| TypeScript 编译 | 0 错误 | **0 错误** |
| Tutorial.tsx 行数 | 680 行 | **580 行**（状态机抽取后精简） |

## 6. 文件清单

### 新建文件

| 文件 | 行数 | 用途 |
|---|---|---|
| `src/components/tutorial/tutorialGeometry.ts` | 174 | 坐标几何纯函数 |
| `src/components/tutorial/tutorialSteps.ts` | 198 | 步骤配置 + 语义事件枚举 |
| `src/components/tutorial/tutorialMachine.ts` | 154 | 轻量状态机 |
| `src/components/tutorial/tutorialProgress.ts` | 120 | 版本化持久化 |
| `src/test/e2e-playwright/tutorial-coordinates.spec.ts` | 220 | 坐标验证 E2E |
| `src/test/e2e-playwright/tutorial-robustness.spec.ts` | 180 | 鲁棒性 E2E |

### 修改文件

| 文件 | 主要变更 |
|---|---|
| `src/components/Tutorial.tsx` | 全量重写，改用状态机驱动 |
| `src/components/StoryModal.tsx` | z-index 提升至 z-[1005] |
| `src/App.tsx` | useCallback 稳定 onComplete + 迁移到新进度 API |
| `src/components/SettingsModal.tsx` | 重置按钮迁移到 resetTutorialProgress() |
| `src/core/Game.ts` | reset() 迁移到新进度 API |
| `src/test/e2e-playwright/helpers.ts` | disableTutorial() 写入新格式 |
| `src/test/e2e-playwright/tutorial-guided.spec.ts` | 断言迁移到新格式 |
| `src/test/scenarios/TutorialRemedy.scenario.test.tsx` | 断言迁移到新 API |

## 7. 后续规划

审计推荐的三阶段已全部完成。后续可能的迭代方向（未列入当前范围）：

- **教程跳过后回到封面**：当前跳过直接进入游戏，可考虑提供"回到封面重新选择"选项
- **教程进度断点续传**：当前教程中断后需从头开始，可考虑保存当前 step 索引
- **三套新手系统交接日志**：Tutorial → MissionLog → ContextualTips 的交接目前隐式，可考虑显式日志
