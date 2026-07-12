# SPEC_20260703_CORE_SYSTEMS_AUTHORITATIVE | 核心系统权威设计规范

> **版本号**: V1.0 (以当前代码实现为权威基准)  
> **制定日期**: 2026-07-03  
> **适用范围**: 纪元系统、文化增长、年份推进、AI 智脑、初始状态  
> **分类前缀**: `SPEC_` (规格说明)  
> **取代文档**: SPEC_20260514_REBUILD_PART1.md 第 6 节枚举定义 (已过时，5 纪元→7 纪元)

---

## 1. 文档目的

本 SPEC 以**当前代码实现为权威基准**，整合原始 SPEC 定义、迭代计划、审计修复中产生的所有设计变更，形成一份唯一的数据源 (Single Source of Truth)。后续所有审计与开发必须以此文档为准，防止将已修复的设计调整误判为"偏离"。

### 1.1 与原始 SPEC 的关键差异

| 维度 | 原始 SPEC (2026-05-14) | 当前实现 (2026-07-03) | 变更原因 |
|------|----------------------|---------------------|---------|
| 纪元数量 | 5 纪元 (CRISIS~GALAXY) | 7 纪元 (GOLDEN~STARDUST) | 新增黄金岁月（开局过渡）和星屑纪元（后期终局），提升叙事张力和游戏深度 |
| 纪元枚举 | `EP_CRISIS = 0` | `GOLDEN = 0, CRISIS = 1` | 黄金岁月插入纪元 0，后续全部偏移 +1 |
| 文化公式 | 未明确定义 (隐含 `5 + social×0.5` 基础) | `2 + social×0.10` 基础 + `leaderBonus = social/8` + `(workers+bonus)×weight/15` | 修复文化爆炸问题 (10 回合溢出纪元→10 回合安全保持在危机纪元) |
| 年份递增 | 未明确定义 | 1 年/回合，事件队列阻塞 | 新增设计，控制游戏节奏 |
| 纪元溢出保护 | 无 | 溢出时回退到最后一个满足 minCulture 的纪元 | 修复 culture 超过所有 maxCulture 时永久卡死 |
| AI 智脑默认 | 未定义 (隐含 true) | 默认关闭 (false) | 玩家必须明确选择开启，避免不知情全自动 |
| 地球初始建筑 | 未定义 | 采矿场+工厂 (hasStope=true, hasFactory=true) | 修复资源零增长虚假平衡 |

---

## 2. 纪元系统 (Epoch System)

### 2.1 枚举定义

```typescript
// src/types/enums.ts
export enum EpochType {
  GOLDEN = 0,      // 黄金岁月
  CRISIS = 1,      // 危机纪元
  DETERRENCE = 2,  // 威慑纪元
  BROADCAST = 3,   // 广播纪元
  BUNKER = 4,      // 掩体纪元
  GALAXY = 5,      // 银河纪元
  STARDUST = 6,    // 星屑纪元
  COUNT = 7
}
```

### 2.2 数据配置 (epochs.json)

```json
// src/data/epochs.json
[
  { "epoch": 0, "name": "黄金岁月", "minCulture": -100, "maxCulture": -1 },
  { "epoch": 1, "name": "危机纪元", "minCulture": 0,   "maxCulture": 199 },
  { "epoch": 2, "name": "威慑纪元", "minCulture": 200, "maxCulture": 499 },
  { "epoch": 3, "name": "广播纪元", "minCulture": 500, "maxCulture": 799 },
  { "epoch": 4, "name": "掩体纪元", "minCulture": 800, "maxCulture": 1199 },
  { "epoch": 5, "name": "银河纪元", "minCulture": 1200, "maxCulture": 2499 },
  { "epoch": 6, "name": "星屑纪元", "minCulture": 2500, "maxCulture": 999999 }
]
```

**设计要点**:
- 黄金岁月 `minCulture: -100` 使开局自动进入此纪元，文化从 0 开始累积
- 星屑纪元 `maxCulture: 999999` 作为终局纪元，实际不可能超出
- 所有纪元阈值连续无间隙，确保任何 culture 值都能匹配到纪元

