# 结局表现形式优化方案

> 版本：v1.0  
> 日期：2026-06-15  
> 前置依赖：`SPEC_20260615_ENDING_CONDITIONS_REDESIGN.md`（条件逻辑）  
> 参考文档：`ASSET_20260519_ENDING_ART_REQUIREMENTS.md`（美术基线）

---

## 一、优化目标

在现有 4 阶段结局演出框架基础上升级，解决以下当前表现层问题:

1. **结局预告缺失** — 玩家接近结局条件时无预警，突然弹出结局画面
2. **结局区分度不足** — 部分胜利/失败结局的演出效果雷同
3. **玩家记忆回溯弱** — 结局后没有让玩家回顾关键决策路径的功能
4. **多周目激励不足** — 解锁结局后 New Game+ 加成展示不直观
5. **移动端适配欠缺** — 粒子特效在低端设备上性能问题

---

## 二、优化方案

### 2.1 [新增] 结局走向预警系统

在玩家即将达成某个结局条件时提供渐进式预警。

#### Phase 0 — 预警触发规则

| 预警等级 | 触发条件 | 表现形式 |
|---------|---------|---------|
| ⚠️ **模糊预感** | 距离任一结局条件达成还剩 30% 进度 | Status Bar 出现半透明发光图标 |
| 🔶 **明确警告** | 距离任一结局条件达成还剩 15% 进度 | 浮动提示条 + 音效 |
| 🔴 **最终倒计时** | 结局将在 3 回合内触发 | 全屏边缘红色脉冲闪烁 + 警告文字 |

#### Phase 0 — 预警实现

**UI 组件**: 新增 `src/components/ending/EndingForecastPanel.tsx`

```
┌──────────────────────────────────────┐
│  ⚠️ 结局方向预测                       │
│                                      │
│  ┌─────────────┐  ┌─────────────┐   │
│  │ 🛡️ 威慑胜利   │  │ ☀️ 氦闪威胁  │   │
│  │ ████████████ │  │ ████████░░  │   │
│  │ 85%         │  │ 62%         │   │
│  └─────────────┘  └─────────────┘   │
│                                      │
│  最多可能结局: 威慑胜利                 │
│  预计达成: ~10 回合后                  │
└──────────────────────────────────────┘
```

**数据接入**：由 `Game.ts` 新增方法 `getEndingForecast()` 返回各结局的达成进度百分比，供预警面板轮询。

---

### 2.2 [增强] Phase 1 — 结局宣言增强

现状：当前宣言为静态全屏文字 + 渐入效果。

优化：

#### 2.2.1 差异化文字动画

| 结局 | 当前 | 新动画效果 |
|------|------|-----------|
| CONQUEST | 静态显示 | 文字以**冲击波**方式逐字出现 + 屏幕震动 |
| DETERRENCE | 静态显示 | 文字缓慢显现，两侧有**脉搏光晕** |
| DARK_DOMAIN | 静态显示 | 文字从中心向外**暗域扩张** + 边缘光效收缩 |
| WANDERING | 静态显示 | 文字从右下向左上**推进** + 尾迹粒子 |
| DIGITAL | 静态显示 | 文字以**矩阵雨**效果逐个像素构建 |
| HIDDEN | 静态显示 | 文字从**彩虹光晕**中浮现 + 暗藏宇宙背景 |
| TREACHERY | 静态显示 | 文字以**碎裂**方式出现 |
| EXTINCTION | 静态显示 | 文字以**灰烬坠落**方式显现 |
| HELIUM_FLASH | 静态显示 | 文字以**过曝闪光** + 渐隐方式出现 |

#### 2.2.2 实时数据展示

在宣言文字下方增加动态数据展示:

```
「黑暗森林的猎手倒在了自己的猎场。」
                                    ↑ 宣言主体（大字）
────────────────────────────────────
[异星文明覆灭: 5/5]  [耗时: 312年]  [阵亡: 2,847万]  
                                    ↑ 实时数据（小字/底部）
```

---

### 2.3 [增强] Phase 2 — 专属演绎增强

现状：当前粒子效果逻辑在 `EndingCinematic.tsx`，使用 Canvas 粒子系统。

优化：

#### 2.3.1 粒子效果升级规格

