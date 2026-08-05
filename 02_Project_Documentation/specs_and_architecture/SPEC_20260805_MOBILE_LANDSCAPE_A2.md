# 移动端横屏 A2 适配方案设计文档

**文档类型**：SPEC
**日期**：2026-08-05
**关联审计**：[AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md](../audits_and_reports/AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md)
**关联执行**：[EXEC_20260805_RESPONSIVE_TEST_EXPANSION.md](../audits_and_reports/EXEC_20260805_RESPONSIVE_TEST_EXPANSION.md)
**关联预览图**：
- [mobile-landscape-plan-a2.jpg](../audits_and_reports/assets/mobile-landscape-plan-a2.jpg)
- [mobile-landscape-plan-a1.jpg](../audits_and_reports/assets/mobile-landscape-plan-a1.jpg)（A1 备选）
- [mobile-landscape-plan-b.jpg](../audits_and_reports/assets/mobile-landscape-plan-b.jpg)（B 备选）

---

## 1. 设计目标

解决当前移动端横屏采用 `transform: scale(0.85)` 缩放桌面布局导致的显示不全问题，为横屏手机提供**独立的、内容优先的、触控友好**的界面布局，而非强行压缩三栏桌面布局。

---

## 2. 设计原则

1. **不缩放，不裁剪**：所有元素以 1:1 物理像素渲染，完整位于视口内。
2. **内容优先**：中央星图/主视图占据最大面积。
3. **Apple Sidebar + Detail 范式**：左侧窄图标栏、右侧可收起 Inspector 抽屉。
4. **触控友好**：图标栏 56px 宽度，符合 44pt 最小触控规范。
5. **横竖屏一致的心智模型**：移动端（无论横竖）共用同一套"导航 + 主内容 + 抽屉详情"模型。
6. **克制安静**：减少装饰性元素，保持现有深色太空主题和文字层级。

---

## 3. 布局结构

```
┌─────────────────────────────────────────────────────────┐
│ TopHUD (compact)                                        │  56px
├──────┬──────────────────────────────────────┬───────────┤
│      │                                      │           │
│ 56px │         Center Viewport              │  280px    │
│ Icon │     (StarMap / TechTree / ...)       │ Inspector │
│ Bar  │                                      │  Drawer   │
│      │                                      │ (默认半开) │
│      │                                      │           │
└──────┴──────────────────────────────────────┴───────────┘
```

### 3.1 各区域尺寸

| 区域 | 宽度/高度 | 备注 |
|---|---|---|
| TopHUD | 高度 56px | 仅显示稳定度、威慑度，隐藏人口/经济/资源/军力 |
| 左侧图标栏 | 宽度 56px | 5 个核心视图入口 + 设置入口 |
| 中央视口 | 剩余宽度 | flex-1，星图最大化 |
| 右侧抽屉 | 宽度 280px | 默认半开；可收起为 0px |

### 3.2 断点规则

沿用 [useBreakpoint.ts](../../03_Web_Rebuild/src/hooks/useBreakpoint.ts) 的判定：

```ts
isMobile = width < 768;
isMobileLandscape = isMobile && isLandscape && height <= 500;
```

新的布局判定：

```ts
showDesktopLayout = !isMobile && !isMobileLandscape;
// 即：只有非 mobile 的设备才走桌面三栏布局
```

移动端（含竖屏和横屏）统一走移动布局分支，差别仅在于横屏额外渲染左侧图标栏、底部导航隐藏。

---

## 4. 组件设计

### 4.1 新增组件：`MobileLandscapeHub`

**位置**：`src/components/MobileLandscapeHub.tsx`

**职责**：在移动端横屏时，替代 `MobileBottomNav`，提供左侧垂直图标导航。

**Props**：

```ts
interface MobileLandscapeHubProps {
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
}
```

**结构**：

