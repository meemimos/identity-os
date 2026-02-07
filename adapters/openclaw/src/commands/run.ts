/**
 * identityos run start|stop <id> — manage scheduled ticks via OpenClaw cron.
 */
import { getContext, resolveIdentity } from '../context.js';
import { createTickJob, setJobEnabled, findJob, removeJob } from '../cron.js';
import { fmt } from '../format.js';

export async function runCommand(
  action: string,
  id: string | undefined,
  opts: { interval?: string; tz?: string },
): Promise<void> {
  const ctx = getContext();
  const identity = resolveIdentity(id, ctx.identityRepo);

  switch (action) {
    case 'start': {
      const interval = parseInt(opts.interval ?? '5', 10);
      const tz = opts.tz ?? 'UTC';

      const job = createTickJob(identity.id, identity.name, interval, tz);

      console.log(fmt.bold('\nScheduled tick started'));
      console.log(`  ${fmt.label('Identity:', `${identity.name} (${fmt.shortId(identity.id)})`)}`);
      console.log(`  ${fmt.label('Job ID:', job.id)}`);
      console.log(`  ${fmt.label('Schedule:', `every ${interval} min (${tz})`)}`);
      console.log(`  ${fmt.label('Cron expr:', job.schedule.expr)}`);
      console.log(
        `\n  ${fmt.dim('OpenClaw will trigger ticks via its cron scheduler.')}`,
      );
      console.log();
      break;
    }

    case 'stop': {
      const existing = findJob(identity.id);
      if (!existing) {
        console.error(`No scheduled job found for ${identity.name} (${fmt.shortId(identity.id)})`);
        process.exit(1);
      }

      setJobEnabled(identity.id, false);

      console.log(fmt.bold('\nScheduled tick stopped'));
      console.log(`  ${fmt.label('Identity:', `${identity.name} (${fmt.shortId(identity.id)})`)}`);
      console.log(`  ${fmt.label('Job ID:', existing.id)}`);
      console.log(`  ${fmt.dim('Job disabled. Run "identityos run start" to resume.')}`);
      console.log();
      break;
    }

    case 'remove': {
      const removed = removeJob(identity.id);
      if (!removed) {
        console.error(`No scheduled job found for ${identity.name}`);
        process.exit(1);
      }
      console.log(fmt.bold('\nScheduled job removed'));
      console.log();
      break;
    }

    default:
      console.error(`Unknown action: ${action}. Use start, stop, or remove.`);
      process.exit(1);
  }
}
