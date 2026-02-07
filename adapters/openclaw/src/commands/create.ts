/**
 * identityos create — onboard a new identity from JSON or workspace files.
 *
 * Creates the identity record, seeds initial memory with onboarding
 * intents, and writes the genesis snapshot (v1).
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { IDENTITY_OS_VERSION, SCHEMA_VERSION } from '@identity-os/core';
import type { Identity, MemoryState, ActiveIntent } from '@identity-os/core';
import { getContext } from '../context.js';
import { parseWorkspace, type OnboardingData } from '../sync.js';
import { fmt } from '../format.js';

// ── Hash helpers (replicated from runtime/remember.ts) ──────────

function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const sorted = Object.keys(obj as Record<string, unknown>).sort();
  return (
    '{' +
    sorted
      .map(
        (k) =>
          JSON.stringify(k) +
          ':' +
          stableStringify((obj as Record<string, unknown>)[k]),
      )
      .join(',') +
    '}'
  );
}

function contentHash(payload: Record<string, unknown>): string {
  return `sha256:${createHash('sha256').update(stableStringify(payload)).digest('hex')}`;
}

// ── Command ─────────────────────────────────────────────────────

export async function createCommand(opts: {
  fromFile?: string;
  fromWorkspace?: boolean;
  name?: string;
  owner?: string;
}): Promise<void> {
  // ── Load onboarding data ────────────────────────────────────
  let data: OnboardingData;

  if (opts.fromFile) {
    if (!fs.existsSync(opts.fromFile)) {
      console.error(`File not found: ${opts.fromFile}`);
      process.exit(1);
    }
    data = JSON.parse(fs.readFileSync(opts.fromFile, 'utf-8'));
  } else if (opts.fromWorkspace) {
    data = parseWorkspace();
  } else {
    console.error('Provide --from-file <path> or --from-workspace');
    process.exit(1);
  }

  // Override with explicit flags
  if (opts.name) data.name = opts.name;
  if (opts.owner) data.owner = opts.owner;

  const ctx = getContext({
    max_actions_per_day: data.runtime?.max_actions_per_day,
    max_ticks_per_hour: data.runtime?.max_ticks_per_hour,
  });

  const now = new Date().toISOString();
  const identityId = crypto.randomUUID();

  // ── Build Identity ──────────────────────────────────────────
  const identity: Identity = {
    identity_os_version: IDENTITY_OS_VERSION,
    schema_version: SCHEMA_VERSION,
    id: identityId,
    name: data.name,
    status: 'active',
    version: 0,
    latest_snapshot_id: null,
    soul: {
      traits: data.soul.traits,
      voice: data.soul.voice,
      constitution: data.soul.constitution,
      vibe: data.soul.vibe,
    },
    created_at: now,
    updated_at: now,
  };

  ctx.identityRepo.create(identity, data.owner);

  // ── Build initial memory state ──────────────────────────────
  const intents: ActiveIntent[] = (data.intents ?? []).map((i) => ({
    id: crypto.randomUUID(),
    label: i.label,
    description: i.description ?? '',
    priority: i.priority ?? 'medium',
    status: 'active' as const,
    created_at: now,
    updated_at: now,
  }));

  const memory: MemoryState = {
    active_intents: intents,
    next_actions: [],
    continuity: {
      last_tick_id: null,
      last_tick_at: null,
      tick_count: 0,
      last_mood: null,
      running_summary: null,
    },
  };

  // ── Genesis snapshot ────────────────────────────────────────
  const payload: Record<string, unknown> = {
    identity: {
      name: identity.name,
      soul: identity.soul,
      status: identity.status,
    },
    memory,
    tick_id: null,
    timestamp: now,
  };

  const hash = contentHash(payload);
  const snapshotId = crypto.randomUUID();

  ctx.snapshotRepo.create(
    {
      identity_os_version: IDENTITY_OS_VERSION,
      schema_version: SCHEMA_VERSION,
      id: snapshotId,
      identity_id: identityId,
      version: 1,
      content_hash: hash,
      parent_hash: null,
      payload,
      created_at: now,
    },
    null,
  );

  ctx.identityRepo.updateLatestSnapshot(identityId, snapshotId, 1, now);

  // ── Output ──────────────────────────────────────────────────
  console.log(fmt.bold('\nIdentity created'));
  console.log(`  ${fmt.label('ID:', identityId)}`);
  console.log(`  ${fmt.label('Name:', data.name)}`);
  console.log(`  ${fmt.label('Owner:', data.owner ?? '(none)')}`);
  console.log(
    `  ${fmt.label('Traits:', String(data.soul.traits.length))}  ${fmt.label('Constitution:', String(data.soul.constitution.length))}`,
  );
  console.log(
    `  ${fmt.label('Intents:', intents.map((i) => i.label).join(', ') || '(none)')}`,
  );
  console.log(`  ${fmt.label('Snapshot:', `v1 ${hash.slice(0, 30)}...`)}`);
  console.log();
}
