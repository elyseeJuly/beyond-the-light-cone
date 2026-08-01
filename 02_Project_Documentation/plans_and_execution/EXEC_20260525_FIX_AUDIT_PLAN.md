# [LegendOfUni] 全量审计问题执行修复方案

本计划旨在全面修复 `AUDIT_20260525_FULL_NARRATIVE_PHYSICS_AUDIT.md` 中指出的所有缺陷，并已吸纳评审反馈中的遗漏项与陷阱指导。

## 1. 核心叙事与引擎逻辑 (Core Engine & Narrative Logic)

- **纪元逗号分隔支持** (`GameEventManager.ts`)：修正 `isEpochMatch`，支持以逗号分隔的多个目标纪元拆分匹配，解锁曾因 bug 导致永远无法触发的 10 条原著剧情事件。
- **角色匹配修复** (`GameEventManager.ts`)：优化 `isEventCharactersUnlocked` 逻辑，使用全称白名单映射而非纯子字符串包含，避免“艾工程师”误触“艾AA”的问题，并有效拦截“安全官 维德”等变体。
- **负值资源钳制** (`Game.ts`)：在 `applyNewEffects` 的 `resource` 扣减中，限制单次扣减最大值为当前值的 50%。
- **负值军事钳制** (`Game.ts`)：完善负军事值的处理，改为按绝对值的换算销毁现存舰队（每 50 点销毁一支）与按比例削减防卫军数量。
- **清理与重构**：移除 `Game.ts` 中的 `triggerCharacterUnlockPopup` 无效方法；在 `checkEvents` 中增加固定事件（如300年份事件）对 `loreDomain` 的检测，以支持严格原著模式。

## 2. 事件数据修正与扩充 (Data Files)

- **角色纪元穿帮修复** (`randomevents.json`)：修正 14 条纪元穿越问题，如将丁仪、泰勒、维德、伊文斯在错误纪元出场的文本替换为无名 NPC 或修正至正确纪元。
- **WANDERING 世界观隔离**：将含有 ETO/降临派 字眼的后期流浪纪元文本改为“极端破坏派”，以避免组织在未来突然复活。
- **极端数值下调**：将绝对值超过 1000 的极值缩放限制在合理区间内，以配合 50% 的防崩溃钳制。
- **银河纪元补全**：新增 8 条 `GALAXY` 专属事件（包含“归零者广播”、“二维化波前”、“潮汐锁定殖民”、“暗物质海宏电子”等刘慈欣原著衍生设定）。
- **增加标签** (`events.json`)：为 300 年份的流浪地球事件增加 `loreDomain: 'liu_cixin_crossover'` 标签，防止其在严格三体模式下出现。

## 3. 物理系统与 UI 渲染 (Physics & UI)

- **保留殖民兼容并新增类型** (`stars.json`)：保留所有星球的 `IsPlanet: 1` 维持外星文明殖民测试，并新增 `starType` 字段（如 `red_dwarf`, `binary`, `white_dwarf`）以增强显示信息。
- **恒星距离真实化** (`StarMapRenderer.ts`)：对 `index > 10` 的河外星系，利用其新增的 `Distance` 数据进行对数计算生成视觉轨道半径，避免全部挤在一堆。
- **渲染性能优化**：引入 `Map` (`renderStarMap`) 取代 `find()` 数组遍历进行 O(1) 的星体与舰队路径匹配。
- **公告板体验优化** (`AnnouncementBoard.tsx`)：引入 `isExpanded` 状态与切换按钮，平时限制 `max-h-24`，展开时 `max-h-64`，解决文字滚动版面遮挡问题，并确保监听了 `game-loaded` 以便在读档后刷新数据。

## 4. 验证方式

- 执行 `npm run typecheck`。
- 确保 246/246 Vitest 用例全部通过（特别是 `applyNewEffects` 的单元测试更新以匹配钳制逻辑）。
