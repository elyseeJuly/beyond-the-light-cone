# AUDIT_20260629_FULL_ART_ASSETS_AUDIT | 《光锥之外：纪元往事》全美术资源种族与风格审计报告

> **审计日期**: 2026-06-29  
> **分类前缀**: `AUDIT_` (审计与评估报告)  
> **审计范围**: `/03_Web_Rebuild/public/images/` 目录下全部 97 张美术资源  
> **审计重点**: 
> 1. CG中人物种族准确性（东亚华人角色是否被错误画为白种人）
> 2. 人物立绘风格统一性（是否符合工笔赛博风规范）
> 3. 美术资源质量一致性（分辨率、画幅、风格是否统一）

---

## 📊 一、资源盘点总览

| 资源类别 | 数量 | 文件大小范围 | 风格规范 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| **剧情事件CG** (`cg_*.png`) | 43张 | 61KB ~ 8.1MB | Epic Concept Art (21:9, Craig Mullins风) | ⚠️ 22张低质量 |
| **结局CG** (`ending_*.png`) | 17张 | 671KB ~ 8.0MB | Epic Concept Art (21:9) | ⚠️ 4张偏小 |
| **核心人物立绘** (`unified_*.png`) | 36张 | 762KB ~ 1.1MB | 工笔赛博风 (Gongbi Cyberpunk, 3:4) | ✅ 已统一前缀 |
| **NPC通用头像** (`npc_*.png`) | 13张 | 756KB ~ 1.1MB | 工笔赛博风 (3:4) | ✅ 已补全 |
| **封面/默认** | 3张 | 852KB ~ 1.4MB | - | ✅ 正常 |
| **总计** | **112张** | - | - | - |

---

## 🚨 二、CG资源审计 - 种族与质量问题

### 2.1 【P0 Critical】含关键人物的低分辨率CG - 种族错误高风险

以下CG**明确包含核心人物角色**，但文件大小仅为 90KB-128KB（正常应为6-8MB），极有可能是未按提示词规范正确生成的低质量占位图，**人物种族特征存在被错误描绘的高风险**：

| 序号 | 文件名 | 对应场景 | 应出现人物 | 预期种族/特征 | 文件大小 | 风险等级 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `cg_yewenjie_signal.png` | 叶文洁向宇宙发送信号 | 叶文洁 | **东亚华人女性**，中年科学家 | 117KB | 🔴 Critical |
| 2 | `cg_yangdong_suicide.png` | 杨冬自杀 | 杨冬 | **东亚华人女性**，年轻理论物理学家 | 91KB | 🔴 Critical |
| 3 | `cg_ghost_countdown.png` | 汪淼眼中的幽灵倒计时 | 汪淼 | **东亚华人男性**，纳米材料科学家 | 90KB | 🔴 Critical |
| 4 | `cg_beihai_assassination.png` | 章北海刺杀老航天专家 | 章北海 | **东亚华人男性**，太空军军官（穿太空服） | 115KB | 🔴 Critical |
| 5 | `cg_tyler_breached.png` | 泰勒被破壁 | 弗里德里克·泰勒 | **美国白人男性**，前美国国防部长 | 117KB | 🟠 High |
| 6 | `cg_reydiaz_breached.png` | 雷迪亚兹被破壁 | 曼努尔·雷迪亚兹 | **拉美裔男性**，委内瑞拉总统 | 128KB | 🟠 High |
| 7 | `cg_thought_seal.png` | 希恩斯思想钢印 | 士兵（测试对象） | 应为混合种族背景的军人 | 106KB | 🟡 Medium |

> [!WARNING]
> **核心问题**：这7张CG直接决定玩家对主要角色的第一印象。若低分辨率版本中叶文洁、杨冬、汪淼、章北海等东亚华人被AI生成为白人面孔，将严重破坏《三体》原作的中国语境与代入感。

### 2.2 【P1 High】含人群/间接人物的低质量CG

以下CG虽不聚焦单个人物，但包含人群或科学家群像，可能存在种族不统一问题：

