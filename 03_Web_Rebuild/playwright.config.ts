import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 *
 * 核心用户路径覆盖：
 * - 首次访问跳过教程
 * - 主界面渲染（TopHUD / LeftHub / StarMap / RightInspector / BottomEventBar）
 * - 回合推进与事件弹窗
 * - 科技树、情报中心、政府管理、文明档案切换
 * - 移动端响应式布局（MobileBottomNav）
 *
 * 端口可信度：globalSetup 在所有 spec 运行前对 preview URL 做身份断言，
 * 杜绝 reuseExistingServer 复用其他项目占用 4173 端口的隐性风险。
 */
export default defineConfig({
  testDir: './src/test/e2e-playwright',
  outputDir: './playwright-report/test-artifacts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: './playwright-report/html' }]],
  globalSetup: './src/test/e2e-playwright/global-setup.ts',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    // --strictPort: 端口被占用时直接失败而非递增，避免对错误应用测试
    command: 'npm run preview -- --port 4173 --strictPort',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173/',
    // 永不复用：杜绝复用其他项目占用 4173 端口的 preview 服务
    reuseExistingServer: false,
    timeout: 120000,
  },
});