### 2.3 纪元解锁条件 (Flag 门控)

部分纪元不仅需要文化达标，还需要关键剧情事件触发：

| 纪元 | Flag 条件 | 说明 |
|------|----------|------|
| 威慑纪元 | `deterrence_established` | 罗辑建立威慑 |
| 广播纪元 | `coordinates_broadcasted` | 坐标广播 |
| 掩体纪元 | `bunker_world_completed` | 掩体世界建成 |
| 银河纪元 | `galaxy_exodus_seen` 或 `dimensional_strike` | 银河远行或二向箔打击 |
| 星屑纪元 | `stardust_era_declared` 或 `stardust_era_seen` 或 `zero_homer_contacted` | 星屑时代宣告或归零者接触 |

> **FIX-01 (20260712)**: 写入入口门控 FLAG 的事件，其 `triggerCondition.epoch` 必须标注为**当前纪元**（FLAG 写入时所在的纪元），而非目标纪元。否则会形成循环依赖：当前纪元无法触发事件 → FLAG 永不写入 → 下一纪元无法进入。
> - `eto_founded` 由 CRISIS 纪元 year=-27 事件写入
> - `coordinates_broadcasted` 由 DETERRENCE 纪元事件写入（罗辑/程心路线）
> - `bunker_world_completed` 由 BROADCAST 纪元 year=280 事件写入

> **FIX-04 (20260712)**: 纪元切换时自动清理上一纪元的临时 FLAG（`FlagManager.clearTransientFlags`），避免跨纪元污染。入口门控 FLAG（如 `deterrence_established`）不在清理列表中，保持跨纪元持久。

> **FIX-13 (20260712)**: `runARound` 中 `checkVictoryConditions()` 先于 `updateEpoch()` 调用，确保同回合同时满足结局条件和纪元推进时，结局优先触发。

**实现位置**: [Game.ts updateEpoch()](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L738-L803)

### 2.4 纪元溢出保护

当 culture 值超过所有已定义纪元的 `maxCulture` 时，`epochsData.find()` 返回 `undefined`。修复逻辑：

```typescript
// 先按区间匹配
let matched = epochsData.find(e => culture >= e.minCulture && culture <= e.maxCulture);
// 溢出保护：按 epoch 降序查找第一个满足 minCulture 的纪元
if (matched === undefined && culture > 0) {
  const sorted = [...epochsData].sort((a, b) => b.epoch - a.epoch);
  matched = sorted.find(e => culture >= e.minCulture);
}
```

### 2.5 纪元停滞提示

当文化达标但关键 Flag 未触发时，系统显示"文明停滞"提示，并只触发一次（通过 `epoch_stalled` flag 防重复）：
```
【文明停滞】人类的文化底蕴已经足以进入下一个时代，但缺少关键的历史契机或技术突破，时代演进被阻滞了。
```

### 2.6 纪元资产按需下载

纪元更替时自动触发资产下载（fire-and-forget 模式，不阻塞主循环）：

| 纪元 | eraKey | 说明 |
|------|--------|------|
| 黄金岁月 | `golden_era` | 开局资产 |
| 危机纪元 | `crisis_era` | 危机期资产 |
| 威慑纪元 | `deterrence_era` | 威慑期资产 |
| 广播纪元 | `broadcast_era` | 广播期资产 |
| 掩体纪元 | `bunker_era` | 掩体期资产 |
| 银河纪元 | `galaxy_era` | 银河期资产 |
| 星屑纪元 | `stardust_era` | 星屑期资产 |

每次纪元更替执行：`assetLoader.downloadEraPack(currentEraKey)` + `assetLoader.preloadNextEra(currentEraKey)`

---

## 3. 文化增长公式 (Culture Growth Formula)

### 3.1 公式定义

```
cultureGain = floor((workers + leaderBonus) × weight / 15) + deptBase
cultureGain = min(cultureGain, 100)
```

**参数说明**:

