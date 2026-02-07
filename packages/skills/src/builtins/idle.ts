/**
 * Idle skill — conscious do-nothing.
 *
 * Produces no artifacts.  The character is alive and chose inaction.
 * This is different from NOP at the decide level — idle is a
 * deliberate skill execution that went through the Express phase.
 */
import type { Skill, SkillInput, SkillOutput } from '../types.js';

export const idleSkill: Skill = {
  manifest: {
    id: 'idle',
    name: 'Idle',
    description: 'Conscious inaction — alive but choosing not to act',
    cooldown_sec: 0,
  },

  run(_input: SkillInput): SkillOutput {
    return {
      artifacts: [],
      next_actions: [],
      memory_patch: {},
      logs: [
        {
          level: 'public',
          message: 'Consciously idling — alive, choosing stillness',
        },
      ],
      outcome: 'success',
    };
  },
};
