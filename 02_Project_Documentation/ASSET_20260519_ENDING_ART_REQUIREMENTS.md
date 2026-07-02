# 大结局美术 & 音乐需求文档

> 日期：2026-05-19 | 版本：v2.0（基于现有资产风格分析）

---

## 一、现有美术风格分析

通过审查项目现有 52 张图片资产，提炼出以下统一风格基因：

### 角色头像（unified_* / character_*）
- **画风**：中国工笔线描 × 赛博朋克装甲，半写实比例
- **线条**：清晰的黑色墨线轮廓，笔触干净利落
- **着色**：低饱和暗色底 + 少量荧光色点缀（青色/紫色/金色电路纹）
- **背景**：水墨山水 / 雪花粒子 / 电路板纹理（半透明叠加）
- **构图**：胸部以上半身像，正面或3/4侧面，占画面 70%+
- **服饰特征**：中式盘扣 + 科幻战甲混搭，龙纹/祥云刺绣细节
- **尺寸**：1024×1024 正方形

### 事件场景图（event_*）
- **画风**：与角色同体系，但更偏向宏观叙事
- **古筝行动**：卷轴装裱边框 + 水墨渲染 + 科技HUD叠加
- **月球危机**：暗色太空底 + 高对比光效（橙色碎裂 + 青色HUD网格）
- **流浪地球**：深空背景 + 蓝色等离子束 + 地球细节
- **构图**：正方形 1024×1024，画面满构图
- **特殊**：古筝行动有卷轴边框，其他无边框

### 关键色彩系统
| 色系 | 用途 | Hex 范围 |
|-----|------|---------|
| 墨黑/深灰 | 主背景 | `#0A0A12` ~ `#1A1A2E` |
| 青色荧光 | 科技线路/HUD | `#00E5FF` ~ `#4DD0E1` |
| 紫色荧光 | 智子/神秘 | `#7C4DFF` ~ `#B388FF` |
| 暖橙/金 | 爆炸/能量 | `#FF6F00` ~ `#FFD700` |
| 水墨白 | 工笔线条/云雾 | `#E0E0E0` ~ `#FAFAFA` |

---

## 二、9 张结局场景配图

### 统一规格
- **尺寸**：1024×1024（系统会以 21:9 裁切展示，构图注意上下可裁）
- **格式**：PNG
- **风格基底**：与现有 event_*.png 一致 — 暗色太空底 + 工笔线描细节 + 科技HUD叠加
- **禁忌**：不要文字 / 不要卷轴边框 / 不要水印

---

### ① ending_conquest.png — 征服胜利

**主题**：人类舰队碾压异星文明的终极凯旋

**核心元素**：
- 前景：3-5 艘巨型战舰（工笔线描风格，带青色引擎光）呈箭形编队
- 中景：异星文明母星在燃烧，碎裂的星球表面流淌岩浆
- 背景：深红-金色星云，散布战斗残骸
- 光源：从燃烧星球向外辐射的暖橙光

**色调**：`#1A0000` 暗红底 → `#FF4500` 烈焰橙 → `#FFD700` 金色高光

**参考 Prompt**：
```
Dark sci-fi battle scene in Chinese ink wash meets cyberpunk style. A triumphant 
fleet of massive human warships with glowing cyan engine trails in arrow formation, 
flying past a burning alien homeworld. The planet's surface cracks with molten 
orange lava. Deep red and gold nebula background with floating battle debris. 
Black ink outline style with technological HUD overlays. Dramatic cinematic 
composition. 1024x1024. No text.
```

---

### ② ending_deterrence.png — 威慑胜利

**主题**：执剑人孤独守护引力波发射器

**核心元素**：
- 前景：一个人的黑色剪影，面对巨大的引力波按钮控制台
- 中景：环形引力波天线阵列，发出淡紫色涟漪
- 背景：深蓝-紫色星空，银河斜贯
- 氛围：极度孤独与庄严

**色调**：`#050A2E` 深蓝底 → `#6A1B9A` 紫色 → `#B388FF` 淡紫高光

