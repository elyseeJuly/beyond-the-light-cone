# 《宇宙群英传》重构开发技术文档 — Part 1：架构与代码修复

> **版本**: V1.0 | **日期**: 2026-05-11 | **技术栈**: C++ / MFC / DirectX 9.0 / VC2005

---

## 1. 项目概述

本项目是一款基于**刘慈欣《三体》三部曲**为背景的回合制太空4X策略游戏，代号"宇宙群英传"(LegendOfUni)。原版发布于2009年，使用 MFC 对话框作为UI框架。本次重构目标：

1. **修复所有已知严重缺陷**（崩溃/数据损坏）
2. **以三体+流浪地球II为核心重构玩法系统**
3. **在MFC+D3D9框架内实现UI美术升级**（支持黑/白双主题）
4. **采用混合架构**：数据驱动（INI）负责可调参数，C++负责核心逻辑

---

## 2. 工程结构与核心文件索引

```
LengendOfUni-rebuild/
├── LengendOfUni/          ← 主游戏工程（~150个源文件）
│   ├── Game.h/cpp         ← 顶层游戏对象，持有所有Manager
│   ├── define.h           ← 全局枚举（DEPARTMENT_TYPE, STAR_AREA, TEC_TREE_TYPE等）
│   ├── LengendOfUni.h/cpp ← MFC App类，持有 CGame* m_game（全局单例）
│   ├── LengendOfUniDlg.h/cpp ← 主对话框（星图/面板切换/回合结算）
│   │
│   ├── Civilization.h/cpp      ← 文明基类（人口/经济/文化/军力/叛逆度）
│   ├── EarthCivilization.h/cpp ← 地球文明（含矿场/工厂/城市/部门列表）
│   ├── AlienCivilization.h/cpp ← 外星文明（含AI行为RunARound）
│   ├── AlienCiviManager.h/cpp  ← 外星文明管理器
│   │
│   ├── Star.h/cpp           ← 星球实体
│   ├── StarManager.h/cpp    ← 星球管理器（209颗星球的vector）
│   ├── Person.h/cpp         ← 人才（7项属性）
│   ├── PersonManager.h/cpp  ← 人才管理器（已发现/未发现两个map）
│   │
│   ├── TecTree.h/cpp          ← 科技树节点+树结构
│   ├── TecTreeManager.h/cpp   ← 科技树管理器（7棵树→重构为5棵）
│   ├── Weapon.h/cpp           ← 武器原型(CWeapon) + 武器实例(CWeaponEx)
│   ├── WeaponManager.h/cpp    ← 武器注册表
│   │
│   ├── Barback.h/cpp        ← 军营（含武器列表+驻军）
│   ├── Department.h/cpp     ← 部门（含回合逻辑RunARound）
│   ├── ArmyDepartment.h/cpp ← 军事部门（Department派生）
│   ├── EconomyDepartment.h/cpp ← 经济部门（Department派生）
│   │
│   ├── BattleDlg.h/cpp     ← 战斗对话框（~1200行，核心战斗逻辑）
│   ├── AlignmentDlg.h/cpp   ← 外交谈判对话框
│   ├── PlanetPanel.h/cpp    ← 星球操作面板
│   ├── SolarSystemMap.h/cpp ← 太阳系星图（9个CButtonST）
│   ├── StarSystemMap.h/cpp  ← 星系星图
│   │
│   ├── GameEvent.h/cpp        ← 单个事件（对话+效果）
│   ├── GameEventManager.h/cpp ← 事件管理器（普通事件map+随机事件vector）
│   ├── Helper.h/cpp           ← 静态工具类（弹窗/战斗启动/人事调动）
│   ├── RandomNumber.h/cpp     ← 伪随机数生成器（Lehmer LCG）
│   ├── IniConfig.h/cpp        ← INI配置文件读取器
│   └── res/                   ← MFC资源文件（对话框模板/图标）
│
├── MusicPlayer/             ← 音乐播放模块（DirectShow封装）
├── 3DPrelude/               ← 3D片头模块（D3D9，可复用渲染能力）
└── REBUILD_SPEC_PART1.md    ← 本文档
```

---

## 3. 全局访问模式（必读）

整个代码库通过以下链式调用访问游戏数据：

```cpp
((CLengendOfUniApp*)AfxGetApp())->m_game->GetXxxManager()
```

此模式出现在 **BattleDlg / EarthCivilization / Civilization / Department / Helper / GameEvent / PlanetPanel** 等至少15个翻译单元中。**任何新增代码都必须遵循此模式**，直到重构为安全访问器（见下文Bug #1修复方案）。

