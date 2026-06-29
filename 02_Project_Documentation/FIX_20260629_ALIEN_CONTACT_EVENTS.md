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
