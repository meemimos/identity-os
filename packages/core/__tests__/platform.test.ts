import { describe, it, expect } from 'vitest';
import { PlatformProfile, PlatformType, Aesthetic, PostingRules } from '../src/platform.js';
import { pennyInstagram } from '../examples/penny.js';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = 'a0000000-0000-0000-0000-000000000001';

describe('PlatformType', () => {
  it('accepts all valid platforms', () => {
    for (const p of ['generic', 'instagram', 'twitter', 'tiktok', 'telegram'] as const) {
      expect(PlatformType.parse(p)).toBe(p);
    }
  });

  it('rejects unknown platform', () => {
    expect(() => PlatformType.parse('myspace')).toThrow();
  });
});

describe('Aesthetic', () => {
  it('applies defaults', () => {
    const a = Aesthetic.parse({});
    expect(a.color_palette).toEqual([]);
    expect(a.font_vibe).toBe('');
    expect(a.visual_style).toBe('');
  });
});

describe('PostingRules', () => {
  it('applies defaults', () => {
    const r = PostingRules.parse({});
    expect(r.min_interval_sec).toBe(3600);
    expect(r.max_interval_sec).toBe(86400);
    expect(r.content_boundaries).toEqual([]);
    expect(r.preferred_formats).toEqual([]);
  });
});

describe('PlatformProfile', () => {
  it('validates Penny Instagram example', () => {
    const result = PlatformProfile.parse(pennyInstagram);
    expect(result.display_name).toBe('Penny Larson');
    expect(result.handle).toBe('@pennylarsonxo');
    expect(result.aesthetic!.color_palette).toHaveLength(3);
  });

  it('applies defaults for optional fields', () => {
    const minimal = PlatformProfile.parse({
      id: UID,
      identity_id: UID,
      platform: 'generic',
      display_name: 'Test Character',
      posting_rules: {},
      created_at: NOW,
    });
    expect(minimal.handle).toBeNull();
    expect(minimal.bio).toBeNull();
    expect(minimal.aesthetic).toBeNull();
    expect(minimal.voice_overrides).toBeNull();
    expect(minimal.body_id).toBeNull();
  });

  it('accepts partial voice overrides', () => {
    const result = PlatformProfile.parse({
      id: UID,
      identity_id: UID,
      platform: 'instagram',
      display_name: 'Test',
      voice_overrides: { tone: 'playful' },
      posting_rules: {},
      created_at: NOW,
    });
    expect(result.voice_overrides!.tone).toBe('playful');
    expect(result.voice_overrides!.register).toBeUndefined();
  });

  it('rejects empty display_name', () => {
    expect(() =>
      PlatformProfile.parse({
        id: UID,
        identity_id: UID,
        platform: 'generic',
        display_name: '',
        posting_rules: {},
        created_at: NOW,
      }),
    ).toThrow();
  });
});
