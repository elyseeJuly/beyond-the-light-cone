# 宇宙群英传 (Legend of Uni) - 开发文档 V2.0

> **最后更新**：2026-05-15
> **当前版本**：Web 重制版 Alpha 2.1 (策略系统深度优化 + UI 集成修复)
> **原始版本**：Windows MFC (已停止维护)

---

## 一、项目概述

《宇宙群英传》是一款基于《三体》宇宙观的回合制策略游戏。玩家作为地球联合政府首席执政官，在三体文明威胁和多文明并存的宇宙中，通过**人口管理、资源开采、科技研发、军事建设、外交博弈**等多种手段寻求文明存续。

### 技术架构演进

```
V1.0 ────── Windows MFC + DirectX ── 单机 .lsv 存档 ── CArchive 序列化
  │
  └─ 2025 决策重构
      │
      ▼
V2.0 ────── React 19 + TypeScript + Vite ── Web SPA ── localStorage 存档
  │           Canvas 星图渲染 / Tailwind CSS 4 / Lucide Icons
  │
  └─ 2026/05 策略深度优化
      │
      ▼
V2.1 ────── 复刻MFC全部策略机制 + 事件链 + 条件引擎 + AI人格系统
```

---

## 二、项目结构

```
03_Web_Rebuild/
├── src/
│   ├── types/
│   │   ├── enums.ts              # 17个枚举：部门/星域/科技树/纪元/AI/外交/胜利...
│   │   └── narrative.ts          # 叙事系统接口：事件/对话/过滤条件/胜利条件
│   ├── core/                     # 纯逻辑层（与UI解耦）
│   │   ├── Game.ts               # 主循环：回合结算、纪元转换、胜利判定、Flag系统
│   │   ├── Civilization.ts       # 文明基类：属性/外交/等级
│   │   ├── EarthCivilization.ts  # 地球：11部门、采矿/工厂/文化/科研/人口/逃亡
│   │   ├── AlienCivilization.ts  # 异星AI：5种人格、攻击冷却、扩张/外交
│   │   ├── CombatEngine.ts       # 战斗：多轮骰子制、武器差异、战力计算
│   │   ├── TecTreeManager.ts     # 科技树：5树85节点，完整MFC复刻
│   │   ├── TecTree.ts            # 科技树数据结构：节点/进度/前置依赖
│   │   ├── StarManager.ts        # 星球管理：209颗星球，4域分区
│   │   ├── Star.ts               # 星球接口：资源/建筑/归属/人口
│   │   ├── PersonManager.ts      # 角色管理：35角属性池，可用/已用集合
│   │   ├── Person.ts             # 角色接口：7属性/部门归属
│   │   ├── GameEventManager.ts   # 事件引擎：固定+随机+条件过滤三轨
│   │   ├── GameEvent.ts          # 事件模型：类型/效果/对话/选项
│   │   ├── Department.ts         # 部门：类型/部长/效率
│   │   ├── Weapon.ts / WeaponManager.ts
│   │   ├── Fleet.ts / Barback.ts / Building.ts
│   │   └── ...
│   ├── components/               # React UI 组件
│   │   ├── App.tsx               # 根组件：布局/视图切换/初始化
│   │   ├── TopHUD.tsx            # 顶部HUD：资源/纪元/下一回合
│   │   ├── LeftHub.tsx           # 左栏：部门列表/人员指派
│   │   ├── RightInspector.tsx    # 右栏：星球详情/建造/派遣
│   │   ├── StarMap.tsx           # 星图：Canvas渲染/交互
│   │   ├── StoryModal.tsx        # 事件弹窗：打字机对话/多选项
│   │   ├── EndGameScreen.tsx     # 终局画面：胜利/失败+积分
│   │   └── FloatingText.tsx      # 浮动提示
│   ├── ui/                       # 遗留Class式面板（逐步迁移中）
│   │   ├── StarMapRenderer.ts    # Canvas星图渲染引擎
│   │   ├── DepartmentPanel.ts    # 部门面板
│   │   ├── WallfacerPanel.ts     # 面壁者面板
│   │   ├── TecTreeView.ts        # 科技树视图
│   │   └── ...
│   ├── data/                     # 静态JSON数据
│   │   ├── stars.json            # 9颗星球（太阳系）
│   │   ├── persons.json          # 35个角色
│   │   ├── events.json           # 固定年份事件
│   │   ├── randomevents.json     # 随机事件池 200KB
│   │   ├── aliens.json           # 5个异星文明
│   │   └── weapons.json          # 武器定义
│   ├── index.css                 # Tailwind + 自定义样式
│   └── main.tsx                  # ReactDOM 入口
├── public/images/                # 37张角色头像 (PNG)
├── package.json                  # React 19, Vite 8, Tailwind 4, Lucide
├── tsconfig.json                 # strict, noUnusedLocals, noUnusedParameters
├── vite.config.ts
├── tailwind.config.js
└── index.html
```

