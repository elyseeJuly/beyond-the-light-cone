# 宇宙群英传 测试用例补充报告

> **状态：SUPERSEDED**  
> **替代文档：`03_Web_Rebuild/TEST_REPORT.md`**  
> **最后验证日期：2026-05-19**  
> **说明：此文档为历史补充，已被 2026-05-19 自动化测试（Vitest，8 文件 210 用例）替代。**

> **日期**: 2026-05-18  
> **基于**: 现有 `TEST_CASE_FULL_COVERAGE.md`（150+ 用例）审计后的增补  
> **补充范围**: 新增功能/发现的未覆盖路径/边界条件/集成测试

---

## 补充说明

现有测试文档 `TEST_CASE_FULL_COVERAGE.md` 覆盖了 12 大功能系统，共 150+ 用例。但均为**文档化的手动测试用例**，项目中：
- ❌ 无自动化测试框架（无 Vitest/Jest 配置）
- ❌ 无单元测试文件（`*.test.ts` / `*.spec.ts`）
- ⚠️ 仅有一个 Headless 分析脚本 `scripts/gameplay-analyzer.ts`，且因环境依赖无法在 Node.js 中运行

### 建议：引入 Vitest 测试框架

```bash
npm install -D vitest
```

在 `vite.config.ts` 中添加:
```typescript
/// <reference types="vitest" />
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

创建 `src/test/setup.ts`:
```typescript
// Mock window.dispatchEvent for headless testing
if (typeof window !== 'undefined') {
  window.dispatchEvent = () => true;
}

