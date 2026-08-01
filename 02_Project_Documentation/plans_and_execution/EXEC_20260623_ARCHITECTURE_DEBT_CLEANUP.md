# TASK-ARCH: 架构债务清理

> **优先级**: P1（长期维护）  
> **依赖**: 建议在 TASK-P0 完成后进行，TASK-AP 和 TASK-EVENT 可并行  
> **来源**: [AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md) 第九节  
> **预估影响范围**: 15+ 文件，约 2000 行变更  
> **AI 接手指引**: 本任务分为 4 个子任务，每个子任务可独立执行，**强烈建议按顺序进行**。最危险的是子任务 1（Game.ts 拆分），如操作不当会导致大量回归。

---

## 概述

当前项目存在三大架构债务：

1. **Game.ts 上帝类**（1599 行）：承担纪元推进 / 胜利检查 / flag 管理 / 历史记录 / 存档序列化多职责
2. **UI 双轨制**：`src/ui/*.ts`（7 文件 1672 行）遗留层 + `src/components/*.tsx`（37 文件）React 层，通过 `#modal-container` 桥接
3. **Flag 系统失控**：23 个死 Flag + 17 处命名不一致 + 15 对别名映射

---

## 子任务 1：Game.ts 上帝类拆分（高风险）

### 目标

将 Game.ts 从 1599 行拆分为 4 个独立模块，每个模块 ≤ 400 行。

### 1.1 拆出 `FlagManager`

**新文件**: `src/core/FlagManager.ts`

迁移内容：
- `flags: Set<string>` 字段
- `addFlag()` / `hasFlag()` / `removeFlag()` 方法
- `FLAG_ALIAS_MAP` 映射（从 GameEventManager 移入）
- 所有 flag 相关逻辑

接口：
```typescript
export class FlagManager {
  private flags: Set<string> = new Set();
  
  add(flag: string): void;
  has(flag: string): boolean;
  remove(flag: string): void;
  getAll(): Set<string>;
  resolveAlias(flag: string): string; // 别名解析
  clear(): void;
}
```

在 Game.ts 中：
```typescript
public flagManager: FlagManager = new FlagManager();
// 向后兼容：保留快捷方法，内部委托给 flagManager
public addFlag(flag: string): void { this.flagManager.add(flag); }
public hasFlag(flag: string): boolean { return this.flagManager.has(flag); }
```

**注意**：先保留快捷方法避免全项目改动，后续可逐步迁移调用方。

### 1.2 拆出 `VictoryChecker`

**新文件**: `src/core/VictoryChecker.ts`

迁移内容：
- `checkVictoryConditions()` 完整逻辑
- `checkGameOverConditions()` 完整逻辑
- `getEndingForecast()` 方法
- `victoryType` / `defeatType` / `neutralType` 字段
- `isGameOver` / `gameOverReason` 字段

接口：
```typescript
export class VictoryChecker {
  private game: Game;
  
  constructor(game: Game);
  checkVictoryConditions(): void;
  checkGameOverConditions(): void;
  getEndingForecast(): Array<{ name: string; progress: number; isThreat: boolean }>;
}
```

在 Game.ts 中：
```typescript
public victoryChecker: VictoryChecker = new VictoryChecker(this);
// 向后兼容
public checkVictoryConditions(): void { this.victoryChecker.checkVictoryConditions(); }
```

### 1.3 拆出 `TurnManager`

**新文件**: `src/core/TurnManager.ts`

迁移内容：
- `year` / `_yearJustAdvanced` 字段
- `epoch` 字段 + `updateEpoch()` 方法
- `deterrenceEnduranceRounds` / `dimensionStrikeTriggered` / `broadcastTriggered` 等回合相关字段
- `runARound()` 的回合计时部分
- `turnHistory` 字段

接口：
```typescript
export class TurnManager {
  year: number;
  epoch: EpochType;
  _yearJustAdvanced: boolean;
  
  advanceYear(): void;
  updateEpoch(culture: number, flagManager: FlagManager): void;
  getTurnHistory(): string[];
}
```

### 1.4 拆出 `HistoryManager`

**新文件**: `src/core/HistoryManager.ts`

迁移内容：
- `historyLogs: string[]` 字段
- `playerTimeline: Array<{ year: number; event: string }>` 字段
- `tickerMessages: string[]` 字段
- `addHistory()` 方法

接口：
```typescript
export class HistoryManager {
  addHistory(log: string, year?: number, epoch?: EpochType): void;
  getRecentLogs(count: number): string[];
  getTimeline(): Array<{ year: number; event: string }>;
  pushTicker(msg: string): void;
}
```

### 拆分后的 Game.ts 结构

```typescript
export class Game {
  // 核心子系统（不再直接持有大量字段）
  public flagManager: FlagManager;
  public historyManager: HistoryManager;
  public turnManager: TurnManager;
  public victoryChecker: VictoryChecker;
  
  // 现有子系统（不变）
  public starManager: StarManager;
  public earthCivi: EarthCivilization;
  public eventManager: GameEventManager;
  // ... 其他子系统
  
  // 向后兼容快捷方法
  public addFlag(f: string) { this.flagManager.add(f); }
  public hasFlag(f: string) { return this.flagManager.has(f); }
  public addHistory(l: string) { this.historyManager.addHistory(l); }
  // ...
}
```

**目标**：拆分后 Game.ts ≤ 600 行，新文件每个 ≤ 400 行。

