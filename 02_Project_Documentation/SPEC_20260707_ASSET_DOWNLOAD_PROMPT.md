# SPEC_20260707_ASSET_DOWNLOAD_PROMPT.md - 高维宇宙数据包授权下载提示设计规范

## 1. 业务背景
《光锥之外》采用三层资源加载架构（L1 Core 核心、L2 Expansion 扩展、L3 Patch 补丁）。目前由于核心启动资源仅包含基本运行逻辑，高精度结局 CG、人物立绘和各纪元背景音乐（约 370MB）存放在分段的 L2 扩展包中。
为解决玩家对分段下载感知不足的问题，设计在新手教程完成或开始没有教程的新游戏时，弹出高维宇宙风格的资源下载提示框，引导玩家配置资源。

## 2. 交互与功能设计
### 2.1 触发机制 (Triggers)
满足以下所有条件时，弹出提示框：
1. 玩家完成新手教程（在 `Tutorial` 组件中点击“确认授权并开始”）或跳过新手教程直接进入游戏；或者开启不带教程的新游戏。
2. 缓存中存在尚未下载完成的扩展包（`assetLoader.getStats().pendingPacks.length > 0`）。
3. 本地存储中未标记“不再提示” (`localStorage.getItem('game-assets-prompt-seen') !== 'true'`)。

### 2.2 核心操作 (Actions)
模态框提供三个主操作按钮：
1. **一键智能全量下载 (Full Smart Autodownload)**
   * **行为**：直接在当前模态框内展示下载进度。调用 `assetLoader.downloadPack` 按顺序依次下载所有未完成的资源包。
   * **进度展示**：显示一个高亮发光的进度条，显示 `当前下载包名称`、`总包下载进度 (已完成包数 / 总包数)` 以及 `当前包下载百分比`。
   * **后台化**：提供“后台下载”按钮。点击后，模态框关闭，下载继续在后台默默运行，不影响玩家进行游戏。
2. **个性化选择下载 (Custom Settings)**
   * **行为**：关闭提示框，并直接呼起 `SettingsModal` 并默认激活 `'storage'` 标签卡，引导玩家手动勾选需要下载的资源类别（如只下载立绘或音乐）。
3. **暂不下载，按需加载 (Download on Demand)**
   * **行为**：直接关闭提示框。玩家可照常开始游戏，进入新纪元时游戏会在后台自动下载对应纪元的资源。

### 2.3 状态持久化 (Persistence)
* 提供“不再提示此界面”的勾选项。勾选并关闭模态框后，将在本地写入：
  `localStorage.setItem('game-assets-prompt-seen', 'true')`
* 无论玩家选择哪种下载方式，一旦开始下载或确认跳过，均默认设置该标志以避免重复干扰。

## 3. UI 视觉设计规范
模态框采用全息投影与科幻感视觉：
* **蒙版背景**：`bg-[#070B14]/80 backdrop-blur-md` 磨砂玻璃效果。
* **主体边框**：深蓝色发光描边 `border border-cyan-500/30`，四角添加全息切角元素。
* **主题色**：高亮青色（Cyan）与琥珀金（Amber）。
* **动效**：按钮悬浮时具备微弱的发光与平滑过渡效果（`transition-all duration-300`），下载进度条具备脉冲流光特效。

## 4. 集成接入点
* **App.tsx**: 增加 `showDownloadPrompt` 控制状态，引入 `<AssetDownloadPromptModal />` 组件。
* **SettingsModal.tsx**: 为 `SettingsModal` 扩展可选属性 `initialTab?: SettingsTab`，允许在挂载时直接指定激活 tab。
* **GameCoverScreen.tsx**: 在新游戏启动入口（无教程）时检查并设置弹窗触发标志。
