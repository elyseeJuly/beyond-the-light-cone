# HUD优化与岁月史书解耦实施方案书
> **版本号**: V1.0.0  
> **生效日期**: 2026-06-29  
> **文档前缀**: `EXEC_20260629_HUD_AND_CHRONICLES_PLAN.md`  

---

## 1. 实施目标与背景

由于改动涉及的源文件超过了 5 个的触发门槛，特此按照 `V1.2.0` 全球开发规范编制本实施方案书。本轮功能迭代与修复的目标是：
1. **隐藏与精简 TopHUD 数值**：彻底隐藏文明等级，从稳定度详情中移除人口，将威慑度详情展开显示军力和执剑人。
2. **TopHUD 核心数据常驻**：去除在小屏幕/横屏模式下针对人口、资源、军力指标的隐藏样式，使得五大核心指标（稳定度、人口、资源、军力、威慑度）在各端均常驻完整展示。
3. **文明博物馆与岁月史书解耦**：将原画廊（星历终章、CG图鉴、留声机）归入主页 Cover 的「文明博物馆」，将双轨对比时间线归入游戏内侧边栏的「岁月史书」弹窗。
4. **移除手动阻断**：关闭手动指令点空缺、科研空置对“下一回合”的物理拦截。

---

## 2. 修改文件范围清单

本轮迭代影响的 7 个核心源文件和 1 个测试注册表如下：

*   [App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx)：将 TopHUD 移回缩放容器，挂载 `ChroniclesModal`
*   [TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx)：取消指标隐藏，精简稳定度下拉，实现威慑度下拉，移除 CivLevel
*   [GameCoverScreen.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/GameCoverScreen.tsx)：重命名封面入口为「文明博物馆」
*   [MuseumGallery.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/MuseumGallery.tsx)：剔除时间线对比 tab，重命名为文明博物馆
*   [ChroniclesModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/ChroniclesModal.tsx)：新增独立的岁月史书时间线弹窗
*   [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts)：移除了非关键手动阶段下一回合阻断
*   [TutorialRemedy.scenario.test.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/TutorialRemedy.scenario.test.tsx)：调整响应式测试的断言以覆盖常驻显示指标
*   [_registry.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/_registry.md)：更新场景表注册与变更日志
