import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../../core/Game';
import { getLanguage, setLanguage, t } from '../../utils/i18n';

describe('Appendix B Improvements tests', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  // Task 9: i18n Translation Architecture
  describe('i18n Architecture', () => {
    it('should support switching languages', () => {
      setLanguage('zh');
      expect(getLanguage()).toBe('zh');
      expect(t('game_title')).toBe('光锥之外：纪元往事');
      expect(t('next_turn')).toBe('下一回合');

      setLanguage('en');
      expect(getLanguage()).toBe('en');
      expect(t('game_title')).toBe('Beyond the Light Cone: Epoch Chronicles');
      expect(t('next_turn')).toBe('Next Turn');
    });

    it('should support placeholder substitution', () => {
      setLanguage('zh');
      expect(t('wait_turns', { turns: 5 })).toBe('需等待 5 回合');

      setLanguage('en');
      expect(t('wait_turns', { turns: 5 })).toBe('Wait 5 turns');
    });
  });

  // Task 6: Event Diversity Stats
  describe('Event Diversity Stats', () => {
    it('should calculate unique event triggering statistics correctly', () => {
      const stats = game.eventManager.getEventDiversityStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.storyTotal).toBe(game.eventManager.events.length);
      expect(stats.randomTotal).toBe(game.eventManager.randomEvents.length);
      expect(stats.filteredTotal).toBe(game.eventManager.filteredEvents.length);
      expect(stats.triggered).toBe(0);
      expect(stats.percentage).toBe(0);

      // Simulate triggering some events
      if (game.eventManager.events.length > 0) {
        game.eventManager.events[0].hasTriggered = true;
      }
      game.eventManager.randomEventTriggerCounts.set('random_test_event', 1);
      game.eventManager.triggeredFilteredIds.add('filtered_test_event');

      const stats2 = game.eventManager.getEventDiversityStats();
      expect(stats2.triggered).toBe(3);
      expect(stats2.percentage).toBe(Math.round((3 / stats.total) * 100));
    });
  });

  // Task 7: Memory & Archive Size Pruning
  describe('Archive Pruning', () => {
    it('should prune history entries correctly under specified limit', () => {
      const hg = game.historyGenerator;
      hg.reset();

      // Add 600 entries
      for (let i = 0; i < 600; i++) {
        hg.recordEvent(2000 + i, 0, `Title ${i}`, `Description ${i}`);
      }
      expect(hg.entries.length).toBe(600);

      // Prune down to 500
      hg.prune(500);
      expect(hg.entries.length).toBe(500);
      // Verify that the oldest entries (e.g. Title 0 to 99) were sliced off, and the latest (Title 100 to 599) remain
      expect(hg.entries[0].title).toBe('Title 100');
      expect(hg.entries[499].title).toBe('Title 599');
    });
  });
});
