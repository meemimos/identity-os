/**
 * Database factory — creates a configured SQLite connection and runs
 * pending migrations.
 */
import Database from 'better-sqlite3';
import { runMigrations } from './migrations/index.js';

export interface StorageOptions {
  /** File path or ':memory:' (default: ':memory:') */
  path?: string;
  /** Log every SQL statement to console */
  verbose?: boolean;
}

export function createDatabase(opts: StorageOptions = {}): Database.Database {
  const db = new Database(opts.path ?? ':memory:', {
    verbose: opts.verbose ? console.log : undefined,
  });

  // Performance + safety pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  return db;
}