**参考 Prompt**：
```
A solitary silhouette standing before a massive circular gravitational wave 
antenna array emitting faint purple ripples. Deep blue-purple starfield with 
the Milky Way in background. Chinese ink wash meets cyberpunk aesthetic. The 
figure holds humanity's fate with one button. Solemn and lonely atmosphere. 
Thin ink outlines with purple-blue luminescent details. 1024x1024. No text.
```

---

### ③ ending_dark_domain.png — 黑域胜利

**主题**：太阳系被光速黑域永久封印

**核心元素**：
- 中心：太阳系（微缩）被包裹在一个半透明的球形光速屏障内
- 球体表面：折射/扭曲外部星光的视觉效果
- 球体内部：太阳微弱发光，各行星轨道可见
- 背景：球体外的宇宙正常明亮，形成内暗外亮的反差
- 氛围：永恒的宁静，琥珀质感

**色调**：`#0A0A0A` 纯黑底 → `#1A1A2E` 深墨蓝 → `#CFD8DC` 银白边界

**参考 Prompt**：
```
The solar system enclosed within a perfect translucent sphere of absolute 
darkness — a light-speed black domain. Inside the sphere, a faint sun glows 
with visible planetary orbits. Outside, bright stars are distorted by the 
boundary. Amber-like eternal preservation feeling. Chinese ink wash style 
with silver-white boundary effects. Monochrome with touches of warm gold 
inside. Peaceful and eternal. 1024x1024. No text.
```

---

### ④ ending_wandering.png — 流浪胜利

**主题**：地球带着行星发动机尾焰穿越星海

> ⚠️ 现有 `event_wandering_earth.png` 已有类似构图，此图应强调**远征成功**的壮阔感，地球已远离太阳系，前方是新恒星。

**核心元素**：
- 主体：地球从画面左下方向右上方行进，表面密布发动机
- 尾焰：蓝白色等离子流从右下方喷出（比现有图更壮观）
- 前方：一颗温暖的橙色新恒星在远方等待
- 背景：深空 + 星尘航迹

**色调**：`#1A0A00` 暗底 → `#FF6F00` 暖橙 → `#FFE082` 金色新星光

**参考 Prompt**：
```
Earth traveling through deep interstellar space, propelled by thousands of 
planetary engines emitting brilliant blue-white plasma plumes. The planet 
moves from lower-left toward a warm orange new star in the upper-right 
distance. Star dust trail behind Earth. Chinese ink wash cosmic style with 
cyan technological details on Earth's surface. Awe-inspiring epic scale. 
Warm orange and cool blue contrast. 1024x1024. No text.
```

---

### ⑤ ending_digital.png — 数字永生

**主题**：人类意识上传至数字方舟

**核心元素**：
- 中心：一个水晶般的数字方舟结构（几何多面体），发出青色光芒
- 周围：无数光点/数据流从地球方向汇入方舟
- 数据流中隐约可见人脸/神经元纹路
- 背景：深紫 + 矩阵雨效果（竖直的亮点阵列）

**色调**：`#001A33` 深蓝底 → `#AA00FF` 电紫 → `#00E5FF` 青色高光

**参考 Prompt**：
```
A crystalline digital ark structure (geometric polyhedron) floating in deep 
space, glowing with cyan light. Streams of luminous data flowing into it from 
all directions, with faint human faces and neural patterns visible within the 
data streams. Matrix-like vertical light arrays in background. Chinese ink 
wash meets cyberpunk digital aesthetic. Deep purple and cyan neon palette. 
Transcendent and futuristic. 1024x1024. No text.
```

---

### ⑥ ending_hidden.png — 死神永生·小宇宙

**主题**：五磅的小宇宙中永恒旋转的蓝色地球

**核心元素**：
- 中心：一个透明球体（小宇宙），内部有微缩的蓝色地球绕金色小恒星运行
- 球体外：新生宇宙的原初光芒，彩虹色的创世之光
- 底部：球体浮在虚空中，下方有一行微弱的生态数据
- 氛围：希望、温柔、永恒

**色调**：`#FAFAFA` 暖白底 → `#E8D5B7` 暖金 → 彩虹微光

