# 宇宙群英传 (Legend of Uni) - 开发历程与代码审计报告

> **审计日期**：2026-05-14
> **审计范围**：全项目（Web 前端 + Windows MFC 原版）
> **项目阶段**：Web 重制版 Alpha 阶段

---

## 一、项目概览

### 1.1 项目结构

```
LengendOfUni-rebuild/
├── legend-of-uni-web/          # React + TypeScript + Vite 重制版（主力开发线）
│   ├── src/
│   │   ├── components/         # React UI 组件 (TopHUD, StarMap, LeftHub, etc.)
│   │   ├── core/               # 游戏核心逻辑 (Game, Civilization, Combat, etc.)
│   │   ├── data/               # JSON 静态数据 (人物、星球、事件、武器、异星)
│   │   ├── types/              # TypeScript 类型定义 (枚举、叙事系统接口)
│   │   └── ui/                 # 传统 class-based UI 面板 (桥接遗留系统)
│   ├── public/images/          # 角色头像等静态资源
│   ├── dist/                   # 构建产物
│   └── package.json            # 依赖: react 19, tailwindcss 4, vite 8, lucide-react
│
├── windows_mfc/                # 原始 Windows MFC 版本（参考源码，已弃用维护）
│   ├── LengendOfUni/           # 主游戏逻辑（C++ MFC）
│   ├── 3DPrelude/              # 3D 预渲染系统
│   └── MusicPlayer/            # 背景音乐播放器
│
└── dev_history/                # 历史开发文档归档
```

### 1.2 技术栈（Web 版）

| 层级 | 技术 | 版本 |
|------|------|------|
| 运行时 | React | 19.2.6 |
| 语言 | TypeScript | 5.0+ |
| 构建 | Vite | 8.0.12 |
| 样式 | Tailwind CSS | 4.3.0 |
| 图标 | Lucide React | 1.14.0 |
| 动画 | framer-motion | 12.38.0 |

---

## 二、代码审计结果

### 2.1 严重问题 (Critical)

#### C-001 | TypeScript 编译预期失败 (unused imports)

