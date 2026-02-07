import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase } from '../src/db.js';
import { IdentityRepo } from '../src/repositories/identity.repo.js';
import { ArtifactRepo } from '../src/repositories/artifact.repo.js';
import type { Identity, Artifact } from '@identity-os/core';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = (n: number) =>
  `a0000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

function makeIdentity(): Identity {
  return {
    identity_os_version: '0.1.0',
    schema_version: '0.1.0',
    id: UID(1),
    name: 'Penny',
    status: 'active',
    version: 0,
    latest_snapshot_id: null,
    soul: {
      traits: [],
      voice: { tone: 'warm', register: 'casual', quirks: [], boundaries: [] },
      constitution: [],
      vibe: '',
    },
    created_at: NOW,
    updated_at: NOW,
  };
}

function makeArtifact(n: number, overrides: Partial<Artifact> = {}): Artifact {
  return {
    id: UID(50 + n),
    identity_id: UID(1),
    tick_id: UID(100),
    type: 'caption',
    title: null,
    content: `Artifact content #${n}`,
    platform: 'instagram',
    status: 'draft',
    metadata: {},
    created_at: `2026-02-07T${String(11 + n).padStart(2, '0')}:00:00.000Z`,
    published_at: null,
    ...overrides,
  };
}

describe('ArtifactRepo', () => {
  let db: Database.Database;
  let repo: ArtifactRepo;

  beforeEach(() => {
    db = createDatabase();
    new IdentityRepo(db).create(makeIdentity());
    repo = new ArtifactRepo(db);
  });

  // ── Create ────────────────────────────────────────────────────

  it('creates and retrieves an artifact', () => {
    const stored = repo.create(makeArtifact(1));
    expect(stored.id).toBe(UID(51));
    expect(stored.type).toBe('caption');
    expect(stored.content).toContain('#1');
    expect(stored.content_uri).toBeNull();
    expect(stored.status).toBe('draft');
  });

  it('creates artifact with S3 content_uri', () => {
    const stored = repo.create(makeArtifact(1), 's3://bucket/artifacts/abc.txt');
    expect(stored.content_uri).toBe('s3://bucket/artifacts/abc.txt');
  });

  it('creates script artifact with metadata', () => {
    const stored = repo.create(
      makeArtifact(1, {
        type: 'script',
        title: 'Morning routine reel',
        metadata: { format: 'reel', duration_sec: 30 },
      }),
    );
    expect(stored.type).toBe('script');
    expect(stored.title).toBe('Morning routine reel');
    expect(stored.metadata).toEqual({ format: 'reel', duration_sec: 30 });
  });

  it('creates shotlist artifact', () => {
    const stored = repo.create(
      makeArtifact(1, {
        type: 'shotlist',
        content: '1. Wide desk shot\n2. Keyboard close-up',
      }),
    );
    expect(stored.type).toBe('shotlist');
    expect(stored.content).toContain('Wide desk shot');
  });

  // ── Read ──────────────────────────────────────────────────────

  it('findById returns null for missing artifact', () => {
    expect(repo.findById(UID(99))).toBeNull();
  });

  it('listByIdentity returns artifacts sorted by created_at desc', () => {
    repo.create(makeArtifact(1));
    repo.create(makeArtifact(2));
    repo.create(makeArtifact(3));
    const all = repo.listByIdentity(UID(1));
    expect(all).toHaveLength(3);
    expect(all[0].content).toContain('#3'); // most recent first
  });

  it('listByIdentity filters by type', () => {
    repo.create(makeArtifact(1, { type: 'caption' }));
    repo.create(makeArtifact(2, { type: 'script' }));
    repo.create(makeArtifact(3, { type: 'caption' }));
    const captions = repo.listByIdentity(UID(1), { type: 'caption' });
    expect(captions).toHaveLength(2);
  });

  it('listByIdentity filters by status', () => {
    repo.create(makeArtifact(1, { status: 'draft' }));
    repo.create(makeArtifact(2, { status: 'published' }));
    const drafts = repo.listByIdentity(UID(1), { status: 'draft' });
    expect(drafts).toHaveLength(1);
  });

  it('listByIdentity respects limit', () => {
    repo.create(makeArtifact(1));
    repo.create(makeArtifact(2));
    repo.create(makeArtifact(3));
    const limited = repo.listByIdentity(UID(1), { limit: 2 });
    expect(limited).toHaveLength(2);
  });

  // ── Update status ─────────────────────────────────────────────

  it('updates status to published with timestamp', () => {
    repo.create(makeArtifact(1));
    const pubAt = '2026-02-07T15:00:00.000Z';
    repo.updateStatus(UID(51), 'published', pubAt);
    const found = repo.findById(UID(51))!;
    expect(found.status).toBe('published');
    expect(found.published_at).toBe(pubAt);
  });

  it('throws on updating missing artifact', () => {
    expect(() => repo.updateStatus(UID(99), 'published')).toThrow(/not found/);
  });

  // ── Delete ────────────────────────────────────────────────────

  it('deletes an artifact', () => {
    repo.create(makeArtifact(1));
    expect(repo.delete(UID(51))).toBe(true);
    expect(repo.findById(UID(51))).toBeNull();
  });

  it('delete returns false for missing artifact', () => {
    expect(repo.delete(UID(99))).toBe(false);
  });

  // ── Metadata round-trip ───────────────────────────────────────

  it('round-trips complex metadata through JSON', () => {
    const stored = repo.create(
      makeArtifact(1, {
        metadata: {
          mood: 'inspired',
          intent_ref: UID(30),
          tags: ['golden-hour', 'tech'],
        },
      }),
    );
    expect(stored.metadata).toEqual({
      mood: 'inspired',
      intent_ref: UID(30),
      tags: ['golden-hour', 'tech'],
    });
  });
});