**参考 Prompt**：
```
A tiny perfect universe contained within a translucent glowing sphere. Inside 
it, a miniature blue Earth orbits a small golden star. The sphere floats at 
the edge of a vast newborn universe filled with iridescent primordial light. 
Rainbow-tinged golden warmth. Dreamy, hopeful, bittersweet feeling. Delicate 
Chinese ink wash style with warm watercolor glow. Ethereal and gentle. Light 
background unlike the other dark scenes. 1024x1024. No text.
```

---

### ⑦ ending_defeat_treachery.png — 逃亡主义失败

**核心元素**：碎裂的地球 + 四散逃离的飞船 + 暗红灰色调

**参考 Prompt**：
```
A fractured Earth seen from space, its surface dark and smoking. Scattered 
human ships fleeing in all directions, growing smaller into the void. Dark 
red and grey tones. Chinese ink wash apocalyptic style. Desperate and 
fragmented. 1024x1024. No text.
```

---

### ⑧ ending_defeat_extinction.png — 灭绝失败

**核心元素**：完全死寂的灰色地球 + 漂浮太空残骸 + 极简灰黑

**参考 Prompt**：
```
A completely dead grey-brown Earth from orbit, no lights, no atmosphere, 
covered in dust. A single piece of ancient human satellite drifts silently 
in foreground. The sun shines indifferently. Monochrome ash grey. Chinese 
ink wash minimalist style. Absolute silence. 1024x1024. No text.
```

---

### ⑨ ending_defeat_helium_flash.png — 太阳氦闪失败

**核心元素**：膨胀的红巨星吞噬地球 + 极端白光 + 焦黑边缘

**参考 Prompt**：
```
The sun as a massive red giant engulfing the inner solar system. Earth being 
incinerated by blinding white helium flash light. Extreme contrast between 
white-hot center and scorched darkness at edges. Apocalyptic overwhelming 
brightness. Chinese ink wash style with explosive light effects. 1024x1024. 
No text.
```

---

## 三、10 张 NPC 分类头像

### 统一规格
- **尺寸**：1024×1024 正方形
- **构图**：与现有角色头像完全一致 — 胸部以上半身像，占画面 70%+
- **画风**：工笔线描 + 赛博朋克，黑墨线轮廓，低饱和暗底
- **背景**：抽象暗色 + 职业相关元素（虚化）
- **服饰**：中式盘扣/立领 + 科幻功能装备的混搭

### 统一 Prompt 前缀
```
Portrait bust shot of a [角色描述], in Chinese ink wash meets cyberpunk style 
matching the Three-Body Problem universe aesthetic. Clean black ink outlines, 
low-saturation dark background with subtle [职业元素]. Chinese-style collar 
mixed with futuristic armor elements. 1024x1024. No text.
```

---

### ① npc_military_commander.png — 军事指挥官

**角色**：50 岁左右的男性，方脸，短发花白，眼神锐利坚毅
**服饰**：深蓝色军装 + 肩章发光带 + 中式立领
**背景**：暗色 + 虚化的战术全息地图
**气质**：沉稳、果断、不容置疑

```
...a stern 50-year-old male military commander with short grey-white hair, 
sharp piercing eyes, and disciplined posture. Dark blue futuristic military 
uniform with glowing rank insignia on shoulders and Chinese-style standing 
collar. Background: faint holographic tactical battle maps...
```

---

### ② npc_scientist.png — 科学家

**角色**：40 岁左右，性别中性偏女性，戴细框眼镜，眼神专注
**服饰**：白色实验服 + 内衬黑色高领 + 胸口数据面板
**背景**：暗色 + 虚化的物理公式/粒子轨迹
**气质**：理性、好奇、略带忧虑

```
...a focused 40-year-old scientist with thin-framed glasses, wearing a white 
lab coat over a black turtleneck, with a data panel on the chest. Background: 
faint floating physics equations and particle trajectories...
```

---

### ③ npc_official.png — 政务官员

