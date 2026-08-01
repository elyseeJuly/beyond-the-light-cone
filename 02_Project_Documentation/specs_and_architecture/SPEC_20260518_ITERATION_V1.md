# 宇宙群英传 迭代优化技术规范 V1

> **版本**: 1.0 | **日期**: 2026-05-18  
> **项目路径**: `/Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/`  
> **技术栈**: React 19 + TypeScript 5 + Vite 8 + TailwindCSS 4  
> **用途**: 供任何 AI 或开发者接手时的完整技术规范，确保零歧义执行

---

## 〇、关键约束（必读）

> [!CAUTION]
> 1. **禁止修改的文件**: `src/ui/MainLayout.ts`, `src/ui/UIManager.ts` — 100% 死代码，不修改不引用
> 2. **状态更新后必须派发事件**: `window.dispatchEvent(new CustomEvent('game-turn-complete'))`
> 3. **不修改 Person 接口结构**: `Person.faceFile` 已存在，仅在 UI 层读取
> 4. **CSS 双轨制共存**: `.dark` class (React/Tailwind) + `.modal-overlay` (遗留面板) 两者不可删除
> 5. **每次修改后验证编译**: `npx tsc --noEmit` 必须零错误
> 6. **全局单例**: `GameInstance.get()` 是唯一获取 Game 实例的方式

---

## 一、项目架构概览

```
03_Web_Rebuild/
├── src/
│   ├── core/          # 19 文件 - 游戏引擎（Game, EarthCivi, AlienCivi, Combat, TecTree...）
│   ├── components/    # 8 文件 - React UI（TopHUD, StarMap, RightInspector, StoryModal...）
│   ├── ui/            # 8 文件 - 遗留 vanilla TS（TecTreeView, WallfacerPanel, DepartmentPanel...）
│   ├── types/         # enums.ts + narrative.ts
│   ├── utils/         # assetUrl.ts
│   ├── data/          # 6 JSON 数据文件
│   ├── App.tsx        # React 根组件
│   └── main.tsx       # 入口
├── scripts/           # gameplay-analyzer.ts（Headless 测试脚本）
└── public/images/     # 角色立绘资源
```

**核心循环**: `Game.runARound()` → `EarthCivilization.runARound()` → `AlienCiviManager.runARound()` → 事件检查 → 纪元更新 → 胜利判定

**参考文档**（均在 `02_Project_Documentation/`）:
- `CODE_AUDIT_2026_05_18.md` — 代码审计（12 个 BUG + 7 个类型问题 + 5 个架构问题）
- `TEST_SUPPLEMENT_2026_05_18.md` — 测试补充（50+ 新用例）
- `STRATEGY_CURVE_ANALYSIS_2026_05_18.md` — 策略曲线分析（评分 4/10）
- `GAME_OPTIMIZATION_PLAN.md` — 历史优化方案
- `STRATEGY_OPTIMIZATION_REPORT.md` — 策略系统重构记录

---

## 二、迭代任务清单

### 第一阶段：P0 致命缺陷修复

#### ITER-001：工人分配分母动态化
- **文件**: `src/core/EarthCivilization.ts` L177-183
- **现状**: `allocateWorkers()` 分母硬编码 `90`
- **修改**:
```typescript
// 修改前
this.miningWorkers = Math.floor(total * this.miningRatio / 90);
// 修改后
const totalRatio = this.miningRatio + this.factoryRatio + this.cultureRatio;
const denom = totalRatio > 0 ? totalRatio : 1;
this.miningWorkers = Math.floor(total * this.miningRatio / denom);
this.factoryWorkers = Math.floor(total * this.factoryRatio / denom);
this.cultureWorkers = Math.floor(total * this.cultureRatio / denom);
this.idleWorkers = total - this.miningWorkers - this.factoryWorkers - this.cultureWorkers;
```

