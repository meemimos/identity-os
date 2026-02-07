/**
 * @identity-os/skills — pluggable skill system for character expression.
 *
 * Skills are platform-agnostic content factories.  Each produces
 * multiple artifacts, memory patches, follow-up actions, and logs.
 */

export type {
  Skill,
  SkillManifest,
  SkillInput,
  SkillOutput,
  ArtifactDraft,
  NextActionDraft,
  MemoryPatch,
  LogDraft,
} from './types.js';

export { SkillRegistry } from './registry.js';

export {
  dayInMyLifeSkill,
  reflectionSkill,
  routineSkill,
  idleSkill,
  registerBuiltins,
} from './builtins/index.js';
