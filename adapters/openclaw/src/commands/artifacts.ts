/**
 * identityos artifacts <id> — list generated artifacts.
 */
import { getContext, resolveIdentity } from '../context.js';
import { fmt, table } from '../format.js';

export async function artifactsCommand(
  id: string | undefined,
  opts: {
    type?: string;
    status?: string;
    limit?: string;
    show?: string;
  },
): Promise<void> {
  const ctx = getContext();
  const identity = resolveIdentity(id, ctx.identityRepo);

  // ── Single artifact view ────────────────────────────────────
  if (opts.show) {
    // Support short IDs: look up full list and match prefix
    let artifact = ctx.artifactRepo.findById(opts.show);
    if (!artifact) {
      const all = ctx.artifactRepo.listByIdentity(identity.id, { limit: 200 });
      artifact = all.find((a) => a.id.startsWith(opts.show!)) ?? null;
    }
    if (!artifact) {
      console.error(`Artifact not found: ${opts.show}`);
      process.exit(1);
    }
    console.log(`\n${fmt.bold(artifact.title ?? '(untitled)')}`);
    console.log(`  ${fmt.label('ID:', artifact.id)}`);
    console.log(`  ${fmt.label('Type:', artifact.type)}  │  ${fmt.label('Status:', artifact.status)}`);
    console.log(`  ${fmt.label('Created:', artifact.created_at)}`);
    console.log(`  ${fmt.label('Tick:', fmt.shortId(artifact.tick_id))}`);
    console.log(`\n${fmt.dim('─── content ───')}\n`);
    console.log(artifact.content);
    console.log();
    return;
  }

  // ── List view ───────────────────────────────────────────────
  const limit = parseInt(opts.limit ?? '20', 10);
  const artifacts = ctx.artifactRepo.listByIdentity(identity.id, {
    type: opts.type,
    status: opts.status,
    limit,
  });

  if (artifacts.length === 0) {
    console.log(fmt.dim('\nNo artifacts found.'));
    console.log();
    return;
  }

  console.log(
    `\n${fmt.bold(`Artifacts: ${identity.name}`)} ${fmt.dim(`(${artifacts.length})`)}\n`,
  );

  const rows = artifacts.map((a) => [
    fmt.shortId(a.id),
    a.type,
    (a.title ?? '').slice(0, 35),
    a.status,
    a.created_at.slice(0, 19),
  ]);

  console.log(table(['ID', 'TYPE', 'TITLE', 'STATUS', 'CREATED'], rows));
  console.log(
    `\n${fmt.dim('Use --show <id> to view content.')}`,
  );
  console.log();
}
