# Scenario Registry — 场景测试注册表
> 最后更新：2026-06-29
> 发布条件：所有条目为 GREEN

## 发布状态：🟢 就绪（0 RED / 8 总计）

| ID   | 类型 | 场景名称 | 玩家路径 / 测试描述 | 状态  | 对应问题 | 测试文件 |
|------|------|---------|-------------------|-------|---------|---------|
| SCEN-TUTORIAL-NAV | UI/UX | 教程导航侧边栏 | 桌面端教程卡片展示垂直分类侧边栏，移动端水平滑动 | 🟢 GREEN | 1. 新手教程ui老样子演示按钮在顶部 | TutorialRemedy.scenario.test.tsx |
| SCEN-HUD-RESPONSIVE | UI/UX | HUD 移动端自适应双行布局 | 移动端宽度小于768px时HUD使用双行布局，不隐藏任何核心数值 | 🟢 GREEN | 2. 下一回合按钮失踪; 3. 顶部数值显示不全 | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-BLOCKER | 交互 | 教程期间“下一回合”点击突破阻断 | 教程未完成时，AI脑关闭，存在阻断时，“下一回合”不被禁用且能推进回合 | 🟢 GREEN | 2. 下一回合按钮失踪（教程期间禁用阻断） | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-CLICK-THROUGH | 交互 | 教程高亮抠孔点击穿透 | 教程高亮特定元素时，点击抠孔可以触发底层按钮（如AI脑），点击遮罩其他地方无效 | 🟢 GREEN | 4. ai智脑托管按钮不能点击 | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-STEPS-MATCH | 设计偏离 | 教程步骤分类对齐 | 教程各步骤的 category 必须与 LeftHub 的导航项完全一致 | 🟢 GREEN | 教程分类与 LeftHub 侧边栏导航不匹配 | TutorialRemedy.scenario.test.tsx |
| SCEN-MANUAL-BLOCKER | 交互 | 手动模式阻断与消除 | 非教程期间，手动模式下存在阻断时按钮禁用显示“有阻断”，阻断消除后恢复可用 | 🟢 GREEN | 手动模式回合阻断与指示器显示问题 | TutorialRemedy.scenario.test.tsx |
| REG-BUILD-CLEAN | Regression | 编译构建无警告 | 本地与 CI 环境构建无 TypeScript 未使用变量警告/错误，打包流程正常 | 🟢 GREEN | GitHub Pages 编译失败与未引用变量报错 | package.json (npm run build) |
| REG-PWA-FREEZE | Regression | PWA 更新卡住修复 | 修复 GitHub Pages 下使用相对路径导致 Service Worker 更新及页面刷新卡死的问题 | 🟢 GREEN | 立即更新按钮点击卡住/白屏 | vite.config.ts |

## 变更日志
- 2026-06-29: SCEN-HUD-RESPONSIVE 从 RED 变 GREEN（TopHUD 增加 shrink-0 防缩水修复）
- 2026-06-29: SCEN-TUTORIAL-STEPS-MATCH 从 RED 变 GREEN（重新排列引导步骤以完美匹配 LeftHub 目录顺序）
- 2026-06-29: 新增 REG-PWA-FREEZE 并直接设为 GREEN（已配置 CI 绝对路径以修复 SW 更新卡死）
- 2026-06-29: 新增 REG-BUILD-CLEAN 并直接设为 GREEN（已修复测试代码多余声明并验证打包无碍）
- 2026-06-29: 新增 SCEN-MANUAL-BLOCKER 并直接设为 GREEN（经验证功能完备并通过测试）
- 2026-06-26: 所有4个UI与教程交互场景测试全部通过 (GREEN)
- 2026-06-26: 注册四个UI与教程交互场景测试条目 (RED)
- 2026-06-26: 初始化场景注册表
