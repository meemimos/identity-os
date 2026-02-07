/**
 * IdentityRepo — CRUD for the identities table.
 */
import type Database from 'better-sqlite3';
import type { Identity, IdentityStatus } from '@identity-os/core';
import type { StoredIdentity, IdentityRow } from '../types.js';

export class IdentityRepo {
  constructor(private db: Database.Database) {}

  // ── Create ──────────────────────────────────────────────────────

  create(identity: Identity, owner?: string | null): StoredIdentity {
    this.db.prepare(`
      INSERT INTO identities
        (id, name, status, owner, identity_os_version, schema_version,
         version, latest_snapshot_id, soul_data, created_at, updated_at)
      VALUES
        (@id, @name, @status, @owner, @identity_os_version, @schema_version,
         @version, @latest_snapshot_id, @soul_data, @created_at, @updated_at)
    `).run({
      id: identity.id,
      name: identity.name,
      status: identity.status,
      owner: owner ?? null,
      identity_os_version: identity.identity_os_version,
      schema_version: identity.schema_version,
      version: identity.version,
      latest_snapshot_id: identity.latest_snapshot_id,
      soul_data: JSON.stringify(identity.soul),
      created_at: identity.created_at,
      updated_at: identity.updated_at,
    });
    return this.findById(identity.id)!;
  }

  // ── Read ────────────────────────────────────────────────────────

  findById(id: string): StoredIdentity | null {
    const row = this.db
      .prepare('SELECT * FROM identities WHERE id = ?')
      .get(id) as IdentityRow | undefined;
    return row ? this.toStored(row) : null;
  }

  list(): StoredIdentity[] {
    const rows = this.db
      .prepare('SELECT * FROM identities ORDER BY created_at DESC')
      .all() as IdentityRow[];
    return rows.map((r) => this.toStored(r));
  }

  // ── Update ──────────────────────────────────────────────────────

  updateStatus(id: string, status: IdentityStatus, updatedAt: string): void {
    const info = this.db
      .prepare('UPDATE identities SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, updatedAt, id);
    if (info.changes === 0) throw new Error(`Identity not found: ${id}`);
  }

  updateLatestSnapshot(
    id: string,
    snapshotId: string,
    version: number,
    updatedAt: string,
  ): void {
    const info = this.db
      .prepare(`
        UPDATE identities
        SET latest_snapshot_id = ?, version = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(snapshotId, version, updatedAt, id);
    if (info.changes === 0) throw new Error(`Identity not found: ${id}`);
  }

  // ── Delete ──────────────────────────────────────────────────────

  delete(id: string): boolean {
    const info = this.db
      .prepare('DELETE FROM identities WHERE id = ?')
      .run(id);
    return info.changes > 0;
  }

  // ── Internal ────────────────────────────────────────────────────

  private toStored(row: IdentityRow): StoredIdentity {
    return {
      id: row.id,
      name: row.name,
      status: row.status as IdentityStatus,
      owner: row.owner,
      identity_os_version: row.identity_os_version,
      schema_version: row.schema_version,
      version: row.version,
      latest_snapshot_id: row.latest_snapshot_id,
      soul: JSON.parse(row.soul_data),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
