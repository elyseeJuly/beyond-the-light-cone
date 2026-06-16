# AUDIT_20260605_CG_LOSS_ANALYSIS | CG 图丢失与名称错乱核心原因分析报告

> **审计日期**: 2026-06-05  
> **分类前缀**: `AUDIT_` (审计与评估报告)  
> **当前状态**: 已归档并同步至 GitHub  

---

## 🔍 一、 核心原因一：为什么结局 CG 会“神秘丢失”？

### 1.1 命名不匹配（`cg_` vs `ending_`）
在 Web 重写版中，**大结局 CG** 的加载路径硬编码在 [endingConfig.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/config/endingConfig.ts) 中，文件名是以 **`ending_`** 开头的：
- `sceneImage: '/images/ending_conquest.png'`
- `sceneImage: '/images/ending_deterrence.png'`
- ...

然而，在重构日志 [HIST_20260525_ART_UI_UNIFICATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260525_ART_UI_UNIFICATION.md) 中，大事件命名被规整为了 `cg_` 开头（如 `cg_crisis_start.png` 等）。
用户在生成大结局时，按照大事件的风格命名将结局文件保存为了 `cg_conquest.png`, `cg_deterrence.png` 等，导致以下两个严重后果：
1. **无法触发**：代码中寻找的是 `ending_conquest.png`，因此游戏内只能加载之前提交的旧的/占位版的 `ending_conquest.png` 文件，用户放进去的 `cg_conquest.png` 无法被游戏触发。
2. **被 Git 清理擦除**：因为这批 `cg_conquest.png` 文件在 Git 中是未跟踪状态（untracked），且名称没有被代码中的静态配置或资源关联，在后续的多次 Agent 迭代测试、打包、自动排错中，如果 Agent 执行了类似 `git checkout .`、`git reset --hard` 或 `git clean -fd` 等操作，这些**未被跟踪的 CG 文件就会被直接从本地磁盘上彻底清空**。

---

## 🔍 二、 核心原因二：为什么名称与图片不符，游戏画面“张冠李戴”？

### 2.1 提示词指南与事件链的严重错配
对比文档 [SPEC_20260616_ART_PROMPTS_GUIDE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260616_ART_PROMPTS_GUIDE.md) 与游戏实际事件数据 [events.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/data/events.json)：

| 指南定义的 Prompt 节点 | 游戏实际的主线事件链 (events.json) | 代码映射规则 (GameEventManager.ts) | 造成的视觉错乱 |
| :--- | :--- | :--- | :--- |
| 1. 智子展开 / 危机纪元开启 | Year 0: 危机纪元开始 | `event_crisis_start_*.png` -> `cg_crisis_start.png` | ✅ 正确 |
| 2. 古筝行动 | Year 2: 古筝行动成功 | `event_guzheng_*.png` -> `cg_guzheng.png` | ✅ 正确 |
| 3. **水滴摧毁舰队 / 末日战役** | Year 50: **月球危机** | `event_moon_crisis_*.png` -> `cg_moon_crisis.png` | ❌ **月球解体事件，屏幕上却显示了“水滴撞击战舰”的图像** |
| 4. **掩体计划 / 木星城** | Year 300: **流浪地球** | `event_wandering_earth_*.png` -> `cg_wandering_earth.png` | ❌ **行星发动机推走地球，屏幕上显示的却是“木星掩体太空都市”** |
| 5. **二向箔打击 / 太阳系二维化** | 条件事件: 维度打击警报 | `event_dimensional_strike` -> `cg_dimensional_strike.png` | ✅ 正确 |

由于指南中缺少真正的**“月球危机”**与**“流浪地球地表发动机”**的专有 Prompt，用户按照指南的 3 和 4 生成了“水滴攻击”与“掩体城”，并按照代码要求的名称保存为了 `cg_moon_crisis.png` 和 `cg_wandering_earth.png`。
这直接导致游戏在触发月球危机和流浪地球时，背景图片显示的是风马牛不相及的“水滴战役”与“木星太空城”，画面显得十分错乱。

---

## 🔍 三、 核心原因三：为什么结局 CG 既不触发，迭代后还变得“面目全非”？

### 3.1 极难达成的胜利结局判定
在 `Game.ts` 中，威慑胜利（DETERRENCE）或小宇宙胜利（HIDDEN）等胜利判定有极其苛刻的数值要求（如必须在特定年份、文化值极高、拥有多个标志位且威慑度在 80 以上），游戏极易在 350 年判定为太阳氦闪或降维打击而直接失败。
因此玩家几乎无法在流程中自然看到自己生成的 6 大胜利 CG，每次结局都会自动导向失败结局（文明灭绝/太阳氦闪/逃亡崩溃），展现相同的失败结局 CG。

### 3.2 迭代过程被 Agent 的 `generate_image` 覆盖
当用户要求 Agent 修复“CG不触发”的问题时，之前的 Agent 没有发现文件名拼写和逻辑层面的这种错配，而是试图重新生成图片。Agent 调用了自身的 `generate_image` 工具重新生成了名为 `ending_*.png` 的图片，直接**覆盖**了用户精心生成的原作，导致图片彻底“面目全非”。

---

## 🛠️ 四、 修复与挽救方案

为了彻底解决这一问题，我建议进行如下改造：

1. **结局 CG 的双重兼容路径**：
   在代码映射层加入防错逻辑，无论是以 `cg_conquest.png` 还是以 `ending_conquest.png` 命名的文件，系统都能自动读取到同一个结局。
2. **入库保护**：
   一旦我们将正确的精美 CG 放入游戏，我会立刻将其加入 Git 跟踪（`git add`），防止在后续开发过程中因为版本切换或清理操作被物理删除。
3. **补充和拆分规范的 Prompt 指南**：
   - 补全真实的“月球危机”和“流浪地球地表发动机”的 21:9 原画 Prompt；
   - 将“水滴战役”和“木星掩体城”独立出来作为特定阶段的随机/条件事件 CG，而不是张冠李戴地作为月球危机和流浪地球的背景。
