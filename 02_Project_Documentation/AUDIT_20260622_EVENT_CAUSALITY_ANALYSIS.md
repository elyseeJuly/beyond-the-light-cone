# LegendOfUni 43个事件的因果逻辑与双向影响分析报告
> **文档编号**: AUDIT_20260622_EVENT_CAUSALITY_ANALYSIS  
> **生成日期**: 2026-06-22  
> **分类前缀**: `AUDIT_` (审计分析与研究报告)  
> **文档版本**: V1.0  
> **说明**: 本文档深入剖析《LegendOfUni》中 43 个核心 CG 事件在游戏引擎内部的**因果逻辑（Causal Loop）**。展示“游戏进展（数值、科技、状态）如何影响事件触发”以及“事件选择如何反作用于游戏进展并决定结局分支”的双向闭环机制。

---

## 一、 事件系统的双向因果环（Causal Loop）模型

在《LegendOfUni》的底层引擎中，游戏进展与剧情事件并非单向线性关系，而是通过**“数值-状态-事件-反馈”**形成闭环。

```mermaid
graph TD
    %% Progress to Event
    subgraph 游戏进展 (Game Progress)
        Year[纪元时间线 Year]
        Resources[五大核心资源: 军事/威望/科技/猜疑/稳定]
        Flags[事件状态标签 Flags/Prerequisites]
        Tech[科技解锁状态 Tech Tree]
        Char[角色生命状态 Character Lifespans]
    end

    subgraph 事件触发引擎 (Event Engine)
        TriggerCheck{触发检测: checkFilterConditions}
        RandCheck{概率/权重校验: randomEventTriggerCounts}
    end

    subgraph 剧情事件 (43 CG Events)
        StoryEvent[主线历史节点 CG]
        BranchEvent[抉择/随机分支 CG]
    end

    subgraph 反馈效应 (Feedback Effects)
        ResMod[资源增减: Resource Modifiers]
        FlagSet[设置新状态: Flag Sets]
        CharChange[角色登场/解锁/死亡: Character State]
        EndingTrigger[触发终局结算: Ending Triggers]
    end

    %% Causal Links
    Year --> TriggerCheck
    Resources --> TriggerCheck
    Flags --> TriggerCheck
    Tech --> TriggerCheck
    Char --> TriggerCheck
    
    TriggerCheck --> RandCheck
    RandCheck -->|条件满足| StoryEvent
    RandCheck -->|条件满足| BranchEvent
    
    StoryEvent --> ResMod
    StoryEvent --> FlagSet
    StoryEvent --> CharChange
    StoryEvent --> EndingTrigger
    
    BranchEvent --> ResMod
    BranchEvent --> FlagSet
    BranchEvent --> CharChange
    BranchEvent --> EndingTrigger
    
    %% Feedback loops back to Progress
    ResMod --> Resources
    FlagSet --> Flags
    CharChange --> Char
    
    style 游戏进展 fill:#112233,stroke:#00aaff,stroke-width:2px;
    style 事件触发引擎 fill:#221133,stroke:#aa00ff,stroke-width:2px;
    style 剧情事件 fill:#113322,stroke:#00ffaa,stroke-width:2px;
    style 反馈效应 fill:#332211,stroke:#ffaa00,stroke-width:2px;
```

### 1. 游戏进展 ➔ 影响事件 (Progress to Event)
事件的触发依赖于 `checkFilterConditions` 函数对当前游戏进展状态的判定：
*   **时间/纪元限制**：事件仅在特定纪元（`epoch`）或满足最小年份（`minYear`）后触发。
*   **状态前置条件 (Flags)**：如「古筝行动」要求必须已标记 `eto_founded`。
*   **科技树约束 (reqTech)**：如「星环号光速试航」必须在前置科技「曲率驱动理论」研发完毕后才能解锁。
*   **资源阈值判定**：猜疑度（`treachery`）过高会加速触发三体袭击事件；稳定度（`stability`）过低会诱发内部动乱事件。
*   **角色寿命判定**：若已至角色死亡年份，该角色相关的专属事件和选项将全部关闭（体现时间线的不可逆性）。

