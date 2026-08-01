# 响应式布局规范 Specification
> **Date**: 2026-06-21  
> **Status**: Implemented  
> **Category**: Specifications & Design Systems (`SPEC_`)

本文档定义了《光锥之外：纪元往事》的**全设备屏幕自适配布局规范**——使用 React 响应式 Hook + Tailwind 断点，实现手机竖屏/横屏、iPad、桌面端的无缝适配。

---

## 1. 断点定义

| 断点 | 别名 | 宽度 | 目标设备 |
|:---|:---|:---|:---|
| `mobile` | — | < 768px | 手机竖屏/横屏 |
| `tablet` | `md` | 768-1023px | iPad 竖屏 |
| `desktop` | `lg` | 1024-1535px | 笔记本/台式机 |
| `wide` | `xl` | ≥ 1536px | 大屏桌面 |

---

## 2. 布局架构

### 2.1 默认布局（桌面 ≥ 1024px）

```
┌──────────────────────────────────────────────────────┐
│  TopHUD (72px) — 稳定度 | 人口 | 资源 | 军力 | 威慑度  │
├──────────┬───────────────────────────┬───────────────┤
│ LeftHub  │    Center Viewport        │ RightInspector│
│ 240px    │       flex-1              │    320px      │
│ 导航菜单 │    StarMap / 科技树 /      │  星辰详情     │
│ 数据面板 │    情报 / 政府 / 档案      │  建筑面板     │
│ BGM播放器│                           │  编队面板     │
├──────────┴───────────────────────────┴───────────────┤
│  BottomEventBar (40px) — 滚动事件信息                 │
└──────────────────────────────────────────────────────┘
```

### 2.2 平板布局（768-1023px）

```
┌────────────────────────────────────────────────────┐
│  TopHUD (72px) — 稳定度 | 人口 | 威慑度             │
├────────────┬───────────────────────┬───────────────┤
│ LeftHub    │     Center Viewport   │ RightInspector│
│ 160-200px  │        flex-1         │  240-280px    │
│ (clamp)    │                       │  (clamp)      │
├────────────┴───────────────────────┴───────────────┤
│  BottomEventBar (40px)                              │
└────────────────────────────────────────────────────┘
```

### 2.3 移动端布局（< 768px）

```
┌──────────────────────────────────────┐
│  TopHUD (56px) 紧凑模式              │
│  稳定度 | 威慑度 | 纪元·年份         │
├──────────────────────────────────────┤
│                                      │
│        Center Viewport               │
│           flex-1                     │
│    (无侧边栏，全屏内容)              │
│                                      │
├──────────────────────────────────────┤
│  BottomEventBar (40px)               │
├──────────────────────────────────────┤
│  MobileBottomNav (56px)              │
│  [星图][情报][科技][政府][档案]      │
└──────────────────────────────────────┘

┌─── 右侧抽屉面板（点击星辰后弹出） ──┐
│  ✕ 关闭                           │
│  ┌────────────────────────────┐    │
│  │   RightInspector 内容      │    │
│  │   (85vw, max 360px)        │    │
│  └────────────────────────────┘    │
└────────────────────────────────────┘
```

---

## 3. 关键文件清单

| 文件 | 职责 |
|:---|:---|
| [useBreakpoint.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/hooks/useBreakpoint.ts) | 断点检测 Hook |
| [App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx) | 响应式三栏布局调度 |
| [MobileBottomNav.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/MobileBottomNav.tsx) | 移动端底部导航 |
| [TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx) | 紧凑模式 Top HUD |
| [LeftHub.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/LeftHub.tsx) | 流体宽度左侧栏 |
| [RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/RightInspector.tsx) | 流体宽度右侧栏 + 移动端抽屉 |
| [index.css](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/index.css) | 响应式工具类 + safe-area |
| [OrientationPrompt.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/OrientationPrompt.tsx) | 横屏提示组件 |

---

## 4. 组件响应式行为

### 4.1 TopHUD 紧凑模式

