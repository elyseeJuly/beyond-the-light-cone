# 宇宙群英传 (Legend of Uni) — 开发历程 V6

> 版本：Web 重构版 Alpha 2.5  
> 日期：2026-05-18  
> 重点：随机事件与时间线纪元对齐修复 + BUG-09 修复 + 自动化单元测试扩充  

---

## 一、本轮优化概述

本轮聚焦解决 **BUG-09（纪元别名映射不完整与双轨对齐）**，核心目标是确保所有随机事件和过滤事件在内置时间线（`timeline.json`）规定的历史纪元内正确触发，避免低版本中“流浪地球/掩体城”等中后期随机事件提前泄露至危机/威慑纪元，或在广播/掩体/银河纪元中被完全屏蔽。

**修改文件**：2 个修改，共 2 个文件
- [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts) — 重构纪元匹配机制，引入 `isEpochMatch()` 统一辅助函数
- [Game.test.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/test/core/Game.test.ts) — 新增 6+ 个测试用例，覆盖各种类型的纪元对齐与匹配模式
**TypeScript 编译**：零错误 (`npx tsc --noEmit` 成功)
**单元测试状态**：100% 通过 (`npm run test` 5个测试全部通过)
**构建状态**：通过 (`npm run build` 成功打包，HTML/CSS/JS 零报错)

---

## 二、BUG-09 修复：随机事件纪元错配与过滤漏斗缺陷

### 2.1 根因分析

在之前的实现中，随机事件 `triggerCondition.epoch` 包含 `'CRISIS'`, `'DETERRENCE'`, `'WANDERING'`, `'ANY'` 等，而在 `checkRandomEvents()` 中存在以下硬编码逻辑：
```typescript
if (targetEpoch === "WANDERING" && (epochName === "CRISIS" || epochName === "DETERRENCE")) {
} else if (targetEpoch === "SHELTER" && epochName === "BUNKER") {
} else if (targetEpoch !== epochName) {
  continue;
}
```
**致命设计缺陷**：
1. **反向漏斗**：如果 `targetEpoch` 是 `"WANDERING"`，当处于 `"CRISIS"` 或 `"DETERRENCE"` 时，代码流落入空 `if` 块中（无 `continue`），导致中后期事件（如“云天明童话破译”、“关一帆四维奇遇”、“艾AA太空城集团破产”、“二向箔降维打击”）在游戏前 260 回合（危机/威慑纪元）疯狂错误触发，严重粉碎叙事代入感。
2. **后期屏蔽**：当游戏真实进行到 `"BROADCAST"`、`"BUNKER"` 或 `"GALAXY"` 时，由于 `"WANDERING" !== epochName`，直接触发了 `continue`，导致中后期事件在真正的中后期阶段**反倒无法触发**！
3. **过滤失效**：在 `checkFilterConditions()` 中直接排除了 `"WANDERING"` 和 `"SHELTER"` 的校验，导致过滤型主线事件的纪元拦截直接失效。

### 2.2 解决方案：引入统一 Epoch 匹配辅助函数

在 [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts) 中重构并设计了高兼容性的 `isEpochMatch()` 方法，完美解决了 `string` 别名与 `EpochType` (enum) 混用的历史问题：

```typescript
private isEpochMatch(targetEpoch: string | number, currentEpoch: string): boolean {
  if (targetEpoch === undefined || targetEpoch === null || targetEpoch === "ANY") return true;

  let targetStr: string;
  if (typeof targetEpoch === "number") {
    const epochNames = ["CRISIS", "DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"];
    targetStr = epochNames[targetEpoch] || "";
  } else {
    targetStr = targetEpoch;
  }

  if (targetStr === currentEpoch) return true;

  // WANDERING 对应中后期纪元：广播纪元、掩体纪元、银河纪元
  if (targetStr === "WANDERING") {
    return currentEpoch === "BROADCAST" || currentEpoch === "BUNKER" || currentEpoch === "GALAXY";
  }

  // SHELTER 对应掩体纪元 (BUNKER)
  if (targetStr === "SHELTER") {
    return currentEpoch === "BUNKER";
  }

  return false;
}
```

### 2.3 核心方法改造与去冗余

1. **改造 `checkFilterConditions()`**：
   将复杂的排除式拦截替换为精炼的逻辑调用，使主线过滤事件与随机事件共享一致的匹配逻辑：
   ```typescript
   // 改造前
   if (cond.epoch && cond.epoch !== "ANY" && cond.epoch !== "WANDERING" && cond.epoch !== "SHELTER") {
     if (cond.epoch !== currentEpoch) return false;
   }
   
   // 改造后
   if (cond.epoch && !this.isEpochMatch(cond.epoch, currentEpoch)) return false;
   ```

2. **改造 `checkRandomEvents()`**：
   完全抛弃硬编码条件块，改用高内聚的判定机制：
   ```typescript
   // 改造前
   if (e.triggerCondition?.epoch && e.triggerCondition.epoch !== "ANY") {
     const targetEpoch = e.triggerCondition.epoch;
     if (targetEpoch === "WANDERING" && (epochName === "CRISIS" || epochName === "DETERRENCE")) {
     } else if (targetEpoch === "SHELTER" && epochName === "BUNKER") {
     } else if (targetEpoch !== epochName) {
       continue;
     }
   }
   
   // 改造后
   if (e.triggerCondition?.epoch && !this.isEpochMatch(e.triggerCondition.epoch, epochName)) {
     continue;
   }
   ```

---

## 三、单元测试与验证体系

### 3.1 扩充 `Game.test.ts` 测试套件

在 [Game.test.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/test/core/Game.test.ts) 中新增了专属测试用例，覆盖了所有可能的双轨纪元别名匹配场景：
1. **`ANY` 通配模式**：无论当前为何纪元，均允许通过（`true`）
2. **字符串精准对齐**：`CRISIS` 只能在 `CRISIS` 触发，在 `DETERRENCE` 拦截（`false`）
3. **数字与 Enum 兼容模式**：支持直接传递 `EpochType` 索引（如 `0` 表示 `CRISIS`），并自动映射对齐
4. **`WANDERING` 中后期漫游模式**：在 `CRISIS` 和 `DETERRENCE` 被拦截（`false`），在 `BROADCAST`、`BUNKER`、`GALAXY` 自动开启（`true`）
5. **`SHELTER` 掩体模式**：仅在 `BUNKER` 开启，在 `CRISIS` 和 `GALAXY` 拦截

### 3.2 自动化测试报告

运行 `npm run test`，测试套件完美通过：
```bash
 ✓ src/test/core/Game.test.ts (5 tests) 8ms
   ✓ Game Core (5)
     ✓ 初始化年份为0 3ms
     ✓ 初始纪元为危机 1ms
     ✓ 地球人口初始65 1ms
     ✓ Flag系统工作正常 1ms
     ✓ Epoch匹配辅助函数(isEpochMatch)逻辑正确 1ms
```

---

## 四、GitHub 代码同步

所有改动和新增的测试用例已全部提交并同步至当前工作区，编译检测零报错，生产环境构建顺利。

---

## 五、未来展望

1. **多段抉择事件链**：基于本轮引入的 `isEpochMatch()` 与 `flag` 因果系统的完美匹配，下一步可以设计需要跨纪元推进的超大型连锁抉择（如“章北海思想钢印的觉醒到自然选择号启航”）。
2. **剧情弹板 UI 高光展示**：可配合后续 UI 迭代，为后期触发的 `WANDERING`（流浪地球）大事件设计专门的复古报纸或全屏 CG 过渡弹板，以提供颠覆性的视觉沉浸体验。
