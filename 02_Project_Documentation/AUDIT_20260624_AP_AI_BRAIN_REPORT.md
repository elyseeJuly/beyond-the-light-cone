# Beyond-the-Light-Cone 任务执行报告：TASK-AP AP 指令点 + AI 智脑

**日期**: 2026-06-24  
**任务**: TASK-AP: AP 指令点 + AI 智脑 (Action Points & AI Brain Automation)  
**来源**: [02_Project_Documentation/EXEC_20260623_AP_AI_BRAIN_IMPLEMENTATION.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260623_AP_AI_BRAIN_IMPLEMENTATION.md)

---

## 执行摘要

按任务文档要求，新增 AP（执政指令点）资源系统与 AI 智脑托管机制。所有微操操作消耗 AP；回合开始恢复 AP（基础值+部门首长加成+文化加成）。AI 智脑开启时自动处理科研目标选择、工种比例调整、部门首长任命；手动模式下未处理阻断事务时无法推进回合。存档版本升级至 v4 并提供迁移脚本。TopHUD 显示 AP 状态与 AI 智脑开关。

---

## 完成标准核对

- [x] `EarthCivilization` 新增 `apMax`、`apCurrent`、`isAiBrainEnabled` 字段
- [x] AP 回合恢复机制：基础 30 + 每有首长部门 +5 + 文化值/100
- [x] AP 消耗机制：`spendAP()` 带余额检查与 AI 模式半价折扣
- [x] `setResearchTarget()` 消耗 20 AP；`adjustWorkerRatio()` 消耗 10 AP
- [x] `runAIBrain()` 自动选择最优科研、调整工种比例、补全首长空缺
- [x] `getTurnBlockers()` 手动模式下检测科研停滞、首长空缺、资源崩盘
- [x] 手动模式下存在阻断器时禁止推进回合
- [x] SaveManager 版本升级至 v4，添加 v3→v4 迁移脚本
- [x] EventSystem `applyNewEffects` 支持 `spend_ap` 效果类型
- [x] TopHUD 显示 AP 数值（紫色高亮），低 AP 时变红警告
- [x] TopHUD 添加 AI 智脑切换按钮，开启时青色高亮
- [x] 下一回合按钮在手动模式有阻断器时禁用并提示原因
- [x] AP 变动与 AI 切换时分发事件通知 UI 更新
- [x] TypeScript 类型检查 0 错误
- [x] 核心单元测试 691/691 全部通过，无回归
- [x] 生产构建成功

---

## 修改文件清单

| 文件 | 变更内容 |
|------|----------|
| `src/core/EarthCivilization.ts` | 新增 AP 字段（`apMax`/`apCurrent`/`isAiBrainEnabled`）；新增 `ratioLocks`、`miningRatio`/`factoryRatio`/`cultureRatio` 字段；实现 `recoverAP()`、`spendAP()`、`canSpendAP()`、`getDepartmentBonus()`、`setResearchTarget()`、`adjustWorkerRatio()`、`isResearchIdle()`、`pickBestResearch()`、`autoAssignMinisters()`；`runARound()` 中调用 `recoverAP()` 与 ratioLocks 衰减；AP 变动时分发 `ap-changed` 事件 |
| `src/core/Game.ts` | 实现 `runAIBrain()`：AI 托管模式下自动选择科研、调整采矿/工厂比例、补全部门首长，每项操作消耗 AP 并写入 ticker 消息；实现 `getTurnBlockers()`：检测科研停滞、首长空缺、资源崩盘/经济危机；`runARound()` 手动模式检查阻断器并分发 `turn-blocked` 事件，AI 模式先执行 `runAIBrain()` |
| `src/core/SaveManager.ts` | `SAVE_VERSION` 升级至 4；注册 v3→v4 迁移脚本，为旧存档补全 `apMax`（100）、`apCurrent`（100）、`isAiBrainEnabled`（true）默认值 |
| `src/types/narrative.ts` | `EventChoice` 接口新增可选 `apCost` 字段（此前 TASK-EVENT 已添加 `EventEffectDef` 支持） |
| `src/core/subsystems/EventSystem.ts` | `applyNewEffects()` 新增 `spend_ap` 效果类型支持；补全此前丢失的实体化效果处理（`spawn_barback`/`lock_ratio`/`rush_tech`/`build_infrastructure`/`diplomacy`/`unlock_person`/`flag`/`resource`/`event_effect`）；新增 `parseTecTreeType()` 解析中英文科技树类型名称；修复字符串引号转义问题 |
| `src/components/TopHUD.tsx` | 引入 `Brain`、`Zap` 图标；新增 AP 状态显示区块（紫色样式，AP<20 变红）；新增 AI 智脑切换按钮（开启时青色高亮，点击切换 `isAiBrainEnabled` 并分发事件）；下一回合按钮新增手动模式阻断器禁用逻辑，tooltip 显示阻断原因；添加事件监听器（`game-turn-complete`/`game-state-changed`/`ap-changed`/`ai-brain-toggled`）触发 UI 刷新 |
| `src/test/setup.ts` | localStorage mock 从空操作升级为内存存储实现，支持 setItem/getItem/removeItem/clear，修复存档测试依赖 |
| `src/test/core/SaveManager.test.ts` | 更新版本号断言从 3 改为 4；版本不匹配测试使用版本号 5；所有直接操作 localStorage 的测试添加 `SaveManager.resetCache()` 以强制从存储读取；更新版本号字段为 4 |
| `src/test/core/EdgeCases.test.ts` | 修复"缺失可选字段"测试，不再直接 Object.assign 覆盖 earthCivi 对象（导致丢失原型方法），改为逐个设置属性 |

