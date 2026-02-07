/**
 * Identity.Artifacts — outputs of expression.
 *
 * Scripts, shotlists, captions, posts, thoughts, image prompts.
 * Each artifact is produced by a skill during the Express phase,
 * stored as a draft, and published only after approval (if required).
 */
import { z } from 'zod';
import { UUID, ISOTimestamp } from './common.js';

export const ArtifactType = z.enum([
  'script',
  'shotlist',
  'caption',
  'post',
  'thought',
  'image_prompt',
]);
export type ArtifactType = z.infer<typeof ArtifactType>;

export const ArtifactStatus = z.enum([
  'draft',
  'approved',
  'published',
  'failed',
  'archived',
]);
export type ArtifactStatus = z.infer<typeof ArtifactStatus>;

export const Artifact = z.object({
  id: UUID,
  identity_id: UUID,
  tick_id: UUID,
  type: ArtifactType,
  title: z.string().nullable().default(null),
  content: z.string().min(1),
  platform: z.string().nullable().default(null),
  status: ArtifactStatus.default('draft'),
  metadata: z.record(z.unknown()).default({}),
  created_at: ISOTimestamp,
  published_at: ISOTimestamp.nullable().default(null),
});
export type Artifact = z.infer<typeof Artifact>;
