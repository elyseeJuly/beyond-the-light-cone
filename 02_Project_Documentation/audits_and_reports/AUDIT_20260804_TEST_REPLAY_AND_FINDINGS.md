# Beyond the Light Cone 测试回放与新发现审计

**日期**：2026-08-04
**执行人**：AI 辅助测试
**范围**：在 macOS 本地环境完整跑一遍 `03_Web_Rebuild` 测试矩阵，并与 [AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md](./AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md) 中遗留的 P0/P1 问题逐条对照，识别本轮新出现的缺陷。
**方法**：实际执行每条命令并采集退出码、耗时与日志；对 Playwright 阻断问题在 Node REPL 中复核根因。历史报告中的"GREEN 标记"仅作线索，不作为本次通过证据。

---

## 1. 执行摘要

| 维度 | 结论 |
|---|---|
| Vitest 单元/集成/场景 | 🟢 全绿（1099 passed / 3 skipped） |
| PWA 释放契约 | 🟢 通过 |
| ESLint 完整门禁 | 🔴 124 errors，不可作门禁 |
| Playwright E2E | 🔴 **零用例可发现**，比 2026-08-01 报告时更严重 |
| 与历史 P0 对照 | P0-2 已闭环；P0-1 配置未改但本机未触发；**新增 P0：i18n 顶层 localStorage 阻断** |
| 与历史 P1 对照 | P1 lint 缺失确认真实存在；P1 E2E 用户路径目前完全无法验证 |

**总体判定**：🟡 **有条件通过**。Vitest 与 PWA 契约可作为代码层发布依据；E2E 层完全不可用，必须先修复新发现的 i18n 阻断，否则任何"测试通过"结论都不能覆盖浏览器内用户路径。

---

## 2. 本次执行记录

| # | 命令 | 退出码 | 耗时 | 结果 |
|---|---|---|---|---|
| 1 | `npm run test:simulation:smoke` | 0 | 3.19s | 8/8 通过 |
| 2 | `npm run test:core` | 0 | 11.13s | 744/744 通过 |
| 3 | `npm test`（完整 Vitest） | 0 | 16.54s | 1099 passed / 3 skipped |
| 4 | `npm run verify:pwa-release` | 0 | <1s | v1.0.7 契约通过 |
| 5 | `npm run lint` | 1 | - | 124 errors / 2 warnings |
| 6 | `CI=1 npx playwright test smoke.spec.ts --project=chromium-desktop` | 1 | <5s | **零用例发现** |
| 7 | `curl --noproxy '*' http://localhost:4173/` | 0 | <1s | 验证为本项目（title=光锥之外：纪元往事） |

**完整 Vitest 跳过的 3 项**：`balance.sim.test.ts`、`reachability.sim.test.ts`、`soak.sim.test.ts`，均为环境变量门控（`SIM_SOAK=1` / `SIM_REACHABILITY=1`），属设计内行为，与 2026-08-01 报告一致。

---

## 3. 与 2026-08-01 审计报告逐条对照

### P0-1：Playwright 端口可信度（4173 + reuseExistingServer）

**审计判定**：待修
**本次核对**：🟡 **配置未改，但本机当前环境未触发**

