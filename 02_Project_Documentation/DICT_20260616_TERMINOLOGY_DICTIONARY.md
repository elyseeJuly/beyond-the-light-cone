# 全局术语与代码命名规范词典 (Terminology & Naming Dictionary)
> **Establishment Date**: 2026-06-16
> **Last Updated**: 2026-06-16 (V2.1 — 术语审计修复)
> **Authoritative Version**: V2.1
> **Target Directory**: `02_Project_Documentation/`

## 1. 概述与目的
本文档旨在统一《光锥之外：纪元往事》（Beyond the Light Cone）项目中的名词术语与代码变量命名规范。由于项目涉及大量《三体》宇宙观及硬核科幻概念，极易在文档与代码中出现"同义不同名"或"中英翻译不一致"的问题。

本词典严格按照 **术语 + 代码映射 + 定义 + 首次出现文档 + 同义词黑名单** 的格式进行梳理，供开发团队与 AI 协同工具查阅。

**审计说明**：V2.0 版在 V1.0 基础上，对照全部源码枚举、数据文件、事件配置、角色配置、外星文明配置及企划文档，补充了原版缺失的 **黄金岁月纪元、完整部门体系、完整科技分支、完整结局判定、人物角色表、地外文明表、外交系统、事件系统、武器系统、文明等级、游戏模式、OST 音乐术语** 等关键内容。

---

## 2. 核心世界观与纪元 (Epochs)

### 黄金岁月 (Golden Age)
- **代码映射**: `EpochType.GOLDEN`
- **规范定义**: 红岸基地建立至三体危机爆发前夕。人类尚不知晓地外文明存在，基础科学蓬勃发展。
- **首次出现**: `README.md` / `src/data/epochs.json`
- **同义词黑名单**: 🚫 `GoldenEra`, 🚫 `PreCrisis`, 🚫 `Epoch0`

### 危机纪元 (Crisis Epoch)
- **代码映射**: `EpochType.CRISIS`
- **规范定义**: 三体危机爆发，全世界进入战时体制。基础科学被锁死，人类开始寻找破局手段。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `CrisisEra`, 🚫 `Epoch1`, 🚫 `WAR_TIME`

### 威慑纪元 (Deterrence Epoch)
- **代码映射**: `EpochType.DETERRENCE`
- **规范定义**: 黑暗森林威慑成功建立，两界达成冷战式和平。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `PeaceEpoch`, 🚫 `DeterEra`, 🚫 `Epoch2`

### 广播纪元 (Broadcast Epoch)
- **代码映射**: `EpochType.BROADCAST`
- **规范定义**: 坐标暴露，引力波广播启动，毁灭开始倒计时。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `RadioEpoch`, 🚫 `ExposedEpoch`, 🚫 `Epoch3`

### 掩体纪元 (Bunker Epoch)
- **代码映射**: `EpochType.BUNKER`
- **规范定义**: 太阳系黑暗森林打击临近，太空城市群在气态行星背面落成。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `ShelterEpoch`, 🚫 `HideEpoch`, 🚫 `Epoch4`

### 银河纪元 (Galaxy Epoch)
- **代码映射**: `EpochType.GALAXY`
- **规范定义**: 太阳系遭到二维化降维打击，人类火种逃往银河系深空。别名"黑域纪元"。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `SpaceEpoch`, 🚫 `EscapeEpoch`, 🚫 `Epoch5`

### 星屑纪元 (Stardust Epoch)
- **代码映射**: `EpochType.STARDUST`
- **规范定义**: 大宇宙降维碎裂，人类分散在废墟中以"星屑遗泽"重燃火种（Web版新增）。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `EndEpoch`, 🚫 `DustEpoch`, 🚫 `Epoch6`

### 纪元文化值阈值
- **黄金岁月**: culture < 0（负值）
- **危机纪元**: 0 ≤ culture ≤ 199
- **威慑纪元**: 200 ≤ culture ≤ 499
- **广播纪元**: 500 ≤ culture ≤ 799
- **掩体纪元**: 800 ≤ culture ≤ 1199
- **银河纪元**: 1200 ≤ culture ≤ 2499
- **星屑纪元**: culture ≥ 2500
- **代码映射**: `src/data/epochs.json`
- **首次出现**: `src/core/Game.ts`

---

## 3. 基础资源与属性 (Resources & Attributes)

### 文化 / 文化值 (Culture)
- **代码映射**: `Civilization.culture`
- **规范定义**: 用于推动文明在猜疑链中生存及纪元晋升的核心点数。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `Science`, 🚫 `Knowledge`, 🚫 `CivPoint`

### 经济 / 经济点 (Economy)
- **代码映射**: `Civilization.economy`
- **规范定义**: 建设、生产与舰队维护的基础货币。由星矿资源按 2:1 转化。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `Money`, 🚫 `Credits`, 🚫 `Gold`

### 星矿 / 资源 (Star Ore / Resource)
- **代码映射**: `Civilization.resource`
- **规范定义**: 宇宙中直接开采的实体资源，加工工厂的基础原料。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `Minerals`, 🚫 `Ore`, 🚫 `Materials`

### 人口 (Population)
- **代码映射**: `Civilization.population`
- **规范定义**: 文明发展的人力基础，受太空城市群容量上限影响。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `People`, 🚫 `Citizens`, 🚫 `Labor`

