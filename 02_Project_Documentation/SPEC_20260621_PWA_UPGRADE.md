# PWA 升级规范与架构设计 Specification
> **Date**: 2026-06-21  
> **Status**: Implemented  
> **Category**: Specifications & Design Systems (`SPEC_`)

本文档定义了《光锥之外：纪元往事》从标准 Web 应用（React 19 + TypeScript + Vite）升级为 **PWA（Progressive Web App）** 的完整规范与架构设计。

---

## 1. 架构总览

### 1.1 核心原则

| 原则 | 要求 |
|:---|:---|
| **离线优先** | 所有核心功能必须在无网络下运行：新游戏、读档、存档、科技树、事件系统、胜利判定、结局系统 |
| **单机游戏** | 游戏被视为本地单机应用，而非网页应用。禁止联网才能进入游戏 |
| **跨平台** | 支持 iPhone / iPad / Android / Windows / Mac 安装 |
| **自动更新** | Service Worker 使用 `autoUpdate` 模式，禁止手动更新 |

### 1.2 技术栈

| 层 | 技术 |
|:---|:---|
| UI 框架 | React 19 |
| 语言 | TypeScript 5 |
| 构建工具 | Vite 8 |
| PWA 插件 | vite-plugin-pwa 1.3 |
| 离线缓存 | Workbox (generateSW 模式) |
| 本地存储 | IndexedDB (存档主存储) + localStorage (元数据/配置) |

### 1.3 架构图

```
┌─────────────────────────────────────────────────┐
│                   用户启动                       │
│         (主屏幕图标 → standalone 全屏)           │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│           Service Worker (sw.js)                │
│  ┌─────────────┐  ┌─────────────────────────┐   │
│  │ 预缓存 (112) │  │   运行时缓存             │   │
│  │ JS/CSS/HTML │  │ 图片: CacheFirst 90天    │   │
│  │ 字体/JSON   │  │ 音频: StaleWhileRevalidate│  │
│  │ 配置文件    │  │ Google Fonts: CacheFirst  │   │
│  └─────────────┘  └─────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              应用主进程 (Main Thread)            │
│  ┌─────────────┐  ┌──────────┐  ┌───────────┐   │
│  │ React UI    │  │ Game.ts  │  │ SaveManager│   │
│  │ (App.tsx)   │  │ 核心引擎 │  │ IndexedDB  │   │
│  └─────────────┘  └──────────┘  └───────────┘   │
└─────────────────────────────────────────────────┘
```

### 1.4 关键文件清单

| 文件 | 职责 |
|:---|:---|
| [vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts) | PWA 插件配置、Manifest、Workbox 缓存策略 |
| [SaveManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/SaveManager.ts) | 存档管理器（IndexedDB + localStorage 双写） |
| [IndexedDBStorage.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/IndexedDBStorage.ts) | IndexedDB 存储引擎 |
| [UpdatePrompt.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/UpdatePrompt.tsx) | PWA 自动更新提示组件 |
| [OrientationPrompt.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/OrientationPrompt.tsx) | 横屏提示组件 |
| [main.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/main.tsx) | 应用入口，SW 注册、IndexedDB 初始化 |
| [index.html](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/index.html) | HTML 入口，PWA meta 标签、preconnect 提示 |
| [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) | 游戏核心引擎，自动存档触发点 |

---

## 2. PWA 核心配置

### 2.1 Manifest 规范

```json
{
  "name": "光锥之外：纪元往事",
  "short_name": "光锥之外",
  "description": "基于《三体》世界观改编的4X策略游戏",
  "display": "standalone",
  "orientation": "landscape",
  "theme_color": "#0B1020",
  "background_color": "#0B1020",
  "start_url": "/beyond-the-light-cone/",
  "icons": [
    { "src": "icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- `display: standalone`：启动后无地址栏、无浏览器按钮、全屏运行
- `orientation: landscape`：策略游戏默认横屏

### 2.2 VitePWA 插件配置

配置文件：[vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts)

**核心参数**：

| 参数 | 值 | 说明 |
|:---|:---|:---|
| `registerType` | `'autoUpdate'` | 自动更新模式，禁止手动更新 |
| `skipWaiting` | `true` | 新 SW 安装后立即跳过等待阶段 |
| `clientsClaim` | `true` | 新 SW 立即接管所有客户端 |
| `cleanupOutdatedCaches` | `true` | 自动清理旧版本缓存 |
| `cacheId` | `'beyond-light-cone-v1.0.0'` | 缓存版本标识 |

### 2.3 缓存策略

| 资源类型 | 策略 | 缓存名称 | 过期时间 | 最大条目 |
|:---|:---|:---|:---|:---|
| JS/CSS/HTML/字体/JSON (预缓存) | `precache` (globPatterns) | — | 永久 | 112 项 |
| 图片 (png/webp/jpg) | `CacheFirst` | `game-images` | 90 天 | 200 |
| 音频 (mp3/ogg/wav) | `StaleWhileRevalidate` | `game-audio` | 90 天 | 50 |
| 本地字体 | `CacheFirst` | `game-fonts` | 365 天 | 10 |
| Google Fonts (CDN) | `CacheFirst` | `google-fonts` | 365 天 | 10 |

### 2.4 Service Worker 生命周期

```
安装 (install)
  └→ 预缓存所有核心资源 (112 items, ~1MB)
  └→ 进入等待
激活 (activate)
  └→ cleanupOutdatedCaches
  └→ clientsClaim → 接管所有客户端
