# `EPOCH_AUDIT_MODEL_星屑纪元`

> 纪元：星屑纪元（STARDUST, epoch=6）
> 阶段：纪元审计模型建立（未输出正式缺陷结论，未修改代码）
> 证据截止：20260712
> 基线引用：AUDIT_20260712_BASELINE.md
> 上游报告：AUDIT_20260712_AUDIT_REPORT_银河纪元.md

---

## 一、纪元状态卡

### 1.1 基础信息

| 属性 | 值 | 证据状态 |
|---|---|---|
| 纪元索引 | 6 | CONFIRMED（epochs.json 行 8） |
| 纪元名称 | 星屑纪元 / STARDUST | CONFIRMED |
| 文化阈值 | minCulture=2500, maxCulture=999999 | CONFIRMED（epochs.json 行 8，无上限） |
| 入口门控 FLAG | STARDUST_ERA_DECLARED 或 STARDUST_ERA_SEEN 或 ZERO_HOMER_CONTACTED | CONFIRMED（Game.ts:792） |
| timeline.json gameYearRange | **无独立条目** | CONFIRMED（timeline.json 仅"银河纪元 / 黑域纪元"合并条目 [351,999]，无"星屑"字样） |
| events.json 实际年份范围 | **无 STARDUST 事件** | CONFIRMED（events.json 中 epoch=STARDUST 事件为 0 条） |
| 纪元类型 | **终局纪元**（无下游纪元、无纪元内事件） | CONFIRMED |

### 1.2 入口条件

**门控逻辑**（Game.ts:792）：
```ts
if (matched.epoch === EpochType.STARDUST && !this.flagManager.isSet(FLAG.STARDUST_ERA_DECLARED) && !this.flagManager.isSet(FLAG.STARDUST_ERA_SEEN) && !this.flagManager.isSet(FLAG.ZERO_HOMER_CONTACTED)) allowed = false;
```

- **主通路 1**：`STARDUST_ERA_DECLARED`（'stardust_era_declared'）—— 由 GALAXY year=420 事件写入（events.json:1649）
- **主通路 2**：`ZERO_HOMER_CONTACTED`（'zero_homer_contacted'）—— 由 GALAXY year=400 事件写入（events.json:1520）+ filteredEvent 双写
- **旁路**：`STARDUST_ERA_SEEN`（'stardust_era_seen'）—— **无写入点**（全量 Grep 仅 GameFlags.ts:17 定义 + Game.ts:792 读取，0 写入）
- **culture 门控**：minCulture=2500（epochs.json 行 8）
- **入口处理**（Game.ts:789-915）：标准 15 步初始化 + STARDUST 独有 CG 回调

**STARDUST 入口特殊处理**（Game.ts:906-910）：
```ts
if (this.epoch === EpochType.STARDUST) {
  this.addFlag(FLAG.STARDUST_ERA_ACTIVE);
  this.earthCivi.culture += 300;
  this.addHistory("【星屑遗泽】步入最后的纪元，古老的火种在灰烬中复燃，文化产出大幅提升！");
}
```

**注意**：culture+300 在入口门控通过后执行，不能帮助玩家达到 2500 门槛。若 GALAXY 末 culture 不足 2500，设 EPOCH_STALLED 停滞，不推进。

### 1.3 上一纪元输出状态（GALAXY → STARDUST 接口复核，10 项）

