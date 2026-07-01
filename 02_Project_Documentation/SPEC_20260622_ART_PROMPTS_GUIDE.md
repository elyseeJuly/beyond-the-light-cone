# Beyond-the-Light-Cone Art & Generation Prompts Guide
> **文档编号**: SPEC_20260622_ART_PROMPTS_GUIDE  
> **更新日期**: 2026-06-22  
> **分类前缀**: `SPEC_` (技术设计与美术规范)  
> **文档版本**: V2.0  
> **说明**: 本文档整理了《Beyond-the-Light-Cone》重构版所需的所有核心美术资源（包括人物立绘、43个历史纪元/剧情事件CG以及17个结局CG）的生成提示词（Prompts）。

为了保证视觉的高度统一，本项目采用了双轨制美术风格：
1. **人物立绘**：工笔赛博风 (Gongbi Cyberpunk) - 突出东方底蕴与科幻的结合。
2. **全屏剧情/结局 CG**：极简巨物概念原画风 (Epic Concept Art) - 突出《三体》的宏大尺度、巨物压迫感以及电影级构图，同时作为背景完美融入 UI。

---

## 一、 人物立绘规范 (Gongbi Cyberpunk)

人物立绘要求背景干净（羊皮纸质感）、2D平涂、并带有发光的赛博义体或全息投影细节。

**基础公式**:
> Gongbi Cyberpunk style (传统工笔赛博). Character profile: [人物描述]. [服装与特征]. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric cyan/gold highlights. Flat 2D depth. No text. high quality, 4k. --ar 3:4

*示例（罗辑）*:
> Gongbi Cyberpunk style (传统工笔赛博). Character profile: Luo Ji, Wallfacer and cosmic sociologist. Disheveled, cynical, holding a lit cigarette, but with a sharp, profound gaze. Wearing a loose, traditional Hanfu-style coat mixed with glowing cybernetic circuitry. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric cyan/gold highlights. Flat 2D depth. No text. high quality, 4k. --ar 3:4

---

## 二、 43 个历史纪元与剧情事件 CG (Epic Concept Art)

用于游戏内触发的纪元时间线与重大剧情事件，使用 `Letterbox` 银幕遮幅UI，因此画幅必须是宽幅 (`--ar 21:9`)。

**基础公式**:
> Epic sci-fi concept art, [场景描述]. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

### 1. 危机纪元 (1-13)

#### 1.1 红岸基地建立 (`cg_red_shore_base.png`)
> Epic sci-fi concept art, a giant retro-style parabolic radar antenna dish towering over a snowy, windswept mountain peak in northeastern China. A dark night sky filled with stars. Volumetric mist, cold winter atmospheric lighting. Massive scale, macro vs micro. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.2 叶文洁发送信号 (`cg_yewenjie_signal.png`)
> Epic sci-fi concept art, a lone EAST ASIAN CHINESE female scientist in her 40s, standing in a massive dimly lit control room, pressing a glowing red button. She has typical East Asian features: black hair, dark brown eyes, gentle but determined facial structure, not wearing glasses. Outside the panoramic window, a colossal radar dish emits energy into the starry night sky. Dramatic shadow contrast, quiet determination. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 1.3 三体文明回复 (`cg_trisolaris_reply.png`)
> Epic sci-fi concept art, a primitive alien communication terminal in a dusty room, displaying a repeating flashing signal: 'DO NOT ANSWER!'. Green phosphor monitor glow casting eerie shadows on a cluttered desk with papers. Suspenseful, claustrophobic atmosphere. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.4 ETO 组织成立 (`cg_eto_founded.png`)
> Epic sci-fi concept art, a secretive assembly of people in dark robes standing in the grand, decaying hall of a massive, derelict cargo ship, the 'Judgment Day'. A large projection of a stylized three-body planet orbit symbol glowing on the wall. Dramatic low-key lighting, candlelight casting long shadows. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.5 智子展开 / 危机纪元开启 (`cg_crisis_start.png`)
> Epic sci-fi concept art, a colossal glowing geometric eye unfolding in the sky, covering the entire heavens above a dark modern city. Casting an eerie cyan light. Massive scale, macro vs micro. Tiny silhouettes of humans on rooftops looking up in absolute awe and despair. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style, dark and oppressive atmosphere. --ar 21:9 --style raw

