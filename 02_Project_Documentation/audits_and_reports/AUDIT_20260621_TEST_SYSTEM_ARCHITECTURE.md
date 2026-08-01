# LegendOfUni 测试系统架构审计报告

> **文档编号**: AUDIT_20260621_TEST_SYSTEM_ARCHITECTURE  
> **生成日期**: 2026-06-21  
> **分类前缀**: `AUDIT_` (审计分析与研究报告)  
> **文档版本**: V1.0  
> **审计类型**: 测试系统能力评估与缺口分析  

---

## 一、审计概述

本次审计旨在全面评估当前测试系统的端到端测试能力，识别能力缺口，为后续测试体系演进提供决策依据。

---

## 二、测试系统架构总览

### 2.1 技术栈

| 组件 | 技术 | 版本 |
|---|---|---|
| 测试框架 | Vitest | ^4.1.6 |
| DOM 模拟 | jsdom | (via vitest) |
| UI 测试库 | @testing-library/react + @testing-library/jest-dom | ^6.x |
| 覆盖率收集 | @vitest/coverage-v8 | ^4.1.6 |
| **E2E 框架** | **Playwright (已安装未配置)** | **^1.61.0** |

### 2.2 测试层级分布

| 层级 | 文件数 | 测试用例数 | 占比 |
|---|---|---|---|
| 单元测试 (core/) | ~30 | ~650 | ~79% |
| 集成测试 (integration/) | 3 | ~75 | ~9% |
| 自动回合模拟 (e2e/) | 1 | 5 | ~1% |
| UI 组件测试 (components/) | 2 | ~50 | ~6% |
| 数据验证 (data/) | 1 | ~20 | ~2% |
| 工具函数 (utils/) | 1 | ~25 | ~3% |
| **总计** | **~39** | **~825** | **100%** |

### 2.3 配置详情

