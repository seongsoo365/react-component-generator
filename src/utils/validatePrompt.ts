export const MAX_PROMPT_LENGTH = 500;

export function validatePromptLength(prompt: string): { valid: boolean; length: number } {
  const length = prompt.length;
  return { valid: length <= MAX_PROMPT_LENGTH, length };
}
