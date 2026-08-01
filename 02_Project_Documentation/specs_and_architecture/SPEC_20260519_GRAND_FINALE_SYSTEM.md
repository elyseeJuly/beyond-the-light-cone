# 大结局系统 & 事件配图审计 — 实施方案文档

> 版本：v1.0  
> 日期：2026-05-19  
> 状态：实施完成

---

## 一、项目概述

本次迭代实现了两大系统的升级：

### A. 大结局演出系统
将原有的单一"文明终结"画面升级为 **4 阶段沉浸式大结局流程**，支持 **6 种胜利结局 + 3 种失败结局** 的差异化表现。

### B. 事件系统配图审计
全面审计了事件系统的头像/配图使用情况，发现 **83% 的随机事件对话使用默认头像**，并实现了基于 NPC 职业分类的自动匹配系统（头像文件预留待 AI 生成）。

---

## 二、大结局演出系统

### 2.1 演出流程架构

```
Phase 1: EndingDeclaration  — 结局宣言全屏动画       ~8s
    ↓
Phase 2: EndingCinematic    — 专属演绎+粒子特效      ~15s
    ↓
Phase 3: TimelineRetrospective — 时间线回顾滚动     ~30-60s
    ↓
Phase 4: CreditsRoll        — 主题曲+制作人员名单    ~until end
```

每个阶段均有 "Skip →" 按钮允许跳过。

### 2.2 九种结局差异化设计

| 结局 | 类型 | 主色调 | 粒子效果 | 宣言关键句 |
|-----|------|-------|---------|----------|
| 征服胜利 | 胜利 | 烈焰红金 | starfield | "黑暗森林的猎手倒在了自己的猎场" |
| 威慑胜利 | 胜利 | 深蓝紫 | ripple | "手持毁灭的按钮，守住了脆弱的和平" |
| 黑域胜利 | 胜利 | 纯黑暗金 | collapse | "将家园永远封印在时间的琥珀中" |
| 流浪胜利 | 胜利 | 暖橙星尘 | thrust | "太阳即将毁灭，而我们带着故乡远行" |
| 数字永生 | 胜利 | 赛博青紫 | matrix | "肉体消逝，但人类文明化为永恒代码" |
| 死神永生·小宇宙 | 隐藏 | 白金彩虹 | kaleidoscope | "宇宙很大，生活更大" |
| 逃亡失败 | 失败 | 暗红灰 | shatter | "人类在恐惧中抛弃了彼此" |
| 灭绝失败 | 失败 | 死灰 | ember | "最后的光芒，也在沉默中熄灭" |
| 氦闪失败 | 失败 | 白焦黑 | flash | "当恒星燃尽，一切皆成灰烬" |

### 2.3 隐藏结局："死神永生·小宇宙"

**设计理念**：呼应《三体III》结局，需玩家在银河纪元同时达成多条高水位发展路线。

**触发条件**（全部满足）：
- `year >= 350`（银河纪元）
- `culture >= 800`
- `hasFlag("galaxy_exodus_seen")`
- `hasFlag("alien_alliance")`
- 完成科技 "黑域生成" 或 "数字方舟"
- `population > 0`
- `deterrenceValue >= 30`

**优先级**：隐藏结局在 `checkVictoryConditions()` 中最先检查，确保多条件重叠时优先触发。

### 2.4 主题曲接口

- **预留路径**：`public/audio/theme_song.mp3`
- **使用方式**：将 MP3 文件直接放入该路径即可自动播放
- **降级机制**：文件不存在时静默降级，显示 "🎵 主题曲待添加" 提示
- **支持格式**：MP3 / OGG / WAV

### 2.5 新增文件清单

| 文件路径 | 说明 |
|---------|------|
| `src/config/endingConfig.ts` | 9种结局配置中心 |
| `src/components/ending/EndingDeclaration.tsx` | Phase 1 结局宣言 |
| `src/components/ending/EndingCinematic.tsx` | Phase 2 专属演绎 |
| `src/components/ending/TimelineRetrospective.tsx` | Phase 3 时间线回顾 |
| `src/components/ending/CreditsRoll.tsx` | Phase 4 主题曲+Credits |
| `public/audio/README.md` | 音频目录说明 |

### 2.6 修改文件清单

| 文件路径 | 修改内容 |
|---------|---------|
| `src/components/EndGameScreen.tsx` | 重构为4阶段流程控制器 |
| `src/core/Game.ts` | 新增隐藏结局检查 + DefeatType + playerTimeline记录 |
| `src/types/enums.ts` | 新增 DefeatType 枚举 |

---

## 三、事件系统配图审计

### 3.1 审计数据

| 数据源 | 事件数 | 头像引用数 | default占比 |
|-------|-------|----------|-----------|
| randomevents.json | ~136 | 281 | **83.3%** (234/281) |
| events.json | 8 | 8 | 0% ✅ |
| filteredEvents | 22 | 44 | 36.4% (8/22个事件) |
| **总计** | **~166** | **333** | **72.7%** |

### 3.2 已实施的优化

#### classifyAvatar() 分类匹配系统

在 `GameEventManager.ts` 中新增了基于说话者名称关键词的自动分类匹配：

| 分类 | 匹配关键词 | 头像文件名 |
|-----|----------|----------|
| 🎖️ 军事指挥官 | 指挥/将军/司令/边防/舰队/安全局/军/参谋 | `npc_military_commander.png` |
| 🔬 科学家 | 博士/教授/物理/化学/科学/研究/实验/天文 | `npc_scientist.png` |
| 🏛️ 政务官员 | 秘书长/局长/民政/发言人/联合国/PDC/PIA | `npc_official.png` |
| 👷 工程师 | 工程/矿/工厂/建造/维修/技术/总监 | `npc_engineer.png` |
| 🧑‍🤝‍🧑 平民代表 | 代表/工人/居民/难民/民众/工会 | `npc_civilian.png` |
| 🩺 医疗人员 | 医/护/卫生/心理/伦理/生物保护 | `npc_medic.png` |
| 💀 反叛/ETO | ETO/降临/破壁/叛/恐怖/激进/鼹鼠 | `npc_rebel.png` |
| 🤖 AI/系统 | AI/系统/终端/警告/通告/检测 | `npc_ai_terminal.png` |
| 📡 通讯员 | 监听/通讯/信号/观测/深空 | `npc_comms_officer.png` |
| 💼 商人 | 商/走私/黑市/贸易/代言 | `npc_merchant.png` |

### 3.3 待完成项

- [ ] AI 生成 10 张 NPC 分类头像，放入 `public/images/` 目录
- [ ] AI 生成 9 张结局场景配图，放入 `public/images/` 目录

---

## 四、场景配图 & NPC 头像 AI 生成需求

详见独立文档：`ENDING_ART_REQUIREMENTS.md`

---

## 五、Credits 名单配置

位于 `src/config/endingConfig.ts` 中的 `CREDITS_LIST` 数组，可直接修改：

```typescript
export const CREDITS_LIST = [
  { role: '策划 & 原始设计', name: '宇宙群英传 原作团队' },
  { role: 'Web 重构开发', name: 'Emberois Studio' },
  { role: '叙事系统设计', name: 'Emberois Studio' },
  { role: '角色美术', name: 'AI Assisted Generation' },
  { role: '音乐', name: '待定 (TBD)' },
  { role: '灵感来源', name: '《三体》三部曲 — 刘慈欣' },
  { role: '特别感谢', name: '所有试玩者与贡献者' },
];
```

---

> 文档生成日期：2026-05-19  
> 基于全系统代码审计 + 实施验证
