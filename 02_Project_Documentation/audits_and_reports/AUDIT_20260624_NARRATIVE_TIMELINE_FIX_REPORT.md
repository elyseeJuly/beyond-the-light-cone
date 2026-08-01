# AUDIT_20260624_NARRATIVE_TIMELINE_FIX_REPORT.md

**修复日期**: 2026-06-24  
**修复依据**: [AUDIT_20260624_FULL_NARRATIVE_TIMELINE_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_FULL_NARRATIVE_TIMELINE_AUDIT.md)  
**修复版本**: Web Rebuild V2.3  
**修复人员**: AI Assistant  

---

## 一、修复总览

本次修复针对《光锥之外》叙事时间线审计报告中识别的 P0/P1/P2 级问题进行了系统性整改。修复范围覆盖外星文明外交状态、人物死亡纪元表、纪元切换前置检查、事件效果扩展、切片叙事时效性、新纪元宣告事件以及小宇宙结局路径。

| 类别 | 修复项数 | 验证结果 |
|------|----------|----------|
| P0 - 严重缺陷 | 2 | 已修复并验证 |
| P1 - 高优先级 | 5 | 已修复并验证 |
| P2 - 体验优化 | 2 | 已修复并验证 |
| P1/P2 二轮补齐 | 6 | 已修复并验证 |
| 测试修复 | 3 个文件，10 处断言 | 已修复并全量通过 |

---

## 二、P0 级修复

### 2.1 外星文明外交前置状态拆分

**问题**: `unlocked` 字段语义混淆，既表示"已发现/可观测"又表示"可外交"；二周目征服胜利会一次性解锁所有文明，导致未接触即可外交。

