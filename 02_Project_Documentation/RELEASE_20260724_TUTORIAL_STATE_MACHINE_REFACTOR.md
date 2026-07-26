# Release / 新手教程状态机重构与坐标统一发布说明

> 日期：2026-07-24
> 版本基线：v1.0.5 / Released
> 发布状态：本地编译与门禁测试通过，1070 单元测试 + 24 E2E 测试全部通过
> 审计依据：AUDIT_20260721_TUTORIAL_IMPLEMENTATION_REVIEW / AUDIT_20260724_TUTORIAL_IMPLEMENTATION_REVIEW_RAW
> 执行报告：EXEC_20260724_TUTORIAL_THREE_PHASE_REFACTOR

## 1. 发布目标

本次发布按审计推荐顺序完成新手教程三阶段重构，系统性解决五大架构问题：

1. **坐标系统不统一** — DOM 与 Canvas 各自为政，移动端横屏缩放未纳入计算
2. **教程通过旁路事件绕过真实交互** — `page.evaluate` 直接修改状态，测试通过但未覆盖真实链路
3. **测试同样绕过真实交互** — 与教程实现同源问题
4. **启动/提示/任务清单依赖共享布尔状态和延迟副作用** — `game-tutorial-seen` 单一布尔值无法区分版本，500ms 延迟不可靠
5. **目标丢失时缺少恢复路径** — 目标元素未渲染时锁屏，无超时跳过机制

---

## 2. 玩家可见变化

### 新手教程

- **横屏不再找不到地球**：移动端横屏 0.85 缩放下，教程高亮框中心与目标元素中心误差从超过 10px 降至 ≤ 4px，点击高亮框内任意位置都能选中地球。
- **目标丢失不再锁屏**：教程步骤的目标元素因状态切换延迟挂载时，不再渲染全屏拦截遮罩，玩家可继续操作游戏 UI；目标挂载后自动恢复高亮。
- **步骤成本透明化**：建造采矿场、调整劳力比例、启动科技研究三个步骤的描述下方显示资源/AP 消耗（30 经济 / 10 AP / 20 AP），玩家决策更有依据。
- **教程改版后老玩家重新触发**：教程进度记录升级为版本化结构，教程内容重大改版时老玩家会自动重新触发新版教程（旧版记录自动迁移为 legacy）。

### 智脑警告 Toast

- **目标缺失超时自动跳过**：教程步骤目标元素连续缺失超过 3 秒时，智脑会派发警告 Toast 并自动跳过当前步骤，避免玩家卡死。

---

## 3. 技术交付

### 新增模块（`src/components/tutorial/`）

| 模块 | 行数 | 职责 |
|---|---|---|
| tutorialGeometry.ts | 174 | 纯函数几何计算（高亮框、4块拼接遮罩、卡片定位、指引箭头） |
| tutorialSteps.ts | 198 | 步骤配置 + SemanticTutorialEvent 枚举（8 类语义事件） |
| tutorialMachine.ts | 154 | 轻量状态机（step 索引、语义事件派发、目标缺失超时恢复） |
| tutorialProgress.ts | 120 | 版本化持久化（{version, completedAt} 结构 + 旧版迁移） |

### P0 流程故障修复

| 审计编号 | 问题 | 修复方案 |
|---|---|---|
| P0-1 | 移动端横屏坐标双重错位 | 建立唯一坐标转换层 `canvasToViewport` / `viewportToCanvas` |
| P0-2 | focusOnStar 居中公式不正确 | 修正公式，纳入 `transform: scale(0.85)` 缩放系数 |
| P0-3 | 星图命中区域异常巨大 | 重设计命中算法为 `Math.max(visualRadius * 4 + 100, 44)` |
| P0-4 | E2E 测试绕过真实交互 | 重写测试为真实用户点击/拖动 |
| 3.2 | 目标缺失锁屏 | 渲染 `tutorial-overlay-missing`（pointer-events-none）替代全屏拦截 |

### 架构改进

- **语义事件驱动**：`SemanticTutorialEvent` 枚举（8 类）替代字符串 stepId 分支，步骤完成条件声明式配置
- **状态机内部管理定时器**：welcome 1.5s 自动过渡定时器由状态机内部管理，避免 React effect 重跑导致重入
- **目标缺失超时恢复**：连续缺失超过 3000ms 触发 `onTargetMissing` 回调，派发 Toast 并自动跳过
- **进度版本化**：`TUTORIAL_PROGRESS_VERSION = '2026-07-24-v1'`，教程改版时递增即可让老玩家重新触发

---

## 4. 验收与门禁测试

| 验收项 | 预期 | 状态 |
|---|---|---|
| 横屏坐标误差 ≤ 4px | 6 用例全部通过 | ✅ tutorial-coordinates.spec.ts |
| 目标缺失不锁屏 | 4 用例全部通过 | ✅ tutorial-robustness.spec.ts |
| 教程黄金路径真实交互 | 8 用例全部通过（chromium + mobile-chrome） | ✅ tutorial-guided.spec.ts |
| 教程单元 + 场景测试 | 9 项全部通过（baseline 3 失败已修复） | ✅ Tutorial.test.tsx + TutorialRemedy.scenario.test.tsx |
| 全量单元测试 | 1070 项通过 | ✅ 0 失败 |
| TypeScript 编译 | 0 错误 | ✅ 0 Errors |
| Registry 全绿 | 30 条目全部 GREEN | ✅ 0 RED |

既有 Playwright E2E 回归套件运行正常。版本号已同步升级至 `1.0.5`。

---

## 5. 关联文档

- 用户原始审计结论：`AUDIT_20260724_TUTORIAL_IMPLEMENTATION_REVIEW_RAW.md`
- 三阶段执行报告：`EXEC_20260724_TUTORIAL_THREE_PHASE_REFACTOR.md`
- 审计研究文档：`AUDIT_20260721_TUTORIAL_SYSTEM_RESEARCH.md`
- 重设计规范：`SPEC_20260721_TUTORIAL_REDESIGN.md`
- 场景注册表：`03_Web_Rebuild/src/test/scenarios/_registry.md`（新增 6 条目，24→30）
- 项目健康仪表盘：`03_Web_Rebuild/src/test/scenarios/_health.md`（新增"教程模块化与状态机"维度）
