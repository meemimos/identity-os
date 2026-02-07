/**
 * @identity-os/storage — SQLite-backed persistence for Identity.OS.
 *
 * Provides a createDatabase() factory and typed repositories for
 * identities, snapshots, artifacts, and log entries.
 */

export { createDatabase, type StorageOptions } from './db.js';

export type {
  StoredIdentity,
  StoredSnapshot,
  StoredArtifact,
  StoredLogEvent,
} from './types.js';

export {
  IdentityRepo,
  SnapshotRepo,
  ArtifactRepo,
  LogRepo,
  type ArtifactListOptions,
  type LogQueryOptions,
} from './repositories/index.js';

export { migrations, runMigrations } from './migrations/index.js';
