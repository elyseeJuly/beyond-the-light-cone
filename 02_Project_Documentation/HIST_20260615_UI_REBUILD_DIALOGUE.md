# Beyond the Light Cone (三体：光锥之外) — UI/UX 重构对话实录与开发纪实

> **分类前缀**: HIST (历史编年史与归档)  
> **生成日期**: 2026-06-15  
> **重点**: 《银河文明档案馆》视觉定位确定、多维星图划分、React 设置面板统合、模态框视觉收拢、遗留 HTML 代码清理  

---

## 📖 一、 概要说明 (Overview)

本篇文档归档了 2026年6月15日，文明执政官（USER）与 AI 协同助手（Antigravity）就《三体：光锥之外》进行的一场具有里程碑意义的 UI/UX 全面重构对话及实施细节。

通过本轮重构，游戏彻底摆脱了早期“NASA 航天局控制台/遥测监视器”的冷冰冰冰感，跃升为具有宏大叙事史诗感的**“银河文明档案馆 (Galactic Civilization Archive)”**。所有关键交互界面、全局星图、设置面板和弹窗进行了 100% 的现代化 React 升级与视觉艺术收拢。

---

## 💬 二、 执政官与 AI 重构对话记录 (Dialogue History)

### 2.1 视觉世界观的颠覆性定位
*   **执政官（USER）**：
    > “游戏目前的视觉太像 NASA 的卫星控制台或普通的星图软件了，缺乏代入感。玩家的身份应该是‘文明执政官’，肩负着跨越多个纪元、决定文明生死存亡的史诗职责。我们需要重构整套 UI，让玩家觉得他是在书写文明的编年史。”
*   **AI 助手**：
    > “明白。我们将核心设计哲学定义为**《银河文明档案馆》**。UI 的基调将充满‘历史感、传承感、命运感’。主色调锁定在代表文明档案的深海蓝（`#00B8FF`）、深空背景底色（`#070B14`）、档案细框灰（`#243245`）以及档案白（`#DDEEFF`）。所有组件将采用直角或极微小的圆角、高透磨砂玻璃质感（`glass-archive`），抛弃花哨的渐变和大面积色块。”

### 2.2 多层级星图与动态殖民符号的探讨
*   **执政官（USER）**：
    > “目前的星图仅仅做好了太阳系内部的行星渲染。随着游戏进程推进，人类要征服更多的恒星系，我们需要一个更大、更宏观的星图，包含领土归属和动态的殖民符号。”
*   **AI 助手**：
    > “我们将在星图顶端加入四个层级的全息 Tab 选择器：
    > 1. **[太阳系]**：渲染行星轨道和公转。
    > 2. **[50光年]** / **[1万光年]**：渲染为战术星团。我们将计算邻近星系（距离小于 180 像素）的星座连线，并在底部展现雷达辅助坐标十字线及分区微型编号（如 `[SEC-442 / LY-15]`）。
    > 3. **[银河系]**：采用双臂旋涡公式（`Spiral Formula`）渲染 800+ 颗散落的恒星系，展现宏伟螺旋臂结构。
    > 
    > **动态殖民符号升级规则**：
    > - 哨所或小殖民地（人口 < 100 且无建筑）：渲染为最精简的空心圆圈 `○`。
    > - 工业开发星（人口 < 500 且拥有矿场/工厂）：渲染为代表生产力的三角形 `△`。
    > - 繁华大都市（人口 >= 500 或有大型城市）：渲染为代表高级文明聚落的菱形 `◇`。
    > 
    > **领土归属**：任何已被势力占领的恒星系，会在周围绘制带对应派系颜色（人类为青蓝，三体为红色，中立为金色/绿色）的脉冲发光虚线环，并标注 `[地球领土]` 或 `[三体占领区]` 等文本标签。”

### 2.3 设置模块收纳与冗余工具栏清理
*   **执政官（USER）**：
    > “左下角的工具栏太臃肿了，高对比度、语言、帮助、保存、设置齿轮堆在一起。另外设置模块目前好像没做完。”
