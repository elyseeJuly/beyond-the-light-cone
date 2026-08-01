# 测试系统审计报告

> **审计日期**: 2026-06-24
> **审计范围**: `03_Web_Rebuild/src/test/` 全量 + 覆盖率实跑 + 新功能测试缺口分析
> **审计方法**: 目录结构分析 + 覆盖率实跑 + 新功能源码与测试对照
> **基准文档**: [AUDIT_20260624_TEST_SYSTEM_AND_E2E_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_TEST_SYSTEM_AND_E2E_AUDIT.md)

---

## 一、测试系统总体架构

### 1.1 分层结构

| 层级 | 目录 | 文件数 | 总行数 | 框架 |
|------|------|--------|--------|------|
| 单元测试 | `src/test/core/` | 30 | ~8500 | Vitest + jsdom |
| 组件测试 | `src/test/components/` | 2 | 409 | Vitest + Testing Library |
| 集成测试 | `src/test/integration/` | 4 | 910 | Vitest |
| 配置测试 | `src/test/config/` | 1 | 21 | Vitest |
| 数据测试 | `src/test/data/` | 1 | 343 | Vitest |
| 工具测试 | `src/test/utils/` | 1 | 138 | Vitest |
| E2E（Vitest 伪） | `src/test/e2e/` | 1 | 178 | Vitest（无浏览器） |
| E2E（Playwright） | `src/test/e2e-playwright/` | 4 spec + 1 helpers | 378 | Playwright |
| **合计** | — | **45** | **~10,900** | — |

### 1.2 实跑验证结果

| 命令 | 结果 |
|------|------|
| `npx vitest run` | **833/833 通过**（40 个测试文件） |
| `npx vitest run --coverage` | 通过，覆盖率见第三章 |
| `npx playwright test` | **未能实跑**（环境代理拦截 localhost + baseURL 路径不匹配） |

---

## 二、新功能测试覆盖缺口（核心问题）

### 2.1 AP/AI 智脑系统 — ❌ 无专门测试

**新增源码**：

| 文件 | 行号 | 新增方法 |
|------|------|---------|
| [EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts) | 49-98 | `canSpendAP()` / `spendAP()` / `recoverAP()` / `setResearchTarget(costAP)` / 工种比例调整（消耗 AP） |
| [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) | 213-276 | `runAIBrain()` / `getTurnBlockers()` |
| [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) | 315-327 | 回合阻断器检查 + AI 智脑调用集成 |

**测试覆盖**：**无专门测试**。

全量 grep `src/test/` 搜索 `runAIBrain|getTurnBlockers|actionPoint|aiBrain|canSpendAP|spendAP|recoverAP`，仅 [HistoryGenerator.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/HistoryGenerator.test.ts) 出现 `TAG_APPLIED`（标签应用，与 AP 指令点无关，缩写巧合）。

**风险**：
- AP 消耗逻辑错误会破坏游戏经济平衡（玩家无限 AP 或无法消耗）
- `runAIBrain()` 错误会破坏回合推进
- `getTurnBlockers()` 错误会卡死游戏（玩家无法推进回合）

### 2.2 事件实体化（4 种新效果）— ❌ 完全无测试

**新增源码**：[EventSystem.ts:146-229](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L146-L229)

| 效果类型 | 行号 | 功能 |
|---------|------|------|
| `spawn_barback` | 146 | 生成 Barback 实体 |
| `lock_ratio` | 174 | 锁定工种比例 |
| `rush_tech` | 183 | 加速科技研发 |
| `build_infrastructure` | 196 | 建造基础设施 |

**测试覆盖**：**完全无测试**。全量 grep `src/test/` 搜索 4 种效果名，返回空。

**风险**：
- 新效果是事件系统的核心扩展，错误会破坏事件触发链
- 4 种效果涉及资源/科技/建造多系统交互，错误会引发连锁 bug

### 2.3 Barback 实体 — ❌ 无专门测试

**新增源码**：[Barback.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Barback.ts)（46 行，事件实体化产生的新实体类型）

**测试覆盖**：**无 Barback.test.ts**。源文件清单有 Barback.ts，测试文件清单无对应测试。

### 2.4 新功能测试缺口汇总

