# LegendOfUni 复杂游戏系统循环审计报告 v2.0

> **Audit Date**: 2026-06-12  
> **Audit Version**: V2.0  
> **Audit Framework**: Cycle Audit Prompt v2.0  
> **Target System**: LegendOfUni (03_Web_Rebuild)  
> **Core Objective**: 识别全局系统循环拓扑、断裂循环、伪循环及结局闭环完整性

---

## 目录

1. [第一阶段：系统模块拆解](#第一阶段系统模块拆解)
2. [第二阶段：单模块内部循环分析](#第二阶段单模块内部循环分析)
3. [第三阶段：跨模块循环图谱](#第三阶段跨模块循环图谱)
4. [第四阶段：系统性风险检测](#第四阶段系统性风险检测)
5. [第五阶段：结局结算模块审计](#第五阶段结局结算模块审计)
6. [第六阶段：循环拓扑图](#第六阶段循环拓扑图)
7. [第七阶段：循环健康评分](#第七阶段循环健康评分)
8. [第八阶段：修复方案优先级总览](#第八阶段修复方案优先级总览)

---

## 第一阶段：系统模块拆解

### 【模块 1：战斗系统 — CombatEngine】

- **代码位置**：[CombatEngine.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/CombatEngine.ts)
- **输入来源**：Fleet（舰队）、Barback（星球防御）、PersonManager（指挥官属性）、WeaponManager（武器类型）
- **处理逻辑**：回合制战力对决（HP削减模型），武器类型相克（SPY克EXPENDABLE，SUPERBOMB克UNIT），指挥官属性加成战力
- **输出影响**：StarManager（星系归属变更）、EarthCivilization（人口/资源损失）、AlienCivilization（舰队毁灭/关系变化）、HistoryGenerator（战报记录）
- **反馈回流**：战斗结果 → 星系归属变更 → 资源/人口变化 → 影响后续战力 → **形成闭环**

### 【模块 2：经济系统 — Economy】

- **代码位置**：[EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts)（processMining / processFactories）
- **输入来源**：StarManager（星系资源）、TecTreeManager（星矿/星厂科技加成）、Department（部长属性加成）、事件选择效果
- **处理逻辑**：三比例工人分配（mining/factory/culture）→ 采矿产出（workers × miningWeight × treacheryFactor）→ 工厂经济产出 → 资源消耗
- **输出影响**：TecTreeManager（研究消耗资源）、CombatEngine（军队建设消耗）、PlanetEngine（发动机建造）、DigitalLife（服务器建造）
- **反馈回流**：经济 → 科技 → 更高效采矿/工厂 → 更多经济 → **形成增长闭环**

### 【模块 3：成长/养成系统 — Growth】

- **代码位置**：[EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts)、[Civilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Civilization.ts)
- **输入来源**：TecTreeManager（科技完成加成）、事件系统（culture/人口奖励）、PersonManager（角色属性）、TagManager（状态标签）
- **处理逻辑**：人口增长（殖民城科技×城市数量），文化增长（思想钢印×文化工人），文明等级（culture阈值），威慑值累积（面壁者+执剑人）
- **输出影响**：CombatEngine（civiLevel影响军队）、TecTreeManager（研究速度）、EventManager（事件条件解锁）、VictoryConditions（结局判定）
- **反馈回流**：成长 → 更多资源/战力 → 扩张 → 更多成长 → **形成正反馈循环**

### 【模块 4：事件/任务系统 — GameEventManager】

- **代码位置**：[GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts)
- **输入来源**：年份（inYear触发）、纪元（epoch条件）、TagManager（标签条件）、EarthCivilization（数值阈值）、Flag系统（前提标记）
- **处理逻辑**：三类事件（固定剧情/随机/条件过滤），EventCadence节奏控制（3条lane：milestone/major/ambient），概率权重抽取
- **输出影响**：EarthCivilization（资源增减）、Flag系统（标记激活）、PersonManager（角色解锁）、TagManager（标签应用）、外交系统（关系变化）
- **反馈回流**：事件选择 → Flag/Tag → 影响后续事件条件 → **部分闭环（路径依赖较弱）**

### 【模块 5：掉落/奖励系统 — 嵌入式】

- **代码位置**：[Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts)（applyNewEffects 方法）
- **输入来源**：事件选择效果、战斗结果、科技完成
- **处理逻辑**：统一分发5种奖励类型（resource/flag/unlock_person/event_effect/diplomacy），clampEffectValue防溢出
- **输出影响**：EarthCivilization（数值变化）、Flag系统、PersonManager、AlienCivilization（外交）
- **反馈回流**：奖励 → 属性提升 → 解锁新事件条件 → **闭环但分散**

### 【模块 6：AI/敌人行为系统 — AlienCivilization】

- **代码位置**：[AlienCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/AlienCivilization.ts)
- **输入来源**：EarthCivilization（威慑值/人口/军力）、FriendshipType（关系状态）、年份/纪元
- **处理逻辑**：5种AI人格（HUNTER/CLEANER/EXPANSIONIST/DEFENSIVE/OPPORTUNIST），经济自增长，执剑人交接危机检测，水滴攻击/二向箔打击
- **输出影响**：CombatEngine（发起攻击）、EarthCivilization（人口/资源损失）、StarManager（领土）、GameOver（二向箔灭世）
- **反馈回流**：AI行动 → 地球状态变化 → 威慑值变化 → AI行为调整 → **形成对抗闭环**

### 【模块 7：地图/关卡系统 — StarManager】

- **代码位置**：[StarManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/StarManager.ts)
- **输入来源**：JSON数据（预设恒星）、StarGenerator（程序化生成）、科技系统（解锁探索范围）
- **处理逻辑**：4个星域（太阳系/50光年/1万光年/银河系），星系归属管理，建筑进度（stope/factory/city）追踪
- **输出影响**：EarthCivilization（采矿/工厂/城市产出）、AlienCivilization（领土）、CombatEngine（战场）
- **反馈回流**：星系探索 → 扩张 → 更多资源产出 → **部分闭环（探索依赖科技）**

### 【模块 8：社交/关系系统 — 外交 + RelationNetwork】

- **代码位置**：[AlienCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/AlienCivilization.ts)、[RelationNetwork.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/RelationNetwork.ts)
- **输入来源**：FriendshipType（5级关系）、地球威慑值、外交行动（negotiate/trade/provoke/alliance）、Flag解锁（singer_contact等）
- **处理逻辑**：外交冷却机制（3回合），关系值变化，同盟判定（isBund），文明解锁条件（年份/科技/Flag）
- **输出影响**：AlienCivilization（AI行为倾向变化）、EarthCivilization（威慑值/经济/资源）、VictoryCondition（征服胜利）
- **反馈回流**：外交 → 关系变化 → 影响AI行为 → **部分闭环（但外交不影响叙事系统）**

### 【模块 9：科技/技能系统 — TecTreeManager】

- **代码位置**：[TecTreeManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/TecTreeManager.ts)
- **输入来源**：Department（研究部门属性）、PersonManager（科学家属性）、EarthCivilization（treachery影响研究速度）、智子封锁（减速）
- **处理逻辑**：5棵科技树（PHYSICS/AEROSPACE/MILITARY/INFORMATION/INTERSTELLAR），树状依赖解锁，自动选择最便宜可研节点，进度累积
- **输出影响**：EarthCivilization（采矿/工厂/文化/人口权重提升）、CombatEngine（武器解锁）、PlanetEngine（发动机效率）、VictoryConditions（胜利条件）
- **反馈回流**：科技 → 全系统效率提升 → 更多资源 → 更快研究 → **核心增长引擎**

### 【模块 10：资源生产系统 — 采矿/工厂/文化】

- **代码位置**：[EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts)（allocateWorkers / processMining / processFactories / processCulture）
- **输入来源**：StarManager（星系资源总量）、EarthCivilization（工人分配比例）、TecTreeManager（科技加成权重）、Department（部长加成）
- **处理逻辑**：miningRatio/factoryRatio/cultureRatio 三比例分配人口，每回合产出，treachery因子制约
- **输出影响**：EarthCivilization（resource/economy/culture）、TecTreeManager（研究消耗）、PlanetEngine（建造消耗）
- **反馈回流**：资源 → 科技 → 更高产出权重 → **形成闭环**

### 【模块 11：事件/随机系统 — EcologyChain + TagManager + AtmosphereEngine】

- **代码位置**：[EcologyChain.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EcologyChain.ts)、[TagManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/TagManager.ts)、[AtmosphereEngine.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/AtmosphereEngine.ts)
- **输入来源**：GameEventManager（触发事件）、TagManager（世界状态标签）、EarthCivilization（数值阈值）
- **处理逻辑**：EcologyChain（8条链式反应规则，延迟2-5回合触发后续事件），TagManager（20+世界标签，衰减率3/年），AtmosphereEngine（6种氛围自动判定）
- **输出影响**：GameEventManager（涟漪事件触发），UI层（氛围滤镜/色调/噪点），HistoryGenerator（编年史记录）
- **反馈回流**：事件 → Tag → 氛围变化 → 影响事件条件 → **形成闭环（但涟漪事件依赖随机抽选）**

### 【模块 12：结局结算系统 — VictoryConditions】

- **代码位置**：[Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts)（checkVictoryConditions 第461-564行）
- **输入来源**：EarthCivilization（人口/文化/威慑值/科技完成）、Flag系统（50+条件标记）、AlienCiviManager（征服状态）、年份/纪元
- **处理逻辑**：6种胜利条件 + 3种失败条件，每回合自动检测，首次触发即锁定
- **输出影响**：isGameOver = true、victoryType/defeatType、playerTimeline写入、CustomEvent('game-over')
- **反馈回流**：见第五阶段专项分析

---

## 第二阶段：单模块内部循环分析

### 2.1 战斗系统内部循环

| 循环类型 | 状态 | 详细分析 |
|---------|------|---------|
| **成长循环** | ✅ 存在 | 舰队战力 ← 武器数量+指挥官属性 → 战斗胜利 → 获得星系 → 更多资源建舰队 |
| **消耗循环** | ⚠️ 部分单向 | 舰队损失后无自动恢复机制，需手动重建；无残骸回收 |
| **决策循环** | ✅ 有效 | 选择攻击目标 → 战力对比 → 胜败结果 → 影响后续扩张策略 |
| **状态循环** | ⚠️ 部分 | 战斗结果影响星系归属，但无"战后重建"自动状态机 |

### 2.2 经济系统内部循环

| 循环类型 | 状态 | 详细分析 |
|---------|------|---------|
| **成长循环** | ✅ 健康 | 采矿/工厂产出 → 资源 → 科技 → 更高产出权重（miningWeight 2→5，factoryWeight 2→5） |
| **消耗循环** | ⚠️ 单向风险 | 工厂生产消耗resource，若无采矿支撑则资源枯竭；无自动警报 |
| **决策循环** | ✅ 有效 | 工人比例分配（mining/factory/culture三档滑块）影响产出结构 |
| **状态循环** | ✅ 闭环 | 经济变化 → 文明等级 → 更多产出加成 |

### 2.3 科技系统内部循环

| 循环类型 | 状态 | 详细分析 |
|---------|------|---------|
| **成长循环** | ✅ 强正反馈 | 研究 → 科技完成 → 全系统效率提升 → 更多资源 → 更快研究 |
| **消耗循环** | ⚠️ 单向 | 科技完成后无维护成本，无退化机制，不存在"科技衰退" |
| **决策循环** | ❌ **不存在** | 自动选择最便宜可研节点，玩家无研究路线决策权 |
| **状态循环** | ⚠️ 单向外挂 | 智子封锁作为外部减速状态，但无"突破封锁后反制"的自愈机制 |

### 2.4 事件系统内部循环

| 循环类型 | 状态 | 详细分析 |
|---------|------|---------|
| **成长循环** | ❌ 不存在 | 事件不产生持续成长，仅一次性资源变化 |
| **消耗循环** | ✅ 存在 | 事件消耗资源/人口 → 触发新状态 |
| **决策循环** | ✅ 有效 | 选择 → Flag/Tag → 解锁新事件条件 → 新选择 |
| **状态循环** | ✅ 闭环 | 事件 → Tag → 氛围 → 影响后续事件权重 |

### 2.5 AI行为系统内部循环

| 循环类型 | 状态 | 详细分析 |
|---------|------|---------|
| **成长循环** | ⚠️ 无限增长 | 每回合 arm+=2，resource+=random*10，无上限 |
| **消耗循环** | ❌ 不存在 | AI不消耗资源，仅增长 |
| **决策循环** | ✅ 有效 | 威慑值 → 行为树分支 → 攻击/外交/扩张决策 |
| **状态循环** | ✅ 闭环 | 友好度+威慑值 → AI行为 → 地球状态变化 → 反馈 |

### 2.6 外交系统内部循环

| 循环类型 | 状态 | 详细分析 |
|---------|------|---------|
| **成长循环** | ⚠️ 有限 | 外交行动 → 关系提升 → 同盟可能 |
| **消耗循环** | ✅ 存在 | 贸易消耗economy获得resource |
| **决策循环** | ⚠️ 有限 | 4种行动（negotiate/trade/provoke/alliance），但选项固定 |
| **状态循环** | ❌ **断裂** | 关系变化不影响叙事事件系统，外交是"孤岛" |

### 2.7 资源生产系统内部循环

| 循环类型 | 状态 | 详细分析 |
|---------|------|---------|
| **成长循环** | ✅ 强正反馈 | 科技等级提升 → 产出权重×2.5（2→5） |
| **消耗循环** | ⚠️ 单向 | 工厂消耗resource，若采矿跟不上则耗竭 |
| **决策循环** | ✅ 有效 | 工人三比例分配影响产出结构 |
| **状态循环** | ✅ 闭环 | 产出 → 经济 → 科技 → 更高产出权重 |

### 2.8 生态链系统内部循环

| 循环类型 | 状态 | 详细分析 |
|---------|------|---------|
| **成长循环** | ❌ 不存在 | 链式反应是线性递进，非成长性 |
| **消耗循环** | ✅ 存在 | 前序事件消耗Tag → 后序事件触发 |
| **决策循环** | ❌ 玩家无参与 | 链式反应是系统自动判定 |
| **状态循环** | ✅ 闭环 | 事件 → 延迟 → 涟漪事件 → 新Tag → 新事件条件 |

---

## 第三阶段：跨模块循环图谱

### 3.1 完整跨系统循环图

```
                    ┌──────────────────────────────────────┐
                    │         GameEventManager              │
                    │  (固定剧情/随机事件/条件过滤事件)      │
                    └──────┬───────────────┬───────────────┘
                           │ Flag/Tag/资源  │ 事件触发条件
                           ▼                ▼
    ┌──────────────────────────────────────────────────────────┐
    │            TagManager + AtmosphereEngine                 │
    │           (20+世界标签 + 6种氛围状态)                     │
    └──────────────────────────┬───────────────────────────────┘
                               │ 影响事件权重和条件
                               ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 采矿系统  │───▶│ 经济系统  │───▶│ 科技系统  │───▶│ 战斗系统  │
│ (资源)   │    │(economy) │    │ (5棵树)  │    │ (战力)   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      ▲               │               │               │
      │               ▼               ▼               ▼
      │         ┌──────────┐    ┌──────────┐    ┌──────────┐
      │         │ 人口系统  │    │ 外交系统  │    │ 敌人AI   │
      │         │(growth)  │    │(关系)    │    │(5人格)   │
      │         └──────────┘    └──────────┘    └──────────┘
      │               │               │               │
      └───────────────┴───────────────┴───────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │  结局结算系统          │
                    │  (6胜利 + 3失败)      │
                    └──────────────────────┘
                              │
                     ❌ 无反馈回流
```

### 3.2 正向闭环（Healthy Loop）

```
路径A：采矿 → 资源 → 工厂 → 经济 → 科技研究 → 更高采矿/工厂权重 → 更多资源
       ✅ 完整闭环，数值有上限约束（MAX_ECONOMY=999999）
       风险点：行星发动机Ⅰ型使 factoryWeight 提升后，工厂产出额外×5

路径B：事件选择 → Flag激活 → 解锁新事件条件 → 新事件 → 新Flag
       ✅ 条件过滤事件系统形成叙事闭环（约17个条件过滤事件）

路径C：科技研究 → 部门产出 → 科技完成 → 全系统效率 → 更多资源 → 更高部门产出
       ✅ 科技与经济形成稳定的正反馈螺旋
```

### 3.3 放大循环（Amplification Loop）

```
路径A：科技 → 行星发动机Ⅰ型 → 工厂产出×5倍 → 经济爆炸 → 更快研究
       ⚠️ 风险评级：高
       行星发动机Ⅰ型是单一科技节点，将工厂add值从 cap=100 直接乘以5
       配合星厂Ⅲ（factoryWeight=5）可产生指数级经济膨胀

路径B：面壁者 → 每回合威慑值累积 → 面壁计划完成 → 威慑值+50，军队+100
       ⚠️ 风险评级：中
       面壁者每回合 (leadership + art) × 0.5 的威慑值增长无衰减
       多个面壁者同时在位时，威慑值可快速溢出
```

### 3.4 断裂循环（Broken Loop）

```
路径A：外交系统 → 关系变化 → ❌ → 不影响事件系统，不产生Tag，不改变氛围
       断裂位置：conductDiplomacy 方法返回纯文本消息，无副作用写入事件系统
       影响评级：中

路径B：EcologyChain → 涟漪事件 → checkRandomEvents() 概率触发 → 可能不触发
       断裂位置：涟漪事件的后续是随机抽选，不是确定性触发
       影响评级：中

路径C：战斗 → 星球占领 → ❌ → 占领无"文化融合/抵抗运动/社会影响"反馈
       断裂位置：星球归属变更后，不触发事件，不检查Tag
       影响评级：低

路径D：RelationNetwork → ❌ → 初始化后从未在 runARound 中被调用
       断裂位置：RelationNetwork 完全孤立，不参与任何循环
       影响评级：高
```

---

## 第四阶段：系统性风险检测

### 4.1 无反馈循环（Dead Loop）

| # | 行为 → 结果 | 问题 | 影响 |
|---|-----------|------|------|
| D1 | 战斗 → 占领星球 | 占领后不产生文化/社会/政治反馈 | 低 |
| D2 | 外交关系 → 全局叙事 | 关系变化不影响事件池、不产生叙事分支 | 中 |
| D3 | 数字生命上传 → 社会反馈 | 人口上传后 treachery 不变化，无社会舆论反应 | 低 |
| D4 | 科技完成 → 世界状态 | 科技完成不自动产生Tag（如 tech_boom） | 中 |
| D5 | 结局 → 新周目 | 结局不产生任何后续影响（NewGame+缺失） | **高** |

### 4.2 单向耗散循环（Drain Loop）

| # | 耗散路径 | 问题 | 影响 |
|---|---------|------|------|
| DR1 | 工厂生产消耗resource | 无资源时自动减产，但无警报/调整机制 | 中 |
| DR2 | MOON_CRISIS事件 | 消耗500 resource或人口减半，无自动恢复路径 | 低 |
| DR3 | 舰队战损 | 舰队被消灭后无残骸回收/自动重建 | 中 |
| DR4 | 外交贸易 | -30经济换+50资源，经济不可自动恢复 | 低 |

### 4.3 无限增长循环（Inflation Loop）

| # | 增长路径 | 风险值 | 缓解措施 |
|---|---------|--------|---------|
| IN1 | 面壁者每回合威慑值累积 | **高** | 无衰减，多面壁者叠加 |
| IN2 | 行星发动机Ⅰ型 5倍工厂产出 | **高** | cap=500但×5后仍是巨大增幅 |
| IN3 | AI军队每回合+2，无上限 | 中 | AI经济同样无限制增长 |
| IN4 | 文明等级无降级 | 中 | civiLevel只升不降，是伪等级 |

### 4.4 模块孤岛循环（Isolated Loop）

| # | 模块 | 状态 | 影响 |
|---|------|------|------|
| IS1 | **RelationNetwork** | **完全孤立**，初始化后未被调用 | **高** |
| IS2 | SliceNarrativeEngine | 初始化后未在游戏循环活跃使用 | 中 |
| IS3 | 角色属性系统 | Person属性仅在分配部门时使用，角色间无互动 | 低 |

### 4.5 伪循环（Fake Loop）

| # | 伪循环路径 | 真实本质 | 影响 |
|---|-----------|---------|------|
| FK1 | 纪元更替  culture→epoch | 线性进度条（单向），不可逆 | 中 |
| FK2 | 文明等级  culture→civiLevel | 线性阈值（单向），无降级 | 低 |
| FK3 | 自动科技研究 | 自动选最便宜节点，玩家无决策 | 中 |

---

## 第五阶段：结局结算模块审计

### 5.1 结局是否可达？

**结论：是，所有路径最终导向结局。**

强制失败兜底机制完整：
- `year > 350` 且无保护科技/Flag → HELIUM_FLASH 失败
- `population <= 0` → EXTINCTION 失败
- `treachery >= 100` → TREACHERY 失败

**但存在可达性问题：**
- **HIDDEN**（死神永生）胜利条件链最长：`year>=350 + culture>=800 + epoch>=GALAXY + deterrence>=30 + galaxy_exodus_seen + alien_alliance + 黑域或数字方舟`
  - `alien_alliance` 仅在一个条件过滤事件（alien_civilization_diplomacy）中可获得
  - 该事件触发条件：`minYear: 200, epoch: "GALAXY", minCulture: 60`
  - 若玩家错过该事件则隐藏结局永久不可达

### 5.2 结局是否反映过程？

**部分反映。** 结局判定使用了累积状态，但：
- 结局是统一结算，不区分"怎么达成的"
- 无"历史路径总结"——不展示关键选择链
- 无"结局质量"分级——仅触发/不触发二值判定

**缺失功能：**
```
玩家作出的重大选择（Flag集） → 不影响结局类型
面壁者是否被破壁 → 不影响结局类型
与外星文明的关系走向 → 不影响结局类型（征服胜利只检查存活）
```

### 5.3 结局是否形成"循环闭环"？

**❌ 不形成闭环。**

```
游戏过程 → 世界状态累积 → 结局判定 → isGameOver=true
                                              ↓
                                       ❌ 无新周目继承
                                       ❌ 无世界状态保留
                                       ❌ 无结局解锁新内容
                                       ❌ 无结局写入永久记录
```

### 5.4 结局类型分类

| 类型 | 结局名称 | VictoryType | 条件复杂度 | 状态 |
|------|---------|------------|-----------|------|
| 胜利 | 流浪胜利 | WANDERING | 2项科技完成 | ✅ |
| 胜利 | 数字永生胜利 | DIGITAL | 1项科技完成 | ✅ |
| 胜利 | 威慑胜利 | DETERRENCE | 纪元+执剑人+威慑值>=80 | ✅ |
| 胜利 | 征服胜利 | CONQUEST | 所有外星文明灭亡/同盟 | ✅ |
| 胜利 | 黑域胜利 | DARK_DOMAIN | 1项科技完成 | ✅ |
| **隐藏** | **死神永生·小宇宙** | **HIDDEN** | **6项条件（最长链）** | ⚠️ |
| 失败 | 逃亡主义崩溃 | TREACHERY | treachery>=100 | ✅ |
| 失败 | 文明灭绝 | EXTINCTION | population<=0 | ✅ |
| 失败 | 太阳氦闪/二向箔 | HELIUM_FLASH | year>350 + 无保护 | ✅ |

**缺失类型：**
- 中性结局（如"永恒的流亡"、"宇宙静默"等非胜非败结局）
- 动态结局（由系统根据历史Tag/Flag集自动生成结局文本）

### 5.5 结局是否"重写世界状态"？

**❌ 不重写。** 结局结算后：

| 应有操作 | 实际状态 |
|---------|---------|
| 改写世界参数 | ❌ 不做 |
| 改写历史Tag | ❌ 不做 |
| 影响下一轮循环 | ❌ 不继承 |
| 解锁新系统层级 | ❌ 不解锁 |
| 记录结局至HistoryGenerator | ❌ recordVictory方法存在但未被调用 |

### 5.6 结局断裂问题

```
玩家所有行为 → 结局判定 → 仅设置isGameOver + 派发事件 → ❌ 无后续
```

**存在严重断裂：**
1. 结局不生成"文明总结报告"
2. 结局不记录"关键转折点"
3. 结局不提供"再玩一局"的差异化体验
4. GameInstance.reset() 完全清除所有状态，无任何继承

---

## 第六阶段：循环拓扑图

### 完整拓扑结构

```
[事件系统 GameEventManager]
    │  Flag/Tag/资源 
    ▼
[TagManager] ─── 条件 ──▶ [事件系统]
    │                        
    │ 氛围判定              
    ▼                        
[AtmosphereEngine] ─── UI滤镜 ──▶ [UI层]
    │                        
    │                        
    ▼                        
[地球文明 EarthCivilization]
    │  ┌───────────────┐
    ├─▶│ 采矿 → 资源    │──▶ [StarManager.星系资源]
    ├─▶│ 工厂 → 经济    │──▶ [TecTreeManager.科技树]
    ├─▶│ 文化 → 文明等级│──▶ [纪元更替]
    ├─▶│ 人口 → 增长    │──▶ [星球人口容量]
    │  └───────────────┘
    ▼
[TecTreeManager]
    │  5棵树互相关联
    ├─▶ 采矿权重↑ 工厂权重↑ 文化权重↑
    ├─▶ 解锁战斗武器
    ├─▶ 解锁行星发动机
    ├─▶ 解锁数字生命
    ├─▶ 解锁结局条件
    ▼
[CombatEngine]
    │  舰队vs舰队 / 舰队vs星球防御
    ├─▶ 胜利 → 星系易主 → StarManager
    ├─▶ 失败 → 人口/资源损失
    ▼
[AlienCivilization]
    │  5种AI人格
    ├─▶ HUNTER → 攻击
    ├─▶ CLEANER → 清理
    ├─▶ EXPANSIONIST → 扩张
    ├─▶ DEFENSIVE → 防御
    ├─▶ OPPORTUNIST → 投机
    │
    ▼
[外交系统 conductDiplomacy]
    │  4种外交行动
    ├─▶ 谈判 → 关系+1
    ├─▶ 贸易 → 经济-30, 资源+50
    ├─▶ 挑衅 → 关系恶化
    ├─▶ 同盟 → 需关系≥FRIEND
    │
    ▼ ❌ 断裂
[叙事事件系统]

[结局系统 checkVictoryConditions]
    │  6胜利 + 3失败
    ▼
    isGameOver = true
    ▼
❌ 断裂：无 NewGame+，无继承，无世界重写
```

### 标注汇总

| 路径 | 闭环 | 捷径 | 断裂 | 死循环 |
|------|------|------|------|--------|
| 事件→Tag→事件 | ✅ | 无 | 无 | 无 |
| 经济→科技→采矿→经济 | ✅ | 行星发动机×5（通胀风险） | 无 | 无 |
| 战斗→星球→资源→战斗 | ✅ | 无 | 无 | 无 |
| 外交→关系→AI行为 | ✅ | 无 | 关系不影响事件系统 | 无 |
| 科技→结局 | ✅ | 数字方舟/黑域直接胜利 | 无 | 无 |
| 结局→新循环 | ❌ | 无 | **严重断裂** | 无 |
| EcologyChain→涟漪事件 | ⚠️ | 无 | 涟漪事件不保证触发 | 无 |
| RelationNetwork→? | ❌ | 无 | **完全孤立** | 无 |
| SliceNarrativeEngine→? | ❌ | 无 | **完全孤立** | 无 |

---

## 第七阶段：循环健康评分

### 分项评分（0-10）

| 维度 | 评分 | 说明 |
|------|------|------|
| **经济循环** | 7/10 | 采矿→工厂→科技闭环完整，但有行星发动机×5通胀风险 |
| **战斗循环** | 6/10 | 战斗→扩张闭环存在，但战后恢复机制缺失，战损无回收 |
| **科技循环** | 8/10 | 5棵树互相关联，解锁全系统，但无玩家研究决策 |
| **事件循环** | 7/10 | Flag/Tag链式反应设计良好，但涟漪事件依赖随机抽选 |
| **外交循环** | 4/10 | 外交选项有限，不影响叙事系统，冷却机制简单，RelationNetwork孤立 |
| **AI行为循环** | 6/10 | 5人格差异化行为，但AI经济无限增长，无资源约束 |
| **资源生产循环** | 7/10 | 三比例分配决策有效，但有单向耗散风险 |
| **结局循环** | **2/10** | 有结局判定但无闭环，无NewGame+，无世界重写 |
| **叙事循环** | 6/10 | EcologyChain涟漪设计好，但RelationNetwork和SliceNarrativeEngine孤立 |
| **跨系统耦合** | 5/10 | 核心三角（经济-科技-战斗）完整，外围系统断裂明显 |

### 全局健康度

| 指标 | 评分 |
|------|------|
| **整体循环健康度** | **5.5 / 10** |
| **评级** | 功能拼接型系统，向部分闭环过渡中 |
| **对比参照** | RimWorld/CK3（10）< LegendOfUni（5.5）< 线性任务系统（1-3） |

---

## 第八阶段：修复方案优先级总览

> 完整修复方案详见同目录 [PLAN_20260612_CYCLE_OPTIMIZATION.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/PLAN_20260612_CYCLE_OPTIMIZATION.md)

| 优先级 | 问题 | 影响 | 方案复杂度 |
|--------|------|------|-----------|
| **P0** | 结局无闭环（No NewGame+） | **严重** | 中 |
| **P0** | RelationNetwork 完全孤立 | **严重** | 低 |
| **P1** | 外交系统不参与叙事循环 | 中 | 低 |
| **P1** | 行星发动机Ⅰ型 5倍通胀风险 | 中 | 低 |
| **P1** | 面壁者威慑值无上限累积 | 中 | 低 |
| **P2** | 科技树无玩家决策 | 中 | 中 |
| **P2** | AI经济无限增长 | 中 | 低 |
| **P2** | SliceNarrativeEngine 孤立 | 中 | 低 |
| **P3** | 战斗无战后恢复机制 | 低 | 中 |
| **P3** | 工厂资源单向耗散无警报 | 低 | 低 |

---

*审计框架：Cycle Audit Prompt v2.0*  
*审计日期：2026-06-12*  
*审计对象：LegendOfUni (03_Web_Rebuild)*