import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';

/**
 * SCEN-STRICT-MODE: strictMode 禁止吞异常 — 让测试说真话
 *
 * 验证：
 * S01 - strictMode=true 时子系统异常直接向上抛出，不被吞没
 * S02 - strictMode=false 时异常被记录为 [警告] 历史日志
 * S03 - strictMode=true 时核心结算异常也直接抛出
 * S04 - handleSubsystemError 在 strict 模式下保留原始 Error 类型
 */
describe('SCEN-STRICT-MODE', () => {
  afterEach(() => {
    Game.strictMode = false;
  });

  describe('S01: strictMode 开启时子系统异常向上抛出', () => {
    it('handleSubsystemError 在 strictMode 下抛出原始 Error', () => {
      Game.strictMode = true;
      const game = new Game();
      const originalError = new Error('模拟地球模拟崩溃');

      expect(() => {
        (game as any).handleSubsystemError('地球模拟出现异常', originalError);
      }).toThrow('模拟地球模拟崩溃');
    });

    it('handleSubsystemError 在 strictMode 下对非 Error 对象包装后抛出', () => {
      Game.strictMode = true;
      const game = new Game();

      expect(() => {
        (game as any).handleSubsystemError('测试上下文', '字符串错误');
      }).toThrow('测试上下文: 字符串错误');
    });
  });

  describe('S02: strictMode 关闭时异常被记录为历史警告', () => {
    it('handleSubsystemError 在非 strictMode 下记录警告日志', () => {
      Game.strictMode = false;
      const game = new Game();
      const historyBefore = game.historyLogs.length;

      (game as any).handleSubsystemError('测试子系统', new Error('测试异常消息'));

      expect(game.historyLogs.length).toBeGreaterThan(historyBefore);
      const lastLog = game.historyLogs[game.historyLogs.length - 1];
      expect(lastLog).toContain('[警告]');
      expect(lastLog).toContain('测试子系统');
      expect(lastLog).toContain('测试异常消息');
    });

    it('handleSubsystemError 不抛出异常', () => {
      Game.strictMode = false;
      const game = new Game();

      expect(() => {
        (game as any).handleSubsystemError('测试', new Error('test'));
      }).not.toThrow();
    });
  });

  describe('S03: strictMode 开启时核心结算异常直接抛出', () => {
    it('strictMode 下 runARound 外层 catch 会 rethrow', () => {
      Game.strictMode = true;
      GameInstance.reset();
      const game = GameInstance.get();
      game.earthCivi.isAiBrainEnabled = true;
      
      // 制造一个会导致核心崩溃的场景：摧毁 earthCivi
      const originalEarthCivi = game.earthCivi;
      (game as any).earthCivi = null;

      expect(() => {
        game.runARound();
      }).toThrow();

      // 恢复
      (game as any).earthCivi = originalEarthCivi;
    });
  });

  describe('S04: 默认 strictMode 为 false', () => {
    it('Game.strictMode 默认为 false', () => {
      expect(Game.strictMode).toBe(false);
    });

    it('strictMode 是静态属性，跨实例共享', () => {
      Game.strictMode = true;
      const game1 = new Game();
      const game2 = new Game();
      expect(Game.strictMode).toBe(true);
      Game.strictMode = false;
    });
  });
});