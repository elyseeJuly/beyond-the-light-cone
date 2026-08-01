# 事件-标签-数值双向反馈与角色生命周期系统重设计

> **Category:** `SPEC_` — 系统设计规格书  
> **Date:** 2026-06-21  
> **Target Version:** `legend-of-uni-web@0.9.0-beta`  
> **Related Audits:** [AUDIT_20260621_COMPREHENSIVE_NARRATIVE_AUDIT.md](file:///workspace/02_Project_Documentation/AUDIT_20260621_COMPREHENSIVE_NARRATIVE_AUDIT.md)

---

## 1. 背景与目标

当前项目已经具备 `TagManager`、`GameEventManager`、`PersonManager` 等基础设施，但存在以下问题：

- 标签（Tag）主要由系统自动生成，**玩家通过数值操作产生的标签太少**。
- 重大事件多为固定时间触发，**玩家的策略选择难以改变事件走向**。
- 事件效果只支持数值/flag，**不能驱动角色退场、纪元切换、结局资格**。
- 角色只有“登场（unlock）”，没有“退场（retire/kill）”。
- 纪元切换由文化值驱动，与三体官方“重大事件预示新纪元”的叙事逻辑不符。

本规格书要设计一套**事件-标签-数值双向反馈系统**：

1. 玩家的数值/策略/科技/外交操作 → 生成世界标签；
2. 标签影响事件是否触发、触发哪个分支、触发权重；
3. 事件执行后反过来修改数值、标签、角色状态、纪元、结局资格。

---

## 2. 设计原则

| 原则 | 说明 |
|------|------|
| **双向反馈** | 数值操作 → 标签 → 事件；事件 → 数值/标签/角色/纪元/结局。 |
| **标签驱动** | 特殊事件逻辑线通过标签触发，避免硬编码大量 `if/else`。 |
| **可预测但可偏离** | 三体主线仍按年份存在，但玩家策略可改变分支、提前或延后、甚至进入隐藏线。 |
| **角色生命周期** | 每个核心角色都应有登场、活跃、退场（死亡/退休/失踪）的完整事件链。 |
| **纪元由里程碑事件强制推进** | 文化值仍是基础动力，但关键事件可强制切换纪元。 |

---

## 3. 标签体系扩展

在 [TagManager.ts](file:///workspace/03_Web_Rebuild/src/core/TagManager.ts) 的 `STANDARD_TAGS` 中新增以下分类：

### 3.1 玩家策略标签（`strategy_*`）

| 标签 ID | 名称 | 来源 |
|---------|------|------|
| `strategy_military_first` | 军事优先 | 军事部投入/建造军舰/宣战比例高 |
| `strategy_culture_first` | 文化优先 | 文化部/文化研究所投入高 |
| `strategy_economy_first` | 经济优先 | 经济部/经济研究所投入高 |
| `strategy_escape_first` | 逃亡优先 | 光舰/数字方舟/行星发动机投入高 |
| `strategy_resistance_first` | 抵抗优先 | 黑暗森林/威慑/掩体投入高 |

### 3.2 政策标签（`policy_*`）

| 标签 ID | 名称 | 来源 |
|---------|------|------|
| `policy_hawkish` | 鹰派政策 | 频繁宣战、军事威慑 |
| `policy_dovish` | 鸽派政策 | 外交缓和、联盟 |
| `policy_transparency` | 透明政策 | 公开坐标、信息公开 |
| `policy_secrecy` | 保密政策 | 封锁红岸信号、隐藏计划 |
| `policy_migration` | 移民政策 | 大规模星际移民 |
| `policy_isolation` | 孤立政策 | 拒绝外星接触 |

### 3.3 里程碑标签（`milestone_*`）

| 标签 ID | 名称 | 说明 |
|---------|------|------|
| `milestone_signal_sent` | 信号已发送 | 叶文洁发出地球坐标 |
| `milestone_signal_blocked` | 信号被拦截 | 玩家成功阻止信号发送 |
| `milestone_deterrence_established` | 威慑已建立 | 罗辑建立黑暗森林威慑 |
| `milestone_broadcast` | 坐标已广播 | 万有引力号广播 |
| `milestone_bunker` | 掩体世界完成 | 掩体计划完成 |
| `milestone_wandering` | 流浪地球启动 | 行星发动机已点火 |

### 3.4 外星文明接触标签（`contact_*`）

为所有 9 个外星文明都建立接触标签，替代当前基于文本扫描的脆弱逻辑：

| 标签 ID | 文明 |
|---------|------|
| `contact_trisolaris` | 三体 |
| `contact_singer` | 歌者 |
| `contact_ring` | 魔戒 |
| `contact_fringe` | 边缘世界 |
| `contact_zeroers` | 归零者 |
| `contact_carbon` | 碳基联邦 |
| `contact_silicon` | 硅基帝国 |
| `contact_god` | 上帝文明 |
| `contact_quantum` | 量子态文明 |

### 3.5 结局资格标签（`ending_eligible_*`）

| 标签 ID | 对应结局 |
|---------|----------|
| `ending_eligible_wandering` | 流浪地球 |
| `ending_eligible_digital` | 数字生命 |
| `ending_eligible_dark_domain` | 黑域纪元 |
| `ending_eligible_conquest` | 星际征服 |
| `ending_eligible_hidden` | 死神永生/小宇宙 |
| `ending_eligible_galactic_citizen` | 银河公民（新增） |
| `ending_eligible_lightspeed_exile` | 光速流亡（新增） |
| `ending_eligible_signal_silenced` | 信号静默（新增） |
| `ending_eligible_early_deterrence` | 提前威慑（新增） |

### 3.6 角色立场标签

复用并扩展 `CHARACTER_STANCE_TAGS`，新增：

| 标签 ID | 名称 |
|---------|------|
| `wallfacer` | 面壁者 |
| `swordholder_candidate` | 执剑人候选 |
| `eto_sympathizer` | ETO 同情者 |
| `eto_opponent` | ETO 反对者 |
| `escaped` | 已离舰/离星 |

---

## 4. 数值操作 → 标签 的生成规则

在 [EarthCivilization.ts](file:///workspace/03_Web_Rebuild/src/core/EarthCivilization.ts) 每回合结算后、在 [TecTreeManager.ts](file:///workspace/03_Web_Rebuild/src/core/TecTreeManager.ts) 完成科技后、在外交动作后，调用新的 `GameTagEvaluator.evaluateActionTags(game)` 生成或更新标签。

### 4.1 部门投入比例

```ts
const total = miningRatio + factoryRatio + cultureRatio;
const militaryShare = (miningRatio + factoryRatio * 0.5) / total;
const cultureShare = cultureRatio / total;

if (militaryShare > 0.55) tagManager.applyWorldTag('strategy_military_first', 10, 'worker_ratio', year);
if (cultureShare > 0.55) tagManager.applyWorldTag('strategy_culture_first', 10, 'worker_ratio', year);
```

### 4.2 科技完成

| 科技 | 生成的标签 |
|------|------------|
| 黑暗森林威慑 | `dark_forest_awakened` +10 |
| 550W 量子计算机 | `tech_boom` +10, `sophon_countermeasure_activated` +20 |
| 曲率驱动理论 | `path_lightspeed` +20 |
| 数字方舟 | `ending_eligible_digital` +30 |
| 黑域生成 | `ending_eligible_dark_domain` +30 |
| 归零者研究 | `contact_zeroers` +20 |
| 50 光年远镜 | `contact_singer` +10 |
| 1 万光年远镜 | `contact_singer` +20, `contact_fringe` +10 |

### 4.3 外交动作

| 动作 | 标签 |
|------|------|
| 与三体宣战 | `policy_hawkish` +15, `mil_threat` +10 |
| 与三体结盟 | `policy_dovish` +15, `diplomatic_warming` +10 |
| 对外广播坐标 | `policy_transparency` +20, `broadcast_completed` +50 |
| 封锁红岸信号 | `policy_secrecy` +20, `milestone_signal_blocked` +30 |
| 征服外星星球 | `ending_eligible_conquest` +20 |

### 4.4 面壁者/执剑人操作

| 操作 | 标签 |
|------|------|
| 任命罗辑为执剑人 | `deterrence_steady` +30, `milestone_deterrence_established` +50 |
| 启动引力波广播 | `broadcast_completed` +100 |
| 启动行星发动机 | `milestone_wandering` +100, `ending_eligible_wandering` +100 |

---

## 5. 事件触发条件扩展

### 5.1 扩展现有 `TriggerCondition`

```ts
export interface TriggerCondition {
  // 已有字段
  epoch?: EpochQuery;
  probability?: number;
  reqTech?: string | null;
  lane?: string;
  loreDomain?: string;
  weight?: number;
  cooldownYears?: number;
  maxTriggers?: number;
  tags?: string[];            // 保留：事件自身携带的标签分类
  severity?: number;
  reqStar?: string;

  // 新增
  reqTag?: string | string[];
  reqNotTag?: string | string[];
  minTagIntensity?: number;
  tagWeight?: Record<string, number>;
  reqCharacter?: string | string[];
  reqCharacterDead?: string | string[];
  reqCharacterStance?: { person: string; stance: string };
  mutuallyExclusiveWith?: string[];
  priority?: number;
}
```

### 5.2 条件评估伪代码

```ts
function isEventEligible(event, game): boolean {
  const tc = event.triggerCondition;
  if (tc.epoch && !matchesEpoch(tc.epoch, game.epoch)) return false;
  if (tc.minYear && game.year < tc.minYear) return false;
  if (tc.reqTech && !game.tecTreeManager.isResearched(tc.reqTech)) return false;
  if (tc.reqFlag && !game.hasFlag(tc.reqFlag)) return false;

  // 新增：标签
  if (tc.reqTag) {
    const tags = Array.isArray(tc.reqTag) ? tc.reqTag : [tc.reqTag];
    if (!tags.every(t => game.tagManager.hasTag(t, tc.minTagIntensity ?? 1))) return false;
  }
  if (tc.reqNotTag) {
    const tags = Array.isArray(tc.reqNotTag) ? tc.reqNotTag : [tc.reqNotTag];
    if (tags.some(t => game.tagManager.hasTag(t, 1))) return false;
  }

  // 新增：角色
  if (tc.reqCharacter) {
    const names = Array.isArray(tc.reqCharacter) ? tc.reqCharacter : [tc.reqCharacter];
    if (!names.every(n => game.personManager.isAvailable(n))) return false;
  }
  if (tc.reqCharacterDead) {
    const names = Array.isArray(tc.reqCharacterDead) ? tc.reqCharacterDead : [tc.reqCharacterDead];
    if (!names.every(n => game.personManager.isDead(n))) return false;
  }

  return true;
}
```

---

## 6. 事件分支（Branches）

固定事件和过滤事件支持多分支。系统按顺序匹配分支条件，命中则使用该分支的 `dialogQueue`、`effects`、`flags`。

### 6.1 JSON 示例：面壁计划

```json
{
  "id": "wallfacer_plan_branch",
  "title": "面壁计划启动",
  "year": 10,
  "epoch": "CRISIS",
  "dialogQueue": [...],
  "branches": [
    {
      "id": "military_branch",
      "condition": { "reqTag": "strategy_military_first", "minTagIntensity": 30 },
      "dialogQueue": [
        { "speakerName": "常伟思", "content": "既然军方已经掌握主导权，面壁计划必须以军事胜利为首要目标。" }
      ],
      "effects": [
        { "type": "tag", "target": "policy_hawkish", "value": 15 },
        { "type": "resource", "target": "army", "value": 100 }
      ]
    },
    {
      "id": "culture_branch",
      "condition": { "reqTag": "strategy_culture_first", "minTagIntensity": 30 },
      "dialogQueue": [
        { "speakerName": "萨伊", "content": "面壁者的真正武器，是整个人类文明的信念与想象。" }
      ],
      "effects": [
        { "type": "tag", "target": "policy_transparency", "value": 10 },
        { "type": "resource", "target": "culture", "value": 50 }
      ]
    }
  ],
  "defaultEffects": [
    { "type": "unlock_person", "target": "罗辑" },
    { "type": "unlock_person", "target": "泰勒" }
  ]
}
```

### 6.2 JSON 示例：执剑人交接

```json
{
  "id": "swordholder_handover",
  "title": "执剑人交接",
  "year": 219,
  "epoch": "DETERRENCE",
  "branches": [
    {
      "id": "cheng_xin_branch",
      "condition": { "reqTag": "strategy_culture_first", "minTagIntensity": 20 },
      "effects": [
        { "type": "character_tag", "target": "程心", "value": 50, "tagId": "swordholder_candidate" },
        { "type": "tag", "target": "deterrence_unstable", "value": 30 }
      ]
    },
    {
      "id": "luoji_keeps",
      "condition": { "reqTag": "strategy_resistance_first", "minTagIntensity": 20 },
      "effects": [
        { "type": "tag", "target": "deterrence_steady", "value": 30 },
        { "type": "character_tag", "target": "罗辑", "value": 30, "tagId": "swordholder_candidate" }
      ]
    }
  ]
}
```

---

## 7. 事件效果类型扩展

在 [types/narrative.ts](file:///workspace/03_Web_Rebuild/src/types/narrative.ts) 的 `EventEffectDef` 中新增类型：

```ts
export type EventEffectType =
  | 'resource' | 'flag' | 'event_effect' | 'techtree' | 'diplomacy' | 'population'
  | 'tag'                    // 应用/移除世界标签
  | 'remove_tag'             // 明确移除标签
  | 'character_tag'          // 应用角色标签
  | 'unlock_person'          // 角色登场
  | 'retire_person'          // 角色退休
  | 'kill_person'            // 角色死亡
  | 'force_epoch'            // 强制切换纪元
  | 'ending_eligibility'     // 设置结局资格
  | 'narrative_slice';       // 触发切片叙事

export interface EventEffectDef {
  type: EventEffectType;
  target: string;
  value?: number;
  tagId?: string;            // 用于 character_tag
}
```

### 7.1 效果实现位置

全部在 [Game.ts](file:///workspace/03_Web_Rebuild/src/core/Game.ts) 的 `applyNewEffects` 中统一处理：

```ts
private applyNewEffects(effects: EventEffectDef[], source: string): void {
  for (const e of effects) {
    switch (e.type) {
      case 'resource': /* 现有逻辑 */ break;
      case 'flag': this.addFlag(e.target); break;
      case 'tag': this.tagManager.applyWorldTag(e.target, e.value ?? 10, source, this.year); break;
      case 'remove_tag': this.tagManager.removeWorldTag(e.target); break;
      case 'character_tag': {
        this.tagManager.applyCharacterTag(e.target, {
          tagId: e.tagId ?? e.target,
          tagName: e.tagId ?? e.target,
          value: e.value ?? 10,
          appliedYear: this.year,
          source,
          personName: e.target,
        });
        break;
      }
      case 'unlock_person': this.personManager.unlockPerson(e.target); break;
      case 'retire_person': this.personManager.retirePerson(e.target, source); break;
      case 'kill_person': this.personManager.killPerson(e.target, source); break;
      case 'force_epoch': this.forceEpoch(e.target as EpochType); break;
      case 'ending_eligibility': this.tagManager.applyWorldTag(`ending_eligible_${e.target}`, e.value ?? 100, source, this.year); break;
      case 'narrative_slice': this.sliceEngine.generateForEvent(e.target); break;
    }
  }
}
```

### 7.2 强制切换纪元

```ts
private forceEpoch(epoch: EpochType): void {
  const prev = this.epoch;
  this.epoch = epoch;
  this.earthCivi.culture = Math.max(this.earthCivi.culture, epochsData[epoch].minCulture);
  this.tagManager.setWorldTagIntensity(epochTags[epoch], 100, this.year, `event:force_epoch:${epoch}`);
  this.historyGenerator.recordEpochChange(this.year, prev, this.epoch);
}
```

---

## 8. 角色登场/退场生命周期

### 8.1 PersonManager 改造

```ts
export type PersonStatus = 'alive' | 'dead' | 'retired' | 'missing';

export interface Person {
  // ... 原有字段
  status: PersonStatus;
  available: boolean;
  deathYear?: number;
  retirementYear?: number;
  cause?: string;
}
```

新增方法：

```ts
class PersonManager {
  unlockPerson(name: string): void;
  retirePerson(name: string, source: string): void;
  killPerson(name: string, source: string): void;
  setMissing(name: string, source: string): void;
  isAvailable(name: string): boolean;   // status === 'alive' && available
  isDead(name: string): boolean;
  isRetired(name: string): boolean;
}
```

### 8.2 退场事件示例

| 角色 | 退场触发条件 | 效果 |
|------|--------------|------|
| 伊文斯 | 固定事件“古筝行动” | `kill_person: 伊文斯` |
| 泰勒 | 过滤事件“泰勒破壁”分支选择 | `kill_person: 泰勒` 或 `retire_person: 泰勒` |
| 雷迪亚兹 | 过滤事件“雷迪亚兹破壁” | `kill_person: 雷迪亚兹` |
| 希恩斯 | 过滤事件“思想钢印”后续 | `retire_person: 希恩斯` |
| 章北海 | 固定事件“黑暗战役”后 | `retire_person: 章北海`（自然选择号远去） |
| 韦德 | 固定事件“韦德被处决” | `kill_person: 韦德` |
| 云天明 | 随机事件“阶梯计划” | `retire_person: 云天明`（大脑送出） |

### 8.3 事件角色检查

`GameEventManager.isEventCharactersUnlocked` 与随机事件选角逻辑统一改为：

```ts
function canUseCharacter(name: string, game: Game): boolean {
  return game.personManager.isAvailable(name);
}
```

对于“回忆/遗言”类事件，使用 `reqCharacterDead` 条件。

---

## 9. 特殊事件逻辑线设计

### 9.1 信号静默线（SIGNAL_SILENCED）

- **触发时机**：黄金岁月，叶文洁解锁后。
- **玩家操作**：高 `policy_secrecy`、军事或文化监控投入，触发事件“红岸信号拦截”。
- **关键标签**：`milestone_signal_blocked`。
- **结果**：三体坐标未发出，直接进入结局 `SIGNAL_SILENCED`。

### 9.2 ETO 崛起线（ETO_DOMINION）

- **触发时机**：危机纪元至广播纪元早期，三体未被摧毁。
- **玩家操作**：鸽派、对三体让步、压制抵抗思潮。
- **关键标签**：`eto_sympathizer`、高 `treachery`。
- **关键事件**：过滤事件“新降临派夺权”。
- **结果**：人类投降或 ETO 接管，进入 defeat `ETO_DOMINION`。

### 9.3 提前威慑线（EARLY_DETERRENCE）

- **触发时机**：危机纪元，早于 200 年。
- **玩家操作**：保护罗辑、完成“黑暗森林威慑”科技、文化/威慑值高。
- **关键标签**：`dark_forest_awakened`、`early_deterrence_unlocked`。
- **关键事件**：过滤事件“罗辑的咒语”成功，强制进入 `DETERRENCE` 纪元。
- **结果**：直接触发 `EARLY_DETERRENCE` 结局，跳过末日战役。

### 9.4 光舰流亡线（LIGHTSPEED_EXILE）

- **触发时机**：广播纪元及以后。
- **玩家操作**：完成曲率驱动、选择逃亡优先。
- **关键标签**：`path_lightspeed`、`lightspeed_project_approved`、`ending_eligible_lightspeed_exile`。
- **关键事件**：过滤事件“光速飞船大逃亡”。

### 9.5 小宇宙隐藏线（HIDDEN）

- **触发时机**：银河纪元。
- **玩家操作**：研究归零者、触发随机事件“小宇宙之门”。
- **关键标签**：`contact_zeroers`、`zero_homer_contacted`、`mini_universe_built`。
- **结果**：触发 `HIDDEN` 结局（死神永生）。

### 9.6 银河公民线（GALACTIC_CITIZEN）

- **触发时机**：银河纪元。
- **玩家操作**：解锁 ≥3 个外星文明并保持友好，文化高。
- **关键标签**：`alien_alliance`、`galaxy_exodus_seen`、`ending_eligible_galactic_citizen`。
- **结果**：人类以文明共同体身份融入银河。

---

## 10. 事件执行管线（每回合）

```
1. 数值结算 → 自动生成/更新策略/政策标签
2. 标签衰减（里程碑标签不衰减）
3. 评估固定事件队列
   - 若事件含 force_epoch，切换纪元并记录
   - 应用分支、效果、角色状态变更
4. 评估过滤事件（按权重排序，标签加权）
5. 评估随机事件（标签调整概率）
6. 角色生命周期检查（如条件满足触发死亡/退休事件）
7. 氛围/历史/切片叙事更新
8. 结局条件检查
```

---

## 11. 与现有系统的兼容

- 保留现有 `flags` 字段，作为旧版触发条件继续生效。
- 新增标签效果不破坏现有事件 JSON；未使用新字段的事件按默认逻辑执行。
- `mapAvatar` 与 CG 映射保持不动。
- `STANDARD_TAGS` 中新增标签不会导致旧存档崩溃（`hasTag` 对未知标签返回 `false`）。

---

## 12. 实施步骤

| 阶段 | 内容 | 主要文件 |
|------|------|----------|
| 1 | 扩展 `STANDARD_TAGS`、`EventEffectDef`、`TriggerCondition` 类型 | `TagManager.ts`, `types/narrative.ts`, `core/GameEvent.ts` |
| 2 | 改造 `PersonManager` 支持角色状态 | `core/PersonManager.ts`, `core/Person.ts` |
| 3 | 实现新效果类型与 `forceEpoch` | `core/Game.ts` |
| 4 | 实现事件分支解析与标签条件评估 | `core/GameEventManager.ts` |
| 5 | 玩家操作 → 标签钩子 | `core/EarthCivilization.ts`, `core/TecTreeManager.ts`, `core/Game.ts` 外交 |
| 6 | 重写核心事件为分支/标签形式 | `data/events.json`, `data/randomevents.json`, `GameEventManager.ts` 内联 filtered events |
| 7 | 添加角色退场事件 | `data/events.json` / filtered events |
| 8 | 单元测试与平衡 | `test/core/GameEventManager.test.ts`, `test/core/TagManager.test.ts` |

---

## 13. 验收标准

- [ ] `TagManager.STANDARD_TAGS` 至少包含本规格书列出的 40 个新标签。
- [ ] 事件 `TriggerCondition` 支持 `reqTag` / `reqNotTag` / `minTagIntensity`。
- [ ] 至少 10 个固定/过滤事件配置分支（`branches`）。
- [ ] `EventEffectDef` 支持 `tag`、`unlock_person`、`retire_person`、`kill_person`、`force_epoch`、`ending_eligibility`。
- [ ] 至少 5 个核心角色拥有退场事件（伊文斯、泰勒、雷迪亚兹、章北海、韦德）。
- [ ] 至少 3 个里程碑事件可以强制切换纪元。
- [ ] 玩家可通过数值/策略操作改变至少 3 条主线事件分支。

---

*Designed in accordance with `SPEC_20260519_DOCUMENTATION_STANDARDS.md`.*
