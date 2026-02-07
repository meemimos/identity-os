# Identity.OS

A **character runtime** for living characters with a Body (vessel) and Soul (persistent cloud character).

Characters follow a lifecycle — **Live → Decide → Express → Remember** — producing artifacts (scripts, captions, shotlists), building memory, and logging every decision with full observability.

## Architecture

```
identity-os/
├── packages/
│   ├── core/        # Types + Zod schemas (zero deps beyond zod)
│   ├── storage/     # SQLite repos, migrations, snapshot chain
│   ├── skills/      # Pluggable content skills (day_in_my_life, reflection, routine)
│   └── runtime/     # Tick engine: Live → Decide → Express → Remember
├── adapters/
│   └── openclaw/    # CLI bridge: identityos command
└── examples/
    └── penny-onboarding.json
```

**Dependency rule**: `@identity-os/*` packages never import from adapters. Adapters depend on `@identity-os/*`, never the reverse.

## Setup

**Requirements**: Node.js 22+, pnpm 10+

```bash
cd identity-os
pnpm install
pnpm --filter @identity-os/openclaw-adapter build
```

Run tests across all packages:

```bash
pnpm -r test -- --run
```

## Quick Start

### 1. Create an identity

From the example onboarding JSON:

```bash
node adapters/openclaw/dist/cli.js create --from-file examples/penny-onboarding.json
```

Or import directly from an existing OpenClaw workspace (`~/.openclaw/workspace/SOUL.md` + `IDENTITY.md`):

```bash
node adapters/openclaw/dist/cli.js create --from-workspace --owner mimos
```

Output:

```
Identity created
  ID: 94e277f8-270f-4080-b7f3-516aa9ac878d
  Name: Penny Larson
  Owner: mimos
  Traits: 5  Constitution: 7
  Intents: Build consistent IG presence, Develop authentic voice
  Snapshot: v1 sha256:852e63a099b5b49a55c216a...
```

### 2. Run ticks

A tick runs the full lifecycle: perceive state, decide what to do, express via a skill, and remember everything.

```bash
node adapters/openclaw/dist/cli.js tick --verbose
```

```
Tick  94e277f8  │  Penny Larson  │  2026-02-07T12:39:21.336Z

  decide  day_in_my_life
    reason: inspiration_struck
    progressing: Build consistent IG presence

  express  5 artifact(s)
     TYPE     │ TITLE                         │ STATUS │ ID
    ──────────┼───────────────────────────────┼────────┼──────────
     script   │ Day in the Life: Penny Larson │ draft  │ 4fc17f94
     shotlist │ Shotlist: Day in the Life     │ draft  │ b9b48582
     caption  │ Hook caption                  │ draft  │ a4f16749
     caption  │ Story caption                 │ draft  │ ef060153
     caption  │ Engagement caption            │ draft  │ be2687af

  remember  snapshot v2  sha256:80ffaeef2531becb1...

  5 logs  │  5 artifacts  │  11ms
```

Ticks can also do nothing — that's a feature, not a bug:

```
Tick  94e277f8  │  Penny Larson  │  2026-02-07T12:39:24.867Z

  decide  NOP — nothing_notable

  remember  snapshot v3  sha256:67276e3978c78db68...

  3 logs  │  0 artifacts  │  6ms
```

### 3. Schedule a loop (via OpenClaw cron)

```bash
node adapters/openclaw/dist/cli.js run start --interval 5 --tz "Australia/Sydney"
```

```
Scheduled tick started
  Identity: Penny Larson (94e277f8)
  Job ID: f7de0cd9-fe08-4758-92ff-392d06b0e639
  Schedule: every 5 min (Australia/Sydney)
  Cron expr: */5 * * * *

  OpenClaw will trigger ticks via its cron scheduler.
```

Stop it:

```bash
node adapters/openclaw/dist/cli.js run stop
```

### 4. View status

```bash
node adapters/openclaw/dist/cli.js status
```