| # | 复核项 | 上游状态 | 本纪元结论 |
|---|---|---|---|
| 1 | 纪元出口条件 | ⚠️ 条件性闭合 | **已复核**：culture≥2500 + stardust_era_declared（或 zero_homer_contacted）→ Game.ts:792 门控通过。stardust_era_declared 由 GALAXY year=420 事件写入；zero_homer_contacted 由 GALAXY year=400 事件写入。FLAG 闭合，culture≥2500 可能不足（UC-15 继承） |
| 2 | 状态传递（FLAG 累积） | ⚠️ 待复核 | **已复核**：galaxy_exodus_seen / zero_homer_contacted / mini_universe_built / stardust_era_declared / alien_alliance / alien_diplomacy_seen 等 FLAG 累积进入 STARDUST。galaxy_exodus_seen 被 HIDDEN/ETERNAL_EXILE 读取；zero_homer_contacted 被 HIDDEN 读取 + 互斥锁；mini_universe_built 被 HIDDEN 读取；alien_alliance 被 HIDDEN 读取；5 个死 FLAG（AR-35）仍无消费者 |
| 3 | 人物死亡 | ⚠️ 待复核 | **已复核**：epochDeathMap 中无任何人物含 "STARDUST"。GALAXY 存活 5 人（程心/云天明/智子/艾AA/关一帆）在 STARDUST 仍存活。罗辑/刘慈欣在 GALAXY 已死亡，STARDUST 中仍死亡（继承）。无新增死亡 |
| 4 | stardust_era_declared / zero_homer_contacted FLAG | ⚠️ 待复核 | **已复核**：stardust_era_declared 仅被入口门控读取；zero_homer_contacted 被 HIDDEN 结局读取 + 入口门控读取。STARDUST 内无事件读取这些 FLAG 作为 reqFlag/reqNotFlag |
| 5 | dimensionStrikeTriggered 字段 | ⚠️ 待复核 | **已复核**：AR-33 双系统独立持续。STARDUST year≥420>350，DEFEAT 条件 (year>350 || dimensionStrikeTriggered) 因 year>350 必然满足 → DEFEAT 兜底生效（除非有逃生科技/FLAG，AR-37 同类条件性风险） |
| 6 | swordholder 字段 | ⚠️ 待复核 | **已复核**：罗辑路线 swordholder 在 GALAXY 已被清除为 null。STARDUST 中 swordholder=null → deterrenceEnduranceRounds 不再累积（Game.ts:667 else 分支 reset 为 0）。AR-31 死累积问题在 STARDUST 自然消解（继承 GALAXY） |
| 7 | conquest_declared FLAG | ⚠️ 待复核 | **已复核**：CONQUEST 胜利 allowedEras=[BROADCAST,BUNKER,GALAXY,STARDUST]。若玩家在更早纪元触发 conquest_declared，进入 STARDUST 后 CONQUEST 胜利条件仍可竞争（需 isAllCiviConquered 满足）。但 ZERO_HOMER_CONTACTED 互斥锁一旦设置，CONQUEST 被 reqNotFlag 阻断 |
| 8 | culture 值 | ⚠️ 待复核 | **已复核**：STARDUST minCulture=2500, maxCulture=999999（无上限）。STARDUST 入口 CG 回调 culture+300（在门控通过后执行）。GALAXY 末 culture 可能不足 2500（UC-15 继承），+300 不能帮助达到门槛 |
| 9 | treachery 跨纪元 | ⚠️ 待复核 | **已复核**：DEFEAT_TREACHERY（treachery≥100）在 STARDUST 全程生效，无纪元门控。若 GALAXY 末 treachery 仍≥100（UC-16 继承），进入 STARDUST 后立即触发 DEFEAT_TREACHERY。STARDUST 无新增 treachery 事件 |
| 10 | STARDUST 入口特殊处理 | ⚠️ 待复核 | **已复核**：Game.ts:906-910 STARDUST 入口 CG 回调：addFlag(STARDUST_ERA_ACTIVE) + culture+=300 + addHistory("【星屑遗泽】")。STARDUST_ERA_ACTIVE 仅在此处写入，**全代码库无读取点**（死 FLAG，C-1）。culture+300 不影响门控（门控已通过）。CG 文案 epochCGMap[6]='event_stardust_era'（Game.ts:877） |

### 1.4 内部阶段

**STARDUST 纪元无内部阶段**——无剧情事件、无 filteredEvent、无随机事件。玩家进入 STARDUST 后，每回合仅执行标准回合逻辑（资源/人口/外交/事件检查），等待结局条件满足。

| 阶段 | 年份范围 | 关键事件 | 核心FLAG |
|---|---|---|---|
| （无） | year≥420（继承 GALAXY） | 无事件 | 无 |