**角色**：55 岁左右的男性，银灰发，面容严肃但疲惫
**服饰**：深灰色中山装改良款 + 微发光的身份徽章
**背景**：暗色 + 虚化的联合国/PDC 徽章
**气质**：权威、沉重、公正

```
...a weary 55-year-old male government official with silver-grey hair, wearing 
a modernized dark grey Zhongshan suit with a faintly glowing ID badge. 
Background: faint UN/PDC emblems...
```

---

### ④ npc_engineer.png — 工程师/矿工

**角色**：35 岁左右的男性，方下巴，面部有灰尘/油污痕迹
**服饰**：橙色重型外骨骼工装 + 头盔推到额头上
**背景**：暗色 + 虚化的工业管道/矿道
**气质**：坚韧、实干、粗犷

```
...a rugged 35-year-old male engineer with dust on face, wearing an orange 
heavy-duty exosuit with helmet pushed up on forehead. Background: faint 
industrial pipes and mining tunnels...
```

---

### ⑤ npc_civilian.png — 平民代表

**角色**：45 岁左右的女性，普通面容，眼中有倔强
**服饰**：朴素的深色棉布衣服，略显破旧但整洁
**背景**：暗色 + 虚化的地下城走廊灯光
**气质**：疲惫但坚韧、普通但不平凡

```
...an ordinary 45-year-old female civilian with tired but resilient eyes, 
wearing simple dark cotton clothing that is worn but clean. Background: 
faint underground city corridor lights...
```

---

### ⑥ npc_medic.png — 医疗人员

**角色**：30 岁左右的女性，扎马尾，表情温和但紧张
**服饰**：白大褂 + 红十字全息臂章 + 医疗扫描仪
**背景**：暗色 + 虚化的心电图/生命体征数据
**气质**：关怀、冷静、专业

```
...a 30-year-old female medic with ponytail, wearing a white coat with red 
cross holographic armband and carrying a medical scanner. Warm but tense 
expression. Background: faint ECG and vital sign readouts...
```

---

### ⑦ npc_rebel.png — 反叛者/ETO

**角色**：年龄不明，面部半被暗色兜帽遮挡，仅露出锐利的眼睛
**服饰**：深黑色连帽斗篷 + 内衬暗红，隐约可见 ETO 符号
**背景**：暗红色 + 虚化的火焰/混乱
**气质**：危险、狂热、不可捉摸

```
...a shadowy figure with face partially obscured by a dark hood, only sharp 
intense eyes visible. Dark black cloak with dark red lining, faint ETO symbol 
on clothing. Background: dark red ambient with faint flames. Dangerous and 
fanatical...
```

---

### ⑧ npc_ai_terminal.png — AI/系统终端

**角色**：非人类 — 几何化的全息人脸，由蓝白线条和数据流构成
**服饰**：无实体 — 纯数字投影
**背景**：暗色 + 电路板纹理 + 二进制数据流
**气质**：中立、冷静、超然

```
...a holographic AI interface visualized as a geometric humanoid head composed 
of blue-white light lines and flowing data streams. No physical body, purely 
digital projection. Circuit board patterns in background. Cool neutral 
expression. Binary data cascading...
```

---

### ⑨ npc_comms_officer.png — 通讯/监听员

**角色**：28 岁左右的男性，戴大型耳机，面容专注紧张
**服饰**：深蓝色工作服 + 胸口频率分析面板
**背景**：暗色 + 虚化的射电望远镜阵列 + 绿色磷光屏
**气质**：警觉、专注、略带恐惧

```
...a focused 28-year-old male communications officer wearing large headphones, 
in dark blue work uniform with frequency analysis panel on chest. Green 
phosphor screens reflecting on face. Background: faint radio telescope 
array. Alert and slightly fearful expression...
```

---

### ⑩ npc_merchant.png — 商人/走私者

**角色**：40 岁左右的男性，精瘦面容，狡黠的眼神
**服饰**：混搭 — 外层是粗犷皮质外套，内层是精致丝绸内衬
**背景**：暗色 + 虚化的货箱/黑市灯光（琥珀色）
**气质**：精明、世故、不可信赖

