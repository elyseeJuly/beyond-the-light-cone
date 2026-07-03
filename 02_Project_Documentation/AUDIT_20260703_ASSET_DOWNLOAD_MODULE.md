# 分模块下载功能现状全面审计报告
> 根据 2026-07-03 AI 源码排查记录整理归档

## 1. 架构概览

系统设计了一套**三层资源架构**，由以下文件组成：

| 文件 | 职责 |
|:---|:---|
| `src/types/asset.ts` | 类型定义（3 层资源的完整 TypeScript 接口） |
| `src/core/AssetLoader.ts` | 核心加载器（487 行），负责清单加载、按包下载、IndexedDB 记录 |
| `src/core/PatchManager.ts` | 热更新管理器（226 行），负责补丁加载/验证/应用 |
| `scripts/generate-manifest.mjs` | 构建时脚本，扫描 `public/` 生成 `asset_manifest.json` |
| `vite.config.ts` | PWA 三层缓存策略配置 (L50-L134) |
| `src/components/SettingsModal.tsx` | UI：设置面板中的「存储」tab，展示包列表和手动下载按钮 |

## 2. 当前清单数据现状

`asset_manifest.json` 实际生成内容统计：

| 类别 | 数量 | 大小 |
|:---|:---|:---|
| **Core 资源** | 1 个 (`character_default.png`) | ~0.8 MB |
| **Expansion 资源** | 126 个 | ~347 MB |
| **Patches** | 0 个 | — |

**8 个 Expansion 资源包分布**（纪元 + 类型两个维度）：

| 包 ID | 资源数 | 大小 | 备注 |
|:---|:---|:---|:---|
| `pack_crisis_era` | 18 | 46.8 MB | 危机纪元 |
| `pack_deterrence_era` | 18 | 67.8 MB | 威慑纪元 |
| `pack_broadcast_era` | 13 | 65.7 MB | 广播纪元 |
| `pack_stardust_era` | 4 | 22.7 MB | 星屑纪元 |
| `pack_uncategorized` | **73** | **144.3 MB** | ⚠️ 未分类资源，占总量 41% |
| `pack_cg` | 43 | 156.0 MB | 按类型：全部 CG |
| `pack_music` | 15 | 55.6 MB | 按类型：全部音乐 |
| `pack_character` | 36 | 32.0 MB | 按类型：全部角色立绘 |

## 3. 核心问题盘点

功能基本处于**「有骨架、未接线」**状态。

### 3.1 核心问题：按纪元自动下载完全未接入游戏主循环
`AssetLoader` 提供了两个关键 API：
- `downloadEraPack(eraKey)` — 进入新纪元时自动下载该纪元资源。
- `preloadNextEra(currentEra)` — 在当前纪元末尾提前预加载下一纪元。

**现状**：这两个方法在整个项目中零调用。没有任何地方（Game.ts、App.tsx、纪元切换逻辑）调用它们。「玩到哪下到哪」的核心设计意图完全没有落地。

### 3.2 大量 AssetLoader API 无人调用
以下方法在 `AssetLoader.ts` 中定义但从未被外部调用：
- `downloadEraPack()` ❌ 零调用
- `preloadNextEra()` ❌ 零调用
- `getExpansionUrl()` ❌ 零调用（关键获取资源路径API未被使用，应用直接依赖原生网络请求）
- `isAssetAvailable()` ❌ 零调用
- `getEraStatus()` ❌ 零调用
- `getCoreAssetUrl()` ❌ 零调用

**实际被外部调用的仅有**：
- `init()`（在 `main.tsx`）
- `getStats()` 和 `downloadPack()`（在 `SettingsModal.tsx` 手动操作触发）
- `getManifest()`。

### 3.3 `pack_uncategorized` 占 41% — 分类逻辑覆盖不全
`generate-manifest.mjs` 的 `detectEra()` 函数通过文件名关键词匹配纪元，导致 73 个资源（144 MB）被分到了未分类包。
包含：不含特定关键词的结局 CG、角色立绘、通用 UI 图、部分音乐等。分类算法亟需更新。

### 3.4 Layer 3 热更新框架空转
- `PatchManager` 代码完整，具备 IndexedDB 持久化。
- `main.tsx` 启动时调用了 `patchManager.init()` + `applyPendingPatches()`。
- 但 `asset_manifest.json` 中 `patches` 数组始终为空（`"patches": []`, `"latestPatch": null`）。
- 没有远程补丁服务器、没有补丁生成工具。

### 3.5 Core 层形同虚设
Core 层设计为「预缓存、启动即用」。目前仅 1 个 `character_default.png`。
虽然 JSON 数据文件被生成到 manifest 的 core 里，但 Vite 构建已将它们打包进 JS bundle。该层失去了预载大资源的意义。

### 3.6 版本号硬编码在多处
- `SettingsModal.tsx:402`：硬编码 `v0.9.0-beta`，与 package.json 不一致。
- `generate-manifest.mjs:183`：manifest 版本硬编码 `1.0.0`。

### 3.7 UI 交互可用但体验有限
设置面板的 Storage tab 是目前**唯一可用**的下载入口。
- ✅ 展示包列表、大小、状态。总进度条与单包下载按钮。
- ❌ 无「全部下载」功能。
- ❌ 无「删除缓存」功能。
- ❌ 包名称与描述为纯英文及默认文案（如 `crisis_era Pack`），界面汉化不完整。

## 4. 结论与总结

| 层级 | 设计状态 | 实际运行状态 |
|:---|:---|:---|
| **Layer 1 (Core)** | 类型+加载器已定义 | ⚠️ 仅 1 个资源，分类形同虚设 |
| **Layer 2 (Expansion)** | 完整的按包下载+DB+进度回调 | ⚠️ 仅设置面板手动可用；**主循环未接入自动下载** |
| **Layer 3 (Patch)** | 完整的补丁管理器+启动自动应用 | ❌ 补丁列表空，无分发工具 |
| **清单生成** | 构建时自动扫描生成 | ⚠️ 41% 资源未分类；版本号硬编码 |
| **PWA 缓存策略** | 三层 Workbox 配置完整 | ✅ 正常运作 |
| **UI** | 设置面板 Storage tab | ⚠️ 可用但功能有限 |

**一句话总结**：骨架完整、代码质量不错，但「自动按需下载」这个核心功能完全没接线到游戏逻辑中，资源分类覆盖率也不足。这些遗留的技术债已作为 `RED` 状态记录在案，等待进一步修复。
