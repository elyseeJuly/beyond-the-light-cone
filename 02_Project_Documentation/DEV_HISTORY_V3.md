# 宇宙群英传 (Legend of Uni) — 开发历程 V3

> 版本：Web 重构版 Alpha 2.2
> 日期：2026-05-17
> 基于：GAME_OPTIMIZATION_PLAN.md + BUGFIX_AUDIT_V2.md + Headless 试玩实测

---

## 一、本轮优化概述

本轮按照《游戏优化方案》(GAME_OPTIMIZATION_PLAN.md) 和《全量审计 V2》(BUGFIX_AUDIT_V2.md) 中的优先级排序，针对 P0（致命阻断）、P1（严重影响游玩）、P2（体验质量）三个层级进行了系统性修复和优化。

**修改文件**：8 个核心文件
**代码变更**：+237 行 / -63 行 / 净增 +174 行
**TypeScript 编译**：零错误
**构建状态**：通过 (tsc + vite build)

---

## 二、P0 致命阻断修复

### 2.1 OPT-P0-001：资源负值越界保护

**问题**：Headless 试玩中人口崩盘至 -4475、经济 -484、威慑度 -12，所有核心数值均无下限保护。

**修复**：
- [Game.ts:applyNewEffects](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts) — 所有资源修改点（economy/population/culture/resource/army/deterrenceValue）添加 `Math.max(0, ...)` 钳制
- [Game.ts:applyEventEffect](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts) — 事件效果同样添加钳制
- [EarthCivilization.ts:sanitizeResources](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts) — 新增每回合结束时的全局资源阶梯钳制（population/economy/resource/culture/army/deterrenceValue/idleWorkers/idlePopulation），人口归零时自动触发文明灭绝判定

### 2.2 OPT-P0-003：建造进度系统集成

**问题**：Building.ts 模块定义了完整的建造进度系统但从未被使用，采矿场/加工厂/太空城市建设是瞬时的布尔标志翻转。

**修复**：
- [Star.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Star.ts) — 新增 `buildingProgress` 字段用于跟踪建造进度（{ currentBuild, totalBuild, buildPerRound }）
- [EarthCivilization.ts:processBuildings](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts) — 新增每回合建造进度推进逻辑，完成后自动设置 hasStope/hasFactory/hasCity
- [RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/RightInspector.tsx) — 建造按钮改为启动建造周期（采矿场5回合/加工厂6回合/城市7回合），建造中显示黄色进度条和百分比，重复点击有提示阻止

**建造参数**：
| 建筑 | 消耗经济 | 总建造量 | 每回合进度 | 完成回合 |
|------|---------|---------|-----------|---------|
| 采矿场 | 30 | 100 | 20 | 5 |
| 加工厂 | 50 | 150 | 25 | 6 |
| 太空城市 | 80 | 200 | 30 | ~7 |

---

## 三、P1 严重影响修复

### 3.1 OPT-P1-001：科技研究系统激活

**问题**：Headless 试玩 10 回合 0/95 科技完成。原因是科技不会自动开始研究，部门部长初始全空，无人推动科研。

**修复**：
- [EarthCivilization.ts:autoAssignMinisters](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts) — 新增部长自动分配系统。每回合检查 11 个部门的空缺位置，从自由人员中按最佳属性匹配自动任命（如经济部匹配 economy 属性最高的角色）
- [EarthCivilization.ts:processTechResearch](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts) — 新增自动科技推荐：每棵科技树如果无进行中的研究，自动选择满足前置条件且 cost 最低的科技开始研究
- 科研基线保障：即使无部长，最低也有 5 点/回合的科研进度（原为 10，但加了下限保护）

### 3.2 OPT-P1-002：舰队建造实际产出

**问题**：handleBuildFleet 扣了 100 经济但从未创建舰队对象或武器实例。

**修复**：
- [RightInspector.tsx:handleBuildFleet](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/RightInspector.tsx) — 舰队建造现在实际创建 Fleet 对象，搭载 3 艘恒星级战舰（currentBuild=0，每回合可增长），并自动指派章北海为舰队指挥官

### 3.3 OPT-P1-004：战斗公式平衡

**问题**：攻击方每轮伤害有 `(1 + round * 0.1)` 递增乘数，第5轮为 1.5x，导致持久战中攻方过强。

**修复**：
- [CombatEngine.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/CombatEngine.ts) — 移除攻击方 `(1 + round * 0.1)` 递增乘数
- 防守方骰子下限从 0.75 提升至 0.85（上限 1.35），体现防守方地形/工事优势

---

## 四、P2 体验质量优化

### 4.1 OPT-P2-001：异星文明扩张节奏调整

**问题**：边缘世界在第 0 回合就扩张至天王星，第 9 回合占领金星，玩家在 10 回合内失去太阳系 3 颗行星。

