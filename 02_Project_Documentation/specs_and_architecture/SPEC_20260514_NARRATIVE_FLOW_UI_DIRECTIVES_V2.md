![][image1]  
《宇宙群英传》Web端叙事心流与UI反馈层重构方案 (V2 最终版)

**致接手开发的 AI 提示 (System Prompt for AI):**

你现在是一位顶级的 React \+ TypeScript 独立游戏前端开发专家。本项目是一款基于《三体》世界观的硬核 4X 策略游戏。

**核心痛点：** 游戏底层逻辑已跑通，但由于采用了“异步日志式”架构，丢失了原版 MFC 的“强制剧情介入感”、“多段对话表现力”以及“视觉微反馈”。

**最高指令：** 严格按照以下四个模块（A/B/C/D）的设计规范进行 UI 与状态机的重构。绝对禁止修改底层的数值公式，你的任务是构建完美的“表现层（Presentation Layer）”与“拦截器（Interceptor）”。

## **Module A: 沉浸式剧情弹窗与多段对话系统 (Immersive Modal & Dialog Queue)**

*针对 Audit 痛点：多段对话阉割、角色视觉链断裂、叙事中断感消失。*

**设计意图：** 重构一个支持多段对话（1-N 序列）和角色头像展示的模态框，并在事件触发时强制阻塞游戏主线程。

**开发规范与约束：**

1. **严格的接口定义 (必须使用)**:  
   export interface DialogNode {  
     speakerName: string; // 讲话者姓名，如 "汪淼", "系统警告"  
     avatarUrl?: string;  // 角色头像路径，如 "/images/wangmiao.bmp"  
     content: string;     // 对话内容，要求 UI 实现打字机(Typewriter)特效  
   }

   export interface GameEventPayload {  
     id: string;  
     title: string;       // 事件大标题  
     dialogQueue: DialogNode\[\]; // 【核心】多段对话序列  
     choices: { label: string; action: () \=\> void }\[\]; // 玩家决策  
   }

2. **组件表现 StoryModal.tsx**:  
   * **布局**：左侧固定显示当前 DialogNode 的 avatarUrl (带发光或阴影效果的深色立绘)，右侧/下方显示 speakerName 和逐字打印的 content。  
   * **交互逻辑 (点击继续)**：如果 dialogQueue 长度 \> 1，玩家点击面板时，不显示 choices 按钮，而是切换到下一个 DialogNode。直到播放到最后一个节点，才显示决策按钮。  
3. **主循环阻塞 (Turn-blocking)**：在 Game.ts 结算时，若触发事件，立刻暂停回合推进，将事件数据推入全局状态 currentEvent，直到玩家完成所有对话并点击 Choice，才允许继续游戏。

## **Module B: 随机事件引擎挂载 (Random Chaos Engine)**

*针对 Audit 痛点：随机事件库真空，缺乏变数。*

**设计意图：** 恢复原版的 RunRandomEvent 逻辑，让每回合都有不可预测的命运波动。

**开发规范与约束：**

1. **事件池构建**：新建/解析 randomevents.json 文件。  
2. **回合级概率判定**：  
   * 在 Game.ts 的 nextTurn 逻辑中，增加一个独立的 checkRandomEvents() 方法。  
   * **机制**：每回合执行一次伪随机数判定（如 15% 概率）。若命中，则从事件池中随机抽取一个符合当前纪元（Epoch）条件的随机事件。  
   * **管线移交**：抽中事件后，将其转换为 GameEventPayload 格式，并立即通过 Module A 的通道弹出。

## **Module C: 资源微反馈视觉系统 (Numeric VFX HUD)**

*针对 Audit 痛点：数值影响不可见，黑盒化。*

**设计意图：** 资源变化必须“流血”或“发光”。

**开发规范与约束：**

1. **跳字组件 FloatingText.tsx**:  
   * **机制**：当 HUD 上的核心资源（人口、经济、军力等）发生变动时，在对应数字旁边/上方触发跳字动画。  
   * **视觉**：正向收益用 text-green-400 (+100)，负向损失用 text-orange-500 或 text-red-500 (-500)。向上飘动并带有 opacity 渐隐（CSS animation 约 1.2s）。  
2. **高危警报 (Critical Alert)**：如果某项资源单回合下降超过 20%，对应的 HUD 容器需要闪烁红光警报 (animate-pulse border-red-500)。

## **Module D: 回合级终局监测与史诗面板 (Turn-level Endgame Screen)**

*针对 Audit 痛点：缺乏明显的 Turn-level 终局检查与大图文展示。*

**设计意图：** 恢复生死存亡的压迫感，胜利与失败需要宏大的仪式感。

**开发规范与约束：**

1. **实时监测**：在每回合的最末尾（所有事件结算完后），强制运行 checkGameOverConditions()。  
2. **终局展现 EndGameScreen.tsx**:  
   * 完全覆盖原本的游戏主界面，禁止关闭。  
   * **视觉**：根据不同结局（如“二向箔打击”、“流浪地球启航”），加载对应的全屏大背景图。  
   * **岁月史书**：像打印报纸一样，逐行打印玩家的存活年份、最高科技节点、文明最终人口。  
   * **配乐指示**：预留调用背景音乐 API 的 Hook，在终局时切断常规 BGM，播放对应的史诗/悲凉音效。

### **⚠️ AI 执行约束 (Rules of Execution)**

1. **切勿大包大揽**：请不要一次性生成所有代码。必须逐个 Module 与我确认。现在，请你先根据 **Module A**，编写 StoryModal.tsx 及其相关状态管理逻辑。  
2. **拒绝 alert()**：代码中绝对不允许出现 window.alert 或 window.confirm。  
3. **Tailwind 强制**：所有样式必须使用 Tailwind CSS 类名，利用 dark: 前缀兼容之前的双主题系统。

[image1]: <data:image/png;base64,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>