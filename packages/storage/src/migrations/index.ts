/**
 * Migration runner — simple, forward-only, safe for SQLite + Postgres.
 */
import type Database from 'better-sqlite3';
import * as m001 from './001-initial.js';

export interface Migration {
  name: string;
  up: string;
}

export const migrations: Migration[] = [m001];

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL UNIQUE,
      applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    (db.prepare('SELECT name FROM _migrations').all() as { name: string }[])
      .map((r) => r.name),
  );

  for (const m of migrations) {
    if (!applied.has(m.name)) {
      db.exec(m.up);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(m.name);
    }
  }
}
