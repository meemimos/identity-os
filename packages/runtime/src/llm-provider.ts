/**
 * LLMProvider — interface for future LLM integration.
 *
 * The runtime uses this (when provided) to replace rules-based
 * decision-making with LLM reasoning.  Skills can receive the
 * `generate` function through SkillContext for content creation.
 *
 * Not implemented in MVP — defined here so the seam exists.
 */
import type { Identity, MemoryState } from '@identity-os/core';
import type { PerceptionFrame, Decision } from './types.js';

export interface LLMProvider {
  /**
   * Ask the LLM to decide what the character should do given the
   * current perception frame.  Returns a structured Decision.
   */
  decide(context: {
    identity: Identity;
    memory: MemoryState;
    perception: PerceptionFrame;
  }): Promise<Decision>;

  /**
   * Generate text content in the character's voice.
   * Used by skills for content creation.
   */
  generate(context: {
    identity: Identity;
    prompt: string;
    max_tokens?: number;
  }): Promise<string>;
}
