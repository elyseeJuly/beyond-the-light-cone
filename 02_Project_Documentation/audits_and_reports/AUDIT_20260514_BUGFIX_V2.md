# LegendOfUni-rebuild 全量审计与修复方案 V2

> 审计日期: 2026-05-13  
> 审计范围: `legend-of-uni-web/src/` 全部 35 个模块  
> 架构: React 19 + TailwindCSS 4 + Vite 8 + 遗留 vanilla TS UI 层

---

## 一、架构核心问题：双轨并存冲突

当前项目存在**两套完全独立的 UI 系统**同时存在，互相冲突：

| 层 | 文件 | 状态 |
|---|------|------|
| **React 层 (活跃)** | `App.tsx`, `TopHUD.tsx`, `LeftHub.tsx`, `RightInspector.tsx`, `StarMap.tsx` | 当前运行中 |
| **Vanilla 层 (死代码)** | `MainLayout.ts`, `UIManager.ts` | **从未被 import**，100% 死代码 |
| **遗留桥接层 (部分活跃)** | `SystemMenuPanel.ts`, `DepartmentPanel.ts`, `WallfacerPanel.ts`, `PersonSelectPanel.ts`, `TecTreeView.ts` | 通过 `document.createElement` 注入 DOM，绕过 React |

> [!IMPORTANT]
> **约束**: `MainLayout.ts` 和 `UIManager.ts` 是完全的死代码，不要修改它们，也不要从它们中引用任何逻辑。所有 UI 修改必须在 React 组件层 (`src/components/`) 或桥接层 (`src/ui/`) 中进行。

---

## 二、Bug 清单（按严重程度排序）

### 🔴 P0 - 崩溃级

