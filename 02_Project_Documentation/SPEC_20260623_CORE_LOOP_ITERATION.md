# 核心循环迭代与AI智脑技术规范 (Core Loop & AI Brain Iteration Spec)

**文档编号:** SPEC_20260623_CORE_LOOP_ITERATION
**目标:** 解决 4X 战略循环中“过回合无反馈”的痛点，引入指令点（AP）系统与事件实体化反馈。同时保留并升华现有的自动运转机制，将其包装为“AI智脑托管系统”，赋予玩家“微操”与“挂机”的双重自由。

---

## 1. 核心资源：执政指令点 (AP - Action Points)

### 1.1 机制概述
彻底改变玩家“无成本调整国家机器”的现状。所有的战略微操都需要消耗 AP，模拟推行政策所需的政治与行政资源。

### 1.2 数据模型修改
在 `EarthCivilization.ts` 中新增字段：
```typescript
public apMax: number = 100;
public apCurrent: number = 100;
public isAiBrainEnabled: boolean = true; // AI智脑是否开启（即原来的自动驾驶模式）
```

### 1.3 消耗与恢复规则
- **回合恢复：** 每回合初恢复一定量的 AP（基础值 + 部门首长加成 + 文化加成）。
- **操作消耗清单：**
  - **调整人口分配（采矿/工厂/文化）：** 每次拖动滑块提交变更，消耗 `10 AP`。
  - **指派科研目标：** 切换或指定科研项目，消耗 `20 AP`。
  - **加速星系建设：** 强行完成进度，消耗 `30 AP` + 对应资源。
  - **强硬外交/特殊事件决断：** 在特定事件选项中，需要消耗高额 AP 才能选择最优解。

---

## 2. 阻断机制与 AI 智脑托管 (AI Brain Governor)

为了满足既要“4X微操感”又要“自动驾驶护肝”的需求，我们将旧版的“自动分配逻辑”剥离重构，包装为世界观契合的 **“AI 智脑（如 550W 辅助系统）”**。

### 2.1 玩家手动模式 (isAiBrainEnabled = false)
开启“回合阻断（Turn Blocker）”。如果存在必须处理的紧急事务，禁止玩家点击“下一回合”：
- **科研停滞：** 没有任何科技在研究。
- **部门瘫痪：** 经济部、军事部等核心部门领导空缺。
- **资源崩盘预警：** 预测下回合经济或资源将归零。
- **未决事件：** 有弹窗事件（Interactive Event）未处理。

### 2.2 AI 智脑模式 (isAiBrainEnabled = true)
开启后，游戏恢复类似原版的“自动驾驶”体验。在每次玩家点击“下一回合”前，系统自动调用 `AIGovernor.process()`：
- 自动消耗剩余的 AP 填补空缺（自动选科技、自动分配首长）。
- 自动调整人口比例以维持经济和资源的健康（如果资源少于 20%，自动拉高采矿比例）。
- **UI 呈现：** 玩家在 UI 顶部 HUD 会看到一个科技感十足的“AI 托管”开关（✅ 智脑运行中）。当智脑自动做出决策时，会在屏幕侧边或下方（TickerMessage）弹出：“[AI智脑] 已自动将科研重心转移至『可控核聚变』”。

---

## 3. 事件与盘面深度咬合 (Event-Board Integration)

扩大事件系统的表现力，使其从“纯数值增减”转变为“大地图上的实体表现”。

### 3.1 扩展 EventEffect 类型
修改 `types/enums.ts` 中的 `EventEffect` 和 `narrative.ts` 中的相关接口，支持以下实体化命令：
- `spawn_barback`: 在指定或随机的已探索星系生成叛军（Barback）舰队。
- `lock_ratio`: 强制锁定某个工种的分配比例（如：工厂比例最大 20%），持续 N 回合。
- `rush_tech`: 瞬间为当前研究的科技增加一定的工作量（而不是笼统加科技点）。
- `build_infrastructure`: 在某个星系立刻生成一个采矿场或城市。

### 3.2 逻辑处理层 `Game.ts`
在 `applyNewEffects(effects: any[])` 中实现解析：
```typescript
case 'spawn_barback':
  const targetStar = this.starManager.getStar(effect.targetStarIndex);
  if (targetStar) {
    const rebel = createBarback("叛军舰队", effect.targetStarIndex);
    rebel.soldierCount = effect.value; // 叛军规模
    // 如果叛军规模大于驻军，星系可能立刻沦陷，玩家需要派兵收复
    CombatEngine.resolveBarbackRaid(targetStar, rebel);
    this.addHistory(`【紧急军情】星系 ${targetStar.name} 爆发叛乱！`);
  }
  break;
case 'lock_ratio':
  this.earthCivi.ratioLocks.push({ type: effect.target, max: effect.value, duration: effect.duration });
  break;
```

---

## 4. UI/UX 落地规范

1. **TopHUD (顶部导航栏)：**
   - 增加 **AP (指令点)** 进度槽，直观显示当前的执政效率。
   - 增加 **“AI 智脑” Toggle 开关**。开启时具有脉冲发光效果。

2. **StarMap (星图大地图)：**
   - 星系节点（Node）增加状态指示器：例如头顶出现 ⚠️ 代表有叛军，出现 🔨 代表建设中。
   - 点击自己的星系，弹出“快速建设”面板，提示消耗 AP 和资源可立刻完成。

3. **事件弹窗 (StoryModal)：**
   - 如果某个选项需要消耗 AP，在选项按钮上清晰标出代价（如：`-20 AP`）。如果 AP 不足，该选项显示为灰色并有工具提示“执政指令点不足，无法强推此方案”。

## 5. 兼容性与架构安全
- 所有的修改完全建立在现有的 `Game` 与 `EarthCivilization` 的类框架内。
- 引入的 AP 系统必须在 `SaveSchema.ts` 及 `SaveManager.ts` 中完成同步持久化。
- AI 智脑逻辑完全封装为 `Game.ts` 内的一个方法 `runAIBrain()`，在 `runARound` 起始阶段按需调用，不会破坏底层的经济计算时序。
