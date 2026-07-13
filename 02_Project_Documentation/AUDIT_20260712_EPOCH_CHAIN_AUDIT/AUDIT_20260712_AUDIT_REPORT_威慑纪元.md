# `AUDIT_REPORT_威慑纪元`

> 纪元：威慑纪元（DETERRENCE, epoch=2）
> 阶段：正式审计报告
> 证据截止：20260712
> 引用文档：EPOCH_AUDIT_MODEL_威慑纪元、EPOCH_EVIDENCE_威慑纪元、EPOCH_CAUSAL_VALIDATION_威慑纪元、AUDIT_20260712_BASELINE、AUDIT_20260712_AUDIT_REPORT_危机纪元
> 约束：未修改代码，未输出可直接执行的修复方案

---

## 第一部分：完成门禁检查

| 门禁项 | 状态 | 说明 |
|---|---|---|
| 1. 所有事件已进入清单 | ✅ 满足 | 剧情事件 8 条（epoch=DETERRENCE）+ 3 条跨纪元边界事件 + 2 个 filteredEvent + 1 个主题相关 filteredEvent + 34 个 randomevent 全部入清单，effects 已逐一展开 |
| 2. 所有关键人物已有状态轨迹 | ✅ 满足 | 12 人死亡名单（修正上游：庄颜/维德存活、东方延绪遗漏）+ 4~6 人存活可用（罗辑/希恩斯/庄颜/维德 + 条件 程心/艾AA）均有完整轨迹 |
| 3. 所有读取状态都有合法生产者 | ⚠️ 部分满足 | deterrence_established / coordinates_broadcasted / deterrence_broken / deterrence_held_strong 等均有合法生产者；**earthCivi.swordholder 字段的生产者仅 CRISIS filteredEvent（CQ-4 路径分裂）** |
| 4. 所有关键写入都有消费者或明确终止意义 | ⚠️ 部分满足 | 9 个活 FLAG 有消费者；**7 个死 FLAG 无消费者**（swordholder_handover / deterrence_era_declared / tech_exchange_started / chengxin_swordholder / deterrence_reinforced / lightspeed_rejected / dark_battle） |
| 5. 所有关键数值都有来源、范围和消费位置 | ✅ 满足 | culture / treachery / deterrenceValue / population / prestige / deterrenceEnduranceRounds 6 个数值字段均有公式、阈值、消费位置 |
| 6. 所有 Tag/Flag 生命周期已追踪 | ✅ 满足 | 16 个 FLAG（9 活 + 7 死）+ 4 个 Tag（deterrence_era / deterrence_steady / deterrence_unstable / victory_deterrence）全量读写链已追踪 |
| 7. 所有科技条件存在合法路径 | ✅ 满足 | 黑暗森林威慑（MILITARY 根）/ 曲率驱动理论（PHYSICS, 前置维度物理）/ 核聚变推进（AEROSPACE 根）均有合法前置链 |
| 8. 所有纪元出口已验证 | ✅ 满足 | → BROADCAST（culture≥500 + coordinates_broadcasted，罗辑路线闭合）/ → DEFEAT_TREACHERY（treachery≥100）/ → DEFEAT_EXTINCTION（population≤0）/ → DETERRENCE 胜利（罗辑路线） |
| 9. 所有可能结局已检查竞争关系 | ✅ 满足 | DETERRENCE 胜利（allowedEras 限制）+ DEFEAT_TREACHERY（优先级 4）+ DEFEAT_EXTINCTION（优先级 5）；TREACHERY 优先于 EXTINCTION；broadcastTriggered 短路优先 |
| 10. 正常路径和反例路径均已检查 | ✅ 满足 | 20 项反例全部验证（5 项成立含 2 项 P1，4 项部分成立，11 项不成立） |
| 11. 存档边界已检查 | ✅ 满足 | deterrenceEnduranceRounds / swordholder / deterrenceValue / treachery / broadcastTriggered / isGameOver / flags Set 均持久化；flagManager 排除但 restorePrototypes 重建 |
| 12. 未确认项已明确列出 | ✅ 满足 | 2 项未确认项已列出（U-6 CRISIS 典型 treachery 累积值 / U-9 culture 增长速率） |
| 13. 相邻纪元接口已登记待复核 | ✅ 满足 | BROADCAST 入口接口已登记（见报告末尾） |

