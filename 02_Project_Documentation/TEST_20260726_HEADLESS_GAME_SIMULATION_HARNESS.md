# TEST_20260726_HEADLESS_GAME_SIMULATION_HARNESS

> **文档标题**：《光锥之外：纪元往事》统一测试系统与 Headless Game Simulation Harness 方案  
> **文档版本**：V1.0 Draft  
> **日期**：2026-07-26  
> **证据截止提交**：`8c4cf47c14c6673b8b38f26e0c21ba01a7ac8da4`  
> **适用工程**：`03_Web_Rebuild/`  
> **关联材料**：
> - `AUDIT_20260621_TEST_SYSTEM_ARCHITECTURE.md`
> - `REPORT_20260622_TEST_SYSTEM_FIX.md`
> - `AUDIT_20260712_EPOCH_CHAIN_AUDIT/AUDIT_20260712_METHODOLOGY_RETROSPECTIVE.md`
> - `src/test/e2e/Autoplay500.test.ts`
> - `src/test/scenarios/_registry.md`
> - `src/test/scenarios/_health.md`
>
> 本文不是重新推翻现有测试体系，而是把已有的 Vitest、场景测试、审计回归、Autoplay 和 Playwright 统一为一套可维护、可追踪、可分级执行的工程系统。

---

## 一、执行结论

《光锥之外》目前已经拥有规模可观的自动化测试资产，但仍缺少一个真正独立、可扩展、可复现的“无界面游戏模拟层”。

当前所谓 `Autoplay500` 更准确地说是：

- 一个由 Vitest 执行的逻辑层长流程测试；
- 固定使用 `random() => 0.9`；
- 固定选择第一个事件选项；
- 最长用例实际运行 100 回合，而非一次完整的 500 回合模拟；
- 主要验证“不崩溃、资源非负、出现事件、科技有进展、纪元能推进”；
- 不记录随机种子、策略、行为轨迹、结局分布、事件覆盖率或失败复现信息。

因此，它已经证明了“核心 Game 可以脱离 React UI 运行”，但还不是完整的 Headless Game Simulation Harness。

新的测试系统应明确区分：

1. **Vitest 单元与集成测试**：验证规则、模块、审计修复点。
2. **Headless Simulation Harness**：批量运行完整游戏状态机，验证长期稳定性、因果可达性、策略路径与统计分布。
3. **Playwright E2E**：验证真实浏览器中的玩家操作、布局、存档、弹窗、导航与发布版本。
4. **人工/AI 审计**：验证叙事、策略意义、体验反馈、设计意图和未知问题。

无界面模拟器应作为独立测试层存在。它由 Vitest 或 CLI 驱动，但不应继续被归类为浏览器 E2E。

---

## 二、现有测试体系审计

### 2.1 已有基础

当前工程已具备：

| 能力 | 当前实现 |
|---|---|
| 单元测试 | Vitest，主要位于 `src/test/core/` |
| 集成测试 | `src/test/integration/`，覆盖事件链、存档往返、UEE 全流程等 |
| 场景/回归测试 | `src/test/scenarios/`，采用 `SCEN-*` 注册表管理 |
| 审计回归测试 | `AuditFixRegression.test.ts`，以 FIX/AR/SYS 编号锁定审计修复 |
| 逻辑长流程测试 | `src/test/e2e/Autoplay500.test.ts` |
| 浏览器 E2E | Playwright，桌面 Chromium/Firefox/WebKit + Mobile Chrome/Safari |
| 覆盖率门禁 | statements 70%、branches 60%、functions 70%、lines 70% |
| CI | TypeScript、Vitest、Coverage、Build、Playwright、报告上传 |
| 严格运行模式 | `Game.strictMode`，测试期间可令被吞异常重新抛出 |
| RNG 注入 | `setRngProvider()`，已具备可控随机性的接口基础 |
| 活文档 | `_registry.md` 与 `_health.md` |

项目健康文档记录的最新测试基线为 **1074 条测试全部通过**，场景注册表包含 **22 个 GREEN 条目**。这些资产不是要被替代，而是新体系的输入。

### 2.2 当前体系的主要优点

#### A. 核心逻辑已经基本脱离 UI

`Game` 可以在 Node/jsdom 环境直接实例化并运行回合，这是建设模拟器最关键的前提。无需重写整套游戏，只需建立适配层。

#### B. 已经具备确定性与严格错误检测的雏形

