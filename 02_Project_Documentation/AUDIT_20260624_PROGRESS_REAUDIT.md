# 《光锥之外：纪元往事》项目进展复核审计报告

> **审计日期**: 2026-06-24
> **基准文档**: [AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md)（昨日全项目失败路径审计）
> **审计目的**: 以昨日报告为基准，核实问题当前状态，识别改善 / 恶化 / 未变
> **审计方法**: 亲自核实代码点 + 实跑测试 + 工作树 diff 分析
> **项目定位**: 个人主导 + AI 协作的同人练手项目，非商业发布

---

## 〇、审计背景

昨日（2026-06-23）审计后，工作树出现 30 个文件的未提交修改 + 3 个新文件，表明另一路 AI 已针对项目开展新一轮工作。本审计核实：**昨日指出的问题是否被修复？新工作是否引入新风险？优先级是否正确？**

### 工作树未提交变更概况

- **新文件**：`STATUS.md`（状态看板）、`AUDIT_20260624_AP_AI_BRAIN_REPORT.md`、`AUDIT_20260624_EVENT_BOARD_INTEGRATION_REPORT.md`
- **修改的核心文件**：Game.ts、CombatEngine.ts、SaveManager.ts、EventSystem.ts、AlienCivilization.ts、EarthCivilization.ts、TopHUD.tsx 等 30 个
- **新增功能**：TASK-EVENT（事件实体化集成）、TASK-AP（AP 指令点 + AI 智脑系统）

---

## 一、昨日 Beta 红线问题核实（最关键）

昨日报告指出 4 项 Beta 前必须修复的红线。核实结果：

