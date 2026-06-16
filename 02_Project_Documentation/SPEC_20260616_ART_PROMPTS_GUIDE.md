# LegendOfUni Art & Generation Prompts Guide

这份文档整理了《LegendOfUni》重构版所需的所有核心美术资源的生成提示词（Prompts）。
为了保证视觉的高度统一，本项目采用了双轨制美术风格：
1. **人物立绘**：工笔赛博风 (Gongbi Cyberpunk) - 突出东方底蕴与科幻的结合。
2. **全屏剧情/结局 CG**：极简巨物概念原画风 (Epic Concept Art) - 突出《三体》的宏大尺度、巨物压迫感以及电影级构图，同时作为背景完美融入 UI。

---

## 一、 人物立绘 (Gongbi Cyberpunk)
人物立绘要求背景干净（羊皮纸质感）、2D平涂、并带有发光的赛博义体或全息投影细节。

**基础公式**:
> Gongbi Cyberpunk style (传统工笔赛博). Character profile: [人物描述]. [服装与特征]. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric cyan/gold highlights. Flat 2D depth. No text. high quality, 4k. --ar 3:4

*示例（罗辑）*:
> Gongbi Cyberpunk style (传统工笔赛博). Character profile: Luo Ji, Wallfacer and cosmic sociologist. Disheveled, cynical, holding a lit cigarette, but with a sharp, profound gaze. Wearing a loose, traditional Hanfu-style coat mixed with glowing cybernetic circuitry. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric cyan/gold highlights. Flat 2D depth. No text. high quality, 4k. --ar 3:4

---

## 二、 核心历史节点 CG (Epic Concept Art)
用于游戏内触发的重大历史事件，使用 `Letterbox` 银幕遮幅UI，因此画幅必须是宽幅 (`--ar 21:9`)。

**基础公式**:
> Epic sci-fi concept art, [场景描述]. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

### 1. 智子展开 / 危机纪元开启 (cg_crisis_start.png)
> Epic sci-fi concept art, a colossal glowing geometric eye unfolding in the sky, covering the entire heavens above a dark modern city. Casting an eerie cyan light. Massive scale, macro vs micro. Tiny silhouettes of humans on rooftops looking up in absolute awe and despair. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style, dark and oppressive atmosphere. --ar 21:9 --style raw

### 2. 古筝行动 (cg_guzheng.png)
> Epic sci-fi concept art, a massive rusty oil tanker ship being sliced into perfectly parallel horizontal pieces by invisible strings, the hull sliding apart smoothly on the Panama Canal. Dense jungle environment, early morning mist. Tiny military helicopters hovering in the distance. Minimalist composition, expressive digital brushstrokes, dramatic tension, quiet destruction. Muted dark green and gray palette with subtle sparks of orange friction. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 3. 月球危机 (cg_moon_crisis.png)
> Epic sci-fi concept art, the moon breaking apart in Earth's orbit, massive rocky fragments with glowing orange cracks falling toward a dark Earth. Earth's surface covered with giant glowing cyan planetary defense antenna grids emitting holographic scan lines into the sky. Massive scale, cosmic disaster, dramatic contrast between dark space and warm debris fire. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 4. 流浪地球 (cg_wandering_earth.png)
> Epic sci-fi concept art, giant planetary engines built along the horizon of a snow-covered Earth, firing colossal columns of intense blue-white plasma thrust into the deep black space void. Massive megastructures, dramatic scale, cold white ground contrasted with brilliant warm and blue engine fires. Volumetric fog. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 5. 二向箔打击 / 太阳系二维化 (cg_dimensional_strike.png)
> Epic sci-fi concept art, a glowing, infinitely thin white rectangular slip of paper pulling entire planets and stars into a flattened 2D painting. Absolute cosmic horror. Swirling vortex of light and matter being violently flattened into two dimensions. Massive scale, extreme perspective. Minimalist composition, expressive digital brushstrokes, stark black background with blinding white and gold light. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

## 三、 其他重大条件/剧情事件 CG (Epic Concept Art)
这些事件并非固定在特定年份触发，而是根据玩家的选择或发展状况触发。