**位置**：
- [TopHUD.tsx:L1](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/components/TopHUD.tsx#L1) — `useCallback` 导入但从未使用
- [main.tsx:L1](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/main.tsx#L1) — `React` 导入但只用于 JSX（`jsx: "react-jsx"` 会自动处理）

**影响**：`tsconfig.json` 中 `noUnusedLocals: true` 且构建命令为 `"tsc && vite build"`，`tsc` 类型检查时会报错，导致 `npm run build` 失败。

**修复方案**：
```tsx
// TopHUD.tsx - 删除未使用的 useCallback 导入
import React, { useEffect, useState, useRef, useMemo } from 'react';

// main.tsx - 删除未使用的 React 导入
import ReactDOM from 'react-dom/client';
```

---

#### C-002 | 记忆体泄漏：TecTreeView 实例反复创建

**位置**：[App.tsx:L60-L68](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/App.tsx#L60-L68)

```typescript
useEffect(() => {
  if (activeView === 'techtree') {
    const container = document.getElementById('tech-tree-container');
    if (container) {
      const view = new TecTreeView(container);  // 每次切换都创建新实例
      view.render(container, TecTreeType.PHYSICS);
    }
  }
}, [activeView]);
```

**问题**：每次从星图切换到科技树视图，都会创建一个新的 `TecTreeView` 实例，旧的实例被遗弃但不会被 GC 及时回收（事件监听器、DOM 引用残留）。

**修复方案**：使用 `useRef` 持久化单例：
```typescript
const tecTreeRef = useRef<TecTreeView | null>(null);

useEffect(() => {
  if (activeView === 'techtree') {
    const container = document.getElementById('tech-tree-container');
    if (container) {
      if (!tecTreeRef.current) {
        tecTreeRef.current = new TecTreeView(container);
      }
      tecTreeRef.current.render(container, TecTreeType.PHYSICS);
    }
  }
}, [activeView]);
```

---

#### C-003 | 事件处理竞争条件

**位置**：[Game.ts:L187-L193](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/Game.ts#L187-L193)

```typescript
public applyEventEffect(effect: EventEffect): void {
  // ...
  this.currentEvent = null;
  window.dispatchEvent(new CustomEvent('game-event-triggered'));  // 触发 React 重渲染
  this.processNextEvent();  // 如果队列中还有事件，立即设置 new currentEvent
  window.dispatchEvent(new CustomEvent('game-turn-complete'));
}
```

**问题**：`game-event-triggered` 事件触发后 React 会执行重渲染，在 `processNextEvent()` 之后 `currentEvent` 可能已更新，但 React 可能读取到中间态（null），导致 StoryModal 意外关闭后立即重新打开，产生闪烁。

**修复方案**：合并事件通知，在 finally 尾部统一触发一次同步：
```typescript
public applyEventEffect(effect: EventEffect): void {
  // ... 效果处理 ...
  this.currentEvent = null;
  this.processNextEvent();
  // 统一在最后触发同步
  window.dispatchEvent(new CustomEvent('game-state-changed'));
}
```

---

#### C-004 | 存档/读档系统丢失回调函数

**位置**：[Game.ts:L235-L282](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/Game.ts#L235-L282)

**问题**：`GameEventPayload.choices[].action` 是函数引用，JSON 序列化后丢失。加载存档后事件的按钮没有实际的回调逻辑。虽然 `applyEventEffect` 仍能工作（通过 `GameEvent.effect` 枚举），但 `applyNewEffects` 类型的新式效果（resource/flag）在存档加载后完全失效。

**修复方案**：不在 Payload 中序列化函数，改用数据驱动的 effect 描述：
```typescript
// 改为纯数据描述
choices?: {
  label: string;
  effectType: 'event_effect' | 'new_effects';
  effectValue?: EventEffect;
  newEffects?: { type: string; target: string; value: number }[];
}[];
```
然后在 StoryModal 中使用 `GameInstance.get().applyEventEffect()` 统一处理。

---

### 2.2 高风险问题 (High)

#### H-001 | 大量 `any` 类型使用 (19 处)

**位置**：遍布 [Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/Game.ts#L196), [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/GameEventManager.ts#L51-L53), [WallfacerPanel.ts:L120](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/ui/WallfacerPanel.ts#L120) 等

**影响**：完全绕过类型检查，JSON 数据解析时字段名拼写错误无法被 IDE 检测。

**修复方案**：为 JSON 数据定义严格的 TypeScript interface：
```typescript
// src/types/data.ts
export interface AlienData {
  name: string;
  isplanet: number;
  res: number;
  poplimit: number;
  starsys: number;
  personality: number;
}

export interface PersonData {
  name: string;
  faceFile: string;
  army: number;
  economy: number;
  leadership: number;
  art: number;
  science: number;
  treachery: number;
  social: number;
}
// ... 以此类推
```

---

#### H-002 | 缺少 `.gitignore`（Web 项目）

**位置**：`legend-of-uni-web/` 目录下

**问题**：Web 项目目录没有 `.gitignore` 文件，根目录的 `.gitignore` 只覆盖 Visual Studio/MFC 项目。`node_modules/` 和 `dist/` 目录随时可能被误提交。

**修复方案**：在 `legend-of-uni-web/` 下创建 `.gitignore`：
```
node_modules/
dist/
*.local
.env
```

---

#### H-003 | `dist/` 已提交到仓库

**位置**：[legend-of-uni-web/dist/](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/dist/)

**问题**：构建产物 (`index-CggY--5O.css`, `index-CtXcANKH.js`) 被提交到 Git 仓库，增加仓库体积且每次构建产生差异。

**修复方案**：
```bash
git rm -r legend-of-uni-web/dist/
```
然后加入 `.gitignore`。

---

#### H-004 | 数据文件字段名不一致

**位置**：[events.json](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/data/events.json)

**问题**：`events.json` 中 `"name"` 字段存储的是年份数值（如 `2`, `10`, `50`），而代码中 `GameEvent.name` 类型为 `string`。代码逻辑用 `e.inYear` 做年份匹配，但 `data.title || data.name` 使标题变为数字字符串 `"50"`。

```json
{ "name": 50, "eventtype": 0, ... }  // name 实际是年份
```

**修复方案**：更新 JSON schema，将 `name` 重命名为 `inYear`，新增 `title` 字段：
```json
{ "title": "月球危机", "inYear": 50, "eventtype": 0, ... }
```

---

#### H-005 | `randomevents.json` 192KB 同步阻塞加载

**位置**：[GameEventManager.ts:L3](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/GameEventManager.ts#L3)

**问题**：`import randomEventsData from "../data/randomevents.json"` 在模块加载时同步解析 192KB JSON，阻塞主线程。文件中包含大量事件数据。

**修复方案**：使用动态 import 懒加载：
```typescript
public async init(): Promise<void> {
  this.events = this.parseEventData(eventsData);
  const { default: randomData } = await import("../data/randomevents.json");
  this.randomEvents = this.parseEventData(randomData);
}
```
或使用 Vite 的 `?url` 后缀配合 `fetch()` 按需加载。

---

### 2.3 中风险问题 (Medium)

#### M-001 | `framer-motion` 依赖未使用

**位置**：[package.json:L23](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/package.json#L23)

**问题**：项目中没有任何文件 import framer-motion（已全局搜索确认 0 结果），但依赖已安装。增大 bundle 体积约 50KB+。

**修复方案**：
```bash
npm uninstall framer-motion
```

---

#### M-002 | 默认头像文件缺失

**位置**：[GameEventManager.ts:L15](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/GameEventManager.ts#L15)

**问题**：`mapAvatar()` 的 fallback 返回 `/images/character_default.png`，但该文件在 `public/images/` 中不存在，导致事件弹窗中头像显示为 broken image。

**修复方案**：创建一张默认头像图片，或改为 CSS-based placeholder。

---

#### M-003 | `canvas` 元素重复创建

**位置**：
- [App.tsx:L105](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/App.tsx#L105) — `<canvas id="star-canvas-react" />`
- [StarMap.tsx:L39-L41](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/components/StarMap.tsx#L39-L41) — `StarMapRenderer` 使用 `canvasRef`

**问题**：当 `activeView === 'starmap'` 时，StarMap 组件内部创建了一个 canvas（由 StarMapRenderer 使用），同时 App.tsx 也渲染了一个 `id="star-canvas-react"` 的 canvas，导致页面上有重复的 canvas 元素。

**修复方案**：移除 App.tsx 中的 `star-canvas-react` canvas 元素，StarMap 组件已完全管理自己的 canvas。

---

#### M-004 | `TopHUD` 中 `handleNextTurn` 双重事件派发

**位置**：[TopHUD.tsx:L70-L74](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/components/TopHUD.tsx#L70-L74)

```typescript
const handleNextTurn = () => {
  GameInstance.get().runARound();  // runARound 内部会 dispatch 'game-turn-complete'
  setUpdateCount(n => n + 1);
  window.dispatchEvent(new CustomEvent('game-turn-complete'));  // 又 dispatch 一次
};
```

**问题**：`game-turn-complete` 事件被触发两次（Game.runARound 内部一次 + TopHUD 这里一次），导致 React 组件可能重复渲染。

**修复方案**：移除重复的 dispatch，保留 Game.runARound 内部的事件：
```typescript
const handleNextTurn = () => {
  GameInstance.get().runARound();
  setUpdateCount(n => n + 1);
  // runARound 内部已 dispatch 'game-turn-complete'，无需重复
};
```

---

#### M-005 | `RightInspector` 建筑系统无资源消耗

**位置**：[RightInspector.tsx:L45-L53](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/components/RightInspector.tsx#L45-L53)

```typescript
const handleBuildStope = () => {
  if (!star.hasStope) { star.hasStope = true; forceUpdate(n => n + 1); }
};
```

**问题**：建造采矿场、加工厂、太空城市不需要任何资源消耗，玩家可以瞬间无成本完成所有建设，游戏平衡性缺失。

**修复方案**：添加资源消耗检查，并与 Building 模型同步：
```typescript
const handleBuildStope = () => {
  if (!star.hasStope && earth.economy >= 50) {
    earth.economy -= 50;
    star.hasStope = true;
    forceUpdate(n => n + 1);
  }
};
```

---

#### M-006 | 事件系统圆环依赖

**位置**：[GameEventManager.ts:L110](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/GameEventManager.ts#L110)

**问题**：`GameEventManager.checkRandomEvents()` 内部调用 `GameInstance.get()` 获取当前 Epoch，而 `Game` 类又持有 `GameEventManager`。虽然通过单例模式技术上可行，但构成逻辑上的循环依赖，不利于单元测试。

**修复方案**：将 `currentEpoch` 作为参数传入：
```typescript
public checkRandomEvents(currentEpoch: EpochType): GameEvent | null {
  // ...
}
```

---

### 2.4 低风险问题 (Low)

#### L-001 | 弃用的 UI 管理器类未被清理

**位置**：[UIManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/ui/UIManager.ts) 和 [MainLayout.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/ui/MainLayout.ts)

**问题**：`UIManager` 和 `MainLayout` 是早期纯 DOM 操作的 UI 系统，现已被 React 组件体系替代（`TopHUD`, `LeftHub`, `RightInspector`, `StarMap`），但仍保留在代码中，增加维护负担。

**修复方案**：在确认无引用后可安全删除，或标记 `@deprecated` 注释。

---

#### L-002 | `StarMapRenderer` 鼠标判定范围不一致

**位置**：[StarMapRenderer.ts:L94](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/ui/StarMapRenderer.ts#L94)

**问题**：鼠标判定使用 `radius * radius * 4` 的平方放大，但对于太阳（radius=20）来说判定范围达到 80² 像素，远超实际可视范围。

**修复方案**：为不同 radius 使用不同放大系数，或改为固定 15px 判定容差。

---

#### L-003 | MFC 编码损坏文件

**位置**：[EarthCivilization.cpp.utf8](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legendo-of-uni-rebuild/windows_mfc/LengendOfUni/EarthCivilization.cpp.utf8)

**问题**：存在一个 `.cpp.utf8` 文件，暗示原始 GBK 编码的 `.cpp` 文件被错误处理或备份。实际编译时使用的是 `EarthCivilization.cpp`。

**修复方案**：检查两文件内容是否一致，一致的删除 `.utf8` 备份。

---

#### L-004 | 科技树完全硬编码

**位置**：[TecTreeManager.ts:L11-L43](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/TecTreeManager.ts#L11-L43)

**问题**：所有科技节点通过 `physics.addNode(...)` 硬编码，没有对应的 JSON 数据文件。当需要新增/修改科技树时，必须改代码重新编译。

**修复方案**：创建 `data/techtrees.json`，将科技节点配置数据化，在 `init()` 中读取即可。

---

#### L-005 | `events.json` 中 `effect` 枚举映射不完整

**位置**：[Game.ts:L170-L186](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/Game.ts#L170-L186)

**问题**：`applyEventEffect` 只处理了 `ADDECONEMY`(1), `ADDCULTURE`(2), `ADDPOP`(3), `MOON_CRISIS`(6), `WANDERING_EARTH`(7)。`ADDTREACHERY`(4) 和 `WAR`(5) 在 switch 中没有 case 分支。

**修复方案**：补充完整的事件效果处理，或至少添加 `default: this.addHistory(\`未处理事件效果: ${effect}\`)`。

---

## 三、架构评估

### 3.1 优点

- **前后端分离清晰**：React 组件负责 UI，Core 层纯逻辑，数据通过 JSON 静态文件加载
- **游戏循环设计合理**：`Game.runARound()` 是清晰的回合制入口，通过 `isProcessing` 锁防止重入
- **单例模式适用**：`GameInstance` 全局唯一游戏实例，存取存档简单直接
- **叙事系统独立**：事件、对话、选项的数据模型分离清晰（`GameEvent` → `GameEventPayload` → `StoryModal`）
- **存/读档系统**：Map/Set 的序列化通过自定义 `replacer/reviver` 实现，原型链恢复机制完善

### 3.2 待改进

- **双轨 UI 系统**：React 组件 + Legacy class-based 面板并存，维护成本高，建议全部迁移到 React
- **全局事件总线**：依赖 `window.dispatchEvent` / `addEventListener` 传递状态，应改用 Zustand/Jotai 等轻量状态管理库
- **JSON 数据 Schema 缺失**：数据加载时没有运行时验证，字段拼写错误无声失败
- **测试缺失**：没有任何单元测试或集成测试文件
- **硬编码多**：科技树、初始数据（如 Earth index=4）分散在多个文件中

---

## 四、修复优先级路线图

| 优先级 | 编号 | 描述 | 预计工时 |
|--------|------|------|----------|
| P0 | C-001 | 修复 TypeScript 编译错误（unused imports） | 5 min |
| P0 | C-002 | 修复 TecTreeView 内存泄漏 | 15 min |
| P0 | C-004 | 修复存档系统回调丢失 | 1 h |
| P1 | H-002 | 创建 `.gitignore` | 5 min |
| P1 | H-003 | 从 Git 移除 `dist/` | 5 min |
| P1 | H-001 | JSON 数据接口类型化 | 1 h |
| P1 | C-003 | 事件处理竞争条件 | 30 min |
| P1 | H-005 | randomevents.json 懒加载 | 30 min |
| P2 | M-001 | 移除未使用的 framer-motion | 5 min |
| P2 | M-003 | Canvas 重复元素清理 | 15 min |
| P2 | M-004 | TopHUD 双重事件修复 | 10 min |
| P2 | M-005 | 建筑系统资源消耗 | 30 min |
| P2 | H-004 | 数据字段名规范化 | 30 min |
| P3 | L-001 | 弃用 UI 类清理 | 1 h |
| P3 | L-004 | 科技树数据化 | 2 h |
| P3 | L-005 | 事件效果枚举补全 | 15 min |
| P4 | - | 引入状态管理库 | 4 h |
| P4 | - | 单元测试框架搭建 | 4 h |

---

## 五、开发历程总结

### 5.1 项目时间线

| 阶段 | 时间 | 描述 |
|------|------|------|
| **MFC 原版** | 不详 | 基于 Windows MFC + DirectX 的单机客户端，已停止维护 |
| **Web 迁移决策** | 不详 | 确定使用 React + TypeScript 技术栈重建 |
| **核心引擎移植** | ~2025/2026 | Civilization, Star, Person, Combat, TecTree 等核心类从 C++ 翻译到 TypeScript |
| **UI 初版** | ~2026 Q1 | UIManager + MainLayout 纯 DOM 操作 UI，功能可用但维护困难 |
| **React UI 重构** | 2026 Q2 | TopHUD, StarMap, LeftHub, RightInspector, StoryModal, EndGameScreen 陆续完成 |
| **叙事系统 M8** | 2026 | 事件驱动叙事引擎，对话框打字机效果，多分支选项系统 |
| **当前阶段** | 2026-05 | React UI 已上线，双轨 UI 并存，核心逻辑运行稳定 |

### 5.2 关键里程碑

1. **Game.ts 完成** — 回合制主循环 `runARound()`、存档序列化/反序列化、纪元系统、终局判定
2. **StarMapRenderer Canvas 实现** — 太阳系轨道模型、舰队航线动画、行星交互选择
3. **StoryModal** — 带打字机效果的剧情对话框，支持多对话节点和多分支选项
4. **面壁/威慑系统** — 面壁者管理、执剑人任命、威慑值累加、宇宙广播终极选项
5. **存档系统** — Map/Set 自定义序列化、原型链恢复、持久化到 localStorage

### 5.3 已知遗留问题

- 异星文明 AI 行为简单（仅威慑判定 + 随机远征）
- 舰队战斗系统仅支持极简战力计算
- 未实现真正的科技树依赖验证（多条科技线平行研发无互斥）
- 没有网络联机/云存档功能

---

> *本文档由代码审计工具自动生成，涵盖 30+ 源文件、6 个 JSON 数据文件、2 个项目子目录的全面审计。*  
> *审计人：Agent · 项目路径：`e:\sunfunsoft\xman平台\XCRM\LengendOfUni-rebuild`*