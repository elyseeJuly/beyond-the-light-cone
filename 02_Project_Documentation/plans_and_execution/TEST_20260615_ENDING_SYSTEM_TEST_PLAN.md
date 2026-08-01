# 结局系统单元测试方案

> 版本：v1.0  
> 日期：2026-06-15  
> 覆盖范围：Game.ts checkVictoryConditions + 所有 game-over 路径  
> 依赖条件规范：`SPEC_20260615_ENDING_CONDITIONS_REDESIGN.md`

---

## 一、测试架构设计

### 1.1 测试策略

| 层级 | 覆盖目标 | 测试工具 | 数量 |
|------|---------|---------|------|
| **Unit** | 单一结局触发条件 | Vitest + 模拟 Game 实例 | 9 基础 + 9 边缘 |
| **Integration** | 多结局条件重叠时的优先级 | Vitest + Game.runARound 模拟 | 6 场景 |
| **Regression** | 绕过路径不再可用 | Vitest + 旧条件断言 | 3 场景 |
| **E2E** | 实际游戏循环中结局触发 | Headless autoplay | 6 自动化脚本 |

### 1.2 测试文件结构

```
src/test/
├── core/
│   ├── Game.test.ts                 ← 已有，扩充结局测试
│   ├── Game.victoryConditions.test.ts  ← 新增：胜利结局专项
│   ├── Game.defeatConditions.test.ts   ← 新增：失败结局专项
│   └── Game.bypassPrevention.test.ts   ← 新增：绕过检测专项
├── components/
│   └── EndGameScreen.test.ts        ← 已有，补充结局Key映射
└── config/
    └── endingConfig.test.ts         ← 新增：结局配置完整性
```

---

## 二、胜利结局测试用例

### 2.1 WANDERING — 流浪胜利

| 用例编号 | 场景 | 输入条件 | 预期结果 |
|---------|------|---------|---------|
| V-W-01 | **正常触发** | year=300, pop>0, 科技完成, `wandering_completed=true` | `victoryType=WANDERING`, `isGameOver=true` |
| V-W-02 | **年份不足** | year=200, 其余满足 | 不触发 |
| V-W-03 | **科技缺少** | 仅行星发动机Ⅲ型完成，新家园选址未完成 | 不触发 |
| V-W-04 | **flag 缺少** | 科技完成，`wandering_completed=false` | 不触发 |
| V-W-05 | **人口灭绝** | 人口=0，其余满足 | 不触发（灭绝优先） |

```typescript
describe('WANDERING 流浪胜利', () => {
  it('应正常触发流浪胜利', () => {
    const game = createTestGame();
    setupTech(game, TecTreeType.AEROSPACE, "行星发动机Ⅲ型");
    setupTech(game, TecTreeType.INTERSTELLAR, "新家园选址");
    game.addFlag("wandering_completed");
    game.earthCivi.population = 100;
    game.year = 300;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.victoryType).toBe(VictoryType.WANDERING);
  });

  it('年份不足250不应触发', () => {
    const game = createTestGame();
    setupTech(game, TecTreeType.AEROSPACE, "行星发动机Ⅲ型");
    setupTech(game, TecTreeType.INTERSTELLAR, "新家园选址");
    game.addFlag("wandering_completed");
    game.earthCivi.population = 100;
    game.year = 200;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });

  it('缺少wandering_completed flag不应触发', () => {
    const game = createTestGame();
    setupTech(game, TecTreeType.AEROSPACE, "行星发动机Ⅲ型");
    setupTech(game, TecTreeType.INTERSTELLAR, "新家园选址");
    game.earthCivi.population = 100;
    game.year = 300;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });
});
```

### 2.2 DIGITAL — 数字永生

| 用例编号 | 场景 | 输入条件 | 预期结果 |
|---------|------|---------|---------|
| V-D-01 | **正常触发** | year=250, pop>50, 科技完成, `digital_ark_upgrade=true` | `victoryType=DIGITAL` |
| V-D-02 | **人口不足** | year=250, pop=30, 其余满足 | 不触发 |
| V-D-03 | **升级未完成** | 科技完成，`digital_ark_upgrade=false` | 不触发 |
| V-D-04 | **早期触发** | year=150, 其余满足 | 不触发 |

### 2.3 DETERRENCE — 威慑胜利

| 用例编号 | 场景 | 输入条件 | 预期结果 |
|---------|------|---------|---------|
| V-E-01 | **正常触发** | 纪元>=DETERRENCE, 执剑人存在, pop>0, 威慑>=90, 回合>=20, 无战争 | `victoryType=DETERRENCE` |
| V-E-02 | **回合不足** | 纪元>=DETERRENCE, 威慑>=90, 回合=15 | 不触发 |
| V-E-03 | **威慑度不足** | 纪元>=DETERRENCE, 威慑=70, 回合>=20 | 不触发 |
| V-E-04 | **有文明处于战争** | 威慑=90, 回合>=20, 某异星文明外交=EXTINCTION_WAR | 不触发 |
| V-E-05 | **回合计数器重置** | 威慑度从90降至70再回升至90 | 计数器归零后重新累积 |