### 2. 事件 ➔ 反作用于游戏进展 (Event to Progress)
玩家在事件中的决策或事件的强制结果，会通过 `effects` 执行链改写整个游戏进展：
*   **资源惩罚/奖励**：如「末日战役」会扣除人类 $800$ 点军事力量与 $50$ 点威望，瞬间改变战局走势。
*   **新因果链生成 (Flag Set)**：事件完成后设置新的 `Flag`（如 `deterrence_established`），为未来的威慑纪元事件铺平道路。
*   **角色生卒控制**：开启角色的启用状态（解锁罗辑、维德等），或强制角色死亡（如维德被处决、杨冬自杀），从而断开相关决策链。
*   **终局收敛**：部分极端的事件反馈会直接触发结局（如「太阳系二维化」事件中，若无光速飞船，直接宣告降维灭绝失败）。

---

## 二、 43 个事件因果链条 chronological 完整呈现

以下是游戏内 43 个 CG 事件的触发条件、即时影响以及它们在因果环中的后续反馈路径：

### 1. 黄金岁月 (Golden Era) —— 种子播撒与接触

#### 1.1 红岸基地建立 (`cg_red_shore_base.png`)
*   **触发条件**：`epoch == GOLDEN` 且 `Year == -58` (开局自动触发)。
*   **反馈影响**：解锁人物「叶文洁」，写入 Flag `red_shore_base_established`。
*   **因果后续**：此状态是叶文洁发射信号的唯一前置。

#### 1.2 叶文洁发送信号 (`cg_yewenjie_signal.png`)
*   **触发条件**：满足 `red_shore_base_established` 且 `Year >= -36`。
*   **反馈影响**：写入 Flag `signal_sent_to_trisolaris`，增加威望 $5$ 点。
*   **因果后续**：信号开始在宇宙中飞驰，使三体接收成为可能。

#### 1.3 三体文明回复 (`cg_trisolaris_reply.png`)
*   **触发条件**：满足 `signal_sent_to_trisolaris` 且 `Year >= -28`。
*   **反馈影响**：写入 Flag `trisolaris_reply_received`，全局猜疑度（`treachery`）增加 $5$ 点。
*   **因果后续**：地球收到了警告，埋下了泄露的危机。

#### 1.4 ETO 组织成立 (`cg_eto_founded.png`)
*   **触发条件**：满足 `trisolaris_reply_received` 且 `Year >= -27`。
*   **反馈影响**：解锁人物「伊文斯」，写入 Flag `eto_founded`，增加猜疑度 $10$ 点。
*   **因果后续**：ETO 开始在暗中协助三体封锁，为后来的「古筝行动」和「智子封锁」奠定因果。

---

### 2. 危机纪元 (Crisis Era) —— 智子锁死与面壁挣扎

#### 2.1 危机纪元开启 (`cg_crisis_start.png`)
*   **触发条件**：`Year == 0`，时间线自然推移。
*   **反馈影响**：纪元状态变更为 `CRISIS`，社会稳定度下降 $20$ 点。

#### 2.2 智子锁死科学 (`cg_sophon_blockade.png`)
*   **触发条件**：`epoch == CRISIS` 且 `Year == 0`。
*   **反馈影响**：写入 Flag `sophon_lockade_active`，封锁基础物理，将科技产出速度降低 $50\%$。
*   **因果后续**：逼迫人类启动无需外界科技交互的「面壁计划」。

#### 2.3 杨冬自杀 (`cg_yangdong_suicide.png`)
*   **触发条件**：`epoch == CRISIS` 且 `Year == 0`。
*   **反馈影响**：锁定 Flag `yangdong_dead`。
*   **因果后续**：物理学的大厦崩塌，宣告科学界自杀潮的开始，触发科学社会混乱事件。

#### 2.4 汪淼幽灵倒计时 (`cg_ghost_countdown.png`)
*   **触发条件**：满足 `sophon_lockade_active` 且 `Year >= 1`。
*   **反馈影响**：解锁人物「汪淼」，降低当前科学值，提示纳米材料的研究方向。
*   **因果后续**：解锁纳米材料科技后才能实施古筝行动。

