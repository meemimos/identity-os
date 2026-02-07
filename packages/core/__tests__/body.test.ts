import { describe, it, expect } from 'vitest';
import { Body, BodyType } from '../src/body.js';
import { pennyBody } from '../examples/penny.js';

const NOW = '2026-02-07T12:00:00.000Z';

describe('BodyType', () => {
  it('accepts all valid types', () => {
    for (const t of ['nft', 'rpm', 'pfp', 'generic'] as const) {
      expect(BodyType.parse(t)).toBe(t);
    }
  });

  it('rejects unknown type', () => {
    expect(() => BodyType.parse('hologram')).toThrow();
  });
});

describe('Body', () => {
  it('validates Penny example', () => {
    expect(Body.parse(pennyBody)).toEqual(pennyBody);
  });

  it('applies defaults for uri and metadata', () => {
    const minimal = Body.parse({
      id: 'a0000000-0000-0000-0000-000000000001',
      type: 'generic',
      label: 'Default body',
      created_at: NOW,
    });
    expect(minimal.uri).toBeNull();
    expect(minimal.metadata).toEqual({});
  });

  it('rejects empty label', () => {
    expect(() =>
      Body.parse({
        id: 'a0000000-0000-0000-0000-000000000001',
        type: 'pfp',
        label: '',
        created_at: NOW,
      }),
    ).toThrow();
  });

  it('rejects label over 100 chars', () => {
    expect(() =>
      Body.parse({
        id: 'a0000000-0000-0000-0000-000000000001',
        type: 'pfp',
        label: 'x'.repeat(101),
        created_at: NOW,
      }),
    ).toThrow();
  });
});