- `setRngProvider()` 可注入随机源；
- `Game.strictMode` 可阻止异常被静默吞掉；
- `assertNoWarnings()` 已开始检查历史日志中的子系统警告。

这三点可以直接成为模拟器的基础设施。

#### C. 审计编号体系成熟

历史审计形成了 `AR-*`、`SYS-*`、`FIX-*`、`SCEN-*` 等编号，且部分修复已经转化为回归测试。测试系统可以沿用这些编号，不必重新发明缺陷追踪体系。

#### D. 浏览器 E2E 已覆盖多引擎与移动端

Playwright 已具备失败截图、视频、trace、重试和五类设备/浏览器项目，适合继续承担真实玩家界面流程验证。

### 2.3 当前体系的关键缺口

#### 缺口 1：`Autoplay500` 名称与实际能力不一致

当前文件包含 10、20、30、100 回合测试，但没有一次明确的 500 回合运行，也没有 500 个随机种子的批量模拟。

这会造成两种误解：

- “500”究竟是 500 回合、500 局，还是历史命名；
- README 所称“500 回合 Headless 自动推演”是否仍与代码一致。

建议废止以数字命名测试能力，改为明确的运行模式：`smoke`、`regression`、`balance`、`soak`、`reachability`。

#### 缺口 2：随机覆盖实际上很窄

当前 RNG 恒定返回 `0.9`，注释也明确说明这会减少随机事件。它适合作为一个稳定回归样本，但不适合验证随机事件池、低概率异常、事件组合与结局分布。

真正的模拟器需要：

- 可复现的种子随机数；
- 多种种子集合；
- 失败种子持久化；
- 精确重放命令。

#### 缺口 3：只有一种玩家策略

当前事件统一选择第一个选项，无法代表真实玩家，更无法验证：

- 不同科技路线；
- 不同结局路线；
- 保守/激进/探索/军事/经济策略；
- 故意做出边界选择的对抗策略；
- 某些分支是否事实上永远不会被选择或到达。

#### 缺口 4：断言偏向“没有崩溃”，缺少长期游戏指标

现有断言主要是：

- 资源非负；
- 数值为有限数；
- 至少出现一个事件；
- 科技完成数不下降；
- 纪元可在人工设置高文化与 FLAG 后推进；
- 没有警告日志。

这些断言能发现明显错误，但无法回答历史审计经常提出的问题：

- 某事件是否真实可达；
- 某结局是否存在自然路径；
- 某个纪元是否长期卡死；
- 经济是否滚雪球或永久贫困；
- 某个策略是否压倒其他策略；
- 哪些 FLAG 只写不读；
- 哪些人物/事件永远不出现；
- 某次修复是否改变了长期结局分布。

#### 缺口 5：失败不可复现

当前失败通常只能看到测试栈和最终状态，缺少：

- seed；
- policy；
- 每回合行为；
- 事件选择；
- 状态差异；
- 最后若干步 trace；
- 内容版本与配置摘要。

随机或长流程问题如果不能复现，就会再次退化为人工审计。

#### 缺口 6：场景注册表是人工 Markdown，不是可执行注册表

`_registry.md` 对项目治理很有价值，但目前：

- 条目与测试文件的绑定依赖人工维护；
- 部分条目指向实现文件而非自动化测试；
- “全部 GREEN”无法由测试运行器自动计算；
- 无法检测注册表条目是否失效、测试文件是否被删除、审计证据是否过期。

#### 缺口 7：CI 未区分快速门禁与长时模拟

当前 CI：

1. 运行一次全部 Vitest；
2. 再运行一次全部 Vitest + Coverage；
3. 构建；
4. 安装全部 Playwright 浏览器；
5. 运行全部浏览器 E2E。

问题包括：

- Vitest 重复执行；
- `lint` 已配置但未进入当前 `ci.yml` 门禁；
- 无 simulation smoke / nightly balance / weekly soak 的分层；
- 无 simulation JSON/Markdown artifact；
- 所有 E2E 都放在 PR 路径上，后续扩容会越来越慢。

---

## 三、历史审计工作与自动化转化结论

### 3.1 历史审计已经提供了测试需求库

2026-07-12 纪元因果链审计共形成：

- 27 份审计产物；
- 45 个正式问题；
- 7 个系统性问题；
- 28 个死 FLAG；
- 13 项代码修复；
- 19 个回归测试；
- 18 个仍需运行时验证的 UC 项。

