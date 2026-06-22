# Walkthrough: 星图移动端显示修复
> **Date**: 2026-06-22  
> **Status**: Completed  
> **Category**: Active Execution Walkthrough (`EXEC_`)

本文档记录了《光锥之外：纪元往事》星图（StarMap）在移动端显示问题的修复过程，包括缩放功能增强、竖屏自适应优化及 UI 显示不全的修复。

---

## 一、实施概述

### 1.1 目标

| 目标 | 状态 |
|:---|:---|
| 缩放控制按钮不被底部导航遮挡 | ✅ 完成 |
| CrisisWarningPanel 不遮挡星区选择器 | ✅ 完成 |
| 竖屏初始自适应缩放（auto-fit） | ✅ 完成 |
| 触控提示位置优化，不被遮挡 | ✅ 完成 |
| TypeScript 编译通过 | ✅ 完成 |
| 生产构建通过 | ✅ 完成 |

### 1.2 变更文件清单

| 文件 | 操作 | 说明 |
|:---|:---|:---|
| [StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx) | 修改 | 调整缩放控件/触控提示位置，修复移动端 UI 被遮挡问题 |
| [StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts) | 修改 | 新增 `fitContent()` 方法，实现竖屏自适应缩放 |

---

## 二、实施步骤

### Step 1: 缩放控件位置修复（不被 MobileBottomNav 遮挡）

**问题**：缩放控制按钮容器固定在 `bottom-6`（距底部 24px），而移动端 `MobileBottomNav` 高度为 56px，缩放控件被完全遮挡，用户无法操作缩放按钮。