| 新功能 | 源码位置 | 专门测试 | 判定 |
|--------|---------|---------|------|
| AP 指令点系统 | EarthCivilization.ts:49-98 | 无 | ❌ |
| AI 智脑托管 | Game.ts:213-276 | 无 | ❌ |
| 回合阻断器 | Game.ts:276, 315 | 无 | ❌ |
| 事件效果 spawn_barback | EventSystem.ts:146 | 无 | ❌ |
| 事件效果 lock_ratio | EventSystem.ts:174 | 无 | ❌ |
| 事件效果 rush_tech | EventSystem.ts:183 | 无 | ❌ |
| 事件效果 build_infrastructure | EventSystem.ts:196 | 无 | ❌ |
| Barback 实体 | Barback.ts | 无 | ❌ |

**8 项新功能，0 项有专门测试。**

---

## 三、覆盖率实跑结果

### 3.1 核心文件覆盖率

| 文件 | 语句覆盖 | 分支覆盖 | 函数覆盖 | 行覆盖 | 问题 |
|------|---------|---------|---------|--------|------|
| **EventSystem.ts** | 66.09% | **53.06%** | 87.5% | 64.47% | 新效果 142-229 行未覆盖 |
| **EarthCivilization.ts** | 72.32% | **56.35%** | 82.85% | 75.22% | AP 方法未覆盖 |
| **Game.ts** | 69.64% | 67.99% | 81.57% | 71.8% | runAIBrain/getTurnBlockers 未覆盖 |
| SaveManager.ts | 59.33% | 52.45% | 78% | 62.85% | 存档路径覆盖不足 |
| SaveSchema.ts | 57.14% | 25% | 60% | 66.66% | 校验逻辑覆盖不足 |
| IndexedDBStorage.ts | 23.28% | 25% | 14.63% | 22.9% | 严重不足 |
| StarManager.ts | 62.68% | 45.45% | 80% | 61.53% | 中等 |
| StatisticsManager.ts | 38.46% | 47.61% | 69.23% | 37.93% | 严重不足 |
| TecTreeManager.ts | 86.86% | **22.22%** | 90% | 88.63% | 分支覆盖极低 |

### 3.2 覆盖率阈值配置

[vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts) 配置的阈值：

| 维度 | 阈值 | 实际整体 | 是否达标 |
|------|------|---------|---------|
| 语句覆盖 | 70% | ~72% | ✅ 勉强达标 |
| 分支覆盖 | 60% | ~68% | ✅ 勉强达标 |
| 函数覆盖 | 70% | ~80% | ✅ 达标 |
| 行覆盖 | 70% | ~73% | ✅ 勉强达标 |

**问题**：整体覆盖率勉强达标，但新功能所在文件（EventSystem.ts 分支 53%、EarthCivilization.ts 分支 56%）**低于阈值**。CI 仍通过，说明阈值检查可能未配置为 fail-on-miss，或整体平均稀释了局部缺口。

### 3.3 覆盖率盲区

以下文件覆盖率严重不足，但未被 CI 阻断：

| 文件 | 语句覆盖 | 风险 |
|------|---------|------|
| IndexedDBStorage.ts | 23.28% | 存档底层存储几乎无测试 |
| StatisticsManager.ts | 38.46% | 统计系统无测试 |
| SaveSchema.ts | 57.14% | 存档校验逻辑覆盖不足 |
| SaveManager.ts | 59.33% | 存档管理覆盖不足 |

**存档系统是 Beta 红线相关模块，但底层覆盖率极低。** IndexedDBStorage.ts 仅 23% 覆盖，意味着存档的浏览器本地存储路径几乎无测试保障。

---

## 四、E2E 测试问题

### 4.1 CI 不跑 Playwright（最严重）

[.github/workflows/ci.yml](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/.github/workflows/ci.yml) 的 CI 流程：

```
checkout → setup-node 20 → npm ci → tsc --noEmit → vitest run → vitest run --coverage → npm run build → upload coverage
```

**CI 只跑 Vitest，不跑 Playwright。** 4 个 Playwright spec（11 个测试）从未在 CI 中执行。

### 4.2 baseURL 路径不匹配

