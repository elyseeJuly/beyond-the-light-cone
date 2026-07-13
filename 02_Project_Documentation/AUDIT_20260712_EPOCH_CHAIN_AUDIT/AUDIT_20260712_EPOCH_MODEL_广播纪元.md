# `EPOCH_AUDIT_MODEL_广播纪元`

> 纪元：广播纪元（BROADCAST, epoch=3）
> 阶段：纪元审计模型建立（未输出正式缺陷结论，未修改代码）
> 证据截止：20260712
> 基线引用：AUDIT_20260712_BASELINE.md
> 上游引用：AUDIT_20260712_AUDIT_REPORT_威慑纪元.md（末尾 7 项 DETERRENCE→BROADCAST 接口复核项）

---

## 一、纪元状态卡

### 1.1 基础信息

| 属性 | 值 | 证据状态 |
|---|---|---|
| 纪元索引 | 3 | CONFIRMED（epochs.json） |
| 纪元名称 | 广播纪元 / BROADCAST | CONFIRMED |
| 文化阈值 | minCulture=500, maxCulture=799 | CONFIRMED（epochs.json） |
| 入口门控 FLAG | COORDINATES_BROADCASTED | CONFIRMED（Game.ts:773） |
| timeline.json gameYearRange | [261,300] | CONFIRMED（timeline.json） |
| events.json 实际年份范围 | year 230~261（BROADCAST epoch 事件） | CONFIRMED（events.json:955-1136） |
| timeline vs events 年份冲突 | BC-2 已登记：timeline 标注 [261,300] 但 events.json BROADCAST 事件最早在 year=230 | 已知冲突 |

### 1.2 入口条件

| 条件 | 代码位置 | 证据状态 |
|---|---|---|
| culture ≥ 500 | Game.ts:764 `epochsData.find(e => culture >= e.minCulture && culture <= e.maxCulture)` | CONFIRMED |
| FLAG.COORDINATES_BROADCASTED 已设置 | Game.ts:773 `if (matched.epoch === EpochType.BROADCAST && !this.flagManager.isSet(FLAG.COORDINATES_BROADCASTED)) allowed = false` | CONFIRMED |
| 防回退：仅 epoch > 2 时推进 | Game.ts:770 `if (matched.epoch > this.epoch)` | CONFIRMED |

**coordinates_broadcasted 写入点（2 处，分属罗辑/程心路线）：**
1. events.json:998 — year=230 DETERRENCE 版（罗辑路线，reqFlag=deterrence_held_strong）→ 正常触发 ✅
2. events.json:967 — year=230 BROADCAST 版（程心路线，reqFlag=australia_migration）→ 因 AR-10 永久不可达 ❌

### 1.3 上一纪元输出状态（DETERRENCE → BROADCAST 接口复核）

**7 项接口复核结论（来自威慑纪元报告末尾）：**

| 复核项 | 上游状态 | 本纪元结论 |
|---|---|---|
| 1. 纪元出口条件 | ✅ 已验证 | 确认正常：culture≥500 + coordinates_broadcasted（罗辑路线 year=230 DETERRENCE 版写入） |
| 2. 状态传递（FLAG 累积） | ⚠️ 待复核 | **已复核**：coordinates_broadcasted 被 year=235/261 事件读取 ✅；deterrence_held_strong / swordholder_chengxin / swordholder_luoji_retained 进入 BROADCAST 后无读取者（死 FLAG）；swordholder_appointed 被 CONQUEST 胜利条件读取（`!SWORDHOLDER_APPOINTED` 阻断征服胜利） |
| 3. 人物死亡 | ⚠️ 待复核 | **已复核**：希恩斯/庄颜在 BROADCAST 死亡（epochDeathMap 含 BROADCAST）。庄颜仍在 inner_conflict_resolution filteredEvent 中作为 speaker 出现（叙事不一致） |
| 4. year=230 事件 | ⚠️ 待复核 | **已复核**：两版 year=230 事件分属 DETERRENCE（罗辑路线）/ BROADCAST（程心路线）。程心路线版不仅因 AR-10 不可达，且存在二阶循环依赖：事件 epoch=BROADCAST 但写入 coordinates_broadcasted（BROADCAST 入口门控 FLAG） |
| 5. coordinates_broadcasted | ✅ 已验证 | 罗辑路线写入点 events.json:998（DETERRENCE 版），BROADCAST 门控 Game.ts:773 |
| 6. treachery 跨纪元 | ⚠️ 待复核 | **已复核**：罗辑路线 BROADCAST treachery 净 +10（year=235 +15, year=240 -5），远低于程心路线 DETERRENCE +75。若 CRISIS+DETERRENCE 累积已高，BROADCAST 可能触达 100 |
| 7. swordholder 字段 | ⚠️ 待复核 | **已复核**：罗辑路线进入 BROADCAST 时 swordholder="罗辑"。deterrenceEnduranceRounds 持续累积（Game.ts:651），但 DETERRENCE 胜利仅限 DETERRENCE 纪元（allowedEras=[DETERRENCE]），BROADCAST 中为死累积 |