| 序号 | 文件名 | 对应场景 | 问题 | 文件大小 |
| :--- | :--- | :--- | :--- | :--- |
| 8 | `cg_red_shore_base.png` | 红岸基地建立 | 雷达基地场景，可能含军人/工程师群像 | 120KB |
| 9 | `cg_trisolaris_reply.png` | 三体文明回复 | 监听室场景，含操作员人物 | 129KB |
| 10 | `cg_eto_founded.png` | ETO组织成立 |  Judgment Day号上的成员集会（含伊文斯等） | 128KB |
| 11 | `cg_great_ravine.png` | 大低谷开始 | 末日城市中的难民人群 | 134KB |
| 12 | `cg_great_ravine_ended.png` | 大低谷结束 | 复兴后走出地下的人群 | 165KB |
| 13 | `cg_tech_explosion.png` | 技术爆炸/恒星战舰成军 | 太空港中的技术人员 | 189KB |
| 14 | `cg_doomsday_battle.png` | 末日战役 | 战舰舰桥人员 | 152KB |
| 15 | `cg_dark_battle.png` | 黑暗战役 | 星舰舰员 | 110KB |
| 16 | `cg_tech_exchange.png` | 三体技术交流 | 人类科学家与三体机器人 | 128KB |
| 17 | `cg_australia_migration.png` | 澳大利亚大移民 | 难民长队 | 7.4MB ✅ |

### 2.3 【P1 High】无人物但风格/分辨率不达标的CG

以下CG主要为太空/场景画面，无核心人物，但分辨率极低导致风格与高画质CG严重割裂：

| 序号 | 文件名 | 场景描述 | 文件大小 |
| :--- | :--- | :--- | :--- |
| 18 | `cg_teardrop_probe.png` | 水滴探测器抵近 | 62KB |
| 19 | `cg_sophon_blockade.png` | 智子封锁科学 | 97KB |
| 20 | `cg_black_domain_debate.png` | 黑域/掩体辩论 | 78KB |
| 21 | `cg_lightspeed_ship.png` | 星环号光速试航 | 127KB |
| 22 | `cg_dimensional_warning.png` | 二向箔接近警报 | 61KB |
| 23 | `cg_galaxy_exodus.png` | 银河纪元逃亡 | 94KB |
| 24 | `cg_zeroer_broadcast.png` | 归零者宇宙广播 | 116KB |

### 2.4 ✅ 高质量CG（符合Epic Concept Art规范）

以下20张CG文件大小为 **6.3MB-8.1MB**，符合21:9宽屏高分辨率标准，属于正常版本：

| 序号 | 文件名 | 包含人物情况 | 大小 |
| :--- | :--- | :--- | :--- |
| 1 | `cg_crisis_start.png` | 人群仰望智子 | 6.6MB |
| 2 | `cg_guzheng.png` | 古筝行动（无人近景） | 6.2MB |
| 3 | `cg_moon_crisis.png` | 月球危机（宏观场景） | 7.4MB |
| 4 | `cg_wandering_earth.png` | 流浪地球（宏观场景） | 6.8MB |
| 5 | `cg_droplet_attack.png` | 水滴袭击（无人近景） | 7.2MB |
| 6 | **`cg_deterrence_established.png`** | **罗辑（老年东亚华人男性）持枪对峙** | 7.2MB |
| 7 | `cg_deterrence_broken.png` | 引力波天线倒塌（无人） | 6.7MB |
| 8 | `cg_gravitational_broadcast.png` | 引力波广播启动（无人） | 8.1MB |
| 9 | `cg_bunker_world.png` | 掩体世界（宏观场景） | 6.4MB |
| 10 | **`cg_swordholder_handover.png`** | **罗辑→程心交接（均为东亚华人）** | 6.8MB |
| 11 | **`cg_wade_coup.png`** | **维德（白人男性）阳台演说** | 8.0MB |
| 12 | **`cg_wade_executed.png`** | **维德（白人男性剪影）被处决** | 6.6MB |
| 13 | **`cg_pluto_museum.png`** | **罗辑（老年东亚华人）守墓** | 7.8MB |
| 14 | `cg_trisolaris_destroyed.png` | 三体星毁灭（无人） | 7.2MB |
| 15 | `cg_trisolaris_fleet_escaped.png` | 三体舰队逃离（无人） | 7.1MB |
| 16 | `cg_solar_system_flattened.png` | 太阳系二维化（无人） | 6.8MB |
| 17 | `cg_galaxy_era.png` | 银河纪元开启（无人） | 7.5MB |
| 18 | `cg_stardust_era.png` | 星屑纪元（无人） | 7.1MB |
| 19 | `cg_dimensional_strike.png` | 二向箔打击（无人） | 6.3MB |

