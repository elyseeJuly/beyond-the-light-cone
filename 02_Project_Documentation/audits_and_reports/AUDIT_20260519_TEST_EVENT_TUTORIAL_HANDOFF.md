# 宇宙群英传专项审计与交接规范

> 日期：2026-05-19  
> 范围：`03_Web_Rebuild` 测试文档/测试框架、事件系统、三体宇宙设定一致性、新手教程、额外设计风险  
> 原则：本轮只形成文档，不改动游戏逻辑、不执行测试、不启动开发服务器。

## 0. 审计结论

当前项目已经从“只有手动测试文档”推进到 Vitest 自动化测试阶段，静态计数显示现有测试文件确为 8 个、测试用例确为 210 个。但 `03_Web_Rebuild/TEST_REPORT.md` 的正文仍混用 196 与 210 两套统计，部分“已通过、零错误、覆盖率约 85%”缺少可复现运行日志或覆盖率产物支撑。测试框架的下一步不是继续堆单测数量，而是把报告、覆盖率、数据校验、事件频率回归、UI 交互和存档往返纳入同一套可复现流水线。

事件系统确实存在触发过密问题。主循环每回合同时检查固定年份事件、随机事件、条件过滤事件；随机事件未显式声明 `triggerCondition` 时默认概率为 0.4，条件过滤事件满足条件后还有 50% 判定。随机池现有 136 条事件，其中前 3 条旧格式事件没有触发条件，会按 40% 默认概率参与每回合判定。这会让玩家产生“每回合都弹剧情”的疲劳感。

叙事内容目前是“三体主线 + 刘慈欣其他作品/原创衍生”的混合宇宙。面壁计划、智子封锁、黑暗森林威慑、广播、掩体、二向箔、黑域、曲率驱动等内容基本属于三体宇宙；但流浪地球、行星发动机、月球坠落、地下城冰震、发动机教派、太阳氦闪等更像《流浪地球》或原创灾难线，不应在“严格三体宇宙”模式下作为主线内容出现。

新手教程信息量足够，但目前是长文本说明型教程，缺少“边做边学”的任务闭环。更严重的是教程和 UI 的若干描述与代码不一致，例如右侧默认星球使用 `getStar(4)`，而 `StarManager` 明确初始化地球为 index 3；舰队按钮显示“10 艘”，实际只加入 3 个武器条目；派遣舰队文本说目标木星，代码目标 index 5，数据中 index 5 是火星。

## 1. 测试文档与测试结果核验

### 1.1 静态核验结果

未执行 `npm test` 或 `npm run build`。以下结论来自文件审计与静态计数。

现有测试文件和用例数：

| 文件 | 静态用例数 |
|---|---:|
| `src/test/core/Civilization.test.ts` | 25 |
| `src/test/core/CombatEngine.test.ts` | 11 |
| `src/test/core/Game.test.ts` | 67 |
| `src/test/core/GameEventManager.test.ts` | 23 |
| `src/test/core/Managers.test.ts` | 21 |
| `src/test/core/Models.test.ts` | 38 |
| `src/test/core/TecTreeManager.test.ts` | 11 |
| `src/test/utils/random.test.ts` | 14 |
| 合计 | 210 |

与 `03_Web_Rebuild/TEST_REPORT.md:13-18` 的摘要一致：8 个测试文件、210 个用例。但报告正文存在以下问题。

### 1.2 测试报告问题