**实际行为**：玩家进入 STARDUST 后：
1. 入口 CG 回调：culture+300 + STARDUST_ERA_ACTIVE FLAG
2. 每回合标准逻辑：资源/人口增长、异星文明威胁、事件检查（无事件可触发）
3. 每回合 checkVictoryConditions：检查 11 种结局
4. 结局触发后游戏结束

### 1.5 出口条件

**STARDUST 是最后一个纪元（epoch=6），无下游纪元推进出口**。

**结局退出路径**：11 种结局（见 1.7）

### 1.6 下一纪元输入状态

**无下一纪元**。STARDUST 是终局纪元，游戏在此纪元通过结局退出。

### 1.7 可能触发的结局

| 结局 | 类型 | allowedEras | STARDUST 可触发 | 关键条件 |
|---|---|---|---|---|
| HIDDEN（小宇宙） | 胜利 | [GALAXY, STARDUST] | ✅ | galaxy_exodus_seen + alien_alliance + zero_homer_contacted + mini_universe_built + 黑域生成 + 数字方舟 + culture≥1000 + year≥350 + pop>0 + deterrence≥50 |
| WANDERING（流浪） | 胜利 | [BUNKER, GALAXY, STARDUST] | ✅ | 行星发动机Ⅲ型 + 新家园选址 + wandering_completed + 互斥FLAG |
| DIGITAL（数字永生） | 胜利 | [BUNKER, GALAXY, STARDUST] | ✅ | 数字方舟 + digital_ark_upgrade + 互斥FLAG |
| CONQUEST（征服） | 胜利 | [BROADCAST, BUNKER, GALAXY, STARDUST] | ✅ | conquest_declared + isAllCiviConquered + 互斥FLAG |
| DARK_DOMAIN（黑域） | 胜利 | [BUNKER, GALAXY, STARDUST] | ✅ | 黑域生成 + dark_domain_decision + 互斥FLAG |
| NEUTRAL_ETERNAL_EXILE | 中性 | ≥GALAXY | ✅ | galaxy_exodus_seen + 0<pop≤5 + !wandering_completed + !digital_ark_upgrade |
| NEUTRAL_COSMIC_SILENCE | 中性 | ≥BUNKER | ✅ | dark_domain_decision/black_domain_decision + 0<pop≤10 + deterrence<20 |
| DEFEAT_TREACHERY | 失败 | - | ✅ | treachery≥100 |
| DEFEAT_EXTINCTION | 失败 | - | ✅ | population≤0 |
| DEFEAT_DIMENSION_STRIKE | 失败 | - | ✅ | (year>350 || dimensionStrikeTriggered) + 无逃生科技/FLAG |
| DEFEAT_HELIUM_FLASH | 失败 | - | ✅ | year>350 + 无逃生科技 + loreMode≠strict_three_body |

**互斥关键**：`ZERO_HOMER_CONTACTED` 一旦设置，除 HIDDEN 外其他 4 条胜利路径全部被锁死（reqNotFlag 互斥）。

**STARDUST 特殊风险**：
- STARDUST year≥420>350 → DEFEAT 兜底条件 `year>350` 必然满足
- 除非有逃生科技/FLAG（黑域生成/数字方舟/dimensional_defense/dimensional_defense_completed/wandering_completed）
- 走 HIDDEN 路线的玩家（需黑域生成+数字方舟）自然豁免 DEFEAT 兜底
- 走非 HIDDEN 路线的玩家若无逃生科技，会被 DEFEAT 兜底截断（AR-37 同类）

---

## 二、核心实体清单

### 2.1 事件清单

| 类型 | 数量 | 来源 | 说明 |
|---|---|---|---|
| 剧情事件（events.json, epoch=STARDUST） | **0** | - | STARDUST 纪元无剧情事件 |
| 硬编码过滤事件（filteredEvent, epoch=STARDUST） | **0** | - | STARDUST 纪元无 filteredEvent |
| 随机事件（randomevents.json, epoch 含 STARDUST） | **0** | - | randomevents.json 中无 STARDUST 纪元随机事件（所有随机事件 epoch 字段最多到 GALAXY） |

