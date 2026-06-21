# 美术视觉统一重绘与结局 CG 补全执行报告

> **文档编号**: EXEC_20260621_CG_ASSETS_COMPLETION_REPORT  
> **完成日期**: 2026-06-21  
> **分类前缀**: `EXEC_` (执行报告)  
> **执行人**: Antigravity (AI Tech Lead)  
> **关联文档**: 
> - [SPEC_20260616_ART_PROMPTS_GUIDE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260616_ART_PROMPTS_GUIDE.md) (美术资源提示词规范)
> - [SPEC_20260621_ENDING_TRIGGER_PATHS_REDESIGN.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260621_ENDING_TRIGGER_PATHS_REDESIGN.md) (结局触发路径重设计规格书)
> - [PLAN_20260621_ITERATION_REPAIR_PART4_ENDINGS.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/PLAN_20260621_ITERATION_REPAIR_PART4_ENDINGS.md) (结局系统迭代修复计划)

---

## 一、 任务背景与核心目标

根据项目最新的《美术资源提示词规范》，此前生成的 7 张事件 CG 画风在构图、色调、巨物感及笔触感上与项目整体的“极简巨物概念原画风（Epic Concept Art / Craig Mullins style）”存在偏差，且比例不符合银幕遮幅的宽幅 (`--ar 21:9`)。

同时，结合《结局触发路径重设计》对结局系统的扩充与重构，项目新增了 5 个结局分支，需要为其补全对应的结局 CG。

本次任务的目标是：
1. **重绘 7 张固定里程碑事件 CG**，使其严格符合 Craig Mullins 极简巨物画风规范与 21:9 画幅。
2. **补全 5 张新增结局 CG**，确保新结局路径具有专属的视觉呈现。
3. **完成本地资源集成与代码映射**，确保在游戏触发相应事件及结局时能够正确加载新图像。

---

## 二、 CG 资源生成与设计提示词 (Prompts)

所有 CG 统一遵循以下美术规范公式：
> `Epic sci-fi concept art, [场景描述]. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw`

以下是 12 张 CG 资源的具体提示词与设计细节：

### 1. 重绘的 7 张固定里程碑事件 CG

