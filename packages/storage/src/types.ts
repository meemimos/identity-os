/**
 * Storage-layer types — extend core domain types with DB-specific fields.
 */
import type { Identity, SnapshotEnvelope, Artifact, LogEvent } from '@identity-os/core';

/** Identity row with storage-specific `owner` field. */
export type StoredIdentity = Identity & { owner: string | null };

/** Snapshot row with direct FK link to previous snapshot. */
export type StoredSnapshot = SnapshotEnvelope & {
  previous_snapshot_id: string | null;
};

/** Artifact row with optional external storage pointer. */
export type StoredArtifact = Artifact & { content_uri: string | null };

/** Log events have no extra storage fields — re-export for symmetry. */
export type StoredLogEvent = LogEvent;

// ── Internal row types (DB column shapes) ───────────────────────

/** @internal */
export interface IdentityRow {
  id: string;
  name: string;
  status: string;
  owner: string | null;
  identity_os_version: string;
  schema_version: string;
  version: number;
  latest_snapshot_id: string | null;
  soul_data: string;
  created_at: string;
  updated_at: string;
}

/** @internal */
export interface SnapshotRow {
  id: string;
  identity_id: string;
  version: number;
  content_hash: string;
  parent_hash: string | null;
  previous_snapshot_id: string | null;
  payload: string;
  identity_os_version: string;
  schema_version: string;
  created_at: string;
}

/** @internal */
export interface ArtifactRow {
  id: string;
  identity_id: string;
  tick_id: string;
  type: string;
  title: string | null;
  content: string;
  content_uri: string | null;
  platform: string | null;
  status: string;
  metadata: string;
  created_at: string;
  published_at: string | null;
}

/** @internal */
export interface LogRow {
  id: string;
  identity_id: string;
  tick_id: string;
  phase: string;
  level: string;
  reason_code: string | null;
  rationale: string | null;
  message: string;
  payload_ref: string | null;
  created_at: string;
}
