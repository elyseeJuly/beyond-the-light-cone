# 从黑屏到封面：PWA 图标加载失败的排查全记录

> 一个看起来很简单的"图片加载不出来"问题，背后藏着三层坑。

---

## 🎯 事情是这样开始的

用户反馈了两个问题：

1. **PWA 模式下封面不能加载** — 把游戏装到手机主屏幕上，点进去是一片黑
2. **Cloudflare 部署不成功** — 换个平台部署，整个资源加载器直接挂掉

第一反应：图片文件损坏了？路径写错了？

去 `public/icons/` 一看，`icon-192x192.png` 和 `icon-512x512.png` 都好好躺着，文件大小正常，打开也能看到封面图。

那为什么加载不出来？

---

## 🔍 第一层坑：路径硬编码

### 发现问题

我们的项目有两个部署环境：
- **GitHub Pages**：路径是 `/beyond-the-light-cone/`
- **Cloudflare Pages**：路径是 `/`（根路径）

在 `vite.config.ts` 里其实早就做了处理：

```typescript
const basePath = process.env.CF_PAGES === '1' ? '/' : '/beyond-the-light-cone/';
```

Vite 会根据环境变量自动切换 base path。**看起来很完美**。

但问题出在 [AssetLoader.ts](file:///workspace/03_Web_Rebuild/src/core/AssetLoader.ts) 里。

这个文件是资源分层架构的核心加载器，负责加载 `asset_manifest.json` 以及所有 CG/立绘/BGM 扩展资源。我打开一看——

```typescript
// ❌ 修复前：硬编码了 GitHub Pages 的路径
const MANIFEST_URL = "/beyond-the-light-cone/asset_manifest.json";
```

不止这一处。`getCoreAssetUrl()`、`getExpansionUrl()`、甚至下载函数里的 `fetch`，**全部写死了** `/beyond-the-light-cone/` 前缀。

### 为什么会这样？

资源分层架构是后面加的功能，写 AssetLoader 的时候，项目只在 GitHub Pages 上部署过。开发者下意识就把路径写死了。

而 Vite 配置里的 `basePath` 切换逻辑，是更早之前就有的。**两边各干各的，没有打通。**

这就像——厨房有两份菜单，一份说今天卖川菜，一份说今天卖粤菜，服务员照着粤菜菜单点了菜，厨师照着川菜菜单做，端上来当然不对。

### 怎么修的？

加了一个统一的 `getBaseUrl()` 函数：

```typescript
// ✅ 修复后：动态从 Vite 注入的 BASE_URL 读取
function getBaseUrl(): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

const MANIFEST_URL = () => `${getBaseUrl()}/asset_manifest.json`;
```

Vite 在构建时会把 `import.meta.env.BASE_URL` 替换成当前环境的 base path。AssetLoader 从这里读，就和 Vite 配置保持一致了。

GitHub Pages 构建 → BASE_URL = `/beyond-the-light-cone/` → 路径正确 ✅
Cloudflare 构建 → BASE_URL = `/` → 路径正确 ✅

**教训：永远不要硬编码部署路径。框架给了你什么变量，就用什么变量。**

---

## 📱 第二层坑：iOS 的特殊脾气

路径修好了，以为完事了。结果用户说：**封面还是黑屏**。

等等，manifest 里 icons 配置了啊：

```json
{
  "src": "icons/icon-512x512.png",
  "sizes": "512x512",
  "type": "image/png",
  "purpose": "maskable"
}
```

Android 上好好的，怎么 iOS 就不行？

### 原因：iOS 不按常理出牌

Web App Manifest 是 W3C 标准，理论上所有浏览器都应该遵守。

但 Apple 嘛……你懂的。

**iOS Safari 的 PWA 启动画面，不走 manifest 里的 icons。** 它要单独的 `apple-touch-startup-image` 标签：

```html
<!-- 在 index.html 的 <head> 里加上这一行 -->
<link rel="apple-touch-startup-image" href="icons/icon-512x512.png" />
```

没有这行，iOS 就用应用截图或者纯色背景当启动画面。我们的背景色是 `#0B1020`（深海军蓝），看起来跟黑屏差不多……

所以用户说的"封面加载不出来"，在 iOS 上其实是 **启动画面根本没走 manifest 的图标配置**。

### 对比一下两边的逻辑

| 平台 | 启动画面来源 | 配置位置 |
|:---|:---|:---|
| Android Chrome | manifest.icons + background_color 自动合成 | manifest.webmanifest |
| iOS Safari | apple-touch-startup-image 指定的图片 | index.html 的 <link> 标签 |

**教训：做 PWA 不能只看标准文档，iOS 有自己的一套规矩，得单独适配。**

---

## ⚡ 第三层坑：黑屏一闪而过

加上了 `apple-touch-startup-image`，iOS 启动画面有了。但仔细看——

**启动画面结束后，会有一瞬间的黑屏，然后才进入游戏界面。**

为什么？

因为 PWA 的启动画面是**系统级**的，显示到 WebView 准备好就消失。而 WebView 准备好的时候，React 应用还没初始化完成。

React 初始化需要时间：
- 加载 JS 包（~1MB gzip 后 300KB）
- 执行 JS
- 渲染组件树
- 在低端设备上可能需要好几秒

这段时间里，页面上只有一个空的 `<div id="app"></div>`，背景色是 `#0B1020`，又是一片黑。

### 怎么修的？

很简单——**在 HTML 里直接写死一个封面元素**。

```html
<div id="app">
  <div
    id="splash-screen"
    style="
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0B1020;
    "
  >
    <img
      src="icons/icon-512x512.png"
      alt="光锥之外：纪元往事"
      style="
        width: 56vmin;
        height: 56vmin;
        max-width: 512px;
        max-height: 512px;
        object-fit: contain;
        border-radius: 16px;
        box-shadow: 0 0 60px rgba(0, 150, 255, 0.15);
      "
    />
  </div>
</div>
```

**工作原理：**

1. HTML 解析完成就立刻渲染 splash-screen（纯 HTML+CSS，零 JS 开销）
2. React 在后台慢慢初始化
3. React 准备好后，调用 `ReactDOM.createRoot(rootElement).render(<App />)`
4. 这个调用会**替换掉** `#app` 里面的所有内容
5. splash-screen 随之消失，游戏界面无缝出现

不需要写 JS 去监听加载完成、不需要动画淡出、不需要 setTimeout —— React 接管的时候自然就替换了。

**用最少的代码，解决最直观的体验问题。**

---

## ☁️ 顺便说：Cloudflare 为什么部署不成功？

路径硬编码修好了，Cloudflare 就能跑了吗？

还不够。有两个配置文件必须加。

### 1. `_redirects` — SPA 路由回退

GitHub Pages 有自己的 SPA 回退机制（404.html 或者插件处理），但 Cloudflare Pages 需要你明说：

```
/*  /index.html  200
```

意思是：不管用户访问什么路径（`/game/save`、`/settings` 等等），都返回 `index.html`，让 React Router 去处理路由。

没有这行配置，刷新页面就是 404。

### 2. `_headers` — 缓存策略

Cloudflare Pages 默认的缓存策略比较保守。对于 PWA 来说，需要明确配置：

- **静态资源**（带 hash 的 JS/CSS、图片、音频）：长期缓存，`max-age=31536000, immutable`
- **HTML**：每次都校验，`must-revalidate`
- **Service Worker 文件**（`sw.js`、`workbox-*.js`）：**绝对不能缓存**

为什么 SW 文件不能缓存？因为如果浏览器缓存了旧的 `sw.js`，它就永远不会发现有新版本的 Service Worker，你的 PWA 就永远更新不了。

这是 PWA 部署的经典坑。

---

## 🧩 为什么一开始不行？—— 三个层面的叠加

回头看，这个"封面加载不出来"的问题，其实是**三层问题叠在一起**的结果：

| 层面 | 问题 | 表现 |
|:---|:---|:---|
| **架构层** | AssetLoader 路径硬编码 | Cloudflare 部署整个资源加载器挂掉 |
| **平台层** | iOS 需要单独的 startup-image | iOS 启动画面是黑屏 |
| **体验层** | React 初始化期间页面空白 | 启动画面和游戏之间有黑闪 |

每一层单独看都不是大问题，但叠在一起，用户的感受就是——**"封面加载不出来"**。

而我们的第一反应"图片坏了"，反而是最不可能的原因。

---

## 💡 几条经验总结

1. **路径永远不要硬编码。** 框架给的 `BASE_URL`、`PUBLIC_URL` 不是摆设。

2. **PWA 要分平台看。** iOS 和 Android 的图标、启动画面逻辑完全不一样，不能只看 manifest。

3. **最简单的方案往往最可靠。** splash-screen 用内联 HTML+CSS 就够了，不需要 React 组件、不需要动画库。

4. **换部署平台等于换一套规则。** GitHub Pages 能用的，Cloudflare 不一定能用；Vercel 能用的，Netlify 不一定能用。每个平台的路由处理、缓存策略、环境变量都不一样。

5. **用户说的"封面加载不出来"，可能不是图片本身的问题。** 多往下挖一层。

---

**最后说一句：** 这次的封面图标用的都是项目库里原有的 icons，没有加新图片。很多时候，不是缺资源，而是资源的"入口"没打通。

---

*如果你觉得这篇文章有用，欢迎分享给做前端的朋友。踩过的坑多了，下次看到类似问题，就能少走几天弯路。*