### 叛变率 / 社会动荡值 (Treachery)
- **代码映射**: `Civilization.treachery`
- **规范定义**: 衡量内部不稳定性的数值。过高将触发"逃亡主义暴乱"等失败结局。
- **首次出现**: `src/core/Civilization.ts`
- **同义词黑名单**: 🚫 `Rebellion`, 🚫 `RiotRate`, 🚫 `Unrest`

### 军力 (Army)
- **代码映射**: `Civilization.army`
- **规范定义**: 文明军事力量的量化指标，影响舰队战斗力与防御能力。
- **首次出现**: `src/core/Civilization.ts`
- **同义词黑名单**: 🚫 `Military`, 🚫 `Soldiers`, 🚫 `CombatPower`
- **注意**: 事件数据中允许使用 `"military"` 作为别名，在 `Game.EFFECT_TARGET_ALIAS` 中统一映射为 `army`。

### 威慑度 (Deterrence Value)
- **代码映射**: `EarthCivilization.deterrenceValue`
- **规范定义**: 黑暗森林威慑的综合强度值，由执剑人领导力与面壁计划进度共同决定。影响外交成功率与三体文明的好战倾向。
- **首次出现**: `src/core/EarthCivilization.ts`
- **同义词黑名单**: 🚫 `prestige`, 🚫 `threatLevel`
- **注意**: 事件数据中允许使用 `"prestige"` 作为别名，在 `Game.EFFECT_TARGET_ALIAS` 中统一映射为 `deterrenceValue`。

### 文明等级 (Civilization Level)
- **代码映射**: `Civilization.civiLevel` → `getCiviLevelLabel()`
- **规范定义**: 文明发展阶段的等级标签，5级体系：荒蛮文明 → 工业文明 → 星际文明 → 银河文明 → 超维文明。
- **首次出现**: `src/core/Civilization.ts:L35-L38`
- **同义词黑名单**: 🚫 `CivStage`, 🚫 `TechLevel`

### 闲置人口 (Idle Population)
- **代码映射**: `Civilization.idlePopulation`
- **规范定义**: 未被分配到采矿、工厂或文化工作的闲置劳动力。
- **首次出现**: `src/core/EarthCivilization.ts`
- **同义词黑名单**: 🚫 `Unemployed`, 🚫 `FreeWorkers`

---

## 4. 部门与设施 (Departments & Facilities)

### 4.1 完整部门体系（11个）

#### 经济部 (Economy Department)
- **代码映射**: `DepartmentType.ECONOMY` (0)
- **规范定义**: 负责经济产出与资源调配的核心行政部门。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `Treasury`, 🚫 `FinanceDept`

#### 军事部 (Military Department / Army)
- **代码映射**: `DepartmentType.ARMY` (1)
- **规范定义**: 负责行星防御与武装力量建设。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `DefenseDept`, 🚫 `WarDept`

#### 文化部 (Culture Department)
- **代码映射**: `DepartmentType.CULTURE` (2)
- **规范定义**: 负责文化产出与社会意识形态建设。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `ArtsDept`, 🚫 `SocialDept`

#### 人力资源部 (Human Resources Department)
- **代码映射**: `DepartmentType.HUMANRES` (3)
- **规范定义**: 负责人力资源调配与领导力培养。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `HRDept`, 🚫 `PersonnelDept`

#### 宇宙社会学部 (AstroSociology Department)
- **代码映射**: `DepartmentType.ASTROSOCIOLOGY` (4)
- **规范定义**: 负责解析猜疑链、执行威慑和面壁计划的特殊部门。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `SociologyDept`, 🚫 `AlienDiplomacy`

#### 核技术部 (Nuclear Technology)
- **代码映射**: `DepartmentType.NUCLEAR` (5)
- **规范定义**: 负责核能开发与恒星级武器的研发。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `NuclearDept`, 🚫 `AtomicDept`

#### 航天技术部 / 太空军 (Space Force / Aerospace)
- **代码映射**: `DepartmentType.SPACEFIGHT` (6)
- **规范定义**: 负责星际舰队建设和前线作战的核心军事部门。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `SpaceArmy`, 🚫 `StarFleetDept`

#### 质子技术部 (Proton Technology)
- **代码映射**: `DepartmentType.PROTON` (7)
- **规范定义**: 负责智子(质子)多维展开与微观物理研究。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `ProtonDept`, 🚫 `SophonDept`

#### 天体物理部 (Astrophysics)
- **代码映射**: `DepartmentType.ASTROPHYSICS` (8)
- **规范定义**: 负责天文观测与宇宙学前沿研究。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `AstronomyDept`, 🚫 `SpaceScience`

#### 文化科技研究所 (Culture Technology)
- **代码映射**: `DepartmentType.CULTURETEC` (9)
- **规范定义**: 负责文化科技融合研究与艺术创新。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `CulTechDept`, 🚫 `ArtTech`

#### 经济科技研究所 (Economy Technology)
- **代码映射**: `DepartmentType.ECONOMYTEC` (10)
- **规范定义**: 负责经济科技应用与产业升级研究。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `EconTechDept`, 🚫 `IndustryTech`

### 4.2 设施 (Facilities)