#### 1.6 古筝行动 (`cg_guzheng.png`)
> Epic sci-fi concept art, a massive rusty oil tanker ship being sliced into perfectly parallel horizontal pieces by invisible strings, the hull sliding apart smoothly on the Panama Canal. Dense jungle environment, early morning mist. Tiny military helicopters hovering in the distance. Minimalist composition, expressive digital brushstrokes, dramatic tension, quiet destruction. Muted dark green and gray palette with subtle sparks of orange friction. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.7 杨冬自杀 (`cg_yangdong_suicide.png`)
> Epic sci-fi concept art, a beautiful tragic EAST ASIAN CHINESE young woman physicist in her late 20s, sitting on the edge of a balcony under a starry sky. She has delicate East Asian features: long black hair, pale skin, melancholic dark eyes. Next to her is a note: 'Physics has never existed.' Muted cold color palette, deep shadows, melancholic atmosphere. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 1.8 汪淼幽灵倒计时 (`cg_ghost_countdown.png`)
> Epic sci-fi concept art, an EAST ASIAN CHINESE male scientist in his 40s, wearing glasses, looking at a wall in a dark room, seeing glowing neon-red digits '1200:00:00' hovering. He has typical East Asian features: short black hair, slim build, focused anxious expression. Eerie paranoid atmosphere, digital aberration, cold shadows. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 1.9 章北海刺杀老专家 (`cg_beihai_assassination.png`)
> Epic sci-fi concept art, a determined EAST ASIAN CHINESE male space officer in a futuristic white spacesuit, floating silently in vacuum outside a massive orbital station, aiming a gas-propelled gun toward a shuttle window. He has sharp resolute East Asian features visible through the helmet visor. Blinding sunlight on metallic structures, deep space void. Ruthless determination. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 1.10 希恩斯思想钢印 (`cg_thought_seal.png`)
> Epic sci-fi concept art, a soldier strapped into a high-tech metallic chair in a dimly lit medical laboratory, with a massive cybernetic helmet emitting golden holographic data streams into their eyes. Cold clinical lighting, volumetric fog. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 1.11 泰勒破壁 (`cg_tyler_breached.png`)
> Epic sci-fi concept art, a WHITE WESTERN man in his 60s (Frederick Tyler, former US Secretary of Defense), sitting in despair on a desolate beach, looking at a holographic projection of his plan crossed out in red. He has Caucasian features: gray hair, sharp Western facial structure, wearing a dark business suit. Cold gray sea, melancholic lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 1.12 雷迪亚兹破壁 (`cg_reydiaz_breached.png`)
> Epic sci-fi concept art, a proud but broken LATIN AMERICAN male military general (Manuel Rey Diaz, Venezuelan president) in his 50s, standing in a massive underground bunker surrounded by hydrogen bomb blueprints. He has Hispanic features: dark hair, olive skin, strong build, wearing a military uniform. A holographic Wallbreaker silhouette points at him. High contrast dramatic lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 1.13 月球危机 (`cg_moon_crisis.png`)
> Epic sci-fi concept art, the moon breaking apart in Earth's orbit, massive rocky fragments with glowing orange cracks falling toward a dark Earth. Earth's surface covered with giant glowing cyan planetary defense antenna grids emitting holographic scan lines into the sky. Massive scale, cosmic disaster, dramatic contrast between dark space and warm debris fire. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

### 2. 大低谷与复兴纪元 (14-19)

