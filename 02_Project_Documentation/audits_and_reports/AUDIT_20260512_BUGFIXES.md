# 《宇宙群英传》Web 版代码审计报告与修复方案

> **审计日期**: 2026-05-12
> **审计范围**: `legend-of-uni-web/` 全部源码、数据、样式、配置
> **严重程度**: 🔴 致命 | 🟠 严重 | 🟡 中等 | 🔵 建议

---

## 🔴 BUG-01: `stars.json` 为空数组 → 星图无任何天体

**文件**: `src/data/stars.json`
**现象**: 文件内容为 `[]`。`StarManager.init()` 遍历空数组，不会创建任何 `Star`。`UIManager.start()` 中 `filter(s => s.index <= 8)` 得到空数组，Canvas 上没有任何可点击的天体。整个游戏无法交互。

**修复**: 将 `stars.json` 填充为太阳系 9 颗天体数据（索引 0-8）：

```json
[
  {"Index":0,"Name":"月球","IsPlanet":1,"Resource":50},
  {"Index":1,"Name":"太阳","IsPlanet":0,"Resource":0},
  {"Index":2,"Name":"水星","IsPlanet":1,"Resource":100},
  {"Index":3,"Name":"金星","IsPlanet":1,"Resource":200},
  {"Index":4,"Name":"地球","IsPlanet":1,"Resource":500},
  {"Index":5,"Name":"木星","IsPlanet":1,"Resource":800},
  {"Index":6,"Name":"火星","IsPlanet":1,"Resource":300},
  {"Index":7,"Name":"土星","IsPlanet":1,"Resource":600},
  {"Index":8,"Name":"天王星","IsPlanet":1,"Resource":400}
]
```

**同时修复**: `StarManager.init()` 结束后，需要将地球（index=4）设为己方领土：
```typescript
// StarManager.ts init() 末尾追加:
const earth = this.stars.get(4);
if (earth) {
  earth.belongToCivi = "地球";
  earth.found = true;
  earth.populationLimit = 1000;
  earth.currentPopulation = 100;
}
```

---

## 🔴 BUG-02: `persons.json` 字段名大小写不匹配 → 所有人物属性为 0

**文件**: `src/data/persons.json` + `src/core/PersonManager.ts`
**现象**: JSON 使用小写 `"name"`, `"science"` 等。但 `PersonManager.init()` 读取 `data.Name`, `data.Science`（大写开头），全部返回 `undefined`，最终所有人物属性为 0。

**修复方案 (改 PersonManager.ts:12-26)**:
```typescript
public init(): void {
  personsData.forEach((data: any) => {
    const p = createEmptyPerson(data.name || data.Name);
    p.faceFile = data.faceFile || data.FaceFile || "";
    p.treachery = data.treachery ?? data.Treachery ?? 0;
    p.science = data.science ?? data.Science ?? 0;
    p.art = data.art ?? data.Art ?? 0;
    p.economy = data.economy ?? data.Economy ?? 0;
    p.army = data.army ?? data.Army ?? 0;
    p.leadership = data.leadership ?? data.Leadership ?? 0;
    p.social = data.social ?? data.Social ?? 0;
    this.persons.set(p.name, p);
    this.availablePersons.add(p.name);
  });
}
```

---

## 🔴 BUG-03: `aliens.json` 字段名同样不匹配 → 异星文明名为 `undefined`

**文件**: `src/data/aliens.json` + `src/core/AlienCivilization.ts:89`
**现象**: JSON 用小写 `"name"`，代码读 `data.Name` → `undefined`。文明名为 `undefined`，`aliens.get("三体")` 永远返回 `undefined`。

**修复 (AlienCivilization.ts:88-91)**:
```typescript
aliensData.forEach((data: any) => {
  const alien = new AlienCivilization(data.name || data.Name, data.personality || 0);
  this.aliens.set(alien.name, alien);
});
```

---

## 🔴 BUG-04: `events.json` 的 `name` 字段是数字不是字符串 → 事件名显示为数字

**文件**: `src/data/events.json` + `src/core/GameEventManager.ts`
**现象**: `events.json` 中 `"name": 2` 是年份数字，而不是事件名。代码把它同时当 `name` 和 `inYear` 用，且 `data.Name`（大写）读不到值。

