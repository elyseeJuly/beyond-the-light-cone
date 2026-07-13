# 新手教程误触修复与重设计执行报告

> **文档编号**: EXEC_20260713_TUTORIAL_MISCLICK_REDESIGN  
> **日期**: 2026-07-13  
> **归档类别**: 实施执行与验证报告 (Execution & Verification Report)  
> **前置文档**:
> - [EXEC_20260713_TUTORIAL_SIMPLIFICATION_REPORT.md](./EXEC_20260713_TUTORIAL_SIMPLIFICATION_REPORT.md)（上一轮 4 步简化）
> - [AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md](./AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md)（AP 系统与阻断器）

---

## 一、问题背景

玩家反馈**"新手教程点击地球经常会误触"**——表面看是"误触"，但通过对 `Tutorial.tsx` 与 `StarMapRenderer.ts` 联合排查，定位出 5 个**根因**导致的"看着没反应"现象，技术上属于"点击吞掉"而非玩家手误。

### 1.1 根因清单（基于代码事实）

| 编号 | 根因 | 文件:行 | 症状 |
|------|------|---------|------|
| R1 | 教程高亮框 40×40px 远小于 StarMapRenderer 地球实际 hit 区域 60px | `Tutorial.tsx:150` vs `StarMapRenderer.ts:355` | 玩家"看着在框内点击"，但点击位置正好在 60px 圆之外，被教程遮罩拦截 |
| R2 | 4 块分块遮罩 (top/bottom/left/right) 存在 1-2px 接缝 | `Tutorial.tsx:371-381` | 高亮框边缘 1-2px 的点击落在 4 块 div 接缝处，被吞 |
| R3 | 教程未自动定位地球，初始视图可能停留在银河系区域 | `Tutorial.tsx:204-219` 不重置星图 | 玩家"根本找不到地球"（地球不在视野内） |
| R4 | 移动端 landscape 缩放未纳入 hotspot 物理像素换算 | `Tutorial.tsx:169-173` 只在 `updateRect` 修正 | 移动端 hotspot 视觉位置与点击位置错位 |
| R5 | 教程步骤 1 时地球静止在拥挤星海中，缺少视觉引导 | `StarMapRenderer.ts` 无 pulse 接口 | 玩家在数百颗星中找目标 |

---

## 二、方案设计

### 2.1 设计原则

- **零回归**：保留已稳定的 4 步核心结构（点击地球 → 资源生产 → 启动科研 → 推进回合）
- **零状态机重构**：不引入新状态机，在原 `useState/useEffect` 框架内修复
- **最小侵入**：仅修改 Tutorial.tsx、StarMapRenderer.ts、测试文件；不动 Game.ts / App.tsx
- **真实可见性**：每个修复在浏览器中可立即观察到效果

### 2.2 5 步新流程（用户选择"添加欢迎页"）

```
┌──────────────────────────────────────────────────────────────┐
│  序幕 (welcome)  ── 1.5s 自动 ──→  步骤 1/4 (click-earth)  │
│  文明的故事，从这里开始。                  │                    │
│                                              ↓                │
│                                步骤 2/4 (resource-production) │
│                                              ↓                │
│                                步骤 3/4 (start-research)     │
│                                              ↓                │
│                                步骤 4/4 (next-turn)          │
└──────────────────────────────────────────────────────────────┘
```

---

## 三、5 个根因的修复方案

### 3.1 修复 R1：高亮框扩大到 110×110px（覆盖 60px 实际命中区）