**修复内容**:
- 在 [AlienCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AlienCivilization.ts#L16) 中新增两个独立状态：
  - `discovered`: 文明已被地球观测/发现，可出现在星图/档案馆中
  - `contacted`: 文明已与地球建立可外交的通信信道，可执行 negotiate/trade/alliance/provoke
- 保留 `unlocked` getter/setter 作为 `contacted` 的兼容别名，确保旧存档和 UI 代码平滑过渡
- 在 [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1480) 中修正二周目征服胜利奖励：仅设置 `alien.discovered = true`，不再自动建立外交通信
- 在 [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1222) 的外交行动入口 `_conductDiplomacyInternal` 中增加 `contacted` 前置检查
- 在 [CivilizationArchive.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/CivilizationArchive.tsx#L76) 中按 `discovered` 过滤展示文明，并显示 `contacted` 状态
- 在 [DiplomacyPanel.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/DiplomacyPanel.tsx#L98) 中继续使用 `unlocked`（即 `contacted`）过滤外交列表

### 2.2 艾 AA、关一帆死亡纪元配置倒置

**问题**: 艾 AA 在危机纪元即被标记为死亡，关一帆在危机/威慑纪元被标记为死亡，导致关键人物在应登场的广播/掩体纪元无法出现。

**修复内容**:
- 在 [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L948) 的 `epochDeathMap` 中：
  - `"艾AA": []` — 活到宇宙终结
  - `"关一帆": []` — 活到宇宙终结

---

## 三、P1 级修复

### 3.1 8 位核心人物死亡时间过晚

**问题**: 伊文斯、林云、泰勒、雷迪亚兹、章北海、丁仪、罗辑、维德的死亡纪元设置过晚，玩家在他们应死亡的纪元后仍可任命。

**修复内容**（[GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L922)）:

| 人物 | 死亡纪元 | 原著依据 |
|------|----------|----------|
| 伊文斯 | DETERRENCE 及以后 | 危机纪元初古筝行动死亡 |
| 林云 | CRISIS 及以后 | 《球状闪电》结局后量子态化/退场 |
| 泰勒 | CRISIS 及以后 | 危机纪元破壁后自杀 |
| 雷迪亚兹 | CRISIS 及以后 | 危机纪元被人民砸死 |
| 章北海 | DETERRENCE 及以后 | 危机纪元末黑暗战役死亡 |
| 丁仪 | DETERRENCE 及以后 | 危机纪元末末日战役牺牲 |
| 罗辑 | GALAXY | 掩体纪元末冥王星二维化死亡 |
| 维德 | BUNKER、GALAXY | 掩体纪元被处决 |

### 3.2 19 位人物缺少生死配置

**问题**: 杨冬、汪淼、常伟思、大史、东方延绪、山杉惠子等 19 人未配置生死判定，默认永生。

**修复内容**:
- 在 [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L951) 中为以下人物补充 `epochDeathMap`：
  - 危机纪元初/黄金岁月末去世：叶文洁、汪淼、大史、常伟思、东方延绪、杨冬
  - 红岸基地事故（黄金岁月末）：雷志成、杨卫宁
  - 危机纪元中自杀/退场：山杉惠子、伊依、霍金、沈渊、水娃、严井、白冰、苗福全
  - 刘慈欣宇宙联动人物，默认活到较后：华华、滑膛、朱汉扬
  - 银河纪元去世：刘慈欣

### 3.3 纪元切换缺少关键事件前置

**问题**: 掩体纪元、银河纪元、星屑纪元仅靠文化值自动进入，缺少关键事件前置检查。

**修复内容**（[Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L725) `updateEpoch`）:

| 目标纪元 | 前置条件 | 说明 |
|----------|----------|------|
| 威慑纪元 | `deterrence_established` | 罗辑建立黑暗森林威慑 |
| 广播纪元 | `coordinates_broadcasted` | 万有引力号广播三体坐标 |
| 掩体纪元 | `bunker_world_completed` | 掩体太空城市群落成 |
| 银河纪元 | `galaxy_exodus_seen` 或 `dimensional_strike` | 银河流亡或二向箔打击 |
| 星屑纪元 | `stardust_era_declared` / `stardust_era_seen` / `zero_homer_contacted` | 星屑纪元宣告或归零者接触 |

### 3.4 杨冬自杀事件未设置人物死亡状态

**问题**: 杨冬在 year=0 事件中自杀，但 `isAlive` 状态未被设置为 false，仅设置了 `yangdong_suicide` flag。

**修复内容**:
- 在 [events.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/data/events.json#L122) 杨冬自杀事件的 `effects` 中增加 `kill_person` 效果
- 在 [EventSystem.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts) 中新增 `kill_person` 效果处理：设置 `isAlive = false`、`deathYear = game.year`，并发布讣告到历史记录和 ticker
- 在 [narrative.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/types/narrative.ts) 的 `EventEffectDef` 类型中增加 `kill_person`

### 3.5 切片叙事标签时长避免时代错乱

**问题**: 切片叙事基于标签和纪元生成，但不检查具体年份，可能出现时代错乱。

**修复内容**:
- 在 [SliceNarrativeEngine.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/SliceNarrativeEngine.ts) 中新增标签时效性过滤
- 非里程碑标签只在应用后 30 年内产生切片叙事，里程碑标签永久有效
- 在 [TagManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/TagManager.ts) 中新增 `getTag` 方法以获取标签详情

---

## 四、P2 级修复

### 4.1 小宇宙建造标志位设置路径

**问题**: `mini_universe_built` 标志位缺少对应的事件效果，死神永生结局可能无法达成。

**修复内容**:
- 在 [events.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/data/events.json#L1430) 中新增事件 `name: 405`：
  - 标题/对话：【小宇宙对接】
  - 触发条件：GALAXY 纪元、year ≥ 405、前置 `galaxy_exodus_seen`
  - 效果：设置 `mini_universe_built` flag、文化 +80、威慑值 +10

### 4.2 新纪元宣告仪式事件

**问题**: 缺少新纪元正式开启的专属宣告事件，纪元切换由文化值自动判定，玩家缺少仪式感知。

**修复内容**（[events.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/data/events.json)）:

| 纪元 | 事件 name | 宣告者 | 关键 flag |
|------|-----------|--------|-----------|
| 威慑纪元 | 201 | 联合国秘书长 | `deterrence_era_declared` |
| 广播纪元 | 261 | PDC 首席科学家 | `broadcast_era_declared` |
| 掩体纪元 | 281 | 联合政府 | `bunker_era_declared` |
| 银河纪元 | 370 | 星环号舰长 | `galaxy_era_declared` |
| 星屑纪元 | 420 | 关一帆 | `stardust_era_declared` |

其中威慑、广播宣告事件为本次修复前已存在；掩体、银河、星屑宣告事件为本次新增或升级。

---

## 五、测试修复

由于 P0 外交状态拆分和 P1 纪元前置检查引入了新的运行时约束，以下测试文件需要同步更新：

| 文件 | 修复内容 |
|------|----------|
| [EdgeCases.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/EdgeCases.test.ts#L382) | STARDUST 纪元边界测试补充 `zero_homer_contacted` 前置 flag |
| [Game.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/Game.test.ts#L312) | 歌者外交测试统一设置 `geZhe.contacted = true`，验证通信未建立时拒绝外交 |
| [DataSchema.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/data/DataSchema.test.ts#L187) | 非人物对话者白名单补充"联合国秘书长"、"星环号科学官"、"PDC 首席科学家" |

---

## 六、验证结果

| 验证项 | 命令 | 结果 |
|--------|------|------|
| TypeScript 类型检查 | `npm run typecheck` | 0 错误 |
| 全量单元测试 | `npm test` | 864 / 864 通过 |
| 测试文件数 | - | 41 个文件全部通过 |

---

## 七、修改文件清单

- `03_Web_Rebuild/src/core/AlienCivilization.ts`
- `03_Web_Rebuild/src/core/EventCadence.ts`
- `03_Web_Rebuild/src/core/Game.ts`
- `03_Web_Rebuild/src/core/GameEventManager.ts`
- `03_Web_Rebuild/src/core/SliceNarrativeEngine.ts`
- `03_Web_Rebuild/src/core/TagManager.ts`
- `03_Web_Rebuild/src/core/subsystems/EventSystem.ts`
- `03_Web_Rebuild/src/components/CivilizationArchive.tsx`
- `03_Web_Rebuild/src/data/events.json`（新增：希恩斯破壁、执剑人选择、威慑持续、罗辑连任广播、维德选择分支、光速飞船量产、三大路线选择；危机开始事件改为 ticker 事件）
- `03_Web_Rebuild/src/types/narrative.ts`
- `03_Web_Rebuild/src/test/core/EdgeCases.test.ts`
- `03_Web_Rebuild/src/test/core/Game.test.ts`
- `03_Web_Rebuild/src/test/data/DataSchema.test.ts`（适配 ticker 事件模式）

---

## 八、剩余未修复项（二轮修复后全部补齐）

以下为二轮修复中新完成的前次报告"剩余未修复项"：

### 8.1 杨冬自杀与危机纪元开始的循环依赖 (P2)
- 将危机纪元开始事件（name=0）改为 **ticker 事件**（talkcount=-1），使用 `tip` 字段替代对话体
- 移除 `reqFlag: yangdong_suicide`，消除循环依赖
- 杨冬自杀事件保持为对话事件，正常触发

### 8.2 希恩斯破壁事件 (P2)
- 新增事件 name=25，位于思想钢印事件之后
- 山杉惠子（希恩斯的妻子和破壁人）揭示其真实计划
- 设置 `hines_breached` flag，prestige -10，treachery +8

### 8.3 执剑人选择影响威慑成败 (P1)
- 执剑人交接事件（name=219）改为选择分支：
  - "任命程心为第二任执剑人" → 威慑破裂路径，触发 `deterrence_broken`
  - "罗辑连任执剑人，继续威慑" → 威慑持续路径，触发 `deterrence_held_strong`
- 威慑破裂事件（name=220）改为 `reqFlag: swordholder_chengxin`
- 新增威慑持续事件（name=220）：`reqFlag: swordholder_luoji_retained`
- 新增罗辑连任路径的引力波广播事件（name=230）：`reqFlag: deterrence_held_strong`

### 8.4 维德反叛玩家选择分支 (P1)
- 维德反叛事件（name=300）改为选择分支：
  - "支持维德，全力推进光速飞船" → 军事 +50，treachery +30，触发 `supported_wade`
  - "阻止维德，维护联合政府权威" → 军事 -100，触发 `wade_opposed`
- 维德处决事件（name=310）改为 `reqFlag: wade_opposed`
- 新增维德成功事件（name=310）：光速飞船量产，军事 +100，触发 `wade_succeeded`

### 8.5 掩体 vs 黑域 vs 光速飞船路线选择 (P1)
- 黑域辩论事件（name=225）改为三大路线选择：
  - "掩体路线：建造木星/土星背面太空城" → `route_bunker_chosen`
  - "黑域路线：发布宇宙安全声明" → `route_black_domain_chosen`
  - "光速飞船路线：不惜代价逃离太阳系" → `route_lightspeed_chosen`

### 8.6 整合 timeline.json 为底部资讯时间线锚点 (P2)
- 在 [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) 中导入 `timeline.json`
- 纪元切换时自动注入 `📜【纪元名】年份范围 | 纪元描述` 到底部 ticker 播报
- 支持银河纪元/黑域纪元和星屑纪元的模糊匹配

---

## 九、最终验证结果

| 验证项 | 命令 | 结果 |
|--------|------|------|
| TypeScript 类型检查 | `npm run typecheck` | 0 错误 |
| 全量单元测试 | `npm test` | 864 / 864 通过，41 文件 |
| 测试回归 | 二轮修复中修正 2 处 DataSchema 测试 | 全部通过 |

---

**报告生成时间**: 2026-06-24  
**最终状态**: 审计报告全部 P0/P1/P2 可修复项已完成，通过验证，待提交