#### 采矿场 / 星矿设施 (Stope)
- **代码映射**: `BuildingType.STOPE`
- **规范定义**: 部署在星系内用于开采基础星矿的设施。
- **首次出现**: `src/core/Building.ts`
- **同义词黑名单**: 🚫 `Mine`, 🚫 `MiningCamp`, 🚫 `Extractor`

#### 工厂 / 加工厂 (Factory)
- **代码映射**: `BuildingType.FACTORY`
- **规范定义**: 将星矿转化为经济收入的核心加工设施。
- **首次出现**: `src/core/Building.ts`
- **同义词黑名单**: 🚫 `Plant`, 🚫 `Manufactory`, 🚫 `Refinery`

#### 殖民城 / 太空城 (City)
- **代码映射**: `BuildingType.CITY`
- **规范定义**: 提供人口居住上限的宏伟太空人工环境。
- **首次出现**: `src/core/Building.ts`
- **同义词黑名单**: 🚫 `Colony`, 🚫 `Habitat`, 🚫 `SpaceStation`

---

## 5. 科技分支 (Technology Branches)

### 基础物理学 (Physics)
- **代码映射**: `TecTreeType.PHYSICS` (0)
- **规范定义**: 涵盖强相互作用到维度物理，最终解锁黑域生成。核心节点：天文观测 → 粒子对撞实验 → 维度物理 → 曲率驱动/二向箔防御。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `BasicScience`, 🚫 `QuantumTech`

### 航天工程 (Aerospace)
- **代码映射**: `TecTreeType.AEROSPACE` (1)
- **规范定义**: 推进技术到行星发动机，最终解锁流浪地球。核心节点：化学推进 → 核聚变推进 → 行星发动机Ⅰ/Ⅱ/Ⅲ型。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `FlightTech`, 🚫 `ShipEngineering`

### 军事科学 (Military)
- **代码映射**: `TecTreeType.MILITARY` (2)
- **规范定义**: 核武到维度武器的军事技术树。核心节点：小行星级氢弹 → 恒星级氢弹、宏原子聚变 → 球状闪电、黑暗森林威慑 → 引力波广播、降维打击 → 二向箔武器化。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `WeaponTech`, 🚫 `CombatTech`

### 信息技术 (Information)
- **代码映射**: `TecTreeType.INFORMATION` (3)
- **规范定义**: 数字文明与意识上传技术树。核心节点：思想钢印Ⅰ/Ⅱ/Ⅲ、数字文明 → 意识上传 → 数字方舟 / 550W量子计算机。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `InfoTech`, 🚫 `DigitalTech`

### 星际文明 (Interstellar)
- **代码映射**: `TecTreeType.INTERSTELLAR` (4)
- **规范定义**: 宇宙社会学与技术爆炸研判，最终指向宇宙重启。核心节点：宇宙社会学 → 猜疑链理论 → 宇宙文明图谱、安全声明理论 → 黑域生成、归零者研究 → 宇宙重启理论。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `DiplomacyTech`, 🚫 `AlienTech`

### 各科技树核心节点速查

| 科技树 | 低级节点 | 中级节点 | 终极节点 |
| :--- | :--- | :--- | :--- |
| PHYSICS | 天文观测、粒子对撞 | 质子展开、强互作用材料 | 光速飞船原型、黑域生成 |
| AEROSPACE | 化学推进、核聚变推进 | 太空电梯、行星发动机Ⅰ | 行星发动机Ⅲ、星际方舟 |
| MILITARY | 小行星级氢弹、宏原子聚变 | 球状闪电、引力波广播 | 二向箔武器化、万有引力号 |
| INFORMATION | 思想钢印Ⅰ、数字文明 | 意识上传、550W量子计算机 | 数字方舟、MOSS协议 |
| INTERSTELLAR | 宇宙社会学、流浪地球计划 | 猜疑链理论、归零者研究 | 银河共同体、宇宙重启理论 |

---

## 6. 结局判定 (Victory & Defeat)

### 6.1 胜利结局 (VictoryType)

#### 征服胜利 (Conquest Victory)
- **代码映射**: `VictoryType.CONQUEST`
- **规范定义**: 消灭所有敌对地外文明，统一银河系。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `MilitaryVictory`, 🚫 `TotalVictory`

#### 威慑胜利 (Deterrence Victory)
- **代码映射**: `VictoryType.DETERRENCE`
- **规范定义**: 成功建立并维持黑暗森林威慑，达成战略平衡。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `PeaceVictory`, 🚫 `ThreatVictory`

#### 黑域胜利 (Dark Domain Victory)
- **代码映射**: `VictoryType.DARK_DOMAIN`
- **规范定义**: 发布宇宙安全声明（黑域生成），使太阳系成为不可打击的低光速黑洞区。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `BlackDomain`, 🚫 `SafeZoneVictory`

#### 流浪胜利 (Wandering Victory)
- **代码映射**: `VictoryType.WANDERING`
- **规范定义**: 启动行星发动机，推着地球逃出太阳系。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `EscapeVictory`, 🚫 `EarthWander`

#### 数字永生胜利 (Digital Victory)
- **代码映射**: `VictoryType.DIGITAL`
- **规范定义**: 全人类意识上传至数字方舟，实现意识永存。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `DigitalEternity`, 🚫 `UploadVictory`