---

## 4. 必须修复的严重缺陷（P0级别）

### Bug #1：全局单例空指针链

**位置**：全局  
**风险**：`m_game` 为NULL时任何访问均崩溃  
**修复**：在 `LengendOfUni.h` 中新增静态安全访问器

```cpp
// LengendOfUni.h 中新增
static CGame* GetGameInstance() {
    CLengendOfUniApp* pApp = (CLengendOfUniApp*)AfxGetApp();
    if (pApp && pApp->m_game)
        return pApp->m_game;
    ASSERT(FALSE); // 开发期断言
    return NULL;
}
```

### Bug #2：迭代器失效 — RemoveStope/RemoveFactory/RemoveCity

**位置**：`EarthCivilization.cpp` 三个Remove函数  
**风险**：`erase(itr)` 后 `itr++` 导致UB（当前因return恰好安全，但脆弱）  
**修复**：统一使用 `itr = container.erase(itr)` 模式

```cpp
// 修复前（危险）
SAFE_DELETE(*itr)
m_lstStopes.erase(itr);
return TRUE;

// 修复后（安全）
SAFE_DELETE(*itr)
itr = m_lstStopes.erase(itr);
return TRUE;
```

### Bug #3：StarManager::Init() 无限循环

**位置**：`StarManager.cpp` Init() 中的 `while(1)` 循环  
**风险**：当INI配置的星球数接近可用槽位数时死循环  
**修复**：添加最大重试计数

```cpp
int maxRetries = iCount * 2;
int retryCount = 0;
while (retryCount < maxRetries) {
    iIndex = iStartPos + randNum.random(iCount);
    if (find(vecIndex.begin(), vecIndex.end(), iIndex) == vecIndex.end()) {
        vecIndex.push_back(iIndex);
        break;
    }
    retryCount++;
}
if (retryCount >= maxRetries) {
    // 回退：顺序查找第一个未被占用的槽位
    for (int k = iStartPos; k < iStartPos + iCount; k++) {
        if (find(vecIndex.begin(), vecIndex.end(), k) == vecIndex.end()) {
            iIndex = k;
            vecIndex.push_back(iIndex);
            break;
        }
    }
}
```

### Bug #4：AlienCivilization::RunARound() 空向量越界

**位置**：`AlienCivilization.cpp` RunARound() 中武器选择  
**风险**：`vecWeapon` 为空时 `randNum.random(0)` 除以零  
**修复**：

```cpp
if (vecWeapon.size() > 0) {
    int iSelWeapon = randNum.random(vecWeapon.size());
    // ... 原有逻辑
}
```

### Bug #5：CString值传递性能问题

**位置**：全局所有Getter/Setter  
**风险**：非崩溃，但大量不必要的堆分配  
**修复**：将高频调用的 `CString GetName()` 改为 `const CString& GetName() const`  
**范围**：`CStar`, `CPerson`, `CCivilization`, `CDepartment`, `CTecTreeNode`

---

## 5. 数据驱动架构约定

### INI文件职责划分

