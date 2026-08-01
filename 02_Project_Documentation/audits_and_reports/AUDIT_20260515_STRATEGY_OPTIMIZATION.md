# Legend of Uni 策略系统深度优化报告

> **优化日期**：2026-05-14 (策略系统) / 2026-05-15 (UI 集成修复)
> **基准对比**：MFC 原版 (01_Windows_Source) → Web 重制版 (03_Web_Rebuild)
> **优化范围**：全核心策略系统（事件/经济/军事/科技/外交/AI/胜利条件）+ UI 与核心系统连接

---

## 一、MFC版 vs Web版 游玩体验差异分析

### 1.1 经济系统

| 维度 | MFC 原版 | Web 优化前 | Web 优化后 |
|------|----------|-----------|-----------|
| **资源采集** | 矿厂按公式产出资源 (工人×权重/2)，受部长/科技/逃亡影响 | ❌ 无开采系统，resource 字段从未使用 | ✅ 完整复刻：工人分配、科技权重(2→5)、部长加成(Economy/20)、逃亡惩罚、上限100 |
| **经济产出** | 加工厂资源→经济转换(2:1)，行星发动机提升500% | ❌ 固定 +10/回合 | ✅ 完整复刻：工厂生产、质能转换科技、行星发动机5倍加成、上限100→500 |
| **工人分配** | 经济部 30%/30%/30% 划拨采矿/经济/文化 | ❌ 无工人系统 | ✅ miningRatio/factoryRatio/cultureRatio 三档分配 |
| **建造消耗** | 建筑消耗经济资源，有建造时间 | ❌ 零成本即时建造 | ✅ 建筑建造进度系统已就绪，经济消耗逻辑已接入 |

### 1.2 军事系统

| 维度 | MFC 原版 | Web 优化前 | Web 优化后 |
|------|----------|-----------|-----------|
| **战斗模型** | 优先级排序多对多、炸弹均摊伤害、HP≤0阵亡、将军技能 | ❌ 单次战力数值比较 atkPower > defPower | ✅ 5轮制战斗，骰子随机因子(0.8-1.2/0.75-1.25)，HP递减，僵局判定 |
| **武器类型** | UNIT/EXPENDABLE/SPY/SUPERBOMB 四种，各有行为 | ❌ 仅 currentBuild×10 一视同仁 | ✅ 水滴x20 / 战舰x15 / 普通x10 差异化计算 |
| **将领系统** | 贿赂/士气/威慑/撤退四技能，属性阈值解锁 | ❌ 仅 leader.army×0.1 加成 | ✅ army 0.1 + leadership 0.05 双重加成，防守方 army 0.15 优势 |
| **AI 攻击** | 1/7概率扩张，5-10回合预警冷却 | ❌ 8%概率，无冷却 | ✅ 人格驱动：Hunter 18%+冷却/ Cleaner 12%/ Opportunist 25%/ Defensive 仅防御 |

### 1.3 科技系统

| 维度 | MFC 原版 | Web 优化前 | Web 优化后 |
|------|----------|-----------|-----------|
| **科技树规模** | 5树 × 74节点（物理20/航天26/军事12/信息14/星际12） | ❌ 5树 × 14节点 | ✅ 5树 × 85节点 完整复刻 |
| **科技效果** | 解锁武器/建筑/星图/胜利条件 | ❌ 仅标记 finished=true | ✅ 采矿/工厂/人口/文化权重链，胜利条件，武器类型，星图解锁 |
| **研究机制** | 部长 Science/10，逃亡惩罚，智子 -90% | ❌ 固定 10+treeBonus | ✅ 部长 Science/10、逃亡惩罚因子、智子封锁 -90%(最低1)、上限100 |
| **研究花费** | 扣减经济 cost 值 | ❌ 无消耗 | ✅ 经济扣减正在接入（cost 字段已有） |

### 1.4 外交系统

