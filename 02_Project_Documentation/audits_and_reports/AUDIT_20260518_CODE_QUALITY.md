# 宇宙群英传 全系统代码审计报告

> **审计日期**: 2026-05-18  
> **审计范围**: `03_Web_Rebuild/src/` 全部模块（19 core + 8 components + 8 ui + 2 types + 1 utils + 6 data）  
> **技术栈**: React 19 + TypeScript 5 + Vite 8 + TailwindCSS 4 + Framer Motion  
> **原则**: 仅提供代码规范级修复方案，不直接修改源码

---

## 一、项目文件结构审计

### 1.1 模块统计

| 目录 | 文件数 | 总行数 | 说明 |
|------|--------|--------|------|
| `src/core/` | 19 | ~2800 | 游戏核心引擎 |
| `src/components/` | 8 | ~570 | React UI 组件 |
| `src/ui/` | 8 | ~470 | 遗留 vanilla TS UI |
| `src/types/` | 2 | ~175 | 类型定义 |
| `src/utils/` | 1 | 8 | 工具函数 |
| `src/data/` | 6 | ~200KB | JSON 数据文件 |
| `scripts/` | 1 | 296 | Headless 分析脚本 |

### 1.2 死代码审计

| 文件 | 状态 | 说明 |
|------|------|------|
| `ui/MainLayout.ts` | 🔴 死代码 | 从未被任何文件 import |
| `ui/UIManager.ts` | 🔴 死代码 | 从未被任何文件 import |
| `core/Building.ts` | 🟡 未集成 | 定义了完整建造系统但从未被调用 |
| `core/Weapon.ts` 中 `isWeaponFinished`/`runWeaponRound` | 🟡 未调用 | 武器建造流程未接入核心循环 |
| `core/Department.ts` 中 `calculateDepartmentEfficiency` | 🟡 未调用 | 部门效率计算从未使用 |
| `types/enums.ts` 中 `DiplomacyState` | 🟡 未使用 | 枚举定义但无引用 |

---

## 二、代码规范问题清单

### 2.1 类型安全问题

| ID | 文件 | 行号 | 问题 | 修复方案 |
|----|------|------|------|----------|
| TS-01 | `EarthCivilization.ts` | L95,118,136,185,220,269,288,298,364,404,413,420 | 所有 `game: any` 参数应为 `Game` 类型 | 将 `(game: any)` 改为 `(game: Game)`，添加 import |
| TS-02 | `AlienCivilization.ts` | L42,64,74,92,106,119,126,138,147 | 同上，`game: any` | 同上 |
| TS-03 | `Game.ts` | L346 | `applyNewEffects(effects: any[])` | 定义 `EffectPayload` 接口替代 `any[]` |
| TS-04 | `GameEventManager.ts` | L437 | `checkFilterConditions(cond: any)` | 使用 `FilteredEventCondition` 类型 |
| TS-05 | `GameEventManager.ts` | L473 | `parseEventData(dataList: any)` | 定义 `RawEventData` 接口 |
| TS-06 | `GameEvent.ts` | L6 | `effects?: any[]` | 应使用 `EventEffectDef[]` |
| TS-07 | `PersonManager.ts` | L13 | `(data: any)` | 定义 `RawPersonData` 接口 |

### 2.2 架构设计问题

| ID | 问题 | 位置 | 修复方案 |
|----|------|------|----------|
| ARCH-01 | **循环依赖**: `EarthCivilization` 通过 `GameInstance.get()` 访问全局单例，形成 `Game ↔ EarthCivilization` 循环 | `EarthCivilization.ts:57` | 改为构造注入：`runARound(game: Game)` 参数传入 |
| ARCH-02 | **全局单例滥用**: `CombatEngine` 静态方法内部访问 `GameInstance.get()` 用于日志 | `CombatEngine.ts:8` | 将 `game` 作为参数传入，或注入日志回调 |
| ARCH-03 | **UI 双轨并存**: React 组件与 vanilla TS UI 同时存在 | `src/components/` vs `src/ui/` | 统一到 React 体系，遗留面板改用 React Portal |
| ARCH-04 | **序列化脆弱**: 存档恢复依赖手动 `setPrototypeOf` | `Game.ts:506-553` | 实现 `serialize()`/`deserialize()` 模式 |
| ARCH-05 | **Game.filteredEvents 冗余**: `Game` 类中有 `filteredEvents` 字段，但实际使用的是 `eventManager.filteredEvents` | `Game.ts:35` | 删除 `Game.filteredEvents` |

### 2.3 逻辑缺陷清单

