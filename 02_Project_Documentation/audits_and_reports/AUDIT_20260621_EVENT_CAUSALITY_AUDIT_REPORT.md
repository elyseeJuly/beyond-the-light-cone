# LegendOfUni 事件触发系统因果链审计报告

> **文档编号**: AUDIT_20260621_EVENT_CAUSALITY_AUDIT_REPORT  
> **生成日期**: 2026-06-21  
> **分类前缀**: `AUDIT_` (审计分析与研究报告)  
> **文档版本**: V1.0  
> **关联文档**: [AUDIT_20260622_EVENT_CAUSALITY_ANALYSIS.md](./AUDIT_20260622_EVENT_CAUSALITY_ANALYSIS.md)  

---

## 一、审计概述

本次审计对照 [AUDIT_20260622_EVENT_CAUSALITY_ANALYSIS.md](./AUDIT_20260622_EVENT_CAUSALITY_ANALYSIS.md)（设计文档）与 `events.json`（实际实现），发现事件触发系统存在三个层面的严重问题。

---

## 二、问题详述

### 2.1 TagManager 与事件触发系统完全脱节

**严重程度**: P0

设计文档将 `TagManager` 描述为事件系统的核心输入（"标签是事件系统的核心输入，影响事件权重"），但实际代码中：

| 问题 | 详情 |
|---|---|
| GameEventManager.checkFilterConditions() | 完全通过 `game.hasFlag()` 检查前置条件，从未查询 `TagManager.worldTags` |
| TagManager.applyWorldTag() | 仅用于氛围渲染、生态链、外交网络和结局标签，与事件触发零交互 |
| EventCadence.ts 的 `tags` 字段 | 有预留字段但从未被使用 |

**结论**: TagManager 是"悬挂"系统，它记录标签但并不参与事件触发决策。

### 2.2 events.json 因果链断裂

**严重程度**: P0

| 指标 | 数值 |
|---|---|
| 总事件数 | 45 |
| 总 Flag 设置数 | 37 |
| 被 reqFlag 引用的 Flag | **仅 13 个** |
| 死 Flag（设置后从未被引用） | **23 个（64.9%）** |

#### 2.2.1 关键因果链断裂

| 审计设计中的因果链 | events.json 实际状态 | 影响 |
|---|---|---|
| ETO 成立 → 古筝行动 | 古筝行动无 reqFlag | 古筝可独立触发 |
| 水滴抵近 → 末日战役 | 末日战役无 reqFlag | 末日可独立触发 |
| 澳大利亚移民 → 引力波广播 | 引力波广播无 reqFlag | 广播可独立触发 |
| 光速飞船 → 二向箔逃逸判定 | 二向箔事件无条件分支 | 无逃逸判定逻辑 |
| 维德处决 → 光速飞船研发锁定 | 处决事件后无后续检查 | 处决无实质影响 |
| 幽灵倒计时 → 智子封锁 | 幽灵倒计时无 reqFlag | 可提前触发 |

#### 2.2.2 缺失事件

审计文档描述了但 `events.json` 中不存在的 **3 个事件**：

| 事件 | 审计图片 | 触发条件（审计设计） |
|---|---|---|
| 掩体与黑域辩论 | `cg_black_domain_debate.png` | epoch==BROADCAST |
| 银河纪元开启 | `cg_galaxy_era.png` | 需 `galaxy_exodus_successful` |
| 星屑纪元生存 | `cg_stardust_era.png` | epoch==GALAXY 且漂泊超50年 |

### 2.3 年份偏差与 Flag 命名不一致

#### 2.3.1 年份偏差（偏差≥20年）