**关键发现**：STARDUST 纪元完全无事件。玩家进入后每回合 checkEvents / getFilteredEventsForTurn / checkRandomEvents 均返回空，仅靠结局判定驱动游戏结束。

### 2.2 人物清单

| 类别 | 人物 | 证据 |
|---|---|---|
| STARDUST 存活（5人） | 程心、云天明、智子、艾AA、关一帆 | epochDeathMap 为空数组 []（继承 GALAXY） |
| STARDUST 新增死亡 | **无** | epochDeathMap 中无任何人物含 "STARDUST" |
| STARDUST 继承死亡（33人） | 罗辑、刘慈欣、维德、伊文斯、林云、泰勒、雷迪亚兹、希恩斯、章北海、丁仪、庄颜、叶文洁、汪淼、大史、常伟思、东方延绪、杨冬、雷志成、杨卫宁、山杉惠子、伊依、霍金、沈渊、水娃、严井、白冰、苗福全、华华、滑膛、朱汉扬 + 其他 | epochDeathMap 死亡数组不含 "STARDUST" 但含 "GALAXY" 或更早纪元 |

**关键发现**：STARDUST 纪元无新增死亡。所有人物在 GALAXY 及更早纪元的死亡状态被继承。

### 2.3 FLAG 清单

| FLAG | 值 | 写入点 | 读取点 | 状态 |
|---|---|---|---|---|
| STARDUST_ERA_DECLARED | stardust_era_declared | events.json:1649（GALAXY year=420） | Game.ts:792（入口门控） | 活（仅门控读取） |
| STARDUST_ERA_SEEN | stardust_era_seen | **无写入点** | Game.ts:792（入口门控） | **死FLAG**（无写入，OR 关系不影响入口） |
| STARDUST_ERA_ACTIVE | stardust_era_active | Game.ts:907（入口 CG 回调） | **无读取点** | **死FLAG**（仅写入无读取） |
| 继承 FLAG | - | - | - | galaxy_exodus_seen / zero_homer_contacted / mini_universe_built / alien_alliance 等被结局条件读取 |

### 2.4 科技清单

STARDUST 纪元无独有科技需求。所有结局科技条件继承自更早纪元：

| 科技 | 树 | 前置链 | 关联结局 |
|---|---|---|---|
| 黑域生成 | INTERSTELLAR | 宇宙社会学→安全声明理论→黑域生成 | DARK_DOMAIN / HIDDEN / DEFEAT 豁免 |
| 数字方舟 | INFORMATION | 数字文明→数字生命研究→意识上传→数字方舟 | DIGITAL / HIDDEN / DEFEAT 豁免 |
| 新家园选址 | INTERSTELLAR | 流浪地球计划→新家园选址 | WANDERING |
| 行星发动机Ⅲ型 | AEROSPACE | 核聚变推进→重元素聚变→行星发动机Ⅰ型→Ⅱ型→Ⅲ型 | WANDERING |

### 2.5 Tag 清单

| Tag | id | 行号 | 类别 | milestone |
|---|---|---|---|---|
| 星屑纪元特征 | stardust_era_deep | TagManager.ts:78 | epoch | true（不衰减） |

### 2.6 资源包

| 资源包 | key | 行号 | 说明 |
|---|---|---|---|
| 星屑纪元资源包 | stardust_era | Game.ts:816 / AssetLoader.ts:128 | 入口时 downloadEraPack('stardust_era') |

---

## 三、初步因果链草图

```
[GALAXY 末] culture≥2500 + stardust_era_declared（或 zero_homer_contacted）
  → Game.ts:792 门控通过 ✅
  → 推进 STARDUST
  → Game.ts:702-706 无新增死亡（epochDeathMap 无 STARDUST）
  → Game.ts:816 下载 stardust_era 资源包
  → Game.ts:849 设置 stardust_era_deep Tag（milestone=true 不衰减）
  → Game.ts:877 CG 文案"大宇宙的结构在战争中进一步降维碎裂..."
  → Game.ts:906-910 入口 CG 回调：
    - addFlag(STARDUST_ERA_ACTIVE)（死FLAG，无读取）
    - culture += 300
    - addHistory("【星屑遗泽】")
  → 每回合标准逻辑：
    - 资源/人口增长
    - 异星文明威胁
    - checkEvents / getFilteredEventsForTurn / checkRandomEvents → 均返回空（无事件）
    - checkVictoryConditions → 检查 11 种结局
  → 结局触发 → 游戏结束 ✅（终局纪元，无下游推进）
```