#### 2.1 大低谷开始 (`cg_great_ravine.png`)
> Epic sci-fi concept art, a desolate, decaying megacity with collapsed skyscrapers and dusty orange skies. Crowds of desperate people in tattered clothes lining up outside a gargantuan metal rationing station. Heavy smog, dramatic cinematic lighting. Desolation, hopelessness. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 2.2 大低谷结束 (`cg_great_ravine_ended.png`)
> Epic sci-fi concept art, people emerging from underground domes into a futuristic clean city with towering white towers and green terraced gardens. Warm morning sunlight breaking through the clouds. Hope, rebirth, civilization. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 2.3 技术爆炸 / 恒星战舰成军 (`cg_tech_explosion.png`)
> Epic sci-fi concept art, a massive, shiny spaceship shipyard in Earth's orbit, surrounded by dozens of newly constructed warships glowing with blue fusion thrusters. Blinding sun reflections on silver hull surfaces. Extreme scale, tech leap, hope. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 2.4 流浪地球计划启动 (`cg_wandering_earth.png`)
> Epic sci-fi concept art, giant planetary engines built along the horizon of a snow-covered Earth, firing colossal columns of intense blue-white plasma thrust into the deep black space void. Massive megastructures, dramatic scale, cold white ground contrasted with brilliant warm and blue engine fires. Volumetric fog. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 2.5 智子锁死科学 / 智子双向封锁 (`cg_sophon_blockade.png`)
> Epic sci-fi concept art, a colossal glowing geometric proton unfolding in the sky, covering the entire heavens above a dark modern city. Casting an eerie red and purple light. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 2.6 三体技术交流开始 (`cg_tech_exchange.png`)
> Epic sci-fi concept art, human scientists and high-tech alien robotic drones working together inside a vast, sleek laboratory with glowing holographic diagrams of advanced physics. Warm yellow and cybernetic cyan lighting. Cooperation, hope. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

### 3. 末日战役与威慑纪元 (20-25)

#### 3.1 水滴抵近太阳系 (`cg_teardrop_probe.png`)
> Epic sci-fi concept art, a perfectly smooth, silver chrome teardrop-shaped probe floating silently in deep space. Reflecting distant starlight with absolute perfection. Ominous, silent vacuum. Massive scale contrast. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 3.2 末日战役 / 水滴摧毁人类舰队 (`cg_doomsday_battle.png`)
> Epic sci-fi concept art, a perfectly smooth, teardrop-shaped silver chrome object smashing effortlessly through a massive human space battleship in deep space. Absolute destruction, silent vacuum, debris flying, blinding explosions of orange and blue plasma. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 3.3 水滴袭击 / 舰队毁灭战 (`cg_droplet_attack.png`)
> Epic sci-fi concept art, a perfectly smooth, teardrop-shaped silver chrome object smashing effortlessly through a massive human space battleship in deep space. Absolute destruction, silent vacuum, debris flying, blinding explosions of orange and blue plasma. Massive scale, stark contrast between the flawless alien droplet and the burning complex human wreckage. Minimalist composition, expressive digital brushstrokes, stark cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 3.4 黑暗森林战役 / 星舰自相残杀 (`cg_dark_battle.png`)
> Epic sci-fi concept art, in the pitch-black void of deep space, a massive cruiser ship firing a silent, blinding beam of laser weapon into the reactor of another allied ship, causing a violent orange explosion. Cosmic coldness, betrayal, survival. Minimalist composition, stark contrast, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 3.5 黑暗森林威慑建立 (`cg_deterrence_established.png`)
> Epic sci-fi concept art, a desolate cemetery under a stormy twilight sky on Earth. In the center, an aging man in his late 50s holds a pistol pointed at his own chest with a firm, resolute expression. He is surrounded by thin, glowing red scanning laser grids intersecting from the sky. Cinematic high contrast, dramatic shadows, moody lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 3.6 执剑人交接仪式 (`cg_swordholder_handover.png`)
> Epic sci-fi concept art, an elderly man in a dark simple coat handing a glowing metallic button-device to a young, elegant woman in a white dress inside a giant, stark white cylindrical shaft. Volumetric shafts of light, solemn ceremonial atmosphere. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

### 4. 广播纪元与大移民 (26-33)

