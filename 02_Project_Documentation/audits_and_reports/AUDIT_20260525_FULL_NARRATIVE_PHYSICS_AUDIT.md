# LegendOfUni 全量叙事·物理·体感深度审计报告
> **版本号**: Web 重构版 (03_Web_Rebuild)  
> **基于**: 全系统代码审查 + 140条随机事件逐条核验 + 星系物理模型分析  
> **生成日期**: 2026-05-25  
> **审计角色**: Auditor（仅输出问题与优化方案，不直接修改代码）  

---

## 📊 审计总览

| 维度 | 状态 | 发现问题数 |
| :--- | :--- | :--- |
| TypeScript 编译 | ✅ 通过 | 0 |
| Vitest 单元测试 (246) | ✅ 全部通过 | 0 |
| 人物-纪元时间线冲突 | ❌ 存在严重穿帮 | **14处** |
| 叙事内容与原著割裂 | ⚠️ 存在中度问题 | **8处** |
| 数值平衡极端溢出 | ⚠️ 存在风险 | **60+处** |
| 银河纪元事件真空 | ❌ 严重缺失 | **0条专属事件** |
| 星系物理模型 | ⚠️ 存在简化问题 | **5处** |
| 刘慈欣宇宙拓展 | ⚠️ 覆盖不足 | 仅4条，缺乏银河纪元内容 |

---

## 一、人物-纪元时间线冲突（14处）

以下事件中的对话角色出现在其**尚未解锁或已死亡**的纪元，与《三体》原著严重矛盾。

> [!WARNING]
> `isEventCharactersUnlocked()` 仅检查 `personManager.availablePersons`，但随机事件中大量使用"安全官 维德""战略顾问 罗辑"等**变体称谓**，这些称谓不在核心角色列表中，因此**完全绕过了拦截机制**。

| 事件ID | 事件标题 | 问题角色 | 事件纪元 | 角色存活纪元 | 问题性质 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `tech_vacuum_decay_incident` | 真空衰变泡 | **安全官 维德** | CRISIS | DETERRENCE+ | 维德危机纪元未解锁 |
| `dark_forest_probe_transit` | 水滴造访 | **安全顾问 维德** | CRISIS | DETERRENCE+ | 同上 |
| `revolt_water_sabotage_zone_5` | 第五区水源投毒 | **维德** | CRISIS | DETERRENCE+ | 同上 |
| `revolt_data_center_sabotage` | 核心数据库入侵 | **维德** | CRISIS | DETERRENCE+ | 同上 |
| `revolt_prison_break_eto` | ETO骨干越狱 | **维德** | CRISIS | DETERRENCE+ | 同上 |
| `yewenjie_redemption` | 叶文洁的交待 | **维德** | CRISIS | DETERRENCE+ | 同上 |
| `chengxin_ladder_project` | 阶梯计划 | **程心、云天明** | CRISIS | DETERRENCE+/BROADCAST+ | 程心/云天明均未解锁 |
| `beihai_fleet_defection` | 自然选择号逃离 | **章北海** | DETERRENCE | CRISIS only | 章北海在危机纪元活跃，威慑纪元时已冬眠/逃离 |
| `lin_yun_quantum_suicide` | 林云的执着 | **林云** | DETERRENCE | CRISIS only | 林云在球状闪电事件后已牺牲 |
| `tyler_quantum_ghost_fleet` | 泰勒的遗产 | **泰勒** | WANDERING | CRISIS only | 泰勒已在危机纪元自杀身亡 |
| `liucixin_poetry_cloud_art` | 李白诗云工程 | **伊文斯** | DETERRENCE,BROADCAST | CRISIS only | 伊文斯在古筝行动中已被击杀 |
| `liucixin_cryogenic_art` | 海洋冰雕星环 | **艾AA** | CRISIS,DETERRENCE,BROADCAST | DETERRENCE+ | 艾AA在危机纪元尚未出生 |
| `random_wallfacer_proposal` | 面壁者提案 | **艾伦·艾德文** | CRISIS | — | 此人名不存在于原著，且使用了艾AA头像 |

### 优化方案

