# PWA 开发方案与多平台部署指南
> **Date**: 2026-06-22
> **Status**: Implemented
> **Category**: Specifications & Design Systems (`SPEC_`)
> **Scope**: 03_Web_Rebuild/（React 19 + TypeScript 5 + Vite 8）

本方案总结《光锥之外：纪元往事》在 PWA 化过程中沉淀的实践经验，涵盖安装性、离线运行、自动更新、多平台部署与常见陷阱。任何后续维护者或 forks 应以此文档为基准进行 PWA 相关改动。

---

## 1. 设计目标

| 目标 | 要求 |
|:---|:---|
| **离线优先** | 核心功能在无网络下必须可用：新游戏、读档、存档、科技树、事件系统、胜利判定、结局系统 |
| **单机体验** | 游戏作为本地单机应用运行，禁止依赖网络才能进入主界面 |
| **跨平台安装** | 支持 iPhone / iPad / Android / Windows / macOS 添加到主屏幕或安装为桌面应用 |
| **可控更新** | 新版本后台下载完成后提示用户，禁止强制刷新导致游戏中断 |
| **多平台部署** | 同一套构建产物需同时适配 GitHub Pages（子路径）与 Cloudflare Workers（根路径） |

---

## 2. 技术选型

| 层级 | 技术 | 说明 |
|:---|:---|:---|
| 构建工具 | Vite 8 | 原生 ESM 构建，PWA 插件集成 |
| PWA 插件 | `vite-plugin-pwa` 1.3 | 生成 Service Worker、Manifest、Workbox 运行时缓存 |
| SW 模式 | `generateSW` | 由插件根据配置自动生成 `sw.js`，无需手写 SW |
| 注册策略 | `registerType: 'prompt'` | 新版本进入 `waiting` 状态后由 UI 提示用户 |
| 注册钩子 | `virtual:pwa-register/react` | 官方 React 钩子 `useRegisterSW`，生命周期可控 |
| 本地存储 | IndexedDB（主）+ localStorage（索引/legacy）| 大存档存 IndexedDB，小元数据存 localStorage |
| 资源清单 | `asset_manifest.json` | 运行时按需加载的 CG/音频/角色立绘清单 |

---

## 3. 核心配置

### 3.1 Vite 基础路径

必须采用相对路径，避免子路径与根路径部署冲突：

```typescript
// vite.config.ts
const basePath = process.env.CF_PAGES === '1' ? '/' : './';

export default defineConfig({
  base: basePath,
  // ...
});
```

- `CF_PAGES === '1'`：Cloudflare Pages 环境使用根路径 `/`
- 其他环境（GitHub Pages、Cloudflare Workers）：使用 `./` 相对路径
- 所有 Manifest icons、`index.html` 资源引用、路由链接均使用相对路径

### 3.2 VitePWA 插件配置

```typescript
VitePWA({
  registerType: 'prompt',
  includeAssets: ['icons/*.png'],
  manifest: {
    name: '光锥之外：纪元往事',
    short_name: '光锥之外',
    description: '基于《三体》世界观改编的4X策略游戏',
    lang: 'zh-CN',
    display: 'standalone',
    orientation: 'landscape',
    theme_color: '#0B1020',
    background_color: '#0B1020',
    start_url: basePath,
    scope: basePath,
    icons: [
      { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,json,woff2,woff,ttf,eot,svg}'],
    runtimeCaching: [
      // 图片：CacheFirst 90天
      {
        urlPattern: /\/(?:images|cg|characters)\/.*\.(?:png|webp|jpg|jpeg|gif)/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'game-images',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 },
        },
      },
      // 音频：StaleWhileRevalidate 90天
      {
        urlPattern: /\/(?:audio|music|sfx)\/.*\.(?:mp3|ogg|wav)/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'game-audio',
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 90 },
        },
      },
      // 本地字体：CacheFirst 1年
      {
        urlPattern: /\/(?:fonts)\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'game-fonts',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      // Google Fonts CDN
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
    ],
    cacheId: 'beyond-light-cone-v1.0.0',
    cleanupOutdatedCaches: true,
  },
});
```

关键约束：
- **禁止**使用 `registerType: 'autoUpdate'`：会导致旧 SW 立即被替换，玩家点击按需加载的 chunk 时可能触发 404 ChunkLoadError
- **禁止**手动设置 `skipWaiting` / `clientsClaim`：交由 `useRegisterSW` 在玩家确认更新后调用
- `globPatterns` 仅预缓存核心包体（JS/CSS/HTML/JSON/字体），**不预缓存**大型 CG 与音频

