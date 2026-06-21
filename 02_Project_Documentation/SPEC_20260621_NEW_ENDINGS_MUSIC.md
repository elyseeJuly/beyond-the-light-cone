# 新增结局与音乐企划规范
> **Date**: 2026-06-21  
> **Status**: Completed  
> **Category**: Specification (`SPEC_`)
> **依赖项**: `AUDIT_20260612_CYCLE_AUDIT_V2.md`, `SPEC_20260615_EPOCH_CHRONICLES_OST.md`

本文档记录了基于前期叙事审计报告，在当前已修复的结局系统中补充的**新中性结局（Neutral Endings）**，以及配套的音乐与 CG 风格要求。这些结局旨在填补“非胜非败”的游戏结算状态，完善玩家未能达成特定胜利或失败条件时的叙事闭环。

---

## 一、新增结局定义

我们在 `types/enums.ts` 中新增了 `NeutralType` 枚举，并在 `config/endingConfig.ts` 中完成了相关参数的注册。

### 1. 永恒的流亡 (NEUTRAL_ETERNAL_EXILE)
* **结局定性**：中性（非胜非败）
* **触发条件推测**：地球已无法居住或被摧毁，但部分人类乘坐星舰成功逃离，却未能找到新家园，只能永远在星际间流浪。
* **文案配置**：
  * **标题**：永恒的流亡
  * **副标题**：星舰文明 · 无尽漂流
  * **主声明**：地球已被遗弃，部分人类乘坐星舰逃离。没有明确的目的地，只能在黑暗的宇宙中无尽地流浪，成为永远的星际游牧民族。
  * **终言**：这是一场没有终点的远征。失去故乡的文明在星海中如浮萍般漂泊，他们将带着人类最后的基因与记忆，消失在宇宙深处。
* **视觉参数**：
  * 主色调：`#0A1128` -> `#1C2E4A` (深空黯蓝)
  * 粒子特效：`thrust` (尾迹推进)
  * Icon / Emoji：`Rocket` (火箭)
  * CG 文件名预留：`ending_neutral_eternal_exile.png`

### 2. 宇宙静默 (NEUTRAL_COSMIC_SILENCE)
* **结局定性**：中性（非胜非败）
* **触发条件推测**：文明陷入停滞，对外停止一切扩张与交流，完全向内探索或进入深度休眠状态，最终在静默中消失在其他文明的视野里。
* **文案配置**：
  * **标题**：宇宙静默
  * **副标题**：文明归零 · 绝对静止
  * **主声明**：战争与扩张失去了意义，文明选择了向内探索或进入深度休眠。我们不再发出任何声音，彻底融入了宇宙的背景辐射之中。
  * **终言**：这不是毁灭，而是终极的宁静。星空中少了一个喧闹的种族，多了一块沉默的墓碑。我们还在，但对于宇宙而言，我们已经消失。
* **视觉参数**：
  * 主色调：`#000000` -> `#0F172A` (极简虚无)
  * 粒子特效：`ember` (黯淡余烬)
  * Icon / Emoji：`Moon` (残月/静默)
  * CG 文件名预留：`ending_neutral_cosmic_silence.png`

---

## 二、结局 CG 与音乐要求补充

由于大结局 CG 已经在美术团队的推进中，为了保证视听一致性，这里参考 `SPEC_20260615_EPOCH_CHRONICLES_OST.md` 中的“纯器乐、无残响”原则，为两个新增结局补充具体的音乐需求。

### 1. 《Endless Drifting》（无尽漂流） —— 对应【永恒的流亡】结局
* **配置路径**：`/audio/ending_neutral_eternal_exile.mp3`
* **音乐定位**：纯器乐 (Instrumental)，表现极致的孤独、失去故土的哀伤，以及不得不继续前行的微弱执念。
* **AI 生成提示词 (Prompt)**：
  > `[Instrumental] Melancholic space ambient, distant cello, echoing soft synth, feeling of endless drifting, vast emptiness, sorrowful but determined, deep space nomadic vibe, slow tempo, 60 BPM.`
* **混音要求**：低频需要有轻微的“引擎震动”暗流感（Sub-bass hum），高频则要求像星光一样闪烁且遥远。

### 2. 《Absolute Zero》（绝对零度） —— 对应【宇宙静默】结局
* **配置路径**：`/audio/ending_neutral_cosmic_silence.mp3`
* **音乐定位**：纯器乐 (Instrumental) 或环境音 (Ambient Soundscape)，极简主义，摒弃一切强烈的情感起伏，传达一种超脱、死寂的意境。
* **AI 生成提示词 (Prompt)**：
  > `[Instrumental] Minimalist drone, absolute zero ambient, very low frequency hum, sparse crystal chimes fading into the void, emotionless, vast, cold, cosmic background radiation, 40 BPM.`
* **混音要求**：取消传统的旋律线（Melody），采用长音（Drone）和极少的点缀音。结尾需要有长达 5-10 秒的绝对静音（Absolute Silence）衰减，留白给玩家沉思。
