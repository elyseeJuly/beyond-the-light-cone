# Scenario Registry — 场景测试注册表
> 最后更新：2026-06-26
> 发布条件：所有条目为 GREEN

## 发布状态：🟢 就绪（0 RED / 4 总计）

| ID   | 类型 | 场景名称 | 玩家路径 / 测试描述 | 状态  | 对应问题 | 测试文件 |
|------|------|---------|-------------------|-------|---------|---------|
| SCEN-TUTORIAL-NAV | UI/UX | 教程导航侧边栏 | 桌面端教程卡片展示垂直分类侧边栏，移动端水平滑动 | 🟢 GREEN | 1. 新手教程ui老样子演示按钮在顶部 | TutorialRemedy.scenario.test.tsx |
| SCEN-HUD-RESPONSIVE | UI/UX | HUD 移动端自适应双行布局 | 移动端宽度小于768px时HUD使用双行布局，不隐藏任何核心数值 | 🟢 GREEN | 2. 下一回合按钮失踪; 3. 顶部数值显示不全 | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-BLOCKER | 交互 | 教程期间“下一回合”点击突破阻断 | 教程未完成时，AI脑关闭，存在阻断时，“下一回合”不被禁用且能推进回合 | 🟢 GREEN | 2. 下一回合按钮失踪（教程期间禁用阻断） | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-CLICK-THROUGH | 交互 | 教程高亮抠孔点击穿透 | 教程高亮特定元素时，点击抠孔可以触发底层按钮（如AI脑），点击遮罩其他地方无效 | 🟢 GREEN | 4. ai智脑托管按钮不能点击 | TutorialRemedy.scenario.test.tsx |

## 变更日志
- 2026-06-26: 所有4个UI与教程交互场景测试全部通过 (GREEN)
- 2026-06-26: 注册四个UI与教程交互场景测试条目 (RED)
- 2026-06-26: 初始化场景注册表
