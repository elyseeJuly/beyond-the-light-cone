# REPORT_20260710_GITHUB_RELEASE_LOCAL_WORKFLOW
> **版本号**: V1.0.0
> **生效日期**: 2026-07-10
> **归档类型**: 发布流程经验报告
> **关联项目**: Beyond-the-Light-Cone (光锥之外：纪元往事)

---

## 一、 问题背景

在 2026-07-03 至 2026-07-10 期间，Beyond-the-Light-Cone 项目完成了从 v1.0.0 到 v1.0.2 的本地发布流程，期间遇到了多个典型的发布阻塞问题：

1. **版本号不一致导致 CI 失败**：`asset_manifest.json` 硬编码版本 1.0.0 与 `package.json` 1.0.1 不一致，AssetDownload 场景测试断言失败
2. **E2E 测试断言与实际 UI 不匹配**：归档视图标题、移动端教程按钮文本与代码实现存在偏差
3. **Cloudflare 部署构建跳过**：纯静态 assets 托管模式下 Cloudflare Pages 跳过 `build.command`

本报告总结在本地完成 v1.0.2 发布的完整流程与关键经验，为后续发布提供可复用的操作模板。

---

## 二、 发布阻塞问题深度剖析

### 2.1 版本号不一致（v1.0.1 Gate 失败）

**问题表现**：
- CI Gate job 失败，错误：`manifest.version (1.0.0) !== pkg.version (1.0.1)`
- AssetDownload.scenario.test.ts 断言失败

**根因分析**：
- `package.json` 版本号更新为 1.0.1 后，未重新运行 `npm run generate-manifest` 同步 `asset_manifest.json`
- `asset_manifest.json` 中的 `version` 字段从 `package.json` 读取，但生成后是静态快照

**正确做法**：
```bash
# 修改 package.json 版本号后，必须重新生成 manifest
npm run generate-manifest
# 确认 manifest.version 与 package.json 版本一致
grep '"version"' public/asset_manifest.json package.json
```

### 2.2 E2E 测试断言与 UI 不匹配

**问题表现**：
- `core-flow.spec.ts` 归档视图标题断言为 `"Chronicles"`，实际为 `"岁月史书"`
- `tutorial-guided.spec.ts` 移动端教程结束按钮断言为 `"开始游戏"`，实际为 `"开始"`

**根因分析**：
- E2E 测试硬编码了英文文本，但 UI 实际显示中文
- 移动端按钮文本在不同分辨率下有自适应变化

**正确做法**：
- E2E 断言应与实际 UI 文本一致（中文项目使用中文断言）
- 或使用 `getByRole('button', { name: /开始/ })` 正则匹配

### 2.3 Cloudflare 部署构建跳过

**问题表现**：
- Cloudflare Pages 部署成功但无构建产物，页面空白
- 构建日志显示跳过了 `build.command`

**根因分析**：
- Cloudflare Pages 的 "Direct Upload" 模式会跳过构建，直接上传源码
- 需要在 `wrangler.jsonc` 中配置 `"main": "src/worker.js"` 强制触发 Worker 模式

**正确做法**：
```jsonc
// wrangler.jsonc
{
  "name": "beyond-the-light-cone",
  "main": "src/worker.js",  // 强制 Worker 模式
  "assets": {
    "directory": "./dist"
  }
}
```

---

## 三、 本地发布完整流程（v1.0.2 实践模板）

### 3.1 发布前准备（Pre-release Checklist）

```bash
# 1. 确保工作区干净
git status --short
# 应为空或有明确意图的改动

# 2. 全量测试通过
cd 03_Web_Rebuild
npx vitest run
# 应为 "Tests  passed (0 failed)"

# 3. TypeScript 编译通过
npx tsc --noEmit
# 应无错误

# 4. 本地构建通过
npm run build
# 应成功生成 dist/ 目录
```

### 3.2 版本号与 CHANGELOG 更新

```bash
# 1. 更新 package.json 版本号（手动编辑或 npm version patch）
# package.json: "version": "1.0.2" -> "1.0.3"

# 2. 更新 CHANGELOG.md（在 [Unreleased] 后插入新版本）
# 格式参考：SPEC_20260702_GITHUB_RELEASE_PLAN.md

# 3. 重新生成 asset_manifest.json
npm run generate-manifest

# 4. 验证版本号一致
grep '"version"' public/asset_manifest.json package.json
```

### 3.3 Git 提交与打 Tag