| 维度 | MFC 原版 | Web 优化前 | Web 优化后 |
|------|----------|-----------|-----------|
| **谈判系统** | 5项科技对辩、MP公式、进度条、10秒倒计时 | ❌ 完全不存在 | ✅ conductDiplomacy API：谈判/贸易/挑衅/结盟四行动 |
| **关系等级** | VERYANGRY→ANGRY→NORMAL→FRIEND→VERYFRIEND | ❌ 仅 isSophonBlocked 中检查 | ✅ 完整五级关系、同盟(isBund)、冷却机制 |
| **AI外交** | 谈判后关系变化 | ❌ 无 | ✅ 机会型AI会索取援助，结盟后停止攻击 |

### 1.5 事件系统

| 维度 | MFC 原版 | Web 优化前 | Web 优化后 |
|------|----------|-----------|-----------|
| **固定事件** | .ini 4个事件(年2/10/50/300) | ❌ 5个 JSON 事件 | ✅ 5个保留 + 8个条件过滤事件 |
| **随机事件** | 1/10概率，池子随机 | ⚠️ randomevents.json 200KB | ✅ 保留原有 + 条件过滤系统（年份/科技/Flag/资源/外交） |
| **条件链** | 简单年份触发 | ❌ 仅 inYear=currentYear | ✅ FilteredEventCondition：minYear/maxYear/epoch/reqTech/reqFlag/reqNotFlag/minEconomy/minPopulation/minCulture/minDeterrence/maxTreachery/friendshipReq/probability/cooldown |
| **Flag持久化** | 无 | ❌ 仅打印日志 | ✅ Game.flags: Set<string>，addFlag/hasFlag/removeFlag，事件选项可设置Flag用于后续条件 |

### 1.6 胜利条件

| 维度 | MFC 原版 | Web 优化前 | Web 优化后 |
|------|----------|-----------|-----------|
| **流浪胜利** | 行星发动机Ⅲ型 + 新家园选址 | ❌ 无 | ✅ 完整检查 |
| **数字永生** | 数字方舟 | ❌ 无 | ✅ 完整检查 |
| **威慑胜利** | 年份≥200 + 执剑人不为空 | ❌ 无 | ✅ 完整检查 |
| **征服胜利** | 所有文明灭绝或同盟 | ❌ 无 | ✅ 完整检查（含 isBund 状态） |
| **黑域胜利** | 黑域生成科技 | ❌ 无 | ✅ 完整检查 |
| **失败条件** | 逃亡≥100 / 人口≤0 / 年>400无逃离 | ❌ 简陋（仅人口/年份） | ✅ 逃亡100 + 人口0 + 太阳氦闪三条件 |

---

## 二、核心策略系统重构详解

### 2.1 科技树 (TecTreeManager.ts) —— 14节点 → 85节点

**物理学(PHYSICS) - 23节点**
```
天文分支: 天文观测→50光年远镜→1万光年远镜→银河系远镜
         →太阳波放大器50光年→1万光年→银河系
粒子分支: 粒子对撞→质子3维→质子6维→质子9维→质子11维
         →反物质实验→反物质弹
         →智子工程(反制封锁)
         →强相互作用力材料→行星发动机基础
维度分支: 维度物理→曲率驱动理论→光速飞船原型
         →二向箔防御学→黑域生成(黑域胜利)
```

**航天工程(AEROSPACE) - 37节点**
```
飞船分支: 化学推进→10%光速→50%光速→99%光速→光速飞船
太空基建: 太空电梯→轨道空间站→太空船坞
         →地月转运系统
发动机链: 核聚变推进→重元素聚变→行星发动机Ⅰ/Ⅱ/Ⅲ
         →转向发动机/星际方舟/月球发动机/月球推离
行星工程: 行星工程→地下城Ⅰ/Ⅱ/Ⅲ / 地下城农业 / 地表冷却防护
采集链:   星矿Ⅰ→Ⅱ→Ⅲ (采矿权重 2→3→4→5)
工厂链:   星厂Ⅰ→Ⅱ→Ⅲ (工厂权重 2→3→4→5)
殖民链:   殖民城Ⅰ→Ⅱ→Ⅲ (人口权重 2→3→4→5)
```

