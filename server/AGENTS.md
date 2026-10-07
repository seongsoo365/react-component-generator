# server/AGENTS.md

## Module Context

Bun 런타임에서 실행되는 AI API 프록시. Anthropic/Google 호출 결과를 react-live용 코드로 정규화해 프론트엔드에 반환한다.

## Tech Stack & Constraints

- 런타임은 Bun (`Bun.serve`, `process.env`). Node 전용 서버 프레임워크(express 등)를 도입하지 않는다.
- HTTP 클라이언트는 내장 `fetch`만 사용한다 (`server/index.ts:69,101`). 외부 SDK/axios를 추가하지 않는다.
- `server/`는 어떤 tsconfig의 `include`에도 없다 (`tsconfig.app.json:27`, `tsconfig.node.json:25`). `bun run build`로는 타입 오류가 잡히지 않으므로 타입 안전성은 직접 주의한다.

## Implementation Patterns

- 모든 응답에 `CORS_HEADERS`를 붙인다 (`server/index.ts:51-55`). 새 라우트의 성공/에러 응답 모두 포함한다.
- 새 프로바이더 추가 시: `Provider` 유니온, `ENV_KEYS`, `/api/config`의 `envKeys`, `resolveApiKey` 호출부를 함께 수정한다 (`server/index.ts:57-66,150-153`).
- 프로바이더 함수는 실패 시 `<이름> API error: <status>` 형식으로 throw한다. 상위 catch가 이 문자열의 상태 코드로 응답을 매핑한다 (`server/index.ts:84-86,194-206`).
- Google 모델 우선순위는 `GOOGLE_MODELS` 배열 순서이다 (`server/index.ts:5`). 모델 교체는 이 배열에서만 한다.

## Testing Strategy

- 테스트 실행: `bunx vitest run server`
- 테스트 대상은 부수효과 없는 모듈(`generator.ts`, `fallback.ts`)이다. `index.ts`는 import 시 서버가 기동되므로 테스트에서 import하지 않는다.
- 파일명은 `<모듈>.test.ts`, 같은 디렉토리에 둔다. `describe`/`it` 설명은 한국어.

## Local Golden Rules

- Do: 응답 텍스트는 반드시 `ensureRenderCall(stripCodeFences(text))`를 거쳐 반환한다 (`server/index.ts:188`). 새 프로바이더 경로도 동일하게 적용한다.
- Do: Gemini 응답이 `MAX_TOKENS`로 끊기면 에러로 처리한다 (`server/index.ts:123-125`). 잘린 코드를 정상 응답으로 반환하지 않는다.
- Don't: `Provider` 타입을 `src/types/index.ts`와 따로 수정하지 않는다. 두 곳에 중복 정의되어 있다 (`server/index.ts:57`, `src/types/index.ts:1`). 한쪽을 바꾸면 반드시 다른 쪽도 맞춘다.
- Don't: `generator.ts`에 `Bun.*`이나 `process.env` 의존을 넣지 않는다. vitest(jsdom)에서 실행되는 순수 모듈이다 (`server/generator.ts:1-2`, `vite.config.ts:18-19`).
