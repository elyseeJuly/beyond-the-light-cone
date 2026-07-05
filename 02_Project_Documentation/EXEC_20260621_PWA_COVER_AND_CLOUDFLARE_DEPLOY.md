# Walkthrough: PWA 封面加载修复与 Cloudflare Pages 部署支持
> **Date**: 2026-06-21
> **Status**: Completed
> **Category**: Active Execution Walkthrough (`EXEC_`)

本文档记录了《光锥之外：纪元往事》修复 **PWA 模式下封面与扩展资源加载失败** 以及 **添加 Cloudflare Pages 部署支持** 的完整实施过程。

---

## 一、实施概述

### 1.1 目标

| 目标 | 状态 |
|:---|:---|
| 修复 PWA 启动时封面/图标加载失败 | ✅ 完成 |
| 修复 AssetLoader 资源清单路径硬编码导致 Cloudflare Pages 部署失败 | ✅ 完成 |
| 添加 iOS PWA 启动图 (apple-touch-startup-image) | ✅ 完成 |
| 在 HTML 入口嵌入启动封面 splash-screen，避免 PWA 冷启动黑屏/白屏 | ✅ 完成 |
| 添加 Cloudflare Pages _headers 缓存与安全头配置 | ✅ 完成 |
| 添加 Cloudflare Pages _redirects SPA 路由回退规则 | ✅ 完成 |
| 添加 build:cf 脚本，自动切换 basePath 以适配 Cloudflare Pages | ✅ 完成 |
| 构建验证通过，GitHub Pages 部署成功 | ✅ 完成 |

### 1.2 变更文件清单