### 1.4 内部阶段

| 阶段 | 年份范围 | 关键事件 | 证据状态 |
|---|---|---|---|
| 坐标广播期 | year 230~234 | year=230 引力波广播（DETERRENCE 版，罗辑路线）→ coordinates_broadcasted | CONFIRMED |
| 三体毁灭期 | year 235~239 | year=235 三体星系毁灭 → trisolaris_destroyed | CONFIRMED |
| 舰队逃离期 | year 240~259 | year=240 三体第二舰队逃离 → trisolaris_fleet_escaped | CONFIRMED |
| 童话破译期 | year 260 | year=260 云天明童话 → unlock 云天明/智子/关一帆 | CONFIRMED |
| 纪元宣告期 | year 261+ | year=261 广播纪元宣告 → broadcast_era_declared（死 FLAG） | CONFIRMED |

**filteredEvent 内部阶段（BROADCAST epoch）：**
| filteredEvent ID | minYear | reqFlag | 关键效果 | 证据状态 |
|---|---|---|---|---|
| broadcast_era_dawn | 120 | reqNotFlag: broadcast_dawn_seen | broadcast_dawn_seen + military+10/economy-40 或 escape_tech_focus | CONFIRMED |
| bunker_project_debate | 150 | reqFlag: broadcast_dawn_seen | bunker_project_active 或 dual_strategy | CONFIRMED |
| inner_conflict_resolution | 160 | minCulture:40 | treachery-15 或 treachery-5/culture+25 | CONFIRMED |
| conquest_declaration_event | 200 | reqNotFlag: conquest_declared, minMilitary:30, minDeterrence:60 | conquest_declared + prestige+80/treachery+15 | CONFIRMED |

### 1.5 出口条件

| 出口路径 | 条件 | 代码位置 | 证据状态 |
|---|---|---|---|
| → BUNKER（正常推进） | culture≥800 + BUNKER_WORLD_COMPLETED | Game.ts:774 | **断裂**：bunker_world_completed 仅由 year=280 事件（epoch=BUNKER）写入，BROADCAST 纪元无法触发 |
| → DEFEAT_TREACHERY | treachery≥100 | Game.ts:1219 | CONFIRMED |
| → DEFEAT_EXTINCTION | population≤0 | Game.ts | CONFIRMED |
| → CONQUEST 胜利 | treachery<50 + isAllCiviConquered + CONQUEST_DECLARED + !SWORDHOLDER_APPOINTED 等 | Game.ts:1037-1056 | CONFIRMED（条件性，需 !SWORDHOLDER_APPOINTED） |
| → broadcastTriggered 结局 | UI 按钮触发（WallfacerPanel.ts:171） | Game.ts:1096-1146 | CONFIRMED（HIDDEN 胜利或 EXTINCTION 失败） |

### 1.6 下一纪元输入状态