1. **扩展 `isEventCharactersUnlocked()` 的匹配范围**：在 [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts) 中，将 `coreStoryPersons` 扩展为包含所有**变体称谓**的映射表（如 `"安全官 维德" → "维德"`、`"战略顾问 罗辑" → "罗辑"`），使用 `includes()` 子字符串匹配而非精确匹配。
2. **逐条修正上述14条事件的纪元或对话角色**：
   - 维德相关的5条CRISIS事件：将 `speakerName` 替换为危机纪元已存在的角色（如常伟思、史强）。
   - `chengxin_ladder_project`：纪元改为 `DETERRENCE`（阶梯计划在威慑纪元前夕实施）。
   - `beihai_fleet_defection`：纪元改为 `CRISIS`（章北海在危机纪元末期驾船逃离）。
   - `lin_yun_quantum_suicide`：纪元改为 `CRISIS`。
   - `tyler_quantum_ghost_fleet`：保留WANDERING但标记为"历史档案回放"类事件，对话改为遗言录像格式。
   - `liucixin_poetry_cloud_art`：将伊文斯替换为其他角色。
   - `liucixin_cryogenic_art`：移除CRISIS纪元标记。
   - `random_wallfacer_proposal`：修正角色名或删除该事件。

---

## 二、叙事内容与原著割裂问题（8处）

### 2.1 ETO在晚期纪元不应存在

多条WANDERING纪元事件仍然提及ETO活动（如 `revolt_eto_engine_sabotage`），但ETO在危机纪元中期已被彻底清剿。

**优化方案**：将晚期ETO事件改写为"新降临派残余"或"历史模仿犯"等设定，或将纪元锁定为 `CRISIS`。

### 2.2 "流浪地球计划"与三体世界观的混淆

`events.json` 第300回合的固定事件提到"流浪地球计划"，但在三体原著中，太阳系毁灭的原因是**二向箔降维打击**而非太阳氦闪。流浪地球属于刘慈欣另一部独立作品。

**优化方案**：在 `loreMode === 'strict_three_body'` 模式下，将该事件改为"光速飞船逃逸计划"或"黑域安全声明计划"，仅在 `liu_cixin_mixed` 模式下保留流浪地球设定。

### 2.3 丁仪在威慑纪元后不应出场

丁仪在末日战役中（危机纪元末期）随"自然选择号"舰队被水滴摧毁而牺牲。但多条后期事件仍以丁仪为科学顾问。

**优化方案**：将威慑纪元及之后的丁仪对话替换为"首席物理学家"等通用NPC。

### 2.4 `random_wallfacer_proposal` 事件角色虚构

"艾伦·艾德文"不是三体原著角色，且使用了艾AA的头像。这是一个明显的数据错误。

**优化方案**：将角色改为PDC高层或实际面壁者之一。

### 2.5 事件标题存在错别字

`tech_terraforming_bacteria_escape` 标题为"【生态灾**灾**难：改造菌株泄露】"，"灾"字重复。

**优化方案**：修正为"【生态灾难：改造菌株泄露】"。

### 2.6 部分事件语气不符合三体世界的严肃基调

如 `aa_pleasure_city_scandal`（太空娱乐城涉黄赌毒）等事件过于戏谑，与《三体》宇宙的严肃硬科幻基调不匹配。

**优化方案**：改写为更符合末日氛围的"资源滥用与社会瓦解"叙事。

### 2.7 云天明童话解密事件时序问题

`tianming_fairy_tale_decode` 标记为 WANDERING，但云天明的三个童话在广播纪元初期就已传递。

**优化方案**：纪元改为 `BROADCAST`。

### 2.8 关一帆四维碎块事件时序问题

`guan_yifan_4d_encounter` 和 `guan_yifan_dimensional_fold` 标记为 WANDERING，但关一帆在广播纪元才正式登场。

**优化方案**：纪元改为 `BROADCAST,BUNKER,GALAXY`，并确认其在 `isEventCharactersUnlocked` 中受锁。

---

## 三、银河纪元事件真空（严重缺失）

> [!CAUTION]
> **银河纪元（Year 351+）没有任何专属随机事件。** 玩家进入银河纪元后将陷入"叙事荒漠"——没有任何新的随机抉择事件可以触发，游戏体验极度空洞。

目前事件分布：CRISIS 53条、DETERRENCE 35条、WANDERING 42条、BROADCAST 4条、BUNKER 2条、**GALAXY 0条**。