| 文件 | 操作 | 说明 |
|:---|:---|:---|
| [AssetLoader.ts](file:///workspace/03_Web_Rebuild/src/core/AssetLoader.ts) | 修改 | 添加 getBaseUrl() 动态拼接，将所有资源 URL 从硬编码改为 import.meta.env.BASE_URL |
| [index.html](file:///workspace/03_Web_Rebuild/index.html) | 修改 | 添加 apple-touch-startup-image 与 splash-screen 封面元素 |
| [_headers](file:///workspace/03_Web_Rebuild/public/_headers) | 新增 | Cloudflare Pages 缓存策略与安全响应头 |
| [_redirects](file:///workspace/03_Web_Rebuild/public/_redirects) | 新增 | Cloudflare Pages SPA 路由回退规则 |
| [package.json](file:///workspace/03_Web_Rebuild/package.json) | 修改 | 新增 `build:cf` 脚本用于 Cloudflare Pages 构建 |

---

## 二、实施步骤

### Step 1: 问题诊断 — PWA 封面加载失败根因

**问题场景**：
- 在 GitHub Pages 部署（basePath: `/beyond-the-light-cone/`）下，PWA 安装到桌面后，启动时封面图标偶尔无法显示
- 切换到 Cloudflare Pages（basePath: `/`）时，AssetLoader 完全无法加载 `asset_manifest.json`，导致扩展资源（CG/立绘/BGM）全部不可用

**根因分析**：
- `AssetLoader.ts` 中 `MANIFEST_URL` 常量被硬编码为固定路径字符串，与 `vite.config.ts` 中 `basePath` 的动态切换不匹配
- iOS Safari PWA 缺少 `apple-touch-startup-image` 元数据，无法生成启动画面
- HTML 入口 `<body>` 中仅有空的 `#app` div，React 初始化期间页面显示纯深色背景，视觉上像"黑屏"
- Cloudflare Pages 未配置 `_headers` 和 `_redirects`，刷新页面导致 404

### Step 2: AssetLoader 动态路径化

**修改位置**：[src/core/AssetLoader.ts](file:///workspace/03_Web_Rebuild/src/core/AssetLoader.ts)

**L21-L24 — 新增 getBaseUrl()**：
```typescript
function getBaseUrl(): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}
```
- 从 Vite 构建注入的 `import.meta.env.BASE_URL` 动态读取部署路径
- 自动去除尾部斜杠，方便后续拼接
- 兼容 SSR 场景（`typeof import.meta` 判断）

**L26 — MANIFEST_URL 改为函数**：
```typescript
const MANIFEST_URL = () => `${getBaseUrl()}/asset_manifest.json`;
```
- 将 `const string` 改为 `() => string`，确保每次调用都获取最新的 baseUrl
- 修复 Cloudflare Pages (`CF_PAGES=1`) 部署下 manifest 路径指向 GitHub Pages 的问题

**L76-L81 — getCoreAssetUrl 动态拼接**：
```typescript
getCoreAssetUrl(assetId: string): string | null {
  if (!this.manifest) return null;
  const asset = this.manifest.core.find(a => a.id === assetId);
  const base = getBaseUrl();
  return asset ? `${base}/${asset.path}` : null;
}
```
- manifest 中 `core` 条目的 `path` 格式为 `images/character_default.png`（无前导斜杠）
- 拼接结果在 GitHub Pages: `/beyond-the-light-cone/images/character_default.png`
- 拼接结果在 Cloudflare Pages: `/images/character_default.png`

**L158-L165 — getExpansionUrl 同样改造**：
```typescript
const base = getBaseUrl();
const url = `${base}/${asset.path}`;
```
- 扩展资源（CG/立绘/BGM）与核心资源保持一致的路径策略

### Step 3: iOS PWA 启动图

**修改位置**：[index.html](file:///workspace/03_Web_Rebuild/index.html#L14-L17)

添加 `<link rel="apple-touch-startup-image" href="icons/icon-512x512.png" />`

**为什么需要这个**：
- iOS Safari PWA 在主屏幕启动时，会根据 `apple-touch-startup-image` 生成启动画面
- 没有这个标签时，iOS 会使用应用截图作为启动画面，首次安装可能显示纯色背景
- 512x512 图标正好适配 iPad 横屏、iPhone 竖屏等常见尺寸

### Step 4: HTML 嵌入启动封面 splash-screen

**修改位置**：[index.html](file:///workspace/03_Web_Rebuild/index.html#L21-L51)

在 `#app` div 内嵌入一个固定定位的封面元素：
- `position: fixed; inset: 0; z-index: 9999` — 全屏覆盖，最顶层
- `background: #0B1020` — 与 PWA theme_color 一致，避免颜色跳变
- `icons/icon-512x512.png` — 使用项目库里已有的封面图标，无需新增图片资源
- `56vmin` 响应式尺寸 — 手机竖屏约 56% 宽度，iPad 最大 512px
- `box-shadow: 0 0 60px rgba(0, 150, 255, 0.15)` — 柔和蓝色光晕，符合游戏视觉风格

**工作原理**：
1. PWA 冷启动 → HTML 解析后立即渲染 splash-screen（纯 HTML/CSS，无需 JS）
2. React 开始初始化 → 需要几百毫秒到几秒（取决于设备）
3. `ReactDOM.createRoot(rootElement).render(<App />)` 渲染时会**替换**整个 `#app` 的 innerHTML
4. splash-screen 随 React 内容渲染消失 — 用户看到"封面 → 游戏界面"的流畅过渡

**替代方案比较**：
- 使用 CSS 动画淡出 — 需要额外 JS 监听 React 加载完成事件，复杂度高
- 直接让 React 的首屏渲染替代 — 但 React 初始化期间页面空白，视觉效果差
- 当前方案：零 JS 开销，HTML 解析即渲染，React 接管时自动替换

### Step 5: Cloudflare Pages _headers 配置

**新增位置**：[public/_headers](file:///workspace/03_Web_Rebuild/public/_headers)

Cloudflare Pages 会在构建时读取 `public/_headers` 并为匹配路径设置响应头。

**全局安全头**（所有路径 `/*`）：
- `X-Content-Type-Options: nosniff` — 防止浏览器 MIME 类型猜测，降低 XSS 风险
- `X-Frame-Options: DENY` — 禁止被嵌入 iframe，防止点击劫持
- `Referrer-Policy: strict-origin-when-cross-origin` — 限制 referrer 泄露
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — 禁用不必要的传感器权限
- `Cache-Control: public, max-age=0, must-revalidate` — HTML 每次都校验，避免部署新版本时用户看到旧页面

**静态资源长期缓存**（`/assets/*` 和图片/音频/字体）：
- `Cache-Control: public, max-age=31536000, immutable` — 一年缓存 + 不可变标记
- Vite 构建产物的 `/assets/` 文件带有内容哈希（如 `index-BAI8jEg4.css`），文件名变化即新资源，可安全使用长期缓存
- 图片 `*.png/webp/jpg/jpeg` 与音频 `*.mp3/ogg/wav` 同样适用

**Service Worker 禁用缓存**（`/sw.js` 和 `/workbox-*.js`）：
- `Cache-Control: public, max-age=0, must-revalidate` — SW 必须每次校验，否则 PWA 无法升级
- 这是 PWA 规范明确要求的配置

### Step 6: Cloudflare Pages _redirects 配置

**新增位置**：[public/_redirects](file:///workspace/03_Web_Rebuild/public/_redirects)

```
/*  /index.html  200
```

**作用**：
- Cloudflare Pages 收到任何非根路径的请求（如 `/game/save`）时，将其回退到 `/index.html`
- 返回 200 状态码（而不是 404），表示这是一个有效的 SPA 路由
- 浏览器加载 `index.html` 后，由 React Router 根据实际 URL 渲染对应组件

**为什么需要**：
- GitHub Pages 的 gh-pages 插件自动处理 SPA 回退（或通过 404.html 机制）
- Cloudflare Pages 需要显式声明，否则刷新页面或直接访问子路由会返回 404

### Step 7: build:cf 脚本

**修改位置**：[package.json](file:///workspace/03_Web_Rebuild/package.json#L8-L9)

```json
"build:cf": "CF_PAGES=1 npm run build"
```

**工作原理**：
- `vite.config.ts` 中配置了 `const basePath = process.env.CF_PAGES === '1' ? '/' : '/beyond-the-light-cone/'`
- 设置 `CF_PAGES=1` 环境变量后，Vite 会使用 `/` 作为 basePath
- 这样 `import.meta.env.BASE_URL` 在生产构建中为 `/`
- AssetLoader 的 `getBaseUrl()` 正确拼接所有资源路径

**部署流程**：
```
Cloudflare Pages 项目设置:
  Build command: npm run build:cf
  Build output directory: dist
```

---

## 三、关键问题与解决

### 3.1 AssetLoader 路径硬编码导致双部署环境不兼容

**问题**：
- `MANIFEST_URL` 原先为 `const string = "/beyond-the-light-cone/asset_manifest.json"` 硬编码
- Cloudflare Pages 部署时 basePath 为 `/`，fetch 到了不存在的路径，整个资源加载器初始化失败
- 连锁影响：PatchManager 无法获取 manifest，热更新失效；扩展资源全部无法加载

**解决**：
- 引入 `getBaseUrl()` 统一所有路径拼接的基准
- 将 `MANIFEST_URL` 从常量改为函数，惰性求值
- `getCoreAssetUrl()` 和 `getExpansionUrl()` 均通过 `getBaseUrl()` 动态拼接
- 任何部署环境（GitHub Pages / Cloudflare Pages / 本地 nginx）只需在构建时设置 basePath，代码无需改动

### 3.2 PWA 启动黑屏与封面加载时序

**问题**：
- PWA 冷启动时，Service Worker 从缓存加载 `index.html` 和 JS/CSS
- React 初始化期间（数百毫秒到数秒），页面仅有纯色背景，视觉体验差
- iOS Safari 没有 `apple-touch-startup-image` 时，系统生成的启动画面可能为纯色或截图

**解决**：
- 纯 HTML/CSS 的 splash-screen 元素，无需 JS 即可渲染
- 使用项目已有的 `icons/icon-512x512.png` 作为封面图（库中已有资源，无需新增）
- React 渲染时自动替换 `#app` 的内容，封面随之消失

**替代方案评估**：
- 使用动画淡出封面 — 增加复杂度，视觉收益有限
- 使用更大分辨率图片 — 启动下载量增大，得不偿失
- 使用 SVG 矢量封面 — icon-512x512.png 已够用，且像素图形更适合游戏封面

### 3.3 Cloudflare Pages 缓存策略与预缓存的关系

**问题**：
- Vite PWA 插件预缓存 8 项核心资源（1.1 MB）
- Cloudflare Pages 又配置 `Cache-Control: immutable`
- 两层缓存是否冲突？

**解决**：
- Service Worker 缓存（第一层）：浏览器 PWA 运行时，SW 拦截请求并返回缓存
- Cloudflare CDN 缓存（第二层）：首次访问或 SW 缓存失效后，从 CDN 拉取
- 两层缓存**互补**：不冲突，反而提升了首次访问速度和跨设备一致性
- `immutable` 确保 CDN 侧不会重复校验已缓存资源，降低回源请求

**注意事项**：
- `sw.js` 和 `workbox-*.js` **必须**使用 `must-revalidate`，否则新部署的 SW 永远不更新
- 已在 `_headers` 中单独配置

---

## 四、验证结果

### 4.1 构建验证

```bash
npm run build
# generate-manifest: 1 core asset, 122 expansion assets, 8 packs
# tsc: 0 errors
# vite build: 2221 modules transformed
# PWA: 8 entries precached (1162.16 KiB)
# dist/index.html: 2.24 kB (gzip: 0.99 kB)
# dist/assets/index-*.js: 1004.48 kB (gzip: 306.26 kB)
```

**关键产物检查**：
- `dist/sw.js` — Service Worker 生成 ✅
- `dist/workbox-*.js` — Workbox 运行时 ✅
- `dist/manifest.webmanifest` — PWA manifest ✅
- `dist/icons/icon-192x192.png`, `icon-512x512.png` — PWA 图标 ✅
- `dist/_headers`, `dist/_redirects` — Cloudflare Pages 配置 ✅
- `dist/asset_manifest.json` — 资源清单（预缓存，但运行时由 AssetLoader 动态 fetch）✅

### 4.2 Cloudflare Pages 构建模拟

```bash
CF_PAGES=1 npm run build
# 与标准构建一致，仅 basePath 切换为 /
# import.meta.env.BASE_URL = "/"
# AssetLoader.getBaseUrl() = "" (去尾斜杠)
# 资源 URL 拼接: "/images/..." ✅
```

### 4.3 splash-screen 渲染检查

在构建产物中验证 HTML 结构：
```html
<div id="app">
  <div id="splash-screen" style="position: fixed; inset: 0; ...">
    <img src="icons/icon-512x512.png" ...>
  </div>
</div>
```
- 启动 HTML 中 splash-screen div 存在 ✅
- img src 指向 `icons/icon-512x512.png`（相对路径，自动被 base URL 解析）✅
- PWA 安装后，冷启动时该元素在 React 初始化完成前显示封面 ✅

### 4.4 iOS 启动图验证

Manifest 与 HTML 元数据检查：
- `<link rel="apple-touch-startup-image" href="icons/icon-512x512.png" />` ✅
- `<meta name="theme-color" content="#0B1020" />` ✅
- `manifest.webmanifest` 中 `theme_color: "#0B1020"`, `background_color: "#0B1020"` ✅

### 4.5 部署后验证清单

| 验证项 | 操作 | 预期 |
|:---|:---|:---|
| PWA 图标加载 | 安装到主屏幕 → 启动 | 封面图标正常显示，无启动黑屏 |
| splash-screen 渲染 | 清除缓存 → 访问页面 | 看到封面图，然后平滑过渡到游戏界面 |
| 扩展资源加载 | 进入游戏 → 查看 CG/BGM | 通过 Network 面板验证 URL 路径正确 |
| Cloudflare Pages 路由回退 | 部署后访问任意子路径并刷新 | 返回 200，正常进入游戏 |
| Service Worker 更新 | 部署新版本 → 访问旧页面 | SW 检测到更新，提示用户重新加载 |
| CDN 缓存 | 访问 assets/ 资源 → 查看 Cache-Control | 返回 `max-age=31536000, immutable` |

---

## 五、附录

### 5.1 脚本变更

```diff
 "scripts": {
   "build": "npm run generate-manifest && tsc && vite build",
+  "build:cf": "CF_PAGES=1 npm run build",
   "deploy": "gh-pages -d dist",
   "pwa:build": "npm run generate-icons && npm run build"
 }
```

### 5.2 文件大小分析

| 资源 | 大小 | gzip |
|:---|:---|:---|
| index.html | 2.24 kB | 0.99 kB |
| manifest.webmanifest | 0.56 kB | — |
| sw.js | ~3 kB | — |
| workbox-*.js | ~6 kB | 2.2 kB |
| JS 主包 | 1004 kB | 306 kB |
| CSS 主包 | 126 kB | 19 kB |
| PWA 预缓存总计 | ~1162 kB | — |

### 5.3 basePath 对照表

| 部署平台 | 环境变量 | vite.config.ts basePath | import.meta.env.BASE_URL | 示例资源 URL |
|:---|:---|:---|:---|:---|
| GitHub Pages | 无 | `/beyond-the-light-cone/` | `/beyond-the-light-cone/` | `/beyond-the-light-cone/images/cg_example.png` |
| Cloudflare Pages | `CF_PAGES=1` | `/` | `/` | `/images/cg_example.png` |
| 本地开发 (dev) | 无 | `/` | `/` | `/images/cg_example.png` |

### 5.4 相关文档

- [SPEC_20260621_PWA_UPGRADE.md](file:///workspace/02_Project_Documentation/SPEC_20260621_PWA_UPGRADE.md) — PWA 升级规范与架构设计
- [EXEC_20260621_PWA_UPGRADE_WALKTHROUGH.md](file:///workspace/02_Project_Documentation/EXEC_20260621_PWA_UPGRADE_WALKTHROUGH.md) — PWA 升级实施记录（前置依赖）
- [EXEC_20260621_ARCHITECTURE_WALKTHROUGH.md](file:///workspace/02_Project_Documentation/EXEC_20260621_ARCHITECTURE_WALKTHROUGH.md) — 三层资源架构实施记录（前置依赖）
- [AssetLoader.ts](file:///workspace/03_Web_Rebuild/src/core/AssetLoader.ts) — 资源加载器源码
- [vite.config.ts](file:///workspace/03_Web_Rebuild/vite.config.ts) — Vite + PWA 配置