#### 2.5 古筝行动 (`cg_guzheng.png`)
*   **触发条件**：满足 `eto_founded`，且解锁纳米材料科技，`Year >= 2`。
*   **反馈影响**：写入 Flag `eto_destroyed`，解锁「智子三体文档」，增加人类威望 $20$ 点，降低猜疑度。
*   **因果后续**：消除了早期的 ETO 干扰，人类获得智子展现的真相，正式开启面壁者选定。

#### 2.6 章北海刺杀老专家 (`cg_beihai_assassination.png`)
*   **触发条件**：任命「章北海」为太空军执行官，且常规动力研究陷入瓶颈。
*   **反馈影响**：写入 Flag `beihai_assassination_done`，强制旧派科学家死亡，解锁「无介质辐射驱动发动机（高能聚变动力）」。
*   **因果后续**：此动力是建造星舰「自然选择」号和未来光速逃逸的核心因果前置。

#### 2.7 希恩斯思想钢印 (`cg_thought_seal.png`)
*   **触发条件**：任命面壁者「希恩斯」，且科学值满足门槛，`Year >= 12`。
*   **反馈影响**：解锁 Flag `thought_seal_active`，大幅度提升太空军战斗意志（增加军事基础值），但社会猜疑度增加。
*   **因果后续**：部分被打上思想钢印的人成为逃亡主义的先驱，影响末日之战后的舰队分流选择。

#### 2.8 泰勒破壁 (`cg_tyler_breached.png`)
*   **触发条件**：面壁者「泰勒」执政期间，时间线到达 `Year >= 20` 且猜疑度高。
*   **反馈影响**：写入 Flag `tyler_defeated`，降低人类威望 $15$ 点，锁定泰勒相关科技，泰勒退出游戏。

#### 2.9 雷迪亚兹破壁 (`cg_reydiaz_breached.png`)
*   **触发条件**：面壁者「雷迪亚兹」执政期间，时间线到达 `Year >= 30`。
*   **反馈影响**：写入 Flag `reydiaz_defeated`，雷迪亚兹退出游戏。降低威望，锁定核武震慑方向。

#### 2.10 大低谷开始 (`cg_great_ravine.png`)
*   **触发条件**：`epoch == CRISIS` 且 `Year == 40`。
*   **反馈影响**：写入 Flag `great_ravine_active`。社会人口降低 $50\%$，科研产出降至最低，社会稳定度极低。
*   **因果后续**：阻碍所有大型基础建设，游戏转入维持生存阶段，考验玩家资源调配能力。

#### 2.11 月球危机 (`cg_moon_crisis.png`)
*   **触发条件**：`Year == 50`。
*   **反馈影响**：根据玩家当下的月球防御建设度，判定是否损失人口。如果防御失败，威望进一步下降。

#### 2.12 大低谷结束 (`cg_great_ravine_ended.png`)
*   **触发条件**：`great_ravine_active` 为真且 `Year == 80`。
*   **反馈影响**：移除 `great_ravine_active`，写入 Flag `great_ravine_ended`，稳定度回升，人口与科技点产出开始加倍反弹。

#### 2.13 技术爆炸 (`cg_tech_explosion.png`)
*   **触发条件**：`great_ravine_ended` 为真，且 `Year >= 120`。
*   **反馈影响**：写入 Flag `tech_explosion_active`。基础科技点瞬间增加 $2000$，解锁恒星级战舰生产线。
*   **因果后续**：人类舰队开始盲目扩张，军事实力数值虚高，进入傲慢膨胀期（为末日之战埋下诱因）。

#### 2.14 水滴抵近太阳系 (`cg_teardrop_probe.png`)
*   **触发条件**：`Year == 199` 且人类军事实力大于 $1000$。
*   **反馈影响**：写入 Flag `teardrop_arrived`，触发全球乐观情绪，威望值临时增加。

