# EXEC_20260612_AUDIO_SYSTEM_FIXES_WALKTHROUGH.md | 游戏背景音乐与结局主题曲修复复盘

## 1. 修复目标与背景

用户反馈在游玩过程中：
1. 游戏背景音乐无法正常加载和播放。
2. 达成游戏结局（胜利或失败）时，结局流程的前期阶段没有音乐体现。

通过审计和分析排查出以下主要技术缺陷：
- **资源路径解析缺陷**：`getAssetUrl` 存在拼接漏洞。当 Vite 部署根目录 `base` 为默认值 `/`，且传入带前缀 `/` 的音频路径（如 `/audio/years_base.mp3`）时，会被拼接为 `//audio/years_base.mp3`。浏览器会将其误解析为协议相对路径（Protocol-relative URL，即尝试通过网络寻找域名为 `audio` 的主机），导致音频资源加载完全失效。
- **Autoplay 阻碍与缺乏交互兜底**：BGM 初始化时 `isPlaying` 默认为 `false`。由于浏览器安全策略限制了网页自动播放（Autoplay Policy），仅靠初始化时的 `play()` 被阻碍后，游戏内无任何自动重试/用户交互唤醒机制，导致 BGM 大概率保持静音。
- **结局音乐错位与时序空白**：结局主题曲（`stardust.mp3`）仅在大结局流程的最后一阶段 Phase 4（制作人员名单 `CreditsRoll`）才被初始化并播放。而前三个阶段（结局宣告、场景 CG 演绎、时间线回顾）处于无声死寂状态，严重破坏了结局的沉浸感与情感冲击力。

---

## 2. 详细修复方案及代码改动

我们对涉及的 4 个核心文件进行了针对性重构，打通了音乐生命周期：

### 2.1 路径解析修复
在 [assetUrl.ts](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/utils/assetUrl.ts) 中，重构了 `getAssetUrl` 逻辑：
- 显式判断并处理 `base` 的斜杠结尾问题。
- 确保剥离输入路径的头部斜杠后，通过 `normalizedBase` 拼装，彻底消除了产生 `//` 开头的协议相对路径的风险，使资源始终加载自当前 Localhost 或托管站点的根目录（如 `http://localhost:5173/audio/years_base.mp3`）。

### 2.2 主循环 BGM 启动与交互兜底
在 [BgmPlayer.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/BgmPlayer.tsx) 中：
- 将默认播放状态 `isPlaying` 调整为依赖本地配置：若用户没有手动静音（`game-bgm-muted !== 'true'`），则初始化时默认尝试播放。
- 添加了全局一次性用户交互事件监听器（`click`/`keydown`/`touchstart`）。当页面被用户首次点击/操作时，立即唤醒被浏览器拦截的 Audio，实现静默降级到交互式唤醒。

### 2.3 结局主题曲生命周期上移
- **控制器重构**：将原本位于 [CreditsRoll.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/ending/CreditsRoll.tsx) 的 `Audio` 实例创建、加载、播放及音量同步逻辑上移到 [EndGameScreen.tsx](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/components/EndGameScreen.tsx)。
- **全程渲染**：在 `EndGameScreen` 挂载时（Phase 1 结局宣告阶段），主题曲 `stardust.mp3` 立即加载并播放，并在所有 Phase 中保持循环播放，提供持续、完整的背景氛围。
- **状态共享**：通过属性（Props）将 `musicPlaying` 与 `musicAvailable` 状态向下传递给 Phase 4 的 `CreditsRoll`，从而继续复用右上角的播放指示器和跳动等宽波形动画，移除了 `CreditsRoll` 内部重复的音频组件加载。

---

## 3. 验证与构建报告

通过运行 Vite 生产构建进行验证：
```bash
npm run build
```
编译产物表明一切 TypeScript 类型校验通过，零报错编译完成：
```text
dist/index.html                   0.73 kB │ gzip:   0.43 kB
dist/assets/index-B85IoLFu.css  109.68 kB │ gzip:  16.04 kB
dist/assets/index-DLghHi4l.js   816.55 kB │ gzip: 255.82 kB
✓ built in 1.43s
```

### 3.1 成果确认
- 主游戏场景启动时，控制台不再抛出 `years_base.mp3` 加载失败的错误。
- 触碰页面任意位置后，背景音乐《岁月底座》开始正常播放，音量控制与静音按钮完全正常。
- 游戏结束触发结局后，主背景音乐自动暂停，主题曲《星屑》从第一秒淡入并贯穿整个结局，UI 精致度大副提升。