| 优先级 | 问题 | 证据 | 影响 | 交接修正 |
|---|---|---|---|---|
| P0 | 196/210 统计混用 | `TEST_REPORT.md:118-127` 的比例按 196 计算；`TEST_REPORT.md:136` 又写“当前的 196 个测试” | 报告不可信，后续 AI 可能误判测试基线 | 将 `random.test.ts` 纳入主体统计，所有百分比按 210 重算，历史“196”只保留在变更记录 |
| P0 | “测试通过/TS 零错误”缺少运行证据 | `TEST_REPORT.md:13-18` 只有结论，无命令、时间戳、环境、stdout 摘要 | 无法确认当前脏工作区是否仍通过 | 增加 `测试执行记录` 小节：命令、Node/npm 版本、退出码、摘要日志 |
| P0 | 老测试文档已过期 | `TEST_20260518_SUPPLEMENT_CASES.md:12-16` 仍称无自动化测试框架 | 文档互相冲突 | 标注该文档为“历史补充，已被 2026-05-19 自动化测试替代” |
| P1 | 覆盖率声明无产物 | `AUDIT_REPORT.md:19` 写核心覆盖约 85%，但 `vite.config.ts` 未配置 coverage | 覆盖率不可审计 | 引入 `@vitest/coverage-v8` 后再声明覆盖率 |
| P1 | 随机事件测试存在空断言 | `GameEventManager.test.ts:47-50` 的断言永远为真 | 测不到随机事件是否正确过滤/降频 | 改成确定性 RNG + 具体期望事件/不触发事件 |
| P1 | 条件事件测试只验证数组类型 | `GameEventManager.test.ts:52-57` | 无法验证条件组合、冷却、优先级 | 增加复合条件、冷却窗口、每回合预算测试 |
| P1 | fallback 测试覆盖的是手写替身 | `GameEventManager.test.ts:145-163` 覆盖了测试内重写的 `init` | 无法证明真实 fallback 分支有效 | 使用 mock JSON 或构造注入测试真实 `init()` |
| P1 | UI、存档、数据 schema 仍缺失 | `TEST_REPORT.md:112-116` 已承认 | 主要用户路径未被保护 | 按 1.3 方案补齐 |

### 1.3 测试框架优化规范

后续 AI 应按以下顺序完善测试框架，避免直接大改业务逻辑。

#### P0：建立可复现测试基线

1. 在 `03_Web_Rebuild/package.json` 增加脚本：

```json
{
  "test:coverage": "vitest run --coverage",
  "test:core": "vitest run src/test/core",
  "test:ui": "vitest run src/test/components",
  "typecheck": "tsc --noEmit"
}
```

2. 在 `vite.config.ts` 增加 coverage 配置：

```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json-summary', 'html'],
    thresholds: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70
    }
  }
}
```

3. 每次更新测试报告时，必须写入：

```md
执行日期：
Git 状态摘要：
Node/npm 版本：
命令：
退出码：
测试摘要：
覆盖率摘要：
未执行项与原因：
```

#### P0：补事件频率回归测试

新增 `src/test/core/EventCadence.test.ts`：

| 用例 | 验收标准 |
|---|---|
| 100 回合随机事件不会连续触发超过 2 回合 | 使用固定种子，统计 `eventQueue` 中非固定年份事件 |
| 随机事件全局间隔生效 | 设置 `globalRandomEventCooldown=4` 后，任意两次 ambient 事件间隔 >= 4 |
| 固定年份主线不受降频影响 | year 0/2/10/15/50/200/260/300 的固定事件仍触发 |
| 条件事件只在满足条件后进入候选池 | 逐项设置 year/epoch/flag/tech/resource |
| 缺少 triggerCondition 的旧随机事件不会按 0.4 默认高频触发 | 旧格式事件默认归类为 ambient，概率 <= 0.02 或必须补显式条件 |

#### P1：补数据 schema 测试

新增 `src/test/data/DataSchema.test.ts`，用 Zod 或轻量自定义校验均可：

| 数据 | 必查字段 |
|---|---|
| `events.json` | `name/inYear/title`、`eventtype`、`dialogQueue` 或 `talkcount`、`effects` 类型 |
| `randomevents.json` | 每条事件必须有 `id/title/name`、`triggerCondition`、`probability`、`epoch/tags` |
| `timeline.json` | `gameYearRange` 连续且不重叠 |
| `stars.json` | index 唯一，地球 index 与代码常量一致 |
| `persons.json` | name 唯一，关键人物存在，属性范围 |

