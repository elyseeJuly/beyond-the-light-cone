# 结局触发路径重设计

> **Category:** `SPEC_` — 系统设计规格书  
> **Date:** 2026-06-21  
> **Target Version:** `legend-of-uni-web@0.9.0-beta`  
> **Related Specs:** [SPEC_20260621_EVENT_TAG_SYSTEM_REDESIGN.md](file:///workspace/02_Project_Documentation/SPEC_20260621_EVENT_TAG_SYSTEM_REDESIGN.md)  
> **Related Audits:** [AUDIT_20260621_COMPREHENSIVE_NARRATIVE_AUDIT.md](file:///workspace/02_Project_Documentation/AUDIT_20260621_COMPREHENSIVE_NARRATIVE_AUDIT.md)

---

## 1. 背景

当前结局系统存在两个核心问题：

1. **多个胜利结局无法触发**：`digital_ark_upgrade`、`dark_domain_decision`、`conquest_declared`、`zero_homer_contacted`、`mini_universe_built` 等关键 flag 只在测试代码中出现，正常游戏中没有任何代码设置它们。
2. **结局与纪元、玩家策略的绑定过弱**：结局触发条件分散在 `Game.ts` 的硬编码 `if/else` 中，难以扩展；部分结局本应可在早期纪元触发，部分则必须到达特定纪元才应出现。

本规格书基于 [SPEC_20260621_EVENT_TAG_SYSTEM_REDESIGN.md](file:///workspace/02_Project_Documentation/SPEC_20260621_EVENT_TAG_SYSTEM_REDESIGN.md) 的标签系统，重新设计结局触发路径，**让结局成为玩家数值、策略、事件选择的自然结果**。

---

## 2. 设计原则

| 原则 | 说明 |
|------|------|
| **标签/事件驱动** | 结局条件以 `ending_eligible_*` 标签为核心，事件负责设置这些标签。 |
| **纪元分野** | 早期结局反映“蝴蝶效应”（如信号未发、提前威慑）；中期结局反映战略路线；晚期结局反映文明级选择。 |
| **互斥与优先级** | 同一局只能有一个结局；高优先级结局先判定，避免低优先级覆盖。 |
| **可扩展** | 新增结局只需在配置表中添加一行，无需修改 `checkVictoryConditions` 的硬编码。 |

---

## 3. 结局总览

新设计共 **15 个结局**：

- **胜利结局 10 个**（原 6 个全部保留并修复可达性，新增 4 个）。
- **失败结局 5 个**（原 4 个全部保留，新增 1 个）。

```text
胜利结局
├── 信号静默 SIGNAL_SILENCED          [GOLDEN]
├── 提前威慑 EARLY_DETERRENCE         [CRISIS]
├── 威慑纪元 DETERRENCE               [DETERRENCE]
├── 星际征服 CONQUEST                 [BROADCAST+]
├── 流浪地球 WANDERING                [BUNKER+]
├── 数字生命 DIGITAL                  [BUNKER+]
├── 黑域纪元 DARK_DOMAIN              [BUNKER+]
├── 光速流亡 LIGHTSPEED_EXILE         [BROADCAST+]
├── 银河公民 GALACTIC_CITIZEN         [GALAXY]
└── 死神永生 HIDDEN                   [GALAXY+]

失败结局
├── 人类内乱 TREACHERY
├── 文明灭绝 EXTINCTION
├── 维度打击 DIMENSION_STRIKE
├── 氦闪灭绝 HELIUM_FLASH
└── ETO 接管 ETO_DOMINION             [CRISIS/BROADCAST]
```

---

## 4. 结局条件数据结构

新增配置文件 `src/config/endingConditions.ts`（或合并入 `endingConfig.ts`），用声明式条件替代硬编码：

```ts
export interface EndingConditionDef {
  id: string;                       // VictoryType / DefeatType 的 key
  type: 'victory' | 'defeat';
  label: string;
  description: string;

  // 时间/纪元窗口
  minYear?: number;
  maxYear?: number;
  epoch?: { min?: EpochType; max?: EpochType };

  // 标签要求
  reqTags?: string[];
  reqNotTags?: string[];
  minTagIntensity?: number;

  // flag 要求
  reqFlags?: string[];
  reqNotFlags?: string[];

  // 数值要求
  minStats?: Partial<EarthStats>;
  maxStats?: Partial<EarthStats>;

  // 特殊检查（函数名或表达式）
  special?:
    | 'allAliensConquered'
    | 'broadcastSurvives'
    | 'swordholderAssigned'
    | 'deterrenceStable'
    | 'dimensionStrikeImminent'
    | 'noDimensionalDefense';

  // 互斥与优先级
  mutuallyExclusive?: string[];
  priority: number;

  // 资源
  sceneImage: string;
  endingMusic?: string;
}
```

### 4.1 通用判定器

```ts
function checkEnding(ending: EndingConditionDef, game: Game): boolean {
  if (ending.minYear && game.year < ending.minYear) return false;
  if (ending.maxYear && game.year > ending.maxYear) return false;
  if (ending.epoch?.min && game.epoch < ending.epoch.min) return false;
  if (ending.epoch?.max && game.epoch > ending.epoch.max) return false;

  if (ending.reqTags && !ending.reqTags.every(t => game.tagManager.hasTag(t, ending.minTagIntensity ?? 1))) return false;
  if (ending.reqNotTags && ending.reqNotTags.some(t => game.tagManager.hasTag(t, 1))) return false;

  if (ending.reqFlags && !ending.reqFlags.every(f => game.hasFlag(f))) return false;
  if (ending.reqNotFlags && ending.reqNotFlags.some(f => game.hasFlag(f))) return false;

  if (ending.minStats) {
    for (const [k, v] of Object.entries(ending.minStats)) {
      if ((game.earthCivi as any)[k] < v) return false;
    }
  }
  if (ending.maxStats) {
    for (const [k, v] of Object.entries(ending.maxStats)) {
      if ((game.earthCivi as any)[k] > v) return false;
    }
  }

  if (ending.special) {
    switch (ending.special) {
      case 'allAliensConquered': return game.alienCiviManager.isAllCiviConquered();
      case 'broadcastSurvives': return game.broadcastSurvives();
      case 'swordholderAssigned': return game.earthCivi.swordholder !== null;
      case 'deterrenceStable': return game.earthCivi.deterrenceValue >= 90 && game.deterrenceEnduranceRounds >= 20;
      case 'dimensionStrikeImminent': return game.dimensionStrikeTriggered;
      case 'noDimensionalDefense': return !game.hasDimensionalDefense();
    }
  }

  return true;
}
```

### 4.2 结局检查入口

```ts
private checkVictoryConditions(): void {
  if (this.isGameOver) return;

  const candidates = ENDING_CONDITIONS
    .filter(e => !e.mutuallyExclusive || !e.mutuallyExclusive.some(id => this.endingTriggered.has(id)))
    .sort((a, b) => b.priority - a.priority);

  for (const ending of candidates) {
    if (checkEnding(ending, this)) {
      this.triggerEnding(ending.id, ending.type);
      return;
    }
  }
}
```

---

## 5. 胜利结局详细路径

### 5.1 SIGNAL_SILENCED — 信号静默

| 项目 | 内容 |
|------|------|
| **触发纪元** | `GOLDEN` |
| **触发年份** | ≤ `-30` |
| **关键标签** | `milestone_signal_blocked` |
| **关键事件** | 过滤事件“红岸信号拦截” |
| **玩家操作** | 高 `policy_secrecy`、投入军事/文化监控、在叶文洁发送前选择拦截 |
| **互斥** | 所有含 `milestone_signal_sent` 的结局 |
| **优先级** | 100（最高，改变整个时间线） |
| **CG** | `ending_signal_silenced.png`（可复用 `cg_red_shore_base.png` 重命名） |

**叙事**：玩家在三体尚未收到地球坐标前切断了信号，人类文明在 unaware 中继续发展，三体危机从未发生。

### 5.2 EARLY_DETERRENCE — 提前威慑

| 项目 | 内容 |
|------|------|
| **触发纪元** | `CRISIS` |
| **触发年份** | `< 200` |
| **关键标签** | `ending_eligible_early_deterrence`, `milestone_deterrence_established` |
| **关键事件** | 过滤事件“罗辑的咒语”成功，强制进入 `DETERRENCE` 纪元 |
| **玩家操作** | 保护罗辑、完成科技 `黑暗森林威慑`、文化/威慑值高、选择信任黑暗森林 |
| **数值要求** | `deterrenceValue ≥ 80`, `swordholder !== null`, `treachery < 60` |
| **互斥** | `DETERRENCE`（视为同一结局的早晚分支，用不同 CG 区分） |
| **优先级** | 95 |
| **CG** | `ending_early_deterrence.png` |

### 5.3 DETERRENCE — 威慑纪元

| 项目 | 内容 |
|------|------|
| **触发纪元** | `DETERRENCE` 及以上 |
| **关键标签** | `milestone_deterrence_established` |
| **关键事件** | 固定事件“威慑建立”、执剑人交接 |
| **玩家操作** | 任命并维持执剑人 |
| **数值要求** | `deterrenceValue ≥ 90`, `deterrenceEnduranceRounds ≥ 20`, 无战争 |
| **特殊检查** | `swordholderAssigned` |
| **互斥** | `EARLY_DETERRENCE` |
| **优先级** | 90 |
| **CG** | `ending_deterrence.png` |

### 5.4 CONQUEST — 星际征服

| 项目 | 内容 |
|------|------|
| **触发纪元** | `BROADCAST` 及以上 |
| **关键标签** | `ending_eligible_conquest` |
| **关键事件** | 过滤事件“星际扩张宣言”、多次对外星文明胜利 |
| **玩家操作** | 军事优先、征服外星星球、低鸽派标签 |
| **数值要求** | `treachery < 50`, `army ≥ 2000` |
| **特殊检查** | `allAliensConquered` 或 `trisolaris_conquered` |
| **互斥** | `GALACTIC_CITIZEN`, `DARK_DOMAIN` |
| **优先级** | 85 |
| **CG** | `ending_conquest.png` |

### 5.5 WANDERING — 流浪地球

| 项目 | 内容 |
|------|------|
| **触发纪元** | `BUNKER` 及以上 |
| **关键标签** | `ending_eligible_wandering`, `milestone_wandering` |
| **关键事件** | 固定事件“流浪地球决策”、行星发动机达到目标距离 |
| **玩家操作** | 研发 `行星发动机Ⅲ型` + `新家园选址`、在引擎 UI 启动迁徙 |
| **特殊检查** | `wandering_completed` |
| **互斥** | `LIGHTSPEED_EXILE`, `DIGITAL`, `DARK_DOMAIN` |
| **优先级** | 85 |
| **CG** | `ending_wandering.png` |

### 5.6 DIGITAL — 数字生命

| 项目 | 内容 |
|------|------|
| **触发纪元** | `BUNKER` 及以上 |
| **关键标签** | `ending_eligible_digital` |
| **关键事件** | 科技“数字方舟”完成、过滤事件“意识上传公投” |
| **玩家操作** | 文化/科技优先、选择数字化路线 |
| **数值要求** | `population ≥ 50`, `culture ≥ 800` |
| **互斥** | `WANDERING`, `DARK_DOMAIN`, `LIGHTSPEED_EXILE` |
| **优先级** | 85 |
| **CG** | `ending_digital.png` |

### 5.7 DARK_DOMAIN — 黑域纪元

| 项目 | 内容 |
|------|------|
| **触发纪元** | `BUNKER` 及以上 |
| **关键标签** | `ending_eligible_dark_domain` |
| **关键事件** | 科技“黑域生成”完成、过滤事件“黑域宣言” |
| **玩家操作** | 研发黑域生成器并启动 |
| **数值要求** | `treachery < 80`, `culture ≥ 600` |
| **互斥** | `WANDERING`, `DIGITAL`, `CONQUEST`, `LIGHTSPEED_EXILE` |
| **优先级** | 85 |
| **CG** | `ending_dark_domain.png` |

### 5.8 LIGHTSPEED_EXILE — 光速流亡

| 项目 | 内容 |
|------|------|
| **触发纪元** | `BROADCAST` 及以上 |
| **关键标签** | `ending_eligible_lightspeed_exile`, `path_lightspeed` |
| **关键事件** | 过滤事件“光速飞船大逃亡” |
| **玩家操作** | 完成 `曲率驱动理论` + `99%光速飞船`、批准光舰逃亡 |
| **数值要求** | `culture ≥ 500`, `economy ≥ 1000` |
| **互斥** | `WANDERING`, `DIGITAL` |
| **优先级** | 80 |
| **CG** | `ending_lightspeed_exile.png`（新增美术资源） |

### 5.9 GALACTIC_CITIZEN — 银河公民

| 项目 | 内容 |
|------|------|
| **触发纪元** | `GALAXY` |
| **关键标签** | `ending_eligible_galactic_citizen`, `alien_alliance`, `galaxy_exodus_seen` |
| **关键事件** | 过滤事件“银河共同体成立” |
| **玩家操作** | 解锁 ≥3 外星文明、维持友好外交、文化高 |
| **数值要求** | `culture ≥ 1500`, `treachery < 40` |
| **互斥** | `CONQUEST` |
| **优先级** | 80 |
| **CG** | `ending_galactic_citizen.png`（新增美术资源） |

### 5.10 HIDDEN — 死神永生 / 小宇宙

| 项目 | 内容 |
|------|------|
| **触发纪元** | `GALAXY` 及以上 |
| **关键标签** | `ending_eligible_hidden`, `zero_homer_contacted`, `mini_universe_built` |
| **关键事件** | 随机/过滤事件“小宇宙之门”、科技“宇宙重启理论” |
| **玩家操作** | 研究归零者、接触归零者、建造小宇宙 |
| **数值要求** | `culture ≥ 1000` |
| **特殊路径** | 仍保留广播存活路径：`broadcastTriggered && broadcastSurvives` |
| **优先级** | 75 |
| **CG** | `ending_hidden.png` |

---

## 6. 失败结局详细路径

### 6.1 TREACHERY — 人类内乱

| 项目 | 内容 |
|------|------|
| **触发条件** | `treachery ≥ 100` |
| **优先级** | 1000（失败结局最高，立即结束） |
| **CG** | `ending_defeat_treachery.png` |

### 6.2 EXTINCTION — 文明灭绝

| 项目 | 内容 |
|------|------|
| **触发条件** | `population ≤ 0` |
| **优先级** | 990 |
| **CG** | `ending_defeat_extinction.png` |

### 6.3 DIMENSION_STRIKE — 维度打击

| 项目 | 内容 |
|------|------|
| **触发条件** | 外星文明触发二向箔且玩家无 `ending_eligible_wandering`/`ending_eligible_digital`/`ending_eligible_dark_domain`/`ending_eligible_hidden`/`milestone_wandering` 等防御标签 |
| **优先级** | 980 |
| **CG** | `ending_defeat_dimension_strike.png` |

### 6.4 HELIUM_FLASH — 氦闪灭绝

| 项目 | 内容 |
|------|------|
| **触发条件** | `year > 350` 且无上述防御标签 |
| **优先级** | 970 |
| **CG** | `ending_defeat_helium_flash.png` |

### 6.5 ETO_DOMINION — ETO 接管

| 项目 | 内容 |
|------|------|
| **触发纪元** | `CRISIS` 至 `BROADCAST` |
| **关键标签** | `eto_dominion` |
| **关键事件** | 过滤事件“新降临派夺权” |
| **玩家操作** | 持续鸽派、对三体让步、高 treachery、压制抵抗 |
| **数值要求** | `treachery ≥ 80`, `military < 500` |
| **互斥** | 所有胜利结局 |
| **优先级** | 950 |
| **CG** | `ending_eto_dominion.png`（新增美术资源） |

---

## 7. 互斥与优先级矩阵

| 优先级 | 结局 | 互斥集合 |
|--------|------|----------|
| 1000 | TREACHERY | — |
| 990 | EXTINCTION | — |
| 980 | DIMENSION_STRIKE | — |
| 970 | HELIUM_FLASH | — |
| 950 | ETO_DOMINION | 所有胜利 |
| 100 | SIGNAL_SILENCED | 含 `milestone_signal_sent` 的结局 |
| 95 | EARLY_DETERRENCE | DETERRENCE |
| 90 | DETERRENCE | EARLY_DETERRENCE |
| 85 | WANDERING / DIGITAL / DARK_DOMAIN / CONQUEST | 彼此、LIGHTSPEED_EXILE |
| 80 | LIGHTSPEED_EXILE / GALACTIC_CITIZEN | WANDERING/DIGITAL, CONQUEST |
| 75 | HIDDEN | 无（作为最终隐藏结局） |

> 注：相同优先级的结局按配置顺序检查，通常它们自身在条件上已是互斥的。

---

## 8. 结局与事件/标签映射表

| 结局 | 设置 `ending_eligible_*` 的事件/科技 | 关键 flag / tag | 建议新增事件 |
|------|--------------------------------------|-----------------|--------------|
| SIGNAL_SILENCED | 过滤事件“红岸信号拦截” | `milestone_signal_blocked` | 红岸信号拦截 |
| EARLY_DETERRENCE | 过滤事件“罗辑的咒语” | `early_deterrence_unlocked` | 罗辑的咒语 |
| DETERRENCE | 固定事件“威慑建立”、执剑人任命 | `milestone_deterrence_established` | 已存在 |
| CONQUEST | 征服外星星球、过滤事件“星际扩张宣言” | `ending_eligible_conquest` | 星际扩张宣言 |
| WANDERING | 行星发动机 UI、科技 | `milestone_wandering` | 已存在 |
| DIGITAL | 科技“数字方舟”、过滤事件“意识上传公投” | `ending_eligible_digital` | 意识上传公投 |
| DARK_DOMAIN | 科技“黑域生成”、过滤事件“黑域宣言” | `ending_eligible_dark_domain` | 黑域宣言 |
| LIGHTSPEED_EXILE | 科技“99%光速飞船”、过滤事件“光速飞船大逃亡” | `ending_eligible_lightspeed_exile` | 光速飞船大逃亡 |
| GALACTIC_CITIZEN | 过滤事件“银河共同体成立” | `ending_eligible_galactic_citizen` | 银河共同体成立 |
| HIDDEN | 随机事件“小宇宙之门”、科技“宇宙重启理论” | `mini_universe_built`, `zero_homer_contacted` | 小宇宙之门 |
| ETO_DOMINION | 过滤事件“新降临派夺权” | `eto_dominion` | 新降临派夺权 |

---

## 9. 对现有枚举的修改

### 9.1 `VictoryType`

```ts
export enum VictoryType {
  CONQUEST = 0,
  DETERRENCE = 1,
  DARK_DOMAIN = 2,
  WANDERING = 3,
  DIGITAL = 4,
  HIDDEN = 5,
  SIGNAL_SILENCED = 6,      // 新增
  EARLY_DETERRENCE = 7,     // 新增
  LIGHTSPEED_EXILE = 8,     // 新增
  GALACTIC_CITIZEN = 9,     // 新增
  COUNT = 10
}
```

### 9.2 `DefeatType`

```ts
export enum DefeatType {
  TREACHERY = 0,
  EXTINCTION = 1,
  HELIUM_FLASH = 2,
  DIMENSION_STRIKE = 3,
  ETO_DOMINION = 4,         // 新增
}
```

### 9.3 `endingConfig.ts`

为每个新增结局添加配置项，复用现有的 `getImageUrl()` 机制：

```ts
{
  type: 'victory',
  key: VictoryType.SIGNAL_SILENCED,
  title: '信号静默',
  sceneImage: getImageUrl('ending_signal_silenced'),
  music: 'ending_peace',
  description: '红岸的电波永远停留在大气层内，三体舰队从未启航。'
}
```

---

## 10. 实施步骤

| 阶段 | 内容 | 主要文件 |
|------|------|----------|
| 1 | 扩展 `VictoryType` / `DefeatType` 枚举 | `types/enums.ts` |
| 2 | 创建 `ENDING_CONDITIONS` 配置表 | `config/endingConditions.ts` |
| 3 | 重构 `Game.checkVictoryConditions` 为通用判定器 | `core/Game.ts` |
| 4 | 为所有不可达结局添加 tag/flag 设置点 | `core/Game.ts`, `core/TecTreeManager.ts`, `data/events.json`, `GameEventManager.ts` 内联 filtered events |
| 5 | 新增 5 个结局对应的关键事件 | `data/events.json` / filtered events |
| 6 | 新增/重命名结局 CG 资源 | `public/images/` |
| 7 | 更新结局历史记录与成就系统 | `core/SaveManager.ts` |
| 8 | 单元测试：覆盖所有结局路径 | `test/core/Game.victoryConditions.test.ts` |

---

## 11. 验收标准

- [ ] `ENDING_CONDITIONS` 包含全部 15 个结局，且判定逻辑不再使用硬编码 `if/else`。
- [ ] 原 6 个胜利结局全部可在正常游戏中触发（不再依赖测试-only flag）。
- [ ] 新增 4 个胜利结局和 1 个失败结局有完整的事件链和标签触发路径。
- [ ] `SIGNAL_SILENCED` 能在 `-30` 年前触发并正确结束游戏。
- [ ] `EARLY_DETERRENCE` 能在 200 年前通过罗辑事件触发。
- [ ] `GALACTIC_CITIZEN` 要求解锁 ≥3 个外星文明并维持友好。
- [ ] 所有结局均调用 `SaveManager.recordEnding()` 并播放对应 CG。

---

*Designed in accordance with `SPEC_20260519_DOCUMENTATION_STANDARDS.md`.*
