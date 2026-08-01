import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, '..');
const outputDir = path.join(projectDir, 'video-output', 'segments');
const rawDir = path.join(outputDir, '.raw');
const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:4173/';
const chromePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ffmpegPath = process.env.FFMPEG_PATH ?? '/opt/homebrew/bin/ffmpeg';
const requestedSegments = new Set(
  (process.env.SEGMENTS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

await mkdir(rawDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ['--autoplay-policy=no-user-gesture-required'],
});

const results = [];

const transcode = (rawPath, outputPath, offsetSeconds, durationSeconds) => {
  const commonArgs = [
    '-y',
    '-ss',
    offsetSeconds.toFixed(3),
    '-t',
    durationSeconds.toFixed(3),
    '-i',
    rawPath,
    '-map',
    '0:v:0',
    '-an',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
  ];

  const hardware = spawnSync(
    ffmpegPath,
    [
      ...commonArgs,
      '-c:v',
      'h264_videotoolbox',
      '-allow_sw',
      '1',
      '-b:v',
      '5M',
      outputPath,
    ],
    { encoding: 'utf8' },
  );

  if (hardware.status === 0) return;

  const fallback = spawnSync(
    ffmpegPath,
    [
      ...commonArgs,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '20',
      outputPath,
    ],
    { encoding: 'utf8' },
  );

  if (fallback.status !== 0) {
    throw new Error(fallback.stderr || hardware.stderr || 'Video transcode failed');
  }
};

const waitForMainUi = async (page) => {
  await page.locator('header').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('canvas#star-canvas-main').waitFor({
    state: 'attached',
    timeout: 30_000,
  });
};

const switchView = async (page, viewName, expectedText) => {
  await page.evaluate((view) => {
    window.dispatchEvent(
      new CustomEvent('change-active-view', { detail: view }),
    );
  }, viewName);
  if (expectedText) {
    await page.getByText(expectedText, { exact: false }).first().waitFor({
      state: 'visible',
      timeout: 10_000,
    });
  }
};

const recordSegment = async ({
  name,
  showCover = false,
  prepare,
  action,
}) => {
  if (requestedSegments.size > 0 && !requestedSegments.has(name)) return;

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
  const videoClockStartedAt = Date.now();
  const browserErrors = [];

  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await page.addInitScript(
    ({ skipCover }) => {
      localStorage.clear();
      localStorage.setItem(
        'game-tutorial-progress',
        JSON.stringify({
          version: '2026-07-24-v1',
          completedAt: Date.now(),
        }),
      );
      localStorage.setItem('game-assets-prompt-seen', 'true');
      if (skipCover) localStorage.setItem('skip_cover', 'true');
      localStorage.setItem(
        'Beyond-the-Light-Cone_EndingHistory',
        JSON.stringify([
          {
            victoryType: 1,
            defeatType: null,
            label: '执剑人威慑胜利',
            year: 62,
            epoch: 2,
            keyFlags: ['logic_deterrence_built', 'deterrence_maintained'],
            timestamp: Date.now() - 86_400_000,
          },
          {
            victoryType: null,
            defeatType: 3,
            label: '二向箔降维打击',
            year: 154,
            epoch: 4,
            keyFlags: ['coordinate_broadcast', 'vector_strike_incoming'],
            timestamp: Date.now(),
          },
        ]),
      );
    },
    { skipCover: !showCover },
  );

  try {
    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    if (showCover) {
      await page.getByRole('button', { name: /自由探索/ }).waitFor({
        state: 'visible',
        timeout: 30_000,
      });
      await page.waitForTimeout(1_500);
    } else {
      await waitForMainUi(page);
      await page.waitForTimeout(1_500);
    }

    if (prepare) await prepare(page);

    const contentStartedAt = Date.now();
    await action(page);
    await page.waitForTimeout(1_000);
    const contentEndedAt = Date.now();

    const rawPath = await recording.path();
    await context.close();

    const outputPath = path.join(outputDir, `${name}.mp4`);
    const offsetSeconds = Math.max(
      0,
      (contentStartedAt - videoClockStartedAt) / 1000 - 0.35,
    );
    const durationSeconds =
      (contentEndedAt - contentStartedAt) / 1000 + 0.7;

    transcode(rawPath, outputPath, offsetSeconds, durationSeconds);
    await unlink(rawPath);

    results.push({
      name,
      outputPath,
      durationSeconds,
      browserErrors,
    });
  } catch (error) {
    await context.close().catch(() => {});
    throw new Error(`${name}: ${error.message}`);
  }
};

await recordSegment({
  name: '01-cover-star-map-and-construction',
  showCover: true,
  action: async (page) => {
    const freeExplore = page.getByRole('button', { name: /自由探索/ });
    await page.waitForTimeout(3_500);
    await freeExplore.hover();
    await page.waitForTimeout(1_000);
    await freeExplore.click();
    await waitForMainUi(page);
    await page.waitForTimeout(4_000);

    const zoomIn = page.locator('button[title="放大"]');
    if (await zoomIn.isVisible().catch(() => false)) {
      await zoomIn.click();
      await page.waitForTimeout(1_200);
      await zoomIn.click();
      await page.waitForTimeout(2_000);
    }

    const buildTab = page.locator(
      '[data-tutorial-id="inspector-tab-build"]',
    );
    if (await buildTab.isVisible().catch(() => false)) {
      await buildTab.click();
      await page.waitForTimeout(2_000);
      await page.evaluate(() => {
        window.game.earthCivi.economy = 1_000;
      });
      const buildMine = page.locator(
        '[data-tutorial-id="btn-build-stope"]',
      );
      if (await buildMine.isVisible().catch(() => false)) {
        await buildMine.click();
        await page.waitForTimeout(3_500);
      }
    }
  },
});

await recordSegment({
  name: '02-crisis-and-deterrence-era-cinematics',
  action: async (page) => {
    const triggerEra = async ({
      epoch,
      id,
      title,
      avatar,
      content,
      label,
    }) => {
      await page.evaluate(
        ({ epochValue, eventId, eventTitle, avatarId, body, choiceLabel }) => {
          const game = window.game;
          game.epoch = epochValue;
          game.currentEvent = {
            id: eventId,
            title: eventTitle,
            dialogQueue: [
              {
                speakerName: '历史观测记录',
                avatarUrl: game.eventManager.formatAvatarUrl(avatarId),
                content: body,
                isCG: true,
              },
            ],
            choices: [{ label: choiceLabel, action: () => {} }],
          };
          window.dispatchEvent(new CustomEvent('game-event-triggered'));
        },
        {
          epochValue: epoch,
          eventId: id,
          eventTitle: title,
          avatarId: avatar,
          body: content,
          choiceLabel: label,
        },
      );
      const choice = page.locator('button.story-choice-btn');
      await choice.waitFor({ state: 'visible', timeout: 10_000 });
      await page.waitForTimeout(7_000);
      await choice.click({ force: true, timeout: 2_000 }).catch(() => {});
      await page.waitForTimeout(2_000);
    };

    await triggerEra({
      epoch: 1,
      id: 'recording_crisis_era',
      title: '纪元更替：危机纪元',
      avatar: 'event_crisis_start',
      content:
        '人类发现了三体舰队，全世界进入危机纪元。智子封锁着基础物理，人类必须在围剿下寻找文明延续的道路。',
      label: '进入危机纪元',
    });

    await triggerEra({
      epoch: 2,
      id: 'recording_deterrence_era',
      title: '纪元更替：威慑纪元',
      avatar: 'event_deterrence_established',
      content:
        '威慑平衡正式建立。在执剑人的威慑压力下，两个文明进入脆弱而短暂的和平冷战期。',
      label: '进入威慑纪元',
    });
  },
});

await recordSegment({
  name: '03-technology-research-and-unlock',
  action: async (page) => {
    await switchView(page, 'techtree', '科技研发中心');
    await page.waitForTimeout(6_000);

    await page.evaluate(() => {
      window.game.eventBus.emitLegacy('game:tech:completed', {
        techName: '强相互作用材料 · 水滴表面防线',
        treeType: 'military',
      });
    });

    const dialog = page.getByRole('dialog');
    const modalAppeared = await dialog
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (modalAppeared) {
      await page.waitForTimeout(6_000);
      const acknowledge = dialog.getByRole('button', {
        name: 'ACKNOWLEDGE / 确认',
      });
      await acknowledge.click({ force: true });
      await page.waitForTimeout(3_000);
    } else {
      await page.waitForTimeout(4_000);
    }
  },
});

await recordSegment({
  name: '04-government-cabinets-and-diplomacy',
  prepare: async (page) => {
    await page.evaluate(() => {
      const game = window.game;
      game.earthCivi.economy = 1_000;
      for (const alien of game.alienCiviManager.aliens.values()) {
        alien.unlocked = true;
        alien.diplomacyCooldown = 0;
      }
    });
  },
  action: async (page) => {
    await switchView(page, 'government', '执政官政府内阁总署');
    await page.waitForTimeout(3_000);

    for (const tab of [
      'finance',
      'military',
      'tech',
      'social',
      'security',
      'diplomacy',
    ]) {
      const control = page.locator(`[data-tutorial-id="gov-tab-${tab}"]`);
      if (await control.isVisible().catch(() => false)) {
        await control.click({ force: true, timeout: 3_000 }).catch(() => {});
        await page.waitForTimeout(2_400);
      }
    }

    const trisolaris = page.locator('button').filter({ hasText: '三体' });
    if (await trisolaris.first().isVisible().catch(() => false)) {
      await trisolaris.first().click();
      await page.waitForTimeout(2_000);
    }

    const negotiate = page.getByText('战略外交谈判', { exact: true });
    if (await negotiate.isVisible().catch(() => false)) {
      await negotiate.click();
      await page.waitForTimeout(4_000);
    }
  },
});

await recordSegment({
  name: '05-intelligence-and-space-battle',
  action: async (page) => {
    await switchView(page, 'intelligence', '情报防御与战略监控中心');
    await page.waitForTimeout(5_000);

    await page.evaluate(() => {
      window.game.lastBattleReport = {
        id: `recording_battle_${Date.now()}`,
        attackerName: '人类第一联合舰队 · 章北海',
        defenderName: '三体先锋水滴舰队',
        planetName: '奥尔特星云深空防线',
        attackerPower: 500,
        defenderPower: 300,
        rounds: [
          {
            round: 1,
            attackerWeapon: '近地防空恒星级氢弹',
            attackerType: 'SUPERBOMB',
            defenderWeapon: '强相互作用力推进器',
            defenderType: 'SPY',
            atkDamage: 50,
            defDamage: 120,
            log: '人类舰队发射重聚变核子鱼雷，水滴随即实施高速穿透反击。',
          },
          {
            round: 2,
            attackerWeapon: '动能轨道加农炮',
            attackerType: 'EXPENDABLE',
            defenderWeapon: '强相互作用力外壳',
            defenderType: 'SPY',
            atkDamage: 20,
            defDamage: 150,
            log: '水滴完成锐角转向并横穿舰队阵列，人类战线遭受毁灭性冲击。',
          },
          {
            round: 3,
            attackerWeapon: '引力波广播天线',
            attackerType: 'SPY',
            defenderWeapon: '强相互作用力推进器',
            defenderType: 'SPY',
            atkDamage: 200,
            defDamage: 0,
            log: '万有引力号启动广播天线，坐标威慑迫使水滴舰队立即退却。',
          },
        ],
        winner: '人类第一联合舰队 · 章北海',
        attackerRemainingHp: 230,
        defenderRemainingHp: 30,
        outcomeLog:
          '人类成功建立不可逆坐标威慑，三体水滴选择退却，深空防线守卫成功。',
      };
      window.dispatchEvent(new CustomEvent('battle-triggered'));
    });

    const nextRound = page.getByText('下一轮交锋', { exact: true });
    await nextRound.waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(3_500);
    for (let round = 0; round < 3; round += 1) {
      await nextRound.click();
      await page.waitForTimeout(3_200);
    }
    await page.waitForTimeout(4_000);
  },
});

await recordSegment({
  name: '06-chronicles-and-civilization-museum',
  action: async (page) => {
    await switchView(page, 'archive', '岁月史书');
    await page.waitForTimeout(6_000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1_000);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-museum'));
    });
    const cgGallery = page.getByText('纪元浮光 (CG图鉴)', {
      exact: true,
    });
    await cgGallery.waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(4_000);
    await cgGallery.click();
    await page.waitForTimeout(6_000);

    const soundtrack = page.getByText('星海留声机', { exact: true });
    await soundtrack.click();
    await page.waitForTimeout(6_000);
  },
});

await browser.close();

console.log(JSON.stringify(results, null, 2));