**门禁结论**：13 项中 11 项满足、2 项部分满足。部分满足项因"7 个死 FLAG 无消费者"和"swordholder 字段路径分裂"导致，不影响正式问题清单的成立。**允许进入正式问题清单阶段**。

---

## 第二部分：正式问题清单

> 仅证据闭合的问题进入本清单。证据未完全闭合的风险项列入"未确认问题"。

---

### AR-10

```text
问题 ID：AR-10
等级：P1
问题类型：主线卡死 / 循环依赖
涉及纪元：威慑纪元（DETERRENCE）— 程心路线
现象：程心路线 year=230 引力波广播事件 epoch=BROADCAST，但玩家在 DETERRENCE 纪元（culture<500）时无法触发该事件，导致 coordinates_broadcasted 永不写入，玩家永久卡死在 DETERRENCE 纪元
前置条件：year=219 选择"任命程心为第二任执剑人"
完整因果链：
  1. year=219 选项A → swordholder_chengxin / unlock 程心+艾AA
  2. year=220 威慑中止（reqFlag=swordholder_chengxin）→ deterrence_broken
  3. year=225 澳大利亚大移民（reqFlag=deterrence_broken）→ australia_migration
  4. year=230 引力波广播 BROADCAST 版（events.json:966, epoch=BROADCAST, reqFlag=australia_migration）
  5. checkEvents → checkFilterConditions → isEpochMatch("BROADCAST", "DETERRENCE") → false
  6. year=230 BROADCAST 版事件无法触发
  7. coordinates_broadcasted 无法写入
  8. updateEpoch 门控（Game.ts:773）检查 COORDINATES_BROADCASTED → 未设置 → allowed=false
  9. 玩家永久卡死在 DETERRENCE 纪元
预期行为：程心路线应能通过 year=230 事件写入 coordinates_broadcasted，推进到 BROADCAST 纪元
实际行为：year=230 BROADCAST 版事件 epoch 字段为 BROADCAST，在 DETERRENCE 纪元无法触发，形成循环依赖
代码证据：
  - events.json:966 triggerCondition.epoch="BROADCAST"（程心路线 year=230 事件）
  - GameEventManager.ts:778 isEpochMatch 检查 epoch 匹配
  - Game.ts:773 updateEpoch 门控 COORDINATES_BROADCASTED
  - events.json:999 DETERRENCE 版 year=230 事件（罗辑路线，epoch=DETERRENCE，正常触发）
设计证据：timeline.json gameYearRange=[201,260] 表明 DETERRENCE 纪元 year 上限 260，程心路线需在 DETERRENCE 纪元内完成坐标广播
测试证据：无测试覆盖"程心路线 coordinates_broadcasted 触发路径"
影响范围：
  - 程心路线永久卡死在 DETERRENCE 纪元（无结局退出，除非 treachery/population 达失败阈值）
  - 玩家选择程心后无法正常推进游戏
是否稳定可复现：是（每次选择程心路线必现）
尚缺证据：无
建议修复方向：将 events.json:966 程心路线 year=230 事件的 epoch 改为 "DETERRENCE"（或 "DETERRENCE,BROADCAST"），使其在 DETERRENCE 纪元可触发
建议回归测试：验证程心路线 year=230 事件在 DETERRENCE 纪元可触发；coordinates_broadcasted 可写入；可推进到 BROADCAST
```

---

### AR-11

