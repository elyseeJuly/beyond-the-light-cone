# 资源分层加载架构规范 Specification
> **Date**: 2026-06-21  
> **Status**: Implemented  
> **Category**: Specifications & Design Systems (`SPEC_`)

本文档定义了《光锥之外：纪元往事》1GB 级游戏资源的**三层分层加载架构**——将约 310 MB 游戏资源拆解为核心包、扩展包、热补丁三层，实现首次安装 < 50 MB 即可游玩。

---

## 1. 架构总览

### 1.1 分层定义

| 层 | 名称 | 内容 | 大小 | 缓存策略 |
|:---|:---|:---|:---|:---|
| **Layer 1** | 核心包 (Core) | JS/CSS/HTML/JSON/UI图标 | ~1 MB | PWA 预缓存，永不删除 |
| **Layer 2** | 扩展包 (Expansion) | CG/立绘/BGM/音效/结局图 | ~310 MB | 运行时缓存，按纪元/类型按需下载 |
| **Layer 3** | 热补丁 (Patch) | 数值调整/BUG修复/文本修正 | KB~MB 级 | NetworkFirst，自动覆盖 |

### 1.2 核心原则

```
❗ "没有资源也能玩完整一局"
❗ "资源 = 体验增强, 不是游戏本体"
❗ "玩到哪, 下到哪, 不阻塞游戏进程"
❗ "删除缓存 ≠ 游戏损坏"
```

### 1.3 架构图

```
                    PWA Shell (安装/启动/缓存控制)
                             │
                     Core Package (~1 MB)
                    ┌──────────────────────┐
                    │  JS / CSS / HTML      │
                    │  JSON 事件数据 / 科技树│
                    │  配置文件 / UI 图标    │
                    └──────────┬───────────┘
                               │
                    Game Runtime System
               ┌──────────────────────────────┐
               │  AssetLoader + PatchManager   │
               └──────┬──────────────┬────────┘
                      │              │
            ┌─────────▼───┐   ┌─────▼──────────┐
            │ Expansion    │   │ Hot Patch      │
            │ Packs        │   │ (KB~MB, JSON)  │
            │ 5 era packs  │   │ auto-apply     │
            │ 3 type packs │   │                │
            └──────────────┘   └────────────────┘
```

### 1.4 关键文件清单

| 文件 | 职责 |
|:---|:---|
| [asset.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/types/asset.ts) | 三层资源类型定义 |
| [AssetLoader.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AssetLoader.ts) | 资源加载器：按包下载、进度回调、预加载 |
| [PatchManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/PatchManager.ts) | 热更新管理器：补丁查询、验证、应用 |
| [generate-manifest.mjs](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/scripts/generate-manifest.mjs) | 清单生成器：扫描 public/ → 分类 → 输出 |
| [public/asset_manifest.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/public/asset_manifest.json) | 资源清单：108 项扩展资源，8 个包 |
| [vite.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts) | PWA 三层缓存策略配置 |
| [main.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/main.tsx) | 启动流程：AssetLoader → PatchManager → Game → SW |

---

## 2. Layer 1: 核心包 (Core Package)

### 2.1 内容

| 类别 | 内容 | 大小 |
|:---|:---|:---|
| JS 包体 | React + TypeScript + 游戏引擎 | ~970 KB (gzip 296 KB) |
| CSS 包体 | Tailwind + 主题 + 动画 | ~125 KB (gzip 18 KB) |
| HTML | index.html | ~1.5 KB |
| JSON 数据 | 事件库、科技树、配置文件 | ~287 KB |
| UI 图标 | PWA 图标、默认角色占位图 | ~0.8 MB |
| **合计** | | **~1 MB** |

### 2.2 禁止放入核心包的内容

- CG 剧情图（~300 MB）
- BGM 大文件（~48 MB）
- 语音
- 高清立绘

### 2.3 PWA 预缓存配置

