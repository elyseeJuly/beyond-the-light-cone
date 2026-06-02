# AUDIT_20260601_NARRATIVE_ART_DEEP_AUDIT

## Overview
Full audit of the LegendOfUni event system, narrative triggering, and art asset pipeline. Conducted 2026-06-01.

---

## 一、随机事件重复触发问题（Critical）

### 1.1 现状分析
- 随机事件总数：**148 个**
- 显式设置 `maxTriggers` 的事件：**仅 3 个**（`random_tech_inspiration`=2, `random_resource_scandal`=2, `random_wallfacer_proposal`=1）
- 其余 145 个事件**未在数据层设置 `maxTriggers`**

### 1.2 虽然引擎有默认保护，但存在问题
`EventCadence.ts` 的 `normalizeEventMeta()` 在事件没有显式设置 `maxTriggers` 时，会为其赋予默认值 `1`（即最多触发1次）。理论上所有事件都应该只触发一次。

**然而，存在以下隐患导致重复触发：**

| 问题 | 位置 | 影响 |
|------|------|------|
| `triggeredFilteredIds`（条件剧情事件去重Set）**未被存入存档** | `Game.ts` restorePrototypes 无此字段 | 读档后条件剧情事件（面壁者、智子封锁等）会重新触发 |
| `filteredEvents` 中 7 个事件保留了 `cooldownYears` | `GameEventManager.ts:290,318,333,348,363,378,393,408,494,509` | 叛乱、资源危机、联合国大会、科学突破、太空军成军、威慑天平、光速提案、广播纪元、内讧、大过滤器等事件**会在冷却后再次弹出** |
| `randomEventTriggerCounts` 在读档时虽然被恢复，但 `normalizeEventMeta` 会在 `init()` 时被**重新调用**，可能覆盖已有cadenceMeta | `GameEventManager.ts:186-192` | 存档后读档时，如果 `init()` 被重新调用（line 644-645），所有事件的 cadenceMeta 被重新初始化 |

### 1.3 用户要求
> **所有事件都不进行重复**——每个事件在整局游戏中最多触发一次。

### 1.4 修复方案

#### A. 随机事件：强制所有事件 `maxTriggers=1`
**文件**: `src/core/EventCadence.ts`
- 修改 `DEFAULT_AMBIENT_META`，确认 `maxTriggers: 1`（已是默认值，无需改动）
- 修改 `normalizeEventMeta()`，增加一行**强制覆盖**：
```typescript
// 在 normalizeEventMeta 函数末尾、return之前添加：
if (event.cadenceMeta.maxTriggers === undefined || event.cadenceMeta.maxTriggers > 1) {
  event.cadenceMeta.maxTriggers = 1;
}
```

#### B. 条件剧情事件：移除所有 `cooldownYears`，改为一次性触发
**文件**: `src/core/GameEventManager.ts` — `seedFilteredEvents()`
- 删除以下事件的 `cooldownYears` 属性（共10处）：
  - `rebellion_crisis` (line 290)
  - `resource_crisis` (line 318)
  - `united_nations_assembly` (line 333)
  - `technological_breakthrough` (line 348)
  - `stf_formation` (line 363)
  - `deterrence_strain` (line 378)
  - `lightspeed_project` (line 393)
  - `broadcast_era_dawn` (line 408)
  - `inner_conflict_resolution` (line 494)
  - `great_filter_confrontation` (line 509)

#### C. 持久化修复：存档恢复 `triggeredFilteredIds`
**文件**: `src/core/Game.ts` — `restorePrototypes()`
- 在 Map 恢复逻辑之后添加对 `triggeredFilteredIds`（Set<string>）的恢复：
```typescript
if (inst.eventManager.triggeredFilteredIds && !(inst.eventManager.triggeredFilteredIds instanceof Set)) {
  inst.eventManager.triggeredFilteredIds = new Set(inst.eventManager.triggeredFilteredIds);
}
```

---

## 二、关键时间节点剧情未触发问题（High）

### 2.1 CG 资源与触发事件对照

