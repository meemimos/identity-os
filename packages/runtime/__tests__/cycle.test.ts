import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import {
  createDatabase,
  IdentityRepo,
  SnapshotRepo,
  ArtifactRepo,
  LogRepo,
} from '@identity-os/storage';
import { SkillRegistry, registerBuiltins } from '@identity-os/skills';
import type { Identity, MemoryState } from '@identity-os/core';
import { RuntimeCycle } from '../src/cycle.js';

const FIXED_NOW = new Date('2026-02-07T12:00:00.000Z');
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
    created_at: FIXED_NOW.toISOString(),
    updated_at: FIXED_NOW.toISOString(),
    ...overrides,
  };
}

function seedMemory(
  snapshotRepo: SnapshotRepo,
  identityRepo: IdentityRepo,
  memory: MemoryState,
): void {
  snapshotRepo.create({
    identity_os_version: '0.1.0',
    schema_version: '0.1.0',
    id: UID(70),
    identity_id: UID(1),
    version: 1,
    content_hash: 'sha256:seed',
    parent_hash: null,
    payload: { identity: { name: 'Penny Larson' }, memory },
    created_at: FIXED_NOW.toISOString(),
  });
  identityRepo.updateLatestSnapshot(
    UID(1),
    UID(70),
    1,
    FIXED_NOW.toISOString(),
  );
}

