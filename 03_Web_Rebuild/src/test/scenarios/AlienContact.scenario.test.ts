import { describe, it, expect, beforeEach } from 'vitest';
import { GameInstance } from '../../core/Game';

/**
 * SCEN-ALIEN-CONTACT: 外星文明接触事件弹窗
 * 验证 discovered / contacted 两阶段状态、eventQueue 弹窗、ticker 消息均正确触发。
 */
describe('SCEN-ALIEN-CONTACT', () => {
  beforeEach(() => {
    GameInstance.reset();
  });

  it('发现文明时 marked discovered=true, contacted=false, 并推入事件队列与 ticker', () => {
    const game = GameInstance.get();
    game.earthCivi.isAiBrainEnabled = true;
    game.year = 120;

    const singer = game.alienCiviManager.aliens.get('歌者');
    expect(singer).toBeDefined();
    expect(singer!.discovered).toBe(false);
    expect(singer!.contacted).toBe(false);

    const beforeQueue = game.eventQueue.length;
    const beforeTicker = game.tickerMessages.length;

    game.updateDiplomacyUnlocks();

    expect(singer!.discovered).toBe(true);
    expect(singer!.contacted).toBe(false);
    expect(singer!.discoveryEventFired).toBe(true);
    expect(game.eventQueue.length).toBeGreaterThan(beforeQueue);
    expect(game.tickerMessages.length).toBeGreaterThan(beforeTicker);
    expect(game.tickerMessages[game.tickerMessages.length - 1]).toContain('歌者');
    expect(game.tickerMessages[game.tickerMessages.length - 1]).toContain('首次发现');

    // 确认弹窗事件标题
    const payload = game.eventQueue.find(e => e.id === 'alien_discovery_歌者');
    expect(payload).toBeDefined();
    expect(payload!.title).toBe('深空光粒信号');
  });

  it('已发现文明满足接触条件后 marked contacted=true, 并推入事件队列与 ticker', () => {
    const game = GameInstance.get();
    game.earthCivi.isAiBrainEnabled = true;

    const singer = game.alienCiviManager.aliens.get('歌者');
    singer!.discovered = true;
    singer!.discoveryEventFired = true;
    game.year = 150;

    const beforeQueue = game.eventQueue.length;
    const beforeTicker = game.tickerMessages.length;

    game.updateDiplomacyUnlocks();

    expect(singer!.contacted).toBe(true);
    expect(singer!.contactEventFired).toBe(true);
    expect(game.eventQueue.length).toBeGreaterThan(beforeQueue);
    expect(game.tickerMessages.length).toBeGreaterThan(beforeTicker);
    expect(game.tickerMessages[game.tickerMessages.length - 1]).toContain('歌者');
    expect(game.tickerMessages[game.tickerMessages.length - 1]).toContain('通信信道');

    const payload = game.eventQueue.find(e => e.id === 'alien_contact_歌者');
    expect(payload).toBeDefined();
    expect(payload!.title).toBe('歌者文明接触');
  });

  it('未接触的文明执行外交操作会返回通信未建立提示', () => {
    const game = GameInstance.get();
    const singer = game.alienCiviManager.aliens.get('歌者');
    singer!.discovered = true;
    singer!.contacted = false;

    const result = game.conductDiplomacy('歌者', 'negotiate');
    expect(result).toContain('通信未建立');
  });

  it('已接触的文明可正常执行外交操作', () => {
    const game = GameInstance.get();
    const singer = game.alienCiviManager.aliens.get('歌者');
    singer!.discovered = true;
    singer!.contacted = true;

    const result = game.conductDiplomacy('歌者', 'negotiate');
    expect(result).not.toContain('通信未建立');
  });

  it('三体文明开局即为 discovered + contacted', () => {
    const game = GameInstance.get();
    game.updateDiplomacyUnlocks();

    const trisolaris = game.alienCiviManager.aliens.get('三体');
    expect(trisolaris!.discovered).toBe(true);
    expect(trisolaris!.contacted).toBe(true);
  });
});