方法论回顾已经明确指出：

- 静态分析不能闭环运行时问题；
- 人工因果链追踪存在“没想到就不会检查”的盲区；
- 死 FLAG、因果可达性、未读取字段应工具化；
- UC 项应接入 Autoplay 长时运行与断言；
- 审计文档需要绑定提交与自动验证。

因此，新模拟器并不是额外增加工作，而是把历史审计中反复出现的人工任务转成持续执行的程序。

### 3.2 审计结论的测试层分配

| 审计问题类型 | 自动化归属 |
|---|---|
| 公式、边界、字段、状态变化 | Vitest 单元测试 |
| Event→Flag→Tag→纪元/结局链 | Vitest 集成/场景测试 |
| 审计修复不回退 | FIX/AR/SYS 回归测试 |
| 多回合资源、纪元、事件演化 | Headless Simulation |
| 事件/结局是否可达 | Headless Reachability |
| 多策略是否形成不同结果 | Headless Policy Matrix |
| UI 是否能完成真实操作 | Playwright E2E |
| 移动端遮挡、弹窗、焦点、导航 | Playwright E2E |
| 叙事是否成立、策略是否有意义 | 人工/AI 审计 + 玩家试玩 |
| 游戏是否“好玩” | 不应伪装成自动断言；由体验审计和数据共同判断 |

### 3.3 审计与测试的新闭环

```text
人工/AI 审计发现问题
        ↓
登记 AUDIT / AR / SYS / SCEN ID
        ↓
判断可自动化层级
        ↓
单元 / 场景 / 模拟 / E2E 测试
        ↓
CI 或定时任务持续执行
        ↓
失败输出 seed + trace + 状态差异
        ↓
修复并加入 regression seed bank
```

审计不再被测试取代；测试负责保存已知结论，审计继续寻找未知问题。

---

## 四、新统一测试系统

### 4.1 六层模型

| 层级 | 名称 | 主要工具 | 目标 |
|---|---|---|---|
| T0 | Static & Data Contract | TypeScript、ESLint、Zod、静态扫描脚本 | 类型、Schema、死引用、数据完整性 |
| T1 | Unit | Vitest | 函数、公式、类、边界、不变量 |
| T2 | Integration / Scenario / Regression | Vitest | 跨模块链路、SCEN、AR/SYS/FIX 回归 |
| T3 | Headless Simulation | Vitest + Simulation Harness | 多回合、多种子、多策略、长期稳定与可达性 |
| T4 | Browser E2E | Playwright | 真实用户路径、浏览器、移动端、存档、发布冒烟 |
| T5 | Experience Audit | 人工试玩、AI 审计、埋点分析 | 策略意义、叙事、节奏、反馈、美术、理解成本 |

### 4.2 关键边界

- T3 不渲染 React，不访问真实 DOM，不点击页面。
- T3 可以调用完整 `Game` 状态机，但所有行为必须经统一适配器完成。
- T4 不负责穷举数值和结局，只守住玩家生命线。
- T5 的结论可以产生新的自动测试，但不能被自动测试完全替代。

---

## 五、Headless Game Simulation Harness 架构

### 5.1 总体结构

```text
SimulationSuite
  ├─ SimulationConfig
  ├─ SeededRng
  ├─ GameSimulationAdapter
  ├─ Policy
  ├─ InvariantSet
  ├─ MetricCollector
  ├─ TraceRecorder
  └─ Reporter
         ↓
      RunResult
         ↓
 JSON / Markdown / JUnit / failed-seed-bank
```

### 5.2 核心接口

```ts
export interface SimulationConfig {
  seed: number;
  policyId: string;
  maxTurns: number;
  maxActionsPerTurn: number;
  stopOnViolation: boolean;
  recordTrace: 'none' | 'failures' | 'all';
}

export interface SimulationObservation {
  turn: number;
  year: number;
  epoch: string;
  resources: Record<string, number>;
  flags: string[];
  availableActions: SimulationAction[];
  currentEventId?: string;
  isTerminal: boolean;
  endingId?: string;
}

export interface SimulationAction {
  id: string;
  kind: 'turn' | 'event-choice' | 'research' | 'assignment' | 'build' | 'diplomacy' | 'system';
  payload?: unknown;
}

export interface SimulationPolicy {
  id: string;
  choose(observation: SimulationObservation, rng: SeededRng): SimulationAction;
}

export interface SimulationInvariant {
  id: string;
  severity: 'fatal' | 'error' | 'warning';
  check(previous: SimulationObservation | null, current: SimulationObservation): InvariantViolation[];
}

export interface RunResult {
  seed: number;
  policyId: string;
  contentVersion: string;
  completedTurns: number;
  terminalReason: 'ending' | 'max-turns' | 'violation' | 'stalled' | 'exception';
  endingId?: string;
  metrics: SimulationMetrics;
  violations: InvariantViolation[];
  warnings: string[];
  trace?: SimulationTraceEntry[];
}
```