| 元素 | 手机 (< 768px) | 平板 (768-1023px) | 桌面 (≥ 1024px) |
|:---|:---|:---|:---|
| 高度 | 56px | 72px | 72px |
| 稳定度 | ✅ 显示 | ✅ 显示 | ✅ 显示 |
| 人口 | ❌ 隐藏 | ✅ 显示 | ✅ 显示 |
| 资源 | ❌ 隐藏 | ❌ 隐藏 | ✅ 显示 |
| 军力 | ❌ 隐藏 | ❌ 隐藏 | ✅ 显示 |
| 威慑度 | ✅ 显示 | ✅ 显示 | ✅ 显示 |
| 纪元名称 | 小字体 | 标准 | 标准 |
| 下一回合按钮 | 紧凑 (10px) | 标准 (12px) | 标准 |

### 4.2 左侧栏

| 行为 | 手机 | 平板 | 桌面 |
|:---|:---|:---|:---|
| 显示 | ❌ 隐藏 | ✅ 流体宽度 | ✅ 固定 240px |
| 宽度 | — | `clamp(160px, 22vw, 200px)` | 240px |
| 替换 | MobileBottomNav | — | — |

### 4.3 右侧面板

| 行为 | 手机 | 平板 | 桌面 |
|:---|:---|:---|:---|
| 默认 | ❌ 隐藏（抽屉） | ✅ 流体宽度 | ✅ 固定 320px |
| 宽度 | 85vw (max 360px) | `clamp(240px, 30vw, 280px)` | 320px |
| 打开 | 点击星辰时弹出 | — | — |
| 关闭 | ✕ 按钮 / Esc 键 / 点击遮罩 | — | — |

### 4.4 移动端底部导航 (MobileBottomNav)

- 5 个按钮：星图 / 情报 / 科技 / 政府 / 档案
- 当前激活项高亮显示（`text-[var(--color-primary)]`）
- 适配 iPhone 底部 safe-area-inset

---

## 5. Safe Area 适配

### 5.1 CSS 配置

```css
body {
  /* iPhone 刘海屏 + 底部指示条适配 */
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}
```

### 5.2 底部导航适配

```css
.mobile-bottom-nav {
  padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px));
}
```

### 5.3 抽屉面板适配

```css
.drawer-panel {
  padding-top: env(safe-area-inset-top, 0px);
}
```

---

## 6. 抽屉面板实现

### 6.1 CSS 动画

```css
.drawer-overlay {
  /* 半透明遮罩 + 模糊背景 */
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  animation: fade-in 0.2s ease-out;
}

.drawer-panel {
  /* 从右侧滑入 */
  animation: slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

### 6.2 打开/关闭逻辑

```
打开条件：
  - 移动端 (isMobile === true)
  - 用户点击星辰（star-selected 事件）
  
关闭条件：
  - 点击 ✕ 关闭按钮
  - 按 Esc 键
  - 点击遮罩层 (drawer-overlay)
```

---

## 7. useBreakpoint Hook

### 7.1 API

```typescript
const bp = useBreakpoint();

bp.breakpoint       // 'mobile' | 'tablet' | 'desktop' | 'wide'
bp.isMobile         // boolean
bp.isTablet         // boolean
bp.isDesktop        // boolean
bp.width            // number (px)
bp.height           // number (px)
bp.isLandscape      // boolean
bp.isPortraitMobile // boolean (用于 OrientationPrompt)
bp.isTouchDevice    // boolean
```

### 7.2 使用示例

```tsx
const bp = useBreakpoint();
if (bp.isMobile) {
  return <MobileLayout />;
}
return <DesktopLayout />;
```

---

## 8. 规范对照

| 规范 | 要求 | 实现 |
|:---|:---|:---|
| **UI-1** | 手机竖屏/横屏 / iPad / 桌面端 | ✅ 4 断点全面适配 |
| **UI-2** | 横屏优先，移动端提示 | ✅ OrientationPrompt 提示 |
| **UI-3** | 禁止固定分辨率 | ✅ `clamp()` 流体宽度 + `flex-1` |
| **Accessibility** | 键盘快捷键 | ✅ 已保留（M/I/T/G/A/F/Esc/Space） |