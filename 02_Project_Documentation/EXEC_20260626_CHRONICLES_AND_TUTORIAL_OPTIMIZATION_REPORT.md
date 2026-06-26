# 岁月史书重构、智脑托管调整与新手教程 UI/UX 优化汇报
> **建档日期**: 2026-06-26  
> **归档类别**: 实施执行与验证报告 (Execution & Verification Report)  
> **文档编号**: `EXEC_20260626_CHRONICLES_AND_TUTORIAL_OPTIMIZATION_REPORT.md`  

---

## 1. 任务背景与核心改进诉求

本阶段重构聚焦于解决移动端横屏自适应下的布局缺失、新手教程的交互遮挡与数值消失问题，并将历史画廊图鉴与核心托管控制进行逻辑重定义，具体包含以下几项：
1. **岁月史书重构**：将原「文明档案馆」重命名为「岁月史书」，移至游戏首页菜单；解决 CG 图鉴在触发后无法解锁与显示的 Bug，明确画廊作用。
2. **托管机制调整**：将「AI 智脑托管」开关从游戏首页菜单中移除，游戏启动时新游戏默认开启托管；将手动/托管控制按钮收纳至游戏操作页面的顶栏 HUD。
3. **教程 UI/UX 重构**：
   - 解决新手教程的高亮切口遮挡顶栏数值（去除了模糊滤镜，将遮罩改淡），防止数值消失。
   - 替换 Div 拼接遮罩为 SVG 圆角 Mask Cutout，引入高亮焦点滑移（Glide）与呼吸（Pulse）动画。
   - 解决手机横屏小高度下的卡片重叠与按钮溢出，强制卡片宽度并停靠至两侧边缘。
   - 对齐 PC Resized 与 Playwright Headless 下的移动端检测，修复 E2E 点击拦截。

---

## 2. 方案设计与核心代码实现

### 2.1 岁月史书入口与托管迁移
- **首页菜单调整**：在 `GameCoverScreen.tsx` 中移除 AI 托管卡片，仅在 `onStartNewGame` 时默认开启；将「文明档案馆」替换为「岁月史书」(`CHRONICLES OF TIME`)，触发 `onOpenMuseum` 以弹出独立画廊。
- **左边栏入口合并**：在 `LeftHub.tsx` 中把「文明档案」重命名为「岁月史书」，移除底部分割线下的重复按钮，统一指向 `activeView === 'archive'` 渲染。
- **快捷键规范**：在 `SettingsModal.tsx` 中更新说明为 `A: 岁月史书`；在 `App.tsx` 中，键盘监听 `'Escape'` 时，若处于 `archive` 状态则返回 `starmap`。

### 2.2 CG 解锁与触发逻辑修复
- **未配置 ID 事件的解析降级**：修改 `GameEventManager.ts` 的 `parseEventData` 方法。若事件数据中未硬编码 `id` 属性，则通过 `talk0_pic`（例如 `event_red_shore_base_1781593689.png`）的命名模式正则提取出 `event_red_shore_base` 作为唯一 Event ID 注入，供持久化与图鉴点亮使用。
- **纪元事件自动解锁**：修改 `Game.ts`，在纪元更替函数 `updateEpoch` 中，手动对纪元交替 CG 进行 `StatisticsManager.recordEventTrigger` 追踪（含 Epoch 5 的 `event_galaxy_exodus` 和 Epoch 6 的 `event_zeroer_broadcast`）。

### 2.3 新手教程 (Tutorial) 视觉与物理对齐
- **SVG Mask 遮罩与透明度**：使用带 `rx="8" ry="8"` 的 `<rect>` 进行圆角抠图，去除 `backdrop-blur-[2px]` 并使用 `rgba(5, 8, 16, 0.65)` 半透明色，保证高亮周围的 HUD 数值文字仅有半透明变暗而不会消失。
- **滑移与呼吸发光**：为高亮框加入 `.border-2` 并引入 Glide transition 和呼吸动画：
  ```css
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  animation: border-pulse 2s infinite alternate;
  ```