describe('RuntimeCycle', () => {
  let db: Database.Database;
  let identityRepo: IdentityRepo;
  let snapshotRepo: SnapshotRepo;
  let artifactRepo: ArtifactRepo;
  let logRepo: LogRepo;
  let registry: SkillRegistry;
  let cycle: RuntimeCycle;

  beforeEach(() => {
    db = createDatabase();
    identityRepo = new IdentityRepo(db);
    snapshotRepo = new SnapshotRepo(db);
    artifactRepo = new ArtifactRepo(db);
    logRepo = new LogRepo(db);

    registry = new SkillRegistry();
    registerBuiltins(registry);

    cycle = new RuntimeCycle(
      { identityRepo, snapshotRepo, artifactRepo, logRepo, skillRegistry: registry },
      {
        limits: { max_actions_per_day: 20, max_ticks_per_hour: 60 },
        snapshot_every: 1,
        clock: () => FIXED_NOW,
      },
    );
  });

  // ── NOP path: no intents → does nothing ───────────────────────

  it('first tick with no intents produces NOP + snapshot', async () => {
    identityRepo.create(makeIdentity());

    const result = await cycle.tick(UID(1));

    expect(result.identity_id).toBe(UID(1));
    expect(result.decision.action).toBe('nop');
    expect(result.decision.reason_code).toBe('nothing_notable');
    expect(result.artifacts).toHaveLength(0);
    expect(result.snapshot).not.toBeNull();
    expect(result.snapshot!.version).toBe(1);
  });

  // ── day_in_my_life: tick 1 with intents ───────────────────────

  it('tick 1 with active intents triggers day_in_my_life (5 artifacts)', async () => {
    identityRepo.create(makeIdentity());
    seedMemory(snapshotRepo, identityRepo, {
      active_intents: [
        {
          id: UID(30),
          label: 'Build IG presence',
          description: '',
          priority: 'high',
          status: 'active',
          created_at: FIXED_NOW.toISOString(),
          updated_at: FIXED_NOW.toISOString(),
        },
      ],
      next_actions: [],
      continuity: {
        last_tick_id: null,
        last_tick_at: null,
        tick_count: 0,
        last_mood: null,
        running_summary: null,
      },
    });

    const result = await cycle.tick(UID(1));

    // tick_count 0→1 (odd) + intents → day_in_my_life
    expect(result.decision.action).toBe('day_in_my_life');
    expect(result.decision.skill_id).toBe('day_in_my_life');
    expect(result.artifacts).toHaveLength(5);

    const types = result.artifacts.map((a) => a.type);
    expect(types.filter((t) => t === 'script')).toHaveLength(1);
    expect(types.filter((t) => t === 'shotlist')).toHaveLength(1);
    expect(types.filter((t) => t === 'caption')).toHaveLength(3);

    // All artifacts stored as draft
    expect(result.artifacts.every((a) => a.status === 'draft')).toBe(true);
  });

  // ── reflection: tick_count % 5 == 0 ───────────────────────────

  it('triggers reflection at tick_count multiple of 5 (3 artifacts)', async () => {
    identityRepo.create(makeIdentity());
    seedMemory(snapshotRepo, identityRepo, {
      active_intents: [],
      next_actions: [],
      continuity: {
        last_tick_id: null,
        last_tick_at: null,
        tick_count: 4,
        last_mood: 'focused',
        running_summary: 'Been building steadily.',
      },
    });

    const result = await cycle.tick(UID(1));

    // tick_count 4→5, which is % 5 == 0 → reflection
    expect(result.decision.action).toBe('reflection');
    expect(result.artifacts).toHaveLength(3);

    const types = result.artifacts.map((a) => a.type);
    expect(types).toContain('thought');
    expect(types.filter((t) => t === 'caption')).toHaveLength(2);
  });

  // ── routine: tick 3 with intents ──────────────────────────────

  it('tick 3 with intents triggers routine (3 artifacts)', async () => {
    identityRepo.create(makeIdentity());
    seedMemory(snapshotRepo, identityRepo, {
      active_intents: [
        {
          id: UID(30),
          label: 'Build IG presence',
          description: '',
          priority: 'high',
          status: 'active',
          created_at: FIXED_NOW.toISOString(),
          updated_at: FIXED_NOW.toISOString(),
        },
      ],
      next_actions: [],
      continuity: {
        last_tick_id: null,
        last_tick_at: null,
        tick_count: 2, // next tick → 3 (odd, floor(3/2)%2=1 → routine)
        last_mood: null,
        running_summary: null,
      },
    });

    const result = await cycle.tick(UID(1));

    expect(result.decision.action).toBe('routine');
    expect(result.artifacts).toHaveLength(3);

    const types = result.artifacts.map((a) => a.type);
    expect(types).toContain('script');
    expect(types.filter((t) => t === 'caption')).toHaveLength(2);
  });

  // ── Memory patches applied in snapshot ────────────────────────

  it('applies memory_patch (mood + summary) to snapshot', async () => {
    identityRepo.create(makeIdentity());
    seedMemory(snapshotRepo, identityRepo, {
      active_intents: [
        {
          id: UID(30),
          label: 'Build IG presence',
          description: '',
          priority: 'high',
          status: 'active',
          created_at: FIXED_NOW.toISOString(),
          updated_at: FIXED_NOW.toISOString(),
        },
      ],
      next_actions: [],
      continuity: {
        last_tick_id: null,
        last_tick_at: null,
        tick_count: 0,
        last_mood: null,
        running_summary: null,
      },
    });

    const result = await cycle.tick(UID(1));
    expect(result.snapshot).not.toBeNull();

    const mem = result.snapshot!.payload.memory as MemoryState;
    expect(mem.continuity.last_mood).toBe('creative'); // day_in_my_life sets creative
    expect(mem.continuity.running_summary).toContain('day-in-my-life');
  });

  // ── Next actions queued by skills ─────────────────────────────

  it('skill next_actions appear in snapshot memory', async () => {
    identityRepo.create(makeIdentity());
    seedMemory(snapshotRepo, identityRepo, {
      active_intents: [
        {
          id: UID(30),
          label: 'Build IG presence',
          description: '',
          priority: 'high',
          status: 'active',
          created_at: FIXED_NOW.toISOString(),
          updated_at: FIXED_NOW.toISOString(),
        },
      ],
      next_actions: [],
      continuity: {
        last_tick_id: null,
        last_tick_at: null,
        tick_count: 0,
        last_mood: null,
        running_summary: null,
      },
    });

    const result = await cycle.tick(UID(1));
    const mem = result.snapshot!.payload.memory as MemoryState;
    expect(mem.next_actions.length).toBeGreaterThan(0);
    expect(mem.next_actions[0].action).toContain('Review');
  });

  // ── Snapshot chaining ─────────────────────────────────────────

  it('chains snapshots with parent_hash', async () => {
    identityRepo.create(makeIdentity());

    const r1 = await cycle.tick(UID(1));
    expect(r1.snapshot!.parent_hash).toBeNull();

    const r2 = await cycle.tick(UID(1));
    expect(r2.snapshot!.parent_hash).toBe(r1.snapshot!.content_hash);
    expect(r2.snapshot!.previous_snapshot_id).toBe(r1.snapshot!.id);
  });

  // ── Limits enforcement ────────────────────────────────────────

  it('enforces daily action limit', async () => {
    identityRepo.create(makeIdentity());
    seedMemory(snapshotRepo, identityRepo, {
      active_intents: [
        {
          id: UID(30),
          label: 'Post',
          description: '',
          priority: 'high',
          status: 'active',
          created_at: FIXED_NOW.toISOString(),
          updated_at: FIXED_NOW.toISOString(),
        },
      ],
      next_actions: [],
      continuity: { last_tick_id: null, last_tick_at: null, tick_count: 0, last_mood: null, running_summary: null },
    });

    const restricted = new RuntimeCycle(
      { identityRepo, snapshotRepo, artifactRepo, logRepo, skillRegistry: registry },
      {
        limits: { max_actions_per_day: 1, max_ticks_per_hour: 100 },
        snapshot_every: 1,
        clock: () => FIXED_NOW,
      },
    );

    const r1 = await restricted.tick(UID(1));
    expect(r1.decision.action).toBe('day_in_my_life');

    const r2 = await restricted.tick(UID(1));
    expect(r2.decision.action).toBe('nop');
    expect(r2.decision.reason_code).toBe('cooldown_active');
  });

  // ── Error handling ────────────────────────────────────────────

  it('throws when identity does not exist', async () => {
    await expect(cycle.tick(UID(99))).rejects.toThrow(/not found/);
  });

  it('tick result includes duration_ms', async () => {
    identityRepo.create(makeIdentity());
    const result = await cycle.tick(UID(1));
    expect(result.duration_ms).toBeGreaterThanOrEqual(0);
  });
});
