import { describe, it, expect, vi, afterEach } from 'vitest';
import { readStorage, writeStorage } from './storage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readStorage / writeStorage', () => {
  it('저장한 값을 JSON 그대로 다시 읽는다', () => {
    writeStorage('k', { a: 1, list: ['x'] });
    expect(readStorage('k', null)).toEqual({ a: 1, list: ['x'] });
  });

  it('키가 없으면 fallback을 반환한다', () => {
    expect(readStorage('missing', '기본값')).toBe('기본값');
  });

  it('저장된 JSON이 손상되었으면 fallback을 반환한다', () => {
    localStorage.setItem('broken', '{not json');
    expect(readStorage('broken', [])).toEqual([]);
  });

  it('저장소가 가득 차 setItem이 던져도 예외를 전파하지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(() => writeStorage('k', 'v')).not.toThrow();
  });

  it('파싱 함수가 던지면 fallback을 반환한다', () => {
    writeStorage('k', 'bad');
    const parse = () => {
      throw new Error('형식 오류');
    };
    expect(readStorage('k', 'fallback', parse)).toBe('fallback');
  });

  it('파싱 함수가 있으면 변환된 값을 반환한다', () => {
    writeStorage('d', '2026-01-02T03:04:05.000Z');
    const parse = (raw: unknown) => new Date(raw as string);
    expect(readStorage('d', null, parse)).toEqual(new Date('2026-01-02T03:04:05.000Z'));
  });
});