#### P1：补 UI 组件测试

新增 `src/test/components/`：

| 组件 | 用例 |
|---|---|
| `Tutorial` | 首次显示、下一步/上一步/跳过、写入 `game-tutorial-seen`、章节跳转、键盘导航 |
| `StoryModal` | 打字机完成、跳过打字、推进对话、选择项调用 action 后关闭、无头像降级 |
| `RightInspector` | 默认选中地球 index 3，建筑按钮扣费并创建进度，舰队按钮数量与文案一致 |
| `TopHUD` | 当前事件存在时下一回合禁用，保存按钮调用 `GameInstance.saveGame()` |

#### P1：补存档往返测试

新增 `src/test/integration/SaveLoad.test.ts`：

1. 运行 20 回合并触发至少一个事件。
2. 设置 flag、部长、面壁者、执剑人、建筑进度、舰队、科技进度。
3. `saveGame()` 后 `reset()` 再 `loadGame()`。
4. 断言 Map/Set、原型方法、事件冷却、科技树、建筑进度、历史记录、游戏状态一致。
5. 测损坏 JSON、旧版本、缺字段回退。

#### P2：CI 建议

CI 最小步骤：

```yaml
- npm ci
- npm run typecheck
- npm test
- npm run test:coverage
- npm run build
```

## 2. 事件系统审计与优化规范

### 2.1 当前触发链路

主循环在 `Game.runARound()` 中每回合执行：

1. 固定年份事件：`eventManager.checkEvents(this.year)`，见 `Game.ts:151-152`。
2. 随机事件：`eventManager.checkRandomEvents()`，见 `Game.ts:154-158`。
3. 条件过滤事件：`getFilteredEventsForTurn()` 后每个候选再过 `rngChance(0.5)`，见 `Game.ts:160-176`。

`checkRandomEvents()` 会打乱全部随机事件池，然后依次按概率尝试，见 `GameEventManager.ts:636-658`。未定义概率时默认 `0.4`，见 `GameEventManager.ts:645`。`randomevents.json:1-34` 的前三条旧格式事件没有 `triggerCondition`，因此实际按 40% 默认概率参与每回合随机触发。

### 2.2 主要问题

| 优先级 | 问题 | 证据 | 影响 |
|---|---|---|---|
| P0 | 每回合必查随机事件和条件事件 | `Game.ts:151-176` | 玩家节奏被剧情打断，回合操作无法形成策略闭环 |
| P0 | 旧格式随机事件默认概率过高 | `GameEventManager.ts:645`、`randomevents.json:1-34` | 早期高频弹出，且容易重复 |
| P0 | 没有全局事件预算 | 当前只要固定、随机、条件都命中，可同一回合入队多个事件 | 事件队列阻塞下一回合，剧情压力不可控 |
| P1 | 随机事件无冷却/最大触发次数 | `checkRandomEvents()` 返回事件但不标记触发 | 同一随机事件可能多次出现 |
| P1 | `sort(() => rng() - 0.5)` 洗牌不稳定 | `GameEventManager.ts:642` | 随机分布不均，且消耗大量 RNG，使复现难读 |
| P1 | 事件强弱不分 | 随机池混合灾难、伦理抉择、环境噪声、关键角色事件 | 小事件和大事件争抢同一触发通道 |
| P1 | 跨宇宙内容无标签 | 流浪地球/地下城/行星发动机与三体正史混在一起 | 难以切换“严格三体”与“刘慈欣混合宇宙” |

### 2.3 推荐事件分层

新增事件层级，不要求一次性重写 UI：

