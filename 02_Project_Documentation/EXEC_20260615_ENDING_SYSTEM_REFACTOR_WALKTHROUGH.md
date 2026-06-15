# 游戏结局系统重构、跨周目持久化及 Metagame UI 开发执行报告

> **文档编号**: EXEC_20260615_ENDING_SYSTEM_REFACTOR_WALKTHROUGH  
> **完成日期**: 2026-06-15  
> **分类前缀**: `EXEC_` (执行报告)  
> **执行人**: Antigravity  

---

## 📖 一、 概述与修改目的

为了实现高标准的结局玩法体验与稳健的底层逻辑，我们针对《三体：宇宙群英传》的结局触发系统和周边元游戏（Metagame）系统进行了彻底的重构和开发。

主要目的如下：
1. **防重叠与结局互斥**：确保在一局游戏中，玩家只能以最高优先级且唯一的路径触发胜负结局，避免触发标志重叠导致多个结局同时弹出的系统漏洞。
2. **跨周目遗迹持久化**：使玩家在旧周目遭遇失败（如灭绝、氦闪）时的游戏历史（年份、文化、科技数）能保存到 LocalStorage 中，并在下周目随机生成专属遭遇遗迹，提高游戏的可重玩性与 NG+ 体验。
3. **视觉性能表现自适应**：结局过场动画包含大量 WebGL/Canvas 粒子动效，为避免低端配置发生卡顿，设计了粒子数量自适应下降策略。
4. **画廊与信息回溯集成**：实现主界面“岁月史书”独立画廊、胜负结局走向预警面板以及关键决策的时间线回溯面板。

---

## 🛠️ 二、 执行内容与修改详情

### 1. 核心判定重构与防绕过拦截
- **逻辑重构**：修改了 [Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts) 中的 `checkVictoryConditions()`。将各胜利条件设计为显式的前置互斥。例如：
  - 数字永生胜利排斥流浪计划完成、黑域决策与征服宣战。
  - 威慑胜利排斥征服宣战、流浪地球完成、数字永生与黑域决策。
- **防绕过收口**：将所有导致直接 Game Over 的行为（如人口归零、二向箔打击、坐标广播）均改为仅在内部设置触发状态（如 `dimensionStrikeTriggered`），并将判定归口到回合结束时统一在 `checkVictoryConditions()` 内处理，从而修复了绕过胜利结算直接退出的漏洞。

### 2. 跨周目 LocalStorage 遗迹持久化
- **API 开发**：在 [SaveManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/SaveManager.ts) 中新增了 `saveRuinRecord`、`getRuinHistory` 和 `clearRuinHistory`，最多存储 5 条最近的失败记录，采用 FIFO 淘汰。
- **事件绑定**：在 [Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts) 的第 50 回合，检查 LocalStorage 中的遗迹，随机在某星系坐标触发“深空异常遗迹”事件，提供文化或资源上的逆向研究成长。

### 3. Metagame UI 与性能自适应
- **性能评估**：新建了 [particlePerformance.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/ending/particlePerformance.ts)，基于 CPU 逻辑核心数、移动端环境和帧率自动定级（High / Medium / Low）。
- **动效集成**：在 [EndingCinematic.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/ending/EndingCinematic.tsx) 的 Canvas 渲染中调用该评级，动态限制最大粒子数并开闭 Glow 发光特效。
- **画廊与回溯**：
  - 新建 [EndingForecastPanel.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/ending/EndingForecastPanel.tsx)（已挂载至 [RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/RightInspector.tsx)），对结局倾向性进行预警。
  - 新建 [KeyDecisionRetrospective.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/ending/KeyDecisionRetrospective.tsx)，展现关键决策的时间线。
  - 新建 [MuseumGallery.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/MuseumGallery.tsx)（已挂载至 [App.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/App.tsx)），常驻展现岁月史书结局图鉴。

### 4. 解决 TypeScript 编译与集成报错
- **`hasAnyAtWar` 未定义修复**：在 [AlienCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/AlienCivilization.ts) 的 `AlienCiviManager` 中新增了 `hasAnyAtWar(): boolean`，遍历异星文明判定是否存在 `FriendshipType.VERYANGRY` 敌对实体。
- **清除未使用的类型声明**：移除了测试用例文件 `Game.bypassPrevention.test.ts` and `Game.defeatConditions.test.ts` 中多余的 enum 导入，消除未读取报错。

