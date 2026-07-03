# GitHub Release 版本发布更新机制与自动化部署流水线规划
> 根据 2026-07-03 AI 讨论记录整理归档

## 1. 现状盘点

当前项目已有的基础设施：
- ✅ `SPEC_20260702_GITHUB_RELEASE_PLAN.md` — 规定了 SemVer 规范、CHANGELOG 格式及手动发布流程。
- ✅ `CHANGELOG.md` — 已有 `v0.9.0-beta` 记录。
- ✅ `.github/workflows/ci.yml` — CI 验证（typecheck / test / build / E2E）。
- ✅ `.github/workflows/static.yml` — GitHub Pages 自动部署。
- ✅ Tauri 2 打包配置（Win x86_64 + macOS aarch64）。

**缺的核心部分**：一套「推 Tag → 自动跑 CI → 自动构建多平台产物 → 自动发 GitHub Release 并附带资产」的自动化 workflow，目前完全是手动的。

## 2. 方案设计：Tag-Driven Release Pipeline

核心理念：**推 `v*` tag 即触发全自动发布**，人类只需要做两件事——写 CHANGELOG、打 tag。

### 2.1 流程总览

```text
开发者本地操作                     GitHub Actions 自动执行
─────────────                    ─────────────────────
1. 开发完毕，更新 CHANGELOG.md
2. 同步 package.json / Cargo.toml / tauri.conf.json 中的版本号
3. git commit → git tag v1.1.0
4. git push origin main --tags
                                 ┌──────────────────────────┐
                                 │  release.yml 被触发       │
                                 │                          │
                                 │  ① 门禁 Job: CI 验证     │
                                 │     typecheck + test     │
                                 │     + build + E2E        │
                                 │              │           │
                                 │         通过 ↓ 失败→中止  │
                                 │                          │
                                 │  ② 并行构建 3 个 Job:     │
                                 │     ├─ Web 产物 (dist/)   │
                                 │     ├─ Tauri Win x86_64  │
                                 │     └─ Tauri macOS ARM   │
                                 │              │           │
                                 │         全部完成 ↓         │
                                 │                          │
                                 │  ③ 发布 Job:             │
                                 │     自动创建 GitHub Release│
                                 │     + 从 CHANGELOG 提取   │
                                 │       Release Notes      │
                                 │     + 上传 .msi / .dmg   │
                                 │     + 附 Pages 在线链接   │
                                 │     + pre-release 自动判断│
                                 └──────────────────────────┘
```

## 3. 需要新建/修改的文件

### 3.1 新建 `.github/workflows/release.yml`

这是核心，由 `v*` tag push 触发，包含 4 个 Job：

| Job | 运行环境 | 职责 |
|:---|:---|:---|
| **gate** | `ubuntu-latest` | CI 门禁：typecheck + vitest + vite build + playwright E2E，全过才放行 |
| **build-web** | `ubuntu-latest` | 构建 Web 产物 zip（给想自部署的人），同时触发 Pages 部署 |
| **build-tauri** | matrix: `[ubuntu-latest, macos-latest]` | Tauri 多平台构建，产出 `.msi` (NSIS) / `.dmg` |
| **publish-release** | `ubuntu-latest` | 收集所有产物，从 CHANGELOG 自动提取对应版本的 Release Notes，创建 GitHub Release 并挂载资产 |

**关键设计细节**：
- **Pre-release 自动识别**：如果 tag 含 `-alpha` / `-beta` / `-rc`，自动标记为 pre-release。
- **Release Notes 提取**：用脚本从 `CHANGELOG.md` 中按 tag 版本号精确切割对应段落，无需手写。
- **版本号一致性校验**：`gate` job 中增加一步，检查 tag 版本号与配置文件版本号是否一致，不一致直接报错。
- **Tauri 跨平台**：Windows 产物使用 `ubuntu-latest` + cross-compile（或 `windows-latest` runner），macOS 使用 `macos-latest`。

### 3.2 新建 `tools/extract-changelog.sh`

