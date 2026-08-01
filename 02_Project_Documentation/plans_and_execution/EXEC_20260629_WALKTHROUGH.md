# 交付验证汇报 (EXEC_20260629_WALKTHROUGH.md)
> **版本号**: V1.0.0
> **生效日期**: 2026-06-29
> **基于版本**: N/A

---

## 📖 一、概述

本期开发会话完成了对 UI 重构版中新手教程（Tutorial）与顶部状态栏（TopHUD）核心交互缺陷的深度修复，并对岁月史书双轨时间轴、外星文明接触事件进行了功能性完善。所有修改已经通过全量自动化测试验证，状态恢复正常。

---

## 📊 二、交付指标

### 1. 测试运行记录
- **测试框架**: Vitest
- **测试用例数**: 43 个测试文件，875 个测试用例
- **通过率**: 100% (875/875 passed)
- **运行命令**: `npm run test`

### 2. Registry 状态变化
本次会话中，主场景测试注册表（`src/test/scenarios/_registry.md`）中的以下条目已全部变绿：

| ID | 场景名称 | 变更前 | 变更后 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **SCEN-TUTORIAL-STEPS-MATCH** | 教程步骤分类对齐 | 🔴 RED | 🟢 GREEN | 重构教程分类，侧边栏唯一化去重，解决同名重复按钮问题 |
| **SCEN-HUD-RESPONSIVE** | HUD 自适应与指标展示 | 🟢 GREEN | 🟢 GREEN | 取消响应式隐藏，在所有分辨率下常驻显示稳定度、人口、资源、军力、威慑度 |
| **SCEN-TIMELINE-COMPARE** | 岁月史书双轨时间轴对比 | (新增) | 🟢 GREEN | 实现岁月史书双轨历史命运对比分析功能 |
| **SCEN-ALIEN-CONTACT** | 外星文明接触事件弹窗 | (新增) | 🟢 GREEN | 增加 discovered/contacted 两阶段弹窗及 ticker 提示机制 |

### 3. GitHub 同步状态
- **推送分支**: `main`
- **目标仓库**: `https://github.com/elyseeJuly/beyond-the-light-cone`
- **当前状态**: 已同步（Working tree clean）

---

## 🛠️ 三、具体改动内容与技术实现

### 1. 新手教程（Tutorial.tsx）分类与去重重构
- **分类对齐**：恢复 `'基础操作'` 为教程中通用步骤的内部组织分类，明确其为教程专有标签，不与 LeftHub 的侧边栏强制 1:1 绑定。
- **连续步骤去重问题**：由于 `reduce` 函数按连续元素合并，导致 `TUTORIAL_STEPS` 数组首尾的 `'基础操作'` 步骤被中间的其他分类打断时，在侧边栏渲染出两个“基础操作”按钮。本次重构将其改为按 **唯一键名去重 (Unique by Name)**，过滤了重复项，确保侧边栏只显示 5 个核心类别按钮。

### 2. 新手教程 SVG 镂空遮罩与透明事件拦截区
- **圆角镂空 mask**：引入了基于 `<mask id="tutorial-mask">` 的 SVG 图层（`z-[999]`），利用 `rect rx="8" ry="8"` 渲染具有圆角平滑过渡的高亮 cutout，大幅度提升视觉美感。
- **透明事件拦截**：将原有绝对定位遮罩块的背景色改为 `bg-transparent`（保留 `pointer-events-auto`），用于拦截镂空区域外的操作，而镂空区域本身利用 SVG mask 保持完全穿透，从而可以让玩家正常交互底层元素（如 AI 智脑按钮）。

### 3. TopHUD 布局调整与指标常驻展示
- **核心数据常驻**：基于对实机画面“数值显示不全”及“按钮失踪”的排查，取消了在移动端自适应隐藏人口、资源、军力的逻辑，改在所有屏幕尺寸下全量展示：稳定度、人口、资源、军力、威慑度。
- **UI 尺寸与层叠层级**：高度定义为 `h-[56px] md:h-[72px]`。z-index 固定为 `z-[1010]`。通过将 TopHUD 组件移出缩放容器，解决了之前由于 `mobile-landscape-scale` 的 CSS `transform` 隔离独立层叠上下文，导致 z-index 失效被教程遮罩挡住的问题。
- **下拉指标与执剑人追踪**：去除了冗余的文明等级图标（`CivLevel`）展示，补充了稳定度中的“人口基数”指标，并新增了威慑度的详情展开面板（显示防卫军力与当前执剑人），增加了执剑人状态 `earth.swordholder`。

### 4. 岁月史书双轨时间轴对比 (ChroniclesModal.tsx)
- 岁月史书与主页封面的“文明博物馆”实现解耦。
- 在“岁月史书”独立模态框中新增了“双轨时间轴对比页”，集成小说原版时间线与当前游戏进行的时间线进行对比，方便玩家分析历史命运的偏离与走向。

### 5. 外星文明接触事件弹窗逻辑 (AlienContact)
- 将外星文明接触清晰地划分为发现 (Discovered) 和首次接触 (Contacted) 两个阶段。
- 保证在这两个阶段触发时，均会向玩家派发 ticker 消息，并向事件队列 `eventQueue` 推送接触事件弹窗，解决外交列表有文明端无接触弹窗的缺陷。

---

## 📂 四、文件变更清单

| 相对路径 | 变更类型 | 关键改动点说明 |
|:---|:---|:---|
| `src/components/Tutorial.tsx` | [MODIFY] | 恢复基础操作分类，重写侧边栏分类去重算法，引入 SVG mask 圆角镂空遮罩 |
| `src/components/TopHUD.tsx` | [MODIFY] | 调整高度与 z-index，取消响应式隐藏核心指标，调整下拉菜单和威慑度详情 |
| `src/test/scenarios/TutorialRemedy.scenario.test.tsx` | [MODIFY] | 更新 HUD 响应式常驻验证测试，适配基础操作分类和资源 blocker |
| `src/test/scenarios/_registry.md` | [MODIFY] | 状态更新为 🟢 正常（9/9 GREEN），补充 `SCEN-TIMELINE-COMPARE` 和 `SCEN-ALIEN-CONTACT`，记录日志 |
| `src/test/scenarios/_health.md` | [MODIFY] | 更新内容偏离指标，记录解耦博物馆、TopHUD 响应式常驻和 SVG cutout 日志 |