运行 (fetch)
  └→ 预缓存资源 → 直接返回
  └→ 运行时缓存 → 按策略处理
更新 (update)
  └→ autoUpdate 检测新版本
  └→ skipWaiting → 立即生效
  └→ controllerchange → 页面刷新
```

---

## 3. 存档系统 (IndexedDB)

### 3.1 架构

存档系统使用 **IndexedDB 主存储 + localStorage 同步备份** 的双写策略。

```
SaveManager
  ├── saveToSlot(slotId, serializeFn)
  │     ├── IndexedDB (异步主存储)
  │     ├── localStorage (同步备份，标准 key)
  │     └── 内存缓存 (同步读优化)
  │
  ├── loadFromSlot(slotId)
  │     ├── localStorage (优先，同步读)
  │     ├── 内存缓存 (回退)
  │     └── IndexedDB (异步，用于 listSlots)
  │
  └── autoSave(serializeFn)
        └── 写入 autosave 槽位
```

### 3.2 槽位结构

| 槽位 ID | 用途 | localStorage Key |
|:---|:---|:---|
| `autosave` | 自动存档 | `LegendOfUni_Save_autosave` |
| `slot1` | 手动存档 1 | `LegendOfUni_Save_slot1` |
| `slot2` | 手动存档 2 | `LegendOfUni_Save_slot2` |
| `slot3` | 手动存档 3 | `LegendOfUni_Save_slot3` |

### 3.3 存档格式 (v3)

```typescript
interface SavePackage {
  version: number;      // 当前为 3
  timestamp: number;    // 存档时间戳
  signature: number;    // DJB2 哈希，防篡改
  data: string;         // 序列化后的 JSON 字符串
}
```

### 3.4 自动存档触发点

| 触发时机 | 代码位置 |
|:---|:---|
| 回合结束 | [Game.ts:533](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L533) |
| 纪元切换 | [Game.ts:630](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L630) |
| 结局前 (坐标广播) | [Game.ts:684](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L684) |
| 结局前 (胜利判定) | [Game.ts:815](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L815) |
| 结局前 (逃亡主义) | [Game.ts:831](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L831) |
| 结局前 (人口灭绝) | [Game.ts:862](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L862) |
| 结局前 (二向箔/氦闪) | [Game.ts:907](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L907) |

---

## 4. HTML Meta 标签与 SEO

[index.html](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/index.html)

```html
<meta name="theme-color" content="#0B1020" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="光锥之外" />
<meta name="application-name" content="光锥之外" />
<meta name="mobile-web-app-capable" content="yes" />
<link rel="apple-touch-icon" href="icons/icon-192x192.png" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

---

## 5. 更新机制

### 5.1 自动更新流程

```
用户打开应用
  └→ SW 检查更新
       ├── 无更新 → 继续使用当前版本
       └── 发现新版本
             ├── autoUpdate → skipWaiting
             ├── controllerchange 事件触发
             └── window.location.reload()
```

### 5.2 更新提示组件

[UpdatePrompt.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/UpdatePrompt.tsx)
- 监听 `controllerchange` 事件
- 显示"发现新版本"提示
- 玩家可选择"立即更新"或"稍后提醒"
- 符合规范：禁止强制刷新页面

---

## 6. 屏幕适配

### 6.1 横屏提示组件

[OrientationPrompt.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/OrientationPrompt.tsx)
- 移动端竖屏时自动提示"建议横屏游玩"
- 策略游戏默认横屏优先

### 6.2 适配要求

- 支持：手机竖屏、手机横屏、iPad、桌面端
- 禁止固定分辨率（如 `width:1920px`）
- 使用 flex / grid / responsive 布局

---

## 7. 部署规范

### 7.1 GitHub Pages

| 分支 | 用途 |
|:---|:---|
| `main` | 开发主分支 |
| `gh-pages` | 发布分支 |

### 7.2 构建命令

```bash
npm run build     # tsc + vite build → dist/
npm run deploy    # build + gh-pages 发布到 gh-pages 分支
```

### 7.3 构建产物

```
dist/
├── index.html
├── sw.js                    # Service Worker
├── workbox-cbb21290.js      # Workbox 运行时
├── manifest.webmanifest     # 应用清单
├── registerSW.js            # SW 注册代码
├── assets/
│   ├── index-*.css          # CSS 包体 (122 KB)
│   └── index-*.js           # JS 包体 (953 KB)
├── icons/
│   ├── icon-192x192.png
│   └── icon-512x512.png
├── images/                  # 游戏图片资源
└── audio/                   # 游戏音频资源
```

---

## 8. 性能目标

| 指标 | 目标 | 当前 |
|:---|:---|:---|
| 首页加载 (移动端) | ≤3s | — |
| 首次包体 | <30MB | ~1MB (112 项预缓存) |
| CG 格式 | WebP 优先 | 当前使用 PNG |
| BGM 格式 | ogg 优先 | 当前使用 MP3 |

---

## 9. 测试验证清单 (T1-T6)

| 编号 | 测试场景 | 操作 | 预期结果 |
|:---|:---|:---|:---|
| T1 | 飞行模式启动 | 断网 → 启动游戏 | 成功进入主菜单 |
| T2 | 断网读档 | 断网 → 加载存档 | 成功 |
| T3 | 断网完成一局 | 新游戏 → 达到结局 | 记录结局 |
| T4 | iPhone | Safari 安装 | 验证 |
| T5 | iPad | Safari 安装 | 验证 |
| T6 | Android | Chrome 安装 | 验证 |