| CG文件 | 大小 | 触发事件 | 是否正确触发？ |
|--------|------|----------|----------------|
| `cg_crisis_start.png` | 6.9MB | Year 0 固定事件（events.json） | ✅ 正确，通过 `event_crisis_start_*` → CG映射 |
| `cg_guzheng.png` | 6.5MB | Year 2 固定事件（events.json） | ✅ 正确，通过 `event_guzheng_*` → CG映射 |
| `cg_moon_crisis.png` | 7.6MB | Year 50 固定事件（events.json） | ✅ 正确，通过 `event_moon_crisis_*` → CG映射 |
| `cg_wandering_earth.png` | 6.7MB | Year 300 固定事件（events.json） | ⚠️ 需要 `loreDomain: liu_cixin_crossover`，严格三体模式下会被跳过 |
| `cg_dimensional_strike.png` | 6.6MB | 条件事件 `dimensional_threat_alert` | ⚠️ 条件苛刻：需 Year≥180 + BUNKER纪元 + reqNotFlag |

### 2.2 条件剧情事件触发问题分析

以下条件剧情事件可能因条件过于苛刻而在大多数游戏中**永远不会触发**：

| 事件 | 条件 | 问题 |
|------|------|------|
| `wallfacer_election` | minYear:10, maxYear:50, minCulture:**30** | 文化值30在前10回合很难达到 |
| `deterrence_establishment` | reqTech:"黑暗森林威慑", minDeterrence:50 | 科技与威慑双重门槛 |
| `alien_first_contact` | reqTech:"50光年远镜" | 需要物理学科技树推进 |
| `wandering_earth_decision` | reqTech:"行星发动机基础", loreDomain | 跨作品彩蛋，严格模式跳过 |
| `lightspeed_project` | reqTech:"曲率驱动理论" | 物理学后期科技 |
| `dimensional_threat_alert` | epoch: BUNKER, minYear:180 | BUNKER纪元本身进入困难 |
| `galaxy_era_exodus` | epoch: GALAXY, minYear:220 | 银河纪元进入困难 |

### 2.3 修复建议
- 适当降低早期条件剧情的门槛（如 `wallfacer_election` 的 `minCulture` 从30降至15）
- 对于已有CG但条件苛刻的事件，考虑放宽纪元检查或增加备用触发路径

---

## 三、美术资源风格不统一问题（High）

### 3.1 `mapAvatar` 映射表中仍使用旧版 `character_*` 的角色（15个）

这些角色在 `mapAvatar()` 中仍然指向旧版 `character_*` 文件，但磁盘上已有统一风格的 `unified_*` 版本未被引用：

| 角色 | 当前映射（旧版） | 应替换为（统一版） |
|------|------------------|-------------------|
| 华华 | `character_huahua_1778818926539.png` | ❌ 无统一版 |
| 伊依 | `character_yiyi_1778724524669.png` | ❌ 无统一版 |
| 霍金 | `character_hawking_1778726088806.png` | ❌ 无统一版 |
| 庄颜 | `character_zhuangyan_1778724322851.png` | `unified_zhuangyan_1779712921189.png` |
| 水娃 | `character_shuiwa_1778726120500.png` | `unified_shuiwa_1779712987486.png` |
| 雷志成 | `character_leizhicheng_1778818873520.png` | `unified_leizhicheng_1779713006589.png` |
| 杨卫宁 | `character_yangweining_1778818900159.png` | `unified_yangweining_1779713020653.png` |
| 严井 | `character_yanjing_1778819395854.png` | ❌ 无统一版 |
| 白冰 | `character_baibing_1778819424975.png` | `unified_baibing_1779713036549.png` |
| 苗福全 | `character_miaofuquan_1778818954566.png` | `unified_miaofuquan_1779713095135.png` |
| 滑膛 | `character_huatang_1778819276066.png` | `unified_huatang_1779713110568.png` |
| 朱汉扬 | `character_zhuhanyang_1778833149488.png` | `unified_zhuhanyang_1779713125007.png` |
| 刘慈欣 | `character_liucixin_1778819370180.png` | `unified_liucixin_1779712937103.png` |
| 山杉惠子 | `character_keiko_1778724347302.png` | `unified_keiko_1779713141458.png` |
| 萨伊 | `character_say_1779341254257.png` | ❌ 无统一版 |

