# 新手教程简化与新手指引优化执行报告

> **文档编号**: EXEC_20260713_TUTORIAL_SIMPLIFICATION_REPORT  
> **日期**: 2026-07-13  
> **归档类别**: 实施执行与验证报告 (Execution & Verification Report)  
> **前置文档**:
> - [AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md](./AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md)（AP 系统与阻断器审计）
> - [SPEC_20260712_AP_SYSTEM_REDESIGN.md](./SPEC_20260712_AP_SYSTEM_REDESIGN.md)（AP 系统重设计规范）
> - [EXEC_20260626_CHRONICLES_AND_TUTORIAL_OPTIMIZATION_REPORT.md](./EXEC_20260626_CHRONICLES_AND_TUTORIAL_OPTIMIZATION_REPORT.md)（上一轮教程优化报告）

---

## 一、任务背景与核心诉求

针对玩家反馈的**"新手教程太难、看不懂、字太多"**问题，本次优化聚焦于降低新玩家上手门槛，在不重构教程架构、不新建复杂状态机的前提下，对强制教程、回合阻断、情境提示三个层面进行简化与优化。

核心目标：
1. **强制教程精简**：从 12 步压缩到 4 步，去除长篇说明，每步文案 ≤ 25 汉字
2. **真实操作验证**：教程步骤通过事件监听 + 轮询验证玩家真实操作，而非点击"下一步"
3. **阻断器宽限期**：前 3 回合内"科研停滞"与"部门首长空缺"降级为警告，不阻断回合推进
4. **一次性情境提示**：首次遇到关键情境时通过 Toast 给出简短提示，每设备仅出现一次
5. **可选新手任务清单**：教程结束后展示可折叠任务清单，引导玩家探索核心玩法

---

## 二、方案设计与核心实现

### 2.1 强制教程四步精简

**文件**: [Tutorial.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/Tutorial.tsx)

**核心改动**:
- 将原 12 步教程重构为 4 步核心操作流程
- 动态步骤生成：根据开局是否已有采矿场（`hasStope`）切换第 2 步的文案与高亮目标
- 移除"下一步"按钮，仅保留"跳过教程"，通过真实操作验证推进步骤
- 教程启动时自动关闭 AI 智脑，退出时恢复原状态

**四步流程**:

| 步骤 | ID | 标题 | 说明 | 高亮目标 |
|------|-----|------|------|----------|
| 1 | `click-earth` | 选中家园 | 点击地球，选中你的家园。 | `earth-star` |
| 2 | `resource-production` | 资源生产 | 拖动采矿滑块 / 点击建造采矿场 | `mining-ratio-section` / `btn-build-stope` |
| 3 | `start-research` | 启动科研 | 启动一项科研，让文明继续进步。 | `tech-node-天文观测` |
| 4 | `next-turn` | 推进回合 | 点击下一回合，看看发生了什么。 | `btn-next-turn` |

**验证机制**:
- 步骤 1：监听 `earth-selected` 事件
- 步骤 2：轮询检测 `miningRatio` 变化或 `hasStope` 状态变化
- 步骤 3：监听 `research-started` 事件
- 步骤 4：监听 `game-turn-complete` 事件

### 2.2 回合阻断器宽限期

**文件**: [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts)

**核心改动**:
- 新增 `isInGracePeriod()`：判断 `year < 3` 为宽限期
- 修改 `getTurnBlockers()`：宽限期内排除"科研停滞"与"部门首长空缺"两项阻断
- 新增 `getTurnWarnings()`：返回宽限期内应提醒但不阻断的事项

**阻断器分级规则**:

| 阻断项 | 宽限期（year < 3） | 正常期（year ≥ 3） |
|--------|-------------------|-------------------|
| 资源崩盘（≤10） | 阻断 | 阻断 |
| 经济危机（≤10） | 阻断 | 阻断 |
| 科研停滞 | **警告（不阻断）** | 阻断 |
| 行政瘫痪（部门空缺） | **警告（不阻断）** | 阻断 |
| 教程模式 | 全部豁免 | 全部豁免 |
| AI 智脑模式 | 全部豁免 | 全部豁免 |

### 2.3 顶栏警告状态展示

**文件**: [TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx)

**核心改动**:
- 新增 `turnWarnings` 状态，调用 `game.getTurnWarnings()` 获取
- 下一回合按钮在有警告时显示琥珀色呼吸动画（`animate-pulse` + `text-amber-400`）
- 按钮 title 同步显示第一条警告信息
- 有阻断时按钮灰化显示"有阻断"，有警告时保持可点击但变色提醒

### 2.4 一次性情境提示

**文件**: [ContextualTips.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/ContextualTips.tsx)

**核心设计**:
- 不渲染任何 UI，仅负责事件监听与 Toast 派发
- 每条提示通过 `localStorage` 标记，每设备仅出现一次
- 利用现有的 `game:toast:message` 事件通道，统一 Toast 样式

**提示触发场景**:

