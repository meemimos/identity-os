/**
 * Identity.Log — the character's observable activity stream.
 *
 * Two levels:
 *   public  – what happened (human-readable, safe to expose)
 *   deep    – why it happened (reason_code + short rationale, max 120 chars)
 *
 * Deep entries MUST include a reason_code and rationale.
 * Public entries carry only a message.
 */
import { z } from 'zod';
import { UUID, ISOTimestamp } from './common.js';

export const LogLevel = z.enum(['public', 'deep']);
export type LogLevel = z.infer<typeof LogLevel>;

export const TickPhase = z.enum(['live', 'decide', 'express', 'remember']);
export type TickPhase = z.infer<typeof TickPhase>;

export const ReasonCode = z.enum([
  // ── NOP reasons ─────────────────────
  'nothing_notable',
  'cooldown_active',
  'low_energy',
  'waiting',
  'observing',
  // ── Action reasons ──────────────────
  'inspiration_struck',
  'signal_received',
  'scheduled',
  'operator_triggered',
  // ── Outcome reasons ─────────────────
  'skill_executed',
  'skill_failed',
  'memory_updated',
  'snapshot_taken',
]);
export type ReasonCode = z.infer<typeof ReasonCode>;

// ── LogEvent ────────────────────────────────────────────────────

const LogEventBase = z.object({
  id: UUID,
  identity_id: UUID,
  tick_id: UUID,
  phase: TickPhase,
  level: LogLevel,
  reason_code: ReasonCode.nullable().default(null),
  rationale: z.string().max(120).nullable().default(null),
  message: z.string().min(1),
  payload_ref: z.string().nullable().default(null),
  created_at: ISOTimestamp,
});

export const LogEvent = LogEventBase.superRefine((data, ctx) => {
  if (data.level === 'deep') {
    if (!data.reason_code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Deep log entries require a reason_code',
        path: ['reason_code'],
      });
    }
    if (!data.rationale) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Deep log entries require a rationale',
        path: ['rationale'],
      });
    }
  }
});
export type LogEvent = z.infer<typeof LogEventBase>;
