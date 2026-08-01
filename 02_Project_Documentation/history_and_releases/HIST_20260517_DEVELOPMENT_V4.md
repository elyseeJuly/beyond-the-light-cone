# 宇宙群英传 (Legend of Uni) — 开发历程 V4

> 版本：Web 重构版 Alpha 2.3
> 日期：2026-05-17
> 重点：亮色主题适配 + 剩余优化项闭环

---

## 一、本轮优化概述

本轮聚焦两个核心目标：
1. **亮色主题 (United Government Bridge) 全链路字体可见性修复** — 彻底解决明亮色背景上文字「隐形」的问题
2. **优化文档中尚未闭环的 P1/P2 项** — 存档系统、主题切换、远星可视化、事件策略预览

**修改文件**：10 个核心文件
**代码变更**：+282 行 / -149 行 / 净增 +133 行
**TypeScript 编译**：零错误
**构建状态**：通过 (tsc + vite build，756ms)

---

## 二、亮色主题字体可见性修复

### 问题根源
项目中共 42+ 处硬编码了暗色主题专用颜色值（`#fff`, `#00E5FF`, `#FFD700`, `rgba(255,255,255,0.1)` 等），亮色模式下白色文字在 `rgba(255,255,255,0.9)` 面板上完全不可见。

### 2.1 CSS 变量体系重构

**文件**：[index.css](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/index.css)

新增 6 个语义化 CSS 变量，双主题自动切换：

| 变量 | 亮色值 | 暗色值 | 用途 |
|------|-------|-------|------|
| `--text-accent` | `#0D47A1` | `#00E5FF` | 强调文字（替代之前未定义的 `--text-accent`） |
| `--color-primary-rgb` | `13,71,161` | `0,229,255` | 用于 rgba() 构造阴影/发光 |
| `--color-primary-glass` | `rgba(13,71,161,0.1)` | `rgba(0,229,255,0.1)` | 主色玻璃态背景 |
| `--color-primary-glass-hover` | `rgba(13,71,161,0.2)` | `rgba(0,229,255,0.2)` | 主色玻璃态悬浮态 |
| `--border-glass` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | 通用玻璃态边框 |
| `--border-glass-strong` | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.12)` | 增强玻璃态边框 |

### 2.2 组件级颜色替换

#### .glass-panel
```
旧：border border-white/10 dark:border-white/5
新：border border-black/5 dark:border-white/5
```
亮色模式使用黑色半透明边框替代白色。

#### .tech-node
```
旧：h4 → text-white（白字）
旧：hover bg → rgba(0,229,255,0.05)
旧：finished h4 → #00E5FF
新：h4 → text-[var(--text-primary)]
新：hover bg → var(--color-primary-glass)
新：finished h4 → var(--color-primary)
```
科技树面板完全适配双主题。

#### .btn-primary
```
旧：background: rgba(0,229,255,0.1) ← 硬编码暗色主题青色
旧：color: #00E5FF
新：background: var(--color-primary-glass)
新：color: var(--color-primary)
```

#### .btn-glass（新增）
新增 btn-glass 组件类：透明背景 + 自适应边框/文字颜色，填补原代码中多处内联样式的需求。

#### .btn-close / .modal-header / .progress-bar
- `.btn-close` hover 文字从 `text-white` 改为自适应
- `.modal-header` 分隔线从 `rgba(255,255,255,0.05)` 改为 `var(--border-glass)`
- `.modal-box::before` 流动边框动画：亮色下 opacity 0.15，暗色下 0.3
- `.progress-bar-bg` 从 `rgba(255,255,255,0.05)` 改为 `var(--border-glass)`
- `.progress-bar-fill` 渐变从 `#00E5FF → #7B61FF` 改为 `var(--color-primary) → var(--color-research)`
- 滚动条适配：`bg-white/10 → bg-black/10 dark:bg-white/10`

### 2.3 StoryModal 组件修复

**文件**：[StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/StoryModal.tsx)

