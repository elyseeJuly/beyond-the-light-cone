# Beyond the Light Cone (三体：光锥之外) — 新手教程手把手联动与剧情CG呈现重构实录

> **分类前缀**: HIST (历史编年史与归档)  
> **生成日期**: 2026-06-16  
> **重点**: 新手教程视图联动切换（change-active-view）、手把手开局引导步骤重写、重置时间线 localStorage 缓存清理、StoryModal CG 与立绘层级冲突解决  

---

## 📖 一、 概要说明 (Overview)

本篇文档归档了 2026年6月16日，文明执政官（USER）与 AI 协同助手（Antigravity）就《三体：光锥之外》新手教程深度交互联动及剧情 CG 显示修复所进行的开发实录。

为了提升首次游玩和重开时的手把手教学体验，我们在此前的“银河文明档案馆”UI重构基调上，开发了动态视图联动系统。当新手教程进行到讲解不同模块（如科技研发、内阁政府、外交情报）时，主界面会无缝自动切换到对应的子系统，使文字讲解与 UI 元素完美一一对应。同时，我们彻底解决了“重置时间线后新手教程不再显示”的 localStorage 状态遗留问题，并重构了 `StoryModal`，使得 CG 背景能够高亮展现且不会被说话人头像遮挡。

---

## 💬 二、 执政官与 AI 重构对话记录 (Dialogue History)

### 2.1 重置时间线后新手教程消失的问题
*   **执政官（USER）**：
    > “重置时间线完全不显示新手教程了。之前的版本中重开还会闪现一下教程，现在重新测试重开直接看不到了。”
*   **AI 助手**：
    > “这是因为在重构教程的 Skip（跳过）和 Complete（完成）逻辑后，一旦玩家触发过一次教程，本地的 `localStorage` 就会持久化写入 `game-tutorial-seen: 'true'`。在‘重置时间线’按钮触发 `window.location.reload()` 重新载入时，由于该 LocalStorage 键值未被清除，React 的 State 初始化为 false，直接跳过了教程。我们将清除逻辑同步写入 `Game.reset()` 以及设置面板的重置流程中，确保 timeline 重置是完全洁净的。”

### 2.2 古筝行动与纪元更替 CG 缺失、立绘遮挡问题
*   **执政官（USER）**：
    > “古筝行动等纪元事件还是没有加载 CG。而且事件的说话人立绘出现在了 CG 画面的左侧，尤其是纪元更替这种历史记录事件，会塞一个默认的灰色剪影立绘，非常出戏。”
*   **AI 助手**：
    > “这涉及两个 UI 层面的冲突：
    > 1. **CG 图片可见性**：在 `StoryModal.tsx` 中，CG 图像被渲染在最底层且只有 `opacity-[0.35]`，但其上覆盖的 Modal 容器（`bg-[#070B14]/90`）和内容区（`bg-[#070B14]/65`）几乎完全不透明，导致 CG 彻底被压在黑幕底下看不清。我们将图片可见性提高到 `85%` 并使内容板在 CG 状态下透明，仅保留底部文字淡黑渐变以确保文字可读。
    > 2. **立绘遮挡**：当事件为 CG 展现时，不应该渲染左侧的 240px 角色肖像区（`currentNode.isCG === true`）。我们将立绘显示逻辑限定在 `hasSpeaker && !currentNode.isCG`。在 CG 事件中隐藏左侧肖像区，让 CG 全屏展现，同时把角色名字以悬浮标签形式挂载，确保视觉美观且信息完整。”

### 2.3 新手教程与 UI 无法一一对应及手把手操作引导
*   **执政官（USER）**：
    > “新手教程与 UI 页面不能一一对应，有些二级菜单没有事先操作，看起来会让玩家摸不着头脑。你给一版完整的新手教程优化方案，要手把手教玩家怎么玩。”
*   **AI 助手**：
    > “好的。要解决‘纸上谈兵’式的文字描述，最彻底的方案是**‘动态视角同步’**：
    > - 在 `TUTORIAL_STEPS` 步骤配置中加入 `activeView: ActiveViewType`。
    > - 在 `App.tsx` 中注册 `change-active-view` 全局自定义事件处理器。
    > - 当教程翻页到‘内阁政府’、‘科技树’、‘情报中心’时，教程组件会自动抛出事件，促使 `App` 切换左侧主视图到对应子面板，使得玩家的视线 and 教程文本完全对应。
    > - 同时重写引导内容，以‘手把手指令’形式（如‘第一步：点击地球，建设采矿场’、‘第二步：前往内阁，指派官员’）教学开局生存，极大提升开局游玩的流畅度。”

---

## 🛠️ 三、 实施修改文件与技术细节 (Implementation Details)

### 3.1 代码修改映射表

*   **[Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts)**：在 `reset()` 中清除 `game-tutorial-seen` 标记。
*   **[SettingsModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/SettingsModal.tsx)**：在 `handleRestart` 重开调用中同步清理 localStorage 并 reload。
*   **[StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StoryModal.tsx)**：
    *   CG 不透明度拉升：`opacity-[0.35]` ➔ `opacity-[0.85]`。
    *   CG 事件下 Modal 容器样式改变：`${currentNode.isCG ? 'bg-[#070B14]/20' : 'bg-[#070B14]/90'}`。
    *   隐藏大立绘：`hasSpeaker && !currentNode.isCG`。
    *   右侧面板背景透明：`${currentNode.isCG ? 'bg-transparent' : 'bg-[#070B14]/65'}`。
*   **[App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx)**：挂载 `change-active-view` 监听事件，驱动全局侧边栏子页面的切页：
    ```typescript
    const handleActiveViewChanged = (e: Event) => {
      const view = (e as CustomEvent).detail as ActiveViewType;
      if (view) {
        setActiveView(view);
      }
    };
    window.addEventListener('change-active-view', handleActiveViewChanged);
    ```
*   **[Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx)**：
    *   在步骤属性中加入 `activeView: ActiveViewType`。
    *   重写全部 10 步手把手操作说明，并将“五大纪元”表述更新为“六大纪元”。
    *   挂载 `useEffect` 在翻页时同步分发事件：
        ```typescript
        useEffect(() => {
          if (current && current.activeView) {
            window.dispatchEvent(new CustomEvent('change-active-view', { detail: current.activeView }));
          }
        }, [current]);
        ```
    *   在 `handleSkip` 与完成回调中分发 `'starmap'` 视角切回事件。

---

## 📈 四、 总结 (Summary & Retrospective)

通过本轮手把手新手引导动态联动重构和 CG 遮挡修复，游戏的新手交互取得了如下跨越性提升：
1.  **所见即所得的游玩教学**：玩家不必再去寻找科技树或内阁在哪里。教程翻到哪一页，主页面便切入哪一页，结合精准的雷达发光遮罩高亮，真正实现了保姆级的新手教学指南。
2.  **纯净无垢的周目重置**：重置时间线能够完美、百分之百地将玩家带回初始教程，解决了 Skip 后无法再次体验的死锁。
3.  **完美的大屏幕 CG 叙事体验**：去除了横向遮挡 CG 达 240px 宽度的出戏角色头像立绘，拉升了图片的展示亮度，极大地烘托了古筝行动及宏大纪元更替的厚重历史质感。