| 提示 Key | 触发时机 | 提示文案 |
|----------|----------|----------|
| `ap-insufficient` | 首次 AP 不足 | AP 是本回合的行动力，下一回合会重新恢复。 |
| `enter-techtree` | 首次进入科技树视图 | 选择可研究的节点，科研会随回合推进。 |
| `enter-government` | 首次进入政府管理 | 任命合适人员可以提升部门效率。 |
| `turn-blocked` | 首次被回合阻断 | 还有事务没有处理，点击提示可以前往对应界面。 |
| `stability-low` | 稳定度首次低于 50% | 稳定度归零将导致失败。 |
| `epoch-change` | 首次纪元切换 | 文明进入新阶段，会有新的机遇与挑战。 |

### 2.5 可选新手任务清单

**文件**: [BeginnerTasks.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/BeginnerTasks.tsx)

**核心设计**:
- 教程完成后显示，可折叠，不阻断游戏
- 点击任务可跳转到对应界面（`starmap` / `techtree` / `government`）
- 通过轮询 + 事件监听实时更新任务完成状态
- 全部完成后可手动关闭，关闭状态持久化到 `localStorage`

**任务列表**:

| 任务 ID | 任务名称 | 跳转目标 |
|---------|---------|----------|
| `finish-tech` | 完成第一项科技 | 科技树 |
| `appoint-minister` | 任命一位部长 | 政府管理 |
| `has-stope` | 拥有采矿场 | 星图 |
| `has-factory` | 拥有加工厂 | 星图 |
| `handle-event` | 处理一个剧情事件 | 自动检测 |

### 2.6 集成挂载

**文件**: [App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx)

- `ContextualTips` 在游戏启动后全局挂载，教程期间也生效
- `BeginnerTasks` 在教程完成后（`!isTutorialActive`）条件渲染
- 两者均不参与布局流，使用浮层定位

---

## 三、测试与验证

### 3.1 测试文件更新

| 测试文件 | 更新内容 |
|----------|----------|
| [Tutorial.test.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/components/Tutorial.test.tsx) | 冒烟测试适配 4 步新教程 |
| [TutorialRemedy.scenario.test.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/TutorialRemedy.scenario.test.tsx) | 场景测试覆盖宽限期阻断逻辑 |
| [tutorial-guided.spec.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/tutorial-guided.spec.ts) | E2E 测试适配简化教程流程 |

### 3.2 关键验证点

1. **教程步骤推进**：点击地球 → 调整资源生产 → 启动科研 → 推进回合，四步顺序完成
2. **动态步骤适配**：有采矿场时显示滑块调整，无采矿场时显示建造按钮
3. **宽限期阻断**：year=0~2 时科研停滞不阻断，year≥3 时恢复阻断
4. **警告显示**：宽限期内有非阻断性问题时，下一回合按钮琥珀色呼吸
5. **情境提示**：首次触发各场景时 Toast 提示，刷新后不再出现
6. **新手任务**：任务完成状态实时更新，点击跳转对应界面
7. **教程跳过**：跳过教程后所有提示和任务清单正常工作

---

## 四、改动文件清单

| 文件路径 | 改动类型 | 说明 |
|----------|----------|------|
| `src/components/Tutorial.tsx` | 重写 | 12 步 → 4 步简化教程，真实操作验证 |
| `src/core/Game.ts` | 修改 | 新增宽限期逻辑与 `getTurnWarnings()` |
| `src/components/TopHUD.tsx` | 修改 | 新增警告状态展示与琥珀色呼吸效果 |
| `src/components/ContextualTips.tsx` | 新增 | 一次性情境提示组件 |
| `src/components/BeginnerTasks.tsx` | 新增 | 可折叠新手任务清单 |
| `src/App.tsx` | 修改 | 挂载新组件 |
| `src/test/components/Tutorial.test.tsx` | 更新 | 适配新教程冒烟测试 |
| `src/test/scenarios/TutorialRemedy.scenario.test.tsx` | 更新 | 覆盖宽限期阻断逻辑 |
| `src/test/e2e-playwright/tutorial-guided.spec.ts` | 更新 | 适配 E2E 测试流程 |

---

## 五、设计权衡与后续迭代建议

### 5.1 设计权衡

1. **教程步骤极简 vs 全面覆盖**：选择 4 步核心操作而非面面俱到，优先保证玩家能快速进入游戏
2. **宽限期 3 回合**：3 回合足够玩家熟悉基本操作，同时避免长期无阻断导致习惯养成困难
3. **情境提示 vs 教程内说明**：将分散知识点移出强制教程，改为情境化首次提示，降低认知负荷

### 5.2 后续迭代建议

1. **任务清单扩展**：可根据玩家数据增加更多进阶任务（如建造第一艘星舰、首次接触外星文明）
2. **提示文案 A/B 测试**：当前提示文案为初版，可根据玩家反馈优化表述
3. **教程难度自适应**：根据玩家操作速度动态调整提示密度
4. **新手引导数据分析**：埋点追踪各步骤完成率与跳过率，数据驱动后续优化

---

## 六、相关活文档更新记录

本次改动同步更新以下活文档：
- [AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md](./AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md) — 补充宽限期规则说明
