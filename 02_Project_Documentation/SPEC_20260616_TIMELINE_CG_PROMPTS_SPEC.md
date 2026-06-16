# 《宇宙群英传》 (Legend of Uni) — 纪元时间线 CG 提示词与资源规格说明书

> 日期：2026-06-16  
> 目的：为游戏历史纪元时间线审计扩充的剧情事件全屏 CG 提供 Midjourney 提示词、画面描述、命名规范、存放路径以及生成状态归档。

为了配合游戏内已实装的 **Letterbox 银幕遮幅电影级渲染模式**，新增与修正的剧情 CG 必须严格遵循以下美术标准：
1. **画幅比例**：超宽银幕画幅比例 `--ar 21:9`。
2. **美术风格**：极简巨物概念原画风 (Epic Concept Art) - 对标 Craig Mullins 的数码概念原画笔触，大块面色彩，强明暗对比，弱化无意义的AI过度修饰，突出宏大宇宙尺度下的人类渺小与悲壮感。
3. **输出规格**：1024x439（由 1024x1024 裁剪而来）或 3168x1344，无文字 (No text)，PNG 格式。

---

## 一、 CG 资源存放与映射规范

- **本地存放路径**：`03_Web_Rebuild/public/images/`
- **文件命名规则**：全部小写，使用下划线拼接，必须以 `cg_` 为前缀。
- **静态重路由机制**：在 `GameEventManager.ts` 中已实现映射。当事件的配图配置为对应的 `event_[名称]` 或 `cg_[名称]` 时，渲染引擎将自动加载该 PNG 文件并以 21:9 Letterbox 全屏 pan-zoom 动效播放。

---

## 二、 已生成并裁剪的 CG 归档 (已实装 15 个)

以下 15 个 CG 资产已使用 `gemini-3.1-flash-image` 模型生成并由 `sips` 工具进行中心对称裁剪为 21:9（1024x439）规格存入本地。

### 1. 红岸基地建立 (cg_red_shore_base.png)
- **中文描述**：巨大的复古抛物线雷达天线在暴风雪覆盖的雷达峰顶耸立，夜空星光黯淡，充满寒冷和宏大尺度。
- **提示词**：
  > Epic sci-fi concept art, a giant retro-style parabolic radar antenna dish towering over a snowy, windswept mountain peak in northeastern China. A dark night sky filled with stars. Volumetric mist, cold winter atmospheric lighting. Massive scale, macro vs micro. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 2. 叶文洁发送信号 (cg_yewenjie_signal.png)
- **中文描述**：昏暗的控制室里，一位年轻女科学家按下红色按钮，窗外巨大的雷达天线正向繁星夜空发射一束微光。
- **提示词**：
  > Epic sci-fi concept art, a lone female scientist standing in a massive, dimly lit control room, pressing a glowing red button. Outside the huge panoramic glass window, a colossal radar dish is emitting a faint beam of energy into the starry night sky. Dramatic shadow contrast, quiet determination. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 3. 三体文明回复 (cg_trisolaris_reply.png)
- **中文描述**：落满灰尘的房间里，古老的通信终端绿荧光屏幕上不断重复闪烁着警示语：“不要回答！”。
- **提示词**：
  > Epic sci-fi concept art, a primitive alien communication terminal in a dusty room, displaying a repeating flashing signal: 'DO NOT ANSWER!'. Green phosphor monitor glow casting eerie shadows on a cluttered desk with papers. Suspenseful, claustrophobic atmosphere. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 4. ETO 组织成立 (cg_eto_founded.png)
- **中文描述**：在“审判日号”庞大残破的船舱大厅中，一群身穿黑衣的男女肃立，墙上投影着发光的三体行星轨道符号。
- **提示词**：
  > Epic sci-fi concept art, a secretive assembly of people in dark robes standing in the grand, decaying hall of a massive, derelict cargo ship, the 'Judgment Day'. A large projection of a stylized three-body planet orbit symbol glowing on the wall. Dramatic low-key lighting, candlelight casting long shadows. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 5. 杨冬自杀 (cg_yangdong_suicide.png)
- **中文描述**：繁星满天的夜空下，一位美丽的年轻女子忧郁地坐在阳台边缘俯瞰现代城市，身旁放着写有“物理学从来就没有存在过”的遗书。
- **提示词**：
  > Epic sci-fi concept art, a beautiful, tragic young woman sitting on the edge of a balcony under a starry sky, overlooking a dark, modern city. Next to her is a sheet of paper with the handwritten note: 'Physics has never existed.' Muted, cold color palette, deep shadows, melancholic atmosphere. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 6. 汪淼幽灵倒计时 (cg_ghost_countdown.png)
- **中文描述**：一个男人在黑暗中看着墙壁，视野中漂浮着泛着红光、半透明的霓虹红倒计时数字：“1200:00:00”。
- **提示词**：
  > Epic sci-fi concept art, a man looking at a wall in a dark room, seeing glowing, semi-transparent neon-red digits '1200:00:00' hovering in his field of vision. Eerie, paranoid atmosphere. Digital aberration, cold shadows. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 7. 章北海刺杀老专家 (cg_beihai_assassination.png)