### 3.3 HTML 入口标签

```html
<meta name="theme-color" content="#0B1020" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="光锥之外" />
<meta name="application-name" content="光锥之外" />
<meta name="mobile-web-app-capable" content="yes" />
<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192x192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="icons/icon-512x512.png" />
<link rel="manifest" href="./manifest.webmanifest" />
```

iOS 安装关键约束：
- `apple-touch-icon` 必须提供 **180×180** 尺寸文件
- `sizes="180x180"` 中的声明尺寸必须与实际图片像素一致，否则 iOS 会回退到默认图标
- 文件名建议使用 `apple-touch-icon.png`，与 192/512 图标分开管理

### 3.4 Service Worker 注册

**禁止**在 `main.tsx` 中手写 `navigator.serviceWorker.register`。统一使用 `UpdatePrompt` 组件中的官方钩子：

```tsx
// src/components/UpdatePrompt.tsx
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdatePrompt: React.FC = () => {
  const {
    offlineReady: [, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) { console.log('[PWA] SW Registered', r); },
    onRegisterError(error) { console.error('[PWA] SW registration error', error); },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[10000]">
      <p>发现新版本</p>
      <button onClick={() => updateServiceWorker(true)}>立即更新</button>
      <button onClick={() => setNeedRefresh(false)}>稍后提醒</button>
    </div>
  );
};
```

---

## 4. 离线存储架构

### 4.1 存档系统

使用 **IndexedDB 单一数据源**，localStorage 仅保留 `save_index` 与 legacy 兼容读取。

```
SaveManager
  ├── saveToSlot(slotId, data)
  │     └── IndexedDB（异步主存）
  ├── loadFromSlot(slotId)
  │     └── IndexedDB（异步读取）
  ├── listSlots()
  │     └── localStorage save_index（同步目录）
  └── autoSave(data)
        └── 写入 autosave 槽位
```

槽位规范：
- `autosave`：自动存档
- `slot1` / `slot2` / `slot3`：手动存档

### 4.2 资源分层缓存

| 层级 | 资源类型 | 策略 | 说明 |
|:---|:---|:---|:---|
| Layer 1 - 核心预缓存 | JS/CSS/HTML/JSON/字体/图标 | precache | 构建时写入 `sw.js`，永不删除 |
| Layer 2 - 可替换缓存 | CG/立绘/结局图 | CacheFirst 90天 | 运行时按需下载，优先读缓存 |
| Layer 2 - 可替换缓存 | BGM/音效 | StaleWhileRevalidate 90天 | 保证播放不中断 |
| Layer 3 - 临时缓存 | asset_manifest.json / patches | NetworkFirst | 总是验证最新 |

### 4.3 启动流程

```
用户启动
  → 初始化 IndexedDB
  → 初始化 AssetLoader（读取 asset_manifest.json）
  → 初始化 PatchManager（应用待处理补丁）
  → 启动 Game 引擎
  → 渲染 React UI
  → UpdatePrompt 自动注册 SW
```

---

## 5. 多平台部署

### 5.1 GitHub Pages

| 项目 | 配置 |
|:---|:---|
| 发布分支 | `gh-pages` |
| 子路径 | `/beyond-the-light-cone/` |
| 构建命令 | `npm run build` |
| 部署命令 | `npm run deploy`（内部使用 `gh-pages -d dist`）|

### 5.2 Cloudflare Workers

| 项目 | 配置 |
|:---|:---|
| 部署方式 | Static Assets |
| 构建命令 | `cd 03_Web_Rebuild && npm run build` |
| 部署命令 | `cd 03_Web_Rebuild && npx wrangler versions upload --assets ./dist` |
| 配置文件 | `03_Web_Rebuild/wrangler.jsonc` |

```json
{
  "name": "beyond-the-light-cone",
  "compatibility_date": "2026-06-22",
  "assets": {
    "directory": "./dist"
  }
}
```

部署验证标准：
- 日志必须出现 `Read xxx files from assets directory ./dist`
- `Total Upload` 应为 MB 级别（若仅为 0.33 KiB，说明 assets 目录未正确指向 dist）

### 5.3 部署命令速查

```bash
# 本地开发
cd 03_Web_Rebuild
npm run dev

# 构建生产版本
npm run build

# GitHub Pages
npm run deploy

# Cloudflare Workers
npm run deploy:cf
```

---

## 6. 测试验证清单

### 6.1 自动化测试

```bash
cd 03_Web_Rebuild
npm run typecheck
npm run test
npm run build
```

### 6.2 手动安装性测试