### 1. 水滴摧毁舰队 / 末日战役
> Epic sci-fi concept art, a perfectly smooth, teardrop-shaped silver chrome object smashing effortlessly through a massive human space battleship in deep space. Absolute destruction, silent vacuum, debris flying, blinding explosions of orange and blue plasma. Massive scale, stark contrast between the flawless alien droplet and the burning complex human wreckage. Minimalist composition, expressive digital brushstrokes, stark cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 2. 掩体计划 / 木星城
> Epic sci-fi concept art, a sprawling dark metallic space megacity clinging to the shadow side of Jupiter. The gargantuan swirling atmosphere and the Great Red Spot of Jupiter fills the entire background, glowing ominously. Massive scale megastructure, tiny glowing blue engine trails of spacecrafts. Minimalist composition, expressive digital brushstrokes. Dark, atmospheric, cosmic isolation, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

## 四、 大结局 CG (Epic Concept Art)
《LegendOfUni》共有 9 种结局，每种结局在结束流程中会展示一张专属的全景 CG。风格与核心历史节点保持一致。
生成后重命名为 `ending_[名字].png`，放入 `03_Web_Rebuild/public/images/` 即可。

### 1. 征服胜利 (Conquest)
> Epic sci-fi concept art, a massive dark human space fleet looming over a burning alien world. Imposing silhouetted battleships raining orbital strikes down on an unfamiliar ruined civilization. Red and gold fiery glows. Massive scale. Minimalist composition, expressive digital brushstrokes. Dark, triumphant but ruthless atmosphere. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 2. 威慑胜利 (Deterrence)
> Epic sci-fi concept art, a solitary figure standing in a vast, dark, monolithic control room, hand resting near a glowing red button. In the background, a massive panoramic window shows thousands of suspended alien ships waiting in silent fear. Deep shadows, purple and cold blue tones. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 3. 黑域胜利 (Dark Domain)
> Epic sci-fi concept art, the entire solar system encased in a slow-moving, distorted, obsidian-like barrier. Light bending around the system like a black hole. Silent, eternal preservation. Deep space, muted grays and blacks with a single faint glimmer of the trapped sun. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 4. 流浪胜利 (Wandering)
> Epic sci-fi concept art, the Earth traveling through deep, empty interstellar space. Giant planetary engines shooting colossal pillars of blue plasma into the dark void. A trail of stardust behind the planet. Massive scale. Stark contrast between the warm Earth and the cold universe. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 5. 数字永生胜利 (Digital)
> Epic sci-fi concept art, an infinitely complex, glowing neon-cyan megastructure server farm floating in the void of space. Streams of glowing light representing digitized human consciousness flowing into it. Cyberpunk aesthetic, abstract and geometric. Dark background, electric cyan and magenta highlights. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 6. 小宇宙胜利 (Hidden)
> Epic sci-fi concept art, a tiny, glowing, perfect ecosystem sphere floating in an absolute, infinite white void. Inside the sphere is a beautiful blue planet and green fields. Poetic, surreal, peaceful but lonely. Minimalist composition, expressive digital brushstrokes. Golden and soft white lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 7. 文明崩溃失败 (Defeat: Treachery)
> Epic sci-fi concept art, a massive, ruined human spaceport engulfed in riots and civil war. Burning ships, shattered glass, panicked silhouettes running. Total societal collapse. Deep reds and stark dark shadows. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 8. 文明灭绝失败 (Defeat: Extinction)
> Epic sci-fi concept art, a desolate, completely frozen and dead Earth. Crumbled ruins of a once-great megacity covered in thick ice and snow under a dark, starless space. Absolute silence and extinction. Cold blues and stark whites. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 9. 太阳氦闪失败 (Defeat: Helium Flash)
> Epic sci-fi concept art, an overwhelming, blinding wave of pure white and yellow plasma erupting from the sun, instantly vaporizing a ruined Earth in the foreground. Absolute destruction, terrifying scale. Minimalist composition, expressive digital brushstrokes. Extremely bright, cinematic exposure. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

**使用提示**：
如果是使用 Midjourney，建议开启 `--style raw` 以获得更少的AI过度修饰，并得到更强的绘画/原画笔触感。对于部分过暗的场景，可酌情增加 `high contrast, cinematic lighting` 权重。