```text
问题 ID：AR-11
等级：P1
问题类型：主线胜利不可达 / 状态字段路径分裂
涉及纪元：威慑纪元（DETERRENCE）— 罗辑路线
现象：DETERRENCE 胜利判定检查 earthCivi.swordholder 字段（!== null），但该字段仅由 CRISIS 纪元 filteredEvent deterrence_establishment 写入，events.json year=202 路径不写入。若玩家通过 year=202 事件路径进入 DETERRENCE（未触发 filteredEvent），swordholder=null → DETERRENCE 胜利永久不可达
前置条件：CRISIS 纪元未触发 filteredEvent deterrence_establishment（如未研究"黑暗森林威慑"科技或 minDeterrence<50）
完整因果链：
  1. CRISIS 纪元 filteredEvent deterrence_establishment 条件：minYear:50 + reqTech:黑暗森林威慑 + minDeterrence:50
  2. 若玩家未满足上述条件，filteredEvent 不触发
  3. swordholder_appointed FLAG 未设置
  4. earthCivi.swordholder 字段未写入（保持 null）
  5. year=202 事件写入 deterrence_established（不写 swordholder 字段）
  6. culture≥200 + deterrence_established → 推进到 DETERRENCE
  7. DETERRENCE 胜利条件（Game.ts:1014）检查 swordholder !== null → false
  8. deterrenceEnduranceRounds 累积条件（Game.ts:651）检查 swordholder !== null → 不累积
  9. DETERRENCE 胜利永久不可达
预期行为：DETERRENCE 胜利应不依赖于 CRISIS 纪元 filteredEvent 的触发
实际行为：swordholder 字段与 deterrence_established FLAG 的双轨写入导致路径分裂
代码证据：
  - Game.ts:433-443 filteredEvent effects 处理写入 earthCivi.swordholder="罗辑"
  - GameEventManager.ts:350 filteredEvent deterrence_establishment 选项"任命罗辑"写入 swordholder_appointed
  - events.json:748 year=202 事件写入 deterrence_established（不写 swordholder 字段）
  - Game.ts:1014 DETERRENCE 胜利检查 `this.earthCivi.swordholder !== null`
  - Game.ts:651 deterrenceEnduranceRounds 累积检查 `this.earthCivi.swordholder !== null`
设计证据：DETERRENCE 胜利 allowedEras=[DETERRENCE]，设计意图为 DETERRENCE 纪元内达成
测试证据：Game.victoryConditions.test.ts 测试 DETERRENCE 胜利条件，但假设 swordholder 字段已设置
影响范围：
  - 未触发 CRISIS filteredEvent 的玩家无法达成 DETERRENCE 胜利
  - deterrenceEnduranceRounds 无法累积
  - 玩家只能通过失败结局或推进 BROADCAST 退出
是否稳定可复现：是（条件性，未触发 filteredEvent 时必现）
尚缺证据：CRISIS filteredEvent deterrence_establishment 的实际触发率（需运行时统计）
建议修复方向：在 events.json year=202 事件中增加 earthCivi.swordholder 字段写入，或在 DETERRENCE 胜利条件中改为检查 FLAG.SWORDHOLDER_APPOINTED
建议回归测试：验证未触发 filteredEvent 时 DETERRENCE 胜利可达；验证 swordholder 字段在 year=202 事件后非 null
```

---

### AR-12

