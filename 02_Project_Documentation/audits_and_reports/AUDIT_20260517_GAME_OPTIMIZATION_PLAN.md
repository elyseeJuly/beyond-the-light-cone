# 宇宙群英传 (Legend of Uni) — 游戏优化方案

> 版本：Web 重构版 (03_Web_Rebuild)
> 基于：全系统代码审查 + Headless 自动化试玩实测 + 全功能测试用例分析
> 测试回合：10 回合（游戏在第 10 回合因人口崩溃而结束）
> 原则：不修改游戏源码的分析与建议

---

## 一、执行摘要

经过对《宇宙群英传》Web 重构版的**全系统代码深度审计**和**Headless 自动化试玩实测**，游戏在 10 回合内因人口崩盘至 **-4475** 而强制结束（文明灭绝）。0/95 项科技完成，经济为 **-484**，威慑度为 **-12**。此次测试揭示了从核心数值保护到系统集成的多层级问题。本报告按严重度分为 P0（致命阻断）/ P1（严重影响游玩）/ P2（体验质量）/ P3（长期规划）四个等级，提出系统性优化方案。

---

## 二、游玩实测数据

### 2.1 初始状态

| 指标 | 值 |
|------|-----|
| 地球人口 | 65 |
| 地球经济 | 100 |
| 地球资源 | 100 |
| 闲散工人 | 65 |
| 初始文明等级 | 荒蛮 |
| 三体友好度 | 2 (NEUTRAL) |
| 智子封锁 | false |
| 异星文明数 | 5 |
| 星球总数 | 9 |
| 人物数量 | 35 |
| 科技树数 | 5 条 |

### 2.2 10 回合关键事件序列

| 回合 | 事件 | 影响 |
|------|------|------|
| 0 | 纪元大事记_0、科技灵光一现 | 初始事件触发 |
| 2 | 三体舰队集结（5年后抵达）、歌者清理倾向 | 双线威胁 |
| 2 | 纪元大事记_2、突击行动·大史带队端掉ETO据点 | Flag激活: eto_cell_raided |
| 3 | 辐射移民潮 | — |
| 4 | 边缘世界扩张至木星 | 领土损失 |
| 4 | 生存与伦理：有偿器官捐献合法化 | — |
| 6 | 归零者加固防御 | — |
| 7 | 灯光熄灭：大范围停电引发静坐抗议 | — |
| 8 | 边界冲突：难民潮冲破隔离墙 | — |
| 9 | 三体舰队距抵达还有3年、边缘世界扩张至金星 | 行星沦陷 |
| 10 | 面壁者提案触发 → 游戏结束 | **人口崩盘至 -4475** |

### 2.3 最终状态（崩溃时）

| 指标 | 值 |
|------|-----|
| 人口 | **-4475** ⚠️ 严重越界 |
| 经济 | **-484** ⚠️ 严重越界 |
| 资源 | 74 |
| 文化 | 140 |
| 军力 | 10 |
| 逃亡主义 | 9 |
| 威慑度 | **-12** ⚠️ 严重越界 |
| 文明等级 | 起源（L1） |
| 完成科技 | **0/95** ⚠️ 零进展 |
| 游戏结果 | 文明灭绝 |

---

## 三、优化方案

### P0 — 致命阻断（立即修复）

#### OPT-P0-001：人口、经济、威慑度的负值越界保护

**问题描述**：Headless 试玩中，人口从 65 在 10 回合内崩盘至 -4475，经济为 -484，威慑度为 -12。所有这三个核心数值都没有下限保护，导致游戏在异常低值后触发了不可逆的状态腐化。

**证据**：
- [EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts) 中的 `processMining`、`processFactories`、`processPopulationGrowth` 均没有对产出的负值钳制
- [Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L346-L348) 中 `applyNewEffects` 只有 `treachery` 做了钳制 `Math.min(100, Math.max(0, ...))`，但 `economy`、`population`、`deterrenceValue` 等其他字段都没有保护

**推荐方案**：
1. 在所有资源修改点（`runARound`、`applyNewEffects`、`applyEventEffect`、`conductDiplomacy`）添加统一的资源钳制层
2. 引入 `clamp(value, min, max)` 工具函数，确保：
   - `population >= 0`
   - `economy >= 0`
   - `resource >= 0`
   - `deterrenceValue >= 0`
   - `culture >= 0`
   - `army >= 0`

