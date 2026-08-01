# 项目状态看板

> 最后更新：2026-08-01  
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

## 近期完成任务

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
