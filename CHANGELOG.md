# 变更日志 (CHANGELOG)

本项目遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/) 规范。

## [v0.9.0-beta] - 2026-06-21

这是《光锥之外：纪元往事》的首个 Beta 测试版本，主要目的是进行设备兼容性测试、PWA功能验证及收集核心玩家反馈。

### 新增 (Added)
- **部署配置**：新增 `gh-pages` 部署脚本，自动化发布到 GitHub Pages。
- **玩家反馈**：在游戏内的侧边栏增加了直达 GitHub Issues 的 Feedback 反馈通道。
- **埋点统计**：引入 `StatisticsManager` 统计玩家的游玩时间、不同结局达成次数、事件触发率以及科技研究进度（数据支持本地缓存并在具备服务条件时上传）。
- **版本控制体系**：新增版本声明与 CHANGELOG 变更日志记录规范。

### 优化 (Optimized)
- **PWA 功能**：优化 Web App Manifest 及更新提示（Update Prompt）、横屏提示（Orientation Prompt）。
- **术语字典与文档**：代码库与项目规范全面审计，修复了部分代码实体（如 `Science` 与 `Culture`）中的定义歧义。
- **类型安全**：重构并清理了 `PersonManager` 和 `GameEventManager` 中涉及联合类型或硬编码的隐患。

### 修复 (Fixed)
- 修复了 PWA 在离线状态下的缓存失效风险。
- 修复了测试框架中的冗余代码与测试报告归档错位问题。