### 5.3 GameSimulationAdapter

适配器是整个方案的核心。它负责把当前 `Game` 的具体 API 封装成稳定测试协议。

建议职责：

```ts
interface GameSimulationAdapter {
  create(config: SimulationConfig): Game;
  observe(game: Game): SimulationObservation;
  listLegalActions(game: Game): SimulationAction[];
  applyAction(game: Game, action: SimulationAction): void;
  resolvePendingEvents(game: Game, policy: SimulationPolicy): void;
  isTerminal(game: Game): boolean;
  snapshot(game: Game): unknown;
  restore(snapshot: unknown): Game;
}
```

适配器必须禁止测试代码散落调用私有方法。以后 `Game.ts` 重构时，只修改 Adapter，不需要修改所有策略和指标。

### 5.4 确定性随机系统

当前固定 `0.9` 只能保留为 `legacy-stable` 策略，不再作为唯一随机源。

新随机系统要求：

1. 每次运行必须有整数 seed；
2. 同一 commit、同一内容版本、同一 seed、同一 policy 必须产生同一 trace；
3. 禁止核心逻辑直接使用不可控 `Math.random()`；
4. 时间相关逻辑不得依赖不可控 `Date.now()`；
5. 失败报告必须输出 replay 命令。

示例：

```bash
npm run test:sim:replay -- --seed 184725 --policy deterrence-route
```

### 5.5 Policy 策略库

第一阶段至少提供：

| Policy ID | 目标 |
|---|---|
| `legacy-first-choice` | 保留当前 Autoplay 行为，作为兼容基线 |
| `random-legal` | 在所有合法行为中按 seed 选择，扩大组合覆盖 |
| `balanced` | 维持资源、科研、军事与稳定度的均衡策略 |
| `research-first` | 优先科技与高阶路线，检查科技树及后期结局 |
| `deterrence-route` | 主动追踪威慑相关前置条件与事件 |
| `escape-route` | 主动追踪曲率/流亡/黑域/掩体路线 |
| `aggressive` | 偏军事与风险选择，检查战争和失败分支 |
| `adversarial-boundary` | 尽量把资源压到边界、拖延关键决策、触发阻断器 |
| `branch-seeker` | 优先选择尚未覆盖的事件/FLAG/Tag/科技 |
| `scripted-regression` | 根据 AR/SYS/SCEN 编号执行固定步骤 |

Policy 不是“智能 AI 玩家”，而是覆盖不同状态空间的测试探针。

### 5.6 不变量体系

不变量用于回答“无论玩家采用什么策略，都不应发生什么”。

#### 基础数值不变量

- 核心数值必须为有限数，禁止 `NaN`/`Infinity`；
- 当前设计规定不可为负的资源不得为负；
- 枚举、索引、年份与纪元值必须处于合法范围；
- AP、资源、人口等上限/下限遵循权威 SPEC。

#### 状态机不变量

- 一次完整回合必须进入终局、推进年份或产生明确阻断原因；
- 单回合事件处理不得超过安全上限；
- 游戏终局后不得继续普通回合；
- 纪元不得非法倒退；
- 纪元入口 FLAG 与上游写入链必须一致；
- 一次性事件不得重复触发；
- 已死亡或未解锁人物不得在不允许的事件中发言。

#### 事件与因果不变量

- 事件选择只能来自当前合法选项；
- 事件收尾后 `currentEvent`、队列、年份推进状态必须一致；
- `reqFlag`/`reqTag`/`reqTech` 未满足时事件不得触发；
- 关键 FLAG 写入后应存在可识别的消费路径；
- 不允许生成新的“有写无读”关键 FLAG。

#### 存档不变量

- snapshot→restore 后关键状态等价；
- Set/Map/FlagManager 引用关系正确；
- 同一 snapshot 恢复后继续执行，结果与未中断运行一致；
- 存档版本迁移不得丢失审计定义的关键字段。

