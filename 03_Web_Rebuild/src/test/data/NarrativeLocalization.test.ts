import { describe, expect, it } from 'vitest';
import randomEvents from '../../data/randomevents.json';
import { englishNarratives, localizeNarrative } from '../../data/locales/narrative.en';
import type { GameEventPayload } from '../../types/narrative';

const hanCharacters = /[\u3400-\u9fff]/;

describe('English narrative localization', () => {
  const sourceById = new Map(randomEvents.map((event) => [event.id, event]));

  it('covers every random narrative event exactly once', () => {
    expect(Object.keys(englishNarratives).sort()).toEqual(
      randomEvents.map((event) => event.id).sort(),
    );
  });

  it('keeps every translated event structurally aligned with its source event', () => {
    for (const [eventId, translation] of Object.entries(englishNarratives)) {
      const source = sourceById.get(eventId);

      expect(source, `${eventId} must exist in randomevents.json`).toBeDefined();
      expect(translation.title).not.toMatch(hanCharacters);
      expect(translation.title).toMatch(/[A-Za-z]/);
      expect(translation.dialogue).toHaveLength(source!.dialogQueue.length);
      expect(translation.choices ?? []).toHaveLength(source!.choices?.length ?? 0);

      for (const line of translation.dialogue) {
        expect(line.content).not.toMatch(hanCharacters);
        expect(line.content).toMatch(/[A-Za-z]{3}/);
      }

      for (const choice of translation.choices ?? []) {
        expect(choice).not.toMatch(hanCharacters);
        expect(choice).toMatch(/[A-Za-z]{3}/);
      }
    }
  });

  it('uses the independent English prose only when English is selected', () => {
    const source = sourceById.get('tech_vacuum_decay_incident') as unknown as GameEventPayload;
    const english = localizeNarrative(source, 'en');

    expect(english.title).toBe('Maximum Alert: Vacuum-Decay Bubble');
    expect(english.dialogQueue[0].content).toContain('fourteen orders of magnitude');
    expect(english.choices?.[0].label).toContain('Evacuate at once');
    expect(localizeNarrative(source, 'zh')).toBe(source);
  });
});
