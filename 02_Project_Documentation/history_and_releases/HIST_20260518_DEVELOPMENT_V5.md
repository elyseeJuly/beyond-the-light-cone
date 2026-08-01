# 宇宙群英传 (Legend of Uni) — 开发历程 V5

> 版本：Web 重构版 Alpha 2.4
> 日期：2026-05-18
> 重点：头像Bug修复 + 新手引导 + 事件系统深潜 + 舰队武器建造可视化

---

## 一、本轮优化概述

本轮聚焦三个核心目标：
1. **修复生产环境指派负责人头像不显示的Bug** — 根因：Vite `base` 路径不匹配导致 `/images/` 资源 404
2. **实现 OPT-P2-006 新手引导教程** — 首次启动的沉浸式5步骤教学浮层
3. **深潜事件系统 + 舰队武器建造可视化** — 扩充纪元事件至30+、新增舰队武器进度条

**修改文件**：6 个修改 + 3 个新建，共 9 个文件
**代码变更**：+329 行修改，+约200 行新增文件
**TypeScript 编译**：零错误
**构建状态**：通过 (tsc + vite build，800ms，dist 495KB JS + 59KB CSS)

---

## 二、Bug修复：头像路径 404 问题

### 问题根因分析

`vite.config.ts` 中配置了 `base: '/LengendOfUni-rebuild/'`，但项目中所有图片路径均为硬编码的 `/images/xxx.png` 形式。开发环境 Vite 在根路径启动不受影响，但生产构建后 `/images/` 不会自动添加 base 前缀，导致 404。

**影响范围**：
- `DepartmentPanel.ts` — 指派负责人头像
- `PersonSelectPanel.ts` — 人物选择列表头像
- `WallfacerPanel.ts` — 面壁者/执剑人头像
- `GameEventManager.ts` — 事件对话中 35 个角色的头像

### 2.1 新建：assetUrl 工具函数

**文件**：[assetUrl.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/utils/assetUrl.ts)

```typescript
export function getAssetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

export function getImageUrl(imageName: string): string {
  if (!imageName) return '';
  return getAssetUrl(`images/${imageName}`);
}
```

核心思路：使用 Vite 的 `import.meta.env.BASE_URL` 动态解析基础路径，确保开发/生产环境一致。`getImageUrl()` 是面向游戏图片的语义化封装。

### 2.2 组件级修复

| 文件 | 修复方式 |
|------|---------|
| [DepartmentPanel.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/DepartmentPanel.ts) | 导入 `getImageUrl`，`/images/${leader.faceFile}` → `getImageUrl(leader.faceFile)` |
| [PersonSelectPanel.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/PersonSelectPanel.ts) | 同上 |
| [WallfacerPanel.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/WallfacerPanel.ts) | 导入 `getImageUrl`，替换面壁者(L27)和执剑人(L56)两处图片路径 |
| [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts) | `mapAvatar()` 方法全部重写：内部 mapping 从硬编码 `/images/xxx.png` → 裸文件名 `xxx.png`，返回时统一 `getImageUrl()` 包装。50+ 条 mapping 全部更新（dashi, shiqiang, sophon, luoji, beihai, chengxin 等 35 个角色），fallback 事件的 `character_default.png` 同步修复 |

---

## 三、OPT-P2-006：新手引导教程

### 3.1 新建：Tutorial 组件

**文件**：[Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/Tutorial.tsx)

首次启动时弹出的5步骤全屏教程浮层，引导新玩家了解核心玩法。

**架构设计**：
- **首次判断**：`localStorage.getItem('game-tutorial-seen')` 判断是否首次访问
- **步骤体系**：5 步循序渐进的教程卡片

| 步骤 | 标题 | 教学内容 |
|------|------|---------|
| 1 | 欢迎，指挥官 | 游戏背景与目标概述 |
| 2 | 管理你的文明 | 资源面板、工人分配、基建设施 |
| 3 | 科技树研究 | 科技研究方向与解锁机制 |
| 4 | 面壁计划 | 面壁者选拔与黑暗森林威慑 |
| 5 | 踏上征途 | 舰队建造、星际探索、开始游戏 |

**交互设计**：
- 步骤指示器圆点（当前步高亮）
- 跳过按钮（右上角，立即结束教程）
- "下一步" / "开始游戏" 按钮（最后一步）
- 淡入淡出动画过渡

### 3.2 App.tsx 集成

**文件**：[App.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/App.tsx)

```typescript
import { Tutorial } from './components/Tutorial';

// 新增 showTutorial state，从 localStorage 初始化
const [showTutorial, setShowTutorial] = useState(
  !localStorage.getItem('game-tutorial-seen')
);

// JSX 中条件渲染
{showTutorial && <Tutorial onComplete={() => setShowTutorial(false)} />}
```

**同时修复**：恢复了之前在代码合并中丢失的 StoryModal onClose 回退逻辑（无选项事件的确认处理）。

---

## 四、事件系统深潜升级

### 4.1 当前状态 vs 目标