**分支**：
- HIDDEN 胜利：galaxy_exodus_seen + alien_alliance + zero_homer_contacted + mini_universe_built + 黑域生成 + 数字方舟 + culture≥1000 + year≥350 + pop>0 + deterrence≥50
- WANDERING 胜利：行星发动机Ⅲ型 + 新家园选址 + wandering_completed + 互斥FLAG
- DIGITAL 胜利：数字方舟 + digital_ark_upgrade + 互斥FLAG
- CONQUEST 胜利：conquest_declared + isAllCiviConquered + 互斥FLAG
- DARK_DOMAIN 胜利：黑域生成 + dark_domain_decision + 互斥FLAG
- ETERNAL_EXILE 中性：galaxy_exodus_seen + 0<pop≤5 + !wandering_completed + !digital_ark_upgrade
- COSMIC_SILENCE 中性：dark_domain_decision/black_domain_decision + 0<pop≤10 + deterrence<20
- DEFEAT 兜底：year>350 + 无逃生科技/FLAG → DEFEAT_DIMENSION_STRIKE/HELIUM_FLASH

---

## 四、核心状态读写链

### 4.1 状态字段读写

| 字段 | 写位置（STARDUST 内） | 读位置 |
|---|---|---|
| epoch | Game.ts:779（推进时） | Game.ts:667,704,792,931,1183 等；结局判定 allowedEras |
| year | Game.ts:730（每回合+1） | DEFEAT year>350；HIDDEN year≥350 |
| culture | Game.ts:908（入口 CG +300） | HIDDEN culture≥1000 |
| population | 事件 effects（无 STARDUST 事件） | ETERNAL_EXILE pop≤5; EXTINCTION pop≤0; HIDDEN pop>0 |
| treachery | 事件 effects（无 STARDUST 事件） | DEFEAT_TREACHERY treachery≥100 |
| deterrenceValue | 事件 effects（无 STARDUST 事件） | HIDDEN deterrence≥50; COSMIC_SILENCE deterrence<20 |
| swordholder | 无（GALAXY 已清除为 null） | Game.ts:667（deterrenceEnduranceRounds 累积条件，swordholder=null → else 分支 reset 为 0） |
| dimensionStrikeTriggered | AlienCivilization.ts:333（异星 AI 降维打击） | Game.ts:1281（DEFEAT） |

### 4.2 FLAG 写读链

见 2.3 FLAG 清单。

---

## 五、待取证问题（候选问题）

| 候选 ID | 问题现象 | 涉及对象 | 当前证据 | 尚缺证据 | 可能影响 |
|---|---|---|---|---|---|
| C-1 | STARDUST_ERA_ACTIVE 是死 FLAG（仅入口 CG 回调写入，全代码库无读取点） | Game.ts:907 / GameFlags.ts:18 | 全量 Grep 确认仅 1 写入 0 读取 | 无 | 可维护性（AR-29/AR-35 同类） |
| C-2 | STARDUST_ERA_SEEN 无写入点（仅入口门控读取，OR 关系不影响入口） | Game.ts:792 / GameFlags.ts:17 | 全量 Grep 确认 0 写入 1 读取 | 无 | 可维护性（死 FLAG 但不影响功能） |
| C-3 | timeline.json 无"星屑"条目（Game.ts:831 查找 `t.epoch.includes("星屑")` 失败） | Game.ts:831 / timeline.json | timeline.json 仅有"银河纪元 / 黑域纪元"合并条目 | 无 | STARDUST 纪元无 timeline 描述显示（UI 缺失） |
| C-4 | STARDUST 纪元无任何事件（剧情/过滤/随机全无） | events.json / GameEventManager.ts / randomevents.json | 全量 Grep 确认 0 条事件 | 无 | 玩家进入后无内容，仅靠结局判定驱动（设计观察） |
| C-5 | STARDUST 纪元 DEFEAT 兜底持续生效（year≥420>350，若无逃生科技会立即 DEFEAT） | Game.ts:1281-1286 | year≥420>350 → DEFEAT 条件满足 | 无 | 与 AR-37 同类条件性风险 |
| C-6 | STARDUST 入口 culture+300 在门控之后执行（不能帮助玩家达到 2500 门槛） | Game.ts:906-910 vs Game.ts:792 | culture+300 在入口 CG 回调中，门控已通过 | 无 | UC-15 继承：若 GALAXY 末 culture 不足 2500，+300 无助于入口 |
| C-7 | STARDUST 纪元无新增死亡（epochDeathMap 无 STARDUST） | GameEventManager.ts:937-991 | 全量检查所有人物死亡数组不含 "STARDUST" | 无 | 设计观察（终局纪元无人物死亡） |

