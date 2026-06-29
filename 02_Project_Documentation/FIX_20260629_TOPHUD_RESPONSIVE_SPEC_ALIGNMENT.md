# Fix Report: TopHUD 按响应式规范重新对齐

**Date**: 2026-06-29  
**Found by**: 用户要求对照最近半个月 UI 文档共识还原 UI 状态  
**Severity**: High（TopHUD 实现与 SPEC 共识不一致，用户反复报告顶部按钮和状态栏未恢复）

---

## 背景

用户连续三次报告"顶部的按钮和状态栏依然没有恢复"、"现在已经完全不对了"。前两次修复（v2 提升 z-index、v3 恢复 CivLevel 和原始设计）未能解决根本问题。

用户要求：
> "你再对照最近半个月关于ui改动的文档，把UI的情况更新到我们达成共识的时候。并且要按照Registry 文档要求推进任务。"

---

## 根因分析

### 前三次修复的问题

| 版本 | 修复内容 | 问题 |
|------|---------|------|
| v2 | TopHUD z-50 → z-[1010]，移出 scaled container | 仍未解决移动端/桌面端双布局拆分导致的结构偏离 |
| v3 | 添加 CivLevel、固定高度、popFactor | 移除了移动端/桌面端双布局，改为统一单行布局，但**完全忽略了 SPEC_20260621_RESPONSIVE_LAYOUT.md 中定义的响应式规范** |
| v3 后续 | 用户仍报告"依然没有恢复" | — |

### 真正的问题

v3 将 TopHUD 改为统一单行全显示布局，所有 6 个统计项在移动端也全部显示。但 SPEC 共识明确定义了：

- 手机 (<768px)：紧凑模式，人口/资源/军力应隐藏
- 平板 (768-1023px)：中密度，资源/军力应隐藏
- 桌面 (≥1024px)：全密度

### 关键共识文档

| 文档 | 日期 | 关键内容 |
|------|------|---------|
| [SPEC_20260621_RESPONSIVE_LAYOUT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260621_RESPONSIVE_LAYOUT.md) | 2026-06-21 | 4.1 节 TopHUD 紧凑模式：各断点下统计项显示/隐藏规则 |
| [SPEC_20260626_MOBILE_UI_TUTORIAL_ITERATION_PLAN.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260626_MOBILE_UI_TUTORIAL_ITERATION_PLAN.md) | 2026-06-26 | 横屏缩放、Safe Area 适配、Tutorial 防误触 |
| [EXEC_20260626_TUTORIAL_AND_MOBILE_LAYOUT_REFACTOR.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260626_TUTORIAL_AND_MOBILE_LAYOUT_REFACTOR.md) | 2026-06-26 | 已执行的重构内容（useBreakpoint 横屏检测、CSS scale 缩放、坐标修正） |

---

## 修复方案

### 按照 SPEC 4.1 节重新实现 TopHUD 响应式

```
SPEC_20260621_RESPONSIVE_LAYOUT.md §4.1 TopHUD 紧凑模式

| 元素   | 手机 (<768px) | 平板 (768-1023px) | 桌面 (≥1024px) |
| 稳定度 | ✅             | ✅                | ✅              |
| 人口   | ❌ 隐藏        | ✅                | ✅              |
| 资源   | ❌ 隐藏        | ❌ 隐藏           | ✅              |
| 军力   | ❌ 隐藏        | ❌ 隐藏           | ✅              |
| 威慑度 | ✅             | ✅                | ✅              |
```

#### 实现方式：Tailwind 响应式断点

```tsx
// 高度：手机 56px，平板及以上 72px
className="h-[56px] md:h-[72px]"
// 间距：手机紧凑，桌面宽松
className="px-3 md:px-6"
className="gap-1 md:gap-1.5"

// 统计项响应式可见性
<div className="hidden md:block">   {/* 人口：手机隐藏，平板+显示 */}
  <TopHUDStatItem label="人口" ... />
</div>
<div className="hidden lg:block">   {/* 资源：手机+平板隐藏，桌面显示 */}
  <TopHUDStatItem label="资源" ... />
</div>
<div className="hidden lg:block">   {/* 军力：手机+平板隐藏，桌面显示 */}
  <TopHUDStatItem label="军力" ... />
</div>
```

#### 始终可见的元素

