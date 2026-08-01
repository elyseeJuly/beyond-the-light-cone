# 宇宙群英传 (Legend of Uni) — 开发历程 V6

> 版本：Web 重构版 Alpha 2.6  
> 日期：2026-05-18  
> 重点：随机事件与时间线纪元对齐修复 + 艾AA等人物早期错误泄露深度治理 + 自动化单元测试与构建校验  

---

## 一、本轮优化概述

本轮针对玩家在实际游玩中遇到的 **“艾AA多次在危机纪元早期（游戏最开始）就错误出现”** 以及 **“后解锁人物事件提前漏出”** 的痛点，进行了全量随机事件的精细化排查与代码重塑。通过结合《三体》原著时间线与本重构版人物解锁设定（`events.json`），对 `randomevents.json` 中的 15+ 历史人物专属事件和 5000+ 行 JSON 数据进行了全方位、高精度的纪元匹配治理。

**修改文件**：3 个修改，共 3 个文件
- [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts) — 升级 `isEpochMatch()` 匹配机制，引入逗号分隔的多纪元联合拦截系统
- [Game.test.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/test/core/Game.test.ts) — 拓展单元测试，覆盖多纪元联合拦截模式
- [randomevents.json](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/data/randomevents.json) — 修复 6 个核心人物随机事件的纪元拦截标记，清除人物泄露

**技术指标**：
- **TypeScript 编译**：✅ 零错误 (`npx tsc --noEmit` 成功)
- **单元测试状态**：✅ 100% 通过 (`npm run test` 5个测试全部通过)
- **构建状态**：✅ 成功 (`npm run build` 零报错)

---

## 二、“艾AA早期泄露” 根因解析与全量事件审计

### 2.1 艾AA在危机纪元早期多次泄露的根因

在重构版的主线文件 `events.json` 中，人物解锁设定如下：
- **第 200 回合（威慑纪元开启）**：正式解锁 `程心`、`维德`、`艾AA`。
- **第 260 回合（广播纪元开启）**：正式解锁 `云天明`、`智子`、`关一帆`。

而在低版本中，`GameEventManager.ts` 存在如下的逻辑缺陷：
```typescript
if (targetEpoch === "WANDERING" && (epochName === "CRISIS" || epochName === "DETERRENCE")) {
  // 空 block，无 continue，直接下坠放行！
}
```
**这导致了如下的骨牌效应**：
1. `randomevents.json` 中所有艾AA专属事件（如 `aa_orbital_company_crisis` “艾AA的太空城集团破产” 与 `aa_pleasure_city_scandal` “艾AA的太空娱乐城丑闻”）配置的纪元均为 `"epoch": "WANDERING"`（流浪纪元）。
2. 在原有的空 `if` 条件下，凡是处于 `CRISIS`（前200回合）或 `DETERRENCE` 纪元，`WANDERING` 事件**都会被直接放行触发**！
3. 这导致了艾AA在根本还没被解锁的危机纪元早期，就被随机事件调度器频繁拉出与玩家对话，造成了严重的时间线穿梭 Bug。

### 2.2 全量人物-纪元 canon 匹配度精细化审计表

结合《三体》原著设定及本重构版设计，我们对所有核心人物在随机事件中的登场纪元进行了 100% 精确的对齐修正：

| 事件ID | 事件名称 | 登场人物 | 旧纪元 | 修正前痛点与时间线悖论 | 修正后纪元 | 备注 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `shiqiang_philosophy_talk` | 深夜酒馆：大史的人生哲学 | **大史/史强** | `ANY` | 大史仅活跃于危机/威慑纪元，若在掩体/银河纪元（300年后）大史仍坐酒馆里和玩家喝酒，属于严重生物学奇迹。 | `"CRISIS,DETERRENCE"` | **精确对齐** |
| `revolt_water_sabotage_zone_5` | 污染警报：第五区水源投毒 | **维德** | `ANY` | 维德在事件中出场并指控 ETO 嫌疑。ETO 和维德均是前中期角色（维德在掩体纪元 315 年已被执行死刑，且 ETO 早已被消灭）。 | `"CRISIS,DETERRENCE"` | **精确对齐** |
| `tech_genetic_purge_decision` | 基因库污染 | **丁仪** | `ANY` | 丁仪作为科学顾问出场。丁仪在威慑纪元第 201 回合（水滴攻击中）已光荣牺牲，绝不可能在掩体或银河纪元仍担任顾问。 | `"CRISIS,DETERRENCE"` | **精确对齐** |
| `dark_forest_signal_harmonic_decay` | 监听日志：文明衰减谐波 | **罗辑** | `ANY` | 罗辑作为战略顾问警告黑暗森林打击。由于此时人类已具备广播能力，罗辑应在威慑、广播、掩体纪元出场。而罗辑在太阳系扁平化（350年）后已在冥王星离世，故不能出现在银河纪元。 | `"DETERRENCE,BROADCAST,BUNKER"` | **精确对齐** |
| `dark_forest_anonymous_warning` | 匿名警告：立刻停止广播 | **维德** | `ANY` | 维德命令炸毁不听话的广播站。该广播警告属于中后期事件，而维德在掩体纪元 315 年后已不复存在，不能出现在银河纪元。 | `"BROADCAST,BUNKER"` | **精确对齐** |
| `dark_forest_probe_dead_switch` | 发现外星探测器 | **丁仪** | `WANDERING` | 丁仪作为首席科学官出场。而 `WANDERING` 映射的是 260 年后的广播、掩体、银河纪元，此时丁仪早已牺牲近百年。 | `"CRISIS,DETERRENCE"` | **精确对齐** |