#### 隐藏胜利 (Hidden Victory)
- **代码映射**: `VictoryType.HIDDEN`
- **规范定义**: 达成宇宙重启等特殊条件解锁的隐藏结局。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `SecretVictory`, 🚫 `EasterEgg`

### 6.2 失败结局 (DefeatType)

#### 叛变失败 (Treachery Defeat)
- **代码映射**: `DefeatType.TREACHERY`
- **规范定义**: 社会动荡值过高，逃亡主义暴乱导致文明崩溃。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `RebellionDefeat`, 🚫 `RiotDefeat`

#### 灭绝失败 (Extinction Defeat)
- **代码映射**: `DefeatType.EXTINCTION`
- **规范定义**: 文明因战争、资源枯竭等原因全面灭绝。
- **首次出现**: `src/types/enums.ts`
- **同义词黑名单**: 🚫 `Annihilation`, 🚫 `TotalDieOut`

#### 氦闪吞没 (Helium Flash)
- **代码映射**: `DefeatType.HELIUM_FLASH`
- **规范定义**: 太阳发生氦闪，未及时逃离导致地球文明毁灭。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `SunExplosion`, 🚫 `SolarFlareDefeat`

#### 降维打击 (Dimension Strike)
- **代码映射**: `DefeatType.DIMENSION_STRIKE`
- **规范定义**: 遭受高级文明抛出的二向箔，导致太阳系二维化毁灭。
- **首次出现**: `README.md`
- **同义词黑名单**: 🚫 `2D_Strike`, 🚫 `VectorDefeat`, 🚫 `FoilDefeat`

---

## 7. 人物角色 (Persons)

### 7.1 核心角色列表（共32人）

| 中文名 | 代码映射 (persons.json) | 角色定位 | 关键属性 |
| :--- | :--- | :--- | :--- |
| 丁仪 | `persons.json: 丁仪` | 基础物理学家 | science:95, treachery:5 |
| 罗辑 | `persons.json: 罗辑` | 面壁者/第一代执剑人 | leadership:85, science:90 |
| 林云 | `persons.json: 林云` | 量子武器专家 | army:80, science:90 |
| 叶文洁 | `persons.json: 叶文洁` | 红岸基地/ETO精神领袖 | science:98, treachery:70 |
| 大史/史强 | `persons.json: 大史` | 行星防御安全部警官 | army:85, social:95 |
| 伊依 | `persons.json: 伊依` | 艺术家/文化输出者 | art:90, social:80 |
| 沈渊 | `persons.json: 沈渊` | 战略科学家 | science:92, treachery:10 |
| 霍金 | `persons.json: 霍金` | 理论物理学家 | science:99, art:40 |
| 常伟思 | `persons.json: 常伟思` | 行星防御理事会主席 | army:90, leadership:95 |
| 庄颜 | `persons.json: 庄颜` | 罗辑的挚爱/艺术学者 | art:98, treachery:0 |
| 章北海 | `persons.json: 章北海` | 太空军政委/逃亡主义 | army:98, leadership:92 |
| 水娃 | `persons.json: 水娃` | 文化研究者 | social:60, science:40 |
| 华华 | `persons.json: 华华` | 青年科学家 | science:50, social:70 |
| 希恩斯 | `persons.json: 希恩斯` | 面壁者/思想钢印发明者 | science:96, treachery:40 |
| 雷迪亚兹 | `persons.json: 雷迪亚兹` | 面壁者/恒星级氢弹计划 | army:85, economy:70 |
| 泰勒 | `persons.json: 泰勒` | 面壁者/量子幽灵舰队 | army:60, economy:80 |
| 东方延绪 | `persons.json: 东方延绪` | 太空军自然选择号舰长 | army:75, leadership:80 |
| 雷志成 | `persons.json: 雷志成` | 红岸基地政委 | science:70, treachery:60 |
| 杨卫宁 | `persons.json: 杨卫宁` | 红岸基地总工程师 | science:85, treachery:10 |
| 严井 | `persons.json: 严井` | 政治/社会官员 | social:50, army:40 |
| 白冰 | `persons.json: 白冰` | 科学研究者 | science:94, treachery:5 |
| 苗福全 | `persons.json: 苗福全` | 资源大亨/民间资本 | economy:90, social:70 |
| 滑膛 | `persons.json: 滑膛` | 职业杀手 | army:95, treachery:80 |
| 朱汉扬 | `persons.json: 朱汉扬` | 社会活动家 | social:80, army:60 |
| 刘慈欣 | `persons.json: 刘慈欣` | 作家/文明观察者（跨界） | art:99, science:90 |
| 程心 | `persons.json: 程心` | 第二代执剑人 | social:85, science:80 |
| 维德 | `persons.json: 维德` | 光速飞船倡导者 | army:90, leadership:95 |
| 云天明 | `persons.json: 云天明` | 阶梯计划核心/童话传递 | art:95, science:75 |
| 艾AA | `persons.json: 艾AA` | 程心助手/社会活动家 | economy:80, social:90 |
| 智子 | `persons.json: 智子` | 三体文明代言人 | science:99, treachery:90 |
| 汪淼 | `persons.json: 汪淼` | 纳米科学家 | science:90, treachery:5 |
| 杨冬 | `persons.json: 杨冬` | 理论物理学家 | science:95, treachery:0 |
| 伊文斯 | `persons.json: 伊文斯` | ETO创始人 | economy:95, treachery:95 |
| 关一帆 | `persons.json: 关一帆` | 宇宙航行者/科学家 | science:85, treachery:5 |
| 山杉惠子 | `persons.json: 山杉惠子` | 希恩斯之妻/破壁人 | science:70, treachery:70 |

