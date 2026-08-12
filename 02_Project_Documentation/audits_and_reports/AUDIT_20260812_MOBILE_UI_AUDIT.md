# 移动端 UI 方案审核报告

> **审核日期**: 2026-08-12  
> **基准版本**: v1.0.10 (`3ede6c9e`)  
> **审核范围**: 全部响应式布局 CSS、安全区处理、Modal 组件适配、断点系统、E2E 测试覆盖  
> **审核方法**: 静态代码审计（3 路并行：CSS 布局 + Modal 组件 + E2E 测试覆盖）

---

## 问题汇总

| # | 严重性 | 组件 | 问题 | 影响设备 |
|---|--------|------|------|----------|
| 1 | **🔴 P0** | `BattleScreen` | 横屏战斗日志容器被压缩至 **0px 高度**，完全不可见 | 844×390 横屏 |
| 2 | **🔴 P0** | `StoryModal` | `flex justify-center` + `overflow-y-auto` 冲突，长文本上半部分无法滚动到达 | 320×568 竖屏 |
| 3 | **🟠 P1** | `TopHUD` | 下拉菜单硬编码 `top-[52px]`，在刘海屏设备上覆盖 HUD 图标 | 全部 notch 设备 |
| 4 | **🟠 P1** | 全局 | `h-screen`/`100vh` 未使用 `dvh`，iOS Safari 地址栏动态伸缩时裁切底部 | iOS Safari |
| 5 | **🟠 P1** | `SettingsModal` | 无横屏媒体查询，844×390 下内容区仅 ~120px 高 | 横屏手机 |
| 6 | **🟠 P1** | `FleetModal` | 无横屏媒体查询；预算行与建造按钮在 320px 宽度溢出 | 横屏 + 极小屏 |
| 7 | **🟠 P1** | `MuseumGallery` | CG 全屏查看器关闭按钮 `top-6 right-6` 缺少安全区偏移，被刘海遮挡 | 横屏 notch |
| 8 | **🟡 P2** | `TopHUD` | 320–375px 屏幕上左右指标按钮与居中纪元标题重叠碰撞 | 极小屏竖屏 |
| 9 | **🟡 P2** | `StarMap` | 竖屏 `bottom-[72px]` 产生不必要间距（StarMap 已不与 BottomNav 共享容器） | 竖屏手机 |
| 10 | **🟡 P2** | `MobileLandscapeHub` | 缺少 `safe-area-inset-bottom`，底部设置按钮与系统手势条冲突 | 横屏全面屏 |
| 11 | **🟡 P2** | `SettingsModal` | 水平 Tab 栏隐藏滚动条（`scrollbar-none`），用户无法感知屏幕外还有 Tab | 竖屏手机 |
| 12 | **🟡 P2** | `SettingsModal` | 帮助/存储 Tab 内嵌套 `overflow-y-auto` + 硬编码 `max-h`，产生双滚动条 | 全部手机 |
| 13 | **🟡 P2** | `FleetModal` | 舰队派遣区 `<select>` + 按钮在 320px 宽度被严重挤压截断 | 极小屏竖屏 |
| 14 | **🟡 P2** | `StoryModal` | 选项区 `px-8` 在 320px 宽度下留给按钮仅 224px，长选项多行换行 | 极小屏竖屏 |
| 15 | **🟡 P2** | `RightInspector` | 劳动力比例滑块轨道 `h-1`（4px）触控目标过小 | 全部触屏 |
| 16 | **🟡 P2** | `index.css` | `.drawer-panel` 缺少 `padding-left` 安全区 | 右手持机横屏 |
| 17 | **🟡 P2** | `index.css` | `.modal-box` 硬编码 `padding: 32px`，320px 屏幕吃掉 20% 宽度 | 极小屏竖屏 |
| 18 | **🟡 P2** | 多个 Modal | 重复 CSS 类 `h-full h-[560px]` / `h-full h-[90vh]`，意图不明 | — |
| 19 | **⚪ P3** | `useBreakpoint` | 触屏笔记本缩小窗口高度 ≤500px 时误触发 `isMobileLandscape` | 触屏笔记本 |
| 20 | **⚪ P3** | `MuseumGallery` | Tab 栏在 320px 屏幕水平溢出（缺少 `flex-wrap`/`overflow-x-auto`） | 极小屏竖屏 |

---

## 详细分析

### 🔴 P0-1: BattleScreen 横屏战斗日志不可见

> [!CAUTION]
> 这是一个 **致命级游戏阻断 bug**。在手机横屏进行战斗时，玩家完全看不到战斗日志文本。

**根因**: `BattleScreen.tsx` 在 `< md` 断点时将攻防双方卡片从 `grid-cols-2` 变为 `grid-cols-1` 垂直堆叠。固定内容高度计算：

| 元素 | 高度 |
|------|------|
| Header | ~55px |
| 战场位置横幅 | ~45px |
| 攻方卡片 (grid-cols-1) | ~110px |
| 守方卡片 (grid-cols-1) | ~110px |
| 底部控制栏 | ~45px |
| 外边距 p-4 | 32px |
| **固定总计** | **~397px** |

在 844×390 横屏下 `max-h-[90vh]` = 351px，**固定内容（397px）> 容器高度（351px）**，`flex-1` 战斗日志容器被压缩至 **0px**。

**建议修复**: 添加横屏媒体查询，在 `max-height: 500px` 时强制攻防卡片保持 `grid-cols-2` 水平排列，并压缩各区域 padding。

---

### 🔴 P0-2: StoryModal 长文本滚动死区