```text
问题 ID：AR-12
等级：P1
问题类型：路线必败 / 数值失衡
涉及纪元：威慑纪元（DETERRENCE）— 程心路线
现象：程心路线 treachery 累计 +95（year=219 +10 / year=220 +40 / year=225 +25 / year=230 +20），叠加 CRISIS 累积值极易触达 100 阈值导致 DEFEAT_TREACHERY。即使 treachery 未达 100，程心路线也会因 AR-10 循环依赖永久卡死
前置条件：year=219 选择"任命程心"
完整因果链：
  1. CRISIS 纪元 treachery 累积（典型：year=201 +20, year=202 -20 = 净 0）
  2. year=219 选项A → treachery+10
  3. year=220 威慑中止 → treachery+40
  4. year=225 澳大利亚大移民 → treachery+25
  5. year=230 引力波广播（BROADCAST 版，因 AR-10 无法触发）→ treachery+20 无法执行
  6. 程心路线 treachery 实际累计：CRISIS累积 + 10 + 40 + 25 = CRISIS累积 + 75
  7. 若 CRISIS 累积≥25 → treachery≥100 → DEFEAT_TREACHERY
  8. 若 CRISIS 累积<25 → treachery<100 → 因 AR-10 永久卡死
预期行为：程心路线应能通过某种方式正常推进（胜利或失败结局）
实际行为：程心路线要么触发 DEFEAT_TREACHERY（若 treachery≥100），要么永久卡死（若 treachery<100）
代码证据：
  - events.json:851 year=219 选项A treachery+10
  - events.json:882 year=220 treachery+40
  - events.json:945 year=225 treachery+25
  - events.json:968 year=230 BROADCAST 版 treachery+20（因 AR-10 无法触发）
  - Game.ts:1219 treachery≥100 → DEFEAT_TREACHERY
设计证据：timeline.json 描述"威慑失败"，暗示程心路线应为失败路线，但应通过 DEFEAT 结局退出而非卡死
测试证据：无测试覆盖"程心路线 treachery 累积场景"
影响范围：
  - 程心路线无法正常推进
  - 玩家选择程心后体验极差（卡死或立即失败）
是否稳定可复现：是（每次选择程心路线必现）
尚缺证据：CRISIS 典型 treachery 累积值（U-6 未确认）
建议修复方向：修复 AR-10 后，程心路线可通过 year=230 事件推进到 BROADCAST；或调整 treachery 数值使程心路线有合理失败窗口
建议回归测试：验证程心路线可正常推进到 BROADCAST 或合理触发 DEFEAT_TREACHERY
```

---

### AR-13

```text
问题 ID：AR-13
等级：P2
问题类型：条件事件异常 / 时序倒置
涉及纪元：威慑纪元（DETERRENCE）
现象：year=201 威慑纪元宣告事件 reqFlag=deterrence_established，但该 FLAG 在 year=202 才写入，导致 year=201 事件延迟到 year=203+ 触发
前置条件：正常进入 DETERRENCE 纪元
完整因果链：
  1. year=202 事件写入 deterrence_established
  2. year=201 事件 reqFlag=deterrence_established
  3. year=201 时 reqFlag 未设置 → 事件跳过
  4. year=202 事件触发，写入 deterrence_established
  5. year=203+ 时 checkEvents 重新检查 year=201 事件 → currentYear(203) >= minYear(201) + reqFlag 满足 → 触发
预期行为：year=201 事件应在 year=201 触发
实际行为：year=201 事件延迟到 year=203+ 触发，叙事时序错乱
代码证据：
  - events.json:700 year=201 事件 reqFlag=deterrence_established
  - events.json:748 year=202 事件写入 deterrence_established
  - GameEventManager.ts:917 currentYear >= e.inYear 只有下界无上界
设计证据：与上游 AR-2 同类问题
测试证据：无
影响范围：叙事时序错乱（威慑纪元宣告在威慑建立之后）
是否稳定可复现：是
尚缺证据：无
建议修复方向：将 year=201 事件的 reqFlag 改为无依赖，或将 deterrence_established 写入提前到 year≤201
建议回归测试：验证 year=201 事件在 year=201 触发
```

---

### AR-14

```text
问题 ID：AR-14
等级：P2
问题类型：Tag/Flag 异常 / 命名不一致
涉及纪元：威慑纪元（DETERRENCE）
现象：randomevents.json chengxin_swordholder_trial 事件写入 chengxin_swordholder FLAG，与 events.json year=219 写入的 swordholder_chengxin 命名相反，两者互不通用
前置条件：触发 chengxin_swordholder_trial 随机事件
完整因果链：
  1. randomevents.json:6038 chengxin_swordholder_trial 选项"支持程心接任"写入 chengxin_swordholder
  2. events.json:851 year=219 选项A 写入 swordholder_chengxin
  3. events.json:889 year=220 reqFlag=swordholder_chengxin
  4. randomevent 写入的 chengxin_swordholder 永远不会被 year=220 事件读取
预期行为：两处 FLAG 命名应一致
实际行为：命名相反，randomevent 写入的 FLAG 是死 FLAG
代码证据：
  - randomevents.json:6038 `target: "chengxin_swordholder"`
  - events.json:851 `target: "swordholder_chengxin"`
  - events.json:889 reqFlag=swordholder_chengxin
设计证据：无
测试证据：无
影响范围：randomevent 写入的 FLAG 无效果；维护成本增加
是否稳定可复现：是
尚缺证据：无
建议修复方向：统一命名（建议改为 swordholder_chengxin，与 events.json 主线一致）
建议回归测试：验证 randomevent 写入的 FLAG 可被 events.json 读取
```

