/**
 * Skill system types — v2.
 *
 * Skills are platform-agnostic content factories.  Each skill takes
 * identity context and produces multiple artifacts, memory patches,
 * follow-up actions, and structured log drafts.
 *
 * run() may return synchronously or as a Promise — the runtime
 * normalises both via `await Promise.resolve(skill.run(input))`.
 */
import type {
  Identity,
  MemoryState,
  ArtifactType,
  LogLevel,
  ReasonCode,
} from '@identity-os/core';

// ── Skill manifest ──────────────────────────────────────────────

export interface SkillManifest {
  id: string;
  name: string;
  description: string;
  /** Minimum seconds between invocations (0 = no cooldown). */
  cooldown_sec: number;
}

// ── Skill input (provided by the runtime) ───────────────────────

export interface SkillInput {
  identity: Identity;
  memory: MemoryState;
  tick_id: string;
  timestamp: string;
  /** Skill-specific parameters from the decision or operator. */
  params?: Record<string, unknown>;
  /**
   * Optional text generator (injected when an LLM provider is wired).
   * Skills should fall back to templates when this is absent.
   */
  generate?: (prompt: string) => Promise<string>;
}

// ── Artifact draft (skills produce zero or more) ────────────────

export interface ArtifactDraft {
  type: ArtifactType;
  title: string | null;
  content: string;
  platform: string | null;
  metadata: Record<string, unknown>;
}

// ── Next-action draft (skills can queue follow-ups) ─────────────

export interface NextActionDraft {
  action: string;
  skill_id: string | null;
  earliest_at: string | null;
}

// ── Memory patch (partial updates applied in Remember phase) ────

export interface MemoryPatch {
  mood?: string;
  running_summary?: string;
  add_intents?: Array<{
    label: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
  }>;
  complete_intents?: string[];
}

// ── Log draft (skills emit structured log entries) ──────────────

export interface LogDraft {
  level: LogLevel;
  message: string;
  reason_code?: ReasonCode;
  rationale?: string;
}

// ── Skill output ────────────────────────────────────────────────

export interface SkillOutput {
  artifacts: ArtifactDraft[];
  next_actions: NextActionDraft[];
  memory_patch: MemoryPatch;
  logs: LogDraft[];
  outcome: 'success' | 'partial' | 'failed';
}

// ── Skill interface ─────────────────────────────────────────────

export interface Skill {
  manifest: SkillManifest;
  run(input: SkillInput): SkillOutput | Promise<SkillOutput>;
}
