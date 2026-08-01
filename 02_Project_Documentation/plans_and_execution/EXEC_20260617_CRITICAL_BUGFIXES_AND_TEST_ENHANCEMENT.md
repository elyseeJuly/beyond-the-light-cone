# 光锥之外 - 关键Bug修复与测试库增强执行报告

> **文档编号**: EXEC_20260617_CRITICAL_BUGFIXES_AND_TEST_ENHANCEMENT  
> **完成日期**: 2026-06-17  
> **分类前缀**: `EXEC_` (执行报告)  
> **执行人**: Trae Agent  

---

## 📖 一、概述与修改目的

针对《光锥之外》游戏的五个关键Bug进行修复，并完善测试库以确保修复质量和防止回归。

**修复目标**:
1. 事件弹窗头像不加载，CG显示模糊不全
2. 重大事件CG在岁月史书不显示
3. 战略星图无需舰队即可占领星球建造
4. 结局CG缺失
5. 威慑结局过于容易触发（威慑度衰减机制不合理）

---

## 🛠️ 二、执行内容与修改详情

### Bug 1: 事件弹窗头像加载与CG显示优化

**问题描述**: 事件弹窗中角色头像未使用事件数据提供的 `avatarUrl`，而是使用名称匹配函数；CG图使用 `object-cover` + 8%缩放动画导致显示不全且模糊。

**修改文件**:
- [StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StoryModal.tsx)

**修改内容**:
1. **头像加载逻辑**: 优先使用 `currentNode.avatarUrl`，失败时回退到 `getCharacterAvatar()` 名称匹配，增加 `onError` 兜底处理
2. **CG显示优化**: 将 `object-cover` 改为 `object-contain` 确保完整显示；`pan-zoom`(缩放108%)改为 `gentle-pan`(缩放102%)，opacity从0.85提升至0.95
3. **CSS动画**: 新增 `gentle-pan` 关键帧替换激进的 `pan-zoom`

---

### Bug 2: 重大事件筛选扩展

**问题描述**: CivilizationArchive 中重大事件筛选条件过于狭窄，遗漏纪元更替、CG事件和结局事件。

**修改文件**:
- [CivilizationArchive.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/CivilizationArchive.tsx)

**修改内容**:
扩展 `majorEvents` 筛选关键词，新增：
- `【纪元更替】`
- `【黑暗森林打击】`
- `【二向箔】`
- `【维度打击】`
- `【威慑】`
- `【征服】`
- `【流浪地球】`
- `【胜利】`
- `【失败】`
- `【结局】`

---

### Bug 3: 星球建造权限检查

**问题描述**: RightInspector 中的建造按钮未检查星球归属，导致玩家可以在非己方星球上建造设施。

**修改文件**:
- [RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/RightInspector.tsx)

**修改内容**:
在以下三个建造函数中添加归属检查：
- `handleBuildStope()` — 采矿场建造
- `handleBuildFactory()` — 加工厂建造
- `handleBuildCity()` — 太空城市建造

检查逻辑: `if (star.belongToCivi !== "地球") { alert("该星球不属于地球文明，无法在此建造！"); return; }`

---

### Bug 4: 结局CG缺失

**问题描述**: `ending_defeat_dimension_strike.png` 二向箔降维结局CG缺失。

**修改文件**:
- [public/images/](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/images/)

**修改内容**:
复制 `cg_dimensional_strike.png` 为 `ending_defeat_dimension_strike.png`，补全二向箔降维结局的场景配图。

---

### Bug 5: 威慑度衰减机制重构

**问题描述**: 威慑度衰减机制不合理，导致威慑胜利过于容易触发（基础衰减仅1，有完成计划则衰减为0）。

**修改文件**:
- [EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts)

**修改内容**:

| 修改项 | 旧值 | 新值 |
| :--- | :--- | :--- |
| 面壁者威慑增益系数 | `(leadership + art) * 0.5` | `(leadership + art) * 0.05` |
| 面壁计划完成威慑奖励 | 50 | 20 |
| 基础衰减 | 固定1 | 固定3 |
| 比例衰减 | 无 | `floor(deterrenceValue * 0.02)` |
| 面壁者衰减减缓 | 每人0.2 | 每人0.3 |
| 执剑人衰减减缓 | 无 | 0.5 |
| 完成计划衰减减缓 | 直接设为0 | 每个完成计划减1 |
| 最低衰减 | 0 | 1 |

**新衰减公式**:
```
deterrenceDecay = max(1, 3 + floor(deterrenceValue × 0.02) - activeWallfacers×0.3 - swordholder×0.5 - completedPlans×1)
```

---

## 🧪 三、测试库增强

**新增测试文件**:
- [Civilization.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/Civilization.test.ts)

**新增测试用例**:
1. **威慑度基础衰减至少为1** — 验证最低衰减保障
2. **高威慑度时比例衰减更快** — 验证比例衰减机制生效
3. **面壁者可以减缓衰减** — 验证面壁者衰减减缓效果
4. **执剑人额外减缓衰减** — 验证执剑人衰减减缓效果
5. **面壁者增益相比旧版大幅降低** — 验证增益调整后数值合理

**测试结果**:
- 全部测试用例: **41个** ✅
- 新增测试用例: **5个** ✅
- 通过率: **100%**

---

## ✅ 四、验证结果

| Bug编号 | 修复状态 | 验证方式 |
| :--- | :--- | :--- |
| 1 | ✅ 已修复 | 代码审查 + 单元测试 |
| 2 | ✅ 已修复 | 代码审查 + 筛选逻辑验证 |
| 3 | ✅ 已修复 | 代码审查 + 逻辑验证 |
| 4 | ✅ 已修复 | 文件检查 |
| 5 | ✅ 已修复 | 单元测试验证衰减机制 |

---

## 📁 五、文件变更清单

| 文件路径 | 变更类型 |
| :--- | :--- |
| `src/components/StoryModal.tsx` | 修改 |
| `src/components/CivilizationArchive.tsx` | 修改 |
| `src/components/RightInspector.tsx` | 修改 |
| `src/core/EarthCivilization.ts` | 修改 |
| `public/images/ending_defeat_dimension_strike.png` | 新增 |
| `src/test/core/Civilization.test.ts` | 修改 |
