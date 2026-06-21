import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryGenerator } from '../../core/HistoryGenerator';

describe('HistoryGenerator', () => {
  let hg: HistoryGenerator;

  beforeEach(() => {
    hg = new HistoryGenerator();
  });

  it('初始无条目', () => {
    expect(hg.entries.length).toBe(0);
  });

  it('recordMilestone 记录里程碑事件', () => {
    hg.recordMilestone(10, 0, '面壁计划启动', '联合国宣布面壁计划', ['wallfacer'], ['罗辑']);
    expect(hg.entries.length).toBe(1);
    const entry = hg.entries[0];
    expect(entry.year).toBe(10);
    expect(entry.epochName).toBe('危机纪元');
    expect(entry.entryType).toBe('MILESTONE');
    expect(entry.title).toBe('面壁计划启动');
    expect(entry.relatedTags).toEqual(['wallfacer']);
    expect(entry.relatedPersons).toEqual(['罗辑']);
  });

  it('recordEvent 记录普通事件', () => {
    hg.recordEvent(20, 1, '经济衰退', '全球经济下滑', ['economic'], ['泰勒']);
    const entry = hg.entries[0];
    expect(entry.entryType).toBe('EVENT');
    expect(entry.epochName).toBe('威慑纪元');
  });

  it('recordTagChange 记录标签变化', () => {
    hg.recordTagChange(5, 0, 'civil_unrest', '民心不稳', true);
    expect(hg.entries.length).toBe(1);
    expect(hg.entries[0].entryType).toBe('TAG_APPLIED');
    expect(hg.entries[0].title).toContain('世界状态变化');

    hg.recordTagChange(10, 0, 'civil_unrest', '民心不稳', false);
    expect(hg.entries.length).toBe(2);
    expect(hg.entries[1].entryType).toBe('TAG_REMOVED');
    expect(hg.entries[1].title).toContain('世界状态消失');
  });

  it('recordCrisis 记录危机', () => {
    hg.recordCrisis(30, 2, '水滴攻击', '三体水滴摧毁联合舰队');
    expect(hg.entries[0].entryType).toBe('CRISIS');
    expect(hg.entries[0].epochName).toBe('广播纪元');
  });

  it('recordVictory 记录胜利', () => {
    hg.recordVictory(200, 4, '流浪地球成功', '人类抵达比邻星');
    expect(hg.entries[0].entryType).toBe('VICTORY');
    expect(hg.entries[0].epochName).toBe('银河纪元');
  });

  it('incTurn 递增回合计数器', () => {
    expect(hg['turnCounter']).toBe(0);
    hg.incTurn();
    hg.incTurn();
    hg.incTurn();
    hg.recordMilestone(5, 0, 'test', 'desc');
    expect(hg.entries[0].turnNumber).toBe(3);
  });

  it('generateChronicle 生成编年史文本', () => {
    expect(hg.generateChronicle()).toBe('暂无历史记录。');
    hg.recordMilestone(10, 0, '面壁计划', '启动');
    hg.recordEvent(15, 0, 'ETO活动', '地下组织被发现', ['eto'], ['叶文洁']);
    const chronicle = hg.generateChronicle();
    expect(chronicle).toContain('危机纪元');
    expect(chronicle).toContain('第10年');
    expect(chronicle).toContain('面壁计划');
    expect(chronicle).toContain('(eto)');
    expect(chronicle).toContain('[叶文洁]');
  });

  it('getEntriesByEpoch 按纪元过滤', () => {
    hg.recordMilestone(5, 0, 'A', 'desc');
    hg.recordMilestone(15, 1, 'B', 'desc');
    hg.recordMilestone(25, 2, 'C', 'desc');
    expect(hg.getEntriesByEpoch(0).length).toBe(1);
    expect(hg.getEntriesByEpoch(1).length).toBe(1);
    expect(hg.getEntriesByEpoch(2).length).toBe(1);
  });

  it('getEntriesByType 按类型过滤', () => {
    hg.recordMilestone(0, 0, 'M', 'desc');
    hg.recordEvent(1, 0, 'E', 'desc');
    hg.recordCrisis(2, 0, 'C', 'desc');
    expect(hg.getEntriesByType('MILESTONE').length).toBe(1);
    expect(hg.getEntriesByType('EVENT').length).toBe(1);
    expect(hg.getEntriesByType('CRISIS').length).toBe(1);
  });

  it('getRecentEntries 返回最近 N 条倒序', () => {
    for (let i = 0; i < 10; i++) {
      hg.recordMilestone(i, 0, `Event ${i}`, 'desc');
    }
    const recent = hg.getRecentEntries(3);
    expect(recent.length).toBe(3);
    expect(recent[0].title).toBe('Event 9');
    expect(recent[2].title).toBe('Event 7');
  });

  it('exportToTimeline 导出兼容格式', () => {
    hg.recordMilestone(10, 0, '测试', '描述');
    const exported = hg.exportToTimeline();
    expect(exported.length).toBe(1);
    expect(exported[0]).toHaveProperty('year');
    expect(exported[0]).toHaveProperty('epoch');
    expect(exported[0]).toHaveProperty('title');
    expect(exported[0]).toHaveProperty('description');
    expect(exported[0]).toHaveProperty('type');
  });

  it('prune 修剪过旧条目', () => {
    for (let i = 0; i < 600; i++) {
      hg.recordMilestone(i, 0, `Event ${i}`, 'desc');
    }
    hg.prune(500);
    expect(hg.entries.length).toBe(500);
    expect(hg.entries[0].title).toBe('Event 100');
  });

  it('epoch 越界返回默认名称', () => {
    hg.recordMilestone(0, 99, 'test', 'desc');
    expect(hg.entries[0].epochName).toBe('纪元99');
  });

  it('toJSON 与 fromJSON 序列化往返', () => {
    hg.recordMilestone(10, 0, '测试', '描述', [], ['罗辑']);
    hg.incTurn();
    hg.incTurn();
    const json = hg.toJSON();
    const restored = HistoryGenerator.fromJSON(json);
    expect(restored.entries.length).toBe(1);
    expect(restored.entries[0].title).toBe('测试');
    expect(restored['turnCounter']).toBe(2);
  });

  it('reset 重置所有状态', () => {
    hg.recordMilestone(0, 0, 'test', 'desc');
    hg.incTurn();
    hg.reset();
    expect(hg.entries.length).toBe(0);
    expect(hg['turnCounter']).toBe(0);
  });

  it('fromJSON 空数据返回空', () => {
    const restored = HistoryGenerator.fromJSON(null);
    expect(restored.entries.length).toBe(0);
  });
});