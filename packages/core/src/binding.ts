/**
 * Binding — links a Soul to a Body on a specific platform.
 *
 * One soul can have multiple bindings (one per platform/body combo).
 */
import { z } from 'zod';
import { UUID, ISOTimestamp } from './common.js';

export const Binding = z.object({
  id: UUID,
  identity_id: UUID,
  body_id: UUID,
  platform: z.string().min(1),
  active: z.boolean().default(true),
  created_at: ISOTimestamp,
});
export type Binding = z.infer<typeof Binding>;