#### 4.1 执剑人交接失败 / 威慑中止 (`cg_deterrence_broken.png`)
> Epic sci-fi concept art, a colossal white gravitational broadcasting antenna tower collapsing on a misty mountaintop under a dark sky. A tiny, smooth, metallic teardrop-shaped alien droplet is diving downwards at extreme speed next to it. Sparks of yellow electricity and gray dust erupt from the structure. Cinematic framing, dramatic scale, sense of absolute panic and defeat. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 4.2 澳大利亚大移民 (`cg_australia_migration.png`)
> Epic sci-fi concept art, a million civilian transport ships landing on the red, dusty plains of the Australian outback. Thousands of refugees standing in long lines under a hot sunset lighting, despair. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 4.3 引力波宇宙广播启动 (`cg_gravitational_broadcast.png`)
> Epic sci-fi concept art, a futuristic space exploration ship "Gravity" activating its colossal circular gravitational wave antenna in deep space. The ring-shaped megastructure glows with a vibrant blue-cyan light, emitting faint concentric holographic wave rings into the star-studded black void. Cinematic lighting, vast scale of the cosmos. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 4.4 三体星系光粒摧毁 (`cg_trisolaris_destroyed.png`)
> Epic sci-fi concept art, in deep space, a tiny, blindingly white speck of light (photoid) piercing through a giant yellow star, causing the star to expand violently into a supernova, engulfing a nearby three-sun planet. Blinding light, cataclysmic cosmic explosion. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 4.5 三体第二舰队曲率逃离 (`cg_trisolaris_fleet_escaped.png`)
> Epic sci-fi concept art, hundreds of triangular alien warships warp-stretching into long beams of white light, leaving massive warped trails in the starry galaxy. Cosmic scale. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 4.6 维德星际政变 (`cg_wade_coup.png`)
> Epic sci-fi concept art, a determined man in a military coat standing on a balcony, looking at a private army of space soldiers surrounding a massive corporate skyscraper (Halo Group). Red alarm lights, rain pouring down. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 4.7 维德处决 (`cg_wade_executed.png`)
> Epic sci-fi concept art, a silhouetted man standing before a firing squad in a cold, monolithic concrete prison yard. Stark morning light casting long shadows, volumetric fog. Grim, solemn atmosphere. Minimalist composition. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 4.8 掩体与黑域辩论 / 掩体黑域讨论 (`cg_black_domain_debate.png`)
> Epic sci-fi concept art, the sun surrounded by a dark, swirling space-time distortion field that slows light. Swirling vortex of dark matter enclosing the solar system. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

### 5. 掩体纪元与流亡 (34-43)