| 传递状态 | 值 | 证据状态 |
|---|---|---|
| epoch | BROADCAST（3） | CONFIRMED |
| year | 不变（延续 DETERRENCE 末值） | CONFIRMED |
| earthCivi.culture | 不变（500~799 范围） | CONFIRMED |
| earthCivi.swordholder | "罗辑"（罗辑路线）或 null（程心路线，但因 AR-10 不可达） | CONFIRMED |
| FLAG 累积 | 所有 CRISIS+DETERRENCE+BROADCAST FLAG 永久保留 | CONFIRMED（AR-5 持续追踪） |

### 1.7 可能触发的结局

| 结局 | 类型 | allowedEras 含 BROADCAST | 关键条件 | 证据状态 |
|---|---|---|---|---|
| CONQUEST | 胜利 | ✅ | treachery<50 + isAllCiviConquered + CONQUEST_DECLARED + !SWORDHOLDER_APPOINTED | CONFIRMED |
| DEFEAT_TREACHERY | 失败 | ✅（全局） | treachery≥100 | CONFIRMED |
| DEFEAT_EXTINCTION | 失败 | ✅（全局） | population≤0 | CONFIRMED |
| HIDDEN（broadcastTriggered 路径） | 胜利 | ✅（broadcastSurvives=true） | 黑域生成/数字方舟/新家园选址/galaxy_exodus_seen/wandering_completed 任一完成 | CONFIRMED |
| EXTINCTION（broadcastTriggered 路径） | 失败 | ✅（broadcastSurvives=false） | 上述科技均未完成 | CONFIRMED |

---

## 二、核心实体清单

### 2.1 剧情事件（events.json，epoch=BROADCAST）

| year | 事件 | reqFlag | 关键效果 | 证据状态 |
|---|---|---|---|---|
| 230 | 引力波广播（BROADCAST 版·程心路线） | australia_migration | coordinates_broadcasted + prestige+30 + treachery+20 | CONFIRMED（因 AR-10 + 二阶循环依赖，永久不可达） |
| 230 | 引力波广播（DETERRENCE 版·罗辑路线） | deterrence_held_strong | coordinates_broadcasted + prestige+30 + deterrenceValue+50 | CONFIRMED（在 DETERRENCE 纪元触发，非 BROADCAST 内事件） |
| 235 | 三体星系毁灭 | coordinates_broadcasted | trisolaris_destroyed + prestige-20 + treachery+15 + culture+10 | CONFIRMED |
| 240 | 三体第二舰队逃离 | trisolaris_destroyed | trisolaris_fleet_escaped + prestige+10 + treachery-5 | CONFIRMED |
| 260 | 云天明童话 | 无 | unlock 云天明/智子/关一帆 | CONFIRMED |
| 261 | 广播纪元宣告 | coordinates_broadcasted | broadcast_era_declared + culture+40 | CONFIRMED |

### 2.2 过滤事件（filteredEvents，epoch=BROADCAST）

| ID | minYear | reqFlag/reqNotFlag | 关键效果 | 证据状态 |
|---|---|---|---|---|
| broadcast_era_dawn | 120 | reqNotFlag: broadcast_dawn_seen | broadcast_dawn_seen + military+10/economy-40 或 escape_tech_focus | CONFIRMED |
| bunker_project_debate | 150 | reqFlag: broadcast_dawn_seen | bunker_project_active 或 dual_strategy | CONFIRMED |
| inner_conflict_resolution | 160 | minCulture:40 | treachery-15 或 treachery-5/culture+25 | CONFIRMED |
| conquest_declaration_event | 200 | reqNotFlag: conquest_declared, minMilitary:30, minDeterrence:60 | conquest_declared + prestige+80/military+10/treachery+15 | CONFIRMED |

### 2.3 随机事件（randomevents.json，epoch=BROADCAST）

| ID | probability | 关键效果 | 证据状态 |
|---|---|---|---|
| tianming_fairy_tale_decode | 0.05 | tianming_fairy_tales + culture+5 | CONFIRMED |
| chengxin_staircase_probe | 0.04 | staircase_data + culture+7 | CONFIRMED |

### 2.4 人物状态

