# AUDIT_20260801_CG_CHARACTER_RACE_AUDIT | CG 与结局图人种与立绘一致性专项审计报告

> **审计日期**: 2026-08-01  
> **分类前缀**: `AUDIT_` (审计与评估报告)  
> **审计范围**: `/03_Web_Rebuild/public/images/` 目录下全部 43 张剧情 CG 与 17 张结局图  
> **审计重点**: 人物人种（种族）准确性、人物面貌与统一立绘（`unified_*`）的一致性

---

## 📊 一、 审计发现总览

经逐一视觉分析，我们的审计结果如下：

1.  **结局图 (`ending_*.png`，共 17 张)**：
    *   **结论：全部合格。**
    *   **分析**：结局图皆以宇宙大尺度宏观场景、灾难余波或纯氛围剪影为主（如威慑胜利 `ending_deterrence.png` 仅为执剑人黑色剪影；数字永生 `ending_digital.png` 为全息流动面孔），**无任何近景写实主线人物**，因此不存在人种偏离或立绘不一致的风险。
2.  **剧情 CG (`cg_*.png`，共 43 张)**：
    *   **结论：发现 4 张高质量 CG 存在严重的人种、服装或时代设定偏离缺陷（东亚华人被画成高加索白人或穿现代西方飞行服出戏）。**
    *   **受影响角色**：**罗辑**（涉及 3 张 CG）、**程心**（涉及 1 张 CG）与 **叶文洁（青年）**（涉及 1 张 CG）。

---

## 🚨 二、 人种画错与立绘冲突对照

以下是 3 张被判定为 **Critical** 缺陷的 CG 资源、当前的画面表现，以及它们与官方立绘的冲突分析：

### 1. 威慑建立对峙 (`cg_deterrence_established.png`)
*   **当前画面表现**：[cg_deterrence_established.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_deterrence_established.png)  
    画面展示了罗辑在墓地中持枪对峙的经典场景。然而，画面中的男子拥有极深的眼窝、非常高挺笔直的欧式鼻梁、灰白色的短卷发。**完全被画成了一个高加索白人男性（形似好莱坞影星哈里森·福特）**。
*   **立绘冲突**：罗辑的标准立绘为 [unified_luoji_1778921262534.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/unified_luoji_1778921262534.png)，画面中他是一名具有黑色短发、平整面部轮廓、黑色眼睛以及修剪整齐胡须的经典东亚华人男性。CG 中的形象与立绘有严重的种族割裂。
*   **优化对齐点**：保留墓地对峙和红色激光天线的构图，但必须将人物面部重绘为**东亚华人男性面孔**（短发，部分鬓角斑白，面部骨骼较平缓），身穿与立绘一致的印有电路纹的黑色风衣夹克。

---

### 2. 执剑人交接仪式 (`cg_swordholder_handover.png`)
*   **当前画面表现**：[cg_swordholder_handover.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_swordholder_handover.png)  
    画面中老年执剑人将发射开关交给年轻女执剑人。
    *   **左侧老年罗辑**：被画成了满头银发、长相酷似西方政要/白人老头（Caucasian elderly man）的形象。
    *   **右侧程心**：被画成了一个深眼窝、高鼻梁、浅棕色头发的**白人年轻女性（Caucasian young woman）**。
*   **立绘冲突**：
    *   罗辑的立绘为华人男性面孔。
    *   程心的标准立绘为 [unified_chengxin_1778921400346.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/unified_chengxin_1778921400346.png)，她是一位极具东方古典美的华人女性，黑发盘成优雅的发髻，穿着饰有淡紫色发光条纹的中式未来白色旗袍。CG 中的两人完全失去了华人的特征，极度出戏。
*   **优化对齐点**：
    *   **罗辑**：重绘为老年东亚华人男性（虽然是白发和皱纹，但应具有华人的骨骼特征）。
    *   **程心**：重绘为黑色头发在脑后盘成发髻、长相清丽柔和的东亚华人女性，必须身穿白色未来旗袍。

---

### 3. 冥王星守墓人 (`cg_pluto_museum.png`)
*   **当前画面表现**：[cg_pluto_museum.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_pluto_museum.png)  
    画面展示了罗辑在冥王星 cave（洞穴）中，看着二向箔逼近的背影/侧影。
    *   **老年罗辑**：虽主要展示侧后方背影，但其露出的面部侧轮廓具有高耸的眉骨、西方人的胡须和高加索老人的颅骨特征，仍是一个白人形象。
*   **立绘冲突**：与罗辑华人的基本骨骼特征不符。
*   **优化对齐点**：微调侧脸轮轮廓，将其收缩为扁平温和的东亚华人老年轮廓。

---

### 4. 红岸信号发射 (`cg_yewenjie_signal.png`)
*   **当前画面表现**：[cg_yewenjie_signal.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_yewenjie_signal.png)  
    画面展示了青年叶文洁在红岸基地向宇宙深空发射信号。然而，画面中的女性面部高光过强，面部线条立体，仍带有一定高加索混血感；最严重的偏离在于**服饰与控制室环境极其现代化与西方化**：她身穿一件类似现代美军/西方款式的飞行员连体衣（Flight Jumpsuit），甚至带有些许现代科技的肩章，背景控制台则是充满现代液晶屏幕和 LED 的超前科幻场景，缺乏中国 1970 年代红岸基地的复古重工业质感。
