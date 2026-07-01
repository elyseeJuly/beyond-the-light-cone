# Beyond-the-Light-Cone Master Resource Index | 《光锥之外：纪元往事》美术与音乐资源总索引

> **文档编号**: SPEC_20260701_MASTER_RESOURCE_INDEX  
> **制定日期**: 2026-07-01  
> **分类前缀**: `SPEC_` (技术设计与美术规范)  
> **文档版本**: V1.0  
> **说明**: 本文档汇总整理了《光锥之外：纪元往事》重构版中所有的核心美术资源（CG、立绘、头像）与音乐资源（纪元BGM、结局主题曲），包含各资源的存放路径、AI生成提示词（Prompts）以及调用配置，便于后续的资源查找、替换与优化。

---

## 🎵 一、 音乐与音频资源索引 (Audio Resources)

本项目采用**双音轨动态切换系统**。所有音频文件统一存放在 `03_Web_Rebuild/public/audio/` 目录下。

### 1.1 纪元背景音乐 (Gameplay Era BGMs)
常规游戏循环阶段，随当前纪元的推进自动循环播放对应的纯器乐 (Instrumental) 曲目。

| 序号 | 纪元类型 (Epoch) | 对应文件名 | 音乐名称 / 风格定位 | AI 生成提示词 (Prompt) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **黄金岁月** (GOLDEN) | `era_years_base.mp3` | 《岁月底座》 (Leitmotif) / 温暖深邃 | 作为游戏核心主导动机（Leitmotif），在威慑纪元等变奏中复用其旋律基调。 |
| 2 | **危机纪元** (CRISIS) | `era_crisis.mp3` | 《危机之潮》 / 重工业交响与紧迫感 | `[Instrumental] Heavy industrial orchestral, industrial heartbeat pulse, planetary engine construction atmosphere, humanity-wide mobilization, rhythmic ticking clock, driving staccato strings, massive brass hits, 90 BPM.` |
| 3 | **威慑纪元** (DETERRENCE) | `era_deterrence.mp3` | 《执剑低吟》 / 极简深沉与心理威压 | `[Instrumental] Minimalist dark ambient, ultra-slow deep cello, isolating cold synth pads, single distant taiko hit every 16 bars, psychological tension, suspended threat, profound silence, eerie and profound, 60 BPM.` |
| 4 | **广播纪元** (BROADCAST) | `era_broadcast.mp3` | 《广播回响》 / 混乱金属与信仰崩塌 | `[Instrumental] Chaotic symphonic metal fusion, fragmented radio transmission, distorted emergency broadcast, broken signal static, existential panic, crumbling order, heavy distorted bass, aggressive fast strings, impending doom, 140 BPM.` |
| 5 | **掩体纪元** (BUNKER) | `era_bunker.mp3` | 《深空掩体》 / 铁甲共鸣与深井压抑 | `[Instrumental] Muffled sub-bass, metal resonance, hull vibration, deep structural hum, claustrophobic atmospheric, distant rumbling industrial noise, dark synthwave, hiding in the dark, deep space station vibe.` |
| 6 | **银河纪元** (GALAXY) | `era_galaxy.mp3` | 《银河孤舟》 / 辽阔空灵与宇宙孤独 | `[Instrumental] Vast cosmic ambient, lonely solo piano echoing in infinite space, wordless female vocalise (Ah...), sweeping cinematic strings, interstellar wandering, profound cosmic loneliness, majestic but tragic, zero-gravity feel.` |
| 7 | **星屑纪元** (STARDUST) | `era_stardust.mp3` | 《星屑余晖》 / 废土后摇与空灵衰减 | `[Instrumental] Ethereal post-rock, shimmering granular synthesis, crystalline bell sounds, zero-gravity floating, beautiful but tragic aftermath, decaying notes fading into the void, ambient drone.` |

---

### 1.2 结局与制作群名单音乐 (Ending & Credits BGMs)
触发结算流程时，游戏淡出常规 BGM，并无缝切入对应的专属结算主题音乐。