```typescript
// vite.config.ts
globPatterns: ['**/*.{js,css,html,json,woff2,woff,ttf,eot,svg}'],
includeAssets: ['icons/*.png'],  // 仅 PWA 图标，不含 CG/音频
```

构建结果：**8 项预缓存**（改造前为 112 项）

---

## 3. Layer 2: 扩展资源包 (Expansion Packs)

### 3.1 内容分类

| 类型 | 文件数 | 大小 | 示例 |
|:---|:---|:---|:---|
| CG 剧情图 | 约 60 张 | ~200 MB | `cg_crisis_start.png`, `cg_doomsday_battle.png` |
| 角色立绘 | 约 10 张 | ~30 MB | `unified_ye_wenjie.png`, `npc_luo_ji.png` |
| 结局图 | 约 8 张 | ~30 MB | `ending_hidden.png`, `ending_broadcast.png` |
| BGM | 约 12 首 | ~48 MB | `audio/*.mp3` |
| **合计** | **108 项** | **~310 MB** | |

### 3.2 包结构

#### 按纪元拆分（5 个 era pack）

| 包 ID | 纪元 | 优先度 | 包含内容 |
|:---|:---|:---|:---|
| `pack_crisis_era` | 危机纪元 | 1（最高） | 智子封锁、古筝行动、末日战役等 CG |
| `pack_deterrence_era` | 威慑纪元 | 2 | 威慑建立、技术爆炸、澳大利亚等 CG |
| `pack_broadcast_era` | 广播纪元 | 3 | 坐标广播、二向箔、太阳系二维化等 CG |
| `pack_stardust_era` | 星屑纪元 | 4 | 星屑时代、维德政变等 CG |

#### 按类型拆分（3 个 type pack）

| 包 ID | 说明 | 用途 |
|:---|:---|:---|
| `pack_cg` | 全部 CG 合集 | 博物馆/图鉴模式一次性展示 |
| `pack_music` | 全部 BGM 合集 | 音乐鉴赏模式 |
| `pack_character` | 全部立绘合集 | 角色图鉴 |

### 3.3 加载策略

```
进入新纪元
  └→ 检测对应 era pack 是否已下载
       ├── 已下载 → 直接使用
       └── 未下载 → 后台异步下载（不阻塞游戏）
       
预加载
  └→ 当前纪元末尾，提前下载下个纪元 pack 的 30%
  
资源获取
  └→ AssetLoader.getExpansionUrl(assetId)
       ├── 已缓存 → 返回本地 URL
       └── 未缓存 → 返回在线 URL，触发后台下载
```

### 3.4 PWA 运行时缓存

```typescript
// Layer 2: 图片 — CacheFirst / 90天
{ cacheName: 'exp-images', handler: 'CacheFirst', maxAgeSeconds: 90天 }

// Layer 2: 音频 — StaleWhileRevalidate / 90天
{ cacheName: 'exp-audio', handler: 'StaleWhileRevalidate', maxAgeSeconds: 90天 }
```

---

## 4. Layer 3: 热更新补丁 (Hot Patch)

### 4.1 补丁类型

| 类型 | 体积 | 频率 | 内容 |
|:---|:---|:---|:---|
| `balance` | KB 级 | 中 | 数值/胜率调整 |
| `bugfix` | KB 级 | 高 | BUG 修复 |
| `text` | KB 级 | 低 | 文本修正 |
| `event` | KB~MB | 低 | 事件条件修改 |
| `ui` | KB 级 | 低 | UI 修复 |
| `system` | KB 级 | 极低 | 系统配置 |

### 4.2 补丁格式

```json
{
  "version": "1.0.3",
  "type": "balance",
  "description": "第34号事件胜率平衡调整",
  "minCompatibleVersion": "1.0.0",
  "changes": [
    {
      "target": "events.E034.win_rate",
      "description": "降低三体舰队到达概率",
      "oldValue": 0.12,
      "newValue": 0.08
    }
  ],
  "timestamp": 1750000000000,
  "size": 256
}
```

### 4.3 补丁生命周期

