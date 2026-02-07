/**
 * identityos status <id> — show current identity state.
 */
import type { MemoryState } from '@identity-os/core';
import { getContext, resolveIdentity } from '../context.js';
import { findJob } from '../cron.js';
import { fmt } from '../format.js';

export async function statusCommand(
  id: string | undefined,
): Promise<void> {
  const ctx = getContext();
  const identity = resolveIdentity(id, ctx.identityRepo);
  const snap = ctx.snapshotRepo.findLatest(identity.id);
  const job = findJob(identity.id);

  // ── Header ──────────────────────────────────────────────────
  console.log(
    `\n${fmt.bold(identity.name)}  ${fmt.dim(`(${identity.id})`)}`,
  );
  console.log(
    `  ${fmt.label('Status:', fmt.status(identity.status))}` +
      `  │  ${fmt.label('Version:', String(identity.version))}` +
      `  │  ${fmt.label('Owner:', identity.owner ?? '(none)')}`,
  );

  // ── Soul ────────────────────────────────────────────────────
  console.log(
    `  ${fmt.label('Vibe:', identity.soul.vibe || '(none)')}` +
      `  │  ${fmt.label('Traits:', String(identity.soul.traits.length))}` +
      `  │  ${fmt.label('Constitution:', String(identity.soul.constitution.length))}`,
  );

  // ── Memory / continuity ─────────────────────────────────────
  if (snap?.payload?.memory) {
    const memory = snap.payload.memory as MemoryState;
    const c = memory.continuity;
    console.log(
      `  ${fmt.label('Tick count:', String(c.tick_count))}` +
        `  │  ${fmt.label('Last tick:', c.last_tick_at ?? 'never')}` +
        `  │  ${fmt.label('Mood:', c.last_mood ?? '(none)')}`,
    );

    const activeIntents = memory.active_intents.filter(
      (i) => i.status === 'active',
    );
    if (activeIntents.length > 0) {
      console.log(`  ${fmt.bold('Active intents:')}`);
      for (const intent of activeIntents) {
        console.log(
          `    ${fmt.green('●')} ${intent.label} ${fmt.dim(`(${intent.priority})`)}`,
        );
      }
    }

    if (memory.next_actions.length > 0) {
      console.log(`  ${fmt.bold('Queued actions:')}`);
      for (const action of memory.next_actions) {
        console.log(
          `    ${fmt.yellow('▸')} ${action.action}` +
            (action.skill_id ? ` ${fmt.dim(`[${action.skill_id}]`)}` : ''),
        );
      }
    }
  }

  // ── Snapshot ────────────────────────────────────────────────
  if (snap) {
    console.log(
      `  ${fmt.label('Snapshot:', `v${snap.version}`)}  ${fmt.dim(snap.content_hash.slice(0, 30) + '...')}`,
    );
  }

  // ── Scheduling ──────────────────────────────────────────────
  if (job) {
    const state = job.enabled ? fmt.green('running') : fmt.yellow('paused');
    console.log(
      `  ${fmt.label('Schedule:', state)}  ${fmt.dim(`${job.schedule.expr} (${job.schedule.tz})`)}`,
    );
  } else {
    console.log(`  ${fmt.label('Schedule:', fmt.dim('not configured'))}`);
  }

  // ── Recent activity ─────────────────────────────────────────
  const recentLogs = ctx.logRepo.tail(identity.id, 3);
  if (recentLogs.length > 0) {
    console.log(`  ${fmt.bold('Recent activity:')}`);
    for (const log of recentLogs) {
      const ts = log.created_at.slice(11, 19);
      console.log(
        `    ${fmt.dim(ts)} [${fmt.phase(log.phase)}] ${log.message}`,
      );
    }
  }

  console.log();
}
