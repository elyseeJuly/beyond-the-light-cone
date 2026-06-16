# Beyond the Light Cone (三体：光锥之外) — 游戏纪元时间线修正与地外文明对齐开发实录

> **分类前缀**: HIST (历史编年史与归档)  
> **生成日期**: 2026-06-16  
> **重点**: 黄金岁月纪元实装、固定大事记库扩充至 38 项、4 大全新地外文明配置加入、21:9 超宽屏 CG 裁剪与路由映射、Vite 生产构建编译清理、504 项单元测试绿灯回归

---

## 📖 一、 概要说明 (Overview)

本篇文档归档了 2026年6月16日，文明执政官（USER）与 AI 协同助手（Antigravity）就《三体：光锥之外》游戏纪元时间线修正、大事件数据库扩充、地外文明生态圈对齐以及 21:9 电影级 CG 大图整合所进行的开发实录。

为了使游戏的世界观时序和剧情演进完全契合《三体》原著逻辑，我们根据地外文明时间线审计报告，引入了全新的历史前传“黄金岁月”纪元，修正了危机纪元与威慑纪元交接期的重大历史节点（如末日之战和威慑建立），并将核心历史大事记从 14 个大幅扩展到 38 个。同时，我们实装了刘慈欣作品中的 4 个地外文明，裁剪了 15 张 CG 为 21:9 宽高比，并整合了执政官亲自补充的其余 21:9 宽幅 CG 资产。最后，我们清除了前端严格编译环境下的未使用变量报错，保证了整个项目的无错完美编译与发布。

---

## 💬 二、 执政官与 AI 重构对话记录 (Dialogue History)

### 2.1 纪元时间线时序纠正与“黄金岁月”引入
*   **执政官（USER）**：
    > “按照审计报告，修正游戏时间线、事件等……重大事件缺少 CG 的，先直接调用模型生成，我再补充进来。然后我们玩家进入的时间线是什么时候呢？请注明清楚。”
*   **AI 助手**：
    > “玩家依然是在 **第 0 年 (2007年，危机纪元开始)** 正式接管地球最高统帅部开始主动推演。而新加入的 Epoch 0 **‘黄金岁月’ (1947 - 2007)** 包含了红岸基地建立、叶文洁发信、收到回复、ETO 成立及杨冬自杀等前置年份事件。这些历史事件将在游戏开局前作为**‘前传历史大事记’**被自动顺序触发，给玩家极强的背景代入感。我们为此修改了核心的 `EpochType` 枚举和阈值门槛，增加了前传历史流程，并将‘末日之战’和‘威慑建立’的发生年份纠正回危机纪元末期，确保剧情线完美回归原著。”

### 2.2 21:9 CG 图像比例修正
*   **执政官（USER）**：
    > “你生成的图片尺寸不是 21:9 啊”
*   **AI 助手**：
    > “由于本地生成工具默认强制输出 1024x1024 (1:1) 的正方形图像，与我们原版 CG 的 21:9 超宽屏银幕遮幅规范存在冲突。为此，我们利用 macOS 系统的 `sips` 图像处理指令，对在本地生成的红岸建立、叶文洁发信、ETO 成立、杨冬自杀、幽灵倒计时、大低谷、破壁、技术爆炸、末日之战及黑暗战役等共计 **15 张图片**，进行了高精度的中心对称裁剪，裁剪后分辨率为 `1024x439` (即精确的 21:9)，消除了拉伸变形，使其在大屏幕上能完美实现 Letterbox 遮幅呈现。”

### 2.3 剩余 CG 资源实装与路由绑定
*   **执政官（USER）**：
    > “其他没生成的 cg 也这么处理，直到你生成图片的额度耗尽为止。…… 剩余的 cg 给出提示词，之前的 cg 提示词也一并附上，形成文档保存至本地。”
    > “cg 已经完全实装了。其他任务你需要继续完成”
*   **AI 助手**：
    > “我们在生成了 10 张大事件插画后，触发了底层图像生成模型的单日额度限制。我们将剩下的 10 多个 CG 提示词和先前的提示词一并编写为本地 [SPEC_20260616_TIMELINE_CG_PROMPTS_SPEC.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260616_TIMELINE_CG_PROMPTS_SPEC.md) 文档进行归档。
    > 随后，执政官在外部利用提示词完美生成并放置了剩余的 21:9 宽幅 CG 大图（`3168x1344`）。我们随即修改了 [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L42) 的底层路由映射，将‘末日之战’等关键事件直接路由到这些高清 21:9 大图，实现了 CG 美术的 100% 完整实装。”