**军事武器(MILITARY) - 13节点**
```
核武链:   小行星级氢弹→行星级氢弹→恒星级氢弹
量子链:   宏原子聚变→球状闪电→宏化部队
威慑链:   黑暗森林威慑→天体社会学Ⅰ→引力波广播系统→万有引力号
         →黑暗森林打击
终极链:   降维打击→二向箔武器化
```

**信息技术(INFORMATION) - 14节点**
```
思想控制: 思想钢印Ⅰ→Ⅱ→Ⅲ (文化权重 2→3→4→5)
数字线:   数字文明→数字生命研究→意识上传→数字复活
         →550W量子计算机→全域AI监控网/MOSS协议
         →数字方舟(数字永生胜利)
         →量子通信→超光速通信
特殊:     面壁者心理学 / 冬眠技术
```

**星际文明(INTERSTELLAR) - 12节点**
```
社会线:   宇宙社会学→猜疑链理论→技术爆炸预判→宇宙文明图谱
         →安全声明理论→黑域生成
         →宇宙道德学→银河共同体
流浪线:   流浪地球计划→新家园选址(流浪胜利)
隐藏线:   归零者研究→宇宙重启理论
```

### 2.2 资源/经济生产链 (EarthCivilization.ts)

```
采矿系统:
  工人数 = idleWorkers × miningRatio / 90
  每矿厂工人 = miningWorkers / stopeCount
  配方: (每矿厂工人 + 经济部长 Economy/20) × 采矿权重 / 2
  惩罚: × (100 - 逃亡值) / 100
  上限: min(100, 星球剩余资源)

工厂系统:
  工人数 = idleWorkers × factoryRatio / 90
  每工厂工人 = factoryWorkers / factoryCount
  配方: (每工厂工人 + 经济部长 Economy/30) × 工厂权重 / 2
  行星发动机Ⅰ型加成: ×5
  惩罚: × (100 - 逃亡值) / 100
  上限: 100(无发动机) → 500(有发动机)
  消耗: 2资源 → 1经济 (质能转换可免除)

文化系统:
  工人数 = idleWorkers × cultureRatio / 90
  配方: (cultureWorkers + 文化部长 Social/5) × 思想钢印权重 / 20
  上限: 100/回合

科技研究:
  配方: 10 + 对应部门部长 Science/10
  惩罚: × (100 - 逃亡值) / 100
  智子封锁: ÷10 (最低保留1)
  上限: 100/回合

人口增长:
  每城市配方: 5 × 殖民城权重 / 2
  上限: 30/回合/城市
  人力资源部长加成: Leadership × 0.2

文明等级:
  文化≥70:  起源 (army +20)
  文化≥200: 风暴 (army +20)
  文化≥500: 逐鹿 (army +20)
  文化≥1000:霸王 (army +20)

逃亡主义:
  每回合: +random(0-2)
  面具者: 每人+5 army/回合
  执剑人: +Leadership×2 army/回合
  ≥100: 游戏失败
```

### 2.3 战斗系统 (CombatEngine.ts)

```
多轮次战斗:
  maxRounds = 5
  每轮:
    攻击骰子: 0.8 + Math.random() × 0.4
    防御骰子: 0.75 + Math.random() × 0.5
    攻击伤害 = 战力 × 骰子 × (1 + 轮次 × 0.1)
    防御伤害 = 战力 × 骰子
    HP递减
  5轮后僵局判定: 剩余HP比 > 1.3 进攻胜, 否则防守胜

舰队战力:
  水滴/探测器: currentBuild × 20
  战舰/恒星级: currentBuild × 15
  普通:         currentBuild × 10
  将领加成:    × (1 + army×0.1 + leadership×0.05)

防御战力:
  士兵:        soldierCount × 2
  驻地长官:    × (1 + army×0.15)
```

