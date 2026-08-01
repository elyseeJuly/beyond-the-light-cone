# 《宇宙群英传》C++/MFC → Web 移植技术规范

> **版本**: V1.0 | **日期**: 2026-05-11 | **目标技术栈**: TypeScript + Vite + Canvas/SVG

---

## 1. 项目概述

将基于 C++/MFC/DirectX9 的回合制太空4X策略游戏移植为纯前端 Web 应用，实现：
- macOS/Linux/Windows 全平台可玩
- 零服务端依赖（纯客户端，localStorage 存档）
- 保留全部三体主题玩法系统

### 1.1 推荐技术栈

| 层 | 技术 | 理由 |
|----|------|------|
| 构建 | Vite + TypeScript | 快速HMR，类型安全 |
| 星图渲染 | HTML5 Canvas 2D | 替代 MFC CButtonST 星图 |
| UI面板 | HTML/CSS + 原生DOM | 替代 MFC Dialog |
| 战斗动画 | CSS动画 + Canvas | 替代 BattleDlg GDI绘制 |
| 音乐 | Web Audio API | 替代 DirectShow |
| 存档 | localStorage + JSON | 替代 MFC CArchive 二进制序列化 |
| 数据配置 | JSON文件 | 替代 INI 文件 |
| 随机数 | 内置 `Math.random()` 或 seedrandom | 替代 CRandomNumber LCG |

### 1.2 工程结构

```
legend-of-uni-web/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.ts                 # 入口
│   ├── types/                  # 全局类型定义
│   │   └── enums.ts            # 所有枚举（直译 define.h）
│   ├── core/                   # 游戏核心逻辑（纯数据，无UI）
│   │   ├── Game.ts             # ← CGame
│   │   ├── Civilization.ts     # ← CCivilization 基类
│   │   ├── EarthCivilization.ts# ← CEarthCivilization
│   │   ├── AlienCivilization.ts# ← CAlienCivilization
│   │   ├── AlienCiviManager.ts # ← CAlienCiviManager
│   │   ├── Star.ts             # ← CStar
│   │   ├── StarManager.ts      # ← CStarManager
│   │   ├── Person.ts           # ← CPerson
│   │   ├── PersonManager.ts    # ← CPersonManager
│   │   ├── TecTree.ts          # ← CTecTree + CTecTreeNode
│   │   ├── TecTreeManager.ts   # ← CTecTreeManager
│   │   ├── Weapon.ts           # ← CWeapon + CWeaponEx
│   │   ├── WeaponManager.ts    # ← CWeaponManager
│   │   ├── Barback.ts          # ← CBarback（军营）
│   │   ├── Department.ts       # ← CDepartment + 子类
│   │   ├── Building.ts         # ← CStope/CFactory/CCity/CArchitecture
│   │   ├── GameEvent.ts        # ← CGameEvent
│   │   ├── GameEventManager.ts # ← CGameEventManager
│   │   └── Battle.ts           # ← CBattleDlg 中的战斗逻辑
│   ├── ui/                     # UI层（HTML/Canvas渲染）
│   │   ├── MainScreen.ts       # ← CLengendOfUniDlg
│   │   ├── StarMap.ts          # ← CSolarSystemMap + CStarSystemMap
│   │   ├── PlanetPanel.ts      # ← CPlanetPanel
│   │   ├── DepartmentPanel.ts  # ← 11个部门面板合并
│   │   ├── TecTreeView.ts      # ← 科技树对话框合并
│   │   ├── BattleScreen.ts     # ← CBattleDlg UI部分
│   │   ├── DialogSystem.ts     # ← CHelper::MsgBox/PersonMsgBox
│   │   └── ThemeManager.ts     # ← ui_theme.ini 双主题
│   ├── data/                   # JSON 数据文件
│   │   ├── persons.json        # ← person.ini
│   │   ├── aliens.json         # ← alien.ini
│   │   ├── weapons.json        # ← weapon.ini
│   │   ├── stars.json          # ← star.ini
│   │   ├── events.json         # ← gameevent.ini
│   │   └── random-events.json  # ← randomevent.ini
│   └── utils/
│       ├── RandomNumber.ts     # ← CRandomNumber
│       └── SaveManager.ts      # 存档管理
├── public/
│   └── images/                 # 角色立绘/星球图片
└── package.json
```