| 参数 | 计算公式 | 说明 |
|------|---------|------|
| `deptBase` | `2 + floor(social × 0.10)` | 部门基础产出，含部长社交属性加成 |
| `leaderBonus` | `floor(social / 8)` | 部长领导力对工人效率的加成 |
| `workers` | `this.cultureWorkers` | 文化部门工人数 |
| `weight` | 2 (默认) / 3 (思想钢印Ⅰ) / 4 (思想钢印Ⅱ) / 5 (思想钢印Ⅲ) | 科技权重加成 |
| 上限 | `cap = 100` | 单回合文化增长上限 |

### 3.2 思想钢印科技权重

| 科技 | 科技树 | weight | 效果 |
|------|--------|--------|------|
| 思想钢印Ⅰ | INFORMATION | 3 | 文化产出 +50% |
| 思想钢印Ⅱ | INFORMATION | 4 | 文化产出 +100% |
| 思想钢印Ⅲ | INFORMATION | 5 | 文化产出 +150% |

### 3.3 实现位置

[EarthCivilization.ts processCulture()](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L538-L559)

### 3.4 数值平衡基准

修复后 10 回合 AI 模式模拟数据：

| 回合 | 年份 | 人口 | 经济 | 资源 | 文化 | 纪元 |
|------|------|------|------|------|------|------|
| 初始 | 0 | 65 | 100 | 200 | 0 | 危机 |
| 3 | 3 | 104 | 178 | 125 | 36 | 危机 |
| 6 | 6 | 143 | 281 | 1 | 84 | 危机 |
| 9 | 9 | 182 | 422 | 0 | 122 | 危机 |

**关键结论**: Year 9 文化仅 122，远低于威慑纪元阈值 200，文化增长与剧情事件时间线对齐。

---

## 4. 年份推进机制 (Year Advancement)

### 4.1 基本规则

- **基础速率**: 1 年/回合 (`this.year++`)
- **触发位置**: [Game.ts runARound()](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L712)

### 4.2 事件队列阻塞机制

当存在待处理事件时，年份推进被阻塞：

```typescript
// 存在当前事件或待处理事件
if (this.currentEvent || this.eventQueue.length > 0) {
  if (this.earthCivi.isAiBrainEnabled) {
    this.runAIBrain();  // AI 托管自动处理
  } else {
    // 手动模式：提示玩家先处理事件
    this.addHistory("提示：请先处理当前的剧情事件。");
    return;
  }
}
```

**设计意图**: 确保玩家在关键剧情事件（如威慑建立、坐标广播）发生时，必须先做出选择，年份才推进。这防止了"事件堆积在后台，文化已经飞过几个纪元"的问题。

### 4.3 回合安全锁

- `_yearJustAdvanced`: 防止 EventSystem 与 runARound 双重推进年份
- `isProcessing`: 防止回合重入

---

## 5. AI 智脑 (AI Brain)

### 5.1 默认策略

```typescript
// EarthCivilization.ts
public isAiBrainEnabled: boolean = false;  // 默认关闭
```

### 5.2 玩家交互

- **游戏封面**: [GameCoverScreen.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/GameCoverScreen.tsx) 显示 "AI 智脑托管" 开关
- **新游戏**: 应用玩家选择的 AI 偏好
- **教程结束后**: 恢复玩家原始 AI 偏好，不强制开启

### 5.3 AI 行为范围

当 AI 托管开启时，自动执行：
- 部门部长分配 (`autoAssignLeaders`)
- 科技研究方向选择 (`autoSelectResearch`)
- 工人比例调整 (`autoAdjustWorkers`)
- 待处理事件自动选择第一个选项

**当前限制**: AI 不会自动建造建筑。玩家需要手动建造采矿场、工厂、城市等。

### 5.4 手动模式阻断

手动模式下，回合推进前检查以下阻断条件：
- 有未分配部长的部门
- 有未选择的研究方向
- 资源 ≤ 10 (资源崩盘)
- 经济 ≤ 10 (经济危机)

阻断时触发 `turn-blocked` 事件，TopHUD 显示 "有阻断" 状态。

---

## 6. 地球初始状态 (Earth Initial State)

### 6.1 初始建筑

```typescript
// StarManager.ts Init()
earth.hasStope = true;    // 采矿场
earth.hasFactory = true;  // 工厂
```

### 6.2 初始数值

