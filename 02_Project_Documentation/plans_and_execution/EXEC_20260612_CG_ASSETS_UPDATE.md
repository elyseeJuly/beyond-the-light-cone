# EXEC_20260612_CG_ASSETS_UPDATE | 剧情与结局 CG 美术资源更新及 UI 重构执行报告

> **执行日期**: 2026-06-12  
> **执行人**: Antigravity  
> **涉及目录**:  
> - 资源路径: `03_Web_Rebuild/public/images/`  
> - 代码文件: `03_Web_Rebuild/src/components/ending/EndingCinematic.tsx`, `03_Web_Rebuild/src/core/GameEventManager.ts`  
> - 文档路径: `02_Project_Documentation/`  

---

## 📖 一、 背景与升级目的

在《宇宙群英传：三体重构》的美术资源审计中，发现之前的 CG 资源存在以下核心隐患：
1. **剧情 CG 错位 (张冠李戴)**: 旧版的 `cg_moon_crisis.png` (月球危机) 误用了“水滴袭击战舰”的图，而 `cg_wandering_earth.png` (流浪地球) 误用了“木星太空掩体城”的图。
2. **剧情 CG 空引 (缺失)**: 游戏代码已实现了对末日战役、威慑建立、引力波宇宙广播等 5 个高光条件的路由，但磁盘中无物理文件，只能加载 Placeholder 占位图。
3. **大结局 CG 体验差**: 原有大结局图片为 1024x1024 正方形占位图，与游戏 Letterbox 21:9 的超宽屏电影感极不匹配，且结局渲染 UI 没有特效配合。

**本期执行成果**:
1. 完成了全部 10 张主线/条件剧情 CG 的重绘、修正与实装（21:9 比例）。
2. 完成了全部 9 张大结局 CG 的超宽幅（21:9 比例）替换入库与重命名。
3. 重构了大结局演绎组件 `EndingCinematic.tsx`，实现了电影级全屏推拉效果与流光粒子置顶。

---

## 🎨 二、 10 大剧情 CG 更新明细与提示词

主线与高光剧情 CG 统一采用 **极简巨物概念原画风 (Epic Concept Art)**。

### 1. 智子展开 / 危机纪元开启 (`cg_crisis_start.png`)
*   **触发节点**: 游戏 Year 0（开局）
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a colossal glowing geometric eye unfolding in the sky, covering the entire heavens above a dark modern city. Casting an eerie cyan light. Massive scale, macro vs micro. Tiny silhouettes of humans on rooftops looking up in absolute awe and despair. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style, dark and oppressive atmosphere. --ar 21:9 --style raw

### 2. 古筝行动 (`cg_guzheng.png`)
*   **触发节点**: 游戏 Year 2
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a massive rusty oil tanker ship being sliced into perfectly parallel horizontal pieces by invisible strings, the hull sliding apart smoothly on the Panama Canal. Dense jungle environment, early morning mist. Tiny military helicopters hovering in the distance. Minimalist composition, expressive digital brushstrokes, dramatic tension, quiet destruction. Muted dark green and gray palette with subtle sparks of orange friction. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 3. 月球危机 (`cg_moon_crisis.png`) — *已纠正*
*   **触发节点**: 游戏 Year 50
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, the moon breaking apart in Earth's orbit, massive rocky fragments with glowing orange cracks falling toward a dark Earth. Earth's surface covered with giant glowing cyan planetary defense antenna grids emitting holographic scan lines into the sky. Massive scale, cosmic disaster, dramatic contrast between dark space and warm debris fire. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 4. 流浪地球计划 (`cg_wandering_earth.png`) — *已纠正*
*   **触发节点**: 游戏 Year 300
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, giant planetary engines built along the horizon of a snow-covered Earth, firing colossal columns of intense blue-white plasma thrust into the deep black space void. Massive megastructures, dramatic scale, cold white ground contrasted with brilliant warm and blue engine fires. Volumetric fog. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 5. 二向箔打击 / 太阳系二维化 (`cg_dimensional_strike.png`)
*   **触发节点**: 太阳系被打击警报/降维触发
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a glowing, infinitely thin white rectangular slip of paper pulling entire planets and stars into a flattened 2D painting. Absolute cosmic horror. Swirling vortex of light and matter being violently flattened into two dimensions. Massive scale, extreme perspective. Minimalist composition, expressive digital brushstrokes, stark black background with blinding white and gold light. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 6. 水滴袭击 / 末日战役 (`cg_droplet_attack.png`) — *新补全*
*   **触发节点**: 三体水滴探测器发起舰队攻击
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a perfectly smooth, teardrop-shaped silver chrome object smashing effortlessly through a massive human space battleship in deep space. Absolute destruction, silent vacuum, debris flying, blinding explosions of orange and blue plasma. Massive scale, stark contrast between the flawless alien droplet and the burning complex human wreckage. Minimalist composition, expressive digital brushstrokes, stark cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

### 7. 黑暗森林威慑建立 (`cg_deterrence_established.png`) — *新补全*
*   **触发节点**: 罗辑对决威慑建立成功
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a desolate cemetery under a stormy twilight sky on Earth. In the center, an aging man in his late 50s holds a pistol pointed at his own chest with a firm, resolute expression. He is surrounded by thin, glowing red scanning laser grids intersecting from the sky. Cinematic high contrast, dramatic shadows, moody lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