#### ITER-002：ADDTREACHERY 语义修正
- **文件**: `src/core/Game.ts` L315
- **现状**: `EventEffect.ADDTREACHERY` 实际执行 `treachery - 15`（语义反转）
- **修改**: 改枚举名为 `REDUCE_TREACHERY`（在 `types/enums.ts` L103），或将逻辑改为 `+15`
- **注意**: 需同步检查所有引用此枚举的 JSON 数据和代码

#### ITER-003：军事效果舰队需附带武器
- **文件**: `src/core/Game.ts` L353-356
- **现状**: `applyNewEffects` 中 `military` 分支创建的舰队 `weapons=[]`，战力为 0
- **修改**:
```typescript
case 'military':
  const fleetsToAdd = Math.max(0, val);
  for (let i = 0; i < fleetsToAdd; i++) {
    const fleet = createFleet(`第${this.earthCivi.fleets.length + 1}舰队`, "地球", 4, 4, 0);
    fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 50 });
    this.earthCivi.fleets.push(fleet);
  }
  break;
```

#### ITER-004：assetUrl 环境兼容
- **文件**: `src/utils/assetUrl.ts` L2
- **现状**: `import.meta.env.BASE_URL` 在 Node.js 中报 TypeError
- **修改**:
```typescript
export function getAssetUrl(path: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  return `${base}${path.replace(/^\//, '')}`;
}
```

#### ITER-005：processCulture 返回值被丢弃
- **文件**: `src/core/EarthCivilization.ts` L63
- **现状**: `this.processCulture(game)` 调用但返回值未使用
- **修改**: 将 L63 `this.processCulture(game);` 改为 `this.culture += this.processCulture(game);`
- **同时**: 删除 L70 `this.culture += this.processCultureDept(game);` 中的重复文化加成，或合并两个方法

---

### 第二阶段：星图系统完善

#### ITER-006：太阳系星图修正

**当前 `stars.json` 与真实太阳系对比**:

| Index | 当前名称 | 问题 | 真实情况 |
|-------|---------|------|----------|
| 0 | 月球 | ⚠️ 月球不是行星 `IsPlanet:1` 应为卫星 | 月球是地球卫星，应设 `IsPlanet:0` 或新增卫星类型 |
| 1 | 太阳 | ✅ 正确 `IsPlanet:0` | 恒星 |
| 2 | 水星 | ✅ 名称正确 | 离太阳最近，资源贫瘠合理 |
| 3 | 金星 | ✅ 名称正确 | 大气层厚重 |
| 4 | 地球 | ✅ | 人类文明所在 |
| 5 | 木星 | ✅ 最大行星，资源800合理 | 气态巨行星 |
| 6 | 火星 | ⚠️ **顺序错误**: 真实排序地球(4)→火星→木星，但这里火星(6)在木星(5)之后 | 应 Index=5 |
| 7 | 土星 | ⚠️ **顺序错误**: 真实排序木星→土星→天王星 | 应 Index=6 |
| 8 | 天王星 | ✅ | 冰巨星 |
| — | **海王星** | ❌ **缺失** | 太阳系第八大行星完全缺失 |
| — | **冥王星** | ❌ **缺失**（可选） | 矮行星，三体原著中有提及 |

**轨道布局问题** (`StarMapRenderer.ts` L90):
```typescript
orbitRadius = 40 + s.index * 35;
```
- 所有行星等间距排列，与真实太阳系不符
- 真实比例：水星0.39AU, 金星0.72, 地球1.0, 火星1.52, 木星5.2, 土星9.5, 天王星19.2, 海王星30.1
- 内行星应密集，外行星应稀疏

**修改方案**:

1. 修正 `stars.json` — 按真实太阳系排序，补充海王星:
```json
[
  {"Index":0,"Name":"太阳","IsPlanet":0,"Resource":0},
  {"Index":1,"Name":"水星","IsPlanet":1,"Resource":80,"PopLimit":50},
  {"Index":2,"Name":"金星","IsPlanet":1,"Resource":150,"PopLimit":100},
  {"Index":3,"Name":"地球","IsPlanet":1,"Resource":500,"PopLimit":1000},
  {"Index":4,"Name":"月球","IsPlanet":1,"Resource":50,"PopLimit":200},
  {"Index":5,"Name":"火星","IsPlanet":1,"Resource":300,"PopLimit":500},
  {"Index":6,"Name":"木星","IsPlanet":1,"Resource":800,"PopLimit":300},
  {"Index":7,"Name":"土星","IsPlanet":1,"Resource":600,"PopLimit":200},
  {"Index":8,"Name":"天王星","IsPlanet":1,"Resource":400,"PopLimit":150},
  {"Index":9,"Name":"海王星","IsPlanet":1,"Resource":350,"PopLimit":100}
]
```

> [!WARNING]
> 修改 Index 映射会影响多处硬编码：
> - `StarManager.ts` L26: 地球 `this.stars.get(4)` → 改为 `get(3)`
> - `EarthCivilization.ts` L35: `this.starIndices.add(4)` → 改为 `add(3)`
> - `AlienCivilization.ts` L139: `const targetIdx = 4` → 改为 `3`
> - `StarMapRenderer.ts` L85: `s.index === 1` (太阳) → 改为 `s.index === 0`
> - `StarManager.ts` L49: `getStarsByArea` 的 `s.index <= 8` → 改为 `<= 9`
> - **建议**: 用常量 `EARTH_INDEX = 3`, `SUN_INDEX = 0` 替代硬编码

2. 修正轨道半径为近似真实比例:
```typescript
// StarMapRenderer.ts initStars() 中
const orbitScales: Record<number, number> = {
  0: 0,     // 太阳 - 中心
  1: 0.39,  // 水星
  2: 0.72,  // 金星
  3: 1.0,   // 地球
  4: 1.05,  // 月球 (紧贴地球)
  5: 1.52,  // 火星
  6: 3.5,   // 木星 (压缩比例，否则太远)
  7: 5.0,   // 土星
  8: 7.0,   // 天王星
  9: 9.0,   // 海王星
};
const baseRadius = 35;
orbitRadius = (orbitScales[s.index] || 0) * baseRadius + 30;
```

#### ITER-007：外太空星图体系建设

**当前状态**: `StarManager.getStarsByArea()` 定义了四个区域但 `stars.json` **仅有太阳系 9 颗星**，Index 9-1000 完全为空。科技树中的远镜科技（50光年远镜、1万光年远镜、银河系远镜）解锁后无对应星球可探索。

**区域定义与数据需求**:

| 区域 | Index 范围 | 当前星球数 | 需求星球数 | 解锁科技 |
|------|-----------|-----------|-----------|----------|
| 太阳系 | 0-9 | 9(改后10) | 10 | 初始可见 |
| 50光年 | 10-100 | **0** | 15-25 | 50光年远镜 |
| 1万光年 | 101-200 | **0** | 20-30 | 1万光年远镜 |
| 银河系 | 201-1000 | **0** | 30-50 | 银河系远镜 |

**需新增 `stars.json` 数据** — 50光年范围真实恒星系参考:

```json
{"Index":10,"Name":"比邻星","IsPlanet":1,"Resource":200,"PopLimit":300,"Distance":4.24},
{"Index":11,"Name":"半人马座α","IsPlanet":1,"Resource":400,"PopLimit":500,"Distance":4.37},
{"Index":12,"Name":"巴纳德星","IsPlanet":1,"Resource":150,"PopLimit":200,"Distance":5.96},
{"Index":13,"Name":"沃尔夫359","IsPlanet":1,"Resource":100,"PopLimit":150,"Distance":7.86},
{"Index":14,"Name":"天狼星","IsPlanet":1,"Resource":500,"PopLimit":400,"Distance":8.6},
{"Index":15,"Name":"南河三","IsPlanet":1,"Resource":350,"PopLimit":300,"Distance":11.4},
{"Index":16,"Name":"天仓五","IsPlanet":1,"Resource":450,"PopLimit":600,"Distance":11.9}
```

1万光年与银河系范围可用种子随机生成（参见 ITER-008）。

#### ITER-008：星球种子随机生成器
- **文件**: 新建 `src/core/StarGenerator.ts`
- **功能**: 基于种子的伪随机生成，确保同一种子产生相同星图
- **参数**: 每个区域的星球数量、资源范围、人口上限范围、名称前缀
- **调用位置**: `StarManager.init()` 中，在加载 JSON 后补充生成

```typescript
export function generateStars(seed: number, startIndex: number, count: number, 
  resourceRange: [number, number], popRange: [number, number], prefix: string): Star[] {
  const rng = createSeededRNG(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const star = createEmptyStar(startIndex + i);
    star.name = `${prefix}-${String.fromCharCode(65 + (i % 26))}${Math.floor(i/26) || ''}`;
    star.totalResource = Math.floor(rng() * (resourceRange[1] - resourceRange[0])) + resourceRange[0];
    star.currentResource = star.totalResource;
    star.populationLimit = Math.floor(rng() * (popRange[1] - popRange[0])) + popRange[0];
    stars.push(star);
  }
  return stars;
}
```

#### ITER-009：星图多层级渲染
- **文件**: `src/ui/StarMapRenderer.ts`
- **现状**: `initStars()` 过滤 `s.index <= 8`，仅渲染太阳系
- **修改**: 根据缩放级别显示不同区域
  - zoomLevel > 0.8: 太阳系详细视图
  - zoomLevel 0.4-0.8: 50光年范围
  - zoomLevel 0.2-0.4: 1万光年范围
  - zoomLevel < 0.2: 银河系全景

---

### 第三阶段：策略平衡优化

#### ITER-010：智子封锁减速修正
- **文件**: `src/core/EarthCivilization.ts` L348-349
- **现状**: `progress = Math.max(1, Math.floor(progress / 10))` — 科研近乎停滞
- **修改**: `progress = Math.max(3, Math.floor(progress / 3))`
- **理由**: ÷10 导致 550W 量子计算机需 900 回合解锁（不可能），÷3 约 90 回合（合理）

#### ITER-011：威慑系统连接 AI 行为
- **文件**: `src/core/AlienCivilization.ts` L64-71
- **现状**: `calculateDeterrence()` 仅看执剑人 leadership，面壁者增加的 `deterrenceValue` 对 AI 无影响
- **修改**:
```typescript
private calculateDeterrence(game: any): number {
  let rate = game.earthCivi.deterrenceValue * 0.5; // 基础威慑值
  const sh = game.earthCivi.swordholder;
  if (sh) {
    const p = game.personManager.getPerson(sh);
    if (p) rate += p.leadership;
  }
  return rate;
}
```

#### ITER-012：数字永生胜利增加前置
- **现状**: 仅需 `数字文明(120) → 数字方舟(400)` = 52 回合，过于简单
- **修改** (`TecTreeManager.ts` buildInformationTree): 将数字方舟路径改为:
  `数字文明 → 数字生命研究 → 意识上传 → 数字方舟`
  （当前数字方舟直接从数字文明分支，需改 parentName 为 `"意识上传"`）

#### ITER-013：初始资源与经济基线
- `EarthCivilization.ts` 构造函数: `this.resource = 100` → `200`
- `EarthCivilization.ts` processFactories: 无工厂基础经济 `+5` → `+15`
- `stars.json` 地球资源: `500` → `1000`

#### ITER-014：广播纪元延长
- `Game.ts` updateEpoch: 广播纪元从 `261-268`(8回合) 改为 `261-300`(40回合)
- 对应调整掩体纪元为 `301-350`，银河纪元为 `351+`

---

### 第四阶段：Vitest 测试框架集成

#### Vitest 的作用说明

**Vitest 是什么**: Vitest 是与 Vite 深度集成的现代 JavaScript/TypeScript 测试框架。它可以直接运行 `.test.ts` 文件，支持 ES Module、TypeScript、JSX，无需额外配置 babel/webpack。

**为什么需要它**:
1. **当前项目零自动化测试** — 150+ 测试用例全部是文档化的手动测试，无法自动执行
2. **防止回归** — 修复 BUG 后需验证不引入新问题，手动测试无法覆盖
3. **Headless 脚本崩溃** — 现有 `gameplay-analyzer.ts` 因环境依赖无法运行，Vitest 提供 jsdom 环境
4. **CI/CD 集成** — 未来可在 GitHub Actions 中自动运行测试
5. **开发效率** — `vitest --watch` 实时运行修改相关的测试，即时反馈

**集成后的工作流**:
```bash
npm run test        # 运行全部测试
npm run test:watch  # 监听模式，修改后自动重跑
npm run test:ui     # 可视化测试报告
```

#### ITER-015：Vitest 框架安装与配置

**步骤 1**: 安装依赖
```bash
cd 03_Web_Rebuild
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**步骤 2**: 修改 `vite.config.ts`
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/LengendOfUni-rebuild/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  }
})
```

**步骤 3**: 创建 `src/test/setup.ts`
```typescript
// Mock browser APIs for headless testing
(globalThis as any).window = globalThis.window || {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  CustomEvent: class { type: string; detail: any; constructor(t: string, o?: any) { this.type = t; this.detail = o?.detail; } },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
};
```

**步骤 4**: 在 `package.json` 添加脚本
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui"
}
```

