# LegendOfUni 测试报告与改进建议

> 生成日期：2026-05-19  
> 项目：LegendOfUni Web 重塑版 (03_Web_Rebuild)  
> 测试框架：Vitest 4.1.6 + @testing-library/react 16.3.2 + jsdom 29.1.1

---

## 一、测试执行摘要

| 指标 | 数值 |
|------|------|
| 测试文件数 | **11** |
| 测试用例数 | **242** |
| 通过 | 242 |
| 失败 | 0 |
| TypeScript 编译 | 通过，零错误 |
| 执行时间 | ~12s (tests) |

### 测试执行记录

> 执行日期：2026-05-19  
> 命令：`npx vitest run`  
> TypeScript 编译：`npx tsc --noEmit`（零错误）  
> 退出码：0  
> 测试摘要：11 个文件，242 个用例全部通过  
> 覆盖率摘要：待配置 `@vitest/coverage-v8`  
> 未执行项：UI 组件测试（Tutorial、StoryModal 等）、E2E 完整流程测试  

---

## 二、测试文件结构与覆盖范围

### 2.1 Models.test.ts (38 测试)
覆盖所有数据模型和纯函数单元：

| 模块 | 测试数 | 覆盖内容 |
|------|--------|----------|
| TecTreeNode | 2 | 节点创建/默认值/父子关系 |
| TecTree | 6 | 树创建、根/子节点添加、完成状态检测、多级结构 |
| Department | 2 | 部门创建、效率计算 |
| Barback | 5 | 军营创建、完成状态、回合推进、溢出保护 |
| Building | 6 | 三种建筑类型创建（STOPE/FACTORY/CITY）、完成检测、回合推进 |
| Weapon | 3 | 武器完成检测、建造推进、不溢出 |
| Fleet | 1 | 舰队创建及所有属性 |
| GameEvent | 3 | 事件创建、对话节点、触发条件/选项 |
| Star | 1 | 空白星球默认属性 |
| StarGenerator | 4 | 数量、命名、资源范围、确定性（种子一致性） |
| Civilization | 5 | 默认值、isDieOut、文明等级标签、越界安全 |

### 2.2 TecTreeManager.test.ts (11 测试)
- 5棵科技树初始化验证
- isTecFinished / isTecFinishedAnywhere 外键查找
- 不存在类型/科技的安全返回
- 全部5棵树的 **关键科技存在性校验**（>40 个科技节点名）

### 2.3 Managers.test.ts (21 测试)

| 管理器 | 测试数 | 关键覆盖 |
|--------|--------|----------|
| PersonManager | 9 | 加载、白名单初始可用、getPerson存/不存在、getAllPersons、unlockPerson首次/重复/不存在、属性合法性 |
| StarManager | 8 | 加载、地球Index=3验证、getStar存/不存在、getStarsByArea(4个区域范围校验)、随机生成资源合理性 |
| WeaponManager | 4 | 加载、getPrototype存/不存在、属性验证 |

### 2.4 GameEventManager.test.ts (23 测试)
- 事件/随机事件/过滤事件三列表加载
- checkEvents: 按年触发、不重复、无匹配返回空
- checkRandomEvents: 条件触发
- getFilteredEventsForTurn: 条件匹配、minYear过滤
- markFilteredEventTriggered: 标记 + 冷却年份
- isEpochMatch: ANY/WANDERING/SHELTER/数字/精确匹配 (10 断言)
- parseEventData: 旧格式(talk0_talker)、新格式(dialogQueue)
- 空数据/null 安全
- checkFilterConditions: minYear/maxYear/epoch/reqFlag/reqNotFlag/minEconomy/minPopulation/minCulture/minDeterrence/maxTreachery 全11种条件

### 2.5 CombatEngine.test.ts (11 测试)
- 舰队vs军营：零战力、强攻弱、防守方强→守方胜
- 舰队vs舰队：战力强者胜
- calculateFleetPower: 水滴(20x)、恒星级(15x)、普通武器(10x)
- calculateBarbackPower: 兵员(2x)、武器加成、leader加成

### 2.6 Game.test.ts (67 测试)