| 配置项 | 值 | 来源 |
|--------|-----|------|
| Playwright baseURL | `http://localhost:4173/beyond-the-light-cone/` | [playwright.config.ts:22](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/playwright.config.ts#L22) |
| Vite base（本地非 CF_PAGES） | `./` | [vite.config.ts:153](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts#L153) |
| preview server 根路径 | `/` | Vite 默认 |

**路径不匹配**：Playwright 访问 `/beyond-the-light-cone/`，但 preview 根路径是 `/`。这是 webServer 超时 120s 的原因之一。

### 4.3 事件弹窗测试脆弱

[core-flow.spec.ts:97-101](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/core-flow.spec.ts#L97-L101)：

```typescript
// 20 回合未触发事件即视为通过
if (no event in 20 turns) return;  // 实际未验证任何东西
```

该测试几乎不会失败，无论事件系统是否正常工作。

### 4.4 Autoplay500 是伪 E2E

[Autoplay500.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e/Autoplay500.test.ts) 虽在 `e2e/` 目录，但：
- 无浏览器、无 DOM、无 UI
- 直接调用 `game.runARound()` 纯逻辑
- 本质是"长链路集成测试"

### 4.5 E2E 覆盖盲区

| 路径 | 重要性 | E2E 覆盖 |
|------|--------|---------|
| 新游戏 → 教程 → 首回合 | 高 | ✅ tutorial-guided |
| 视图切换 | 中 | ✅ core-flow |
| 移动端响应式 | 中 | ✅ responsive |
| 事件弹窗交互 | 高 | ⚠️ 脆弱 |
| **存档/读档** | **致命** | ❌ 无 |
| **结局触发** | **致命** | ❌ 无 |
| **科技树研发** | 高 | ❌ 无 |
| **战斗系统** | 高 | ❌ 无 |
| **AP/AI智脑（新功能）** | 中 | ❌ 无 |
| **事件实体化（新功能）** | 中 | ❌ 无 |

---

## 五、测试系统健康度评估

### 5.1 优点

1. **分层完整**：单元/组件/集成/E2E 四层齐全
2. **工具链现代**：Vitest 4 + Playwright 1.61 + Testing Library 16
3. **覆盖率配置**：语句 70% / 分支 60% / 函数 70% / 行 70% 阈值
4. **helpers 抽象**：E2E 公共函数复用良好
5. **浏览器矩阵**：5 种浏览器/设备配置
6. **确定性 RNG**：Autoplay500 用固定随机种子保证可复现

### 5.2 缺点

| 缺点 | 严重度 | 影响 |
|------|--------|------|
| **新功能零测试覆盖** | 致命 | AP/AI智脑/事件实体化 8 项新功能无专门测试 |
| **CI 不跑 Playwright** | 致命 | E2E 无门禁，UI 回归无保障 |
| **EventSystem 分支覆盖 53%** | 高 | 新效果逻辑无验证 |
| **EarthCivilization 分支覆盖 56%** | 高 | AP 逻辑无验证 |
| **IndexedDBStorage 覆盖 23%** | 高 | 存档底层无保障 |
| **baseURL 路径不匹配** | 高 | E2E 可能从未在本地成功跑过 |
| **事件弹窗测试脆弱** | 高 | 几乎不会失败，无实际验证价值 |
| **存档/结局/战斗无 E2E** | 高 | 致命路径无 UI 层验证 |
| **覆盖率阈值未强制 fail** | 中 | 局部缺口被整体平均稀释 |
| **Autoplay500 命名误导** | 中 | 高估 E2E 覆盖 |

---

## 六、优化建议

### 6.1 必须补的测试（按优先级）

| 优先级 | 测试项 | 理由 | 预期提升 |
|--------|--------|------|---------|
| **P0** | EventSystem 4 种新效果单元测试 | 新功能核心逻辑，分支覆盖仅 53% | EventSystem 分支 → 75%+ |
| **P0** | AP 系统单元测试（spendAP/canSpendAP/recoverAP） | 资源消耗逻辑，错误会破坏游戏平衡 | EarthCivilization 分支 → 70%+ |
| **P1** | runAIBrain() 单元测试 | AI 托管逻辑，错误会破坏回合推进 | Game.ts 分支 → 70%+ |
| **P1** | getTurnBlockers() 单元测试 | 回合阻断逻辑，错误会卡死游戏 | Game.ts 分支 → 72%+ |
| **P1** | Barback 实体单元测试 | 新实体类型，无测试 | 新增 100% 覆盖 |
| **P2** | AP + 存档集成测试 | AP 状态是否正确存档/读档 | SaveManager 覆盖提升 |
| **P2** | 事件实体化 + 存档集成测试 | 新效果产生的实体是否正确存档 | SaveManager 覆盖提升 |
| **P2** | IndexedDBStorage 单元测试 | 存档底层覆盖仅 23% | IndexedDBStorage → 60%+ |

### 6.2 测试配置优化

1. **将 Playwright 纳入 CI**：在 ci.yml 增加 `npx playwright install` + `npx playwright test` 步骤
2. **修复 baseURL**：将 [playwright.config.ts:22](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/playwright.config.ts#L22) 的 baseURL 改为 `http://localhost:4173/`
3. **修复事件弹窗测试**：[core-flow.spec.ts:97-101](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/core-flow.spec.ts#L97-L101) 的"20 回合无事件即通过"应改为失败或用固定事件触发
4. **覆盖率阈值强制 fail**：配置 `coverage.thresholds` 为 fail-on-miss，防局部缺口被整体稀释
5. **新增源文件测试约定**：建立"新增源文件必须新增测试文件"的约定（Barback.ts → Barback.test.ts）

### 6.3 补充致命路径 E2E

| E2E 测试 | 覆盖路径 | 优先级 |
|---------|---------|--------|
| 存档/读档 E2E | 存档 → 读档 → 状态一致 | P0 |
| 结局触发 E2E | 触发条件 → 结局 CG → 结局结算 | P0 |
| 科技树研发 E2E | 选择科技 → 消耗 AP → 解锁节点 | P1 |
| 战斗系统 E2E | 舰队组建 → 战斗结算 | P1 |
| AP/AI智脑 E2E | AP 消耗 → AI 托管 → 回合推进 | P2 |

---

## 七、结论

### 7.1 测试系统真实状态

- **Vitest 层**：833 测试通过，覆盖旧代码，但新功能零覆盖
- **Playwright 层**：4 spec 11 测试代码完整，但从未在 CI 执行，且本地因路径问题无法验证
- **新功能保障力**：**零**。AP/AI智脑 + 事件实体化 8 项新功能无任何专门测试
- **致命路径保障力**：**低**。存档/结局/战斗无 E2E 覆盖

### 7.2 核心判断

**测试系统需要优化。** 833 测试通过只覆盖了旧代码，新功能的分支覆盖低至 53%。新功能在无验证状态下上线，等于在流沙上盖楼。

### 7.3 紧急行动

1. **立即补 EventSystem 4 种新效果 + AP 系统的单元测试**（P0）
2. **将 Playwright 纳入 CI + 修复 baseURL**（P0）
3. **补充存档/读档 + 结局触发 E2E**（P0）

---

## 八、审计核实记录

### 8.1 本次亲自核实项

| 核实项 | 方法 | 结果 |
|--------|------|------|
| 测试文件清单 | `find src/test -name "*.test.*"` | 45 文件 |
| 源文件清单 | `find src/core -name "*.ts"` | 39 文件 |
| AP 测试覆盖 | grep `runAIBrain\|actionPoint\|canSpendAP\|spendAP\|recoverAP` in src/test/ | 仅 HistoryGenerator.test.ts（无关） |
| 事件实体化测试覆盖 | grep `spawn_barback\|lock_ratio\|rush_tech\|build_infrastructure` in src/test/ | 空 |
| Barback 测试 | 查找 Barback.test.ts | 不存在 |
| 覆盖率 | `npx vitest run --coverage` | EventSystem 分支 53% / EarthCivilization 分支 56% |
| CI 配置 | 读 ci.yml | 只跑 vitest，不跑 playwright |
| Playwright baseURL | 读 playwright.config.ts:22 | `/beyond-the-light-cone/` 与 preview 根路径 `/` 不匹配 |

### 8.2 关键数据

- 新功能源码：EarthCivilization.ts +150 行 / Game.ts +101 行 / EventSystem.ts 4 种新效果 / Barback.ts 46 行
- 新功能测试：0 文件
- 新功能覆盖率：EventSystem.ts 分支 53.06% / EarthCivilization.ts 分支 56.35%
- E2E CI 执行：从未

---

**审计完成。**

核心结论：测试系统对新功能的保障力为零。833 测试通过只覆盖旧代码，AP/AI智脑 + 事件实体化 8 项新功能无任何专门测试，EventSystem 分支覆盖低至 53%。测试系统需要优化。
