# Claude Code (CLI) 컨텍스트 제공 가이드

Claude Code에서 프로젝트 규칙과 컨텍스트를 AI에게 전달하는 방법을 정리합니다.

> 공식 문서: https://code.claude.com/docs/en/memory

---

## 1. CLAUDE.md (핵심)

매 세션 시작 시 자동으로 컨텍스트에 로딩되는 마크다운 파일. 가장 기본적이고 중요한 방법입니다.

### 파일 위치 및 우선순위

| 범위 | 위치 | 공유 | 용도 |
|------|------|------|------|
| 조직 정책 | Linux: `/etc/claude-code/CLAUDE.md` | 전체 사용자 | 회사 코딩 표준, 보안 정책 |
| 프로젝트 | `./CLAUDE.md` 또는 `./.claude/CLAUDE.md` | 팀 (git) | 프로젝트 아키텍처, 코딩 표준 |
| 사용자 | `~/.claude/CLAUDE.md` | 개인 전체 | 개인 선호 설정 |
| 로컬 | `./CLAUDE.local.md` | 개인 (.gitignore) | 개인 프로젝트별 설정 |

- 하위 디렉토리의 CLAUDE.md는 해당 디렉토리 파일 접근 시 지연 로딩
- 모든 발견된 파일은 덮어쓰기 없이 연결(concatenate)됨
- HTML 블록 주석(`<!-- -->`)은 컨텍스트 주입 전 제거됨

### 작성 가이드

- 파일당 200줄 이하 권장 (길수록 준수율 저하)
- 구체적으로 작성: "코드 정리해라" ❌ → "2-space 들여쓰기 사용" ✅
- 마크다운 헤더/불릿으로 구조화
- 충돌하는 규칙 없도록 주기적 검토

### 외부 파일 임포트 (`@` 구문)

```markdown
프로젝트 개요는 @README.md 참고.
Git 워크플로우는 @docs/git-instructions.md 참고.
```

- 상대/절대 경로 모두 지원
- 최대 5단계 재귀 임포트
- 첫 사용 시 승인 다이얼로그 표시

### 자동 생성

```bash
# 프로젝트 분석 후 CLAUDE.md 자동 생성
/init
```

---

## 2. `.claude/rules/` (모듈화된 규칙)

CLAUDE.md가 커질 때 주제별로 분리하는 방법. 각 파일은 하나의 주제를 다룹니다.

### 디렉토리 구조

```
.claude/
├── CLAUDE.md              # 메인 프로젝트 지침
└── rules/
    ├── code-style.md      # 코드 스타일
    ├── testing.md          # 테스트 규칙
    ├── security.md         # 보안 요구사항
    └── api-design.md       # API 설계 규칙
```

- `paths` frontmatter 없는 파일: 세션 시작 시 무조건 로딩
- `paths` frontmatter 있는 파일: 매칭 파일 작업 시에만 로딩

### Path-specific rules (조건부 로딩)

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API 개발 규칙

- 모든 API 엔드포인트에 입력 검증 포함
- 표준 에러 응답 포맷 사용
```

지원 패턴:

| 패턴 | 매칭 대상 |
|------|-----------|
| `**/*.ts` | 모든 디렉토리의 TypeScript 파일 |
| `src/**/*` | src/ 하위 모든 파일 |
| `src/**/*.{ts,tsx}` | 중괄호 확장 |

### 사용자 레벨 rules

```
~/.claude/rules/
├── preferences.md     # 개인 코딩 선호
└── workflows.md       # 개인 워크플로우
```

사용자 레벨 rules는 프로젝트 rules보다 낮은 우선순위.

### 심볼릭 링크로 프로젝트 간 공유

```bash
ln -s ~/shared-claude-rules .claude/rules/shared
ln -s ~/company-standards/security.md .claude/rules/security.md
```

---

## 3. `.claude/skills/` (온디맨드 스킬)

필요할 때만 로딩되는 재사용 가능한 지침 패키지. rules와 달리 매 세션 로딩되지 않고, Claude가 관련성을 판단하거나 사용자가 `/skill-name`으로 직접 호출합니다.

### 디렉토리 구조

```
.claude/skills/
└── my-skill/
    ├── SKILL.md           # 메인 지침 (필수)
    ├── template.md        # 템플릿
    ├── examples/
    │   └── sample.md
    └── scripts/
        └── validate.sh
```

### SKILL.md 예시

```markdown
---
name: springboot-tdd
description: Spring Boot TDD 워크플로우. 테스트 작성 시 사용.
allowed-tools: Read Grep Bash
---

# Spring Boot TDD 워크플로우

