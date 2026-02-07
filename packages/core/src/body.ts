/**
 * Body — the vessel a character inhabits.
 *
 * Can be an NFT, Ready Player Me avatar, profile picture, or a generic
 * placeholder.  The URI points to the asset (IPFS hash, URL, etc.).
 */
import { z } from 'zod';
import { UUID, ISOTimestamp } from './common.js';

export const BodyType = z.enum(['nft', 'rpm', 'pfp', 'generic']);
export type BodyType = z.infer<typeof BodyType>;

export const Body = z.object({
  id: UUID,
  type: BodyType,
  label: z.string().min(1).max(100),
  uri: z.string().nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
  created_at: ISOTimestamp,
});
export type Body = z.infer<typeof Body>;