---

## 核心机制说明

### AP 资源系统

| 属性 | 初始值 | 说明 |
|------|--------|------|
| `apMax` | 100 | AP 上限 |
| `apCurrent` | 100 | 当前可用 AP |

**恢复公式**（每回合开始时）：
```
恢复量 = 30（基础） + 部门首长数×5 + floor(文化/100)
恢复后不超过 apMax
```

**AP 消耗规则**：
- 设置科研目标：20 AP
- 调整工种比例：10 AP（每次 +/- 10%）
- AI 智脑操作：消耗减半（spendAP 中 AI 模式乘以 0.5）
- AP 不足且手动模式下：阻止操作并分发 `ap-insufficient` 事件

### AI 智脑托管

开启时（默认开启），每回合开始前自动执行：
1. **科研自动选择**：若有空闲科技树且 AP≥10，选择成本最低的可研究科技，消耗 10 AP
2. **资源应急调整**：资源<50 且采矿比例<60% 且 AP≥5，提升采矿比例 10%（降低文化比例），消耗 5 AP
3. **经济应急调整**：经济<50 且工厂比例<50% 且 AP≥5，提升工厂比例 10%（降低文化比例），消耗 5 AP
4. **首长自动任命**：存在空缺部门且 AP≥5，自动任命能力最高的可用人物，消耗 5 AP

所有 AI 操作写入 ticker 滚动消息，格式为 `🤖 [AI智脑] 操作描述`。

### 回合阻断器（手动模式）

关闭 AI 智脑后，存在以下情况时无法推进回合：
1. **科研停滞**：至少一个科技树未设置研究目标
2. **首长空缺**：任何部门尚未任命负责人（提示第一个空缺部门）
3. **资源崩盘**：资源储备 ≤ 10
4. **经济危机**：经济产出 ≤ 10

阻断时按钮显示"有阻断"，hover 显示第一条阻断原因，并分发 `turn-blocked` 事件。

### 存档迁移

v3 → v4 自动补全字段：
- `earthCivi.apMax`：默认 100
- `earthCivi.apCurrent`：默认 100
- `earthCivi.isAiBrainEnabled`：默认 true（AI 托管开启，保证旧存档兼容性）

---

## 验证结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 类型检查 | `npm run typecheck` | 0 错误 |
| 核心单元测试 | `npm run test:core` | 691/691 通过 |
| 生产构建 | `npm run build` | 构建成功 |

---

## 归档位置

- 任务报告: `02_Project_Documentation/AUDIT_20260624_AP_AI_BRAIN_REPORT.md`（本文件）