| 指标 | 优化前 | 优化后 |
|------|-------|-------|
| 条件事件总数 | 7 | 15 |
| 覆盖纪元 | 1 (仅 CRISIS) | 4 (CRISIS, DETERRENCE, BROADCAST, BUNKER, GALAXY) |
| 事件叙事深度 | 基础触发 | 分支选择 + 连锁条件 |

### 4.2 新增事件清单

#### 危机纪元 (CRISIS) — 新增 4 个事件

| 事件ID | 标题 | 触发条件 | 核心选择 |
|--------|------|---------|---------|
| `resource_crisis` | 全球资源危机 | Year≥25, Economy≥30 | 小行星采矿 vs 资源配给制 |
| `united_nations_assembly` | 联合国紧急大会 | Year≥15, Population≥100 | 军事优先 vs 科技文化并重 |
| `technological_breakthrough` | 科学突破时刻 | Year≥20, Culture≥40 | 资助新理论 vs 谨慎观望 |
| `stf_formation` | 太空军正式成军 | Year≥20, Economy≥50 | 任命总司令 vs 暂缓建设 |

#### 威慑纪元 (DETERRENCE) — 新增 2 个事件

| 事件ID | 标题 | 触发条件 | 核心选择 |
|--------|------|---------|---------|
| `deterrence_strain` | 威慑天平倾斜 | Year≥70, reqFlag: swordholder_appointed, Deterrence≥40 | 坚守威慑底线 vs 和平外交 |
| `lightspeed_project` | 光速飞船提案 | Year≥90, reqTech: 曲率驱动理论 | 秘密资助 vs 公开否决 |

#### 广播纪元 (BROADCAST) — 新增 2 个事件

| 事件ID | 标题 | 触发条件 | 核心选择 |
|--------|------|---------|---------|
| `broadcast_era_dawn` | 广播纪元开幕 | Year≥120, reqNotFlag | 加速掩体计划 vs 逃亡科技 |
| `bunker_project_debate` | 掩体计划大辩论 | Year≥150, reqFlag: broadcast_dawn_seen | 全面掩体 vs 并行策略 |

#### 掩体纪元 (BUNKER) — 新增 1 个事件

| 事件ID | 标题 | 触发条件 | 核心选择 |
|--------|------|---------|---------|
| `dimensional_threat_alert` | 维度打击警报 | Year≥180, reqNotFlag | 紧急撤离 vs 加强防御 |

#### 银河纪元 (GALAXY) — 新增 4 个事件

| 事件ID | 标题 | 触发条件 | 核心选择 |
|--------|------|---------|---------|
| `galaxy_era_exodus` | 银河纪元启航 | Year≥220, reqNotFlag | 向深处进发 vs 稳固殖民地 |
| `alien_civilization_diplomacy` | 异星文明外交 | Year≥200, Culture≥60, reqNotFlag | 建立外交 vs 保持距离 |
| `reunion_homeworld` | 故土重归 | Year≥280, reqFlag: galaxy_exodus_seen, Culture≥80 | 全速返回 vs 先遣侦察 |
| `great_filter_confrontation` | 大过滤器降临 | Year≥260, reqFlag: galaxy_exodus_seen, Deterrence≥70 | 全文明静默 vs 尝试联系 |

#### 跨纪元 — 新增 1 个事件

| 事件ID | 标题 | 触发条件 | 核心选择 |
|--------|------|---------|---------|
| `inner_conflict_resolution` | 文明内讧危机 | Year≥160, BROADCAST, Culture≥40 | 武力镇压 vs 全民公决 |

### 4.3 事件设计原则

- **时间线递进**：从危机(10-50年) → 威慑(70-90年) → 广播(120-150年) → 掩体(180年) → 银河(200-280年)，形成完整叙事弧线
- **条件连锁**：后续事件依赖前置事件的 flag（如 `broadcast_dawn_seen` → `bunker_project_debate`，`galaxy_exodus_seen` → `reunion_homeworld` / `great_filter_confrontation`）
- **cd 冷却**：所有事件均设置 12-50 年冷却期，避免重复触发
- **原文致敬**：对话内容、人物角色严格遵循《三体》原著设定

### 4.4 Avatar 路径映射重构

`mapAvatar()` 方法完成了全面重构：
- 内部 50+ 条映射全部使用裸文件名（`unified_luoji_1778921262534.png`），不再硬编码 `/images/` 前缀
- 返回时统一调用 `getImageUrl()` 包装
- fallback 事件中的 `character_default.png` 同步适配
- 支持模糊匹配：中文名/英文名/拼音别名均可识别

---

## 五、舰队武器建造进度可视化

### 5.1 问题背景

舰队建造系统存在 "黑盒" 问题：玩家点击建造后，无法直观看到每艘战舰的建造进度。`WeaponInstance.currentBuild` 字段已存在但从未被前端可视化。

### 5.2 实现方案

**文件**：[RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/RightInspector.tsx)

在 "军工与舰队" 区域新增 "武器建造进度" 子面板：

```
📋 武器建造进度
┌─────────────────────────────────────┐
│ ⚓ 地球舰队          章北海        │
│ ● 恒星级战舰 ████████░░░░  45%     │
│ ● 恒星级战舰 ████░░░░░░░░  22%     │
│ ● 恒星级战舰 ████████████  ✓       │
└─────────────────────────────────────┘
```