### 8. 执剑人交接 / 威慑中止 (`cg_deterrence_broken.png`) — *新补全*
*   **触发节点**: 执剑人交接且威慑破裂
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a colossal white gravitational broadcasting antenna tower collapsing on a misty mountaintop under a dark sky. A tiny, smooth, metallic teardrop-shaped alien droplet is diving downwards at extreme speed next to it. Sparks of yellow electricity and gray dust erupt from the structure. Cinematic framing, dramatic scale, sense of absolute panic and defeat. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

### 9. 引力波宇宙广播 (`cg_gravitational_broadcast.png`) — *新补全*
*   **触发节点**: 广播纪元开启/引力波广播启动
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a futuristic space exploration ship "Gravity" activating its colossal circular gravitational wave antenna in deep space. The ring-shaped megastructure glows with a vibrant blue-cyan light, emitting faint concentric holographic wave rings into the star-studded black void. Cinematic lighting, vast scale of the cosmos. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

### 10. 掩体世界落成 / 木星城 (`cg_bunker_world.png`) — *新补全*
*   **触发节点**: 掩体世界成军/掩体计划启动
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a cluster of massive cylindrical space cities rotating slowly in the dark, frozen shadow of Jupiter. The gargantuan gas giant Jupiter and its swirling orange-red storms fill the entire background, glowing ominously. Faint glints of yellow sunlight hit the edge of the space cities. Tiny cyan trails of spacecraft. Massive scale megastructure, cosmic scale, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

---

## 🌌 三、 9 大结局 CG 更新明细与提示词

结局图片用于全屏沉浸渲染，已通过重命名完全覆盖了 `03_Web_Rebuild/public/images/` 的旧结局图片。

### 1. 征服胜利 (`ending_conquest.png`)
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a massive dark human space fleet looming over a burning alien world. Imposing silhouetted battleships raining orbital strikes down on an unfamiliar ruined civilization. Red and gold fiery glows. Massive scale. Minimalist composition, expressive digital brushstrokes. Dark, triumphant but ruthless atmosphere. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 2. 威慑建立胜利 (`ending_deterrence.png`)
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a solitary figure standing in a vast, dark, monolithic control room, hand resting near a glowing red button. In the background, a massive panoramic window shows thousands of suspended alien ships waiting in silent fear. Deep shadows, purple and cold blue tones. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 3. 黑域声明胜利 (`ending_dark_domain.png`)
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, the entire solar system encased in a slow-moving, distorted, obsidian-like barrier. Light bending around the system like a black hole. Silent, eternal preservation. Deep space, muted grays and blacks with a single faint glimmer of the trapped sun. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 4. 流浪地球胜利 (`ending_wandering.png`)
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, the Earth traveling through deep, empty interstellar space. Giant planetary engines shooting colossal pillars of blue plasma into the dark void. A trail of stardust behind the planet. Massive scale. Stark contrast between the warm Earth and the cold universe. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 5. 数字意识网络永生胜利 (`ending_digital.png`)
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, an infinitely complex, glowing neon-cyan megastructure server farm floating in the void of space. Streams of glowing light representing digitized human consciousness flowing into it. Cyberpunk aesthetic, abstract and geometric. Dark background, electric cyan and magenta highlights. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 6. 小宇宙避难胜利 (`ending_hidden.png`)
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a tiny, glowing, perfect ecosystem sphere floating in an absolute, infinite white void. Inside the sphere is a beautiful blue planet and green fields. Poetic, surreal, peaceful but lonely. Minimalist composition, expressive digital brushstrokes. Golden and soft white lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 7. 内部哗变终局失败 (`ending_defeat_treachery.png`)
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a massive, ruined human spaceport engulfed in riots and civil war. Burning ships, shattered glass, panicked silhouettes running. Total societal collapse. Deep reds and stark dark shadows. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 8. 二维化坍缩灭绝终局失败 (`ending_defeat_extinction.png`)
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, a desolate, completely frozen and dead Earth. Crumbled ruins of a once-great megacity covered in thick ice and snow under a dark, starless space. Absolute silence and extinction. Cold blues and stark whites. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 9. 太阳氦闪毁灭终局失败 (`ending_defeat_helium_flash.png`)
*   **生成提示词 (Prompt)**:
    > Epic sci-fi concept art, an overwhelming, blinding wave of pure white and yellow plasma erupting from the sun, instantly vaporizing a ruined Earth in the foreground. Absolute destruction, terrifying scale. Minimalist composition, expressive digital brushstrokes. Extremely bright, cinematic exposure. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

## 💻 四、 结局 UI 重构与电影级效果适配

为了完美适配这批 21:9 宽屏结局 CG，并提供沉浸感体验，我们重构了 [EndingCinematic.tsx](file:///03_Web_Rebuild/src/components/ending/EndingCinematic.tsx)：

1. **全屏平移摇移扫掠动画 (Pan & Zoom)**:
   将图片从原来的卡片包装中移出，修改为铺满全屏渲染 (`fixed inset-0 object-cover w-full h-full`)。并在 CSS 中引入了 `pan-zoom` 平移缓动动画，使画卷如同电影胶片般缓缓移动，避免了静态图片的死板感。
2. **粒子渲染图层置顶**:
   大结局通关时，配合结局色调渲染的 Canvas 动态流光粒子图层被调整置顶（Z-index 置于插画之上，Z-index = 10），使得散落的星屑能与全景 CG 深度融合，营造虚实结合的太空质感。
3. **毛玻璃配字卡片 (Glassmorphism)**:
   结局独白文字被放置在屏幕下方的字卡盒子中，采用 `backdrop-filter: blur(12px)` 强毛玻璃背景与微弱的强调色阴影描边，极大地提高了在明暗交织的 CG 背景下的文字可读性。
