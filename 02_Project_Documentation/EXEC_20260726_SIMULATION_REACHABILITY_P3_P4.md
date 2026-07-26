# EXEC_20260726_SIMULATION_REACHABILITY_P3_P4

> **项目**：《光锥之外：纪元往事》
> **日期**：2026-07-26
> **阶段**：Headless Game Simulation Harness P3–P4
> **前置基线**：PR #5 / Harness V1（P0–P2）

## 一、执行目标

在确定性无界面模拟器之上补齐四项能力：

1. 记录每局实际触发的事件、Flag、纪元与结局；
2. 建立权威 `FLAG` 注册表的生产者/消费者自动扫描；
3. 运行多 seed × 多策略的可达性矩阵；
4. 执行 500 回合级长周期 soak，并持久化 JSON/Markdown 证据报告。

本阶段不把“未观测到”直接判定为“代码不可达”。模拟报告是纪元级主审的证据输入，最终剧情和设计判断仍需结合具体因果链完成。

## 二、实现内容

### 2.1 运行时覆盖观测

`GameSimulationAdapter` 新增覆盖集合：

- `observedEventIds`
- `observedFlags`
- `observedEpochs`
- `observedEndings`

每次事件处理、回合完成与游戏终止时都会采集状态。失败结果仍保留 seed、策略、轨迹与精确重放命令。

### 2.2 多选项覆盖策略

除原有策略外新增：

- `last-choice`：始终选择最后一个选项；
- `cycling-choice`：按确定性游标轮换选择所有可用选项；
- `seeded-random-choice`：基于独立策略 RNG 随机选择；
- `first-choice`：保留稳定基线。

Reachability 与 soak 矩阵会轮换使用四种策略，避免测试长期只覆盖第一个事件选项。

### 2.3 Flag 生产者/消费者扫描

`FlagReachability` 以 `GameFlags.ts` 的 `FLAG` 为权威注册表，并扫描：

- `Game`
- `GameEventManager`
- `EventSystem`
- `EarthCivilization`
- `PlanetEngine`
- `DigitalLife`
- `events.json`
- `randomevents.json`

每个 Flag 被分类为：

| 状态 | 含义 |
|---|---|
| `linked` | 同时找到生产者与消费者 |
| `producer-only` | 有写入证据，没有读取证据 |
| `consumer-only` | 有读取证据，没有写入证据 |
| `orphan` | 未找到明确生产或消费证据 |

扫描器默认只生成证据，不因历史技术债阻塞普通 PR；设置 `SIM_STRICT_FLAGS=1` 后，`consumer-only` 与 `orphan` 会升级为失败门禁。

### 2.4 Reachability 报告

报告聚合：

- 已知/已观测事件；
- 已知/已观测 Flag；
- 七个纪元覆盖；
- 六胜、四败、两中立结局覆盖；
- 未观测节点；
- Flag 链接状态；
- 失败 seed 与重放命令；
- 终止原因、策略与最终纪元分布。

输出位置：

```text
03_Web_Rebuild/reports/simulation/reachability.json
03_Web_Rebuild/reports/simulation/reachability.md
```

### 2.5 Soak 报告

长周期矩阵默认运行 12 局 × 500 回合，检查：

- 运行时异常；
- 不变量破坏；
- 事件处理死锁；
- 回合尝试上限；
- 长周期纪元与结局分布。

输出位置：

```text
03_Web_Rebuild/reports/simulation/soak.json
03_Web_Rebuild/reports/simulation/soak.md
```

## 三、命令

```bash
cd 03_Web_Rebuild

npm run test:simulation:flags
npm run test:simulation:reachability
npm run test:simulation:soak

# 自定义规模
SIM_REACHABILITY=1 \
SIM_REACHABILITY_RUNS=80 \
SIM_REACHABILITY_TURNS=350 \
npx vitest run src/test/simulation/reachability.sim.test.ts

SIM_SOAK=1 \
SIM_SOAK_RUNS=20 \
SIM_SOAK_TURNS=500 \
npx vitest run src/test/simulation/soak.sim.test.ts
```

## 四、CI 分层

Nightly workflow 现在顺序执行：

```text
Typecheck
→ Simulation Lint
→ Balance Matrix
→ Reachability Matrix
→ 500-turn Soak Matrix
→ Upload JSON/Markdown Reports
```

报告工件保留 30 天。普通 PR 仍只运行快速 smoke、全量 Vitest、构建和 Chromium E2E，避免长周期模拟拖慢日常迭代。

## 五、解释边界

### 5.1 未观测不等于不可达

某事件或结局未在当前矩阵出现，可能来自：

- seed 数量不足；
- 策略尚未表达相应路线；
- 目标回合不足；
- 前置科技或人工操作未被自动策略覆盖；
- 真实代码不可达。

报告只负责缩小调查范围，不替代因果链审计。

### 5.2 Flag 扫描不等于完整语义证明

动态 Flag、字符串拼接、间接映射和存档迁移可能无法被原型源码扫描完全识别。因此 `consumer-only`、`producer-only` 与 `orphan` 项需要主审回到代码和设计资料核验。

## 六、后续建议

1. 根据首轮报告，把确认不可达的关键事件和结局转成定向策略；
2. 把已确认的 consumer-only Flag 转成独立回归种子或静态门禁；
3. 为人物登场、离场和死亡建立与 Flag 相同的 producer/consumer 图；
4. 将逐纪元审计报告中的事件链 ID 绑定到 reachability 目标；
5. 仅在证据足够时启用 `SIM_STRICT_FLAGS=1`。
