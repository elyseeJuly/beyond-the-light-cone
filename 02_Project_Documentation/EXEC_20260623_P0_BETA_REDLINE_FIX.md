# TASK-P0: Beta 发布红线修复任务书

> **优先级**: P0（发布阻断）  
> **依赖**: 无  
> **预估影响范围**: 6 文件，约 200 行变更  
> **AI 接手指引**: 本任务为独立修复，不依赖其他任务文档。每个 bug 可独立修复和验证。

---

## 背景

[AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md) 定义了 4 项 Beta 前红线，本任务书覆盖其中 3 项（结局 Flag 已在 6/23 审计修复中完成）。另外补充 [AUDIT_REPORT_20250623.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260623_QA_CODE_AUDIT.md) 中剩余未修复的 P1 项。

---

## 任务 1：移除 CombatEngine 硬编码武器回退

**文件**: `src/core/CombatEngine.ts`  
**位置**: 第 267-278 行，`calculateFleetPower()` 方法

### 当前代码

```typescript
private static calculateFleetPower(fleet: Fleet): number {
    if (!fleet.weapons || fleet.weapons.length === 0) {
      fleet.weapons = [];
      if (fleet.belongToCivi === "地球") {
        fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 20 });
      } else if (fleet.belongToCivi === "三体") {
        fleet.weapons.push({ weaponName: "水滴型战舰", currentBuild: 80 });
        fleet.weapons.push({ weaponName: "强互作用探测器", currentBuild: 40 });
      } else {
        fleet.weapons.push({ weaponName: "星际无畏舰", currentBuild: 50 });
      }
    }
    // ... 正常计算逻辑
```

### 问题

无武器舰队自动获得高额战舰，玩家发现"没造船也能打赢"，策略性归零。这是测试用的硬编码回退，但污染了生产代码。

### 修复方案

```typescript
private static calculateFleetPower(fleet: Fleet): number {
    if (!fleet.weapons || fleet.weapons.length === 0) {
      return 0; // 无武器舰队战斗力为 0
    }
    // ... 正常计算逻辑
```

### 验证

- 运行 `npx vitest run src/test/core/` 确保战斗相关测试仍通过
- 手动测试：创建无武器舰队，确认战斗力为 0

---

## 任务 2：快照泄漏修复

**文件**: 需定位 `SnapshotManager` 或快照相关的类  
**症状**: 读档后状态错乱，玩家发现"读档前后不一样"

### 排查步骤

1. 搜索 `snapshot` 或 `rollback` 关键词，定位快照管理代码
2. 检查 `Game.rollbackToFateDivergence()`（[Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1334) 和 [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1561) 有两处同名方法）
3. 检查快照创建时是否深拷贝了所有可变状态（Map / Set / 对象引用）

### 修复原则

- 快照必须使用 `structuredClone()` 或 `JSON.parse(JSON.stringify())` 深拷贝
- 特别关注 `flags: Set<string>`、`departments: Map<DepartmentType, Department>`、`wallfacerPlans: Record<>` 等引用类型
- 修复后添加单元测试：创建快照 → 修改状态 → 回滚 → 断言状态等于快照时刻

### 验证

- 新增测试：`Game.snapshotIntegrity.test.ts`
- 手动测试：游戏中存档 → 继续玩 5 回合 → 读档 → 确认状态回到存档时刻

---

## 任务 3：存档损坏防护加固

**文件**: `src/core/SaveManager.ts`、`src/core/Game.ts`

### 当前状态

6/23 审计修复中已添加 `_hadRunError` 标记和 `_yearJustAdvanced` 安全锁，但仍有以下缺口：

1. **`saveToSlot` 中 `JSON.stringify` 可能抛异常**（循环引用）：当前无 try/catch
2. **`loadFromSlot` 中 `JSON.parse` 可能抛异常**（损坏数据）：当前有 try/catch 但返回 null 后 UI 无提示
3. **`validateSaveIntegrity()` 使用 DJB2 哈希**：只能检测篡改，不能检测"合法但语义错误"的数据（如 population=-1）

### 修复方案

#### 3a. 序列化异常保护

