/**
 * Remember phase — persist everything produced by this tick.
 *
 * Writes:
 *   1. Log entries (decide + express + skill-emitted + snapshot)
 *   2. All artifacts from the skill output
 *   3. Applies memory_patch + next_actions to the working memory
 *   4. Removes consumed next_action (if any)
 *   5. Snapshot (if triggered by policy)
 *   6. Updates identity's latest_snapshot_id
 */
import { createHash } from 'node:crypto';
import type { LogEvent, Artifact } from '@identity-os/core';
import type {
  IdentityRepo,
  SnapshotRepo,
  ArtifactRepo,
  LogRepo,
  StoredArtifact,
  StoredSnapshot,
  StoredLogEvent,
} from '@identity-os/storage';
import type { SkillOutput } from '@identity-os/skills';
import type { PerceptionFrame, Decision } from '../types.js';

// ── Stable JSON for content-addressable hashing ─────────────────

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
  const hash = createHash('sha256')
    .update(stableStringify(payload))
    .digest('hex');
  return `sha256:${hash}`;
}

function makeLogId(): string {
  return crypto.randomUUID();
}

// ── Remember result ─────────────────────────────────────────────

export interface RememberResult {
  logs: StoredLogEvent[];
  artifacts: StoredArtifact[];
  snapshot: StoredSnapshot | null;
}

// ── Remember ────────────────────────────────────────────────────

export function remember(
  perception: PerceptionFrame,
  decision: Decision,
  skillOutput: SkillOutput | null,
  deps: {
    identityRepo: IdentityRepo;
    snapshotRepo: SnapshotRepo;
    artifactRepo: ArtifactRepo;
    logRepo: LogRepo;
  },
  snapshotEvery: number,
): RememberResult {
  const { tick_id, timestamp, identity, memory } = perception;
  const identityId = identity.id;
  const logs: StoredLogEvent[] = [];
  const storedArtifacts: StoredArtifact[] = [];

  // ── 1. Decide-phase logs ────────────────────────────────────

  logs.push(
    deps.logRepo.append({
      id: makeLogId(),
      identity_id: identityId,
      tick_id,
      phase: 'decide',
      level: 'deep',
      reason_code: decision.reason_code,
      rationale: decision.rationale,
      message:
        decision.action === 'nop'
          ? `NOP — ${decision.reason_code}`
          : `Action: ${decision.action} (${decision.skill_id})`,
      payload_ref: null,
      created_at: timestamp,
    } satisfies LogEvent),
  );

  logs.push(
    deps.logRepo.append({
      id: makeLogId(),
      identity_id: identityId,
      tick_id,
      phase: 'decide',
      level: 'public',
      reason_code: null,
      rationale: null,
      message:
        decision.action === 'nop'
          ? 'Idle — nothing to do right now'
          : `Decided to run: ${decision.action}`,
      payload_ref: null,
      created_at: timestamp,
    } satisfies LogEvent),
  );

  // ── 2. Express-phase: artifacts + skill logs ────────────────

  if (skillOutput) {
    // Store all artifacts
    for (const draft of skillOutput.artifacts) {
      const stored = deps.artifactRepo.create({
        id: crypto.randomUUID(),
        identity_id: identityId,
        tick_id,
        type: draft.type,
        title: draft.title,
        content: draft.content,
        platform: draft.platform,
        status: 'draft',
        metadata: draft.metadata,
        created_at: timestamp,
        published_at: null,
      } satisfies Artifact);
      storedArtifacts.push(stored);
    }

    // Write skill-emitted log drafts as express-phase entries
    for (const draft of skillOutput.logs) {
      logs.push(
        deps.logRepo.append({
          id: makeLogId(),
          identity_id: identityId,
          tick_id,
          phase: 'express',
          level: draft.level,
          reason_code: draft.reason_code ?? (draft.level === 'deep' ? 'skill_executed' : null),
          rationale: draft.rationale?.slice(0, 120) ?? (draft.level === 'deep' ? draft.message.slice(0, 120) : null),
          message: draft.message,
          payload_ref: storedArtifacts[0]?.id ?? null,
          created_at: timestamp,
        } satisfies LogEvent),
      );
    }
  }

  // ── 3. Apply memory patches ─────────────────────────────────

  // Remove consumed next_action
  if (decision.consumed_action_id) {
    memory.next_actions = memory.next_actions.filter(
      (a) => a.id !== decision.consumed_action_id,
    );
  }

  if (skillOutput) {
    const patch = skillOutput.memory_patch;

    if (patch.mood) {
      memory.continuity.last_mood = patch.mood;
    }
    if (patch.running_summary) {
      memory.continuity.running_summary = patch.running_summary;
    }
    if (patch.add_intents) {
      for (const intent of patch.add_intents) {
        memory.active_intents.push({
          id: crypto.randomUUID(),
          label: intent.label,
          description: intent.description ?? '',
          priority: intent.priority ?? 'medium',
          status: 'active',
          created_at: timestamp,
          updated_at: timestamp,
        });
      }
    }
    if (patch.complete_intents) {
      for (const intentId of patch.complete_intents) {
        const intent = memory.active_intents.find((i) => i.id === intentId);
        if (intent) {
          intent.status = 'completed';
          intent.updated_at = timestamp;
        }
      }
    }

    // Add new next_actions from skill
    for (const draft of skillOutput.next_actions) {
      memory.next_actions.push({
        id: crypto.randomUUID(),
        intent_id: null,
        action: draft.action,
        skill_id: draft.skill_id,
        earliest_at: draft.earliest_at,
        created_at: timestamp,
      });
    }
  }

  // ── 4. Snapshot ─────────────────────────────────────────────

  let snapshot: StoredSnapshot | null = null;
  const tickCount = memory.continuity.tick_count;
  const existingSnap = deps.snapshotRepo.findLatest(identityId);
  const shouldSnapshot =
    !existingSnap ||
    (snapshotEvery > 0 && tickCount % snapshotEvery === 0);

  if (shouldSnapshot) {
    const newVersion = (existingSnap?.version ?? 0) + 1;
    const payload: Record<string, unknown> = {
      identity: {
        name: identity.name,
        soul: identity.soul,
        status: identity.status,
      },
      memory,
      tick_id,
      timestamp,
    };

    const hash = contentHash(payload);

    snapshot = deps.snapshotRepo.create(
      {
        identity_os_version: identity.identity_os_version,
        schema_version: identity.schema_version,
        id: crypto.randomUUID(),
        identity_id: identityId,
        version: newVersion,
        content_hash: hash,
        parent_hash: existingSnap?.content_hash ?? null,
        payload,
        created_at: timestamp,
      },
      existingSnap?.id ?? null,
    );

    deps.identityRepo.updateLatestSnapshot(
      identityId,
      snapshot.id,
      newVersion,
      timestamp,
    );

    logs.push(
      deps.logRepo.append({
        id: makeLogId(),
        identity_id: identityId,
        tick_id,
        phase: 'remember',
        level: 'deep',
        reason_code: 'snapshot_taken',
        rationale: `v${newVersion} ${hash.slice(0, 20)}...`,
        message: `Snapshot v${newVersion} created`,
        payload_ref: snapshot.id,
        created_at: timestamp,
      } satisfies LogEvent),
    );
  }

  return { logs, artifacts: storedArtifacts, snapshot };
}
