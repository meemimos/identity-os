/**
 * Sync OpenClaw workspace files → Identity.OS onboarding data.
 *
 * Parses SOUL.md + IDENTITY.md to extract identity configuration.
 * Fragile markdown parsing — works for the known OpenClaw format.
 */
import fs from 'node:fs';
import { SOUL_MD, IDENTITY_MD } from './paths.js';

export interface OnboardingData {
  name: string;
  owner?: string;
  soul: {
    traits: Array<{ id: string; label: string; value: number }>;
    voice: {
      tone: string;
      register: 'casual' | 'formal' | 'mixed';
      quirks: string[];
      boundaries: string[];
    };
    constitution: string[];
    vibe: string;
  };
  platform?: {
    type: string;
    display_name: string;
    handle?: string;
    bio?: string;
  };
  intents?: Array<{
    label: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
  }>;
  runtime?: {
    tick_interval_sec?: number;
    max_actions_per_day?: number;
    max_ticks_per_hour?: number;
  };
}

// ── Markdown helpers ────────────────────────────────────────────

function extractKV(content: string): Map<string, string> {
  const kv = new Map<string, string>();
  const re = /^\s*-\s*\*\*([^*]+)\*\*:?\s*(.+)$/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    kv.set(m[1].trim().toLowerCase().replace(/:$/, ''), m[2].trim());
  }
  return kv;
}

function extractSection(content: string, header: string): string {
  const re = new RegExp(`^##\\s+${header}`, 'im');
  const match = re.exec(content);
  if (!match) return '';
  const start = match.index + match[0].length;
  const nextSection = content.indexOf('\n## ', start);
  return nextSection > 0
    ? content.slice(start, nextSection)
    : content.slice(start);
}

function extractBullets(section: string): string[] {
  const items: string[] = [];
  const re = /^\s*-\s+(.+)$/gm;
  let m;
  while ((m = re.exec(section)) !== null) {
    items.push(m[1].trim());
  }
  return items;
}

function extractConstitution(content: string): string[] {
  const section = extractSection(content, 'Penny Constitution')
    || extractSection(content, 'Constitution')
    || extractSection(content, 'Core Principles');
  const items: string[] = [];
  const re = /^\s*\d+\)\s*\*\*([^*]+)\*\*/gm;
  let m;
  while ((m = re.exec(section)) !== null) {
    items.push(m[1].trim());
  }
  // Fallback: try numbered without bold
  if (items.length === 0) {
    const re2 = /^\s*-\s+(.+)$/gm;
    let m2;
    while ((m2 = re2.exec(section)) !== null) {
      items.push(m2[1].trim());
    }
  }
  return items;
}

// ── Main parser ─────────────────────────────────────────────────

export function parseWorkspace(): OnboardingData {
  const soulContent = fs.existsSync(SOUL_MD) ? fs.readFileSync(SOUL_MD, 'utf-8') : '';
  const idContent = fs.existsSync(IDENTITY_MD) ? fs.readFileSync(IDENTITY_MD, 'utf-8') : '';

  const soulKV = extractKV(soulContent);
  const idKV = extractKV(idContent);

  const name = soulKV.get('name') ?? idKV.get('name') ?? 'Unknown';

  // Vibe
  const vibeSection = extractSection(soulContent, 'Vibe') || extractSection(idContent, 'Vibe');
  const vibe = vibeSection.trim().split('\n')[0]?.replace(/^[^a-zA-Z]*/, '').trim() || '';

  // Skills → traits
  const skillsSection = extractSection(soulContent, "What You're Good At")
    || extractSection(soulContent, 'Skills');
  const skillBullets = extractBullets(skillsSection);
  const traits = skillBullets.map((s, i) => ({
    id: s.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30),
    label: s,
    value: Math.max(0.6, 1 - i * 0.05),
  }));

  // Constitution
  const constitution = extractConstitution(soulContent);

  // Voice
  const tone = soulKV.get('presence') ?? idKV.get('vibe')?.split('×')[0]?.trim() ?? 'warm';
  const styleSection = extractSection(idContent, 'Voice / style') || '';
  const quirks = extractBullets(styleSection).slice(0, 5);
  const boundarySection = extractSection(soulContent, 'Boundaries')
    || extractSection(idContent, 'Boundaries');
  const boundaries = extractBullets(boundarySection).slice(0, 5);

  // Platform
  const handle = idKV.get('instagram') ?? null;
  const bio = idKV.get('signature line') ?? undefined;

  // Owner
  const creatorLine = idKV.get('creator') ?? '';
  const ownerMatch = creatorLine.match(/@(\w+)/);
  const owner = ownerMatch ? ownerMatch[1] : undefined;

  return {
    name,
    owner,
    soul: {
      traits,
      voice: {
        tone: tone.toLowerCase(),
        register: 'casual',
        quirks,
        boundaries,
      },
      constitution,
      vibe,
    },
    platform: handle
      ? {
          type: 'instagram',
          display_name: name,
          handle,
          bio,
        }
      : undefined,
    intents: [
      { label: 'Build consistent content presence', priority: 'high' },
    ],
  };
}
