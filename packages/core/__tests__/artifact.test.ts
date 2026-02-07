import { describe, it, expect } from 'vitest';
import { Artifact, ArtifactType, ArtifactStatus } from '../src/artifact.js';
import { pennyCaptionDraft } from '../examples/penny.js';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = 'a0000000-0000-0000-0000-000000000001';

describe('ArtifactType', () => {
  it('accepts all valid types', () => {
    for (const t of ['script', 'shotlist', 'caption', 'post', 'thought', 'image_prompt'] as const) {
      expect(ArtifactType.parse(t)).toBe(t);
    }
  });
});

describe('ArtifactStatus', () => {
  it('accepts all valid statuses', () => {
    for (const s of ['draft', 'approved', 'published', 'failed', 'archived'] as const) {
      expect(ArtifactStatus.parse(s)).toBe(s);
    }
  });
});

describe('Artifact', () => {
  it('validates Penny caption draft example', () => {
    const result = Artifact.parse(pennyCaptionDraft);
    expect(result.type).toBe('caption');
    expect(result.status).toBe('draft');
    expect(result.content).toContain('ship that feature');
  });

  it('applies defaults', () => {
    const minimal = Artifact.parse({
      id: UID,
      identity_id: UID,
      tick_id: UID,
      type: 'thought',
      content: 'Just vibing today.',
      created_at: NOW,
    });
    expect(minimal.title).toBeNull();
    expect(minimal.platform).toBeNull();
    expect(minimal.status).toBe('draft');
    expect(minimal.metadata).toEqual({});
    expect(minimal.published_at).toBeNull();
  });

  it('rejects empty content', () => {
    expect(() =>
      Artifact.parse({
        id: UID,
        identity_id: UID,
        tick_id: UID,
        type: 'post',
        content: '',
        created_at: NOW,
      }),
    ).toThrow();
  });

  it('accepts script artifact with metadata', () => {
    const script = Artifact.parse({
      id: UID,
      identity_id: UID,
      tick_id: UID,
      type: 'script',
      title: 'Morning routine reel',
      content: 'SCENE 1: Golden hour desk shot\nSCENE 2: Code on screen\nSCENE 3: Iced latte reveal',
      platform: 'instagram',
      metadata: { format: 'reel', duration_sec: 30 },
      created_at: NOW,
    });
    expect(script.type).toBe('script');
    expect(script.metadata).toHaveProperty('format', 'reel');
  });

  it('accepts shotlist artifact', () => {
    const shotlist = Artifact.parse({
      id: UID,
      identity_id: UID,
      tick_id: UID,
      type: 'shotlist',
      content: '1. Wide desk shot\n2. Close-up keyboard\n3. Screen with code',
      created_at: NOW,
    });
    expect(shotlist.type).toBe('shotlist');
  });
});