- 外层 `<aside>`，固定宽度 56px，全高
- 5 个图标按钮垂直排列：星图、情报、科技、政府、档案
- 底部设置按钮
- 当前激活项用左侧 2px 高亮条 + 主色图标标识
- 每个按钮区域 48×48px，留出 4px 间距

**视觉**：

```css
.mobile-landscape-hub {
  width: 56px;
  height: 100%;
  background: rgba(7, 11, 20, 0.75);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(36, 50, 69, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 8px;
  flex-shrink: 0;
}
```

### 4.2 现有组件改动

#### 4.2.1 `App.tsx`

**改动 1：布局判定**

```ts
// 修改前
const showDesktopLayout = !isMobile || isMobileLandscape;

// 修改后
const showDesktopLayout = !isMobile && !isMobileLandscape;
```

**改动 2：主内容区结构**

```tsx
<main className="flex-1 flex overflow-hidden">
  {/* 桌面端 LeftHub */}
  {showDesktopLayout && <LeftHub ... />}

  {/* 移动端横屏：左侧图标栏 */}
  {isMobileLandscape && <MobileLandscapeHub ... />}

  {/* 中央视口 */}
  <div className="flex-1 relative overflow-hidden ...">
    {renderCenterView()}
  </div>

  {/* 右侧 Inspector */}
  {showDesktopLayout ? (
    <RightInspector />
  ) : (
    <MobileInspectorDrawer open={mobileDrawerOpen} ... />
  )}
</main>
```

**改动 3：底部导航**

```tsx
{/* 桌面端 BottomEventBar */}
{showDesktopLayout && <BottomEventBar />}

{/* 移动端竖屏：底部导航 */}
{isMobile && !isMobileLandscape && <MobileBottomNav ... />}
```

**改动 4：移除 scaled container 类**

```tsx
// 修改前
<div className={`... ${isMobileLandscape ? 'mobile-landscape-scale' : ''}`}>

// 修改后
<div className="flex-1 flex flex-col w-full overflow-hidden">
```

#### 4.2.2 `TopHUD.tsx`

在 `isMobileLandscape` 时，进一步紧凑化：

- 只显示"稳定度"和"威慑度"
- 隐藏人口、经济、资源、军力（与当前 mobile 断点行为一致）
- 字体和 padding 可适当缩小

当前 `useBreakpoint` 已在 TopHUD 内部使用，因此只需确保 `isMobile` 判定正确即可（横屏时 `isMobile=true`，因为 width<768）。

#### 4.2.3 右侧 Inspector 抽屉

移动端横屏时，Inspector 抽屉行为：

- 默认半开：`mobileDrawerOpen = true`（仅在横屏初始化时）
- 宽度 280px，从右侧滑入
- 收起时显示一个半透明的"详情"胶囊按钮在右侧边缘
- 点击星球或底部胶囊按钮时打开抽屉

为最小化改动，复用现有 `mobileDrawerOpen` 状态，但在 `isMobileLandscape` 时给抽屉容器增加一个固定宽度类，而不是全屏覆盖。

### 4.3 删除内容

删除 [index.css](../../03_Web_Rebuild/src/index.css) 中的 `.mobile-landscape-scale` 相关样式：

```css
@media (max-height: 500px) and (orientation: landscape) {
  .mobile-landscape-scale {
    transform: scale(0.85);
    transform-origin: top center;
    width: 117.64% !important;
    height: 117.64% !important;
  }
}
```

---

## 5. 交互与状态

### 5.1 视图切换

- 左侧图标栏点击 → `setActiveView(...)`，与 MobileBottomNav 行为一致
- 当前激活视图在图标栏中通过左侧高亮条和主色图标反馈

### 5.2 星球选择

- 点击星图星球 → 触发 `star-selected` 事件
- 移动端横屏：自动打开右侧 Inspector 抽屉（如果收起）
- 已有逻辑：`handleStarSelected` 在 `isMobile` 时 `setMobileDrawerOpen(true)`，无需修改

### 5.3 抽屉收起/展开