```typescript
describe('DETERRENCE 威慑胜利', () => {
  it('应正常触发威慑胜利', () => {
    const game = createTestGame();
    game.epoch = EpochType.DETERRENCE;
    game.earthCivi.swordholder = mockSwordholder();
    game.earthCivi.population = 100;
    game.earthCivi.deterrenceValue = 95;
    game.deterrenceEnduranceRounds = 25;
    game.alienCiviManager.hasAnyAtWar = () => false;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.victoryType).toBe(VictoryType.DETERRENCE);
  });

  it('威慑维持回合不足20不应触发', () => {
    const game = createTestGame();
    game.epoch = EpochType.DETERRENCE;
    game.earthCivi.swordholder = mockSwordholder();
    game.earthCivi.population = 100;
    game.earthCivi.deterrenceValue = 95;
    game.deterrenceEnduranceRounds = 15;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });

  it('威慑度下降后计数器应重置', () => {
    const game = createTestGame();
    // 先累积到15回合
    game.deterrenceEnduranceRounds = 15;
    // 威慑度降至80以下
    game.earthCivi.deterrenceValue = 70;
    // runARound 应重置计数器
    game.updateDeterrenceCounter();  // 新增方法
    expect(game.deterrenceEnduranceRounds).toBe(0);
  });
});
```

### 2.4 DARK_DOMAIN — 黑域胜利

| 用例编号 | 场景 | 输入条件 | 预期结果 |
|---------|------|---------|---------|
| V-K-01 | **正常触发** | year>=250, pop>0, 科技完成, `dark_domain_decision=true`, 逃亡<80 | `victoryType=DARK_DOMAIN` |
| V-K-02 | **决策未执行** | 科技完成，`dark_domain_decision=false` | 不触发 |
| V-K-03 | **逃亡度过高** | 科技完成，逃亡=85 | 不触发 |
| V-K-04 | **年份不足** | year=200, 其余满足 | 不触发 |

### 2.5 CONQUEST — 征服胜利

| 用例编号 | 场景 | 输入条件 | 预期结果 |
|---------|------|---------|---------|
| V-C-01 | **正常触发** | year>=200, pop>10, 逃亡<50, 全部征服, `conquest_declared=true` | `victoryType=CONQUEST` |
| V-C-02 | **未宣布征服** | 全部征服，`conquest_declared=false` | 不触发 |
| V-C-03 | **逃亡度过高** | 全部征服，逃亡=60 | 不触发 |
| V-C-04 | **部分未征服** | 仍有异星文明存活 | `isAllCiviConquered()` 返回 false |

### 2.6 HIDDEN — 死神永生

| 用例编号 | 场景 | 输入条件 | 预期结果 |
|---------|------|---------|---------|
| V-H-01 | **正常触发** | 年>=350, 纪元=GALAXY, 文化>=1000, pop>0, 威慑>=50, 6个flag全true, 黑域+数字方舟科技 | `victoryType=HIDDEN` |
| V-H-02 | **缺少归零者接触** | 所有条件满足但 `zero_homer_contacted=false` | 不触发 |
| V-H-03 | **小宇宙未建造** | 所有条件满足但 `mini_universe_built=false` | 不触发 |
| V-H-04 | **黑域科技缺失** | 所有条件满足，仅完成数字方舟 | 触发 DIGITAL 而非 HIDDEN |
| V-H-05 | **文化不足** | 文化=900，其余满足 | 不触发 |

```typescript
describe('HIDDEN 死神永生·小宇宙', () => {
  it('应正常触发隐藏结局', () => {
    const game = createTestGame();
    game.year = 400;
    game.epoch = EpochType.GALAXY;
    game.earthCivi.culture = 1200;
    game.earthCivi.population = 100;
    game.earthCivi.deterrenceValue = 80;
    ['galaxy_exodus_seen', 'alien_alliance', 'zero_homer_contacted', 'mini_universe_built'].forEach(f => game.addFlag(f));
    setupTech(game, TecTreeType.ASTROPHYSICS, "黑域生成");
    setupTech(game, TecTreeType.INFORMATION, "数字方舟");
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.victoryType).toBe(VictoryType.HIDDEN);
  });

  it('缺少归零者接触不应触发', () => {
    // ... 除 zero_homer_contacted 外全部满足
  });
});
```

---

## 三、失败结局测试用例

### 3.1 TREACHERY — 逃亡主义

