/**
 * @identity-os/runtime — character lifecycle engine.
 *
 * Drives the tick cycle: Live → Decide → Express → Remember.
 * Stateless between ticks; all state lives in @identity-os/storage.
 */

export { RuntimeCycle, type RuntimeDeps } from './cycle.js';

export type {
  TickPhaseState,
  PerceptionFrame,
  DecisionAction,
  Decision,
  TickResult,
  AutonomyLimits,
  LimitStatus,
  RuntimeOptions,
} from './types.js';

export type { LLMProvider } from './llm-provider.js';

export { checkLimits } from './limits.js';

export { ruleBasedDecide } from './phases/decide.js';
