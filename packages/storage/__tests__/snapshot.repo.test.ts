import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase } from '../src/db.js';
import { IdentityRepo } from '../src/repositories/identity.repo.js';
import { SnapshotRepo } from '../src/repositories/snapshot.repo.js';
import type { Identity, SnapshotEnvelope } from '@identity-os/core';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = (n: number) =>
  `a0000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

function makeIdentity(): Identity {
  return {
    identity_os_version: '0.1.0',
    schema_version: '0.1.0',
    id: UID(1),
    name: 'Penny Larson',
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

function makeSnapshot(version: number, overrides: Partial<SnapshotEnvelope> = {}): SnapshotEnvelope {
  return {
    identity_os_version: '0.1.0',
    schema_version: '0.1.0',
    id: UID(100 + version),
    identity_id: UID(1),
    version,
    content_hash: `sha256:hash_v${version}`,
    parent_hash: version > 1 ? `sha256:hash_v${version - 1}` : null,
    payload: { identity: makeIdentity(), version },
    created_at: `2026-02-07T${String(11 + version).padStart(2, '0')}:00:00.000Z`,
    ...overrides,
  };
}

describe('SnapshotRepo', () => {
  let db: Database.Database;
  let identityRepo: IdentityRepo;
  let repo: SnapshotRepo;

  beforeEach(() => {
    db = createDatabase();
    identityRepo = new IdentityRepo(db);
    repo = new SnapshotRepo(db);
    identityRepo.create(makeIdentity());
  });

  // ── Create ────────────────────────────────────────────────────

  it('creates and retrieves a snapshot', () => {
    const stored = repo.create(makeSnapshot(1));
    expect(stored.id).toBe(UID(101));
    expect(stored.version).toBe(1);
    expect(stored.content_hash).toBe('sha256:hash_v1');
    expect(stored.parent_hash).toBeNull();
    expect(stored.previous_snapshot_id).toBeNull();
    expect(stored.payload).toHaveProperty('identity');
  });

  it('creates chained snapshot with previous_snapshot_id', () => {
    const v1 = repo.create(makeSnapshot(1));
    const v2 = repo.create(makeSnapshot(2), v1.id);
    expect(v2.parent_hash).toBe('sha256:hash_v1');
    expect(v2.previous_snapshot_id).toBe(v1.id);
  });

  // ── Immutability ──────────────────────────────────────────────

  it('rejects duplicate (identity_id, version)', () => {
    repo.create(makeSnapshot(1));
    expect(() => repo.create(makeSnapshot(1, { id: UID(200) }))).toThrow();
  });

  // ── Read ──────────────────────────────────────────────────────

  it('findById returns null for missing snapshot', () => {
    expect(repo.findById(UID(99))).toBeNull();
  });

  it('findLatest returns the highest-version snapshot', () => {
    repo.create(makeSnapshot(1));
    repo.create(makeSnapshot(2));
    repo.create(makeSnapshot(3));
    const latest = repo.findLatest(UID(1))!;
    expect(latest.version).toBe(3);
  });

  it('findLatest returns null when no snapshots exist', () => {
    expect(repo.findLatest(UID(1))).toBeNull();
  });

  it('listByIdentity returns all snapshots in version order', () => {
    repo.create(makeSnapshot(1));
    repo.create(makeSnapshot(2));
    repo.create(makeSnapshot(3));
    const all = repo.listByIdentity(UID(1));
    expect(all).toHaveLength(3);
    expect(all[0].version).toBe(1);
    expect(all[2].version).toBe(3);
  });

  // ── Payload round-trip ────────────────────────────────────────

  it('round-trips complex payload through JSON', () => {
    const snapshot = makeSnapshot(1, {
      payload: {
        identity: makeIdentity(),
        memory: { active_intents: [], next_actions: [] },
        config: { cadence: { tick_interval_sec: 300 } },
      },
    });
    const stored = repo.create(snapshot);
    expect(stored.payload).toHaveProperty('memory');
    expect(stored.payload).toHaveProperty('config');
  });

  // ── Version headers ───────────────────────────────────────────

  it('preserves version headers', () => {
    const stored = repo.create(makeSnapshot(1));
    expect(stored.identity_os_version).toBe('0.1.0');
    expect(stored.schema_version).toBe('0.1.0');
  });
});