**位置**: [Tutorial.tsx:43](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx#L43-L51)

```typescript
{
  id: 'click-earth',
  title: '选中家园',
  highlightSize: 110,        // 110 > 60（地球 hit 半径），覆盖 1.83 倍
  forgivingClick: true,      // 宽容点击
  focusStar: STAR_INDEX.EARTH, // 配合 StarMapRenderer 居中
  ...
}
```

**效果**: 教程高亮框完全覆盖 StarMapRenderer 实际命中区，不再有"在框内但不在圆内"的死亡地带。

### 3.2 修复 R2：单一可点击 hotspot 替代 4 块分块遮罩

**位置**: [Tutorial.tsx:421-435](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx#L421-L435)

```typescript
{/* 步骤 1：地球专属 hotspot —— 单一可点击按钮，彻底消除 4 块遮罩的接缝漏点 */}
{isEarthStep && highlightRect && (
  <button
    type="button"
    data-testid="tutorial-earth-hotspot"
    onClick={handleEarthHotspotClick}
    className="absolute z-[1003] cursor-pointer bg-transparent border-0 p-0"
    style={{ top, left, width, height }}
  />
)}
```

**关键点**:
- hotspot 是真实 `<button>` 元素，独占 `z-[1003]`（高于遮罩的 `z-[1001]`）
- 4 块分块遮罩依然存在，但其内边各向 hotspot 方向**收缩 2px**，让 hotspot 区域独占点击无接缝
- hotspot onClick 主动派发 `star-selected` 事件，绕过 StarMap 真实 hit 判定（forgivingClick）

### 3.3 修复 R3：步骤 1 启动时自动 focusOnStar 地球

**位置**: [Tutorial.tsx:243-260](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx#L243-L260)

```typescript
if (current.focusStar !== undefined) {
  let attempts = 0;
  const tryFocus = () => {
    attempts++;
    const renderer = (window as any).activeStarMapRenderer;
    if (renderer) {
      renderer.focusOnStar(current.focusStar!, 1.5, true);
      renderer.setTutorialPulse(current.focusStar!);
      return;
    }
    if (attempts < 20) requestAnimationFrame(tryFocus);
  };
  requestAnimationFrame(tryFocus);
}
```

**配套新增**: [StarMapRenderer.focusOnStar](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts) 公共方法

```typescript
public focusOnStar(starIndex: number, targetZoom: number = 1.5, ensureActiveArea: boolean = true): boolean {
  // 1. 强制切换到包含目标星球的星区（关键：玩家停留在银河系时也能定位到太阳系地球）
  // 2. 居中：将 rs.x 映射到 width/2, rs.y 映射到 height/2
  // 3. 缩放：默认 1.5x（地球视觉更大更易点击）
  // 4. 限制缩放范围 [0.3, 3.0]
}
```

**效果**: 教程步骤 1 启动时，无论玩家之前停留在哪个星区，地球都会被自动居中并放大到 1.5x。

### 3.4 修复 R4：移动端 landscape 缩放已在 useEffect 中处理

**位置**: [Tutorial.tsx:171-185](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx#L171-L185)

```typescript
const getScaleFactor = useCallback((): number => {
  const el = document.querySelector('.mobile-landscape-scale');
  if (el) {
    const style = window.getComputedStyle(el);
    const matrix = new DOMMatrixReadOnly(style.transform);
    if (matrix.a !== 1) return matrix.a;
  }
  return 1;
}, []);
```

**说明**: 上一轮已实现，本轮保留并验证。

### 3.5 修复 R5：地球在教程中显示呼吸光圈

**位置**: [StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts) 新增 `setTutorialPulse` 与 pulse ring 渲染

```typescript
public setTutorialPulse(starIndex: number | null): void {
  this.tutorialPulseStarIndex = starIndex;
}
```

绘制 3 圈呼吸光环（半径递增 + alpha 递减）+ 1 圈静态虚线内环 + 视觉上明确指示目标。

**新增字段**:
```typescript
public tutorialPulseStarIndex: number | null = null;
```

**额外保护**: `setActiveArea` 切换星区时自动清除 pulse，避免跨区域残留：
```typescript
public setActiveArea(area: StarArea): void {
  this.activeArea = area;
  // 切换星区时清除教程脉冲
  if (this.tutorialPulseStarIndex !== null) {
    const rs = this.renderStarMap.get(this.tutorialPulseStarIndex);
    if (!rs || !this.isStarInActiveArea(rs.star)) {
      this.tutorialPulseStarIndex = null;
    }
  }
}
```

---

## 四、欢迎页设计

用户选择"添加欢迎页"方案——在原 4 步核心流程前加 1.5s 自动过渡的"序幕"页。

**目的**:
- 给玩家**思考空间**，避免一进游戏就要求操作
- 建立**仪式感**，与"纪元往事"主题契合
- **可被"开始"按钮立即跳过**（按 ESC 也跳过）

**文案**: "文明的故事，从这里开始。"

**进度条显示**: 序幕页进度条显示 20%（1/5），核心 4 步各显示 40%/60%/80%/100%

**步骤计数**: 显示为 `步骤 X / 4`（欢迎页显示为"序幕"），让玩家明确知道这是 4 步核心流程

---

## 五、改动文件清单

| 文件路径 | 改动类型 | 关键改动 |
|----------|----------|----------|
| `src/components/Tutorial.tsx` | 重写 | 5 步架构 + 110px 高亮框 + 单一 hotspot + focusStar 集成 |
| `src/ui/StarMapRenderer.ts` | 扩展 | 新增 `focusOnStar()` / `setTutorialPulse()` + pulse 渲染 |
| `src/test/components/Tutorial.test.tsx` | 重写 | 适配 5 步 + 新增 focusStar/highlightSize/forgivingClick 断言 |
| `src/test/scenarios/TutorialRemedy.scenario.test.tsx` | 大改 | 14 个测试场景全部通过，新增 focusOnStar / hotspot / welcome 测试 |

**未修改文件**（避免改动蔓延）:
- `App.tsx`：已正确处理 `change-active-view` 事件，无需改动
- `TopHUD.tsx`：阻断器宽限期逻辑保持不变
- `Game.ts`：本次任务不涉及 AP / 阻断器 / 纪元逻辑

---

## 六、测试与验证

### 6.1 测试结果

```
✓ Tutorial 冒烟测试 (3/3)
✓ TutorialRemedy 场景测试 (14/14)
  ├─ SCEN-TUTORIAL-5-STEPS
  ├─ SCEN-TUTORIAL-SHORT-TEXT (每步 ≤ 25 汉字)
  ├─ SCEN-TUTORIAL-RENDER (无"下一步"按钮)
  ├─ SCEN-TUTORIAL-WELCOME (1.5s 自动过渡)
  ├─ SCEN-TUTORIAL-STEP1-HOTSPOT ★ 核心防误触
  ├─ SCEN-TUTORIAL-STEP1-FOCUS-EARTH ★ 自动居中地球
  ├─ SCEN-TUTORIAL-STEP2-BUILD-STOPE
  ├─ SCEN-TUTORIAL-STEP3-START-RESEARCH
  ├─ SCEN-TUTORIAL-STEP4-NEXT-TURN
  ├─ SCEN-TUTORIAL-BLOCKER (教程期间 blocker 穿透)
  ├─ SCEN-GRACE-PERIOD-BLOCKERS (前 3 回合宽限期)
  ├─ SCEN-GRACE-PERIOD-EXPIRY (3 回合后正常阻断)
  ├─ SCEN-MANUAL-BLOCKER (非宽限期手动模式)
  └─ SCEN-TUTORIAL-CLICK-THROUGH (遮罩点击穿透)
全套 vitest: 1072 passed, 2 failed (失败为 Game.ts 未提交修改的预存在回归，与本任务无关)
```

### 6.2 关键验证点

1. **欢迎页自动过渡**: 渲染后 1.5s 自动进入步骤 1/4
2. **focusOnStar 自动调用**: 步骤 1 启动时 `renderer.focusOnStar(3, 1.5, true)` 被调用
3. **hotspot 点击完成步骤**: 点击高亮框内任何位置都算选中地球
4. **完整流程**: 欢迎页 → 选中地球 → 建造采矿场 → 启动科研 → 推进回合，全程 1.5+3+0.3+0.5+0.5+0.5+0.5+0.5+0.6 ≈ 8s
5. **每步文案 ≤ 25 汉字**: 通过 `SCEN-TUTORIAL-SHORT-TEXT` 自动化验证

### 6.3 移动端验证

- 移动端 landscape 缩放：移动端 hotspot 物理像素换算已在 `getScaleFactor` 中实现
- 移动端 768px 以下：教程卡片自动切换为"上半部分高亮→卡片置底"或"下半部分高亮→卡片置顶"布局
- 移动端横屏：教程卡片左右避让逻辑保留

---

## 七、设计权衡与可改进点

### 7.1 设计权衡

1. **单一 hotspot vs 4 块遮罩接缝**: 选择在步骤 1 单独加 hotspot 按钮，对其他步骤保留 4 块遮罩（因为其他步骤的高亮目标不涉及星图，60px 命中区问题不存在）
2. **110px 高亮框 vs 更小**: 110px 在桌面端占据屏幕约 8%（1024 宽），视觉提示足够明显但不过分
3. **focusOnStar zoom 1.5x**: 1.5x 让地球视觉更突出，但又不会放大到干扰其他星星
4. **欢迎页 1.5s vs 2s/3s**: 1.5s 既给玩家思考时间又不会让玩家觉得"卡住了"

### 7.2 可改进点

1. **更多步骤可考虑欢迎页**（如纪元切换时）
2. **focusOnStar 可以支持缓动动画**而非瞬移
3. **pulse ring 可以支持多色**（按星体类型区分颜色）
4. **hotspot 区域可以支持长按**触发不同操作

---

## 八、相关活文档更新记录

本次改动同步更新以下活文档：
- `02_Project_Documentation/AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md` — 阻断器宽限期规则说明（上一轮已更新）
