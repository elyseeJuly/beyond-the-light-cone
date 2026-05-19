import { describe, it, expect, beforeEach } from 'vitest';
import { GameInstance } from '../../core/Game';

describe('SaveLoad - 存档往返', () => {
  beforeEach(() => {
    localStorage.clear();
    GameInstance.reset();
  });

  describe('基础功能', () => {
    it('空存档返回 false', () => {
      const result = GameInstance.loadGame();
      expect(result).toBe(false);
    });

    it('损坏 JSON 不崩溃', () => {
      localStorage.setItem('LegendOfUni_Save', '{invalid json');
      const result = GameInstance.loadGame();
      expect(result).toBe(false);
    });

    it('saveGame 写入 localStorage', () => {
      const game = GameInstance.get();
      game.earthCivi.economy = 150;
      GameInstance.saveGame();

      const raw = localStorage.getItem('LegendOfUni_Save');
      expect(raw).toBeDefined();
      expect(raw!.length).toBeGreaterThan(100);
    });

    it('reset 清除存档并创建新游戏', () => {
      GameInstance.saveGame();
      GameInstance.reset();

      expect(GameInstance.get().year).toBe(0);
      expect(GameInstance.get().earthCivi.economy).toBe(100);

      const raw = localStorage.getItem('LegendOfUni_Save');
      expect(raw).toBeNull();
    });
  });

  describe('存档版本', () => {
    it('存档使用 v3 版本号并包含 timestamp', () => {
      const game = GameInstance.get();
      game.year = 77;
      GameInstance.saveGame();

      const raw = localStorage.getItem('LegendOfUni_Save')!;
      const parsed = JSON.parse(raw);
      expect(parsed.version).toBe(3);
      expect(parsed.data).toBeTruthy();
      expect(parsed.timestamp).toBeTypeOf('number');
    });
  });
});