/**
 * identityos logs <id> — view identity log entries.
 */
import { getContext, resolveIdentity } from '../context.js';
import { fmt } from '../format.js';

export async function logsCommand(
  id: string | undefined,
  opts: {
    deep?: boolean;
    limit?: string;
    tail?: boolean;
    phase?: string;
    since?: string;
  },
): Promise<void> {
  const ctx = getContext();
  const identity = resolveIdentity(id, ctx.identityRepo);
  const limit = parseInt(opts.limit ?? '30', 10);

  let entries;
  if (opts.tail) {
    entries = ctx.logRepo.tail(identity.id, limit);
  } else {
    entries = ctx.logRepo.query(identity.id, {
      level: opts.deep ? undefined : 'public',
      phase: opts.phase as 'live' | 'decide' | 'express' | 'remember' | undefined,
      since: opts.since,
      limit,
    });
  }

  if (entries.length === 0) {
    console.log(fmt.dim('\nNo log entries found.'));
    console.log();
    return;
  }

  console.log(
    `\n${fmt.bold(`Logs: ${identity.name}`)} ${fmt.dim(`(${entries.length} entries)`)}\n`,
  );

  let currentTickId = '';

  for (const entry of entries) {
    // Group by tick
    if (entry.tick_id !== currentTickId) {
      currentTickId = entry.tick_id;
      console.log(fmt.dim(`── tick ${fmt.shortId(entry.tick_id)} ──`));
    }

    const ts = entry.created_at.slice(11, 19);
    const levelTag = fmt.level(entry.level);
    const phaseTag = fmt.phase(entry.phase);

    let line = `  ${fmt.dim(ts)} [${phaseTag}] [${levelTag}] ${entry.message}`;

    // Show deep details
    if (entry.level === 'deep' && entry.reason_code) {
      line += `  ${fmt.dim(`(${entry.reason_code})`)}`;
    }
    if (entry.level === 'deep' && entry.rationale) {
      line += `\n    ${fmt.dim('→ ' + entry.rationale)}`;
    }

    console.log(line);
  }

  console.log();
}
