# 宇宙群英传 - 全功能系统测试用例文档

> 版本: 1.0  
> 生成日期: 2026-05-17  
> 适用范围: 03_Web_Rebuild (React + TypeScript + Vite)  
> 测试原则: 不改动游戏源码，纯黑盒/灰盒观察与验证

---

## 目录

1. [测试策略概述](#1-测试策略概述)
2. [核心循环与回合系统测试](#2-核心循环与回合系统测试)
3. [经济与资源生产链测试](#3-经济与资源生产链测试)
4. [科技树系统测试 (85节点 x 5条线)](#4-科技树系统测试)
5. [军事与战斗系统测试](#5-军事与战斗系统测试)
6. [异星文明AI系统测试](#6-异星文明ai系统测试)
7. [事件叙事系统测试](#7-事件叙事系统测试)
8. [外交系统测试](#8-外交系统测试)
9. [胜利与失败条件测试](#9-胜利与失败条件测试)
10. [面壁者与执剑人系统测试](#10-面壁者与执剑人系统测试)
11. [角色管理系统测试](#11-角色管理系统测试)
12. [纪元与文明等级系统测试](#12-纪元与文明等级系统测试)
13. [智子封锁系统测试](#13-智子封锁系统测试)
14. [存档系统测试](#14-存档系统测试)
15. [UI交互系统测试](#15-ui交互系统测试)
16. [星球与星图系统测试](#16-星球与星图系统测试)
17. [舰队与殖民系统测试](#17-舰队与殖民系统测试)
18. [边界与压力测试](#18-边界与压力测试)
19. [测试通过标准汇总](#19-测试通过标准汇总)

---

## 1. 测试策略概述

### 1.1 测试分层

```
┌──────────────────────────────────────┐
│  L4: 端到端游玩测试 (E2E Playthrough)   │
├──────────────────────────────────────┤
│  L3: UI交互与视觉验证 (UI/UX Test)      │
├──────────────────────────────────────┤
│  L2: 系统集成测试 (Integration Test)     │
├──────────────────────────────────────┤
│  L1: 单元逻辑验证 (Logic Verification)   │
└──────────────────────────────────────┘
```

### 1.2 测试环境

| 项目 | 配置 |
|------|------|
| 浏览器 | Chrome 120+, Firefox 120+, Safari 17+ |
| 分辨率 | 1920x1080 (基准), 1366x768, 2560x1440 |
| Node.js | 18.x LTS |
| 测试框架 | Vitest (单元), Playwright (E2E) |
| 数据文件 | `src/data/*.json` 原始数据 |
| 存档位置 | `localStorage` key: `lengendofuni_save` |

### 1.3 测试执行方式

所有测试通过以下方式执行，**不对源码做任何修改**：

- **代码审查**：静态分析源码逻辑、公式、边界条件
- **Console注入**：通过浏览器 DevTools Console 调用 `window.game` 暴露的 API 验证状态
- **手动试玩**：按测试用例步骤逐项操作验证
- **自动化脚本**：通过 Playwright 脚本执行 Headless 自动化试玩

---

## 2. 核心循环与回合系统测试

### TC-2.1 回合推进基本流程

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-2.1 |
| **优先级** | P0 (关键路径) |
| **前置条件** | 游戏新开局，未进行任何操作 |
| **关联代码** | `Game.runARound()` (Game.ts:L89-L195) |

**测试步骤：**

1. 新开一局游戏，记录初始年份 (year=0)
2. 点击"下一回合"按钮 1 次
3. 验证 year 变为 1
4. 验证 `isProcessing` 在回合结束后恢复为 false
5. 验证 `earthCivi.population`, `economy`, `culture`, `resource` 有正常变化
6. 验证 `historyLogs` 新增了回合日志记录
7. 点击"下一回合" 10 次，验证 year 线性递增到 11

**预期结果：**
- year 每次递增 1
- 回合结算期间 isProcessing 为 true，完成后为 false
- 各资源无异常幅度的突变（控制在合理范围内）
- 无控制台错误/警告（除已知的智子封锁提示外）

**验证方法：**
```
// Console 注入验证
const g = window.game;
console.log('Year:', g.year, 'Processing:', g.isProcessing);
console.log('Pop:', g.earthCivi.population, 'Eco:', g.earthCivi.economy);
```

---

### TC-2.2 回合防重入锁

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-2.2 |
| **优先级** | P0 |
| **前置条件** | 游戏中，存在事件队列或不处于 isProcessing 状态 |

**测试步骤：**

1. 在新回合开始时，快速连续点击"下一回合"按钮 5 次
2. 验证 year 只增加了 1
3. 验证控制台有 "Game is processing, please wait" 的 warn 日志
4. 验证没有因重复结算导致资源翻倍

**预期结果：**
- isProcessing 锁有效，year 只递增 1
- 警告输出到 console.warn
- 状态一致性保持

---

### TC-2.3 事件队列优先于回合推进

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-2.3 |
| **优先级** | P0 |
| **前置条件** | 游戏进行到触发固定年份事件的回合 |

**测试步骤：**

1. 游戏进行到 year=2，"古筝行动"事件触发
2. 在事件模态框未关闭的情况下，尝试点击"下一回合"
3. 验证回合被阻止推进
4. 关闭事件模态框后，再次点击"下一回合"
5. 验证回合正常推进

**预期结果：**
- `currentEvent !== null` 时，runARound 直接返回 false（代码中检查 eventQueue 和 currentEvent）
- 事件关闭后回合正常推进

---

### TC-2.4 游戏结束状态锁定

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-2.4 |
| **优先级** | P0 |
| **前置条件** | 通过 Console 注入或自然游戏触发 Game Over |

**测试步骤：**

1. Console 注入 `window.game.isGameOver = true; window.game.gameOverReason = "Test"`
2. 点击"下一回合"按钮
3. 验证回合没有任何推进（year 不变，资源不变）

**预期结果：**
- Game Over 后 runARound 直接返回，不执行任何逻辑
- EndGameScreen 正确显示

---

### TC-2.5 全子系统异常隔离

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-2.5 |
| **优先级** | P1 |
| **前置条件** | 游戏中，可通过 Console 模拟异常 |

**测试步骤：**

1. 通过 Console 注入使 `earthCivi.processMining` 抛出异常
2. 执行 `runARound()`
3. 验证回合仍然完成，仅跳过采矿阶段
4. 验证 error 被 catch 并输出到 console.error
5. 验证 isProcessing 在 finally 中正确释放

**预期结果：**
- 单个子系统异常不阻断整个回合
- try/catch 每个阶段独立，错误隔离有效

---

## 3. 经济与资源生产链测试

### TC-3.1 采矿产出计算正确性

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-3.1 |
| **优先级** | P0 |
| **前置条件** | 星球上有采矿场 + 已分配采矿工人 + 已任命经济部长 |
| **关联代码** | `EarthCivilization.processMining()` (EarthCivilization.ts:L100-L133) |

**测试步骤：**

1. 确保地球(index=4)有采矿场 (`hasStope=true`)
2. 任命一位 economy 属性较高的人物为经济部长
3. 录制当前 resource 值
4. 推进 5 个回合，每回合记录 resource 增量
5. 手动计算：`产出 = floor((workersPerStope + floor(leader.economy/20)) * miningWeight / 2)`
   - 再应用 treachery 修正和上限
6. 对比实际产出与计算值

**预期结果：**
- 实际产出与公式计算一致（允许 ±1 的舍入误差）
- 采矿产出不超过星球 currentResource 上限
- 产出受 treachery 惩罚影响正常递减

**关键公式：**
```
单矿场产出 = floor((workers/矿场数 + floor(部长economy/20)) * 采矿权重 / 2)
采矿权重: 基础=2, 星矿I=3, 星矿II=4, 星矿III=5
treachery修正 = floor(产出 * max(1, 100-treachery) / 100)
上限 = min(修正产出, 100, 星球当前资源量)
```

---

### TC-3.2 工厂产出与经济转换

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-3.2 |
| **优先级** | P0 |
| **前置条件** | 工厂已建造，工人已分配 |
| **关联代码** | `EarthCivilization.processFactories()` (EarthCivilization.ts:L135-L182) |

**测试步骤：**

1. 建造工厂 (hasFactory=true)
2. 记录 resource 和 economy 初始值
3. 推进 5 回合
4. 每回合验证：resource 消耗量 = economy 增长量 × 2
5. 研究"行星发动机Ⅰ型"后验证 economy 产出提升 5 倍
6. 研究"质能转换科技"后验证 resource 不再消耗

**预期结果：**
- 基础转换率：2 资源 → 1 经济
- 行星发动机Ⅰ型：产出 ×5
- 质能转换：免资源消耗
- 单厂产出上限：无发动机 100，有发动机 500

---

### TC-3.3 文化产出计算

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-3.3 |
| **优先级** | P1 |
| **关联代码** | `EarthCivilization.processCulture()` (EarthCivilization.ts:L184-L201) |

**测试步骤：**

1. 分配文化工人
2. 记录 culture 初始值
3. 推进 5 回合，每回合记录增量
4. 验证公式：`cultureGain = floor((cultureWorkers + floor(leader.social/5)) * weight / 20)`
5. 上限验证：不超过 100
6. 研究"思想钢印" I/II/III，验证权重提升

**预期结果：**
- 文化产出符合公式
- 思想钢印科技逐级提升权重 (2→3→4→5)

---

### TC-3.4 人口增长机制

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-3.4 |
| **优先级** | P1 |
| **关联代码** | `EarthCivilization.processPopulationGrowth()` (EarthCivilization.ts:L254-L292) |

**测试步骤：**

1. 初始无城市，推进 5 回合
2. 验证无城市时人口增长 = 1/回合
3. 建造 1 个城市 (hasCity=true)
4. 推进回合，验证增长公式：`max(1, floor(5 * growthWeight / 2) * 城市数)`
5. 验证上限 = min(baseGrowth, 30)
6. 验证额外增长 = floor(人力资源部长 leadership × 0.2)
7. 建造多个城市验证总增长叠加
8. 验证总人口不超过 populationLimit

**预期结果：**
- 城市数量与人口增长线性正相关
- 殖民城科技提升增长率权重
- 人口有明确上限

---

### TC-3.5 工人分配比例

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-3.5 |
| **优先级** | P0 |
| **关联代码** | `EarthCivilization.allocateWorkers()` (EarthCivilization.ts:L92-L98) |

**测试步骤：**

1. 初始默认比例：30/30/30 (采矿/工厂/文化)
2. 记录 miningWorkers, factoryWorkers, cultureWorkers, idleWorkers
3. 验证总和 = idlePopulation (初始 65)
4. 验证分配公式：`floor(idleWorkers * ratio / 90)`
5. 修改 miningRatio 为 60, factoryRatio 为 20, cultureRatio 为 10
6. 触发重新分配，验证新的工人分布比例

**预期结果：**
- 三份总和仍等于 idlePopulation
- idleWorkers = 总量 - 已分配量（吸收舍入误差）
- 比例修改后分配即时生效

**注意 (已知问题 B-11)：**
分母硬编码为 90，若三个 ratio 之和 ≠ 90，分配比例会失真。

---

### TC-3.6 逃亡主义增长与影响

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-3.6 |
| **优先级** | P1 |
| **关联代码** | `EarthCivilization.processTreachery()` (EarthCivilization.ts:L294-L300) |

**测试步骤：**

1. 新一局，验证 treachery=0
2. 推进 50 回合，每 10 回合记录一次 treachery
3. 验证每回合随机增长 0~2
4. 验证上限为 100（不会溢出）
5. 当 treachery > 80 时验证控制台有警告
6. 验证 treachery 对采矿和工厂产出的惩罚：`产出 *= (100-treachery)/100`

**预期结果：**
- 每回合随机增量在 [0,2] 范围内
- 上限 100 有效
- 惩罚系数正确应用到经济产出

---

## 4. 科技树系统测试

### TC-4.1 科技研究进度推进

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-4.1 |
| **优先级** | P0 |
| **关联代码** | `EarthCivilization.processTechResearch()` (EarthCivilization.ts:L213-L252) |

**测试步骤：**

1. 打开部门面板，选择"宇宙社会学"部门
2. 在科技树中点击"宇宙社会学基础"开始研究
3. 验证经济被扣除对应 cost
4. 推进回合，验证 `currentWorkload` 每回合递增
5. 验证公式：`基础进度 = 10 + floor(部长science/10)`
6. 等待研究完成，验证 `finished=true`
7. 验证完成科技后，后续依赖节点变为可研究状态

**预期结果：**
- 进度条正确显示 currentWorkload/totalWorkload
- 完成后节点状态变为 finished
- 依赖节点的前置检查正确

---

### TC-4.2 智子封锁对科研的影响

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-4.2 |
| **优先级** | P0 |
| **关联代码** | `Game.isSophonBlocked()` (Game.ts:L75-L87), `processTechResearch()` (L213-L252) |

**测试步骤：**

1. 游戏进行到 year=10，智子封锁生效
2. 开始研究任意科技
3. 推进回合，记录每回合研究进度
4. 验证进度被大幅削减：`progress = max(1, floor(progress / 10))`
5. 完成"550W量子计算机"或"智子工程"后
6. 再次研究科技，验证进度恢复正常

**预期结果：**
- 智子封锁期间，科研进度降至原来的 1/10（至少为 1）
- 完成反制科技后封锁解除，进度恢复

---

### TC-4.3 五条科技树完整性验证

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-4.3 |
| **优先级** | P0 |
| **关联代码** | `TecTreeManager` (TecTreeManager.ts:L19-L161) |

**测试步骤：**

1. 遍历 PHYSICS 树：验证 19 个节点，从"天文观测"到"黑域生成"
2. 遍历 AEROSPACE 树：验证 23+ 个节点，从"化学推进"到"新家园选址"
3. 遍历 MILITARY 树：验证 10 个节点，从"氢弹基础"到"二向箔武器化"
4. 遍历 INFORMATION 树：验证 15 个节点，从"计算机基础"到"数字方舟"
5. 遍历 INTERSTELLAR 树：验证 9 个节点
6. 验证每棵树的父子引用关系完整性
7. Console 验证：
```js
const mgr = window.game.earthCivi.tecTreeManager;
mgr.trees.forEach((tree, type) => {
  console.log(`Tree ${type}: ${tree.nodes.size} nodes`);
  tree.nodes.forEach((node, name) => {
    if (node.parentName && !tree.nodes.has(node.parentName))
      console.warn(`Orphan node: ${name}, parent ${node.parentName} not found`);
  });
});
```

**预期结果：**
- 每棵树节点数符合预期
- 无孤立节点（所有 parentName 引用的节点存在）
- 每个胜利条件所需的终极科技可达

---

### TC-4.4 科技节点经济花费验证

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-4.4 |
| **优先级** | P1 |
| **前置条件** | 有足够经济开始研究 |

**测试步骤：**

1. 对每条科技树的每个节点，点击开始研究
2. 记录扣款前 economy，点击研究后再记录
3. 验证扣除金额 = node.cost
4. 经济不足时尝试研究，验证按钮禁用或被阻止

**预期结果：**
- 花费正确扣除
- 经济不足时无法开始研究
- economy 不会变为负数

---

## 5. 军事与战斗系统测试

### TC-5.1 舰队 vs 军营战斗模拟

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-5.1 |
| **优先级** | P0 |
| **关联代码** | `CombatEngine.resolveFleetVsBarback()` (CombatEngine.ts:L7-L57) |

**测试步骤：**

1. Console 创建测试舰队和军营进行模拟战斗
2. 验证最多 5 轮战斗
3. 记录每轮攻防伤害计算：
   - 攻击伤害 = floor(atkPower × dice × (1+round×0.1)), dice∈[0.8,1.2]
   - 防御伤害 = floor(defPower × dice), dice∈[0.75,1.25]
4. 验证任意一方 HP≤0 时战斗结束
5. 验证 5 轮未分胜负时 ratio > 1.3 攻击方胜，否则防守方胜

**预期结果：**
- 战力高的舰队胜率显著更高
- 攻防骰子范围正确
- 僵局判定逻辑正确

**Console 验证脚本：**
```js
// 测试战斗 1000 次统计胜率
let wins = 0;
for (let i = 0; i < 1000; i++) {
  const fleet = createFleet('test', '地球', 4, 5, 1);
  fleet.weapons = [{ weaponName: '恒星级战舰', currentBuild: 100 }];
  const barback = createBarback('test_def', 5);
  barback.soldierCount = 200;
  if (CombatEngine.resolveFleetVsBarback(fleet, barback)) wins++;
}
console.log(`Fleet win rate: ${wins / 10}%`);
```

---

### TC-5.2 将领加成计算

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-5.2 |
| **优先级** | P1 |
| **关联代码** | `CombatEngine.calculateFleetPower()` (CombatEngine.ts:L78-L98) |

**测试步骤：**

1. 创建有将领和无将领的舰队各一支
2. 计算战力差
3. 验证领导加成公式：`bonus = 1 + leader.army × 0.1 + leader.leadership × 0.05`
4. 用不同 army/leadership 属性的人物重复测试

**预期结果：**
- 将领属性越高，战力加成越大
- 无将领时 bonus = 1.0 (无加成)

---

### TC-5.3 远征战斗流程完整测试

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-5.3 |
| **优先级** | P0 |
| **前置条件** | 已建造并派遣舰队 |

**测试步骤：**

1. 通过 UI 建造并派遣舰队（目标可选木星）
2. 记录舰队 ETA
3. 每回合检查 ETA 递减
4. ETA 降至 0 时验证战斗触发
5. 战斗胜利：验证目标星球归属变更
6. 战斗失败：验证舰队被移除
7. 攻击无防御星球时验证 temp_def 100兵力的默认防御

**预期结果：**
- ETA 每回合递减 1
- 到达时自动触发 CombatEngine
- 胜利时 starIndices 正确更新
- 失败时舰队从 earthCivi.fleets 中删除

---

### TC-5.4 武器战力计算

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-5.4 |
| **优先级** | P1 |
| **关联代码** | `CombatEngine.calculateFleetPower()` (CombatEngine.ts:L80-L87) |

**测试步骤：**

1. 验证不同类型武器的倍率：
   - 水滴/探测器：×20
   - 战舰/恒星级：×15
   - 其他：×10
2. 使用不同 currentBuild 的武器测试冗余战力计算

**预期结果：**
- 倍率计算正确
- 包含字符串"水滴"的武器名被正确识别为高倍率

**注意(已知问题 B-34)：**
字符串匹配可能导致误判，需确认武器命名规范。

---

## 6. 异星文明AI系统测试

### TC-6.1 五种AI人格行为验证

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-6.1 |
| **优先级** | P0 |
| **关联代码** | `AlienCivilization` 各类 `*Behavior` 方法 (AlienCivilization.ts:L74-L145) |

**测试步骤：**

对每种人格分别创建新游戏环境进行 200 回合模拟观察：

**HUNTER (三体)：**
1. 验证攻击冷却：5+rand(6) 回合
2. 验证攻击概率 18%
3. 验证威慑纪元 30% 概率跳过攻击
4. 验证威慑率 ≥ 90 时不攻击

**CLEANER (歌者)：**
1. 验证攻击冷却：3+rand(4) 回合
2. 验证攻击概率 12%
3. 验证威慑率 ≥ 70 时不攻击

**EXPANSIONIST (边缘世界)：**
1. 验证殖民行为：14% 概率抢占无人行星
2. 验证威慑率 < 80 时方可扩张

**DEFENSIVE (魔戒/归零者)：**
1. 验证每回合 army +5
2. 验证不主动攻击（仅 5% 日志记录）

**OPPORTUNIST：**
1. 验证友好时 8% 索要地球 10% 经济
2. 验证威慑率 < 50 时 25% 概率进攻

**预期结果：**
- 各 AI 行为符合人格描述
- 威慑度对行为有正确约束作用
- 攻击冷却机制有效

---

### TC-6.2 异星文明经济增长

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-6.2 |
| **优先级** | P1 |
| **关联代码** | `AlienCivilization.growEconomy()` (AlienCivilization.ts:L36-L39) |

**测试步骤：**

1. 记录所有异星文明的初始 resource 和 army
2. 推进 100 回合，每 20 回合记录
3. 验证 resource 每回合 +rand(10)
4. 验证 army 每回合 +2
5. 验证 12% 概率 +[5,14] 人口

**预期结果：**
- 异星文明随时间增长
- 资源、军力、人口自然递增
- 防御型文明军力增长更快（+5/回合）

---

### TC-6.3 异星舰队攻击地球流程

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-6.3 |
| **优先级** | P0 |
| **关联代码** | `AlienCivilization.launchFleetAttack()` (AlienCivilization.ts:L138) |

**测试步骤：**

1. Console 注入强制三体发动攻击
2. 验证舰队被创建出发
3. 追踪 ETA 递减
4. 到达后验证防御方军营兵力 = 500 + earthCivi.army
5. 验证战斗结果：胜利后地球人口降至 30%
6. 失败后验证攻击舰队被清理

**预期结果：**
- 攻击舰队正确创建
- 到达时触发正确兵力的防御
- 胜利/失败结果正确

**注意(已知问题 B-17/B-20)：**
sourceStarIndex 硬编码为 0；占领后未立即触发 Game Over 检查。

---

### TC-6.4 全文明征服判定

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-6.4 |
| **优先级** | P0 |
| **关联代码** | `AlienCiviManager.isAllCiviConquered()` (AlienCivilization.ts:L200-L207) |

**测试步骤：**

1. 逐一通过 Console 设 `alien.starIndices.clear()` 模拟消灭异星文明
2. 每消灭一个，调用 `isAllCiviConquered()` 检查返回值
3. 全部消灭后验证返回 true
4. 验证征服胜利被触发

**预期结果：**
- 部分消灭时返回 false
- 全部消灭时返回 true
- 胜利条件正确触发

---

## 7. 事件叙事系统测试

### TC-7.1 固定年份事件触发

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-7.1 |
| **优先级** | P0 |
| **关联代码** | `GameEventManager.checkEvents()` (GameEventManager.ts:L320) |

**测试步骤：**

1. 从 year=0 开始，逐步推进到 year=2
2. 验证 year=0: "联合政府授权"事件触发
3. 验证 year=2: "古筝行动"事件触发
4. 验证 year=10: "智子封锁"事件触发
5. 验证 year=50: "月球危机"事件触发
6. 验证 year=300: "流浪地球计划"事件触发
7. 验证每个事件只触发一次（hasTriggered 标志）

**预期结果：**
- 固定事件在正确年份触发
- 不会重复触发
- 事件模态框正确展示对话内容

---

### TC-7.2 随机事件触发

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-7.2 |
| **优先级** | P1 |
| **关联代码** | `GameEventManager.checkRandomEvents()` (GameEventManager.ts:L331-L362) |

**测试步骤：**

1. 推进 500 回合，记录所有触发的随机事件
2. 统计事件类型分布
3. 验证：随机事件按纪元 (CRISIS/DETERRENCE/BROADCAST/BUNKER/GALAXY) 正确过滤
4. 验证：有 reqTech 条件的事件仅在科技完成后触发
5. 验证：事件概率与配置一致

**预期结果：**
- 随机事件池正确过滤
- 纪元匹配准确
- reqTech 前置检查有效
- 事件不重复触发（通过概率和标记防止）

---

### TC-7.3 条件过滤事件触发

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-7.3 |
| **优先级** | P0 |
| **关联代码** | `GameEventManager.seedFilteredEvents()` (GameEventManager.ts:L107-L213) |

**对 7 个条件事件逐一验证：**

| 事件 ID | 触发条件 | 验证内容 |
|---------|---------|---------|
| `wallfacer_election` | year 10-50, CRISIS, culture≥30 | 文化达标后触发面壁者选拔 |
| `deterrence_establishment` | year≥50, CRISIS, 黑暗森林威慑, deterrence≥50 | 威慑达标后触发 |
| `sophon_blockade` | year 10-200, CRISIS, 无 sophon_broken flag | 智子封锁生效 |
| `wandering_earth_decision` | year≥100, CRISIS, 行星发动机基础 | 科技完成后触发辩论 |
| `alien_first_contact` | year≥80, CRISIS, 50光年远镜 | 科技完成后触发接触事件 |
| `rebellion_crisis` | year≥60, treachery≥30, CRISIS | 逃亡主义高时触发叛乱 |
| `sophon_countermeasure` | year≥30, 550W量子计算机, 无 flag | 完成反制科技后触发 |

**预期结果：**
- 条件全部满足时才触发
- 冷却机制有效（cooldownYears 后重新可触发）
- Flag 因果链正确（设置 flag 影响后续事件）

---

### TC-7.4 Flag 因果链系统

| 属性 | 内容 |
|------|------|
| **测试ID** | TC-7.4 |
| **优先级** | P1 |
| **关联代码** | `Game.addFlag/hasFlag/removeFlag` (Game.ts:L62-L70) |

**测试步骤：**

1. 在事件选项中选择影响 Flag 的选项
2. Console 验证 flag 被正确设置：
```js
console.log(window.game.hasFlag('sophon_broken'));
console.log([...window.game.flags]);
```
3. 验证依赖该 flag 的后续事件触发/不触发
4. 验证存档后 flag 持久化

**预期结果：**
- Flag 在 Set 中正确存储
- hasFlag 返回正确的 boolean
- Flag 在存档/读档后完整恢复

---

### TC-