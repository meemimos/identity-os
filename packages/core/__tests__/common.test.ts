import { describe, it, expect } from 'vitest';
import { UUID, ISOTimestamp, SemanticVersion, VersionHeader } from '../src/common.js';

describe('UUID', () => {
  it('accepts valid v4 UUID', () => {
    expect(UUID.parse('a0000000-0000-0000-0000-000000000001')).toBeDefined();
  });

  it('rejects garbage', () => {
    expect(() => UUID.parse('not-a-uuid')).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => UUID.parse('')).toThrow();
  });
});

describe('ISOTimestamp', () => {
  it('accepts valid ISO 8601 datetime', () => {
    expect(ISOTimestamp.parse('2026-02-07T12:00:00.000Z')).toBeDefined();
  });

  it('rejects plain date', () => {
    expect(() => ISOTimestamp.parse('2026-02-07')).toThrow();
  });

  it('rejects garbage', () => {
    expect(() => ISOTimestamp.parse('yesterday')).toThrow();
  });
});

describe('SemanticVersion', () => {
  it('accepts valid semver', () => {
    expect(SemanticVersion.parse('0.1.0')).toBe('0.1.0');
    expect(SemanticVersion.parse('1.23.456')).toBe('1.23.456');
  });

  it('rejects two-segment version', () => {
    expect(() => SemanticVersion.parse('1.0')).toThrow();
  });

  it('rejects version with prefix', () => {
    expect(() => SemanticVersion.parse('v1.0.0')).toThrow();
  });
});

describe('VersionHeader', () => {
  it('accepts valid header', () => {
    const result = VersionHeader.parse({
      identity_os_version: '0.1.0',
      schema_version: '0.1.0',
    });
    expect(result.identity_os_version).toBe('0.1.0');
    expect(result.schema_version).toBe('0.1.0');
  });

  it('rejects missing fields', () => {
    expect(() => VersionHeader.parse({})).toThrow();
    expect(() => VersionHeader.parse({ identity_os_version: '0.1.0' })).toThrow();
  });
});