### 验证

- 拆分后 `npx vitest run` 全部通过，零回归
- TypeScript 编译零错误
- 每个新文件有对应的单元测试

---

## 子任务 2：UI 双轨制统一

### 目标

删除 `src/ui/*.ts` 遗留层，全部迁移到 React 组件。

### 2.1 排查遗留 UI 使用情况

首先确认哪些遗留 UI 文件仍被使用：

```bash
grep -rn "from.*src/ui/" src/ --include="*.ts" --include="*.tsx"
```

### 2.2 逐文件迁移

| 遗留文件 | 对应 React 组件 | 迁移策略 |
|---------|----------------|---------|
| `DepartmentPanel.ts` | `components/DepartmentPanel.tsx` | 确认 React 版功能完整，删除遗留版 |
| `MainLayout.ts` | `App.tsx` 布局 | 移除 `#modal-container` 桥接 |
| `PersonSelectPanel.ts` | `components/PersonSelectPanel.tsx` | 同上 |
| `StarMapRenderer.ts` | `components/StarMap.tsx` | 同上 |
| `TecTreeView.ts` | `components/TecTreeView.tsx` | 同上 |
| `UIManager.ts` | 各组件分散管理 | 删除，事件系统已取代 |
| `WallfacerPanel.ts` | `components/WallfacerPanel.tsx` | 同上 |

### 2.3 移除 `#modal-container` 桥接

在 `App.tsx` 中，找到 `<div id="modal-container" />` 及其相关代码，确认所有弹窗已通过 React Portal 渲染后，删除桥接。

### 验证

- 删除后 `npx vitest run` 全部通过
- 手动测试：所有 UI 功能正常（部门面板、人员选择、星图、科技树、面壁者面板）
- `grep -rn "src/ui/" src/` 返回零结果（或仅剩 import 注释）

---

## 子任务 3：Flag 系统重建

### 目标

清理 23 个死 Flag，统一 17 处命名不一致，删除 15 对别名映射，改为强类型 Flag 枚举。

### 3.1 建立 Flag 枚举

**新文件**: `src/types/GameFlags.ts`

```typescript
export enum GameFlag {
  // 主线事件
  RED_SHORE_BASE_ESTABLISHED = 'red_shore_base_established',
  SIGNAL_SENT_TO_TRISOLARIS = 'signal_sent_to_trisolaris',
  TRISOLARIS_REPLY_RECEIVED = 'trisolaris_reply_received',
  // ... 所有实际使用的 flag
  
  // 结局相关
  WANDERING_COMPLETED = 'wandering_completed',
  DIGITAL_ARK_UPGRADE = 'digital_ark_upgrade',
  DARK_DOMAIN_DECISION = 'dark_domain_decision',
  CONQUEST_DECLARED = 'conquest_declared',
  // ...
}
```

### 3.2 修改 FlagManager 使用枚举

```typescript
export class FlagManager {
  add(flag: GameFlag): void;
  has(flag: GameFlag): boolean;
  remove(flag: GameFlag): void;
}
```

### 3.3 全局替换字符串 flag 为枚举

```bash
# 示例
game.addFlag("wandering_completed") → game.addFlag(GameFlag.WANDERING_COMPLETED)
game.hasFlag("dark_domain_decision") → game.hasFlag(GameFlag.DARK_DOMAIN_DECISION)
```

### 3.4 删除别名映射

在 `FLAG_ALIAS_MAP` 中，将别名全部替换为规范名称，然后删除映射表。

### 3.5 清理死 Flag

- 搜索全项目，找到所有 `addFlag("xxx")` 调用
- 找到所有 `hasFlag("xxx")` 调用
- 标记"只被 add 但从未被 has"的 flag 为死 flag
- 删除死 flag 的 addFlag 调用

### 验证

- `npx vitest run` 全部通过，零回归
- `grep -rn "addFlag\|hasFlag" src/` 确认所有调用使用枚举
- Flag 数量从当前 ~80 个减少到 ~50 个有效 flag

---

## 子任务 4：精简测试套件

### 目标

从 833 个测试精简到 400-500 个有意义的测试，补充结局可达性测试。

### 4.1 识别冗余测试

- 使用 `vitest --coverage` 识别被多次测试覆盖的相同代码路径
- 合并重复的边界测试
- 删除测试值为常量的测试（如 `expect(1+1).toBe(2)` 类型的占位测试）

### 4.2 补充缺失测试

- 结局可达性测试（见 TASK-P0 任务 5）
- 快照完整性测试
- 存档损坏恢复测试
- Flag 别名解析测试

### 验证

- 精简后 `npx vitest run` 全部通过
- 语句覆盖率不低于 75%
- 分支覆盖率不低于 65%

---

## 完成标准

- [ ] Game.ts ≤ 600 行，4 个新模块各 ≤ 400 行
- [ ] `src/ui/*.ts` 目录已删除或清空
- [ ] `#modal-container` 桥接已移除
- [ ] `GameFlag` 枚举已建立，所有 flag 调用使用枚举
- [ ] `FLAG_ALIAS_MAP` 已删除
- [ ] 死 flag 已清理
- [ ] 测试精简至 400-500 个，覆盖率不低于 75%/65%
- [ ] `npx vitest run` 全部通过，零回归
- [ ] TypeScript 编译零错误

---

*本任务书基于 [AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md) 第九节编写。*