**根因**: `StoryModal.tsx` L288 文本容器使用 `flex flex-col justify-center` + `overflow-y-auto`。当文本短于容器高度时 `justify-center` 居中效果良好；但当文本溢出时，flexbox 居中会将内容顶部推到滚动边界之上，导致**上半部分文本永远无法滚动回来**。

**建议修复**: 将 `justify-center` 替换为 `justify-start`，用 `margin: auto 0` 实现短文本居中。

---

### 🟠 P1-3: TopHUD 下拉菜单定位错误

**根因**: `TopHUD.tsx` L199、L262 的下拉菜单硬编码 `top-[52px]`。但 Header 实际高度为 `calc(56px + env(safe-area-inset-top))`。在有 47px 顶部安全区的设备（如 iPhone 14 Pro）上，Header 总高度为 103px，而下拉菜单仅偏移 52px——**直接覆盖在 HUD 图标上方**。

**建议修复**: 将 `top-[52px]` 改为 `top-full`，让下拉菜单始终贴在 Header 底部下方。

---

### 🟠 P1-4: `100vh` iOS Safari 地址栏裁切

**根因**: `index.css` L67 的 `body` 和 `App.tsx` L402 使用 `h-screen`（`100vh`）。iOS Safari 的 `100vh` 包含了地址栏高度，当地址栏展开时底部内容被裁切。

**建议修复**: 改用 `h-[100dvh]`（Dynamic Viewport Height）。若需兼容旧浏览器，可 fallback：`height: 100vh; height: 100dvh;`。

---

### 🟠 P1-5/6: SettingsModal & FleetModal 缺少横屏适配

**现状**: `SettingsModal` 和 `FleetModal` 均无 `@media (max-height: ...)` 横屏查询。在 844×390 下：
- `SettingsModal` 内容区仅剩 ~120px 高度（被 Header、Tab 栏、Footer 占去大量空间）
- `FleetModal` 舰队列表区仅剩 ~180px，不足以完整展示一张舰队卡片

**建议修复**: 参照 `StoryModal` 的横屏处理模式，添加 `@media (max-height: 500px)` 压缩 padding、font-size 和 gap。

---

### 🟠 P1-7: MuseumGallery CG 查看器关闭按钮被刘海遮挡

**根因**: `MuseumGallery.tsx` L1147–1181 的全屏 CG 查看器关闭按钮使用 `absolute top-6 right-6`，无安全区偏移。

**建议修复**: 改为 `top: max(24px, env(safe-area-inset-top))` + `right: max(24px, env(safe-area-inset-right))`。

---

## E2E 测试覆盖缺口

| 缺口 | 影响 | 建议 |
|------|------|------|
| **无 Modal 小视口边界测试** | 上述 P0/P1 Modal 溢出问题无法被自动回归捕获 | 在 `responsive.spec.ts` 中触发 StoryModal、BattleScreen 并执行 `expectInViewport()` |
| **无 Drawer 交互测试** | 抽屉开关、背景点击关闭、胶囊按钮呼出均未覆盖 | 新增 `drawer-interaction.spec.ts` |
| **Canvas 触控手势未覆盖** | 星图双指缩放、单指拖动使用合成事件绕过 | 可接受（Playwright 限制） |
| **硬编码 `waitForTimeout`** | CI 慢速时可能导致非确定性失败 | 逐步替换为 locator 断言等待 |
| **缺少平板设备预设** | Playwright config 无 iPad 项目 | 添加 `iPad Pro` 或 `iPad Mini` 项目配置 |

---

## 断点系统与安全区整体评估

### ✅ 工作正常的部分
- `useBreakpoint` 断点体系与 E2E helpers 断点常量完全对齐（768 / 1024 / 1536）
- `.drawer-panel` 正确处理 top/bottom/right 安全区
- `TopHUD` 正确计算动态 safe-area padding 和高度
- `MobileLandscapeHub` 正确处理 left 安全区宽度
- `.mobile-bottom-nav` 高度动态计算 `calc(56px + env(safe-area-inset-bottom))`
- `MuseumGallery` 外层容器四个方向安全区均正确处理
- Z-index 层级清晰有序（底栏 900 → 抽屉 950/951 → 模态 1000+）

### ⚠️ 需要关注的部分
- 全局 `100vh` 应迁移到 `100dvh`
- 部分 Modal 存在重复 CSS 类（`h-full h-[560px]`）
- `.modal-box` 的 `padding: 32px` 在极小屏上过大
- 触屏笔记本降低窗口高度可能误触发移动端布局

---

## 建议修复优先级

### 🔴 立即修复（P0 — 游戏阻断）
1. **BattleScreen 横屏日志不可见**: 添加横屏媒体查询，保持攻防双列
2. **StoryModal 长文本滚动死区**: 移除 `justify-center`

### 🟠 尽快修复（P1 — 严重体验问题）
3. **TopHUD 下拉定位**: `top-[52px]` → `top-full`
4. **全局 100vh → 100dvh**: body + App.tsx
5. **SettingsModal 横屏适配**: 添加低高度媒体查询
6. **FleetModal 横屏适配 + 窄屏换行**: 添加 flex-wrap + 横屏查询
7. **MuseumGallery CG 关闭按钮安全区**: 添加 safe-area 偏移

### 🟡 计划修复（P2 — 可用性优化）
8. TopHUD 极小屏指标折叠
9. StarMap zoom bar 定位修正
10. MobileLandscapeHub 底部安全区
11. SettingsModal Tab 滚动提示
12. SettingsModal 嵌套滚动条消除
13. FleetModal 派遣区 flex-wrap
14. StoryModal 选项区 padding 缩减
15. RightInspector 滑块触控目标增大
16. Drawer panel padding-left 安全区
17. Modal box 响应式 padding
18. 清理重复 CSS 类
