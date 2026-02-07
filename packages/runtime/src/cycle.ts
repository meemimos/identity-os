/**
 * RuntimeCycle — the main tick orchestrator.
 *
 * Drives the character lifecycle:  Live → Decide → Express → Remember.
 *
 * Accepts repos + skills via dependency injection.  All state lives
 * in the database; the cycle is stateless between ticks.
 */
import type {
  IdentityRepo,
  SnapshotRepo,
  ArtifactRepo,
  LogRepo,
} from '@identity-os/storage';
import type { SkillRegistry } from '@identity-os/skills';
import type { RuntimeOptions, TickResult } from './types.js';
import type { LLMProvider } from './llm-provider.js';
import { live } from './phases/live.js';
import { decide } from './phases/decide.js';
import { express } from './phases/express.js';
import { remember } from './phases/remember.js';

export interface RuntimeDeps {
  identityRepo: IdentityRepo;
  snapshotRepo: SnapshotRepo;
  artifactRepo: ArtifactRepo;
  logRepo: LogRepo;
  skillRegistry: SkillRegistry;
  llm?: LLMProvider;
}

const DEFAULT_OPTIONS: RuntimeOptions = {
  limits: {
    max_actions_per_day: 20,
    max_ticks_per_hour: 12,
  },
  snapshot_every: 1,
};

export class RuntimeCycle {
  private deps: RuntimeDeps;
  private options: RuntimeOptions;

  constructor(deps: RuntimeDeps, options?: Partial<RuntimeOptions>) {
    this.deps = deps;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Run a single tick of the character lifecycle.
   *
   * Live → Decide → Express (if action) → Remember
   *
   * Returns the full tick result including decision, artifacts,
   * log entries, and snapshot (if created).
   */
  async tick(identityId: string): Promise<TickResult> {
    const clock = this.options.clock ?? (() => new Date());
    const now = clock();
    const nowISO = now.toISOString();
    const tickId = crypto.randomUUID();
    const start = Date.now();

    // ── LIVE ────────────────────────────────────────────────
    const perception = live(identityId, tickId, nowISO, this.deps, this.options.limits);

    // ── DECIDE ──────────────────────────────────────────────
    const decision = await decide(perception, this.deps.llm);

    // ── EXPRESS (only if action ≠ NOP) ──────────────────────
    let skillOutput = null;
    if (decision.action !== 'nop' && decision.skill_id) {
      skillOutput = await express(
        perception.identity,
        perception.memory,
        decision,
        tickId,
        nowISO,
        this.deps.skillRegistry,
        this.deps.llm,
      );
    }

    // ── REMEMBER ────────────────────────────────────────────
    const result = remember(
      perception,
      decision,
      skillOutput,
      this.deps,
      this.options.snapshot_every,
    );

    return {
      tick_id: tickId,
      identity_id: identityId,
      decision,
      artifacts: result.artifacts,
      logs: result.logs,
      snapshot: result.snapshot,
      duration_ms: Date.now() - start,
    };
  }
}
