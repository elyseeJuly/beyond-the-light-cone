# 场景化集成测试体系搭建方案

> **文档日期**: 2026-06-24
> **文档定位**: 测试架构改进方案，从"测函数"转向"测玩家路径"
> **背景**: 833 测试 100% 通过却隐藏 12 个 bug，根因是测试测的是"代码能否运行"而非"玩家能否正常游玩"

---

## 一、问题诊断：为什么现有测试无法发现 bug

### 1.1 现状数据

| 维度 | 现状 | 问题 |
|------|------|------|
| 测试数量 | 833 个，100% 通过 | 数量繁荣，质量存疑 |
| 测试数漂移 | 196 → 267 → 478 → 514 → 810 → 825 → 833（4.3 倍增长） | 为覆盖率而写，不为场景而写 |
| 新功能分支覆盖 | EventSystem 53.06% / EarthCiv 56.35% | 数字低于阈值但 CI 仍通过 |
| E2E 状态 | 4 个 Playwright spec 从未在 CI 执行 | 本地因 baseURL 不匹配无法验证 |

### 1.2 三个结构性问题

#### 问题 1：setup.ts mock 掉了被测路径

[setup.ts:8](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/setup.ts#L8)：
```typescript
dispatchEvent: () => true,  // 屏蔽了"代码→UI"的整条链路
```

Bug 3（人物解锁不 dispatch 刷新事件）无法被测试发现，因为 dispatch 本身被 mock 成空操作。测试只验证"人物是否解锁成功"，从不验证"是否 dispatch 了 UI 刷新事件"。

#### 问题 2：Autoplay500 helper 绕过了 bug

[Autoplay500.test.ts:20-34](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e/Autoplay500.test.ts#L20-L34)：
```typescript
function processAllEvents(game: Game): void {
  while ((game.currentEvent || game.eventQueue.length > 0) && safety > 0) {
    if (game.currentEvent) {
      game.currentEvent.choices[0].action();  // 自动选第一个
    } else if (game.eventQueue.length > 0) {
      game.processNextEvent();
    }
  }
}
```

测试主动帮 AI 托管处理了事件，但真实游戏中 AI 托管不处理事件。**测试的行为与真实游戏不一致**，所以死锁在测试中永远不发生。

#### 问题 3：只测正向路径，不测状态清理

| Bug | 测试只验证 | 测试没验证 |
|-----|----------|----------|
| Bug 4 (star.status) | "状态被设置" | "叛乱结算后状态是否清除" |
| Bug 3 (人物刷新) | "人物是否解锁" | "UI 是否收到刷新信号" |
| Bug 1 (纪元死锁) | "年份能否推进"（手动处理事件后） | "AI 托管不处理事件时能否推进" |

### 1.3 本质问题

**测试测的是"代码能否运行"，不是"玩家能否正常游玩"。**

833 个测试回答的是"这个函数被调用后返回值对吗"，而不是"玩家加载旧存档→点下一回合→触发事件→AI托管不处理→死锁"这种**跨函数跨系统的真实场景**。

---

## 二、核心思想转变

### 2.1 两种测试范式对比

| 维度 | 单元测试（现状） | 场景化集成测试（目标） |
|------|----------------|---------------------|
| 验证对象 | 函数返回值 | 跨系统副作用链 |
| Mock 策略 | mock 掉一切外部依赖 | 只 mock 边界，保留内部真实链路 |
| 失败含义 | 某个函数错了 | 某条玩家路径断了 |
| 设计起点 | 代码结构（有哪些函数） | 玩家行为（有哪些路径） |
| 断言目标 | 返回值正确 | 副作用链完整（状态/事件/UI） |
| 数量预期 | 数百个 | 20-30 个核心场景 |

### 2.2 设计原则

1. **从玩家路径设计，不从代码结构设计**——测试"玩家会遇到什么"，不是"有哪些函数"
2. **只 mock 边界，不 mock 内部**——dispatchEvent、状态机、事件链必须真实运行
3. **helper 驱动场景，不绕过场景**——`clickNextTurn()` 只调 `runARound()`，不替玩家做决定
4. **断言副作用链，不只断言返回值**——年份是否推进、UI 事件是否派发、状态是否清理
5. **先红后绿**——场景测试在 bug 修复前应该是失败的，修复后才通过

---

## 三、分层架构

### 3.1 测试目录结构

```
src/test/
├── unit/                    # 单元测试：纯函数/算法（现有 core/ 迁入）
│   └── mock 掉一切外部依赖
├── integration/             # 集成测试：2-3 个模块协作（现有 integration/ 保留）
│   └── mock 边界，保留内部真实链路
├── scenarios/               # 场景测试：完整玩家路径（新增重点）
│   ├── fixtures/            # 场景初始状态
│   ├── helpers/             # 场景驱动器
│   └── *.test.ts            # 场景用例
└── e2e/                     # E2E：真实浏览器（Playwright）
    └── 不 mock 任何东西
```

### 3.2 各层职责

| 层级 | 运行环境 | 速度 | Mock 策略 | 覆盖目标 |
|------|---------|------|----------|---------|
| unit | node | 快（ms） | mock 一切外部 | 纯函数/算法正确性 |
| integration | jsdom | 中（10-100ms） | mock 边界 | 2-3 模块协作 |
| **scenarios** | **jsdom** | **中（10-100ms）** | **只 mock 边界** | **玩家路径完整性** |
| e2e | 真浏览器 | 慢（秒） | 不 mock | 视觉/交互/真实环境 |

### 3.3 关键决策

**场景测试在 jsdom 里跑（快），E2E 在真浏览器跑（慢）。** 场景测试覆盖 90% 的路径，E2E 只覆盖最关键的 5-10 条。

---

## 四、Test Double 策略

### 4.1 什么该 mock，什么不该 mock

原则：**只 mock 系统边界，不 mock 系统内部**。

| 该 mock（边界） | 不该 mock（内部） |
|---------------|----------------|
| `localStorage`（持久化边界） | Game 类内部状态机 |
| `fetch`/网络请求 | 事件系统 → Flag 系统 → 结局检查链 |
| `Date.now()`（时间边界） | 回合推进 → 年份递增 → 纪元切换 |
| `Math.random()`（用确定性种子） | 人物解锁 → UI 事件派发 |
| IndexedDB | 存档序列化 → 哈希校验 → 反序列化 |

### 4.2 setup.ts 改造

当前 [setup.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/setup.ts) 把整个 window mock 成空壳，切断了"代码→UI"链路。改造方案：

```typescript
// src/test/setup.ts —— 所有测试共用，只 mock 真正的边界
const memoryStorage: Record<string, string> = {};

globalThis.window = globalThis.window || {};
globalThis.localStorage = {
  getItem: (k) => memoryStorage[k] ?? null,
  setItem: (k, v) => { memoryStorage[k] = v; },
  removeItem: (k) => { delete memoryStorage[k]; },
  clear: () => { Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]); }
};

// dispatchEvent / addEventListener / CustomEvent 保留真实实现
// 用 jsdom 提供的，不要 mock
```

在 [vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts) 的 test 配置里启用 jsdom 环境（如果还没启用）。

---

## 五、场景设计方法

### 5.1 设计步骤

场景不是从代码里推导的，是从**玩家行为流程图**里推导的。

#### 步骤 1：列出核心玩家路径

```
路径 A: 新游戏 → 教程 → 首回合 → 存档 → 关闭
路径 B: 加载旧存档 → 继续游戏 → 推进纪元
路径 C: 触发事件 → 做选择 → 结局分支
路径 D: AI 托管 → 自动推进 → 切回手动
路径 E: 战斗 → 舰队组建 → 结算
路径 F: 科技研发 → 解锁 → 应用效果
路径 G: 人物登场 → 任职 → 退场
路径 H: 存档 → 读档 → 状态一致
```

#### 步骤 2：为每条路径定义"应该发生什么"

```yaml
路径 B: 加载旧存档 → 继续游戏
  given: 存在 v3 版本旧存档，无 AP 字段
  when: 加载存档
  then:
    - 存档版本迁移到 v4
    - AP 字段被填充默认值
    - isAiBrainEnabled 默认值与源码一致（false）
    - 游戏状态可正常推进回合
    - 不出现死锁
```

#### 步骤 3：把 given/when/then 翻译成代码

### 5.2 测试夹具（Fixture）设计

场景测试的核心资产是**可复用的初始状态**。建立 fixture 库：

```typescript
// src/test/scenarios/fixtures/saves.ts

/** 一个干净的 v3 旧存档（无 AP 字段） */
export function v3SaveWithoutAP() {
  return {
    version: 3,
    timestamp: Date.now(),
    data: JSON.stringify({
      year: 50,
      epoch: 2,  // DETERRENCE
      earthCivi: {
        economy: 100,
        resource: 100,
        culture: 500,
        // 故意缺少 apMax / apCurrent / isAiBrainEnabled
      },
      flags: ['deterrence_established'],
      // ...
    })
  };
}

/** 一个卡在事件队列中的存档 */
export function saveWithPendingEvent() {
  const base = v3SaveWithoutAP();
  const data = JSON.parse(base.data);
  data.eventQueue = [{
    id: 'pending_event',
    title: '未处理事件',
    choices: [{ label: '选项', action: 'pending' }]
  }];
  base.data = JSON.stringify(data);
  return base;
}

/** 一个已通关一次的存档（有结局记录） */
export function completedSave() { ... }
```

### 5.3 场景驱动器（Helper）设计

helper **驱动场景**，**不绕过场景**。对比：

```typescript
// ❌ 现有的 Autoplay500 helper（绕过场景）
function processAllEvents(game) {
  while (game.eventQueue.length > 0) {
    game.currentEvent.choices[0].action();  // 自动选第一个，绕过了"玩家需要选择"
  }
}

// ✅ 场景驱动器（驱动场景，暴露问题）
class ScenarioDriver {
  constructor(private game: Game) {}
  
  /** 模拟玩家点击"下一回合"（不做任何额外处理） */
  clickNextTurn() {
    this.game.runARound();
  }
  
  /** 模拟玩家在事件弹窗中选择某个选项 */
  chooseEventOption(index: number) {
    if (!this.game.currentEvent) throw new Error('无当前事件');
    const choice = this.game.currentEvent.choices[index];
    if (!choice) throw new Error(`选项 ${index} 不存在`);
    choice.action();
    this.game.applyEventEffect(EventEffect.NONE, true);
  }
  
  /** 模拟玩家切换 AI 托管 */
  toggleAiBrain() {
    this.game.earthCivi.isAiBrainEnabled = !this.game.earthCivi.isAiBrainEnabled;
  }
  
  /** 断言：年份是否推进了 */
  expectYearAdvanced(fromYear: number) {
    expect(this.game.year).toBe(fromYear + 1);
    return this;
  }
  
  /** 断言：是否处于死锁状态（年份未推进且事件未处理） */
  expectDeadlock(fromYear: number) {
    expect(this.game.year).toBe(fromYear);
    expect(this.game.eventQueue.length).toBeGreaterThan(0);
    return this;
  }
}
```

### 5.4 场景用例写法

```typescript
// src/test/scenarios/OldSaveMigration.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameInstance } from '../../core/Game';
import { ScenarioDriver } from './helpers/ScenarioDriver';
import { v3SaveWithoutAP } from './fixtures/saves';

describe('场景：玩家加载旧存档继续游戏', () => {
  beforeEach(() => {
    localStorage.clear();
    GameInstance.reset();
  });

  it('v3 存档迁移后，AP 字段填充且 AI 托管默认关闭', () => {
    // given: 存在 v3 旧存档
    localStorage.setItem('LegendOfUni_Save_autosave', JSON.stringify(v3SaveWithoutAP()));
    
    // when: 加载存档
    GameInstance.loadGame();
    const game = GameInstance.get();
    
    // then: 字段正确迁移
    expect(game.earthCivi.apMax).toBe(100);
    expect(game.earthCivi.apCurrent).toBe(100);
    expect(game.earthCivi.isAiBrainEnabled).toBe(false);  // 当前 bug: 实际是 true
  });

  it('加载旧存档后连续推进 10 回合，不出现死锁', () => {
    // given
    localStorage.setItem('LegendOfUni_Save_autosave', JSON.stringify(v3SaveWithoutAP()));
    GameInstance.loadGame();
    const driver = new ScenarioDriver(GameInstance.get());
    
    // when: 玩家连续点 10 次"下一回合"（不做任何其他操作）
    const startYear = driver.game.year;
    for (let i = 0; i < 10; i++) {
      driver.clickNextTurn();
      // 如果出现事件，玩家选择第一个选项
      if (driver.game.currentEvent) {
        driver.chooseEventOption(0);
      }
    }
    
    // then: 年份推进了，无死锁
    expect(driver.game.year).toBeGreaterThan(startYear);
  });
});
```

---

## 六、核心场景清单

### 6.1 按优先级排列的场景

| 优先级 | 场景 | 覆盖的 bug 类型 | 依赖 fixture |
|--------|------|----------------|------------|
| P0 | 旧存档迁移 + 继续游戏 | Bug 1（死锁）+ 数据迁移 | v3SaveWithoutAP |
| P0 | 完整一局游戏（不绕过事件） | 所有死锁类 bug | newGameFixture |
| P1 | 人物登场→任职→退场全流程 | Bug 3 + UI 刷新链 | midGameFixture |
| P1 | 星系状态生命周期 | Bug 4 + 状态清理 | midGameFixture |
| P1 | AI 托管 ↔ 手动切换 | Bug 2 + 状态机 | midGameFixture |
| P1 | 存档→读档→状态一致 | 存档完整性 | midGameFixture |
| P2 | 战斗全流程 | 战斗系统 | battleReadyFixture |
| P2 | 科技树解锁链 | 科技系统 | techReadyFixture |
| P2 | 结局可达性（12 结局各触发一次） | 结局 Flag 链 | endGameFixtures[12] |
| P3 | 154 随机事件触发条件验证 | 事件数据完整性 | eventFixtures |
| P3 | 纪元切换全流程 | 纪元状态机 | epochTransitionFixture |

### 6.2 场景与 bug 的映射

| 已知 bug | 覆盖它的场景 | 场景测试当前预期 |
|---------|------------|----------------|
| Bug 1: 纪元死锁 | P0 旧存档迁移 + 完整一局 | 失败（先红） |
| Bug 2: AI 托管无法取消 | P1 AI 托管切换 | 失败（先红） |
| Bug 3: 人物刷新不派发事件 | P1 人物全流程 | 失败（先红） |
| Bug 4: star.status 永不清除 | P1 星系状态生命周期 | 失败（先红） |
| Bug 5: 结局动画 setTimeout | P2 结局可达性 | 可能失败 |
| Bug 6: 事件监听器泄漏 | 需内存分析工具，场景测试不直接覆盖 | - |

---

## 七、实施步骤

### 7.1 第 1 步：修复 setup.ts 的边界

将 [setup.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/setup.ts) 拆成两层：

1. **基础 setup**（所有测试共用）：只 mock 真正的边界（localStorage、Date、Math.random）
2. **场景 setup**（场景测试专用）：保留真实的 dispatchEvent/addEventListener/CustomEvent

改造后 dispatchEvent 不再是空操作，测试可以通过 spy 监听事件派发。

### 7.2 第 2 步：建立场景目录骨架

```
src/test/scenarios/
├── fixtures/
│   ├── saves.ts          # 各版本存档样本
│   ├── gameStates.ts     # 各阶段游戏状态
│   └── events.ts         # 测试用事件数据
├── helpers/
│   ├── ScenarioDriver.ts # 场景驱动器
│   └── assertions.ts     # 场景化断言
└── *.test.ts
```

### 7.3 第 3 步：按优先级补场景

按 6.1 节的优先级表，从 P0 开始逐个实现。

### 7.4 第 4 步：在 CI 中强制场景测试通过

场景测试是 **CI 门禁**，不是可选的。在 [ci.yml](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/.github/workflows/ci.yml) 中添加：

```yaml
- name: Run scenario tests
  run: npx vitest run src/test/scenarios/
```

### 7.5 第 5 步：清理现有测试

- 审查 Autoplay500.test.ts 的 processAllEvents helper，决定保留（用于压力测试）或改造（用于场景测试）
- 审查所有 mock dispatchEvent 的测试，改为 spy 监听
- 删除为覆盖率而写的测试（无断言或断言无意义的）

---

## 八、验收标准

### 8.1 量化指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 场景测试数量 | 0 | 20-30 |
| 场景测试覆盖的玩家路径 | 0 | 8 条核心路径 |
| 场景测试在 CI 中执行 | 否 | 是 |
| 已知 bug 在场景测试中暴露 | 0/12 | 8/12（场景可覆盖的） |
| setup.ts mock 掉内部链路 | 是 | 否 |

### 8.2 质性指标

1. **"先红后绿"**：每个场景测试在 bug 修复前应该是失败的，修复后才通过
2. **"驱动不绕过"**：helper 只调用游戏 API，不替玩家做决定
3. **"断言副作用"**：不只断言返回值，还要断言状态变化、事件派发、UI 刷新信号
4. **"边界 mock"**：只 mock localStorage/Date/random，不 mock dispatchEvent/状态机

---

## 九、风险与缓解

### 9.1 场景测试可能过慢

**风险**：场景测试如果每个跑 100ms+，30 个就是 3 秒，影响 CI 速度。

**缓解**：
- 场景测试用 jsdom，不用真浏览器
- 控制每个场景的回合数（10-50 回合而非 500 回合）
- 用确定性 RNG 种子避免随机等待
- 并行执行（vitest 默认支持）

### 9.2 fixture 维护成本

**风险**：游戏数据结构变更时所有 fixture 需要同步更新。

**缓解**：
- fixture 用工厂函数（不是硬编码对象），变更时只改工厂
- 建立单一"基础存档"工厂，其他 fixture 基于它派生
- 数据结构变更时跑全部 fixture 的 schema 校验

### 3 场景测试与单元测试的边界模糊

**风险**：开发者不确定某个测试该放 unit 还是 scenarios。

**缓解**：判断标准——
- 如果测试 mock 掉了 2 个以上模块 → unit
- 如果测试保留了完整链路 → scenarios
- 如果只测 2-3 个模块协作 → integration

---

## 十、与现有文档的关系

| 现有文档 | 关系 |
|---------|------|
| [AUDIT_20260624_TEST_COVERAGE_AND_OPTIMIZATION.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_TEST_COVERAGE_AND_OPTIMIZATION.md) | 本文是其在测试策略层的深化，补充"怎么搭"而非"缺什么" |
| [AUDIT_20260624_FULL_CODE_BUG_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_FULL_CODE Bug_AUDIT.md) | 本文的 P0 场景直接覆盖该报告的 Bug 1-4 |
| [AUDIT_20260624_P0_VERIFICATION_AND_TERMINOLOGY_CHECK.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_P0_VERIFICATION_AND_TERMINOLOGY_CHECK.md) | 该报告确认的 4 项红线解除是场景测试的基线 |
| [EXEC_20260624_PROJECT_STATUS_BOARD.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260624_PROJECT_STATUS_BOARD.md) | 场景测试完成后应作为新任务加入看板 |

---

## 十一、核心结论

833 个全绿的单元测试无法保证"玩家能玩"，但 20-30 个覆盖核心路径的场景测试可以。

**测试通过的定义需要从"代码能跑"重新定义为"玩家能玩"。**

场景化集成测试体系的本质是：**把测试从代码视角切换到玩家视角**，从"这个函数对吗"切换到"玩家走完这条路会遇到什么"。

这套体系的投入不大（20-30 个场景测试），但收益显著：
- 发现现有 12 个 bug 中的 8 个
- 防止未来类似 bug 回归
- 为"冻结功能+重构"阶段提供安全网
- 为 Beta 发布提供真实的质量信心

---

**文档完成。**

下一步建议：先实现 P0 的两个场景（旧存档迁移 + 完整一局游戏），验证方案可行性后再铺开 P1。