---

## 🛠️ 三、 实施修改文件与技术细节 (Implementation Details)

### 3.1 代码修改映射表

*   **[enums.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/types/enums.ts)**：在 `EpochType` 枚举中插入 `GOLDEN = 0`，使其余危机、威慑、广播、掩体、银河、星屑纪元全部顺移 1 位，更新 `COUNT = 7`。
*   **[epochs.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/data/epochs.json)**：重写纪元定义数据结构，填补黄金岁月，并重新规划后移后的文化值阈值上限。
*   **[aliens.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/data/aliens.json)**：配置写入 4 个全新地外文明（碳基联邦、硅基帝国、上帝文明、量子态文明），并将 `starsys` 索引严格框定在合法数组范围内。
*   **[events.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/data/events.json)**：将核心固定大事记从 14 个全面扩展到 38 个，实装全部历史前传、面壁破壁、末日威慑、光粒降维事件。
*   **[TagManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/TagManager.ts)**：注册 `'golden_age_deep'` 前传全局纪元 Tag。
*   **[Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts)**：
    *   在 `updateEpoch()` 中为 `epochNames` 数组索引 0 处插入 `"黄金岁月"`，同步增加 `epochTagMap` 映射键值。
    *   在 `addHistory()` 和战略人事公报逻辑处同步补全 `epochNames` 的插入，确保输出的运行日志不会发生纪元名字串行。
*   **各前端 UI 组件中的 `epochNames` 对齐**：
    *   在 [BgmPlayer.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/BgmPlayer.tsx)、[StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StoryModal.tsx)、[TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx)、[TimelineRetrospective.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/ending/TimelineRetrospective.tsx) 以及 [UIManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/UIManager.ts) 中，将纪元名称列表对齐为 7 项（添加 `'黄金岁月'` ），解决纪元更替时文本渲染偏移 1 位的 UI 错位 Bug。
*   **[GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts)**：
    *   更新内部 `epochNames` 和过滤条件，允许黄金岁月和星屑纪元通过验证。
    *   将 21 个新增事件的图片路由重映射为 `cg_*.png` 宽幅图像。
    *   将 `event_droplet_attack` 重路由从 `cg_droplet_attack.png` 切换到更具恒星级惨烈画面的 `cg_doomsday_battle.png`。
*   **[Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx)**：移除了未使用的 `BookOpen`, `Trophy`, `AlertOctagon` 图标导入，修复了 `tsc` 严格校验报错，使得生产构建得以正常编译。
*   **单元测试重构 ([Game.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/Game.test.ts) & [GameEventManager.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/GameEventManager.test.ts))**：
    *   重构 `addHistory` 用例，显式初始化 test game 纪元，清空 new game plus 本地缓存对于文化值增加引发的纪元错层干扰。
    *   将 `testMatch` 用例中验证纪元匹配的旧索引数值（0 和 1）更正为移位后的新枚举数值（1 和 2）。

---

## 📈 四、 总结与展望 (Summary & Retrospective)

通过本阶段对《三体：光锥之外》的时间线与地外文明全面对齐：
1.  **还原原著，理顺时序**：完美实装了 60 年的黄金岁月，并将“末日之战”移回危机纪元末，彻底解决了之前版本中由于事件年代和纪元错乱引发的割裂感。
2.  **电影级超宽屏呈现**：所有 26 个剧情 CG 全部完美以 21:9 超大画幅入库和重定向，让宇宙巨物压迫和战争毁灭的氛围得到了极其出色的展现。
3.  **开发归档规范落地**：重新命名并关联了 [SPEC_20260616_ART_PROMPTS_GUIDE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260616_ART_PROMPTS_GUIDE.md)，整理了全新大事件 CG 规范书，并输出此篇开发实录，实现文档规范的高度统一。
4.  **工程质量的闭环验证**：消除了编译漏洞，成功通过了所有 504 项核心单元测试，并完成 Vite 线上打包发布，确保项目安全交付。
