# 《宇宙群英传》 (Legend of Uni) — 剧情事件新增 CG 提示词与命名规范

> 日期：2026-06-08  
> 目的：为游戏内未来需要补充的 5 大核心历史事件全屏 CG 提供 Midjourney 提示词、画面描述、命名规范与存放路径。

为了配合游戏内已实装的 **Letterbox 银幕遮幅电影级渲染模式**，新增的剧情 CG 必须严格遵循以下美术标准：
1. **画幅比例**：强制为超宽银幕画幅比例 `--ar 21:9`。
2. **美术风格**：极简巨物概念原画风 (Epic Concept Art) - 对标 Craig Mullins 的数码概念原画笔触，大块面色彩，强明暗对比，弱化无意义的AI过度修饰，突出宏大宇宙尺度下的人类渺小感。
3. **输出格式**：无文字 (No text)，PNG 格式。

---

## 一、 CG 资源存放与映射规范

- **本地存放路径**：`03_Web_Rebuild/public/images/`
- **文件命名规则**：全部小写，使用下划线拼接，必须以 `cg_` 为前缀。
- **动态替换机制**：在 `GameEventManager.ts` 中已实现映射。当事件的配图配置为对应的 `event_[名称]` 或 `cg_[名称]` 时，渲染引擎将自动加载该 PNG 文件并以 21:9 Letterbox 全屏 pan-zoom 动效播放。

---

## 二、 5 大新增 CG 提示词规范 (Midjourney v6.0 / raw 模式)

### 1. 水滴袭击 / 末日战役 (Doomsday Battle)
- **文件命名**：`cg_droplet_attack.png`
- **中文画面描述**：在深邃死寂的太空中，一个光滑无瑕、如镜面般反射星光的强相互作用力“水滴”探测器，正以极高速度轻松穿透一艘庞大的人类太空主力战舰。战舰被撕裂并发生剧烈的聚变爆炸，橙蓝色火光在真空中静默膨胀，碎片四处飞散。无暇水滴的绝对冷酷与人类工业巨兽被撕裂的残骸形成强烈对比。
- **英文 Midjourney 提示词**：
  > Epic sci-fi concept art, a perfectly smooth, teardrop-shaped silver chrome object smashing effortlessly through a massive human space battleship in deep space. Absolute destruction, silent vacuum, debris flying, blinding explosions of orange and blue plasma. Massive scale, stark contrast between the flawless alien droplet and the burning complex human wreckage. Minimalist composition, expressive digital brushstrokes, stark cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

---

### 2. 黑暗森林威慑建立 (Deterrence Established)
- **文件命名**：`cg_deterrence_established.png`
- **中文画面描述**：黄昏的暴雨废墟墓地中，年近六旬、面容消瘦而坚毅的罗辑独自站立。他的右手端着手枪，枪口对准自己的心脏。虚无的夜空中，来自三体智子操控的多道红色红外线瞄准光斑交错照射在他身上，构成一张无形的红光网格。冷暖对比，戏剧性的阴影与高对比度光效。
- **英文 Midjourney 提示词**：
  > Epic sci-fi concept art, a desolate cemetery under a stormy twilight sky on Earth. In the center, an aging man in his late 50s holds a pistol pointed at his own chest with a firm, resolute expression. He is surrounded by thin, glowing red scanning laser grids intersecting from the sky. Cinematic high contrast, dramatic shadows, moody lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

---

### 3. 执剑人交接 / 威慑中止 (Deterrence Broken)
- **文件命名**：`cg_deterrence_broken.png`
- **中文画面描述**：在云雾缭绕的高山之巅，一座巨大的白色引力波广播天线铁塔被撞击并剧烈崩塌，冒出滚滚浓烟与耀眼的黄色电弧。在废墟旁边，一个微小而冰冷的水滴探测器正以极高速度冲向地面。画面充满绝望、毁灭与猝不及防的溃败感。
- **英文 Midjourney 提示词**：
  > Epic sci-fi concept art, a colossal white gravitational broadcasting antenna tower collapsing on a misty mountaintop under a dark sky. A tiny, smooth, metallic teardrop-shaped alien droplet is diving downwards at extreme speed next to it. Sparks of yellow electricity and gray dust erupt from the structure. Cinematic framing, dramatic scale, sense of absolute panic and defeat. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

---

### 4. 引力波宇宙广播 (Gravitational Wave Broadcast)
- **文件命名**：`cg_gravitational_broadcast.png`
- **中文画面描述**：深空之中，著名的“万有引力号”飞船在黑暗的星海中全负荷启动了它环状的引力波发射天线。天线巨型圆环闪烁着强烈的冷蓝色荧光，向着四周的无垠宇宙广播着同心圆状的虚无涟漪（引力波具象化波纹）。宏伟的宇宙视角，星系背景。
- **英文 Midjourney 提示词**：
  > Epic sci-fi concept art, a futuristic space exploration ship "Gravity" activating its colossal circular gravitational wave antenna in deep space. The ring-shaped megastructure glows with a vibrant blue-cyan light, emitting faint concentric holographic wave rings into the star-studded black void. Cinematic lighting, vast scale of the cosmos. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0

---

### 5. 掩体世界落成 / 木星空间站城 (Bunker World Completed)
- **文件命名**：`cg_bunker_world.png`
- **中文画面描述**：一列列庞大的圆筒状旋转太空城悬浮在木星巨大而冰冷的阴影背光面。背景是充斥整个视野的木星标志性橙黄色大气条带与巨型大红斑，透出强烈的压迫感。太空中有点点星光和人类飞船微小的发光航线。史诗级的微观对比巨物。
- **英文 Midjourney 提示词**：
  > Epic sci-fi concept art, a cluster of massive cylindrical space cities rotating slowly in the dark, frozen shadow of Jupiter. The gargantuan gas giant Jupiter and its swirling orange-red storms fill the entire background, glowing ominously. Faint glints of yellow sunlight hit the edge of the space cities. Tiny cyan trails of spacecraft. Massive scale megastructure, cosmic scale, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
