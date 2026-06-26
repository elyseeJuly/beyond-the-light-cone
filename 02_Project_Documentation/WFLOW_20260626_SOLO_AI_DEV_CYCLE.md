# 独立开发者 × AI 协同开发工作循环 (Solo AI Dev Cycle)

> **版本号 (Version)**: V1.0.0  
> **生效日期 (Effective Date)**: 2026-06-26  
> **适用对象 (Target)**: 独立开发者、AI 协同智能体  
> **设计背景**: 本文档从实际项目经验中提炼，针对"一人开发 + 多AI协助"的复杂系统项目（游戏/应用）。解决的核心问题是：AI会话之间的记忆断裂、文档膨胀、以及"测试全绿但Bug很多"的质量幻觉。  
> **上位规范**: [AI 驱动协同开发 SOP V2.0](file:///Users/quantumrose/Documents/Emberois/emberois-dev-standards/specifications/SPEC_20260520_AI_DEVELOPMENT_SOP.md)、[全局开发标准 V1.2.0](file:///Users/quantumrose/Documents/Emberois/emberois-dev-standards/specifications/SPEC_20260626_GLOBAL_DEVELOPMENT_STANDARDS.md)

---

## 一、总体架构：双层体系

```
┌─────────────────────────────────────────────────┐
│           Layer 2: Governance（治理层）           │
│             "项目有没有偏离方向"                    │
│                                                 │
│  _health.md         设计漂移检测                  │
│  反事实审计          架构债管理                    │
│  零信任审计 SOP      设计 vs 实现一致性            │
│                                                 │
│  触发时机：里程碑节点 / 每周一次                    │
│  核心问题："我们在做对的东西吗？"                   │
├─────────────────────────────────────────────────┤
│           Layer 1: Workflow（工作流层）            │
│             "每天的工作怎么推进"                    │
│                                                 │
│  _registry.md    RED → GREEN 循环                │
│  3 AI 模式        会话启动协议                    │
│  EXEC_ 三位一体   发布标准                        │
│                                                 │
│  触发时机：每次 AI 会话                            │
│  核心问题："下一个要修的东西是什么？"               │
└─────────────────────────────────────────────────┘
```

**Workflow 保证效率，Governance 保证方向。**

---

## 二、Layer 1：Workflow（日常工作流）

### 2.1 核心循环：Red Ticket → Green Commit

```
  玩家遇到问题 / 审计发现缺陷 / 设计漂移
              │
              ▼
  ┌──────────────────────┐
  │   Red Writer 写测试   │  ← 测试必须是 RED 的
  │   加入 _registry.md   │
  └──────────┬───────────┘
              │
              ▼
  ┌──────────────────────┐
  │    Fixer 修复代码     │  ← 目标：让测试变 GREEN
  │    更新 _registry.md  │
  └──────────┬───────────┘
              │
              ▼
  ┌──────────────────────┐
  │  Gatekeeper 跑全部   │  ← 确认没有回归
  │  场景测试            │
  └──────────┬───────────┘
              │
              ▼
       Git Commit
```

**每张票的唯一退出条件：测试从红变绿，且无回归。**

### 2.2 三个 AI 模式

不是8个独立角色，是同一个AI的3种工作状态。对应的 Prompt 模板见 [Prompt 字典 V1.1](file:///Users/quantumrose/Documents/Emberois/emberois-dev-standards/specifications/SPEC_20260626_PROMPT_DICTIONARY.md)。

| 模式 | 合并自（SOP V2.0 角色） | 职责 | 触发词 |
| :--- | :--- | :--- | :--- |
| **Red Writer** | Test Designer + QA Bot | 接收症状描述，输出一个当前会失败的场景测试文件 | "帮我写一个会失败的测试，症状是……" |
| **Fixer** | Builder + Fixer | 读取失败的测试，定位根因，修复代码，让测试变绿 | "读 `_registry.md`，找第一个 RED，修复它" |
| **Gatekeeper** | Auditor + Validator | 运行全部场景测试，报告回归情况 | "跑全部 scenario 测试，告诉我哪些是 RED" |

> [!IMPORTANT]
> **Red Writer 的核心约束：先红后绿。** 如果写出来的测试当前就是绿的，说明这个测试没有价值——它没有在验证任何真实存在的问题。Red Writer 必须在提交测试后运行它，确认它确实失败。

### 2.3 会话启动协议

每次打开AI对话（不论使用哪个AI），**第一步固定**：

```
读 src/test/scenarios/_registry.md，
告诉我当前 RED 数量和 GREEN 数量，
以及下一个需要处理的 RED 是什么。
```

这一行替代了阅读所有历史 AUDIT_ 和 EXEC_ 文档的时间。AI 通过 registry 获得完整的项目质量状态，不需要任何其他上下文。

### 2.4 _registry.md 结构

位置：`src/test/scenarios/_registry.md`

```markdown
# Scenario Registry — 场景测试注册表
> 最后更新：[日期]
> 发布条件：所有条目为 GREEN

## 发布状态：🔴 未就绪（X RED / Y 总计）

| ID   | 类型 | 场景名称 | 玩家路径 / 测试描述 | 状态  | 对应问题 | 测试文件 |
|------|------|---------|-------------------|-------|---------|---------|
| S01  | Scenario | 旧存档迁移不死锁 | 加载v3存档→推进10回合 | GREEN | Bug1 ✅ | s01_save_migration.test.ts |
| S02  | Scenario | AI托管可取消 | 开启→关闭→推进回合 | RED | Bug2 | s02_ai_brain_toggle.test.ts |
| D01  | Design Drift | 纪元需双条件 | culture高+year低→不推进 | RED | 设计偏离 | d01_epoch_dual_condition.test.ts |
| CF01 | Counterfactual | 从不研究科技 | 0科技→完整一局 | RED | 压力测试 | cf01_no_tech_research.test.ts |
| R01  | Regression | 纪元死锁防回归 | 修复后的死锁路径 | GREEN | Bug1 ✅ | r01_epoch_deadlock_regression.test.ts |

## 变更日志
- [日期]: [条目ID] 从 [旧状态] 变为 [新状态]（[原因]）
```

**Registry 条目类型定义：**

| 前缀 | 类型 | 定义 | 来源 | 数量建议 |
| :--- | :--- | :--- | :--- | :--- |
| `S` | **Scenario** | 真实玩家路径的完整流程测试 | 玩家反馈、体验测试 | 核心路径全覆盖 |
| `R` | **Regression** | 曾修复的 Bug 防止复发 | 每个修复的 Bug 自动产生一个 R | 与修复的 Bug 数 1:1 |
| `D` | **Design Drift** | 代码实现偏离了设计文档的意图 | Governance 层审计发现 | 按需 |
| `CF` | **Counterfactual** | 极端条件下的压力/破坏性测试 | 反事实审计 | **上限 5 个** |

> [!WARNING]
> **Counterfactual 上限 5 个。** 每个 CF 可以衍生出无限的 "what-if"，对于需要发布的项目，无限制的反事实探索是伪装成工作的拖延。只保留最极端、最可能暴露系统性问题的 5 条。新增 CF 必须替换掉已有的低价值 CF。

### 2.5 发布标准

```
发布条件 = _registry.md 中所有条目的状态为 GREEN
```

不是"测试通过率100%"，不是"覆盖率达标"，不是主观判断"没有P0 bug"。

**就是 registry 全绿。**

> [!NOTE]
> 现有的 833 个单元测试仍然是安全网，CI 中必须全部通过。但它们不是发布标准。发布标准只看 registry。

### 2.6 测试目录结构

```
src/test/
├── core/              ← 保留不动，现有单元测试
├── integration/       ← 保留不动，现有集成测试
├── e2e/               ← 保留不动，Autoplay500
├── e2e-playwright/    ← 保留不动，Playwright E2E
│
├── scenarios/         ← 新增，场景化测试的核心位置
│   ├── _registry.md              ← 所有条目的 RED/GREEN 状态
│   ├── _health.md                ← 项目健康仪表盘
│   ├── setup.scenario.ts         ← 场景测试专用 setup（不 mock 内部链路）
│   ├── helpers/
│   │   └── ScenarioDriver.ts     ← 场景驱动器（驱动不绕过）
│   ├── fixtures/
│   │   └── saves.ts              ← 各版本存档样本工厂
│   │
│   ├── s01_save_migration.test.ts
│   ├── s02_ai_brain_toggle.test.ts
│   ├── d01_epoch_dual_condition.test.ts
│   ├── cf01_no_tech_research.test.ts
│   └── r01_epoch_deadlock_regression.test.ts
│
├── components/        ← 保留不动
├── config/            ← 保留不动
├── data/              ← 保留不动
├── simulation/        ← 保留不动
├── utils/             ← 保留不动
└── setup.ts           ← 保留不动，现有单元测试的 setup
```

> [!IMPORTANT]
> `setup.ts`（现有）和 `setup.scenario.ts`（新增）分开。现有 833 个测试继续使用原有 setup，不受影响。场景测试使用独立的 setup，不 mock dispatchEvent/addEventListener/CustomEvent。

---

## 三、Layer 2：Governance（治理层）

### 3.1 _health.md 结构

位置：`src/test/scenarios/_health.md`

```markdown
# Project Health Dashboard — 项目健康仪表盘
> 最后审视：[日期]
> 审视周期：每周一次 或 里程碑节点

## 总体健康：🟡（2 🔴 / 3 🟡 / 4 🟢）

| 维度 | 指标 | 状态 | 具体数据 | 建议行动 |
|------|------|------|---------|---------|
| 架构 | 单文件最大行数 | 🟡 | Game.ts 1599行 | 超过1000行建议拆分 |
| 架构 | Flag 系统耦合度 | 🔴 | 23个模块引用 flags | 引入 Flag Manager |
| 性能 | 1000事件压力测试 | 🟢 | 通过 | — |
| 性能 | 内存泄漏检测 | 🟡 | 未测 | 需要长局测试 |
| 内容 | 设计文档 vs 代码一致性 | 🟡 | 3处偏离 | 已登记为 D01-D03 |
| 内容 | 12结局可达性 | 🟢 | 全部可达 | — |
| 体验 | 新手教程完成率 | 🟡 | 未实测 | 需要真人测试 |
| 文档 | 文档总数 | 🔴 | 181份 | 停止为 bug 写文档 |

## 审视日志
- [日期]: [变更说明]
```

**_health.md 与 _registry.md 的区别：**

| | _registry.md | _health.md |
| :--- | :--- | :--- |
| 回答的问题 | 现在能发布吗？ | 发布后会出事吗？ |
| 条目状态 | RED / GREEN（二元） | 🟢 / 🟡 / 🔴（三级） |
| 条目性质 | 每个对应一个测试文件 | 不对应测试，是人的判断 |
| 更新频率 | 每次修复后立即更新 | 每周或里程碑时审视 |
| 受众 | AI（任务队列） | 人（决策参考） |

### 3.2 Governance 触发时机

Governance 不是每次会话都做。做太频繁会回到"审计→文档→再审计"的循环。

| 触发条件 | Governance 动作 |
| :--- | :--- |
| **每周固定一次** | 更新 `_health.md`，审视各维度状态 |
| **里程碑节点**（如 Beta 发布前） | 执行零信任审计 SOP 全流程 |
| **Registry 全绿时** | 在发布前做一次完整 Governance 审视 |
| **新增重大功能后** | 检查是否产生了新的 Design Drift |

> [!WARNING]
> **Governance 不是日常工作的一部分。** 日常工作只看 _registry.md。如果每天都在做 Governance，说明工作模式出了问题——应该在修 bug，不是在审计。

### 3.3 Design Drift 检测

Design Drift 是 Governance 层发现的问题，但一旦发现，就转化为 Registry 中的一个 `D` 类型条目（如果可测试）或 _health.md 中的一个条目（如果不可测试）。

**检测方法**：
1. 取一份 SPEC_ 设计文档
2. 取对应的代码实现
3. 让AI对比："设计说X，代码做的是Y，两者一致吗？"
4. 不一致 → 是否可写成测试？→ 是 → 加入 registry 为 `D` 类型
5. 不一致 → 不可测试 → 记入 _health.md

### 3.4 反事实审计

反事实审计是 Governance 层的高级工具，用于探测系统在极端条件下的行为。

**执行规则**：
- 每次 Governance 审视时，最多新增 1 个 CF
- Registry 中 CF 条目总数不超过 5 个
- 新 CF 加入时，如果已有 5 个，必须替换掉价值最低的
- CF 的价值排序标准：暴露的系统性问题越深层，价值越高

---

## 四、与现有 SOP 的关系

本文档不替代 [AI 驱动协同开发 SOP V2.0](file:///Users/quantumrose/Documents/Emberois/emberois-dev-standards/specifications/SPEC_20260520_AI_DEVELOPMENT_SOP.md)，而是在其基础上针对独立开发者场景进行适配：

| SOP V2.0 内容 | 本文档处理 |
| :--- | :--- |
| 8 角色智能体矩阵 | 折叠为 3 模式（适配单人+AI） |
| 8 阶段 E2E Pipeline | 保留，但日常只执行 Stage 3-6（测试→开发→审计→修复） |
| EXEC_ 三位一体 | 保留，提高触发门槛（见全局标准 V1.2.0） |
| 零信任漏斗审计 | 保留，移至 Governance 层，里程碑触发 |
| AI 编码行为准则 | 保留不变，全文适用 |

---

## 五、快速参考卡片

### 日常工作（每次 AI 会话）
```
1. 读 _registry.md → 了解当前状态
2. 找第一个 RED → 确定今天的任务
3. Fixer 模式修复 → 测试变 GREEN
4. Gatekeeper 跑全量 → 确认无回归
5. 更新 _registry.md → Git commit
```

### 周度治理（每周一次）
```
1. 更新 _health.md → 审视各维度
2. 检查 Design Drift → 新发现的转为 D 类条目
3. 评估 CF 价值 → 是否需要替换
4. 人工体验测试 → 补充体验维度
```

### 发布检查
```
1. _registry.md 全 GREEN ✅
2. _health.md 无 🔴 项 ✅（🟡 可接受）
3. CI 全量测试通过 ✅
4. 手动 Playwright E2E 通过 ✅
5. 至少一次完整人工试玩 ✅
```