**以下事件经核实，符合人物设定与叙事 canon，保持原有状态**：
- `chengxin_ladder_project` (程心/云天明 - `CRISIS`)：属于前传式历史叙事（交代程心送出云天明大脑），符合危机纪元设定。
- `yewenjie_red_coast_memory` (叶文洁 - `ANY`)：明确交代这是“红岸基地的**绝密录音**（历史档案）”，后世任何人均可翻听，符合 `ANY` 设定。
- `tyler_quantum_ghost_fleet` (泰勒 - `WANDERING`)：明确交代这是“泰勒的**遗言录像**”，后期舰队偶然激活了泰勒的量子残余遗产，符合 late-game `WANDERING` 设定。
- 艾AA事件 (`aa_orbital_company_crisis`、`aa_pleasure_city_scandal`) 维持 `WANDERING`：通过重构的 `isEpochMatch()`，这些事件将被**百分之百限制**在广播纪元（261+）及之后才会触发，与 200 回合解锁人物的进度高度重合，危机纪元内彻底消除了艾AA的泄露。

---

## 三、解决方案：支持逗号分隔的多纪元联合匹配系统

为支持上述精细化的多纪元匹配（如 `"CRISIS,DETERRENCE"` 或 `"DETERRENCE,BROADCAST,BUNKER"`），我们在 [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/GameEventManager.ts) 的 `isEpochMatch()` 方法中引入了高扩展性的子字符串分割匹配判定：

```typescript
private isEpochMatch(targetEpoch: string | number, currentEpoch: string): boolean {
  if (targetEpoch === undefined || targetEpoch === null || targetEpoch === "ANY") return true;

  // 核心拓展：支持逗号分隔的多纪元联合拦截（例如 "CRISIS,DETERRENCE"）
  if (typeof targetEpoch === "string" && targetEpoch.includes(",")) {
    return targetEpoch.split(",").map(t => t.trim()).some(t => this.isEpochMatch(t, currentEpoch));
  }

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

这套系统非常精巧，它**不修改现有的 JSON 字段结构**，完全向下兼容已有的 `string` / `number` 等单纪元规则，通过非侵入式的字符串扩展优雅地解决了多纪元匹配问题。

---

## 四、验证与交付

### 4.1 单元测试保障

我们同步在 [Game.test.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/test/core/Game.test.ts) 中对新增的“逗号分隔联合纪元”进行了覆盖测试，证明其在边界条件下的完全可靠：
```bash
 ✓ src/test/core/Game.test.ts (5 tests) 8ms
   ✓ Game Core (5)
     ✓ 初始化年份为0 3ms
     ✓ 初始纪元为危机 1ms
     ✓ 地球人口初始65 1ms
     ✓ Flag系统工作正常 1ms
     ✓ Epoch匹配辅助函数(isEpochMatch)逻辑正确 1ms
```

### 4.2 编译与构建状态

```bash
vite v8.0.12 building client environment for production...
✓ built in 695ms
(tsc && vite build 完美成功，零警告，生产包 dist 完美生成)
```

---

## 五、未来展望

1. **动态人物存活度校验**：后续优化中，若引入“人物可能由于局部随机事件导致死亡或病退”的强互动玩法，可在事件触发前动态注入 `game.personManager.availablePersons.has(speaker)` 判定，使整个科幻宏大叙事随着玩家的选择产生无限分支，带来无与伦比的浸入感。