### 优化方案：新增银河纪元专属事件池

建议新增 **8-12条** 银河纪元专属事件，结合刘慈欣宇宙观拓展：

1. **归零者的讯息**：收到宇宙终极文明"归零者"的量子广播，要求所有小宇宙归还质量。涉及终极抉择。
2. **二维化边界逼近**：太阳系残留的二向箔降维波前正在追赶逃逸舰队。
3. **新星系殖民困境**：抵达比邻星/半人马座α后的资源竞争与生态适应。
4. **光速飞船燃料危机**：曲率驱动航行中的能量衰竭。
5. **小宇宙入口发现**：发现云天明留下的小宇宙坐标。
6. **时间膨胀回归**：黑域中的时间膨胀效应导致舰队内部年龄差异。
7. **暗物质海文明遭遇**：在星际航行中遭遇暗物质生态圈中的未知生命形态（参考《球状闪电》宏电子设定）。
8. **宇宙坍缩预兆**：观测到宇宙大尺度结构中的质量缺失，暗示宇宙正在走向热寂。

---

## 四、星系物理模型问题（5处）

### 4.1 河外星系作为"行星"处理

[stars.json](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/data/stars.json) 中，比邻星、天狼星等**恒星系统**被标记为 `"IsPlanet": 1`，且拥有 `Resource` 和 `PopLimit`，仿佛它们是可直接殖民的行星。

**优化方案**：将河外星系条目的 `IsPlanet` 改为 `0`（恒星），新增其下辖的行星子条目（如"比邻星b"），玩家殖民的是行星而非恒星本身。或在UI层面标注为"恒星系统"。

### 4.2 星际距离未参与游戏机制

`stars.json` 中河外星系有 `Distance` 字段（单位：光年），但在 [StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L137-L149) 中，所有河外星系的轨道半径是**随机生成**的，完全无视 `Distance` 数据。

**优化方案**：在 `initStars()` 中，对 `index > 10` 的星系，使用 `Distance` 字段按对数尺度计算轨道半径，使星图具有物理真实感。

### 4.3 缺少新星系的宜居性差异

所有河外星系都有固定的 `Resource` 和 `PopLimit`，没有反映恒星类型对宜居性的影响（如红矮星比邻星的潮汐锁定、天狼星A的高辐射）。

**优化方案**：为每个星系增加 `starType`（红矮星/黄矮星/白矮星）和 `habitability` 系数，影响殖民效率与人口上限。

### 4.4 月球轨道渲染的父星引用问题

[StarMapRenderer.ts L122-125](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L122-L125) 中月球绕地球公转的实现正确，但 `parentIndex` 使用 `find()` 遍历整个数组查找父星，在大星系数据下存在性能隐患。

**优化方案**：构建 `index → RenderStar` 的 Map 索引，O(1) 查找替代 O(n) 遍历。

### 4.5 新星系应具备独特的事件生态

玩家到达比邻星等新星系后，应触发与新环境相关的特殊事件（如潮汐锁定带来的永昼/永夜殖民难题），而非继续复用太阳系内的事件模板。

**优化方案**：在 `randomevents.json` 中新增 `"reqStar"` 触发条件字段，限定事件仅在特定星系殖民后触发。

---

## 五、数值平衡极端溢出（60+处）

大量随机事件的 `effects` 数值远超游戏初始值量级。例如：

| 事件 | 效果 | 数值 | 问题 |
| :--- | :--- | :--- | :--- |
| `dilemma_nuke_rebel_city` | population | **-200,000** | 初始人口仅65，此值荒谬 |
| `dilemma_oxygen_rationing` | population | **-75,000** | 同上 |
| `dilemma_great_ravine_ration` | population | **-40,000** | 同上 |
| `dilemma_two_worlds_trolley` | population | **-35,000** | 同上 |
| `tech_gravity_control_failure` | population | **-30,000** | 同上 |
| `revolt_refugee_caravan` | population | **+30,000** | 大幅膨胀 |

> [!WARNING]
> 游戏初始人口为 **65**（亿），这些事件的人口变动动辄数万甚至二十万，说明事件数值可能是按照"万人"或"绝对人数"的不同量纲编写的，与游戏引擎的"亿"单位存在**量纲错配**。

### 优化方案