| 分组 | 测试数 | 覆盖内容 |
|------|--------|----------|
| 初始化 | 6 | year/epoch/population、各管理器、getYear/getEpoch |
| Flag系统 | 3 | addFlag/hasFlag/removeFlag/不存在ID安全 |
| updateEpoch | 6 | 5个纪元年份范围 + 变更日志 |
| addHistory | 1 | 格式化前缀 |
| isSophonBlocked | 4 | year<10、三体存在、550W/智子工程解除 |
| applyEventEffect | 8 | 6种效果 + 月球危机分支 + 流浪地球分支 |
| applyNewEffects | 13 | 9种资源target + flag/unlock_person/diplomacy/military + 空/null安全 |
| conductDiplomacy | 6 | 不存在/negotiate/trade(不足+成功)/provoke/冷却/unknown |
| updateCiviLevel | 5 | 5个等级阈值 |
| gameOver条件 | 5 | 人口0/逃亡主义100/太阳氦闪/征服胜利/初始不触发 |
| processNextEvent | 3 | 队列空/弹出/currentEvent非空不处理 |
| isProcessing锁 | 3 | 锁阻止/GameOver阻止/currentEvent提示 |
| runARound流程 | 2 | 年份+1/历史增加 |

### 2.7 Civilization.test.ts (25 测试)

| 分组 | 测试数 | 覆盖内容 |
|------|--------|----------|
| EarthCivilization | 11 | 初始属性、11部门、面壁者增删查、runARound、自动分配部长、工人分配、sanitizeResources(死亡/非负) |
| AlienCivilization | 14 | AlienCiviManager加载、isAllCiviConquered(初始/全部/部分)、异星回合、经济增长、5种AI行为、威慑计算、舰队攻击、灭绝不回合、舰队ETA递减 |

---

## 三、测试覆盖分析

### 3.1 已覆盖模块 (19 个核心文件全覆盖)
✅ GameEvent.ts / GameEventManager.ts  
✅ Game.ts / GameInstance  
✅ Civilization.ts / EarthCivilization.ts / AlienCivilization.ts  
✅ TecTree.ts / TecTreeManager.ts  
✅ Person.ts / PersonManager.ts  
✅ Star.ts / StarGenerator.ts / StarManager.ts  
✅ Weapon.ts / WeaponManager.ts  
✅ Fleet.ts / Barback.ts / Building.ts / Department.ts  
✅ CombatEngine.ts  

### 3.2 未覆盖模块
- ❌ **UI 组件层** (StarMap.tsx, StoryModal.tsx, Tutorial.tsx 等) — 需要 @testing-library/react 的渲染测试
- ❌ **Data 解析层** (JSON 数据文件结构校验)
- ❌ **GameInstance 存档系统** (saveGame/loadGame/序列化/反序列化/版本迁移)
- ❌ **App.tsx / main.tsx** 集成测试

### 3.3 测试层级分布

```
模型/工具函数层:   38 tests (18.1%)  ← 纯函数，易测
随机工具层:        14 tests  (6.7%)  ← 确定性 RNG
管理器层:          32 tests (15.2%)  ← 数据加载 + 查询
事件系统:          23 tests (11.0%)
战斗系统:          11 tests  (5.2%)
文明模拟:          25 tests (11.9%)
Game核心逻辑:      67 tests (31.9%)  ← 最复杂的业务层
```

---

## 四、改进建议

### 4.1 优先级 P0（建议立即实施）

**1. UI 组件测试缺失**  
当前的 210 个测试全部集中在逻辑层。以下组件需要渲染测试：
- `StoryModal.tsx` — 事件弹窗交互
- `StarMap.tsx` — 星图点击/缩放
- `Tutorial.tsx` — 教程流程
- `TopHUD.tsx` — 资源/年份显示

```typescript
// 建议增加示例:
import { render, screen, fireEvent } from '@testing-library/react';
import { StoryModal } from '../../components/StoryModal';

describe('StoryModal', () => {
  it('渲染对话队列并支持点击推进', () => {
    render(<StoryModal event={{ id: '1', title: 'Test', dialogQueue: [...] }} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**2. 存档系统测试**  
`GameInstance.saveGame()` / `loadGame()` 是关键的持久化路径。当前无任何测试覆盖：
- 序列化/反序列化循环
- Map/Set/原型链恢复
- 版本迁移兼容性
- 损坏数据回退到新游戏

**3. 边界值测试**  
部分逻辑有溢出风险但未被测试到：
- `economy` 在 `processFactories` 中可能因 `add * 5` 爆炸增长
- `population` 超限时的 clamp 逻辑
- `treachery` 在 `earlyGameFactor=0.5` 下仍有随机增长

### 4.2 优先级 P1（建议近期实施）

**4. 随机性测试需要改进**  
`checkRandomEvents` 和 `CombatEngine` 中大量使用 `Math.random()`，需要：
- 注入确定性 RNG 让测试可重复
- 使用 `vi.spyOn(Math, 'random')` 控制骰子值

**5. 缺少 E2E 完整流程测试**  
当前没有覆盖"从 Year 0 玩到游戏结束"的完整流程：
```typescript
it('完整游戏流程: 危机->威慑->广播->掩体->银河', () => {
  // 模拟 runARound 200+ 回合...
});
```

**6. 事件条件组合测试**  
过滤事件 `checkFilterConditions` 当前只测试单条件，未测试复合条件组合。

### 4.3 优先级 P2（远期优化）

**7. 性能测试**  
`StarManager.init()` 生成 800 个银河系星球耗时较长。建议添加性能基准测试。

**8. 代码覆盖率报告**  
建议集成 `@vitest/coverage-v8` 生成覆盖率报告：
```json
// vite.config.ts test 块中增加:
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
  }
}
```

**9. CI/CD 集成**  
`.github/workflows/deploy.yml` 中未见测试步骤。建议在部署前运行 `npm test`。

---

## 五、测试命令

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 运行单个文件
npx vitest run src/test/core/Game.test.ts

# TypeScript 类型检查
npx tsc --noEmit
```

