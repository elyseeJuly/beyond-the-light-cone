import { describe, it, expect, beforeEach } from 'vitest';
import { AtmosphereEngine, AtmosphereState } from '../../core/AtmosphereEngine';
import { TagManager } from '../../core/TagManager';

describe('AtmosphereEngine', () => {
  let ae: AtmosphereEngine;

  beforeEach(() => {
    ae = new AtmosphereEngine();
  });

  it('初始氛围为 NORMAL', () => {
    expect(ae.currentState).toBe('NORMAL');
  });

  it('getConfig 返回当前配置', () => {
    const config = ae.getConfig();
    expect(config.state).toBe('NORMAL');
    expect(config.backgroundColor).toBe('#0a0a1a');
    expect(config.label).toBe('正常');
    expect(typeof config.noiseLevel).toBe('number');
    expect(typeof config.transitionMs).toBe('number');
  });

  it('evaluate 人口<10 返回 CRITICAL', () => {
    const tagManager = new TagManager();
    const earthCivi = { population: 5, economy: 100 };
    const state = ae.evaluate(tagManager, earthCivi);
    expect(state).toBe('CRITICAL');
  });

  it('evaluate 经济<20 返回 CRITICAL', () => {
    const tagManager = new TagManager();
    const earthCivi = { population: 100, economy: 10 };
    const state = ae.evaluate(tagManager, earthCivi);
    expect(state).toBe('CRITICAL');
  });

  it('evaluate foil_imminent>50 返回 DARK', () => {
    const tagManager = new TagManager();
    tagManager.applyWorldTag('foil_imminent', 60, 'test', 0);
    const earthCivi = { population: 100, economy: 100 };
    const state = ae.evaluate(tagManager, earthCivi);
    expect(state).toBe('DARK');
  });

  it('evaluate civil_unrest>60 返回 TENSE', () => {
    const tagManager = new TagManager();
    tagManager.applyWorldTag('civil_unrest', 70, 'test', 0);
    const earthCivi = { population: 100, economy: 100 };
    const state = ae.evaluate(tagManager, earthCivi);
    expect(state).toBe('TENSE');
  });

  it('evaluate digital_religion>80 返回 TRANSCENDENT', () => {
    const tagManager = new TagManager();
    tagManager.setWorldTagIntensity('digital_religion', 90, 0, 'test');
    const earthCivi = { population: 100, economy: 100 };
    const state = ae.evaluate(tagManager, earthCivi);
    expect(state).toBe('TRANSCENDENT');
  });

  it('evaluate tech_boom 返回 HOPEFUL', () => {
    const tagManager = new TagManager();
    tagManager.applyWorldTag('tech_boom', 50, 'test', 0);
    const earthCivi = { population: 100, economy: 100 };
    const state = ae.evaluate(tagManager, earthCivi);
    expect(state).toBe('HOPEFUL');
  });

  it('evaluate 正常状态返回 NORMAL', () => {
    const tagManager = new TagManager();
    const earthCivi = { population: 100, economy: 100 };
    const state = ae.evaluate(tagManager, earthCivi);
    expect(state).toBe('NORMAL');
  });

  it('transitionTo 切换到不同状态返回 true', () => {
    const result = ae.transitionTo('TENSE');
    expect(result).toBe(true);
    expect(ae.currentState).toBe('TENSE');
  });

  it('transitionTo 切换相同状态返回 false', () => {
    const result = ae.transitionTo('NORMAL');
    expect(result).toBe(false);
  });

  it('getConfigForState 返回指定状态配置', () => {
    const config = ae.getConfigForState('CRITICAL');
    expect(config.label).toBe('危急');
    expect(config.backgroundColor).toBe('#1a0000');
  });

  for (const state of ['NORMAL', 'TENSE', 'CRITICAL', 'DARK', 'HOPEFUL', 'TRANSCENDENT'] as AtmosphereState[]) {
    it(`${state} 配置包含所有必要字段`, () => {
      const config = ae.getConfigForState(state);
      expect(config.state).toBe(state);
      expect(config.backgroundColor).toBeDefined();
      expect(config.uiTint).toBeDefined();
      expect(typeof config.noiseLevel).toBe('number');
      expect(typeof config.vignetteIntensity).toBe('number');
      expect(config.label).toBeDefined();
      expect(config.description).toBeDefined();
    });
  }

  it('toJSON 与 fromJSON 序列化往返', () => {
    ae.transitionTo('DARK');
    const json = ae.toJSON();
    const restored = AtmosphereEngine.fromJSON(json);
    expect(restored.currentState).toBe('DARK');
  });

  it('fromJSON 空数据保持默认', () => {
    const restored = AtmosphereEngine.fromJSON(null);
    expect(restored.currentState).toBe('NORMAL');
  });
});