1. 실패하는 테스트 먼저 작성
2. 최소한의 구현으로 테스트 통과
3. 리팩토링
```

### Frontmatter 주요 필드

| 필드 | 설명 |
|------|------|
| `name` | 스킬 이름 (= `/slash-command`) |
| `description` | Claude가 자동 활성화 판단에 사용 |
| `disable-model-invocation` | `true`면 사용자만 호출 가능 |
| `user-invocable` | `false`면 Claude만 호출 가능 |
| `allowed-tools` | 스킬 활성 시 허용 도구 |
| `context` | `fork`면 서브에이전트에서 실행 |
| `paths` | glob 패턴으로 조건부 활성화 |
| `hooks` | 스킬 라이프사이클 훅 |

### 스킬 위치

| 위치 | 경로 | 범위 |
|------|------|------|
| 개인 | `~/.claude/skills/<name>/SKILL.md` | 모든 프로젝트 |
| 프로젝트 | `.claude/skills/<name>/SKILL.md` | 해당 프로젝트 |
| 플러그인 | `<plugin>/skills/<name>/SKILL.md` | 플러그인 활성 시 |

---

## 4. Auto Memory (자동 메모리)

Claude가 세션 중 스스로 학습한 내용을 저장. 빌드 명령, 디버깅 패턴, 코드 스타일 선호 등.

### 저장 위치

```
~/.claude/projects/<project>/memory/
├── MEMORY.md              # 인덱스 (매 세션 로딩, 200줄/25KB 제한)
├── debugging.md           # 상세 노트 (필요 시 로딩)
└── api-conventions.md
```

### 관리

```bash
/memory          # 메모리 파일 브라우징/편집
```

- 기본 활성화, `autoMemoryEnabled: false`로 비활성화 가능
- 같은 git 저장소의 모든 worktree가 하나의 메모리 디렉토리 공유
- 일반 마크다운이므로 직접 편집/삭제 가능

---

## 5. Hooks (자동화 훅)

Claude Code 라이프사이클의 특정 시점에 셸 명령, HTTP 요청, LLM 프롬프트를 실행합니다.

### 설정 위치

| 위치 | 범위 |
|------|------|
| `~/.claude/settings.json` | 모든 프로젝트 |
| `.claude/settings.json` | 프로젝트 (git 공유 가능) |
| `.claude/settings.local.json` | 프로젝트 (개인, gitignore) |

### 주요 훅 이벤트

| 이벤트 | 시점 | 차단 가능 |
|--------|------|-----------|
| `SessionStart` | 세션 시작/재개 | ❌ (컨텍스트 주입만) |
| `UserPromptSubmit` | 사용자 입력 시 | ✅ |
| `PreToolUse` | 도구 실행 전 | ✅ (allow/deny/ask) |
| `PostToolUse` | 도구 실행 후 | ❌ (피드백만) |
| `Stop` | 응답 완료 시 | ✅ (계속 작업 강제) |

### 설정 예시

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/block-rm.sh"  // 예시 경로
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/lint-check.sh"  // 예시 경로
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "작업 완료 후 최종 점검을 수행하세요."
          }
        ]
      }
    ]
  }
}
```

> **참고**: `Stop` 이벤트는 도구 매칭이 아니므로 `matcher` 필드를 사용하지 않습니다.

### 훅 타입

| 타입 | 설명 |
|------|------|
| `command` | 셸 명령 실행 (stdin으로 JSON 입력) |
| `http` | HTTP POST 요청 |
| `prompt` | LLM에 단일 프롬프트 평가 |
| `agent` | 서브에이전트 스폰 (도구 사용 가능) |

---

## 6. MCP 서버

Model Context Protocol로 외부 도구를 연결합니다.

```bash
# MCP 서버 추가
/mcp add

# 상태 확인
/mcp
```

---

## 7. Settings (설정 파일)

`.claude/settings.json`에서 권한, 훅, 환경 변수 등을 설정합니다.

```json
{
  "permissions": {
    "allow": ["Bash(npm *)", "Read", "Write"],
    "deny": ["Bash(rm -rf *)"]
  },
  "hooks": { ... },
  "claudeMdExcludes": ["**/other-team/CLAUDE.md"]
}
```

---

## 권장 프로젝트 구조

```
my-project/
├── CLAUDE.md                    # 메인 지침 (항상 로딩)
├── CLAUDE.local.md              # 개인 설정 (.gitignore)
├── .claude/
│   ├── settings.json            # 권한, 훅 설정
│   ├── settings.local.json      # 개인 설정 (.gitignore)
│   ├── rules/                   # 항상 적용 규칙
│   │   ├── coding-style.md
│   │   ├── security.md
│   │   ├── testing.md
│   │   └── java-rules.md       # paths: src/**/*.java
│   └── skills/                  # 온디맨드 스킬
│       ├── springboot-tdd/
│       │   └── SKILL.md
│       └── api-design/
│           └── SKILL.md
└── src/
```

---

## Kiro CLI vs Claude Code 비교

| 기능 | Kiro CLI | Claude Code |
|------|----------|-------------|
| 메인 설정 파일 | `.kiro/agents/*.json` | `CLAUDE.md` |
| 모듈화된 규칙 | 에이전트 `resources`로 주입 | `.claude/rules/*.md` |
| 온디맨드 스킬 | 미지원 (steering은 IDE 전용) | `.claude/skills/*/SKILL.md` |
| 조건부 로딩 (paths) | ❌ | ✅ (frontmatter `paths`) |
| 자동 메모리 | ❌ | ✅ (Auto Memory) |
| 파일 임포트 | ❌ | ✅ (`@path` 구문) |
| Hooks | 에이전트 JSON `hooks` | `settings.json` `hooks` |
| MCP 서버 | `/mcp` | `/mcp` |
| 사용자 레벨 규칙 | `~/.kiro/agents/` | `~/.claude/CLAUDE.md`, `~/.claude/rules/` |
| 조직 정책 | ❌ | `/etc/claude-code/CLAUDE.md` |
| `/init` 자동 생성 | ❌ | ✅ |
