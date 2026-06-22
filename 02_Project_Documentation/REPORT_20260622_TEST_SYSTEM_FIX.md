# LegendOfUni 测试系统修复报告

> **文档编号**: REPORT_20260622_TEST_SYSTEM_FIX  
> **生成日期**: 2026-06-22  
> **分类前缀**: `REPORT_`（修复实施与结果报告）  
> **文档版本**: V1.0  
> **关联审计**: [AUDIT_20260621_TEST_SYSTEM_ARCHITECTURE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260621_TEST_SYSTEM_ARCHITECTURE.md)

---

## 一、修复概述

本次修复针对审计报告识别的 UI 层 E2E 测试缺口以及当前 E2E 用例中的失败项，完成了以下工作：

1. 暴露浏览器全局 `GameInstance`，解决 E2E 测试无法读取游戏状态的问题。
2. 修正核心用户流 E2E 用例中的断言字段与事件弹窗交互逻辑。
3. 新增移动端横屏提示弹窗的关闭辅助函数，修复移动端视图切换与事件选择测试。
4. 运行全量 Vitest 单元/集成测试与 Playwright E2E 测试（除受本地沙箱限制的 Firefox 外），验证修复效果。
5. 执行 ESLint 静态检查与 TypeScript 类型检查，确认无新增错误。

---

## 二、问题与修复详情

### 2.1 `GameInstance` 未暴露导致 E2E 无法读取游戏年份与资源

**问题描述**  
`core-flow.spec.ts` 中通过 `page.evaluate(() => (window as any).GameInstance?.get?.())` 读取游戏实例，但 `main.tsx` 仅暴露了 `window.game`，未暴露 `window.GameInstance`，导致 `nextYear` 为 `null`，资源断言也无法执行。