#### 2.15 末日战役 (`cg_droplet_attack.png` 或 `cg_doomsday_battle.png`)
*   **触发条件**：`Year == 200` 且 `teardrop_arrived` 为真。
*   **反馈影响**：强制触发。**扣除人类军事实力 $800$ 点，威望降低 $50$ 点**，写入 Flag `doomsday_battle_lost`。
*   **因果后续**：人类联合政府威信彻底扫地，太空军防线全面崩溃。

#### 2.16 黑暗战役 (`cg_dark_battle.png`)
*   **触发条件**：`doomsday_battle_lost` 为真，且 `Year == 201`。
*   **反馈影响**：逃亡星舰互相火并。设置 Flag `dark_battle_concluded`。
*   **因果后续**：幸存战舰（如「蓝色空间」号）彻底断开与地球的政治联系，成为独立星舰文明，这也促使地球方罗辑准备进行最后的生死豪赌。

---

### 3. 威慑纪元 (Deterrence Era) —— 零和博弈与暗流涌动

#### 3.1 黑暗森林威慑建立 (`cg_deterrence_established.png`)
*   **触发条件**：`dark_battle_concluded` 为真，`Year == 202`，且玩家拥有发射引力波/太阳电波的设备。
*   **反馈影响**：切换纪元至 `DETERRENCE`，猜疑度归零。解锁超级领袖「罗辑」作为执剑人。
*   **因果后续**：进入相对和平繁荣的发展期，解锁三体科技。

#### 3.2 三体技术交流开始 (`cg_tech_exchange.png`)
*   **触发条件**：`epoch == DETERRENCE`。
*   **反馈影响**：大幅提升科技点增速。解锁「强相互作用力材料」、「引力波广播天线」等神级科技。
*   **因果后续**：为玩家后期建造黑域或光速飞船提供核心科技前提。

#### 3.3 执剑人交接仪式 (`cg_swordholder_handover.png`)
*   **触发条件**：`epoch == DETERRENCE` 且 `Year == 205`（罗辑退休）。
*   **抉择分支与双向因果**：
    *   **选择程心**：人类威望值极高，但威慑度跌破警戒线。
    *   **选择维德/曹彬**：人类威望降低，但威慑度保持在安全阈值以上。

#### 3.4 执剑人交接失败 / 威慑中止 (`cg_deterrence_broken.png`)
*   **触发条件**：执剑人选择「程心」或者玩家未能维持最低威慑度要求。
*   **反馈影响**：**设置 Flag `deterrence_broken`**。三体水滴瞬间强袭地球，所有引力波天线被毁，终结威慑纪元。
*   **因果后续**：引向黑暗的被征服深渊（澳大利亚移民）。

---

### 4. 广播纪元与大移民 (Broadcast & Migration Era)

#### 4.1 澳大利亚大移民 (`cg_australia_migration.png`)
*   **触发条件**：`deterrence_broken` 为真，且引力波天线已被全部破坏。
*   **反馈影响**：设置 Flag `australia_migration_started`。稳定度归零，人口值暴跌 $80\%$。

#### 4.2 引力波宇宙广播启动 (`cg_gravitational_broadcast.png`)
*   **触发条件**：`australia_migration_started` 状态下，触发海外星舰（「万有引力」号）执行引力波坐标广播。
*   **反馈影响**：纪元变更为 `BROADCAST`，三体世界与太阳系坐标正式泄露。设置 Flag `coordinates_broadcasted`。
*   **因果后续**：触发黑暗森林打击倒计时。

#### 4.3 三体星系光粒摧毁 (`cg_trisolaris_destroyed.png`)
*   **触发条件**：`coordinates_broadcasted` 为真，且广播后过了 2 年。
*   **反馈影响**：设置 Flag `trisolaris_destroyed`。
*   **因果后续**：三体文明母星灭亡，残余舰队失去归宿开始深空逃亡。

#### 4.4 三体第二舰队曲率逃离 (`cg_trisolaris_fleet_escaped.png`)
*   **触发条件**：`trisolaris_destroyed` 为真。
*   **反馈影响**：三体舰队使用曲率驱动离去。
*   **因果后续**：人类观测到曲率航迹，解锁「曲率驱动理论」的研究加成，提示了人类唯一的生路。

