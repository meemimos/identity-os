/**
 * routine skill — tutorial/process content package.
 *
 * Produces: 1 step-by-step routine + 2 CTA captions.
 * Platform-agnostic; no hashtags, no platform idioms.
 */
import type { Skill, SkillInput, SkillOutput, ArtifactDraft } from '../types.js';

function templateSteps(name: string, intent: string, vibe: string): string {
  return [
    `${name.toUpperCase()}'S ${intent.toUpperCase()} ROUTINE`,
    '',
    `STEP 1 — SET INTENTION`,
    `Before anything, get clear on what matters today.`,
    `Write it down. One sentence. That's your north star.`,
    '',
    `STEP 2 — PREPARE THE SPACE`,
    `Environment shapes output. ${vibe}-aligned setup.`,
    `Clear the noise. Queue the focus playlist. Water within reach.`,
    '',
    `STEP 3 — DO THE WORK`,
    `${intent} — the core practice.`,
    `Minimum viable distraction. Protect this time.`,
    '',
    `STEP 4 — REVIEW AND ITERATE`,
    `Step back. What worked? What didn't?`,
    `Craft is in the revision, not the first draft.`,
    '',
    `STEP 5 — CLOSE THE LOOP`,
    `Document, share, or ship.`,
    `Incomplete is fine. Stagnant is not.`,
  ].join('\n');
}

function templateCaptions(intent: string): [string, string] {
  return [
    `this routine changed how i approach ${intent} — saving this for later`,
    `what's one step you'd add to your version of this?`,
  ];
}

export const routineSkill: Skill = {
  manifest: {
    id: 'routine',
    name: 'Routine',
    description: 'Tutorial package: step-by-step routine + 2 CTA captions',
    cooldown_sec: 600,
  },

  async run(input: SkillInput): Promise<SkillOutput> {
    const { identity, memory, generate } = input;
    const name = identity.name;
    const vibe = identity.soul.vibe || 'intentional';
    const activeIntents = memory.active_intents.filter(i => i.status === 'active');
    const intent = activeIntents[0]?.label ?? 'building something that matters';

    let steps: string;
    let captions: [string, string];

    if (generate) {
      const basePrompt = [
        `Character: ${name}. Vibe: ${vibe}. Voice: ${identity.soul.voice.tone}.`,
        `Topic: ${intent}.`,
        `Rules: platform-agnostic, no hashtags, no platform idioms.`,
      ].join(' ');

      steps = await generate(
        `${basePrompt} Write a 5-step routine for "${intent}". Format: numbered steps with a title and 1-2 sentence description each. Practical, grounded, not generic.`,
      );
      const captionRaw = await generate(
        `${basePrompt} Write exactly 2 CTA captions for this routine. 1) save/share hook 2) engagement question. One sentence each, separated by a newline.`,
      );
      const lines = captionRaw.split('\n').map(l => l.trim()).filter(Boolean);
      captions = [lines[0] ?? '', lines[1] ?? ''];
    } else {
      steps = templateSteps(name, intent, vibe);
      captions = templateCaptions(intent);
    }

    const usedLlm = !!generate;
    const tag = { generated_by: 'routine', used_llm: usedLlm };

    const artifacts: ArtifactDraft[] = [
      {
        type: 'script',
        title: `Routine: ${intent}`,
        content: steps,
        platform: null,
        metadata: { ...tag, role: 'steps', step_count: 5 },
      },
      {
        type: 'caption',
        title: 'Save/share hook',
        content: captions[0],
        platform: null,
        metadata: { ...tag, role: 'cta_hook', index: 1 },
      },
      {
        type: 'caption',
        title: 'Engagement CTA',
        content: captions[1],
        platform: null,
        metadata: { ...tag, role: 'cta_engage', index: 2 },
      },
    ];

    return {
      artifacts,
      next_actions: [
        {
          action: 'Share routine content when ready',
          skill_id: null,
          earliest_at: null,
        },
      ],
      memory_patch: {
        mood: 'structured',
        running_summary: `Built a routine package around: ${intent}`,
      },
      logs: [
        {
          level: 'public',
          message: `Created routine package: 1 step-by-step, 2 CTA captions`,
        },
        {
          level: 'deep',
          message: `routine produced 3 artifacts (${usedLlm ? 'LLM' : 'template'})`,
          reason_code: 'skill_executed',
          rationale: `intent: ${intent}`,
        },
      ],
      outcome: 'success',
    };
  },
};
