/**
 * 001-initial — founding schema for Identity.OS storage.
 *
 * Tables: identities, soul_snapshots, artifacts, log_entries.
 * Designed for SQLite; Postgres-portable (TEXT dates, JSON columns).
 */
export const name = '001-initial';

export const up = /* sql */ `
-- ── Identities ──────────────────────────────────────────────────
CREATE TABLE identities (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'paused', 'archived')),
  owner               TEXT,
  identity_os_version TEXT NOT NULL,
  schema_version      TEXT NOT NULL,
  version             INTEGER NOT NULL DEFAULT 0,
  latest_snapshot_id  TEXT,
  soul_data           TEXT NOT NULL,            -- JSON (Soul object)
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

-- ── Soul Snapshots (immutable, append-only) ─────────────────────
CREATE TABLE soul_snapshots (
  id                    TEXT PRIMARY KEY,
  identity_id           TEXT NOT NULL
                          REFERENCES identities(id) ON DELETE CASCADE,
  version               INTEGER NOT NULL,
  content_hash          TEXT NOT NULL,           -- SHA-256, future IPFS CID
  parent_hash           TEXT,                    -- previous snapshot hash (chain)
  previous_snapshot_id  TEXT
                          REFERENCES soul_snapshots(id),
  payload               TEXT NOT NULL,           -- full JSON blob
  identity_os_version   TEXT NOT NULL,
  schema_version        TEXT NOT NULL,
  created_at            TEXT NOT NULL,
  UNIQUE(identity_id, version)
);

-- ── Artifacts ───────────────────────────────────────────────────
CREATE TABLE artifacts (
  id            TEXT PRIMARY KEY,
  identity_id   TEXT NOT NULL
                  REFERENCES identities(id) ON DELETE CASCADE,
  tick_id       TEXT NOT NULL,
  type          TEXT NOT NULL
                  CHECK(type IN ('script','shotlist','caption','post','thought','image_prompt')),
  title         TEXT,
  content       TEXT NOT NULL,
  content_uri   TEXT,                            -- S3/IPFS pointer (NULL = inline)
  platform      TEXT,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK(status IN ('draft','approved','published','failed','archived')),
  metadata      TEXT NOT NULL DEFAULT '{}',      -- JSON
  created_at    TEXT NOT NULL,
  published_at  TEXT
);

-- ── Log Entries ─────────────────────────────────────────────────
CREATE TABLE log_entries (
  id            TEXT PRIMARY KEY,
  identity_id   TEXT NOT NULL
                  REFERENCES identities(id) ON DELETE CASCADE,
  tick_id       TEXT NOT NULL,
  phase         TEXT NOT NULL
                  CHECK(phase IN ('live','decide','express','remember')),
  level         TEXT NOT NULL
                  CHECK(level IN ('public','deep')),
  reason_code   TEXT,
  rationale     TEXT CHECK(rationale IS NULL OR length(rationale) <= 120),
  message       TEXT NOT NULL,
  payload_ref   TEXT,
  created_at    TEXT NOT NULL
);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX idx_snapshots_identity_version
  ON soul_snapshots(identity_id, version);

CREATE INDEX idx_artifacts_identity_created
  ON artifacts(identity_id, created_at);
CREATE INDEX idx_artifacts_identity_status
  ON artifacts(identity_id, status);

CREATE INDEX idx_logs_identity_created
  ON log_entries(identity_id, created_at);
CREATE INDEX idx_logs_identity_level
  ON log_entries(identity_id, level);
CREATE INDEX idx_logs_tick
  ON log_entries(tick_id);
`;
