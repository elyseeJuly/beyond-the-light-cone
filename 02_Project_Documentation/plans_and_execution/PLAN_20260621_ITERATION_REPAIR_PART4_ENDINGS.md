# 迭代修复计划 - Part 4：胜利条件与结局系统断链修复
> **Date**: 2026-06-21  
> **Status**: Planned  
> **Category**: Iteration Plan (`PLAN_`)

本阶段解决游戏最致命的产品欺诈级别风险：宣称的多种结局由于代码实现脱节而无法触达的问题。

## 1. 风险与缺陷响应矩阵

| 风险/Bug | 问题描述 | 核心诉求 | 计划模块 |
|:---|:---|:---|:---|
| **P0** | 胜利条件逻辑断链，`digital_ark_upgrade` 等关键 Flag 从未赋值，导致结局完全不可达。 | 梳理结局触发树，补全所有 Flag 赋值逻辑。 | 结局条件状态机修复 |
| **Bug 3** | 部分结局在任意纪元均可触发，缺乏时代限制。 | 结局判定引入“纪元窗口期（Epoch Window）”限制。 | 纪元限定判定模块 |

---

## 2. 详细实施方案

### 2.1 结局标志位赋值与链路补全 (P0)

**现状问题**：
游戏代码中包含检查 `game.flags.has('digital_ark_upgrade')` 的判断，但全局搜遍代码，没有任何事件或科技的产出（effect）去执行 `game.flags.add('digital_ark_upgrade')`，导致这些分支成为死代码。

**修复计划**：
1. **全局链路审计**：
   - 根据设计文档，梳理 10 种结局对应的前置条件 Flag 清单。
   - 建立对照表：`结局 -> 必需 Flag -> 产出该 Flag 的具体事件/科技/决策`。
2. **植入产出源 (Sources)**：
   - 在对应的决策树或重大事件文件中（如 `EventData.ts` 或 `DecisionTree.ts`），明确补全这些 Flag 的赋值操作。
   - 例如：当玩家研发完成“意识上传技术”并投入资源后，在完成回调中注入：`eventSystem.setFlag('digital_ark_upgrade', true)`。
3. **编写探针测试**：
   - 编写专门的单元测试，模拟获取特定的科技/触发特定事件，断言 Flag 是否被正确置为 true，以及最终是否能成功触发对应结局。

### 2.2 结局触发的“纪元窗口期”约束 (Bug 3)

**现状问题**：
例如“威慑建立”结局如果在“掩体纪元”还能触发，将导致严重的世界观崩塌。当前判定缺少对当前纪元的限制。

**修复计划**：
1. **扩充 EndingSchema 定义**：
   - 为每个结局配置对象增加 `allowedEras: string[]` 或 `minEra / maxEra` 字段。
   ```typescript
   export interface EndingConfig {
     id: string;
     title: string;
     requiredFlags: string[];
     // 新增约束
     allowedEras: EraType[]; 
   }
   ```
2. **结局判定引擎重构**：
   - 在每回合检查胜利条件时（`VictoryConditionChecker`），除了验证指标和 Flag，还必须验证 `allowedEras.includes(currentEra)`。
   - 若某结局的允许纪元已过（玩家错过了窗口期），向系统静默记录“该结局已锁定”，避免重复计算，同时增加玩家重开的复玩价值。
3. **补充提示机制**：
   - 在某些关键纪元末期，如果玩家距离某个只能在该纪元达成的结局很近，可以通过内阁/角色的“情报提示”进行隐晦暗示，以免错过。