| 用例编号 | 场景 | 预期 |
|---------|------|------|
| D-T-01 | 逃亡度=100 → TREACHERY | 触发 |
| D-T-02 | 逃亡度=150 (溢出) → TREACHERY | 触发 |
| D-T-03 | 逃亡度=99 不触发 | 不触发 |

### 3.2 EXTINCTION — 文明灭绝

| 用例编号 | 场景 | 预期 |
|---------|------|------|
| D-E-01 | 人口=0 → EXTINCTION | 触发，`defeatType=EXTINCTION` |
| D-E-02 | 人口=0 + 同时满足逃亡胜利条件 → EXTINCTION 优先 | EXTINCTION 触发（失败>胜利优先级） |
| D-E-03 | 人口=-5 (溢出) → EXTINCTION | 触发 |

### 3.3 HELIUM_FLASH — 氦闪/二向箔

| 用例编号 | 场景 | 预期 |
|---------|------|------|
| D-H-01 | 年>350 + 无逃逸科技 + 无逃逸flag → HELIUM_FLASH | 触发 |
| D-H-02 | 年>350 + 有黑域科技 → 不触发 | 不触发 |
| D-H-03 | 年>350 + `dimensional_defense_completed=true` → 不触发 | 不触发 |
| D-H-04 | 年>350 + `wandering_chosen=true` 但无科技 → **仍触发**（绕过修复） | 触发 |
| D-H-05 | 年=350 不触发 | 不触发 |
| D-H-06 | strict_mode + 维度打击触发 flag + 无逃逸 → HELIUM_FLASH | 触发 |

```typescript
describe('HELIUM_FLASH 氦闪/二向箔', () => {
  it('年>350且无逃逸能力应触发', () => {
    const game = createTestGame();
    game.year = 400;
    game.earthCivi.tecTreeManager.isTecFinishedAnywhere = () => false;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.HELIUM_FLASH);
  });

  it('仅有wandering_chosen flag不能逃逸氦闪（绕过修复验证）', () => {
    const game = createTestGame();
    game.year = 400;
    game.addFlag("wandering_chosen");  // 旧绕过的 flag
    game.earthCivi.tecTreeManager.isTecFinishedAnywhere = () => false;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);  // 仍然触发！修复成功
    expect(game.defeatType).toBe(DefeatType.HELIUM_FLASH);
  });
});
```

---

## 四、绕过路径预防测试

### 4.1 sanitizeResources 绕过

```typescript
describe('绕过检测: sanitizeResources', () => {
  it('人口归零时应不直接触发game-over', () => {
    const game = createTestGame();
    game.earthCivi.population = 10;
    // 模拟削减人口到0
    game.earthCivi.population = 0;
    // sanitizeResources 不应 dispatch game-over
    game.earthCivi.sanitizeResources();
    expect(game.isGameOver).toBe(false);
    // 应由后续的 checkVictoryConditions 检测
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.EXTINCTION);
  });
});
```

### 4.2 processDimensionStrike 绕过

```typescript
describe('绕过检测: processDimensionStrike', () => {
  it('维度打击不应直接触发game-over', () => {
    const game = createTestGame();
    const alien = mockAlien();
    // 触发维度打击
    alien.processDimensionStrike(game);
    // 不应直接设置 game-over
    expect(game.isGameOver).toBe(false);
    // 应设置 flag
    expect(game.dimensionStrikeTriggered).toBe(true);
    // 由 checkVictoryConditions 统一处理
    game.year = 360;  // 超过350年
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.HELIUM_FLASH);
  });
});
```

### 4.3 WallfacerPanel 广播绕过

```typescript
describe('绕过检测: WallfacerPanel 广播', () => {
  it('坐标广播应设flag而非直接game-over', () => {
    const game = createTestGame();
    game.handleBroadcast(true);  // 存活分支
    expect(game.isGameOver).toBe(false);
    expect(game.broadcastTriggered).toBe(true);
    expect(game.broadcastSurvives).toBe(true);
    // 后续由 checkVictoryConditions 检测
  });
});
```

---

## 五、结局优先级集成测试

### 5.1 多条件重叠场景

| 用例编号 | 同时满足条件 | 预期优先级 | 预期结局 |
|---------|------------|-----------|---------|
| P-01 | HIDDEN + DARK_DOMAIN + DIGITAL | 失败 > 胜利 | HIDDEN (胜利中最高) |
| P-02 | EXTINCTION + HIDDEN | 失败优先 | EXTINCTION |
| P-03 | WANDERING + DARK_DOMAIN | 按优先级 | WANDERING* |
| P-04 | 逃亡度=100 + CONQUEST 胜利 | 失败优先 | TREACHERY |
| P-05 | 年>350无科技 + DIGITAL 可触发 | 失败优先 | HELIUM_FLASH |
| P-06 | DETERRENCE + DARK_DOMAIN | 按优先级 | DETERRENCE* |