```bash
# 1. 暂存所有发布相关文件
git add -A

# 2. 确认暂存内容正确
git status --short
# 应包含：package.json, CHANGELOG.md, asset_manifest.json, 活文档等

# 3. 提交（使用规范化的 commit message）
git commit -m "release: v1.0.2 — E2E tests and Cloudflare deployment fixes

# 修复内容摘要
- fix(e2e): correct archive view title assertion to '岁月史书'
- fix(e2e): correct mobile tutorial button text assertion to '开始'
- fix(manifest): sync asset_manifest.json version with package.json
- fix(cf): add minimal worker entry to trigger Cloudflare build

# 验证
- vitest: 1045/1045 passed
- TypeScript: 0 errors"

# 4. 打版本 Tag
git tag v1.0.2

# 5. 推送提交和 Tag
git push && git push origin v1.0.2
```

### 3.4 验证 CI 流水线

```bash
# 1. 观察 GitHub Actions 工作流
# https://github.com/<user>/<repo>/actions

# 2. 确认 Gate job 通过（测试 + TypeScript）
# 3. 确认 build-web job 通过（Vite 构建）
# 4. 确认 publish-release job 通过（创建 GitHub Release）
```

---

## 四、 发布流程关键不变量（Release Invariants）

基于 v1.0.0 ~ v1.0.2 的发布经验，归纳出以下**必须遵守的不变量**：

| ID | 不变量 | 违反后果 | 强制检查 |
|----|--------|---------|---------|
| REL-INV-00 | 全量测试必须通过 | CI Gate 失败 | `npx vitest run` |
| REL-INV-01 | TypeScript 必须编译通过 | CI Gate 失败 | `npx tsc --noEmit` |
| REL-INV-02 | `package.json` 与 `asset_manifest.json` 版本号必须一致 | AssetDownload 测试失败 | `grep '"version"'` |
| REL-INV-03 | CHANGELOG.md 必须包含新版本条目 | 发布说明缺失 | 手动检查 |
| REL-INV-04 | 必须先 commit 再 tag | Tag 指向错误提交 | `git log v1.0.x --oneline -1` |
| REL-INV-05 | Tag 必须单独推送（`git push origin v1.0.x`） | CI 不触发 | `git push origin --tags` |

---

## 五、 活文档更新检查清单

每次发布时，必须检查并更新以下活文档：

| 文档 | 路径 | 更新时机 |
|------|------|---------|
| `_registry.md` | `src/test/scenarios/_registry.md` | 新增/修改场景测试时 |
| `_health.md` | `src/test/scenarios/_health.md` | 项目健康维度变化时 |
| `EXEC_20260624_PROJECT_STATUS_BOARD.md` | `02_Project_Documentation/` | 测试数量、任务状态变化时 |
| `CHANGELOG.md` | 项目根目录 | **每次发布必须** |
| `asset_manifest.json` | `public/` | **每次版本号变更必须** |

---

## 六、 常见问题与解决方案

### Q1: 发布后发现版本号写错了怎么办？

```bash
# 1. 本地回退（未推送时）
git reset --hard HEAD~1
git tag -d v1.0.x

# 2. 已推送但未发布时
git push --force origin main
git push origin --delete v1.0.x
git tag v1.0.x
git push origin v1.0.x

# 3. 已发布时（有 Release 资产）
# 只能发布新版本修复，不能删除已发布版本
```

### Q2: CI Gate 失败但本地测试通过？

```bash
# 1. 检查 Node 版本一致性
node --version
# 应与 CI 环境一致（参考 .nvmrc 或 package.json engines）

# 2. 清理缓存重新安装
rm -rf node_modules package-lock.json
npm install

# 3. 重新运行测试
npx vitest run
```

### Q3: Cloudflare 部署成功但页面空白？

```bash
# 1. 检查 dist/ 目录是否存在且包含 index.html
ls -la dist/

# 2. 检查 wrangler.jsonc 配置
cat wrangler.jsonc | grep -A3 '"assets"'

# 3. 强制触发构建（添加最小 Worker 入口）
# 参见 SPEC_20260707_DEPLOYMENT_INVARIANTS_V2.md
```

---

## 七、 参考文档

- [SPEC_20260702_GITHUB_RELEASE_PLAN.md](./SPEC_20260702_GITHUB_RELEASE_PLAN.md) — 版本发布流程规范
- [WFLOW_20260707_RELEASE_SMOKE_TEST.md](./WFLOW_20260707_RELEASE_SMOKE_TEST.md) — 冒烟测试与发布门禁 SOP
- [SPEC_20260707_DEPLOYMENT_INVARIANTS_V2.md](./guides/SPEC_20260707_DEPLOYMENT_INVARIANTS_V2.md) — Web 部署不变量