// Mock import.meta.env
if (!import.meta.env) {
  (import.meta as any).env = { BASE_URL: '/' };
}
```

---

## 一、新增功能缺少测试覆盖

### 1.1 条件过滤事件系统（新增 13 个事件未测试）

现有文档只覆盖了 7 个条件事件（EVENT-012~018），但 `GameEventManager.seedFilteredEvents()` 实际包含 **20 个**条件事件。以下 13 个缺少测试:

| 用例编号 | 测试场景 | 前置条件 | 预期结果 |
|----------|----------|----------|----------|
| EVENT-NEW-01 | 全球资源危机触发 | year≥25, CRISIS, economy≥30 | 触发 resource_crisis |
| EVENT-NEW-02 | 联合国紧急大会触发 | year≥15, CRISIS, population≥100 | 触发 united_nations_assembly |
| EVENT-NEW-03 | 科学突破时刻触发 | year≥20, CRISIS, culture≥40 | 触发 technological_breakthrough |
| EVENT-NEW-04 | 太空军正式成军触发 | year≥20, CRISIS, economy≥50 | 触发 stf_formation |
| EVENT-NEW-05 | 威慑天平倾斜触发 | year≥70, DETERRENCE, swordholder_appointed flag, deterrence≥40 | 触发 deterrence_strain |
| EVENT-NEW-06 | 光速飞船提案触发 | year≥90, DETERRENCE, 曲率驱动理论完成 | 触发 lightspeed_project |
| EVENT-NEW-07 | 广播纪元开幕触发 | year≥120, BROADCAST, 无 broadcast_dawn_seen flag | 触发 broadcast_era_dawn |
| EVENT-NEW-08 | 掩体计划大辩论触发 | year≥150, BROADCAST, broadcast_dawn_seen flag | 触发 bunker_project_debate |
| EVENT-NEW-09 | 维度打击警报触发 | year≥180, BUNKER, 无 dimensional_alert_seen flag | 触发 dimensional_threat_alert |
| EVENT-NEW-10 | 银河纪元启航触发 | year≥220, GALAXY, 无 galaxy_exodus_seen flag | 触发 galaxy_era_exodus |
| EVENT-NEW-11 | 异星文明外交触发 | year≥200, GALAXY, culture≥60, 无 alien_diplomacy_seen flag | 触发 alien_civilization_diplomacy |
| EVENT-NEW-12 | 文明内讧危机触发 | year≥160, BROADCAST, culture≥40 | 触发 inner_conflict_resolution |
| EVENT-NEW-13 | 大过滤器降临触发 | year≥260, GALAXY, galaxy_exodus_seen flag, deterrence≥70 | 触发 great_filter_confrontation |

### 1.2 事件效果应用系统补充

| 用例编号 | 测试场景 | 前置条件 | 预期结果 |
|----------|----------|----------|----------|
| EFFECT-NEW-01 | diplomacy 效果 | 效果含 `{type:'diplomacy', target:'三体', value:1}` | 三体 friendshipType +1 |
| EFFECT-NEW-02 | diplomacy 达到 VERYFRIEND 触发同盟 | friendshipType 达到 VERYFRIEND | alien.isBund = true，历史日志记录 |
| EFFECT-NEW-03 | flag 效果 | 效果含 `{type:'flag', target:'test_flag'}` | game.flags 包含 test_flag |
| EFFECT-NEW-04 | event_effect 效果 | 效果含 `{type:'event_effect', value: EventEffect.WAR}` | 触发 WAR 事件效果 |
| EFFECT-NEW-05 | resource 效果边界 - 负值钳制 | economy=10, 效果 value=-50 | economy 钳制到 0 |
| EFFECT-NEW-06 | military 效果创建舰队 | 效果 `{type:'resource', target:'military', value:3}` | 创建 3 支舰队 |

### 1.3 故土重归事件

| 用例编号 | 测试场景 | 前置条件 | 预期结果 |
|----------|----------|----------|----------|
| EVENT-NEW-14 | 故土重归触发 | year≥280, GALAXY, galaxy_exodus_seen flag, culture≥80 | 触发 reunion_homeworld |

---

## 二、现有测试用例中发现的逻辑矛盾

| 用例编号 | 问题 | 说明 |
|----------|------|------|
| ECON-009 | 逃亡惩罚公式错误 | 文档写 `max(1, 50)/100 = 0.5`，但代码是 `max(1, 100-50)/100 = 0.5`。当 treachery=99 时，factor=`max(1,1)/100=0.01`，实际近乎停产 |
| COMBAT-009 | 攻击骰子范围 | 文档写 `0.8~1.2`，代码是 `0.8 + random()*0.4`=`0.8~1.2`，正确 |
| COMBAT-010 | 防御骰子范围 | 文档写 `0.75~1.25`，但代码是 `0.85 + random()*0.5`=`0.85~1.35`，文档有误 |
| COMBAT-011 | 攻击方轮次加成 | 文档写 `第5轮乘数=1.5`，但当前代码中**无轮次递增乘数**（已在优化中移除） |
| ECON-004 | 分母应改为动态 | 文档标记为已知 BUG(B-11)，但分母仍硬编码为 90 |
| EVENT-016 | 叛乱触发条件 | 文档写 `treachery≥30`，但代码 `maxTreachery: 30` 意味着 `treachery ≤ 30` 时才触发 |

---

## 三、边界条件/异常路径补充测试

### 3.1 资源极端值测试

| 用例编号 | 测试场景 | 操作 | 预期结果 |
|----------|----------|------|----------|
| EDGE-01 | 所有资源为 0 时执行回合 | 设置 pop/eco/res/cul/army 全为 0 | 不崩溃，触发灭绝判定 |
| EDGE-02 | 资源极大值溢出 | 设置 economy = Number.MAX_SAFE_INTEGER | 计算不溢出 |
| EDGE-03 | 逃亡主义恰好 100 | treachery = 100 | 触发游戏失败 |
| EDGE-04 | 逃亡主义 99→100 | treachery=99, 随机+1 | 正确检测并触发失败 |
| EDGE-05 | 人口恰好 0 | population = 0 | 触发灭绝 |
| EDGE-06 | 星球资源完全枯竭 | star.currentResource = 0 | 采矿返回 0，不产生负值 |

### 3.2 科技树边界测试

| 用例编号 | 测试场景 | 操作 | 预期结果 |
|----------|----------|------|----------|
| EDGE-07 | 同时研究多科技 | 两个科技 inResearch=true | 两个同时推进（当前允许） |
| EDGE-08 | 查询不存在的科技名 | `isTecFinished(PHYSICS, "不存在")` | 返回 false，不报错 |
| EDGE-09 | 所有科技完成 | 全部 node.finished=true | 无新科技可自动开始 |
| EDGE-10 | 黑域生成双重存在 | PHYSICS 和 INTERSTELLAR 都有黑域生成 | 两个独立，完成任一即可触发胜利 |

### 3.3 战斗系统边界测试

| 用例编号 | 测试场景 | 操作 | 预期结果 |
|----------|----------|------|----------|
| EDGE-11 | 无武器舰队战斗 | fleet.weapons=[] | atkPower=0, 攻方必败 |
| EDGE-12 | 舰队对空目标 | 目标星球无守军 | defPower=0, 攻方必胜 |
| EDGE-13 | 双方战力均为 0 | 空舰队 vs 空军营 | 应有安全处理，不死循环 |

### 3.4 存档系统边界测试

| 用例编号 | 测试场景 | 操作 | 预期结果 |
|----------|----------|------|----------|
| EDGE-14 | 空 Map/Set 序列化 | departments 为空 Map | 正确序列化/反序列化 |
| EDGE-15 | 嵌套 Map 序列化 | tecTreeManager.trees 含嵌套 Map | 原型链完整恢复 |
| EDGE-16 | 存档版本不匹配 | 修改存档 version 字段 | 应检测版本不兼容 |

---

## 四、集成测试补充

### 4.1 完整游戏循环测试

| 用例编号 | 测试场景 | 步骤 | 预期结果 |
|----------|----------|------|----------|
| INT-01 | 50 回合生存测试 | 每回合建设+研究 | 人口>0, 经济>0, 科技>5 |
| INT-02 | 纪元完整转换 | 运行 350 回合 | 经历全部 5 个纪元 |
| INT-03 | 外交→同盟→征服胜利 | 反复谈判至 VERYFRIEND | isAllCiviConquered() 返回 true |
| INT-04 | 事件→Flag→后续事件链 | 选择设置 Flag 的选项 | 依赖该 Flag 的后续事件正确触发 |
| INT-05 | 存档→加载→继续 | 50 回合后存档，加载，再运行 50 回合 | 状态一致，无数据丢失 |

### 4.2 Headless 自动化测试修复

当前 `gameplay-analyzer.ts` 因 `import.meta.env` 依赖无法在 Node.js 运行。修复后应验证:

| 用例编号 | 测试场景 | 预期结果 |
|----------|----------|----------|
| AUTO-01 | 脚本正常启动 | 无 TypeError |
| AUTO-02 | 50 回合人口非负 | population ≥ 0 |
| AUTO-03 | 50 回合经济非负 | economy ≥ 0 |
| AUTO-04 | 科技有进展 | techsCompleted > 0 |
| AUTO-05 | 事件正常触发处理 | 无死锁 |

---

## 五、推荐的 Vitest 测试文件结构

```
src/
  test/
    setup.ts                    # 全局 mock 配置
    core/
      Game.test.ts              # 游戏核心循环
      EarthCivilization.test.ts # 经济/科技/人口
      AlienCivilization.test.ts # AI 行为
      CombatEngine.test.ts      # 战斗计算
      TecTreeManager.test.ts    # 科技树
      GameEventManager.test.ts  # 事件系统
      Diplomacy.test.ts         # 外交系统
    integration/
      GameLoop.test.ts          # 完整循环集成
      SaveLoad.test.ts          # 存档往返
      VictoryConditions.test.ts # 胜利条件
```

---

> 文档生成日期: 2026-05-18  
> 补充测试用例总计: 50+ 条
