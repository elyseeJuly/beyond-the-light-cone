# 术语词典全库审计与修复报告
> **审计日期**: 2026-06-16
> **审计范围**: `03_Web_Rebuild/src/` 全部 TypeScript 源码与 JSON 数据文件
> **基准版本**: DICT V2.0 → V2.1
> **审计员**: AI 协作审计

---

## 1. 审计摘要

本次审计对照 [DICT_20260616_TERMINOLOGY_DICTIONARY.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/DICT_20260616_TERMINOLOGY_DICTIONARY.md) V2.0，对项目的 **TypeScript 源码（.ts/.tsx）** 和 **JSON 数据文件** 进行了全面的术语合规性扫描。

### 审计结论

| 维度 | 结果 |
| :--- | :--- |
| 枚举类型引用（EpochType/DepartmentType/BuildingType 等） | ✅ 合规 |
| Civilization 属性字段命名 | ✅ 合规 |
| Person 数据结构字段 | ✅ 合规 |
| Fleet/Weapon/Building 类与接口 | ✅ 合规 |
| 事件效果目标名称（effect target） | ⚠️ 存在别名问题 |
| TagManager 标签分类 | ✅ 合规（上下文语义正确） |
| UI 组件内部分类标签 | ✅ 合规（UI 上下文，不涉及领域模型） |
| i18n 翻译键 | ✅ 合规（展示层，非领域模型） |

---

## 2. 具体问题清单

### 问题 1：事件效果目标使用非规范别名（高频）

**违规模式**：在 `events.json`、`randomevents.json` 和 `GameEventManager.ts` 中，`{ type: "resource", target: "military" | "prestige" }` 使用了非规范名称。

**DICT 规定**：
- `army`（代码映射 `Civilization.army`）为军力的规范名称
- `deterrenceValue`（代码映射 `EarthCivilization.deterrenceValue`）为威慑度的规范名称

**问题文件与出现次数**：

| 文件路径 | 别名 `"military"` | 别名 `"prestige"` |
| :--- | :-: | :-: |
| `src/data/events.json` | 7 次 | 66 次 |
| `src/data/randomevents.json` | 16 次 | 107 次 |
| `src/core/GameEventManager.ts` | 9 次 | 11 次 |
| `src/core/Game.ts`（clampEffectValue/applyNewEffects） | 2 处（处理分支） | — |
| **合计** | **34 次** | **184 次** |

**影响范围**：事件系统的效果声明与效果处理两端的命名不一致。由于数据文件数量大（218 处），直接修改 JSON 数据入侵性过高。

### 问题 2：`Game.ts` 效果处理存在硬编码别名分支

**违规模式**：`clampEffectValue` 方法中数组 `['economy', 'culture', 'prestige', 'military', 'resource', 'army']` 混合了规范名与别名；`applyNewEffects` 的 switch-case 也同时处理两者。

**严重程度**：中 — 可工作但不符合 DICT 规范的单一入口原则。

---

## 3. 修复措施

### 修复 1：创建规范化别名映射

在 `Game.ts` 中新增 `EFFECT_TARGET_ALIAS` 静态字典，作为效果目标别名的唯一入口：

```typescript
private static readonly EFFECT_TARGET_ALIAS: Record<string, string> = {
  'prestige': 'deterrenceValue',
  'military': 'army',
};
```

**作用**：所有效果目标在进入处理逻辑前先归一化为规范名称，后续分支仅处理规范名。

### 修复 2：清理 `clampEffectValue`

- 将数组从 `['economy', 'culture', 'prestige', 'military', 'resource', 'army']` 改为 `['economy', 'culture', 'deterrenceValue', 'resource', 'army']`
- 移除了对 `prestige` 和 `military` 的硬编码条件分支

### 修复 3：清理 `applyNewEffects`

- 将 switch-case 中的 `eff.target` 替换为归一化后的 `canonicalTarget`
- 统一使用 `deterrenceValue` 和 `army` 作为 case 标签

### 修复 4：更新 DICT 文档

- 新增 `deterrenceValue` 术语条目（§3）
- 在 `army` 条目下标注别名兼容性说明
- 在附录中记录 V2.1 修复清单

### 未修改内容说明

| 内容 | 保留理由 |
| :--- | :--- |
| events.json/randomevents.json 中的 `"military"`/`"prestige"` | 数据兼容性；由代码层统一归一化 |
| TagManager `category: 'military'` | Tag 分类标签，非领域属性引用 |
| GovManagement/IntelligenceCenter 中的 `'military'` tab | UI 组件内部状态分类，非领域模型 |
| i18n 翻译键 `"military"` | 展示层本地化，非领域模型 |

---

## 4. DICT V2.1 变更对比

| 变更 | 前 (V2.0) | 后 (V2.1) |
| :--- | :--- | :--- |
| 术语数 | ~200+ 条目 | ~203 条目（+deterrenceValue） |
| 别名规范 | 无别名字典 | `EFFECT_TARGET_ALIAS` 映射表 |
| 代码合规性 | 4 处硬编码别名分支 | 1 处统一映射入口 |
| 附录审计清单 | 仅 V2.0 补充清单 | +V2.1 修复清单 |

---

## 5. 后续建议

1. **新事件数据**应优先使用规范名称 `army`、`deterrenceValue`，减少别名依赖
2. **代码审查方针**：新增 `applyNewEffects` 中的 switch-case 时，必须使用规范名而非别名
3. 如后续完全统一数据层，可在代码中增加 `console.warn` 日志用于检测仍在使用的别名

---

> 本报告自动生成于全局术语审计流程。如发现新的术语不一致，请同步更新 DICT 文档并归档至本报告。