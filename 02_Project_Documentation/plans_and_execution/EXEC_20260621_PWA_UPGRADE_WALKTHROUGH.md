# Walkthrough: PWA 升级全流程实施
> **Date**: 2026-06-21  
> **Status**: Completed  
> **Category**: Active Execution Walkthrough (`EXEC_`)

本文档记录了《光锥之外：纪元往事》（React 19 + TypeScript + Vite）升级为 **PWA（Progressive Web App）** 的完整实施过程。

---

## 一、实施概述

### 1.1 目标

| 目标 | 状态 |
|:---|:---|
| 多平台安装（iPhone/iPad/Android/Windows/Mac） | ✅ 完成 |
| 离线启动 | ✅ 完成 |
| 离线存档（IndexedDB） | ✅ 完成 |
| 离线游玩 | ✅ 完成 |
| 自动更新 | ✅ 完成 |
| 509 测试用例通过 | ✅ 完成 |
| 构建通过（112 项预缓存，~1MB） | ✅ 完成 |

### 1.2 变更文件清单

| 文件 | 操作 | 说明 |
|:---|:---|:---|
| [vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts) | 修改 | 添加 VitePWA 插件、Workbox 缓存策略 |
| [SaveManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/SaveManager.ts) | 修改 | IndexedDB 双写、多槽位、缓存 key 规范 |
| [IndexedDBStorage.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/IndexedDBStorage.ts) | 新增 | IndexedDB 存储引擎 |
| [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) | 修改 | 7 个自动存档触发点 |
| [UpdatePrompt.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/UpdatePrompt.tsx) | 新增 | PWA 更新提示组件 |
| [OrientationPrompt.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/OrientationPrompt.tsx) | 新增 | 横屏提示组件 |
| [index.html](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/index.html) | 修改 | PWA meta 标签、去重字体加载 |
| [main.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/main.tsx) | 修改 | IndexedDB 初始化 + SW 注册 |
| [App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx) | 修改 | 集成 UpdatePrompt / OrientationPrompt |
| [package.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/package.json) | 修改 | 添加 `vite-plugin-pwa` 依赖和 PWA 脚本 |
| [.github/workflows/deploy.yml](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/.github/workflows/deploy.yml) | 修改 | 添加图标生成步骤 |

---

## 二、实施步骤

### Step 1: PWA 插件安装与基础配置

**安装依赖**：
```bash
npm install vite-plugin-pwa -D
```

**配置 vite.config.ts**：
- 添加 `VitePWA` 插件，设置 `registerType: 'autoUpdate'`
- 配置 Manifest：`name`, `short_name`, `display: standalone`, `orientation: landscape`
- 配置 Workbox 缓存策略（预缓存 + 运行时缓存）
- 设置 `cacheId: 'beyond-light-cone-v1.0.0'`
- 启用 `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`

### Step 2: HTML 入口配置

**index.html** 添加：
- PWA Meta 标签：`theme-color`, `apple-mobile-web-app-capable`, `mobile-web-app-capable`
- Apple Touch Icon 链接
- Google Fonts preconnect 提示

**字体加载优化**：
- 移除与 CSS `@import` 重复的 `<link href="https://fonts.googleapis.com/...">` 标签
- `index.css` 的 `@import` 包含所有实际使用字体（Inter / JetBrains Mono / Orbitron）
- 保留 preconnect 提示以加速 CDN 连接

### Step 3: 存档系统重构 (IndexedDB)

**新增 IndexedDBStorage.ts**：
- 基于 IndexedDB 的多槽位存储引擎
- 支持 `setSlot`, `getSlot`, `deleteSlot`, `listSlots`
- 数据库名称：`LegengOfUni_SaveDB`
- 对象存储：`save_slots`, `meta`

**重构 SaveManager.ts**：
- `saveToSlot`：写入 IndexedDB（异步）+ localStorage（同步备份）+ 内存缓存
- `loadFromSlot`：优先从 localStorage 读取（同步），缓存为回退
- 统一 localStorage key 为 `LegendOfUni_Save_{slotId}` 格式
- 保留 legacy key `LegendOfUni_Save` 的读取回退以兼容旧存档
- 删除时同时清理标准 key、legacy key 和内存缓存
- 新增 `resetCache()` 方法用于测试环境

**存档格式 v3**：
```typescript
interface SavePackage {
  version: number;      // 3
  timestamp: number;    // Date.now()
  signature: number;    // DJB2 哈希
  data: string;         // JSON 序列化
}
```

### Step 4: 自动存档触发

在 Game.ts 的 7 个关键节点添加自动存档：

| 触发时机 | 代码行 | 说明 |
|:---|:---|:---|
| 回合结束 | [L533](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L533) | `runARound()` 的 finally 块 |
| 纪元切换 | [L630](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L630) | `advanceEpoch()` 方法 |
| 坐标广播结局 | [L684](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L684) | 广播触发胜利/灭绝 |
| 条件胜利 | [L815](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L815) | 6 种胜利条件达成 |
| 逃亡主义崩溃 | [L831](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L831) | treachery >= 100 |
| 人口灭绝 | [L862](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L862) | population <= 0 |
| 二向箔/氦闪 | [L907](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L907) | 黑暗森林打击 |

### Step 5: PWA UI 组件