#### 5.1 掩体世界落成 / 木星空间站城 (`cg_bunker_world.png`)
> Epic sci-fi concept art, a cluster of massive cylindrical space cities rotating slowly in the dark, frozen shadow of Jupiter. The gargantuan gas giant Jupiter and its swirling orange-red storms fill the entire background, glowing ominously. Faint glints of yellow sunlight hit the edge of the space cities. Tiny cyan trails of spacecraft. Massive scale megastructure, cosmic scale, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 5.2 星环号光速试航 (`cg_lightspeed_ship.png`)
> Epic sci-fi concept art, a sleek, futuristic human spacecraft tearing through the fabric of space, leaving a glowing, distorted spatial trail (death line) behind it. Interstellar travel. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 5.3 维度打击警报 / 奥尔特星云重力凹陷 (`cg_dimensional_warning.png`)
> Epic sci-fi concept art, a glowing, infinitely thin perfectly flat translucent slip of paper floating in the vast darkness of space, approaching a distant blue planet. Ominous cosmic horror. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 5.4 二向箔打击 / 太阳系二维化 (`cg_dimensional_strike.png`)
> Epic sci-fi concept art, a glowing, infinitely thin white rectangular slip of paper pulling entire planets and stars into a flattened 2D painting. Absolute cosmic horror. Swirling vortex of light and matter being violently flattened into two dimensions. Massive scale, extreme perspective. Minimalist composition, expressive digital brushstrokes, stark black background with blinding white and gold light. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 5.5 银河远征星舰启航 / 银河纪元逃亡 (`cg_galaxy_exodus.png`)
> Epic sci-fi concept art, a fleet of futuristic lightspeed spaceships flying away from a flattening 2D solar system into the deep galaxy. Swirling vortex of flattened matter in the background. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 5.6 冥王星博物馆 (`cg_pluto_museum.png`)
> Epic sci-fi concept art, an elderly man standing inside a vast, icy cave on Pluto, surrounded by relics of human history. Outside the cave mouth, a slow-moving flat wave of 2D space is engulfing the frozen landscape. Melancholic, peaceful memorial. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 5.7 太阳系二维化终局 (`cg_solar_system_flattened.png`)
> Epic sci-fi concept art, a single, tiny, spacecraft escaping at light-speed, leaving behind a perfectly flat, glowing two-dimensional plane that contains the flattened Sun and frozen planets, looking like a grand oil painting floating in the dark universe. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 5.8 银河纪元开启 (`cg_galaxy_era.png`)
> Epic sci-fi concept art, thousands of warp-drive starships leaving long cyan light-trails behind, traveling towards a massive, swirling spiral galaxy in deep space. In the foreground, a solar system is collapsing and flattening into a colorful, paper-thin two-dimensional glowing grid film. Melancholy, cinematic high contrast, dramatic lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 5.9 星屑纪元生存 (`cg_stardust_era.png`)
> Epic sci-fi concept art, a melancholic human colony built on a field of floating space debris, asteroids, and stardust islands in a cold, dim universe. Tiny dome cities and heavy fusion engines glowing with warm orange light on the floating rocks. In the distant background, a dying, fragmented galaxy is glowing with faint silver light. Post-apocalyptic space survival, lonely, high contrast, dramatic shadows. Minimalist composition, expressive brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

#### 5.10 归零者宇宙广播 (`cg_zeroer_broadcast.png`)
> Epic sci-fi concept art, a cosmic visualization of a universal broadcast, abstract glowing waves rippling across entire galaxies and nebulas. Profound, mysterious cosmic phenomenon. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

## 三、 17 个大结局 CG (Epic Concept Art)

游戏通关或失败结算流程中展示的专属结局 CG，图片命名格式为 `ending_[key].png`。

### 1. 胜利结局 (1-10)

#### 1.1 征服胜利 (`ending_conquest.png`)
> Epic sci-fi concept art, a massive dark human space fleet looming over a burning alien world. Imposing silhouetted battleships raining orbital strikes down on an unfamiliar ruined civilization. Red and gold fiery glows. Massive scale. Minimalist composition, expressive digital brushstrokes. Dark, triumphant but ruthless atmosphere. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.2 威慑建立胜利 (`ending_deterrence.png`)
> Epic sci-fi concept art, a solitary figure standing in a vast, dark, monolithic control room, hand resting near a glowing red button. In the background, a massive panoramic window shows thousands of suspended alien ships waiting in silent fear. Deep shadows, purple and cold blue tones. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.3 黑域声明胜利 (`ending_dark_domain.png`)
> Epic sci-fi concept art, the entire solar system encased in a slow-moving, distorted, obsidian-like barrier. Light bending around the system like a black hole. Silent, eternal preservation. Deep space, muted grays and blacks with a single faint glimmer of the trapped sun. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.4 流浪地球胜利 (`ending_wandering.png`)
> Epic sci-fi concept art, the Earth traveling through deep, empty interstellar space. Giant planetary engines shooting colossal pillars of blue plasma into the dark void. A trail of stardust behind the planet. Massive scale. Stark contrast between the warm Earth and the cold universe. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.5 数字意识网络永生胜利 (`ending_digital.png`)
> Epic sci-fi concept art, an infinitely complex, glowing neon-cyan megastructure server farm floating in the void of space. Streams of glowing light representing digitized human consciousness flowing into it. Cyberpunk aesthetic, abstract and geometric. Dark background, electric cyan and magenta highlights. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.6 小宇宙避难胜利 (`ending_hidden.png`)
> Epic sci-fi concept art, a tiny, glowing, perfect ecosystem sphere floating in an absolute, infinite white void. Inside the sphere is a beautiful blue planet and green fields. Poetic, surreal, peaceful but lonely. Minimalist composition, expressive digital brushstrokes. Golden and soft white lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.7 信号静默胜利 (`ending_signal_silenced.png`)
> Epic sci-fi concept art, a pristine Earth hidden safely in the dark cosmic forest. Silent radar arrays pointing at a quiet, starry night sky. Unexposed, peaceful preservation. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.8 提前威慑胜利 (`ending_early_deterrence.png`)
> Epic sci-fi concept art, massive human battleships and alien ships locked in a silent, tense standoff in deep space. A fragile balance of mutual assured destruction. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.9 光速流亡胜利 (`ending_lightspeed_exile.png`)
> Epic sci-fi concept art, multiple lightspeed ships traveling through a brilliant, distorted tunnel of light and stardust. Eternal journey into the unknown galaxy. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 1.10 银河公民胜利 (`ending_galactic_citizen.png`)
> Epic sci-fi concept art, a colossal, glowing alien megastructure and galactic hub in deep space, with diverse futuristic ships arriving. Humanity joining the galactic civilization. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

