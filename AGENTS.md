# AGENTS.md

## Operational Commands

- 패키지 매니저는 `bun` 고정. npm/yarn/pnpm 사용 금지 (`bun.lock` 사용).
- 개발 서버 (API 3002 + Vite 5173 동시): `bun run dev`
- API 서버만: `bun run server`
- 전체 테스트: `bun run test` (vitest run, `src/**`와 `server/**` 모두 포함)
- 단일 테스트: `bunx vitest run server/generator.test.ts`
- 린트: `bun run lint`
- 빌드/타입체크: `bun run build` (`tsc -b && vite build`)
- 작업 완료 전 `bun run test`와 `bun run lint`를 실행한다.

## Golden Rules

### Immutable

- `.env`를 읽어 출력하거나 커밋하지 않는다. `.gitignore:26`에서 제외되어 있고 실제 API 키가 들어 있다.
- API 키는 서버 밖으로 내보내지 않는다. `/api/config`는 키 값이 아닌 보유 여부(boolean)만 반환한다 (`server/index.ts:147-157`). 이 응답에 키 값을 추가하지 않는다.
- Google API 키는 URL 쿼리에 포함되므로 (`server/index.ts:99`) 해당 URL이나 `err.message`를 로그/응답에 노출하지 않는다.

### Hard Constraint

- AI가 생성하는 코드는 react-live `noInline` 모드로 실행되므로 `render(<Component />)` 호출이 필수다 (`src/components/LivePreview.tsx:74`, `server/generator.ts:238-246`). 이 계약을 바꾸면 `SYSTEM_PROMPT`(`server/index.ts:7-49`), `ensureRenderCall`, `LivePreview`를 함께 수정한다.
- 생성 코드에는 import 문과 TypeScript 문법을 허용하지 않는다 (`server/index.ts:11,20`). react-live가 런타임에 그대로 실행하기 때문이다.
- 서버 포트 3002는 `server/index.ts:139`와 `vite.config.ts:11` 두 곳에 하드코딩되어 있다. 변경 시 둘을 함께 수정한다.

### Asymmetry

- 폴백(`withModelFallback`)은 Google 경로에만 적용된다 (`server/index.ts:134-136`). Anthropic은 단일 모델이다 (`server/index.ts:77`). 폴백을 추가하려면 같은 헬퍼를 재사용한다.
- 오류 문자열에 `'503'`/`'429'`가 포함되는지로 HTTP 상태를 매핑한다 (`server/index.ts:194-206`). 프로바이더 오류 메시지 형식(`... API error: <status>`)을 바꾸면 이 매핑이 깨진다.

### Test Boundary

- 테스트가 있는 영역: `server/fallback.ts`, `server/generator.ts`(순수 함수), `src/components/PromptInput.tsx`. 테스트가 없는 영역: `server/index.ts`, `src/App.tsx`, `src/hooks/`, `LivePreview`, `CodeView`.
- 서버에 새 순수 로직을 추가할 때는 `server/index.ts`(`Bun.serve` 부수효과)에 넣지 말고 `server/generator.ts`나 `server/fallback.ts`처럼 별도 모듈로 분리해 테스트를 함께 작성한다 (`server/generator.ts:1-2`).

### Double Defense

- API 키 부재는 클라이언트(`src/App.tsx:35`)와 서버(`server/index.ts:169`) 양쪽에서 검사한다. 한쪽만 제거하지 않는다.

## Project Context

프롬프트로 React 컴포넌트를 생성하고 실시간 미리보기와 코드를 제공하는 도구. 소개, 설치, 기능 설명은 `README.md` 참조.

Tech Stack: React 19, TypeScript, Vite, Bun, react-live, Vitest, Testing Library, ESLint.

## Standards & References

- 커밋 메시지: 한국어 Conventional Commits (`feat:`, `fix:`, `chore:` 등). 예: `feat: 컴포넌트 생성 서버와 폴백 로직 추가`.
- 사용자 대상 문구와 코드 주석, 테스트 설명은 한국어로 작성한다 (`server/fallback.ts:1-2`, `server/generator.test.ts:5`).
- 모듈별 규칙은 아래 Context Map의 하위 `AGENTS.md`를 따른다.
- Maintenance Policy: 규칙과 코드 사이에 괴리가 발견되면 작업을 마치기 전에 해당 `AGENTS.md` 업데이트를 제안한다.

## Context Map

- **[서버 수정 (Bun/AI 프록시)](./server/AGENTS.md)** — `server/` 하위 API, 프롬프트, 폴백 로직 작업 시.
- **[프론트엔드 수정 (React/react-live)](./src/AGENTS.md)** — `src/` 하위 UI, 훅, 컴포넌트, 테스트 작업 시.