#### BUG-A1: 事件效果从未执行
- **文件**: [Game.ts L67-70](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/Game.ts#L67-L70)
- **现象**: 事件触发后只 `addHistory`，从未读取 `event.effect` 字段执行实际游戏效果
- **影响**: `EventEffect.MOON_CRISIS`(月球危机)、`EventEffect.WANDERING_EARTH`(流浪地球) 等关键剧情事件永远不会发生
- **修复方案**: 在 `runARound()` 的 `triggeredEvents.forEach` 中添加 `switch(e.effect)` 分支：

```typescript
// 在 Game.ts runARound() 中，需要在文件头部补充 import { EventEffect, TecTreeType }
triggeredEvents.forEach(e => {
  this.addHistory(`触发事件: ${e.name} - ${e.tip}`);
  switch (e.effect) {
    case EventEffect.ADDECONEMY: this.earthCivi.economy += 50; break;
    case EventEffect.ADDCULTURE: this.earthCivi.culture += 30; break;
    case EventEffect.ADDPOP: this.earthCivi.population += 20; break;
    case EventEffect.MOON_CRISIS:
      const moon = this.starManager.getStar(0);
      if (moon) { moon.totalResource = 0; moon.currentResource = 0; }
      break;
    case EventEffect.WANDERING_EARTH:
      if (this.earthCivi.tecTreeManager.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅲ型")) {
        this.addHistory("流浪地球计划启动！");
      } else {
        this.addHistory("缺少行星发动机技术，无法启动流浪地球计划！");
      }
      break;
  }
});
```

#### BUG-A2: 纪元(Epoch)永远停留在"危机纪元"
- **文件**: [Game.ts L74](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/Game.ts#L74)
- **现象**: `runARound()` 最后有注释 `// Check Epoch transition...` 但**从未实现**
- **修复方案**: 在 `this.year++` 之后添加：

```typescript
if (this.epoch === EpochType.CRISIS && this.earthCivi.deterrenceValue >= 100) {
  this.epoch = EpochType.DETERRENCE;
  this.addHistory("【纪元更替】进入威慑纪元！");
}
```

#### BUG-A3: 异星文明 `isDieOut()` 永远返回 `true`
- **文件**: [Civilization.ts L25-27](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/Civilization.ts#L25-L27) 和 [AlienCivilization.ts L87-91](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/AlienCivilization.ts#L87-L91)
- **现象**: `isDieOut()` 检查 `starIndices.size === 0`，但异星文明在 `init()` 中从未设置 `starIndices`，导致所有异星一创建就"已灭亡"
- **影响**: `isSophonBlocked()` 永远返回 `false`，智子干扰永远不生效，异星永远不会进攻
- **修复方案**: 在 `AlienCiviManager.init()` 中：

```typescript
const alien = new AlienCivilization(data.name || data.Name, data.personality || 0);
alien.starIndices.add(1000 + this.aliens.size); // 给每个异星一个虚拟星系索引
this.aliens.set(alien.name, alien);
```

---

### 🟠 P1 - 功能缺失

#### BUG-B1: 人物头像(faceFile)从未在 UI 中使用
- **数据现状**: `persons.json` 中有 8 个角色配置了 `faceFile` 字段

| 角色 | faceFile | 图片 |
|------|----------|------|
| 罗辑 | `character_luoji.png` | ✅ |
| 叶文洁 | `character_yewenjie.png` | ✅ |
| 大史 | `character_dashi.png` | ✅ |
| 章北海 | `character_beihai.png` | ✅ |
| 程心 | `character_chengxin.png` | ✅ |
| 维德 | `character_wade.png` | ✅ |
| 云天明 | `character_tianming.png` | ✅ |
| 智子 | `character_sophon.png` | ✅ |

- **图片位置**: `legend-of-uni-web/public/images/` (8 张高质量角色立绘)
- **需在 3 个 UI 位置展示头像**:

**位置 1**: `PersonSelectPanel.ts` 人员选择列表 — L66-84 的 `person-card` HTML 中添加头像  
**位置 2**: `WallfacerPanel.ts` 面壁者条目 — L27-33  
**位置 3**: `DepartmentPanel.ts` 部门负责人区域 — L46-55

> [!WARNING]
> 图片路径必须是 `/images/character_xxx.png`。Vite 的 `public/` 目录映射到根路径 `/`。**绝不可以**写 `./public/images/` 或用 import。无头像的角色应显示首字母占位符。

#### BUG-B2: `Star.currentPopulation` 从未随回合更新
- **文件**: StarManager.ts 和 EarthCivilization.ts
- **现象**: 地球的 `currentPopulation` 初始化为 100 后永不变化
- **修复**: 在 `EarthCivilization.runARound()` 末尾同步星球人口

#### BUG-B3: 550W量子计算机引用了不存在的科技节点
- **文件**: [Game.ts L54](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/Game.ts#L54)
- **现象**: `isTecFinished(TecTreeType.INFORMATION, "550W量子计算机")` 但 INFORMATION 树中只有 `意识上传` 和 `数字方舟`
- **修复**: 在 INFORMATION 树中添加该节点，或将引用改为已有节点名

---

### 🟡 P2 - 体验问题

#### BUG-C1: 军事系科技树(MILITARY)为空
- **文件**: [TecTreeManager.ts L29-30](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/core/TecTreeManager.ts#L29-L30)
- **修复**: 补充军事科技节点（如"引力波探测"、"曲率驱动"等）

#### BUG-C2: App.tsx 浮动主题按钮与设置菜单重复
- **文件**: [App.tsx L69-74](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/legend-of-uni-web/src/App.tsx#L69-L74)
- **修复**: 删除 App.tsx 中的浮动主题/Inspector 按钮

#### BUG-C3: 主题切换机制不统一
- App.tsx 用 `.dark` class 在 `document.documentElement` 上
- SystemMenuPanel 用 `.light-mode` class 在 `document.body` 上
- **修复**: 统一为一套，建议保留 `.dark` 机制

#### BUG-C4: `randomevents.json` 为空数组
- 无随机事件数据，暂时忽略

---

## 三、约束规则（防止修复跑偏）

> [!CAUTION]
> 以下规则**必须严格遵守**。

### 规则 1: 不要碰的文件
- `src/ui/MainLayout.ts` — 死代码，不修改不引用
- `src/ui/UIManager.ts` — 死代码，不修改不引用

### 规则 2: React 与遗留 DOM 桥接
遗留面板用 `document.createElement` + `document.body.appendChild` 注入 DOM。这是合法桥接，不要重写为 React 组件。

### 规则 3: 状态更新必须派发事件
修改游戏状态后必须调用:
```typescript
window.dispatchEvent(new CustomEvent('game-turn-complete'));
```

### 规则 4: 不修改 Person 接口
`Person.faceFile` 字段已存在，数据加载已完成。只需在 UI 层读取。

### 规则 5: CSS 双轨制
- `.dark` class 控制 Tailwind 变量（React 组件用）
- `.modal-overlay` 等 class 给遗留面板用
- 两者共存不要删除

### 规则 6: 构建验证
每次修改后运行 `cd legend-of-uni-web && npx tsc --noEmit` 确保零错误。

---

## 四、推荐修复优先级

| 序号 | Bug ID | 工作量 | 描述 |
|------|--------|--------|------|
| 1 | BUG-A3 | 5 min | 异星文明 isDieOut 永远为 true |
| 2 | BUG-A2 | 10 min | 纪元永远不转换 |
| 3 | BUG-A1 | 15 min | 事件效果从未执行 |
| 4 | BUG-B1 | 30 min | 人物头像未展示 (3个位置) |
| 5 | BUG-B2 | 5 min | Star.currentPopulation 不同步 |
| 6 | BUG-B3 | 5 min | 550W量子计算机引用不存在 |
| 7 | BUG-C3 | 10 min | 主题切换机制统一 |
| 8 | BUG-C2 | 5 min | 删除重复浮动按钮 |
| 9 | BUG-C1 | 15 min | 军事科技树为空 |