在 `saveToSlot()` 中：
```typescript
try {
  const json = serializer();
  // ... 现有逻辑
} catch (err) {
  console.error('SaveManager: serialization failed', err);
  window.dispatchEvent(new CustomEvent('save-failed', { 
    detail: { message: '存档序列化失败，请重试' } 
  }));
  return false;
}
```

#### 3b. 加载损坏提示

在 `loadFromSlot()` 的 catch 块中，dispatch 事件通知 UI：
```typescript
catch (err) {
  console.error('SaveManager: load failed', err);
  window.dispatchEvent(new CustomEvent('save-corrupted', {
    detail: { slotId, message: '存档数据损坏，无法读取' }
  }));
  return null;
}
```

#### 3c. 语义校验增强

在 `validateSaveIntegrity()` 中增加：
```typescript
// 语义校验：关键字段合法性
if (data.year < 0 || data.epoch < 0 || data.epoch > 6) return false;
if (data.earthCivi && data.earthCivi.population < 0) return false;
if (data.earthCivi && data.earthCivi.economy < 0) return false;
```

### 验证

- 手动测试：故意损坏 localStorage 数据 → 加载 → 确认 UI 提示"存档损坏"
- 手动测试：模拟 JSON.stringify 抛异常 → 确认 UI 提示"保存失败"

---

## 任务 4：结局文案与类型不匹配修复

**文件**: `src/core/Game.ts`，`checkGameOverConditions()` / `checkVictoryConditions()`

### 问题

BUG-05：HELIUM_FLASH 结局在 `strict_three_body` 模式下显示"二向箔打击"文案。

### 排查步骤

1. 搜索 `gameOverReason` 的赋值位置（约 10 处）
2. 交叉比对每个 `defeatType` 赋值与对应的 `gameOverReason` 文案
3. 特别检查 `strict_three_body` 和 `liu_cixin_mixed` 两种 lore 模式下的文案分支

### 修复

确保每个 defeatType 有唯一的、正确的文案。如果存在 lore 模式差异，确保分支逻辑正确。

### 验证

- 新增测试：`Game.endingMessageConsistency.test.ts`，覆盖所有 defeatType × loreMode 组合

---

## 任务 5：补充结局可达性端到端测试

**文件**: 新增 `src/test/integration/EndingReachability.test.ts`

### 要求

创建测试验证：玩家通过正常事件选择 → flag 设置 → 胜利条件触发的完整链路。当前所有胜利测试都通过 `game.addFlag()` 直接注入 flag，绕过了真实路径。

### 测试清单

| 结局 | 测试路径 |
|------|---------|
| CONQUEST | 外交征服所有外星文明 → `conquest_declared` flag |
| DETERRENCE | 建立威慑 → 维持 20 回合 → `swordholder_appointed` |
| DARK_DOMAIN | 黑域辩论事件 → 选择黑域 → `dark_domain_decision` flag |
| WANDERING | 流浪地球决策 → 选择流浪 → `wandering_completed` flag |
| DIGITAL | 数字方舟升级事件 → `digital_ark_upgrade` flag |
| HIDDEN | 接触归零者 → 建造小宇宙 → `mini_universe_built` flag |
| TREACHERY | 背叛值 ≥ 100 |
| EXTINCTION | 人口 = 0 |
| HELIUM_FLASH | year > 350 且无逃生科技 |
| DIMENSION_STRIKE | 二向箔打击触发 |
| ETERNAL_EXILE | 银河纪元 + 人口 ≤ 5 + `galaxy_exodus_seen` |
| COSMIC_SILENCE | BUNKER + 人口 ≤ 10 + `dark_domain_decision` + 威慑 < 20 |

### 验证

- `npx vitest run src/test/integration/EndingReachability.test.ts` 全部通过

---

## 完成标准

- [ ] CombatEngine 硬编码武器回退已移除，无武器舰队战斗力为 0
- [ ] 快照泄漏已修复，回滚后状态与快照时刻一致
- [ ] 存档序列化/反序列化异常有 UI 提示
- [ ] 存档语义校验覆盖负值/越界
- [ ] 结局文案与类型完全一致
- [ ] 12 个结局各有至少 1 条端到端可达性测试

---

*本任务书基于 [AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md) 和 [AUDIT_REPORT_20250623.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260623_QA_CODE_AUDIT.md) 编写。*