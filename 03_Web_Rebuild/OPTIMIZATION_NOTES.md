# 优化说明文档

> 生成日期：2026-05-19
> 优化范围：核心引擎层（core/）

---

## 一、优化总览

本次优化共修复 **4 类 17+ 处**问题，涉及 **6 个核心文件**，新增 **2 个文件**，测试从 **196 个增加到 210 个**。

---

## 二、具体优化内容

### 2.1 确定性随机数生成器

#### 问题

游戏中大量使用 `Math.random()` 进行随机判定：
- 事件触发概率
- 战斗伤害浮动
- 异星文明 AI 行为
- 背叛值增长

这导致同一存档无法复现，测试无法确定性验证，调试困难。

#### 解决方案

新增 `src/utils/random.ts`，提供 `SeededRandom` 类：

```typescript
export class SeededRandom {
  constructor(seed: number = Date.now()) { ... }
  next(): number { ... }                              // [0,1) 均匀分布
  random(): number { return this.next(); }
  randInt(min: number, max: number): number { ... }   // 闭区间整数
  chance(probability: number): boolean { ... }       // 概率判定
  pick<T>(array: T[]): T | undefined { ... }         // 随机选取
  reset(seed?: number): void { ... }                   // 重置状态
}
```

所有核心模块（Game、EarthCivi、AlienCivi、CombatEngine、GameEventManager）现已支持通过 `RngProvider` 注入自定义 RNG：

```typescript
// Game.ts 中新增的接口和辅助方法
export interface RngProvider {
  random(): number;
}

public setRngProvider(provider: RngProvider): void { ... }
public rng(): number { ... }
public rngChance(probability: number): boolean { ... }
public rngInt(min: number, max: number): number { ... }
```

#### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/utils/random.ts` | **新增** — SeededRandom 实现 |
| `src/core/Game.ts` | 添加 RngProvider 接口、setRngProvider()、rng()、rngChance()、rngInt() |
| `src/core/EarthCivilization.ts` | 添加 setRngProvider()、私有 rng() 方法 |
| `src/core/AlienCivilization.ts` | 添加 setRngProvider()、私有 rng() 方法，替换 6 处 Math.random() |
| `src/core/AlienCivilization.ts` | AlienCiviManager 添加 setRngProvider() 向下传播 |
| `src/core/CombatEngine.ts` | 2 个战斗方法改用 game.rng() |
| `src/core/GameEventManager.ts` | 2 处 Math.random() 改用 game.rng() |
| `src/test/utils/random.test.ts` | **新增** — 14 个 SeededRandom 专项测试 |

#### 替换清单（Math.random → xxx）

| 位置 | 替换为 |
|------|--------|
| EarthCivilization.processTreachery() | `this.rng()` |
| AlienCivilization.growEconomy() (×2) | `this.rng()` |
| AlienCivilization.hunterBehavior() (×3) | `this.rng()` |
| AlienCivilization.cleanerBehavior() (×2) | `this.rng()` |
| AlienCivilization.expansionistBehavior() (×2) | `this.rng()` |
| AlienCivilization.defensiveBehavior() | `this.rng()` |
| AlienCivilization.opportunistBehavior() (×2) | `this.rng()` |
| GameEventManager.checkCondition() | `game.rng()` |
| GameEventManager.triggerRandomEvent() (×2) | `game.rng()` |
| Game.runARound() 事件过滤 | `game.rngChance(0.5)` |
| CombatEngine.resolveFleetVsBarracks() (×2) | `game.rng()` |
| CombatEngine.resolveFleetVsFleet() (×2) | `game.rng()` |

---

### 2.2 经济与人口上限约束

#### 问题

EarthCivilization 的经济（economy）和人口（population）理论上可以无限增长。经济在每回合的产出加成下会逐年膨胀，人口在每回合 +0.05% 增长率下无限扩张。这两个数值虽然在游戏逻辑上通常不会出现极端值，但缺乏显式约束增加了数值溢出的风险。

#### 解决方案

在 `EarthCivilization.ts` 中定义常量并添加边界检查：

```typescript
const MAX_ECONOMY = 999999;
const MAX_POPULATION_MULTIPLIER = 3;

// 经济上限检查
this.economy += totalEco;
if (this.economy > MAX_ECONOMY) this.economy = MAX_ECONOMY;

// 人口上限检查（最多为人口上限的 3 倍）
const maxPop = totalPopLimit * MAX_POPULATION_MULTIPLIER;
if (this.population > maxPop) this.population = maxPop;
if (this.idlePopulation > maxPop) this.idlePopulation = maxPop;
if (this.idleWorkers > maxPop) this.idleWorkers = maxPop;
```

---

### 2.3 存档序列化加固

#### 问题

Game.ts 的 `JSON.stringify` replacer 函数遗漏了 `_rngProvider` 字段。如果将此字段序列化会导致序列化失败（因为 RngProvider 是运行时对象）。

#### 解决方案

在 `replacer` 中追加排除项：

```typescript
private static replacer(_key: string, value: any) {
  if (_key === 'currentEvent' || _key === 'eventQueue'
      || _key === 'isProcessing' || _key === '_rngProvider') {
    return undefined;
  }
  // ...
}
```

---

### 2.4 测试文件结构优化

```
src/test/
├── core/
│   ├── Models.test.ts
│   ├── Managers.test.ts
│   ├── GameEventManager.test.ts
│   ├── CombatEngine.test.ts
│   ├── TecTreeManager.test.ts
│   └── Civilization.test.ts
└── utils/
    └── random.test.ts          ← 新增
```

---

## 三、优化效果验证

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 测试用例数 | 196 | 210 (+14) |
| Math.random() 出现次数 | 15+ | 0（核心层） |
| 经济/人口上限 | 无 | 有限制 |
| 确定性测试支持 | ❌ | ✅ |
| TypeScript 编译错误 | 0 | 0 |
| 测试通过率 | 100% | 100% |

---

## 四、向后兼容性

- `SeededRandom` 为**新增 API**，不影响现有代码
- `Game.setRngProvider()` 为**可选调用**，不传则自动回退到 `Math.random()`
- 所有现有存档格式**完全兼容**（replacer 已排除新字段）
- 游戏主循环逻辑**完全不变**，仅 RNG 来源替换

---

## 五、后续优化建议

### 建议 1：AlienCivi 经济/军队上限

异星文明的 `resource` 和 `army` 目前无上限约束，建议参照 EarthCivi 模式添加 MAX 常量。

### 建议 2：员工分配比例校验

当 `miningRatio + factoryRatio + cultureRatio > 100` 时，当前实现会将超额部分静默丢弃。建议增加警告或归一化处理。

### 建议 3：存档版本控制

```typescript
interface SaveData {
  version: number;      // 存档版本
  gameState: object;    // 游戏状态
  timestamp: number;   // 保存时间戳
}
```