```ts
type EventLane = 'milestone' | 'major' | 'ambient' | 'crisis' | 'character';
type LoreDomain = 'three_body_canon' | 'liu_cixin_crossover' | 'original_expansion';

interface EventCadenceMeta {
  lane: EventLane;
  loreDomain: LoreDomain;
  weight: number;
  probability?: number;
  minGapTurns?: number;
  cooldownYears?: number;
  maxTriggers?: number;
  tags?: string[];
  severity?: 1 | 2 | 3 | 4 | 5;
}
```

事件触发优先级：

1. `milestone`：固定年份主线，永远优先，不受随机预算限制。
2. `crisis`：人口、逃亡主义、威慑、资源崩溃等强系统危机，有明确阈值。
3. `major`：面壁者、执剑人、广播、掩体、黑域等关键叙事。
4. `character`：罗辑、章北海、程心、云天明、维德等角色支线。
5. `ambient`：小规模社会、科研、资源事件，受最严格频率限制。

### 2.4 推荐触发频率

| 类型 | 频率建议 | 规则 |
|---|---|---|
| 固定主线 | 到年必触发 | year 精确匹配，最多同年 1-2 条 |
| major | 平均 12-20 回合 1 次 | 若刚触发 milestone，则延后至少 3 回合 |
| crisis | 条件满足后 30%-60%，但有冷却 | 同类 crisis 冷却 8-12 回合 |
| character | 平均 10-15 回合 1 次 | 同角色冷却 25 回合 |
| ambient | 平均 5-8 回合 1 次 | 全局 ambient 冷却 4 回合，单事件 `maxTriggers=1` 或长冷却 |

全局预算建议：

```ts
interface EventBudget {
  maxEventsPerTurn: 1;
  minGapAfterAnyEvent: 2;
  minGapAfterMajorEvent: 5;
  ambientGlobalCooldown: 4;
  majorGlobalCooldown: 12;
}
```

### 2.5 事件系统改造步骤

交接给其他 AI 的执行顺序：

1. 增加 `src/core/EventCadence.ts`，只放纯函数：
   - `normalizeEventMeta(rawEvent)`
   - `isEventEligible(event, game, state)`
   - `scoreEvent(event, game, state)`
   - `pickWeightedEvent(candidates, rng)`
2. 给 `GameEventManager` 增加状态：
   - `lastAnyEventYear`
   - `lastLaneTriggeredYear: Map<EventLane, number>`
   - `randomEventTriggerCounts: Map<string, number>`
   - `lastTagTriggeredYear: Map<string, number>`
3. 改 `checkRandomEvents()`：
   - 不再默认 `probability=0.4`。
   - 无 `triggerCondition` 的旧事件自动补 `{ epoch: 'ANY', probability: 0.02, lane: 'ambient', maxTriggers: 1 }`。
   - 使用 Fisher-Yates 或权重抽取，替换 `sort(() => rng() - 0.5)`。
   - 返回前写入 trigger count 和 lane cooldown。
4. 改 `runARound()` 的事件预算：
   - 同一回合若有固定主线，跳过 ambient。
   - `triggeredEvents` 入队前截断到 `maxEventsPerTurn`，其余候选延后。
5. 在 `randomevents.json` 批量补字段：
   - `id` 必填。
   - `triggerCondition.probability` 必填。
   - `lane/loreDomain/tags/severity/maxTriggers` 必填。
6. 新增 `EventCadence.test.ts` 验收：
   - 100 回合事件数区间。
   - 无连续刷屏。
   - 主线不漏。
   - 严格三体模式不会抽到 crossover 事件。

## 3. 三体宇宙设定一致性审计

### 3.1 参考资料

本节用于高层设定核对，不逐字引用原文：

