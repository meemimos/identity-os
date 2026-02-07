/**
 * Read/write OpenClaw cron jobs for Identity.OS tick scheduling.
 */
import fs from 'node:fs';
import { CRON_FILE, CLI_PATH } from './paths.js';

// ── Types matching OpenClaw cron format ─────────────────────────

interface CronSchedule {
  kind: 'cron';
  expr: string;
  tz: string;
}

interface CronPayload {
  kind: 'agentTurn';
  message: string;
  timeoutSeconds: number;
}

interface CronJob {
  id: string;
  agentId: string;
  name: string;
  enabled: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  schedule: CronSchedule;
  sessionTarget: string;
  wakeMode: string;
  payload: CronPayload;
  state?: Record<string, unknown>;
}

interface CronFile {
  version: number;
  jobs: CronJob[];
}

// ── Helpers ─────────────────────────────────────────────────────

function readCronFile(): CronFile {
  if (!fs.existsSync(CRON_FILE)) {
    return { version: 1, jobs: [] };
  }
  return JSON.parse(fs.readFileSync(CRON_FILE, 'utf-8')) as CronFile;
}

function writeCronFile(data: CronFile): void {
  fs.writeFileSync(CRON_FILE, JSON.stringify(data, null, 2) + '\n');
}

const JOB_TAG = 'identity-os:';

function jobTag(identityId: string): string {
  return `${JOB_TAG}${identityId}`;
}

// ── Public API ──────────────────────────────────────────────────

export function findJob(identityId: string): CronJob | undefined {
  const file = readCronFile();
  return file.jobs.find(
    (j) => j.name.startsWith(JOB_TAG) && j.name.includes(identityId),
  );
}

export function createTickJob(
  identityId: string,
  displayName: string,
  intervalMin: number,
  timezone = 'UTC',
): CronJob {
  const file = readCronFile();

  // Remove existing job for this identity
  file.jobs = file.jobs.filter(
    (j) => !(j.name.startsWith(JOB_TAG) && j.name.includes(identityId)),
  );

  const now = Date.now();
  const job: CronJob = {
    id: crypto.randomUUID(),
    agentId: 'main',
    name: `${jobTag(identityId)} ${displayName}`,
    enabled: true,
    createdAtMs: now,
    updatedAtMs: now,
    schedule: {
      kind: 'cron',
      expr: `*/${intervalMin} * * * *`,
      tz: timezone,
    },
    sessionTarget: 'isolated',
    wakeMode: 'next-heartbeat',
    payload: {
      kind: 'agentTurn',
      message: [
        `Identity.OS scheduled tick.`,
        `Run this shell command and output the result:`,
        `node ${CLI_PATH} tick ${identityId}`,
        `If it errors, report the error message.`,
      ].join('\n'),
      timeoutSeconds: 120,
    },
  };

  file.jobs.push(job);
  writeCronFile(file);
  return job;
}

export function setJobEnabled(identityId: string, enabled: boolean): boolean {
  const file = readCronFile();
  const job = file.jobs.find(
    (j) => j.name.startsWith(JOB_TAG) && j.name.includes(identityId),
  );
  if (!job) return false;
  job.enabled = enabled;
  job.updatedAtMs = Date.now();
  writeCronFile(file);
  return true;
}

export function removeJob(identityId: string): boolean {
  const file = readCronFile();
  const before = file.jobs.length;
  file.jobs = file.jobs.filter(
    (j) => !(j.name.startsWith(JOB_TAG) && j.name.includes(identityId)),
  );
  if (file.jobs.length === before) return false;
  writeCronFile(file);
  return true;
}
