import { describe, it, expect } from 'vitest';
import { SnapshotEnvelope } from '../src/snapshot.js';
import { IDENTITY_OS_VERSION, SCHEMA_VERSION } from '../src/common.js';
import { pennySnapshot } from '../examples/penny.js';

const NOW = '2026-02-07T12:00:00.000Z';
const UID = 'a0000000-0000-0000-0000-000000000001';

describe('SnapshotEnvelope', () => {
  it('validates Penny snapshot example', () => {
    const result = SnapshotEnvelope.parse(pennySnapshot);
    expect(result.version).toBe(1);
    expect(result.parent_hash).toBeNull();
    expect(result.content_hash).toContain('sha256:');
    expect(result.payload).toHaveProperty('identity');
  });

  it('accepts chained snapshot (with parent_hash)', () => {
    const v2 = SnapshotEnvelope.parse({
      identity_os_version: IDENTITY_OS_VERSION,
      schema_version: SCHEMA_VERSION,
      id: UID,
      identity_id: UID,
      version: 2,
      content_hash: 'sha256:abc123',
      parent_hash: 'sha256:def456',
      payload: { identity: {}, memory: {} },
      created_at: NOW,
    });
    expect(v2.parent_hash).toBe('sha256:def456');
    expect(v2.version).toBe(2);
  });

  it('rejects version 0', () => {
    expect(() =>
      SnapshotEnvelope.parse({
        identity_os_version: IDENTITY_OS_VERSION,
        schema_version: SCHEMA_VERSION,
        id: UID,
        identity_id: UID,
        version: 0,
        content_hash: 'sha256:abc',
        payload: {},
        created_at: NOW,
      }),
    ).toThrow();
  });

  it('rejects negative version', () => {
    expect(() =>
      SnapshotEnvelope.parse({
        identity_os_version: IDENTITY_OS_VERSION,
        schema_version: SCHEMA_VERSION,
        id: UID,
        identity_id: UID,
        version: -1,
        content_hash: 'sha256:abc',
        payload: {},
        created_at: NOW,
      }),
    ).toThrow();
  });

  it('rejects empty content_hash', () => {
    expect(() =>
      SnapshotEnvelope.parse({
        identity_os_version: IDENTITY_OS_VERSION,
        schema_version: SCHEMA_VERSION,
        id: UID,
        identity_id: UID,
        version: 1,
        content_hash: '',
        payload: {},
        created_at: NOW,
      }),
    ).toThrow();
  });

  it('carries version headers', () => {
    const snap = SnapshotEnvelope.parse(pennySnapshot);
    expect(snap.identity_os_version).toBe(IDENTITY_OS_VERSION);
    expect(snap.schema_version).toBe(SCHEMA_VERSION);
  });
});