```
Penny Larson  (94e277f8-270f-4080-b7f3-516aa9ac878d)
  Status: active  │  Version: 6  │  Owner: mimos
  Vibe: calm & sharp — collected, observant, quietly confident  │  Traits: 5  │  Constitution: 7
  Tick count: 5  │  Last tick: 2026-02-07T12:39:32.645Z  │  Mood: contemplative
  Active intents:
    ● Build consistent IG presence (high)
    ● Develop authentic voice (medium)
  Queued actions:
    ▸ Review and refine day-in-my-life drafts
    ▸ Share routine content when ready
  Snapshot: v6  sha256:fc58667075b4868c353a8ac...
  Schedule: not configured
  Recent activity:
    12:39:32 [remember] Snapshot v6 created
    12:39:32 [express] reflection produced 3 artifacts (template)
    12:39:32 [express] Reflected: 1 narrative, 2 captions
```

### 5. View logs

Public logs (what the character is doing):

```bash
node adapters/openclaw/dist/cli.js logs
```

```
Logs: Penny Larson (8 entries)

── tick 72507619 ──
  12:39:21 [decide] [public] Decided to run: day_in_my_life
  12:39:21 [express] [public] Created day-in-my-life package: 1 script, 1 shotlist, 3 captions
── tick 2bfc66ca ──
  12:39:24 [decide] [public] Idle — nothing to do right now
── tick 4c68337b ──
  12:39:28 [decide] [public] Decided to run: routine
  12:39:28 [express] [public] Created routine package: 1 step-by-step, 2 CTA captions
── tick f3d7051b ──
  12:39:32 [decide] [public] Idle — nothing to do right now
── tick cd05e04e ──
  12:39:32 [decide] [public] Decided to run: reflection
  12:39:32 [express] [public] Reflected: 1 narrative, 2 captions
```

Deep logs (why the character made each decision):

```bash
node adapters/openclaw/dist/cli.js logs --deep --limit 8
```

```
Logs: Penny Larson (8 entries)

── tick 72507619 ──
  12:39:21 [decide] [deep] Action: day_in_my_life (day_in_my_life)  (inspiration_struck)
    → progressing: Build consistent IG presence
  12:39:21 [decide] [public] Decided to run: day_in_my_life
  12:39:21 [express] [public] Created day-in-my-life package: 1 script, 1 shotlist, 3 captions
  12:39:21 [express] [deep] day_in_my_life produced 5 artifacts (template)  (skill_executed)
    → intent: Build consistent IG presence
  12:39:21 [remember] [deep] Snapshot v2 created  (snapshot_taken)
    → v2 sha256:80ffaeef2531b...
── tick 2bfc66ca ──
  12:39:24 [decide] [deep] NOP — nothing_notable  (nothing_notable)
    → no signals, resting
  12:39:24 [decide] [public] Idle — nothing to do right now
  12:39:24 [remember] [deep] Snapshot v3 created  (snapshot_taken)
    → v3 sha256:67276e3978c78...
```

### 6. List artifacts

```bash
node adapters/openclaw/dist/cli.js artifacts
```

```
Artifacts: Penny Larson (11)

 ID       │ TYPE     │ TITLE                               │ STATUS │ CREATED
──────────┼──────────┼─────────────────────────────────────┼────────┼─────────────────────
 c493de4e │ caption  │ Inspirational caption               │ draft  │ 2026-02-07T12:39:32
 3470e6a9 │ caption  │ Vulnerable caption                  │ draft  │ 2026-02-07T12:39:32
 d606b22e │ thought  │ Reflection #5                       │ draft  │ 2026-02-07T12:39:32
 1176478b │ caption  │ Engagement CTA                      │ draft  │ 2026-02-07T12:39:28
 5369355e │ caption  │ Save/share hook                     │ draft  │ 2026-02-07T12:39:28
 b744b8b1 │ script   │ Routine: Build consistent IG presen │ draft  │ 2026-02-07T12:39:28
 be2687af │ caption  │ Engagement caption                  │ draft  │ 2026-02-07T12:39:21
 ef060153 │ caption  │ Story caption                       │ draft  │ 2026-02-07T12:39:21
 a4f16749 │ caption  │ Hook caption                        │ draft  │ 2026-02-07T12:39:21
 b9b48582 │ shotlist │ Shotlist: Day in the Life           │ draft  │ 2026-02-07T12:39:21
 4fc17f94 │ script   │ Day in the Life: Penny Larson       │ draft  │ 2026-02-07T12:39:21

Use --show <id> to view content.
```

