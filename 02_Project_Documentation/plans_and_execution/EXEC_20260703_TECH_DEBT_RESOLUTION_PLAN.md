# 技术债务批量清偿与资产下载模块修复 — 实施方案

> **版本号**: V1.0.0
> **生效日期**: 2026-07-03
> **基于审计**: AUDIT_20260703_ASSET_DOWNLOAD_MODULE.md
> **健康基线**: _health.md（原有 3🔴 / 1🟡 / 2🟢）

## 一、背景

根据 2026-07-03 资产下载模块审计报告及项目健康仪表盘，当前存在以下需修复项：

### 审计 RED 条目（发布阻断）
| 条目 | 问题 |
|------|------|
| SCEN-ASSET-DOWNLOAD-LOOP | `AssetLoader.downloadEraPack` / `preloadNextEra` 全局零调用，未接入游戏主循环 |
| SCEN-ASSET-MANIFEST-GEN | `detectEra` 算法覆盖率不足，144MB（41%）资源落入 `pack_uncategorized` |

### 健康仪表盘 🔴 债务
| 债务 | 现状 |
|------|------|
| Flag 系统耦合度 | `Game.flags` 为公开 `Set<string>`，外部模块可直接操作 |
| Release 流水线 | 0 自动化，发版完全手动 |
| Game.ts 行数 | 1900 行，超过 1000 行阈值 |

## 二、实施方案

### 阶段 1：审计 RED 条目修复

#### 2.1 SCEN-ASSET-DOWNLOAD-LOOP（资产下载接入主循环）
- **文件**: [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts)
- **方案**: 在 `updateEpoch()` 纪元更替块中，以 fire-and-forget 模式调用 `assetLoader.downloadEraPack(currentEraKey)` + `assetLoader.preloadNextEra(currentEraKey)`
- **约束**: 下载失败不阻塞游戏主循环，不抛异常

#### 2.2 SCEN-ASSET-MANIFEST-GEN（资源分类算法重构）
- **文件**: [generate-manifest.mjs](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/scripts/generate-manifest.mjs)
- **方案**:
  - 人物立绘（`unified_*`/`npc_*`）→ `pack_characters` 类型包
  - 结局 CG（`ending_*`）→ `pack_endings` 类型包
  - 音频文件 → `pack_music` 类型包
  - 扩展 CG 关键词覆盖 7 个纪元（黄金/危机/威慑/广播/掩体/银河/星屑）
  - 包名改为中文友好名称（如「危机纪元包」）
  - 版本号从 `package.json` 读取，消除硬编码 `'1.0.0'`

#### 2.3 版本号硬编码统一
- **文件**: [SettingsModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/SettingsModal.tsx), 新建 [version.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/utils/version.ts)
- **方案**: 创建 `src/utils/version.ts` 从 `package.json` 读取版本号，`SettingsModal.tsx` 引用 `GAME_VERSION`

#### 2.4 AssetLoader eraOrder 扩展
- **文件**: [AssetLoader.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AssetLoader.ts)
- **方案**: `preloadNextEra` 的 `eraOrder` 从 4 纪元扩展到完整 7 纪元序列

### 阶段 2：遗留债务修复

#### 2.5 Flag 系统解耦
- **新建**: [FlagManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/FlagManager.ts)
- **方案**: 创建 `FlagManager` 类包装 `Set<string>`，提供 `isSet/set/unset/getSnapshot/restoreFromSnapshot` API。在 `Game.ts` 中与 `flags` Set 共享引用，实现 100% 存档兼容。`flagManager` 从 `gameReplacer` 排除列表中排除，仅序列化 `flags` Set。

#### 2.6 Release 流水线自动化
- **新建**: `.github/workflows/release.yml`, `tools/extract-changelog.sh`, `tools/sync-version.sh`
- **方案**: Tag-Driven 4 Job 流水线（gate → build-web + build-tauri → publish-release），含版本一致性校验、Pre-release 自动识别、CHANGELOG 自动提取 Release Notes

#### 2.7 Game.ts 拆分
- **新建**: [GameSerializer.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameSerializer.ts)
- **方案**: 提取存档序列化系统（gameReplacer / reviver / restorePrototypes / validateSaveIntegrity / serializeAndSave / loadAndDeserialize / rollbackToFateDivergence）至独立文件，Game.ts 中保留薄委托方法

### 阶段 3：场景测试

#### 2.8 新增场景测试
- **新建**: [AssetDownload.scenario.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/AssetDownload.scenario.test.ts)
- **覆盖**: SCEN-ASSET-DOWNLOAD-LOOP（4 项）+ SCEN-ASSET-MANIFEST-GEN（7 项）= 11 项测试

## 三、验证计划

| 验证项 | 命令 | 预期 |
|--------|------|------|
| TypeScript 类型检查 | `npx tsc --noEmit` | 0 错误 |
| 全量测试 | `npm test` | 44 文件 / 886 测试全部通过 |
| Manifest 重新生成 | `npm run generate-manifest` | uncategorized 占比 < 10% |
| extract-changelog 脚本 | `bash tools/extract-changelog.sh v0.9.0-beta` | 正确提取内容 |

## 四、排除项

- 文档总数膨胀（184 份）🔴 — 按用户指示不处理游戏文档
- 设计文档 vs 代码一致性（3 处偏离）🟡 — 非本次范围