**实现位置**：
- 新增 `src/core/Sanitizer.ts`，在 `EarthCivilization.runARound()` 末尾调用
- `Game.applyNewEffects()` 中每个资源 target case 后添加钳制

---

#### OPT-P0-002：事件自动选择导致连锁崩溃

**问题描述**：Headless 模式下自动选择 `choices[0]`（第一个选项），某些事件的首选项可能是负面效果（如人口减少、经济扣除），多个负面事件堆叠后导致了数值崩溃。在正常游玩中，玩家会选择正面或有策略意义的选项，但 Headless 模式没有判断能力。

**证据**：
- 试玩日志显示 10 回合内触发了 10+ 个不同事件
- 每个事件的第一个选项 action 可能包含大量负面效果，累积后导致了崩溃

**推荐方案**：
1. 为每个 `EventChoice` 添加 `isPositive: boolean` 标记，让自动化系统能识别
2. 确保事件效果有合理的上下限保护（依赖 OPT-P0-001）
3. 每个事件效果添加"最小保有量"检查：如人口减半效果不应使人口低于 10

---

#### OPT-P0-003：建设设施缺少建造周期

**问题描述**：当前采矿场、加工厂、太空城市的建造是**瞬时的布尔标志翻转**——点击即完成，无建造进度条。这导致：
1. 经济直接扣减但无任何进度反馈
2. 与原版 MFC 设计不符（原版有建造进度系统）
3. `Building.ts` 模块定义了完整的建造进度系统但**从未被使用**（BUG-B-27）

**证据**：
- [RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/RightInspector.tsx) 中 `handleBuildStope/handleBuildFactory/handleBuildCity` 直接设置 `hasXxx = true` 并扣经济
- [Building.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Building.ts) 中定义了 `createBuilding`、`isBuildingCompleted`、`runBuildingRound` 但无任何调用

**推荐方案**：
1. 将 `Building` 接口集成到 `Star` 中，替换 `hasStope/hasFactory/hasCity` 布尔标志
2. 建造启动后每回合自动 `runBuildingRound`，建造中的设施在 UI 上显示进度条
3. 建造中不允许在同一星球重复建造

---

### P1 — 严重影响游玩（短期修复）

#### OPT-P1-001：科技研究系统零进展

**问题描述**：Headless 试玩中 10 回合+ 0/95 项科技完成。核心原因是：
1. 科技不会自动开始研究——必须手动点击每个节点
2. 科技树 UI 中点击"研究"后 `inResearch = true`，但核心逻辑中 `processTechResearch` 依赖部门部长和进度值
3. 部门部长初始全部为空，无人推动科研
4. 科技树 UI 硬编码为 PHYSICS 树，用户无法切换（BUG-B-50）

