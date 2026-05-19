# 宇宙群英传 0519审计优化迭代执行报告 v2

> 日期：2026-05-19  
> 基于：`02_Project_Documentation/AUDIT_20260519_TEST_EVENT_TUTORIAL_HANDOFF.md`  
> 范围：测试框架、事件系统、新手教程、Lore模式、战斗/舰队修正、胜利条件、CI流水线  
> 状态：EXECUTED (v2 - 完整迭代)

---

## 执行概览

| 指标 | v1 (首批) | v2 (当前) |
|------|-----------|-----------|
| 修改文件数 | 15 | 19 |
| 新增文件数 | 7 | 10 |
| 测试文件总数 | 11 | 12 |
| 测试用例总数 | 242 | 246 |
| TypeScript 编译 | 通过，零错误 | 通过，零错误 |
| 所有测试 | 242 个全部通过 | 246 个全部通过 |

---

## v2 新增优化项 (基于审计待后续执行项)

### F1. 威慑胜利条件强化
**文件**: `src/core/Game.ts` L298-303  
**变更**: 威慑胜利在 `population > 0` 基础之上，新增 `deterrenceValue >= 80` 约束。
```ts
check: () => {
  return this.epoch >= EpochType.DETERRENCE &&
         this.earthCivi.swordholder !== null &&
         this.earthCivi.population > 0 &&
         this.earthCivi.deterrenceValue >= 80;  // 新增
}
```

### F2. 太阳氦闪 → 二向箔打击 (不可达条件修复)
**文件**: `src/core/Game.ts` L351-360  
**问题**: 原条件 `year > 400 && epoch < EpochType.GALAXY` 不可达 (year>=351 自动进入银河纪元)  
**修复**: 
- 改变条件为 `year > 350 && 无任何逃逸科技 && 无逃逸flag`
- 检查: `isTecFinishedAnywhere("黑域生成"/"数字方舟")` + `hasFlag("dimensional_defense"/"wandering_chosen")`
- strict_three_body 模式显示"二向箔打击"失败文案
- liu_cixin_mixed/sandbox 模式保留"太阳氦闪"原文案
```ts
if (this.year > 350 && !tm.isTecFinishedAnywhere("黑域生成") 
    && !tm.isTecFinishedAnywhere("数字方舟") 
    && !this.hasFlag("dimensional_defense") 
    && !this.hasFlag("wandering_chosen")) {
  this.gameOverReason = this.loreMode === 'strict_three_body'
    ? "二向箔打击：黑暗森林打击降临..."
    : "太阳氦闪：漫长的等待终结于刺眼的白光...";
}
```

### F3. 黑域胜利跨科技树识别
**文件**: `src/core/Game.ts` L317  
**变更**: `isTecFinished(TecTreeType.PHYSICS, "黑域生成")` → `isTecFinishedAnywhere("黑域生成")`  
**影响**: INTERSTELLAR 树中的黑域生成科技现在也能触发黑域胜利。

### F4. randomevents.json 旧格式事件补全
**文件**: `src/data/randomevents.json` L1-74  
**变更**: 前3条旧格式事件 (科技灵光一现 / 资源走私丑闻 / 面壁者提案) 补充以下字段：
- `id` (唯一标识)
- `title` (标准标题)
- `triggerCondition` (含 epoch/probability/lane/loreDomain/maxTriggers/cooldownYears)
- `dialogQueue` (替换旧 talkX 格式)

| 事件ID | lane | loreDomain | probability | maxTriggers |
|--------|------|-----------|-------------|-------------|
| random_tech_inspiration | ambient | three_body_canon | 0.03 | 2 |
| random_resource_scandal | ambient | three_body_canon | 0.02 | 2 |
| random_wallfacer_proposal | major | three_body_canon | 0.04 | 1 |

### F5. 存档加载修复 (避免 init() 重置事件)
**文件**: `src/core/Game.ts` L584-598  
**问题**: `restorePrototypes()` 无条件调用 `eventManager.init()`，重新解析 JSON 覆盖存档中的事件状态。
**修复**:
1. 仅当 `events` 数组为空时才调用 `init()`
2. 确保 Map 类型字段 (lastLaneTriggeredYear, randomEventTriggerCounts, lastTagTriggeredYear) 在 Object.assign 后仍是正确的 Map 实例
```ts
if (inst.eventManager && (!inst.eventManager.events || inst.eventManager.events.length === 0)) {
  inst.eventManager.init();
}
// Map type restoration for cadence state
if (!(inst.eventManager.lastLaneTriggeredYear instanceof Map)) { ... }
```

### F6. CI 流水线集成
**文件**: `.github/workflows/ci.yml` (新增)  
**步骤**: npm ci → typecheck → test → coverage → build  
**触发**: push/PR to main/master

### F7. 测试增强
| 新增/修改测试文件 | 用例变化 | 说明 |
|---|---|---|
| `SaveLoad.test.ts` | 4 → 5 | 新增存档版本格式验证 |
| `Tutorial.test.tsx` | 新增 (冒烟) | 组件可渲染不崩溃验证 |
| `Game.test.ts` | 67 → 69 | 新增氦闪/二向箔 + 逃逸防护测试 |

---

## v1 保留项 (阶段 A-E)

详见原始报告 `EXEC_20260519_AUDIT_OPTIMIZATION_ITERATION.md`。以下为摘要：

