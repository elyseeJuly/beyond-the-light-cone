# EXEC_20260603_CI_BUGFIX_AND_UI_OPTIMIZATION | CI 编译修复与 UI 叙事标题双重括号优化记录

> **文档日期**: 2026-06-03  
> **分类前缀**: `EXEC_` (执行与修复记录)  
> **执行状态**: 已完成并同步至 GitHub  

---

## 📖 1. 概述与目的

在 2026-06-03 的开发同步中，发现 GitHub Actions 的 CI 流程持续报红失败。本记录旨在复盘并记录解决 CI 编译障碍、提升单元测试分支覆盖率（以满足构建阈值门槛）以及优化剧情抉择弹窗（`StoryModal`）标题双重括号展示问题的全过程，确保代码质量和玩家视觉体验的双重提升。

---

## 🔍 2. 发现的问题与定位

### 2.1 TypeScript 编译障碍 (P0)
远程仓库的 Head 提交（`2836493f`）存在多处未通过的 TS 类型校验：
*   [FleetModal.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/FleetModal.tsx) 存在未使用导入 `Crosshair`，以及 `STAR_INDEX` 缺少 `OORT_CLOUD` 和 `SATURN` 的引用。
*   [RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/RightInspector.tsx) 和 [StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/StoryModal.tsx) 存在未使用的图标与类型声明。
以上问题导致 `tsc --noEmit` 与生产构建 `npm run build` 被阻断，造成 Actions 执行失败。
*   *原因*：本地已有一些包含修复的提交（`46bb64cd` 与 `f89e8546`）未能及时推送到远程仓库。

### 2.2 Vitest 分支覆盖率低于 60% 阈值限制 (P0)
由于近期合并了大量的子系统重构（如 `PlanetEngine` 行星发动机和 `DigitalLife` 数字生命系统等），核心业务逻辑分支急剧增加，但配套的测试代码覆盖不够全面，导致分支覆盖率（Branch Coverage）降到了 **`59.55%`**，未能达到 [vite.config.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/vite.config.ts) 强制要求的 **`60%`** 限制门槛，触发 CI 检测红标。

### 2.3 剧情弹窗标题出现双重括号 `【【 】】` (P1)
在剧情弹窗中，部分写在数据文件中的事件标题（如 `【清洗：对叛军控制区使用战术核弹】`）由于本身在 `randomevents.json` 中配置了括弧，加之 [StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/StoryModal.tsx) 再次强行追加 `【 ${event.title} 】` 格式化，从而在页面渲染出双重括弧 `【【 标题 】】`，破坏了视觉沉浸感。

---

## 🛠️ 3. 实施的修复方案

### 3.1 推送编译修复提交并合并分支
首先将本地已完成的重构与修复提交（`46bb64cd` & `f89e8546`）与主干拉齐，解决所有未使用的声明以及编译异常，完成基础类型安全检测。

### 3.2 扩充 AlienCivilization 单元测试提升覆盖率
为了弥补 60% 分支覆盖率的缺口，新建了独立的单元测试套件 [AlienCivilization.test.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/test/core/AlienCivilization.test.ts)，专注于补全外星AI与战斗系统的测试：
*   **AI人格行为**：编写包含 `HUNTER`, `CLEANER`, `EXPANSIONIST`, `DEFENSIVE`, `OPPORTUNIST` 完整 5 类人格在对应随机数下的具体决策流。
*   **远征舰队行为与战斗**：校验舰队在推进至 Earth 节点时的胜负判定以及对应的母星占领逻辑。
*   **二向箔与特殊武器**：覆盖二向箔预警回合递减、触发终局 Defeat 的分支、以及拥有“黑域生成”或“太空方舟”等逃逸手段时的生存分支。
*   **Manager 状态转移**：增加星系丢失后，异星文明彻底灭绝并通告大事记的覆盖测试。

### 3.3 UI 叙事标题括弧清洗逻辑
对 [StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/StoryModal.tsx) 的标题显示代码进行局部重构：
```typescript
{(() => {
  if (event.title.includes('事件_')) return event.title;
  let cleanTitle = event.title.trim();
  if (cleanTitle.startsWith('【') && cleanTitle.endsWith('】')) {
    cleanTitle = cleanTitle.slice(1, -1).trim();
  }
  return `【 ${cleanTitle} 】`;
})()}
```
该段代码会自动清洗已自带括号的事件标题，剥离外层后再按标准样式呈现，成功去除了双重括号问题。

---

## 📈 4. 验证与测试结果

在本地执行完整的 CI 验证流程，结果如下：
*   **编译验证**：`npm run typecheck` $\rightarrow$ **通过，0 错误与警告**。
*   **用例执行**：`npm run test` $\rightarrow$ **14 个测试文件，262 个测试用例全部通过**。
*   **覆盖率指标**：运行 `npx vitest run --coverage`，整体指标如下：
    *   **Statements**: `78.19%` (门槛: 70%)
    *   **Branches**: `62.94%` (门槛: 60%) — **已成功跨过红线**
    *   **Functions**: `88.49%` (门槛: 70%)
    *   **Lines**: `81.64%` (门槛: 70%)
*   **生产环境构建**：`npm run build` $\rightarrow$ **正常打包生成 `dist/` 产物**。

所有修复代码已通过 `git push origin main` 成功同步至远程仓库，GitHub Actions 已拉取最新提交并显示构建绿标。