View a specific artifact:

```bash
node adapters/openclaw/dist/cli.js artifacts --show d606b22e
```

```
Reflection #5
  ID: d606b22e-ea69-488d-8919-62d29c603675
  Type: thought  │  Status: draft
  Created: 2026-02-07T12:39:32.645Z
  Tick: cd05e04e

─── content ───

REFLECTION — Penny Larson, tick #5

structured energy. Not every moment needs to produce.

Built a routine package around: Build consistent IG presence

Active threads:
  — Build consistent IG presence
  — Develop authentic voice

Note to self: presence over performance.
The rest is just weather.
```

## CLI Reference

All commands auto-detect the identity when there's only one. Pass a UUID or name substring to disambiguate.

| Command | Description |
|---|---|
| `identityos create` | Create identity (`--from-file <json>` or `--from-workspace`) |
| `identityos tick [id]` | Run one tick (`-v` for verbose) |
| `identityos run start [id]` | Schedule ticks via OpenClaw cron (`--interval`, `--tz`) |
| `identityos run stop [id]` | Pause scheduled ticks |
| `identityos status [id]` | Show identity state, memory, schedule |
| `identityos logs [id]` | View logs (`-d` deep, `-t` tail, `--phase`, `--since`) |
| `identityos artifacts [id]` | List artifacts (`--type`, `--status`, `--show <id>`) |

## Onboarding JSON Format

See `examples/penny-onboarding.json` for a complete example. Key fields:

```json
{
  "name": "Character Name",
  "owner": "operator-name",
  "soul": {
    "traits": [{ "id": "...", "label": "...", "value": 0.9 }],
    "voice": { "tone": "warm", "register": "casual", "quirks": [], "boundaries": [] },
    "constitution": ["principle one", "principle two"],
    "vibe": "short vibe description"
  },
  "platform": { "type": "instagram", "display_name": "...", "handle": "@..." },
  "intents": [{ "label": "Goal description", "priority": "high" }],
  "runtime": {
    "tick_interval_sec": 300,
    "max_actions_per_day": 10,
    "max_ticks_per_hour": 12
  }
}
```

## How the Lifecycle Works

Each tick follows four phases:

1. **Live** — Load identity + memory from latest snapshot, check autonomy limits
2. **Decide** — Rule-based (MVP) or LLM-powered decision: pick a skill or NOP
3. **Express** — Execute the chosen skill, producing artifacts + memory patches
4. **Remember** — Persist logs, store artifacts, apply memory patches, create snapshot

The character can decide to do **nothing** (NOP) — this is intentional. A living character rests.

### Snapshots

Every tick creates an immutable, content-addressed snapshot (SHA-256) linked to the previous one. This forms a verifiable chain — designed so IPFS CIDs can replace hashes later without schema changes.

### Log Levels

- **public**: What the character is doing (safe to show users)
- **deep**: Why it made each decision (reason codes + short rationales, max 120 chars)

### Skills (MVP)

| Skill | Artifacts | Description |
|---|---|---|
| `day_in_my_life` | 1 script, 1 shotlist, 3 captions | Full content package for a day-in-the-life post |
| `routine` | 1 script, 2 CTA captions | Step-by-step routine with engagement hooks |
| `reflection` | 1 thought, 2 captions | Introspective narrative + shareable quotes |
| `idle` | (none) | Conscious do-nothing — character rests |

Skills are platform-agnostic. Platform-specific formatting is applied separately.

## Data

- **Database**: `~/.openclaw/identity-os.db` (SQLite, WAL mode)
- **Cron jobs**: `~/.openclaw/cron/jobs.json` (shared with OpenClaw)
- **Tables**: `identities`, `soul_snapshots`, `artifacts`, `log_entries`
