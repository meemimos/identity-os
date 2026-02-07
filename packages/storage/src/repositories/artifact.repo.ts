/**
 * ArtifactRepo — CRUD for generated artifacts (scripts, captions, etc.).
 *
 * Content is stored inline.  The content_uri column is reserved for
 * future S3/IPFS offloading — NULL means content is local.
 */
import type Database from 'better-sqlite3';
import type { Artifact, ArtifactStatus } from '@identity-os/core';
import type { StoredArtifact, ArtifactRow } from '../types.js';

export interface ArtifactListOptions {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export class ArtifactRepo {
  constructor(private db: Database.Database) {}

  // ── Create ──────────────────────────────────────────────────────

  create(artifact: Artifact, contentUri?: string | null): StoredArtifact {
    this.db.prepare(`
      INSERT INTO artifacts
        (id, identity_id, tick_id, type, title, content, content_uri,
         platform, status, metadata, created_at, published_at)
      VALUES
        (@id, @identity_id, @tick_id, @type, @title, @content, @content_uri,
         @platform, @status, @metadata, @created_at, @published_at)
    `).run({
      id: artifact.id,
      identity_id: artifact.identity_id,
      tick_id: artifact.tick_id,
      type: artifact.type,
      title: artifact.title ?? null,
      content: artifact.content,
      content_uri: contentUri ?? null,
      platform: artifact.platform ?? null,
      status: artifact.status,
      metadata: JSON.stringify(artifact.metadata),
      created_at: artifact.created_at,
      published_at: artifact.published_at ?? null,
    });
    return this.findById(artifact.id)!;
  }

  // ── Read ────────────────────────────────────────────────────────

  findById(id: string): StoredArtifact | null {
    const row = this.db
      .prepare('SELECT * FROM artifacts WHERE id = ?')
      .get(id) as ArtifactRow | undefined;
    return row ? this.toStored(row) : null;
  }

  listByIdentity(
    identityId: string,
    opts: ArtifactListOptions = {},
  ): StoredArtifact[] {
    const clauses = ['identity_id = ?'];
    const params: unknown[] = [identityId];

    if (opts.type) {
      clauses.push('type = ?');
      params.push(opts.type);
    }
    if (opts.status) {
      clauses.push('status = ?');
      params.push(opts.status);
    }

    let sql = `SELECT * FROM artifacts WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC`;

    if (opts.limit) {
      sql += ` LIMIT ?`;
      params.push(opts.limit);
    }
    if (opts.offset) {
      sql += ` OFFSET ?`;
      params.push(opts.offset);
    }

    const rows = this.db.prepare(sql).all(...params) as ArtifactRow[];
    return rows.map((r) => this.toStored(r));
  }

  // ── Update ──────────────────────────────────────────────────────

  updateStatus(
    id: string,
    status: ArtifactStatus,
    publishedAt?: string | null,
  ): void {
    const info = this.db
      .prepare(
        'UPDATE artifacts SET status = ?, published_at = ? WHERE id = ?',
      )
      .run(status, publishedAt ?? null, id);
    if (info.changes === 0) throw new Error(`Artifact not found: ${id}`);
  }

  // ── Delete ──────────────────────────────────────────────────────

  delete(id: string): boolean {
    const info = this.db
      .prepare('DELETE FROM artifacts WHERE id = ?')
      .run(id);
    return info.changes > 0;
  }

  // ── Internal ────────────────────────────────────────────────────

  private toStored(row: ArtifactRow): StoredArtifact {
    return {
      id: row.id,
      identity_id: row.identity_id,
      tick_id: row.tick_id,
      type: row.type as Artifact['type'],
      title: row.title,
      content: row.content,
      content_uri: row.content_uri,
      platform: row.platform,
      status: row.status as Artifact['status'],
      metadata: JSON.parse(row.metadata),
      created_at: row.created_at,
      published_at: row.published_at,
    };
  }
}
