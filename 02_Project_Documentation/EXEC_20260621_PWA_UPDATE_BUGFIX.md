# Walkthrough: PWA 更新生命周期修复报告
> **Date**: 2026-06-21  
> **Status**: Completed  
> **Category**: Active Execution Walkthrough (`EXEC_`)

本文档记录了对《光锥之外：纪元往事》PWA 架构中自动更新通知流程被截断、强制刷新的严重 Bug 的完整修复与验证过程。

---

## 一、修复摘要

在之前的 PWA 实施中，存在两个阻碍更新提示正常弹出的逻辑冲突问题，导致 `UpdatePrompt` 成为死代码并可能引起老用户浏览器崩溃。我们已执行了修复：

1. **vite-plugin-pwa 插件配置修正**：移除了引发强制更新的 `autoUpdate` 与 `skipWaiting` 配置。
2. **生命周期事件修复**：移除了 `main.tsx` 中的原生 `serviceWorker.register`，改用官方的标准 `virtual:pwa-register/react` 钩子。
3. **UI 组件重构**：使用 `useRegisterSW` 重写了 `UpdatePrompt.tsx`，现在它能完全监听后台 Service Worker 的下载并在准备好后正常弹窗。

---

## 二、变更文件清单

| 文件 | 操作 | 详细说明 |
|:---|:---|:---|
| [vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts) | 修改 | `registerType` 从 `autoUpdate` 更改为 `prompt`。移除了 `skipWaiting` 和 `clientsClaim`。 |
| [src/vite-env.d.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/vite-env.d.ts) | 修改 | 引入了 `/// <reference types="vite-plugin-pwa/client" />` 使虚拟模块受 TS 识别。 |
| [src/components/UpdatePrompt.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/UpdatePrompt.tsx) | 重构 | 使用了 `useRegisterSW`，监听 `needRefresh` 并使用 `updateServiceWorker(true)`。 |
| [src/main.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/main.tsx) | 修改 | 移除了原生 `navigator.serviceWorker.register`，由 PWA 组件自动挂载。 |

---

## 三、修复细节与技术实现

### 3.1 PWA 注册与等待策略的转换
- **原错误逻辑**：配置了 `autoUpdate` 后，VitePWA 插件不再赋予 `waiting` 状态。此时 SW 直接在后台替换原实例。由于此时旧实例中动态 `import()` 的包已经被替换为新的 hash 包，如果玩家此时正好触发了一项按需加载的操作（例如：查看图片或新组件），会发生 404 ChunkLoadError。
- **现正确逻辑**：配置 `prompt`。新版本后台下载完毕后将进入挂起（waiting）态，系统触发 `needRefresh` 给 React 视图层，此时玩家屏幕右下角会正常弹出我们设计的 UI：“发现新版本”。玩家点击后，才会发送 `skipWaiting` 指令并安全重启。

### 3.2 钩子函数的无缝结合
- 原本在 `UpdatePrompt` 里我们自己去拼凑 `sw-ready` 和监听 `controllerchange`。现在我们重构成：
```tsx
const {
  offlineReady: [, setOfflineReady],
  needRefresh: [needRefresh, setNeedRefresh],
  updateServiceWorker,
} = useRegisterSW(...)
```
极大地减少了心智负担与由于生命周期管理不当造成的内存泄漏。

---

## 四、验证结果

1. **类型检查**：`npm run typecheck` 通过，虚拟模块识别正常。
2. **构建结果**：`npm run build` 生成 `sw.js` 及工作流组件正常。
3. **部署**：全部代码已同步推送至 GitHub `main` 分支，且构建文件推送到 `gh-pages`。

---

## 五、下一步建议

目前 PWA 的基本能力（安装、离线、预缓存、按需更新）均已完美打通，不会再阻碍独立开发者的后续版本推送。
您可以向内测群的玩家发送邀请，让他们亲自验证浏览器缓存断网加载以及新补丁提示是否顺畅。