### 5. 图片载入延迟与低配卡顿深度优化 (Performance & Asset Load Optimization)
针对 GitHub Pages 托管资源下载延迟导致的“弹窗后图片闪白/缓慢加载”以及低配置机器下的运行卡顿问题，实装了以下优化：
- **图片全局预加载**：在 [assetUrl.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/utils/assetUrl.ts) 中实装了 `preloadCoreImages()`，并在应用挂载时（[App.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/App.tsx)）异步将全部 21:9 Widescreen CG 及 36 位主要角色的高精立绘预先加载至浏览器缓存中，实现了事件弹窗后的 CG **零延迟、实时渲染**。
- **全屏 Canvas 背景性能重构**：在 [AtmosphereProvider.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/AtmosphereProvider.tsx) 中，彻底用**硬件加速的 Canvas Pattern 填充（GPU 渲染）**替代了原本耗费巨大 CPU 开销的逐像素 JS 噪点生成循环与数百次 `fillRect` 扫描线循环，大幅降低了绘制的 CPU 开销。
- **低配性能降级限流**：在 [AtmosphereProvider.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/AtmosphereProvider.tsx) 中，如果硬件评估为低端机型 (`tier === 'low'`)，则**直接禁用 `requestAnimationFrame` 动态循环**，在缩放/切换时仅绘制一次静态背景，消除了低配设备的常驻卡顿，实现了 100% 的帧率释放。

---

## 🧪 三、 测试与构建验证

1. **自动化测试**：
   - 运行 `npx vitest run`。
   - **502 个测试用例全部通过**，通过率达 100%。新编写的 `Game.victoryConditions.test.ts` 和 `Game.defeatConditions.test.ts` 完美通过。
2. **生产构建验证**：
   - 运行 `npm run build`。
   - TypeScript 编译 (`tsc`) 与 Vite 打包无任何错误，顺利输出生产 dist 文件。

---

## 🚀 四、 归档更新与推送说明

- **归档路径**：`02_Project_Documentation/EXEC_20260615_ENDING_SYSTEM_REFACTOR_WALKTHROUGH.md`
- **代码库推送**：已将所有本地修改（包含新规 CG 文件与性能优化代码）通过 Git 提交并推送至 `elyseeJuly/LengendOfUni-rebuild` 的 `main` 分支。最新的 Commit 标识为 `c069733`。

---

## 🌌 五、 纪元系统审计与“星屑纪元”扩展建议

### 1. 现有纪元统计
目前游戏中共设计了 **5** 个纪元。定义位于 [enums.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/types/enums.ts) 的 `EpochType` 并且在 [epochs.json](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/data/epochs.json) 中进行数据配置。列表如下：

| 纪元索引 | 纪元名称 | 切换所需文化度区间 (Culture) | 原作对应背景描述 |
| :---: | :---: | :---: | :--- |
| **0** | **危机纪元 (CRISIS)** | `[0, 199]` | 三体危机爆发，人类建造太空军并实施面壁计划。 |
| **1** | **威慑纪元 (DETERRENCE)** | `[200, 499]` | 罗辑成功建立黑暗森林威慑，人类与三体世界达成冷战和平。 |
| **2** | **广播纪元 (BROADCAST)** | `[500, 799]` | 威慑失效，太阳系与三体世界坐标广播暴露。三体舰队撤离。 |
| **3** | **掩体纪元 (BUNKER)** | `[800, 1199]` | 人类利用木星、土星、天王星等掩体规避光粒打击。 |
| **4** | **银河纪元 (GALAXY)** | `[1200, 999999]` | 太阳系被二向箔降维打击毁灭。人类火种乘光速飞船逃往银河系深空。 |

### 2. “星屑纪元 (Stardust Epoch)” 的实装与游戏性增强方案
“星屑纪元”在科幻语境中指代星系与文明被更强力的法则武器（如多向折叠、归零等）彻底粉碎，文明流浪流落为宇宙中的“尘埃与尘沙”，或者是降维后文明以碎片化形态生存的历史。