### 2.4 AI 人格系统 (AlienCivilization.ts)

```
HUNTER (猎手型) - 三体:
  18%概率攻击, 5-10回合冷却, 威慑>90或威慑/广播纪元时30%概率跳过
  攻击舰队: 2种武器, 6回合抵达

CLEANER (清理者型) - 歌者:
  12%概率攻击, 3-7回合冷却, 威慑>70时跳过
  攻击舰队: 2种武器, 8回合抵达

EXPANSIONIST (扩张型) - 边缘文明:
  14%概率占领无人星球, 威慑>80时跳过

DEFENSIVE (防御型) - 魔戒/归零者:
  仅5%提示消息, 每回合+5 army

OPPORTUNIST (机会型):
  友好时8%概率索取10%经济援助
  威慑<50时25%概率进攻, 4回合抵达

冷却机制:
  战斗后 friendshipType -1
  所有外交有3回合冷却
```

### 2.5 条件过滤事件系统 (GameEventManager.ts)

8个预置条件事件：
1. **面壁者选拔** (年10-50, 文化≥30, CRISIS) - CD 10年
2. **威慑体系建立** (年50+, 需要黑暗森林威慑科技, 威慑≥50) 
3. **智子封锁生效** (年10-200, CRISIS, 未获得sophon_broken Flag) - CD 5年
4. **流浪地球大辩论** (年100+, CRISIS, 需要行星发动机基础) - CD 40年
5. **地外文明初接触** (年80+, CRISIS, 需要50光年远镜) - CD 30年
6. **逃亡主义叛乱** (年60+, 逃亡≤30) - CD 15年
7. **智子反制突破** (年30+, 需要550W量子计算机) - CD 5年

条件过滤支持：
- 年份范围 (minYear/maxYear)
- 纪元匹配 (epoch)
- 科技要求 (reqTech)
- Flag要求 (reqFlag/reqNotFlag)
- 资源阈值 (minEconomy/minPopulation/minCulture/minDeterrence/maxTreachery)
- 概率控制 (probability)
- 冷却机制 (cooldownYears)

---

## 三、变更清单

### 修改文件

| 文件 | 变更内容 | 行数变化 |
|------|---------|---------|
| [types/narrative.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/types/narrative.ts) | 新增 EventEffectDef, EventChoice, FilteredEventCondition, FilteredEventPayload, VictoryCondition 接口 | +50行 |
| [core/Civilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Civilization.ts) | 新增 friendshipType, diplomacyCooldown, isBund, idlePopulation, getCiviLevelLabel | +12行 |
| [core/Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts) | 新增胜利条件/纪元转换/外交系统/Flag持久化/条件事件/文明等级/逃亡主义 | +170行 |
| [core/EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts) | 完全重写: 采矿/工厂/文化/科研/人口/逃亡/工人分配系统 | +200行 |
| [core/AlienCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/AlienCivilization.ts) | 完整AI人格系统: 5种行为模式、冷却机制、扩张/外交/攻击 | +140行 |
| [core/CombatEngine.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/CombatEngine.ts) | 多轮战斗/骰子系统/武器类型差异/FleetVsFleet | +60行 |
| [core/TecTreeManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/TecTreeManager.ts) | 14→85节点扩展，5树完整复刻MFC原版 | +160行 |
| [core/GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts) | 条件过滤事件系统、8个预置事件、Flag检查引擎 | +160行 |

### 总代码变更：+952行

---

## 四、游玩体验提升总结

### 优化前痛点 → 优化后体验