#### 审计不变量

- 每个 `AR/SYS/FIX/SCEN` 自动化条目必须存在测试或明确标注 `manual-only`；
- 自动化测试文件删除或改名时，注册表校验失败；
- 证据绑定 commit 过期后产生 warning，而非继续假装有效。

### 5.7 指标体系

不变量判断“错没错”，指标用于观察“游戏长期变成了什么”。

建议收集：

| 类别 | 指标 |
|---|---|
| 运行 | 完成回合、年份推进、停滞次数、每回合动作数、运行耗时 |
| 资源 | 各资源 min/max/mean/P10/P50/P90、归零次数、溢出次数 |
| 纪元 | 各纪元进入率、进入年份分布、停留时长、不可达纪元 |
| 内容 | 事件覆盖率、关键事件覆盖、人物出现率、FLAG/Tag/科技覆盖 |
| 策略 | 各 policy 终局率、生存率、结局分布、阻断率 |
| 结局 | 结局可达数、各结局触发率、前置条件缺失原因 |
| 稳定性 | 异常数、警告数、不变量违反数、事件安全上限耗尽次数 |
| 存档 | 往返差异数、恢复后 trace 分叉数 |

第一阶段不应立即把所有分布指标设成硬门禁。应先记录基线，再根据多个稳定版本设定允许漂移范围。

### 5.8 Trace 与失败复现

每条 trace 至少包含：

```ts
interface SimulationTraceEntry {
  step: number;
  turn: number;
  year: number;
  epoch: string;
  action: SimulationAction;
  eventId?: string;
  stateDigestBefore: string;
  stateDigestAfter: string;
  changedFlags: string[];
  changedResources: Record<string, number>;
}
```

失败报告默认保留最后 50 步；完整 trace 只在需要时保存，避免 artifact 过大。

失败输出示例：

```text
SIM-INV-EVENT-QUEUE-STALLED
seed=184725
policy=adversarial-boundary
turn=137 year=226 epoch=DETERRENCE
lastAction=event-choice:chengxin-transfer
replay=npm run test:sim:replay -- --seed 184725 --policy adversarial-boundary
```

---

## 六、模拟运行模式

### 6.1 PR Smoke

目标：快速发现确定性崩溃和核心回归。

初始建议：

- 12 个固定 seed；
- 4 个基础 policy；
- 每局最多 50 回合或进入终局；
- 零 fatal/error invariant violation；
- 零未处理异常；
- 零安全上限耗尽。

### 6.2 Regression Seed Bank

所有历史线上/试玩/审计发现的长流程问题，一旦能复现，就把：

- seed；
- policy；
- 起始 fixture；
- 预期 invariant；
- AR/SYS/SCEN 编号；

加入固定 seed bank，在每个 PR 执行。

### 6.3 Balance Matrix

目标：观察策略与数值分布，不立即等同于“好玩”。

初始建议：

- 500 局，而非单局 500 回合；
- 多 policy × 多 seed；
- 每局运行至结局或 300 回合；
- 输出结局、纪元、事件、资源分布；
- 每晚或手动运行。

### 6.4 Soak Test

目标：寻找内存、状态累积、事件队列、长期数值和极低概率异常。

初始建议：

- 少量种子；
- 每局 1000～2000 回合上限，或终局停止；
- 每周/版本候选运行；
- 记录状态体积、队列长度、历史日志增长、运行时间。

### 6.5 Reachability

目标：回答“事件、人物、科技、纪元、结局是否存在合法可达路径”。

第一阶段使用 policy matrix + 多 seed 统计；第二阶段对关键结局使用有限深度搜索或目标导向 policy。

Reachability 的结论分级：

- `PROVEN_BY_SCRIPT`：固定脚本路径可达；
- `OBSERVED`：模拟中出现过；
- `NOT_OBSERVED`：当前样本未出现，不等于不可达；
- `PROVEN_UNREACHABLE`：静态依赖图或约束求解证明不可达；
- `MANUAL_REVIEW`：需要设计审计。

### 6.6 Replay

任何失败 seed 都必须能够单独运行，不允许依赖整批任务才能重现。

---

## 七、审计注册表机器化

建议新增：

```text
src/test/audit/
  auditRegistry.ts
  auditRegistry.schema.ts
  auditRegistry.validation.test.ts
```

示例：