---

## 六、总结

| 维度 | 评估 | 说明 |
|------|------|------|
| 逻辑层覆盖 | ⭐⭐⭐⭐⭐ | 核心模块全覆盖，242 测试用例 |
| 数据模型 | ⭐⭐⭐⭐⭐ | 所有工厂函数、纯函数、边界条件 |
| 游戏循环 | ⭐⭐⭐⭐ | runARound 全链路、异常恢复、锁机制 |
| 事件系统 | ⭐⭐⭐⭐⭐ | 解析、匹配、过滤、随机触发、节奏控制 |
| 确定性 RNG | ⭐⭐⭐⭐⭐ | SeededRandom 14 个专项测试，端到端可复现 |
| 数据 Schema | ⭐⭐⭐⭐ | events/stars/timeline/persons 结构校验 |
| UI 层 | ⭐ | 零覆盖，急需补充 |
| 存档系统 | ⭐⭐ | 基本读写测试，序列化边界待补 |

**整体评分：4.2 / 5.0** — 核心引擎测试已完善（242 个用例，100% 通过），确定性 RNG 已解决，新增事件节奏引擎、数据校验和存档基础测试。主要缺失在 UI 渲染测试。

---

## 七、测试套件新增内容（优化后）

### 7.1 random.test.ts — 确定性随机数测试（14 测试）

| 测试用例 | 验证内容 |
|----------|---------|
| 相同种子相同序列 | 同一 SeededRandom(42) 产生完全一致的随机序列 |
| 不同种子不同序列 | 不同种子确保产生不同随机序列 |
| 范围 [0,1) | 1000 次采样验证均匀分布 |
| randInt 闭区间 | 2000 次采样验证边界（min/max）可达 |
| chance 概率统计 | 1000 次采样验证 50% 概率接近 500 次命中 |
| chance 边界 0/1 | 0% 永远 false，100% 永远 true |
| pick 空数组 | 返回 undefined |
| reset 恢复 | 重置后序列与初始状态一致 |

### 7.2 确定性端到端测试

验证 `Game.setRngProvider(seed)` 后，相同种子执行相同回合数产生完全一致的历史记录。

---

## 八、新增测试内容（0519 审计优化迭代）

### 8.1 EventCadence.test.ts — 事件节奏测试（15 测试）

| 分组 | 测试数 | 覆盖 |
|------|--------|------|
| normalizeEventMeta | 3 | 默认 ambient meta、继承 triggerCondition、milestone 强制概率 |
| isEventEligible | 7 | maxTriggers 限制、冷却期、strict 模式过滤/crossover 事件、mixed 模式放行、全局间隔 |
| pickWeightedEvent | 3 | 空列表、单候选概率、高权重优先 |
| 事件预算常量 | 2 | maxEventsPerTurn、minGapAfterAnyEvent、ambientGlobalCooldown |

### 8.2 DataSchema.test.ts — 数据 Schema 校验（13 测试）

| 数据源 | 测试数 | 验证项 |
|--------|--------|--------|
| events.json | 3 | title/name/inYear、dialogQueue/talkcount、effects 类型 |
| randomevents.json | 3 | name/title、triggerCondition、dialogQueue |
| timeline.json | 1 | gameYearRange 连续性 |
| stars.json | 3 | 地球 index 与 STAR_INDEX.EARTH 一致、index 唯一、太阳系字段完整 |
| persons.json | 3 | name 唯一、关键人物（罗辑/章北海/程心）存在、属性范围 |

### 8.3 SaveLoad.test.ts — 存档基础测试（4 测试）

| 测试用例 | 覆盖 |
|----------|------|
| 空存档返回 false | localStorage 无数据时 loadGame 返回 false |
| 损坏 JSON 不崩溃 | 无效 JSON 安全回退 |
| saveGame 写入 localStorage | 验证序列化后持久存储 |
| reset 清除存档 | 重置后 localStorage 清除且游戏状态回归初始 |