---

## 三、核心系统文档

### 3.1 游戏主循环 (Game.runARound)

```
玩家点击"下一回合"
    ├── 检查 isGameOver / 事件队列 / 处理锁
    ├── EarthCivilization.runARound()
    │   ├── allocateWorkers()          → 采矿/工厂/文化工人分配
    │   ├── processMining()            → 矿厂产出 → resource
    │   ├── processFactories()         → 工厂产出 → economy
    │   ├── processCulture()           → 文化产出 → culture
    │   ├── processTechResearch()     → 5个研究所推进科技进度
    │   ├── processPopulationGrowth() → 城市人口增长
    │   ├── processTreachery()         → 逃亡主义上升 0~2
    │   ├── 面壁者/执剑人加成
    │   ├── updateCiviLevel()          → 文明等级提升
    │   └── processFleets()            → 人类舰队飞行与战斗
    ├── AlienCiviManager.runARound()
    │   └── 遍历5个异星 → 人格驱动AI行为
    ├── 外交冷却递减
    ├── 事件检查
    │   ├── checkEvents(year)          → 固定年份事件
    │   ├── checkRandomEvents()        → 随机事件(概率池)
    │   └── getFilteredEventsForTurn() → 条件过滤事件(8个预置)
    ├── year++
    ├── updateEpoch()                  → 200→威慑/260→广播/269→掩体/331→银河
    ├── checkVictoryConditions()       → 六胜+三败
    └── processNextEvent()             → 弹出事件队列第一个
```

### 3.2 数据模型关系

```
Game (单例)
 ├── StarManager
 │    └── Map<number, Star>     (209颗)
 ├── PersonManager
 │    ├── Map<string, Person>   (35人)
 │    └── Set<string>           (可用池)
 ├── WeaponManager → Map<string, Weapon>
 ├── GameEventManager
 │    ├── GameEvent[]           (固定事件)
 │    ├── GameEvent[]           (随机事件)
 │    ├── FilteredEventPayload[](条件事件)
 │    └── Set<string>           (已触发事件ID)
 ├── EarthCivilization
 │    ├── Map<DepartmentType, Department> (11部门)
 │    ├── Set<string>           (wallfacers)
 │    ├── string|null           (swordholder)
 │    ├── Fleet[]               (人类舰队)
 │    └── TecTreeManager → Map<TecTreeType, TecTree>
 │         └── Map<string, TecTreeNode>
 └── AlienCiviManager
      └── Map<string, AlienCivilization> (5异星)
           ├── Fleet[]          (异星舰队)
           └── TecTreeManager   (异星科技)
```

### 3.3 存档系统

```
saveGame():
  JSON.stringify(Game, replacer)
    ├── Map → { dataType: 'Map', value: [...entries] }
    ├── Set → { dataType: 'Set', value: [...items] }
    └── 排除: currentEvent, eventQueue, isProcessing
  → localStorage.setItem("LegendOfUni_Save", data)

loadGame():
  localStorage.getItem("LegendOfUni_Save")
  → JSON.parse(data, reviver) → Map/Set 复原
  → Object.assign + setPrototypeOf(各实例)
  → eventManager.init() 重新加载事件池
  → 触发 'game-loaded' 事件
```

---

## 四、MFC → Web 翻译对照表

### 4.1 类映射

| MFC 原版 | Web 版 | 状态 |
|----------|--------|------|
| `CGame` | `Game` | ✅ 完整 |
| `CEarthCivilization` | `EarthCivilization` | ✅ 增强 |
| `CAlienCivilization` | `AlienCivilization` | ✅ AI人格化 |
| `CCivilization` | `Civilization` | ✅ 增强 |
| `CStarManager` | `StarManager` | ✅ 完整 |
| `CStar` | `Star` (interface) | ✅ 扁化 |
| `CPersonManager` | `PersonManager` | ✅ 完整 |
| `CPerson` | `Person` (interface) | ✅ 扁化 |
| `CTecTreeManager` | `TecTreeManager` | ✅ 扩至85节点 |
| `CTecTree` | `TecTree` | ✅ 完整 |
| `CGameEventManager` | `GameEventManager` | ✅ 增强 |
| `CCombatEngine`/`CBattleDlg` | `CombatEngine` | ✅ 多轮制 |
| `CDepartment` | `Department` (interface) | ✅ 11部门 |
| `CWeaponManager` | `WeaponManager` | ⚠️ 简化 |
| `CAlignmentDlg` | `Game.conductDiplomacy()` | ✅ API化 |
| `CEconomyDepartment` | (合并入 EarthCivilization) | ✅ 内聚 |
| `CArmyDepartment` | (合并入 EarthCivilization) | ✅ 内聚 |