- **文明等级**：核心身份标识，所有断点均显示
- **稳定度**（含下拉详情）：核心生命线指标
- **威慑度**：关键时刻威慑值
- **纪元/年份**：所有断点显示，手机端字号缩小
- **AP 显示**：紫色 AP 指示器，核心操作资源
- **AI 智脑开关**：手机端仅显示图标，桌面端显示文字标签
- **下一回合按钮**：不同游戏状态显示不同文案

---

### 测试更新

`SCEN-HUD-RESPONSIVE` 测试从"移动端双行布局"改为"双断点验证"：

```
旧测试：仅验证移动端 (375px)，检查所有元素不被隐藏
新测试：
  - 移动端 (375px)：验证核心 3 项可见（文明等级/稳定度/威慑度），
    人口/资源/军力被 hidden 类包裹
  - 桌面端 (1280px)：验证全部 6 项可见
```

---

## 文件变更

| 文件 | 变更 | 说明 |
|------|------|------|
| [TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx) | 重写 return 语句 | 使用 Tailwind 响应式断点实现 SPEC 4.1 节 |
| [TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx) | 移除 useBreakpoint 导入 | 改用 Tailwind 类，无需 JS 断点检测 |
| [TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx) | 移除移动端/桌面端双布局 | 恢复为单行统一布局 + 响应式类 |
| [TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx) | 清理 showStabilityDropdownMobile / dropdownRefMobile | 不再需要的移动端专属 state |
| [TutorialRemedy.scenario.test.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/TutorialRemedy.scenario.test.tsx) | 重写 SCEN-HUD-RESPONSIVE | 双断点验证（mobile + desktop），使用 closest('.hidden') 检查 jsdom 中的隐藏状态 |
| [TutorialRemedy.scenario.test.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/TutorialRemedy.scenario.test.tsx) | 移除 BottomEventBar 和 within 导入 | 不再需要 |
| [_registry.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/_registry.md) | SCEN-HUD-RESPONSIVE 描述更新 | 对齐 SPEC 4.1 节内容 |
| [_health.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/_health.md) | 新增审视日志 | 记录 SPEC 对齐过程 |

---

## TopHUD 最终设计（符合共识）

```
┌──────────────────────────────────────────────────────────────────┐
│  header: h-[56px] md:h-[72px], z-[1010], shrink-0               │
│                                                                  │
│  [文明等级] [稳定度▼] [人口] [资源] [军力] [威慑度]             │
│   always     always   md+   lg+   lg+   always                   │
│                                                                  │
│                    ← 危机纪元 · 第 0 年 →                        │
│                              │                                    │
│                    [AP 20/100] [🧠智脑] [下一回合]                │
│                     always     always    always                   │
└──────────────────────────────────────────────────────────────────┘
```

### 断点行为对照

| 断点 | 高度 | 左侧统计项 | 中间纪元 | 右侧操作 |
|------|------|-----------|---------|---------|
| 手机 (<768px) | 56px | 文明等级、稳定度、威慑度 | 小字号 | AP、智脑图标、下一回合 |
| 平板 (768-1023px) | 72px | +人口 | 标准 | 同上 |
| 桌面 (≥1024px) | 72px | +资源、+军力 | 标准 | AP、智脑文字、下一回合 |

---

## 验证

| 检查项 | 结果 |
|--------|------|
| TypeScript 编译 | 0 errors |
| Vite 构建 | 成功 |
| 全部测试 (42 files / 870 tests) | 全部通过 |
| Registry 状态 | 8/8 GREEN |
| 教程侧边栏 | 5 个唯一类别，无重复 |
| TopHUD 响应式 | 符合 SPEC_20260621_RESPONSIVE_LAYOUT.md §4.1 |

---

## 总结

本次修复的教训：

1. **必须先读 SPEC 再改代码**：v3 恢复"原始设计"时忽略了已达成共识的响应式规范，导致 TopHUD 在移动端显示过多元素
2. **Registry 是真相来源**：按照 Registry 文档要求对照 SPEC 推进任务，才能确保实现与共识一致
3. **Tailwind 断点优于 JS 断点**：使用 `hidden md:block` / `hidden lg:block` 替代 `useBreakpoint` hook，减少 JS 运行时开销，且断点更直观
4. **测试覆盖多断点**：jdsom 不处理 CSS，需用 `closest('.hidden')` 验证元素隐藏状态