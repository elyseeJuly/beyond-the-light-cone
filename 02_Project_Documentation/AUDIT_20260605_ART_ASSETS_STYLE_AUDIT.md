# AUDIT_20260605_ART_ASSETS_STYLE_AUDIT | 《宇宙群英传：三体重构》非 CG 美术资源风格审计报告

> **审计日期**: 2026-06-05  
> **分类前缀**: `AUDIT_` (审计与评估报告)  
> **当前状态**: 已归档并同步至 GitHub  

---

## 📖 1. 概述与审计目的

《宇宙群英传》的视觉表现采取了**双轨制美术风格**设计：
1.  **人物立绘与 NPC 头像**：统一采用 **工笔赛博风 (Gongbi Cyberpunk)** —— 传统国画工笔线描、低饱和矿物色设色（如朱砂、石青）、宣纸/羊皮纸底纹，辅以发光的冷色调全息/电子回路虚线环。
2.  **事件及结局 CG（宽屏 21:9）**：统一采用 **极简巨物概念原画风 (Epic Concept Art)** —— Craig Mullins 风格大笔触、大色块、注重巨物压迫感与强氛围光影。

本报告重点对**非 CG 类别**的静态美术资产（包括人物立绘、NPC 职业头像、结局插图等共计 61 张图片）进行了一次深入的风格一致性审计。审计发现，当前版本中仍有部分资产残留早期混乱写实风格，以及 NPC 头像风格严重割裂的问题。

---

## 🔍 2. 核心美术资源风格偏差审计

### 2.1 遗留人物立绘（`character_`）与新版统一立绘（`unified_`）的画风分裂 (Critical)
目前大部分核心角色已经迁移至 `unified_` 高清工笔赛博立绘，但磁盘与数据层中仍有 **5 个角色** 滞留在旧版的 `character_` 资产线：

| 角色 | 遗留图片文件名 | 风格冲突表现 | 影响范围 |
| :--- | :--- | :--- | :--- |
| **萨伊 (Sayi)** | `character_say_1779341254257.png` | **纯写实 3D 渲染画风**。深色背景，现代油画厚涂，面部光影过分立体，与罗辑、叶文洁等工笔线描宣纸风严重冲突。 | 剧情事件 `wallfacer_election` 弹窗 |
| **霍金 (Hawking)**| `character_hawking_1778726088806.png` | **写实照片级 AI 质感**。高光过强，且轮廓线模糊，缺乏水墨勾勒感。 | 人事面板、`persons.json` 属性卡 |
| **华华 (Huahua)** | `character_huahua_1778818926539.png` | **动漫二次元厚涂风**。色彩过于现代，五官偏向日漫比例，缺乏历史厚重感。 | 人事面板、`persons.json` 属性卡 |
| **严井 (Yanjing)** | `character_yanjing_1778819395854.png` | **现代概念插画风**。高饱和度冷光，与温润国画矿物色调格格不入。 | 人事面板、`persons.json` 属性卡 |
| **伊依 (Yiyi)** | `character_yiyi_1778724524669.png` | **现代日系立绘风**。线条过于圆润，背景无羊皮纸纹理。 | 人事面板、`persons.json` 属性卡 |

> [!WARNING]
> **视觉出戏问题**：这 5 个角色的立绘与 31 个 `unified_` 角色同时展现在游戏界面时，会产生明显的“时代割裂感”，极大削弱了视觉系统的沉浸感。

---

### 2.2 通用 NPC 职业头像（`npc_*.png`）风格完全背离 (High)
为了解决无头像 NPC 触发对话时的 fallback 降级，项目设计了 10 张通用 NPC 职业头像（如 `npc_military_commander.png`、`npc_scientist.png` 等）。
*   **审计现状**：这 10 张 NPC 图片目前的风格为**高光泽度、写实 3D 科幻人物渲染风**。
*   **风格偏差表现**：
    *   **背景**：采用现代科幻暗金属或霓虹光晕背景，而非统一的**微黄宣纸底纹**。
    *   **笔触**：属于典型的三维写实原画，没有**墨线白描勾勒**的笔锋质感。
    *   **设色**：高饱和的现代光源（如刺眼的蓝色、紫色射灯光），而非**低饱和天然矿物色调**。
*   **造成后果**：在随机事件弹出“参谋”、“研究员”或“难民”与主角对话时，主角是扁平的宣纸水墨立绘，而旁边的 NPC 是极具现代感的 3D 科幻肖像，对比极其突兀。

---

### 2.3 结局插图（`ending_*.png`）的一致性评估 (Pass)
*   **审计结论**：这 9 张结局图均符合 `ART_PROMPTS_GUIDE.md` 设定的 **Epic Concept Art** 风格（Craig Mullins 笔触、21:9 画幅、注重宏观尺度与氛围光）。
*   **设计合理性**：虽然它们不是工笔赛博风格，但这属于有意的**双轨设计**（剧情立绘为 2D 贴花，全屏结局为大笔触插画背景），在视觉设计逻辑上是自洽且统一的。各结局间虽然色调差异巨大（如征服胜利为火红色，黑域胜利为深渊黑色），但这属于主题化差异，不属于风格杂乱。

---

## 🛠️ 3. 针对性的重绘与优化方案

为了彻底统一非 CG 美术资源风格，建议执行以下修复路线图：

### 3.1 遗留 5 大角色工笔重绘 (P1)
使用 Midjourney 并挂载工笔赛博提示词公式，重绘这 5 位角色，并将其命名为 `unified_*` 格式。

*   **萨伊 (Sayi) 重绘 Prompt**:
    > Gongbi Cyberpunk style (传统工笔赛博). Portrait of Madame Say, Secretary-General of the UN. An elegant, elderly woman with short gray hair, wise and resolute, wearing dark green traditional Hanfu-inspired high-collar suit with subtle glowing cyan electronic circuitry along the seams. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric gold highlights. Flat 2D depth. No text. high quality, 4k. --ar 3:4
*   **霍金 (Hawking) 重绘 Prompt**:
    > Gongbi Cyberpunk style (传统工笔赛博). Portrait of Stephen Hawking. A brilliant, wheelchair-bound scientist with holographic quantum star charts floating around him. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric cyan highlights. Flat 2D depth. No text. high quality, 4k. --ar 3:4

*(其他三位 Huahua, Yanjing, Yiyi 亦依此公式重写提示词重绘)*

### 3.2 重新设计 10 大 NPC 职业头像 (P1)
重新生成全部 `npc_*.png` 资源，在提示词中强制注入 `Gongbi Cyberpunk` 与 `Muted parchment background`，使其完美融入剧情对话框。

*   **NPC 通用重绘 Prompt 公式**:
    > Gongbi Cyberpunk style (传统工笔赛博). Portrait of a generic [职业, e.g. military commms officer / angry rebel ETO / exhausted civilian worker]. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric cyan/gold highlights. Flat 2D depth. No text. high quality, 4k. --ar 3:4

---

## 🧹 4. 冗余清理与映射重构

1.  **数据层重构**：重绘完成后，修改 `persons.json` 中的 `faceFile` 引用，将所有的 `character_` 替换为新生成的 `unified_`。
2.  **逻辑层检查**：更新 `GameEventManager.ts` 的 `mapAvatar()`，将 huahua, yiyi, hawking, yanjing, say 的重映射条目从 `character_` 指向新的 `unified_` 文件。
3.  **磁盘清理**：在完成新立绘替代后，安全清理磁盘目录 [public/images/](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/public/images/)，删除所有被废弃的 `character_` 重复文件，仅保留 `character_default.png` 作为兜底。
