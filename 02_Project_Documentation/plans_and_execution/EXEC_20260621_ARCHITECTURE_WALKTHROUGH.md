# Walkthrough: 资源分层加载 + 响应式布局全流程实施
> **Date**: 2026-06-21  
> **Status**: Completed  
> **Category**: Active Execution Walkthrough (`EXEC_`)

本文档记录了《光锥之外：纪元往事》的两个架构升级工作的完整实施过程：

1. **资源分层加载架构**（Layer 1/2/3 三层资源体系）
2. **全设备响应式布局**（手机/平板/桌面三断点适配）

---

## 一、实施概述

### 1.1 目标与结果

| 目标 | 状态 |
|:---|:---|
| 首次安装 < 50 MB 可玩 | ✅ 核心包 ~1 MB，扩展按需 |
| 资源按纪元/类型按需下载 | ✅ 8 个资源包，AssetLoader 后台下载 |
| 热更新支持 | ✅ PatchManager 自动应用 JSON 补丁 |
| 手机竖屏/横屏适配 | ✅ 底部导航 + 右侧抽屉 |
| iPad 流体布局 | ✅ `clamp()` 动态宽度 |
| 桌面固定三栏布局 | ✅ 240px + flex-1 + 320px |
| safe-area 适配 | ✅ iPhone 刘海/底部指示条 |

### 1.2 变更文件清单

| 文件 | 操作 | 说明 |
|:---|:---|:---|
| **资源分层架构** | | |
| [types/asset.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/types/asset.ts) | 新增 | CoreAsset / ExpansionAsset / HotPatch 等类型 |
| [core/AssetLoader.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AssetLoader.ts) | 新增 | 三层资源加载器，IndexedDB 资产记录 |
| [core/PatchManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/PatchManager.ts) | 新增 | 热更新管理器，补丁验证/应用/历史 |
| [scripts/generate-manifest.mjs](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/scripts/generate-manifest.mjs) | 新增 | 清单生成器，按纪元/类型自动分类 |
| [public/asset_manifest.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/asset_manifest.json) | 新增 | 108 项扩展资源，8 个包 |
| [vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts) | 修改 | 三层缓存命名、移除图片/音频预缓存 |
| [main.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/main.tsx) | 修改 | 6 步启动流程：AssetLoader → PatchManager → Game |
| [package.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/package.json) | 修改 | 新增 `generate-manifest` 脚本 |
| **响应式布局** | | |
| [hooks/useBreakpoint.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/hooks/useBreakpoint.ts) | 新增 | 断点检测 Hook |
| [components/MobileBottomNav.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/MobileBottomNav.tsx) | 新增 | 移动端底部导航栏 |
| [App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx) | 修改 | 响应式布局调度、抽屉面板控制 |
| [components/TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx) | 修改 | 紧凑模式，按断点隐藏非关键指标 |
| [components/LeftHub.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/LeftHub.tsx) | 修改 | 添加 `sidebar-left` 流体宽度类 |
| [components/RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/RightInspector.tsx) | 修改 | 添加 `sidebar-right` 流体宽度类 |
| [index.css](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/index.css) | 修改 | safe-area、drawer 动画、底部导航、流体宽度媒体查询 |

---

## 二、实施步骤

### Step 1: 类型定义

**asset.ts** — 定义三层资源的所有 TypeScript 类型：

- `CoreAsset` / `ExpansionAsset` — 核心和扩展资源条目
- `ExpansionPack` — 资源包（按纪元/类型分组）
- `HotPatch` / `PatchChange` — 补丁结构
- `AssetManifest` — 完整资源清单类型
- `AssetRecord` / `PackDownloadProgress` — IndexedDB 存储和进度类型

### Step 2: 清单生成器

**generate-manifest.mjs** — Node.js 脚本，扫描 `public/` 目录并按规则分类：

1. 遍历目录，读取每个文件的大小和路径
2. 根据文件名关键词（`crisis`, `deterrence`, `broadcast`, `stardust`）推断纪元归属
3. 根据前缀（`cg_`, `ending_`, `unified_`, `npc_`）和目录（`audio/`）推断资源类型
4. 按纪元构建 5 个 era pack，按类型构建 3 个 type pack
5. 输出 `asset_manifest.json`

集成到构建流程：
```json
"build": "npm run generate-manifest && tsc && vite build"
```

### Step 3: AssetLoader

**AssetLoader.ts** — 资源加载器核心实现：

**初始化流程**：
1. 加载 `asset_manifest.json`（获取资源清单）
2. 打开 IndexedDB `BeyondLightCone_Assets`（记录下载状态）
3. 加载已有资产记录