---

### AR-15

```text
问题 ID：AR-15
等级：P2
问题类型：Tag/Flag 异常 / 死 FLAG 群
涉及纪元：威慑纪元（DETERRENCE）
现象：DETERRENCE 纪元期间 7 个 FLAG 被写入但无任何消费者，是死 FLAG
前置条件：无
完整因果链：
  1. swordholder_handover：events.json:848,857 写入（year=219 两选项均写），0 读取
  2. deterrence_era_declared：events.json:689 写入（year=201），0 读取（上游 AR-4）
  3. tech_exchange_started：events.json:790 写入（year=205），0 读取
  4. chengxin_swordholder：randomevents.json:6038 写入，0 读取（AR-14）
  5. deterrence_reinforced：GameEventManager.ts:489 写入，0 读取
  6. lightspeed_rejected：GameEventManager.ts:504 写入，0 读取
  7. dark_battle：events.json:715 写入（CRISIS year=201），0 读取（别名 dark_battle_concluded 也未使用）
预期行为：写入的 FLAG 应有至少一个消费者
实际行为：7 个 FLAG 无消费者，是死 FLAG
代码证据：
  - 全量 Grep 验证每个 FLAG 仅 1 处匹配（写入点）
设计证据：无
测试证据：无
影响范围：无直接影响；但增加维护成本，可能暗示遗漏的功能点
是否稳定可复现：是
尚缺证据：无
建议修复方向：移除死 FLAG 写入，或补充消费者
建议回归测试：验证死 FLAG 被移除或有完整读写链
```

---

### AR-16

```text
问题 ID：AR-16
等级：P3
问题类型：可维护性 / 数据冗余
涉及纪元：威慑纪元（DETERRENCE，影响全局）
现象：events.json 和 filteredEvents 中 flag 类型效果的 value 字段被完全忽略，value=0 和 value=1 行为完全一致
前置条件：无
完整因果链：
  1. EventSystem.ts:134-136 处理 type="flag" 效果：`this.game.addFlag(eff.target)`
  2. addFlag（Game.ts:193-196）只接收 flag 参数，不读 value
  3. flagManager.set(flag) 是布尔语义（set/unset）
  4. events.json/filteredEvents 中大量 `{ type: "flag", target: "...", value: 0/1 }` 的 value 是死代码
预期行为：value 字段应有意义，或不应存在
实际行为：value 字段被完全忽略
代码证据：
  - EventSystem.ts:134-136 `this.game.addFlag(eff.target)`（不读 eff.value）
  - Game.ts:193-196 `addFlag(flag)` 无 value 参数
设计证据：无
测试证据：无
影响范围：无功能影响；数据冗余增加维护成本
是否稳定可复现：是
尚缺证据：无
建议修复方向：移除 flag 效果的 value 字段，或在 addFlag 中支持布尔语义（value=0 表示 unset）
建议回归测试：验证 flag 效果行为不变
```

---

### AR-17