| 资源文件名 | 关联事件 | 场景描述 / 英文提示词 (Prompt) |
| :--- | :--- | :--- |
| **`cg_sophon_blockade.png`** | 智子封锁 (`event_sophon_blockade`) | **智子二维展开遮天蔽日**<br>`Epic sci-fi concept art, a colossal glowing geometric proton unfolding in the sky, covering the entire heavens above a dark modern city. Casting an eerie red and purple light. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |
| **`cg_teardrop_probe.png`** | 水滴抵近 (`event_teardrop_probe`) | **水滴静默悬停**<br>`Epic sci-fi concept art, a perfectly smooth, silver chrome teardrop-shaped probe floating silently in deep space. Reflecting distant starlight with absolute perfection. Ominous, silent vacuum. Massive scale contrast. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |
| **`cg_black_domain_debate.png`** | 掩体与黑域辩论 (`event_black_domain`) | **太阳系黑域包裹**<br>`Epic sci-fi concept art, the sun surrounded by a dark, swirling space-time distortion field that slows light. Swirling vortex of dark matter enclosing the solar system. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |
| **`cg_lightspeed_ship.png`** | 星环号光速试航 (`event_lightspeed_ship`) | **光速航行空间撕裂**<br>`Epic sci-fi concept art, a sleek, futuristic human spacecraft tearing through the fabric of space, leaving a glowing, distorted spatial trail (death line) behind it. Interstellar travel. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |
| **`cg_dimensional_warning.png`** | 维度打击警报 (`event_dimensional_warning`) | **二向箔临近**<br>`Epic sci-fi concept art, a glowing, infinitely thin perfectly flat translucent slip of paper floating in the vast darkness of space, approaching a distant blue planet. Ominous cosmic horror. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |
| **`cg_galaxy_exodus.png`** | 银河纪元大逃亡 (`event_galaxy_exodus`) | **光速飞船逃离扁平化太阳系**<br>`Epic sci-fi concept art, a fleet of futuristic lightspeed spaceships flying away from a flattening 2D solar system into the deep galaxy. Swirling vortex of flattened matter in the background. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |
| **`cg_zeroer_broadcast.png`** | 归零者大广播 (`event_zeroer_broadcast`) | **归零者全宇宙广播**<br>`Epic sci-fi concept art, a cosmic visualization of a universal broadcast, abstract glowing waves rippling across entire galaxies and nebulas. Profound, mysterious cosmic phenomenon. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |

### 2. 补全的 5 张新增结局 CG

| 资源文件名 | 关联结局分支 | 场景描述 / 英文提示词 (Prompt) |
| :--- | :--- | :--- |
| **`ending_signal_silenced.png`** | 信号静默 胜利 (`SIGNAL_SILENCED`) | **黑暗森林中的静默地球**<br>`Epic sci-fi concept art, a pristine Earth hidden safely in the dark cosmic forest. Silent radar arrays pointing at a quiet, starry night sky. Unexposed, peaceful preservation. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |
| **`ending_early_deterrence.png`** | 提前威慑 胜利 (`EARLY_DETERRENCE`) | **三体与人类舰队太空对峙**<br>`Epic sci-fi concept art, massive human battleships and alien ships locked in a silent, tense standoff in deep space. A fragile balance of mutual assured destruction. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |
| **`ending_lightspeed_exile.png`** | 光速流亡 胜利 (`LIGHTSPEED_EXILE`) | **驶向星海深处的逃亡飞船**<br>`Epic sci-fi concept art, multiple lightspeed ships traveling through a brilliant, distorted tunnel of light and stardust. Eternal journey into the unknown galaxy. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |
| **`ending_galactic_citizen.png`** | 银河公民 胜利 (`GALACTIC_CITIZEN`) | **跨星系联盟巨型空间站**<br>`Epic sci-fi concept art, a colossal, glowing alien megastructure and galactic hub in deep space, with diverse futuristic ships arriving. Humanity joining the galactic civilization. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |
| **`ending_defeat_eto_dominion.png`** | ETO 接管 失败 (`DEFEAT_ETO_DOMINION`) | **被征服的三体标志笼罩地球城市**<br>`Epic sci-fi concept art, a ruined, subjugated Earth megacity under a massive glowing emblem of the Trisolaran fleet. Dark, oppressive authoritarian rule. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style. --ar 21:9 --style raw` |

---

## 三、 本地集成与代码映射

### 1. 资源存放目录
所有生成的 CG 图片已全部成功移至 Web 重构版静态资源目录：
* `03_Web_Rebuild/public/images/`

### 2. 代码映射关系
* **重大里程碑事件 CG 映射**:  
  修改文件: [`GameEventManager.ts`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts)  
  在事件图片映射区域补全了前置事件与重绘 CG 资源的拦截关系：
  ```typescript
  if (name.startsWith("event_sophon_blockade")) return getImageUrl("cg_sophon_blockade.png");
  if (name.startsWith("event_teardrop_probe")) return getImageUrl("cg_teardrop_probe.png");
  if (name.startsWith("event_black_domain")) return getImageUrl("cg_black_domain_debate.png");
  if (name.startsWith("event_lightspeed_ship")) return getImageUrl("cg_lightspeed_ship.png");
  if (name.startsWith("event_dimensional_warning")) return getImageUrl("cg_dimensional_warning.png");
  if (name.startsWith("event_galaxy_exodus")) return getImageUrl("cg_galaxy_exodus.png");
  if (name.startsWith("event_zeroer_broadcast")) return getImageUrl("cg_zeroer_broadcast.png");
  ```
* **结局 CG 映射**:  
  根据 `EndingConfig` 接口定义，结局图片由 `sceneImage: getImageUrl('ending_[key].png')` 动态解析渲染。

---

## 四、 本地资源文件状态审计

对 `03_Web_Rebuild/public/images/` 进行全量文件扫描，12 张 CG 的本地状态均表现正常，未出现文件损坏或缺失，数据如下：

| 文件名 | 文件大小 (Bytes) | 物理路径 | 审计状态 |
| :--- | :--- | :--- | :--- |
| `cg_sophon_blockade.png` | 698,176 | [cg_sophon_blockade.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_sophon_blockade.png) | 正常 (已重绘) |
| `cg_teardrop_probe.png` | 620,472 | [cg_teardrop_probe.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_teardrop_probe.png) | 正常 (已重绘) |
| `cg_black_domain_debate.png` | 639,618 | [cg_black_domain_debate.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_black_domain_debate.png) | 正常 (已重绘) |
| `cg_lightspeed_ship.png` | 786,291 | [cg_lightspeed_ship.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_lightspeed_ship.png) | 正常 (已重绘) |
| `cg_dimensional_warning.png` | 551,976 | [cg_dimensional_warning.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_dimensional_warning.png) | 正常 (已重绘) |
| `cg_galaxy_exodus.png` | 623,475 | [cg_galaxy_exodus.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_galaxy_exodus.png) | 正常 (已重绘) |
| `cg_zeroer_broadcast.png` | 692,201 | [cg_zeroer_broadcast.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/cg_zeroer_broadcast.png) | 正常 (已重绘) |
| `ending_signal_silenced.png` | 686,841 | [ending_signal_silenced.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/ending_signal_silenced.png) | 正常 (已补全) |
| `ending_early_deterrence.png` | 691,146 | [ending_early_deterrence.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/ending_early_deterrence.png) | 正常 (已补全) |
| `ending_lightspeed_exile.png` | 8,277,664 | [ending_lightspeed_exile.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/ending_lightspeed_exile.png) | 正常 (已补全) |
| `ending_galactic_citizen.png` | 6,528,475 | [ending_galactic_citizen.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/ending_galactic_citizen.png) | 正常 (已补全) |
| `ending_defeat_eto_dominion.png` | 6,398,940 | [ending_defeat_eto_dominion.png](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/ending_defeat_eto_dominion.png) | 正常 (已补全) |

> [!NOTE]
> 针对生成过程中曾遭遇 API 图像生成限制的 3 张结局 CG (`ending_lightspeed_exile.png`, `ending_galactic_citizen.png`, `ending_defeat_eto_dominion.png`)，现已全部成功补全并载入本地项目中，资源与配置文件已达到 100% 完整度。

---

## 五、 后续建议

1. **结局系统对接**：
   目前新增的 5 个结局及相关视觉资源已就绪，但结局系统具体判定机制的重构仍需以 `SPEC_20260621_ENDING_TRIGGER_PATHS_REDESIGN.md` 规格书为指引，建议在后续 Part 4 开发阶段对 `src/config/endingConfig.ts` 等文件进行相应的代码扩充，完成对这 5 个新增结局触发的逻辑绑定。
2. **真机与回归测试**：
   在自动化回放或测试用例中验证各里程碑事件被触发时 CG 的正确拦截和渲染，防止路径拼写或格式不一致导致界面加载空白。
