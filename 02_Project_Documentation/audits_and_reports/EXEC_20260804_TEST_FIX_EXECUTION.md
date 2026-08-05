# 测试系统修复执行报告

**日期**：2026-08-04
**基线审计**：[AUDIT_20260804_TEST_REPLAY_AND_FINDINGS.md](./AUDIT_20260804_TEST_REPLAY_AND_FINDINGS.md)
**执行范围**：方案 A + B + C + D（用户确认"全部执行"）
**执行结论**：🟢 **全部方案落地，验收通过，Vitest 不回归**

---

## 1. 执行摘要

| 方案 | 状态 | 验收 | 关键证据 |
|---|---|---|---|
| A. i18n 顶层 `localStorage` 守卫 | ✅ | Playwright 从 0 tests → 22 passed | smoke 单独跑 3/3 passed |
| B. Playwright 端口硬隔离 + globalSetup 身份断言 | ✅ | `--strictPort` + `reuseExistingServer: false` + globalSetup | 占用 4173 会直接失败而非复用 |
| C. ESLint 配置修复 + CI 接入完整 lint | ✅ | lint 从 124 errors → 0 errors / 2 warnings | `npm run lint` 退出码 0 |
| D. story-i18n.spec.ts 骨架 | ✅ | `describe.skip` 3 项用例占位 | E2E 摸底显示 3 skipped |

**最终测试矩阵**：
- Vitest：1099 passed / 3 skipped（与修复前一致，无回归）
- Playwright chromium-desktop：**22 passed / 3 skipped（3.0m）**
- ESLint：0 errors / 2 warnings
- PWA 契约：通过

---

## 2. 方案 A：i18n 顶层 `localStorage` 守卫

**修改文件**：[src/utils/i18n.ts](../../03_Web_Rebuild/src/utils/i18n.ts)

**修改点**：
- 第 3711-3721 行：将顶层 `localStorage.getItem('game-lang')` 提取为 `readStoredLang()` 函数，加 try/catch 守卫
- 第 3725-3737 行：`setLanguage` 内 `localStorage.setItem` 加 try/catch，`window.dispatchEvent` 加 `typeof window !== 'undefined'` 守卫

**修复前**：
```typescript
let currentLang: Language = (localStorage.getItem('game-lang') as Language) || 'zh';
```

**修复后**：
```typescript
const readStoredLang = (): Language => {
  try {
    return (localStorage.getItem('game-lang') as Language) || 'zh';
  } catch {
    return 'zh';
  }
};
let currentLang: Language = readStoredLang();
```

**验收**：
- `node -e "import('./src/utils/i18n.ts')..."` → LOAD_OK
- `npx playwright test smoke.spec.ts --list` → 3 tests（从 0 tests）
- smoke 3/3 passed (52.3s)

---

## 3. 方案 B：Playwright 端口硬隔离 + globalSetup 身份断言

### 3.1 修改 [playwright.config.ts](../../03_Web_Rebuild/playwright.config.ts)

- `webServer.command` 追加 `--strictPort`：端口被占用时直接失败而非递增
- `webServer.reuseExistingServer` 改为 `false`：永不复用，CI 与本地一致
- 新增 `globalSetup: './src/test/e2e-playwright/global-setup.ts'`

### 3.2 新增 [src/test/e2e-playwright/global-setup.ts](../../03_Web_Rebuild/src/test/e2e-playwright/global-setup.ts)

在所有 spec 运行前对 preview URL 做一次性身份断言：
1. 根路径返回 200
2. HTML `<title>` 包含"光锥之外"
3. `<meta name="application-name">` content 包含"光锥之外"

**防御场景**：即使 `reuseExistingServer` 被改回 true 或本机有其他项目占用 4173，globalSetup 会在此拦截。

### 3.3 修改 [src/test/e2e-playwright/helpers.ts](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts)

同步新增 `assertIsThisApp(page)` 函数（页面级身份断言，供 spec 在需要时调用）。当前未强制注入到每个 beforeEach，采用 globalSetup 作为主防线，避免 19 处 `page.goto` 逐个改动。

**验收**：
- smoke 3/3 passed
- 完整 chromium-desktop 22/22 passed