---

## 2. 数据模型映射（C++ → TypeScript）

### 2.1 枚举（define.h → enums.ts）

```typescript
// 直接翻译，保持值不变
export enum DepartmentType {
  ECONOMY = 0, ARMY, CULTURE, HUMANRES,
  ASTROSOCIOLOGY, NUCLEAR, SPACEFIGHT, PROTON,
  ASTROPHYSICS, CULTURETEC, ECONOMYTEC, COUNT
}

export enum StarArea {
  SOLAR_SYSTEM = 0, LIGHT_YEAR_50, LIGHT_YEAR_10K, GALAXY, COUNT
}

export enum TecTreeType {
  PHYSICS = 0, AEROSPACE, MILITARY, INFORMATION, INTERSTELLAR, COUNT
}

export enum EpochType {
  CRISIS = 0, DETERRENCE, BROADCAST, BUNKER, GALAXY, COUNT
}

export enum AiPersonality {
  HUNTER = 0, CLEANER, DEFENSIVE, EXPANSIONIST, OPPORTUNIST, COUNT
}

export enum DiplomacyState {
  EXTINCTION_WAR = 0, SUSPICION, ARMED_PEACE,
  COOPERATION, ALLIANCE, COMMUNITY, COUNT
}

export enum VictoryType {
  CONQUEST = 0, DETERRENCE, DARK_DOMAIN, WANDERING, DIGITAL, HIDDEN, COUNT
}

export enum WeaponType { UNIT, EXPENDABLE, SPY, SUPERBOMB }
export enum BattleType { ATTACK, DEFEND }
export enum FriendshipType { VERY_ANGRY = 0, ANGRY, NORMAL, FRIEND, VERY_FRIEND }
export enum EventType { IN_YEAR, STRING_INDEX, RANDOM }
export enum EventEffect {
  NONE, ADD_ECONOMY, ADD_CULTURE, ADD_POP,
  ADD_TREACHERY, WAR, MOON_CRISIS, WANDERING_EARTH
}
```

### 2.2 核心实体类

#### Star（← CStar）
```typescript
export interface Star {
  index: number;
  name: string;
  isPlanet: boolean;
  totalResource: number;
  currentResource: number;
  exists: boolean;
  belongToCivi: string;      // 文明名，空=无主
  populationLimit: number;
  currentPopulation: number;
  found: boolean;
  barbackId: string | null;  // 引用ID，不持有对象
  stopeId: string | null;
  factoryId: string | null;
  cityId: string | null;
}
```

#### Person（← CPerson，7维属性）
```typescript
export interface Person {
  name: string;
  faceFile: string;
  army: number;       science: number;
  art: number;        economy: number;
  leadership: number; social: number;
  treachery: number;
  departmentId: string | null;
}
```

#### Civilization（← CCivilization 基类）
```typescript
export interface CivilizationData {
  name: string;
  population: number;  culture: number;
  economy: number;     resource: number;
  army: number;        treachery: number;
  civiLevel: number;
  starIndices: number[];
  barbackIds: string[];
}
```

#### TecTreeNode（← CTecTreeNode）
```typescript
export interface TecTreeNode {
  name: string;
  finished: boolean;
  inResearch: boolean;
  totalWorkload: number;
  currentWorkload: number;
  cost: number;
  tip: string;
  parentName: string | null;
  childrenNames: string[];
}
```

#### Weapon / WeaponInstance
```typescript
// CWeapon → 武器原型（注册表中的模板）
export interface WeaponPrototype {
  name: string;
  type: WeaponType;
  dependTecType: TecTreeType;
  dependTecName: string;
  attack: number;    hp: number;
  totalBuild: number; buildPerRound: number;
  cost: number;      priority: number;
  needCiviLevel: number;
}

// CWeaponEx → 武器实例（某军营中的一把具体武器）
export interface WeaponInstance {
  weaponName: string;    // 引用原型名
  currentBuild: number;  // 建造进度
}
```

