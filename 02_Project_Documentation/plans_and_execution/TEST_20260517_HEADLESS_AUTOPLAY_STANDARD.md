# 宇宙群英传 (Legend of Uni) — Headless 自动化试玩规范标准

> 版本：Web 重构版 (03_Web_Rebuild)
> 适用范围：自动化回归测试、CI/CD 集成、AI 驱动型试玩评测
> 核心原则：不改动游戏源码，通过外部接口驱动和观测

---

## 目录

1. [概述与目标](#1-概述与目标)
2. [自动化架构设计](#2-自动化架构设计)
3. [试玩环境初始化规范](#3-试玩环境初始化规范)
4. [回合循环与状态观测规范](#4-回合循环与状态观测规范)
5. [全系统自动化试玩场景](#5-全系统自动化试玩场景)
6. [断言与校验规范](#6-断言与校验规范)
7. [异常处理与恢复规范](#7-异常处理与恢复规范)
8. [性能与日志规范](#8-性能与日志规范)
9. [CI/CD 集成规范](#9-cicd-集成规范)
10. [Headless 试玩报告模板](#10-headless-试玩报告模板)

---

## 1. 概述与目标

### 1.1 定义

Headless 自动化试玩是指：在无人工干预的情况下，通过程序化接口驱动游戏运行，自动执行回合推进、决策、状态检查，并输出完整的试玩分析报告。

### 1.2 适用场景

| 场景 | 说明 |
|------|------|
| 回归测试 | 每次代码变更后自动运行，验证核心系统无退化 |
| 平衡性分析 | 批量运行数千局，统计胜率分布、资源增长曲线 |
| AI 行为验证 | 自动化观测异星 AI 行为是否符合设计规范 |
| 事件覆盖率检查 | 验证所有事件是否能在自动试玩中被触发 |
| 存档兼容性测试 | 验证新旧版本存档的兼容性 |
| 长时运行稳定性 | 自动运行 500+ 回合，检测内存泄漏和状态腐化 |

### 1.3 核心原则

1. **只读优先** — 优先使用观测接口，不修改游戏内部状态
2. **最小侵入** — 仅通过 `window.game` 全局暴露的 API 进行交互
3. **确定性可重复** — 给定相同的随机种子和决策序列，结果必须一致
4. **完整日志** — 每一步操作和状态变更都记录在案
5. **故障自恢复** — 任何异常都不能导致试玩进程永久卡死

---

## 2. 自动化架构设计

### 2.1 三层架构

```
┌─────────────────────────────────────┐
│         Orchestrator (编排层)         │
│  试玩脚本调度 / 场景编排 / 报告生成     │
├─────────────────────────────────────┤
│         Agent (决策层)               │
│  AI 策略 / 规则引擎 / 随机决策         │
├─────────────────────────────────────┤
│         Driver (驱动层)              │
│  window.game API / Event 监听 / 断言   │
└─────────────────────────────────────┘
```

### 2.2 驱动层 (Driver) — 核心 API 接口

游戏通过 `window.game` 暴露的全局对象可供 Headless 完全驱动。以下是必需的接口清单：

```typescript
// === 核心访问接口 ===
interface GameDriver {
  game: Game;                    // 游戏主实例
  earth: EarthCivilization;     // 地球文明
  alienManager: AlienCiviManager; // 外星管理器
  starManager: StarManager;     // 星球管理器
  personManager: PersonManager; // 人物管理器
  eventManager: GameEventManager; // 事件管理器
}

// === 核心操作方法 ===
// 推进回合
game.runARound(): void

// 存档/读档
GameInstance.saveGame(): void
GameInstance.loadGame(): boolean
GameInstance.reset(): void

// 外交操作
game.conductDiplomacy(alienName: string, actionType: string): string

// Flag 操作
game.addFlag(flag: string): void
game.hasFlag(flag: string): boolean
game.removeFlag(flag: string): void

// 事件效果
game.applyEventEffect(effect: EventEffect): void

// === 工人分配 ===
earth.miningRatio: number    // 默认 30
earth.factoryRatio: number   // 默认 30
earth.cultureRatio: number   // 默认 30

// === 面壁者与执剑人 ===
earth.wallfacers: Set<string>
earth.swordholder: string | null
earth.addWallfacer(name: string): void
earth.removeWallfacer(name: string): void
earth.isWallfacer(name: string): boolean

// === 部门管理 ===
earth.departments: Map<DepartmentType, Department>
// DepartmentType: ECONOMY, ASTROSOCIOLOGY, NUCLEAR, SPACEFLIGHT, 
//                 PROTON, ASTROPHYSICS, ARMY, CULTURE, 
//                 CULTURETEC, ECONOMYTEC, HUMANRES

// === 科技树 ===
earth.tecTreeManager.trees: Map<TecTreeType, TecTree>
earth.tecTreeManager.isTecFinished(type: TecTreeType, name: string): boolean
earth.tecTreeManager.isTecFinishedAnywhere(name: string): boolean

// === 星球建造 ===
star.hasStope: boolean      // 采矿场
star.hasFactory: boolean    // 加工厂
star.hasCity: boolean       // 太空城市
star.barbackId: string | null  // 军营

// === 舰队 ===
earth.fleets: Fleet[]
// Fleet: { id, name, belongToCivi, leaderName, weapons, 
//          sourceStarIndex, targetStarIndex, eta, totalEta }
```

### 2.3 事件监听接口

游戏通过 `window.dispatchEvent` 派发以下自定义事件：

| 事件名 | 触发时机 | 携带数据 |
|--------|----------|----------|
| `game-turn-complete` | 回合结算完成 | 无 |
| `game-event-triggered` | 叙事事件触发 | `detail: GameEventPayload` |
| `game-loaded` | 存档加载完成 | 无 |
| `game-over` | 游戏结束 | `detail: { reason, victoryType }` |
| `epoch-changed` | 纪元变更 | `detail: { newEpoch }` |
| `star-selected` | 星球被点击 | `detail: { starIndex }` |

---

## 3. 试玩环境初始化规范

### 3.1 基础环境配置

```javascript
// 1. 确保游戏实例存在
const game = window.game;
if (!game) {
  throw new Error('window.game 未初始化，请确认游戏已加载');
}

// 2. 重置为干净状态
GameInstance.reset();

// 3. 可选：固定随机种子（如果游戏支持）
// game.setSeed(42);

// 4. 设置 Headless 模式标志
window.__HEADLESS_MODE__ = true;
```

### 3.2 事件队列清理

每次试玩开始前，确保事件队列干净：

```javascript
function cleanEventQueue() {
  // 关闭当前事件
  if (game.currentEvent) {
    game.currentEvent = null;
  }
  // 清空事件队列
  game.eventQueue.length = 0;
  // 释放处理锁
  game.isProcessing = false;
}
```

### 3.3 初始状态快照

试玩开始前记录初始状态，用于后续对比：

```javascript
function takeSnapshot(label) {
  return {
    label,
    year: game.year,
    epoch: game.epoch,
    economy: game.earthCivi.economy,
    resource: game.earthCivi.resource,
    culture: game.earthCivi.culture,
    population: game.earthCivi.population,
    army: game.earthCivi.army,
    treachery: game.earthCivi.treachery,
    deterrence: game.earthCivi.deterrenceValue,
    civiLevel: game.earthCivi.civiLevel,
    wallfacers: [...game.earthCivi.wallfacers],
    swordholder: game.earthCivi.swordholder,
    isSophonBlocked: game.isSophonBlocked(),
    alienCount: game.alienCiviManager.aliens.size,
    eventCount: game.eventManager.events.length,
  };
}
```

---

## 4. 回合循环与状态观测规范

### 4.1 标准回合推进流程

```
for turn in 1..maxTurns:
  PRE-CHECK:
    - isGameOver → 结束试玩
    - isProcessing → 等待解锁
    
  PRE-TURN STATE:
    - snapshot.pre = takeStateSnapshot()
    
  EXECUTE:
    - game.runARound()
    
  POST-TURN WAIT:
    - 等待 eventQueue 清空 (async polling)
    - 等待 isProcessing 变为 false
    
  POST-TURN STATE:
    - snapshot.post = takeStateSnapshot()
    
  VALIDATE:
    - assert(snapshot.post.year === snapshot.pre.year + 1)
    - checkSanityOfStateChange(pre, post)
    
  LOG:
    - logTurnResult(turn, pre, post)
```

### 4.2 异步事件处理循环

由于事件系统是同步的（通过 `processNextEvent`），但 UI 等待可能在异步帧中处理，Headless 模式需要特殊处理：

```javascript
async function safeRunARound() {
  if (game.isGameOver) return { status: 'game_over' };
  
  game.runARound();
  
  // 处理事件队列
  while (game.eventQueue.length > 0 || game.currentEvent) {
    if (game.currentEvent) {
      // Headless 模式下自动选择第一个选项
      const evt = game.currentEvent;
      if (evt.choices && evt.choices.length > 0) {
        const defaultChoice = evt.choices[0];
        if (defaultChoice.action) {
          defaultChoice.action();
        }
      }
      // 触发事件关闭，进入下一个事件
      game.processNextEvent();
    }
    // 短暂等待以防止同步循环卡死
    await sleep(10);
  }
  
  // 等待处理锁释放
  while (game.isProcessing) {
    await sleep(10);
  }
  
  return { status: 'ok', year: game.year };
}
```

### 4.3 回合合法性校验

每回合结束后必须校验以下不变量：

| 校验项 | 断言 | 严重度 |
|--------|------|--------|
| 年份递增 | `post.year === pre.year + 1` | 致命 |
| 人口非负 | `earth.population >= 0` | 致命 |
| 经济非负 | `earth.economy >= 0` | 高 |
| 资源非负 | `earth.resource >= 0` | 中 |
| 文化非负 | `earth.culture >= 0` | 中 |
| 逃亡主义范围 | `0 <= earth.treachery <= 100` | 高 |
| 纪元合法性 | `epoch ∈ {0,1,2,3,4}` | 致命 |
| 文明等级范围 | `0 <= civiLevel <= 4` | 高 |
| 星球归属一致性 | 地球的 `starIndices` 中每个星球的 `belongToCivi` 都是 "地球" | 高 |

---

## 5. 全系统自动化试玩场景

### 5.1 场景一：经济生产链满载试玩

**目标**：验证从初始状态到经济自持的全过程

```javascript
function scenarioEconomyFullLoad() {
  const log = [];
  
  // Phase 1: 快速建造基础设施 (Turn 1-20)
  for (let t = 1; t <= 20; t++) {
    // 优先建造采矿场
    const earthStar = game.starManager.getStar(4); // 地球 index=4
    if (!earthStar.hasStope && earth.economy >= 30) {
      earth.economy -= 30;
      earthStar.hasStope = true;
      log.push(`Turn ${t}: Built Stope`);
    }
    // 其次建造工厂
    if (!earthStar.hasFactory && earth.economy >= 50) {
      earth.economy -= 50;
      earthStar.hasFactory = true;
      log.push(`Turn ${t}: Built Factory`);
    }
    // 最后建造城市
    if (!earthStar.hasCity && earth.economy >= 80) {
      earth.economy -= 80;
      earthStar.hasCity = true;
      log.push(`Turn ${t}: Built City`);
    }
    
    const snap = takeSnapshot(`turn_${t}`);
    safeRunARound();
    log.push(`Turn ${t}: Pop=${earth.population} Econ=${earth.economy} Res=${earth.resource}`);
  }
  
  // Phase 2: 科技追赶 (Turn 21-100)
  // 自动研究基础科技线
  
  // Phase 3: 稳定运行 (Turn 101-200)
  // 验证资源产出稳定性
  
  return log;
}
```

### 5.2 场景二：五条科技线全遍历试玩

**目标**：确保每条科技线的每个节点都能被研究

```javascript
function scenarioTechTreeFullTraversal() {
  const completedTechs = new Set();
  const techTypes = [0, 1, 2, 3, 4]; // 五条科技树类型
  
  for (const techType of techTypes) {
    const tree = game.tecTreeManager.trees.get(techType);
    const allNodes = [...tree.nodes.values()];
    let currentNode = tree.rootNodeName;
    
    // BFS 遍历科技树
    while (currentNode) {
      const node = tree.getNode(currentNode);
      if (node && !node.finished) {
        // 尝试研究
        if (game.earthCivi.economy >= node.cost) {
          game.earthCivi.economy -= node.cost;
          node.inResearch = true;
          completedTechs.add(`${techType}:${currentNode}`);
          log.push(`Started research: ${currentNode}`);
          
          // 推进回合直到完成
          while (!node.finished) {
            safeRunARound();
          }
        }
      }
      // 移动到下一个子节点
      currentNode = node?.childrenNames[0] || null;
    }
  }
  
  return { totalCompleted: completedTechs.size, list: [...completedTechs] };
}
```

### 5.3 场景三：异星 AI 行为观测试玩

**目标**：在 200 回合窗口中观察并记录所有异星行为

```javascript
function scenarioAlienBehaviorObservation() {
  const alienLogs = [];
  const initialStates = new Map();
  
  // 记录初始状态
  for (const [name, alien] of game.alienCiviManager.aliens) {
    initialStates.set(name, {
      population: alien.population,
      resource: alien.resource,
      army: alien.army,
      personality: alien.personality,
    });
  }
  
  // 运行 200 回合
  for (let t = 1; t <= 200; t++) {
    safeRunARound();
    
    for (const [name, alien] of game.alienCiviManager.aliens) {
      if (!alien.isDieOut()) {
        alienLogs.push({
          turn: t,
          name,
          pop: alien.population,
          res: alien.resource,
          army: alien.army,
          friendship: alien.friendshipType,
          attackCooldown: alien.attackCooldown,
        });
      }
    }
    
    // 检查攻击事件
    if (earth.population < initialStates.get('地球')?.population) {
      alienLogs.push({ turn: t, event: 'EARTH_ATTACKED', pop: earth.population });
    }
  }
  
  return { initialStates: [...initialStates], logs: alienLogs };
}
```

### 5.4 场景四：事件覆盖率检测试玩

**目标**：运行足够多的回合（500+），统计事件触发覆盖情况

```javascript
function scenarioEventCoverage() {
  const triggeredFixedEvents = new Set();
  const filteredEventsTriggered = new Set();
  let totalRandomEvents = 0;
  
  for (let t = 1; t <= 500; t++) {
    // 记录当前回合触发的固定事件
    const yearEvents = game.eventManager.checkEvents(game.year);
    for (const evt of yearEvents) {
      triggeredFixedEvents.add(evt.name || `year_${evt.inYear}`);
    }
    
    // 记录过滤事件
    for (const fev of game.eventManager.filteredEvents) {
      if (game.eventManager.triggeredFilteredIds.has(fev.id)) {
        filteredEventsTriggered.add(fev.id);
      }
    }
    
    // 随机事件
    const randomEvt = game.eventManager.checkRandomEvents();
    if (randomEvt) totalRandomEvents++;
    
    safeRunARound();
    
    if (game.isGameOver) break;
  }
  
  // 计算覆盖率
  const totalFilteredEvents = game.eventManager.filteredEvents.length;
  
  return {
    fixedEventsTriggered: triggeredFixedEvents.size,
    fixedEventsList: [...triggeredFixedEvents],
    filteredEventsRate: `${filteredEventsTriggered.size}/${totalFilteredEvents}`,
    totalRandomEvents,
    gameOverAt: game.isGameOver ? game.year : null,
  };
}
```

### 5.5 场景五：存档往返试玩

**目标**：验证存档/读档后游戏状态完全一致

```javascript
function scenarioSaveLoadRoundTrip() {
  // Step 1: 运行 50 回合建立状态
  for (let i = 0; i < 50; i++) safeRunARound();
  
  // Step 2: 记录关键状态
  const beforeSave = takeSnapshot('before_save');
  
  // Step 3: 保存
  GameInstance.saveGame();
  
  // Step 4: 重置并加载
  GameInstance.reset();
  const loaded = GameInstance.loadGame();
  
  if (!loaded) return { result: 'FAIL', reason: 'loadGame returned false' };
  
  // Step 5: 记录加载后状态
  const afterLoad = takeSnapshot('after_load');
  
  // Step 6: 对比
  const diffs = [];
  for (const key of Object.keys(beforeSave)) {
    if (key === 'label') continue;
    if (JSON.stringify(beforeSave[key]) !== JSON.stringify(afterLoad[key])) {
      diffs.push({ key, before: beforeSave[key], after: afterLoad[key] });
    }
  }
  
  // Step 7: 读档后继续游戏
  safeRunARound();
  const afterResume = takeSnapshot('after_resume');
  
  return {
    result: diffs.length === 0 ? 'PASS' : 'FAIL',
    diffs,
    beforeSave,
    afterLoad,
    afterResume,
  };
}
```

### 5.6 场景六：全部胜利条件达成路径试玩

**目标**：分别模拟不同策略路径，验证每种胜利条件是否可达

```
胜利用例集：
├── 流浪胜利: 专注航天科技 → 行星发动机III → 新家园选址
├── 数字永生: 专注信息技术 → 数字方舟
├── 威慑胜利: 任命执剑人 → 存活至威慑纪元 (year≥201)
├── 征服胜利: 军事科技 → 消灭所有外星
├── 黑域胜利: 物理学科技 → 黑域生成
└── 隐藏胜利: (待发现)
```

```javascript
function scenarioVictoryPath(targetVictory) {
  const strategies = {
    WANDERING: () => { /* 航天工程线优先 */ },
    DIGITAL: () => { /* 信息技术线优先 */ },
    DETERRENCE: () => { /* 任命执剑人，存活 */ },
    CONQUEST: () => { /* 军事扩张 */ },
    DARK_DOMAIN: () => { /* 物理学终极科技 */ },
  };
  
  const strategy = strategies[targetVictory];
  if (!strategy) return { result: 'SKIPPED', reason: 'Unknown victory type' };
  
  let turnLimit = 500;
  while (turnLimit-- > 0) {
    strategy();
    safeRunARound();
    if (game.isGameOver) {
      return {
        result: game.victoryType === targetVictory ? 'PASS' : 'FAIL',
        achieved: game.victoryType,
        expected: targetVictory,
        year: game.year,
        reason: game.gameOverReason,
      };
    }
  }
  
  return { result: 'TIMEOUT', target: targetVictory, maxTurns: 500 };
}
```

### 5.7 场景七：外交全路径试玩

**目标**：对每个外星文明执行所有外交操作

```javascript
function scenarioDiplomacyFullPath() {
  const results = [];
  
  for (const [name, alien] of game.alienCiviManager.aliens) {
    for (const action of ['negotiate', 'trade', 'provoke', 'ally']) {
      // 重置冷却
      alien.diplomacyCooldown = 0;
      
      const result = game.conductDiplomacy(name, action);
      
      // 推进回合让冷却递减
      safeRunARound();
      
      results.push({
        alien: name,
        action,
        result,
        newFriendship: alien.friendshipType,
      });
    }
  }
  
  return results;
}
```

---

## 6. 断言与校验规范

### 6.1 断言分级

| 级别 | 名称 | 行为 | 示例 |
|------|------|------|------|
| FATAL | 致命 | 立即终止试玩，标记失败 | 游戏崩溃、年份不递增 |
| ERROR | 错误 | 记录错误，继续试玩 | 资源负值、人口异常跳跃 |
| WARN | 警告 | 仅记录日志 | 资源产出低于预期、事件未触发 |
| INFO | 信息 | 记录但不影响结果 | 科技研究完成、纪元变更 |

### 6.2 核心断言清单

```javascript
const ASSERTIONS = {
  // 致命断言
  FATAL_yearIncrements: (pre, post) => post.year === pre.year + 1,
  FATAL_epochValid: (post) => [0,1,2,3,4].includes(post.epoch),
  FATAL_notCrashed: () => !document.querySelector('.error-screen'),
  
  // 错误断言
  ERROR_populationNonNegative: (post) => post.population >= 0,
  ERROR_economyNonNegative: (post) => post.economy >= 0,
  ERROR_treacheryRange: (post) => 0 <= post.treachery && post.treachery <= 100,
  ERROR_civiLevelRange: (post) => 0 <= post.civiLevel && post.civiLevel <= 4,
  ERROR_resourceNonNegative: (post) => post.resource >= 0,
  
  // 警告断言
  WARN_populationGrowthReasonable: (pre, post) => {
    const growth = post.population - pre.population;
    return growth >= 0 && growth <= 100; // 单回合增长不超过100
  },
  WARN_economyGrowthReasonable: (pre, post) => {
    const growth = post.economy - pre.economy;
    return growth >= -100 && growth <= 500; // 经济波动合理
  },
  WARN_treacheryGrowthReasonable: (pre, post) => {
    const growth = post.treachery - pre.treachery;
    return growth <= 5; // 单回合逃亡主义增长不超过5
  },
};
```

### 6.3 运行期校验函数

```javascript
function validateTurn(preSnapshot, postSnapshot) {
  const results = [];
  
  for (const [key, fn] of Object.entries(ASSERTIONS)) {
    const [level, name] = key.split('_');
    const passed = fn(preSnapshot, postSnapshot);
    if (!passed) {
      results.push({ level: level.toUpperCase(), check: name, passed: false });
    }
  }
  
  return results;
}
```

---

## 7. 异常处理与恢复规范

### 7.1 isProcessing 死锁检测

游戏中 `isProcessing` 锁如果未能正确释放，会导致回合永久阻塞：

```javascript
const PROCESSING_TIMEOUT = 10000; // 10 秒超时

async function waitForProcessingUnlock() {
  const startTime = Date.now();
  while (game.isProcessing) {
    if (Date.now() - startTime > PROCESSING_TIMEOUT) {
      console.error('[HEADLESS] isProcessing 锁超时，强制解锁');
      game.isProcessing = false;
      game.currentEvent = null;
      game.eventQueue.length = 0;
      return { recovered: true, reason: 'processing_lock_timeout' };
    }
    await sleep(50);
  }
  return { recovered: false };
}
```

### 7.2 事件队列堆积处理

```javascript
const EVENT_QUEUE_MAX = 100;

function handleEventQueueOverflow() {
  if (game.eventQueue.length > EVENT_QUEUE_MAX) {
    console.warn(`[HEADLESS] 事件队列堆积 ${game.eventQueue.length}，自动清理`);
    // 只保留最近 50 个事件
    game.eventQueue = game.eventQueue.slice(-50);
    return { recovered: true, trimmed: true };
  }
  return { recovered: false };
}
```

### 7.3 Game Over 时优雅退出

```javascript
function handleGameOver() {
  if (game.isGameOver) {
    return {
      status: 'GAME_OVER',
      turn: game.year,
      victoryType: game.victoryType,
      reason: game.gameOverReason,
      finalState: takeSnapshot('game_over'),
      historyLogs: [...game.historyLogs].slice(-20),
    };
  }
  return null;
}
```

---

## 8. 性能与日志规范

### 8.1 性能监控

Headless 模式下的回合推进速度是衡量代码质量的关键指标：

```javascript
class PerformanceMonitor {
  constructor() {
    this.turnTimes = [];
    this.maxTurnTime = 0;
    this.totalTime = 0;
    this.memorySnapshots = [];
  }
  
  recordTurn(startTime, endTime) {
    const duration = endTime - startTime;
    this.turnTimes.push(duration);
    this.maxTurnTime = Math.max(this.maxTurnTime, duration);
    this.totalTime += duration;
  }
  
  getStats() {
    const sorted = [...this.turnTimes].sort((a,b) => a-b);
    return {
      totalTurns: this.turnTimes.length,
      totalTime: this.totalTime,
      avgTurnTime: this.totalTime / this.turnTimes.length,
      medianTurnTime: sorted[Math.floor(sorted.length / 2)],
      p95TurnTime: sorted[Math.floor(sorted.length * 0.95)],
      maxTurnTime: this.maxTurnTime,
    };
  }
}
```

### 8.2 日志格式标准

每条日志记录必须包含时间戳、回合号、严重级别、系统、描述：

```json
{
  "timestamp": "2026-05-17T10:30:00.000Z",
  "turn": 128,
  "level": "INFO",
  "system": "ECONOMY",
  "event": "RESOURCE_PRODUCTION",
  "data": {
    "miningOutput": 45,
    "factoryOutput": 30,
    "cultureOutput": 5
  },
  "message": "资源生产正常：采矿45，工厂30，文化5"
}
```

### 8.3 日志输出目标

| 目标 | 用途 | 格式 |
|------|------|------|
| `console.log` | 实时调试 | 人类可读文本 |
| `window.__headless_log__` | 程序化收集 | JSON 数组 |
| 文件导出 | 离线分析 | JSON Lines (.jsonl) |

```javascript
function headlessLog(entry) {
  // 实时输出
  console.log(`[T${entry.turn}] [${entry.level}] ${entry.system}: ${entry.message}`);
  
  // 程序化收集
  if (!window.__headless_log__) window.__headless_log__ = [];
  window.__headless_log__.push({
    ...entry,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 9. CI/CD 集成规范

### 9.1 npm 脚本

在 `package.json` 中添加 Headless 试玩脚本：

```json
{
  "scripts": {
    "test:headless": "vite --mode headless & sleep 3 && node scripts/headless-runner.mjs",
    "test:headless:ci": "node scripts/headless-ci.mjs"
  }
}
```

### 9.2 GitHub Actions 配置

```yaml
name: Headless Gameplay Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  headless-test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd 03_Web_Rebuild && npm ci
      
      - name: Run Headless Tests
        run: cd 03_Web_Rebuild && npm run test:headless:ci
      
      - name: Upload Test Report
        uses: actions/upload-artifact@v4
        with:
          name: headless-report
          path: 03_Web_Rebuild/headless-report/
```

### 9.3 CI 通过标准

| 指标 | 阈值 |
|------|------|
| 所有场景执行成功率 | = 100% |
| FATAL 级别断言失败 | 0 |
| ERROR 级别断言失败 | ≤ 3 |
| 存档往返一致性 | = 100% |
| 事件覆盖率 | ≥ 60% |
| 回合推进不卡死 | ≥ 500 回合 |
| 平均回合时间 (Headless) | ≤ 50ms |

---

## 10. Headless 试玩报告模板

每次试玩结束后应自动生成 Markdown 报告：

```markdown
# Headless 自动化试玩报告

**执行时间**: {{timestamp}}
**总回合数**: {{totalTurns}}
**试玩时长**: {{totalTime}}ms
**游戏结果**: {{gameResult}}
**总体评分**: {{overallScore}}/100

---

## 1. 性能概览
| 指标 | 值 |
|------|-----|
| 总回合数 | {{totalTurns}} |
| 总耗时 | {{totalTime}}ms |
| 平均回合时间 | {{avgTurnTime}}ms |
| 中位数回合时间 | {{medianTurnTime}}ms |
| P95 回合时间 | {{p95TurnTime}}ms |
| 最慢回合 | {{maxTurnTime}}ms (Turn {{slowestTurn}}) |

## 2. 结算状态
| 指标 | 值 |
|------|-----|
| 游戏结果 | {{gameResult}} |
| 胜利类型 | {{victoryType}} |
| 结束回合 | {{endTurn}} |
| 最终人口 | {{finalPopulation}} |
| 最终经济 | {{finalEconomy}} |
| 最终文化 | {{finalCulture}} |
| 逃亡主义 | {{finalTreachery}} |

## 3. 断言结果
| 级别 | 通过 | 失败 |
|------|------|------|
| FATAL | {{fatalPass}} | {{fatalFail}} |
| ERROR | {{errorPass}} | {{errorFail}} |
| WARN | {{warnPass}} | {{warnFail}} |

## 4. 系统详细报告
### 4.1 经济系统
- 采矿场建造: {{stopeCount}}
- 加工厂建造: {{factoryCount}}
- 太空城市建造: {{cityCount}}
- 资源峰值: {{peakResource}}
- 经济峰值: {{peakEconomy}}

### 4.2 科技系统
- 完成科技数: {{completedTechs}}
- 科技覆盖率: {{techCoverage}}%

### 4.3 异星行为统计
| 文明 | 攻击次数 | 扩张次数 | 当前状态 |
|------|----------|----------|----------|
{{#each aliens}}
| {{name}} | {{attackCount}} | {{expandCount}} | {{status}} |
{{/each}}

### 4.4 事件触发统计
- 固定事件触发: {{fixedEventCount}}
- 条件事件触发: {{filteredEventCount}}/{{totalFilteredEvents}}
- 随机事件触发: {{randomEventCount}}

### 4.5 外交记录
{{#each diplomacyLogs}}
- Turn {{turn}}: 对 {{target}} 执行 {{action}} → {{result}}
{{/each}}

### 4.6 存档测试
- 往返一致性: {{saveLoadResult}}

## 5. 已知缺陷验证
| 编号 | 描述 | 状态 |
|------|------|------|
{{#each knownBugs}}
| {{id}} | {{description}} | {{status}} |
{{/each}}

## 6. 优化建议
{{#each suggestions}}
- [{{priority}}] {{category}}: {{suggestion}}
{{/each}}
```

---

## 附录：Headless Runner 完整实现示例

以下是一个可直接使用的 Headless 试玩执行器的简化实现：

```javascript
// headless-runner.js — 通过 Puppeteer 注入浏览器执行

async function runHeadlessTest() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // 导航到游戏
  await page.goto('http://localhost:5173');
  await page.waitForFunction(() => window.game !== undefined);
  
  // 注入 Headless 测试框架
  await page.evaluate(() => {
    window.__headless_log__ = [];
    
    window.headlessRunARound = async function() {
      const game = window.game;
      if (game.isGameOver) return { status: 'game_over' };
      
      game.runARound();
      
      while (game.eventQueue.length > 0 || game.currentEvent) {
        if (game.currentEvent?.choices?.length > 0) {
          game.currentEvent.choices[0].action?.();
        }
        game.processNextEvent();
        await new Promise(r => setTimeout(r, 10));
      }
      
      while (game.isProcessing) {
        await new Promise(r => setTimeout(r, 10));
      }
      
      return { status: 'ok', year: game.year };
    };
  });
  
  // 执行试玩（示例：200 回合经济观察）
  const result = await page.evaluate(async () => {
    const log = [];
    for (let t = 1; t <= 200; t++) {
      const r = await window.headlessRunARound();
      if (r.status === 'game_over') break;
      log.push({
        turn: t,
        economy: window.game.earthCivi.economy,
        resource: window.game.earthCivi.resource,
        population: window.game.earthCivi.population,
      });
    }
    return { logs: log, finalYear: window.game.year };
  });
  
  await browser.close();
  return result;
}
```

---

> 文档生成日期：2026-05-17
> 本规范定义了 7 类自动化试玩场景，覆盖全系统自动化测试需求