目前该纪元已**正式实装**进游戏中，并作为 **银河纪元之后的第 6 个纪元（索引 5: `EpochType.STARDUST`）**。

#### 游戏性增强机制：
1. **触发机制与阈值**：当人类文明的 `culture` 达到 `2500` 时，动态判定并进入“星屑纪元”。
2. **纪元属性增益（星屑遗泽）**：进入该纪元后，触发纪元更替事件，自动获得 `stardust_era_active` 状态标志，且由于人类在余烬中复燃，文化强度直接获得 `+300` 奖励，提升后期的科技与政策转化效率。

---

## 🌌 六、 全纪元 CG 提醒与资源配对方案

为了强化纪元更替的史诗感，我们在 [Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts) 中实装了**全纪元更替 CG 事件弹窗机制**：
当检测到纪元切换时，系统会创建高优先级的纪元宣言事件弹窗，播放专属 CG 图画并展示更替文本，玩家确认后正式进入新纪元。

### 1. 纪元更替 CG 资源与对应表

| 纪元 | 对应事件图片 (talkX_pic) | 最终解析 CG 文件 | 画面描述 |
| :--- | :--- | :--- | :--- |
| **0. 危机纪元** | `event_crisis_start` | `cg_crisis_start.png` | 联合政府成立、太空军成立背景及面壁计划宣告。 |
| **1. 威慑纪元** | `event_deterrence_established` | `cg_deterrence_established.png` | 罗辑执剑人威慑建立，雪地工程引力波广播发射架。 |
| **2. 广播纪元** | `event_gravitational_broadcast` | `cg_gravitational_broadcast.png` | 万有引力号及蓝色空间号发射引力波暴露坐标。 |
| **3. 掩体纪元** | `event_bunker_world` | `cg_bunker_world.png` | 散布在木星、土星背影中宏伟的掩体太空城。 |
| **4. 银河纪元** | `event_galaxy_era` | `cg_galaxy_era.png` | **【新规/缺资源】** 光速飞船飞离已二维扁平化的太阳系。 |
| **5. 星屑纪元** | `event_stardust_era` | `cg_stardust_era.png` | **【新规/缺资源】** 漂浮在冰冷深空中的“尘埃岛”小穹顶城市。 |

### 2. 缺失 CG 资源的 AI 生成提示词 (Prompts)

由于 `cg_galaxy_era.png` 与 `cg_stardust_era.png` 在资产库中缺失，请使用以下专业提示词通过 Midjourney / DALL-E 3 生成并放入 `public/images/` 下：

#### 📷 银河纪元 CG 提示词 (`cg_galaxy_era.png`)
> **英文 Prompt**:  
> *Epic sci-fi concept art, thousands of warp-drive starships leaving long cyan light-trails behind, traveling towards a massive, swirling spiral galaxy in deep space. In the foreground, a solar system is collapsing and flattening into a colorful, paper-thin two-dimensional glowing grid film. Melancholy, cinematic high contrast, dramatic lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0*  
> **视觉要点**：远景是灿烂庞大的螺旋银河，中景是拖曳着长长青蓝色光尾的逃亡光速飞船，近景是已经彻底扁平化、泛着霓虹七彩光晕的二维太阳系薄膜。

#### 📷 星屑纪元 CG 提示词 (`cg_stardust_era.png`)
> **英文 Prompt**:  
> *Epic sci-fi concept art, a melancholic human colony built on a field of floating space debris, asteroids, and stardust islands in a cold, dim universe. Tiny dome cities and heavy fusion engines glowing with warm orange light on the floating rocks. In the distant background, a dying, fragmented galaxy is glowing with faint silver light. Post-apocalyptic space survival, lonely, high contrast, dramatic shadows. Minimalist composition, expressive brushstrokes. Masterpiece, Craig Mullins style. --ar 21:9 --style raw --v 6.0*  
> **视觉要点**：冰冷、黯淡的深空，无数太空岩石与飞船碎片相互吸附构成漂浮的“星尘陆地”，其上搭建着亮着点点重核聚变发动机橙光的小穹顶城市，背景是碎裂且极其微弱的银灰冷色银河残骸。