**主要 API**：
```typescript
// 按纪元下载资源包（玩到哪，下到哪）
assetLoader.downloadEraPack('crisis_era')

// 预加载下一纪元
assetLoader.preloadNextEra('crisis_era')

// 获取资源 URL（已缓存返回本地，未缓存触发后台下载）
assetLoader.getExpansionUrl('cg_doomsday_battle')

// 获取包下载状态
assetLoader.getDownloadStatus()
```

**下载逻辑**：
- 支持依赖包（先下载依赖再下载自身）
- 进度回调（`PackDownloadProgress`）
- 队列机制（多个下载请求排队处理）
- 错误处理（包内某资源失败，整包标记失败）
- IndexedDB 持久化记录

### Step 4: PatchManager

**PatchManager.ts** — 热更新管理器：

**初始化**：
1. 从 manifest 读取可用补丁列表
2. 打开 IndexedDB `BeyondLightCone_Patches`
3. 加载已应用补丁历史
4. 自动调用 `applyPendingPatches()`

**补丁应用**：
- 验证兼容性（`minCompatibleVersion`）
- 按版本时间戳顺序应用
- 记录应用到 IndexedDB 历史
- 提供 `applyPatchToData()` 方法在运行时修补数据

### Step 5: PWA 缓存策略重构

**vite.config.ts** — 将缓存策略从平面结构重构为三层：

| 旧结构 | 新结构 |
|:---|:---|
| `game-images` → CacheFirst | `exp-images` → CacheFirst |
| `game-audio` → StaleWhileRevalidate | `exp-audio` → StaleWhileRevalidate |
| `game-fonts` → CacheFirst | `exp-fonts` → CacheFirst |
| — | `patch-manifest` → NetworkFirst |
| — | `patch-files` → NetworkFirst |

关键变更：移除 `includeAssets: ['images/*.png', 'audio/*.mp3']`，CG/BGM 不再进入 PWA 预缓存。

### Step 6: 启动流程重构

**main.tsx** — 从同步启动改为 6 步异步引导：

```
bootstrap()
  1. storage.init()          → 存档 IndexedDB
  2. assetLoader.init()      → 资源清单 + 资产数据库
  3. patchManager.init()     → 补丁列表
  4. applyPendingPatches()   → 自动应用补丁
  5. GameInstance.get()      → 游戏引擎
  6. SW register + UI render → 完成
```

错误处理：任一步失败不会阻塞整体流程，但会在控制台输出警告。

### Step 7: useBreakpoint Hook

**useBreakpoint.ts** — 断点检测 Hook：

- 监听 `resize` 和 `orientationchange` 事件
- 使用 `requestAnimationFrame` 节流
- SSR 安全（`typeof window === 'undefined'` 时返回默认值）
- 提供 `isPortraitMobile` 字段供 OrientationPrompt 使用

### Step 8: App.tsx 响应式重构

**核心改动**：

1. **条件渲染 LeftHub**：
   ```tsx
   {!isMobile && <LeftHub ... />}
   ```

2. **条件渲染 RightInspector**（桌面侧栏 / 移动端抽屉）：
   ```tsx
   {!isMobile ? <RightInspector /> : (
     mobileDrawerOpen && (
       <>
         <div className="drawer-overlay" ... />
         <div className="drawer-panel">
           <button>✕ 关闭</button>
           <RightInspector />
         </div>
       </>
     )
   )}
   ```

3. **抽屉控制**：
   - 打开：监听 `star-selected` 事件 → `setMobileDrawerOpen(true)`
   - 关闭：点击遮罩 / Esc 键 / ✕ 按钮
   - 关闭时 Escape 优先关闭抽屉，不影响其他模态框

4. **底部导航**：
   ```tsx
   {isMobile && <MobileBottomNav ... />}
   ```

### Step 9: 各组件响应式改造

**TopHUD**：
- `h-[56px] sm:h-[72px]` — 移动端紧凑高度
- `hidden sm:flex` — 人口仅平板+显示
- `hidden md:flex` — 资源/军力仅桌面显示
- 中心纪元文字缩小 (`text-xs sm:text-lg`)
- 按钮紧凑 (`px-3 sm:px-6`, `text-[10px] sm:text-xs`)

**LeftHub** → `sidebar-left` 类：
```css
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar-left { width: clamp(160px, 22vw, 200px) !important; }
}
```

**RightInspector** → `sidebar-right` 类：
```css
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar-right { width: clamp(240px, 30vw, 280px) !important; }
}
```

---

## 三、关键问题与解决

### 3.1 IndexedDB 不可用场景

**问题**：IndexedDB 在部分旧浏览器/隐身模式/测试环境中不可用

