/**
 * SkillRegistry — register, lookup, and list available skills.
 */
import type { Skill } from './types.js';

export class SkillRegistry {
  private skills = new Map<string, Skill>();

  register(skill: Skill): void {
    if (this.skills.has(skill.manifest.id)) {
      throw new Error(`Skill already registered: ${skill.manifest.id}`);
    }
    this.skills.set(skill.manifest.id, skill);
  }

  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  has(id: string): boolean {
    return this.skills.has(id);
  }

  list(): Skill[] {
    return [...this.skills.values()];
  }

  unregister(id: string): boolean {
    return this.skills.delete(id);
  }

  clear(): void {
    this.skills.clear();
  }
}
