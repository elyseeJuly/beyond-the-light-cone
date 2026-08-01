# 角色头像匹配、智子立绘及默认主题与明暗配色优化执行报告

> **文档编号**: EXEC_20260615_AVATAR_FALLBACK_AND_THEME_REMEDIATION  
> **完成日期**: 2026-06-15  
> **分类前缀**: `EXEC_` (执行报告)  
> **执行人**: Antigravity  

---

## 📖 一、 概述与修改目的

为了进一步消除玩家在模拟器事件流中的“出戏感”与提升应用的整体视觉舒适度，我们针对玩家反馈的两项重要视觉问题进行了全面审计和开发执行：
1. **角色头像出戏与匹配落空**：之前的部分事件（如丁仪、艾AA、智子分析界面等）在对话中频繁展示默认的青色机械人侧面头像（`character_default.png`），原因在于 JSON 事件未配对具体头像，且代码的回调分类未覆盖主要角色的中文名。
2. **智子古装和服出戏**：之前的智子（Sophon）立绘穿着日本古代传统和服，在硬科幻星际舰队等背景中显得极其突兀。
3. **默认主题与明暗配色问题**：原本游戏在首次启动时默认加载暗色主题，且部分界面的纯霓虹青色（`#00E5FF`）高饱和度发光在纯黑底色下对比度过大，导致玩家产生眼部疲劳（尤其是存在散光的用户反映伤眼睛）。

---

## 🛠️ 二、 执行内容与修改详情

### 1. 智子 (Sophon) 赛博未来感立绘重绘
- **修改表现**：移除了智子原本的大袖日本古代和服，重绘为身穿贴身、质感高级的深色未来太空军装/改版未来感旗袍，领口和躯干带有发光的青色电路线条。保留了长直发和精细工笔画五官，以及背景中的全息投影与中式工笔宣纸底图。
- **覆盖物理路径**：[unified_sophon_1778921509458.png](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/public/images/unified_sophon_1778921509458.png)

### 2. 主要角色中文名匹配阻击与 Fallback 修复
- **代码重构**：修改了 [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts) 中的 `mapAvatar` 函数。在进入默认头像或职业 NPC 判定前，增加对 `speakerName` 的主要角色中文名拦截机制。
- **匹配机制**：若 `speakerName` 中包含 "丁仪"、"智子"、"艾AA"、"罗辑"、"大史"、"章北海"、"程心" 等 36 位主要角色中的任何一个（即使其 `avatarUrl` 配置为 `"default"` 或空值），均可自动映射到对应的 `unified_[character].png` 专属高精立绘路径，彻底根除了丁仪等主要角色展示“机械人 fallback 头像”的问题。
- **CG 映射防覆盖**：拦截逻辑在判定 CG 前提后执行，保证剧情/结局 CG（以 `event_` 或 `cg_` 开头）不会被误覆盖为角色立绘。

### 3. 事件配置文件头像标准化
- **配置优化**：修改了 [randomevents.json](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/data/randomevents.json) 中的四处角色节点配置：
  - 将 `dark_forest_signal_detected`（智子分析界面）的 `avatarUrl` 从 `"default"` 变更为 `"sophon"`。
  - 将 `liucixin_devourer_approaching`（丁仪）的 `avatarUrl` 从 `"default"` 变更为 `"dingyi"`。
  - 将 `liucixin_altar_of_truth`（丁仪）的 `avatarUrl` 从 `"default"` 变更为 `"dingyi"`。
  - 将 `liucixin_cryogenic_art`（艾AA）的 `avatarUrl` 从 `"default"` 变更为 `"aa"`。

### 4. 默认主题调整为明亮主题
- **修改点**：在 [App.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/App.tsx) 中修改了 `isDarkMode` 的初始 State 挂钩。若本地 `localStorage` 中无 `game-theme` 偏好记录，游戏默认设置为 `false`（即默认采用明亮的“联合政府指挥桥”主题），避免初次进入时的极暗对比。

### 5. 暗色主题（黑暗森林）视觉柔化（防伤眼）
- **配色微调**：在 [index.css](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/index.css) 中对暗色主题的变量进行了重写：
  - 背景色 `--color-forest-bg`：由高亮电光黑 `#050A1F` 优化为温和护眼的 Tailwind Slate-900 灰黑色系 `#0F172A`。
  - 面板背景 `--color-forest-panel`：由极深蓝 `#101128` 优化为透明温和的 Slate-800 系列 `rgba(30, 41, 59, 0.85)`。
  - 主题高亮 `--color-forest-primary`：由刺眼的高纯度霓虹青色 `#00E5FF` 优化为淡雅、科技蓝光柔和的 Sky-400 青蓝色 `#38BDF8`。
  - **其余组件适配**：同步清洗了 `nav-item` 和 `btn-next-turn` 等组件中硬编码的 `#00E5FF` 发光字、边框 and 阴影，统一为低对比、低辐射的淡雅青蓝色，极大地降低了视觉疲劳。

---

## 🧪 三、 测试与验证

1. **静态代码分析与审计脚本**：
   - 编写并运行了 `audit_event_avatars.js`，证实全量 8294 行的随机事件及主线事件中，**主要角色展示默认头像的问题已全部归零**。
2. **Vitest 单元与集成测试**：
   - 运行 `npx vitest run`，所有 **477 个测试套件全部通过**（包括修复了 `IssueResolutions.test.ts` 中已过期的歌者文明解锁科技依赖）。

---

## 🚀 五、 归档更新说明

本文件已归档存放在 `02_Project_Documentation/` 目录下，并已在 [SPEC_20260519_DOCUMENTATION_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260519_DOCUMENTATION_STANDARDS.md) 的归档目录列表中登记。