---

## 👤 三、人物立绘审计 - 风格统一性与种族还原度

### 3.1 立绘整体状态

全部36位核心角色已迁移至 `unified_*` 工笔赛博风格立绘，不存在早期 `character_*` 遗留资产。立绘分三批生成，存在代际差异：

| 批次 | 生成时间 | 角色数量 | 代表角色 | 已知问题状态 |
| :--- | :--- | :--- | :--- | :--- |
| 第一批 | 2026-05-25 20:46 | 21个 | 罗辑、叶文洁、大史、程心、维德等 | ⚠️ 部分存在古装/乱码 |
| 第二批 | 2026-06-05 17:00 | 5个 | 霍金、华华、萨伊、严井、伊依 | ✅ 补全5个遗留角色 |
| 第三批 | 2026-06-15 10:20-11:20 | 10个重绘 | 章北海、丁仪、杨冬、庄颜、云天明、艾AA、泰勒等 | ✅ 修复古装/乱码/畸变 |

### 3.2 【P0 Critical】需种族准确性验证的东亚华人角色

以下角色**必须**是东亚华人面孔，需视觉确认是否被错误描绘为高加索/白人特征：

| 序号 | 角色名 | 文件名 | 生成批次 | 预期种族特征 | 验证状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **罗辑** | `unified_luoji_1778921262534.png` | 第一批 | 东亚华人男性，从颓废青年到老年执剑人 | ⚠️ 待视觉验证 |
| 2 | **叶文洁** | `unified_yewenjie_1778921299091.png` | 第一批 | 东亚华人女性，从青年到老年红岸统帅 | ⚠️ 待视觉验证 |
| 3 | **程心** | `unified_chengxin_1778921400346.png` | 第一批 | 东亚华人女性，年轻航天工程师 | ⚠️ 待视觉验证 |
| 4 | **史强（大史）** | `unified_dashi_1778921331273.png` | 第一批 | 东亚华人男性，粗犷壮硕的警察 | ⚠️ 待视觉验证 |
| 5 | **章北海** | `unified_beihai_1778921366897.png` | 第三批(重绘) | 东亚华人男性，坚毅太空军军官 | ⚠️ 待视觉验证 |
| 6 | **汪淼** | `unified_wangmiao_1779691527760.png` | 第一批 | 东亚华人男性，戴眼镜的纳米科学家 | ⚠️ 待视觉验证 |
| 7 | **杨冬** | `unified_yangdong_1779691583143.png` | 第三批(重绘) | 东亚华人女性，清冷的理论物理学家 | ⚠️ 待视觉验证 |
| 8 | **丁仪** | `unified_dingyi_1779691512032.png` | 第三批(重绘) | 东亚华人男性，狂放不羁的物理学家 | ⚠️ 待视觉验证 |
| 9 | **云天明** | `unified_tianming_1778921470963.png` | 第三批(重绘) | 东亚华人男性，忧郁的童话创作者 | ⚠️ 待视觉验证 |
| 10 | **庄颜** | `unified_zhuangyan_1779712921189.png` | 第三批(重绘) | 东亚华人女性，纯净东方古典气质 | ⚠️ 待视觉验证 |
| 11 | **艾AA** | `unified_aiaa_1779691888124.png` | 第三批(重绘) | 东亚华人女性，灵动活泼的年轻博士 | ⚠️ 待视觉验证 |
| 12 | **林云** | `unified_linyun_1779691542667.png` | 第一批 | 东亚华人女性，冷峻女军官 | ⚠️ 待视觉验证 |
| 13 | **东方延绪** | `unified_dongfang_1779691773663.png` | 第一批 | 东亚华人女性，太空舰舰长 | ⚠️ 待视觉验证 |
| 14 | **常伟思** | `unified_changweisi_1779691759159.png` | 第一批 | 东亚华人男性，稳重的将军 | ⚠️ 待视觉验证 |
| 15 | **雷志成** | `unified_leizhicheng_1779713006589.png` | 第一批 | 东亚华人男性，红岸基地政委 | ⚠️ 待视觉验证 |
| 16 | **杨卫宁** | `unified_yangweining_1779713020653.png` | 第一批 | 东亚华人男性，红岸基地总工程师 | ⚠️ 待视觉验证 |
| 17 | **白冰** | `unified_baibing_1779713036549.png` | 第一批 | 东亚华人男性，考古/未来学者 | ⚠️ 待视觉验证 |
| 18 | **苗福全** | `unified_miaofuquan_1779713095135.png` | 第一批 | 东亚华人男性，老派富商/煤老板 | ⚠️ 待视觉验证 |
| 19 | **滑膛** | `unified_huatang_1779713110568.png` | 第三批(重绘) | 东亚华人男性，冷冽职业杀手 | ⚠️ 待视觉验证 |
| 20 | **朱汉扬** | `unified_zhuhanyang_1779713125007.png` | 第一批 | 东亚华人男性，未来城市/太空官员 | ⚠️ 待视觉验证 |
| 21 | **严井** | `unified_yanjing_1780649978771.png` | 第二批 | 东亚华人男性（原著人物） | ⚠️ 待视觉验证 |
| 22 | **伊依** | `unified_yiyi_1780649999542.png` | 第二批 | 东亚华人男性，诗人/学者 | ⚠️ 待视觉验证 |
| 23 | **华华** | `unified_huahua_1780649946315.png` | 第二批 | 东亚华人角色（中国太阳/乡村教师相关） | ⚠️ 待视觉验证 |
| 24 | **水娃** | `unified_shuiwa_1779712987486.png` | 第一批 | 东亚华人男性（中国太阳主角） | ⚠️ 待视觉验证 |
| 25 | **沈渊/申玉菲** | `unified_shenyuan_1779691919176.png` | 第三批(重绘) | 命名存疑：沈渊是男/申玉菲是女 | ⚠️ 人物混淆需核查 |
| 26 | **关一帆** | `unified_guanyifan_1779691901857.png` | 第三批(重绘) | 东亚华人男性，宇宙学家 | ⚠️ 待视觉验证 |
| 27 | **刘慈欣** | `unified_liucixin_1779712937103.png` | 第一批 | 东亚华人男性，作者本人形象 | ⚠️ 待视觉验证 |

