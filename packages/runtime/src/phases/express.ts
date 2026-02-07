/**
 * Express phase — execute the chosen skill.
 *
 * Looks up the skill in the registry, builds a SkillInput, and
 * runs it.  Returns the full SkillOutput (multiple artifacts,
 * memory patches, next actions, logs).
 *
 * If the skill is not found or throws, returns a failed output.
 */
import type { Identity, MemoryState } from '@identity-os/core';
import type { SkillRegistry, SkillInput, SkillOutput } from '@identity-os/skills';
import type { Decision } from '../types.js';
import type { LLMProvider } from '../llm-provider.js';

function failedOutput(message: string): SkillOutput {
  return {
    artifacts: [],
    next_actions: [],
    memory_patch: {},
    logs: [{ level: 'deep', message, reason_code: 'skill_failed', rationale: message.slice(0, 120) }],
    outcome: 'failed',
  };
}

export async function express(
  identity: Identity,
  memory: MemoryState,
  decision: Decision,
  tickId: string,
  timestamp: string,
  skillRegistry: SkillRegistry,
  llm?: LLMProvider,
): Promise<SkillOutput> {
  if (!decision.skill_id) {
    return failedOutput('No skill_id in decision — nothing to express');
  }

  const skill = skillRegistry.get(decision.skill_id);
  if (!skill) {
    return failedOutput(`Skill not found: ${decision.skill_id}`);
  }

  // Build skill input
  const input: SkillInput = {
    identity,
    memory,
    tick_id: tickId,
    timestamp,
  };

  // Inject LLM generate function if available
  if (llm) {
    input.generate = (prompt: string) =>
      llm.generate({ identity, prompt });
  }

  try {
    return await Promise.resolve(skill.run(input));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return failedOutput(`Skill "${decision.skill_id}" threw: ${msg}`);
  }
}
