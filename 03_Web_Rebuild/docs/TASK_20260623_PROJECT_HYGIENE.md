# TASK-HYGIENE: 项目卫生清理

> **优先级**: P2（低风险，高收益）  
> **依赖**: 无，可随时独立执行  
> **来源**: [AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md) 第二、三节  
> **预估影响范围**: 22 文件，约 100 行变更  
> **AI 接手指引**: 三个子任务完全独立，可并行执行。

---

## 概述

当前项目存在三个低风险但影响面广的卫生问题：
1. 88 处 `console.log/warn/error` 残留，控制台刷屏
2. 硬编码测试数据污染生产代码（CombatEngine 武器回退已在 TASK-P0 中处理）
3. 文档数量膨胀，缺少单一可信状态看板

---

## 子任务 1：console 日志分级清理

### 文件分布

| 文件 | 数量 | 清理策略 |
|------|------|---------|
| `Game.ts` | 11 | 保留 `error` 级别，删除 `log` 级别 |
| `main.tsx` | 10 | 保留 `error`/`warn` 级别，删除 `log` 级别 |
| `EndGameScreen.tsx` | 9 | 保留 `error` 级别，删除 `log` 级别 |
| `BgmPlayer.tsx` | 7 | 保留 `error` 级别，删除 `log` 级别 |
| `AssetLoader.ts` | 5 | 保留 `error`/`warn` 级别 |
| `SaveManager.ts` | 5 | 保留 `error`/`warn` 级别 |
| `IndexedDBStorage.ts` | 7 | 保留 `error` 级别 |
| `GameEventManager.ts` | 4 | 保留 `warn` 级别，删除 `log` 级别 |
| `PatchManager.ts` | 4 | 保留 `error`/`warn` 级别 |
| `StatisticsManager.ts` | 3 | 保留 `warn` 级别 |
| `AudioManager.ts` | 1 | 保留 `warn` 级别 |
| `EarthCivilization.ts` | 1 | 保留 `warn` 级别 |
| `MuseumGallery.tsx` | 2 | 改为静默，删除 `log` |
| `StarMap.tsx` | 1 | 保留 `error` 级别 |
| `UpdatePrompt.tsx` | 2 | 保留 `error` 级别 |
| `TechUnlockModal.tsx` | 1 | 保留 `warn` 级别 |
| `ErrorBoundary.tsx` | 1 | 保留（必须） |
| `EventBus.ts` | 1 | 保留 `error` 级别 |
| `TagManager.ts` | 2 | 保留 `warn` 级别 |
| `App.tsx` | 1 | 改为 `debug` 或删除 |
| 测试文件 | 4 | 保留（测试专用） |

### 清理规则

```typescript
// ❌ 删除：信息性日志，对调试无长期价值
console.log("[History]", prefix + log);
console.log("[Flag] Activated:", flag);
console.log("[Narrative] Triggered Choice:", e.name);
console.log("Auto-loaded save data");
console.log('Legend of Uni Web (React) started');
console.log("Initializing Game Engine...");
console.log("Initializing Statistics Manager...");

// ✅ 保留：错误和警告，用于故障排查
console.error("Critical error in runARound:", err);
console.warn("Turn blocked by processing lock");
console.error("Save data integrity check failed, resetting game.");
console.error("Failed to load game:", e);
```

### 推荐清理方式

使用 `Edit` 工具逐文件处理，确保每个删除的 `console.log` 不是唯一的问题追踪手段。对于确实需要保留的调试信息，使用条件编译：

```typescript
if (import.meta.env.DEV) {
  console.log("[Debug]", message);
}
```

### 验证

- 清理后 `grep -c "console\.log" src/` 数量从 ~50 降至 ~15
- 保留的 `console.error/warn` 数量不变
- 游戏正常运行，控制台不再刷屏

---

## 子任务 2：移除硬编码测试数据

### 2.1 CombatEngine 武器回退（已在 TASK-P0 任务 1 中处理）

