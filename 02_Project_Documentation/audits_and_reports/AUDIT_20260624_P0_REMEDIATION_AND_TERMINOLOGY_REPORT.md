# P0 红线修复与术语统一审计报告

> **审计日期**: 2026-06-24
> **基准文档**: [AUDIT_20260624_PROGRESS_REAUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_PROGRESS_REAUDIT.md)
> **术语词典**: [DICT_20260616_TERMINOLOGY_DICTIONARY.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/DICT_20260616_TERMINOLOGY_DICTIONARY.md)
> **审计目的**: 核实并修复最新审计报告指出的 P0 红线问题，同步完成全量术语统一核对

---

## 一、P0 红线核实与修复

### 1.1 硬编码武器回退 — 已修复

**位置**: [CombatEngine.ts:322-333](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/CombatEngine.ts#L322-L333)

**问题**: `calculateFleetPower()` 在舰队无武器时，按所属文明免费赠送武器：
- 地球 → 恒星级战舰 ×20
- 三体 → 水滴型战舰 ×80 + 强互作用探测器 ×40
- 其他 → 星际无畏舰 ×50

**修复**: 无武器舰队直接返回战力 0，不再赠送武器。

**影响测试**: 更新 [CombatEngine.test.ts:313](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/CombatEngine.test.ts#L313) 测试用例，从"空武器自动装备"改为"空武器战力为0"。

### 1.2 5 个结局 Flag 未赋值 — 审计报告误判

AUDIT_20260624 报告称 `digital_ark_upgrade`、`dark_domain_decision`、`swordholder_appointed`、`wallfacer_project`、`galaxy_exodus_seen` 五个 Flag "仍未赋值"。

**核实结论：审计报告的 grep 搜索范围过窄导致误判。** 这 5 个 Flag 均通过事件系统间接赋值：

| Flag | 赋值来源 | 触发条件 |
|------|---------|---------|
| `wallfacer_project` | 面壁者选拔事件 | 第10年+，危机纪元，文化≥10 |
| `swordholder_appointed` | 威慑体系建立事件 | 第50年+，危机纪元，威慑≥50 |
| `digital_ark_upgrade` | 流浪地球辩论 / 意识上传公投 | 第100年+ / 第200年+ |
| `dark_domain_decision` | 黑域宣言事件 | 第250年+，掩体纪元 |
| `galaxy_exodus_seen` | 银河纪元启航事件 | 第220年+，银河纪元 |

赋值路径：事件定义中的 `{ type: "flag", target: "xxx", value: 1 }` → [EventSystem.ts:129-130](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L129-L130) 处理 → `this.game.addFlag(eff.target)`。

**无需修复。**

---

## 二、附属修复

### 2.1 存档版本号测试回归

**位置**: [SaveLoad.test.ts:52](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/integration/SaveLoad.test.ts#L52)

TASK-AP 将 `SAVE_VERSION` 从 3 升级至 4，测试用例未同步更新。已修复为 `expect(parsed.version).toBe(4)`。

---

## 三、术语统一核对

对照 [DICT_20260616_TERMINOLOGY_DICTIONARY.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/DICT_20260616_TERMINOLOGY_DICTIONARY.md) 对全量 `src/` 源码执行了术语合规性扫描。

### 3.1 黑名单术语扫描

对词典中记录的所有同义词黑名单进行全量正则搜索：

| 搜索词 | 匹配结果 |
|--------|---------|
| `Rebellion` / `RiotRate` / `Unrest` | 无违规 |
| `Money` / `Credits` / `Gold` | 无违规（`Credits` 仅出现在制作人员名单上下文中） |
| `Minerals` / `Ore` / `Materials` | 无违规 |
| `Soldiers` / `CombatPower` | 无违规 |
| `Knowledge` / `CivPoint` | 无违规 |
| `CivStage` / `TechLevel` | 无违规 |
| `SpaceArmy` / `StarFleetDept` | 无违规 |
| `2D_Strike` / `VectorDefeat` / `FoilDefeat` | 无违规 |
| `BlackDomain` / `SafeZoneVictory` | 无违规 |
| `EscapeVictory` / `EarthWander` | 无违规 |
| `DigitalEternity` / `UploadVictory` | 无违规 |
| `SecretVictory` / `EasterEgg` | 无违规 |
| `threatLevel` | 无违规 |

**结论：代码库无黑名单术语残留。**

### 3.2 枚举类型核对

| 枚举 | 匹配情况 |
|------|---------|
| `EpochType` (GOLDEN, CRISIS, DETERRENCE, BROADCAST, BUNKER, GALAXY, STARDUST) | ✅ 全部符合 |
| `VictoryType` (CONQUEST, DETERRENCE, DARK_DOMAIN, WANDERING, DIGITAL, HIDDEN) | ✅ 全部符合 |
| `DefeatType` (TREACHERY, EXTINCTION, HELIUM_FLASH, DIMENSION_STRIKE) | ✅ 全部符合 |
| `DepartmentType` (11 个部门) | ✅ 全部符合 |
| `AiPersonality` (5 种人格) | ✅ 全部符合 |
| `DiplomacyState` (6 种状态) | ✅ 全部符合 |
| `FriendshipType` (5 级友好度) | ✅ 全部符合 |
| `WeaponType` (4 种类型) | ✅ 全部符合 |
| `BattleType` (ATTACK, DEFEND) | ✅ 全部符合 |
| `EventType` (INYEAR, STRINGINDEX, RANDOM) | ✅ 全部符合 |
| `BuildingType` (STOPE, FACTORY, CITY) | ✅ 全部符合 |

### 3.3 别名映射系统

[EventSystem.ts:71-74](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L71-L74) 中的 `EFFECT_TARGET_ALIAS` 字典正确配置了 `prestige → deterrenceValue` 和 `military → army` 的别名映射，事件数据文件中的非规范名称在运行时被正确归一化。

遗留兼容别名 `black_domain_decision → dark_domain_decision`（[GameEventManager.ts:796](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L796)）为旧存档兼容保留，非术语违规。

### 3.4 术语统一结论

**代码库术语纯净度良好，与 DICT V2.1 完全一致，无需修改。**

---

## 四、验证结果

| 验证项 | 结果 |
|--------|------|
| TypeScript 编译 (`npx tsc --noEmit`) | 0 错误 |
| 测试 (`npx vitest run`) | **833/833 全部通过**（40 个测试文件） |

---

## 五、变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/core/CombatEngine.ts` | Bug 修复 | 移除 `calculateFleetPower()` 中的硬编码武器回退逻辑 |
| `src/test/core/CombatEngine.test.ts` | 测试更新 | 适配空武器舰队战力为 0 的新行为 |
| `src/test/integration/SaveLoad.test.ts` | 测试修复 | 存档版本号从 3 更新为 4 |

**未修改文件**：术语统一核对未发现需要修改的代码。

---

> **审计完成。** 本次修复解决了 AUDIT_20260624 报告中唯一确凿的 P0 红线（硬编码武器回退），澄清了 5 个结局 Flag 的误判，并完成了全量术语合规性核对。