**修复方案**: 将有 `unified_*` 版本的 10 个角色的映射更新为统一版文件名。

### 3.2 `persons.json` 的 `faceFile` 也存在同样问题

**23 个角色**在 `persons.json` 中仍使用旧版 `character_*` 的 faceFile，但已有 `unified_*` 替代。这直接导致角色卡片和人事面板的头像风格不统一。

**修复方案**: 批量替换 `persons.json` 中 23 个角色的 `faceFile` 为对应的 `unified_*` 文件名。

### 3.3 `randomevents.json` 中的全路径引用绕过映射

8处 `/images/character_*` 全路径引用会绕过 `mapAvatar()` 的统一映射逻辑，直接加载旧版文件：

| 事件ID | 引用路径 |
|--------|----------|
| `random_wallfacer_proposal` | `/images/character_reydiaz_1778724231986.png` |
| `tech_vacuum_decay_incident` | `/images/character_changweisi_1778724189193.png` |
| `dark_forest_probe_transit` | `/images/character_changweisi_1778724189193.png` |
| `revolt_water_sabotage_zone_5` | `/images/character_changweisi_1778724189193.png` |
| `revolt_data_center_sabotage` | `/images/character_changweisi_1778724189193.png` |
| `revolt_prison_break_eto` | `/images/character_changweisi_1778724189193.png` |
| `yewenjie_redemption` | `/images/character_changweisi_1778724189193.png` |
| `liucixin_poetry_cloud_art` | `/images/npc_civilian.png` |

**修复方案**: 将这些全路径引用改为简短名称（如 `"changweisi"`），让 `mapAvatar()` 正确路由到统一版。

### 3.4 `mapAvatar()` 的 `_` 分割 BUG

`mapAvatar()` 对输入名做 `name.split("_")[0]` 处理，会导致以下两个角色名被截断后无法匹配：

| 原始名 | 截断后 | 映射结果 |
|--------|--------|----------|
| `lin_yun` | `lin` | ❌ 匹配失败→default |
| `guan_yifan` | `guan` | ❌ 匹配失败→default |

**修复方案**: 在映射表中增加 `"lin": "unified_linyun_*"` 和 `"guan": "unified_guanyifan_*"` 条目，或者在 randomevents.json 中使用 `"linyun"` / `"guanyifan"` 而非下划线分隔形式。

---

## 四、磁盘清理建议（Low）

| 类型 | 数量 | 大小估算 |
|------|------|----------|
| 从未被引用的 unified_* 文件（已有映射修复后将被引用） | 10 | ~10MB |
| 冗余的旧版短名文件（如 character_beihai.png） | 8 | ~6MB |
| 双份时间戳旧版文件（如两个 yewenjie） | 3 | ~2.5MB |

**建议**: 完成映射修复后，可安全删除所有不再被引用的 `character_*` 旧版文件。保留 `character_default.png` 作为fallback。

---

## 五、修复优先级汇总

| 优先级 | 问题 | 修复文件 |
|--------|------|----------|
| 🔴 P0 | 随机事件重复触发 | `EventCadence.ts`, `GameEventManager.ts` |
| 🔴 P0 | 条件剧情事件 `cooldownYears` 导致重复弹窗 | `GameEventManager.ts` |
| 🔴 P0 | `triggeredFilteredIds` 未持久化导致读档后剧情重复 | `Game.ts` |
| 🟡 P1 | `mapAvatar()` 15个角色仍用旧版art | `GameEventManager.ts` |
| 🟡 P1 | `persons.json` 23个角色 faceFile 用旧版art | `persons.json` |
| 🟡 P1 | `randomevents.json` 8处全路径引用绕过映射 | `randomevents.json` |
| 🟡 P1 | `lin_yun` / `guan_yifan` 名称截断bug | `GameEventManager.ts` 或 `randomevents.json` |
| 🟢 P2 | 部分CG条件事件门槛过高难以触发 | `GameEventManager.ts` |
| 🟢 P2 | 旧版冗余图片清理 | `public/images/` |
