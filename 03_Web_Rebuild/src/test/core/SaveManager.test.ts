import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager, SaveDataCorruptedError } from '../../core/SaveManager';
import { VictoryType, EpochType } from '../../types/enums';

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
    SaveManager.resetCache();
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
    localStorage.setItem('LegendOfUni_Save_autosave', JSON.stringify({
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
    const raw = localStorage.getItem('LegendOfUni_Save_autosave')!;
    const parsed = JSON.parse(raw);
    parsed.version = 4;
    localStorage.setItem('LegendOfUni_Save_autosave', JSON.stringify(parsed));
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
    localStorage.setItem('LegendOfUni_Save_autosave', 'invalid json');
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
    localStorage.setItem('LegendOfUni_Save_autosave', 'not even json');
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
    localStorage.setItem('LegendOfUni_Save_autosave', JSON.stringify({
      version: 3,
      timestamp: Date.now(),
      signature: 12345,
      data: '',
    }));
    expect(() => SaveManager.load()).toThrow(SaveDataCorruptedError);
  });

  it('load 验证签名防止篡改', () => {
    SaveManager.save(() => JSON.stringify({ year: 10 }));
    const raw = localStorage.getItem('LegendOfUni_Save_autosave')!;
    const parsed = JSON.parse(raw);
    parsed.data = JSON.stringify({ year: 999 });
    localStorage.setItem('LegendOfUni_Save_autosave', JSON.stringify(parsed));
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

describe('Save Slot Edge Cases', () => {
  it('saveToSlot + loadFromSlot 往返正常：所有 4 个槽位', () => {
    const data = { year: 10, slot: 'test' };
    for (const slot of ['autosave', 'slot1', 'slot2', 'slot3'] as const) {
      SaveManager.saveToSlot(slot, () => JSON.stringify(data));
      const loaded = SaveManager.loadFromSlot(slot);
      expect(loaded).not.toBeNull();
      expect(JSON.parse(loaded!).year).toBe(10);
    }
  });

  it('loadFromSlot 空槽位返回 null', () => {
    expect(SaveManager.loadFromSlot('slot1')).toBeNull();
    expect(SaveManager.loadFromSlot('slot2')).toBeNull();
    expect(SaveManager.loadFromSlot('slot3')).toBeNull();
  });

  it('saveToSlot 覆盖已有存档', () => {
    SaveManager.saveToSlot('slot1', () => JSON.stringify({ version: 1 }));
    SaveManager.saveToSlot('slot1', () => JSON.stringify({ version: 2 }));
    const loaded = JSON.parse(SaveManager.loadFromSlot('slot1')!);
    expect(loaded.version).toBe(2);
  });

  it('deleteSlot 移除指定槽位', () => {
    SaveManager.saveToSlot('slot1', () => JSON.stringify({ year: 10 }));
    expect(SaveManager.hasSlot('slot1')).toBe(true);
    SaveManager.deleteSlot('slot1');
    expect(SaveManager.hasSlot('slot1')).toBe(false);
    expect(SaveManager.loadFromSlot('slot1')).toBeNull();
  });

  it('hasSlot 检测所有槽位', () => {
    expect(SaveManager.hasSlot('autosave')).toBe(false);
    expect(SaveManager.hasSlot('slot1')).toBe(false);
    expect(SaveManager.hasSlot('slot2')).toBe(false);
    expect(SaveManager.hasSlot('slot3')).toBe(false);

    SaveManager.saveToSlot('slot2', () => JSON.stringify({ year: 5 }));
    expect(SaveManager.hasSlot('autosave')).toBe(false);
    expect(SaveManager.hasSlot('slot1')).toBe(false);
    expect(SaveManager.hasSlot('slot2')).toBe(true);
    expect(SaveManager.hasSlot('slot3')).toBe(false);
  });
});

describe('Version Compatibility', () => {
  it('当前版本存档可正常加载', () => {
    SaveManager.saveToSlot('slot1', () => JSON.stringify({ year: 30 }));
    const loaded = SaveManager.loadFromSlot('slot1');
    expect(loaded).not.toBeNull();
    expect(JSON.parse(loaded!).year).toBe(30);
  });

  it('版本不匹配抛出 SaveDataCorruptedError', () => {
    const data = { year: 10 };
    SaveManager.saveToSlot('slot1', () => JSON.stringify(data));
    const raw = localStorage.getItem('LegendOfUni_Save_slot1')!;
    const parsed = JSON.parse(raw);
    parsed.version = 4;
    localStorage.setItem('LegendOfUni_Save_slot1', JSON.stringify(parsed));
    expect(() => SaveManager.loadFromSlot('slot1')).toThrow(SaveDataCorruptedError);
    expect(() => SaveManager.loadFromSlot('slot1')).toThrow('存档版本不兼容');
  });

  it('未来版本号抛出 SaveDataCorruptedError', () => {
    localStorage.setItem('LegendOfUni_Save_slot1', JSON.stringify({
      version: 99,
      timestamp: Date.now(),
      signature: 0,
      data: JSON.stringify({ year: 10 }),
    }));
    expect(() => SaveManager.loadFromSlot('slot1')).toThrow(SaveDataCorruptedError);
    expect(() => SaveManager.loadFromSlot('slot1')).toThrow('存档版本不兼容');
  });
});

describe('Hash/Signature Verification', () => {
  it('有效签名通过验证', () => {
    SaveManager.saveToSlot('slot1', () => JSON.stringify({ year: 10 }));
    const loaded = SaveManager.loadFromSlot('slot1');
    expect(loaded).not.toBeNull();
  });

  it('篡改数据导致哈希校验失败', () => {
    SaveManager.saveToSlot('slot1', () => JSON.stringify({ year: 10 }));
    const raw = localStorage.getItem('LegendOfUni_Save_slot1')!;
    const parsed = JSON.parse(raw);
    parsed.data = JSON.stringify({ year: 999 });
    localStorage.setItem('LegendOfUni_Save_slot1', JSON.stringify(parsed));
    expect(() => SaveManager.loadFromSlot('slot1')).toThrow(SaveDataCorruptedError);
    expect(() => SaveManager.loadFromSlot('slot1')).toThrow('哈希校验失败');
  });

  it('空数据字符串签名不通过', () => {
    localStorage.setItem('LegendOfUni_Save_slot1', JSON.stringify({
      version: 3,
      timestamp: Date.now(),
      signature: 12345,
      data: '',
    }));
    expect(() => SaveManager.loadFromSlot('slot1')).toThrow(SaveDataCorruptedError);
  });
});

describe('Ending History', () => {
  it('recordEnding 存储结局记录', () => {
    SaveManager.recordEnding({
      victoryType: VictoryType.CONQUEST,
      defeatType: null,
      label: '征服胜利',
      year: 250,
      epoch: EpochType.GALAXY,
      keyFlags: ['flag1'],
      timestamp: Date.now(),
    });
    const history = SaveManager.getEndingHistory();
    expect(history.length).toBe(1);
    expect(history[0].victoryType).toBe(VictoryType.CONQUEST);
    expect(history[0].label).toBe('征服胜利');
    expect(history[0].year).toBe(250);
  });

  it('getEndingHistory 按时间顺序返回', () => {
    SaveManager.recordEnding({
      victoryType: VictoryType.CONQUEST, defeatType: null,
      label: '征服', year: 100, epoch: EpochType.GOLDEN,
      keyFlags: [], timestamp: 1000,
    });
    SaveManager.recordEnding({
      victoryType: VictoryType.DETERRENCE, defeatType: null,
      label: '威慑', year: 200, epoch: EpochType.DETERRENCE,
      keyFlags: [], timestamp: 2000,
    });
    const history = SaveManager.getEndingHistory();
    expect(history.length).toBe(2);
    expect(history[0].year).toBe(100);
    expect(history[1].year).toBe(200);
  });

  it('EndingHistory 最多保存 10 条记录', () => {
    for (let i = 1; i <= 11; i++) {
      SaveManager.recordEnding({
        victoryType: VictoryType.CONQUEST, defeatType: null,
        label: `结局${i}`, year: i * 10, epoch: EpochType.GALAXY,
        keyFlags: [], timestamp: i * 1000,
      });
    }
    const history = SaveManager.getEndingHistory();
    expect(history.length).toBe(10);
    // 最旧的 year 10 被移除，保留 year 20 ~ year 110
    expect(history[0].year).toBe(20);
    expect(history[9].year).toBe(110);
  });

  it('clear localStorage 清空结局历史', () => {
    SaveManager.recordEnding({
      victoryType: VictoryType.CONQUEST, defeatType: null,
      label: '测试', year: 100, epoch: EpochType.GALAXY,
      keyFlags: [], timestamp: Date.now(),
    });
    expect(SaveManager.getEndingHistory().length).toBe(1);
    localStorage.removeItem('LegendOfUni_EndingHistory');
    expect(SaveManager.getEndingHistory()).toEqual([]);
  });
});
});