import { describe, it, expect } from 'vitest';
import {
  dayInMyLifeSkill,
  reflectionSkill,
  routineSkill,
  idleSkill,
  registerBuiltins,
  SkillRegistry,
} from '../src/index.js';
import type { SkillInput } from '../src/types.js';
import type { Identity, MemoryState } from '@identity-os/core';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = 'a0000000-0000-0000-0000-000000000001';

function makeInput(overrides: Partial<SkillInput> = {}): SkillInput {
  const identity: Identity = {
    identity_os_version: '0.1.0',
    schema_version: '0.1.0',
    id: UID,
    name: 'Penny Larson',
    status: 'active',
    version: 1,
    latest_snapshot_id: null,
    soul: {
      traits: [{ id: 'warmth', label: 'Warmth', value: 0.85 }],
      voice: {
        tone: 'warm',
        register: 'casual',
        quirks: ['lowercase'],
        boundaries: [],
      },
      constitution: ['presence over performance'],
      vibe: 'calm & sharp',
    },
    created_at: NOW,
    updated_at: NOW,
  };

  const memory: MemoryState = {
    active_intents: [
      {
        id: UID,
        label: 'Build IG presence',
        description: '',
        priority: 'high',
        status: 'active',
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    next_actions: [],
    continuity: {
      last_tick_id: null,
      last_tick_at: null,
      tick_count: 5,
      last_mood: 'content',
      running_summary: 'Been creating content consistently.',
    },
  };

  return {
    identity,
    memory,
    tick_id: UID,
    timestamp: NOW,
    ...overrides,
  };
}

// ── day_in_my_life ──────────────────────────────────────────────

describe('dayInMyLifeSkill', () => {
  it('has correct manifest', () => {
    expect(dayInMyLifeSkill.manifest.id).toBe('day_in_my_life');
    expect(dayInMyLifeSkill.manifest.cooldown_sec).toBe(600);
  });

  it('produces 5 artifacts: 1 script + 1 shotlist + 3 captions (template)', async () => {
    const out = await dayInMyLifeSkill.run(makeInput());
    expect(out.outcome).toBe('success');
    expect(out.artifacts).toHaveLength(5);

    const types = out.artifacts.map((a) => a.type);
    expect(types.filter((t) => t === 'script')).toHaveLength(1);
    expect(types.filter((t) => t === 'shotlist')).toHaveLength(1);
    expect(types.filter((t) => t === 'caption')).toHaveLength(3);
  });

  it('script uses identity name and intent', async () => {
    const out = await dayInMyLifeSkill.run(makeInput());
    const script = out.artifacts.find((a) => a.type === 'script')!;
    expect(script.content).toContain('Penny Larson');
    expect(script.content).toContain('Build IG presence');
  });

  it('shotlist references the active intent', async () => {
    const out = await dayInMyLifeSkill.run(makeInput());
    const shotlist = out.artifacts.find((a) => a.type === 'shotlist')!;
    expect(shotlist.content).toContain('Build IG presence');
  });

  it('all artifacts are platform-agnostic (platform: null)', async () => {
    const out = await dayInMyLifeSkill.run(makeInput());
    expect(out.artifacts.every((a) => a.platform === null)).toBe(true);
  });

  it('sets memory_patch with mood and summary', async () => {
    const out = await dayInMyLifeSkill.run(makeInput());
    expect(out.memory_patch.mood).toBe('creative');
    expect(out.memory_patch.running_summary).toContain('day-in-my-life');
  });

  it('queues a next_action for review', async () => {
    const out = await dayInMyLifeSkill.run(makeInput());
    expect(out.next_actions).toHaveLength(1);
    expect(out.next_actions[0].action).toContain('Review');
  });

  it('emits public + deep logs', async () => {
    const out = await dayInMyLifeSkill.run(makeInput());
    expect(out.logs.some((l) => l.level === 'public')).toBe(true);
    expect(out.logs.some((l) => l.level === 'deep')).toBe(true);
  });

  it('uses generate() when LLM is available', async () => {
    let callCount = 0;
    const out = await dayInMyLifeSkill.run(
      makeInput({
        generate: async (_p: string) => {
          callCount++;
          return `LLM output ${callCount}`;
        },
      }),
    );
    expect(callCount).toBe(3); // script, shotlist, captions
    expect(out.artifacts[0].metadata.used_llm).toBe(true);
  });
});

// ── reflection ──────────────────────────────────────────────────

describe('reflectionSkill', () => {
  it('has correct manifest', () => {
    expect(reflectionSkill.manifest.id).toBe('reflection');
  });

  it('produces 3 artifacts: 1 narrative + 2 captions (template)', async () => {
    const out = await reflectionSkill.run(makeInput());
    expect(out.outcome).toBe('success');
    expect(out.artifacts).toHaveLength(3);

    const types = out.artifacts.map((a) => a.type);
    expect(types.filter((t) => t === 'thought')).toHaveLength(1);
    expect(types.filter((t) => t === 'caption')).toHaveLength(2);
  });

  it('narrative includes tick count and mood', async () => {
    const out = await reflectionSkill.run(makeInput());
    const narrative = out.artifacts.find((a) => a.type === 'thought')!;
    expect(narrative.content).toContain('tick #5');
    expect(narrative.content).toContain('content'); // mood
  });

  it('narrative includes running summary', async () => {
    const out = await reflectionSkill.run(makeInput());
    const narrative = out.artifacts.find((a) => a.type === 'thought')!;
    expect(narrative.content).toContain('Been creating content');
  });

  it('sets memory_patch with contemplative mood', async () => {
    const out = await reflectionSkill.run(makeInput());
    expect(out.memory_patch.mood).toBe('contemplative');
  });

  it('queues no follow-up actions', async () => {
    const out = await reflectionSkill.run(makeInput());
    expect(out.next_actions).toHaveLength(0);
  });
});

// ── routine ─────────────────────────────────────────────────────

describe('routineSkill', () => {
  it('has correct manifest', () => {
    expect(routineSkill.manifest.id).toBe('routine');
  });

  it('produces 3 artifacts: 1 script (steps) + 2 CTA captions (template)', async () => {
    const out = await routineSkill.run(makeInput());
    expect(out.outcome).toBe('success');
    expect(out.artifacts).toHaveLength(3);

    const types = out.artifacts.map((a) => a.type);
    expect(types.filter((t) => t === 'script')).toHaveLength(1);
    expect(types.filter((t) => t === 'caption')).toHaveLength(2);
  });

  it('steps use identity name and intent', async () => {
    const out = await routineSkill.run(makeInput());
    const steps = out.artifacts.find((a) => a.type === 'script')!;
    expect(steps.content).toContain('PENNY LARSON');
    expect(steps.content).toContain('BUILD IG PRESENCE');
  });

  it('CTA captions reference intent topic', async () => {
    const out = await routineSkill.run(makeInput());
    const captions = out.artifacts.filter((a) => a.type === 'caption');
    expect(captions.some((c) => c.content.includes('Build IG presence'))).toBe(true);
  });

  it('sets memory_patch with structured mood', async () => {
    const out = await routineSkill.run(makeInput());
    expect(out.memory_patch.mood).toBe('structured');
    expect(out.memory_patch.running_summary).toContain('routine');
  });

  it('queues a next_action for sharing', async () => {
    const out = await routineSkill.run(makeInput());
    expect(out.next_actions).toHaveLength(1);
    expect(out.next_actions[0].action).toContain('Share');
  });
});

// ── idle ────────────────────────────────────────────────────────

describe('idleSkill', () => {
  it('has correct manifest', () => {
    expect(idleSkill.manifest.id).toBe('idle');
    expect(idleSkill.manifest.cooldown_sec).toBe(0);
  });

  it('produces no artifacts', () => {
    const out = idleSkill.run(makeInput());
    expect(out.artifacts).toHaveLength(0);
    expect(out.outcome).toBe('success');
  });

  it('emits one public log', () => {
    const out = idleSkill.run(makeInput());
    expect(out.logs).toHaveLength(1);
    expect(out.logs[0].level).toBe('public');
    expect(out.logs[0].message).toContain('idling');
  });

  it('patches nothing', () => {
    const out = idleSkill.run(makeInput());
    expect(out.memory_patch).toEqual({});
    expect(out.next_actions).toHaveLength(0);
  });
});

// ── registerBuiltins ────────────────────────────────────────────

describe('registerBuiltins', () => {
  it('registers all four built-in skills', () => {
    const registry = new SkillRegistry();
    registerBuiltins(registry);
    expect(registry.list()).toHaveLength(4);
    expect(registry.has('day_in_my_life')).toBe(true);
    expect(registry.has('reflection')).toBe(true);
    expect(registry.has('routine')).toBe(true);
    expect(registry.has('idle')).toBe(true);
  });
});
