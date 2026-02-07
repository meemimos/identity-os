#!/usr/bin/env node
/**
 * identityos — CLI for operating Identity.OS via OpenClaw.
 *
 * Commands:
 *   create          Create a new identity from JSON or workspace
 *   tick [id]       Run a single tick
 *   run <action>    Start / stop scheduled ticks
 *   status [id]     Show identity state
 *   logs [id]       View log entries
 *   artifacts [id]  List generated artifacts
 */
import { Command } from 'commander';
import {
  createCommand,
  tickCommand,
  runCommand,
  statusCommand,
  logsCommand,
  artifactsCommand,
} from './commands/index.js';

const program = new Command()
  .name('identityos')
  .description('Identity.OS adapter for OpenClaw — operate living characters')
  .version('0.1.0');

// ── create ──────────────────────────────────────────────────────

program
  .command('create')
  .description('Create a new identity')
  .option('--from-file <path>', 'Path to onboarding JSON file')
  .option('--from-workspace', 'Import from OpenClaw workspace (SOUL.md + IDENTITY.md)')
  .option('--name <name>', 'Override identity name')
  .option('--owner <owner>', 'Set owner name')
  .action(createCommand);

// ── tick ────────────────────────────────────────────────────────

program
  .command('tick [id]')
  .description('Run a single tick of the character lifecycle')
  .option('-v, --verbose', 'Show detailed decision output')
  .action(tickCommand);

// ── run ─────────────────────────────────────────────────────────

program
  .command('run <action> [id]')
  .description('Start or stop scheduled ticks (action: start | stop | remove)')
  .option('--interval <minutes>', 'Tick interval in minutes (default: 5)', '5')
  .option('--tz <timezone>', 'Timezone for scheduling (default: UTC)')
  .action(runCommand);

// ── status ──────────────────────────────────────────────────────

program
  .command('status [id]')
  .description('Show current identity state')
  .action(statusCommand);

// ── logs ────────────────────────────────────────────────────────

program
  .command('logs [id]')
  .description('View identity log entries')
  .option('-d, --deep', 'Include deep (internal) log entries')
  .option('-l, --limit <n>', 'Number of entries to show', '30')
  .option('-t, --tail', 'Show latest entries (ignores level filter)')
  .option('--phase <phase>', 'Filter by phase (live|decide|express|remember)')
  .option('--since <iso>', 'Entries after this ISO timestamp')
  .action(logsCommand);

// ── artifacts ───────────────────────────────────────────────────

program
  .command('artifacts [id]')
  .description('List generated artifacts')
  .option('--type <type>', 'Filter by artifact type')
  .option('--status <status>', 'Filter by status')
  .option('-l, --limit <n>', 'Number of entries to show', '20')
  .option('--show <id>', 'Show full content of a specific artifact')
  .action(artifactsCommand);

// ── Parse & run ─────────────────────────────────────────────────

program.parse();