#### Barback（军营）
```typescript
export interface Barback {
  id: string;
  planetIndex: number;
  soldierCount: number;
  weapons: WeaponInstance[];
  isFriend: boolean;
  alignmentYear: number;
  // 内嵌一个简单部门（军营驻军指挥官）
  departmentLeader: string;
  departmentName: string;
}
```

---

## 3. MFC 概念 → Web 概念映射表

| MFC/C++ 概念 | Web 替代 | 说明 |
|-------------|---------|------|
| `CDialog` | HTML `<div>` + CSS | 每个Dialog → 一个可显示/隐藏的面板 |
| `CButtonST`（星图按钮） | Canvas点击检测 或 SVG `<circle>` | 星球可点击 |
| `DoDataExchange` / `DDX_Text` | 直接DOM操作 `el.textContent = val` | 数据绑定 |
| `CListCtrl` | HTML `<table>` 或自定义列表 | 武器列表/人物列表 |
| `CComboBox` | HTML `<select>` | 下拉选择 |
| `OnCtlColor` / `CBrush` | CSS `background-color` / CSS变量 | 主题色 |
| `CArchive` 二进制序列化 | `JSON.stringify` + `localStorage` | 存档 |
| `CIniConfig` 读INI | `fetch('data/xxx.json')` | 配置数据 |
| `AfxGetApp()->m_game->` | 全局单例 `GameInstance.get()` | 全局访问 |
| `IMPLEMENT_SERIAL` | 不需要（JSON自描述） | 序列化宏 |
| `OnTimer` | `setTimeout` / `requestAnimationFrame` | 定时器 |
| `MessageBox` / `MsgBox` | 自定义模态对话框（HTML+CSS） | 剧情对话 |
| `LoadImage` + `SetBitmap` | `<img>` 或 Canvas `drawImage` | 图片显示 |
| DirectShow 音乐 | Web Audio API / `<audio>` | BGM |

---

## 4. 逻辑移植关键点

### 4.1 全局访问模式替代

C++ 中所有逻辑通过 `((CLengendOfUniApp*)AfxGetApp())->m_game->GetXxxManager()` 访问。

```typescript
// game-instance.ts — 全局单例
class GameInstance {
  private static instance: Game | null = null;
  static get(): Game {
    if (!this.instance) throw new Error('Game not initialized');
    return this.instance;
  }
  static init(game: Game) { this.instance = game; }
}
```

### 4.2 回合结算流程（CGame::RunARound）

```typescript
// Game.ts
runARound(): void {
  this.earthCivi.runARound();       // 地球回合
  this.alienCiviManager.runARound(); // 外星AI回合
  this.year++;
  this.updateEpoch();               // 纪元检查
}
```

### 4.3 科技树初始化（TecTreeManager::Init）

直接翻译 `AddNode` 调用链，保持节点名称不变：

```typescript
// 示例：基础物理树
const physicsTree = new TecTree();
physicsTree.addNode('root', '粒子对撞实验', 80, 20, '基础物理研究。');
physicsTree.addNode('粒子对撞实验', '质子3维展开', 150, 50, '...');
// ... 完整翻译 TecTreeManager.cpp 中的所有 AddNode 调用
```

### 4.4 战斗系统（BattleDlg → Battle.ts）

原战斗在 `CBattleDlg`（~1200行）中混合了逻辑和UI。移植时必须拆分：

```
BattleDlg.cpp (1200行)
  ├── Battle.ts      ← 纯逻辑：SSimpleWeapon、AttackProc、BattleProc、胜负判定
  └── BattleScreen.ts ← 纯UI：列表显示、动画、战报输出
```

**核心战斗数据结构**：
```typescript
interface SimpleWeapon {
  originalName: string;
  displayName: string;
  attack: number;
  hp: number;
  priority: number;
  type: WeaponType;
  targetName: string;
  owner: 'earth' | 'enemy';
}
```

### 4.5 智子封锁（IsSophonBlocked）

```typescript
isSophonBlocked(): boolean {
  if (this.year < 10) return false;
  const sanTi = this.alienCiviManager.get('三体');
  if (sanTi && !sanTi.isDieOut() && sanTi.friendshipType < FriendshipType.FRIEND) {
    const tecMgr = this.earthCivi.tecTreeManager;
    if (tecMgr.isFinished(TecTreeType.INFORMATION, '550W量子计算机') ||
        tecMgr.isFinished(TecTreeType.PHYSICS, '智子工程')) {
      return false;
    }
    return true;
  }
  return false;
}
```

