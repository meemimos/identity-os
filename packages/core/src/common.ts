/**
 * @identity-os/core — shared primitives & versioning
 */
import { z } from 'zod';

// ── Branded primitives ──────────────────────────────────────────

export const UUID = z.string().uuid();
export type UUID = z.infer<typeof UUID>;

export const ISOTimestamp = z.string().datetime();
export type ISOTimestamp = z.infer<typeof ISOTimestamp>;

export const SemanticVersion = z.string().regex(
  /^\d+\.\d+\.\d+$/,
  'Must be a valid semver string (e.g. "0.1.0")',
);
export type SemanticVersion = z.infer<typeof SemanticVersion>;

// ── Versioning header (embedded in Identity + SnapshotEnvelope) ──

export const VersionHeader = z.object({
  identity_os_version: SemanticVersion,
  schema_version: SemanticVersion,
});
export type VersionHeader = z.infer<typeof VersionHeader>;

// ── Current versions ──

export const IDENTITY_OS_VERSION = '0.1.0' as const;
export const SCHEMA_VERSION = '0.1.0' as const;
