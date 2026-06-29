# FIX_20260629_外星文明接触事件弹窗修复报告

**修复日期**: 2026-06-29  
**修复范围**: 外星文明发现/接触机制、`updateDiplomacyUnlocks` 事件弹窗、`discovered`/`contacted` 状态分层  
**测试状态**: 870/870 单元测试通过 ✓

---

## 一、问题背景

玩家反馈：外星文明事件没有弹窗，但底层代码和部分功能模块里已经显示某个外星文明。

通过代码审计发现，原实现存在三个问题：

1. **发现即接触**：`updateDiplomacyUnlocks()` 中只要满足科技/时间条件，就把 `discovered` 和 `contacted` 同时设为 `true`，没有区分“观测到信号”和“建立通信”。
2. **没有弹窗/事件队列**：文明解锁时只调用了 `this.addHistory(msg)`，消息只写入历史记录，没有进入 `eventQueue` 弹窗系统，也没有推入 `tickerMessages` 顶部滚动消息。
3. **UI 直接读取 `discovered`**：星图/外交列表只要 `discovered=true` 就显示文明，导致玩家突然看到文明出现但没有任何事件提示。

---

## 二、修复方案

### 2.1 状态分层：`discovered` vs `contacted`

**文件**: [src/core/AlienCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AlienCivilization.ts#L16-L27)

```typescript
/** 该文明是否已被地球观测/发现存在（可出现在星图/外交列表中） */
public discovered: boolean = false;
/** 该文明是否与地球建立了可外交的通信信道（可执行 negotiate/trade/alliance/provoke） */
public contacted: boolean = false;

/** 是否已经触发过“首次发现”弹窗事件 */
public discoveryEventFired: boolean = false;
/** 是否已经触发过“建立通信”弹窗事件 */
public contactEventFired: boolean = false;
```

- `discovered=true`：文明出现在星图/外交列表，但外交操作返回“通信未建立”。
- `contacted=true`：文明可执行外交操作（negotiate/trade/alliance/provoke）。

### 2.2 发现与接触两阶段逻辑

**文件**: [src/core/Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1342-L1500)

每个外星文明现在有两个触发条件：

| 阶段 | 触发条件示例 | 效果 |
|------|-------------|------|
| **发现** | year≥120、研发特定科技、探索特定星球 | `discovered=true`，推送 ticker 消息，生成“首次发现”弹窗事件 |
| **接触** | year≥150、研发更高级科技、进入特定纪元 | `contacted=true`，推送 ticker 消息，生成“建立通信”弹窗事件 |

例如**歌者文明**：

```typescript
// 发现阶段：year≥120 或 拥有太阳波放大器
tryDiscover(singer, this.year >= 120 || hasTech("太阳波放大器50光年"), { ... });

// 接触阶段：year≥150 或 拥有 1万光年远镜 / 太阳波放大器
tryContact(singer, hasTech("1万光年远镜") || hasTech("太阳波放大器50光年") || this.year >= 150 || this.hasFlag("singer_contact"), { ... });
```

### 2.3 弹窗事件与 ticker 消息

**新增方法**:

- `pushTickerMessage(msg)`：将文明发现/接触消息推入底部滚动消息。
- `dispatchTickerEvent()`：触发 `ticker-message-added` 事件，通知 UI 刷新。
- `enqueueAlienEvent(alien, data, kind)`：构造 `GameEventPayload` 并推入 `eventQueue`，确保玩家看到弹窗。

每个文明首次发现和首次接触都会生成独立弹窗事件，包含：

| 字段 | 内容 |
|------|------|
| title | 事件标题，如“深空光粒信号”“歌者文明接触” |
| dialogQueue | 两段对话：第一段为角色台词，第二段为系统说明 |
| choices | 单个“确认”选项，确认后写入历史记录 |

### 2.4 各文明剧情文案

已为 8 个非三体文明补充发现/接触剧情：

| 文明 | 发现事件标题 | 接触事件标题 |
|------|-------------|-------------|
| 歌者 | 深空光粒信号 | 歌者文明接触 |
| 魔戒 | 四维空间遗迹 | 魔戒文明接触 |
| 边缘世界 | 遥远战场的回声 | 边缘世界接触 |
| 归零者 | 全宇宙广播 | 归零者接触 |
| 碳基联邦 | 银河遗迹信号 | 碳基联邦接触 |
| 硅基帝国 | 无机计算矩阵 | 硅基帝国接触 |
| 上帝文明 | 衰亡的神级文明 | 上帝文明接触 |
| 量子态文明 | 宏观量子涨落 | 量子态文明接触 |

---

## 三、关键代码变更

### 3.1 AlienCivilization.ts

新增 `discoveryEventFired` 和 `contactEventFired` 字段，防止重复触发弹窗。

### 3.2 Game.ts updateDiplomacyUnlocks

- 将原来的 `tryDiscoverAndContact` 拆分为 `tryDiscover` 和 `tryContact`。
- 每个文明分阶段触发，并生成弹窗事件和 ticker 消息。
- 三体文明仍默认 `discovered=true, contacted=true`（开局已知）。

### 3.3 外交操作检查

[Game.ts:1289-L1290](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1289-L1290) 已存在检查：

```typescript
if (!alien.contacted) return `【通信未建立】人类尚未与 ${alienName} 建立可外交的通信信道，无法执行外交行动。`;
```

此检查与新的分层状态完全兼容。

---

## 四、测试验证

```bash
$ npm run typecheck
  0 错误 ✓

$ npm test
  ✓ 870 个测试全部通过 ✓

  Test Files  42 passed (42)
       Tests  870 passed (870)
```

---

## 五、玩家体验变化

修复后，当玩家满足外星文明发现/接触条件时：

1. 底部 ticker 消息栏会滚动显示：
   - “【首次发现】人类观测到异星文明「歌者」的存在信号！”
   - “【探索信道解锁】成功建立与异星文明「歌者」的通信信道！”
2. 事件弹窗会弹出对应的剧情对话，玩家点击“确认”后记录到历史中。
3. 被发现但未接触的文明会显示在外交列表中，但外交操作会提示“通信未建立”。
4. 已接触的文明可以正常执行 negotiate/trade/alliance/provoke。

---

## 六、后续建议

1. **添加 CG/头像**: 当前外星文明事件弹窗没有专属 CG 或头像，可后续为每个文明补充 `avatarUrl`。
2. **音效反馈**: 首次发现/接触神级文明时可触发特殊音效，增强仪式感。
3. **外交列表 UI 状态**: 建议在外交列表中区分“已发现（灰色）”和“已接触（亮色）”状态，帮助玩家理解分层机制。

---

**修复完成**: 外星文明接触事件已可正常触发弹窗和 ticker 消息。

**提交人**: AI Assistant
