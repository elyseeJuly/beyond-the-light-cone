/**
 * AtmosphereEngine - 氛围引擎 (UEE Layer 6-8)
 *
 * 基于世界状态自动判定游戏氛围，驱动 UI 滤镜/色调/噪点效果。
 * 6 种氛围状态通过 CSS 变量和 Canvas 覆盖层实现视觉反馈。
 */

import { GameInstance } from "./Game";

export type AtmosphereState =
  | 'NORMAL'        // 正常
  | 'TENSE'         // 紧张
  | 'CRITICAL'      // 危急
  | 'DARK'          // 黑暗
  | 'HOPEFUL'       // 希望
  | 'TRANSCENDENT'; // 超越

export interface AtmosphereConfig {
  state: AtmosphereState;
  backgroundColor: string;
  uiTint: string;
  noiseLevel: number;
  scanlineOpacity: number;
  vignetteIntensity: number;
  textGlowColor: string;
  transitionMs: number;
  label: string;
  description: string;
}

export class AtmosphereEngine {
  public currentState: AtmosphereState = 'NORMAL';

  private readonly configMap: Record<AtmosphereState, AtmosphereConfig> = {
    NORMAL: {
      state: 'NORMAL',
      backgroundColor: '#0a0a1a',
      uiTint: 'rgba(0, 229, 255, 0.05)',
      noiseLevel: 0.02,
      scanlineOpacity: 0.03,
      vignetteIntensity: 0.1,
      textGlowColor: 'rgba(0, 229, 255, 0.3)',
      transitionMs: 2000,
      label: '正常',
      description: '人类文明处于相对稳定状态',
    },
    TENSE: {
      state: 'TENSE',
      backgroundColor: '#1a0a0a',
      uiTint: 'rgba(255, 87, 34, 0.08)',
      noiseLevel: 0.05,
      scanlineOpacity: 0.05,
      vignetteIntensity: 0.2,
      textGlowColor: 'rgba(255, 87, 34, 0.4)',
      transitionMs: 1500,
      label: '紧张',
      description: '局势紧张，危机若隐若现',
    },
    CRITICAL: {
      state: 'CRITICAL',
      backgroundColor: '#1a0000',
      uiTint: 'rgba(255, 0, 0, 0.12)',
      noiseLevel: 0.10,
      scanlineOpacity: 0.08,
      vignetteIntensity: 0.35,
      textGlowColor: 'rgba(255, 0, 0, 0.5)',
      transitionMs: 1000,
      label: '危急',
      description: '人类文明濒临崩溃边缘',
    },
    DARK: {
      state: 'DARK',
      backgroundColor: '#000010',
      uiTint: 'rgba(0, 0, 0, 0.5)',
      noiseLevel: 0.15,
      scanlineOpacity: 0.12,
      vignetteIntensity: 0.5,
      textGlowColor: 'rgba(0, 0, 0, 0)',
      transitionMs: 3000,
      label: '黑暗',
      description: '黑暗森林打击逼近，绝望弥漫',
    },
    HOPEFUL: {
      state: 'HOPEFUL',
      backgroundColor: '#0a1a2a',
      uiTint: 'rgba(0, 200, 255, 0.10)',
      noiseLevel: 0.01,
      scanlineOpacity: 0.02,
      vignetteIntensity: 0.05,
      textGlowColor: 'rgba(0, 200, 255, 0.5)',
      transitionMs: 2000,
      label: '希望',
      description: '科技突破带来新的希望',
    },
    TRANSCENDENT: {
      state: 'TRANSCENDENT',
      backgroundColor: '#0a0a2a',
      uiTint: 'rgba(100, 0, 255, 0.15)',
      noiseLevel: 0.03,
      scanlineOpacity: 0.04,
      vignetteIntensity: 0.15,
      textGlowColor: 'rgba(100, 0, 255, 0.5)',
      transitionMs: 4000,
      label: '超越',
      description: '人类文明进入全新的维度',
    },
  };

  /** 根据世界状态自动判定氛围 */
  evaluate(tagManager: any, earthCivi: any): AtmosphereState {
    const tags = tagManager.worldTags;
    const e = earthCivi;

    // 优先级从高到低
    if (tags.has('digital_religion') && tags.get('digital_religion')!.intensity > 80) return 'TRANSCENDENT';
    if (tags.has('foil_imminent') && tags.get('foil_imminent')!.intensity > 50) return 'DARK';
    if (e.population < 10 || e.economy < 20) return 'CRITICAL';
    if (tags.has('civil_unrest') && tags.get('civil_unrest')!.intensity > 60) return 'TENSE';
    if (tags.has('tech_boom') || tags.has('space_force_built')) return 'HOPEFUL';
    return 'NORMAL';
  }

  /** 尝试切换氛围（有变化才切换） */
  transitionTo(newState: AtmosphereState): boolean {
    if (this.currentState === newState) return false;
    this.currentState = newState;

    try {
      GameInstance.get().eventBus.emitLegacy('game:atmosphere:changed', {
        state: newState, config: this.getConfig()
      });
    } catch { /* ignore */ }

    return true;
  }

  /** 获取当前氛围配置 */
  getConfig(): AtmosphereConfig {
    return this.configMap[this.currentState];
  }

  /** 获取指定状态的配置 */
  getConfigForState(state: AtmosphereState): AtmosphereConfig {
    return this.configMap[state];
  }

  /** 序列化 */
  toJSON(): object {
    return { currentState: this.currentState };
  }

  static fromJSON(data: any): AtmosphereEngine {
    const ae = new AtmosphereEngine();
    if (data?.currentState) {
      ae.currentState = data.currentState;
    }
    return ae;
  }
}