**UpdatePrompt.tsx** — 更新提示：
- 监听 SW `controllerchange` 事件
- 显示"发现新版本"对话框
- "立即更新" / "稍后提醒" 两个按钮
- 符合 Update-1 规范：禁止强制刷新

**OrientationPrompt.tsx** — 横屏提示：
- 检测移动端竖屏状态
- 自动提示"建议横屏游玩"
- 符合 UI-2 规范

### Step 6: 测试修复

**SaveManager 测试**：
- 修复 `deleteSave` 未清理 legacy key 导致 `hasSave()` 误判的问题
- 修复内存缓存跨测试残留导致测试失败的问题（新增 `resetCache()`）
- 统一测试中 localStorage key 为 `LegendOfUni_Save_autosave`
- 更新 `Game.reset()` 使用 `SaveManager.deleteSave()` 替代手动 key 删除

**测试结果**：
```
Test Files  31 passed (31)
Tests       509 passed (509)
```

### Step 7: 构建验证

```bash
npm run build
```

**构建产出**：
```
dist/
├── index.html                   1.49 KB
├── sw.js                        Service Worker
├── workbox-cbb21290.js          Workbox 运行时
├── manifest.webmanifest         0.56 KB
├── registerSW.js                0.17 KB
├── assets/index-*.css          122.72 KB (gzip: 17.96 KB)
├── assets/index-*.js           953.39 KB (gzip: 291.05 KB)
├── icons/                       192x192 + 512x512
├── images/                      60 张游戏图片
└── audio/                       12 首 BGM
```

PWA 构建报告：
- 模式：`generateSW`
- 预缓存：112 项 (1052.54 KiB)
- 生成文件：`sw.js`, `workbox-cbb21290.js`

---

## 三、关键问题与解决

### 3.1 Google Fonts 重复加载

**问题**：`index.html` 通过 `<link>` 加载 `Inter:400,700` + `Roboto Mono`，`index.css` 通过 `@import` 加载 `Inter:300,400,600,700` + `JetBrains Mono` + `Orbitron`，造成重复请求。

**解决**：移除 `index.html` 中的 `<link>` 字体加载，统一由 CSS `@import` 管理。保留 preconnect 提示以加速 CDN 连接。

### 3.2 存档 Key 不一致

**问题**：`saveToSlot` 中 autosave 写入旧 key `LegendOfUni_Save`，但 `deleteSlot` 删除的是新 key `LegendOfUni_Save_autosave`，导致删除不彻底。`hasSave()` 通过旧 key 仍能找到数据，测试中断言失败。

**解决**：
- 统一写入标准 key `LegendOfUni_Save_{slotId}`
- `deleteSlot` 同时清理标准 key、legacy key 和内存缓存
- 读取时保留 legacy key 回退以兼容旧存档

### 3.3 内存缓存跨测试残留

**问题**：`SaveManager._slotCache` 在各测试间未清理，`beforeEach` 只清 `localStorage` 但缓存还在，导致后续测试从缓存读到旧数据。

**解决**：新增 `SaveManager.resetCache()` 方法，在测试的 `beforeEach` 中调用。

### 3.4 Game.reset() 未清理新 key

**问题**：`GameInstance.reset()` 直接调用 `localStorage.removeItem("LegendOfUni_Save")` 只清理了旧 key，未清理新标准 key。

**解决**：改为调用 `SaveManager.deleteSave()`，统一通过 SaveManager 管理存档清理。

---

## 四、验证结果

### 4.1 测试套件

```bash
npm test  # npx vitest run
# 31 files, 509 tests, all passed
```

### 4.2 构建验证

```bash
npm run build
# TypeScript: 通过
# Vite: 2211 modules transformed
# PWA: 112 entries precached
```

### 4.3 后续验证 (T1-T6)

部署后需验证以下测试场景：

| 编号 | 场景 | 操作 | 预期 |
|:---|:---|:---|:---|
| T1 | 飞行模式启动 | 断网 → 启动游戏 | 成功进入主菜单 |
| T2 | 断网读档 | 断网 → 加载存档 | 成功 |
| T3 | 断网完成一局 | 新游戏 → 达到结局 | 记录结局 |
| T4 | iPhone | Safari 安装 | 图标、全屏、正常运行 |
| T5 | iPad | Safari 安装 | 图标、全屏、正常运行 |
| T6 | Android | Chrome 安装 | 图标、全屏、正常运行 |

---

## 五、附录

### 5.1 依赖变更

```diff
# package.json
+ "vite-plugin-pwa": "^1.3.0"
```

### 5.2 脚本变更

```diff
# package.json scripts
+ "generate-icons": "node scripts/generate-icons.mjs"
+ "pwa:build": "npm run generate-icons && npm run build"
```

### 5.3 构建产物大小分析

| 资源 | 原始大小 | Gzip |
|:---|:---|:---|
| JS 包体 | 953 KB | 291 KB |
| CSS 包体 | 123 KB | 18 KB |
| HTML | 1.5 KB | 0.7 KB |
| 预缓存总计 | ~1 MB | — |

### 5.4 相关文档

- [SPEC_20260621_PWA_UPGRADE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260621_PWA_UPGRADE.md) — PWA 升级规范与架构设计
- [vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts) — PWA 核心配置
- [SaveManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/SaveManager.ts) — 存档系统实现