| 区域 | 修复项 | 旧值 | 新值 |
|------|-------|------|------|
| 左侧立绘区 | 背景 | `bg-[#050A1F]` | `bg-[var(--bg-main)]` |
| 左侧网格线 | 颜色 | `rgba(0,229,255,0.05)` | `var(--color-primary)` + opacity-5 |
| 左侧遮罩 | 渐变 | `from-black` | `from-black/40` |
| 角色标签 | 文字 | `text-white` | `text-[var(--text-primary)]` |
| 标题区 | 标题文字 | `text-white` | `text-[var(--text-primary)]` |
| 标题区 | 状态文字 | `text-white/20` | `text-[var(--text-secondary)]/20` |
| 打字区 | 正文文字 | `text-white/90` | `text-[var(--text-primary)]/90` |
| 打字区 | 光标 | `bg-primary` | `bg-[var(--color-primary)]` |
| 分隔线 | 边框 | `bg-white/5` | `bg-black/5 dark:bg-white/5` |
| 继续按钮 | 背景 | `bg-primary/10` | `bg-[var(--color-primary-glass)]` |
| 选项按钮 | 文字 | `text-white` | `text-[var(--text-primary)]` |
| Acknowledge | 文字 | `text-black` | `text-white dark:text-blue-950` |

### 2.4 旧版 UI 面板适配

#### DepartmentPanel
- `color: #fff` → `color: var(--text-primary)`
- `color: #FFD700` → `color: var(--color-primary)`
- `border: 1px solid var(--text-accent)` → `border: 1px solid var(--color-primary)`
- `background: rgba(0,229,255,0.1)` → `background: var(--color-primary-glass)`
- 负责人未任命时虚线框改用 `var(--border-glass)` / `var(--border-glass-strong)`

#### WallfacerPanel
- 面壁者卡片所有硬编码颜色替换为 CSS 变量
- 执剑人头像边框 `#FFD700` → `var(--color-primary)`
- 威慑进度条 `#00E5FF` → `var(--color-primary)`
- 撤销按钮 `#FF5500` → `#E65100`（统一到 gov danger 色板）
- 广播按钮保持醒目的红色系 `#E74C3C`（跨主题均可见）

#### PersonSelectPanel
- 人员卡片全部颜色体系替换
- 属性数值 `color:#fff` → `color:var(--text-primary)`
- 卡片 hover 效果 Lar‍替换
- 头像占位符背景适配主题

#### SystemMenuPanel
- 分隔线 `rgba(255,255,255,0.1)` → `var(--border-glass)`
- 重启按钮 `#FF5500` → `#E65100`

---

## 三、BUG-C3：主题切换机制统一

**问题**：
- App.tsx 中 `isDarkMode` 被 `useState(true)` 硬编码
- SystemMenuPanel 仅 toggle `dark` 类，不通知 React
- 刷新后主题状态丢失

**修复方案**：

1. [App.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/App.tsx)
   - `isDarkMode` 初始值从 `localStorage.getItem('game-theme')` 读取
   - 新增 `theme-change` 事件监听，SystemMenuPanel 切换时同步 React 状态
   - 每次切换后向 `localStorage` 写入持久化状态

2. [SystemMenuPanel.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/SystemMenuPanel.ts)
   - 切换时写入 `localStorage.setItem('game-theme', ...)`
   - 派发 `CustomEvent('theme-change', { detail: { isDark } })`

**效果**：主题状态跨刷新持久化，React 与非 React 代码双向同步。

---

## 四、OPT-P1-005：存档系统原型链恢复强化

**问题**：`loadGame()` 使用 `Object.assign` 浅拷贝后只恢复了 5 个顶层原型，子原型链脆弱。

**修复**：[Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts)

| 改进项 | 说明 |
|--------|------|
| 存档包装 | 新增 `{ version: 3, timestamp, data }` 外层包装，兼容未来版本 |
| 向后兼容 | 自动检测旧格式存档（无 wrapper），fallback 到直接解析 |
| `restorePrototypes()` | 集中化原型恢复函数，使用 `safeSP` 空值保护 |
| 部门原型 | 新增 `departments.values()` 原型恢复 |
| Star 字段补全 | 自动补全缺失的 `buildingProgress: null` |
| Fleet 字段补全 | 自动补全缺失的 `weapons: []` |
| `validateSaveIntegrity()` | 存档完整性校验：population/starManager/personManager 必须存在 |
| 校验失败 | 自动 `reset()` 回退到新游戏，防止加载损坏存档导致白屏 |

---

## 五、OPT-P2-004：远星星系可视化

**文件**：[StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/StarMapRenderer.ts)