位置：[CombatEngine.ts:267-278](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/CombatEngine.ts#L267-L278)

详见 [TASK_20260623_P0_BETA_REDLINE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/docs/TASK_20260623_P0_BETA_REDLINE.md) 任务 1。

### 2.2 搜索其他硬编码测试数据

```bash
grep -rn "TODO\|FIXME\|HACK\|TEMP\|TEST" src/ --include="*.ts" --include="*.tsx" | grep -v "test/" | grep -v "node_modules"
```

检查所有结果，判断是否为硬编码测试数据。如发现，移除或标记为条件编译。

### 验证

- 无武器舰队战斗力为 0（非 20/50/80）
- 无其他硬编码测试数据残留

---

## 子任务 3：建立单一 STATUS.md 看板

### 目标

停止产出新的 AUDIT/EXEC 文档，建立单一可信状态看板，以代码红线命令实际输出为完成度唯一基准。

### 3.1 创建 `STATUS.md`

**新文件**: `03_Web_Rebuild/STATUS.md`

```markdown
# 项目状态看板

> 最后更新：2026-06-23
> 更新方式：运行 `npm run status` 自动生成

## 核心指标

| 指标 | 值 | 命令 |
|------|-----|------|
| TypeScript 编译 | ✅ 通过 | `npx tsc --noEmit` |
| 测试总数 | 833 | `npx vitest run --reporter=json` |
| 测试通过率 | 100% | ↑ |
| 语句覆盖率 | 76.38% | `npx vitest run --coverage` |
| 分支覆盖率 | 68.75% | ↑ |
| Game.ts 行数 | 1599 | `wc -l src/core/Game.ts` |
| console 残留 | 88 | `grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l` |

## 结局可达性

| 结局 | Flag 已赋值 | 有端到端测试 | 状态 |
|------|-----------|------------|------|
| CONQUEST | ✅ | ❌ | ⚠️ |
| DETERRENCE | ✅ | ❌ | ⚠️ |
| DARK_DOMAIN | ✅ | ❌ | ⚠️ |
| WANDERING | ✅ | ❌ | ⚠️ |
| DIGITAL | ✅ | ❌ | ⚠️ |
| HIDDEN | ✅ | ❌ | ⚠️ |
| TREACHERY | — | ❌ | ⚠️ |
| EXTINCTION | — | ❌ | ⚠️ |
| HELIUM_FLASH | — | ✅ | ✅ |
| DIMENSION_STRIKE | — | ❌ | ⚠️ |
| ETERNAL_EXILE | ✅ | ❌ | ⚠️ |
| COSMIC_SILENCE | ✅ | ❌ | ⚠️ |

## Beta 红线

| 红线 | 状态 |
|------|------|
| 存档损坏 bug | ❌ 未修复 |
| 结局 Flag 赋值 | ✅ 已修复 |
| 硬编码武器回退 | ❌ 未修复 |
| 快照泄漏 | ❌ 未修复 |

## 当前活跃任务

- [ ] TASK-P0: Beta 发布红线修复
- [ ] TASK-AP: 执政指令点与 AI 智脑
- [ ] TASK-EVENT: 事件实体化集成
- [ ] TASK-ARCH: 架构债务清理
- [ ] TASK-HYGIENE: 项目卫生清理
```

### 3.2 创建自动生成脚本

**新文件**: `scripts/generate-status.sh`

```bash
#!/bin/bash
echo "# 项目状态看板" > STATUS.md
echo "" >> STATUS.md
echo "> 自动生成时间：$(date '+%Y-%m-%d %H:%M')" >> STATUS.md
echo "" >> STATUS.md

# 编译状态
echo "## 编译状态" >> STATUS.md
npx tsc --noEmit 2>&1
if [ $? -eq 0 ]; then
  echo "- TypeScript: ✅ 通过" >> STATUS.md
else
  echo "- TypeScript: ❌ 失败" >> STATUS.md
fi

# 测试状态
echo "## 测试状态" >> STATUS.md
TEST_RESULT=$(npx vitest run --reporter=json 2>&1 | tail -1)
echo "- $TEST_RESULT" >> STATUS.md

# Game.ts 行数
echo "## 代码规模" >> STATUS.md
GAME_LINES=$(wc -l < src/core/Game.ts)
echo "- Game.ts: $GAME_LINES 行" >> STATUS.md

# console 残留
CONSOLE_COUNT=$(grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l)
echo "- console 残留: $CONSOLE_COUNT 处" >> STATUS.md
```

### 3.3 停止产出新 AUDIT/EXEC 文档

- 在 `02_Project_Documentation/` 中新增 `README.md`，说明新文档归档规则：仅 `STATUS.md` 为权威状态，AUDIT/EXEC 仅在有重大架构变更时产出
- 对现有 150 份文档不做删除，但不再新增同类文档

### 验证

- `STATUS.md` 内容与 `npx tsc --noEmit` / `npx vitest run` 输出一致
- 文档产出速度从 3.6 份/天降至 ≤ 0.5 份/天

---

## 完成标准

- [ ] console.log 数量从 ~50 降至 ~15（仅保留 error/warn）
- [ ] 硬编码测试数据全部移除（CombatEngine + 其他）
- [ ] `STATUS.md` 已创建，内容与代码实际状态一致
- [ ] `generate-status.sh` 脚本可运行
- [ ] `02_Project_Documentation/README.md` 已创建，说明新归档规则
- [ ] `npx vitest run` 全部通过，无回归

---

*本任务书基于 [AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md) 编写。*