```text
问题 ID：AR-17
等级：P3
问题类型：可维护性 / 预留未启用
涉及纪元：威慑纪元（DETERRENCE）
现象：deterrence_unstable Tag 在 TagManager.ts 中定义，但代码中无任何 applyWorldTag('deterrence_unstable', ...) 调用点
前置条件：无
完整因果链：
  1. TagManager.ts:66 定义 deterrence_unstable Tag
  2. 全量 Grep 零调用点
  3. 该 Tag 永远不会被施加
预期行为：定义的 Tag 应有施加逻辑
实际行为：deterrence_unstable 预留未启用
代码证据：
  - TagManager.ts:66 定义
  - 全量 Grep 零调用
设计证据：无
测试证据：无
影响范围：无直接影响；可能暗示遗漏的威慑不稳机制
是否稳定可复现：是
尚缺证据：无
建议修复方向：补充 deterrenceValue<阈值时施加 deterrence_unstable Tag 的逻辑，或移除定义
建议回归测试：验证 deterrence_unstable Tag 有完整生命周期
```

---

### AR-18

```text
问题 ID：AR-18
等级：P3
问题类型：可维护性 / 人物不可用
涉及纪元：威慑纪元（DETERRENCE，影响全局）
现象：刘慈欣人物在 epochDeathMap 中存活至 GALAXY，但 events.json 中无 unlock_person 解锁，永远不可用
前置条件：无
完整因果链：
  1. epochDeathMap: `"刘慈欣": ["GALAXY"]`（存活至 GALAXY 纪元）
  2. persons.json 包含刘慈欣数据
  3. 全量搜索 events.json/randomevents.json/filteredEvents 无 unlock_person 目标为"刘慈欣"
  4. 刘慈欣永远不可解锁
预期行为：persons.json 中的人物应有解锁路径
实际行为：刘慈欣永远不可用
代码证据：
  - GameEventManager.ts:960 epochDeathMap 刘慈欣存活至 GALAXY
  - persons.json 包含刘慈欣
  - 全量搜索无 unlock_person
设计证据：注释"刘慈欣宇宙联动人物"
测试证据：无
影响范围：无直接影响；数据冗余
是否稳定可复现：是
尚缺证据：无
建议修复方向：补充 unlock_person 事件，或移除 persons.json 中的刘慈欣数据
建议回归测试：验证刘慈欣有解锁路径或被移除
```

---

### AR-19

```text
问题 ID：AR-19
等级：P3
问题类型：可维护性 / 语义冗余
涉及纪元：威慑纪元（DETERRENCE）
现象：filteredEvent deterrence_strain(minYear:70) 和 lightspeed_project(minYear:90) 的 minYear 是绝对游戏年份，但 DETERRENCE 纪元 year≥201，minYear=70/90 远小于 201，在 DETERRENCE 纪元时已冗余满足
前置条件：进入 DETERRENCE 纪元
完整因果链：
  1. GameEventManager.ts:776 `if (cond.minYear !== undefined && game.year < cond.minYear) return false;`
  2. DETERRENCE 纪元 year≥201
  3. minYear=70/90 在 year≥201 时已满足（201>90>70）
  4. minYear 约束冗余，实际约束由 reqFlag/reqTech/minDeterrence 提供
预期行为：minYear 应反映设计意图（纪元内偏移或绝对年份）
实际行为：minYear 语义为绝对年份，但值远小于纪元起始 year，导致冗余
代码证据：
  - GameEventManager.ts:481 deterrence_strain minYear:70
  - GameEventManager.ts:495 lightspeed_project minYear:90
  - GameEventManager.ts:776 `game.year < cond.minYear` 使用绝对年份
设计证据：minYear=70/90 可能原设计为"纪元内偏移"（即进入 DETERRENCE 后第 70/90 年）
测试证据：无
影响范围：无功能影响；语义不一致增加维护成本
是否稳定可复现：是
尚缺证据：无
建议修复方向：调整 minYear 为合理值（如 270/290 表示 DETERRENCE 内偏移），或在注释中说明语义
建议回归测试：验证 filteredEvent 触发时点符合设计意图
```

---

## 第三部分：未确认问题

> 以下问题证据未完全闭合，不进入正式问题清单，待进一步验证。