| 红线项 | 昨日状态 | 今日核实 | 判定 |
|--------|---------|---------|------|
| **存档损坏 bug（BUG-03）** | 错误状态写入存档致损坏 | [Game.ts:715-722](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L715-L722) finally 块已加 `if (!this._hadRunError)` 守卫 | ✅ **已修复** |
| **快照泄漏 bug（BUG-01）** | 早期返回前推入 turnHistory 致快照泄漏 | [Game.ts:329-346](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L329-L346) 推入位置已移到阻断器检查（322-324）之后 | ⚠️ **结构改善，运行时未验证** |
| **硬编码武器回退** | CombatEngine 无武器舰队自动获得战舰 | [CombatEngine.ts:326-331](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/CombatEngine.ts#L326-L331) **仍存在**：恒星级战舰×20 / 水滴×80 / 强互作用探测器×40 / 星际无畏舰×50 | ❌ **未修复** |
| **结局 Flag 赋值** | 7 个结局 Flag 从未赋值 | 逐一核实 8 个关键 Flag，**5 个仍未赋值**（见下表） | ❌ **未修复** |

### 结局 Flag 赋值逐一核实

| Flag 名 | 赋值位置 | 状态 |
|---------|---------|------|
| `wandering_completed` | [PlanetEngine.ts:66](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/PlanetEngine.ts#L66) | ✅ 已赋值 |
| `conquest_declared` | [Game.ts:842](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L842) | ✅ 已赋值 |
| `alien_alliance` | [Game.ts:1206](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1206) | ✅ 已赋值 |
| `digital_ark_upgrade` | **未找到 setFlag/addFlag** | ❌ **未赋值** |
| `dark_domain_decision` | **未找到 setFlag/addFlag** | ❌ **未赋值** |
| `swordholder_appointed` | **未找到 setFlag/addFlag** | ❌ **未赋值** |
| `wallfacer_project` | **未找到 setFlag/addFlag** | ❌ **未赋值** |
| `galaxy_exodus_seen` | **未找到 setFlag/addFlag** | ❌ **未赋值** |

**结论**：5 个关键结局 Flag 仍未赋值，对应结局分支无法触发。结局 CG 已画但玩家看不到。

### 红线总判定

**4 项红线中，1 项已修复，1 项结构改善，2 项仍未修复。** Beta 红线任务（TASK-P0）在 [STATUS.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/STATUS.md) 中标记为未完成 `[ ]`，与代码核实一致。

---

## 二、新工作引入的风险（恶化项）

### 2.1 测试回归（最严重）

**实跑测试结果**：`832 passed | 1 failed (833)`

- 失败测试：[SaveLoad.test.ts:52](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/integration/SaveLoad.test.ts#L52) — 期望存档版本号 `3`，实际为 `4`
- 原因：TASK-AP 将 `SAVE_VERSION` 升级至 4，但集成测试未同步更新
- **STATUS.md 谎报**：[STATUS.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/STATUS.md) 声称"833 测试 100% 通过"，实际 832/833

**病理印证**：这正是昨日报告指出的"完成度幻觉"——状态看板本身就不准确。新建的 STATUS.md 本应是"单一可信状态看板"，却在第一次使用时就失真。

### 2.2 上帝类膨胀

| 文件 | 昨日行数 | 今日行数 | 增量 | 原因 |
|------|---------|---------|------|------|
| [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) | 1599 | **1700** | +101 | 新增 `runAIBrain()` / `getTurnBlockers()` |
| [EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts) | 609 | **759** | +150 | 新增 AP 字段与 9 个方法 |
| [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts) | 1081 | 1081 | 0 | 未变 |

**病理印证**：昨日报告失败路径 1"架构债务压垮开发速度"的实时预演。在 Game.ts 上帝类未拆分的情况下继续往里加功能，债务持续累积。

### 2.3 优先级错位（昨日病理的实时印证）

[STATUS.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/STATUS.md) 显示的任务状态：

| 任务 | 状态 | 性质 |
|------|------|------|
| TASK-P0: Beta 发布红线修复 | `[ ]` 未完成 | **修复**（昨日红线） |
| TASK-AP: 执政指令点与 AI 智脑 | `[ ]` 未完成（但报告称已完成） | **新功能** |
| TASK-EVENT: 事件实体化集成 | `[x]` 已完成 | **新功能** |
| TASK-ARCH: 架构债务清理 | `[ ]` 未完成 | **重构**（昨日建议） |
| TASK-HYGIENE: 项目卫生清理 | `[ ]` 未完成 | **清理**（昨日建议） |

**关键问题**：在 Beta 红线（TASK-P0）未完成、架构债务（TASK-ARCH）未清理的情况下，**先做了两个新功能**（TASK-EVENT + TASK-AP）。这正是昨日报告指出的"继续投入而非冻结+重构"失败路径的实时上演。

### 2.4 STATUS.md 自身的不一致

- TASK-AP 在 STATUS.md 标记 `[ ]` 未完成，但 [AUDIT_20260624_AP_AI_BRAIN_REPORT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_AP_AI_BRAIN_REPORT.md) 声称所有完成标准已勾选 `[x]`
- STATUS.md 声称 833 测试 100% 通过，实际 832/833
- 状态看板与执行报告、实际测试结果三方不一致

---

## 三、未变化的债务（停滞项）

昨日指出的下列问题今日仍未处理：

| 债务项 | 昨日状态 | 今日状态 | 变化 |
|--------|---------|---------|------|
| 遗留 UI 层（src/ui/*.ts） | 7 文件 1672 行 | 7 文件 **1683 行** | +11 行（StarMapRenderer 增长） |
| console 残留 | 88 处跨 22 文件 | **88 处** | 无变化 |
| Tauri 桌面端空壳 | main.rs 13 + steamworks.rs 46 | **59 行** | 无变化 |
| GameEventManager.ts 过大 | 1081 行 | **1081 行** | 无变化 |
| Flag 系统失控 | 23 死 Flag + 17 命名不一致 | 未重新清点（无证据表明已清理） | 未知 |
| UI 双轨制 | legacy 桥接仍在 | App.tsx 仍在修改但未移除桥接 | 无变化 |

---

## 四、文档系统状态

### 4.1 新增文档

- [STATUS.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/STATUS.md)：状态看板（昨日建议的"单一可信状态看板"，已建立但首次使用即失真）
- [AUDIT_20260624_AP_AI_BRAIN_REPORT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_AP_AI_BRAIN_REPORT.md)：AP 系统执行报告
- [AUDIT_20260624_EVENT_BOARD_INTEGRATION_REPORT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_EVENT_BOARD_INTEGRATION_REPORT.md)：事件实体化执行报告

### 4.2 文档病理延续

- **完成度幻觉**：STATUS.md 首次使用即谎报测试通过数（833 vs 832）
- **三联文档碎片化**：TASK-AP 报告含"完成标准核对 / 修改文件清单 / 核心机制说明 / 验证结果"四段式，信息密度尚可但仍是流程开销
- **多 AI 传话筒**：昨日报告由本 AI 撰写，今日工作由另一路 AI 执行，STATUS.md 是两者交接点——但交接信息已失真

---

## 五、改善项（客观记录）

尽管优先级错位，新工作仍带来以下改善：

1. **存档损坏 bug 已修复**——finally 块加 `_hadRunError` 守卫，不再写入错误状态
2. **快照泄漏 bug 结构改善**——turnHistory 推入位置后移到阻断器检查之后
3. **STATUS.md 已建立**——虽有失真，但状态看板机制本身是正向一步
4. **AP 系统设计完整**——AP 恢复 / 消耗 / AI 托管 / 回合阻断器逻辑闭合，存档版本迁移 v3→v4 已实现
5. **事件实体化扩展**——4 种新效果类型（spawn_barback / lock_ratio / rush_tech / build_infrastructure）使事件能作用于星图

---

## 六、当前项目真实状态总览

### 6.1 核心指标核实

| 指标 | STATUS.md 声称 | 实际核实 | 一致性 |
|------|--------------|---------|--------|
| TypeScript 编译 | ✅ 通过 | 未跑 typecheck，但测试能跑 | 待核实 |
| 测试总数 | 833 | 833 | 一致 |
| 测试通过率 | 100% | **99.88%**（832/833） | **不一致** |
| Game.ts 行数 | — | 1700（昨日 1599，+101） | 膨胀 |
| Beta 红线 | TASK-P0 未完成 | 核实：2/4 红线未修复 | 一致 |

### 6.2 昨日问题修复进度

| 问题类别 | 昨日数量 | 已修复 | 未修复 | 进度 |
|---------|---------|--------|--------|------|
| Beta 红线 | 4 | 1.5（存档损坏✅ + 快照泄漏⚠️） | 2（硬编码 + 结局Flag） | 37.5% |
| 技术风险 | 9 | 1（存档损坏） | 8 | 11% |
| 伪进度 | 9 | 0 | 9 | 0% |
| 文档病理 | 7 | 0（STATUS.md 建立但首次失真） | 7 | 0% |

### 6.3 新增风险

| 新风险 | 严重度 | 来源 |
|--------|--------|------|
| 测试回归（1 失败） | 高 | TASK-AP 升级存档版本未同步测试 |
| STATUS.md 失真 | 高 | 状态看板谎报通过率 |
| Game.ts 持续膨胀 | 中 | AP/AI 逻辑加入上帝类 |
| 优先级错位 | 高 | 红线未修先做新功能 |

---

## 七、结论与建议

### 7.1 核心判断

**昨日报告的病理特征正在实时上演，且未被纠正。**

具体表现：
1. **优先级错位**：红线未修先做新功能（TASK-EVENT + TASK-AP），正是"继续投入而非冻结+重构"
2. **完成度幻觉**：STATUS.md 首次使用即谎报测试通过数
3. **架构债务累积**：Game.ts 1700 行（+101），EarthCivilization.ts 759 行（+150）
4. **多 AI 无协调**：本 AI 昨日建议"冻结功能"，另一路 AI 今日继续加新功能

### 7.2 紧急建议

**立即执行（优先级最高）：**

1. **修复测试回归**：更新 [SaveLoad.test.ts:52](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/integration/SaveLoad.test.ts#L52) 版本号断言从 3 改为 4
2. **修正 STATUS.md**：将测试通过率改为 832/833，或修复失败测试后再改回 100%
3. **移除硬编码武器回退**：[CombatEngine.ts:326-331](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/CombatEngine.ts#L326-L331)
4. **补全 5 个结局 Flag 赋值**：digital_ark_upgrade / dark_domain_decision / swordholder_appointed / wallfacer_project / galaxy_exodus_seen

**短期执行（冻结功能后）：**

5. 停止所有新功能开发（TASK-AP 后续 / TASK-EVENT 后续）
6. 启动 TASK-ARCH：拆分 Game.ts 上帝类
7. 启动 TASK-HYGIENE：清理遗留 UI 层、console 残留

### 7.3 学习价值评估（练手项目视角）

作为练手项目，当前阶段暴露的问题是**高价值的学习素材**：

- **优先级管理教训**：在债务未清时加新功能的后果正在实时显现
- **状态看板教训**：自动化状态追踪若不与实际验证绑定，会成为新的失真源
- **多 AI 协作教训**：多路 AI 并行若无统一裁决，会互相抵消成果
- **架构债务教训**：上帝类不拆分持续加功能的膨胀速度（2 天 +101 行）

**建议将这些实时教训沉淀为学习笔记**，而非仅作为审计文档归档。

---

## 八、审计核实记录

### 8.1 本次亲自核实项

| 核实项 | 方法 | 结果 |
|--------|------|------|
| 测试通过数 | `npx vitest run` | 832/833（1 失败） |
| Game.ts 行数 | `wc -l` | 1700（昨日 1599） |
| EarthCivilization.ts 行数 | `wc -l` | 759（昨日 609） |
| CombatEngine 硬编码 | `grep` | 仍在第 326-331 行 |
| 存档损坏 bug | 读 Game.ts:715-722 | 已修复（_hadRunError 守卫） |
| 快照泄漏 bug | 读 Game.ts:329-346 | 结构改善（推入位置后移） |
| 结局 Flag 赋值 | `grep` 8 个 Flag | 3 个已赋值，5 个未赋值 |
| 遗留 UI 层 | `wc -l src/ui/*.ts` | 1683 行（昨日 1672） |
| console 残留 | `grep -c` | 88 处（无变化） |
| Tauri 骨架 | `wc -l` | 59 行（无变化） |
| STATUS.md 准确性 | 对比实跑测试 | 谎报（声称 100%，实际 99.88%） |

### 8.2 与昨日报告的偏差修正

| 项 | 昨日报告 | 今日核实修正 |
|----|---------|------------|
| 未赋值结局 Flag 数 | 7 个 | **5 个**（wandering_completed / conquest_declared / alien_alliance 已赋值） |

---

**审计完成。**

本报告作为本地归档，记录 2026-06-24 时点相对昨日基准的项目进展。核心结论：**昨日指出的病理特征正在实时上演，优先级错位是最危险的信号。**