---

## 六、当前未确认范围

| 编号 | 范围 | 说明 | 待核验方式 |
|---|---|---|---|
| U-S1 | UC-15 继承：culture 是否足够达到 2500 | GALAXY 末 culture 可能不足 2500，STARDUST 入口 CG +300 在门控后执行 | Autoplay500 运行观察 |
| U-S2 | UC-16 继承：treachery 跨纪元累积是否在 STARDUST 触发 DEFEAT_TREACHERY | 依赖 UC-14/UC-16（GALAXY 末 treachery 值） | Autoplay500 运行观察 |
| U-S3 | STARDUST 纪元是否真的无任何事件触发 | 需确认 checkEvents/getFilteredEventsForTurn/checkRandomEvents 在 STARDUST 是否返回空 | 运行时验证 |

---

## 七、跨纪元问题持续追踪

| 编号 | 问题 | GALAXY 状态 | STARDUST 状态 |
|---|---|---|---|
| AR-5 | FLAG 永久累积 | GALAXY 写入 11 个 FLAG（5 死） | STARDUST 新增 1 个 FLAG（STARDUST_ERA_ACTIVE，死）+ 1 个无写入（STARDUST_ERA_SEEN），累积持续增长 |
| AR-7 | Flag 引用漂移 | 无新增漂移 | 无新增漂移 |
| UC-1 | treachery 爆发 | GALAXY 无新增 treachery 事件，UC-16 风险持续 | STARDUST 无新增 treachery 事件，DEFEAT_TREACHERY 全程生效 |
| UC-2 | 顺序风险 | GALAXY 事件 year 顺序正确 | STARDUST 无事件，无顺序风险 |
| AR-20 | bunker_world_completed 循环依赖 | 继承断裂 | 继承断裂（STARDUST 入口依赖 GALAXY 入口可达） |
| AR-31 | deterrenceEnduranceRounds 死累积 | GALAXY 自然消解（罗辑死亡清空 swordholder） | STARDUST 继承消解（swordholder=null） |
| AR-33 | dimensionStrikeTriggered 双系统 | GALAXY 中 DEFEAT 因 year>350 触发 | STARDUST 中 DEFEAT 因 year>350 触发（year≥420） |
| AR-37 | dimensional_strike 旁路 DEFEAT 竞态 | GALAXY 条件性风险 | STARDUST 条件性风险持续（year≥420>350） |
| AR-40 | filteredEvent 跳过人物存活检查 | 系统性缺陷 | STARDUST 无 filteredEvent，不受影响 |

---

**EPOCH_AUDIT_MODEL_星屑纪元 建立完成。未输出正式缺陷结论，未修改代码。**

**候选问题**：7 项（C-1~C-7）
**未确认范围**：3 项（U-S1~U-S3）
**接口复核**：10 项全部完成（含 2 项新发现：C-1 STARDUST_ERA_ACTIVE 死 FLAG + C-3 timeline.json 无"星屑"条目）
**纪元特征**：终局纪元，无事件、无新增死亡、无下游纪元，仅靠结局判定驱动
