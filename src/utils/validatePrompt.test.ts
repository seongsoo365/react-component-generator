import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePromptLength } from './validatePrompt';

describe('validatePromptLength', () => {
  it('최대 길이는 500자이다', () => {
    expect(MAX_PROMPT_LENGTH).toBe(500);
  });

  it('500자 이하이면 유효하다', () => {
    expect(validatePromptLength('가'.repeat(500))).toEqual({ valid: true, length: 500 });
  });

  it('500자를 넘으면 유효하지 않다', () => {
    expect(validatePromptLength('가'.repeat(501))).toEqual({ valid: false, length: 501 });
  });

  it('빈 문자열은 유효하다', () => {
    expect(validatePromptLength('')).toEqual({ valid: true, length: 0 });
  });
});
