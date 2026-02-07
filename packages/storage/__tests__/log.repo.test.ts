import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase } from '../src/db.js';
import { IdentityRepo } from '../src/repositories/identity.repo.js';
import { LogRepo } from '../src/repositories/log.repo.js';
import type { Identity, LogEvent } from '@identity-os/core';

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

function makePublicLog(n: number, overrides: Partial<LogEvent> = {}): LogEvent {
  return {
    id: UID(200 + n),
    identity_id: UID(1),
    tick_id: UID(100),
    phase: 'decide',
    level: 'public',
    reason_code: null,
    rationale: null,
    message: `Public event #${n}`,
    payload_ref: null,
    created_at: `2026-02-07T${String(10 + n).padStart(2, '0')}:00:00.000Z`,
    ...overrides,
  };
}

function makeDeepLog(n: number, overrides: Partial<LogEvent> = {}): LogEvent {
  return {
    id: UID(300 + n),
    identity_id: UID(1),
    tick_id: UID(100),
    phase: 'decide',
    level: 'deep',
    reason_code: 'nothing_notable',
    rationale: 'no interesting signals right now',
    message: `Deep event #${n}`,
    payload_ref: null,
    created_at: `2026-02-07T${String(10 + n).padStart(2, '0')}:30:00.000Z`,
    ...overrides,
  };
}

describe('LogRepo', () => {
  let db: Database.Database;
  let repo: LogRepo;

  beforeEach(() => {
    db = createDatabase();
    new IdentityRepo(db).create(makeIdentity());
    repo = new LogRepo(db);
  });

  // ── Append ────────────────────────────────────────────────────

  it('appends and retrieves a public log event', () => {
    const stored = repo.append(makePublicLog(1));
    expect(stored.id).toBe(UID(201));
    expect(stored.level).toBe('public');
    expect(stored.reason_code).toBeNull();
    expect(stored.message).toContain('#1');
  });

  it('appends and retrieves a deep log event', () => {
    const stored = repo.append(makeDeepLog(1));
    expect(stored.level).toBe('deep');
    expect(stored.reason_code).toBe('nothing_notable');
    expect(stored.rationale).toBe('no interesting signals right now');
  });

  // ── Read ──────────────────────────────────────────────────────

  it('findById returns null for missing log', () => {
    expect(repo.findById(UID(99))).toBeNull();
  });

  // ── Query ─────────────────────────────────────────────────────

  it('query returns all logs for an identity', () => {
    repo.append(makePublicLog(1));
    repo.append(makeDeepLog(1));
    repo.append(makePublicLog(2));
    const all = repo.query(UID(1));
    expect(all).toHaveLength(3);
  });

  it('query filters by level', () => {
    repo.append(makePublicLog(1));
    repo.append(makeDeepLog(1));
    repo.append(makePublicLog(2));
    const publicOnly = repo.query(UID(1), { level: 'public' });
    expect(publicOnly).toHaveLength(2);
    expect(publicOnly.every((e) => e.level === 'public')).toBe(true);
  });

  it('query filters by phase', () => {
    repo.append(makePublicLog(1, { phase: 'live' }));
    repo.append(makePublicLog(2, { phase: 'decide' }));
    repo.append(makePublicLog(3, { phase: 'express' }));
    const decideOnly = repo.query(UID(1), { phase: 'decide' });
    expect(decideOnly).toHaveLength(1);
  });

  it('query filters by time range (since/until)', () => {
    repo.append(makePublicLog(1)); // 11:00
    repo.append(makePublicLog(2)); // 12:00
    repo.append(makePublicLog(3)); // 13:00

    const inRange = repo.query(UID(1), {
      since: '2026-02-07T11:30:00.000Z',
      until: '2026-02-07T12:30:00.000Z',
    });
    expect(inRange).toHaveLength(1);
    expect(inRange[0].message).toContain('#2');
  });

  it('query respects limit', () => {
    repo.append(makePublicLog(1));
    repo.append(makePublicLog(2));
    repo.append(makePublicLog(3));
    const limited = repo.query(UID(1), { limit: 2 });
    expect(limited).toHaveLength(2);
  });

  it('query returns empty for non-existent identity', () => {
    expect(repo.query(UID(99))).toEqual([]);
  });

  // ── Tail ──────────────────────────────────────────────────────

  it('tail returns latest N entries in chronological order', () => {
    repo.append(makePublicLog(1));
    repo.append(makePublicLog(2));
    repo.append(makePublicLog(3));
    repo.append(makePublicLog(4));
    repo.append(makePublicLog(5));

    const tail = repo.tail(UID(1), 3);
    expect(tail).toHaveLength(3);
    // Should be in chronological order (oldest first of the last 3)
    expect(tail[0].message).toContain('#3');
    expect(tail[1].message).toContain('#4');
    expect(tail[2].message).toContain('#5');
  });

  it('tail defaults to 20 when no limit specified', () => {
    for (let i = 1; i <= 25; i++) {
      repo.append(makePublicLog(i));
    }
    const tail = repo.tail(UID(1));
    expect(tail).toHaveLength(20);
  });

  // ── Count by tick ─────────────────────────────────────────────

  it('counts log entries for a tick', () => {
    repo.append(makePublicLog(1, { tick_id: UID(100) }));
    repo.append(makeDeepLog(1, { tick_id: UID(100) }));
    repo.append(makePublicLog(2, { tick_id: UID(101) }));
    expect(repo.countByTick(UID(100))).toBe(2);
    expect(repo.countByTick(UID(101))).toBe(1);
    expect(repo.countByTick(UID(999))).toBe(0);
  });

  // ── Rationale constraint ──────────────────────────────────────

  it('rejects rationale over 120 characters', () => {
    expect(() =>
      repo.append(
        makeDeepLog(1, { rationale: 'x'.repeat(121) }),
      ),
    ).toThrow();
  });

  it('accepts rationale at exactly 120 characters', () => {
    const stored = repo.append(
      makeDeepLog(1, { rationale: 'x'.repeat(120) }),
    );
    expect(stored.rationale).toHaveLength(120);
  });
});