**BROADCAST 纪元死亡人物（epochDeathMap 含 "BROADCAST"）：**
| 人物 | 死亡纪元列表 | 说明 |
|---|---|---|
| 希恩斯 | BROADCAST, BUNKER, GALAXY | 进入 BROADCAST 时死亡 |
| 庄颜 | BROADCAST, BUNKER, GALAXY | 进入 BROADCAST 时死亡 |

**BROADCAST 纪元存活人物（主要）：**
| 人物 | 存活至 | 说明 |
|---|---|---|
| 罗辑 | GALAXY | 执剑人，swordholder 字段保持 |
| 维德 | BUNKER | 在 BROADCAST 仍存活 |
| 程心 | 永久存活 | |
| 艾AA | 永久存活 | |
| 云天明 | 永久存活 | year=260 解锁 |
| 智子 | 永久存活 | year=260 解锁 |
| 关一帆 | 永久存活 | year=260 解锁 |

### 2.5 FLAG 生命周期

**BROADCAST 纪元期间写入的 FLAG：**
| FLAG | 写入点 | 读取点 | 状态 |
|---|---|---|---|
| coordinates_broadcasted | events.json:998（DETERRENCE 版 year=230） | year=235/261 reqFlag, Game.ts:773 门控 | 活 FLAG ✅ |
| trisolaris_destroyed | events.json:1029（year=235） | year=240 reqFlag | 活 FLAG ✅ |
| trisolaris_fleet_escaped | events.json:1065（year=240） | 无 | 死 FLAG ❌ |
| broadcast_era_declared | events.json:1124（year=261） | 无 | 死 FLAG ❌ |
| broadcast_dawn_seen | filteredEvent broadcast_era_dawn | filteredEvent bunker_project_debate reqFlag | 活 FLAG ✅ |
| escape_tech_focus | filteredEvent broadcast_era_dawn | 无 | 死 FLAG ❌ |
| bunker_project_active | filteredEvent bunker_project_debate | 无 | 死 FLAG ❌ |
| dual_strategy | filteredEvent bunker_project_debate | 无 | 死 FLAG ❌ |
| conquest_declared | filteredEvent conquest_declaration_event + Game.ts:1092 | CONQUEST 胜利条件, WANDERING/DIGITAL/DETERRENCE 互斥 | 活 FLAG ✅ |
| tianming_fairy_tales | randomevent tianming_fairy_tale_decode | 无 | 死 FLAG ❌ |
| staircase_data | randomevent chengxin_staircase_probe | 无 | 死 FLAG ❌ |

### 2.6 Tag 系统

| Tag | 施加点 | 移除点 | 证据状态 |
|---|---|---|---|
| broadcast_era | Game.ts:830（纪元入口 epochTagMap[3]） | Game.ts:843（下一纪元入口循环移除） | CONFIRMED |

---

## 三、初步因果链草图

### 3.1 罗辑路线（正常路径）

```
year=230 引力波广播（DETERRENCE 版）→ coordinates_broadcasted
→ culture≥500 + coordinates_broadcasted → 推进 BROADCAST
→ year=235 三体星系毁灭 → trisolaris_destroyed
→ year=240 三体第二舰队逃离 → trisolaris_fleet_escaped（死 FLAG）
→ year=260 云天明童话 → unlock 云天明/智子/关一帆
→ year=261 广播纪元宣告 → broadcast_era_declared（死 FLAG）
→ culture≥800 → 尝试推进 BUNKER
→ BUNKER_WORLD_COMPLETED 未设置 → EPOCH_STALLED → 永久卡死 ❌
```

**断裂点**：bunker_world_completed 仅由 year=280 事件（epoch=BUNKER）写入，BROADCAST 纪元无法触发。

### 3.2 退出路径