**修复 (GameEventManager.ts:11-22)**:
```typescript
public init(): void {
  eventsData.forEach((data: any) => {
    const e = createGameEvent(
      data.talk0_talker || `事件_${data.name}`,  // 用说话人作为事件名
      data.eventtype ?? 0,
      data.name ?? data.Name ?? 0,  // name 字段实际是年份
      data.talk0_content || "",
      data.eventeffect ?? 0
    );
    this.events.push(e);
  });
}
```

---

## 🔴 BUG-05: CSS 缺少 `.modal-overlay` / `.hidden` / `.modal-box` 等关键样式 → 弹窗不可见或布局混乱

**文件**: `src/index.css`
**现象**: 代码中大量使用了 `.modal-overlay`、`.hidden`、`.modal-box`、`.modal-header`、`.modal-content`、`.btn-close`、`.tech-node`、`.progress-bar-bg`、`.progress-bar-fill`、`.tech-tree-grid` 等 CSS 类，但 `index.css` 中**完全没有**定义这些样式。所有弹窗（部门、选人、面壁、系统菜单）的布局和隐藏逻辑都会失效。

**修复**: 在 `index.css` 末尾追加以下完整样式块：

```css
/* ============== Modal System ============== */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.hidden {
  display: none !important;
}

.modal-box {
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.modal-header h2 {
  margin: 0;
  color: var(--text-accent);
  font-family: 'Orbitron', sans-serif;
}

.modal-content {
  padding: 8px 0;
}

.btn-close {
  background: none;
  border: 1px solid rgba(255,255,255,0.2);
  color: var(--text-primary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255, 85, 0, 0.2);
  border-color: #FF5500;
  color: #FF5500;
}

/* ============== Tech Tree ============== */
.tech-tree-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 8px 0;
}

.tech-node {
  padding: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.tech-node:hover {
  background: rgba(0, 229, 255, 0.08);
  border-color: var(--text-accent);
}

.tech-node h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.tech-node p {
  margin: 4px 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.tech-node.finished {
  border-color: #00E5FF;
  background: rgba(0, 229, 255, 0.1);
}

.tech-node.finished h4 {
  color: #00E5FF;
}

.tech-node.researching {
  border-color: #FFD700;
  animation: pulse-research 2s ease-in-out infinite;
}

@keyframes pulse-research {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.2); }
  50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
}

.progress-bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00E5FF, #7B61FF);
  border-radius: 3px;
  transition: width 0.3s;
}
```

---

## 🟠 BUG-06: 地球文明初始化时未占有任何星系 → `isDieOut()` 始终返回 `true`

**文件**: `src/core/EarthCivilization.ts`
**现象**: `EarthCivilization` 继承自 `Civilization`，其 `starIndices` 初始为空 `Set`。`isDieOut()` 检查 `starIndices.size === 0`，所以地球文明从一开始就被判定为"灭亡"。

**修复 (EarthCivilization.ts 构造函数末尾追加)**:
```typescript
constructor() {
  super("地球");
  // ...已有部门初始化代码...
  this.starIndices.add(4); // 地球 index=4
  this.population = 100;
}
```

---

## 🟠 BUG-07: `PersonSelectPanel` / `WallfacerPanel` / `SystemMenuPanel` 在 DOM 就绪前实例化 → `document.getElementById` 返回 `null`

**文件**: `PersonSelectPanel.ts:111`, `WallfacerPanel.ts:159`, `SystemMenuPanel.ts:72`
**现象**: 这三个文件在模块顶层导出全局单例（如 `export const wallfacerPanel = new WallfacerPanel()`）。当模块被 `import` 时，构造函数立即执行。但此时 `MainLayout` 可能尚未渲染 DOM，导致 `WallfacerPanel` 中 `document.getElementById("modal-container")` 返回 `null`，后续调用 `.classList` 时崩溃。

**修复方案**: 将 `WallfacerPanel` 的 DOM 查询改为延迟获取（lazy init）：

```typescript
// WallfacerPanel.ts 修改
export class WallfacerPanel {
  private get modal(): HTMLElement { return document.getElementById("modal-container")!; }
  private get title(): HTMLElement { return document.getElementById("modal-title")!; }
  private get content(): HTMLElement { return document.getElementById("modal-content")!; }

  // 删除 constructor 中的三行 getElementById
  constructor() {}
  // ...其余不变
}
```