| 结局 | 粒子效果 | 粒子数 | 新增特效层 |
|------|---------|--------|-----------|
| CONQUEST | starfield | 200 | 残骸碎片 + 爆炸闪光脉冲 |
| DETERRENCE | ripple | 150 | 引力波涟漪 + 执剑人剪影浮现 |
| DARK_DOMAIN | collapse | 180 | 空间坍缩扭曲球面 + 光线弯曲 |
| WANDERING | thrust | 200 | 行星发动机光柱 + 尾迹拉丝 |
| DIGITAL | matrix | 220 | 代码流 + 神经元连接网络 |
| HIDDEN | kaleidoscope | 250 | 彩虹万花筒 + 小宇宙旋转 |
| TREACHERY | shatter | 150 | 飞船逃离轨迹 + 碎片撕裂 |
| EXTINCTION | ember | 120 | 灰烬飘落 + 最后生命信号衰减 |
| HELIUM_FLASH | flash | 300 | 过曝白色火焰 + 蒸发粒子上升 |

#### 2.3.2 移动端自适应

- 检测设备性能 (`navigator.hardwareConcurrency` 或帧率监控)
- 低端设备自动降低粒子数至 50%（保留视觉效果但减少性能开销）
- 提供设置选项：`设置 → 画面 → 结局粒子质量：[高/中/低]`

---

### 2.4 [新增] Phase 2.5 — 关键决策回溯

在结局演绎和 Timeline 回顾之间，新增一个 **关键决策回溯** 阶段。

#### 2.4.1 回溯内容

| 数据类型 | 内容 | 数据来源 |
|---------|------|---------|
| 🗺️ 纪元变迁 | 纪元流转时间线 | `playerTimeline` |
| ⚔️ 关键战斗 | 重大战役/外交事件 | `playerTimeline` (含 battle 过滤) |
| 👤 重要人物 | 执剑人/面壁者上任 | `personManager` 关键任命记录 |
| 🏗️ 关键科技 | 里程碑科技完成时间 | `tecTreeManager` 完成记录 |
| 📉 转折点 | 人口/威慑/逃亡的剧烈变化 | `playerTimeline` 异常值事件 |

#### 2.4.2 UI 设计

```
┌──────────────────────────────────────────┐
│  📜 关键决策回溯                          │
│                                          │
│  [纪元时间线]                             │
│  Crisis ── Deterrence ── Broadcast ── •  │
│  2026      2045          2078       2100  │
│                                          │
│  [⚔️ 三体战争]  │  [🔬 智子封锁破解]      │
│  2045 ▶ 2050   │  2072                   │
│  战争爆发→结束   │  基础物理解禁            │
│                                          │
│  [⚠️ 最低点: 逃亡度 87%]                  │
│  在危机纪元末期文明几近崩溃                  │
│                                          │
│  [🏆 最高光: 威慑度 95%]                   │
│  罗辑出任执剑人后威慑平衡维持 20 年          │
│                                          │
│          [继续 →]                        │
└──────────────────────────────────────────┘
```

#### 2.4.3 新增组件

`src/components/ending/KeyDecisionRetrospective.tsx`

- 从 `playerTimeline` 中筛选关键事件
- 根据结局类型自动区分高光/低谷事件
- 胜利结局强调"人类的高光时刻"
- 失败结局强调"转折点 —— 如果可以重来……"

---

### 2.5 [增强] Phase 4 — Credits & 多周目解锁展示

#### 2.5.1 结局收集进度

在 Credits 播放完毕后，新增结局收集展示：

```
┌──────────────────────────────────────┐
│  🏆 结局收集进度                       │
│                                      │
│  胜利结局: ██████░░░ 6/9             │
│  失败结局: ███░░░░░░ 3/9             │
│                                      │
│  ┌────── 已解锁结局一览 ──────┐      │
│  │ ✅ 流浪胜利    ★★☆☆☆      │      │
│  │ ✅ 数字永生    ★☆☆☆☆      │      │
│  │ ❓ 征服胜利    ★★★★☆      │      │
│  │ ❓ 死神永生    ★★★★★      │      │
│  │ ...                          │      │
│  └──────────────────────────────┘      │
│                                      │
│  即将解锁: 征服胜利                    │
│  建议: 在更高压的难度下强化军事路线      │
│                                      │
│          [开始新游戏+]                  │
└──────────────────────────────────────┘
```

#### 2.5.2 New Game+ 加成效展示

```typescript
interface NewGamePlusBonus {
  endingUnlocked: EndingKey;
  bonusType: 'population' | 'culture' | 'deterrence' | 'economy' | 'starting_tech';
  bonusAmount: number;
  description: string;
}

const NG_BONUS_MAP: Record<EndingKey, NewGamePlusBonus[]> = {
  WANDERING: [
    { endingUnlocked: 'WANDERING', bonusType: 'population', bonusAmount: 20, description: '流浪经验：初始人口+20' },
    { endingUnlocked: 'WANDERING', bonusType: 'economy', bonusAmount: 30, description: '流浪经验：初始经济+30' },
  ],
  DIGITAL: [
    { endingUnlocked: 'DIGITAL', bonusType: 'culture', bonusAmount: 50, description: '数字遗产：初始文化+50' },
  ],
  CONQUEST: [
    { endingUnlocked: 'CONQUEST', bonusType: 'starting_tech', bonusAmount: 1, description: '军事遗产：初始解锁一项军事科技' },
  ],
  HIDDEN: [
    { endingUnlocked: 'HIDDEN', bonusType: 'culture', bonusAmount: 100, description: '宇宙智慧：初始文化+100' },
    { endingUnlocked: 'HIDDEN', bonusType: 'deterrence', bonusAmount: 20, description: '归零者启示：初始威慑度+20' },
  ],
  // ... 其余结局
};
```