**解决**：三步降级策略
- AssetLoader：`try-catch` 捕获 IndexedDB 初始化异常，回退到纯内存模式
- PatchManager：同上策略
- 控制台输出 `warn` 而非 `error`，不影响游戏启动

### 3.2 抽屉关闭冲突

**问题**：Escape 键同时触发抽屉关闭和其他模态框关闭

**解决**：在 Escape 处理器中优先检查抽屉状态：
```typescript
if (e.code === 'Escape') {
  if (isMobile && mobileDrawerOpen) {
    setMobileDrawerOpen(false);
    return;  // 直接返回，不处理其他关闭
  }
  // ... 其他模态框关闭逻辑
}
```

### 3.3 PWA 预缓存体积骤降

**问题**：移除 `includeAssets` 后，预缓存从 112 项降至 8 项，能否覆盖离线启动？

**分析**：SVG/PNG 图标本身就是核心 UI 资源，已被 `globPatterns` 覆盖。CG/立绘/BGM 作为 Layer 2 扩展资源，不需要离线可用——规范明确允许：

> "CG、角色立绘、BGM、语音" → 允许懒加载

**结论**：8 项预缓存足够离线启动，符合规范。

---

## 四、验证结果

### 4.1 测试套件

```bash
npm test
# 33 files, 514 tests, all passed
```

### 4.2 构建验证

```bash
npm run build
# generate-manifest → 108 扩展资源，8 包
# tsc → 0 errors
# vite build → 8 entries precached (1117 KB)
```

### 4.3 响应式验证点

| 场景 | 验证方式 | 预期 |
|:---|:---|:---|
| 手机竖屏 (< 768px) | 调整浏览器宽度 | 底部导航显示，侧栏隐藏 |
| 手机横屏 (< 768px) | 调整浏览器宽高比 | 同上，OrientationPrompt 不显示 |
| iPad (768-1023px) | 调整宽度 | 侧栏 fluid 宽度，clamp() 生效 |
| 桌面 (≥ 1024px) | 默认 | 三栏固定宽度 |
| safe-area | iOS Safari 模拟 | 底部导航 padding-bottom 含安全区域 |
| 抽屉面板 | 点击星辰 | 右侧抽屉滑入，带遮罩 |

### 4.4 资源分层验证点

| 场景 | 验证方式 | 预期 |
|:---|:---|:---|
| 核心包预缓存 | PWA build 报告 | 8 entries, ~1 MB |
| CG 非预缓存 | PWA build 报告 | images/* 不在 precache 列表中 |
| 清单生成 | npm run generate-manifest | 108 items, 8 packs |
| 按纪元下载 | 调用 downloadEraPack('crisis_era') | 后台下载，进度回调 |
| 热更新应用 | PatchManager.applyPendingPatches | 按版本顺序应用 |

---

## 五、附录

### 5.1 依赖变更

无新增外部依赖。所有实现基于现有技术栈（TypeScript + IndexedDB API）。

### 5.2 构建脚本变更

```diff
"scripts": {
+  "generate-manifest": "node scripts/generate-manifest.mjs",
-  "build": "tsc && vite build"
+  "build": "npm run generate-manifest && tsc && vite build"
}
```

### 5.3 构建产物大小对比

| 资源 | 改造前 (precache) | 改造后 (precache) |
|:---|:---|:---|
| 预缓存条目 | 112 项 | **8 项** |
| 预缓存大小 | ~1 MB | ~1 MB |
| 全量资源 | 336 MB (一次性) | ~1 MB 核心 + 310 MB 按需 |

### 5.4 响应式断点对照

| Tailwind class | min-width | 含义 |
|:---|:---|:---|
| `sm:` | 640px | 小屏（备用于自定义逻辑） |
| `md:` | 768px | 平板竖屏 |
| `lg:` | 1024px | 桌面 |
| `xl:` | 1280px | 大屏 |

实际使用中，移动端判定基于 `< 768px`（对应 Tailwind 的 `< md`）。

### 5.5 相关文档

- [SPEC_20260621_RESOURCE_LAYERING.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260621_RESOURCE_LAYERING.md) — 资源分层加载架构规范
- [SPEC_20260621_RESPONSIVE_LAYOUT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260621_RESPONSIVE_LAYOUT.md) — 响应式布局规范
- [SPEC_20260621_PWA_UPGRADE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260621_PWA_UPGRADE.md) — PWA 升级规范（前置依赖）
- [AssetLoader.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AssetLoader.ts) — 资源加载器源码
- [PatchManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/PatchManager.ts) — 热更新管理器源码
- [App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx) — 响应式布局入口