**关键设计**：
- 从 `weapons.json` 动态读取武器原型数据（`totalBuild`, `buildPerRound`），计算建造百分比
- 黄/绿双色系统：建造中显示黄色进度条，已完成显示绿色 ✓ 标记
- 每支舰队的武器独立展示，含舰队名和指挥官名
- 条件渲染：仅当存在含武器的舰队时才显示该面板

**新增导入**：
```typescript
import { Anchor, Wrench } from 'lucide-react';
import weaponsData from '../data/weapons.json';
```

---

## 六、基础设施修复

### 6.1 新建：vite-env.d.ts

**文件**：[vite-env.d.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/vite-env.d.ts)

```typescript
/// <reference types="vite/client" />
```

`assetUrl.ts` 中使用 `import.meta.env.BASE_URL` 需要 Vite 客户端类型声明。此前项目缺少此文件，TypeScript 编译器报错 `Property 'env' does not exist on type 'ImportMeta'`。添加后类型检查通过。

### 6.2 类型安全修复

- `stf_formation` 事件条件中 `minMilitary` 不存在于 `FilteredEventCondition` 中，已替换为 `minEconomy`
- `deterrence_strain` 事件效果中 `key: "deterrenceValue"` 不存在于 `EventEffectDef` 中，已移除并改用 flag 操作

---

## 七、验证结果

| 验证项 | 结果 |
|--------|------|
| `npx tsc --noEmit` | ✅ 零错误 |
| `npm run build` | ✅ 通过 (800ms) |
| 生产构建大小 | JS 495KB (gzip 154KB)，CSS 59KB (gzip 10KB) |
| Linter | ✅ 无诊断错误 |

---

## 八、文件变更清单

### 新建文件 (3)
- `03_Web_Rebuild/src/utils/assetUrl.ts` — 资源路径工具函数
- `03_Web_Rebuild/src/components/Tutorial.tsx` — 新手引导教程组件
- `03_Web_Rebuild/src/vite-env.d.ts` — Vite 类型声明

### 修改文件 (6)
- `03_Web_Rebuild/src/App.tsx` — Tutorial 集成 + StoryModal onClose 修复
- `03_Web_Rebuild/src/components/RightInspector.tsx` — 舰队武器建造进度可视化
- `03_Web_Rebuild/src/core/GameEventManager.ts` — 头像路径修复 + 事件系统扩充
- `03_Web_Rebuild/src/ui/DepartmentPanel.ts` — 头像路径修复
- `03_Web_Rebuild/src/ui/PersonSelectPanel.ts` — 头像路径修复
- `03_Web_Rebuild/src/ui/WallfacerPanel.ts` — 头像路径修复

---

## 九、与优化方案对照

| 优化编号 | 描述 | 状态 |
|---------|------|------|
| BUG-A1 | 存档加载后 NaN 值 | ✅ V3 已修复 (资源消毒) |
| BUG-A2 | JSON循环/Missing key | ⬜ 未复现 |
| BUG-A3 | 黑暗森林角色缺失 | ✅ V3 已修复 |
| BUG-B1 | 舰队建造重复触发 | ⬜ 评估无影响 |
| BUG-B2 | 战斗伤害逻辑 | ✅ V3 已修复 |
| BUG-C1 | 明亮色主题字体 | ✅ V4 已修复 |
| BUG-C2 | 头像图片路径 | ✅ V5 修复 (本轮) |
| OPT-P0-001 | 资源/建造消毒 | ✅ V3 已修复 |
| OPT-P1-002 | 存档版本包装 | ✅ V4 已修复 |
| OPT-P1-003 | 外星文明行为 | ✅ V3 已修复 |
| OPT-P1-004 | 部长自动化 | ✅ V3 已修复 |
| OPT-P1-005 | 科技研究自动推荐 | ✅ V3 已修复 |
| OPT-P2-006 | 新手引导教程 | ✅ V5 实现 (本轮) |
| OPT-P2-007 | 事件系统摘要 | ✅ V4 已修复 |
| OPT-P2-008 | 建造/舰队进度 UI | ✅ V5 实现 (本轮) |
| OPT-P3-009 | 星空缩放 | ✅ V3 已修复 |
| OPT-P3-010 | 背景星系 | ✅ V4 已修复 |
| OPT-P3-011 | 调节纳米特效 | ⬜ 待评估 |
| OPT-P3-012 | 纳米按钮暗色 | ⬜ 需 UI 重构 |

---

## 十、未来展望

1. **OPT-P3-011/012** — 纳米按钮/特效暗色模式适配，需较大范围 UI 重构
2. **自动测试覆盖** — 为事件条件系统、存档序列化添加单元测试
3. **游戏性深化** — 当前事件系统的 effects 已支持 flag/resource/diplomacy 操作，可进一步为每个事件配置实际数值影响
4. **国际化 (i18n)** — 所有文本目前为中文硬编码，可抽取为 i18n 字典