### 3.3 非华人角色 - 种族特征对照参考

以下角色应为特定非华人种族，可作为画风基准参考：

| 序号 | 角色名 | 文件名 | 预期种族 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 托马斯·维德 | `unified_wade_1778921437022.png` | **白人男性** | 激进的PIA局长，美国人 |
| 2 | 麦克·伊文斯 | `unified_evans_1779691557999.png` | **白人男性** | ETO降临派领袖，美国人 |
| 3 | 比尔·希恩斯 | `unified_hines_1779691718751.png` | **白人男性** | 面壁者，英国神经科学家 |
| 4 | 弗里德里克·泰勒 | `unified_tyler_1779691745991.png` | **白人男性** | 面壁者，前美国国防部长 |
| 5 | 曼努尔·雷迪亚兹 | `unified_reydiaz_1779691732536.png` | **拉美裔男性** | 面壁者，委内瑞拉总统 |
| 6 | 山杉惠子 | `unified_keiko_1779713141458.png` | **日本女性** | 希恩斯之妻，破壁人 |
| 7 | 智子 | `unified_sophon_1778921509458.png` | **日本女性形象** | 人形智子，和服/日式未来装 |
| 8 | 斯蒂芬·霍金 | `unified_hawking_1780649926625.png` | **白人男性** | 物理学家（轮椅） |
| 9 | 萨伊 | `unified_say_1780649885202.png` | **黑人女性** | 联合国秘书长 |

> [!NOTE]
> **验证方法建议**：以维德、伊文斯、希恩斯、雷迪亚兹、萨伊等明确非华人角色的立绘作为"白种人/黑人/拉美裔"画风基准，对比检查上述27位东亚华人角色是否呈现了过强的高加索人种特征（如深眼窝、高鼻梁、金发/浅发色、过于立体的面部轮廓等）。

### 3.4 【P1 High】沈渊/申玉菲人物混淆问题

根据 [EXEC_20260615_CHARACTER_ART_REMEDIATION_V2.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260615_CHARACTER_ART_REMEDIATION_V2.md) 第29行记载：

> **申玉菲 (Shen Yufei)** `unified_shenyuan_1779691919176.png`
> 性别完全错乱，原本的高冷女物理学家被画成了"戴眼镜的中年男人"...