### 7.2 角色属性说明
- 每位角色拥有 8 项基础属性：**army**(军力)、**economy**(经济)、**leadership**(领导力)、**art**(艺术)、**science**(科学)、**treachery**(叛变倾向)、**social**(社交)
- **代码映射**: `src/core/Person.ts` — `interface Person`
- **首次出现**: `src/data/persons.json`

---

## 8. 地外文明 (Alien Civilizations)

### 8.1 当前游戏中文明列表（9个）

| 文明名称 | 代码映射 (aliens.json) | 出处 | AI人格 | 资源值 | 人口上限 |
| :--- | :--- | :--- | :---: | :---: | :---: |
| 三体 (Trisolaris) | `aliens.json: 三体` | 《三体》三部曲 | HUNTER(0) | 1000 | 200 |
| 歌者 (Singer) | `aliens.json: 歌者` | 《三体III》 | CLEANER(1) | 2000 | 500 |
| 边缘世界 (Edge World) | `aliens.json: 边缘世界` | 《三体III》 | EXPANSIONIST(3) | 1500 | 300 |
| 魔戒 (Ring) | `aliens.json: 魔戒` | 《三体III》 | DEFENSIVE(2) | 1200 | 100 |
| 归零者 (Zero-Homer) | `aliens.json: 归零者` | 《三体III》 | DEFENSIVE(2) | 3000 | 1000 |
| 碳基联邦 (Carbon Federation) | `aliens.json: 碳基联邦` | 《乡村教师》 | EXPANSIONIST(3) | 2500 | 800 |
| 硅基帝国 (Silicon Empire) | `aliens.json: 硅基帝国` | 《乡村教师》 | HUNTER(0) | 2800 | 600 |
| 上帝文明 (God Civilization) | `aliens.json: 上帝文明` | 《赡养上帝》 | DEFENSIVE(2) | 3500 | 500 |
| 量子态文明 (Quantum Civilization) | `aliens.json: 量子态文明` | 《球状闪电》 | DEFENSIVE(2) | 1500 | 200 |

### 8.2 文明特征速查
- **星系位置 (starsys)**：1=行星系, 2=恒星系, 3=银河系级
- **AI人格 (AiPersonality)**：见下文 §9.1
- **默认解锁**：仅"三体"初始解锁，其余需通过游戏进程发现
- **首次出现**: `src/data/aliens.json` / `src/core/AlienCivilization.ts`

---

## 9. 外交与 AI 系统 (Diplomacy & AI)

### 9.1 AI人格类型 (AiPersonality)

| 人格 | 代码映射 | 行为特征 |
| :--- | :--- | :--- |
| 猎人 (Hunter) | `AiPersonality.HUNTER` | 高侵略性，低威慑时主动进攻 |
| 清理者 (Cleaner) | `AiPersonality.CLEANER` | 清理倾向，中等威慑阈值即发动攻击 |
| 防御型 (Defensive) | `AiPersonality.DEFENSIVE` | 消极扩张，加强防御，友好度倾向高 |
| 扩张型 (Expansionist) | `AiPersonality.EXPANSIONIST` | 积极占领无主星球 |
| 机会主义 (Opportunist) | `AiPersonality.OPPORTUNIST` | 低威慑时攫取利益，高友好时索取援助 |

### 9.2 外交状态 (DiplomacyState)

| 状态 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 灭绝战争 | `DiplomacyState.EXTINCTION_WAR` | 全面战争状态 |
| 猜疑对峙 | `DiplomacyState.SUSPICION` | 高度不信任 |
| 武装和平 | `DiplomacyState.ARMED_PEACE` | 脆弱的威慑平衡 |
| 合作 | `DiplomacyState.COOPERATION` | 经济技术交流 |
| 同盟 | `DiplomacyState.ALLIANCE` | 军事防御同盟 |
| 命运共同体 | `DiplomacyState.COMMUNITY` | 完全一体化 |

### 9.3 友好度等级 (FriendshipType)
- **代码映射**: `FriendshipType`
- VERYANGRY(0) → ANGRY(1) → NORMAL(2) → FRIEND(3) → VERYFRIEND(4)
- VERYANGRY 时 AI 会发动水滴打击或二向箔打击
- FRIEND 以上时 AI 会赠予科技研发进度

### 9.4 特殊外交机制

| 机制 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 水滴打击 | `launchWaterdropAttack()` | AI怒时派遣水滴探测器 |
| 交接危机 | `launchHandoverWaterdropAttack()` | 执剑人交接时Leader<60即触发 |
| 二向箔打击 | `triggerDimensionStrike()` | 终极武器，5回合后降临 |
| 引力波广播 | `checkGravityBroadcast()` | AI可广播地球坐标 |
| 猎人人格冷却 | `attackCooldown` | 进攻后有冷却回合 |