见 [vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts#L202-L217)：

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  testTimeout: 60000,
  coverage: {
    provider: 'v8',
    thresholds: { statements: 70, branches: 60, functions: 70, lines: 70 }
  }
}
```

测试脚本见 [package.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/package.json#L7-L14)：

| 命令 | 用途 |
|---|---|
| `vitest run` | 全量测试（CI） |
| `vitest` | 监听模式（开发） |
| `vitest --ui` | UI 面板 |
| `vitest run --coverage` | 覆盖率报告 |
| `vitest run src/test/core` | 仅核心层测试 |

---

## 三、端到端测试能力评估

### 3.1 已实现的能力

#### 3.1.1 游戏逻辑端到端

[Autoplay500.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e/Autoplay500.test.ts) 实现了游戏逻辑层面的准端到端测试：

| 能力 | 实现方式 |
|---|---|
| 确定性 RNG | `game.setRngProvider({ random: () => 0.9 })` |
| 回合推进 | `runTurns(game, N)` — 循环调用 `game.runARound()` |
| 事件自动处理 | `processAllEvents()` — 自动选第一个选项，直到年份推进 |
| 结束保护 | 游戏结束自动停止，最大尝试次数防止死循环 |
| 状态断言 | 资源非负、游戏不崩溃、科技进展、纪元推进 |

#### 3.1.2 跨系统集成

[EventChain.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/integration/EventChain.test.ts) 覆盖了完整的数据流链路：

```
Event → Flag → Tag → Resource → Ecology → Atmosphere → History
```

#### 3.1.3 存档往返验证

[SaveLoad.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/integration/SaveLoad.test.ts) 验证：
- `saveGame()` → `loadGame()` 往返完整性
- 篡改检测（哈希校验）
- 损坏 JSON 容错
- 存档版本管理

### 3.2 已安装但未接入的能力

Playwright (`^1.61.0`) 已存在于 `dependencies` 中，但**未配置、未使用**：

```
package.json                            → playwright ^1.61.0 ✓
playwright.config.ts                    → ✗ 不存在
src/test/e2e/*.spec.ts                  → ✗ 不存在
```

### 3.3 能力缺口矩阵

| 缺口类型 | 当前状态 | 影响 | 弥补难度 |
|---|---|---|---|
| **真实浏览器渲染** | jsdom 模拟，无真实布局/CSS/Canvas | 无法测试 UI 视觉完整性 | 低（Playwright 已就绪） |
| **用户交互模拟** | 程序化调用事件选项，无真实点击/输入 | 无法测试 UI 交互流程 | 低（Playwright 可补） |
| **视觉回归** | 无截图对比 | 无法捕捉视觉 Bug | 中（需 CI 配基线） |
| **跨浏览器测试** | 仅在 Node.js 单环境运行 | 无法发现浏览器兼容性问题 | 低（Playwright 多引擎） |
| **性能测试** | 无帧率/内存/加载耗时检测 | 无法检测性能退化 | 中（需专用工具） |
| **网络层测试** | 无实际 HTTP 调用验证 | 无法测试 NetworkFirst 等缓存策略 | 中 |
| **可访问性测试** | 无 axe-core 检测 | 无法保障残障用户支持 | 低（Playwright 集成） |
| **负载/压力测试** | 无 | 无法验证高回合数稳定性 | 高 |

### 3.4 已有覆盖但强度不足的领域

| 领域 | 现有覆盖 | 不足 |
|---|---|---|
| **UI 组件测试** | Tutorial.test.tsx (8个case) + UIComponents.test.tsx | 仅测试渲染和基础交互，未覆盖移动端断点、暗色模式 |
| **事件因果链** | EventChain.test.ts (5个模块) | 测试用例使用手动 `addFlag` 而非真实事件 JSON 执行 |

---

## 四、与业界标准对比

### 4.1 测试金字塔对照

```
         ┌──────────┐
         │   E2E    │  ← 当前缺口最大（仅逻辑端对端）
         │  UI 层   │
         │  集成层  │  ← EventChain + SaveLoad + UEE_FullFlow
       ┌─│ 单元层   │─┐
       │ │ ~650用例 │ │
       │ └──────────┘ │
       └──────────────┘
    覆盖率门槛: 语句70% / 分支60%
```

### 4.2 业界推荐 vs 当前状态

| 指标 | 行业推荐 | 当前状态 | 评估 |
|---|---|---|---|
| 单元测试覆盖率（语句） | ≥80% | ≥70%（门槛） | 接近达标 |
| 集成测试比例 | 约20% | 约9% | 偏低 |
| E2E 测试比例 | 约10% | 约1%（仅逻辑） | 严重不足 |
| 测试执行时间 | <5min | ~30s | 优秀 |
| 视觉回归 | 应有 | 无 | 严重不足 |
| 浏览器矩阵 | 3+ 引擎 | 1（jsdom） | 不足 |

---

## 五、结论与建议

### 5.1 核心结论

1. **逻辑层端到端已有**：Autoplay500 + EventChain 覆盖了完整的游戏逻辑链路（回合→事件→资源→科技→纪元→结果），这是正确的核心竞争力测试策略。
2. **UI 层端到端缺失**：Playwright 已安装但未配置，无法验证真实浏览器环境下的用户交互路径。
3. **测试执行效率优秀**：825 个用例约 30s 完成，CI 友好度极高。

### 5.2 后续建议（按优先级排序）

**P0 — UI 层 E2E 补齐**
- 添加 `playwright.config.ts`，配置 Chromium/Firefox/WebKit 引擎
- 覆盖核心用户路径：新游戏 → 选选项 → 回合推进 → 科技研究 → 结局触发
- 利用现有 Autoplay500 的 `runTurns()` 基础设施

**P1 — 测试覆盖率提升**
- 语句覆盖率门槛从 70% 提升至 80%
- 集成测试比例从 9% 提升至 20%
- 补齐 TagManager → Event 的集成测试（当前 TagManager 与事件集成的条件字段 `reqTag`/`reqNotTag` 无对应测试用例）

**P2 — 视觉回归与性能**
- 接入 `@playwright/test` 截图对比能力，建立视觉基线
- 添加帧率/FPS 监控，检测 UI 动画性能退化