但 [persons.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/data/persons.json) 中：
- `shenyuan` 对应的角色名是 **"沈渊"**（第69-78行），这是《三体》或其他刘慈欣作品中的男性角色

**存在两种可能的问题：**
1. **文件命名错误**：原本为申玉菲（女）生成的立绘被错误命名为 `shenyuan`（沈渊）
2. **人物映射错误**：`persons.json` 中的沈渊应该是申玉菲，或反之

**需核查**：游戏中是否同时存在沈渊和申玉菲两个角色？当前36个unified头像中只有一个对应 `shenyuan`。

### 3.5 NPC通用头像状态（已基本统一）

13张NPC头像已按工笔赛博风规范生成：
- 6月12日第一批10个：scientist, military_commander, civilian, engineer, medic, merchant, official, rebel, ai_terminal, comms_officer
- 6月21日补全3个：police, politician, refugee（根据EXEC_20260621报告补全）

所有NPC头像文件大小在 756KB-1.1MB，与unified_人物立绘一致，风格应已统一。

---

## 🖼️ 四、结局CG状态

| 结局类别 | 高质量（>6MB） | 较小（<800KB） | 问题 |
| :--- | :--- | :--- | :--- |
| 胜利结局 | conquest, deterrence, dark_domain, wandering, digital, hidden, lightspeed_exile, galactic_citizen | signal_silenced (671KB), early_deterrence (675KB) | 两张较小但无核心人物 |
| 中性结局 | - | neutral_cosmic_silence (795KB), neutral_eternal_exile (721KB) | 无近景人物，为场景氛围图 |
| 失败结局 | defeat_treachery, defeat_extinction, defeat_helium_flash, defeat_eto_dominion, defeat_dimension_strike | - | 均为6.3MB-7.2MB |

> 结局CG以宏大场景为主，较少近景人物，种族问题风险相对较低。

---

## 🛠️ 五、修复优先级与建议方案

### P0 - 必须立即重绘（含核心人物的低质量CG）

**7张关键人物CG必须使用正确提示词重新生成**，确保叶文洁、杨冬、汪淼、章北海等东亚华人角色呈现正确的东亚人种特征：

**重绘提示词规范（必须在提示词中显式声明种族）：**

1. **叶文洁发送信号** (`cg_yewenjie_signal.png`)：
   ```
   Epic sci-fi concept art, a lone EAST ASIAN CHINESE female scientist in her 40s, standing in a massive dimly lit control room, pressing a glowing red button. She has typical East Asian features: black hair, dark brown eyes, gentle but determined facial structure. Outside the panoramic window, a colossal radar dish emits energy into the starry night sky. Dramatic shadow contrast, quiet determination. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
   ```

2. **杨冬自杀** (`cg_yangdong_suicide.png`)：
   ```
   Epic sci-fi concept art, a beautiful tragic EAST ASIAN CHINESE young woman physicist in her late 20s, sitting on the edge of a balcony under a starry sky. She has delicate East Asian features: long black hair, pale skin, melancholic dark eyes. Next to her is a note: 'Physics has never existed.' Muted cold color palette, deep shadows, melancholic atmosphere. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
   ```

3. **汪淼幽灵倒计时** (`cg_ghost_countdown.png`)：
   ```
   Epic sci-fi concept art, an EAST ASIAN CHINESE male scientist in his 40s, wearing glasses, looking at a wall in a dark room, seeing glowing neon-red digits '1200:00:00' hovering. He has typical East Asian features: short black hair, slim build, focused anxious expression. Eerie paranoid atmosphere, digital aberration, cold shadows. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
   ```

4. **章北海刺杀** (`cg_beihai_assassination.png`)：
   ```
   Epic sci-fi concept art, a determined EAST ASIAN CHINESE male space officer in a futuristic white spacesuit, floating silently in vacuum outside a massive orbital station, aiming a gas-propelled gun toward a shuttle window. He has sharp resolute East Asian features visible through the helmet visor. Blinding sunlight on metallic structures, deep space void. Ruthless determination. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
   ```

5. **泰勒破壁** (`cg_tyler_breached.png`) - 白人角色：
   ```
   Epic sci-fi concept art, a WHITE WESTERN man in his 60s (Frederick Taylor, former US Secretary of Defense), sitting in despair on a desolate beach, looking at a holographic projection of his plan crossed out in red. He has Caucasian features: gray hair, sharp Western facial structure, wearing a dark business suit. Cold gray sea, melancholic lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
   ```

