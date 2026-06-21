# 术语规范审计报告 (Terminology Mismatch Audit)
> **Establishment Date**: 2026-06-21  
> **Authoritative Version**: V1.0  
> **Target Directory**: `02_Project_Documentation/`  

## 📖 1. 审计目的
根据项目最新的全局术语规范要求，对源码进行全盘正则表达式扫描及人工抽样复核，以验证当前 `src/` 目录下是否依然存在遗留的不规范命名，或者规范字典（`DICT_`）与实际代码脱节的地方。

---

## 🔎 2. 审计发现与问题点

### 2.1 规范定义的语义冲突：`Culture` vs `Science`
*   **现象描述**：在先前的词典草案中，为了防止将文明的“文化/科研”进度混淆，将 `Science` 列入了 `Culture`（文化值）的黑名单。
*   **代码实情**：经审计发现，人物角色（`Person`）接口明确拥有 `science: number`（科学能力）属性，并在 `PersonManager.ts` 与 `data/persons.json` 中被大量使用（如丁仪、叶文洁的 `science` 高达 95+）。
*   **结论/处理建议**：词典中对 `Culture` 同义词黑名单直接封杀 `Science` 存在概念冲突。已在 `DICT_20260616_TERMINOLOGY_DICTIONARY.md` 的 V2.2 版本中进行修复：解除封杀，并增加“严格区分文明级 `Culture` 与角色级 `science`”的特别说明。

### 2.2 数据容错：`persons.json` 中的首字母大写
*   **现象描述**：`PersonManager.ts` 在加载 JSON 时，存在向后兼容的写法：`p.science = data.science ?? data.Science ?? 0;`。
*   **代码实情**：在 `data/persons.json` 的少数历史遗留条目中，可能存在属性名首字母大写的 `Science`。
*   **结论/处理建议**：虽然代码层做好了容错保护，不影响编译与运行。但这属于潜在的数据规范不一致。在后续的 JSON 格式化工具或存量修正中，建议统一转为驼峰式小写的 `science`。

### 2.3 弱类型隐患：`epoch` 字段的 `string` 宽泛类型
*   **现象描述**：枚举系统定义了严格的 `EpochType`（如 `EpochType.CRISIS`），但对于事件系统的定义仍不够严格。
*   **代码实情**：
    *   在 `src/core/GameEvent.ts` 中：`epoch?: string | EpochType;`
    *   在 `src/types/narrative.ts` 中：`epoch?: EpochType | string;`
*   **结论/处理建议**：这是一种妥协。对于 `json` 数据驱动的事件，经常采用诸如 `"CRISIS"` 的字符串指代，为了防止 `TypeScript` 报错，定义里开启了 `string`。未来在 UEE（通用事件引擎）完善时，建议开发专用的 `String-to-Enum` 映射中间件，从而在 TypeScript 接口层彻底移除 `string` 类型放行，封堵魔法字符串的出现可能。

---

## ✅ 3. 审计结论

除上述小部分的类型宽泛妥协以及概念解释纠偏以外，本次全盘 `grep_search` 审计（搜索了诸如 `Rebellion`、`Money`、`Minerals`、`SpaceArmy`、`2D_Strike` 等近 20 个曾用名黑名单）**均未发现违规硬编码残留**。

**代码库目前的术语纯净度非常高**，已完全贴合《三体》/《刘慈欣》宇宙观的正统翻译与统一变量名规范。