| ID | 严重度 | 文件 | 问题描述 | 修复方案 |
|----|--------|------|----------|----------|
| BUG-01 | 🔴 P0 | `EarthCivilization.ts:177-183` | **工人分配分母硬编码90**: `allocateWorkers()` 用 `total * ratio / 90`，但三个 ratio 默认各30 总和=90。若用户调整 ratio 总和≠90，分配失真 | 改为 `total * ratio / (miningRatio + factoryRatio + cultureRatio)` |
| BUG-02 | 🔴 P0 | `Game.ts:315` | **ADDTREACHERY 语义反转**: `EventEffect.ADDTREACHERY` 实际执行 `treachery - 15`（减少而非增加） | 命名改为 `REDUCE_TREACHERY`，或修正逻辑为 `+15` |
| BUG-03 | 🔴 P0 | `Game.ts:353` | **military 效果创建舰队但无武器**: `applyNewEffects` 中 military 分支创建空舰队（无 weapons），战斗力为 0 | 创建舰队时应附带默认武器实例 |
| BUG-04 | 🟠 P1 | `EarthCivilization.ts:269-286` | **processCulture 返回值被丢弃**: 方法返回 `cultureGain` 但调用处 `this.processCulture(game)` 未使用返回值，实际文化增长仅来自 `processCultureDept` | 修改为 `this.culture += this.processCulture(game)` |
| BUG-05 | 🟠 P1 | `EarthCivilization.ts:69-70` | **文化双重计算**: `oldCulture` 在 `processCulture` 之后取值，但 `processCulture` 的返回值被丢弃，随后 `processCultureDept` 又加文化。逻辑混乱 | 统一文化产出到一个方法 |
| BUG-06 | 🟠 P1 | `AlienCivilization.ts:109` | **扩张型AI无距离检查**: `expansionistBehavior` 过滤 `index > 8` 的星球，但太阳系内行星(0-8)也可能无归属被占 | 应增加距离/区域过滤 |
| BUG-07 | 🟠 P1 | `Game.ts:291` | **太阳氦闪条件宽松**: `year > 400 && epoch < GALAXY` 但纪元是按固定年份切换的，year=331 自动进入 GALAXY，所以 year>400 时 epoch 必定≥GALAXY，此条件永远不触发 | 调整为 `year > 400` 时检查是否有流浪/光速能力 |
| BUG-08 | 🟠 P1 | `TecTree.ts:58-59` | **rootNodeName 被覆盖**: 每次 `addNode` 且 parent 为空时覆盖 `rootNodeName`，但物理树有多个根节点（天文观测、粒子对撞、维度物理），只记录最后一个 | 改为 `rootNodeNames: string[]` 数组 |
| BUG-09 | 🟡 P2 | `GameEventManager.ts:445-447` | **纪元别名映射不完整**: `WANDERING`/`SHELTER` 可匹配多个纪元但条件逻辑复杂易误 | 改用显式映射表 |
| BUG-10 | 🟡 P2 | `Game.ts:516` | **存档加载后重调 init()**: `eventManager.init()` 会覆盖已序列化的 `filteredEvents` 和 `triggeredFilteredIds` | 存档加载后应调用 `restoreState()` 而非 `init()` |
| BUG-11 | 🟡 P2 | `assetUrl.ts:2` | **Headless 不兼容**: `import.meta.env.BASE_URL` 在 Node.js 环境报错，导致自动化测试脚本无法运行 | 添加 fallback: `import.meta.env?.BASE_URL ?? '/'` |
| BUG-12 | 🟡 P2 | `Civilization.ts:31-33` | **isDieOut 语义不准确**: 检查 `starIndices.size === 0` 判断文明灭亡，但文明可能人口为0但仍占有星球 | 应同时检查 `population <= 0` |

### 2.4 Headless 测试脚本审计

运行 `npx tsx scripts/gameplay-analyzer.ts` 结果:
```
TypeError: Cannot read properties of undefined (reading 'BASE_URL')
    at getAssetUrl (src/utils/assetUrl.ts:2:29)
```

**根因**: `GameEventManager` 的 `mapAvatar` 调用 `getImageUrl`，后者依赖 Vite 的 `import.meta.env.BASE_URL`，在 Node.js 环境不存在。

**修复方案**: 在 `assetUrl.ts` 中添加环境兼容:
```typescript
export function getAssetUrl(path: string): string {
  const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL 
    ? import.meta.env.BASE_URL 
    : '/';
  return `${base}${path.replace(/^\//, '')}`;
}
```

---

## 三、TypeScript 编译状态

```
$ npx tsc --noEmit
(零错误，零警告)
```

TypeScript 编译通过，但这主要因为大量 `any` 类型绕过了类型检查。`tsconfig.json` 虽启用 `strict: true`，但核心逻辑中 `any` 的使用削弱了类型安全的保障。

---

## 四、代码质量评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 类型安全 | 5/10 | 大量 `any` 参数，核心方法缺乏类型约束 |
| 架构清晰度 | 4/10 | 循环依赖、全局单例、UI 双轨并存 |
| 可测试性 | 3/10 | 无测试框架、核心逻辑耦合 window/localStorage |
| 数据完整性 | 6/10 | 资源钳制已有但不完整，部分边界未处理 |
| 代码复用 | 6/10 | 基类继承合理，但工厂函数分散 |
| 文档/注释 | 5/10 | 中文注释较好，但方法级 JSDoc 缺失 |

---

## 五、修复优先级路线图

### 立即修复（P0）
1. BUG-01: 工人分配分母修正
2. BUG-02: ADDTREACHERY 语义修正
3. BUG-03: 军事效果创建的舰队需附带武器
4. BUG-11: assetUrl 环境兼容性

### 短期修复（P1）
5. BUG-04/05: 文化产出逻辑统一
6. BUG-06: 扩张型AI距离检查
7. BUG-07: 太阳氦闪条件修正
8. TS-01~07: 消除所有 `any` 类型

### 中期重构（P2）
9. ARCH-01: 消除循环依赖
10. ARCH-03: UI 体系统一
11. ARCH-04: 序列化系统重构
12. 引入 Vitest 测试框架

---

> 文档生成日期: 2026-05-18
> 基于全量源码审计 + TypeScript 编译验证 + Headless 测试执行