```
...a shrewd 40-year-old male trader with calculating narrow eyes, wearing a 
rugged leather coat over fine silk lining. Background: faint crates and amber 
black market lighting. Cunning and worldly expression...
```

---

## 四、文件放置清单

生成后将全部 19 张图片放入 `03_Web_Rebuild/public/images/`：

```
# 结局场景配图（9张）
ending_conquest.png
ending_deterrence.png
ending_dark_domain.png
ending_wandering.png
ending_digital.png
ending_hidden.png
ending_defeat_treachery.png
ending_defeat_extinction.png
ending_defeat_helium_flash.png

# NPC 分类头像（10张）
npc_military_commander.png
npc_scientist.png
npc_official.png
npc_engineer.png
npc_civilian.png
npc_medic.png
npc_rebel.png
npc_ai_terminal.png
npc_comms_officer.png
npc_merchant.png
```

无需修改任何代码，系统会自动加载。

---

## 五、主题曲音乐需求建议

### 5.1 使用场景
大结局 Phase 4 — Credits 滚动时播放，时长建议 **3~5 分钟**。

### 5.2 风格定位

**核心情绪**：史诗感 × 东方意境 × 宇宙孤独感

参考混搭方向：
- **汉斯·季默** 的宇宙史诗层次（《星际穿越》主题）
- **坂本龙一** 的东方极简钢琴（《Merry Christmas Mr. Lawrence》）
- **万能青年旅店** 的后摇升腾感（《杀死那个石家庄人》间奏段）

### 5.3 结构建议

| 段落 | 时间 | 情绪 | 配器建议 |
|-----|------|------|---------|
| **序章** | 0:00 - 0:40 | 寂静、孤独 | 单独钢琴 / 古琴，极简音符，大量留白 |
| **展开** | 0:40 - 1:30 | 回忆、温暖 | 弦乐渐入（小提琴 + 大提琴），旋律舒缓展开 |
| **上升** | 1:30 - 2:30 | 壮阔、决心 | 全弦乐编制 + 法号/铜管，鼓点推进，交响层次堆叠 |
| **高潮** | 2:30 - 3:30 | 史诗、超越 | 全编制爆发 + 合唱（人声或仿人声合成器），主旋律完整呈现 |
| **尾声** | 3:30 - 4:30 | 释然、永恒 | 回归钢琴/古琴独奏，渐弱至寂静，最后一个音符悬而不落 |

### 5.4 关键音乐元素

- **东方乐器点缀**：古琴 / 箫 / 琵琶（不主导，作为色彩点缀）
- **现代合成器垫底**：低频 pad / 太空氛围音效
- **人声**：无歌词，使用 "啊" / "呜" 的纯人声合唱（类似《星际穿越》的教堂管风琴段落情绪）
- **调性**：小调为主（d 小调 / a 小调），高潮段转关系大调
- **BPM**：60-80（缓慢、庄严）

### 5.5 AI 音乐生成 Prompt 建议

如使用 Suno / Udio 等 AI 音乐工具：

```
Epic orchestral sci-fi soundtrack with Eastern influences. Begins with 
solo piano in d minor, gradually building with strings (violin, cello). 
Incorporates subtle Chinese guqin and xiao flute touches. Builds to a 
full orchestral climax with brass, timpani, and ethereal wordless choir. 
Resolves back to gentle piano. Theme: humanity's journey through dark 
forest of cosmos, sacrifice and hope. Cinematic, emotional, bittersweet. 
4 minutes. 70 BPM.
```

**标签建议**：`epic orchestral, cinematic, sci-fi, eastern, piano, strings, choir, ambient, emotional, bittersweet`

### 5.6 技术规格

| 参数 | 要求 |
|-----|------|
| 格式 | MP3（优先）或 OGG |
| 采样率 | 44.1kHz+ |
| 比特率 | 192kbps+ |
| 文件名 | `theme_song.mp3` |
| 放置路径 | `03_Web_Rebuild/public/audio/theme_song.mp3` |
| 时长 | 3~5 分钟 |

放入后无需修改代码，系统自动识别并播放。

---

> 文档生成日期：2026-05-19