| 序号 | 结局类型 (Ending Key) | 对应文件名 | 音乐名称 / 风格定位 | AI 生成提示词 (Prompt) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **征服胜利** (CONQUEST) | `ending_death_of_the_light_cone.mp3` | 《Death of the Light Cone》 / 死亡安魂曲 | `[Instrumental] Slow requiem, dark ambient classical, wordless sacred choir, tragic and solemn, trapped in eternity, fading tempo.` |
| 2 | **威慑胜利** (DETERRENCE) | `ending_stardust_exodus.mp3` | 《Stardust Exodus》 / **[真结局人声Vocal]** | `J-RPG space opera soundtrack, symphonic EDM mixed with orchestral rock, high energy, ethereal but powerful anime-style female vocals, dramatic choir, grand cosmic epic.` |
| 3 | **黑域声明胜利** (DARK_DOMAIN) | `ending_death_of_the_light_cone.mp3` | 《Death of the Light Cone》 / 光速墓碑 | *(同上 CONQUEST 提示词)* |
| 4 | **流浪地球胜利** (WANDERING) | `ending_stardust_exodus.mp3` | 《Stardust Exodus》 / **[真结局人声Vocal]** | *(同上 DETERRENCE 提示词，配歌词)* |
| 5 | **数字生命胜利** (DIGITAL) | `ending_ghost_in_the_quantum.mp3` | 《Ghost in the Quantum》 / 赛博合成脉冲 | `[Instrumental] Cyberpunk synthwave, digital glitch effects, mechanical beats, emotionless data stream vibe, cold ambient synthesizer, no human vocals.` |
| 6 | **小宇宙避难胜利** (HIDDEN) | `ending_the_last_archive.mp3` | 《The Last Archive》 / 寂静遗忘 | `[Instrumental] Melancholic solo piano, tape hiss, old radio static, fading memories, gentle oblivion, time passing by, ending with a distinct page turning sound, absolute silence.` |
| 7 | **白金成就名单** (CREDITS_PLATINUM) | `ending_fate_beyond_the_light_cone.mp3` | 《A Past Within the Light Cone》 / **[人声Vocal]** | `Cinematic emotional masterpiece, starts with minimalist lonely piano, slowly building into full cinematic orchestral climax. Soulful and powerful female vocal, nostalgic, overwhelmingly emotional, Hans Zimmer style epic finish.` |
| 8 | **永恒的流亡** (NEUTRAL_ETERNAL_EXILE) | `ending_neutral_eternal_exile.mp3` | 《Endless Drifting》 / 寂寞流浪纯乐 | `[Instrumental] Melancholic space ambient, distant cello, echoing soft synth, feeling of endless drifting, vast emptiness, sorrowful but determined, deep space nomadic vibe, slow tempo, 60 BPM.` |
| 9 | **宇宙静默** (NEUTRAL_COSMIC_SILENCE) | `ending_neutral_cosmic_silence.mp3` | 《Absolute Zero》 / 绝对零度极简 | `[Instrumental] Minimalist drone, absolute zero ambient, very low frequency hum, sparse crystal chimes fading into the void, emotionless, vast, cold, cosmic background radiation, 40 BPM.` |
| 10 | **失败分支（背叛/灭绝等）** | 对应各重合的 `ending_*.mp3` | 根据胜败类型复用上述流亡或静默主题 | 复用对应的流放/静默/危机纪元变奏音乐。 |

---

## 🖼️ 二、 美术与 CG 资源索引 (Art & Graphics Resources)

美术资源分为全屏剧情/结局 CG (`public/images/cg_*.png`, `ending_*.png`) 和人物立绘 (`public/images/unified_*.png`, `npc_*.png`)。

### 2.1 全屏剧情事件 CG (Event CGs)
采用 **Epic Concept Art (电影级写意概念图)** 风格。画幅要求为 **21:9** (Midjourney 后缀 `--ar 21:9`)。以下特别列出已被重绘修改、强化了东亚华人种族正确性的 **P0 核心资产**：

| 资源文件名 | 描述 / 对应事件 | 核心登场人物 | 强化种族特征的 AI 提示词 (Midjourney v6.0 / Craig Mullins 风格) |
| :--- | :--- | :--- | :--- |
| `cg_yewenjie_signal.png` | 叶文洁向宇宙发送信号 | 叶文洁 (中年) | `Epic sci-fi concept art, a lone East Asian Chinese female scientist in her 40s, standing in a massive dimly lit Cold War-era control room, pressing a glowing red button. She has typical East Asian features: black hair in a simple bun, dark brown eyes, gentle but determined facial structure, not wearing glasses, wearing a retro-futuristic Chinese military uniform. Colossal parabolic radar dish window background. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0` |
| `cg_yangdong_suicide.png` | 理论物理学家杨冬自杀 | 杨冬 | `Epic sci-fi concept art, a beautiful tragic East Asian Chinese young woman physicist in her late 20s, sitting on the edge of a balcony under a vast starry sky. She has delicate East Asian features: long straight black hair flowing in the wind, pale skin, melancholic dark eyes, wearing a simple dark elegant dress. Crumpled note on the railing. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0` |
| `cg_ghost_countdown.png` | 汪淼眼前出现的幽灵倒计时 | 汪淼 | `Epic sci-fi concept art, an East Asian Chinese male scientist in his 40s, wearing thin-rimmed glasses, looking at a wall in a dark room, seeing glowing semi-transparent neon-red digital numbers "1200:00:00" hovering in his field of vision. Typical East Asian features: short black hair, slim build, focused anxious expression. Glitch aberration effect. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0` |
| `cg_beihai_assassination.png` | 章北海在太空中刺杀老专家 | 章北海 | `Epic sci-fi concept art, a determined East Asian Chinese male space officer in a futuristic white spacesuit, floating silently in hard vacuum outside a massive space station, aiming a silent gas-propelled pistol. Helmet visor reveals sharp resolute East Asian features: short black hair, stern eyes. Harsh sunlight, dark space. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0` |
| `cg_tyler_breached.png` | 面壁者泰勒被破壁人击碎心防 | 泰勒 (白人) | `Epic sci-fi concept art, a white Western man in his 60s (Frederick Taylor), sitting alone in despair on a desolate gray beach, looking at a holographic projection showing his wallfacer plan being crossed out in red. Caucasian features: gray receding hair, sharp Western facial structure. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0` |
| `cg_reydiaz_breached.png` | 面壁者雷迪亚兹在地下被破壁 | 雷迪亚兹 (拉美裔)| `Epic sci-fi concept art, a proud but broken Latin American male military general (Manuel Rey Diaz) in his 50s, standing in a massive underground bunker surrounded by blueprints of giant hydrogen bombs. Hispanic features: dark curly hair, olive skin, strong muscular build. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0` |
| `cg_thought_seal.png` | 希恩斯思想钢印机启动测试 | 军人 / 受试者 | `Epic sci-fi concept art, a male soldier strapped into a neural chair in a dimly lit medical laboratory, with a massive cybernetic helmet device emitting glowing golden holographic data streams directly into their eyes. Cold clinical blue-white lighting, volumetric fog. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0` |