- **首次出现**: `src/core/AlienCivilization.ts` / `src/types/enums.ts`

---

## 10. 事件系统 (Event System)

### 10.1 事件类型 (EventType)

| 类型 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 固定年份事件 | `EventType.INYEAR` (0) | 在指定年份固定触发 |
| 字符串索引事件 | `EventType.STRINGINDEX` (1) | 通过名称索引匹配触发 |
| 随机事件 | `EventType.RANDOM` (2) | 满足条件随机概率触发 |

### 10.2 事件效果 (EventEffect)

| 效果 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 无效果 | `EventEffect.NONE` | 纯叙事事件 |
| 减经济 | `EventEffect.ADDECONEMY` | 经济值变更 |
| 加文化 | `EventEffect.ADDCULTURE` | 文化值变更 |
| 加人口 | `EventEffect.ADDPOP` | 人口变更 |
| 减叛变率 | `EventEffect.REDUCE_TREACHERY` | 降低动荡 |
| 战争 | `EventEffect.WAR` | 触发战争 |
| 月球危机 | `EventEffect.MOON_CRISIS` | 月球解体危机 |
| 流浪地球 | `EventEffect.WANDERING_EARTH` | 触发流浪结局 |

### 10.3 事件轨道 (EventLane)

| 轨道 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 里程碑 | `'milestone'` | 主线关键事件 |
| 重大 | `'major'` | 重要分支事件 |
| 环境 | `'ambient'` | 氛围/随机事件 |
| 危机 | `'crisis'` | 危机类事件 |
| 角色 | `'character'` | 角色专属事件 |

### 10.4 事件数据结构
- **代码映射**: `src/core/GameEvent.ts` — `interface GameEvent`
- 核心字段：`name`, `type`, `inYear`, `tip`, `effect`, `dialogNodes`, `triggerCondition`, `choices`
- **数据文件**: `src/data/events.json`（固定事件）、`src/data/randomevents.json`（随机事件）

### 10.5 UEE 通用事件引擎模块
- **TagManager**: 世界状态标签系统，用于事件的语义化标记与筛选
- **EcologyChain**: 事件生态链，管理事件之间的因果继承关系
- **RelationNetwork**: 角色关系网络，初始化规范关系
- **AtmosphereEngine**: 氛围引擎，根据游戏状态生成环境叙事
- **HistoryGenerator**: 历史记录生成器，自动汇编文明编年史
- **SliceNarrativeEngine**: 切片叙事引擎，管理动态叙事切片
- **EventBus**: 事件总线，事件的发布/订阅通信中枢
- **EventCadence**: 事件节奏控制，定义事件发生的时间频率与预算
- **首次出现**: `src/core/Game.ts` (UEE模块初始化)

---

## 11. 武器系统 (Weapon System)

### 11.1 武器类型 (WeaponType)

| 类型 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 常规单位 | `WeaponType.UNIT` (0) | 标准作战单位 |
| 消耗品 | `WeaponType.EXPENDABLE` (1) | 一次性武器 |
| 间谍 | `WeaponType.SPY` (2) | 情报单位 |
| 超级炸弹 | `WeaponType.SUPERBOMB` (3) | 终极毁灭武器 |

### 11.2 核心武器原型 (WeaponPrototype)

| 武器名称 | 代码引用 | 所属科技 | 攻击力 |
| :--- | :--- | :--- | :---: |
| 恒星级战舰 | `weaponName: "恒星级战舰"` | — | 地球默认 |
| 水滴型战舰 | `weaponName: "水滴型战舰"` | — | 三体默认 |
| 强互作用探测器 | `weaponName: "强互作用探测器"` | — | 三体高级 |
| 星际无畏舰 | `weaponName: "星际无畏舰"` | — | 其他AI默认 |

- **代码映射**: `src/core/Weapon.ts` — `interface WeaponPrototype`, `interface WeaponInstance`
- **首次出现**: `src/core/Fleet.ts` (舰队自动装备)

### 11.3 舰队系统 (Fleet)

| 概念 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 舰队 | `interface Fleet` | 包含武器、出发地、目的地、航程时间 |
| 舰队创建 | `createFleet()` | 自动装备默认武器 |
| 航程时间 | `totalEta / eta` | 以回合为单位 |
| 舰队指挥官 | `leaderName` | 可指派角色担任 |

- **首次出现**: `src/core/Fleet.ts`

---

## 12. 文明等级 (Civilization Levels)

| 等级 | 代码返回 (getCiviLevelLabel) | 说明 |
| :---: | :--- | :--- |
| 0 | `"荒蛮文明"` | 文明初始的原始阶段 |
| 1 | `"工业文明"` | 具备工业化生产能力 |
| 2 | `"星际文明"` | 具备星际航行与殖民能力 |
| 3 | `"银河文明"` | 具备银河系级影响力 |
| 4 | `"超维文明"` | 掌握维度科技的数字/超维形态 |

- **代码映射**: `Civilization.civiLevel` → `getCiviLevelLabel()`
- **实现位置**: `src/core/Civilization.ts:L35-L38`
- **同义词黑名单**: 🚫 `CivLevel`, 🚫 `DevelopmentStage`

---

## 13. 系统核心概念 (Core Concepts)

### 13.1 游戏核心机制