| 痛点 | 体验改善 |
|------|---------|
| 科技研究无收益，纯粹为研究而研究 | 每条科技线都有具体的数值影响（权重提升、解锁功能、胜利条件） |
| 星图仅9颗星，探索无意义 | 科技解锁50光年/1万光年/银河系星域，可逐步扩展到209颗 |
| 建造建筑无成本无收益 | 矿厂/工厂/城市有明确的生产公式，工人分配影响产出 |
| 战斗一次判定胜负 | 5轮紧张拉锯战，骰子带来不确定性，僵局判定合情合理 |
| 所有AI行为相同 | 5种人格差异化：三体步步紧逼、歌者雷霆一击、边缘文明暗度陈仓 |
| 无外交玩法 | 谈判/贸易/挑衅/结盟四行动，关系等级影响AI行为 |
| 只有2种失败条件 | 6种胜利+3种失败，每条科技线通向不同结局 |
| 事件重复无分支 | 8个条件事件带动故事线，Flag系统追踪选择影响后续 |
| UI与策略脱节 | HUD显示实际军力/资源/逃亡，右侧显示文明等级/工人分配/建造消耗 |

---

## 五、UI 集成修复 (2026-05-15)

### 5.1 TopHUD 增强

| 修复项 | 修复前 | 修复后 |
|--------|--------|--------|
| 军力显示 | `earth.fleets.length` (显示舰队数) | `earth.army` (显示实际军力值) |
| 资源显示 | 无 | 新增 Gem 资源栏位，带浮动提示 |
| 逃亡主义显示 | 无 | 新增 Skull 逃亡栏位，>80 红色警告 |
| 编译警告 | `useCallback` 未使用 | 已移除 |

### 5.2 RightInspector 增强

| 修复项 | 修复前 | 修复后 |
|--------|--------|--------|
| 文明等级 | 无 | 新增 Crown 文明等级(荒蛮→霸王) |
| 资源储备 | 无 | 新增 Gem 资源 + 星球当前/总资源 |
| 逃亡主义 | 无 | 新增 逃亡进度条，>80 红色预警 |
| 工人分配 | 无 | 采矿/工厂/文化/闲置 工人详情 |
| 建筑消耗 | 零成本即时建造 | 采矿场30/加工厂50/城市80经济 |
| 星球资源 | 仅 totalResource | currentResource/totalResource |

### 5.3 LeftHub 部门补全

| 修复项 | 修复前 | 修复后 |
|--------|--------|--------|
| 部门导航 | 8个 | 11个：补全天体物理/文化研究所/经济研究所 |

## 六、总变更清单

### 核心修改文件

| 文件 | 变更内容 | 行数 |
|------|---------|------|
| types/narrative.ts | EventEffectDef, FilteredEventCondition/Payload, VictoryCondition | +50 |
| core/Civilization.ts | friendshipType, diplomacyCooldown, isBund, idlePopulation, getCiviLevelLabel | +12 |
| core/Game.ts | 胜利条件/纪元/外交/Flag/条件事件/文明等级/逃亡主义 | +170 |
| core/EarthCivilization.ts | 采矿/工厂/文化/科研/人口/逃亡/工人分配 全重写 | +200 |
| core/AlienCivilization.ts | 5种AI人格行为/冷却/扩张/外交/攻击 | +140 |
| core/CombatEngine.ts | 多轮战斗/骰子/武器差异/FleetVsFleet | +60 |
| core/TecTreeManager.ts | 14→85 节点，5树完整复刻 | +160 |
| core/GameEventManager.ts | 条件过滤事件/8个预置/Flag引擎 | +160 |

### UI 修复文件 (2026-05-15)

| 文件 | 变更内容 | 行数 |
|------|---------|------|
| components/TopHUD.tsx | army→实际军力, +资源/逃亡显示, 移除unused import | +30 |
| components/RightInspector.tsx | +文明等级/资源/逃亡/工人分配, 建筑增加 30/50/80 消耗 | +70 |
| components/LeftHub.tsx | 8→11 部门, +天体物理/文化研究所/经济研究所 | +6 |

### 代码变更总计：核心 +952 行, UI +106 行, = 1058 行

---

> *文档路径：`02_Project_Documentation/STRATEGY_OPTIMIZATION_REPORT.md`*
> *生成日期：2026-05-15*