#### 4.5 维德星际政变 (`cg_wade_coup.png`)
*   **触发条件**：玩家支持维德秘密研发光速飞船，但在 `Year == 215` 时研发基地被联邦政府军队包围。
*   **抉择分支与双向因果**：
    *   **选择妥协投降**：维德被捕，触发「维德处决」事件。
    *   **选择武装抵抗**：导致政变内战，稳定度骤降，但保留了曲率光速飞船的火种。

#### 4.6 维德处决 (`cg_wade_executed.png`)
*   **触发条件**：在政变抉择中妥协。
*   **反馈影响**：**设置 Flag `wade_executed`**。维德死亡，曲率光速飞船研发进度锁定并倒退 $50$ 年。
*   **因果后续**：将极大增加后期“降维打击”到来时，人类因没有光速飞船而全灭的概率。

#### 4.7 掩体与黑域辩论 (`cg_black_domain_debate.png`)
*   **触发条件**：`epoch == BROADCAST`，人类面临双重生存提案抉择。
*   **抉择反馈**：
    *   **倾向掩体计划**：解锁巨行星掩体太空城建设。
    *   **倾向黑域安全声明**：开启低光速黑域科技研发。

---

### 5. 掩体纪元与终局逃亡 (Bunker & Exodus Era)

#### 5.1 掩体世界落成 (`cg_bunker_world.png`)
*   **触发条件**：时间线到达 `Year == 225`。
*   **反馈影响**：切换纪元为 `BUNKER`。设置 Flag `bunker_cities_ready`。
*   **因果后续**：避开光粒打击，但在面对更高的降维打击（二向箔）时防御值为零。

#### 5.2 星环号光速试航 (`cg_lightspeed_ship.png`)
*   **触发条件**：未被处决维德，或玩家暗中持续走私科技，且曲率驱动科技树全满。
*   **反馈影响**：**设置 Flag `lightspeed_travel_possible` 为真**。
*   **因果后续**：唯一的逃生之门就此打开。

#### 5.3 行星发动机启航 / 流浪地球 (`cg_wandering_earth.png`)
*   **触发条件**：玩家在掩体纪元中拒绝掩体太空城，转而完成重核聚变 planetary engine 科技线建设。
*   **反馈影响**：设置 Flag `wandering_earth_active`。
*   **因果后续**：走向流浪地球结局路径。

#### 5.4 维度打击警报 (`cg_dimensional_warning.png`)
*   **触发条件**：`epoch == BUNKER` 且 `Year == 290`。
*   **反馈影响**：设置 Flag `dimensional_strike_imminent`。触发末日倒计时，锁定所有常规建设。

#### 5.5 冥王星博物馆 (`cg_pluto_museum.png`)
*   **触发条件**：`dimensional_strike_imminent` 为真且时间线到达二向箔接触边缘（`Year == 300`）。
*   **反馈影响**：设置 Flag `human_heritage_archived`。
*   **因果后续**：决定最终人类文明数据是否能在废墟中保存。

#### 5.6 太阳系二维化 (`cg_solar_system_flattened.png`)
*   **触发条件**：`Year == 301` 且未开启黑域或完成逃逸。
*   **双向逻辑收敛（生死判定）**：
    *   *判定A*：若 `lightspeed_travel_possible` 为假 ➔ 毁灭，触发 `ending_defeat_extinction`。
    *   *判定B*：若 `lightspeed_travel_possible` 为真 ➔ 逃逸成功，触发 `cg_galaxy_exodus` 并进入银河纪元。

#### 5.7 银河远征星舰集结 (`cg_galaxy_exodus.png`)
*   **触发条件**：二向箔坍缩中成功使用光速飞船逃离。
*   **反馈影响**：设置 Flag `galaxy_exodus_successful`，进入 `GALAXY` 纪元。

#### 5.8 银河纪元开启 (`cg_galaxy_era.png`)
*   **触发条件**：满足 `galaxy_exodus_successful`。
*   **反馈影响**：开启新时代的星际游牧社会。