---

## 4. 方案 C：ESLint 配置修复 + CI 接入完整 lint

### 4.1 修改 [eslint.config.js](../../03_Web_Rebuild/eslint.config.js)

- `ignores` 追加 `'video-output/**'`：video-output 是独立子项目（有自己的 tsconfig.json / package.json），不纳入主项目 lint
- `languageOptions` 新增 `globals: { ...globals.browser, ...globals.node }`：声明浏览器与 Node 全局，避免 `no-undef` 误报 `console` / `window` / `localStorage` / `CustomEvent` 等
- 新增 `import globals from 'globals'`

### 4.2 新增依赖

`globals` 包加入 devDependencies（`npm install --save-dev globals`）

### 4.3 修改 [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

第 46-49 行 step 名从 "ESLint simulation harness" 改为 "ESLint full project"，命令从 `npm run lint:simulation` 改为 `npm run lint`。`lint:simulation` 脚本保留在 package.json 中作为快速诊断工具。

**验收**：
- 修复前：124 errors / 2 warnings，退出码 1
- 修复后：**0 errors / 2 warnings，退出码 0**
- 剩余 2 warnings 是 `react-hooks/exhaustive-deps` 对 `t` 函数依赖（`t` 是稳定引用，非阻塞，既有设计）

---

## 5. 方案 D：story-i18n.spec.ts 骨架

**新增文件**：[src/test/e2e-playwright/story-i18n.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/story-i18n.spec.ts)

**覆盖目标**（骨架，`describe.skip`）：
1. 英文态首屏渲染英文 UI 文案
2. 通过 SettingsModal 切换到中文并验证文案变化
3. 英文态触发随机剧情验证英文文案

**定位策略**：使用语义 selector 与语言切换按钮稳定文案"中文简体"作为锚点，不依赖单一中文 copy。

**当前状态**：3 项用例全部 `test.describe.skip`，在 E2E 摸底中显示为 3 skipped，不拖累整体测试。待后续迭代取消 skip 并补全断言。

---

## 6. 完整 E2E 摸底结果（chromium-desktop）

```
Running 25 tests using 1 worker

  ✓  1 core-flow › 新游戏 → 跳过教程 → 主星图可见 (9.7s)
  ✓  2 core-flow › 切换各中心视图（星图/科技/情报/政府/档案） (11.3s)
  ✓  3 core-flow › 按空格推进回合且资源非负 (8.8s)
  ✓  4 core-flow › 事件弹窗出现后可选择选项 (9.8s)
  ✓  5 responsive › 桌面端显示 LeftHub 与 RightInspector (5.6s)
  ✓  6 responsive › 移动端隐藏侧边栏并显示底部导航 (5.4s)
  ✓  7 responsive › 窗口尺寸切换时布局正确响应 (5.7s)
  ✓  8 smoke › 页面标题与核心布局元素存在 (5.5s)
  ✓  9 smoke › 代码分割 chunk 按需加载 (11.0s)
  ✓ 10 smoke › 全局错误监控无未捕获异常 (11.5s)
  - 11 story-i18n › 英文态首屏渲染英文 UI 文案
  - 12 story-i18n › 通过 SettingsModal 切换到中文并验证文案变化
  - 13 story-i18n › 英文态触发随机剧情验证英文文案
  ✓ 14 tutorial-coordinates › DOM 高亮框中心与目标元素中心误差 ≤ 4px (4.7s)
  ✓ 15 tutorial-coordinates › getStarScreenCoords 返回的地球坐标可被真实点击命中 (5.5s)
  ✓ 16 tutorial-coordinates › focusOnStar 居中后地球位于 Canvas 视口中心 (4.9s)
  ✓ 17 tutorial-coordinates › canvasToViewport / viewportToCanvas 互逆性 (4.9s)
  ✓ 18 tutorial-coordinates › DOM 高亮框中心与目标元素中心误差 ≤ 4px (13.2s)
  ✓ 19 tutorial-coordinates › 竖屏启动教程后旋转到横屏 0.85 缩放，高亮框不漂移 (14.2s)
  ✓ 20 tutorial-guided › 完整教程黄金路径：真实点击推进全流程 (15.1s)
  ✓ 21 tutorial-guided › 跳过教程功能正常 (5.1s)
  ✓ 22 tutorial-robustness › 目标元素缺失时渲染 missing 遮罩而非 full 遮罩 (4.9s)
  ✓ 23 tutorial-robustness › 目标元素缺失时玩家仍可点击游戏 UI（不锁屏） (5.3s)
  ✓ 24 tutorial-robustness › 目标元素缺失时教程卡片的跳过按钮可用 (5.0s)
  ✓ 25 tutorial-robustness › 目标元素延迟挂载后高亮框自动恢复 (5.3s)

  3 skipped
  22 passed (3.0m)
```

