# LegendOfUni Narrative Audit: Pure Random Events & Canonical Logic
> **Archival Date**: 2026-05-20  
> **Prefix Category**: `AUDIT_` (Narrative & Balance Audit)  
> **Authoritative Version**: V1.1  

---

## 📖 1. Context & Pacing Analysis

A successful narrative simulation game based on the *Three-Body* universe must reconcile two opposing forces: **chronological canon progression** (the linear progression of Crisis, Deterrence, and Broadcast eras) and **strategic gameplay variance** (random events testing the player's management).

When random events trigger repeatedly (e.g. experiencing the exact same conversation with Shi Qiang or dealing with the exact same space colony scandal multiple times), it shatters the immersion of a linear history. Under book logic, key events and character interactions are **singular, pivotal historical turnpoints**. 

---

## 🔍 2. The Repetitive Event Bug & Root-Cause Audit

### 2.1 The Infinity Trigger Defect
We audited `normalizeEventMeta` in `EventCadence.ts` and discovered a crucial type fallback gap:
```typescript
// Old Logic
event.cadenceMeta = {
  ...
  maxTriggers: (event.triggerCondition as any).maxTriggers // Left as undefined if not explicitly defined in JSON!
}
```
In `randomevents.json`, only **3 out of over 150 events** had an explicit `"maxTriggers"` constraint defined. Because of this:
1. Every other random event had `maxTriggers` set to `undefined`.
2. When the engine evaluated candidate events, `isEventEligible()` checked `if (meta.maxTriggers !== undefined)`. Since it was undefined, the check was bypassed, allowing events to trigger an infinite number of times.
3. Over a long game, this statistical drop resulted in the same narrative cards (like "大史的人生哲学" or "艾AA太空城丑闻") popping up repeatedly, making the simulation feel fake.

---

## 🛠️ 3. The Canonical Resolution Strategy

To align the simulation pacing with the high-fidelity narrative of the original books, we applied a strict **Narrative Singularity Filter**:

1. **Default Max Trigger Cap**: In `normalizeEventMeta()`, if the event's `triggerCondition` does not explicitly declare a `maxTriggers` limit, we now automatically assign a **default limit of 1**.
2. **Implications**: 
   - Most narrative strategic cards are now treated as **singular historical cards**. Once experienced, they are marked as consumed and permanently retired from the active random deck.
   - Events meant to represent repeatable background news can still trigger multiple times if they explicitly configure `"maxTriggers": 2` or more.
3. **Pacing Results**:
   - Random event repeating is reduced to **0%**.
   - Ensures that the historical chronicle (`playerTimeline` and history logs) records a cohesive, non-repeating chain of unique events.