- 抽屉顶部有"✕ 关闭"按钮
- 关闭后，右侧显示一个 32×48px 的半透明"详情"胶囊按钮，点击可重新打开
- 横竖屏切换时，抽屉状态保持（不强制重置）

---

## 6. 动画与过渡

| 元素 | 动画 | 时长 | 说明 |
|---|---|---|---|
| 抽屉展开/收起 | `translateX` | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 图标栏激活指示 | `opacity` + `scale` | 200ms | 柔和反馈 |
| 视图切换 | 无 | — | 保持即时响应，避免影响星图性能 |

---

## 7. 测试验收标准

沿用 [responsive.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/responsive.spec.ts) 中的断言，并增加：

1. **移动端横屏布局断言**：
   - `MobileLandscapeHub` 可见
   - `MobileBottomNav` 不可见
   - `LeftHub` 不可见
   - `RightInspector` 抽屉可见（默认半开）

2. **视口内可见性断言**：
   - TopHUD 完整在视口内
   - MobileLandscapeHub 完整在视口内
   - Center Viewport 完整在视口内
   - Inspector 抽屉完整在视口内

3. **无缩放断言**：
   - 检查 `.mobile-landscape-scale` 类不存在
   - 检查元素 boundingBox 与视口尺寸匹配（无 117.64% 放大）

4. **横竖屏切换连续性**：
   - 竖屏 → 横屏：底部导航消失，左侧图标栏出现，抽屉默认打开
   - 横屏 → 竖屏：左侧图标栏消失，底部导航出现，抽屉状态保留

---

## 8. 兼容性考虑

1. **Tutorial**：当前 tutorial 高亮假设移动端有 `mobile-bottom-nav`。横屏新增 `MobileLandscapeHub` 后，tutorial 需要为 `mobile-nav-*` 元素在图标栏中设置对应的 `data-tutorial-id`。本方案在 `MobileLandscapeHub` 中沿用相同的 `data-tutorial-id`（如 `mobile-nav-starmap`），tutorial 坐标逻辑可复用。

2. **Safe Area**：左侧图标栏需要避开左侧刘海/圆角，使用 `env(safe-area-inset-left)`。

3. **iPad**：iPad 竖屏 768×1024 属于 tablet 断点（`isMobile=false`），继续走桌面布局；iPad 横屏 1024×768 同样属于 desktop 断点，不受影响。只有手机横屏（width<768）才进入本方案。

4. **键盘快捷键**：快捷键（M/I/T/G/A）在移动端横屏仍然有效，因为 `handleKeyDown` 不依赖布局形态。

---

## 9. 文件改动清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `src/components/MobileLandscapeHub.tsx` | 新增 | 左侧 56px 垂直图标栏 |
| `src/App.tsx` | 修改 | 新布局判定、渲染 MobileLandscapeHub、移除 scale 类 |
| `src/index.css` | 修改 | 删除 `.mobile-landscape-scale`，添加 `.mobile-landscape-hub` / `.mobile-inspector-drawer` 样式 |
| `src/components/TopHUD.tsx` | 可能修改 | 确保 mobile 断点下隐藏非关键 stat（当前已支持，大概率无需改动） |
| `src/test/e2e-playwright/responsive.spec.ts` | 修改 | 更新横屏用例断言，匹配 A2 布局 |

---

## 10. 风险与回滚

| 风险 | 缓解 |
|---|---|
| Tutorial 高亮错位 | `MobileLandscapeHub` 沿用 `mobile-nav-*` tutorial id，必要时在 tutorial 步骤中按方向动态定位 |
| 横屏抽屉默认打开遮挡星图 | 抽屉宽度 280px，844px 视口剩余 508px 给星图，足够操作；用户可手动收起 |
| 旧设备性能 | 无缩放、无额外重排，性能优于原方案 |

**回滚策略**：若 A2 上线后发现问题，可回退到 A1（仅隐藏 `MobileLandscapeHub`，恢复底部导航，Inspector 仍走抽屉），无需恢复 scale 方案。