从 CHANGELOG.md 中提取指定版本号的更新内容段落，供 release workflow 调用：

```bash
#!/bin/bash
# 用法: ./tools/extract-changelog.sh v1.0.0
# 输出: 该版本在 CHANGELOG.md 中的完整内容（不含版本标题行）
VERSION=$1
sed -n "/^## \[${VERSION}\]/,/^## \[/p" CHANGELOG.md | sed '$d'
```

### 3.3 新建 `tools/sync-version.sh`（辅助脚本）

一键同步版本号到所有需要的地方：

```bash
#!/bin/bash
# 用法: ./tools/sync-version.sh 1.1.0
VERSION=$1
# package.json
npm version $VERSION --no-git-tag-version --prefix 03_Web_Rebuild
# Cargo.toml
sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" 03_Web_Rebuild/src-tauri/Cargo.toml
# tauri.conf.json
jq ".version = \"$VERSION\"" 03_Web_Rebuild/src-tauri/tauri.conf.json > tmp.json && mv tmp.json 03_Web_Rebuild/src-tauri/tauri.conf.json
# README badge
sed -i '' "s/Version-v[^-]*-/Version-v$VERSION-/" README.md
echo "✅ All version references updated to $VERSION"
```

### 3.4 修改 `.github/workflows/static.yml`

建议保持现状——push main 自动部署 latest，release 只负责打包 + 挂资产。两者不冲突。

## 4. Release 资产清单

每次 GitHub Release 自动附带：

| 文件名 | 说明 |
|:---|:---|
| `BeyondTheLightCone-v{version}-win-x64-setup.exe` | Windows NSIS 安装包 |
| `BeyondTheLightCone-v{version}-win-x64.msi` | Windows MSI 安装包 |
| `BeyondTheLightCone-v{version}-macos-arm64.dmg` | macOS Apple Silicon 安装包 |
| `beyond-the-light-cone-v{version}-web.zip` | Web 版构建产物（可自部署） |
| Source code (zip/tar.gz) | GitHub 自动生成 |

## 5. 版本号管理约定（补充规范）

项目需严格保证以下三处版本号一致：
- `03_Web_Rebuild/package.json` → `version`
- `03_Web_Rebuild/src-tauri/Cargo.toml` → `version`
- `03_Web_Rebuild/src-tauri/tauri.conf.json` → `version`

常见的 Tag 示例：
- Beta 测试：`v0.9.0-beta`, `v0.9.1-beta`
- RC 候选：`v1.0.0-rc.1`
- 正式发布：`v1.0.0`

## 6. 开发者实际操作 Checklist

发版时只需执行：

```bash
# 1. 确保在 main 分支且代码干净
git checkout main && git pull

# 2. 一键同步版本号
./tools/sync-version.sh 1.1.0

# 3. 编辑 CHANGELOG.md，将 [Unreleased] 下的内容移至新版本标题下

# 4. 提交 + 打 tag + 推送
git add -A
git commit -m "release: v1.1.0"
git tag v1.1.0
git push origin main --tags

# 5. 等待 GitHub Actions 自动完成发布
```

## 7. PWA 更新通知机制（玩家侧优化）

结合现有的 PWA + Service Worker，Release 时可实现：
1. **Service Worker 更新检测**：`vite-plugin-pwa` 配置使用 `registerType: 'prompt'`，新版本提供「是否更新」提示。
2. **游戏内版本显示**：设置/关于页面读取 `package.json` 版本号，展示当前版本。
3. **Release Notes In-App**：首加新版弹出“更新日志”模态框。

## 8. 执行优先级建议

1. 🔴 **最高优先**：写 `release.yml` workflow，推 tag 即可全自动发版。
2. 🟠 **高优先**：写 `sync-version.sh` + `extract-changelog.sh`，消除手动改版本号风险。
3. 🟡 **中优先**：`gate` job 增加版本一致性校验。
4. 🟢 **低优先**：PWA 更新提示 + 游戏内版本号展示。
