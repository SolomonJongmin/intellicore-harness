# Kiro CLI 컨텍스트 제공 가이드

Kiro CLI에서 프로젝트 규칙과 컨텍스트를 AI에게 전달하는 방법을 정리합니다.

> ⚠️ Kiro CLI는 `.kiro/steering/` 디렉토리를 자동으로 읽지 않습니다. Kiro IDE(GUI)와 Kiro CLI는 컨텍스트 로딩 방식이 다릅니다.

---

## 1. 에이전트 설정 (`.kiro/agents/`)

가장 핵심적인 방법. JSON 파일로 에이전트를 정의하면 시스템 프롬프트, 리소스, 도구 권한, 훅을 모두 설정할 수 있습니다.

### 파일 위치

| 위치 | 범위 | 설명 |
|------|------|------|
| `.kiro/agents/*.json` | 프로젝트 전용 | 해당 디렉토리에서 실행할 때만 적용 |
| `~/.kiro/agents/*.json` | 전역 | 모든 프로젝트에서 사용 가능 |

로컬 에이전트가 전역보다 우선합니다.

### 에이전트 JSON 구조

```json
{
  "description": "CX Nexus 백엔드 개발 에이전트",
  "tools": ["@builtin", "@git"],
  "allowedTools": ["fs_read", "fs_write", "execute_bash", "code", "web_search"],
  "toolsSettings": {
    "execute_bash": {
      "allowedCommands": ["./gradlew .*", "git .*"],
      "autoAllowReadonly": true
    },
    "fs_write": {
      "allowedPaths": ["./src/**", "./docs/**"]
    }
  },
  "resources": [
    "file://README.md",
    "file://docs/architecture.md"
  ],
  "hooks": []
}
```

### 주요 필드

| 필드 | 설명 |
|------|------|
| `description` | 에이전트 설명 |
| `tools` | 사용 가능한 도구 (`@builtin` = 모든 내장 도구) |
| `allowedTools` | 승인 없이 사용 가능한 도구 |
| `toolsSettings` | 도구별 세부 권한 설정 |
| `resources` | 자동 로딩할 파일/디렉토리 (컨텍스트로 주입) |
| `hooks` | 라이프사이클 훅 (AgentSpawn, PreToolUse 등) |

### resources로 규칙 파일 주입

```json
{
  "resources": [
    "file://rules/coding-style.md",
    "file://rules/security.md",
    "file://rules/java-rules.md",
    "file://rules/**/*.md"
  ]
}
```

`file://` 프로토콜로 프로젝트 내 파일을 지정하면 에이전트 시작 시 자동으로 컨텍스트에 포함됩니다. glob 패턴도 지원합니다.

### 에이전트 실행

```bash
# 특정 에이전트로 시작
kiro-cli chat --agent cxnexus-backend

# 기본 에이전트 설정
kiro-cli settings chat.defaultAgent cxnexus-backend
```

---

## 2. `/context` 명령 (수동 컨텍스트 추가)

채팅 세션 중 수동으로 파일을 컨텍스트에 추가합니다.

```bash
/context add rules/coding-style.md
/context add rules/security.md
/context add src/main/java/com/example/Application.java
```

- 세션 단위로 동작 (새 세션 시작하면 초기화)
- 빠르게 특정 파일을 참조시킬 때 유용
- `/context` 로 현재 컨텍스트 윈도우 사용량 확인 가능

---

## 3. Knowledge Base (실험적 기능)

파일/디렉토리를 시맨틱 검색 가능한 지식 베이스로 등록합니다. 세션 간 영속적으로 유지됩니다.

### 활성화

```bash
kiro-cli settings chat.enableKnowledge true
```

### 사용법

```bash
# 규칙 디렉토리 등록
/knowledge add --name "project-rules" --path ./rules --index-type Fast

# 프로젝트 소스 등록 (시맨틱 검색)
/knowledge add --name "source-code" --path ./src --index-type Best \
  --include "**/*.java" --exclude "**/test/**"

# 확인
/knowledge show

# 업데이트
/knowledge update ./rules

# 삭제
/knowledge remove "project-rules"
```

### 인덱스 타입

| 타입 | 방식 | 적합한 용도 |
|------|------|-------------|
| `Fast` | BM25 키워드 검색 | 규칙 파일, 설정, 로그, 대규모 코드베이스 |
| `Best` | 시맨틱 임베딩 | 문서, 자연어 검색이 필요한 경우 |

