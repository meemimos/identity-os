/**
 * SnapshotRepo — immutable, append-only soul snapshots.
 *
 * Snapshots are never updated or deleted.  Each snapshot carries a
 * content_hash (SHA-256 → future IPFS CID) and a parent_hash linking
 * to the previous snapshot in the chain.
 */
import type Database from 'better-sqlite3';
import type { SnapshotEnvelope } from '@identity-os/core';
import type { StoredSnapshot, SnapshotRow } from '../types.js';

export class SnapshotRepo {
  constructor(private db: Database.Database) {}

  // ── Create (append-only) ────────────────────────────────────────

  create(
    snapshot: SnapshotEnvelope,
    previousSnapshotId?: string | null,
  ): StoredSnapshot {
    this.db.prepare(`
      INSERT INTO soul_snapshots
        (id, identity_id, version, content_hash, parent_hash,
         previous_snapshot_id, payload, identity_os_version,
         schema_version, created_at)
      VALUES
        (@id, @identity_id, @version, @content_hash, @parent_hash,
         @previous_snapshot_id, @payload, @identity_os_version,
         @schema_version, @created_at)
    `).run({
      id: snapshot.id,
      identity_id: snapshot.identity_id,
      version: snapshot.version,
      content_hash: snapshot.content_hash,
      parent_hash: snapshot.parent_hash ?? null,
      previous_snapshot_id: previousSnapshotId ?? null,
      payload: JSON.stringify(snapshot.payload),
      identity_os_version: snapshot.identity_os_version,
      schema_version: snapshot.schema_version,
      created_at: snapshot.created_at,
    });
    return this.findById(snapshot.id)!;
  }

  // ── Read ────────────────────────────────────────────────────────

  findById(id: string): StoredSnapshot | null {
    const row = this.db
      .prepare('SELECT * FROM soul_snapshots WHERE id = ?')
      .get(id) as SnapshotRow | undefined;
    return row ? this.toStored(row) : null;
  }

  findLatest(identityId: string): StoredSnapshot | null {
    const row = this.db
      .prepare(
        'SELECT * FROM soul_snapshots WHERE identity_id = ? ORDER BY version DESC LIMIT 1',
      )
      .get(identityId) as SnapshotRow | undefined;
    return row ? this.toStored(row) : null;
  }

  listByIdentity(identityId: string): StoredSnapshot[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM soul_snapshots WHERE identity_id = ? ORDER BY version ASC',
      )
      .all(identityId) as SnapshotRow[];
    return rows.map((r) => this.toStored(r));
  }

  // ── Internal ────────────────────────────────────────────────────

  private toStored(row: SnapshotRow): StoredSnapshot {
    return {
      id: row.id,
      identity_id: row.identity_id,
      version: row.version,
      content_hash: row.content_hash,
      parent_hash: row.parent_hash,
      previous_snapshot_id: row.previous_snapshot_id,
      payload: JSON.parse(row.payload),
      identity_os_version: row.identity_os_version,
      schema_version: row.schema_version,
      created_at: row.created_at,
    };
  }
}