```ts
export const auditRegistry = [
  {
    id: 'AR-37',
    source: 'AUDIT_20260712_...',
    summary: '无逃逸技术时二向箔打击结局验证',
    layer: 'simulation',
    automation: 'partial',
    suite: 'reachability',
    policies: ['adversarial-boundary', 'escape-route'],
    invariants: ['SIM-INV-DIMENSION-STRIKE-RESOLUTION'],
    evidenceCommit: '...',
    status: 'pending-runtime-validation'
  }
] as const;
```

Markdown `_registry.md` 可以由此自动生成，保留当前易读形式，但数据源改为机器可校验。

---

## 八、建议目录结构

```text
03_Web_Rebuild/src/test/
├── core/                         # T1 单元测试
├── integration/                  # T2 跨模块集成
├── scenarios/                    # T2 玩家场景/设计回归
├── regression/                   # T2 AR/SYS/FIX 固定回归
├── simulation/                   # T3 Headless Harness
│   ├── harness/
│   │   ├── SimulationRunner.ts
│   │   ├── SimulationTypes.ts
│   │   ├── SeededRng.ts
│   │   └── TraceRecorder.ts
│   ├── adapters/
│   │   └── GameSimulationAdapter.ts
│   ├── policies/
│   ├── invariants/
│   ├── metrics/
│   ├── reporters/
│   ├── seed-bank/
│   └── suites/
│       ├── smoke.sim.test.ts
│       ├── regression.sim.test.ts
│       ├── balance.sim.test.ts
│       ├── soak.sim.test.ts
│       └── reachability.sim.test.ts
├── audit/
├── e2e-playwright/               # T4 浏览器 E2E
└── setup.ts
```

现有 `src/test/e2e/Autoplay500.test.ts` 应迁移到 `simulation/suites/legacy.sim.test.ts`，保留行为作为兼容基线，避免突然丢失已有覆盖。

---

## 九、命令体系

建议在 `package.json` 增加清晰入口：

```json
{
  "scripts": {
    "test:unit": "vitest run src/test/core",
    "test:integration": "vitest run src/test/integration",
    "test:scenario": "vitest run src/test/scenarios src/test/regression",
    "test:sim:smoke": "vitest run src/test/simulation/suites/smoke.sim.test.ts",
    "test:sim:regression": "vitest run src/test/simulation/suites/regression.sim.test.ts",
    "test:sim:balance": "SIM_MODE=balance vitest run src/test/simulation/suites/balance.sim.test.ts",
    "test:sim:soak": "SIM_MODE=soak vitest run src/test/simulation/suites/soak.sim.test.ts",
    "test:sim:replay": "tsx scripts/replay-simulation.ts",
    "test:e2e:smoke": "playwright test --project=chromium-desktop --grep @smoke",
    "test:e2e:full": "playwright test",
    "test:ci:pr": "npm run typecheck && npm run lint && npm run test:coverage && npm run test:sim:smoke && npm run test:sim:regression && npm run build && npm run test:e2e:smoke"
  }
}
```

如果不希望新增 `tsx` 依赖，Replay 第一阶段也可以实现为 Vitest 参数化用例；但长期建议保留独立 CLI。

---

## 十、CI 分层方案

### 10.1 Pull Request Gate

必须执行：

1. `typecheck`；
2. `lint`；
3. 全量 Vitest + Coverage（只执行一次）；
4. simulation smoke；
5. regression seed bank；
6. production build；
7. Chromium desktop E2E smoke。

目标：快速、确定、失败可复现。

### 10.2 Main Branch

在 PR Gate 基础上增加：

- 全量 Playwright 五项目；
- 完整场景注册表校验；
- simulation 报告 artifact；
- coverage artifact；
- Playwright trace/video/report。

### 10.3 Nightly

- 500 局 balance matrix；
- 全量 policy × seed 组合；
- Reachability 报告；
- 结局与事件分布漂移比较；
- 失败 seed 自动加入 artifact，等待人工确认后进入固定 seed bank。

### 10.4 Weekly / Release Candidate

- Soak；
- 完整浏览器矩阵；
- 存档恢复分叉测试；
- 所有关键结局 scripted reachability；
- 人工/AI 体验审计清单。

---

## 十一、报告与质量门禁

### 11.1 硬门禁

- 无未处理异常；
- 无 fatal/error invariant violation；
- 固定 regression seed 全部通过；
- 计划运行的回合必须完成、进入终局或给出合法阻断原因；
- 事件处理不得耗尽 safety cap；
- 所有关键状态数值有限；
- snapshot/restore 核心状态等价；
- 审计注册表无悬空测试引用。

