# Release / PWA 资源交付修复发布说明

> 日期：2026-07-18  
> 版本基线：v1.0.3 / Unreleased  
> 发布状态：本地门禁通过，跨浏览器矩阵由 GitHub CI 复核

## 1. 发布目标

本次修复将同一套游戏内容按交付渠道明确分为两种资源策略：

- **Web Release / Tauri 桌面版**：约 371MB 扩展资源已经包含在发行包内，启动后直接视为完整安装。
- **PWA**：保持核心先行、扩展资源按需缓存；玩家进入游戏时获得一次明确的下载选择提醒。

游戏逻辑、事件内容、存档格式不因发行渠道改变。

## 2. 玩家可见变化

### Release

- 不再出现“下载约 370MB 扩展数据包”的误导弹窗。
- 设置中的资源状态直接显示全部随包资源已安装。
- 纪元更替不会再次读取全部随包资源模拟网络下载。
- PWA Service Worker 更新提示不在桌面发行包中挂载。

### PWA

- 以下任一入口进入游戏后都会检查资源状态：
  1. 开始无教程的新游戏；
  2. 完成新手教程；
  3. 继续已有存档。
- 仅当存在待下载包且玩家尚未处理过提醒时显示下载弹窗。
- 玩家仍可选择全量缓存、个性化下载或暂不下载并按纪元获取。

## 3. 技术交付

- `public/distribution.json` 默认标记 PWA 渠道。
- GitHub Release 的 Web Archive 在压缩前将渠道标记改为 `release`。
- Tauri 通过 `window.__TAURI_INTERNALS__` 识别完整资源桌面环境。
- `AssetLoader` 在 Release 渠道短路下载队列，并将清单中的扩展包报告为已完成。
- Workbox 不预缓存渠道标记，确保读取的是实际部署产物，而非构建时默认值。
- Tauri 显示版本同步为 `1.0.3`。

## 4. 验收门禁

| 验收项 | 预期 |
|---|---|
| PWA 未处理提醒且有待下载包 | 进入游戏显示下载提醒 |
| PWA 已处理提醒或无待下载包 | 不重复显示 |
| Web Release | 不显示下载提醒，资源状态全部完成 |
| Tauri Release | 不显示下载提醒，且无需请求渠道清单 |
| Release 下载操作 | 不触发扩展资源 fetch |
| 生产构建 | TypeScript 与 Vite 构建通过 |

自动化证据由 `SCEN-DISTRIBUTION-ASSET-POLICY` 和既有 `SCEN-ASSET-DOWNLOAD-LOOP`、`SCEN-ASSET-MANIFEST-GEN` 共同覆盖。

本地验收结果：

- Vitest：53 个测试文件、1078 项测试全部通过。
- 生产构建：TypeScript 与 Vite/PWA 构建通过，Service Worker 预缓存中不包含 `distribution.json`。
- Chromium 实测：PWA 首次进入显示下载提醒；切换为 Release 渠道后同一路径不显示提醒。
- Playwright 全套 runner：本机 Chromium 149 在录像上下文清理阶段超时，页面断言执行前后的快照正常；正式跨浏览器结果以 GitHub CI 环境为准。

## 5. 发布流水线说明

推送普通分支只更新代码，不会创建正式 Release。正式发布仍遵循既有流程：同步版本与 CHANGELOG，推送 `v*` 标签，由 `.github/workflows/release.yml` 执行 CI Gate、Web Archive、Tauri 构建和 GitHub Release 发布。
