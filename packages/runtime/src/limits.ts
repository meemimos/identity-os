/**
 * Autonomy limit checker — enforces max actions/day and max ticks/hour.
 *
 * Counts are derived from log entries:
 *   - actions_today = express-phase deep logs since midnight UTC
 *   - ticks_this_hour = decide-phase deep logs in the last 60 minutes
 */
import type { LogRepo } from '@identity-os/storage';
import type { AutonomyLimits, LimitStatus } from './types.js';

export function checkLimits(
  logRepo: LogRepo,
  identityId: string,
  limits: AutonomyLimits,
  now: Date = new Date(),
): LimitStatus {
  // Midnight UTC today
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  // One hour ago
  const hourAgo = new Date(now.getTime() - 3_600_000);

  // Count action ticks today (each action tick writes exactly one
  // express-phase deep log entry in the Remember phase)
  const actionsToday = logRepo.query(identityId, {
    since: todayStart.toISOString(),
    phase: 'express',
    level: 'deep',
  }).length;

  // Count total ticks this hour (each tick writes exactly one
  // decide-phase deep log entry)
  const ticksThisHour = logRepo.query(identityId, {
    since: hourAgo.toISOString(),
    phase: 'decide',
    level: 'deep',
  }).length;

  const reasons: string[] = [];

  if (actionsToday >= limits.max_actions_per_day) {
    reasons.push(
      `daily action limit (${actionsToday}/${limits.max_actions_per_day})`,
    );
  }
  if (ticksThisHour >= limits.max_ticks_per_hour) {
    reasons.push(
      `hourly tick limit (${ticksThisHour}/${limits.max_ticks_per_hour})`,
    );
  }

  return {
    actions_today: actionsToday,
    ticks_this_hour: ticksThisHour,
    can_act: reasons.length === 0,
    reasons,
  };
}