**证据**：
- [TecTreeView.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/TecTreeView.ts) — 点击开始研究后 `inResearch=true`，但没有自动推进
- [EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/EarthCivilization.ts#L213-L252) — `processTechResearch` 中的 `scienceBonus = floor(leader.science / 10)`，无部长时为 0

**推荐方案**：
1. **自动科技推荐**：每回合如果没有进行中的研究，自动推荐最低 cost 且前置满足的科技
2. **部长自动分配**：初始时自动将最适合的人选分配到各部门（基于最高属性匹配）
3. **科研基线保障**：即使无部长，也应有最低的科技推进速度（当前 base=10 是够的）
4. **科技树分支切换**：在科技树视图中添加 5 条科技线的标签切换

---

#### OPT-P1-002：舰队建造与实际产出脱节

**问题描述**：`handleBuildFleet` 扣了 100 经济并记录历史，但**没有实际创建舰队对象或武器实例**。`Weapon.ts` 中的 `isWeaponFinished` 和 `runWeaponRound` 函数定义了完整的武器建造流程，但在核心逻辑中从未被调用（BUG-B-45）。

**证据**：
- [RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/RightInspector.tsx) — `handleBuildFleet` 只扣经济无产出
- [Weapon.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Weapon.ts) — `runWeaponRound` 和 `isWeaponFinished` 从未被调用

**推荐方案**：
1. 将 `WeaponPrototype` 和 `WeaponInstance` 集成到实际建造流程中
2. 舰队建造应有 progress 条，每回合增加 `buildPerRound`
3. 完成后将 `WeaponInstance` 追加到对应军团的 `weapons` 数组中
4. 添加"恒星级战舰"和"水滴"两种可建造武器

---

#### OPT-P1-003：新旧 UI 体系并行导致的资源消耗不一致

**问题描述**：项目中同时存在两套 UI 体系：
- React 组件（TopHUD、RightInspector、LeftHub、StarMap）
- 旧版 DOM UI（UIManager、MainLayout、StarMapRenderer）

在 `UIManager.updateRightPanel()` 中，建造设施按钮**没有经济检查**——直接设置 `star.hasXxx = true`，零成本建造。这与 React 版 UI 的经济检查不一致。

**证据**：
- [UIManager.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/UIManager.ts) — 旧版建造无经济检查
- [RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/RightInspector.tsx) — React 版有经济检查

**推荐方案**：
1. 确定主 UI 体系（推荐 React 版），废弃旧版 DOM 系统
2. 将所有交互操作统一到 React 组件中
3. 提取共享的业务逻辑到 `src/core/actions/` 目录，UI 层只负责调用

---

#### OPT-P1-004：战斗公式不对称性导致持久战攻方过强

**问题描述**：`CombatEngine.resolveFleetVsBarback` 中，攻击方伤害每轮有 `(1 + round * 0.1)` 的递增乘数（第5轮为 1.5x），而防守方伤害始终为基础值。这导致：
1. 持久战中攻击方获得不公平的优势
2. 与"防守方应有地形/工事优势"的军事常识相悖

**证据**：
- [CombatEngine.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/CombatEngine.ts#L28-L29)

**推荐方案**：
1. 移除攻击方递增乘数，或改为双方对称
2. 如果保留递增机制，改为对防守方也应用相同乘数
3. 或改为：攻击方前几轮有微弱劣势（代表进攻初期损失），后几轮攻守均衡

---

#### OPT-P1-005：存档系统原型链恢复脆弱

**问题描述**：`GameInstance.loadGame()` 使用 `Object.assign` 浅拷贝后，再逐个 `setPrototypeOf` 恢复原型链。这个方案：
1. 依赖于显式列举所有需要恢复原型的类（容易遗漏，已有 BUG-08 补丁痕迹）
2. 加载后重新调用 `eventManager.init()` 会覆盖已序列化的 `filteredEvents` 数据
3. 新的嵌套类对象如果被添加但忘记加入原型恢复列表，方法调用将静默失败

**证据**：
- [Game.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L462-L501)

**推荐方案**：
1. 使用专用的序列化库（如 `class-transformer`）或自定义 `toJSON`/`fromJSON` 方法
2. 每个类实现 `serialize()` 和静态 `deserialize(data)` 方法
3. 加载存档后不应重新调用 `init()` 方法——改为 `restoreState()` 方法

---

### P2 — 体验质量（中期优化）

#### OPT-P2-001：异星文明扩张过于激进

**问题描述**：试玩中边缘世界在第 0 回合就扩张至天王星，第 4 回合占领木星，第 9 回合占领金星。玩家在 10 回合内就失去了太阳系 3 颗行星，而地球文明几乎没有反制手段。

**证据**：
- 试玩日志：Turn 0 "边缘世界 扩张至 天王星"，Turn 4 "边缘世界 扩张至 木星"，Turn 9 "边缘世界 扩张至 金星"

**推荐方案**：
1. 异星扩张应加权玩家邻居优先度（距离地球越近的星球越难被扩张）
2. 添加"扩张预警"机制——异星扩张前 2 回合发出外交警告
3. 添加"领土宣言"机制——玩家可以先声明对某星球的主权
4. 异星扩张太阳能系行星的概率应大幅降低

---

#### OPT-P2-002：逃亡主义增长无上限导致早期崩盘风险

**问题描述**：试玩中逃亡主义在 10 回合内从初始值增长至 9，随机事件可能进一步推高。一旦达到 100（失败阈值），游戏强制结束。但玩家在初期没有足够手段对抗逃亡主义。

**证据**：
- `processTreachery` 每回合随机 +[0,2]
- 多种事件效果会进一步增加逃亡主义

**推荐方案**：
1. 早期（危机纪元前 50 回合）逃亡主义基础增长率降低为 +[0,1]
2. 添加"反逃亡宣传"科技或"社会维稳"部门
3. 逃亡主义 > 80 时弹出明确警告并提供缓解选项
4. 考虑逃亡主义 100 时不是立即失败，而是触发"逃亡主义危机"事件链

---

#### OPT-P2-003：星图 Zoom 控制按钮形同虚设

**问题描述**：[StarMap.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/StarMap.tsx) 底部的 Zoom In / Zoom Out / Reset View 三个按钮**未绑定任何事件处理函数**，点击完全无效。

**推荐方案**：
1. 实现 zoom 功能：修改 `StarMapRenderer` 的缩放因子
2. 实现 pan 功能：支持拖拽平移星图
3. 添加滚轮缩放支持

---

#### OPT-P2-004：远星星系完全不可见

**问题描述**：`StarMapRenderer.initStars()` 过滤了 `index <= 8` 的星球（仅太阳系）。50 光年、1 万光年、银河系的数百颗星球在星图上完全不可见。玩家无法感知到"外面还有更大的宇宙"。

**证据**：
- [StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/ui/StarMapRenderer.ts) — `initStars` 过滤逻辑

**推荐方案**：
1. 低缩放级别显示整个银河系星图（光点密度表示星系群）
2. 中缩放级别显示星域（50光年、1万光年）
3. 高缩放级别显示当前太阳系
4. 已发现的远星用暗色光点标记

---

#### OPT-P2-005：事件选择缺少策略深度

**问题描述**：Headless 试玩中所有事件都选择了 `choices[0]`（第一个选项），这导致了多轮负面效果堆叠。在正常游玩中，事件应该提供有意义的策略抉择——但当前事件数据中选项效果缺乏足够差异化和信息展示。

**推荐方案**：
1. 每个事件选项添加**效果预览**（"+50 经济，-10 逃亡主义"）
2. 选项分化为正面/负面/风险三种类型，确保首选项不总是最差的
3. 增加需要特定科技/角色才能解锁的"特殊选项"
4. 添加"延迟抉择"选项——可以稍后再做决定

---

#### OPT-P2-006：缺少新手引导和教程

**问题描述**：游戏开始后直接进入星图界面，没有任何引导流程。玩家需要自行理解：
- 工人分配比例的意义
- 科技树的研究路径
- 部门部长的重要性
- 面壁者和执剑人的机制

**推荐方案**：
1. 添加可选的 5-10 步新手引导（高亮提示 + 强制操作引导）
2. 关键里程碑触发教学弹窗（第一个采矿场建成、第一个科技完成、第一次外交）
3. Tooltip 系统覆盖所有 UI 元素

---

### P3 — 长期规划

#### OPT-P3-001：武器建造与升级系统完整化

**问题描述**：`Weapon.ts` 和 `WeaponManager.ts` 模块基本完整但未集成。当前异星舰队直接硬编码 `{weaponName: "水滴型战舰", currentBuild: 80}`，地球方建造舰队也跳过了武器系统。

**推荐方案**：
1. 实现武器原型解锁（完成特定科技后解锁相应武器）
2. 添加武器建造队列（按优先级排队建造）
3. 光粒、二向箔等三体宇宙标志性武器加入武器库
4. 武器升级系统（如恒星级战舰 → 恒星级氢弹舰）

---

#### OPT-P3-002：事件系统数据扩充

**问题描述**：`events.json` 中仅有 5 个固定年份事件，远不足以支撑三体宇宙的宏大叙事。

**推荐方案**：
1. 扩充至 30+ 关键剧情事件（面壁计划启动、水滴抵达、执剑人交接、二向箔打击等）
2. 添加多轮对话事件（talkcount > 1）充分利用 `StoryModal` 的 `dialogQueue` 能力
3. 添加分支事件链（根据 Flag 触发不同的后续事件）
4. 条件事件从 7 个扩充至 20+ 个

---

#### OPT-P3-003：舰队 vs 舰队战斗实现

**问题描述**：`CombatEngine.resolveFleetVsFleet` 已实现但从未被调用（BUG-B-35）。当前所有战斗都是舰队 vs 军营。

**推荐方案**：
1. 在异星拦截场景中调用舰队 vs 舰队战斗
2. 实现多舰队同时战斗的编队机制
3. 添加战术选择（全攻/稳守/撤退）

---

#### OPT-P3-004：随机星球生成

**问题描述**：`StarManager.init()` 中注释"Random generation bounds mapping logic goes here if needed"（BUG-B-26），表明随机星球生成逻辑从未实现。当前 `stars.json` 只有 9 颗星球（太阳系）。

**推荐方案**：
1. 实现种子随机生成算法（可复现的伪随机）
2. 50 光年范围生成 50-100 颗星球
3. 1 万光年范围生成 100 颗额外星球
4. 银河系范围生成 800+ 颗星球

---

#### OPT-P3-005：多人游戏/热座模式

**推荐方案**：
1. 热座模式：支持 2-4 人在同一设备上轮流操作
2. 每个玩家控制不同的文明（地球 / 三体 / 歌者等）
3. 回合制异步推进

---

## 四、Headless 自动化试玩结果总结

通过 [Headless 分析脚本](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/scripts/gameplay-analyzer.ts) 对游戏进行了完整的自动化试玩测试，结论如下：

| 指标 | 结果 | 评级 |
|------|------|------|
| 游戏是否可运行 | ✅ 核心引擎正常启动 | 通过 |
| 回合推进是否正常 | ✅ 偶数回合顺利推进 | 通过 |
| 事件系统是否运作 | ✅ 10 回合触发 10+ 个事件 | 通过 |
| 人口/经济非负检查 | ❌ 人口 -4475，经济 -484 | **失败** |
| 科技研究是否进展 | ❌ 0/95 科技完成 | **失败** |
| 存档往返一致性 | ❌ Node.js 环境不支持 localStorage | **失败** |
| 游戏自然结束 | ❌ 第 10 回合非正常死亡 | **失败** |
| 异星 AI 行为 | ✅ 三体、歌者、边缘世界均表现活跃 | 通过 |

**综合评分：3/8 项通过 (37.5%)**

---

## 五、修复优先级路线图

### 第一优先级（本周）
1. OPT-P0-001：资源负值越界保护
2. OPT-P0-002：事件自动选择连锁崩溃
3. OPT-P0-003：建造进度系统集成

### 第二优先级（本月）
4. OPT-P1-001：科技研究系统激活
5. OPT-P1-002：舰队建造完整流程
6. OPT-P1-003：统一 UI 体系
7. OPT-P1-004：战斗公式平衡

### 第三优先级（本季度）
8. OPT-P2-001：异星扩张节奏调整
9. OPT-P2-005：事件选择策略深度
10. OPT-P2-006：新手引导系统
11. OPT-P1-005：存档系统重构

### 第四优先级（长期）
12. OPT-P3-001 ~ OPT-P3-005：功能完整化

---

## 六、附录：已确认缺陷与优化方案对照

| 代码缺陷编号 | 对应优化项 | 严重度 |
|-------------|-----------|--------|
| B-03 (存档浅拷贝) | OPT-P1-005 | 高 |
| B-11 (工人分配分母) | OPT-P0-001 | 高 |
| B-20 (异星占领未检查) | OPT-P0-001 | 高 |
| B-27 (Building未使用) | OPT-P0-003 | 中 |
| B-32 (战斗不对称) | OPT-P1-004 | 高 |
| B-45 (武器系统未使用) | OPT-P1-002 + OPT-P3-001 | 中 |
| B-50 (科技树硬编码) | OPT-P1-001 | 中 |
| B-26 (随机生成未实现) | OPT-P3-004 | 低 |
| B-35 (舰队vs舰队未调用) | OPT-P3-003 | 低 |
| B-36 (事件冷却单次) | OPT-P2-005 | 高 |

---

> 文档生成日期：2026-05-17
> 基于 Headless 自动化试玩实测 + 全系统代码审计 + 150+ 测试用例框架分析