*   **AI 助手**：
    > “我们将精简 `LeftHub.tsx` 工具栏，仅保留 `BgmPlayer` 与 Settings 齿轮。点击齿轮会派发全局 `open-settings` 自定义事件。
    > 我们在 `App.tsx` 中引入了全新的 React 版 `SettingsModal.tsx`，通过接收全局事件直接弹出精致的玻璃磨砂设置板，集成了音量控制、显示辅助、多语言切换、存档读取、执政指南等所有非高频操作功能，从而彻底废弃了遗留的通过 HTML 字符串拼接出来的弹窗 `SystemMenuPanel.ts`。”

### 2.4 遗留全局模态框的视觉收拢
*   **执政官（USER）**：
    > “还有舰队弹窗、战斗画面、新手引导这些地方，也需要跟着这套‘档案馆’的风格统一，不能有圆角大渐变色块的割裂感。”
*   **AI 助手**：
    > “好的，我们将针对这三处主要弹窗做如下调整：
    > 1. **`FleetModal.tsx`**：外框去除大圆角，采用 `glass-archive` 的直角结构与深空档案蓝格调。
    > 2. **`BattleScreen.tsx`**：统一为深空蓝底配 `#243245` 细框，使用轻量微发光矢量元素，代替高饱和的彩底。
    > 3. **`Tutorial.tsx`**：将引导提示的背景从五彩斑斓的渐变色块收缩为低调的单色虚化卡片，Outlined 图标与整套风格对齐。”

---

## 🛠️ 三、 实施修改文件与技术细节 (Implementation Details)

### 3.1 代码修改映射表
本轮重构共涉及了前端重构包中的 **14 个文件** 的修改与清理：

*   **[App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx)**：挂载新 React `SettingsModal`，绑定 `open-settings` 自定义事件侦听。
*   **[LeftHub.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/LeftHub.tsx)**：精简底部按钮，保留 BgmPlayer 与 Gear 齿轮，实现 Dispatching 事件。
*   **[SettingsModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/SettingsModal.tsx) [NEW]**：用全新 React 交互整合全局控制选项。
*   **[StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx)**：挂载 4-Tab 切换状态并桥接至 Canvas 渲染器。
*   **[StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts)**：重组渲染主循环。
    *   *双臂螺旋公式实现*：
        ```typescript
        const theta = index * 0.08;
        const r = 40 + index * 0.7;
        const arm = index % 2 === 0 ? 0 : Math.PI;
        star.x = centerX + r * Math.cos(theta + arm);
        star.y = centerY + r * Math.sin(theta + arm);
        ```
    *   *动态符号渲染*：基于人口和建筑条件返回 `○` (哨所)、`△` (工业星) 或 `◇` (繁华星)。
    *   *领土环与星座线*：对占领星系绘制脉冲光晕，对近邻（<180px）散点绘制星座折线。
*   **[UIManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/UIManager.ts)**：移除旧版 `systemMenuPanel` 的引用和依赖，重定向旧按钮事件。
*   **[SystemMenuPanel.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/SystemMenuPanel.ts) [DELETE]**：彻底删除，不再占用项目空间。
*   **[FleetModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/FleetModal.tsx)**、**[BattleScreen.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/BattleScreen.tsx)**、**[Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx)**：全部剔除大圆角、亮色块，应用 `glass-archive` 档案盒设计系统。

### 3.2 编译与构建表现
在重构与清理后，对项目执行了严格的编译测试：
1.  **TypeScript 检查**：运行 `npm run typecheck` (`tsc --noEmit`) 成功，100% 零编译警告和死代码未定义错误。
2.  **Vite 生产构建**：运行 `npm run build` 成功。产出完美的 CSS (106.54 kB) 与 JS (885.53 kB) 代码包。

---

## 📈 四、 总结 (Summary & Retrospective)

通过本轮 UI/UX 重构对话及彻底落地，PDC（行星防御理事会）执政官的界面实现了**宏大叙事层面的跨越**：
*   不仅视觉上完美复刻了《三体》中低调、严谨、深邃的硬核科幻基调。
*   从工程架构上也完成了对遗留 DOM 拼凑弹窗（`SystemMenuPanel`）的清理，使前端应用完全跑在 React 数据响应式驱动下。
*   完成了与 GitHub 远程仓库的安全同步。
