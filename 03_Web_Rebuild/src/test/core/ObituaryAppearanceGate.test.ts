import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { EpochType } from '../../types/enums';

/**
 * 讣告发布逻辑回归测试（SCEN-OBITUARY-APPEARANCE-GATE）
 *
 * 不变量：底部动态信息(ticker)的讣告，其角色必须已在本局登场/解锁
 * (在 personManager.availablePersons 中)。未登场、或在世的角色不应收到讣告。
 *
 * 背景：
 *   - 2026-06-24 审计只修了 epochDeathMap(任命资格判定)，未修讣告发布逻辑。
 *   - 最新提交 ae1119e 把死亡对账抽成 `reconcilePersonDeaths()` 调用却丢了方法体，
 *     导致对账整段不执行（tsc 也报错）。本测试随修复一并补回方法体并加“登场门控”。
 *   - persons.json 无 deathYear 字段 → p.deathYear 恒为 0 → 一旦逻辑死亡，讣告必发布。
 *   - 开局 availablePersons 仅 7 人白名单；在 CRISIS 下以 CRISIS 起头的死亡名单中，
 *     仅 雷志成、杨卫宁 属于白名单(已登场)，其余 11 人(如 山杉惠子)任何情况下都不会被解锁。
 *
 * 驱动方式：直接调用 runARound 实际调用的 reconcilePersonDeaths()（私有方法运行时经 as any 调用），
 * 绕开 runARound 的交会事件守卫，得到确定性的对账执行。
 */
describe('SCEN-OBITUARY-APPEARANCE-GATE', () => {
  let game: Game;

  beforeEach(() => {
    GameInstance.reset();
    game = GameInstance.get();
    game.setRngProvider({ random: () => 0.9 });
    game.earthCivi.isAiBrainEnabled = false;
  });

  function parseObituaryNames(messages: string[]): string[] {
    const names: string[] = [];
    for (const m of messages) {
      if (m.startsWith('讣告：')) {
        const match = m.match(/^讣告：(.+?) 逝世。$/);
        if (match) names.push(match[1]);
      }
    }
    return names;
  }

  it('讣告仅对本局已登场角色播报（未登场角色不收讣告）', () => {
    // 锁定到 CRISIS 纪元，直接驱动真实的对账逻辑
    game.epoch = EpochType.CRISIS;
    (game as any).reconcilePersonDeaths();

    const appeared = game.personManager.availablePersons;
    const obitNames = parseObituaryNames(game.tickerMessages);

    // 健全性：确有讣告产生（确保对账真实执行，测试非侥幸通过）
    expect(obitNames.length, '应当产生至少一条讣告').toBeGreaterThan(0);

    // 核心不变量：每条讣告的角色都必须已在本局登场
    const violations = obitNames.filter((n) => !appeared.has(n));
    expect(violations, `未登场角色不应收到讣告: ${violations.join('、')}`).toEqual([]);
  });

  it('健全性：已登场且死于 CRISIS 的角色(雷志成)仍应收到讣告', () => {
    game.epoch = EpochType.CRISIS;
    (game as any).reconcilePersonDeaths();
    const obitNames = parseObituaryNames(game.tickerMessages);
    expect(obitNames).toContain('雷志成');
  });

  it('健全性：逻辑死亡(isAlive)仍对全体生效（保证任命资格正确）', () => {
    game.epoch = EpochType.CRISIS;
    (game as any).reconcilePersonDeaths();
    // 山杉惠子(未登场)逻辑上应已死亡，但（修复后）不应有讣告
    const shanshan = game.personManager.getPerson('山杉惠子');
    expect(shanshan?.isAlive).toBe(false);
    const obitNames = parseObituaryNames(game.tickerMessages);
    expect(obitNames).not.toContain('山杉惠子');
  });
});