**证据**：
- [playwright.config.ts:49-54](../../03_Web_Rebuild/playwright.config.ts#L49-L54) 仍为 `command: 'npm run preview -- --port 4173'`、`reuseExistingServer: !process.env.CI`
- 本机端口 4173 当前空闲；手动 `npm run preview -- --port 4173` 启动后 curl 返回 200，title=光锥之外：纪元往事，确属本项目
- **但**：若本机已有其他项目占用 4173，`reuseExistingServer: true` 仍会无声复用，审计 P0-1 风险在配置层面**依然存在**

**结论**：审计 P0-1 风险描述准确，本机侥幸未触发，配置层修复仍需进行。

### P0-2：Vitest 隔离后无输出挂起

**审计判定**：待定位
**本次核对**：✅ **已不再重现**

**证据**：
- 完整 `npm test` 16.54s 正常结束，输出 `Test Files 62 passed | 3 skipped (65)`、`Tests 1099 passed | 3 skipped (1102)`
- video-output 隔离已在 [vite.config.ts:213-217](../../03_Web_Rebuild/vite.config.ts#L213-L217) 落地：`exclude: ['**/node_modules/**', 'video-output/**', 'src/test/e2e-playwright/**']`
- 不再扫描 `video-output/remotion/node_modules` 第三方测试

**结论**：审计 P0-2 已通过代码修复 + 本次回放验证双重闭环。

### P1：CI 不运行完整 lint

**审计判定**：待修
**本次核对**：✅ **确认问题真实存在**

**证据**：
- [.github/workflows/ci.yml:46-49](../../.github/workflows/ci.yml#L46-L49) 仅运行 `npm run lint:simulation`（即 `eslint src/test/simulation`）
- 本地 `npm run lint` 报 124 errors / 2 warnings
- 124 errors 主要分布在两类：
  1. `no-undef`：`console` / `window` / `CustomEvent` / `process` 等浏览器/Node 全局未声明（[eslint.config.js](../../03_Web_Rebuild/eslint.config.js) 未配置 `languageOptions.globals`）
  2. `Parsing error: "parserOptions.project"`：`video-output/remotion/*.ts(x)` 不在主 `tsconfig.json` 项目内，但 ESLint `ignores` 未排除 `video-output/**`

**结论**：审计 P1 描述准确，且影响面比审计时更大（不只是 CI 门禁缺失，本地 lint 本身也无法干净通过）。

### P1：英文剧情 / 真实存档 / PWA 生命周期用户路径测试缺失

**审计判定**：待补
**本次核对**：⚠️ **完全无法验证**

**证据**：所有 7 个 Playwright spec（smoke / core-flow / responsive / tutorial-coordinates / tutorial-guided / tutorial-robustness / helpers）都在测试发现阶段失败（详见第 4 节），无法到达任何用户路径断言。

**结论**：此 P1 与下方新发现 P0 强相关，必须先修复 i18n 阻断才能补齐或验证。

---

## 4. 新发现：i18n 顶层 `localStorage` 阻断所有 Playwright E2E

**严重级别**：🔴 **NEW P0**
**影响范围**：全部 7 个 Playwright spec
**首次出现证据**：本次回放

### 4.1 现象

```
ReferenceError: localStorage is not defined

   at ../../utils/i18n.ts:3711

  3709 | };
  3710 |
> 3711 | let currentLang: Language = (localStorage.getItem('game-lang') as Language) || 'zh';
       |                              ^
  3712 | const listeners = new Set<() => void>();

Listing tests:
Error: No tests found.
Total: 0 tests in 0 files
```

### 4.2 根因

[src/utils/i18n.ts:3711](../../03_Web_Rebuild/src/utils/i18n.ts#L3711) 在模块顶层直接调用 `localStorage.getItem('game-lang')`。Playwright 测试运行在 Node 环境（无 `window` / `localStorage`），但通过 [src/test/e2e-playwright/helpers.ts:2](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts#L2) 的 `import { t } from "../../utils/i18n"` 间接加载该模块，导致测试发现阶段即抛 `ReferenceError`，整个 spec 文件零用例可发现。

**对比 Vitest 不受影响的原因**：vite.config.ts 设置 `environment: 'jsdom'`，jsdom 提供 `localStorage` 全局；Playwright 测试文件本身在 Node 加载，不走 jsdom。

### 4.3 影响的所有文件

| 文件 | 触发方式 |
|---|---|
| [smoke.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/smoke.spec.ts) | 直接 import `t` |
| [core-flow.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/core-flow.spec.ts) | 直接 import `t` |
| [responsive.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/responsive.spec.ts) | 直接 import `t` |
| [tutorial-coordinates.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/tutorial-coordinates.spec.ts) | 直接 import `t` |
| [tutorial-guided.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/tutorial-guided.spec.ts) | 直接 import `t` |
| [tutorial-robustness.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/tutorial-robustness.spec.ts) | 直接 import `t` |
| [helpers.ts](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts) | 直接 import `t`，被上述 spec 间接引用 |

### 4.4 与历史审计的关系

2026-08-01 报告引用的最后一份 Playwright 产物（2026-07-28）状态为 `failed`、106 项失败、页面标题"偶成 Ou Cheng"。本次回放表明当前状态**比审计时更严重**：不是"测试失败"，而是"零用例可发现"。审计当时未实际重跑 Playwright，因此未识别此阻断。

### 4.5 CI 也会受影响

[.github/workflows/ci.yml:107-117](../../.github/workflows/ci.yml#L107-L117) 在 PR 与 main push 上都会跑 Playwright；若不修复，CI 上的 Playwright 也会"零用例通过"——退出码 0 但实际未验证任何东西，是隐性回归风险。

---

## 5. 强项确认

- Vitest 测试矩阵覆盖面广（核心 / 数据 / 组件 / 场景 / 模拟 / 集成 / 教程），1099 项全绿
- 确定性模拟分层（smoke / replay / regression / flag / balance / reachability / soak）设计合理
- video-output 隔离修复有效，P0-2 真正闭环
- PWA 释放契约验证通过，v1.0.7 资源清单完整
- 覆盖率阈值已在 [vite.config.ts:218-227](../../03_Web_Rebuild/vite.config.ts#L218-L227) 硬编码（statements 70 / branches 60 / functions 70 / lines 70）

---

## 6. 修复方案（待用户确认后执行）

### 方案 A：修复 i18n 顶层 `localStorage` 阻断（NEW P0，必做）

**目标**：让 `i18n.ts` 在 Node 环境下安全加载，Playwright 测试能正常发现并执行。

**修改文件**：[src/utils/i18n.ts](../../03_Web_Rebuild/src/utils/i18n.ts)

**修改位置**：第 3711 行

**修改前**：
```typescript
let currentLang: Language = (localStorage.getItem('game-lang') as Language) || 'zh';
```

**修改后**：
```typescript
const readStoredLang = (): Language => {
  try {
    return (localStorage.getItem('game-lang') as Language) || 'zh';
  } catch {
    // Node/SSR 环境无 localStorage，回退到默认中文
    return 'zh';
  }
};

let currentLang: Language = readStoredLang();
```

**同步修改 `setLanguage`**（第 3716-3722 行）以避免 `window` 在 Node 下同样未定义：
```typescript
export const setLanguage = (lang: Language): void => {
  currentLang = lang;
  try {
    localStorage.setItem('game-lang', lang);
  } catch {
    // Node/SSR 环境忽略持久化
  }
  listeners.forEach(l => l());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('game-language-changed', { detail: lang }));
  }
};
```

**验收标准**：
- `npx playwright test smoke.spec.ts --project=chromium-desktop --list` 能列出用例（不再 0 tests）
- 完整 `npm run test:e2e` 至少能执行到第一个断言
- Vitest 全部用例继续通过（不回归）

### 方案 B：关闭 Playwright 端口可信度风险（P0-1，必做）

**目标**：杜绝"复用其他项目 4173 端口导致对错误应用测试"的隐性风险。

**修改文件**：[playwright.config.ts](../../03_Web_Rebuild/playwright.config.ts)

**修改 1**（第 49-54 行 `webServer`）：
```typescript
webServer: {
  command: 'npm run preview -- --port 4173 --strictPort',
  url: 'http://localhost:4173/',
  reuseExistingServer: false,  // 永不复用，CI 与本地一致
  timeout: 120000,
},
```

**修改 2**：在 [helpers.ts](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts) 顶部新增身份断言函数，并在所有 spec 的 `test.beforeEach` 中调用：
```typescript
export async function assertIsThisApp(page: Page): Promise<void> {
  await expect(page).toHaveTitle(/光锥之外|Beyond-the-Light-Cone|Beyond the Light Cone/);
  const appName = await page.evaluate(() =>
    document.querySelector('meta[name="application-name"]')?.getAttribute('content')
  );
  expect(appName).toContain('光锥之外');
}
```

**验收标准**：
- 手动占用 4173 端口后启动 Playwright，测试明确失败而非复用
- 在正确 preview 上 smoke 检查首先通过
- 报告记录实际 URL 与提交 SHA

### 方案 C：ESLint 配置修复与 CI 接入完整 lint（P1，必做）

**目标**：让本地与 CI 的 `npm run lint` 都能干净通过。

**修改 1**：[eslint.config.js](../../03_Web_Rebuild/eslint.config.js) 第 7 行 `ignores` 追加 `'video-output/**'`

**修改 2**：在第 11-17 行 `languageOptions` 中添加浏览器与 Node 全局：
```javascript
languageOptions: {
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: import.meta.dirname,
  },
  globals: {
    // 浏览器全局（i18n / 组件等使用）
    console: 'readonly',
    window: 'readonly',
    document: 'readonly',
    localStorage: 'readonly',
    CustomEvent: 'readonly',
    Event: 'readonly',
    HTMLElement: 'readonly',
    requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly',
    // Node 全局（脚本中偶用）
    process: 'readonly',
  },
},
```

**修改 3**：[.github/workflows/ci.yml](../../.github/workflows/ci.yml) 第 46-49 行，把 `lint:simulation` 改为完整 `lint`，保留 `lint:simulation` 作为更聚焦的诊断步骤：
```yaml
- name: ESLint full project
  run: |
    set -o pipefail
    npm run lint 2>&1 | tee ../eslint.log
```

**验收标准**：
- 本地 `npm run lint` 退出码 0
- CI PR 流水线运行完整 lint
- `lint:simulation` 仍可独立运行作为快速诊断

### 方案 D：补齐英文剧情用户路径 E2E（P1，本次先记录不执行）

**目标**：覆盖"语言切换英文 → 触发随机剧情 → 验证英文标题/台词/选项 → 点击选项 → 原 action 执行"路径。

**本次范围**：仅在 [src/test/e2e-playwright/](../../03_Web_Rebuild/src/test/e2e-playwright/) 新增 `story-i18n.spec.ts` 骨架文件，用语义 selector 覆盖中英两种语言。**实际编写需先完成方案 A 让 Playwright 可运行**，建议作为方案 A 完成后的独立迭代。

**验收标准**：
- 用例在 Chromium + en/zh 两种语言下均通过
- 不依赖中文 copy 作为唯一定位方式

---

## 7. 执行顺序建议

1. **方案 A**（i18n 守卫）—— 解除 Playwright 阻断，最小改动，立即跑 `npx playwright test --list` 验证
2. **方案 B**（端口硬隔离 + 身份断言）—— 让 Playwright 信任度成立
3. 跑完整 `npm run test:e2e` 摸清真实失败用例
4. **方案 C**（ESLint + CI）—— 让 lint 门禁成立
5. **方案 D**（英文剧情 E2E）—— 补齐 P1 用户路径

> 方案 A/B/C 互不依赖，可并行；方案 D 必须在 A 之后。

---

## 8. 不修改的项

- 不修改 Vitest 测试用例与覆盖率阈值
- 不修改 PWA 构建配置与 manifest
- 不修改 video-output 子项目代码与录制
- 不修改游戏逻辑、剧情数据、美术资源

---

## 9. 本报告边界

- 本报告未修改任何代码或配置；仅采集执行证据并形成修复方案
- "通过"结论受第 2 节所列执行边界约束
- Playwright "零用例"结论基于 `--list` 与单 spec 执行双重确认