### 4.6 INI → JSON 转换

```
person.ini                    →  persons.json
[count]                            [
count = 30                           {
[0]                                    "name": "罗辑",
Name = 罗辑                           "army": 50,
Army = 50                             "science": 85,
Science = 85                          "art": 60,
...                                    ...
                                     },
                                     ...
                                   ]
```

可用 Python 脚本批量转换（项目中已有 `generate_ini.py` 可参考）。

---

## 5. UI 移植策略

### 5.1 主界面布局（CLengendOfUniDlg → MainScreen）

原 MFC 主界面分三区域，Web 中用 CSS Grid 复现：

```
┌──────────────────────────────────────┐
│ 顶栏：纪元年份 / 玩家信息 / 属性值    │
├──────────┬───────────────────────────┤
│          │                           │
│ 星图区域  │  右侧面板                  │
│ (Canvas) │  (部门/星球/科技树)         │
│          │                           │
├──────────┴───────────────────────────┤
│ 底栏：部门按钮 × 11 + 下一回合        │
└──────────────────────────────────────┘
```

### 5.2 星图（CSolarSystemMap → Canvas）

原代码用 9 个 `CButtonST` 显示太阳系星球。Web 中用 Canvas 绘制：

```typescript
// 每颗星球绘制为带颜色标识的圆
ctx.beginPath();
ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
ctx.fillStyle = star.belongToCivi === '地球'
  ? '#336699'                    // 友方蓝
  : star.belongToCivi ? '#FF9900' // 敌方橙
  : '#999999';                   // 无主灰
ctx.fill();
```

### 5.3 剧情对话系统

原代码通过 `CHelper::MsgBox(sPic, sContent, sTalker)` 弹出模态对话框。Web 中实现为全屏覆盖层：

```html
<div id="dialog-overlay" class="hidden">
  <div class="dialog-box">
    <img id="dialog-face" />
    <div class="dialog-content">
      <span id="dialog-speaker"></span>
      <p id="dialog-text"></p>
    </div>
    <button id="dialog-ok">确定</button>
  </div>
</div>
```

### 5.4 双主题（ThemeManager）

用 CSS 变量实现，替代 `OnCtlColor` 回调：

```css
:root[data-theme="dark"] {
  --bg-primary: #000000;
  --bg-panel: rgba(0,0,0,0.85);
  --text-primary: #E0E0E0;
  --accent-1: #00E5FF;
}
:root[data-theme="light"] {
  --bg-primary: #FFFFFF;
  --bg-panel: rgba(255,255,255,0.85);
  --text-primary: #212121;
  --accent-1: #0D47A1;
}
```

---

## 6. 存档系统

### 6.1 序列化策略

原代码使用 MFC `CArchive` 二进制序列化，字段顺序严格。Web 版改为 JSON：

```typescript
interface SaveData {
  version: 2;
  playerName: string;
  year: number;
  epoch: EpochType;
  history: string;
  earthCivi: EarthCivilizationData;
  alienCivis: AlienCivilizationData[];
  stars: Star[];
  persons: PersonData[];
  tecTrees: TecTreeSaveData[];  // 只存研究中+已完成的节点
}

// 保存
localStorage.setItem('save_' + slot, JSON.stringify(saveData));

// 读取
const data: SaveData = JSON.parse(localStorage.getItem('save_' + slot)!);
```

---

## 7. 移植执行阶段

| 阶段 | 内容 | 工期 | 验收标准 |
|------|------|------|---------|
| **M0** | Vite项目初始化 + 枚举/类型定义 + JSON数据转换 | 1周 | 编译通过，数据可加载 |
| **M1** | 核心逻辑层（Game/Civilization/TecTree/Star） | 2周 | 单元测试覆盖回合结算 |
| **M2** | 主界面 + 星图 + 面板切换 | 2周 | 可看到星图并切换面板 |
| **M3** | 部门系统 + 科技研发 + 建筑建造 | 2周 | 科技可研发，建筑可建造 |
| **M4** | 战斗系统 + 外交谈判 | 2周 | 战斗可进行并产生结果 |
| **M5** | 事件系统 + 对话 + 纪元推进 | 1周 | 剧情事件正确触发 |
| **M6** | 三体特色系统（面壁者/执剑人/智子/胜利条件） | 2周 | 所有胜利条件可触发 |
| **M7** | 存档 + 双主题 + 音乐 + 美术打磨 | 2周 | 完整可玩 |