*\*注：关于胜利结局中重叠时的具体优先级，需在本文档（`SPEC_20260615_ENDING_CONDITIONS_REDESIGN.md`）中明确。按游戏设计意图，建议优先级为：HIDDEN > CONQUEST > DETERRENCE > WANDERING > DARK_DOMAIN > DIGITAL。*

```typescript
describe('结局优先级集成测试', () => {
  it('EXTINCTION应优先于HIDDEN', () => {
    const game = createTestGame();
    // 同时设置灭绝和隐藏结局条件
    game.earthCivi.population = 0;  // 灭绝条件
    game.year = 400;
    game.epoch = EpochType.GALAXY;
    game.earthCivi.culture = 1200;
    // ... 其他 HIDDEN 条件
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.EXTINCTION);  // 失败优先
  });

  it('TREACHERY应优先于CONQUEST', () => {
    const game = createTestGame();
    game.earthCivi.treachery = 100;  // 逃亡条件
    game.earthCivi.population = 100;
    game.alienCiviManager.isAllCiviConquered = () => true;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.TREACHERY);  // 失败优先
  });
});
```

---

## 六、结局记录完整性测试

### 6.1 所有结局路径都必须记录

| 用例编号 | 触发路径 | recordEnding 参数验证 |
|---------|---------|---------------------|
| R-01 | WANDERING 胜利 | victoryType=WANDERING, defeatType=null |
| R-02 | DIGITAL 胜利 | victoryType=DIGITAL, defeatType=null |
| R-03 | DETERRENCE 胜利 | victoryType=DETERRENCE, defeatType=null |
| R-04 | DARK_DOMAIN 胜利 | victoryType=DARK_DOMAIN, defeatType=null |
| R-05 | CONQUEST 胜利 | victoryType=CONQUEST, defeatType=null |
| R-06 | HIDDEN 胜利 | victoryType=HIDDEN, defeatType=null |
| R-07 | TREACHERY 失败 | victoryType=null, defeatType=TREACHERY |
| R-08 | EXTINCTION 失败 | victoryType=null, defeatType=EXTINCTION |
| R-09 | HELIUM_FLASH 失败 | victoryType=null, defeatType=HELIUM_FLASH |
| R-10 | Wallfacer 广播→HIDDEN | victoryType=HIDDEN, defeatType=null |
| R-11 | Wallfacer 广播→EXTINCTION | victoryType=null, defeatType=EXTINCTION |

```typescript
describe('结局记录完整性', () => {
  it('每个胜利结局都应调用recordEnding', () => {
    const spy = vi.spyOn(SaveManager, 'recordEnding');
    // 逐一触发每种胜利并验证
    triggerWanderingVictory();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ victoryType: VictoryType.WANDERING, defeatType: null })
    );
    // ... 其余同理
  });
});
```

---

## 七、测试覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 | 差距 |
|------|-----------|-----------|------|
| Game.checkVictoryConditions | ~20% (3/6 胜利) | 100% (6/6 胜利) | +3 |
| Game.checkVictoryConditions 失败 | 100% (3/3) | 100% | 0 |
| 绕过路径预防 | 0% | 100% (3场景) | +3 |
| 结局记录完整性 | 0% | 100% (11路径) | +11 |
| 结局优先级 | 0% | 100% (6场景) | +6 |
| endingConfig 配置完整 | 0% | 100% | +1 |
| 合计新增测试用例 | — | **~50 个用例** | |

---

## 八、测试辅助工具

建议新增以下测试辅助函数：

```typescript
// test/utils/endingTestHelpers.ts

export function createTestGame(): Game {
  const game = new Game(EpochType.CRISIS, testPlayerConfig());
  game.year = 1;
  game.earthCivi.population = 100;
  game.earthCivi.culture = 500;
  game.earthCivi.deterrenceValue = 50;
  game.earthCivi.treachery = 0;
  game.earthCivi.swordholder = null;
  game.flags = new Set();
  game.alienCiviManager = mockAlienCiviManager();
  return game;
}

export function setupTech(game: Game, type: TecTreeType, name: string): void {
  const tec = game.earthCivi.tecTreeManager.getTec(type, name);
  if (tec) tec.isFinished = true;
}

export function mockSwordholder(): Person {
  return { name: '测试执剑人', deterrence: 90, ... };
}

export function triggerWanderingVictory(): void { /* ... */ }
export function triggerDigitalVictory(): void { /* ... */ }
// ... 等
```

---

> 文档版本：v1.0  
> 基于条件规范 `SPEC_20260615_ENDING_CONDITIONS_REDESIGN.md`  
> 预计新增测试用例数：~50 个  
> 预计实施工作量：中等