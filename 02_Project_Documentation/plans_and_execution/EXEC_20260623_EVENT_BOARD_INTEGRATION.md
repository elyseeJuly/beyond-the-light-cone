# TASK-EVENT: 事件实体化集成 (Event-Board Integration)

> **优先级**: P1（玩法深度）  
> **依赖**: 无硬依赖，建议在 TASK-AP 完成后进行（事件选项可能涉及 AP 消耗）  
> **来源**: [SPEC_20260623_CORE_LOOP_ITERATION.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260623_CORE_LOOP_ITERATION.md) 第 3 节  
> **预估影响范围**: 5 文件，约 400 行新增  
> **AI 接手指引**: 本任务为纯增量功能，每个新 Effect 类型可独立实现。

---

## 概述

当前事件系统的效果仅限于数值增减（`resource`、`flag`、`population` 等），事件的发生与星图大地图完全脱节。本任务引入 4 种新的事件效果类型，使事件产生"大地图上的实体表现"。

---

## 任务 1：扩展 EventEffect 类型定义

### 文件：`src/types/enums.ts` 或事件类型定义文件

在 `EventEffect` 接口中新增以下类型：

```typescript
// 新增 Effect 类型
type EventEffectType = 
  | 'resource'        // 现有
  | 'flag'            // 现有
  | 'population'      // 现有
  | 'tech'            // 现有
  | 'spawn_barback'   // 新增：在星系生成叛军舰队
  | 'lock_ratio'      // 新增：锁定工种分配比例，持续 N 回合
  | 'rush_tech'       // 新增：为当前科技增加工作量
  | 'build_infrastructure'; // 新增：在星系生成建筑

// 扩展 EventEffect 接口
interface EventEffect {
  type: EventEffectType;
  target: string;
  value: number;
  // 新增可选字段
  targetStarIndex?: number;  // spawn_barback / build_infrastructure 使用
  duration?: number;         // lock_ratio 使用
  techAmount?: number;       // rush_tech 使用
}
```

**注意**：需要确认当前 `EventEffect` 的定义位置。可能在 `types/enums.ts` 或 `types/narrative.ts` 中。

---

## 任务 2：实现 `spawn_barback`（叛军生成）

### 文件：`src/core/Game.ts`，`applyNewEffects()` 方法

在效果处理 switch 中新增：

```typescript
case 'spawn_barback': {
  const targetStar = this.starManager.getStar(effect.targetStarIndex ?? 0);
  if (!targetStar) break;
  
  const rebel = createBarback("叛军舰队", effect.targetStarIndex || 0);
  rebel.soldierCount = effect.value || 50;
  
  // 如果叛军规模大于驻军，星系可能立刻沦陷
  if (targetStar.defenseForce && rebel.soldierCount > targetStar.defenseForce.soldierCount) {
    targetStar.owner = null; // 星系沦陷
    this.addHistory(`【紧急军情】${targetStar.name} 爆发大规模叛乱，星系已沦陷！`);
  } else {
    CombatEngine.resolveBarbackRaid(targetStar, rebel);
    this.addHistory(`【军情】${targetStar.name} 爆发叛乱，驻军正在镇压中。`);
  }
  
  // 星图标记更新
  this.starManager.markStarStatus(targetStar, 'rebellion');
  break;
}
```

### 需要确认的前置条件

- `CombatEngine.resolveBarbackRaid()` 方法是否存在？如不存在需要创建
- `StarManager.getStar()` 和 `markStarStatus()` 是否存在？
- `Barback` 类是否支持 `soldierCount` 字段？

**如前置方法不存在，需先实现它们。**

---

## 任务 3：实现 `lock_ratio`（工种比例锁定）

### 文件：`src/core/EarthCivilization.ts`、`src/core/Game.ts`

#### 3a. 在 `EarthCivilization` 中新增字段

```typescript
/** 工种比例锁列表 */
public ratioLocks: Array<{ 
  type: 'mining' | 'factory' | 'culture'; 
  max: number; 
  duration: number; // 剩余回合数
}> = [];
```

#### 3b. 在 `allocateWorkers()` 中应用锁定

在分配逻辑中，遍历 `ratioLocks`，如果某个工种比例超过锁定的 `max`，强制截断：

```typescript
for (const lock of this.ratioLocks) {
  if (lock.type === 'mining' && this.miningRatio > lock.max) {
    this.miningRatio = lock.max;
  }
  // ... factory, culture 同理
}
```

#### 3c. 每回合减少锁定回合数