#### 5.9 星屑纪元生存 (`cg_stardust_era.png`)
*   **触发条件**：`epoch == GALAXY` 在深空漂泊超过 $50$ 年。
*   **反馈影响**：人类演变为星屑聚落，寻找最后的归零可能。

#### 5.10 归零者宇宙广播 (`cg_zeroer_broadcast.png`)
*   **触发条件**：`Year == 400`。
*   **反馈影响**：发出超维宇宙广播，引出终极结局判定（小宇宙胜利、宇宙静默或归零毁灭）。

---

## 三、 典型双向因果逻辑环路分析 (Causal Loops Example)

下面以游戏中两个最经典的系统性闭环来展示这种双向因果：

### 🔄 闭环 1：维德决策、光速飞船与二向箔降维打击
1. **游戏进展控制事件**：玩家累积科技点并解锁“曲率驱动理论”（进展 ➔ 事件）。
2. **事件抉择改写进展**：触发「维德星际政变」事件。玩家选择“支持维德研发光速飞船”（事件 ➔ 进展：改变 Flag 为 `lightspeed_active`，但会暂时降低社会稳定度）。
3. **进展再度影响事件**：因为 `lightspeed_active` 为真，时间线推移至 Year 301 时，触发「太阳系二维化」判定，玩家能够触发「银河远征星舰集集」CG并成功飞离（进展 ➔ 事件）。
4. **反向恶果（若妥协）**：若妥协处决维德（事件 ➔ 进展：Flag 变为 `wade_executed` 且研发中断）。当 Year 301 二向箔来临时，直接触发「二维化坍缩灭绝终局」结局死路（进展 ➔ 结局事件）。

### 🔄 闭环 2：思想钢印、战斗意志与末日之战
1. **游戏进展控制事件**：面壁者希恩斯科技线满足（进展 ➔ 事件）。
2. **事件改写进展**：触发「思想钢印」事件，玩家选择大规模使用思想钢印（事件 ➔ 进展：人类军事实力狂飙，但社会稳定度下降）。
3. **进展决定后续事件**：因为军事实力由于思想钢印虚高，在 Year 200 触发「技术爆炸」和「末日战役」时，会触发逃亡舰队中带有“信念钢印”士兵强行夺取战舰，间接导致「黑暗战役」中星舰自相残杀的惨烈程度和走向（进展 ➔ 事件）。

---

## 四、 核心资源值（数值进展）与 43 事件双向对照表

游戏中的数值变动通过以下对应关系反作用于这 43 个事件：

| 核心资源 | 数值变化触发的事件阈值 | 事件对该数值的改写反馈 (示例) |
| :--- | :--- | :--- |
| **军事 (Military)** | 降至 0 时直接触发「防线崩溃」；大于 1000 会诱发人类傲慢，加速触发「水滴抵近」。 | 「末日战役」一次性强扣 **-800** 军事值。<br>「希恩斯思想钢印」事件可增加 **+150** 军事值。 |
| **威望 (Prestige)** | 威慑度低于 30% 必定触发「执剑人被偷袭 / 威慑中止」事件。 | 「古筝行动」胜利带来 **+20** 威望。<br>「维德被处决」会导致社会悲观，威望扣减 **-10**。 |
| **科技 (Technology)**| 满级解锁「光速试航」；如果科研进度太慢，会提前在 Year 301 遭遇灭绝。 | 「技术爆炸」直接给予 **+2000** 科技点加成。<br>「智子展开」会降低科技成长率 **-50%**。 |
| **猜疑 (Treachery)** | 猜疑度过高会触发「人类内部哗变崩溃」大失败结局事件。 | 「三体回复」增加 **+5** 猜疑。<br>「黑暗战役」使猜疑度暴涨 **+40**。 |
| **稳定 (Stability)** | 低于 20% 时随机事件将转为恶性暴乱事件，直接触发「内讧崩塌」。 | 「大低谷开始」使稳定度暴跌 **-40**。<br>「大低谷结束」后稳定度回升 **+30**。 |
