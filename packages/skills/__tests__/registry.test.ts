import { describe, it, expect, beforeEach } from 'vitest';
import { SkillRegistry } from '../src/registry.js';
import type { Skill } from '../src/types.js';

function makeSkill(id: string): Skill {
  return {
    manifest: {
      id,
      name: `Skill ${id}`,
      description: `Test skill ${id}`,
      cooldown_sec: 0,
    },
    run: () => ({
      artifacts: [],
      next_actions: [],
      memory_patch: {},
      logs: [{ level: 'public' as const, message: `Executed ${id}` }],
      outcome: 'success' as const,
    }),
  };
}

describe('SkillRegistry', () => {
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  it('registers and retrieves a skill', () => {
    const skill = makeSkill('test');
    registry.register(skill);
    expect(registry.get('test')).toBe(skill);
  });

  it('has() returns true for registered skills', () => {
    registry.register(makeSkill('test'));
    expect(registry.has('test')).toBe(true);
    expect(registry.has('missing')).toBe(false);
  });

  it('list() returns all registered skills', () => {
    registry.register(makeSkill('a'));
    registry.register(makeSkill('b'));
    registry.register(makeSkill('c'));
    expect(registry.list()).toHaveLength(3);
  });

  it('throws on duplicate registration', () => {
    registry.register(makeSkill('test'));
    expect(() => registry.register(makeSkill('test'))).toThrow(
      /already registered/,
    );
  });

  it('unregister removes and returns true', () => {
    registry.register(makeSkill('test'));
    expect(registry.unregister('test')).toBe(true);
    expect(registry.get('test')).toBeUndefined();
  });

  it('unregister returns false for missing skill', () => {
    expect(registry.unregister('missing')).toBe(false);
  });

  it('clear() removes all skills', () => {
    registry.register(makeSkill('a'));
    registry.register(makeSkill('b'));
    registry.clear();
    expect(registry.list()).toHaveLength(0);
  });
});