- [Death's End - Wikipedia](https://en.wikipedia.org/wiki/Death%27s_End)
- [The Dark Forest - Wikipedia](https://en.wikipedia.org/wiki/The_Dark_Forest)
- [Remembrance of Earth's Past - Wikipedia](https://en.wikipedia.org/wiki/Remembrance_of_Earth%27s_Past)
- [The Wandering Earth - Wikipedia](https://en.wikipedia.org/wiki/The_Wandering_Earth)

### 3.2 基本符合三体宇宙的内容

可保留为主线或核心系统：

| 内容 | 当前位置 | 建议 |
|---|---|---|
| 智子封锁 | `Game.ts:101-112`、`GameEventManager.ts:209-221` | 保留，但解除方式需更谨慎 |
| 面壁计划 | `GameEventManager.ts:180-193`、`Tutorial.tsx:88-93` | 保留 |
| 黑暗森林威慑/执剑人 | `GameEventManager.ts:195-207`、`Game.ts:285-291` | 保留，但胜利条件需加强 |
| 广播纪元、三体坐标广播 | `GameEventManager.ts:374-384` | 保留 |
| 掩体计划、二向箔、降维打击 | `GameEventManager.ts:389-414` | 保留 |
| 曲率驱动、光速飞船、黑域 | `TecTreeManager.ts`、`Game.ts:303-308` | 保留 |
| 歌者/清理者逻辑 | `aliens.json`、`AlienCivilization.ts` | 可保留，但不宜作为普通外交对象 |

### 3.3 不符合“严格三体宇宙”的内容

如果项目定位是严格三体宇宙，以下内容应移出主线，或标记为 `loreDomain: 'liu_cixin_crossover'` 并默认关闭。

| 内容 | 当前位置 | 问题 | 建议 |
|---|---|---|---|
| 流浪地球胜利 | `Game.ts:267-274`、`Tutorial.tsx:109-111` | 《流浪地球》是刘慈欣另一作品，不是三体正史 | 改为“曲率逃亡/星舰文明胜利”；或保留为混合宇宙模式 |
| 行星发动机、地下城、太阳氦闪 | `TecTreeManager.ts`、`Game.ts:341-344` | 更偏《流浪地球》设定 | 从严格三体主线移到 crossover 科技支线 |
| 月球危机 | `events.json:57-65`、`Game.ts:375-382` | 三体正史无“月球解体坠落”主线 | 改为“末日战役/水滴危机/威慑设施危机” |
| 发动机教派、地下城氧气/冰震 | `randomevents.json` 多处 | 明显偏流浪地球社会图景 | 改为掩体城市、太空城、澳大利亚大移民等三体语境 |
| 归零者作为可征服/结盟文明 | `aliens.json`、`AlienCiviManager.isAllCiviConquered()` | 归零者不应是普通 AI 文明 | 改为终局背景机制，不计入征服胜利 |
| 歌者作为可外交文明 | `aliens.json`、外交系统 | 歌者文明不适合作为常规邻国 | 作为“清理者事件源/宇宙风险”更合理 |
| “550W 量子计算机解除智子封锁” | `Game.ts:106-107`、`Tutorial.tsx:85` | 更像玩法抽象，不是正史关键事件 | 保留为游戏机制，但文案改成“降低封锁惩罚/建立盲区”，不要写成彻底解除 |
| 人类制造智子 | `Game.ts:106-107` 中 `智子工程` | 正史语义上风险较高 | 改成“智子反制工程/强干扰协议” |

### 3.4 Lore 模式建议

增加全局设定：

```ts
type LoreMode = 'strict_three_body' | 'liu_cixin_mixed' | 'sandbox';
```

默认使用 `strict_three_body`：

| 模式 | 事件/科技/胜利内容 |
|---|---|
| `strict_three_body` | 仅三体正史与合理补白；禁用流浪地球、月球坠落、行星发动机、地下城灾难 |
| `liu_cixin_mixed` | 允许流浪地球、行星发动机、太阳氦闪等刘慈欣其他作品内容 |
| `sandbox` | 允许原创扩展、多文明外交、归零者常规化等玩法内容 |

事件抽取必须检查：

```ts
if (game.loreMode === 'strict_three_body' && event.loreDomain !== 'three_body_canon') {
  return false;
}
```

### 3.5 三体主线替换建议

若移除流浪地球主线，可替换为：

| 原内容 | 替换内容 |
|---|---|
| 月球坠落危机 | 水滴接近预警 / 引力波天线危机 |
| 流浪地球大辩论 | 星舰文明争议 / 掩体计划争议 / 光速飞船禁令 |
| 行星发动机胜利 | 星舰文明胜利：蓝色空间/万有引力式深空延续 |
| 地下城灾难 | 太空城社会危机 / 澳大利亚大移民危机 / 掩体城市配给危机 |
| 太阳氦闪失败 | 二向箔降维失败 / 黑暗森林打击失败 |

## 4. 新手教程审计与改进规范

### 4.1 当前教程优点

`Tutorial.tsx:18-137` 已经覆盖世界观、纪元、资源面板、星图、右侧信息、经济、科技、面壁/威慑、外交、胜利、10 步指南和失败原因。首次进入游戏时通过 `game-tutorial-seen` 控制展示，见 `App.tsx:24` 与 `Tutorial.tsx:194-208`。

### 4.2 当前教程问题

| 优先级 | 问题 | 证据 | 建议 |
|---|---|---|---|
| P0 | 教程指向的默认星球可能不是地球 | `RightInspector.tsx:29` 默认 `getStar(4)`，而 `StarManager.ts:34-40` 明确地球 index 3 | 先修 UI 默认选中，再写教程 |
| P0 | 教程是长文本，不验证玩家操作 | `Tutorial.tsx:18-137` 全是说明卡片 | 改为“任务式引导”：完成动作后自动进入下一步 |
| P0 | 胜利条件描述与代码不一致 | `Tutorial.tsx:107-111` 写光速胜利；`Game.ts:250-310` 没有单独光速胜利 | 教程必须从 `endingConfig` 或胜利配置生成 |
| P1 | 威慑胜利描述比代码严格 | `Tutorial.tsx:109` 写高威慑值；`Game.ts:285-291` 只要求进入威慑纪元、有执剑人、人口 > 0 | 修代码或修文案，优先修胜利条件 |
| P1 | “第 5 回合采矿场完工”依赖建筑系统 | `RightInspector.tsx:48` 采矿场 100/20，确实 5 回合，但默认若选中月球则无法建 | 修默认星球与任务定位 |
| P1 | 舰队教程与 UI 不一致 | `RightInspector.tsx:270` 写 10 艘，`RightInspector.tsx:87-89` 实际 3 个武器 | 统一舰队数量和建造进度 |
| P1 | 派遣舰队文案/目标不一致 | `RightInspector.tsx:99-104` 目标 index 5，文案写木星；`stars.json` index 5 是火星 | 用常量 `STAR_INDEX.MARS/JUPITER` |
| P2 | 章节过长 | 当前 15 步 | 首次教程压缩到 6-8 步，细节放到“档案/帮助” |

### 4.3 推荐新手教程结构

首次教程只保留 8 个可操作步骤：

1. 选择地球：高亮右侧地球详情，确认当前星球是地球。
2. 建造采矿场：点击采矿场按钮，验证经济扣除、建筑进度出现。
3. 推进一回合：点击下一回合，验证年份 +1、建筑进度增长。
4. 查看资源：解释人口/经济/资源/逃亡主义/威慑。
5. 任命部长：进入左侧部门，完成 1 个部长任命。
6. 查看科技：打开科技树，解释智子封锁下的研发速度。
7. 任命面壁者或执剑人：只在人物解锁后引导，否则提示“稍后将在事件中解锁”。
8. 处理事件：首次剧情弹窗出现时引导推进对话和选择。

每步数据结构建议：

```ts
interface TutorialTask {
  id: string;
  title: string;
  target: string;
  text: string;
  completeWhen: (game: Game, ui: TutorialUiState) => boolean;
  highlight?: 'top' | 'left' | 'center' | 'right' | string;
  fallbackAction?: string;
}
```

### 4.4 教程验收标准

| 用例 | 标准 |
|---|---|
| 新玩家首次进入 | 教程显示，默认右侧是地球，不是月球 |
| 点击跳过 | 写入 `game-tutorial-seen`，不再自动显示 |
| 重开教程 | `open-tutorial` 事件可再次打开 |
| 完成采矿场步骤 | 必须真的创建 `buildingProgress.stope` 后才进入下一步 |
| 移动端/小屏 | 文本不溢出，章节按钮可横向滚动或折叠 |
| 事件弹窗中 | 教程不会遮挡 StoryModal 的关键选择 |

## 5. 其他不合理点与优化方案

### 5.1 地球 index 混用

问题：

- `StarManager.ts:34-40` 初始化地球为 index 3。
- `EarthCivilization` 构造函数也 `starIndices.add(3)`。
- `RightInspector.tsx:29` 默认却取 `getStar(4)`，数据中 index 4 是月球。
- `gameplay-analyzer.ts` 也用 `getStar(4)` 检查地球。

规范：

1. 新增 `src/config/starIndices.ts`：

```ts
export const STAR_INDEX = {
  SUN: 0,
  MERCURY: 1,
  VENUS: 2,
  EARTH: 3,
  MOON: 4,
  MARS: 5,
  JUPITER: 6
} as const;
```

2. 全项目禁止硬编码 3/4/5/6 表示关键太阳系天体。
3. 添加测试：默认 inspector 星球、地球文明所属星球、舰队目标都使用同一常量。

### 5.2 胜利/失败条件过早或不可达

| 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|
| 威慑胜利太容易 | `Game.ts:285-291` | 只要到威慑纪元并设执剑人即可胜利 | 增加 `deterrenceValue >= 80`、三体未友好但被压制、持续 N 回合 |
| 太阳氦闪失败基本不可达 | `Game.ts:341-344` 要求 `year > 400 && epoch < GALAXY`，而 `updateEpoch()` year >= 351 即 GALAXY | 失败条件形同虚设 | 若保留三体严格模式，改为“二向箔打击倒计时”；若混合宇宙，检查是否完成流浪/逃逸能力 |
| 数字方舟可能过快 | `Game.ts:277-282` 只检查科技完成 | 快速科技胜利压过其他路线 | 增加伦理/资源/社会稳定条件 |
| 黑域胜利只认 PHYSICS 树 | `Game.ts:303-308` | INTERSTELLAR 中同名黑域生成不触发 | 改为 `isTecFinishedAnywhere("黑域生成")` 或区分两种黑域 |

### 5.3 战斗与舰队系统断裂

问题：

- `RightInspector.tsx:83-92` 建造舰队立即加入舰队，但武器 `currentBuild=0`。
- UI 显示武器进度，但核心循环没有看到武器建造推进接入。
- `CombatEngine.resolveFleetVsBarback()` 中双方 0 战力时会返回进攻方胜利，因为 `defHp <= 0` 先判定，见 `CombatEngine.ts:40-43`。
- 异星攻击舰队默认水滴 + 强互作用探测器，早期防御压力可能极端。

规范：

1. 舰队建造与武器建造分离：未完成武器不可出征。
2. 0 vs 0 战斗判定为无效战斗或防守方守住。
3. 异星攻击按纪元升级，不应第一阶段就大量水滴压境。
4. 增加 `FleetBuildSystem.test.ts`。

### 5.4 存档系统风险

问题：

- `GameInstance.saveGame()` 将整个实例 stringify，见 `Game.ts:514-518`。
- `loadGame()` 用 `Object.assign` + 手动 `setPrototypeOf` 恢复，见 `Game.ts:538-574`。
- `eventManager.init()` 会重建事件列表，固定事件 `hasTriggered` 状态依赖恢复顺序，存在重复触发风险。

规范：

1. 每个核心类实现 `toJSON()` / `fromJSON()` 或集中 `GameSerializer`。
2. 存档 version 必须有 migration 表。
3. 加事件状态快照：

```ts
interface SavedEventState {
  triggeredFixedEventIds: string[];
  triggeredRandomEventIds: [string, number][];
  triggeredFilteredIds: string[];
  lastLaneTriggeredYear: [string, number][];
}
```

### 5.5 UI 双轨风险

`src/components` 是 React 体系，`src/ui` 仍有 legacy TS 面板，`App.tsx` 还在科技树视图中直接 new `TecTreeView`。短期可以保留，但所有新功能应走 React 组件；legacy 只读维护，不再扩展。

### 5.6 文档治理

建议建立文档状态头：

```md
> 状态：ACTIVE | SUPERSEDED | HISTORICAL
> 替代文档：
> 最后验证命令：
> 最后验证日期：
```

当前建议：

| 文档 | 状态建议 |
|---|---|
| `03_Web_Rebuild/TEST_REPORT.md` | ACTIVE，但需按本审计修正 |
| `02_Project_Documentation/TEST_20260518_SUPPLEMENT_CASES.md` | SUPERSEDED |
| `02_Project_Documentation/TEST_20260517_CASE_FULL_COVERAGE.md` | HISTORICAL/手动用例库 |
| `02_Project_Documentation/TEST_20260517_HEADLESS_AUTOPLAY_STANDARD.md` | ACTIVE，但需同步当前 API 与事件频率策略 |

## 6. 推荐执行路线图

### 阶段 A：不改玩法，只补测试和文档

1. 修正 `TEST_REPORT.md` 统计不一致。
2. 增加 coverage 配置和脚本。
3. 增加 DataSchema、EventCadence、SaveLoad、Tutorial、RightInspector 测试。
4. 标记过期测试文档状态。

验收：

- `npm run typecheck` 通过。
- `npm test` 通过。
- 覆盖率报告生成。
- 测试报告包含命令日志。

### 阶段 B：事件降频与事件元数据

1. 增加事件 cadence 状态。
2. 给随机事件补 `lane/loreDomain/probability/cooldown/maxTriggers`。
3. 改随机抽取和全局预算。
4. 新增 100/300 回合频率回归。

验收：

- 100 回合 ambient 事件数量落在 8-20 之间。
- 任意 10 回合内 major 事件不超过 1。
- 固定主线事件不漏。
- 没有连续 3 回合弹事件。

### 阶段 C：三体严格模式

1. 增加 `LoreMode`。
2. 把流浪地球/月球危机/行星发动机/地下城灾难标记为 crossover。
3. 默认严格三体模式禁用 crossover。
4. 替换主线中的非三体事件。

验收：

- strict 模式 300 回合不触发流浪地球、月球坠落、地下城、行星发动机教派事件。
- mixed 模式可触发这些事件。
- 教程和胜利条件根据 lore mode 调整文案。

### 阶段 D：教程重做

1. 修地球 index 常量化。
2. 将教程拆为任务式步骤。
3. 教程文本从真实配置生成胜利条件/资源说明。
4. 增加 UI 测试。

验收：

- 新手 3 分钟内能完成采矿场、推进回合、查看科技、处理事件。
- 教程不再出现与代码不一致的胜利/舰队/星球描述。

## 7. 交接注意事项

1. 不要先大改叙事文本。先加 `loreDomain` 与测试，保证可以回滚和筛选。
2. 不要把所有随机事件简单调低概率。必须有全局预算、lane 冷却、单事件 maxTriggers，否则仍可能集中爆发。
3. 不要只修教程文案。教程发现的地球 index、舰队数量、目标星球是实际代码问题。
4. 不要继续写“100% 通过”而不附运行证据。之后每份测试报告都必须可复现。
5. 若项目希望保留“刘慈欣混合宇宙”，请明确改品牌/模式说明，避免声称所有内容都符合三体正史。
