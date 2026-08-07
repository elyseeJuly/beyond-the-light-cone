# 项目状态看板

> 最后更新：2026-08-07  
> 更新方式：本文件在任务完成后手动更新；TASK-HYGIENE 完成后可由 `npm run status` 脚本自动生成

## 核心指标

| 指标 | 值 | 命令 |
|------|-----|------|
| TypeScript 编译 | ✅ 通过 | `npx tsc --noEmit` |
| 测试总数 | 1102 (1099通过, 3跳过) | `npm test` |
| 测试通过率 | 100% | ↑ |
| 测试文件数 | 65 (62通过, 3跳过) | ↑ |

## 当前活跃任务状态

- [x] TASK-P0: Beta 发布红线修复
- [x] TASK-AP: 执政指令点与 AI 智脑
- [x] TASK-EVENT: 事件实体化集成
- [ ] TASK-ARCH: 架构债务清理 (包含 Playwright 端口冲突与 E2E 覆盖待办)
- [x] TASK-HYGIENE: 项目卫生清理 (文档重组、空文件夹清理与冗余图标清除)
- [x] TASK-VIDEO: Remotion 宣传预告片生成
- [x] TASK-LOCALIZATION: 英文剧情本地化框架与测试
- [x] TASK-ART-RACE: CG与结局人种一致性审计与修复
- [x] TASK-MOBILE-UI: 移动端自适应布局与安全区适配（844x390 横屏及 notched 屏适配）

## 近期完成任务

### 2026-08-07: 移动端安全区及自适应布局适配

*   **全局安全区与内边距解耦**: 移除了全局 `body` 的 `safe-area` padding，并在各边缘组件（`TopHUD`、`MobileBottomNav`、`MobileLandscapeHub`、`.drawer-panel`）中实现了精细化的安全区及内边距动态计算，彻底解决了刘海屏下底部导航和右侧面板被强行裁剪的问题。
*   **低高度与窄屏 Modal 自适应**: 对 `StoryModal`、`SettingsModal`、`FleetModal`、`BattleScreen` 等所有核心模态窗口添加了 `max-h-[90vh]` 高度约束及内部自适应滚动。
*   **StoryModal 横屏精简布局**: 在低高度横屏视口下自动隐藏大肖像，收缩内边距并优化字体，保证剧情文本和决策按钮 100% 可见。
*   **SettingsModal 窄屏布局重构**: 移动端下自动切换为顶部水平滚动 Tab 栏及下方流式设置项的垂直布局，极大节约横纵向展示空间。
*   **FleetModal 响应式流式布局**: 在窄屏下自动将舰队信息项切换为垂直排版，防止派遣按钮和选择器溢出截断。
*   **详情抽屉边缘呼出按钮**: 针对非星图页面关闭 Inspector 后无法拉起的交互死路，引入了 SPEC A2 规范的半透明“详情 ◀”边缘胶囊按钮，允许随时重新呼出抽屉。
*   **React Stale Closure 闭包卡死修复**: 修复了 `App.tsx` 中 window 事件监听器在挂载时对 `showDesktopLayout` 的 stale closure 引用，保证了视口切换时抽屉开合控制逻辑的最新有效。
*   **E2E 测试健壮性及可靠性提升**:
  - 修复 `startFreeExplore` 挂载期间对于 PWA 资源下载授权模态框遮罩的自动检测与关闭逻辑。
  - 模拟物理点击前引入 Earth 视角聚焦步骤，防止移动端低高度时由于地球处于视口外引发的点击失败。
  - 将坐标命中测试的 Playwright 模拟物理点击替换为浏览器 native `MouseEvent` 精确派发，绕过 Playwright 物理模拟对于 `pointer-events: none` 覆盖物（`star-canvas-react`）的 hit-testing 局限性。
  - 将 `tutorial-guided` 的滑块拖动方式替换为键盘 Focus 与 `ArrowRight` 微调，并派发 `mouseup`/`touchend` 触发状态提交，消除 CI 环境中触控轨迹拖曳模拟的不稳定性。

### 2026-08-01: 文档重组、人种修复、英文测试与 Remotion 预告片生成