**步骤 5**: 创建核心测试文件 `src/test/core/Game.test.ts`（示例）
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '../../core/Game'

describe('Game Core', () => {
  let game: Game;
  beforeEach(() => { game = new Game(); });

  it('初始化年份为0', () => { expect(game.year).toBe(0); });
  it('初始纪元为危机', () => { expect(game.epoch).toBe(0); });
  it('地球人口初始65', () => { expect(game.earthCivi.population).toBe(65); });
  it('Flag系统工作正常', () => {
    game.addFlag('test');
    expect(game.hasFlag('test')).toBe(true);
    game.removeFlag('test');
    expect(game.hasFlag('test')).toBe(false);
  });
});
```

---

## 三、文件修改索引

| 迭代编号 | 涉及文件 | 修改类型 |
|----------|---------|----------|
| ITER-001 | `EarthCivilization.ts` | 逻辑修正 |
| ITER-002 | `Game.ts` + `enums.ts` | 枚举重命名 |
| ITER-003 | `Game.ts` | 逻辑补全 |
| ITER-004 | `assetUrl.ts` | 环境兼容 |
| ITER-005 | `EarthCivilization.ts` | 逻辑修正 |
| ITER-006 | `stars.json` + `StarManager.ts` + `EarthCivilization.ts` + `AlienCivilization.ts` + `StarMapRenderer.ts` | 数据+多文件联动 |
| ITER-007 | `stars.json` | 数据扩充 |
| ITER-008 | 新建 `StarGenerator.ts` + `StarManager.ts` | 新增模块 |
| ITER-009 | `StarMapRenderer.ts` | 渲染逻辑 |
| ITER-010 | `EarthCivilization.ts` | 数值调整 |
| ITER-011 | `AlienCivilization.ts` | 逻辑修正 |
| ITER-012 | `TecTreeManager.ts` | 科技树调整 |
| ITER-013 | `EarthCivilization.ts` + `stars.json` | 数值调整 |
| ITER-014 | `Game.ts` | 纪元参数 |
| ITER-015 | `vite.config.ts` + `package.json` + 新建测试文件 | 框架集成 |

---

## 四、验证检查清单

每次修改后必须通过:

- [ ] `npx tsc --noEmit` — TypeScript 编译零错误
- [ ] `npm run build` — Vite 构建成功
- [ ] `npm run dev` — 开发服务器正常启动
- [ ] 浏览器打开后游戏可正常进入、点击下一回合不崩溃
- [ ] 存档/读档功能正常
- [ ] （集成 Vitest 后）`npm run test` — 全部测试通过

---

> **文档生成日期**: 2026-05-18  
> **关联文档**: `CODE_AUDIT_2026_05_18.md` | `TEST_SUPPLEMENT_2026_05_18.md` | `STRATEGY_CURVE_ANALYSIS_2026_05_18.md`
