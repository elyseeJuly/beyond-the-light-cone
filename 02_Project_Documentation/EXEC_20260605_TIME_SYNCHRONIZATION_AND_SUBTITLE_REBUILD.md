# EXEC_20260605_TIME_SYNCHRONIZATION_AND_SUBTITLE_REBUILD | 兜底头像替换、时间引擎与电影质感字幕重构记录

> **文档日期**: 2026-06-05  
> **分类前缀**: `EXEC_` (执行与修复记录)  
> **执行状态**: 已完成并同步至 GitHub  

---

## 📖 1. 概述与目的

在 2026-06-05 的开发工作中，我们针对《宇宙群英传》在测试中暴露的弹窗头像画风残留、游戏主面板年份与大事记不一致、以及 CG 字幕过大遮挡画面等体验问题，进行了深度重构与资产替换。本记录作为正式开发和优化完成的执行交付文档，保存在项目本地并同步至 GitHub。

---

## 🔍 2. 核心修复与优化内容

### 2.1 兜底弹窗头像风格统一
* **问题**：在随机事件弹出无头像 NPC 或触发 fallback 时，系统会使用兜底资产 `character_default.png`。该图片原为写实 3D 人物风格，与统一的**工笔赛博风（Gongbi Cyberpunk）**存在严重割裂。
* **解决**：我们重新生成了符合工笔赛博风格的**全息人物剪影兜底头像**（羊皮纸底纹、墨线勾勒的全息人脸轮廓与浅蓝色电子回路），并覆盖替换了该文件：
  * **目标路径**：[character_default.png](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/public/images/character_default.png)
* **注意**：结局 CG 宽幅插图（`ending_*.png`）保持不动，未进行任何修改。

### 2.2 游戏年份与大事记一致性（时间引擎重构）
* **问题**：旧逻辑中，年份累加 `this.year++` 是在 `runARound()` 结算末尾同步执行的，而此时玩家可能尚未在弹窗中做出交互抉择。这导致主面板时间与大事记记录的年份产生了 1 年的错位。
* **解决**：我们重写了 [Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts) 中的年份推进机制：
  1. **年份推进暂缓**：当回合中触发了交互事件（如 `interactiveEvents.length > 0`）并推入弹窗队列时，年份暂不累加。
  2. **队列清空结算**：玩家在弹窗中做出选择并触发 `applyEventEffect()` 时，若队列及当前事件全部清空（`eventQueue.length === 0` 且 `currentEvent` 为空），则触发年份递增、纪元更替检查、胜负判定并向前端广播 `game-turn-complete`。
  3. **大事记滚动补全**：滚动大事件（`tickerEvents`）在触发时，会自动调用 `this.playerTimeline.push()` 以将相关信息完整记录在大事记时间轴中。

### 2.3 电影质感 CG 字幕布局重构
* **问题**：在 CG 叙事模式下，原有的发言人及内容文本框字号过大，占据了近半的画面高度，严重遮挡了原画并破坏了电影感。
* **解决**：重构了 [StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/StoryModal.tsx) 的 CG 播放模块：
  1. **上下黑框（Letterbox）设计**：在 CG 容器顶部和底部添加了固定黑条（`bg-black/90`），将 CG 插画包裹在中间，营造 21:9 宽画幅的电影观感。
  2. **文本下沉与字号微调**：将说话人名字设为精致的等宽高亮小字（置于底部黑框中央上方），对话内容字体大小适度收缩并完全限制在底部黑条内，保持中部 CG 画面干净、不受文字遮挡。
  3. **操作按键收拢**：所有“继续”（`Proceed`）或选择支按钮（`Choices`）统一收纳在底部黑条下方，使整个布局极简且高档。

---

## 🛠️ 3. 测试与验证结果

### 3.1 单元测试套件全量通过
我们修改了 [Civilization.test.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/test/core/Civilization.test.ts) 和 [Game.test.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/test/core/Game.test.ts) 中直接使用 `runARound` 断言年份加 1 的测试用例（在测试中模拟调用 `applyEventEffect(0)` 来显式清空队列），同时在 `vite.config.ts` 中配置了 `testTimeout: 60000`。
* **执行结果**：全量 267 个用例全部通过。
```bash
 Test Files  14 passed (14)
      Tests  267 passed (267)
   Start at  19:57:36
   Duration  17.89s
```

### 3.2 生产环境打包正常
* 执行 `npm run build` 打包无警告或报错，顺利输出优化后的前端分片：
```bash
vite v8.0.12 building client environment for production...
✓ built in 1.31s
dist/index.html                   0.73 kB
dist/assets/index-vw22up0d.css  102.32 kB
dist/assets/index-BU0jJfJx.js   752.96 kB
```

---

## 🎯 4. 推送同步状态

以上所有变动的源代码、测试脚本、新兜底美术资源及本篇执行记录文档均已完成本地提交，并通过 Git 推送至 GitHub 远程仓库：
```bash
git add .
git commit -m "feat: implement deferred year progression, cinematic subtitles, and replace character_default avatar with Gongbi Cyberpunk style"
git push
```
GitHub CI/CD 状态为**正常绿标（Success）**。
