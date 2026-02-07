/**
 * identityos tick <id> — run a single tick of the character lifecycle.
 */
import { getContext, resolveIdentity } from '../context.js';
import { fmt, table } from '../format.js';

export async function tickCommand(
  id: string | undefined,
  opts: { verbose?: boolean },
): Promise<void> {
  const ctx = getContext();
  const identity = resolveIdentity(id, ctx.identityRepo);

  console.log(
    fmt.dim(`\nTick  ${fmt.shortId(identity.id)}  │  ${identity.name}  │  ${new Date().toISOString()}`),
  );

  const result = await ctx.cycle.tick(identity.id);

  // ── Decision ────────────────────────────────────────────────
  const d = result.decision;
  if (d.action === 'nop') {
    console.log(`\n  ${fmt.phase('decide')}  ${fmt.dim('NOP')} — ${d.reason_code}`);
    if (opts.verbose && d.rationale) {
      console.log(`    ${fmt.dim(d.rationale)}`);
    }
  } else {
    console.log(
      `\n  ${fmt.phase('decide')}  ${fmt.bold(d.action)}` +
        (d.consumed_action_id ? ` ${fmt.dim('(queued action)')}` : ''),
    );
    if (opts.verbose) {
      console.log(`    ${fmt.dim(`reason: ${d.reason_code}`)}`);
      if (d.rationale) console.log(`    ${fmt.dim(d.rationale)}`);
    }
  }

  // ── Artifacts ───────────────────────────────────────────────
  if (result.artifacts.length > 0) {
    console.log(`\n  ${fmt.phase('express')}  ${result.artifacts.length} artifact(s)`);
    const rows = result.artifacts.map((a) => [
      a.type,
      (a.title ?? '').slice(0, 40),
      a.status,
      fmt.shortId(a.id),
    ]);
    const t = table(['TYPE', 'TITLE', 'STATUS', 'ID'], rows);
    for (const line of t.split('\n')) {
      console.log(`    ${line}`);
    }
  }

  // ── Snapshot ────────────────────────────────────────────────
  if (result.snapshot) {
    console.log(
      `\n  ${fmt.phase('remember')}  snapshot v${result.snapshot.version}  ${fmt.dim(result.snapshot.content_hash.slice(0, 24) + '...')}`,
    );
  }

  // ── Summary ─────────────────────────────────────────────────
  console.log(
    `\n  ${fmt.dim(`${result.logs.length} logs  │  ${result.artifacts.length} artifacts  │  ${result.duration_ms}ms`)}`,
  );
  console.log();
}