### 11.2 软门禁/趋势告警

- 某结局出现率显著漂移；
- 某事件覆盖率下降；
- 某策略长期压倒其他策略；
- 纪元平均停留回合突增；
- 阻断率、资源归零率、平均动作数明显变化；
- 游戏状态序列化体积持续增长。

软门禁先生成 warning，不应在没有稳定基线时阻断开发。

---

## 十二、实施顺序

### P0：统一分类与保留现有行为

1. 将 `Autoplay500` 重命名并迁移为 legacy simulation；
2. 新建 `simulation/` 目录与基础类型；
3. 抽出 `GameSimulationAdapter`；
4. 保持现有 6 个 Autoplay 用例行为不变；
5. 增加完成回合数与 safety cap 耗尽断言。

### P1：可复现 Harness

1. 实现 seeded RNG；
2. 实现 `SimulationRunner`；
3. 实现 trace、state digest 与失败报告；
4. 实现 `legacy-first-choice`、`random-legal`、`balanced`；
5. 实现基础 invariant set；
6. 建立 regression seed bank。

### P2：审计转测试

1. 将 UC-1～UC-18 登记到 machine-readable audit registry；
2. 将可动态验证项转成 simulation invariant/metric；
3. 自动生成 `_registry.md`；
4. 加入死 FLAG/未消费 FLAG 静态扫描；
5. 建立关键纪元与结局 reachability suite。

### P3：统计与 CI

1. 建立 balance matrix；
2. 建立 nightly workflow；
3. 输出 JSON/Markdown/JUnit artifact；
4. 建立版本间 distribution drift 比较；
5. 优化 PR CI，避免 Vitest 重复执行，分离 E2E smoke 与 full。

### P4：体验数据闭环

1. 将人工试玩与 AI 审计发现的可量化问题登记为 metric；
2. 将真实玩家埋点与模拟分布对照；
3. 识别 policy 与真人行为偏差；
4. 保留无法自动化的叙事、反馈、美术与策略意义审计。

---

## 十三、第一阶段验收标准

当以下条件全部满足，才可称为 Headless Game Simulation Harness V1，而不是“更长的 Vitest 用例”：

- [ ] 同一 seed + policy 可 100% 重放；
- [ ] 至少 3 种独立 policy；
- [ ] 所有动作通过 Adapter 执行；
- [ ] 每局输出明确 terminal reason；
- [ ] safety cap 耗尽会失败，而不是静默结束；
- [ ] 失败报告包含 seed、policy、最后 50 步 trace；
- [ ] 至少 10 个核心 invariant；
- [ ] 至少 1 组多 seed smoke suite；
- [ ] 至少 1 组审计问题进入 regression seed bank；
- [ ] 模拟层不依赖 React DOM；
- [ ] CI 能单独运行 simulation smoke；
- [ ] README 不再把逻辑模拟与 Playwright E2E 混为同一层。

---

## 十四、不能被模拟器替代的工作

即使 Harness 完成，以下内容仍需要人工或 AI 审计：

- 玩家是否理解目标；
- 某个选择是否具有真实策略意义；
- 纪元节奏是否拖沓；
- 失败是否公平；
- 角色与事件是否符合叙事逻辑；
- UI 是否具有应有的压迫感、庄严感和反馈重量；
- 结局虽然可达，但路径是否自然；
- 数值分布虽然稳定，但是否有趣。

模拟器提供证据，不负责替设计者做价值判断。

---

## 十五、最终判断

《光锥之外》的测试体系不是“缺测试”，而是：

- 单元和场景测试已经很强；
- 历史审计已经形成高质量问题库；
- Playwright 已经承担真实浏览器流程；
- 现有 Autoplay 证明了核心状态机可以无界面运行；
- 但无界面模拟仍停留在单策略、固定随机、少量断言、无 trace 的原型阶段。

最合理的演进方向不是继续增加零散测试文件，而是把：

```text
审计编号体系
+ Game.strictMode
+ RNG 注入
+ 场景注册表
+ Autoplay 原型
+ Vitest/Playwright CI
```

整合成一个可复现、可扩展、可统计、可回放的 Simulation Harness。

这将使历史审计从“一次性深度检查”转化为“持续运行的游戏规则监测系统”，同时保留人工审计寻找未知问题的价值。