**总工期：约12-14周**

---

## 8. 逐文件翻译对照表

| C++ 源文件 | 行数 | → TS 文件 | 翻译难度 | 关键注意事项 |
|-----------|------|----------|---------|-------------|
| define.h | 140 | enums.ts | ★☆☆ | 直译枚举 |
| Game.h/cpp | 290 | Game.ts | ★★☆ | 纪元推进+智子封锁+序列化 |
| Civilization.h/cpp | 250 | Civilization.ts | ★★☆ | 基类，注意虚函数 SetPopulation |
| EarthCivilization.h/cpp | 596 | EarthCivilization.ts | ★★★ | 面壁者/执剑人/建筑管理 |
| AlienCivilization.h/cpp | 229 | AlienCivilization.ts | ★★☆ | AI行为+攻击预警冷却 |
| AlienCiviManager.h/cpp | 197 | AlienCiviManager.ts | ★☆☆ | 遍历管理 |
| Star.h/cpp | ~100 | Star.ts | ★☆☆ | 纯数据容器 |
| StarManager.h/cpp | ~200 | StarManager.ts | ★★☆ | Init中的随机布局逻辑 |
| Person.h/cpp | ~100 | Person.ts | ★☆☆ | 7维属性 |
| PersonManager.h/cpp | ~150 | PersonManager.ts | ★☆☆ | 已发现/未发现双map |
| TecTree.h/cpp | ~180 | TecTree.ts | ★★☆ | 树遍历（递归GetChildNode） |
| TecTreeManager.h/cpp | 231 | TecTreeManager.ts | ★★★ | 5棵树80+节点的AddNode |
| Weapon.h/cpp | ~100 | Weapon.ts | ★☆☆ | 原型+实例双类 |
| WeaponManager.h/cpp | ~60 | WeaponManager.ts | ★☆☆ | INI→JSON |
| Department.h/cpp | 175 | Department.ts | ★★☆ | 科研减速+智子封锁 |
| Barback.h/cpp | ~80 | Barback.ts | ★☆☆ | 军营+武器列表 |
| Stope/Factory/City | ~300 | Building.ts | ★★☆ | 采矿/加工/人口逻辑 |
| GameEvent.h/cpp | 144 | GameEvent.ts | ★★☆ | 事件效果switch |
| GameEventManager | ~100 | GameEventManager.ts | ★☆☆ | 年份触发+随机触发 |
| BattleDlg.h/cpp | 1200 | Battle.ts+BattleScreen.ts | ★★★ | 最复杂，必须逻辑/UI分离 |
| LengendOfUniDlg | 862 | MainScreen.ts | ★★★ | 主循环+面板管理+胜利检查 |
| PlanetPanel | 761 | PlanetPanel.ts | ★★☆ | 建筑操作+外交入口 |
| Helper.h/cpp | ~200 | utils.ts | ★☆☆ | 工具函数 |

---

## 9. 给接手开发者的关键提醒

1. **先翻译 core/ 再翻译 ui/**——核心逻辑不依赖任何UI，可单独测试
2. **科技名是字符串匹配**——`IsTecFinished(tree, name)` 中的 `name` 必须与 `AddNode` 完全一致（含全角符号如Ⅰ/Ⅱ/Ⅲ）
3. **序列化可以忽略**——Web版不需要兼容C++存档，JSON即可
4. **MFC的 `OnInitDialog` 在Web中对应初始渲染**——不需要 DDX/DDV
5. **所有INI文件是GBK编码**——转JSON时需先用iconv转UTF-8
6. **BattleDlg是最复杂的文件（1200行）**——务必拆分为逻辑+UI两个类
7. **`CRandomNumber` 是 Lehmer LCG**——Web中可用 `Math.random()` 替代
8. **11个部门面板高度相似**——可合并为1个通用组件+配置驱动
