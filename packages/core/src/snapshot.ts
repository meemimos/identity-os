/**
 * SnapshotEnvelope — versioned, content-addressed snapshot of full
 * identity state.
 *
 * Designed for IPFS: content_hash is SHA-256 today, becomes CID later.
 * parent_hash links snapshots into a verifiable chain.
 */
import { z } from 'zod';
import { UUID, ISOTimestamp, VersionHeader } from './common.js';

export const SnapshotEnvelope = VersionHeader.extend({
  id: UUID,
  identity_id: UUID,
  version: z.number().int().positive(),
  content_hash: z.string().min(1),
  parent_hash: z.string().nullable().default(null),
  payload: z.record(z.unknown()),
  created_at: ISOTimestamp,
});
export type SnapshotEnvelope = z.infer<typeof SnapshotEnvelope>;