*   **文档库重组与卫生清理**: 批量重组并整理了 238 份 Markdown 文档，消除重复并将其归入五大分类子目录；清理了 Tauri 构建生成的冗余 iOS 图标及 `deliverables/` 空文件夹。
*   **二向箔结局 CG 升级**: 替换了原降维打击结局占位图为全新的二维死静余波概念图，大幅压缩体积（6.6MB → 1.3MB），并发布了 `ASSET_20260801_NEW_DEFEAT_ENDING_CG.md` 规格书。
*   **人种一致性审计与罗辑 CG 修复**: 视觉核对 17 张结局图和 43 张剧情 CG，出具了 `AUDIT_20260801_CG_CHARACTER_RACE_AUDIT.md` 专项审计报告。使用 AI 生成工具成功重绘并实装了具有东亚华人特征及电路大衣的罗辑威慑建立对峙图（`cg_deterrence_established.png`），将原偏离人种图归入备份文件夹。
*   **英文剧情本地化验证**: 编写 `NarrativeLocalization.test.ts` 测试以覆盖本地化剧情加载，并在 `StoryModal.tsx` 中验证了其双语文本映射。
*   **Remotion 视频创作与测试审计**: 使用 Remotion 完成了 90 秒交响卡点实机宣传片制作并输出复盘总结报告 `EXEC_20260801_PROMO_VIDEO_CREATION_JOURNEY.md`；出具 `AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md` 报告，并在 `vite.config.ts` 中完成对 nested Remotion 依赖项的隔离。

### 2026-07-13: 新手教程误触修复与重设计

- [x] **教程简化**: 12 步 → 4 步核心操作 + 1 步欢迎页（5 步架构）
- [x] **误触修复**: 5 个根因全部修复（高亮框 110px、单一 hotspot、focusOnStar 自动居中、pulse 呼吸光环、移动端缩放修正）
- [x] **阻断器宽限期**: 前 3 回合科研停滞与部门空缺降级为警告
- [x] **情境提示**: ContextualTips 组件（6 种场景，每设备一次）
- [x] **新手任务清单**: BeginnerTasks 组件（5 项任务，可折叠）
- [x] **测试**: 全量 1074 测试通过，Registry 19→22 条目
- **文档**: `EXEC_20260713_TUTORIAL_MISCLICK_REDESIGN.md`、`EXEC_20260713_TUTORIAL_SIMPLIFICATION_REPORT.md`

### 2026-07-12: 纪元级因果链一致性审计与修复

- [x] **AUDIT**: 完成危机纪元～星屑纪元 6 份单纪元审计报告
- [x] **CROSS_EPOCH_AUDIT**: 跨纪元总审计（7 项系统性问题，28 个死 FLAG，45 个正式问题）
- [x] **AUDIT_FIX_PLAN**: 16 项修复任务 + 1 项测试补充 + 18 项暂不修复
- [x] **FIX-01~FIX-13**: 13 项代码修复全部执行完成
  - P0: 循环依赖修复（SYS-1，4 个事件 epoch 标注）
  - P1: 黑域 FLAG 名称修正、swordholder 路径确认
  - P2: FLAG 清理机制、死累积修复、死 FLAG 清理（28个）、filteredEvent 人物检查、时序倒置、注释冲突、刘慈欣解锁、FlagManager 漂移确认、dimensionStrike 统一、调用顺序
- [x] **FIX-14**: P3 暂不修复（判定与预报统一，高风险重构）
- [x] **FIX-15**: FLAG 双写注释（3 处设计意图说明）
- [x] **FIX-16**: 历史文档同步（2 份文档追加复核注释）
- [x] **FIX-17**: 全链路回归测试（19 个测试覆盖 FIX-01~FIX-13）
- **文档**: `AUDIT_20260712_FIX_EXECUTION_REPORT.md`

## 待办

- [ ] UC-1~UC-18: 18 项未确认问题，待 Autoplay500 运行时验证
- [ ] FIX-14: 判定与预报统一，待结局系统重构时处理
- [ ] 威慑纪元～星屑纪元单纪元审计（如需继续）
- [ ] Playwright E2E 端口冲突与目标站点断言 (来自 2026-08-01 测试审计待办)
- [ ] 英文剧情用户路径完整集成测试覆盖 (来自 2026-08-01 测试审计待办)
- [ ] PWA 激活生命周期与 IndexedDB 真实离线存档链路覆盖 (来自 2026-08-01 测试审计待办)
