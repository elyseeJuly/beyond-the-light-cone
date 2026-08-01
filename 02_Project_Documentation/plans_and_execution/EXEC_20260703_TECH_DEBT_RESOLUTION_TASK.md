# 技术债务批量清偿 — 任务进度清单

> **版本号**: V1.0.0
> **生效日期**: 2026-07-03
> **关联方案**: EXEC_20260703_TECH_DEBT_RESOLUTION_PLAN.md

## 阶段 1：审计 RED 条目修复

- [x] 修复 generate-manifest.mjs：扩展 detectEra 算法 + 版本号从 package.json 读取
- [x] 修复 AssetLoader.ts：扩展 eraOrder 到 7 个纪元
- [x] 修复 Game.ts：接入 assetLoader 纪元下载与预加载逻辑
- [x] 修复 SettingsModal.tsx：版本号从 package.json 读取
- [x] 新建 src/utils/version.ts：统一版本号来源
- [x] 新建 AssetDownload.scenario.test.ts：11 项场景测试
- [x] 重新生成 asset_manifest.json 验证分类覆盖率
- [x] 运行全量测试验证（886/886 passed）

## 阶段 2：遗留债务修复

- [x] 新建 FlagManager.ts：封装 flags Set<string>
- [x] 集成 FlagManager 到 Game.ts（共享引用，100% 存档兼容）
- [x] 更新 gameReplacer 排除列表，添加 flagManager 排除
- [x] 更新 restorePrototypes 迁移逻辑
- [x] 新建 .github/workflows/release.yml：Tag-Driven 4 Job 流水线
- [x] 新建 tools/extract-changelog.sh：CHANGELOG 版本提取
- [x] 新建 tools/sync-version.sh：版本号一键同步
- [x] 验证 extract-changelog.sh 功能正常
- [x] 新建 GameSerializer.ts：提取存档序列化系统（268 行）
- [x] 重构 Game.ts 静态方法为薄委托（1900→1721 行）
- [x] 清理 Game.ts 未使用导入（TecTree, TecTreeManager, SaveDataCorruptedError）
- [x] 运行类型检查确认 0 错误
- [x] 运行全量测试确认 886/886 通过

## 阶段 3：活文档更新

- [x] 更新 _registry.md：2 个 RED→GREEN + 新增 2 个 GREEN 条目（13 总计）
- [x] 更新 _health.md：3🔴 修复为 0🔴，总体健康 🔴→🟢

## 阶段 4：文档归档

- [x] 创建 EXEC_20260703_TECH_DEBT_RESOLUTION_PLAN.md
- [x] 创建 EXEC_20260703_TECH_DEBT_RESOLUTION_TASK.md
- [x] 创建 EXEC_20260703_TECH_DEBT_RESOLUTION_WALKTHROUGH.md
- [ ] 同步至 GitHub