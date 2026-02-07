import { describe, it, expect } from 'vitest';
import { Binding } from '../src/binding.js';
import { pennyBinding } from '../examples/penny.js';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = 'a0000000-0000-0000-0000-000000000001';

describe('Binding', () => {
  it('validates Penny example', () => {
    expect(Binding.parse(pennyBinding)).toEqual(pennyBinding);
  });

  it('defaults active to true', () => {
    const result = Binding.parse({
      id: UID,
      identity_id: UID,
      body_id: UID,
      platform: 'instagram',
      created_at: NOW,
    });
    expect(result.active).toBe(true);
  });

  it('rejects empty platform string', () => {
    expect(() =>
      Binding.parse({
        id: UID,
        identity_id: UID,
        body_id: UID,
        platform: '',
        created_at: NOW,
      }),
    ).toThrow();
  });
});
