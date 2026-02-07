import { describe, it, expect } from 'vitest';
import { Identity, Soul, VoiceConfig, Trait, IdentityStatus } from '../src/identity.js';
import { IDENTITY_OS_VERSION, SCHEMA_VERSION } from '../src/common.js';
import { pennyIdentity } from '../examples/penny.js';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = 'a0000000-0000-0000-0000-000000000001';

describe('Trait', () => {
  it('accepts valid trait', () => {
    const t = Trait.parse({ id: 'warmth', label: 'Warmth', value: 0.85 });
    expect(t.id).toBe('warmth');
    expect(t.description).toBeUndefined();
  });

  it('rejects value > 1', () => {
    expect(() => Trait.parse({ id: 'x', label: 'X', value: 1.5 })).toThrow();
  });

  it('rejects value < 0', () => {
    expect(() => Trait.parse({ id: 'x', label: 'X', value: -0.1 })).toThrow();
  });
});

describe('VoiceConfig', () => {
  it('applies defaults', () => {
    const v = VoiceConfig.parse({ tone: 'warm' });
    expect(v.register).toBe('casual');
    expect(v.quirks).toEqual([]);
    expect(v.boundaries).toEqual([]);
  });
});

describe('Soul', () => {
  it('applies defaults for all arrays', () => {
    const s = Soul.parse({ voice: { tone: 'sharp' } });
    expect(s.traits).toEqual([]);
    expect(s.constitution).toEqual([]);
    expect(s.vibe).toBe('');
  });
});

describe('IdentityStatus', () => {
  it('accepts all valid statuses', () => {
    for (const s of ['active', 'paused', 'archived'] as const) {
      expect(IdentityStatus.parse(s)).toBe(s);
    }
  });
});

describe('Identity', () => {
  it('validates Penny example', () => {
    const result = Identity.parse(pennyIdentity);
    expect(result.name).toBe('Penny Larson');
    expect(result.soul.traits).toHaveLength(4);
    expect(result.identity_os_version).toBe(IDENTITY_OS_VERSION);
  });

  it('applies defaults for status, version, latest_snapshot_id', () => {
    const minimal = Identity.parse({
      identity_os_version: IDENTITY_OS_VERSION,
      schema_version: SCHEMA_VERSION,
      id: UID,
      name: 'Test',
      soul: { voice: { tone: 'neutral' } },
      created_at: NOW,
      updated_at: NOW,
    });
    expect(minimal.status).toBe('active');
    expect(minimal.version).toBe(0);
    expect(minimal.latest_snapshot_id).toBeNull();
  });

  it('rejects missing name', () => {
    expect(() =>
      Identity.parse({
        identity_os_version: IDENTITY_OS_VERSION,
        schema_version: SCHEMA_VERSION,
        id: UID,
        soul: { voice: { tone: 'neutral' } },
        created_at: NOW,
        updated_at: NOW,
      }),
    ).toThrow();
  });

  it('rejects name over 200 chars', () => {
    expect(() =>
      Identity.parse({
        identity_os_version: IDENTITY_OS_VERSION,
        schema_version: SCHEMA_VERSION,
        id: UID,
        name: 'x'.repeat(201),
        soul: { voice: { tone: 'neutral' } },
        created_at: NOW,
        updated_at: NOW,
      }),
    ).toThrow();
  });
});
