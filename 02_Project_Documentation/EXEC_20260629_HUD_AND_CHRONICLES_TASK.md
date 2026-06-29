# HUD优化与岁月史书解耦任务进度清单
> **版本号**: V1.0.0  
> **生效日期**: 2026-06-29  
> **文档前缀**: `EXEC_20260629_HUD_AND_CHRONICLES_TASK.md`  

---

## 进度清单

- [x] TopHUD 核心指标（人口/资源/军力/稳定/威慑）全面取消响应式隐藏，常驻展示
- [x] 移除了 CivLevel 显示并隐藏底层数值
- [x] 稳定度下拉详情去重（移除人口），威慑度下拉详情展开（展示军力与执剑人）
- [x] 封面入口更名为「文明博物馆」，且 `MuseumGallery.tsx` 恢复为 3-tab 结构
- [x] 创建独立的 `ChroniclesModal.tsx` 并由游戏内侧边栏「岁月史书」直接唤起，显示双轨对比
- [x] 移除非关键阻断，解除了手动模式下 AP 耗尽或科研停滞时下一回合按钮被阻断的问题
- [x] 修改 `TutorialRemedy.scenario.test.tsx` 中关于响应式隐藏的断言
- [x] 运行本地类型检查 `typecheck` 确认 0 error
- [x] 全量运行 `npm run test` 确保 875 个用例 100% 🟢 通过
- [x] 更新注册表 `_registry.md` 和健康看板 `_health.md` 的描述与变更日志