### 4.2 公式移植对照

| 系统 | MFC 公式 | Web 实现 |
|------|---------|---------|
| 采矿 | `(worker + leader.Economy/20) * weight / 2` × 逃亡因子 | ✅ 完整移植 |
| 工厂 | `(worker + leader.Economy/30) * weight / 2` × 逃亡因子 × 发动机×5 | ✅ 完整移植 |
| 文化 | `(worker + leader.Social/5) * weight / 20` | ✅ 完整移植 |
| 科研 | `(10 + leader.Science/10)` × 逃亡因子 / 智子÷10 | ✅ 完整移植 |
| 人口增长 | `5 * weight / 2` 每城市 | ✅ 完整移植 |
| 文明升级 | 文化≥70/200/500/1000 → 1/2/3/4级 | ✅ 完整移植 |
| 逃亡增长 | `random(3)` → 0~2/回合 | ✅ 完整移植 |
| 面壁加成 | `wallfacerCount * 5` | ✅ 完整移植 |
| 执剑加成 | `leader.Leadership * 2` | ✅ 完整移植 |
| AI扩张 | `random(7)==5` → 1/7概率 | ✅ 人格差异化 |
| 谈判MP | `(Leadership*4 + Social*6) / 10` | ✅ 外交API可用 |

---

## 五、开发命令

```bash
# 安装依赖
cd 03_Web_Rebuild
npm install

# 开发模式
npm run dev        # Vite 开发服务器

# 构建
npm run build      # tsc && vite build

# 预览构建结果
npm run preview
```

---

## 六、已知限制与后续计划

### 当前限制
- 星图仅9颗太阳系星球（209颗的数据生成脚本待编写）
- 武器系统仍较简化（仅2种武器定义，武器建造队列待完善）
- 角色系统无成长/叛变/死亡机制
- Cannot build on non-Earth stars (殖民后星球建设待接入)
- No Chinese/English i18n support
- No unit tests

### 优先路线图

| 优先级 | 任务 | 范畴 |
|--------|------|------|
| P0 | 生成50光年/1万光年/银河系星球数据 | 数据 |
| P1 | React化科技树视图 (TecTreeView → React组件) | UI |
| P1 | 外交面板 React组件 | UI |
| P2 | 军事情报/舰队总览面板 | UI |
| P2 | 角色成长与叛变机制 | 核心 |
| P2 | 星球殖民后建筑建设 | 核心+UI |
| P3 | i18n 多语言支持 | 全项目 |
| P3 | 单元测试框架 (Vitest) | DevOps |
| P4 | 云端存档 (Supabase/Firebase) | 后端 |

---

## 七、变更日志

### V2.1.1 (2026-05-15) - UI 集成修复
- **TopHUD**：军力显示从舰队数修正为实际 army 值，新增资源(Gem)和逃亡主义(Skull)栏位
- **RightInspector**：新增文明等级/资源储备/逃亡进度条/工人分配详情；建筑建造增加经济消耗(30/50/80)
- **LeftHub**：补全天体物理/文化研究所/经济研究所3个部门导航(8→11)
- 编译清理：移除 TopHUD.tsx 中未使用的 useCallback import
- TypeScript 编译验证通过

### V2.1 (2026-05-14) - 策略系统深度优化
- 科技树 14→85 节点，5树完整复刻MFC原版
- 资源/经济/文化/科研全套生产链
- 多轮骰子制战斗系统
- AI人格系统 (Hunter/Cleaner/Expansionist/Defensive/Opportunist)
- 6种胜利条件 + 3种失败条件
- 8个条件过滤事件 + Flag持久化系统
- 外交 API (谈判/贸易/挑衅/结盟)
- 纪元转换系统 (5纪元)
- 文明等级系统 (5级)
- 逃亡主义机制

### 原有版本
- V2.0: React + TypeScript + Canvas 重制版
- V1.0: Windows MFC 原版

---

> *项目路径：`03_Web_Rebuild/`*
> *相关文档：`02_Project_Documentation/STRATEGY_OPTIMIZATION_REPORT.md`, `02_Project_Documentation/DEV_HISTORY_LOG.md`*