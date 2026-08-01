# RELEASE_20260722_PWA_AUTOMATED_RELEASE_FLOW

> 生效日期：2026-07-22
> 状态：已实施

## 发布规则

| 操作 | 自动结果 | 不会发生的事 |
| --- | --- | --- |
| 合并并推送至 `main` | 构建 PWA、校验版本契约、发布 GitHub Pages、在线核验 `asset_manifest.json` | 不创建桌面安装包或 GitHub Release |
| 推送 `vX.Y.Z` 标签 | 通过门禁后构建 Web 压缩包与 Tauri 安装包，发布 GitHub Release | 不替代 `main` 的 PWA 发布 |

## 防错契约

`verify:pwa-release` 在 CI、Pages 发布和 tag Release 门禁中检查：

1. `package.json`、`public/asset_manifest.json` 与 `dist/asset_manifest.json` 的版本完全一致。
2. PWA 产物保留 `distribution.json: {"channel":"pwa"}`。
3. `sw.js` 包含资源清单预缓存和 `SKIP_WAITING` 激活协议。
4. Pages 部署结束后，工作流轮询公开 `asset_manifest.json`；只有线上返回预期版本才通过。

## 玩家可见行为

发现 Service Worker 更新时，游戏提示会同时展示当前版本和目标版本。玩家确认后才激活新 Service Worker 并刷新；不会强制中断当前游戏。

## 操作边界

版本号修改在未合并到 `main` 前不会进入线上 PWA。创建 tag 前需先确认对应提交已在 `main`，避免下载版和线上 PWA 指向不同代码。
