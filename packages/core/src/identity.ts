/**
 * Identity.Core — the root aggregate ("Soul").
 *
 * Holds the character's name, traits, voice configuration, constitution,
 * and vibe.  Carries versioning headers and a pointer to the latest
 * snapshot for IPFS-ready persistence.
 */
import { z } from 'zod';
import { UUID, ISOTimestamp, VersionHeader } from './common.js';

// ── Soul components ─────────────────────────────────────────────

export const Trait = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.number().min(0).max(1),
  description: z.string().optional(),
});
export type Trait = z.infer<typeof Trait>;

export const VoiceConfig = z.object({
  tone: z.string().min(1),
  register: z.enum(['casual', 'formal', 'mixed']).default('casual'),
  quirks: z.array(z.string()).default([]),
  boundaries: z.array(z.string()).default([]),
});
export type VoiceConfig = z.infer<typeof VoiceConfig>;

export const Soul = z.object({
  traits: z.array(Trait).default([]),
  voice: VoiceConfig,
  constitution: z.array(z.string()).default([]),
  vibe: z.string().default(''),
});
export type Soul = z.infer<typeof Soul>;

// ── Identity status ─────────────────────────────────────────────

export const IdentityStatus = z.enum(['active', 'paused', 'archived']);
export type IdentityStatus = z.infer<typeof IdentityStatus>;

// ── Identity (root aggregate) ───────────────────────────────────

export const Identity = VersionHeader.extend({
  id: UUID,
  name: z.string().min(1).max(200),
  status: IdentityStatus.default('active'),
  version: z.number().int().nonnegative().default(0),
  latest_snapshot_id: UUID.nullable().default(null),
  soul: Soul,
  created_at: ISOTimestamp,
  updated_at: ISOTimestamp,
});
export type Identity = z.infer<typeof Identity>;
