# 《宇宙群英传：三体》重构开发历程存档

本目录记录了从项目审计到核心机制（P0-P9）重构完成的全过程文档与美术资产。

## 文档索引

### 核心规范
- [REBUILD_SPEC_PART1.md](../REBUILD_SPEC_PART1.md): 技术架构、代码修复、全局模式与序列化规范。
- [REBUILD_SPEC_PART2.md](../REBUILD_SPEC_PART2.md): 玩法系统、科技树节点表、AI武器规则与美术规范。

### 开发进度与实录
- [task.md](./task.md): 项目阶段性任务清单（P0 - P9）。
- [walkthrough.md](./walkthrough.md): 核心代码实现的详细技术说明（包含纪元、面壁者、行星发动机、数字生命、多元胜利与主题切换）。
- [implementation_plan.md](./implementation_plan.md): 初始重构方案与技术路径规划。

### 设计与规划
- [ui_art_plan.md](./ui_art_plan.md): 三体主题美术UI方案，包括配色、交互与视觉美学设定。

## 美术资产 (assets/)
包含 AI 生成的角色立绘与 UI 概念图：
- `character_luoji.png`: 罗辑角色概念图。
- `character_sophon.png`: 智子角色概念图。
- `main_star_map_ui.png`: 主星图 UI 概念设计。
- `light_theme_ui.png`: 浅色模式（PDC风格）UI 概念设计。

## 自动化工具
在项目根目录下还保留了以下工具脚本，方便后续维护：
- `generate_ini.py`: 生成角色与文明数据的脚本。
- `generate_events.py`: 生成三体核心事件链（月球危机等）的脚本。
- `refactor_enums.py`: 执行全局 UI 科技树枚举解耦的脚本。

---
存档时间：2026-05-11
存档状态：重构完成 (P0 - P9)
存档人：Antigravity AI Assistant