| 术语 | 代码映射 | 定义 |
| :--- | :--- | :--- |
| 执剑人 | `EarthCivilization.swordholder` | 手握引力波广播威慑权限的终极决策者，领导力影响威慑成功率 |
| 黑暗森林威慑 | `deterrenceValue` | 综合威慑力数值，(执剑人领导力×0.5 + 威慑值×0.5) |
| 面壁计划 | `EarthCivilization.wallfacers` | 面壁者名单，每回合积攒威慑度与军备 |
| 面壁者 | `wallfacerPlans` | 每个面壁者拥有独立计划名、进度、是否被破壁 |
| 破壁 | `isBroken` | 面壁计划被智子识破后失效 |
| 阶梯计划 | `flag: staircase_project_sent` | 将云天明大脑送往三体舰队 |
| 雪地工程 | `flag: deterrence_established` | 在太阳轨道部署引力波广播系统 |
| 思想钢印 | `flag: thought_seal_created` | 通过脑科学植入必胜信念 |
| 古筝行动 | `event: 古筝行动` | 纳米丝切割审判日号获取三体数据 |
| 末日之战 | `event: 末日之战` | 水滴摧毁人类全部2000艘战舰 |
| 黑暗战役 | `event: 黑暗战役` | 逃亡舰队间自相残杀 |
| 二向箔 | `dimensionStrikeTriggered` | 高维向低维的降维打击武器 |
| 水滴 | `waterdropCount` | 强互作用力宇宙探测器 |
| 智子封锁 | (剧情设定) | 智子锁死人类基础物理研究 |
| 光速飞船 | 科技: `光速飞船原型` | 曲率驱动的超光速飞船 |
| 曲率驱动 | 科技: `曲率驱动理论` | 通过扭曲时空实现光速航行 |
| 黑域/安全声明 | 科技: `黑域生成` | 将太阳系变为低光速黑洞区 |
| 数字方舟 | 科技: `数字方舟` | 承载人类意识的量子计算服务器 |
| 数字生命 | `class DigitalLife` | 意识上传与数字永生系统 |
| MOSS/550W | `mossAutonomyLevel` | 量子超脑，控制数字生命系统 |
| 引力波广播 | 科技: `引力波广播系统` | 向全宇宙广播坐标的终极威慑 |
| 太空城/掩体 | (叙事设定) | 气态行星背后建造的避难城市群 |
| 小宇宙 | (叙事设定) | 云天明留给程心的独立时空 |
| 月球危机 | `event: 月球危机` | 《流浪地球》联动事件 |
| 大低谷 | `flag: great_ravine_started` | 危机纪元中期的全球性经济崩溃与饥荒 |
| 技术爆炸 | `flag: technological_explosion` | 大低谷后人类科技的飞跃式发展 |
| 交接危机 | `swordholderHandoverTurn` | 执剑人更替时三体利用威慑间隙攻击 |

### 13.2 游戏运行引擎类

| 类名 | 代码路径 | 职责 |
| :--- | :--- | :--- |
| Game | `src/core/Game.ts` | 游戏主控，回合循环与状态管理 |
| EarthCivilization | `src/core/EarthCivilization.ts` | 地球文明专属逻辑 |
| AlienCivilization | `src/core/AlienCivilization.ts` | 外星文明AI逻辑 |
| StarManager | `src/core/StarManager.ts` | 星球/星系管理 |
| PersonManager | `src/core/PersonManager.ts` | 角色解锁与管理 |
| WeaponManager | `src/core/WeaponManager.ts` | 武器制造与调度 |
| CombatEngine | `src/core/CombatEngine.ts` | 舰队列阵战斗解析 |
| PlanetEngine | `src/core/PlanetEngine.ts` | 行星物理引擎 |
| DigitalLife | `src/core/DigitalLife.ts` | 数字永生子系统 |
| SaveManager | `src/core/SaveManager.ts` | 存档/读档管理 |
| AudioManager | `src/core/AudioManager.ts` | 音频/BGM管理 |

### 13.3 星系区域 (StarArea)

| 区域 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 太阳系 | `StarArea.SOLARSYSTEM` (0) | 地球所在恒星系 |
| 50光年 | `StarArea.LIGHTYEAR_50` (1) | 临近星系范围 |
| 1万光年 | `StarArea.LIGHTYEAR_1W` (2) | 银河系旋臂范围 |
| 银河系 | `StarArea.GALAXY` (3) | 全银河系范围 |

---

## 14. 游戏模式与设定域 (Lore Modes & Domains)

### 14.1 设定域 (LoreDomain)

| 域 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 三体正典 | `'three_body_canon'` | 严格遵循《三体》三部曲原著设定 |
| 刘慈欣跨界 | `'liu_cixin_crossover'` | 涵盖《流浪地球》《球状闪电》《乡村教师》等作品 |
| 原创扩展 | `'original_expansion'` | 项目原创的星屑纪元等扩展内容 |

### 14.2 设定模式 (LoreMode)

| 模式 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 严格三体 | `'strict_three_body'` | 仅使用三体原著事件与设定 |
| 刘慈欣混合 | `'liu_cixin_mixed'` | 混入大刘所有作品的跨宇宙内容 |
| 沙盒模式 | `'sandbox'` | 允许原创与偏离原著的自由模式 |

