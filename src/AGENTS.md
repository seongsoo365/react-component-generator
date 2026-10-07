# src/AGENTS.md

## Module Context

Vite + React 19 프론트엔드. `/api/generate`로 프롬프트를 보내 받은 코드를 react-live로 렌더링하고 코드 뷰와 함께 보여준다.

## Tech Stack & Constraints

- 서버 호출은 상대 경로 `/api/*`로만 한다 (`src/hooks/useComponentGenerator.ts:23`). Vite 프록시가 3002로 전달하므로 절대 URL을 하드코딩하지 않는다.
- 스타일은 `src/App.css`, `src/index.css`의 클래스 기반이다. 컴포넌트는 `className`만 사용하고 인라인 스타일을 쓰지 않는다 (`src/components/PromptInput.tsx:32-72`). 인라인 스타일은 AI가 생성하는 코드에만 적용되는 규칙이다.
- 서버 코드(`server/`)를 `src/`에서 import하지 않는다. 공유 타입은 `src/types/index.ts`에 두고 서버와 수동으로 동기화한다.

## Implementation Patterns

- 컴포넌트는 `src/components/<PascalCase>.tsx`에 named export로 작성한다 (`export function CodeView`).
- 서버 통신과 상태는 `src/hooks/useComponentGenerator.ts`에 모으고 컴포넌트에서 `fetch`를 직접 호출하지 않는다.
- 새 프로바이더 추가 시 `src/types/index.ts`의 `Provider`와 `src/App.tsx`의 `PROVIDER_CONFIG`를 함께 수정한다 (`src/App.tsx:9`).

## Testing Strategy

- 테스트 실행: `bunx vitest run src`
- 환경은 jsdom이며 `src/test/setup.ts`가 jest-dom 매처 등록과 `afterEach(cleanup)`을 처리한다. 테스트에서 `cleanup`을 중복 호출하지 않는다.
- 상호작용은 `@testing-library/user-event`로 작성한다. 참고 패턴: `src/components/PromptInput.test.tsx`.
- 파일명은 `<컴포넌트>.test.tsx`, 같은 디렉토리에 둔다. 설명은 한국어.

## Local Golden Rules

- Do: 미리보기는 `<LiveProvider noInline>`을 유지한다 (`src/components/LivePreview.tsx:74`). `noInline`을 제거하면 `render()` 호출 기반의 생성 코드가 동작하지 않는다.
- Do: 서버 오류 응답은 `data.error`를 사용자에게 표시한다 (`src/hooks/useComponentGenerator.ts:31-33`). 서버가 한국어 오류 문구를 내려주므로 클라이언트에서 임의 문구로 덮어쓰지 않는다.
- Do: 프로바이더를 바꿀 때 입력한 API 키를 초기화한다 (`src/App.tsx:42-45`). 다른 프로바이더로 키가 전송되는 것을 막는 동작이므로 제거하지 않는다.
- Don't: API 키를 `localStorage` 등에 저장하지 않는다. 현재는 컴포넌트 state에만 존재한다 (`src/App.tsx:15`).
- Don't: 생성된 `code`를 `dangerouslySetInnerHTML`이나 `eval`로 직접 실행하지 않는다. 실행은 react-live를 통해서만 한다.
