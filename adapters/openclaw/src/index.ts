/**
 * @identity-os/openclaw-adapter
 *
 * Bridges Identity.OS ↔ OpenClaw.
 * CLI entry point: ./cli.ts
 */
export { getContext, resolveIdentity } from './context.js';
export {
  createCommand,
  tickCommand,
  runCommand,
  statusCommand,
  logsCommand,
  artifactsCommand,
} from './commands/index.js';
export { parseWorkspace, type OnboardingData } from './sync.js';
export { createTickJob, setJobEnabled, findJob, removeJob } from './cron.js';
