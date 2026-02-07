/**
 * Register all built-in skills on a registry instance.
 */
import type { SkillRegistry } from '../registry.js';
import { dayInMyLifeSkill } from './day-in-my-life.js';
import { reflectionSkill } from './reflection.js';
import { routineSkill } from './routine.js';
import { idleSkill } from './idle.js';

export { dayInMyLifeSkill, reflectionSkill, routineSkill, idleSkill };

export function registerBuiltins(registry: SkillRegistry): void {
  registry.register(dayInMyLifeSkill);
  registry.register(reflectionSkill);
  registry.register(routineSkill);
  registry.register(idleSkill);
}