```
启动游戏
  └→ PatchManager.init(manifest)
       └→ 读取本地已应用历史
       └→ 对比可用补丁列表
       └→ 自动应用待处理补丁（按版本顺序）
       
运行中
  └→ PatchManager.applyPatchToData(baseData)
       └→ 遍历已应用的补丁
       └→ 逐个替换变更字段
```

### 4.4 PWA 补丁缓存

```typescript
// Layer 3: 资源清单 — NetworkFirst（总是最新）
{ cacheName: 'patch-manifest', handler: 'NetworkFirst', maxAgeSeconds: 1天 }

// Layer 3: 补丁文件 — NetworkFirst（优先网络）
{ cacheName: 'patch-files', handler: 'NetworkFirst', maxAgeSeconds: 7天 }
```

---

## 5. 资源清单 (asset_manifest.json)

### 5.1 生成流程

```bash
# 手动生成
node scripts/generate-manifest.mjs

# 集成到构建（自动运行）
npm run build  # → generate-manifest → tsc → vite build
```

### 5.2 清单结构

```json
{
  "version": "1.0.0",
  "gameVersion": "1.0.0",
  "generatedAt": 1750000000000,
  "core": [ /* Layer 1 核心资源 */ ],
  "expansion": {
    "assets": [ /* 108 项扩展资源 */ ],
    "packs": [ /* 8 个资源包 */ ]
  },
  "patches": [],
  "latestPatch": null
}
```

### 5.3 资源归类规则

| 属性 | 判定逻辑 |
|:---|:---|
| 纪元归属 | 根据文件名关键词（crisis/deterrence/broadcast/stardust） |
| 资源类型 | 根据前缀（cg_/ending_/unified_/npc_）和子目录（audio/） |
| 核心/扩展 | UI 图标 → 核心；CG/立绘/BGM → 扩展 |

---

## 6. 启动流程

```
main.tsx bootstrap()
  ├─ Step 1: storage.init()          → IndexedDB 存档存储
  ├─ Step 2: assetLoader.init()      → 加载 asset_manifest.json
  ├─ Step 3: patchManager.init()     → 加载补丁列表
  ├─ Step 4: patchManager.applyPendingPatches() → 自动应用补丁
  ├─ Step 5: GameInstance.get()      → 启动游戏引擎
  ├─ Step 6: SW register             → 注册 Service Worker
  └─ Step 7: ReactDOM.render(App)    → 渲染 UI
```

---

## 7. 性能指标

| 指标 | 改造前 | 改造后 | 目标 |
|:---|:---|:---|:---|
| PWA 预缓存条目 | 112 项 | **8 项** | — |
| 首次可玩 | 需下载 ~336 MB | **~1 MB** | < 50 MB |
| 扩展资源管理 | 无（全部打包） | **8 个按需下载包** | 按纪元/类型 |
| 热更新 | 无 | PatchManager | 自动应用 |
| 构建大小 | 336 MB | **~1 MB** (扩展按需) | — |

---

## 8. 目录规范

```
public/
├── asset_manifest.json          # 资源清单（自动生成）
├── icons/                       # PWA 图标
├── images/                      # CG/立绘/结局图（Layer 2）
│   ├── cg_*.png
│   ├── unified_*.png
│   ├── npc_*.png
│   ├── ending_*.png
│   └── character_default.png
├── audio/                       # BGM（Layer 2）
│   └── *.mp3
├── fonts/                       # 自定义字体
├── patches/                     # 热补丁 JSON（Layer 3，未来扩展）
├── sw.js                        # Service Worker（构建生成）
├── manifest.webmanifest         # PWA 清单（构建生成）
└── index.html                   # HTML 入口

src/
├── core/
│   ├── AssetLoader.ts           # 资源加载器
│   └── PatchManager.ts          # 热更新管理器
├── types/
│   └── asset.ts                 # 资源类型定义
└── hooks/
    └── useBreakpoint.ts         # 响应式断点 Hook（供 UI 层使用）

scripts/
└── generate-manifest.mjs        # 清单生成器
```