| 属性 | 初始值 | 说明 |
|------|--------|------|
| 人口 | 65 | 当前人口 |
| 人口上限 | 1000 | 地球人口上限 |
| 经济 | 100 | 经济产出 |
| 资源 | 200 | 资源储备 |
| 军事 | 10 | 防卫军力 |
| 文化 | 0 | 文化值 |
| 纪元 | 危机纪元 (CRISIS=1) | 初始纪元 |
| 年份 | 0 | 公元纪年 |

### 6.3 设计意图

采矿场+工厂的初始配置使资源循环正确启动：采矿产出 → 工厂消耗资源 → 经济增长。避免"资源永远 200，无工厂不消耗资源，形成虚假平衡"的问题。

---

## 7. 数据外部化 (Data Externalization)

### 7.1 已外部化的配置文件

| 文件 | 内容 | 加载位置 |
|------|------|---------|
| `src/data/epochs.json` | 7 纪元阈值与名称 | Game.ts `import epochsData` |
| `src/data/timeline.json` | 小说原版时间线 | Game.ts `import timelineData` |

### 7.2 待外部化 (阶段 B 未完成)

根据 SPEC_20260603_REVISED_ITERATION_PLAN.md 阶段 B 计划：
- `wallfacers.json` — 面壁者基础参数 (进度增长率、破壁门槛)
- `diplomacy.json` — 外交关系数值与系数映射

---

## 8. 附录：未实现计划 (Future Roadmap)

以下内容来自 SPEC_20260603_REVISED_ITERATION_PLAN.md，尚未实现，不作为当前代码的偏离依据：

### 8.1 阶段 C：视听表现 (P2，未实现)

- **战斗粒子动画**: BattleScreen 中 Framer Motion 武器对决动态缩放、水滴撞击闪烁警报、文字战报粒子漂移
- **音效事件总线**: 二向箔预警、智子展开、纪元更替时自动切换 BGM + 警报音效

### 8.2 阶段 D：桌面打包 (P2，部分实现)

- **Tauri 桌面容器**: 已配置脚手架，Vite 构建产物可嵌入 Tauri 容器
- **Steam API 桥接**: 未实现，计划在 Tauri Rust 后端预留 `steamworks-rs` 接口

---

## 9. 测试覆盖

### 9.1 相关场景测试

| ID | 场景 | 状态 | 文件 |
|----|------|------|------|
| SCEN-ASSET-DOWNLOAD-LOOP | 纪元资产按需下载 | 🟢 GREEN | AssetDownload.scenario.test.ts |
| SCEN-ASSET-MANIFEST-GEN | 资源清单分类 | 🟢 GREEN | AssetDownload.scenario.test.ts |
| SCEN-ALIEN-CONTACT | 外星文明接触事件 | 🟢 GREEN | AlienContact.scenario.test.ts |
| SCEN-MANUAL-BLOCKER | 手动模式阻断 | 🟢 GREEN | TutorialRemedy.scenario.test.tsx |

### 9.2 建议新增测试

- **SCEN-EPOCH-OVERFLOW**: 验证 culture 超出所有 maxCulture 时纪元溢出保护正确回退
- **SCEN-CULTURE-FORMULA**: 验证文化公式在 0 工人、无部长、思想钢印Ⅲ 等边界条件下正确计算
- **SCEN-YEAR-BLOCK**: 验证事件队列存在时年份推进被阻塞

---

## 10. 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|---------|
| 2026-07-03 | V1.0 | 初始创建，以当前实现为权威基准，整合原始 SPEC、迭代计划、审计修复中的所有设计变更 |
| 2026-07-12 | V1.1 | 追加 FIX-01/FIX-04/FIX-13 审计修复注释：FLAG 门控事件 epoch 标注规则、临时 FLAG 清理机制、checkVictoryConditions 与 updateEpoch 调用顺序 |

---

> **权威性声明**: 本文档创建后，SPEC_20260514_REBUILD_PART1.md 第 6 节中的 5 纪元枚举定义视为过时。所有后续审计、开发、测试必须以本文档中的 7 纪元系统、文化公式、年份推进、AI 智脑策略、地球初始状态为准。