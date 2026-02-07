import { describe, it, expect } from 'vitest';
import { LogEvent, LogLevel, TickPhase, ReasonCode } from '../src/log.js';
import { pennyPublicLog, pennyDeepLog } from '../examples/penny.js';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = 'a0000000-0000-0000-0000-000000000001';

describe('LogLevel', () => {
  it('accepts public and deep', () => {
    expect(LogLevel.parse('public')).toBe('public');
    expect(LogLevel.parse('deep')).toBe('deep');
  });

  it('rejects unknown level', () => {
    expect(() => LogLevel.parse('verbose')).toThrow();
  });
});

describe('TickPhase', () => {
  it('accepts all phases', () => {
    for (const p of ['live', 'decide', 'express', 'remember'] as const) {
      expect(TickPhase.parse(p)).toBe(p);
    }
  });
});

describe('ReasonCode', () => {
  it('accepts NOP reason codes', () => {
    for (const r of ['nothing_notable', 'cooldown_active', 'low_energy', 'waiting', 'observing'] as const) {
      expect(ReasonCode.parse(r)).toBe(r);
    }
  });

  it('accepts action reason codes', () => {
    for (const r of ['inspiration_struck', 'signal_received', 'scheduled', 'operator_triggered'] as const) {
      expect(ReasonCode.parse(r)).toBe(r);
    }
  });

  it('accepts outcome reason codes', () => {
    for (const r of ['skill_executed', 'skill_failed', 'memory_updated', 'snapshot_taken'] as const) {
      expect(ReasonCode.parse(r)).toBe(r);
    }
  });
});

describe('LogEvent', () => {
  it('validates public log example', () => {
    const result = LogEvent.parse(pennyPublicLog);
    expect(result.level).toBe('public');
    expect(result.reason_code).toBeNull();
  });

  it('validates deep log example', () => {
    const result = LogEvent.parse(pennyDeepLog);
    expect(result.level).toBe('deep');
    expect(result.reason_code).toBe('inspiration_struck');
    expect(result.rationale).toContain("haven't posted");
  });

  it('accepts public log without reason_code', () => {
    const result = LogEvent.parse({
      id: UID,
      identity_id: UID,
      tick_id: UID,
      phase: 'decide',
      level: 'public',
      message: 'Decided to idle',
      created_at: NOW,
    });
    expect(result.reason_code).toBeNull();
    expect(result.rationale).toBeNull();
  });

  it('rejects deep log without reason_code', () => {
    expect(() =>
      LogEvent.parse({
        id: UID,
        identity_id: UID,
        tick_id: UID,
        phase: 'decide',
        level: 'deep',
        message: 'Decided to idle',
        created_at: NOW,
      }),
    ).toThrow(/reason_code/);
  });

  it('rejects deep log without rationale', () => {
    expect(() =>
      LogEvent.parse({
        id: UID,
        identity_id: UID,
        tick_id: UID,
        phase: 'decide',
        level: 'deep',
        reason_code: 'nothing_notable',
        message: 'Idling',
        created_at: NOW,
      }),
    ).toThrow(/rationale/);
  });

  it('rejects rationale over 120 chars', () => {
    expect(() =>
      LogEvent.parse({
        id: UID,
        identity_id: UID,
        tick_id: UID,
        phase: 'decide',
        level: 'deep',
        reason_code: 'nothing_notable',
        rationale: 'x'.repeat(121),
        message: 'Idling',
        created_at: NOW,
      }),
    ).toThrow();
  });

  it('rejects empty message', () => {
    expect(() =>
      LogEvent.parse({
        id: UID,
        identity_id: UID,
        tick_id: UID,
        phase: 'live',
        level: 'public',
        message: '',
        created_at: NOW,
      }),
    ).toThrow();
  });
});
