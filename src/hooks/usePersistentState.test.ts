import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  it('저장된 값이 없으면 초기값을 사용한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('저장된 값이 있으면 초기값 대신 그 값으로 시작한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('saved');
  });

  it('값을 바꾸면 localStorage에 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));

    act(() => result.current[1]('changed'));

    expect(result.current[0]).toBe('changed');
    expect(JSON.parse(localStorage.getItem('k')!)).toBe('changed');
  });

  it('함수형 업데이트도 지원한다', () => {
    const { result } = renderHook(() => usePersistentState<number[]>('k', [1]));

    act(() => result.current[1]((prev) => [...prev, 2]));

    expect(result.current[0]).toEqual([1, 2]);
  });

  it('다시 마운트해도 마지막 값이 유지된다', () => {
    const first = renderHook(() => usePersistentState('k', 'init'));
    act(() => first.result.current[1]('kept'));
    first.unmount();

    const second = renderHook(() => usePersistentState('k', 'init'));
    expect(second.result.current[0]).toBe('kept');
  });

  it('parse 함수로 저장된 값을 복원한다', () => {
    localStorage.setItem('d', JSON.stringify('2026-01-02T03:04:05.000Z'));
    const { result } = renderHook(() =>
      usePersistentState<Date | null>('d', null, (raw) => new Date(raw as string)),
    );
    expect(result.current[0]).toBeInstanceOf(Date);
  });
});