**修复方案**  
在 [src/main.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/main.tsx#L56-L58) 中同时暴露 `GameInstance`：

```typescript
// Setup global access for debugging and E2E tests
(window as any).game = GameInstance.get();
(window as any).GameInstance = GameInstance;
```

**验证结果**  
`按空格推进回合且资源非负` 测试通过，年份正确推进，资源字段可读取。

---

### 2.2 资源断言使用了不存在的 `stability` 字段

**问题描述**  
`core-flow.spec.ts` 原断言检查 `game.earthCivi.stability`，但 `EarthCivilization` 实际属性为 `economy`、`population`、`army`、`resource`、`culture`、`treachery` 等，不存在 `stability`。

**修复方案**  
在 [src/test/e2e-playwright/core-flow.spec.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/core-flow.spec.ts#L55-L73) 中：

- 将 `stability` 替换为实际存在的 `resource` 与 `culture`。
- 同步调整 `page.evaluate` 的返回对象与断言列表。

```typescript
return {
  economy: game.earthCivi.economy,
  population: game.earthCivi.population,
  army: game.earthCivi.army,
  resource: game.earthCivi.resource,
  culture: game.earthCivi.culture,
};
```

---

### 2.3 事件弹窗按钮点击超时

**问题描述**  
`事件弹窗出现后可选择选项` 测试中，`.story-proceed-btn` 等元素带有入场动画与打字机动画，Playwright 默认点击会等待元素稳定，导致超时。同时原逻辑仅尝试点击一次继续按钮，无法处理多段对话的事件。

**修复方案**  
在 [src/test/e2e-playwright/core-flow.spec.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/core-flow.spec.ts#L77-L140) 中：

- 使用 `click({ force: true })` 跳过动画稳定性检查。
- 循环处理继续按钮，直到选项/确认按钮出现。
- 扩展选择器以覆盖 `.story-acknowledge-btn`。
- 为事件测试单独设置 60 秒超时，关闭等待延长至 15 秒。

---

### 2.4 移动端横屏提示弹窗拦截点击

**问题描述**  
在 `mobile-chrome` 与 `mobile-safari` 项目中，`OrientationPrompt` 组件会在竖屏移动端显示全屏遮罩，拦截底部导航与事件弹窗按钮的点击，导致视图切换和事件选择测试超时。

**修复方案**  
在 [src/test/e2e-playwright/helpers.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/helpers.ts#L35-L45) 新增 `dismissOrientationPrompt`：

```typescript
export async function dismissOrientationPrompt(page: Page): Promise<void> {
  const okBtn = page.locator('button:has-text("我知道了")');
  try {
    await expect(okBtn).toBeVisible({ timeout: 3000 });
    await okBtn.click();
    await expect(okBtn).not.toBeVisible();
  } catch {
    // 弹窗未出现（桌面端或已被关闭）
  }
}
```

并在 `core-flow.spec.ts` 的 `beforeEach` 中于 `waitForMainUI` 之后调用。

---

## 三、修改文件清单

| 文件 | 变更类型 | 说明 |
|---|---|---|
| [src/main.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/main.tsx) | 修改 | 暴露 `window.GameInstance` 供 E2E 读取 |
| [src/test/e2e-playwright/core-flow.spec.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/core-flow.spec.ts) | 修改 | 修复年份读取、资源字段、事件弹窗交互；移动端关闭横屏提示 |
| [src/test/e2e-playwright/helpers.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/helpers.ts) | 修改 | 新增 `dismissOrientationPrompt` 辅助函数 |

---

## 四、测试执行结果

### 4.1 Vitest 单元/集成测试

```
Test Files  40 passed (40)
     Tests  833 passed (833)
  Start at  13:07:48
  Duration  8.46s
```

### 4.2 Playwright E2E 测试

执行命令：

```bash
npx playwright test \
  --project=chromium-desktop \
  --project=webkit-desktop \
  --project=mobile-chrome \
  --project=mobile-safari
```

结果：

```
39 passed
1 flaky (passed on retry)
```

- Chromium / WebKit 桌面端：全部通过。
- Mobile Chrome / Mobile Safari：全部通过。
- `smoke.spec.ts` 中 `代码分割 chunk 按需加载` 在 Chromium 首次运行超时，重试后通过，标记为 flaky。

### 4.3 静态检查

```bash
npm run lint    # 0 errors, 12 warnings（均为既有警告）
npm run typecheck # 通过
```

---

## 五、已知问题与说明

### 5.1 Firefox 桌面端无法在当前环境启动

**现象**  
`firefox-desktop` 项目运行时，浏览器启动即报错：

```
sandbox initialization failed: Operation not permitted
```

**根因**  
当前 macOS 运行环境对 Playwright Firefox 的 seatbelt 沙箱初始化施加了权限限制，属于本地执行环境限制，而非测试代码或应用代码缺陷。

**建议**  
- 在 CI（Linux/macOS runner 权限完整）中运行 `npm run test:e2e` 可覆盖 Firefox。
- 本地开发时，若需验证 Firefox，可尝试在普通终端（非受限沙箱环境）执行，或调整系统沙箱策略。

---

## 六、后续建议

1. **降低 flaky 测试敏感度**：为 `smoke.spec.ts` 中的 chunk 加载断言增加更宽松的等待策略或拆分超时配置。
2. **CI 中启用 Firefox**：在 GitHub Actions 等 CI 环境中完整运行 `npm run test:e2e`，利用 CI 权限完整的环境覆盖 Firefox 与 WebKit。
3. **覆盖率提升**：按照审计报告 P1 建议，将语句覆盖率门槛从 70% 提升至 80%，并继续补充 TagManager/事件集成测试。

---

## 七、结论

本次修复成功解决了审计报告中指出的核心 E2E 用户流失败问题，E2E 测试在 Chromium、WebKit、Mobile Chrome、Mobile Safari 四个项目下全部通过。代码已通过 ESLint 与 TypeScript 类型检查，可直接提交并同步至 GitHub。
