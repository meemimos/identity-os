/**
 * Live phase — gather perception.
 *
 * Loads the identity, reads memory state from the latest snapshot,
 * increments tick count, and checks autonomy limits.
 */
import type { MemoryState } from '@identity-os/core';
import type { IdentityRepo, SnapshotRepo, LogRepo } from '@identity-os/storage';
import type { PerceptionFrame, AutonomyLimits } from '../types.js';
import { checkLimits } from '../limits.js';

const EMPTY_MEMORY: MemoryState = {
  active_intents: [],
  next_actions: [],
  continuity: {
    last_tick_id: null,
    last_tick_at: null,
    tick_count: 0,
    last_mood: null,
    running_summary: null,
  },
};

export function live(
  identityId: string,
  tickId: string,
  now: string,
  deps: {
    identityRepo: IdentityRepo;
    snapshotRepo: SnapshotRepo;
    logRepo: LogRepo;
  },
  limits: AutonomyLimits,
): PerceptionFrame {
  // Load identity
  const identity = deps.identityRepo.findById(identityId);
  if (!identity) throw new Error(`Identity not found: ${identityId}`);

  // Load memory from latest snapshot (or default)
  const latestSnap = deps.snapshotRepo.findLatest(identityId);
  let memory: MemoryState;

  if (latestSnap?.payload?.memory) {
    // Deep-clone so mutations don't affect stored data
    memory = JSON.parse(JSON.stringify(latestSnap.payload.memory)) as MemoryState;
  } else {
    memory = JSON.parse(JSON.stringify(EMPTY_MEMORY)) as MemoryState;
  }

  // Advance continuity
  memory.continuity.tick_count += 1;
  memory.continuity.last_tick_id = tickId;
  memory.continuity.last_tick_at = now;

  // Check autonomy limits
  const limitStatus = checkLimits(
    deps.logRepo,
    identityId,
    limits,
    new Date(now),
  );

  return {
    tick_id: tickId,
    timestamp: now,
    identity,
    memory,
    tick_count: memory.continuity.tick_count,
    limits: limitStatus,
  };
}