- **中文描述**：在巨大的轨道空间站外的真空太空中，一个宇航服人影手持无反冲力气体推进手枪，瞄准远处的航天飞机车窗。
- **提示词**：
  > Epic sci-fi concept art, a silent silhouetted figure in a space suit floating in the vacuum outside a massive orbital space station, aiming a silent gas-propelled gun toward a distant shuttle window. Blinding sunlight reflected on metallic structures, deep space void in the background. Ruthless determination. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 8. 希恩斯思想钢印 (cg_thought_seal.png)
- **中文描述**：在昏暗的实验室里，一名士兵坐在金属椅上，巨大的头盔向其眼睛投射金色全息数据流。
- **提示词**：
  > Epic sci-fi concept art, a soldier strapped into a high-tech metallic chair in a dimly lit medical laboratory, with a massive cybernetic helmet emitting glowing golden holographic data streams directly into their eyes. Cold clinical lighting, volumetric fog. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 9. 大低谷开始 (cg_great_ravine.png)
- **中文描述**：荒凉腐烂的巨型城市，破败的摩天大楼以及橘黄色沙尘天空下，绝望的人群在一座巨大的配给站门前排队。
- **提示词**：
  > Epic sci-fi concept art, a desolate, decaying megacity with collapsed skyscrapers and dusty orange skies. Crowds of desperate people in tattered clothes lining up outside a gargantuan metal rationing station. Heavy smog, dramatic cinematic lighting. Desolation, hopelessness. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 10. 泰勒破壁 (cg_tyler_breached.png)
- **中文描述**：阴沉的海滩上，一个绝望的面壁者坐在岩石上看着自己面壁计划被红叉划掉的全息投影，天空浮现巨大的智子之眼。
- **提示词**：
  > Epic sci-fi concept art, a man sitting in despair on a desolate beach, looking at a transparent holographic projection of his wallfacer plan being crossed out in red. A colossal, silent three-body sophon eye pattern faintly glowing in the overcast sky. Cold gray sea, melancholic lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 11. 雷迪亚兹破壁 (cg_reydiaz_breached.png)
- **中文描述**：在巨大的地下核弹防空洞中，一位骄傲但崩溃的将军站在巨大氢弹设计图前，一旁的全息破壁者人影冷酷地指着他。
- **提示词**：
  > Epic sci-fi concept art, a proud but broken military general standing in a massive underground bunker, surrounded by blueprints of giant hydrogen bombs. A holographic silhouette of a Wallbreaker pointing at him. High contrast dramatic lighting, deep shadows. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 12. 大低谷结束 (cg_great_ravine_ended.png)
- **中文描述**：人们从地下掩体走出，迎接晨光，眼前是一座高耸的白色大楼与绿意盎然的梯田花园构成的未来城市。
- **提示词**：
  > Epic sci-fi concept art, people emerging from underground domes into a futuristic clean city with towering white towers and green terraced gardens. Warm morning sunlight breaking through the clouds. Hope, rebirth, civilization. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 13. 技术爆炸 (cg_tech_explosion.png)
- **中文描述**：地球轨道上巨大的银色太空港船坞，周围环绕着数十艘刚刚建造完毕、喷射着冷蓝色聚变火光的恒星级战舰。
- **提示词**：
  > Epic sci-fi concept art, a massive, shiny spaceship shipyard in Earth's orbit, surrounded by dozens of newly constructed warships glowing with blue fusion thrusters. Blinding sun reflections on silver hull surfaces. Extreme scale, tech leap, hope. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 14. 末日之战 (cg_doomsday_battle.png)
- **中文描述**：在深空之中，一颗完美光滑、如镜面银铬般的水滴形物体轻松穿透庞大的人类主力战舰，战舰发生剧烈聚变爆炸。
- **提示词**：
  > Epic sci-fi concept art, a perfectly smooth, teardrop-shaped silver chrome object smashing effortlessly through a massive human space battleship in deep space. Absolute destruction, silent vacuum, debris flying, blinding explosions of orange and blue plasma. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 15. 黑暗战役 (cg_dark_battle.png)
- **中文描述**：深空中一艘巨大的巡洋舰无声发射激光束，击穿另一艘同盟舰船的反应堆，引发剧烈火光，传达黑暗森林的生存冷酷。
- **提示词**：
  > Epic sci-fi concept art, in the pitch-black void of deep space, a massive cruiser ship firing a silent, blinding beam of laser weapon into the reactor of another allied ship, causing a violent orange explosion. Cosmic coldness, betrayal, survival. Minimalist composition, stark contrast, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

---

## 三、 未生成 CG 提示词归档 (供未来额度重置后生成)

由于单次额度上限，以下 10 个事件 CG 未能在本次会话中完全转换，提示词已全部整理并标准化如下：

