# 🌌 《光锥之外：纪元往事》
## Beyond the Light Cone: Epoch Chronicles

> （原名：*Legend of Uni Rebuild · 宇宙群英传重构计划*）
>
> *「失去人性，失去很多；失去兽性，失去一切。」*
>
> —基于《三体》宇宙观的硬核回合制 **4X 太空策略模拟游戏**

---

<div align="center">

[![Web Version](https://img.shields.io/badge/Web_Version-Alpha_2.5-orange.svg)](#-web-重构版)
[![Play Online](https://img.shields.io/badge/Play_Online-GitHub_Pages-success.svg)](https://elyseejuly.github.io/beyond-the-light-cone/)
[![Stack](https://img.shields.io/badge/Stack-React_19_|_Vite_8_|_TS_5-61dafb.svg)](#-技术栈)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#-开源协议--license)
[![Build](https://img.shields.io/badge/TypeScript-零错误零警告-success.svg)](#)
[![Platform](https://img.shields.io/badge/Platform-Web_|_PWA_|_Desktop_(Tauri)-blueviolet.svg)](#-本地运行)

<br>

👉 **[在线游玩 Web 网页重构版](https://elyseejuly.github.io/beyond-the-light-cone/)** 👈

</div>

---

## 🌠 项目简介

《光锥之外：纪元往事》是基于经典 **《宇宙群英传》(Legend of Uni)** 核心策略框架的现代化 Web 重写与系统架构重构项目。

你将在 **2009 年的危机纪元** 中临危受命，担任联合政府最高执政官。面对三体舰队迫近的末日危机，你需要在：

- 🧘‍♂️ **面壁计划** & **执剑人威慑**
- 🏰 **掩体城防御**
- 🚀 **曲率 / 光速飞船逃亡**
- 🧠 **数字永生 / 意识上传**

之间做出抉择，在多文明竞逐的 **黑暗森林** 宇宙中，为人类文明搏得一线生机。

---

## ✨ 核心特色

| 系统 | 说明 |
| :--- | :--- |
| ⏳ **六大文明纪元演进** | 危机 → 威慑 → 广播 → 掩体 → 银河 → 星屑，每切换纪元触发史诗级全屏 CG 宣言 |
| 🏭 **四维资源生产链** | 采矿 / 加工 / 文化 / 人口，与三体原著世界观深度耦合 |
| 🔬 **85 节点科技树** | 5 大研发分支：基础物理、航天工程、军事武器、信息技术、星际文明 |
| 🏛️ **跨周目遗迹 NG+** | 失败文明的科技 / 文化持久化至 `LocalStorage`，新周目可逆向研究继承遗产 |
| ⏪ **命运分歧点回溯** | 每回合自动快照，失误暴毙可一键回溯至 **5 回合前** 重新决策 |
| 👁️ **宇宙观察者模式** | 文明消亡后退出决策角色，静观外星 AI 竞逐与宇宙演化 |
| 🎨 **极简巨物原画风 CG** | Craig Mullins 风格 21:9 电影级美术；7 大历史节点 CG + 5 大新增结局 CG 全量补全 |
| 🎵 **OST 配乐系统** | 纪元主题音乐 + 结局专属曲目，动态氛围引擎 `AtmosphereEngine` 驱动 |
| 📱 **PWA 响应式** | 移动端适配，桌面端 Tauri 构建；支持离线缓存、安装至主屏，已沉淀完整 [PWA 开发方案](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260622_PWA_DEVELOPMENT_GUIDE.md) |
| ✅ **全量测试覆盖** | Vitest 单元测试 + Playwright E2E + 500 回合 Headless 自动推演 |

---

## 🎮 快速开始 · 本地运行

### 环境要求

- **Node.js ≥ 20**
- **npm ≥ 10**
- （桌面端可选）**Rust + Tauri** 环境

### 启动 Web 版本

```bash
# 1. 进入工程目录
cd 03_Web_Rebuild

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
# → 默认打开 http://localhost:5173
```

### 构建生产版本 / 部署

```bash
# 构建（含资产清单生成 + TS 类型检查 + Vite 打包）
npm run build

# 本地预览构建产物
npm run preview

# 部署到 GitHub Pages（子路径 /beyond-the-light-cone/）
npm run deploy

# 部署到 Cloudflare Workers（根路径，使用 wrangler static assets）
npm run deploy:cf
```

### 桌面端（Tauri）

```bash
cd 03_Web_Rebuild
npm run tauri:dev        # 开发模式
npm run tauri:build      # 打包当前系统版本
npm run tauri:build:win  # Windows 版 (x86_64-pc-windows-msvc)
npm run tauri:build:mac  # macOS 版 (aarch64-apple-darwin)
```

### 测试命令

```bash
npm run test             # 运行单元测试 (Vitest)
npm run test:coverage    # 运行覆盖率报告
npm run test:e2e         # 运行 Playwright E2E
npm run typecheck        # TypeScript 零错误验证
npm run lint             # ESLint 校验
```

---

## 🧭 玩法指引 · 五分钟上手

1. **第 1–10 回合 · 生存**：在危机纪元下分配工人至采矿/加工部门，优先研发「化学推进」与「恒星级氢弹」。任命一位面壁者。
2. **第 10–50 回合 · 威慑**：建立罗辑威慑体系，同时推进「行星发动机 / 工质核聚变」与「思想钢印」。警惕三体舰队的水滴突袭。
3. **第 50–200 回合 · 突破**：开启引力波广播（若威慑破裂），向掩体 / 曲率驱动 / 数字永生三条路线倾斜资源。
4. **第 200 回合+ · 终局**：
   - ✅ **黑域胜利**：解锁「曲率驱动」→「黑域生成」
   - ✅ **流浪胜利**：建成「行星发动机Ⅲ型」
   - ✅ **数字永生胜利**：完成「意识上传」
   - ✅ **银河公民 / 宇宙重启**：走完星际文明分支
   - ❌ **氦闪 / 降维 / ETO 接管**：失败但会触发 NG+ 遗迹，下周目继承文化值

---

## 🛠 技术栈

| 层级 | 技术 |
| :--- | :--- |
| **前端框架** | React 19 · TypeScript 5 · Vite 8 |
| **样式方案** | Tailwind CSS 4 · Framer Motion · Canvas Pattern（GPU 背景） |
| **UI 图标** | Lucide React |
| **数据验证** | Zod |
| **PWA / 打包** | vite-plugin-pwa · gh-pages · Cloudflare Workers |
| **桌面端** | Tauri |
| **测试体系** | Vitest · Playwright |
| **CI / CD** | GitHub Actions（`.github/workflows/`） |

---

## ⚡ 性能与加载优化亮点

- **高精素材预加载**：`preloadCoreImages` 在启动时异步预载全部 21:9 电影级 CG 与 36 位主要角色立绘，消除弹窗闪白，实现 **CG 实时瞬间呈现**。
- **GPU 硬件加速背景**：使用 Canvas Pattern（GPU 渲染）替代逐像素 CPU 噪点绘制。低端机型 (`tier === 'low'`) 自动关闭 `requestAnimationFrame` 循环，只在缩放时更新一次背景，消除发热与卡顿。
- **切片化叙事引擎 `SliceNarrativeEngine`**：事件、对白、因果链分层加载，避免首屏阻塞。
- **PWA 离线缓存**：`service-worker` + `asset_manifest.json` 资源清单，断网可继续游戏。

---

## 📂 项目结构

```
beyond-the-light-cone/
├── 01_Windows_Source/            # 原始 MFC C++ 源码（重构修复版·宇宙群英传原版）
│   ├── 3DPrelude/                # 3D 预渲染片头
│   └── LengendOfUni/             # 核心游戏逻辑
│
├── 02_Project_Documentation/     # 项目文档 · 审计报告 · 规格说明
│   ├── SPEC_*.md                 # 规格 / 规范（美术 / 结局 / 事件 / 架构）
│   ├── EXEC_*.md                 # 执行计划 / Walkthrough
│   ├── AUDIT_*.md                # 代码 / 叙事 / 时间轴审计
│   ├── TEST_*.md                 # 测试规划与报告
│   └── HIST_*.md                 # 开发日志与历史
│
├── 03_Web_Rebuild/               # 本次重构计划的 Web 网页版工程（Vite + React）
│   ├── src/
│   │   ├── core/                 # 游戏核心逻辑（Game / EarthCivilization / TecTree 等）
│   │   ├── components/           # UI 面板 · 结局过场 · 画廊
│   │   ├── data/                 # JSON 数据：人物 / 事件 / 武器 / 外星文明 / 纪元
│   │   ├── config/               # 配置（结局、星图索引）
│   │   ├── test/                 # Vitest + Playwright 测试集
│   │   ├── hooks/                # 自定义 React Hooks
│   │   └── utils/                # 工具函数（资源 URL / i18n / 随机）
│   ├── public/                   # 静态资源（CG / 音乐 / 图标 / PWA 清单）
│   ├── vite.config.ts            # Vite 配置（适配路由 base）
│   └── package.json              # 完整 npm 脚本清单
│
└── README.md
```

### 核心代码导读

- [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) — 游戏主循环与状态机
- [EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts) — 人类文明核心数据模型
- [TecTreeManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/TecTreeManager.ts) — 85 节点科技树调度
- [SliceNarrativeEngine.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/SliceNarrativeEngine.ts) — 切片化叙事引擎
- [endingConfig.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/config/endingConfig.ts) — 结局触发判定
- [MuseumGallery.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/MuseumGallery.tsx) — 岁月史书永久画廊

---

## 🖼 游戏截图

| 主星空地图 | 科技树面板 |
| :---: | :---: |
| ![主界面](02_Project_Documentation/assets/main_star_map_ui_1778467960198.png) | ![科技树](02_Project_Documentation/assets/light_theme_ui_1778468416048.png) |

| 罗辑角色立绘 |
| :---: |
| ![罗辑](02_Project_Documentation/assets/character_luoji_1778467974903.png) |

---

## 🧪 测试体系

本项目配备三层自动化测试保障：

1. **单元测试（Vitest）**：覆盖核心数据模型、科技树、经济系统、结局判定、防绕过逻辑 — `src/test/core/`
2. **集成测试**：事件因果链 `EventChain`、存档读档 `SaveLoad`、标签事件互作 `TagEventIntegration`、通用事件引擎 `UEE_FullFlow`
3. **E2E 测试（Playwright）**：烟雾测试、核心流程、响应式布局 — `src/test/e2e-playwright/`
4. **Headless 自动推演**：`Autoplay500` 自动模拟 500 回合，验证长期数值稳定性

运行方式：[快速开始](#-快速开始--本地运行) 一节的「测试命令」。

---

## 📜 开源协议 (License)

- **代码部分**：采用 **MIT License** 开源 —欢迎学习、Fork、二次开发。
- **美术资源 · 文字文案 · 《三体》世界观设定**：版权归原作者及版权方（刘慈欣 / 《三体》版权方）所有，**仅限学习、交流与非商业性试玩体验使用**，请勿用于商业用途。

---

## 🤝 贡献指南（Welcome Contributors）

欢迎提交 **Issue / Pull Request**！请遵循以下流程：

1. **Fork 本仓库** → 在你的分支上进行改动。
2. 代码提交前请运行：
   ```bash
   cd 03_Web_Rebuild
   npm run typecheck   # 必须零错误零警告
   npm run lint        # 代码风格检查
   npm run test        # 单元测试全通过
   ```
3. 新增功能 / 修复 Bug 时，建议**同步补充对应 Vitest 用例**，并在 commit message 中简短说明。
4. 美术资源（CG / 立绘 / 音乐）请参考 `02_Project_Documentation/SPEC_20260622_ART_PROMPTS_GUIDE.md` 的统一视觉规范。
5. 提交 PR 后，GitHub Actions CI 会自动运行测试与构建，通过后会有维护者 Review。

---

## 📖 延伸阅读

项目在 `02_Project_Documentation/` 下有完整的开发与设计文档库，推荐从以下几篇开始：

| 文档 | 内容 |
| :--- | :--- |
| [AUDIT_20260621_ARCHITECTURE_REBUILD.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260621_ARCHITECTURE_REBUILD.md) | 完整架构重构审计 |
| [SPEC_20260621_ENDING_TRIGGER_PATHS_REDESIGN.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260621_ENDING_TRIGGER_PATHS_REDESIGN.md) | 结局触发路径重设计 |
| [SPEC_20260622_ART_PROMPTS_GUIDE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260622_ART_PROMPTS_GUIDE.md) | 美术资源提示词规范 |
| [EXEC_20260621_CG_ASSETS_COMPLETION_REPORT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260621_CG_ASSETS_COMPLETION_REPORT.md) | CG 重绘与结局视觉补全执行报告 |
| [AUDIT_20260622_EVENT_CAUSALITY_ANALYSIS.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260622_EVENT_CAUSALITY_ANALYSIS.md) | 事件因果链分析 |
| [SPEC_20260622_PWA_DEVELOPMENT_GUIDE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260622_PWA_DEVELOPMENT_GUIDE.md) | PWA 开发方案与多平台部署指南 |

---

## 🌟 Star History

如果这个项目让你对《三体》与太空策略游戏产生了兴趣，欢迎 **Star ⭐ / Fork 🍴**，让更多人看到它！

> *「宇宙就是一座黑暗森林，每个文明都是带枪的猎人……他必须小心，因为林中到处都有与他一样潜行的猎人。」*
>
> ——罗辑，《黑暗森林》
