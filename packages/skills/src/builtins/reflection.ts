/**
 * reflection skill — introspective content package.
 *
 * Produces: 1 short narrative + 2 captions.
 * Platform-agnostic; no hashtags, no platform idioms.
 */
import type { Skill, SkillInput, SkillOutput, ArtifactDraft } from '../types.js';

function templateNarrative(
  name: string,
  tickCount: number,
  mood: string,
  summary: string,
  intents: string[],
): string {
  const intentList = intents.length
    ? intents.map(i => `  — ${i}`).join('\n')
    : '  — (none right now)';

  return [
    `REFLECTION — ${name}, tick #${tickCount}`,
    '',
    `${mood} energy. Not every moment needs to produce.`,
    '',
    summary,
    '',
    `Active threads:`,
    intentList,
    '',
    `Note to self: presence over performance.`,
    `The rest is just weather.`,
  ].join('\n');
}

function templateCaptions(mood: string): [string, string] {
  return [
    `sometimes the most productive thing is to sit with where you are`,
    `not every chapter needs a plot twist — some just need presence`,
  ];
}

export const reflectionSkill: Skill = {
  manifest: {
    id: 'reflection',
    name: 'Reflection',
    description: 'Introspective package: short narrative + 2 captions',
    cooldown_sec: 600,
  },

  async run(input: SkillInput): Promise<SkillOutput> {
    const { identity, memory, generate } = input;
    const name = identity.name;
    const tickCount = memory.continuity.tick_count;
    const mood = memory.continuity.last_mood ?? 'contemplative';
    const summary = memory.continuity.running_summary ?? 'Starting fresh — no history yet.';
    const intentLabels = memory.active_intents
      .filter(i => i.status === 'active')
      .map(i => i.label);

    let narrative: string;
    let captions: [string, string];

    if (generate) {
      const basePrompt = [
        `Character: ${name}. Voice: ${identity.soul.voice.tone}.`,
        `Current mood: ${mood}. Tick: ${tickCount}.`,
        `Recent context: ${summary}.`,
        `Active threads: ${intentLabels.join(', ') || 'none'}.`,
        `Rules: platform-agnostic, no hashtags, introspective and honest.`,
      ].join(' ');

      narrative = await generate(
        `${basePrompt} Write a short reflective narrative (8-10 lines). First-person inner monologue. Honest, grounded, not performative.`,
      );
      const captionRaw = await generate(
        `${basePrompt} Write exactly 2 captions from this reflection. 1) vulnerable/honest 2) inspirational but not cheesy. One sentence each, separated by a newline.`,
      );
      const lines = captionRaw.split('\n').map(l => l.trim()).filter(Boolean);
      captions = [lines[0] ?? '', lines[1] ?? ''];
    } else {
      narrative = templateNarrative(name, tickCount, mood, summary, intentLabels);
      captions = templateCaptions(mood);
    }

    const usedLlm = !!generate;
    const tag = { generated_by: 'reflection', used_llm: usedLlm };

    const artifacts: ArtifactDraft[] = [
      {
        type: 'thought',
        title: `Reflection #${tickCount}`,
        content: narrative,
        platform: null,
        metadata: { ...tag, role: 'narrative', tick_count: tickCount, mood },
      },
      {
        type: 'caption',
        title: 'Vulnerable caption',
        content: captions[0],
        platform: null,
        metadata: { ...tag, role: 'vulnerable', index: 1 },
      },
      {
        type: 'caption',
        title: 'Inspirational caption',
        content: captions[1],
        platform: null,
        metadata: { ...tag, role: 'inspirational', index: 2 },
      },
    ];

    return {
      artifacts,
      next_actions: [],
      memory_patch: {
        mood: 'contemplative',
        running_summary: `Reflected at tick #${tickCount}. ${mood} energy.`,
      },
      logs: [
        {
          level: 'public',
          message: `Reflected: 1 narrative, 2 captions`,
        },
        {
          level: 'deep',
          message: `reflection produced 3 artifacts (${usedLlm ? 'LLM' : 'template'})`,
          reason_code: 'skill_executed',
          rationale: `mood: ${mood}, tick: ${tickCount}`,
        },
      ],
      outcome: 'success',
    };
  },
};
