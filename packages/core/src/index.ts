/**
 * @identity-os/core — canonical types + Zod schemas for Identity.OS
 *
 * Zero runtime dependencies beyond zod.  Every other @identity-os/*
 * package imports domain types from here.
 */

// ── Shared primitives & versioning ──────────────────────────────
export {
  UUID,
  ISOTimestamp,
  SemanticVersion,
  VersionHeader,
  IDENTITY_OS_VERSION,
  SCHEMA_VERSION,
} from './common.js';

// ── Body ────────────────────────────────────────────────────────
export { BodyType, Body } from './body.js';

// ── Binding ─────────────────────────────────────────────────────
export { Binding } from './binding.js';

// ── Identity.Core (Soul) ────────────────────────────────────────
export {
  Trait,
  VoiceConfig,
  Soul,
  IdentityStatus,
  Identity,
} from './identity.js';

// ── Identity.Memory ─────────────────────────────────────────────
export {
  IntentPriority,
  IntentStatus,
  ActiveIntent,
  NextAction,
  Continuity,
  EpisodicEntry,
  SemanticCategory,
  SemanticEntry,
  MemoryState,
} from './memory.js';

// ── Identity.Runtime config ─────────────────────────────────────
export {
  ActiveHours,
  CadenceConfig,
  BudgetConfig,
  ApprovalAction,
  AutoApproveAction,
  ApprovalConfig,
  RuntimeConfig,
} from './runtime-config.js';

// ── Identity.Platform ───────────────────────────────────────────
export {
  PlatformType,
  Aesthetic,
  PostingRules,
  PlatformProfile,
} from './platform.js';

// ── Identity.Artifacts ──────────────────────────────────────────
export {
  ArtifactType,
  ArtifactStatus,
  Artifact,
} from './artifact.js';

// ── Identity.Log ────────────────────────────────────────────────
export {
  LogLevel,
  TickPhase,
  ReasonCode,
  LogEvent,
} from './log.js';

// ── Snapshots ───────────────────────────────────────────────────
export { SnapshotEnvelope } from './snapshot.js';
