/**
 * Identity.Platform — host profiles.
 *
 * One profile per platform.  Carries display name, bio, aesthetic
 * preset, voice overrides, and posting rules.  Optionally bound to
 * a specific Body for that platform's avatar.
 */
import { z } from 'zod';
import { UUID, ISOTimestamp } from './common.js';
import { VoiceConfig } from './identity.js';

// ── Platform enum ───────────────────────────────────────────────

export const PlatformType = z.enum([
  'generic',
  'instagram',
  'twitter',
  'tiktok',
  'telegram',
]);
export type PlatformType = z.infer<typeof PlatformType>;

// ── Aesthetic preset ────────────────────────────────────────────

export const Aesthetic = z.object({
  color_palette: z.array(z.string()).default([]),
  font_vibe: z.string().default(''),
  visual_style: z.string().default(''),
});
export type Aesthetic = z.infer<typeof Aesthetic>;

// ── Posting rules ───────────────────────────────────────────────

export const PostingRules = z.object({
  min_interval_sec: z.number().int().nonnegative().default(3600),
  max_interval_sec: z.number().int().nonnegative().default(86400),
  content_boundaries: z.array(z.string()).default([]),
  preferred_formats: z.array(z.string()).default([]),
});
export type PostingRules = z.infer<typeof PostingRules>;

// ── Platform profile ────────────────────────────────────────────

export const PlatformProfile = z.object({
  id: UUID,
  identity_id: UUID,
  platform: PlatformType,
  display_name: z.string().min(1),
  handle: z.string().nullable().default(null),
  bio: z.string().nullable().default(null),
  aesthetic: Aesthetic.nullable().default(null),
  voice_overrides: VoiceConfig.partial().nullable().default(null),
  posting_rules: PostingRules,
  body_id: UUID.nullable().default(null),
  created_at: ISOTimestamp,
});
export type PlatformProfile = z.infer<typeof PlatformProfile>;
