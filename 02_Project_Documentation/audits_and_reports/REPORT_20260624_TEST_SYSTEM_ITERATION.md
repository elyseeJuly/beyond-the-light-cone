# 测试系统迭代报告

> **日期**: 2026-06-24
> **审计基准**: [AUDIT_20260621_TEST_SYSTEM_ARCHITECTURE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260621_TEST_SYSTEM_ARCHITECTURE.md)
> **术语词典**: [DICT_20260616_TERMINOLOGY_DICTIONARY.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/DICT_20260616_TERMINOLOGY_DICTIONARY.md)

---

## 一、迭代前审计基线

| 指标 | 迭代前 | 迭代后 | 变化 |
|------|--------|--------|------|
| 测试文件数 | 40 | 41 | +1 |
| 测试用例数 | 833 | 864 | +31 |
| 语句覆盖率 | 73.74% | 75.63% | +1.89% |
| 分支覆盖率 | 66.05% | 68.12% | +2.07% |
| 函数覆盖率 | 80.03% | 81.41% | +1.38% |
| 行覆盖率 | 75.24% | 77.17% | +1.93% |
| 覆盖率阈值 | 70%/60%/70%/70% | 全部超过 | ✅ |

---

## 二、迭代方案与执行

### Phase 1：修复测试中 Unknown world tag 警告

**问题**: 测试输出中存在 6 个 "Unknown world tag" 警告，原因是 `TagManager.applyWorldTag()` 会在标签未注册时打印警告并跳过。

**修复**: 在 [TagManager.ts STANDARD_TAGS](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/TagManager.ts) 中补注册以下标签：

| 标签 ID | 名称 | 用途 |
|---------|------|------|
| `victory_wandering` | 流浪胜利 | 结局标记 |
| `victory_digital` | 数字永生胜利 | 结局标记 |
| `victory_deterrence` | 威慑胜利 | 结局标记 |
| `victory_conquest` | 征服胜利 | 结局标记 |
| `victory_dark_domain` | 黑域胜利 | 结局标记 |
| `victory_hidden` | 隐藏胜利 | 结局标记 |
| `ending_completed` | 结局完成 | 结局标记 |
| `echo_of_past_ending` | 往世回响 | NG+ 标记 |
| `stardust_era_deep` | 星屑纪元特征 | 纪元标记 |

**验证**: Unknown world tag 警告从 5 个降为 0。

### Phase 2：补充 assetUrl.ts 单元测试

**问题**: `assetUrl.ts` 覆盖率仅 42.85%，为工具类中最低。

**新增文件**: [assetUrl.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/utils/assetUrl.test.ts)

| 测试组 | 用例数 | 覆盖函数 |
|--------|--------|---------|
| `getAssetUrl` | 5 | 路径拼接、空字符串、嵌套路径 |
| `getImageUrl` | 3 | 图片前缀、空字符串、子目录 |
| `preloadCoreImages` | 2 | 浏览器环境、Node 环境安全跳过 |

### Phase 3：补充 EventSystem 新效果类型测试

**问题**: TASK-EVENT 新增的 6 种效果类型 (`spawn_barback`, `lock_ratio`, `rush_tech`, `build_infrastructure`, `spend_ap`, `diplomacy`, `unlock_person`) 在 EventSystem 中无测试覆盖。

**修改文件**: [SubsystemSplit.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/SubsystemSplit.test.ts)

新增 8 个测试用例：

| 测试用例 | 覆盖效果类型 |
|---------|------------|
| applyNewEffects 解析 lock_ratio 效果 | `lock_ratio` |
| applyNewEffects 解析 spend_ap 效果 | `spend_ap` |
| applyNewEffects 解析 diplomacy 效果 | `diplomacy` |
| applyNewEffects 解析 unlock_person 效果 | `unlock_person` |
| applyNewEffects 解析 rush_tech 效果 | `rush_tech` |
| applyNewEffects 解析 spawn_barback 效果 | `spawn_barback` |
| applyNewEffects 解析 build_infrastructure 效果 | `build_infrastructure` |
| applyNewEffects 多个效果混合执行 | 组合测试 |

### Phase 4：补充 StarManager 方法测试

**问题**: `StarManager.ts` 覆盖率 62.68%，`markStarStatus`, `buildInfrastructure`, `getStarDefenseForce` 三个新方法无测试。

**修改文件**: [StarManager.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/StarManager.test.ts)

新增 13 个测试用例，分为 3 个 describe 块：

| 测试组 | 用例数 | 覆盖方法 |
|--------|--------|---------|
| 星球状态与设施建设 | 9 | `markStarStatus`, `buildInfrastructure` |
| 驻防力量 | 3 | `getStarDefenseForce` |

---

## 三、验证结果

| 验证项 | 结果 |
|--------|------|
| TypeScript 编译 (`npx tsc --noEmit`) | 0 错误 |
| 测试 (`npx vitest run`) | **864/864 全部通过**（41 个测试文件） |
| 语句覆盖率 | 75.63%（阈值 70%）✅ |
| 分支覆盖率 | 68.12%（阈值 60%）✅ |
| 函数覆盖率 | 81.41%（阈值 70%）✅ |
| 行覆盖率 | 77.17%（阈值 70%）✅ |
| Unknown world tag 警告 | 0 |

---

## 四、变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/core/TagManager.ts` | 标签注册 | 补注册 9 个游戏标签（结局/纪元/Ng+） |
| `src/test/utils/assetUrl.test.ts` | 新增 | assetUrl 工具函数测试（10 用例） |
| `src/test/core/SubsystemSplit.test.ts` | 扩展 | EventSystem 新效果类型测试（+8 用例） |
| `src/test/core/StarManager.test.ts` | 扩展 | StarManager 状态/设施/驻防测试（+13 用例） |

---

## 五、后续建议

1. **EconomyManager.ts** 覆盖率仅 38.46%，建议补充独立测试
2. **Playwright E2E 测试** 55 个用例存在但未纳入 CI 流程，建议配置
3. **TagManager → Event 集成测试** reqTag/reqNotTag 条件触发的集成测试缺失
4. **快照测试** 回合结果快照回归测试可防止数值漂移