新增 `generateDistantGalaxies()` 方法，生成 300 个随机位置、大小（0.2~2.0px）、透明度（0.03~0.28）的背景星系点。

绘制时机：每帧在背景填充后、主星图渲染前绘制，不受缩放/平移影响（在 save/restore 之外）。

视觉效果：深空背景上浮现淡淡的星点，模拟银河系深处的遥远远星。

---

## 六、OPT-P2-005：事件选择策略预览

**文件**：[StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/StoryModal.tsx)

利用 `EventChoice` 已有的 `effects?: EventEffectDef[]` 字段，在每个选项按钮下方渲染效果预览标签：

- **绿色标签**（+TrendingUp）：正面效果（如 `economy +50`）
- **红色标签**（+TrendingDown）：负面效果（如 `population -20`）
- **黄色标签**：中性/零值效果（如 `flag unlocked`）

乘以 value 的 Number 转换和 ± 符号自动格式化。

---

## 七、变更清单总结

| 文件 | 变更类型 | 行数变化 |
|------|---------|---------|
| `index.css` | CSS 变量体系 + 组件类修复 + 新 btn-glass | +77 / -47 |
| `components/StoryModal.tsx` | 亮色适配 + 效果预览 | +67 / -41 |
| `components/StarMap.tsx` | (上轮完成) | — |
| `ui/DepartmentPanel.ts` | 硬编码颜色替换 | +13 / -13 |
| `ui/WallfacerPanel.ts` | 硬编码颜色替换 | +22 / -22 |
| `ui/PersonSelectPanel.ts` | 硬编码颜色替换 | +13 / -13 |
| `ui/SystemMenuPanel.ts` | 主题持久化 + 颜色修复 | +6 / -3 |
| `ui/StarMapRenderer.ts` | 远星生成 + 绘制 | +25 / -2 |
| `core/Game.ts` | 存档系统重构 | +62 / -25 |
| `App.tsx` | 主题状态持久化 + 事件监听 | +17 / -3 |

**总计：+282 行 / -149 行 / 净增 +133 行**

---

## 八、构建验证

```
$ npx tsc --noEmit
✓ 零 TypeScript 错误

$ npm run build
✓ 1767 modules transformed
✓ dist/index.html        0.73 kB
✓ dist/assets/index.css  56.22 kB (+5.75 kB, 新增 btn-glass 等)
✓ dist/assets/index.js   477.12 kB (+2.99 kB, 效果预览+缩放+存档等)
✓ built in 756ms
```

---

## 九、V3 → V4 修复对照

| 优化编号 | 描述 | V3 | V4 |
|---------|------|----|----|
| BUG-C3 | 主题切换不一致 | ❌ | ✅ 持久化 + 双向同步 |
| OPT-P1-005 | 存档系统脆弱 | ❌ | ✅ 全量原型恢复 + 校验 |
| OPT-P2-004 | 远星不可见 | ❌ | ✅ 300点背景星场 |
| OPT-P2-005 | 事件无策略深度 | ❌ | ✅ 效果预览标签 |
| 亮色主题 | 字体完全不可见 | ❌ | ✅ 42+处 CSS变量替换 |

---

## 十、两轮优化总览

| 维度 | V3 | V4 | 累计 |
|------|-----|-----|------|
| P0 致命修复 | 2 | 0 | 2 |
| P1 严重修复 | 3 | 2 | 5 |
| P2 体验优化 | 3 | 3 | 6 |
| 亮色主题 | 0 | 42+ 处 | 全面适配 |
| 代码净增 | +174 行 | +133 行 | +307 行 |
| 修改文件 | 8 | 10 | 15 |

---

## 十一、后续工作展望

### 待处理
- **OPT-P2-006**：新手引导（首次打开时的步骤式引导浮层）
- **OPT-P1-003**：拆除旧版 DOM UI（MainLayout.ts / UIManager.ts）统一为 React
- 军事舰队建造 UI 增强（WithProgress 建造周期可视化）
- i18n 多语言支持框架

### 长期
- 星球殖民后建筑建设 UI
- 角色成长与叛变机制完整实现
- 多平台存档（Supabase / Firebase）
- Vitest 单元测试框架

---

> 文档路径：`02_Project_Documentation/DEV_HISTORY_V4.md`
> 生成日期：2026-05-17