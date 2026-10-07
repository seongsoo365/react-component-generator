---
name: create-pr-skill
description: |
  현재 브랜치의 커밋과 diff를 분석해 PR 제목과 본문을 작성하고 GitHub Pull Request를 생성한다. 한국어/영어 템플릿을 지원한다.
  "PR 만들어줘", "PR 생성", "풀리퀘스트 올려줘", "create pr", "open a pull request", "/create-pr-skill" 같은 요청에 활성화한다.
  커밋과 PR 생성 요청이 함께 오면 커밋을 먼저 끝낸 뒤 이 스킬을 사용한다.
context: fork
allowed-tools: Read Glob Grep Bash
---

# create-pr-skill: 브랜치 분석 후 Pull Request 생성

현재 브랜치가 base 브랜치 대비 무엇을 바꿨는지 분석해 PR 본문을 작성하고 `gh pr create`로 PR을 만든다.

`context: fork`로 분리 실행되므로 이전 대화 내용을 볼 수 없다. 모든 판단 근거는 git 상태, 커밋 메시지, diff, 저장소 파일에서 얻는다.

## 인자

- `--lang ko|en` — PR 제목과 본문 언어. 기본값은 `ko`.
- `--base <브랜치>` — base 브랜치. 생략하면 저장소 기본 브랜치.
- `--draft` — Draft PR로 생성.

## 템플릿

본문 구조는 `reference/` 폴더의 템플릿을 따른다. 언어에 맞는 파일 하나만 읽는다.

- 한국어: `reference/pr-template.ko.md`
- 영어: `reference/pr-template.en.md`

## 절차

### 1. 사전 점검

다음을 실행하고 문제가 있으면 PR을 만들지 않고 이유를 보고한 뒤 종료한다.

- `git branch --show-current` — 현재 브랜치. base 브랜치와 같으면 종료한다. 기본 브랜치에서 PR을 만들 수 없고, 기본 브랜치로 직접 push해서도 안 된다.
- `git status --short` — 커밋되지 않은 변경이 있으면 PR에 포함되지 않는다는 점을 최종 보고에 적는다. 임의로 커밋하지 않는다.
- `gh auth status` — 인증되지 않았으면 종료한다.
- `gh pr list --head <현재 브랜치> --state open --json url` — 이미 열린 PR이 있으면 새로 만들지 않고 그 URL을 보고한다.

### 2. base 브랜치 결정

`--base`가 없으면 `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`로 얻는다. 그 브랜치를 `origin/<base>`로 비교한다. 필요하면 `git fetch origin <base>`를 먼저 실행한다.

### 3. 변경 분석

- `git log origin/<base>..HEAD --format='%h %s%n%b'` — PR에 포함될 커밋
- `git diff origin/<base>...HEAD --stat` — 변경 규모
- `git diff origin/<base>...HEAD` — 실제 변경 내용. 크면 파일별로 나눠 읽는다.

포함될 커밋이 없으면 "base 대비 변경이 없습니다."라고 보고하고 종료한다.

diff에서 `.env`, 키, 토큰, 인증서 같은 비밀 정보가 보이면 PR을 만들지 않고 해당 파일을 보고한다. PR은 push된 내용을 공개 또는 팀 전체에 노출하므로 한 번 올라가면 되돌리기 어렵다.

### 4. 제목과 본문 작성

**제목**

- 형식: `<type>: <요약>` (type: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`)
- 70자 이내, 마침표 없음.
- 커밋이 여러 개면 전체를 대표하는 하나의 type으로 요약한다. 커밋이 1개면 그 제목을 기본으로 쓴다.
- 언어는 `--lang`을 따른다. 한국어는 한국어 요약, 영어는 명령형 현재 시제.

**본문**

- 템플릿의 섹션 순서와 제목을 유지한다. 해당 사항이 없는 섹션은 지우지 말고 "없음" / "None"으로 적는다.
- "변경 사항"은 커밋 나열이 아니라 **무엇이 왜 바뀌었는지**를 쓴다. 리뷰어가 diff를 보기 전에 맥락을 잡을 수 있어야 한다.
- "테스트"에는 실제로 확인한 것만 쓴다. 실행하지 않은 테스트를 통과했다고 쓰지 않는다. 확인 근거가 없으면 "확인하지 않음"이라고 적는다. 테스트 명령은 `package.json`의 scripts와 루트 `AGENTS.md`의 Operational Commands에서 찾는다.
- 이슈 번호가 커밋 메시지나 브랜치 이름에 있으면 "관련 이슈"에 `Closes #N` 형태로 쓴다. 근거 없이 만들지 않는다.
- 본문 마지막 줄은 템플릿에 있는 생성 표기를 그대로 유지한다.

### 5. push와 PR 생성

1. 원격에 현재 브랜치가 없거나 앞서 있으면 `git push -u origin <현재 브랜치>`. `--force`는 사용하지 않는다.
2. 본문은 임시 파일에 쓰고 `--body-file`로 전달한다. 인용부호와 줄바꿈 문제를 피하기 위해서다.

```bash
BODY_FILE=$(mktemp)
cat > "$BODY_FILE" <<'EOF'
<작성한 본문>
EOF
gh pr create --base <base> --title "<제목>" --body-file "$BODY_FILE" [--draft]
rm -f "$BODY_FILE"
```

### 6. 보고

사용자에게 다음을 간결하게 전달한다.

- PR URL, 제목, base와 head 브랜치, Draft 여부
- 사전 점검에서 발견한 경고 (커밋되지 않은 변경 등)
- 실행하지 못했거나 건너뛴 단계

## 하지 않는 것

- `main`/`master` 등 기본 브랜치에 직접 push하지 않는다.
- force push, 브랜치 삭제, 기존 PR 수정/닫기를 하지 않는다.
- 커밋을 새로 만들거나 기존 커밋을 고치지 않는다. 필요하면 `commit` 스킬을 먼저 쓰도록 안내한다.
- 파일을 수정하지 않는다. 이 스킬의 도구는 읽기와 `git`/`gh` 실행으로 한정된다.
