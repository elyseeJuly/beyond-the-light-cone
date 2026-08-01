# 宇宙群英传 综合修复方案与 AI 协作约束规则

> 生成日期：2026-06-02
> 基于：AUDIT_20260602_FULL_DOC_VS_CODE_GAP_ANALYSIS.md + AUDIT_20260601_NARRATIVE_ART_DEEP_AUDIT.md + AUDIT_20260525_FULL_NARRATIVE_PHYSICS_AUDIT.md
> 目标：一次性完整修复所有已知问题，并建立约束规则防止后续 AI 接手的回归

---

## 目录

- [第一部分：事件系统完整修复方案](#第一部分事件系统完整修复方案)
- [第二部分：核心系统与 UI 修复方案](#第二部分核心系统与-ui-修复方案)
- [第三部分：AI 协作强制性约束规则](#第三部分ai-协作强制性约束规则)
- [第四部分：修复执行顺序与验证检查清单](#第四部分修复执行顺序与验证检查清单)

---

## 第一部分：事件系统完整修复方案

### FIX-001: 随机事件 `cooldownYears` 消除（P0）

**问题**：`randomevents.json` 中 9 个事件仍保留了 `cooldownYears`，冷却期结束后会再次触发，违反"每局游戏每个事件最多触发一次"的铁律。

**受影响事件**：

| 行号 | 事件ID (推测) | cooldownYears | 纪元 |
|------|--------------|---------------|------|
| L59 | `random_wallfacer_proposal` | 20 | CRISIS |
| L7569 | 归零者相关 | 20 | GALAXY |
| L7617 | 银河事件 | 15 | GALAXY |
| L7670 | 银河事件 | 10 | GALAXY |
| L7719 | 银河事件 | 15 | GALAXY |
| L7772 | 银河事件 | 50 | GALAXY |
| L7820 | 银河事件 | 20 | GALAXY |
| L7869 | 银河事件 | 15 | GALAXY |
| L7917 | 银河事件 | 25 | GALAXY |

**修复方案**：
```diff
// 文件：03_Web_Rebuild/src/data/randomevents.json
// 操作：删除所有 9 处 "cooldownYears" 字段及其值（包括前一行逗号处理）
// 所有事件应仅依赖 maxTriggers=1 来控制一次性触发
```

**约束**：引擎层 `EventCadence.normalizeEventMeta()` 已强制 `maxTriggers=1`，但数据层不应保留 `cooldownYears` 误导后续维护者。

---

### FIX-002: 随机事件触发计数器在存档/读档后丢失（P0）

**问题**：`GameEventManager.init()` 在第 644-645 行被 `restorePrototypes()` 调用时会重新初始化 `events` 和 `randomEvents` 数组（包括 `normalizeEventMeta`），但 `randomEventTriggerCounts` 虽然是 Map 且被正确恢复，`init()` 内的 `normalizeEventMeta` 会重新设置 `maxTriggers` 为 1，不会影响计数器。**但** `init()` 会调用 `this.seedFilteredEvents()` 重新创建 `filteredEvents` 数组，这会覆盖 `lastTriggeredYear` 等运行时状态。

**实际检查**：`restorePrototypes()` 的 `init()` 调用条件为 `inst.eventManager.events.length === 0`，正常读档时 events 不会为空，所以**不会触发 init()**。但边缘情况下（events 为空时）会触发破坏性重置。

**修复方案**：
```typescript
// 文件：03_Web_Rebuild/src/core/Game.ts - restorePrototypes()
// 将第 644-646 行改为：
if (inst.eventManager && (!inst.eventManager.events || inst.eventManager.events.length === 0)) {
  inst.eventManager.init();
  // 恢复已保存的计数器（因为 init() 会重置它们）
  if (savedCounts) {
    inst.eventManager.randomEventTriggerCounts = savedCounts;
  }
  if (savedFilteredIds) {
    inst.eventManager.triggeredFilteredIds = savedFilteredIds;
  }
}
```

**约束**：**永远不要在 `restorePrototypes` 中无条件调用 `init()`**。必须先检查数据是否已存在。

---

### FIX-003: 公告板 `tickerMessages` 读档后不显示（P0）

**问题**：`tickerMessages` 作为普通数组被序列化保存，但读档后 `AnnouncementBoard` 组件不会主动渲染历史消息。

**修复方案**：
```typescript
// 文件：03_Web_Rebuild/src/core/Game.ts - loadGame() 方法
// 在 loadGame() 成功后（第 626 行 dispatchEvent 附近），添加：
window.dispatchEvent(new CustomEvent('ticker-message-added'));

// 同时修改 AnnouncementBoard.tsx，在组件挂载时检查是否有历史消息：
// useEffect(() => {
//   const game = GameInstance.get();
//   if (game && game.tickerMessages.length > 0) {
//     // 触发渲染
//   }
// }, []);
```

---

### FIX-004: 14 处人物纪元时间线冲突（P0）

**问题**：`isEventCharactersUnlocked()` 仅检查人物是否被 `events.json` 解锁，不检查人物在当前纪元是否存活。导致维德在危机纪元、程心在危机纪元等严重穿帮。

**修复方案 A（推荐）— 在数据层修复事件**：

| 事件ID | 问题 | 修复 |
|--------|------|------|
| `tech_vacuum_decay_incident` | 维德在CRISIS | 将 `speakerName` 改为 `"常伟思"`，`avatarUrl` 改为 `"changweisi"` |
| `dark_forest_probe_transit` | 维德在CRISIS | 同上 |
| `revolt_water_sabotage_zone_5` | 维德在CRISIS | 同上 |
| `revolt_data_center_sabotage` | 维德在CRISIS | 同上 |
| `revolt_prison_break_eto` | 维德在CRISIS | 同上 |
| `yewenjie_redemption` | 维德在CRISIS | 改为 `"史强"` |
| `chengxin_ladder_project` | 程心/云天明在CRISIS | 纪元改为 `"DETERRENCE,BROADCAST"` |
| `beihai_fleet_defection` | 章北海在DETERRENCE | 纪元改为 `"CRISIS"` |
| `lin_yun_quantum_suicide` | 林云在DETERRENCE | 纪元改为 `"CRISIS"` |
| `tyler_quantum_ghost_fleet` | 泰勒在WANDERING | 保留，标记为"历史档案回放"，对话改为遗言格式 |
| `liucixin_poetry_cloud_art` | 伊文斯在DETERRENCE/BROADCAST | 将伊文斯替换为其他角色 |
| `liucixin_cryogenic_art` | 艾AA在CRISIS | 移除 CRISIS 纪元 |
| `random_wallfacer_proposal` | 艾伦·艾德文虚构角色 | 改为 PDC 高层或实际面壁者 |
| 其他WANDERING纪元ETO事件 | ETO在晚期纪元 | 纪元改为 `"CRISIS"` 或改写为"新降临派残余" |

**修复方案 B（引擎层加固）**：

```typescript
// 文件：03_Web_Rebuild/src/core/GameEventManager.ts
// 新增方法：检查人物在当前纪元是否存活
private isPersonAliveInEpoch(personName: string, epochName: string): boolean {
  const epochDeathMap: Record<string, string[]> = {
    // 人物死亡/退场纪元（在该纪元及之后不可出场）
    "伊文斯": ["DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"],
    "林云": ["DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"],
    "泰勒": ["DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"],
    "雷迪亚兹": ["DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"],
    "章北海": ["BROADCAST", "BUNKER", "GALAXY"],
    "丁仪": ["BROADCAST", "BUNKER", "GALAXY"],
    // 未解锁人物在各纪元不可出场
    "维德": ["CRISIS"],
    "程心": ["CRISIS"],
    "云天明": ["CRISIS"],
    "艾AA": ["CRISIS"],
    "智子": ["CRISIS"],
    "关一帆": ["CRISIS", "DETERRENCE"],
  };
  return !(epochDeathMap[personName] || []).includes(epochName);
}
```

**约束**：**任何新增事件必须检查所有出场人物在当前纪元的存活/解锁状态**。使用 `isEventCharactersUnlocked` + 新增的 `isPersonAliveInEpoch` 双重检查。

---

### FIX-005: WANDERING 纪元标签废弃（P0）

**问题**：`isEpochMatch()` 将 `WANDERING` 映射为 `BROADCAST || BUNKER || GALAXY`，导致 42 条 WANDERING 事件在三个截然不同的纪元中无差别触发。

**修复方案**：
```typescript
// 文件：03_Web_Rebuild/src/core/GameEventManager.ts
// 废弃 WANDERING 映射，改为要求精确纪元
// 第 539 行：删除或注释掉此行
// if (t === "WANDERING" && (currentEpoch === "BROADCAST" || currentEpoch === "BUNKER" || currentEpoch === "GALAXY")) return true;
```

**同时需要修改 randomevents.json**：将所有 42 条 `"epoch": "WANDERING"` 的事件逐一分配精确纪元组合：
- 广播纪元特有内容 → `"BROADCAST"`
- 掩体纪元特有内容 → `"BUNKER"`
- 银河纪元特有内容 → `"GALAXY"`
- 跨纪元内容 → `"BROADCAST,BUNKER"` 或 `"BUNKER,GALAXY"`

**约束**：**禁止使用 `WANDERING` 作为纪元标签**。所有事件必须明确指定触发纪元。

---

### FIX-006: 数值量纲统一（P0）

**问题**：60+ 个随机事件的 `effects` 数值与游戏引擎量纲不匹配。游戏使用"亿"为单位（初始人口 65 亿），但事件中动辄 ±200,000。

**修复方案**：
```typescript
// 文件：03_Web_Rebuild/src/core/GameEventManager.ts
// 新增：在 applyEffects 中添加数值钳制
private clampEffectValue(target: string, rawValue: number): number {
  const game = GameInstance.get();
  const e = game.earthCivi;

  // 人口类效果使用百分比上限
  if (target === 'population') {
    const maxAbsChange = e.population * 0.3; // 单次事件最多影响30%人口
    return Math.max(-maxAbsChange, Math.min(maxAbsChange, rawValue));
  }
  // 资源类效果
  if (['economy', 'culture', 'prestige', 'military', 'resource'].includes(target)) {
    const current = (e as any)[target] || 0;
    const maxAbsChange = Math.max(current * 0.5, 50); // 最多50%或50点
    return Math.max(-maxAbsChange, Math.min(maxAbsChange, rawValue));
  }
  return rawValue;
}
```

**同时需要修改 randomevents.json**：将所有人口类效果改为合理的量纲：
- 65 亿初始人口 → 人口变化应在 ±5 到 ±20 之间
- 绝对值超过 100 的人口效果一律除以 1000（假设原数据使用"万人"单位）

**约束**：**任何新增事件效果必须遵守以下数值范围**：
- `population`：单次变化不超过当前值的 30%，绝对值不超过 50
- `economy/culture/prestige/military/resource`：单次变化不超过当前值的 50%
- `treachery`：单次变化不超过 20

---

### FIX-007: BUNKER 纪元事件真空（P1）

**问题**：当前 `randomevents.json` 中 BUNKER 纪元事件为 0 条。

**修复方案**：新增 6-8 条 BUNKER 纪元专属事件，建议主题：
1. 掩体工程进度报告（木星/土星背后基地建设）
2. 地下城生活危机（资源配给、社会秩序）
3. 二向箔预警演习
4. 掩体世界文化融合（不同殖民地间冲突）
5. 光速飞船秘密研制
6. 古人类遗迹保护运动

**约束**：**每个纪元必须至少有 5 条专属随机事件**。新增事件后必须运行 `npm run test` 确认所有测试通过。

---

### FIX-008: 随机事件 `reqStar` 条件缺失（P1）

**问题**：玩家殖民比邻星等新星系后，仍触发太阳系内的地球事件，缺乏环境沉浸感。

**修复方案**：
```typescript
// 文件：03_Web_Rebuild/src/core/GameEventManager.ts
// 在 checkRandomEvents 中添加 reqStar 检查：
if (e.triggerCondition?.reqStar) {
  const star = game.starManager.getStarByName(e.triggerCondition.reqStar);
  if (!star || !star.isColonized) continue;
}
```

**约束**：新增的银河纪元/外太空事件可以设置 `reqStar` 确保仅在正确上下文触发。

---

### FIX-009: `triggerCharacterUnlockPopup` 死代码清理（P1）

**问题**：[Game.ts L547-638](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L547-L638) 中约 90 行死代码，方法永远不会被调用。

**修复方案**：直接删除 `triggerCharacterUnlockPopup()` 方法及其所有私有数据。

**约束**：**删除任何代码前，先用 `grep` 确认全项目无引用**。

---

### FIX-010: 叙事内容与原著割裂（P1）

**问题汇总**：
| 问题 | 解决 |
|------|------|
| `random_wallfacer_proposal` 角色虚构"艾伦·艾德文" | 改为实际面壁者或PDC官员 |
| 事件标题错别字"生态灾灾难" | 改为"生态灾难" |
| `aa_pleasure_city_scandal` 等事件过于戏谑 | 改写为严肃末日氛围 |
| 云天明童话解密事件时序错误 | 纪元改为 `"BROADCAST"` |
| 关一帆四维事件时序错误 | 纪元改为 `"BROADCAST,BUNKER,GALAXY"` |
| 丁仪在晚期纪元出场 | 替换为通用NPC |
| 流浪地球 vs 三体世界观混淆 | `strict_three_body` 模式下自动替换 |

---

## 第二部分：核心系统与 UI 修复方案

### FIX-011: 战斗系统完整重构（P0）

详见 AUDIT_20260602_FULL_DOC_VS_CODE_GAP_ANALYSIS.md §六。

**核心要求**：
1. 创建独立的 `BattleScreen` 组件，包含战斗 UI 界面
2. `CombatEngine` 支持四种武器类型：UNIT, EXPENDABLE, SPY, SUPERBOMB
3. 战斗结果以可视化方式呈现（多轮战斗、武器逐个对决）
4. 添加战斗动画（至少包含基础过渡效果）

---

### FIX-012: 纪元系统修正为文化值驱动（P0）

**当前**：`Game.ts updateEpoch()` 基于 `year` 硬编码
**应改为**：基于 `earthCivi.culture` 值

```typescript
// 文件：03_Web_Rebuild/src/core/Game.ts - updateEpoch()
// 修改为：
private updateEpoch(): void {
  const culture = this.earthCivi.culture;
  const oldEpoch = this.epoch;
  
  if (culture >= 1200 && this.epoch < 4) this.epoch = 4; // GALAXY
  else if (culture >= 800 && this.epoch < 3) this.epoch = 3;  // BUNKER
  else if (culture >= 500 && this.epoch < 2) this.epoch = 2;  // BROADCAST
  else if (culture >= 200 && this.epoch < 1) this.epoch = 1;  // DETERRENCE
  // else CRISIS (0)
  
  if (this.epoch !== oldEpoch) {
    this.addHistory(`【纪元变迁】进入${epochNames[this.epoch]}纪元`);
  }
}
```

---

### FIX-013: 外太空星图数据补全（P0）

详见 AUDIT_20260602_FULL_DOC_VS_CODE_GAP_ANALYSIS.md §五。

`stars.json` 需要补全：
- 50 光年范围：比邻星(Proxima Centauri)、天狼星(Sirius)、巴纳德星(Barnard's Star) 等 5-8 个星系
- 1 万光年范围：猎户座星云(Orion)、昴星团(Pleiades) 等 3-5 个星系
- 银河系范围：银心(Sagittarius A*)、大麦哲伦云等 2-3 个星系

---

### FIX-014: 行星发动机子系统（P0）

新增类：`PlanetEngine.ts`
- 推进进度追踪
- 变轨操作
- 月球危机应对
- 流浪地球计划执行

---

### FIX-015: 数字生命系统（P0）

新增类：`DigitalLife.ts`
- 意识上传机制
- 角色复活功能
- MOSS AI 自主防御

---

### FIX-016: 外交系统独立 UI（P0）

新增组件：`DiplomacyPanel.tsx`
- 6 级外交状态可视化
- 外交操作（谈判/贸易/挑衅/结盟）
- 黑暗森林威慑下的外交特殊规则

---

### FIX-017: 面壁者系统叛变/破壁机制（P0）

扩展 `EarthCivilization.ts` 中的面壁者逻辑：
- 面壁者叛变概率计算（基于 treachery 和 leadership）
- 破壁人事件触发
- 秘密计划进度追踪

---

### FIX-018: AI 特殊武器系统（P0）

扩展 `AlienCivilization.ts`：
- 水滴（Waterdrop）：冷却 10 回合，单局 ≤3 次
- 二向箔（DimensionStrike）：5 回合预警，单局 1 次
- 引力波广播（GravityBroadcast）：剩余 1 星时濒死广播

新增 AI 安全阀规则：
- 玩家仅剩 1 星时不攻击
- 特殊武器使用有冷却时间
- 攻击前有预警事件

---

### FIX-019: Vitest 测试框架集成（P0）

详见 AUDIT_20260602_FULL_DOC_VS_CODE_GAP_ANALYSIS.md §三 ITER-015。

**核心要求**：
1. 在 `package.json` 中添加 vitest 依赖
2. 为每个核心类创建测试文件
3. 覆盖所有关键路径

---

### FIX-020: 以上未列出的其他 P1/P2 修复

| 编号 | 问题 | 优先级 |
|------|------|--------|
| FIX-020 | 事件创建的舰队附带武器（ITER-003） | P1 |
| FIX-021 | 科技树跨树依赖（行星发动机基础需强相互作用力材料） | P1 |
| FIX-022 | 执剑人交接危机 | P1 |
| FIX-023 | 星球人口分配 UI（SetPopulationPanel） | P1 |
| FIX-024 | 3 个 INI 配置文件（wallfacer/epoch/diplomacy JSON 化） | P2 |
| FIX-025 | 战斗动画/特效 | P2 |
| FIX-026 | 星图多层级缩放渲染 | P2 |
| FIX-027 | 存档/读档增加完整性校验 hash | P2 |
| FIX-028 | 旧版冗余图片清理 | P3 |

---

## 第三部分：AI 协作强制性约束规则

> **目的**：以下规则必须被任何接手此项目的 AI 严格遵守。违反任一规则将导致代码审查被拒绝。

### 规则 1：事件一次触发铁律

```
【E1】所有游戏事件（包括随机事件和条件剧情事件）每局游戏最多触发一次。
     禁止在数据层或引擎层设置 cooldownYears 使事件重复触发。
     新增事件默认 maxTriggers=1，如需例外需项目负责人审批。
```

验证方式：
- 检查 `randomevents.json` 中无 `cooldownYears` 字段
- 检查 `GameEventManager.seedFilteredEvents()` 中无不必要的 `cooldownYears`
- 检查 `EventCadence.normalizeEventMeta()` 强制 `maxTriggers=1`

### 规则 2：人物纪元存活性检查

```
【E2】任何事件中出场的角色必须通过双重检查：
     (a) 该角色已被 events.json 的事件解锁（isEventCharactersUnlocked）
     (b) 该角色在当前纪元存活着且可出场（isPersonAliveInEpoch）
     
     禁止在数据层绕过此检查，禁止使用虚构角色名。
```

验证方式：
- 运行 `checkRandomEvents()` 和 `getFilteredEventsForTurn()` 时日志无警告
- 新增事件的人物对话 speakerName 在人物存活表中

### 规则 3：数值量纲约束

```
【E3】所有事件效果数值必须符合游戏量纲：
     - population：单次变化 ≤ 当前值的 30%，绝对值 ≤ 50
     - economy/culture/prestige/military/resource：单次变化 ≤ 当前值的 50%
     - treachery：单次变化 ≤ 20
     
     禁止使用绝对值超过 100 的人口效果。
     优先使用百分比效果（如 type: "resource_percent", value: -0.1）。
```

验证方式：
- 新增事件效果值在 `clampEffectValue()` 合理范围内
- 人口效果绝对值不超过 100

### 规则 4：纪元标签精确性

```
【E4】所有事件必须使用精确的纪元标签：
     - 可用值：CRISIS, DETERRENCE, BROADCAST, BUNKER, GALAXY
     - 多纪元用逗号分隔：如 "BROADCAST,BUNKER"
     - 禁止使用 WANDERING、SHELTER 等模糊标签
     - 每个纪元必须至少有 5 条专属随机事件
```

验证方式：
- grep `WANDERING` 在 randomevents.json 中无结果（或仅存在于已废弃的旧数据中）
- 每个纪元的事件数量 ≥ 5

### 规则 5：头像资源映射规范

```
【E5】所有事件图片引用必须通过 mapAvatar() 映射：
     - 禁止使用 /images/ 开头的全路径引用
     - 禁止使用旧版 character_* 文件名（应使用 unified_* 统一版）
     - 新角色图片必须使用 unified_<name>_<timestamp>.png 命名
     - 头像不存在时，mapAvatar() 会自动降级到 classifyAvatar() 或 default
```

验证方式：
- grep `/images/` 在 randomevents.json 中无结果
- grep `character_` 在 randomevents.json 的 avatarUrl 字段中无引用（已迁移到 unified_）

### 规则 6：存档/读档完整性

```
【E6】所有运行时状态必须在存档/读档中完整保留：
     - triggeredFilteredIds (Set) — 已触发条件事件ID
     - randomEventTriggerCounts (Map) — 随机事件触发计数
     - lastLaneTriggeredYear (Map) — 各 lane 最后触发年份
     - lastAnyEventYear (number) — 任意事件最后触发年份
     - tickerMessages (Array) — 公告板消息历史
     - 所有新增的运行时状态字段
     
     禁止在 restorePrototypes 中无条件调用 init() 覆盖已保存状态。
```

验证方式：
- 保存游戏 → 读档 → 事件不重复触发
- 保存游戏 → 读档 → 公告板显示历史消息
- 保存游戏 → 读档 → 条件事件不重新弹出

### 规则 7：修改前必须读取完整上下文

```
【E7】修改任何文件前，必须：
     (a) 读取目标文件的完整内容
     (b) 读取所有引用目标文件的其他文件
     (c) 运行 grep 确认修改影响范围
     (d) 修改后运行 npm run test 确认所有测试通过
     
     禁止在未阅读完整文件的情况下进行局部修改。
```

### 规则 8：测试覆盖要求

```
【E8】以下修改必须附带测试：
     - 新增核心类/方法 → 单元测试
     - 修改事件触发逻辑 → 集成测试
     - 修改存档/读档逻辑 → 序列化测试
     - 修改战斗/资源计算 → 数值测试
     
     测试文件位置：03_Web_Rebuild/src/test/
     测试框架：Vitest
     运行命令：npm run test
```

### 规则 9：禁止引入新的事件系统问题

```
【E9】在修改事件系统时，以下行为被严格禁止：
     - 在数据 JSON 中添加 cooldownYears
     - 在引擎层添加绕过 isEventCharactersUnlocked 的逻辑
     - 使用硬编码的 /images/ 路径
     - 使用旧版 character_* 头像文件名
     - 使用 WANDERING/SHELTER 等模糊纪元标签
     - 添加绝对值 > 100 的人口效果
     - 在 restorePrototypes 中无条件调用 init()
     - 修改 normalizeEventMeta 的 maxTriggers 强制逻辑
```

---

## 第四部分：修复执行顺序与验证检查清单

### 阶段一：事件系统 P0 修复（必须最先完成）

按顺序执行：

| 顺序 | 修复编号 | 说明 | 涉及文件 | 预计影响 |
|------|---------|------|---------|---------|
| 1 | FIX-001 | 删除 randomevents.json 中 9 处 cooldownYears | `randomevents.json` | 9 行删除 |
| 2 | FIX-005 | 废弃 WANDERING 纪元标签 | `GameEventManager.ts`, `randomevents.json` | 42 条事件纪元重分配 |
| 3 | FIX-004 | 修复 14 处人物纪元时间线冲突 | `randomevents.json` | 14 条事件修改 |
| 4 | FIX-006 | 数值量纲钳制 + 数据修正 | `GameEventManager.ts`, `randomevents.json` | 60+ 条事件数值修正 |
| 5 | FIX-002 | 存档/读档计数器保护 | `Game.ts` | 5 行修改 |
| 6 | FIX-003 | 公告板读档后渲染 | `Game.ts`, `AnnouncementBoard.tsx` | 5 行修改 |

**阶段一验证**：
```bash
npm run test        # 所有 246 测试通过
grep "cooldownYears" 03_Web_Rebuild/src/data/randomevents.json  # 无结果
grep "WANDERING" 03_Web_Rebuild/src/data/randomevents.json       # 无结果
```

### 阶段二：事件系统 P1 修复

| 顺序 | 修复编号 | 说明 |
|------|---------|------|
| 7 | FIX-007 | 新增 BUNKER 纪元事件（6-8 条） |
| 8 | FIX-008 | 添加 reqStar 条件支持 |
| 9 | FIX-009 | 清理 triggerCharacterUnlockPopup 死代码 |
| 10 | FIX-010 | 叙事内容修正（错别字、语气、时序） |

### 阶段三：核心系统 P0 修复

| 顺序 | 修复编号 | 说明 |
|------|---------|------|
| 11 | FIX-012 | 纪元系统修正为文化值驱动 |
| 12 | FIX-011 | 战斗系统 UI 重构 |
| 13 | FIX-013 | 外太空星图数据补全 |
| 14 | FIX-014 | 行星发动机子系统 |
| 15 | FIX-015 | 数字生命系统 |
| 16 | FIX-016 | 外交系统独立 UI |
| 17 | FIX-017 | 面壁者叛变/破壁机制 |
| 18 | FIX-018 | AI 特殊武器系统 |
| 19 | FIX-019 | Vitest 测试框架集成 |

### 阶段四：P1/P2 收尾

| 顺序 | 修复编号 | 说明 |
|------|---------|------|
| 20 | FIX-020 | 事件舰队武器 |
| 21 | FIX-021 | 跨树科技依赖 |
| 22 | FIX-022 | 执剑人交接危机 |
| 23 | FIX-023 | 人口分配 UI |
| 24 | FIX-024 | 配置文件 JSON 化 |
| 25 | FIX-025 | 战斗动画 |
| 26 | FIX-026 | 星图多层级 |
| 27 | FIX-027 | 存档校验 |
| 28 | FIX-028 | 旧图片清理 |

### 最终验证清单

```bash
# 1. 编译检查
npm run build

# 2. 全量测试
npm run test

# 3. 事件系统专项检查
# - 所有事件无 cooldownYears
# - 所有事件无 WANDERING 纪元
# - 所有事件无 /images/ 全路径
# - 所有事件无 character_* 旧版头像
# - 所有事件无绝对值 > 100 的人口效果
# - 每个纪元事件数 ≥ 5

# 4. 存档/读档专项检查
# - 新游戏 → 推进 10 回合 → 存档 → 读档 → 事件不重复
# - 新游戏 → 推进 50 回合 → 存档 → 读档 → 公告板显示完整历史
# - 新游戏 → 触发条件事件 → 存档 → 读档 → 条件事件不再次弹出

# 5. 人物纪元检查
# - 维德不会在 CRISIS 纪元事件中出场
# - 程心/云天明不会在 CRISIS 纪元事件中出场
# - 丁仪不会在 BROADCAST 纪元之后出场
```

---

> 本文档为项目修复的权威参考。任何 AI 或开发者接手此项目时，必须以本文档为基准，严格遵守第三部分的约束规则。
> 修复过程中如遇到本文档未涵盖的新问题，应先更新本文档再执行修改。