| 路径 | 可达性 | 条件 |
|---|---|---|
| broadcastTriggered → HIDDEN 胜利 | ✅ 可达 | WallfacerPanel 按钮触发 + 黑域生成/数字方舟/新家园选址/galaxy_exodus_seen/wandering_completed 任一完成 |
| broadcastTriggered → EXTINCTION 失败 | ✅ 可达 | WallfacerPanel 按钮触发 + 上述科技均未完成 |
| CONQUEST 胜利 | ✅ 条件性可达 | treachery<50 + isAllCiviConquered + CONQUEST_DECLARED + !SWORDHOLDER_APPOINTED |
| DEFEAT_TREACHERY | ✅ 可达 | treachery≥100 |
| DEFEAT_EXTINCTION | ✅ 可达 | population≤0 |
| → BUNKER（正常推进） | ❌ 不可达 | bunker_world_completed 无法写入（AR-20 循环依赖） |

---

## 四、核心状态读写链

### 4.1 culture

| 操作 | 位置 | 说明 |
|---|---|---|
| 自动增长 | EarthCivilization.ts:249 `this.culture += this.processCulture(game)` | 每回合增长 |
| 增长公式 | EarthCivilization.ts:538-558 | `floor((cultureWorkers + leaderBonus) * weight / 15) + deptBase`，deptBase=2+floor(leader.social*0.10)，weight=2~5（思想钢印等级），上限 100 |
| 事件增减 | EventSystem.ts:127 `case 'culture': this.game.earthCivi.culture += val` | year=235 +10, year=261 +40 |
| 读取 | Game.ts:760 `const culture = this.earthCivi?.culture` | 纪元推进判定 |

### 4.2 treachery

| 操作 | 位置 | 说明 |
|---|---|---|
| 事件增减 | EventSystem.ts:127 | year=235 +15, year=240 -5, filteredEvent inner_conflict -15/-5, conquest +15 |
| 失败判定 | Game.ts:1219 `if (this.earthCivi.treachery >= 100)` | DEFEAT_TREACHERY |
| CONQUEST 阻断 | Game.ts:1044 `this.earthCivi.treachery < 50` | 征服胜利要求 |

### 4.3 broadcastTriggered / broadcastSurvives

| 操作 | 位置 | 说明 |
|---|---|---|
| 写入 | WallfacerPanel.ts:171-172 `game.broadcastTriggered = true; game.broadcastSurvives = survives` | UI 按钮触发 |
| 读取 | Game.ts:1096 `if (this.broadcastTriggered)` | 短路优先于其他胜利/失败判定 |
| 持久化 | SaveManager.ts:116 `if (data.broadcastTriggered === undefined) data.broadcastTriggered = false` | v1→v4 迁移补默认值 |
| 存档排除 | GameSerializer.ts:39 排除列表不含 broadcastTriggered | 持久化保留 ✅ |

### 4.4 swordholder

| 操作 | 位置 | 说明 |
|---|---|---|
| 进入 BROADCAST 时值 | "罗辑"（罗辑路线，AR-11 路径分裂） | 维持 DETERRENCE 末值 |
| deterrenceEnduranceRounds 累积 | Game.ts:651 `if (this.epoch >= EpochType.DETERRENCE && this.earthCivi.swordholder !== null)` | BROADCAST 中持续累积（死累积，DETERRENCE 胜利仅限 DETERRENCE 纪元） |
| 死亡清除 | Game.ts:710-711 `if (this.earthCivi.swordholder === p.name) this.earthCivi.swordholder = null` | 罗辑在 GALAXY 死亡，BROADCAST 中不清除 |

---

## 五、待取证问题

### 候选问题 CQ-1：bunker_world_completed 循环依赖（主线卡死）

- **现象**：year=280 掩体世界落成事件 epoch="BROADCAST" 但写入 bunker_world_completed（BUNKER 入口门控 FLAG），BROADCAST 纪元无法触发
- **涉及对象**：events.json:1140-1172, Game.ts:774
- **当前证据**：bunker_world_completed 全库唯一写入点为 events.json:1150（epoch=BUNKER）；FLAG_ALIAS_MAP 中 bunker_cities_ready 别名从未被写入
- **尚缺证据**：无（证据闭合）
- **可能影响**：BROADCAST→BUNKER 正常推进永久不可达，玩家只能通过结局退出
- **下一步验证**：反例审计确认