**解决**：在 [StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx#L139-L143) 中条件化底部间距：

```tsx
${isMobile ? 'opacity-100 bottom-[72px]' : 'opacity-0 group-hover:opacity-100 bottom-6'}
```

- **移动端**：`bottom-[72px]`（72px = 56px MobileBottomNav + 16px 间距），始终可见
- **桌面端**：`bottom-6`，hover 时显示

### Step 2: 触控提示位置调整

**问题**：移动端触控提示（"单指拖动 · 双指缩放 · 点击星辰"）定位在 `bottom-20`（距底部 80px），仅比 MobileBottomNav 顶部高 24px，容易被遮挡且可读性差。

**解决**：在 [StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx#L172-L177) 调整位置：

```
bottom-20 → bottom-[120px]
text-[8px] → text-[9px]
```

触控提示始终位于缩放控件上方，间距充足。

### Step 3: CrisisWarningPanel 遮挡星区选择器修复

**问题**：CrisisWarningPanel 固定定位在 `top-6`（距顶部 24px），z-index 为 `z-50`；移动端星区下拉选择器定位在 `top-2`（距顶部 8px），z-index 为 `z-20`。当警告面板出现时，完全覆盖星区选择按钮，用户无法切换星区。

**解决**：在 [StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx#L85-L93) 做两项改动：

1. **提高 z-index**：从 `z-20` 提升至 `z-[60]`，高于 CrisisWarningPanel 的 `z-50`
2. **下拉菜单同步**：z-index 从 `z-30` 提升至 `z-[61]`
3. **微调边距**：从 `top-2` 下移至 `top-3`

```
移动端星区按钮: z-20 → z-[60]
下拉菜单:      z-30 → z-[61]
按钮上边距:    top-2 → top-3
```

### Step 4: 竖屏初始自适应缩放（auto-fit）

**问题**：星图在竖屏手机（宽 375-390px，高 667-844px）上，初始缩放为硬编码值（太阳系 1.0、50光年 0.8 等），未考虑实际画布尺寸。竖屏模式下星星显示太小或分布不均，用户体验差。此外，横竖屏切换时缩放不会自动适配。

**解决**：在 [StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L180-L216) 新增 `fitContent()` 方法：

```typescript
public fitContent(padding: number = 0.80): void {
  // 1. 获取当前星区所有可见星
  const activeStars = this.renderStars.filter(rs => this.isStarInActiveArea(rs.star));
  
  // 2. 计算包围盒
  let minX=∞, maxX=-∞, minY=∞, maxY=-∞;
  for (const rs of activeStars) { /* 更新边界 */ }
  
  // 3. 计算适配缩放值
  const scaleX = (this.width * padding) / contentWidth;
  const scaleY = (this.height * padding) / contentHeight;
  const newZoom = Math.min(scaleX, scaleY);
  
  // 4. 居中内容 + 应用缩放
  this.panX = (this.width / 2 - contentCenterX) * clamped;
  this.panY = (this.height / 2 - contentCenterY) * clamped;
  this.zoomLevel = clamped;
}
```

**调用时机**：

| 时机 | 位置 | 说明 |
|:---|:---|:---|
| 切换星区 | [setActiveArea()](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L177) | `requestAnimationFrame(() => this.fitContent())` |
| 屏幕尺寸变化 | [initResizeObserver()](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L114) | ResizeObserver 回调中调用 `this.fitContent()` |

**自适应效果**：
- 竖屏手机（375×667）：自动降低 zoom，使全部可见星适配屏幕宽度
- 横竖屏切换：ResizeObserver 检测到尺寸变化，自动重新计算 fit
- 各星区切换：每次切换自动按当前屏幕尺寸适配

---

## 三、关键问题与解决

### 3.1 移动端底部导航遮挡交互控件

**问题**：`MobileBottomNav`（高 56px + safe-area-inset-bottom）固定在屏幕底部，与星图的缩放控件、触控提示发生位置冲突：

| 控件 | 旧位置 | 状态 |
|:---|:---|:---|
| 缩放按钮 | `bottom-6`（24px） | ❌ 被完全遮挡 |
| 触控提示 | `bottom-20`（80px） | ⚠️ 部分遮挡 |

**解决**：根据 `isMobile` 条件动态调整底部间距，确保所有交互控件位于 MobileBottomNav 之上。

### 3.2 警告面板与导航控件重叠

**问题**：CrisisWarningPanel（`z-50`）出现在屏幕顶部时，覆盖了星区选择器（`z-20`），用户无法操作。

**解决**：单纯提升选择器的 `z-index` 至 `z-[60]`，使其浮于警告面板之上。同时微调上边距从 `top-2` 至 `top-3`，减少视觉冲突。

### 3.3 竖屏模式内容适配

**问题**：初始缩放值为硬编码常量，未考虑实际画布尺寸。竖屏模式下（画布窄高），星星分布稀疏或显示不全。

**解决**：实现基于内容包围盒的自动适配算法：
- `fitContent()` 计算当前星区所有可见星的 `minX/maxX/minY/maxY`
- 分别计算 X/Y 方向的适配缩放比，取较小值
- 自动居中内容，设置 panX/panY 偏移
- 缩放限制在 `[0.3, 3.0]` 范围内
- 通过 `requestAnimationFrame` 延迟执行，确保渲染状态稳定

### 3.4 横竖屏切换的响应

**问题**：用户旋转设备时，星图不会自动调整缩放适配新尺寸。

**解决**：在 `ResizeObserver` 回调中（[L114](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L114)）调用 `this.fitContent()`，与画布 resize 联动。

---

## 四、验证结果

### 4.1 类型检查

```bash
npx tsc --noEmit
# Exit code: 0 (无错误)
```

### 4.2 生产构建

```bash
npm run build
# ✓ built in 2.35s
# PWA: 8 entries precached (1175.34 KiB)
```

### 4.3 构建产出

```
dist/
├── index.html                   1.40 KB (gzip: 0.63 KB)
├── sw.js                        Service Worker
├── workbox-2498e5ff.js          Workbox 运行时
├── manifest.webmanifest         0.56 KB
├── assets/index-*.css          127.78 KB (gzip: 18.92 KB)
├── assets/index-*.js         1,016.74 KB (gzip: 310.01 KB)
```

### 4.4 后续验证场景

部署后需在真实设备上验证以下场景：

| 编号 | 场景 | 操作 | 预期 |
|:---|:---|:---|:---|
| T1 | 竖屏启动 | 手机竖屏 → 启动游戏 → 进入星图 | 星图自动缩放适配屏幕，所有 UI 控件可见可触 |
| T2 | 横竖屏切换 | 旋转设备 | 星图自动重新适配新方向 |
| T3 | 星区切换 | 点击星区下拉菜单 | 切换后自动适配视角 |
| T4 | 缩放操作 | 双指捏合/缩放按钮 | 缩放正常，按钮不遮挡 |
| T5 | 触控拖动 | 单指拖动星图 | 平移流畅 |
| T6 | 警告面板 | 触发危机警告 | 星区选择器仍可操作 |

---

## 五、附录

### 5.1 文件变更详细

#### StarMap.tsx 变更

| 行号 | 变更 | 说明 |
|:---|:---|:---|
| [L85](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx#L85) | `z-20` → `z-[60]`, `top-2` → `top-3` | 移动端星区按钮：提高层级避免被遮挡 |
| [L93](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx#L93) | `z-30` → `z-[61]` | 下拉菜单同步提高层级 |
| [L139-L143](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx#L139-L143) | 条件化 `bottom-[72px]` / `bottom-6` | 缩放控件位置适配移动端 |
| [L173-L176](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx#L173-L176) | `bottom-20` → `bottom-[120px]`, `text-[8px]` → `text-[9px]` | 触控提示上移并加大字号 |

#### StarMapRenderer.ts 变更

| 行号 | 变更 | 说明 |
|:---|:---|:---|
| [L176-L177](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L176-L177) | 新增 `requestAnimationFrame(() => this.fitContent())` | 切换星区时自动适配 |
| [L113-L114](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L113-L114) | 新增 `this.fitContent()` | 画布尺寸变化时自动适配 |
| [L180-L216](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L180-L216) | 新增 `fitContent()` 方法 | 基于包围盒的自适应缩放算法 |

### 5.2 核心算法说明

`fitContent()` 自适应流程：

```
1. 过滤当前星区可见星列表
2. 遍历所有可见星，计算最小包围盒 (minX, maxX, minY, maxY)
3. 计算包围盒宽高和中心点
4. 分别计算水平和垂直方向的适配缩放比
5. 取较小值作为最终 zoom（确保内容完整可见）
6. 计算 panX/panY 偏移量，使包围盒中心对齐画布中心
7. 将 zoom 限制在 [0.3, 3.0] 范围内
8. 通过 CustomEvent 通知 React 组件更新 zoom 显示
```

### 5.3 相关文档

- [SPEC_20260621_RESPONSIVE_LAYOUT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260621_RESPONSIVE_LAYOUT.md) — 响应式布局规范
- [EXEC_20260621_PART3_UI_UX_ITERATION_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260621_PART3_UI_UX_ITERATION_WALKTHROUGH.md) — UI/UX 迭代实施记录
- [StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StarMap.tsx) — 星图组件
- [StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts) — 星图渲染器