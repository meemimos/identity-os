import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase } from '../src/db.js';
import { IdentityRepo } from '../src/repositories/identity.repo.js';
import type { Identity } from '@identity-os/core';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = (n: number) =>
  `a0000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

function makeIdentity(overrides: Partial<Identity> = {}): Identity {
  return {
    identity_os_version: '0.1.0',
    schema_version: '0.1.0',
    id: UID(1),
    name: 'Penny Larson',
    status: 'active',
    version: 0,
    latest_snapshot_id: null,
    soul: {
      traits: [{ id: 'warmth', label: 'Warmth', value: 0.85 }],
      voice: {
        tone: 'warm',
        register: 'casual',
        quirks: ['lowercase'],
        boundaries: [],
      },
      constitution: ['presence over performance'],
      vibe: 'calm & sharp',
    },
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

describe('IdentityRepo', () => {
  let db: Database.Database;
  let repo: IdentityRepo;

  beforeEach(() => {
    db = createDatabase();
    repo = new IdentityRepo(db);
  });

  // ── Create ────────────────────────────────────────────────────

  it('creates and retrieves an identity', () => {
    const stored = repo.create(makeIdentity(), 'mimos');
    expect(stored.id).toBe(UID(1));
    expect(stored.name).toBe('Penny Larson');
    expect(stored.owner).toBe('mimos');
    expect(stored.soul.traits).toHaveLength(1);
    expect(stored.soul.voice.tone).toBe('warm');
  });

  it('creates identity without owner', () => {
    const stored = repo.create(makeIdentity());
    expect(stored.owner).toBeNull();
  });

  // ── Read ──────────────────────────────────────────────────────

  it('findById returns null for missing identity', () => {
    expect(repo.findById(UID(99))).toBeNull();
  });

  it('list returns all identities ordered by created_at desc', () => {
    repo.create(makeIdentity({ id: UID(1), created_at: '2026-02-07T10:00:00.000Z' }));
    repo.create(makeIdentity({ id: UID(2), name: 'Other', created_at: '2026-02-07T11:00:00.000Z' }));
    const all = repo.list();
    expect(all).toHaveLength(2);
    expect(all[0].name).toBe('Other'); // most recent first
  });

  // ── Update status ─────────────────────────────────────────────

  it('updates status', () => {
    repo.create(makeIdentity());
    repo.updateStatus(UID(1), 'paused', NOW);
    const found = repo.findById(UID(1))!;
    expect(found.status).toBe('paused');
  });

  it('throws on updating missing identity', () => {
    expect(() => repo.updateStatus(UID(99), 'paused', NOW)).toThrow(
      /not found/,
    );
  });

  // ── Update latest snapshot ────────────────────────────────────

  it('updates latest snapshot pointer', () => {
    repo.create(makeIdentity());
    repo.updateLatestSnapshot(UID(1), UID(50), 3, NOW);
    const found = repo.findById(UID(1))!;
    expect(found.latest_snapshot_id).toBe(UID(50));
    expect(found.version).toBe(3);
  });

  // ── Delete ────────────────────────────────────────────────────

  it('deletes an identity', () => {
    repo.create(makeIdentity());
    expect(repo.delete(UID(1))).toBe(true);
    expect(repo.findById(UID(1))).toBeNull();
  });

  it('delete returns false for missing identity', () => {
    expect(repo.delete(UID(99))).toBe(false);
  });

  // ── Soul round-trip ───────────────────────────────────────────

  it('round-trips complex soul data through JSON', () => {
    const identity = makeIdentity({
      soul: {
        traits: [
          { id: 'warmth', label: 'Warmth', value: 0.85 },
          { id: 'tech', label: 'Technical Depth', value: 0.9 },
        ],
        voice: {
          tone: 'warm',
          register: 'mixed',
          quirks: ['lowercase', 'slang', 'emoji'],
          boundaries: ['no corporate cheerfulness'],
        },
        constitution: ['rule 1', 'rule 2', 'rule 3'],
        vibe: 'golden hour energy',
      },
    });
    const stored = repo.create(identity);
    expect(stored.soul.traits).toHaveLength(2);
    expect(stored.soul.voice.quirks).toEqual(['lowercase', 'slang', 'emoji']);
    expect(stored.soul.constitution).toEqual(['rule 1', 'rule 2', 'rule 3']);
    expect(stored.soul.vibe).toBe('golden hour energy');
  });
});
