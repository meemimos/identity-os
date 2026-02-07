import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase, IdentityRepo, LogRepo } from '@identity-os/storage';
import type { Identity, LogEvent } from '@identity-os/core';
import { checkLimits } from '../src/limits.js';

const NOW = new Date('2026-02-07T12:00:00.000Z');
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
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
  };
}

// Simulate a decide-phase deep log (one per tick)
function decideLog(n: number, createdAt: string): LogEvent {
  return {
    id: UID(200 + n),
    identity_id: UID(1),
    tick_id: UID(100 + n),
    phase: 'decide',
    level: 'deep',
    reason_code: 'nothing_notable',
    rationale: 'test tick',
    message: `Tick #${n}`,
    payload_ref: null,
    created_at: createdAt,
  };
}

// Simulate an express-phase deep log (one per action tick)
function expressLog(n: number, createdAt: string): LogEvent {
  return {
    id: UID(400 + n),
    identity_id: UID(1),
    tick_id: UID(100 + n),
    phase: 'express',
    level: 'deep',
    reason_code: 'skill_executed',
    rationale: 'test action',
    message: `Action #${n}`,
    payload_ref: null,
    created_at: createdAt,
  };
}

describe('checkLimits', () => {
  let db: Database.Database;
  let logRepo: LogRepo;

  beforeEach(() => {
    db = createDatabase();
    new IdentityRepo(db).create(makeIdentity());
    logRepo = new LogRepo(db);
  });

  it('returns can_act=true when under all limits', () => {
    const status = checkLimits(
      logRepo,
      UID(1),
      { max_actions_per_day: 10, max_ticks_per_hour: 12 },
      NOW,
    );
    expect(status.can_act).toBe(true);
    expect(status.actions_today).toBe(0);
    expect(status.ticks_this_hour).toBe(0);
    expect(status.reasons).toEqual([]);
  });

  it('blocks when daily action limit reached', () => {
    // Simulate 5 action ticks today
    for (let i = 1; i <= 5; i++) {
      logRepo.append(decideLog(i, `2026-02-07T${String(10 + i).padStart(2, '0')}:00:00.000Z`));
      logRepo.append(expressLog(i, `2026-02-07T${String(10 + i).padStart(2, '0')}:00:01.000Z`));
    }

    const status = checkLimits(
      logRepo,
      UID(1),
      { max_actions_per_day: 5, max_ticks_per_hour: 100 },
      NOW,
    );
    expect(status.can_act).toBe(false);
    expect(status.actions_today).toBe(5);
    expect(status.reasons[0]).toContain('daily action limit');
  });

  it('blocks when hourly tick limit reached', () => {
    // Simulate 12 ticks in the last hour
    for (let i = 1; i <= 12; i++) {
      const min = String(i).padStart(2, '0');
      logRepo.append(decideLog(i, `2026-02-07T11:${min}:00.000Z`));
    }

    const status = checkLimits(
      logRepo,
      UID(1),
      { max_actions_per_day: 100, max_ticks_per_hour: 12 },
      NOW,
    );
    expect(status.can_act).toBe(false);
    expect(status.ticks_this_hour).toBe(12);
    expect(status.reasons[0]).toContain('hourly tick limit');
  });

  it('does not count logs from yesterday', () => {
    // Logs from yesterday
    logRepo.append(expressLog(1, '2026-02-06T23:00:00.000Z'));
    logRepo.append(expressLog(2, '2026-02-06T23:30:00.000Z'));

    const status = checkLimits(
      logRepo,
      UID(1),
      { max_actions_per_day: 2, max_ticks_per_hour: 100 },
      NOW,
    );
    expect(status.can_act).toBe(true);
    expect(status.actions_today).toBe(0);
  });

  it('does not count ticks from > 1 hour ago', () => {
    // Ticks from 2 hours ago
    logRepo.append(decideLog(1, '2026-02-07T09:30:00.000Z'));
    logRepo.append(decideLog(2, '2026-02-07T09:45:00.000Z'));

    const status = checkLimits(
      logRepo,
      UID(1),
      { max_actions_per_day: 100, max_ticks_per_hour: 2 },
      NOW,
    );
    expect(status.can_act).toBe(true);
    expect(status.ticks_this_hour).toBe(0);
  });
});