---

### 2.6 [优化] 移动端 & 性能优化

#### 2.6.1 Canvas 粒子性能分级

```typescript
// src/components/ending/particlePerformance.ts

export type ParticleQuality = 'high' | 'medium' | 'low';

export function getParticleQuality(): ParticleQuality {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) return 'low';
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
  
  // Apple Silicon / 高端 GPU → high
  if (renderer.includes('Apple M') || renderer.includes('RTX') || renderer.includes('RX')) {
    return 'high';
  }
  
  // 中端 GPU → medium
  if (renderer.includes('Intel') || renderer.includes('GTX')) {
    return 'medium';
  }
  
  // 低端 / 未知 → low
  return 'low';
}

export function getMaxParticles(quality: ParticleQuality): number {
  const map = { high: 300, medium: 150, low: 80 };
  return map[quality];
}
```

#### 2.6.2 CSS 动画降级

所有动画增加 `@media (prefers-reduced-motion: reduce)` 支持：

```css
@media (prefers-reduced-motion: reduce) {
  .ending-declaration {
    animation: none;
    opacity: 1;
    transition: opacity 0.3s;
  }
  .particle-canvas {
    display: none;
  }
}
```

---

## 三、新增/修改文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/components/ending/EndingForecastPanel.tsx` | **新增** | 结局方向预警面板 |
| `src/components/ending/KeyDecisionRetrospective.tsx` | **新增** | 关键决策回溯组件 |
| `src/components/ending/EndingCollectionGrid.tsx` | **新增** | 结局收集进度和多周目加成显示 |
| `src/components/ending/particlePerformance.ts` | **新增** | 粒子性能分级工具 |
| `src/components/ending/EndingDeclaration.tsx` | **修改** | 差异化文字动画 |
| `src/components/ending/EndingCinematic.tsx` | **修改** | 粒子效果升级 + 性能分级 |
| `src/components/EndGameScreen.tsx` | **修改** | 集成 Phase 2.5 回溯阶段 |
| `src/core/Game.ts` | **修改** | 新增 `getEndingForecast()` 方法 |
| `src/config/endingConfig.ts` | **修改** | 新增 NG+ 加成配置 |

---

## 四、结局演出完整流程

```
Phase 0: [预警] ─────────────────────────── (新增)
  结局方向预警面板实时显示各结局进度
  ↓ (进度达100%)

Phase 1: [结局宣言] ──────────────────────── (增强)
  差异化文字动画 + 实时数据展示
  ↓ (8s 或 Skip)

Phase 2: [专属演绎] ──────────────────────── (增强)
  升级粒子特效 + 移动端自适应
  ↓ (15s 或 Skip)

Phase 2.5: [关键决策回溯] ────────────────── (新增)
  纪元变迁 + 关键事件 + 高光/低谷
  ↓ (30-60s 或 Skip)

Phase 3: [时间线回顾] ────────────────────── (现有)
  完整玩家的 timeline 滚动回顾
  ↓ (30-60s 或 Skip)

Phase 4: [主题曲 + Credits + 收集展示] ───── (增强)
  主题曲 + 制作名单 + 结局收集 + NG+ 加成
  ↓ (完)

[返回主菜单] 或 [开始新游戏+]
```

---

## 五、实施路线图

| 阶段 | 内容 | 工作量估算 |
|------|------|-----------|
| **1 — 基础增强** | Phase 1 差异化文字动画 + Phase 2 粒子升级 | 3-4 天 |
| **2 — 新增组件** | Phase 0 预警面板 + Phase 2.5 回溯组件 | 3-5 天 |
| **3 — 多周目系统** | Phase 4 收集展示 + NG+ 加成 | 2-3 天 |
| **4 — 移动端优化** | 粒子性能分级 + CSS 降级 | 1-2 天 |
| **5 — 集成测试** | 全部阶段串联 + 性能测试 | 2-3 天 |

---

> 文档版本：v1.0  
> 本方案仅涉及表现层 UI/UX 优化，不修改结局触发逻辑  
> 结局触发逻辑变更见 `SPEC_20260615_ENDING_CONDITIONS_REDESIGN.md`