| 编号 | 来源 | 问题描述 | 尚缺证据 |
|---|---|---|---|
| UC-7 | U-6 | CRISIS 纪元典型 treachery 累积值，用于评估程心路线 treachery 是否必然达 100 | Autoplay500 运行观察 CRISIS 纪元末 treachery 典型值 |
| UC-8 | U-9 | DETERRENCE 纪元 culture 增长速率，用于评估罗辑路线胜利窗口是否充足 | 数值公式核验（每回合 culture 自动增长公式） |
| UC-9 | CV-12 | 罗辑路线 year=230 后 culture 是否可能立即达 500 推进 BROADCAST，关闭胜利窗口 | 运行时验证 year=230 时 culture 典型值 |

---

## 第四部分：报告结论

### 1. 本纪元是否形成完整因果链

**罗辑路线形成完整因果链，程心路线存在 2 处断裂**。

正常路径（罗辑路线）因果链完整闭合：
```
year=202 威慑建立（CRISIS）→ deterrence_established
→ culture≥200 + deterrence_established → 推进 DETERRENCE
→ year=205/210 威慑稳固期
→ year=219 选项B 罗辑连任 → swordholder_luoji_retained
→ year=220 威慑持续 → deterrence_held_strong
→ year=230 引力波广播（DETERRENCE 版）→ coordinates_broadcasted
→ deterrenceValue≥90 + endurance≥20 → DETERRENCE 胜利
```

断裂点 1（AR-10）：程心路线 year=230 BROADCAST 版事件循环依赖，coordinates_broadcasted 无法写入，永久卡死。

断裂点 2（AR-11）：罗辑路线 swordholder 字段路径分裂，若 CRISIS filteredEvent 未触发，DETERRENCE 胜利不可达。

### 2. 哪些路径已确认正常

- 纪元入口：culture≥200 + deterrence_established（year=202 写入）→ Game.ts:772 门控 ✅
- 罗辑路线出口：year=230 DETERRENCE 版事件写入 coordinates_broadcasted → culture≥500 → BROADCAST ✅
- 罗辑路线胜利：deterrenceValue 累计 +100（初始+30+20+50）→ ≥90 + endurance≥20 ✅
- 事件互斥：year=220 两事件通过 reqFlag 互斥（swordholder_chengxin vs swordholder_luoji_retained）✅
- 人物死亡：进入 DETERRENCE 时 12 人死亡（修正名单）✅
- 科技前置链：addProgress 严格检查 parentName ✅
- 事件去重：hasTriggered 持久化 ✅
- 存档持久化：deterrenceEnduranceRounds / swordholder / deterrenceValue / treachery / flags Set 均持久化 ✅
- FLAG 累积无阻断：CRISIS FLAG 进入 DETERRENCE 后无 reqNotFlag 读取（AR-5 在 DETERRENCE 无影响）✅
- FlagManager 引用漂移：restorePrototypes 已增加引用一致性检查（AR-7 已部分修复）✅

### 3. 哪些问题已确认

| 问题 ID | 等级 | 问题 |
|---|---|---|
| AR-10 | P1 | 程心路线 year=230 循环依赖，永久卡死 |
| AR-11 | P1 | swordholder 字段路径分裂，DETERRENCE 胜利不可达 |
| AR-12 | P1 | 程心路线 treachery+75 必败（叠加 AR-10 卡死） |
| AR-13 | P2 | year=201 事件时序倒置 |
| AR-14 | P2 | chengxin_swordholder 与 swordholder_chengxin 命名不一致 |
| AR-15 | P2 | 7 个死 FLAG 群 |
| AR-16 | P3 | flag value 字段被完全忽略 |
| AR-17 | P3 | deterrence_unstable Tag 未启用 |
| AR-18 | P3 | 刘慈欣人物永远不可用 |
| AR-19 | P3 | filteredEvent minYear 语义冗余 |

共 10 项正式问题：3 项 P1，3 项 P2，4 项 P3。

### 4. 哪些问题仍未确认

| 编号 | 问题 | 尚缺证据 |
|---|---|---|
| UC-7 | CRISIS 典型 treachery 累积值 | Autoplay500 运行观察 |
| UC-8 | DETERRENCE culture 增长速率 | 数值公式核验 |
| UC-9 | 罗辑路线 year=230 后胜利窗口 | 运行时验证 culture 典型值 |

