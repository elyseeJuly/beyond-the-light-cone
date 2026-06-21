/**
 * AudioManager - 独立音频管理器
 *
 * 职责：
 * - 管理背景音乐（BGM）播放
 * - 基于事件的音效触发（Web Audio API 振荡器合成）
 * - 音量控制与静音切换
 * - 无需外部音频文件
 *
 * 从 BgmPlayer.tsx 提取的业务逻辑层，与 React 组件解耦。
 */

export type AudioChannel = 'bgm' | 'sfx' | 'alarm' | 'ambient';

export interface AudioState {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
  currentBgm: string | null;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private bgmEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private bgmVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private currentBgm: string | null = null;
  private isInitialized: boolean = false;

  /** 初始化音频上下文（需要用户交互触发） */
  init(): void {
    if (this.isInitialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.audioContext.destination);

      this.bgmGain = this.audioContext.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioManager: Web Audio API not available:', e);
    }
  }

  /** 播放警报音效 (sawtooth) */
  playAlarm(): void {
    if (!this.isInitialized || !this.sfxEnabled || !this.audioContext || !this.sfxGain) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  /** 播放里程碑音效 (sine chord) */
  playMilestone(): void {
    if (!this.isInitialized || !this.sfxEnabled || !this.audioContext || !this.sfxGain) return;

    const now = this.audioContext.currentTime;
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

    frequencies.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 1.0);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 1.0);
    });
  }

  /** 播放错误/负面事件音效 */
  playDissonance(): void {
    if (!this.isInitialized || !this.sfxEnabled || !this.audioContext || !this.sfxGain) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.setValueAtTime(150, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  /** 播放点击/确认音效 */
  playClick(): void {
    if (!this.isInitialized || !this.sfxEnabled || !this.audioContext || !this.sfxGain) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();

    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // ===== 音量控制 =====

  /** 渐出所有音频通道 */
  async fadeOutAll(durationMs: number = 2000): Promise<void> {
    if (!this.isInitialized || !this.audioContext || !this.bgmGain || !this.sfxGain) return;
    const now = this.audioContext.currentTime;
    const fadeTime = durationMs / 1000;
    
    this.bgmGain.gain.cancelScheduledValues(now);
    this.sfxGain.gain.cancelScheduledValues(now);
    
    this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
    this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, now);
    
    this.bgmGain.gain.linearRampToValueAtTime(0, now + fadeTime);
    this.sfxGain.gain.linearRampToValueAtTime(0, now + fadeTime);
    
    return new Promise(resolve => setTimeout(resolve, durationMs));
  }

  /** 恢复音频通道音量 */
  restoreVolumes(): void {
    if (!this.isInitialized || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    if (this.bgmGain) {
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.setValueAtTime(this.bgmEnabled ? this.bgmVolume : 0, now);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0, now);
    }
  }

  setBgmVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmGain) this.bgmGain.gain.value = this.bgmVolume;
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  toggleBgm(): boolean {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmGain) this.bgmGain.gain.value = this.bgmEnabled ? this.bgmVolume : 0;
    return this.bgmEnabled;
  }

  toggleSfx(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  getState(): AudioState {
    return {
      bgmEnabled: this.bgmEnabled,
      sfxEnabled: this.sfxEnabled,
      bgmVolume: this.bgmVolume,
      sfxVolume: this.sfxVolume,
      currentBgm: this.currentBgm,
    };
  }

  /** 获取音频上下文（供 BgmPlayer 等组件使用） */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  getBgmGain(): GainNode | null {
    return this.bgmGain;
  }

  /** 销毁音频上下文 */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}