### 阶段 A: 测试基础设施修正
- TEST_REPORT.md 统计修正 (196/210 → 统一)
- package.json 新增 test:coverage / test:core / typecheck 脚本
- vite.config.ts coverage 配置
- SUPERSEDED 标记过期文档

### 阶段 B: 事件系统降频与元数据
- EventLane / LoreDomain / LoreMode 类型定义
- EventCadence.ts 核心节奏引擎 (normalize/isEligible/pickWeighted)
- GameEventManager cadence 状态 (lastAnyEventYear / lane cooldowns / triggerCounts)
- checkRandomEvents 重写 (0.4→0.02 默认概率, 权重抽取)
- EVENT_BUDGET 全局预算常量

### 阶段 C: 三体严格模式
- Game.loreMode 默认 strict_three_body
- isEventEligible / checkFilterConditions 均检查 loreDomain

### 阶段 D: 地球索引常量化与教程修正
- starIndices.ts (STAR_INDEX 常量)
- 4个文件硬编码修复 (RightInspector, StarManager, EarthCivilization, gameplay-analyzer)
- 舰队/派遣文案修正
- Tutorial 胜利路径修正 (流浪地球→星舰文明, 光速胜利→死神永生)

### 阶段 E: 战斗系统修复
- 0v0 战力判定 (防守方固守而非进攻方获胜)

---

## 完整文件变更清单

### v2 新增变更
1. `03_Web_Rebuild/src/core/Game.ts` — 威慑胜利+80, 氦闪→二向箔, 黑域跨树, 存档加载修复
2. `03_Web_Rebuild/src/data/randomevents.json` — 前3条补全 triggerCondition + dialogQueue
3. `03_Web_Rebuild/src/test/core/Game.test.ts` — +2 测试 (氦闪/二向箔/逃逸)
4. `03_Web_Rebuild/src/test/integration/SaveLoad.test.ts` — +1 存档版本测试
5. `03_Web_Rebuild/src/test/components/Tutorial.test.tsx` — 新增冒烟测试
6. `.github/workflows/ci.yml` — 新增 CI 流水线
7. `02_Project_Documentation/EXEC_20260519_AUDIT_OPTIMIZATION_ITERATION_v2.md` — 本文档

### v1 变更 (保留)
详见 `EXEC_20260519_AUDIT_OPTIMIZATION_ITERATION.md`

---

## 跳过项与原因

| 跳过项 | 原因 | 审计报告引用 |
|--------|------|------------|
| Tutorial 全量交互测试 (导航/键盘/章节跳转) | 组件使用 200ms animateTransition 延迟，fake timer + act 组合在 jsdom 下仍有状态同步间隙 | 审计 §4.4 |
| SaveLoad 往返完整性验证 (save→load→assert) | `Object.assign` 浅拷贝 + `restorePrototypes` 原型链恢复存在事件管理器 深层属性 (triggeredFilteredIds Set, filteredEvents 数组) 的不一致风险；需架构层面的 GameSerializer | 审计 §5.4 |
| StoryModal 组件测试 | 依赖 GameEventPayload 结构 + 打字机 setInterval 逻辑 + 头像 mock，端到端链路复杂 | 审计 §1.3 |
| RightInspector 组件测试 | 深度依赖 GameInstance 单例 + StarManager + 建筑进度状态，需重写 mock 层 | 审计 §4.4 |
| TopHUD 组件测试 | 依赖 useFloatingText hook + useMemo deps + prevStatsRef，无法在浅层 mock 中正确触发 | 审计 §1.3 |
| randomevents.json 全量 133 条事件补 lane/loreDomain | normalizeEventMeta() 已为无 meta 事件赋予默认 ambient meta；全量补全为内容标注工作，非代码工程 | 审计 §2.5 |

---

## 验证结果

```bash
$ npx tsc --noEmit
# 零错误

$ npx vitest run
# Test Files  12 passed (12)
# Tests  246 passed (246)

$ npx vitest run --coverage
# Coverage: 77.65% Stmts / 61.2% Branch / 87.61% Funcs / 80.3% Lines
```

### 覆盖率明细
| 模块 | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| config/starIndices.ts | 100% | 100% | 100% | 100% |
| types/enums.ts | 100% | 100% | 100% | 100% |
| core/TecTreeManager.ts | 100% | 100% | 100% | 100% |
| core/GameEventManager.ts | 94.85% | 86.59% | 100% | 96.62% |
| core/StarManager.ts | 96.96% | 88.88% | 100% | 96.29% |
| core/CombatEngine.ts | 86.11% | 79.41% | 100% | 85.91% |
| core/EventCadence.ts | 75% | 71.42% | 71.42% | 77.77% |
| core/Game.ts | 69.94% | 56.76% | 82.6% | 71.96% |
| components/Tutorial.tsx | 47.69% | 39.13% | 28.57% | 55.55% |

---

> 本次迭代严格遵循审计报告第 7 节交接注意事项：
> 1. 未大改叙事文本，仅添加 loreDomain 与测试 (v1)
> 2. 不简单调低概率，建立了全局预算 + lane 冷却 + maxTriggers (v1)
> 3. 教程问题源自代码层面修复 (v1)
> 4. 胜利/失败/黑域条件逻辑修复 (v2)
> 5. 跳过项均在文档中明确记录原因 (v2)
> 6. 每份测试报告附有可复现运行证据