### 14.3 战斗类型 (BattleType)

| 类型 | 代码映射 | 说明 |
| :--- | :--- | :--- |
| 进攻 | `BattleType.ATTACK` (0) | 主动攻击方 |
| 防御 | `BattleType.DEFEND` (1) | 防御方 |

---

## 15. OST 与音乐术语 (OST & Music)

### 15.1 纪元主题曲 (Epoch BGM)

| 纪元 | 英文标题 | 曲风 | 代码映射 |
| :--- | :--- | :--- | :--- |
| 危机纪元 | Crisis Era | Heavy industrial orchestral | `OST_CRISIS` |
| 威慑纪元 | Deterrence Era | Minimalist dark ambient (岁月底座变奏) | `OST_DETERRENCE` |
| 广播纪元 | Broadcast Era | Chaotic symphonic metal fusion | `OST_BROADCAST` |
| 掩体纪元 | Bunker Era | Dark synthwave, muffled sub-bass | `OST_BUNKER` |
| 银河纪元 | Galaxy Era | Vast cosmic ambient | `OST_GALAXY` |
| 星屑纪元 | Stardust Era | Ethereal post-rock | `OST_STARDUST` |

### 15.2 结局与终章曲目

| 曲名 | 类型 | 触发条件 | 代码映射 |
| :--- | :---: | :--- | :--- |
| Stardust Exodus（星屑） | 含人声 | 流浪地球/征服胜利 | `OST_STARDUST_EXODUS` |
| Death of the Light Cone（光锥之死） | 纯器乐 | 黑域结局 | `OST_LIGHTCONE_DEATH` |
| Ghost in the Quantum（量子幽灵） | 纯器乐 | 数字永生结局 | `OST_QUANTUM_GHOST` |
| The Last Archive（最后的档案） | 纯器乐 | 文明自然衰亡 | `OST_LAST_ARCHIVE` |
| A Past Within the Light Cone（光锥之内的往事） | 含人声 | 全图鉴白金结局 | `OST_LIGHTCONE_PAST` |

- **首次出现**: `SPEC_20260615_EPOCH_CHRONICLES_OST.md`

### 15.3 音乐设计原则
- **纯器乐原则**：游戏推进及常规/失败结局均为 Instrumental
- **人声稀缺原则**：仅 Stardust Exodus 与 A Past Within the Light Cone 两首含人声
- **基因统一原则**：核心主导动机 (Leitmotif) 为主题曲《岁月底座》

---

## 附录：审计清单 (Audit Trail)

### V2.0 补充内容一览

| 新增内容 | 覆盖分类 | 补充条目数 |
| :--- | :--- | :---: |
| 黄金岁月纪元 | §2 | 1个纪元 |
| 纪元文化值阈值 | §2 | 7档阈值 |
| 完整部门体系 | §4.1 | 补充9个部门（原文仅含2个） |
| 工厂设施 | §4.2 | 1种建筑类型 |
| 军事科学 科技树 | §5 | 1个科技分支 |
| 信息技术 科技树 | §5 | 1个科技分支 |
| 科技节点速查表 | §5 | 20个关键节点 |
| 完整结局判定 | §6 | 补充征服/黑域/数字/隐藏/叛变/灭绝（原文仅含4个） |
| 人物角色系统 | §7 | 35位角色+属性说明 |
| 地外文明系统 | §8 | 9个文明+特征 |
| 外交与AI系统 | §9 | 5种人格+6种外交状态+5级友好度+4种特殊机制 |
| 事件系统 | §10 | 3种事件类型+8种效果+5种轨道+7个UEE模块 |
| 武器系统 | §11 | 4种武器类型+4种原型+舰队结构 |
| 文明等级 | §12 | 5个等级 |
| 核心系统概念 | §13 | 25个核心概念+20个引擎类+4个星系区域 |
| 游戏模式与设定域 | §14 | 3个设定域+3种模式+2种战斗类型 |
| OST与音乐术语 | §15 | 6首纪元BGM+5首结局曲目+3条设计原则 |

### V2.1 审计修复清单

| 修复项 | 类型 | 说明 |
| :--- | :---: | :--- |
| `deterrenceValue` 新增术语 | §3 补充 | 补充威慑度字段定义与代码映射 |
| `EFFECT_TARGET_ALIAS` 映射规范 | §3 / `Game.ts` 修复 | 创建 `Game.EFFECT_TARGET_ALIAS` 字典将 `prestige→deterrenceValue`、`military→army` |
| `clampEffectValue` 规范化 | `Game.ts` 修复 | 使用别名映射表而非硬编码分支 |
| `applyNewEffects` 规范化 | `Game.ts` 修复 | switch-case 使用规范化后的 `canonicalTarget` |
| 事件数据别名保留 | 兼容性声明 | events.json/randomevents.json 中 `"military"`/`"prestige"` 继续合法，由代码层归一 |

---

> [!TIP]
> 遵守此术语规范能在多人开发以及与 AI 协作时避免巨大的语义歧义。所有 `*Type` 枚举、`Civilization` 属性字段、事件标记及角色名称，务必在代码中严格引用枚举常量，不得随意使用字符串字面量。如新增术语，请同步更新本文档并标注"首次出现"的源代码位置。