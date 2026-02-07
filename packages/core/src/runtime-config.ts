/**
 * Identity.Runtime config — cadence, budgets, approval gates.
 *
 * Stored per-identity; the runtime reads this to decide tick timing,
 * resource limits, and which actions need operator sign-off.
 */
import { z } from 'zod';

// ── Cadence: tick timing ────────────────────────────────────────

export const ActiveHours = z.object({
  start: z.number().int().min(0).max(23),
  end: z.number().int().min(0).max(23),
  timezone: z.string().default('UTC'),
});
export type ActiveHours = z.infer<typeof ActiveHours>;

export const CadenceConfig = z.object({
  tick_interval_sec: z.number().int().positive().default(300),
  jitter_sec: z.number().int().nonnegative().default(60),
  active_hours: ActiveHours.nullable().default(null),
});
export type CadenceConfig = z.infer<typeof CadenceConfig>;

// ── Budgets: resource limits per cycle ──────────────────────────

export const BudgetConfig = z.object({
  max_posts_per_day: z.number().int().positive().default(10),
  max_tokens_per_tick: z.number().int().positive().default(4000),
  max_skills_per_tick: z.number().int().positive().default(2),
});
export type BudgetConfig = z.infer<typeof BudgetConfig>;

// ── Approvals: what needs operator sign-off ─────────────────────

export const ApprovalAction = z.enum(['publish', 'dm', 'follow', 'spend']);
export type ApprovalAction = z.infer<typeof ApprovalAction>;

export const AutoApproveAction = z.enum(['draft', 'reflect', 'idle']);
export type AutoApproveAction = z.infer<typeof AutoApproveAction>;

export const ApprovalConfig = z.object({
  require_approval_for: z.array(ApprovalAction).default(['publish', 'spend']),
  auto_approve: z.array(AutoApproveAction).default(['draft', 'reflect', 'idle']),
});
export type ApprovalConfig = z.infer<typeof ApprovalConfig>;

// ── Aggregate RuntimeConfig ─────────────────────────────────────

export const RuntimeConfig = z.object({
  cadence: CadenceConfig,
  budgets: BudgetConfig,
  approvals: ApprovalConfig,
});
export type RuntimeConfig = z.infer<typeof RuntimeConfig>;