在 `runARound()` 中：

```typescript
this.ratioLocks = this.ratioLocks
  .map(lock => ({ ...lock, duration: lock.duration - 1 }))
  .filter(lock => lock.duration > 0);
```

#### 3d. 在 `applyNewEffects()` 中处理

```typescript
case 'lock_ratio': {
  if (!effect.target || !effect.duration) break;
  this.earthCivi.ratioLocks.push({
    type: effect.target as 'mining' | 'factory' | 'culture',
    max: effect.value,
    duration: effect.duration,
  });
  this.addHistory(`【政策】${effect.target} 工种比例被强制限制在 ${effect.value}% 以内，持续 ${effect.duration} 回合。`);
  break;
}
```

---

## 任务 4：实现 `rush_tech`（科技加速）

### 文件：`src/core/Game.ts`，`applyNewEffects()` 方法

```typescript
case 'rush_tech': {
  const amount = effect.techAmount || effect.value || 100;
  // 为当前研究的科技增加工作量
  const currentResearch = this.earthCivi.getResearchTarget(effect.target as TecTreeType);
  if (currentResearch) {
    this.earthCivi.tecTreeManager.addProgress(effect.target, currentResearch, amount);
    this.addHistory(`【科技】${effect.target} 研究取得突破性进展，进度 +${amount}。`);
  }
  break;
}
```

### 需要确认

- `TecTreeManager.addProgress()` 方法是否存在？如不存在需要创建
- `effect.target` 是科技树类型（如 "物理"、"工程"）还是具体科技名？

---

## 任务 5：实现 `build_infrastructure`（星系建设）

### 文件：`src/core/Game.ts`，`applyNewEffects()` 方法

```typescript
case 'build_infrastructure': {
  const targetStar = this.starManager.getStar(effect.targetStarIndex ?? 0);
  if (!targetStar) break;
  
  const infraType = effect.target; // "mine" | "city" | "factory"
  const success = this.starManager.buildInfrastructure(targetStar, infraType, effect.value);
  
  if (success) {
    this.addHistory(`【建设】${targetStar.name} 新建了 ${infraType} 设施。`);
    this.starManager.markStarStatus(targetStar, 'building');
  }
  break;
}
```

### 需要确认

- `StarManager.buildInfrastructure()` 方法是否存在？
- 建设成功后的资源消耗是否由事件承担（免费建设）还是需要额外消耗？

---

## 任务 6：在 events.json 中使用新 Effect 类型

### 文件：`src/data/events.json`、`src/data/randomevents.json`

在现有事件中选取 3-5 个合适的时机，添加新效果类型：

```json
{
  "id": "大低谷叛乱",
  "epoch": "CRISIS",
  "choices": [
    {
      "label": "强力镇压",
      "effects": [
        { "type": "spawn_barback", "target": "rebel", "value": 80, "targetStarIndex": 3 }
      ]
    }
  ]
}
```

```json
{
  "id": "战时动员令",
  "epoch": "DETERRENCE",
  "choices": [
    {
      "label": "全力生产",
      "effects": [
        { "type": "lock_ratio", "target": "factory", "value": 60, "duration": 5 }
      ]
    }
  ]
}
```

### 建议分配

- `spawn_barback`：大低谷、叛乱相关事件
- `lock_ratio`：战时动员、紧急状态事件
- `rush_tech`：科技突破、外星技术获取事件
- `build_infrastructure`：大建设、殖民扩张事件

---

## 任务 7：StarMap 星图状态指示器

### 文件：`src/components/StarMap.tsx`

在星系节点渲染中增加状态指示器：

```tsx
{star.status === 'rebellion' && <span className="star-indicator">⚠️</span>}
{star.status === 'building' && <span className="star-indicator">🔨</span>}
```

---

## 完成标准

- [ ] `EventEffect` 类型定义扩展完成
- [ ] `spawn_barback` 可在星系生成叛军，战斗逻辑正确
- [ ] `lock_ratio` 可锁定工种比例，持续指定回合后自动解除
- [ ] `rush_tech` 可为当前科技增加进度
- [ ] `build_infrastructure` 可在星系生成建筑
- [ ] `events.json` 中至少有 4 个事件使用了新效果类型
- [ ] StarMap 星系节点显示叛乱/建设状态指示器
- [ ] `npx vitest run` 全部通过，无回归

---

*本任务书基于 [SPEC_20260623_CORE_LOOP_ITERATION.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260623_CORE_LOOP_ITERATION.md) 第 3 节编写。*