### 에이전트 설정에서 자동 등록

```json
{
  "resources": [
    {
      "type": "knowledgeBase",
      "source": "file://./rules",
      "name": "프로젝트 규칙",
      "indexType": "fast",
      "include": ["**/*.md"],
      "autoUpdate": true
    }
  ]
}
```

`autoUpdate: true`로 설정하면 에이전트 로드 시 자동으로 재인덱싱됩니다.

---

## 4. Hooks (자동화 훅)

에이전트 라이프사이클에 스크립트를 연결하여 컨텍스트를 동적으로 주입합니다.

### 훅 타입

| 훅 | 시점 | 용도 |
|----|------|------|
| `AgentSpawn` | 에이전트 시작 시 | 초기 컨텍스트 주입 (STDOUT이 컨텍스트에 추가) |
| `UserPromptSubmit` | 사용자 입력 시 | 동적 컨텍스트 추가 |
| `PreToolUse` | 도구 실행 전 | 검증/차단 |
| `PostToolUse` | 도구 실행 후 | 후처리 |
| `Stop` | 응답 완료 후 | 포맷팅, 테스트 실행 등 |

### 예시: AgentSpawn으로 규칙 주입

```json
{
  "hooks": [
    {
      "type": "AgentSpawn",
      "command": "cat rules/*.md",
      "timeout_ms": 5000
    }
  ]
}
```

AgentSpawn 훅의 STDOUT 출력은 에이전트 컨텍스트에 자동 추가됩니다.

### 예시: PostToolUse로 코드 리뷰

```json
{
  "hooks": [
    {
      "type": "PostToolUse",
      "matcher": "fs_write",
      "command": "bash ./scripts/quick-review.sh",
      "timeout_ms": 10000
    }
  ]
}
```

---

## 5. MCP 서버

외부 도구를 MCP(Model Context Protocol) 서버로 연결합니다.

```bash
# MCP 서버 추가
/mcp add

# 상태 확인
/mcp

# 에이전트에 MCP 도구 연결
```

에이전트 JSON에서 MCP 도구 참조:

```json
{
  "tools": ["@builtin", "@git", "@postgres"],
  "allowedTools": ["@git/git_status", "@git/git_log"]
}
```

---

## 6. Code Intelligence (`/code init`)

LSP 기반 코드 인텔리전스로 코드베이스를 구조적으로 이해합니다.

```bash
# 프로젝트 루트에서 초기화
/code init

# 상태 확인
/code status

# 강제 재시작
/code init -f
```

`.kiro/settings/lsp.json`이 생성되며, 이후 세션에서 자동 초기화됩니다.

지원 언어: Java, TypeScript, Python, Rust, Go, Ruby, C/C++, Kotlin 등 18개

---

## 권장 설정 조합

### 프로젝트별 에이전트 + Knowledge Base

```
my-project/
├── .kiro/
│   └── agents/
│       └── default.json      ← 에이전트 설정
├── rules/                     ← 규칙 파일들
│   ├── coding-style.md
│   ├── security.md
│   └── java-rules.md
└── src/
```

`default.json`:

```json
{
  "description": "프로젝트 개발 에이전트",
  "tools": ["@builtin"],
  "allowedTools": ["fs_read", "code"],
  "resources": [
    "file://README.md",
    "file://rules/**/*.md"
  ],
  "hooks": [
    {
      "type": "Stop",
      "command": "bash ./scripts/post-check.sh",
      "timeout_ms": 15000
    }
  ]
}
```

이렇게 하면:
1. 에이전트 시작 시 `rules/**/*.md` 파일이 자동으로 컨텍스트에 로딩
2. 코드 작성 후 자동 검증 훅 실행
3. `/code init`으로 LSP 코드 인텔리전스 활성화

---

## Kiro IDE vs Kiro CLI 비교

| 기능 | Kiro IDE | Kiro CLI |
|------|----------|----------|
| `.kiro/steering/rules/` 자동 로딩 | ✅ | ❌ |
| `.kiro/steering/skills/` 자동 로딩 | ✅ | ❌ |
| `.kiro/agents/*.json` | ✅ | ✅ |
| `/context` 수동 추가 | ❌ | ✅ |
| `/knowledge` 지식 베이스 | ❌ | ✅ (실험적) |
| Hooks | ✅ | ✅ |
| MCP 서버 | ✅ | ✅ |
| Code Intelligence (LSP) | 내장 | `/code init` |