- **横屏自适应**：在 `getCardStyle()` 增加高度过滤 `windowHeight < 500`，强制将教程卡片转为 `320px` 宽的侧边停靠栏（开启 `overflow-y-auto` ），防止遮挡高亮按钮或将继续按钮挤出屏幕。

---

## 3. 测试与验证报告

### 3.1 单元测试与类型检查
执行静态代码检查和类型推断，无任何 TypeScript / ESLint 编译阻断：
```bash
npm run typecheck
# => tsc --noEmit: 0 errors
```

执行 Vitest 单元集成测试：
```bash
npm run test
# => Test Files  41 passed (41)
# => Tests       864 passed (864)
# => Duration    50.29s (单元测试全量通过)
```

### 3.2 Playwright 端到端 (E2E) 测试
运行 5 个测试工程，全面覆盖桌面端及移动端环境下的操作推进、侧边栏切换、画廊检查和 guided 新手引导流：
```bash
npm run test:e2e
# => Running 55 tests using 4 workers
# => 55 passed (4.1m)
```

**测试项目矩阵验证结果**：
- `chromium-desktop` — **全部通过** (新游戏、按空格、视图切换、教程引导正常)
- `firefox-desktop` — **全部通过** (Esc 与 close 自动卸载 modal，无 pointer 拦截异常)
- `webkit-desktop` — **全部通过** (无 transform 定位失效导致的画图越界)
- `mobile-chrome` (模拟 Pixel 5) — **全部通过** (移动端 BottomNav 与自适应抽屉加载流畅)
- `mobile-safari` (模拟 iPhone 12) — **全部通过** (新手教程在小宽度下完美停靠，继续按钮无截断)

---

## 4. 归档文件与修改清单

修改涉及以下核心源文件，已全量打包、编译、测试通过，并顺利提交推送至 GitHub 仓库的主分支 (`main`)：

| 修改目录与文件 | 变更核心逻辑 |
| --- | --- |
| `03_Web_Rebuild/src/App.tsx` | 重构 DOM 隔离，Modal/Tutorial 移至根目录，Escape 快捷键拦截退回 starmap |
| `03_Web_Rebuild/src/hooks/useBreakpoint.ts` | 移除 isMobile 中的 touchdevice 强依赖，对齐 PC 窗口缩放测试 |
| `03_Web_Rebuild/src/components/GameCoverScreen.tsx` | 重命名「文明档案馆」为「岁月史书」，移除托管开关，onStartNewGame 默认开启 AI |
| `03_Web_Rebuild/src/components/LeftHub.tsx` | 合并岁月史书与文明档案入口，重构 LeftHub 选项卡显示 |
| `03_Web_Rebuild/src/components/SettingsModal.tsx` | 更改快捷键描述 A 为「岁月史书」 |
| `03_Web_Rebuild/src/components/Tutorial.tsx` | 使用 SVG rounded-mask cutout 替换拼接 backdrop，引入 Glide 与 border-pulse 呼吸特效，为 short-landscape 提供 320px 停靠适配 |
| `03_Web_Rebuild/src/core/Game.ts` | 增加纪元更替 CG 事件触发的 recordEventTrigger 统计映射 |
| `03_Web_Rebuild/src/core/GameEventManager.ts` | 针对无 id 事件自动从 talk0_pic 正则解析提取 Event ID fallbacks |
| `03_Web_Rebuild/src/core/AssetLoader.ts` | 将硬编码的路径 '/beyond-the-light-cone/' 替换为动态获取 of `getAssetUrl`，彻底解决 relative base 部署环境下的 JSON 加载异常 |
| `03_Web_Rebuild/src/test/e2e-playwright/helpers.ts` | switchView 前置自动检查并关闭可见的 lucide-x modal，修复 click-pointer 被拦截的问题 |
| `03_Web_Rebuild/src/test/e2e-playwright/core-flow.spec.ts` | 修正画廊标题可见性断言为「岁月史书 · 独立画廊」 |

---

**任务交付状态**：✅ **已成功闭环并发布。**