1. **统一量纲**：确认游戏中 `population` 的单位（亿/万/绝对值），并统一所有事件的数值量纲。
2. **引入百分比机制**：对于灾难事件，使用 `"type": "resource_percent", "value": -0.1` 表示减少当前值的10%，避免固定数值在不同游戏阶段产生荒谬效果。
3. **设置合理上下界**：在 `applyNewEffects()` 中增加 `Math.max(0, Math.min(current * 0.5, absValue))` 的保护性钳制。

---

## 六、刘慈欣宇宙拓展不足

当前仅有4条刘慈欣跨宇宙事件（吞食者、诗云、朝闻道、低温艺术家），且全部集中在 CRISIS/DETERRENCE 纪元。

### 优化方案：按纪元分层拓展

| 纪元 | 建议新增事件 | 原著来源 |
| :--- | :--- | :--- |
| CRISIS | **微纪元使者降临**：一颗微缩文明的飞船造访太阳系 | 《微纪元》 |
| DETERRENCE | **全频带阻塞干扰**：太阳系通讯被未知力量全频段压制 | 《全频带阻塞干扰》 |
| BROADCAST | **球状闪电武器化**：发现宏电子可用于量子态军事打击 | 《球状闪电》 |
| BUNKER | **带上她的眼睛**：深层地心探测器的最后通讯 | 《带上她的眼睛》 |
| GALAXY | **流浪地球编队**：在星际航行中遭遇另一支行星级逃逸编队 | 《流浪地球》 |
| GALAXY | **超新星遗迹中的碳基联邦**：途经超新星残骸发现碳基联邦遗迹 | 原C++源码设计 |
| GALAXY | **宇宙尽头的回声**：监测到大爆炸余晖中的智慧信号 | 《朝闻道》延伸 |

---

## 七、其他发现

### 7.1 `triggerCharacterUnlockPopup()` 成为死代码

在 [Game.ts L547-638](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L547-L638) 中，`triggerCharacterUnlockPopup()` 方法仍保留着完整的14位角色弹窗数据（约90行代码），但 `unlock_person` 处理逻辑已在上游改为推送 `tickerMessages`，该方法**永远不会被调用**。

**优化方案**：删除该死代码方法，减少维护负担。

### 7.2 公告板高度可能遮挡游戏内容

[AnnouncementBoard.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/AnnouncementBoard.tsx) 设置了 `max-h-24`（6rem ≈ 96px），当消息累积过多时会产生内部滚动条，但整个组件始终占据固定高度，压缩了下方星图和操控区的可用空间。

**优化方案**：改为可折叠/可收起的设计，默认仅显示最新1条，点击展开查看历史。

### 7.3 存档/读档未序列化 `tickerMessages`

在 [Game.ts 的 replacer/reviver](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L778-L801) 中，`tickerMessages` 作为普通数组会被 JSON 序列化保存，但读档后公告板组件不会主动刷新显示历史消息（需要手动触发 `ticker-message-added` 事件）。

**优化方案**：在 `loadGame()` 成功后，显式触发 `window.dispatchEvent(new CustomEvent('ticker-message-added'))`。

### 7.4 WANDERING 纪元映射语义混乱

在 `GameEventManager.ts` 的 `isEpochMatch()` 中，`WANDERING` 映射为 `BROADCAST || BUNKER || GALAXY`。但"流浪"（WANDERING）的语义应仅对应"流浪地球"阶段，现在却被用作一个笼统的"中后期"标签，导致42条 WANDERING 事件在广播、掩体、银河三个截然不同的纪元中无差别触发。

**优化方案**：废弃 `WANDERING` 标签，将这42条事件逐一分配到精确的纪元组合（如 `"BROADCAST,BUNKER"` 或 `"BUNKER,GALAXY"`），消除语义歧义。

---

## 八、测试验证状态

```
Test Files  12 passed (12)
     Tests  246 passed (246)
  Duration  18.00s
TypeScript  tsc --noEmit 通过（0 errors）
```

> [!NOTE]
> 本审计报告仅输出问题与优化方案，**不包含任何代码修改**。所有优化方案已按优先级（P0=穿帮修复 → P1=事件填充 → P2=物理模型 → P3=数值平衡）排列，可直接交由 Fixer 角色接手执行。
