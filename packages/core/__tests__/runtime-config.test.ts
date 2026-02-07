import { describe, it, expect } from 'vitest';
import { RuntimeConfig, CadenceConfig, BudgetConfig, ApprovalConfig } from '../src/runtime-config.js';
import { pennyRuntimeConfig } from '../examples/penny.js';

describe('CadenceConfig', () => {
  it('applies defaults', () => {
    const c = CadenceConfig.parse({});
    expect(c.tick_interval_sec).toBe(300);
    expect(c.jitter_sec).toBe(60);
    expect(c.active_hours).toBeNull();
  });

  it('rejects negative interval', () => {
    expect(() => CadenceConfig.parse({ tick_interval_sec: -1 })).toThrow();
  });

  it('rejects zero interval', () => {
    expect(() => CadenceConfig.parse({ tick_interval_sec: 0 })).toThrow();
  });

  it('accepts active hours', () => {
    const c = CadenceConfig.parse({
      active_hours: { start: 8, end: 22, timezone: 'America/Los_Angeles' },
    });
    expect(c.active_hours!.start).toBe(8);
  });

  it('rejects hour > 23', () => {
    expect(() =>
      CadenceConfig.parse({ active_hours: { start: 25, end: 22 } }),
    ).toThrow();
  });
});

describe('BudgetConfig', () => {
  it('applies defaults', () => {
    const b = BudgetConfig.parse({});
    expect(b.max_posts_per_day).toBe(10);
    expect(b.max_tokens_per_tick).toBe(4000);
    expect(b.max_skills_per_tick).toBe(2);
  });

  it('rejects zero budget', () => {
    expect(() => BudgetConfig.parse({ max_posts_per_day: 0 })).toThrow();
  });
});

describe('ApprovalConfig', () => {
  it('applies defaults', () => {
    const a = ApprovalConfig.parse({});
    expect(a.require_approval_for).toEqual(['publish', 'spend']);
    expect(a.auto_approve).toEqual(['draft', 'reflect', 'idle']);
  });

  it('rejects unknown approval action', () => {
    expect(() =>
      ApprovalConfig.parse({ require_approval_for: ['yolo'] }),
    ).toThrow();
  });
});

describe('RuntimeConfig', () => {
  it('validates Penny example', () => {
    const result = RuntimeConfig.parse(pennyRuntimeConfig);
    expect(result.cadence.tick_interval_sec).toBe(300);
    expect(result.budgets.max_posts_per_day).toBe(4);
    expect(result.approvals.require_approval_for).toContain('publish');
  });

  it('builds config with all defaults', () => {
    const defaults = RuntimeConfig.parse({
      cadence: {},
      budgets: {},
      approvals: {},
    });
    expect(defaults.cadence.tick_interval_sec).toBe(300);
    expect(defaults.budgets.max_posts_per_day).toBe(10);
  });
});