### 候选问题 CQ-2：死 FLAG 群（7 个）

- **现象**：BROADCAST 纪元期间 7 个 FLAG 被写入但无消费者
- **涉及对象**：trisolaris_fleet_escaped / broadcast_era_declared / escape_tech_focus / bunker_project_active / dual_strategy / tianming_fairy_tales / staircase_data
- **当前证据**：全量 Grep 验证每个 FLAG 仅写入点，无读取
- **尚缺证据**：无
- **可能影响**：无直接影响；增加维护成本
- **下一步验证**：正式问题清单

### 候选问题 CQ-3：庄颜死后仍作为 speaker 出现

- **现象**：inner_conflict_resolution filteredEvent（epoch=BROADCAST）中庄颜作为 speaker，但 epochDeathMap 标注庄颜在 BROADCAST 死亡
- **涉及对象**：GameEventManager.ts:598, GameEventManager.ts:956
- **当前证据**：epochDeathMap 庄颜含 BROADCAST；filteredEvent dialogQueue 含庄颜
- **尚缺证据**：无
- **可能影响**：叙事不一致（死亡人物发言）
- **下一步验证**：正式问题清单

### 候选问题 CQ-4：filteredEvent minYear 语义冗余

- **现象**：4 个 BROADCAST filteredEvent 的 minYear（120/150/160/200）远低于 BROADCAST 起始 year（≥230），约束冗余
- **涉及对象**：GameEventManager.ts:515,529,600,659
- **当前证据**：BROADCAST 纪元 year≥230（最早 year=230 事件写入 coordinates_broadcasted 后 culture 达 500 推进）
- **尚缺证据**：BROADCAST 典型进入 year 值
- **可能影响**：无功能影响；语义不一致
- **下一步验证**：未确认项

### 候选问题 CQ-5：year=230 BROADCAST 版二阶循环依赖

- **现象**：year=230 BROADCAST 版事件 epoch=BROADCAST 且写入 coordinates_broadcasted（BROADCAST 入口门控 FLAG），即使修复 AR-10 将 epoch 改为 BROADCAST 仍是循环依赖
- **涉及对象**：events.json:980-984
- **当前证据**：事件 triggerCondition.epoch=BROADCAST + effects 写入 coordinates_broadcasted + Game.ts:773 门控
- **尚缺证据**：无
- **可能影响**：程心路线即使修复 AR-10 仍不可达（需改为 DETERRENCE 纪元触发）
- **下一步验证**：正式问题清单

### 候选问题 CQ-6：swordholder / deterrenceEnduranceRounds 死累积

- **现象**：BROADCAST 中 swordholder="罗辑"导致 deterrenceEnduranceRounds 持续累积，但 DETERRENCE 胜利仅限 DETERRENCE 纪元
- **涉及对象**：Game.ts:651, Game.ts:1013
- **当前证据**：allowedEras=[DETERRENCE] + 累积条件 epoch>=DETERRENCE
- **尚缺证据**：无
- **可能影响**：无功能影响；数值冗余
- **下一步验证**：未确认项或正式问题

---

## 六、当前未确认范围

| 编号 | 范围 | 说明 | 待核验方式 |
|---|---|---|---|
| U-B1 | BROADCAST 典型进入 year 值 | culture 从 500 增长到 800 所需回合数 | 数值公式核验 |
| U-B2 | CRISIS+DETERRENCE 典型 treachery 累积值 | 评估 BROADCAST treachery+10 是否触达 100 | Autoplay500 运行观察 |
| U-B3 | CONQUEST 胜利在 BROADCAST 的实际可达性 | isAllCiviConquered 条件是否可在 BROADCAST 满足 | 运行时验证 |
| U-B4 | broadcastTriggered 按钮在 BROADCAST 的可用性 | WallfacerPanel 是否在 BROADCAST 渲染 | UI 层验证 |

---

**EPOCH_AUDIT_MODEL_广播纪元 建立完成。未输出正式缺陷结论，未修改代码。**