6. **雷迪亚兹破壁** (`cg_reydiaz_breached.png`) - 拉美裔角色：
   ```
   Epic sci-fi concept art, a proud but broken LATIN AMERICAN male military general (Manuel Rey Diaz, Venezuelan president) in his 50s, standing in a massive underground bunker surrounded by hydrogen bomb blueprints. He has Hispanic features: dark hair, olive skin, strong build, wearing a military uniform. A holographic Wallbreaker silhouette points at him. High contrast dramatic lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
   ```

7. **思想钢印** (`cg_thought_seal.png`)：
   ```
   Epic sci-fi concept art, a soldier (ambiguous/diverse ethnicity) strapped into a high-tech metallic chair in a dimly lit medical laboratory, with a massive cybernetic helmet emitting golden holographic data streams into their eyes. Cold clinical lighting, volumetric fog. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
   ```

### P1 - 第二批重绘（其他低质量CG）

其余17张低质量CG（61KB-189KB）在P0完成后按批次重绘，确保统一为6-8MB高质量、21:9 Craig Mullins风格。涉及人群场景的CG，应确保画面中大多数人物呈现东亚人特征（符合三体故事以中国为主视角的设定）。

### P2 - 人物立绘验证

对36张统一立绘进行**人工视觉验证**：
1. 以维德（白人）、萨伊（黑人）、雷迪亚兹（拉美裔）作为基准
2. 逐一检查27位东亚华人角色是否具有正确的东亚人种特征（黑发、深色眼睛、较为平的面部轮廓、适中的鼻梁等）
3. 核查沈渊/申玉菲的人物映射问题
4. 确认6月15日重绘的10个角色已正确修复古装、乱码、畸变问题

---

## 📋 六、审计结论

### 问题统计

| 问题等级 | 数量 | 说明 |
| :--- | :--- | :--- |
| 🔴 P0 Critical | 7 | 含核心人物的低质量CG，种族错误风险极高 |
| 🟠 P1 High | 17 | 其他低质量CG + 立绘种族待验证 + 人物命名混淆 |
| 🟡 P2 Medium | 4 | 结局CG分辨率偏小，但无近景人物 |
| ✅ 正常 | 65 | 高质量CG + 已统一立绘 + NPC头像 |

### 核心发现

1. **CG资源质量两极分化严重**：约半数CG（22/43）为61KB-189KB的低分辨率版本，与另外21张6-8MB的高质量CG形成鲜明对比
2. **关键人物CG风险最高**：叶文洁、杨冬、汪淼、章北海四位核心华人角色的出场CG均为低质量版本，极有可能被AI生成时默认画为白人面孔
3. **人物立绘已统一前缀但需视觉验证**：36个unified_头像文件名已统一，但像素级的种族准确性、沈渊/申玉菲混淆问题仍需人工确认
4. **NPC头像已完成补全**：13个NPC头像已按工笔赛博风生成，风格一致性较好

### 建议执行顺序

1. **第一阶段**：使用包含明确种族描述（"EAST ASIAN CHINESE"）的提示词重绘7张P0级人物CG
2. **第二阶段**：重绘其余17张P1低质量CG
3. **第三阶段**：人工逐一验证36张人物立绘的种族特征和人设准确性
4. **第四阶段**：清理冗余文件，更新资产清单，提交PR

---

## 📎 附录：美术资源文件时间线

| 日期 | 事件 | 影响资产 |
| :--- | :--- | :--- |
| 2026-05-25 | 第一批unified_立绘生成 | 21个核心角色头像 |
| 2026-06-05 | 遗留5角色重绘（第二批unified_） | 霍金、华华、萨伊、严井、伊依 |
| 2026-06-12 | 第一批10个NPC头像生成 | npc_scientist等10张 |
| 2026-06-12 | 部分高质量CG生成 | cg_gravitational_broadcast等 |
| 2026-06-15 | 第三批立绘重绘 | 艾AA、章北海、丁仪、杨冬、庄颜等10个 |
| 2026-06-16 | 批量低质量CG生成（问题批次） | 22张61KB-189KB的CG |
| 2026-06-21 | 补全3个缺失NPC头像 | npc_police, politician, refugee |