*(其余 36 张场景类及中/低风险剧情 CG 的提示词，详见专述文档 [SPEC_20260622_ART_PROMPTS_GUIDE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260622_ART_PROMPTS_GUIDE.md))*

---

### 2.2 结局专属大画幅 CG (Ending CGs)
通关结算页面的专属原画，画幅为 **21:9**。

| 文件名 | 结局标题 | 视觉氛围定位 | 提示词主旨 (Craig Mullins 概念风格) |
| :--- | :--- | :--- | :--- |
| `ending_conquest.png` | 征服胜利 | 黑红橙金、铁血肃杀 | 庞大的深色宇宙舰队俯瞰并轰击着一颗火红的异星城市，大色块与光影撕裂。 |
| `ending_deterrence.png` | 威慑建立 | 黯蓝紫魅、冰冷平衡 | 巨大 monolithic 控制室中的慢画幅人影，窗外是悬停静止的无数三体战舰。 |
| `ending_dark_domain.png` | 黑域声明 | 极简深灰、永恒死寂 | 被漆黑、像扭曲黑洞一般的时空慢度黑域包围的太阳系，光线弯曲成琥珀色。 |
| `ending_wandering.png` | 流浪地球 | 冰蓝火焰、宏大流浪 | 行星引擎在雪白封冻的地球表面喷发出直插深空的湛蓝等离子体火柱。 |
| `ending_digital.png` | 数字永生 | 荧光深空、赛博几何 | 漂浮在虚无中的深蓝巨型芯片阵列，荧光青与洋红色的数字意识流倾泻而入。 |
| `ending_hidden.png` | 小宇宙避难 | 极简亮白、诗意生态 | 漂浮在无穷纯白虚无空间中的一颗直径数里、生机勃勃的微型蓝色生态球。 |
| `ending_neutral_eternal_exile.png` | 永恒的流亡 | 黯夜深蓝、无尽流落 | `Epic concept art, huge human spaceship fleet drifting through silent, dark, empty cosmic space, faint blue thruster trails, giant megastructure scale, deep blue and black colors...` |
| `ending_neutral_cosmic_silence.png` | 宇宙静默 | 灰黑死寂、星空墓碑 | `Epic concept art, peaceful and silent universe, small dormant spacecraft slowly fading into stardust, cosmic dust, deep slate grey and soft purple color scheme...` |

---

### 2.3 人物立绘与 NPC 头像 (Character Portraits)
采用 **工笔赛博风 (Gongbi Cyberpunk)**，统一分辨率与 3:4 纵横比，以羊皮纸色为底色。

#### 核心公式:
> `Gongbi Cyberpunk style (传统工笔赛博). Character profile: [人物描述 & 特征]. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric cyan/gold highlights. Flat 2D depth. No text. --ar 3:4`

#### 关键规约:
- **东亚华人角色**: 罗辑、程心、大史、叶文洁、章北海、汪淼、杨冬、丁仪、云天明、庄颜、关一帆、东方延绪、常伟思等 27 名角色，在生成时必须前置声明 `East Asian Chinese` 种族限制，避免白人化。
- **人物映射纠正**: `unified_shenyuan_*.png` 头像被绑定为**“沈渊”**（《中国太阳》中的男科学家），禁止与《三体》中的女学者“申玉菲”混杂。
- **NPC 职业分类头像**: 包含 `npc_scientist.png`, `npc_military_commander.png`, `npc_civilian.png`, `npc_engineer.png`, `npc_medic.png`, `npc_merchant.png`, `npc_official.png`, `npc_rebel.png`, `npc_ai_terminal.png`, `npc_comms_officer.png`, `npc_police.png`, `npc_politician.png`, `npc_refugee.png` 等13张，背景与工笔画风需与主人物立绘平滑对齐。

---

## 📅 三、 资源版本控制与维护日志

| 版本 | 日期 | 修改人/系统 | 变更说明 |
| :--- | :--- | :--- | :--- |
| **V1.0** | 2026-07-01 | Antigravity | 首次制定。合并并统一了 6 个纪元 BGM、10 类结局音乐及 P0/P1 美术事件 CG 规范。登记了 P0 核心华人角色重绘提示词。 |