**关键意义**：这是本项目 Playwright E2E **首次完整通过**。审计报告中的"零用例可发现"状态完全解除，7 个原 spec 全部可发现、可执行、全绿。

---

## 7. Vitest 不回归验证

```
Test Files  62 passed | 3 skipped (65)
     Tests  1099 passed | 3 skipped (1102)
  Duration  25.59s
```

- 与修复前完全一致（1099 passed / 3 skipped）
- 3 skipped 仍是 env-gated 模拟测试（SIM_SOAK / SIM_REACHABILITY），属设计内行为
- i18n 守卫未影响任何既有 Vitest 用例

---

## 8. 修改文件清单

| 文件 | 类型 | 变更 |
|---|---|---|
| [src/utils/i18n.ts](../../03_Web_Rebuild/src/utils/i18n.ts) | 修改 | 顶层 localStorage 守卫 + setLanguage 守卫 |
| [playwright.config.ts](../../03_Web_Rebuild/playwright.config.ts) | 修改 | --strictPort + reuseExistingServer: false + globalSetup |
| [src/test/e2e-playwright/global-setup.ts](../../03_Web_Rebuild/src/test/e2e-playwright/global-setup.ts) | 新增 | 全局身份断言 |
| [src/test/e2e-playwright/helpers.ts](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts) | 修改 | 新增 assertIsThisApp 函数 |
| [src/test/e2e-playwright/story-i18n.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/story-i18n.spec.ts) | 新增 | 英文剧情 E2E 骨架（skip） |
| [eslint.config.js](../../03_Web_Rebuild/eslint.config.js) | 修改 | video-output 忽略 + globals 声明 |
| [package.json](../../03_Web_Rebuild/package.json) | 修改 | 新增 globals devDependency |
| [.github/workflows/ci.yml](../../.github/workflows/ci.yml) | 修改 | lint:simulation → 完整 lint |

---

## 9. 与 2026-08-04 审计报告的对照闭环

| 审计项 | 审计判定 | 修复后状态 |
|---|---|---|
| NEW P0：i18n 顶层 localStorage 阻断 Playwright | 🔴 待修 | ✅ **已闭环**（方案 A） |
| P0-1：Playwright 端口可信度 | 🟡 待修 | ✅ **已闭环**（方案 B） |
| P0-2：Vitest 隔离后挂起 | ✅ 已闭环 | ✅ 保持闭环 |
| P1：CI 不运行完整 lint | ✅ 确认存在 | ✅ **已闭环**（方案 C） |
| P1：英文剧情用户路径缺失 | ⚠️ 无法验证 | 🟡 **骨架已落地**（方案 D），待补全断言 |

---

## 10. 后续建议

1. **方案 D 补全**：取消 `story-i18n.spec.ts` 的 `describe.skip`，补全英文态剧情触发与文案断言，需先调研英文态下剧情 data-testid 覆盖情况
2. **ESLint 2 warnings**：评估是否将 `t` 函数加入 `BottomEventBar.tsx` / `IntelligenceCenter.tsx` 的 useMemo 依赖数组，或用 `useCallback` 稳定 `t` 引用
3. **多浏览器 E2E**：本次只跑 chromium-desktop，CI 上仍会跑 firefox/webkit/mobile，需观察 CI 上的多浏览器结果
4. **globalSetup 强化**：可在 globalSetup 中追加对 manifest.json / 关键 JS chunk 的指纹校验，进一步防伪