| 编号 | 平台 | 浏览器 | 验证项 |
|:---|:---|:---|:---|
| T1 | iPhone | Safari | 分享 → 添加到主屏幕 → 显示自定义图标 → 全屏启动 |
| T2 | iPad | Safari | 同上，验证横屏与离线 |
| T3 | Android | Chrome | 菜单 → 安装应用 → 图标与全屏 |
| T4 | Windows | Chrome/Edge | 地址栏安装图标 → 独立窗口运行 |
| T5 | macOS | Chrome | 同上 |

### 6.3 离线功能测试

| 编号 | 场景 | 操作 | 预期 |
|:---|:---|:---|:---|
| T6 | 飞行模式启动 | 断网后从主屏幕启动 | 进入主菜单 |
| T7 | 断网新游戏 | 飞行模式下开始新游戏 | 正常运行 |
| T8 | 断网读档 | 飞行模式下加载已有存档 | 成功 |
| T9 | 断网结局 | 飞行模式下达成结局 | 正常播片并记录 |
| T10 | 更新提示 | 部署新版本后重新打开 | 右下角出现"发现新版本"提示 |

---

## 7. 常见陷阱与解决方案

### 7.1 iOS 安装后显示默认图标

- **原因**：`apple-touch-icon` 声明的 `sizes` 与实际图片像素不一致
- **解决**：单独生成 180×180 的 `apple-touch-icon.png`，`index.html` 中 `sizes="180x180"`

### 7.2 Cloudflare Workers 部署白屏 / Total Upload 仅 0.33 KiB

- **原因 1**：`wrangler.jsonc` 不在 `03_Web_Rebuild/` 目录，或 `assets.directory` 路径错误
- **原因 2**：部署命令未加 `--assets ./dist`，wrangler 未读取配置中的 directory
- **原因 3**：Vite `base` 硬编码为 `/beyond-the-light-cone/`，Workers 根路径下资源 404
- **解决**：`wrangler.jsonc` 放 `03_Web_Rebuild/`，`base: './'`，命令加 `--assets ./dist`

### 7.3 玩家遇到 404 ChunkLoadError

- **原因**：使用 `autoUpdate` 后 SW 被立即替换，旧页面引用的按需 chunk hash 已失效
- **解决**：改为 `registerType: 'prompt'`，由玩家确认后再 `skipWaiting`

### 7.4 Service Worker 注册失败

- **原因**：`main.tsx` 中手写 `navigator.serviceWorker.register` 与 `vite-plugin-pwa` 冲突
- **解决**：移除手写注册，统一使用 `useRegisterSW`

### 7.5 存档在清理浏览器数据后丢失

- **原因**：未使用 IndexedDB，或 localStorage 被当作主存储
- **解决**：大存档写入 IndexedDB，localStorage 仅保留索引与 legacy 兼容读取

---

## 8. 文件地图

| 文件 | 职责 |
|:---|:---|
| [vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts) | PWA 插件、Manifest、Workbox 缓存策略、base 路径 |
| [index.html](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/index.html) | PWA Meta 标签、图标链接、manifest 链接 |
| [src/main.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/main.tsx) | 应用启动流程（IndexedDB / AssetLoader / Game / UI）|
| [src/components/UpdatePrompt.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/UpdatePrompt.tsx) | SW 注册与更新提示 |
| [src/components/OrientationPrompt.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/OrientationPrompt.tsx) | 移动端横屏提示 |
| [src/core/SaveManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/SaveManager.ts) | IndexedDB 存档管理 |
| [src/core/IndexedDBStorage.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/IndexedDBStorage.ts) | IndexedDB 存储引擎 |
| [src/core/AssetLoader.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AssetLoader.ts) | 运行时资源清单加载 |
| [wrangler.jsonc](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/wrangler.jsonc) | Cloudflare Workers 静态资源目录配置 |
| [package.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/package.json) | deploy / deploy:cf 脚本 |

---

## 9. 相关文档

- [SPEC_20260621_PWA_UPGRADE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260621_PWA_UPGRADE.md) — PWA 升级规范与架构设计
- [EXEC_20260621_PWA_UPGRADE_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260621_PWA_UPGRADE_WALKTHROUGH.md) — PWA 升级实施记录
- [EXEC_20260621_PWA_UPDATE_BUGFIX.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260621_PWA_UPDATE_BUGFIX.md) — 自动更新生命周期修复报告
- [SPEC_20260519_DOCUMENTATION_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260519_DOCUMENTATION_STANDARDS.md) — 项目文档命名规范