| 事件 | 审计年份 | events.json 年份 | 偏差 |
|---|---|---|---|
| 泰勒破壁 | ≥20 | **60** | +40 |
| 雷迪亚兹破壁 | ≥30 | **70** | +40 |
| 大低谷结束 | 80 | **150** | +70 |
| 技术爆炸 | ≥120 | **180** | +60 |
| 执剑人交接 | 205 | **219** | +14 |
| 维德政变 | 215 | **300** | +85 |
| 掩体世界落成 | 225 | **280** | +55 |
| 维度打击警报 | 290 | **340** | +50 |
| 冥王星博物馆 | 300 | **355** | +55 |
| 太阳系二维化 | 301 | **360** | +59 |

#### 2.3.2 Flag 命名不一致（17处）

| 审计 Flag 名 | events.json Flag 名 |
|---|---|
| `sophon_lockade_active` | `sophon_blockade_confirmed` |
| `yangdong_dead` | `yangdong_suicide` |
| `beihai_assassination_done` | `zhang_beihai_assassination` |
| `thought_seal_active` | `thought_seal_created` |
| `tyler_defeated` | `tyler_breached` |
| `reydiaz_defeated` | `reydiaz_breached` |
| `great_ravine_active` | `great_ravine_started` |
| `dark_battle_concluded` | `dark_battle` |
| `australia_migration_started` | `australia_migration` |
| `bunker_cities_ready` | `bunker_world_completed` |
| `lightspeed_travel_possible` | `lightspeed_ship_tested` |
| `dimensional_strike_imminent` | `dimensional_alert_seen` |
| `human_heritage_archived` | `pluto_museum` |
| `galaxy_exodus_successful` | `galaxy_exodus_seen` |
| `tech_explosion_active` | `technological_explosion` |

---

## 三、根因分析

1. **TagManager 集成不完整**: UEE v1.0 架构设计了标签系统，但事件触发层的 `checkFilterConditions` 并未接入标签查询接口。
2. **因果链实现不足**: events.json 中大部分事件仅依赖 `epoch` + `minYear` 触发，缺乏前后 Flag 依赖关系，导致审计文档中描述的因果链在实现中缺失。
3. **文档与实际代码脱节**: AUDIT 文档描述了因果链设计愿景，但 events.json 的迭代调整（年份、Flag 命名）未同步更新文档，导致两者严重偏离。

---

## 四、修复方案

### 4.1 TagManager 事件集成（P0）

在 `GameEventManager.checkFilterConditions()` 中新增标签条件检查：
- 新增 `reqTag` / `reqNotTag` 条件字段，查询 `TagManager.hasTag()`
- 新增 `minTagIntensity` 字段，查询 `TagManager.getTagIntensity()`

### 4.2 因果链修复（P0）

为 events.json 中缺失 reqFlag 的关键事件补充依赖：

| 事件 | 需补 reqFlag |
|---|---|
| 古筝行动（Year 2） | `eto_founded` |
| 幽灵倒计时（Year 1） | `sophon_blockade_confirmed` |
| 末日战役（Year 200） | `teardrop_arrived` |
| 引力波广播（Year 230） | `australia_migration` |
| 维德政变（Year 300） | `lightspeed_ship_tested` |

### 4.3 补充缺失事件

在 events.json 末尾追加3个事件：
- 掩体与黑域辩论（Year 225，BROADCAST）
- 银河纪元开启（Year 370，GALAXY，reqFlag: galaxy_exodus_seen）
- 星屑纪元生存（Year 420，GALAXY）

### 4.4 Flag 别名映射

在 `checkFilterConditions` 中添加别名映射，使审计文档中引用的 Flag 名与 events.json 实现中的 Flag 名互通。

---

## 五、影响评估

| 修改项 | 影响范围 | 测试影响 |
|---|---|---|
| TagManager 集成 | GameEventManager.ts | 无回归（新增条件仅当 cond 指定时才启用） |
| events.json reqFlag 补充 | events.json | 可能影响现有测试的事件触发 |
| 补充缺失事件 | events.json | 无回归（新事件不影响旧事件） |
| Flag 别名映射 | GameEventManager.ts | 无回归 |