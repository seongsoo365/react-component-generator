import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator, MAX_HISTORY } from './useComponentGenerator';

function mockFetchOk(code = 'render(<A />);') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ code }) })),
  );
}

async function generate(
  result: { current: ReturnType<typeof useComponentGenerator> },
  prompt: string,
) {
  await act(async () => {
    await result.current.generate(prompt, undefined, 'google');
  });
}

beforeEach(() => mockFetchOk());
afterEach(() => vi.unstubAllGlobals());

describe('useComponentGenerator 컴포넌트 목록 유지', () => {
  it('다시 마운트해도 생성된 컴포넌트가 복원되고 createdAt은 Date다', async () => {
    const first = renderHook(() => useComponentGenerator());
    await generate(first.result, '카드');
    first.unmount();

    const second = renderHook(() => useComponentGenerator());
    expect(second.result.current.components).toHaveLength(1);
    expect(second.result.current.components[0].prompt).toBe('카드');
    expect(second.result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('삭제와 전체 삭제도 저장소에 반영된다', async () => {
    const first = renderHook(() => useComponentGenerator());
    await generate(first.result, 'a');
    await generate(first.result, 'b');
    act(() => first.result.current.removeComponent(first.result.current.components[0].id));
    first.unmount();

    const second = renderHook(() => useComponentGenerator());
    expect(second.result.current.components.map((c) => c.prompt)).toEqual(['a']);

    act(() => second.result.current.clearAll());
    second.unmount();

    const third = renderHook(() => useComponentGenerator());
    expect(third.result.current.components).toEqual([]);
  });

  it('저장된 값의 형식이 잘못되었으면 빈 목록으로 시작한다', () => {
    localStorage.setItem('rcg:components', JSON.stringify([{ id: 1, nope: true }]));
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toEqual([]);
  });
});

describe('useComponentGenerator 프롬프트 히스토리', () => {
  it('생성한 프롬프트가 최신순으로 쌓인다', async () => {
    const { result } = renderHook(() => useComponentGenerator());
    await generate(result, 'a');
    await generate(result, 'b');
    expect(result.current.history).toEqual(['b', 'a']);
  });

  it('같은 프롬프트는 중복 없이 맨 앞으로 이동한다', async () => {
    const { result } = renderHook(() => useComponentGenerator());
    await generate(result, 'a');
    await generate(result, 'b');
    await generate(result, 'a');
    expect(result.current.history).toEqual(['a', 'b']);
  });

  it(`최대 ${MAX_HISTORY}개까지만 유지한다`, async () => {
    const { result } = renderHook(() => useComponentGenerator());
    for (let i = 0; i <= MAX_HISTORY; i++) {
      await generate(result, `p${i}`);
    }
    expect(result.current.history).toHaveLength(MAX_HISTORY);
    expect(result.current.history[0]).toBe(`p${MAX_HISTORY}`);
    expect(result.current.history).not.toContain('p0');
  });

  it('요청이 실패해도 프롬프트는 히스토리에 남는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, json: async () => ({ error: '실패' }) })),
    );
    const { result } = renderHook(() => useComponentGenerator());
    await generate(result, '재시도할 프롬프트');
    expect(result.current.error).toBe('실패');
    expect(result.current.history).toEqual(['재시도할 프롬프트']);
  });

  it('다시 마운트해도 히스토리가 유지된다', async () => {
    const first = renderHook(() => useComponentGenerator());
    await generate(first.result, 'a');
    first.unmount();

    const second = renderHook(() => useComponentGenerator());
    expect(second.result.current.history).toEqual(['a']);
  });
});
