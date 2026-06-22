import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(projectRoot, '..');

const PORT = 5173;
const SERVER_URL = `http://localhost:${PORT}/beyond-the-light-cone/`;
const VIDEO_DIR = path.join(projectRoot, 'videos');
const FINAL_VIDEO_PATH = path.join(workspaceRoot, 'beyond_the_light_cone_gameplay.webm');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Clean up helper to ensure port is free
function cleanPort() {
  console.log(`🧹 Checking if port ${PORT} is occupied...`);
  try {
    const stdout = execSync(`lsof -t -i:${PORT}`, { encoding: 'utf8' }).trim();
    if (stdout) {
      console.log(`💥 Port ${PORT} occupied by PID(s): ${stdout.replace(/\n/g, ', ')}. Killing process...`);
      execSync(`kill -9 ${stdout.replace(/\n/g, ' ')}`);
      console.log(`✅ Process killed.`);
    } else {
      console.log(`✅ Port ${PORT} is free.`);
    }
  } catch (err) {
    console.log(`✅ Port ${PORT} is free.`);
  }
}

// Poll server until it responds with 200
function waitForServer(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    console.log(`⏳ Waiting for Vite dev server at ${url}...`);
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timeout: Server did not respond within ${timeoutMs}ms`));
        return;
      }

      http.get(url, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          console.log(`🎉 Server is online and responding!`);
          resolve();
        }
      }).on('error', () => {
        // server not ready yet, ignore and retry
      });
    }, 500);
  });
}

async function record() {
  cleanPort();

  console.log(`🚀 Starting Vite development server...`);
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: projectRoot,
    stdio: 'pipe',
    shell: true
  });

  devServer.stderr.on('data', (data) => {
    console.error(`[Vite Dev Server Error]: ${data}`);
  });

  let exitCode = 0;
  let browser, context, page;

  const cleanup = () => {
    console.log(`\n🛑 Stopping Vite dev server (PID: ${devServer.pid})...`);
    devServer.kill('SIGTERM');
    cleanPort();
  };
  
  process.on('exit', cleanup);
  process.on('SIGINT', () => { process.exit(0); });
  process.on('SIGTERM', () => { process.exit(0); });

  try {
    await waitForServer(SERVER_URL);

    console.log(`🎬 Launching Playwright browser...`);
    browser = await chromium.launch({
      headless: false,
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: VIDEO_DIR,
        size: { width: 1280, height: 720 }
      }
    });

    page = await context.newPage();

    // Log console messages & page errors
    page.on('console', msg => {
      console.log(`[Browser Console]: ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error(`[Browser Error]: ${err.message}`);
    });

    console.log(`🧪 Pre-seeding LocalStorage...`);
    await page.addInitScript(() => {
      localStorage.removeItem('LegendOfUni_Save_autosave');
      localStorage.removeItem('LegendOfUni_Save');
      localStorage.removeItem('game-tutorial-seen');

      const mockEndings = [
        {
          victoryType: 1,
          defeatType: null,
          label: "执剑人威慑胜利 (罗辑威慑线)",
          year: 62,
          epoch: 2,
          keyFlags: ["logic_deterrence_built", "deterrence_maintained"],
          timestamp: Date.now() - 3600000 * 24 * 3
        },
        {
          victoryType: 3,
          defeatType: null,
          label: "流浪地球逃逸胜利 (行星发动机线)",
          year: 112,
          epoch: 4,
          keyFlags: ["wandering_earth_activated", "sun_helium_flash_passed"],
          timestamp: Date.now() - 3600000 * 24 * 1.5
        },
        {
          victoryType: null,
          defeatType: 3,
          label: "二向箔降维打击 (灭绝结局)",
          year: 154,
          epoch: 4,
          keyFlags: ["coordinate_broadcast", "vector_strike_incoming"],
          timestamp: Date.now() - 3600000 * 8
        }
      ];
      localStorage.setItem('LegendOfUni_EndingHistory', JSON.stringify(mockEndings));
    });

    console.log(`🌐 Navigating to game client...`);
    await page.goto(SERVER_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app');
    
    // 0:00 - 0:08 | Chapter 1: Strategy Map & Welcome Tutorial
    console.log(`👉 Step 1: Displaying the Tutorial Popup...`);
    await delay(4000);
    console.log(`👉 Dismissing the Tutorial Popup...`);
    await page.click('button:has-text("跳过教程")', { force: true });
    await delay(2000);

    // 0:08 - 0:18 | Zoom and Select Earth Star
    console.log(`👉 Step 2: Star Map Interactions (Zoom and Select Earth)...`);
    await page.click('button[title="放大"]', { force: true });
    await delay(1000);
    await page.click('button[title="放大"]', { force: true });
    await delay(1000);
    
    await page.evaluate(() => {
      const game = window.game;
      if (game && game.starManager) {
        window.dispatchEvent(new CustomEvent('star-selected', { detail: game.starManager.getStar(3) }));
      }
    });
    await delay(3000);

    // Switch to Build tab in Right Inspector first
    console.log(`👉 Switching to Build tab in Right Inspector...`);
    await page.click('[data-tutorial-id="inspector-tab-build"]', { force: true });
    await delay(2000);

    console.log(`👉 Triggering building construction on Earth...`);
    await page.evaluate(() => {
      window.game.earthCivi.economy = 1000;
    });
    await page.click('[data-tutorial-id="btn-build-stope"]', { force: true });
    await delay(3000);

    // 0:18 - 0:33 | Era CG 1: Crisis Era Fullscreen
    console.log(`👉 Step 3: Triggering Crisis Era Fullscreen Movie-like CG...`);
    await page.evaluate(() => {
      const game = window.game;
      game.epoch = 1;
      const newEpochEvent = {
        id: 'event_epoch_transition_1',
        title: '纪元更替：危机纪元',
        dialogQueue: [{
          speakerName: "历史观测记录",
          avatarUrl: game.eventManager.formatAvatarUrl('event_crisis_start'),
          content: "人类发现了三体舰队，全世界进入危机纪元。行星防御理事会正式启动面壁计划，基础物理已被智子封锁，人类必须寻找在围剿下存活的手段！",
          isCG: true
        }],
        choices: [{
          label: "进入危机纪元",
          action: () => {}
        }]
      };
      game.currentEvent = newEpochEvent;
      window.dispatchEvent(new CustomEvent('game-event-triggered'));
    });
    await delay(8000);
    console.log(`👉 Accepting Crisis Era...`);
    await page.click('button.story-choice-btn', { force: true });
    await delay(4000);

    // 0:33 - 0:48 | Era CG 2: Deterrence Era Fullscreen
    console.log(`👉 Step 4: Triggering Deterrence Era Fullscreen Movie-like CG...`);
    await page.evaluate(() => {
      const game = window.game;
      game.epoch = 2;
      const newEpochEvent = {
        id: 'event_epoch_transition_2',
        title: '纪元更替：威慑纪元',
        dialogQueue: [{
          speakerName: "历史观测记录",
          avatarUrl: game.eventManager.formatAvatarUrl('event_deterrence_established'),
          content: "威慑平衡正式建立，人类世界进入威慑纪元。在执剑人的威慑威压下，三体文明被迫停止了向太阳系的扩张，进入脆弱而短暂的和平冷战期。",
          isCG: true
        }],
        choices: [{
          label: "进入威慑纪元",
          action: () => {}
        }]
      };
      game.currentEvent = newEpochEvent;
      window.dispatchEvent(new CustomEvent('game-event-triggered'));
    });
    await delay(8000);
    console.log(`👉 Accepting Deterrence Era...`);
    await page.click('button.story-choice-btn', { force: true });
    await delay(4000);

    // 0:48 - 1:03 | Tech tree exploration & Tech completed popup
    console.log(`👉 Step 5: Transitioning to the Tech Tree Panel...`);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: 'techtree' }));
    });
    await delay(5000);
    
    console.log(`👉 Triggering a Tech Completion Popup...`);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('game:tech:completed', { 
        detail: { techName: '强相互作用材料 (水滴表面防线)', treeType: '军事武器' } 
      }));
    });
    await delay(5000);
    console.log(`👉 Acknowledging technology completion...`);
    await page.click('text=ACKNOWLEDGE / 确认', { force: true });
    await delay(3000);

    // 1:03 - 1:18 | Government department settings
    console.log(`👉 Step 6: Transitioning to the Government Panel...`);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: 'government' }));
    });
    await delay(4000);
    console.log(`👉 Clicking security department (面壁计划)...`);
    await page.click('text=安全部', { force: true });
    await delay(4000);
    console.log(`👉 Clicking diplomacy department (外交委员会)...`);
    await page.click('text=外交委员会', { force: true });
    await delay(4000);
    
    // 1:18 - 1:33 | Intelligence Center & Diplomacy Interactions
    console.log(`👉 Step 7: Transitioning to the Intelligence Panel...`);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: 'intelligence' }));
    });
    await delay(3000);
    
    console.log(`👉 Triggering Diplomatic Interaction with Trisolaris...`);
    await page.evaluate(() => {
      const game = window.game;
      if (game && game.alienCiviManager) {
        for (const [name, alien] of game.alienCiviManager.aliens) {
          alien.unlocked = true;
          alien.diplomacyCooldown = 0;
        }
      }
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: 'government' }));
    });
    await delay(1000);
    await page.click('text=外交委员会', { force: true });
    await delay(2000);
    
    console.log(`👉 Clicking Trisolaris entry and negotiating...`);
    await page.click('text=三体', { force: true });
    await delay(2000);
    await page.click('text=战略外交谈判', { force: true });
    await delay(4000);
    await page.click('text=黑暗森林贸易', { force: true });
    await delay(4000);

    // 1:33 - 1:48 | Trigger Space Combat screen
    console.log(`👉 Step 8: Triggering detailed Space Battle Modal...`);
    await page.evaluate(() => {
      const game = window.game;
      const mockReport = {
        id: `battle_${Date.now()}`,
        attackerName: "人类第一联合舰队 (指挥官: 章北海)",
        defenderName: "三体先锋水滴舰队 (要塞AI)",
        planetName: "奥尔特星云深空防线",
        attackerPower: 500,
        defenderPower: 300,
        rounds: [
          {
            round: 1,
            attackerWeapon: "近地防空恒星级氢弹",
            attackerType: 3,
            defenderWeapon: "强相互作用力推进器",
            defenderType: 0,
            atkDamage: 50,
            defDamage: 120,
            log: "[攻方] 人类舰队 射击重聚变核子鱼雷，对 [守方] 水滴 造成了 50 点结构损伤。 [守方] 释放水滴穿透打击，造成了 120 点致命伤害！"
          },
          {
            round: 2,
            attackerWeapon: "动能轨道加农炮",
            attackerType: 0,
            defenderWeapon: "强相互作用力外壳",
            defenderType: 0,
            atkDamage: 20,
            defDamage: 150,
            log: "[攻方] 人类旗舰 发射超音速动能炮，对 [守方] 水滴 造成了 20 点微弱损伤。 [守方] 水滴进行锐角转向，横冲直撞，对人类舰队造成 150 点毁灭性反击伤害！"
          },
          {
            round: 3,
            attackerWeapon: "引力波广播天线",
            attackerType: 3,
            defenderWeapon: "强相互作用力推进器",
            defenderType: 0,
            atkDamage: 200,
            defDamage: 0,
            log: "[攻方] 终极警告：万有引力号 瞬间启动引力波天线发射坐标广播！ [守方] 水滴检测到强引力源，立刻退避，防线崩溃！"
          }
        ],
        winner: "人类文明",
        attackerRemainingHp: 230,
        defenderRemainingHp: 30,
        outcomeLog: "【战报结论】人类成功启动引力波天线建立不可逆 of 坐标威慑！三体水滴选择退却，深空要塞防守成功！"
      };

      game.lastBattleReport = mockReport;
      window.dispatchEvent(new CustomEvent('battle-triggered'));
    });
    await delay(3000);
    console.log(`👉 Stepping through combat round 1...`);
    await page.click('text=下一轮交锋', { force: true });
    await delay(3000);
    console.log(`👉 Stepping through combat round 2...`);
    await page.click('text=下一轮交锋', { force: true });
    await delay(3000);
    console.log(`👉 Stepping through combat round 3...`);
    await page.click('text=下一轮交锋', { force: true });
    await delay(4000);
    console.log(`👉 Closing combat terminal...`);
    await page.click('text=关闭终端', { force: true });
    await delay(2000);

    // 1:48 - 2:00 | Museum Gallery
    console.log(`👉 Step 9: Opening Museum Gallery (岁月史书)...`);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-museum'));
    });
    await delay(4000);
    console.log(`👉 Clicking permanent gallery cards...`);
    await page.click('text=纪元浮光 (CG图鉴)', { force: true });
    await delay(3000);
    await page.click('text=星海留声机', { force: true });
    await delay(3000);
    console.log(`👉 Closing Museum...`);
    await page.click('button.pointer-events-auto', { force: true });
    await delay(2000);

    console.log(`🏁 Timed gameplay simulation completed successfully!`);

    await context.close();
    await browser.close();

    const files = fs.readdirSync(VIDEO_DIR);
    const videoFile = files.find(f => f.endsWith('.webm'));
    if (videoFile) {
      const sourcePath = path.join(VIDEO_DIR, videoFile);
      fs.copyFileSync(sourcePath, FINAL_VIDEO_PATH);
      console.log(`🌟 Success! Recorded video copied to: ${FINAL_VIDEO_PATH}`);
    } else {
      console.error(`❌ Could not locate recorded video in ${VIDEO_DIR}`);
      exitCode = 1;
    }

  } catch (err) {
    console.error(`❌ Recording failed: ${err.message}`);
    if (page) {
      try {
        await page.screenshot({ path: path.join(workspaceRoot, 'error_screenshot.png') });
        console.log(`📸 Saved error screenshot to workspace root.`);
      } catch (e) {
        console.error(`Could not save error screenshot: ${e.message}`);
      }
    }
    exitCode = 1;
  } finally {
    cleanup();
    process.exit(exitCode);
  }
}

record();
