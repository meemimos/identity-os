/**
 * Identity.Memory — intent tracking, next-actions, continuity, and
 * long-term memory (episodic + semantic).
 *
 * MemoryState is the "working state" carried between ticks.
 * EpisodicEntry / SemanticEntry are stored rows in their own tables.
 */
import { z } from 'zod';
import { UUID, ISOTimestamp } from './common.js';

// ── Active Intents: what the character is currently trying to do ──

export const IntentPriority = z.enum(['low', 'medium', 'high']);
export type IntentPriority = z.infer<typeof IntentPriority>;

export const IntentStatus = z.enum(['active', 'paused', 'completed', 'abandoned']);
export type IntentStatus = z.infer<typeof IntentStatus>;

export const ActiveIntent = z.object({
  id: UUID,
  label: z.string().min(1),
  description: z.string().default(''),
  priority: IntentPriority.default('medium'),
  status: IntentStatus.default('active'),
  created_at: ISOTimestamp,
  updated_at: ISOTimestamp,
});
export type ActiveIntent = z.infer<typeof ActiveIntent>;

// ── Next Actions: specific queued steps ─────────────────────────

export const NextAction = z.object({
  id: UUID,
  intent_id: UUID.nullable().default(null),
  action: z.string().min(1),
  skill_id: z.string().nullable().default(null),
  earliest_at: ISOTimestamp.nullable().default(null),
  created_at: ISOTimestamp,
});
export type NextAction = z.infer<typeof NextAction>;

// ── Continuity: thread of consciousness between ticks ───────────

export const Continuity = z.object({
  last_tick_id: UUID.nullable().default(null),
  last_tick_at: ISOTimestamp.nullable().default(null),
  tick_count: z.number().int().nonnegative().default(0),
  last_mood: z.string().nullable().default(null),
  running_summary: z.string().nullable().default(null),
});
export type Continuity = z.infer<typeof Continuity>;

// ── Episodic Memory: specific events ────────────────────────────

export const EpisodicEntry = z.object({
  id: UUID,
  identity_id: UUID,
  tick_id: UUID,
  event_type: z.string().min(1),
  summary: z.string().min(1),
  detail: z.record(z.unknown()).nullable().default(null),
  significance: z.number().min(0).max(1).default(0.5),
  created_at: ISOTimestamp,
});
export type EpisodicEntry = z.infer<typeof EpisodicEntry>;

// ── Semantic Memory: accumulated knowledge ──────────────────────

export const SemanticCategory = z.enum(['preference', 'fact', 'pattern']);
export type SemanticCategory = z.infer<typeof SemanticCategory>;

export const SemanticEntry = z.object({
  id: UUID,
  identity_id: UUID,
  category: SemanticCategory,
  key: z.string().min(1),
  value: z.string().min(1),
  confidence: z.number().min(0).max(1).default(0.5),
  source_tick_id: UUID.nullable().default(null),
  updated_at: ISOTimestamp,
});
export type SemanticEntry = z.infer<typeof SemanticEntry>;

// ── Aggregate Memory State (working state per identity) ─────────

export const MemoryState = z.object({
  active_intents: z.array(ActiveIntent).default([]),
  next_actions: z.array(NextAction).default([]),
  continuity: Continuity,
});
export type MemoryState = z.infer<typeof MemoryState>;
