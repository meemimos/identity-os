/**
 * Decide phase — choose an action (or NOP).
 *
 * MVP: deterministic rules-based engine.
 * When an LLMProvider is wired, it replaces the rules with reasoning.
 *
 * Rules (first match wins):
 *   1. Limits prevent action → NOP (cooldown_active)
 *   2. Ready next_action exists → execute its skill
 *   3. tick_count % 5 == 0 (and > 0) → reflection
 *   4. Active intents + odd tick → rotate day_in_my_life / routine
 *   5. Default → NOP (nothing_notable)
 */
import type { PerceptionFrame, Decision } from '../types.js';
import type { LLMProvider } from '../llm-provider.js';

/** Content skills rotated by the rules engine. */
const CONTENT_SKILLS = ['day_in_my_life', 'routine'] as const;

// ── Helpers ─────────────────────────────────────────────────────

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 3) + '...';
}

function nop(
  reason_code: Decision['reason_code'],
  rationale: string,
): Decision {
  return {
    action: 'nop',
    skill_id: null,
    reason_code,
    rationale: truncate(rationale, 120),
    confidence: 1.0,
  };
}

function act(
  skill_id: string,
  reason_code: Decision['reason_code'],
  rationale: string,
  confidence = 0.7,
  consumed_action_id?: string,
): Decision {
  return {
    action: skill_id,
    skill_id,
    reason_code,
    rationale: truncate(rationale, 120),
    confidence,
    consumed_action_id: consumed_action_id ?? null,
  };
}

// ── Rules-based engine ──────────────────────────────────────────

export function ruleBasedDecide(perception: PerceptionFrame): Decision {
  const { memory, tick_count, limits } = perception;

  // 1. Limits gate
  if (!limits.can_act) {
    return nop(
      'cooldown_active',
      limits.reasons[0] ?? 'limit reached',
    );
  }

  // 2. Ready next_action
  const readyAction = memory.next_actions.find((a) => {
    if (!a.earliest_at) return true;
    return new Date(a.earliest_at) <= new Date(perception.timestamp);
  });
  if (readyAction?.skill_id) {
    return act(
      readyAction.skill_id,
      'scheduled',
      `queued: ${readyAction.action}`,
      0.8,
      readyAction.id,
    );
  }

  // 3. Periodic reflection (every 5th tick, not on tick 0)
  if (tick_count > 0 && tick_count % 5 === 0) {
    return act('reflection', 'scheduled', 'periodic self-reflection', 0.6);
  }

  // 4. Content skill if active intents and odd tick
  const activeIntents = memory.active_intents.filter(
    (i) => i.status === 'active',
  );
  if (activeIntents.length > 0 && tick_count % 2 === 1) {
    const idx = Math.floor(tick_count / 2) % CONTENT_SKILLS.length;
    const skillId = CONTENT_SKILLS[idx];
    return act(
      skillId,
      'inspiration_struck',
      `progressing: ${activeIntents[0].label}`,
      0.6,
    );
  }

  // 5. Default: do nothing
  return nop('nothing_notable', 'no signals, resting');
}

// ── Decide (routes to LLM or rules) ────────────────────────────

export async function decide(
  perception: PerceptionFrame,
  llm?: LLMProvider,
): Promise<Decision> {
  if (llm) {
    return llm.decide({
      identity: perception.identity,
      memory: perception.memory,
      perception,
    });
  }
  return ruleBasedDecide(perception);
}
