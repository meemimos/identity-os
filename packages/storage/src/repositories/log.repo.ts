/**
 * LogRepo — append-mostly log entries (public + deep).
 *
 * Supports append, query with filters, and tail (latest N).
 */
import type Database from 'better-sqlite3';
import type { LogEvent, LogLevel, TickPhase } from '@identity-os/core';
import type { StoredLogEvent, LogRow } from '../types.js';

export interface LogQueryOptions {
  level?: LogLevel;
  phase?: TickPhase;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}

export class LogRepo {
  constructor(private db: Database.Database) {}

  // ── Append ──────────────────────────────────────────────────────

  append(event: LogEvent): StoredLogEvent {
    this.db.prepare(`
      INSERT INTO log_entries
        (id, identity_id, tick_id, phase, level, reason_code,
         rationale, message, payload_ref, created_at)
      VALUES
        (@id, @identity_id, @tick_id, @phase, @level, @reason_code,
         @rationale, @message, @payload_ref, @created_at)
    `).run({
      id: event.id,
      identity_id: event.identity_id,
      tick_id: event.tick_id,
      phase: event.phase,
      level: event.level,
      reason_code: event.reason_code ?? null,
      rationale: event.rationale ?? null,
      message: event.message,
      payload_ref: event.payload_ref ?? null,
      created_at: event.created_at,
    });
    return this.findById(event.id)!;
  }

  // ── Read ────────────────────────────────────────────────────────

  findById(id: string): StoredLogEvent | null {
    const row = this.db
      .prepare('SELECT * FROM log_entries WHERE id = ?')
      .get(id) as LogRow | undefined;
    return row ? this.toStored(row) : null;
  }

  // ── Query (filtered) ───────────────────────────────────────────

  query(identityId: string, opts: LogQueryOptions = {}): StoredLogEvent[] {
    const clauses = ['identity_id = ?'];
    const params: unknown[] = [identityId];

    if (opts.level) {
      clauses.push('level = ?');
      params.push(opts.level);
    }
    if (opts.phase) {
      clauses.push('phase = ?');
      params.push(opts.phase);
    }
    if (opts.since) {
      clauses.push('created_at >= ?');
      params.push(opts.since);
    }
    if (opts.until) {
      clauses.push('created_at <= ?');
      params.push(opts.until);
    }

    let sql = `SELECT * FROM log_entries WHERE ${clauses.join(' AND ')} ORDER BY created_at ASC`;

    if (opts.limit) {
      sql += ' LIMIT ?';
      params.push(opts.limit);
    }
    if (opts.offset) {
      sql += ' OFFSET ?';
      params.push(opts.offset);
    }

    const rows = this.db.prepare(sql).all(...params) as LogRow[];
    return rows.map((r) => this.toStored(r));
  }

  // ── Tail (latest N) ────────────────────────────────────────────

  tail(identityId: string, limit = 20): StoredLogEvent[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM (
          SELECT * FROM log_entries
          WHERE identity_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        ) sub ORDER BY created_at ASC
      `)
      .all(identityId, limit) as LogRow[];
    return rows.map((r) => this.toStored(r));
  }

  // ── Count by tick ──────────────────────────────────────────────

  countByTick(tickId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as cnt FROM log_entries WHERE tick_id = ?')
      .get(tickId) as { cnt: number };
    return row.cnt;
  }

  // ── Internal ────────────────────────────────────────────────────

  private toStored(row: LogRow): StoredLogEvent {
    return {
      id: row.id,
      identity_id: row.identity_id,
      tick_id: row.tick_id,
      phase: row.phase as LogEvent['phase'],
      level: row.level as LogEvent['level'],
      reason_code: row.reason_code as LogEvent['reason_code'],
      rationale: row.rationale,
      message: row.message,
      payload_ref: row.payload_ref,
      created_at: row.created_at,
    };
  }
}