### 5. 是否允许进入下一纪元审计

**允许**，但附带条件：

- **AR-10（程心路线循环依赖）是 DETERRENCE 纪元最严重的断裂点**，建议在进入下一纪元审计前优先确认修复方向，因为该问题导致程心路线完全不可玩
- **AR-11（swordholder 字段路径分裂）影响 DETERRENCE 胜利可达性**，建议确认 CRISIS filteredEvent 的实际触发率
- **AR-12（程心路线必败）是 AR-10 的衍生问题**，修复 AR-10 后需重新评估
- UC-7/UC-8/UC-9 应在下一纪元审计中持续观察

### 6. 上游接口复核结论

| 复核项 | 上游状态 | 本纪元结论 |
|---|---|---|
| 1. 纪元出口条件 | ✅ 已验证 | 确认正常：culture≥200 + deterrence_established |
| 2. 状态传递（FLAG 累积） | ⚠️ 待复核 | 确认累积但无影响：DETERRENCE 事件无 reqNotFlag 读取 CRISIS FLAG |
| 3. 人物死亡 | ⚠️ 待复核 | **修正上游名单**：庄颜/维德在 DETERRENCE 存活；东方延绪遗漏（实际 12 人死亡名单已修正） |
| 4. year=201 事件触发顺序 | ⚠️ 待复核 | 确认时序倒置（AR-13）：year=201 DETERRENCE 版事件延迟到 year=203+ 触发 |
| 5. deterrence_era_declared | ⚠️ 待复核 | 确认死 FLAG（AR-15，上游 AR-4） |
| 6. treachery 跨纪元 | ⚠️ 待复核 | 确认高风险（AR-12）：程心路线 +75，叠加 CRISIS 累积极易触达 100 |

### 7. 相邻纪元仍需复核的接口

**下游接口：DETERRENCE → BROADCAST**

| 复核项 | 当前状态 | 待验证内容 |
|---|---|---|
| 纪元出口条件 | ✅ 已验证 | culture≥500 + coordinates_broadcasted（罗辑路线 year=230 DETERRENCE 版写入） |
| 状态传递 | ⚠️ 待复核 | deterrence_broken / australia_migration / deterrence_held_strong / swordholder_chengxin / swordholder_luoji_retained 等 FLAG 累积进入 BROADCAST，需复核哪些 FLAG 影响 BROADCAST 事件 |
| 人物死亡 | ⚠️ 待复核 | 进入 BROADCAST 后庄颜/希恩斯死亡（epochDeathMap 含 BROADCAST），需复核死亡时机是否与 BROADCAST 事件冲突 |
| year=230 事件 | ⚠️ 待复核 | 两个 year=230 事件分属 DETERRENCE（罗辑路线）和 BROADCAST（程心路线），程心路线因 AR-10 无法触发，需复核修复后 BROADCAST 纪元的事件链 |
| coordinates_broadcasted | ✅ 已验证 | 罗辑路线写入点 events.json:999（DETERRENCE 版），BROADCAST 门控 Game.ts:773 |
| treachery 跨纪元 | ⚠️ 待复核 | 程心路线 treachery+75 累积进入 BROADCAST（若修复 AR-10 后可推进），可能立即触发 DEFEAT_TREACHERY |
| swordholder 字段 | ⚠️ 待复核 | 罗辑路线 swordholder="罗辑"进入 BROADCAST；程心路线 swordholder 仍为"罗辑"（AR-11 路径分裂），需复核 BROADCAST 是否依赖此字段 |

---

**AUDIT_REPORT_威慑纪元 报告完成。未修改代码。**

**问题统计**：P1×3，P2×3，P3×4，未确认×3
**因果链状态**：罗辑路线闭合，程心路线未闭合（2 处断裂：AR-10 循环依赖 + AR-12 必败）
**上游接口**：6 项全部复核（含 1 项名单修正）
**下一纪元审计**：允许进入，附带 7 项接口复核
