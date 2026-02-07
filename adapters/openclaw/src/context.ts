/**
 * Shared context — database + repos + skill registry.
 *
 * Every command calls getContext() to get a wired-up set of repos
 * and the runtime cycle, all backed by the same SQLite database.
 */
import {
  createDatabase,
  IdentityRepo,
  SnapshotRepo,
  ArtifactRepo,
  LogRepo,
} from '@identity-os/storage';
import { SkillRegistry, registerBuiltins } from '@identity-os/skills';
import { RuntimeCycle } from '@identity-os/runtime';
import type { AutonomyLimits } from '@identity-os/runtime';
import type { StoredIdentity } from '@identity-os/storage';
import { DB_PATH } from './paths.js';

export interface AppContext {
  identityRepo: IdentityRepo;
  snapshotRepo: SnapshotRepo;
  artifactRepo: ArtifactRepo;
  logRepo: LogRepo;
  skillRegistry: SkillRegistry;
  cycle: RuntimeCycle;
}

export function getContext(
  limits?: Partial<AutonomyLimits>,
): AppContext {
  const db = createDatabase({ path: DB_PATH });

  const identityRepo = new IdentityRepo(db);
  const snapshotRepo = new SnapshotRepo(db);
  const artifactRepo = new ArtifactRepo(db);
  const logRepo = new LogRepo(db);

  const skillRegistry = new SkillRegistry();
  registerBuiltins(skillRegistry);

  const cycle = new RuntimeCycle(
    { identityRepo, snapshotRepo, artifactRepo, logRepo, skillRegistry },
    {
      limits: {
        max_actions_per_day: limits?.max_actions_per_day ?? 20,
        max_ticks_per_hour: limits?.max_ticks_per_hour ?? 12,
      },
      snapshot_every: 1,
    },
  );

  return { identityRepo, snapshotRepo, artifactRepo, logRepo, skillRegistry, cycle };
}

/**
 * Resolve an identity by UUID, name substring, or auto-detect
 * when there's only one.
 */
export function resolveIdentity(
  idOrName: string | undefined,
  repo: IdentityRepo,
): StoredIdentity {
  if (idOrName) {
    const byId = repo.findById(idOrName);
    if (byId) return byId;
    const all = repo.list();
    const byName = all.find(
      (i) => i.name.toLowerCase().includes(idOrName.toLowerCase()),
    );
    if (byName) return byName;
    console.error(`Identity not found: ${idOrName}`);
    process.exit(1);
  }
  const all = repo.list();
  if (all.length === 0) {
    console.error('No identities found. Run "identityos create" first.');
    process.exit(1);
  }
  if (all.length === 1) return all[0];
  console.error(
    `Multiple identities. Specify one: ${all.map((i) => `${i.name} (${i.id.slice(0, 8)})`).join(', ')}`,
  );
  process.exit(1);
}