### 16. 三体技术交流开始 (cg_tech_exchange.png)
- **中文画面描述**：在光线充足的宏大实验室中，人类科学家与漂浮的三体半自主无人机配合工作，墙上投射着复杂的全息物理公式。
- **Midjourney 提示词**：
  > Epic sci-fi concept art, human scientists and high-tech alien robotic drones working together inside a vast, sleek laboratory with glowing holographic diagrams of advanced physics. Warm yellow and cybernetic cyan lighting. Cooperation, hope. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 17. 澳大利亚大移民 (cg_australia_migration.png)
- **中文画面描述**：在澳大利亚赤红粗犷的荒漠平原上，无数民用移民船降落，密密麻麻的难民在烈日夕阳下排起长队，充满绝望。
- **Midjourney 提示词**：
  > Epic sci-fi concept art, a million civilian transport ships landing on the red, dusty plains of the Australian outback. Thousands of refugees standing in long lines under a hot sunset lighting, despair. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 18. 执剑人交接仪式 (cg_swordholder_handover.png)
- **中文画面描述**：在巨大的 stark 白色圆柱形竖井核心控制室中，一位身穿黑色旧风衣的迟暮老人正将发光的金属红色按钮递给一位身穿纯白长裙的优雅年轻女子。
- **Midjourney 提示词**：
  > Epic sci-fi concept art, an elderly man in a dark simple coat handing a glowing metallic button-device to a young, elegant woman in a white dress inside a giant, stark white cylindrical shaft. Volumetric shafts of light, solemn ceremonial atmosphere. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 19. 三体星系光粒摧毁 (cg_trisolaris_destroyed.png)
- **中文画面描述**：深邃的红巨星被一颗极小但速度极快的白色光粒贯穿，三体太阳正在膨胀瓦解，吞噬一旁布满轨道环的三体行星。
- **Midjourney 提示词**：
  > Epic sci-fi concept art, in deep space, a tiny, blindingly white speck of light (photoid) piercing through a giant yellow star, causing the star to expand violently into a supernova, engulfing a nearby three-sun planet. Blinding light, cataclysmic cosmic explosion. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 20. 三体第二舰队逃离 (cg_trisolaris_fleet_escaped.png)
- **中文画面描述**：数百艘三角形的庞大外星战舰在虚空中拉伸变形，背后留下一道道明亮的曲率航迹，犹如一条条发光的丝线划过星海。
- **Midjourney 提示词**：
  > Epic sci-fi concept art, hundreds of triangular alien warships warp-stretching into long beams of white light, leaving massive warped trails in the starry galaxy. Cosmic scale. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 21. 维德星际政变 (cg_wade_coup.png)
- **中文画面描述**：夜雨磅礴中，一位穿着军大衣、面色冷峻的单臂独眼男子站在高空悬挂的集团大厦阳台上，下方是无数包围大楼的全副武装太空步兵。
- **Midjourney 提示词**：
  > Epic sci-fi concept art, a determined man in a military coat standing on a balcony, looking at a private army of space soldiers surrounding a massive corporate skyscraper (Halo Group). Red alarm lights, rain pouring down. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 22. 维德处决 (cg_wade_executed.png)
- **中文画面描述**：在清冷破晓的巨石混凝土监狱庭院中，一个坚毅的剪影男子独自面对远处的行刑队，冷雾升腾，阴影狭长。
- **Midjourney 提示词**：
  > Epic sci-fi concept art, a silhouetted man standing before a firing squad in a cold, monolithic concrete prison yard. Stark morning light casting long shadows, volumetric fog. Grim, solemn atmosphere. Minimalist composition. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 23. 冥王星博物馆 (cg_pluto_museum.png)
- **中文画面描述**：在冥王星巨大的冰下洞穴中，一位苍老的老人静静站在浩如烟海的古典油画和历史雕塑旁，洞口外，一股虚无扁平的二维坍塌平面正无声逼近。
- **Midjourney 提示词**：
  > Epic sci-fi concept art, an elderly man standing inside a vast, icy cave on Pluto, surrounded by relics of human history. Outside the cave mouth, a slow-moving flat wave of 2D space is engulfing the frozen landscape. Melancholic, peaceful memorial. Masterpiece, Craig Mullins style. --ar 21:9 --style raw

### 24. 太阳系二维化 (cg_solar_system_flattened.png)
- **中文画面描述**：一艘极小的飞船在边缘以曲率光速逃逸，其身后整个太阳系已被彻底拍扁成为一张平铺在宇宙深渊中的绚丽油画，行星和恒星都失去了立体感。
- **Midjourney 提示词**：
  > Epic sci-fi concept art, a single, tiny, spacecraft escaping at light-speed, leaving behind a perfectly flat, glowing two-dimensional plane that contains the flattened Sun and frozen planets, looking like a grand oil painting floating in the dark universe. Masterpiece, Craig Mullins style. --ar 21:9 --style raw
