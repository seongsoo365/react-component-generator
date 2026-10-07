// localStorage 접근은 용량 초과, 접근 차단, 손상된 값 때문에 언제든 실패할 수 있다.
// 실패해도 앱이 깨지지 않도록 모든 접근을 이 모듈에서 방어한다.

/** 저장된 JSON을 읽는다. 값이 없거나 읽기/파싱에 실패하면 fallback을 반환한다. */
export function readStorage<T>(key: string, fallback: T, parse?: (raw: unknown) => T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    const raw: unknown = JSON.parse(stored);
    return parse ? parse(raw) : (raw as T);
  } catch {
    return fallback;
  }
}

/** 값을 JSON으로 저장한다. 저장에 실패해도 예외를 던지지 않는다. */
export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 용량 초과 등: 이번 저장만 건너뛴다.
  }
}
