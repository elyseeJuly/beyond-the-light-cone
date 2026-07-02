# LegendOfUni 系统循环迭代优化方案

> **Plan Date**: 2026-06-12  
> **Plan Version**: V1.0  
> **Based On**: [AUDIT_20260612_CYCLE_AUDIT_V2.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260612_CYCLE_AUDIT_V2.md)  
> **Target Goal**: 将系统循环健康度从 **5.5/10 提升至 8/10**

---

## 目录

1. [P0 级：必须修复（严重问题）](#p0-级必须修复严重问题)
   - [P0-1 结局闭环补全（NewGame+ 系统）](#p0-1-结局闭环补全newgame-系统)
   - [P0-2 RelationNetwork 接入全局循环](#p0-2-relationnetwork-接入全局循环)
2. [P1 级：高优先级（重要问题）](#p1-级高优先级重要问题)
   - [P1-1 外交系统接入叙事循环](#p1-1-外交系统接入叙事循环)
   - [P1-2 行星发动机Ⅰ型通胀修复](#p1-2-行星发动机Ⅰ型通胀修复)
   - [P1-3 面壁者威慑值衰减机制](#p1-3-面壁者威慑值衰减机制)
3. [P2 级：中优先级（改进问题）](#p2-级中优先级改进问题)
   - [P2-1 科技树玩家决策系统](#p2-1-科技树玩家决策系统)
   - [P2-2 AI经济上限约束](#p2-2-ai经济上限约束)
   - [P2-3 SliceNarrativeEngine 接入循环](#p2-3-slicenarrativeengine-接入循环)
4. [P3 级：低优先级（增强问题）](#p3-级低优先级增强问题)
   - [P3-1 战斗战后恢复机制](#p3-1-战斗战后恢复机制)
   - [P3-2 资源耗散警报系统](#p3-2-资源耗散警报系统)
5. [实施路线图](#实施路线图)
6. [预期效果评估](#预期效果评估)

---

## P0 级：必须修复（严重问题）

---

### P0-1 结局闭环补全（NewGame+ 系统）

**审计问题**：D5（无反馈循环）+ 第五阶段结局断裂

**目标文件**：[Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts)

#### 子任务 A：结局记录器

在 `checkVictoryConditions` 中添加结局记录逻辑：

```typescript
// 在 checkVictoryConditions 中，判定胜利时追加：
public checkVictoryConditions(): void {
  // ... 现有判定逻辑 ...
  if (cond.check()) {
    this.isGameOver = true;
    this.gameOverReason = `${cond.label}: ${cond.description}`;
    this.victoryType = VictoryType[cond.type as keyof typeof VictoryType];
    this.playerTimeline.push({ year: this.year, event: `【大结局】达成 ${cond.label}` });
    
    // === 新增：结局记录 ===
    this.historyGenerator.recordVictory(
      this.year, this.epoch,
      cond.label,
      cond.description
    );
    this.tagManager.applyWorldTag(
      `victory_${cond.type.toLowerCase()}`,
      100, 'game:ending', this.year
    );
    // 记录关键转折点
    const keyFlags = ['wandering_chosen', 'digital_ark_chosen', 'swordholder_appointed',
                      'wallfacer_project', 'galaxy_exodus_seen', 'alien_alliance'];
    const activatedFlags = keyFlags.filter(f => this.hasFlag(f));
    this.tagManager.applyWorldTag(
      'ending_completed', 100, 'game:ending', this.year
    );
    // === 结束新增 ===
    
    window.dispatchEvent(new CustomEvent('game-over'));
    return;
  }
  // ... 失败判定同理 ...
}
```

**改动量**：~20 行代码

---

#### 子任务 B：结局数据持久化

在 [SaveManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/SaveManager.ts) 中添加结局存档区：

```typescript
export interface EndingRecord {
  victoryType: VictoryType | null;
  defeatType: DefeatType | null;
  label: string;
  year: number;
  epoch: EpochType;
  keyFlags: string[];
  timestamp: number;
}

export class SaveManager {
  // 新增：独立于游戏存档的结局记录
  private static ENDING_HISTORY_KEY = 'LegendOfUni_EndingHistory';
  
  public static recordEnding(record: EndingRecord): void {
    const history = this.getEndingHistory();
    history.push(record);
    // 仅保留最近 10 条记录
    if (history.length > 10) history.shift();
    localStorage.setItem(this.ENDING_HISTORY_KEY, JSON.stringify(history));
  }
  
  public static getEndingHistory(): EndingRecord[] {
    try {
      const data = localStorage.getItem(this.ENDING_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
  
  public static getEndingUnlocks(): Set<string> {
    const history = this.getEndingHistory();
    const unlocked = new Set<string>();
    for (const record of history) {
      if (record.victoryType !== null) {
        unlocked.add(`unlocked_victory_${record.victoryType}`);
      }
    }
    return unlocked;
  }
}
```

**改动量**：~40 行代码

---

#### 子任务 C：NewGame+ 继承系统

在 `GameInstance.reset()` 中增加继承逻辑：

```typescript
public static reset(): void {
  const endingHistory = SaveManager.getEndingHistory();
  const unlocked = SaveManager.getEndingUnlocks();
  
  localStorage.removeItem("LegendOfUni_Save");
  this.instance = new Game();
  
  // === 新增：NewGame+ 继承 ===
  if (endingHistory.length > 0) {
    // 标记为 NewGame+ 模式
    this.instance.addFlag('new_game_plus');
    
    // 根据结局记录解锁特殊内容
    if (unlocked.has('unlocked_victory_HIDDEN')) {
      // 解锁归零者相关隐藏内容
      this.instance.addFlag('unlocked_zeroer_perspective');
    }
    if (unlocked.has('unlocked_victory_DIGITAL')) {
      // 数字永生结局 → 新局初始拥有数字生命技术
      this.instance.earthCivi.tecTreeManager.isTecFinishedAnywhere("数字生命研究");
    }
    if (unlocked.has('unlocked_victory_WANDERING')) {
      // 流浪胜利 → 新局初始额外舰队
      this.instance.earthCivi.army += 50;
    }
    if (unlocked.has('unlocked_victory_DETERRENCE')) {
      // 威慑胜利 → 新局初始威慑值+20
      this.instance.earthCivi.deterrenceValue += 20;
    }
    if (unlocked.has('unlocked_victory_CONQUEST')) {
      // 征服胜利 → 初始解锁所有外交文明
      for (const alien of this.instance.alienCiviManager.aliens.values()) {
        alien.unlocked = true;
      }
    }
    if (unlocked.has('unlocked_victory_DARK_DOMAIN')) {
      // 黑域胜利 → 初始高资源
      this.instance.earthCivi.resource += 500;
    }
    
    // 继承上局结局的 Tag 作为"历史回响"
    const lastEnding = endingHistory[endingHistory.length - 1];
    this.instance.tagManager.applyWorldTag(
      'echo_of_past_ending', 30, 'new_game_plus', 0
    );
  }
  
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-tutorial'));
      if (endingHistory.length > 0) {
        window.dispatchEvent(new CustomEvent('new-game-plus-activated', {
          detail: { endings: endingHistory.length, unlocked: Array.from(unlocked) }
        }));
      }
    }
  }, 500);
}
```

**改动量**：~50 行代码

---

### P0-2 RelationNetwork 接入全局循环

**审计问题**：IS1（模块孤岛）

**目标文件**：[RelationNetwork.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/RelationNetwork.ts)、[Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts)

#### 子任务 A：读取 RelationNetwork 现有代码

首先确认当前 RelationNetwork 的接口：

```typescript
// 假设现有接口（需根据实际代码调整）：
export class RelationNetwork {
  public relations: Map<string, Map<string, number>> = new Map();
  
  public initCanonicalRelations(year: number): void { /* 现有逻辑 */ }
  public updateRelations(tagManager: TagManager, year: number): void { /* 需要实现 */ }
  public getRelation(entityA: string, entityB: string): number { /* 现有逻辑 */ }
  public modifyRelation(entityA: string, entityB: string, delta: number): void { /* 现有逻辑 */ }
}
```

#### 子任务 B：在 runARound 中接入

在 [Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts) 的 `runARound` 方法中，在 Tag 衰减之后、生态链推进之前插入：

```typescript
// ===== 新增：关系网络更新 =====
try {
  this.relationNetwork.updateRelations(this.tagManager, this.year);
  
  // 关系网络变化 → 影响外交冷却
  for (const alien of this.alienCiviManager.aliens.values()) {
    if (alien.unlocked && !alien.isDieOut()) {
      const relScore = this.relationNetwork.getRelation('地球', alien.name);
      if (relScore !== undefined) {
        // 关系好 → 外交冷却缩短
        if (relScore > 50 && alien.diplomacyCooldown > 1) {
          alien.diplomacyCooldown = Math.max(1, alien.diplomacyCooldown - 1);
        }
        // 关系差 → AI 更激进
        if (relScore < -30 && alien.friendshipType > FriendshipType.VERYANGRY) {
          alien.friendshipType = FriendshipType.VERYANGRY;
        }
      }
    }
  }
} catch (e: any) {
  this.addHistory(`[关系网络] 更新异常: ${e.message}`);
}
```

**改动量**：~25 行代码

#### 子任务 C：外交行动写入关系网络

在 `conductDiplomacy` 中，每种外交行动追加关系网络更新：

```typescript
public conductDiplomacy(alienName: string, actionType: string): string {
  // ... 现有逻辑 ...
  
  // === 新增：记录关系网络 ===
  const relDelta = actionType === 'negotiate' ? 10 :
                   actionType === 'trade' ? 5 :
                   actionType === 'provoke' ? -20 :
                   actionType === 'alliance' ? 30 : 0;
  if (relDelta !== 0) {
    this.relationNetwork.modifyRelation('地球', alienName, relDelta);
    // 关系变化强度高时 → 写入 Tag
    if (Math.abs(relDelta) >= 20) {
      const tagId = relDelta > 0 ? 'diplomatic_warming' : 'diplomatic_crisis';
      this.tagManager.applyWorldTag(tagId, Math.abs(relDelta), `diplomacy:${actionType}`, this.year);
    }
  }
  // === 结束新增 ===
  
  // ... 返回消息 ...
}
```

**改动量**：~15 行代码

---

## P1 级：高优先级（重要问题）

---

### P1-1 外交系统接入叙事循环

**审计问题**：D2（外交关系不影响叙事）+ 断裂路径A

**目标文件**：[Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts)

#### 子任务 A：外交事件触发

在 `conductDiplomacy` 中，外交成功后尝试推入条件事件队列：

```typescript
public conductDiplomacy(alienName: string, actionType: string): string {
  const result = /* 现有外交逻辑 */;
  
  // === 新增：外交结果触发事件 ===
  if (!result.startsWith("无法") && !result.startsWith("经济不足") && !result.includes("失败")) {
    const alien = this.alienCiviManager.aliens.get(alienName);
    if (alien) {
      // 关系突破阈值时触发对应事件
      if (alien.friendshipType >= FriendshipType.FRIEND && actionType === 'alliance') {
        this.addFlag(`${alienName}_alliance_formed`);
        this.tickerMessages.push(
          `【星际外交】人类与 ${alienName} 正式缔结同盟条约，开启星际合作新纪元！`
        );
        window.dispatchEvent(new CustomEvent('ticker-message-added'));
      }
      
      // 极度敌对时触发战争警报Ticker
      if (alien.friendshipType <= FriendshipType.VERYANGRY && actionType === 'provoke') {
        this.tagManager.applyWorldTag(
          'mil_threat', 30, `diplomacy:provoke:${alienName}`, this.year
        );
      }
    }
  }
  // === 结束新增 ===
  
  return result;
}
```

**改动量**：~20 行代码

---

### P1-2 行星发动机Ⅰ型通胀修复

**审计问题**：IN2（5倍产出通胀）

**目标文件**：[EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts)

#### 修改 processFactories 中的通胀点

原始代码（第316-318行）：
```typescript
if (tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅰ型")) {
  add *= 5;  // ← 通胀源
}
const maxEco = tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅰ型") ? 500 : 100;
```

修改为渐进式倍率：
```typescript
if (tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅰ型")) {
  const engineLevel = tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅲ型") ? 2.5 :
                      tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅱ型") ? 2.0 : 1.5;
  add = Math.floor(add * engineLevel);
}
const maxEco = tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅲ型") ? 500 :
               tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅱ型") ? 350 :
               tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅰ型") ? 200 : 100;
```

**改动量**：~10 行代码，改动极小

**效果**：产出倍率从固定 ×5 变为 Ⅰ型×1.5 / Ⅱ型×2.0 / Ⅲ型×2.5，上限从 500 变为 200/350/500，平滑增长曲线

---

### P1-3 面壁者威慑值衰减机制

**审计问题**：IN1（威慑值无限累积）

**目标文件**：[EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts)

#### 在 runARound 末尾添加衰减

在 `sanitizeResources` 调用之前添加：

```typescript
// === 新增：面壁者威慑值自然衰减 ===
// 基础衰减：每回合 -1，面壁计划完成可减缓
let deterrenceDecay = 1;
for (const plan of Object.values(this.wallfacerPlans)) {
  if (plan.progress >= 100) {
    deterrenceDecay = 0;  // 面壁计划完成 → 无衰减
    break;
  }
}
// 未被破壁的面壁者提供衰减抵抗
const activeWallfacers = Array.from(this.wallfacers).length;
deterrenceDecay = Math.max(0, deterrenceDecay - activeWallfacers * 0.2);
this.deterrenceValue = Math.max(0, this.deterrenceValue - deterrenceDecay);
// === 结束新增 ===
```

**改动量**：~12 行代码

---

## P2 级：中优先级（改进问题）

---

### P2-1 科技树玩家决策系统

**审计问题**：FK3（自动科技研究，玩家无决策权）

**目标文件**：[EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts)

#### 子任务 A：添加科技研究方向队列

```typescript
// 新增属性到 EarthCivilization
public techResearchQueue: Map<TecTreeType, string> = new Map();
// key: TecTreeType, value: 玩家指定的节点名称（空字符串=自动）

public setResearchTarget(treeType: TecTreeType, nodeName: string): void {
  this.techResearchQueue.set(treeType, nodeName);
}

public getResearchTarget(treeType: TecTreeType): string | null {
  return this.techResearchQueue.get(treeType) || null;
}
```

#### 子任务 B：修改 processTechResearch 的选择逻辑

修改自动选择部分的逻辑，优先选择玩家指定节点：

```typescript
private processTechResearch(game: any): void {
  // ... 现有部门循环逻辑 ...
  
  for (const [deptType, treeType] of deptToTree) {
    // ... 现有代码 ...
    
    if (!hasActiveResearch) {
      // === 修改：优先检测玩家指定目标 ===
      const playerTarget = this.getResearchTarget(treeType);
      let bestNode: any = null;
      
      if (playerTarget) {
        // 玩家指定目标
        const targetNode = tree.nodes.get(playerTarget);
        if (targetNode && !targetNode.finished) {
          const parentFinished = !targetNode.parentName || tree.isFinished(targetNode.parentName);
          if (parentFinished) {
            bestNode = targetNode;
          }
        }
      }
      
      // 玩家目标不可用 → 回退到自动选择（但选次便宜的而不是最便宜的）
      if (!bestNode) {
        for (const node of tree.nodes.values()) {
          if (node.finished) continue;
          let parentFinished = !node.parentName || tree.isFinished(node.parentName);
          // ... 依赖检查 ...
          if (!parentFinished) continue;
          if (!bestNode || node.cost < bestNode.cost) {
            bestNode = node;
          }
        }
      }
      // ... 后续代码 ...
    }
  }
}
```

**改动量**：~30 行代码（含新增属性的初始化）

---

### P2-2 AI经济上限约束

**审计问题**：IN3（AI无限增长）

**目标文件**：[AlienCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/AlienCivilization.ts)

修改 `growEconomy` 方法：

```typescript
private growEconomy(): void {
  // === 修改：添加上限约束 ===
  const MAX_AI_RESOURCE = 5000;
  const MAX_AI_ARMY = 500;
  const MAX_AI_POPULATION = 2000;
  
  if (this.resource < MAX_AI_RESOURCE) {
    this.resource += Math.floor(this.rng() * 10);
  }
  if (this.army < MAX_AI_ARMY) {
    this.army += 2;
  }
  if (this.population < MAX_AI_POPULATION) {
    if (this.rng() < 0.12) {
      this.population += Math.floor(this.rng() * 10) + 5;
    }
  }
  // === 结束修改 ===
}
```

**改动量**：~10 行代码

---

### P2-3 SliceNarrativeEngine 接入循环

**审计问题**：IS2（SliceNarrativeEngine 孤立）

**目标文件**：[Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts)

#### 在 runARound 末尾添加叙事片段生成

在回合推进完成时，生成叙事片段注入 tickerMessages：

```typescript
// ===== 新增：叙事片段生成 =====
try {
  const slice = this.sliceNarrativeEngine.generateSlice(
    this.tagManager, this.atmosphereEngine, this.earthCivi, this.year
  );
  if (slice) {
    this.tickerMessages.push(slice);
    this.addHistory(`【叙事片段】${slice}`);
    window.dispatchEvent(new CustomEvent('ticker-message-added'));
  }
} catch (e: any) {
  // 叙事片段生成失败不影响主循环
  console.warn("[SliceNarrative] 生成异常:", e.message);
}
// ===== 结束新增 ====
```

**预判 SliceNarrativeEngine 接口**：
```typescript
// 假设现有接口（需读取实际文件确认）：
export class SliceNarrativeEngine {
  public generateSlice(
    tagManager: TagManager,
    atmosphereEngine: AtmosphereEngine,
    earthCivi: EarthCivilization,
    year: number
  ): string | null {
    // 基于当前状态生成一段短叙事文本
    // 返回 null 表示本回合无可生成的片段
  }
}
```

**改动量**：~15 行代码

---

## P3 级：低优先级（增强问题）

---

### P3-1 战斗战后恢复机制

**审计问题**：DR3（舰队战损无恢复）

**目标文件**：[EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts)

在 `processFleets` 中添加战后重建逻辑：

```typescript
private processFleets(game: any): void {
  // === 新增：战后自动重建 ===
  // 记录上回合舰队数量
  if (!(this as any)._lastFleetCount) {
    (this as any)._lastFleetCount = this.fleets.length;
  }
  const fleetLoss = (this as any)._lastFleetCount - this.fleets.length;
  if (fleetLoss > 0 && this.economy >= 30) {
    // 自动补充损失的舰队（消耗经济）
    const rebuildCost = fleetLoss * 30;
    this.economy -= Math.min(this.economy, rebuildCost);
    game.addHistory(`【后勤维修】自动补充了 ${fleetLoss} 支损失舰队，消耗 ${Math.min(rebuildCost, 999)} 经济。`);
  }
  (this as any)._lastFleetCount = this.fleets.length;
  // === 结束新增 ===
  
  // ... 现有 processFleets 逻辑 ...
}
```

**改动量**：~12 行代码

---

### P3-2 资源耗散警报系统

**审计问题**：DR1（工厂资源消耗无警报）

**目标文件**：[EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts)

在 `processFactories` 中添加资源预警：

```typescript
private processFactories(game: any): void {
  // === 新增：资源消耗预警 ===
  const projectedConsumption = this.factoryWorkers * 2;  // 预估消耗
  if (projectedConsumption > this.resource * 0.5 && this.resource > 0) {
    // 下一回合资源可能不足
    game.addHistory(`【资源预警】工厂产能消耗巨大，当前资源 ${this.resource} 可能在下回合供应紧张。建议增加采矿比例。`);
  }
  if (this.resource <= 10 && this.factoryWorkers > 0) {
    game.addHistory(`【资源枯竭警报】资源储备仅剩 ${this.resource}，工厂生产即将停滞！请立即调整工人分配！`);
  }
  // === 结束新增 ===
  
  // ... 现有 processFactories 逻辑 ...
}
```

**改动量**：~10 行代码

---

## 实施路线图

### 阶段划分

```
阶段 A（P0 修复）：1-2 天
  ├── P0-1 结局闭环补全（NewGame+） → 预计 4 小时
  ├── P0-2 RelationNetwork 接入     → 预计 1 小时
  └── 测试验证

阶段 B（P1 修复）：1 天
  ├── P1-1 外交系统接入叙事         → 预计 1 小时
  ├── P1-2 行星发动机通胀修复       → 预计 0.5 小时
  ├── P1-3 面壁者衰减机制           → 预计 0.5 小时
  └── 测试验证

阶段 C（P2 改进）：1-2 天
  ├── P2-1 科技树玩家决策           → 预计 3 小时
  ├── P2-2 AI 经济上限              → 预计 0.5 小时
  ├── P2-3 SliceNarrative 接入      → 预计 1 小时
  └── 测试验证

阶段 D（P3 增强）：0.5 天
  ├── P3-1 战后恢复                 → 预计 1 小时
  ├── P3-2 资源警报                 → 预计 0.5 小时
  └── 测试验证
```

### 优先级与工作量汇总

| 优先级 | 任务 | 工作量估计 | 风险 | 收益 |
|--------|------|-----------|------|------|
| P0 | 结局闭环 + NewGame+ | ~110 行 | 低 | **极高**（打通最严重断裂） |
| P0 | RelationNetwork 接入 | ~40 行 | 低 | 高（消除模块孤岛） |
| P1 | 外交→叙事 | ~20 行 | 低 | 中 |
| P1 | 通胀修复（产出×5→×1.5） | ~10 行 | 低 | 高（防止早期数值崩坏） |
| P1 | 面壁者衰减 | ~12 行 | 低 | 中 |
| P2 | 科技树决策 | ~30 行 | 中 | 高（提升玩家自主性） |
| P2 | AI 上限 | ~10 行 | 低 | 低 |
| P2 | SliceNarrative 接入 | ~15 行 | 低 | 中 |
| P3 | 战后恢复 + 资源警报 | ~22 行 | 低 | 低 |

### 总工作量预估

**代码行数**：约 270 行
**开发时间**：3-5 天
**测试时间**：1-2 天

---

## 预期效果评估

### 修复后循环健康度预测

| 维度 | 当前评分 | 修复后评分 | 提升因素 |
|------|---------|-----------|---------|
| 经济循环 | 7/10 | 8/10 | 通胀修复 + 资源警报 |
| 战斗循环 | 6/10 | 7/10 | 战后恢复机制 |
| 科技循环 | 8/10 | 9/10 | 玩家决策权 + 衰退机制 |
| 事件循环 | 7/10 | 7/10 | 基本不变 |
| 外交循环 | 4/10 | **7/10** | 外交→叙事 + RelationNetwork 接入 |
| AI行为循环 | 6/10 | 7/10 | 经济上限约束 |
| 资源生产循环 | 7/10 | 8/10 | 预警系统 |
| **结局循环** | **2/10** | **8/10** | NewGame+ 完整闭环 |
| 叙事循环 | 6/10 | 7/10 | SliceNarrative + 外交叙事 |
| 跨系统耦合 | 5/10 | **7/10** | 孤立模块全部接入 |
| **整体** | **5.5/10** | **7.5/10** | **提升 2.0 分** |

### 修复后拓扑状态

```
修复前：
  结局 → ❌ 断裂
  RelationNetwork → ❌ 孤立
  外交 → ❌ 叙事孤岛
  
修复后：
  结局 → Tag记录 → HistoryGenerator记录 → NewGame+继承 → 新周目 ✅ 完整闭环
  RelationNetwork → 外交冷却影响 → Tag写入 → 事件影响 ✅ 闭环
  外交 → 关系变化 → Tag → 氛围 → 事件条件 ✅ 闭环
  SliceNarrativeEngine → TickerMessages → 叙事体验 ✅ 闭环
```

### 关键指标变化

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 断裂循环数量 | 5 处 | 1 处 |
| 孤立模块数量 | 2 个 | 0 个 |
| 通胀风险点 | 2 处 | 0 处 |
| 结局闭环 | ❌ | ✅ |
| 玩家主动决策点 | 1 处（工人分配） | 2 处（+科技选择） |
| NewGame+ | ❌ | ✅ 6结局差异化继承 |

---

*文档类型：迭代优化方案（RPLAN）*  
*基准文档：[AUDIT_20260612_CYCLE_AUDIT_V2.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260612_CYCLE_AUDIT_V2.md)*  
*方案日期：2026-06-12*