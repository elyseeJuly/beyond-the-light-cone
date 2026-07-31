// Records the concise gameplay sample delivered in video-output/.
import { mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, '..');
const outputDir = path.join(projectDir, 'video-output');
const rawDir = path.join(outputDir, '.raw');
const outputPath = path.join(outputDir, 'beyond-the-light-cone-gameplay.webm');
const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:4173/';
const chromePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

await mkdir(rawDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ['--autoplay-policy=no-user-gesture-required'],
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: {
    dir: rawDir,
    size: { width: 1280, height: 720 },
  },
  colorScheme: 'dark',
  locale: 'zh-CN',
});

const page = await context.newPage();
const recording = page.video();
const browserErrors = [];

page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') browserErrors.push(message.text());
});

await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem(
    'game-tutorial-progress',
    JSON.stringify({
      version: '2026-07-24-v1',
      completedAt: Date.now(),
    }),
  );
  localStorage.setItem('game-assets-prompt-seen', 'true');
});

await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });

const freeExplore = page.getByRole('button', {
  name: /自由探索/,
});
await freeExplore.waitFor({ state: 'visible', timeout: 20_000 });
await page.waitForTimeout(5_000);
await freeExplore.hover();
await page.waitForTimeout(1_500);
await freeExplore.click();

for (const label of ['直接进入游戏', '进入游戏', '后台运行并开始游戏']) {
  const button = page.getByRole('button', { name: label, exact: true });
  if (await button.isVisible().catch(() => false)) {
    await page.waitForTimeout(1_000);
    await button.click();
    break;
  }
}

await page.locator('header').waitFor({ state: 'visible', timeout: 30_000 });
await page.locator('canvas#star-canvas-main').waitFor({
  state: 'attached',
  timeout: 30_000,
});
await page.waitForTimeout(5_000);

const visitView = async (viewName, expectedText, dwellMs = 5_000) => {
  const navigation = page.locator(
    `[data-tutorial-id="nav-${viewName}"]`,
  );
  await navigation.waitFor({ state: 'visible', timeout: 10_000 });
  await navigation.hover();
  await page.waitForTimeout(500);
  await navigation.click();
  if (expectedText) {
    await page.getByText(expectedText, { exact: false }).first().waitFor({
      state: 'visible',
      timeout: 10_000,
    });
  }
  await page.waitForTimeout(dwellMs);
};

await visitView('techtree', '科技研发中心');
await visitView('intelligence', '情报防御与战略监控中心');
await visitView('government', '执政官政府内阁总署');
await visitView('archive', '岁月史书', 4_000);

await page.keyboard.press('Escape');
await page.waitForTimeout(800);

const starMapNavigation = page.locator(
  '[data-tutorial-id="nav-starmap"]',
);
if (await starMapNavigation.isVisible().catch(() => false)) {
  await starMapNavigation.click();
} else {
  await page.keyboard.press('m');
}

await page.waitForTimeout(3_000);
await page.evaluate(() => {
  const game = window.GameInstance?.get?.();
  if (game) game.setRngProvider({ random: () => 0.3 });
});

for (let turn = 0; turn < 4; turn += 1) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(900);

  const proceed = page.locator('.story-proceed-btn');
  const choice = page.locator('.story-choice-btn');
  const acknowledge = page.locator('.story-acknowledge-btn');

  for (let step = 0; step < 8; step += 1) {
    if (await choice.first().isVisible().catch(() => false)) {
      await page.waitForTimeout(1_500);
      await choice.first().click({ force: true, timeout: 2_000 }).catch(() => {});
      await page.waitForTimeout(1_500);
      break;
    }
    if (await acknowledge.first().isVisible().catch(() => false)) {
      await page.waitForTimeout(1_500);
      await acknowledge.first().click({ force: true, timeout: 2_000 }).catch(() => {});
      await page.waitForTimeout(1_500);
      break;
    }
    if (await proceed.first().isVisible().catch(() => false)) {
      await page.waitForTimeout(900);
      await proceed.first().click({ force: true, timeout: 2_000 }).catch(() => {});
      await page.waitForTimeout(700);
      continue;
    }
    break;
  }
}

await page.waitForTimeout(3_000);

const temporaryVideoPath = await recording.path();
await context.close();
await browser.close();
await rename(temporaryVideoPath, outputPath);

console.log(
  JSON.stringify(
    {
      outputPath,
      browserErrors,
    },
    null,
    2,
  ),
);
