/**
 * Resolve well-known OpenClaw + Identity.OS paths.
 */
import path from 'node:path';
import os from 'node:os';

const HOME = os.homedir();

export const OPENCLAW_DIR = path.join(HOME, '.openclaw');
export const WORKSPACE_DIR = path.join(OPENCLAW_DIR, 'workspace');
export const SOUL_MD = path.join(WORKSPACE_DIR, 'SOUL.md');
export const IDENTITY_MD = path.join(WORKSPACE_DIR, 'IDENTITY.md');
export const CRON_FILE = path.join(OPENCLAW_DIR, 'cron', 'jobs.json');
export const DB_PATH = path.join(OPENCLAW_DIR, 'identity-os.db');

/** Absolute path to the built CLI entry point (for cron job messages). */
export const CLI_PATH = path.resolve(
  import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname),
  'cli.js',
);