### 2. 中性结局 (11-12)

#### 2.1 永恒的流亡 (`ending_neutral_eternal_exile.png`)
> Epic concept art, huge human spaceship fleet drifting through silent, dark, empty cosmic space, faint blue thruster trails, giant megastructure scale, deep blue and black colors, atmospheric lighting, brush strokes, 21:9 aspect ratio

#### 2.2 宇宙静默 (`ending_neutral_cosmic_silence.png`)
> Epic concept art, peaceful and silent universe, small dormant spacecraft slowly fading into stardust, cosmic dust, deep slate grey and soft purple color scheme, cosmic solitude, brush strokes, 21:9 aspect ratio

---

### 3. 失败结局 (13-17)

#### 3.1 内部哗变终局失败 (`ending_defeat_treachery.png`)
> Epic sci-fi concept art, a massive, ruined human spaceport engulfed in riots and civil war. Burning ships, shattered glass, panicked silhouettes running. Total societal collapse. Deep reds and stark dark shadows. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 3.2 二维化坍缩灭绝终局失败 (`ending_defeat_extinction.png`)
> Epic sci-fi concept art, a desolate, completely frozen and dead Earth. Crumbled ruins of a once-great megacity covered in thick ice and snow under a dark, starless space. Absolute silence and extinction. Cold blues and stark whites. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 3.3 太阳氦闪毁灭终局失败 (`ending_defeat_helium_flash.png`)
> Epic sci-fi concept art, an overwhelming, blinding wave of pure white and yellow plasma erupting from the sun, instantly vaporizing a ruined Earth in the foreground. Absolute destruction, terrifying scale. Minimalist composition, expressive digital brushstrokes. Extremely bright, cinematic exposure. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 3.4 ETO 接管失败 (`ending_defeat_eto_dominion.png`)
> Epic sci-fi concept art, a ruined, subjugated Earth megacity under a massive glowing emblem of the Trisolaran fleet. Dark, oppressive authoritarian rule. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

#### 3.5 降维打击灭绝终局失败 (`ending_defeat_dimension_strike.png`)
> Epic sci-fi concept art, a glowing, infinitely thin white rectangular slip of paper pulling entire planets and stars into a flattened 2D painting. Absolute cosmic horror. Swirling vortex of light and matter being violently flattened into two dimensions. Massive scale, extreme perspective. Minimalist composition, expressive digital brushstrokes, stark black background with blinding white and gold light. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

## 四、 使用提示

如果是使用 Midjourney (推荐 v6.0 版本)，建议开启 `--style raw` 以获得更少的人工过度修饰，并得到更强的概念原画笔触感（对标 Craig Mullins 风格）。对于部分偏暗的场景，可以酌情增加 `high contrast, cinematic lighting` 权重。所有的 CG 图片在放入项目目录前，应该统一确保为超宽 21:9 画幅比例，以和游戏前端渲染引擎的 Letterbox pan-zoom 扫掠动效完美契合。