*   **立绘冲突**：叶文洁的老年标准立绘为 [unified_yewenjie_1778921299091.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/unified_yewenjie_1778921299091.png)。而红岸发射信号发生于 1971 年（叶文洁时年 24 岁），她当时是作为戴罪立功的青年知识分子在红岸工作，应该穿着**1970年代中国工农兵标志性的松垮军绿色军装外套（65式军服，无红领章）**或**深蓝色/灰色防寒棉袄**，发型为典型的 70 年代双辫子或齐耳短发，面部展现出朴素、沧桑但坚毅的东方人神情。控制室应为**70年代的复古模拟电子管（Vacuum Tube）、物理按钮、圆形指针仪表盘与显像管（CRT）监视器**，而非现代科幻风。
*   **优化对齐点**：
    *   将叶文洁的年龄校正为 24 岁左右的青年东亚华人女性，剪有 70 年代特征的齐耳短发或双辫，面容质朴坚毅。
    *   将违和的现代西方飞行服替换为 **1970年代中国墨绿色粗布棉服外套** 或 **不挂红领章的军绿色干部外套**。
    *   控制室全面重塑为 **1970年代中式大型重工业电子管模拟控制室**（包含海量物理拨动开关、旋钮、金属按钮、指针式电流电压表、绿色荧光波形示波器，无任何液晶屏和现代 LED），从而完美契合《三体》红岸基地的冷战时代质感。

---

## 🛠️ 三、 修复重绘方案与定制 Prompts

为了使这 3 张关键 CG 与人物立绘（Luo Ji、Cheng Xin）保持高强度一致，我们制定了以下重绘提示词规格。重绘时**必须显式增加人种约束**以纠正 AI 的高加索人偏见：

### 1. 威慑建立重绘提示词 (`cg_deterrence_established.png`)
```text
Epic sci-fi concept art, a resolute middle-aged EAST ASIAN CHINESE man in his 50s (Luo Ji), with short black hair graying at the temples and a clean short beard. He has typical East Asian facial features: warm dark brown eyes, flat facial bone structure, moderate nose. He wears a high-tech dark grey jacket with subtle cyan glowing electronic circuit lines. He stands in a dark, overgrown cemetery under a storm-swept twilight sky, holding a pistol to his own chest. Red laser grids sweep across the scene. Melancholic determination, epic scale. Chinese ink wash aesthetic meets cyberpunk. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
```

### 2. 执剑人交接重绘提示词 (`cg_swordholder_handover.png`)
```text
Epic sci-fi concept art, swordholder handover ceremony inside a vast, sterile white futuristic dome with vertical windows of volumetric light. On the left, an elderly EAST ASIAN CHINESE man in his late 80s (Luo Ji) with white hair and wise East Asian wrinkles, wearing a dark grey futuristic coat, hands a small glowing golden switch console to a young woman. On the right, a beautiful young EAST ASIAN CHINESE woman in her late 20s (Cheng Xin) with neat black hair tied back in an elegant bun. She has gentle East Asian features: soft dark eyes, delicate chin, wearing a pure white futuristic cheongsam dress with faint purple luminescent details. Solemn, fateful moment. Chinese ink wash meets cyberpunk. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
```

### 3. 冥王星守墓重绘提示词 (`cg_pluto_museum.png`)
```text
Epic sci-fi concept art, an elderly EAST ASIAN CHINESE man in his 100s (Luo Ji) with long white hair and a white beard, standing inside a frozen, blue-lit cave on Pluto, looking out. He has gentle East Asian facial features in side profile, wearing a heavy futuristic polar survival park coat. Outside the cave mouth, a slow-moving flat sheet of colorful 2D space (dimensional collapse) is engulfing the dark cosmos. Surrounding him in the cave are frozen relics of human history: an old globe, framed historic black-and-white photos of people, books. Melancholic memorial. Craig Mullins style. --ar 21:9 --style raw --v 6.0
```

### 4. 红岸发射重绘提示词 (`cg_yewenjie_signal.png`)
```text
Epic sci-fi concept art, a young 24-year-old EAST ASIAN CHINESE female scientist (young Ye Wenjie) with neat 1970s short hair, gentle but determined East Asian features. She is wearing a loose vintage 1970s Chinese dark olive-green winter coat (padded worker jacket). She stands inside a massive, dimly lit, retro-industrial Chinese Red Coast control room from the 1970s, filled with rows of analog dials, physical steel toggle switches, metal buttons, round pressure gauges, and small green glowing cathode-ray tube (CRT) oscilloscope monitors. No modern screens or LEDs. She is pressing a large, glowing red round emergency launch button on a rusty grey metal console. Outside the dark panoramic window, a colossal iron radar dish antenna towers into the freezing, snowy night sky, emitting a faint ripple of energy. Heavy shadows, high contrast, dramatic retro-future atmosphere. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0
```