`PersonSelectPanel` 和 `SystemMenuPanel` 使用 `document.createElement` 并 `appendChild` 到 `body`，同样需确保在 DOM 加载后执行。最安全的做法是把 `document.body.appendChild` 放到 `open()` 方法中，加一次性守卫：

```typescript
private mounted = false;
public open(...) {
  if (!this.mounted) {
    document.body.appendChild(this.container);
    this.mounted = true;
    this.bindEvents();
  }
  // ...
}
```

---

## 🟠 BUG-08: 存档 `loadGame()` 中 `Object.assign` 无法恢复嵌套类原型 → 读档后 `runARound` 崩溃

**文件**: `src/core/Game.ts:98-124`
**现象**: `Object.assign(this.instance, parsedData)` 只做浅层属性覆盖。`parsedData.earthCivi.tecTreeManager` 内部的 `TecTree` 对象、`TecTreeNode` 的 `Map` 虽然通过 reviver 恢复了 Map 结构，但 `TecTree` 类上的 `getNode()`、`isFinished()` 等方法丢失。调用 `isTecFinished()` 时链式调用 `tree.isFinished(name)` 会抛 `TypeError: tree.isFinished is not a function`。

**修复**: 在 `loadGame()` 中追加嵌套原型修补：

```typescript
// Game.ts loadGame() 中，在 Object.setPrototypeOf(this.instance.earthCivi, ...) 之后追加：

// 修补 TecTreeManager
import { TecTreeManager } from "./TecTreeManager";
import { TecTree } from "./TecTree";

Object.setPrototypeOf(this.instance.earthCivi.tecTreeManager, TecTreeManager.prototype);
for (const tree of this.instance.earthCivi.tecTreeManager.trees.values()) {
  Object.setPrototypeOf(tree, TecTree.prototype);
}

Object.setPrototypeOf(this.instance.starManager, StarManager.prototype);
Object.setPrototypeOf(this.instance.personManager, PersonManager.prototype);
Object.setPrototypeOf(this.instance.eventManager, GameEventManager.prototype);
```

---

## 🟠 BUG-09: `btn-primary` 缺少基础按钮样式 → 按钮无 cursor/border-radius/font-family

**文件**: `src/index.css:175-190`
**现象**: `.btn-primary` 没有继承 `.btn-glass` 的基础样式（如 `cursor: pointer`、`border-radius`、`font-family`）。按钮没有手型光标，外观不一致。

**修复**: 让 `.btn-primary` 扩展 `.btn-glass` 的基础属性：
```css
.btn-primary {
  /* 追加这些缺失属性 */
  cursor: pointer;
  border-radius: 6px;
  font-family: 'Noto Sans SC', sans-serif;
  transition: all 0.2s;
  /* 保留已有属性 */
  background: rgba(0, 229, 255, 0.1);
  /* ... */
}
```

---

## 🟡 BUG-10: `MainLayout` 中 `top-deterrence` 元素在 HTML 中不存在

**文件**: `src/ui/MainLayout.ts`
**现象**: 实施计划中提到在 TopBar 中展示威慑值 `id="top-deterrence"`，但 `MainLayout.render()` 的 HTML 模板中没有这个元素。`updateUI()` 中也未更新它。

**修复**: 在 `MainLayout.ts` 的资源统计区追加：
```html
<div class="stat-item">
  <span class="stat-label">威慑</span>
  <span class="stat-value" id="top-deterrence" style="color: #FFD700;">0</span>
</div>
```
并在 `UIManager.updateUI()` 中追加：
```typescript
this.setText("top-deterrence", Math.floor(earth.deterrenceValue).toString());
```

---

## 🟡 BUG-11: `updateUI()` 不更新舰队信息 → 玩家无法知道自己有多少舰队

**文件**: `src/ui/UIManager.ts:83-96`
**现象**: `updateUI()` 只更新人口/经济/文化/军力，但 `army` 始终为 0（从未被任何逻辑修改过），也没有展示舰队数量。

**修复**: 在 `updateUI()` 中更新军力为舰队数量：
```typescript
this.setText("ui-army", earth.fleets.length.toString());
```

---

## 🟡 BUG-12: 异星 AI 每回合都有 20% 概率发兵，但水滴战力极低 → 游戏体验失衡

