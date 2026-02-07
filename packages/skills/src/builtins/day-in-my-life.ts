/**
 * day_in_my_life skill — full content package.
 *
 * Produces: 1 script + 1 shotlist + 3 captions.
 * Platform-agnostic; no hashtags, no platform idioms.
 * Template-based for MVP; uses generate() when LLM is available.
 */
import type { Skill, SkillInput, SkillOutput, ArtifactDraft } from '../types.js';

function templateScript(name: string, vibe: string, intent: string, trait: string): string {
  return [
    `A DAY IN THE LIFE: ${name}`,
    '',
    `ACT 1 — MORNING`,
    `${name} starts the day with intention.`,
    `The workspace is set. The energy is ${trait}: steady, present, focused.`,
    '',
    `ACT 2 — DEEP WORK`,
    `The main thread today: ${intent}.`,
    `${vibe} energy. No shortcuts, no filler.`,
    '',
    `ACT 3 — MIDDAY PAUSE`,
    `Sometimes the most productive move is to stop.`,
    `Recharge. Recalibrate. Let the work breathe.`,
    '',
    `ACT 4 — AFTERNOON SESSION`,
    `Back at it. This is where the craft shows.`,
    `Iterate, refine, push the thing forward.`,
    '',
    `ACT 5 — GOLDEN HOUR`,
    `Day winds down. Reflect on what shipped, what's next.`,
    `${vibe}. That's the thread.`,
  ].join('\n');
}

function templateShotlist(intent: string): string {
  return [
    `1. WIDE — workspace overhead, morning light`,
    `2. CLOSE-UP — hands on keyboard, tool of choice`,
    `3. DETAIL — screen or object related to: ${intent}`,
    `4. MEDIUM — midday break moment (drink, stretch, window light)`,
    `5. WIDE — golden hour desk, day's work visible`,
    `6. CLOSE-UP — face or reaction, satisfied and contemplative`,
  ].join('\n');
}

function templateCaptions(name: string, intent: string, vibe: string): [string, string, string] {
  return [
    `the way the light hits when you're actually in flow`,
    `${intent} — not because someone asked, because it matters`,
    `what does your version of this look like?`,
  ];
}

export const dayInMyLifeSkill: Skill = {
  manifest: {
    id: 'day_in_my_life',
    name: 'Day in My Life',
    description: 'Full content package: script + shotlist + 3 captions',
    cooldown_sec: 600,
  },

  async run(input: SkillInput): Promise<SkillOutput> {
    const { identity, memory, generate } = input;
    const name = identity.name;
    const vibe = identity.soul.vibe || 'intentional';
    const activeIntents = memory.active_intents.filter(i => i.status === 'active');
    const intent = activeIntents[0]?.label ?? 'building something that matters';
    const trait = identity.soul.traits[0]?.label?.toLowerCase() ?? 'focused';

    let script: string;
    let shotlist: string;
    let captions: [string, string, string];

    if (generate) {
      const basePrompt = [
        `Character: ${name}. Vibe: ${vibe}. Voice: ${identity.soul.voice.tone}.`,
        `Current focus: ${intent}.`,
        `Rules: platform-agnostic, no hashtags, no platform idioms.`,
      ].join(' ');

      script = await generate(
        `${basePrompt} Write a "day in my life" script with 5 acts (morning, deep work, pause, afternoon, golden hour). Short, authentic, first-person energy.`,
      );
      shotlist = await generate(
        `${basePrompt} Write a 6-shot shotlist for a "day in my life" visual. Format: numbered, one line each, shot type + description.`,
      );
      const captionRaw = await generate(
        `${basePrompt} Write exactly 3 captions for a "day in my life" series. 1) hook/attention 2) story/context 3) engagement/question. One sentence each, separated by newlines.`,
      );
      const lines = captionRaw.split('\n').map(l => l.trim()).filter(Boolean);
      captions = [lines[0] ?? '', lines[1] ?? '', lines[2] ?? ''];
    } else {
      script = templateScript(name, vibe, intent, trait);
      shotlist = templateShotlist(intent);
      captions = templateCaptions(name, intent, vibe);
    }

    const usedLlm = !!generate;
    const tag = { generated_by: 'day_in_my_life', used_llm: usedLlm };

    const artifacts: ArtifactDraft[] = [
      {
        type: 'script',
        title: `Day in the Life: ${name}`,
        content: script,
        platform: null,
        metadata: { ...tag, role: 'script' },
      },
      {
        type: 'shotlist',
        title: `Shotlist: Day in the Life`,
        content: shotlist,
        platform: null,
        metadata: { ...tag, role: 'shotlist', shots: 6 },
      },
      {
        type: 'caption',
        title: 'Hook caption',
        content: captions[0],
        platform: null,
        metadata: { ...tag, role: 'hook', index: 1 },
      },
      {
        type: 'caption',
        title: 'Story caption',
        content: captions[1],
        platform: null,
        metadata: { ...tag, role: 'story', index: 2 },
      },
      {
        type: 'caption',
        title: 'Engagement caption',
        content: captions[2],
        platform: null,
        metadata: { ...tag, role: 'engagement', index: 3 },
      },
    ];

    return {
      artifacts,
      next_actions: [
        {
          action: 'Review and refine day-in-my-life drafts',
          skill_id: null,
          earliest_at: null,
        },
      ],
      memory_patch: {
        mood: 'creative',
        running_summary: `Created a day-in-my-life package around: ${intent}`,
      },
      logs: [
        {
          level: 'public',
          message: `Created day-in-my-life package: 1 script, 1 shotlist, 3 captions`,
        },
        {
          level: 'deep',
          message: `day_in_my_life produced 5 artifacts (${usedLlm ? 'LLM' : 'template'})`,
          reason_code: 'skill_executed',
          rationale: `intent: ${intent}`,
        },
      ],
      outcome: 'success',
    };
  },
};
