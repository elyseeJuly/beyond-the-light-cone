import { VictoryType, DefeatType } from "../types/enums";

export interface GameStatistics {
  playTimeSeconds: number;
  endings: {
    [key: string]: number; // e.g., 'victory_0': 1, 'defeat_1': 2
  };
  eventsTriggered: {
    [eventId: string]: number;
  };
  techUnlocked: {
    [techId: string]: number;
  };
  lastUploadTimestamp: number;
}

export class StatisticsManager {
  private static readonly STORAGE_KEY = 'LegendOfUni_Statistics';
  private static stats: GameStatistics | null = null;
  private static sessionStartTime: number = Date.now();
  private static isUploading: boolean = false;

  // The telemetry endpoint for data collection. Currently empty.
  // Configure this to point to your backend/serverless function (e.g., Vercel Analytics, PostHog, or custom).
  private static TELEMETRY_ENDPOINT = '';

  public static init(): void {
    this.loadStats();
    this.sessionStartTime = Date.now();

    // Auto-save stats periodically (e.g., every 60 seconds)
    setInterval(() => {
      this.accumulatePlaytime();
      this.saveStats();
    }, 60000);

    // Attempt upload on boot if online
    if (navigator.onLine) {
      setTimeout(() => this.uploadStats(), 5000); // 5s delay to not block boot
    }
    
    // Attempt upload when returning online
    window.addEventListener('online', () => {
      this.uploadStats();
    });

    // Save on beforeunload
    window.addEventListener('beforeunload', () => {
      this.accumulatePlaytime();
      this.saveStats();
    });
  }

  private static loadStats(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.stats = JSON.parse(data);
      }
    } catch (e) {
      console.warn("Failed to load statistics:", e);
    }

    if (!this.stats) {
      this.stats = {
        playTimeSeconds: 0,
        endings: {},
        eventsTriggered: {},
        techUnlocked: {},
        lastUploadTimestamp: 0
      };
    }
  }

  private static saveStats(): void {
    if (this.stats) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats));
    }
  }

  private static accumulatePlaytime(): void {
    if (this.stats) {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - this.sessionStartTime) / 1000);
      if (deltaSeconds > 0) {
        this.stats.playTimeSeconds += deltaSeconds;
        this.sessionStartTime = now;
      }
    }
  }

  public static recordEnding(victoryType: VictoryType | null, defeatType: DefeatType | null): void {
    if (!this.stats) this.loadStats();
    
    const key = victoryType !== null ? `victory_${victoryType}` : (defeatType !== null ? `defeat_${defeatType}` : 'unknown');
    this.stats!.endings[key] = (this.stats!.endings[key] || 0) + 1;
    this.saveStats();
    this.uploadStats(); // Trigger upload on major milestones
  }

  public static recordEventTrigger(eventId: string): void {
    if (!this.stats) this.loadStats();
    this.stats!.eventsTriggered[eventId] = (this.stats!.eventsTriggered[eventId] || 0) + 1;
    // We don't save synchronously here to avoid I/O spam; it will be saved via interval/beforeunload
  }

  public static recordTechUnlock(techId: string): void {
    if (!this.stats) this.loadStats();
    this.stats!.techUnlocked[techId] = (this.stats!.techUnlocked[techId] || 0) + 1;
  }

  public static getStats(): GameStatistics {
    if (!this.stats) this.loadStats();
    this.accumulatePlaytime();
    return this.stats!;
  }

  /**
   * Automatically upload statistics to telemetry endpoint if configured.
   */
  public static async uploadStats(): Promise<void> {
    if (!this.TELEMETRY_ENDPOINT || this.isUploading || !this.stats) return;

    // Only upload if it has been at least 1 hour since the last upload, to prevent spam.
    // Or if we have new un-uploaded ending data (which can be tracked separately, but simplified here).
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - this.stats.lastUploadTimestamp < ONE_HOUR) return;

    try {
      this.isUploading = true;
      
      this.accumulatePlaytime();
      this.saveStats();

      const response = await fetch(this.TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: 'beyond-the-light-cone',
          version: '0.9.0-beta',
          stats: this.stats,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        this.stats.lastUploadTimestamp = Date.now();
        this.saveStats();
        console.log("Telemetry uploaded successfully.");
      }
    } catch (e) {
      console.warn("Failed to upload telemetry data:", e);
    } finally {
      this.isUploading = false;
    }
  }
}