**文件**: `src/core/AlienCivilization.ts:42-47`
**现象**: 水滴只有 `currentBuild: 1`，战力 = `1 * 10 = 10`。地球默认防御 `soldierCount: 500`，战力 = `500`。异星永远打不过，频繁的无效攻击只会刷屏日志。

**修复**: 提高水滴战力或降低攻击频率：
```typescript
fleet.weapons.push({ weaponName: "水滴", currentBuild: 100 }); // 战力 1000
```
并将攻击概率降低：`Math.random() < 0.08`（约每12回合一次）

---

## 🟡 BUG-13: 舰队派遣硬编码目标为木星 index=5 → 无法选择其他目标

**文件**: `src/ui/UIManager.ts:174-175`
**现象**: 出征按钮直接 `createFleet("地球第一舰队", "地球", star.index, 5, 3)`，目标写死为 5（木星）。

**修复建议**: 添加一个简单的星系选择交互。在点击"派遣"后进入"选择目标"模式，下次点击星图上的某颗星即为目标。

---

## 🟡 BUG-14: `saveGame()` 在保存后追加日志 → 保存的存档不含"已保存"这条日志，但实际 historyLogs 中多了一条

**文件**: `src/core/Game.ts:91-96`
**现象**: 先 `JSON.stringify`，再 `addHistory`。存档中不含这条日志，但内存中多了。虽然不致命，但逻辑不一致。

**修复**: 将 `addHistory` 移到 `stringify` 之前，或者直接删除这行，改为在 UI 层提示。

---

## 🔵 BUG-15: `btn-history` 按钮无功能 → 点击无反应

**文件**: `src/ui/MainLayout.ts:35` + `src/ui/UIManager.ts`
**现象**: TopBar 中有"历史记录"按钮，但 `UIManager.bindEvents()` 中没有为 `btn-history` 绑定任何事件处理器。

**修复**: 在 `UIManager.bindEvents()` 中追加：
```typescript
document.getElementById("btn-history")?.addEventListener("click", () => {
  const logs = GameInstance.get().historyLogs;
  alert(logs.slice(-20).join("\n")); // 简单展示最近 20 条
});
```

---

## 🔵 BUG-16: `weapons.json` 为空 → `WeaponManager` 无原型数据

**文件**: `src/data/weapons.json` + `src/core/WeaponManager.ts`
**现象**: `weapons.json` 为 `[]`，且 `WeaponManager.init()` 内部被注释掉了。虽然目前战斗引擎不依赖 Prototype 查询，但 `isWeaponFinished` 等函数无法正常工作。

**修复**: 填充 `weapons.json` 或在 `WeaponManager.init()` 中硬编码几个原型用于测试。

---

## 🔵 BUG-17: `DepartmentPanel` 中科技树类型映射不完整

**文件**: `src/ui/DepartmentPanel.ts:84-90`
**现象**: `ASTROSOCIOLOGY`(4) 已被拦截到 WallfacerPanel，但 switch 中仍有 `case DepartmentType.ASTROSOCIOLOGY: relatedTecTreeType = 3`。5(NUCLEAR)、6(SPACEFIGHT)、7(PROTON) 等部门没有映射到任何科技树。

**修复**: 完善 switch 映射或移除无效分支。

---

## 修复优先级执行顺序

| 顺序 | BUG | 严重度 | 预计工时 |
|------|------|--------|----------|
| 1 | BUG-01 stars.json | 🔴 致命 | 10 min |
| 2 | BUG-05 CSS 缺失 | 🔴 致命 | 15 min |
| 3 | BUG-02 persons 字段 | 🔴 致命 | 5 min |
| 4 | BUG-03 aliens 字段 | 🔴 致命 | 3 min |
| 5 | BUG-04 events 字段 | 🔴 致命 | 5 min |
| 6 | BUG-06 地球初始星系 | 🟠 严重 | 3 min |
| 7 | BUG-07 单例初始化时序 | 🟠 严重 | 10 min |
| 8 | BUG-08 存档原型恢复 | 🟠 严重 | 10 min |
| 9 | BUG-09 btn-primary | 🟠 严重 | 3 min |
| 10 | BUG-10~17 | 🟡🔵 | 各 3-5 min |

**修复完成后务必执行**: `npm run build` 确保 TypeScript 编译零错误。
