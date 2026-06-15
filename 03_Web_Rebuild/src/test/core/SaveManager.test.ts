import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager, SaveDataCorruptedError } from '../../core/SaveManager';

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hasSave 无存档时返回 false', () => {
    expect(SaveManager.hasSave()).toBe(false);
  });

  it('hasSave 有存档时返回 true', () => {
    SaveManager.save(() => JSON.stringify({ year: 10, test: true }));
    expect(SaveManager.hasSave()).toBe(true);
  });

  it('save + load 往返正常', () => {
    const gameData = { year: 50, epoch: 2, earthCivi: { population: 100, economy: 200, culture: 300 } };
    SaveManager.save(() => JSON.stringify(gameData));
    const loaded = SaveManager.load();
    expect(loaded).not.toBeNull();
    const parsed = JSON.parse(loaded!);
    expect(parsed.year).toBe(50);
    expect(parsed.epoch).toBe(2);
    expect(parsed.earthCivi.population).toBe(100);
  });

  it('load 无存档时返回 null', () => {
    expect(SaveManager.load()).toBeNull();
  });

  it('load 损坏数据抛出 SaveDataCorruptedError', () => {
    localStorage.setItem('LegendOfUni_Save', JSON.stringify({
      version: 3,
      timestamp: Date.now(),
      signature: 0,
      data: '{"corrupted": true}',
    }));
    expect(() => SaveManager.load()).toThrow(SaveDataCorruptedError);
    expect(() => SaveManager.load()).toThrow('哈希校验失败');
  });

  it('load 版本不匹配抛出 SaveDataCorruptedError', () => {
    const gameData = { year: 10 };
    SaveManager.save(() => JSON.stringify(gameData));
    const raw = localStorage.getItem('LegendOfUni_Save')!;
    const parsed = JSON.parse(raw);
    parsed.version = 2;
    localStorage.setItem('LegendOfUni_Save', JSON.stringify(parsed));
    expect(() => SaveManager.load()).toThrow(SaveDataCorruptedError);
    expect(() => SaveManager.load()).toThrow('存档版本不兼容');
  });

  it('getMeta 返回元数据', () => {
    const gameData = {
      year: 100,
      epoch: 2,
      earthCivi: { population: 500, economy: 300, culture: 200 },
    };
    SaveManager.save(() => JSON.stringify(gameData));
    const meta = SaveManager.getMeta();
    expect(meta).not.toBeNull();
    expect(meta!.year).toBe(100);
    expect(meta!.epoch).toBe(2);
    expect(meta!.population).toBe(500);
    expect(meta!.economy).toBe(300);
    expect(meta!.culture).toBe(200);
    expect(meta!.timestamp).toBeGreaterThan(0);
  });

  it('getMeta 无存档时返回 null', () => {
    expect(SaveManager.getMeta()).toBeNull();
  });

  it('getMeta 损坏数据返回 null', () => {
    localStorage.setItem('LegendOfUni_Save', 'invalid json');
    expect(SaveManager.getMeta()).toBeNull();
  });

  it('deleteSave 移除存档', () => {
    SaveManager.save(() => JSON.stringify({ year: 10 }));
    expect(SaveManager.hasSave()).toBe(true);
    SaveManager.deleteSave();
    expect(SaveManager.hasSave()).toBe(false);
    expect(SaveManager.load()).toBeNull();
  });

  it('SAVE_VERSION 是 3', () => {
    expect(SaveManager.SAVE_VERSION).toBe(3);
  });

  it('load 无效 JSON 抛出 SaveDataCorruptedError', () => {
    localStorage.setItem('LegendOfUni_Save', 'not even json');
    expect(() => SaveManager.load()).toThrow(SaveDataCorruptedError);
  });

  it('多次 save 覆盖旧存档', () => {
    SaveManager.save(() => JSON.stringify({ year: 10, data: 'first' }));
    SaveManager.save(() => JSON.stringify({ year: 20, data: 'second' }));
    const loaded = JSON.parse(SaveManager.load()!);
    expect(loaded.year).toBe(20);
    expect(loaded.data).toBe('second');
  });

  it('load 空数据抛出 SaveDataCorruptedError', () => {
    localStorage.setItem('LegendOfUni_Save', JSON.stringify({
      version: 3,
      timestamp: Date.now(),
      signature: 12345,
      data: '',
    }));
    expect(() => SaveManager.load()).toThrow(SaveDataCorruptedError);
  });

  it('load 验证签名防止篡改', () => {
    SaveManager.save(() => JSON.stringify({ year: 10 }));
    const raw = localStorage.getItem('LegendOfUni_Save')!;
    const parsed = JSON.parse(raw);
    parsed.data = JSON.stringify({ year: 999 });
    localStorage.setItem('LegendOfUni_Save', JSON.stringify(parsed));
    expect(() => SaveManager.load()).toThrow('哈希校验失败');
  });

  describe('Ruins Persistence', () => {
    it('saveRuinRecord & getRuinHistory & clearRuinHistory 存取与清空正常', () => {
      expect(SaveManager.getRuinHistory()).toEqual([]);

      SaveManager.saveRuinRecord({ year: 100, culture: 500, techCount: 15 });
      const history = SaveManager.getRuinHistory();
      expect(history.length).toBe(1);
      expect(history[0].year).toBe(100);
      expect(history[0].culture).toBe(500);
      expect(history[0].techCount).toBe(15);
      expect(history[0].timestamp).toBeGreaterThan(0);

      SaveManager.clearRuinHistory();
      expect(SaveManager.getRuinHistory()).toEqual([]);
    });

    it('saveRuinRecord 最多保存 5 条记录，超出时移出最旧的一条', () => {
      for (let i = 1; i <= 6; i++) {
        SaveManager.saveRuinRecord({ year: i * 10, culture: i * 100, techCount: i });
      }
      const history = SaveManager.getRuinHistory();
      expect(history.length).toBe(5);
      expect(history[0].year).toBe(20); // 最旧的 year 10 被移除了
      expect(history[4].year).toBe(60); // 最后的 year 60 保留
    });
  });
});