| INI文件 | 管理内容 | 读取位置 |
|---------|---------|---------|
| `person.ini` | 角色名/属性/头像文件名 | `PersonManager::Init()` |
| `alien.ini` | 外星文明名/属性/母星索引/**新增：性格类型** | `AlienCiviManager::Init()` |
| `star.ini` | 命名星球属性/星系归属 | `StarManager::Init()` |
| `weapon.ini` | 武器原型数据 | `WeaponManager::Init()` |
| `gameevent.ini` | 普通剧情事件（含对话） | `GameEventManager::Init()` |
| `randomevent.ini` | 随机事件 | `GameEventManager::Init()` |
| **`wallfacer.ini`** | **新增：面壁者参数（阈值/衰减/冷却）** | 新增 `CWallfacer::Init()` |
| **`epoch.ini`** | **新增：纪元阈值/名称/解锁内容** | 新增纪元系统 |
| **`diplomacy.ini`** | **新增：外交关系状态阈值/对话** | 新增外交系统 |

### C++代码职责划分

所有**判定逻辑、状态机转换、威胁评估、连锁触发**必须在C++中实现，不可放入INI。包括：
- 面壁计划进度积累/叛变概率计算
- 执剑人威慑度计算公式
- AI威胁评估与特殊武器使用决策
- 智子封锁的科研减速
- 胜利条件检查

---

## 6. 枚举扩展规范

以下枚举需要修改（在 `define.h` 中）：

```cpp
// 科技树类型：从7棵合并为5棵
enum TEC_TREE_TYPE
{
    TT_PHYSICS = 0,      // 基础物理（原质子+天体物理合并）
    TT_AEROSPACE,        // 航天工程（原航天技术重构+流浪地球）
    TT_MILITARY,         // 军事武器（原核技术+天体社会学合并）
    TT_INFORMATION,      // 信息与智能（原文化技术+经济技术合并+数字生命）
    TT_INTERSTELLAR,     // 星际文明（新增终极树）
    TT_COUNT,
};

// 新增：文明纪元
enum EPOCH_TYPE
{
    EP_CRISIS = 0,       // 危机纪元（文化0-199）
    EP_DETERRENCE,       // 威慑纪元（文化200-499）
    EP_BROADCAST,        // 广播纪元（文化500-799）
    EP_BUNKER,           // 掩体纪元（文化800-1199）
    EP_GALAXY,           // 银河纪元（文化1200+）
    EP_COUNT,
};

// 新增：AI性格类型
enum AI_PERSONALITY
{
    AP_HUNTER = 0,       // 猎手型（三体）
    AP_CLEANER,          // 清理者型（歌者）
    AP_DEFENSIVE,        // 防御型（碳基联盟）
    AP_EXPANSIONIST,     // 扩张型（恐龙文明）
    AP_OPPORTUNIST,      // 投机型（波江座）
    AP_COUNT,
};

// 新增：外交状态
enum DIPLOMACY_STATE
{
    DS_EXTINCTION_WAR = 0, // 灭绝战争（0-10）
    DS_SUSPICION,          // 猜疑对峙（11-30）
    DS_ARMED_PEACE,        // 武装和平（31-50）
    DS_COOPERATION,        // 有限合作（51-70）
    DS_ALLIANCE,           // 战略同盟（71-90）
    DS_COMMUNITY,          // 命运共同体（91-100）
    DS_COUNT,
};

// 新增：胜利类型
enum VICTORY_TYPE
{
    VT_CONQUEST = 0,     // 征服胜利
    VT_DETERRENCE,       // 威慑胜利
    VT_DARK_DOMAIN,      // 黑域胜利
    VT_WANDERING,        // 流浪胜利
    VT_DIGITAL,          // 数字永生
    VT_HIDDEN,           // 隐藏结局（归零者）
    VT_COUNT,
};
```

---

## 7. 序列化兼容性策略

> **规则**：本次重构**不保证与旧版存档的兼容性**。所有 `IMPLEMENT_SERIAL` 的版本号从 `1` 升级为 `2`，并在反序列化中添加版本分支。

```cpp
// 示例：CGame 的升级
IMPLEMENT_SERIAL(CGame, CObject, 2)  // 版本号从1改为2

void CGame::Serialize(CArchive &ar) {
    CObject::Serialize(ar);
    int nVersion = ar.IsStoring() ? 2 : /* 从流中读取 */;
    if (ar.IsStoring()) {
        ar << nVersion;
        // 写入新版本数据...
    } else {
        ar >> nVersion;
        if (nVersion == 1) {
            // 旧版兼容路径（如果需要）
        } else {
            // 新版数据读取
        }
    }
}
```

---

## 8. 新增类清单

| 类名 | 文件 | 继承 | 职责 |
|------|------|------|------|
| `CWallfacer` | Wallfacer.h/cpp | 无 | 面壁者系统（秘密计划进度/叛变判定） |
| `CSwordholder` | Swordholder.h/cpp | 无 | 执剑人机制（威慑度维护/交接危机） |
| `CDiplomacy` | Diplomacy.h/cpp | 无 | 黑暗森林外交（0-100好感度+状态机） |
| `CEpochManager` | EpochManager.h/cpp | 无 | 文明纪元（阈值检查/解锁通知） |
| `CAIStrategy` | AIStrategy.h/cpp | 无 | AI决策层（威胁评估/特殊武器判定） |
| `CThemeManager` | ThemeManager.h/cpp | 无 | 双主题切换（色彩表/纹理路径管理） |
| `CPlanetEngine` | PlanetEngine.h/cpp | 无 | 行星发动机子系统（推进/变轨/流浪计划） |
| `CDigitalLife` | DigitalLife.h/cpp | 无 | 数字生命系统（意识保存/复活/MOSS） |

---

*→ 续 Part 2：玩法系统、科技树、角色数据、UI美术规范*
