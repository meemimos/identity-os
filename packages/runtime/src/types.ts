/**
 * Runtime types — tick lifecycle, perception, decisions, limits.
 */
import type {
  Identity,
  MemoryState,
  ReasonCode,
} from '@identity-os/core';
import type {
  StoredArtifact,
  StoredSnapshot,
  StoredLogEvent,
} from '@identity-os/storage';

// ── Tick state machine ──────────────────────────────────────────

export type TickPhaseState =
  | 'idle'
  | 'live'
  | 'decide'
  | 'express'
  | 'remember';

// ── Perception (output of Live phase) ───────────────────────────

export interface PerceptionFrame {
  tick_id: string;
  timestamp: string;
  identity: Identity & { owner: string | null };
  memory: MemoryState;
  tick_count: number;
  limits: LimitStatus;
}

// ── Decision (output of Decide phase) ───────────────────────────

/** 'nop' means no action; any other value is a skill_id to execute. */
export type DecisionAction = string;

export interface Decision {
  action: DecisionAction;
  skill_id: string | null;
  reason_code: ReasonCode;
  rationale: string;
  confidence: number;
  /** If this tick consumed a queued next_action, its ID goes here. */
  consumed_action_id?: string | null;
}

// ── Tick result (final output) ──────────────────────────────────

export interface TickResult {
  tick_id: string;
  identity_id: string;
  decision: Decision;
  /** All artifacts produced by the skill (may be empty). */
  artifacts: StoredArtifact[];
  logs: StoredLogEvent[];
  snapshot: StoredSnapshot | null;
  duration_ms: number;
}

// ── Autonomy limits ─────────────────────────────────────────────

export interface AutonomyLimits {
  max_actions_per_day: number;
  max_ticks_per_hour: number;
}

export interface LimitStatus {
  actions_today: number;
  ticks_this_hour: number;
  can_act: boolean;
  reasons: string[];
}

// ── Runtime wiring ──────────────────────────────────────────────

export interface RuntimeOptions {
  limits: AutonomyLimits;
  /** Create a snapshot every N ticks (0 = only on first tick). */
  snapshot_every: number;
  /** Override clock for deterministic testing. */
  clock?: () => Date;
}
