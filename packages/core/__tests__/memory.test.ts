import { describe, it, expect } from 'vitest';
import {
  ActiveIntent,
  NextAction,
  Continuity,
  EpisodicEntry,
  SemanticEntry,
  MemoryState,
} from '../src/memory.js';
import { pennyMemory } from '../examples/penny.js';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = 'a0000000-0000-0000-0000-000000000001';

describe('ActiveIntent', () => {
  it('applies defaults', () => {
    const intent = ActiveIntent.parse({
      id: UID,
      label: 'Test intent',
      created_at: NOW,
      updated_at: NOW,
    });
    expect(intent.priority).toBe('medium');
    expect(intent.status).toBe('active');
    expect(intent.description).toBe('');
  });

  it('rejects empty label', () => {
    expect(() =>
      ActiveIntent.parse({ id: UID, label: '', created_at: NOW, updated_at: NOW }),
    ).toThrow();
  });
});

describe('NextAction', () => {
  it('applies defaults', () => {
    const action = NextAction.parse({
      id: UID,
      action: 'Do something',
      created_at: NOW,
    });
    expect(action.intent_id).toBeNull();
    expect(action.skill_id).toBeNull();
    expect(action.earliest_at).toBeNull();
  });
});

describe('Continuity', () => {
  it('builds a fresh continuity state', () => {
    const fresh = Continuity.parse({});
    expect(fresh.last_tick_id).toBeNull();
    expect(fresh.tick_count).toBe(0);
    expect(fresh.running_summary).toBeNull();
  });

  it('accepts populated continuity', () => {
    const populated = Continuity.parse({
      last_tick_id: UID,
      last_tick_at: NOW,
      tick_count: 42,
      last_mood: 'content',
      running_summary: 'Posted a caption, reflected on engagement metrics',
    });
    expect(populated.tick_count).toBe(42);
  });
});

describe('EpisodicEntry', () => {
  it('applies defaults', () => {
    const entry = EpisodicEntry.parse({
      id: UID,
      identity_id: UID,
      tick_id: UID,
      event_type: 'compose',
      summary: 'Drafted a caption',
      created_at: NOW,
    });
    expect(entry.significance).toBe(0.5);
    expect(entry.detail).toBeNull();
  });

  it('rejects significance > 1', () => {
    expect(() =>
      EpisodicEntry.parse({
        id: UID,
        identity_id: UID,
        tick_id: UID,
        event_type: 'compose',
        summary: 'x',
        significance: 2.0,
        created_at: NOW,
      }),
    ).toThrow();
  });
});

describe('SemanticEntry', () => {
  it('accepts valid entry', () => {
    const entry = SemanticEntry.parse({
      id: UID,
      identity_id: UID,
      category: 'preference',
      key: 'favorite_time',
      value: 'golden hour',
      updated_at: NOW,
    });
    expect(entry.confidence).toBe(0.5);
    expect(entry.source_tick_id).toBeNull();
  });

  it('rejects unknown category', () => {
    expect(() =>
      SemanticEntry.parse({
        id: UID,
        identity_id: UID,
        category: 'vibes',
        key: 'x',
        value: 'y',
        updated_at: NOW,
      }),
    ).toThrow();
  });
});

describe('MemoryState', () => {
  it('validates Penny example', () => {
    const result = MemoryState.parse(pennyMemory);
    expect(result.active_intents).toHaveLength(1);
    expect(result.next_actions).toHaveLength(1);
    expect(result.continuity.tick_count).toBe(0);
  });

  it('builds empty memory state', () => {
    const empty = MemoryState.parse({
      continuity: {},
    });
    expect(empty.active_intents).toEqual([]);
    expect(empty.next_actions).toEqual([]);
    expect(empty.continuity.tick_count).toBe(0);
  });
});