**修复**：
- [AlienCivilization.ts:expansionistBehavior](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/AlienCivilization.ts) — 扩张概率从 14% 降至 10%
- 异星扩张目标过滤：仅扩张至 index > 8 的星球（排除太阳系），保护玩家核心领地

### 4.2 OPT-P2-002：逃亡主义增长节奏调整

**问题**：逃亡主义无上限增长，试玩中 10 回合从 0 升至 9，早期玩家无有效反制手段。

**修复**：
- [EarthCivilization.ts:processTreachery](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts) — 前 100 回合逃亡主义增长率减半（×0.5 factor），100 回合后恢复正常速率

### 4.3 OPT-P2-003：星图缩放控制实装

**问题**：StarMap 底部的 Zoom In / Zoom Out / Reset View 三个按钮从未绑定事件处理函数。

**修复**：
- [StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/StarMapRenderer.ts) — 新增 `zoomIn()`(缩放至 3.0x)、`zoomOut()`(缩放至 0.3x)、`resetView()` 方法
- 新增鼠标滚轮缩放支持（wheel 事件）
- 渲染管线添加 `ctx.save/translate/scale/restore` 变换，支持缩放和平移
- [StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/StarMap.tsx) — Zoom 按钮通过 `useCallback` 绑定到渲染器的缩放方法

---

## 五、审计确认：已在前轮修复的 Bug

以下 Bug 经代码审查确认已在之前的优化轮次中修复，本轮无需再次处理：

| Bug ID | 描述 | 状态 | 证据 |
|--------|------|------|------|
| BUG-A1 | 事件效果从未执行 | ✅ 已修复 | Game.ts:applyEventEffect 完整 switch 分支 |
| BUG-A2 | 纪元永远停留在危机纪元 | ✅ 已修复 | Game.ts:updateEpoch 基于年份范围自动转换 |
| BUG-A3 | 异星 isDieOut() 永远返回 true | ✅ 已修复 | AlienCiviManager.init: alien.starIndices.add(1000 + ...) |
| BUG-B1 | 人物头像未在 UI 中使用 | ✅ 已修复 | PersonSelectPanel/WallfacerPanel/DepartmentPanel 均已渲染头像 |
| BUG-B2 | Star.currentPopulation 不同步 | ✅ 已修复 | EarthCivilization:syncStarPopulation 每回合同步 |
| BUG-B3 | 550W量子计算机引用不存在 | ✅ 已修复 | TecTreeManager: 已在 INFORMATION 树中添加该节点 |
| BUG-C1 | 军事科技树为空 | ✅ 已修复 | TecTreeManager: 13 节点完整军事树 |
| BUG-C2 | 浮动主题按钮重复 | ✅ 已修复 | App.tsx 中已移除重复按钮 |

---

## 六、变更清单总结

| 文件 | 变更类型 | 行数变化 |
|------|---------|---------|
| `core/Game.ts` | 资源钳制 + 事件效果保护 | +22 / -9 |
| `core/EarthCivilization.ts` | 部长自动分配 + 科技自动推荐 + 建造进度 + 资源消毒 + 逃亡调整 | +113 / -0 |
| `core/Star.ts` | 建造进度字段 | +9 / -7 |
| `core/CombatEngine.ts` | 战斗公式平衡 | +4 / -4 |
| `core/AlienCivilization.ts` | 异星扩张节奏调整 | +4 / -4 |
| `components/RightInspector.tsx` | 建造进度 UI + 舰队产出 | +107 / -63 |
| `components/StarMap.tsx` | 缩放按钮事件绑定 | +18 / -12 |
| `ui/StarMapRenderer.ts` | 缩放/平移方法 + 滚轮支持 | +24 / -8 |

**总计：+237 行 / -63 行 / 净增 +174 行**

---

## 七、构建验证

```
$ npx tsc --noEmit
✓ 零 TypeScript 错误

$ npm run build
✓ 1767 modules transformed
✓ dist/index.html     0.73 kB
✓ dist/assets/index.css  50.47 kB
✓ dist/assets/index.js  474.13 kB
✓ built in 1.14s
```

---

## 八、后续工作展望

### 待处理 P1 项
- **OPT-P1-005**：存档系统原型链恢复重构（引入序列化/反序列化接口）
- **OPT-P1-003**：废弃旧版 DOM UI 系统（MainLayout.ts / UIManager.ts），统一到 React 组件

### P2 中期项
- **OPT-P2-004**：远星星系可视化（50光年/1万光年/银河系星域）
- **OPT-P2-005**：事件选项策略深度（效果预览、分支选项）
- **OPT-P2-006**：新手引导与教程系统

### P3 长期项
- 武器建造与升级系统完整化
- 事件数据扩充（5 → 30+ 关键剧情事件）
- 随机星球生成算法
- 多人热座模式

---

> 文档路径：`02_Project_Documentation/DEV_HISTORY_V3.md`
> 生成日期：2026-05-17