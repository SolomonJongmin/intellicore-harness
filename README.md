# Intellicore-Harness

솔로몬테크 팀 전용 AI IDE 하네스 엔지니어링. Kiro와 Claude Code 모두 지원.

## 지원 프로젝트

| 프로필 | 기술 스택 | 설명 |
|--------|-----------|------|
| `cxnexus-backend` | Java 21 / Spring Boot / JPA / PostgreSQL / MongoDB | CX Nexus 백엔드 |
| `cxnexus-front` | React 19 / TypeScript / CRA(craco) | CX Nexus 프론트엔드 |
| `axnexus-backend` | Python / FastAPI / SQLAlchemy / PostgreSQL | AX Nexus 백엔드 |
| `axnexus-front` | React 19 / TypeScript / CRA(craco) | AX Nexus 프론트엔드 |

## 설치

```bash
# 프로젝트 디렉토리에서 실행
cd /path/to/your-project

# Kiro + Claude 모두 설치
node /path/to/intellicore/install.js cxnexus-backend

# Kiro만
node /path/to/intellicore/install.js cxnexus-backend --ide kiro

# Claude만
node /path/to/intellicore/install.js cxnexus-backend --ide claude

# 프로필 목록
node /path/to/intellicore/install.js --list
```

## 설치되는 것

### Kiro (`.kiro/`)

```
.kiro/
├── steering/
│   ├── rules/    # 항상 적용 (always-on)
│   └── skills/   # 필요 시 Kiro가 자동 활성화 (on-demand)
├── hooks/        # 자동화 훅 (pre-write, post-write, diagnostics, review)
├── agents/       # 커스텀 에이전트 (blueprint, reviewer, scanner)
└── settings/     # MCP 서버 설정
```

### Claude (`CLAUDE.md`)

모든 규칙이 하나의 `CLAUDE.md`로 합쳐져 프로젝트 루트에 생성됩니다.

## 구조

```
intellicore-harness/
├── install.js                    # 설치 스크립트
├── profiles/profiles.json        # 프로필 정의
├── rules/                        # 항상 적용되는 규칙 (always-on)
│   ├── common/                   # 공통 규칙
│   ├── cxnexus-backend/          # CX Nexus 백엔드 전용
│   ├── cxnexus-front/            # CX Nexus 프론트 전용
│   ├── axnexus-backend/          # AX Nexus 백엔드 전용
│   └── axnexus-front/            # AX Nexus 프론트 전용
├── skills/                       # 필요 시 활성화되는 스킬 (on-demand)
│   ├── common/                   # 공통 스킬
│   └── cxnexus-backend/          # CX Nexus 백엔드 전용 스킬
├── hooks/
│   ├── kiro/                     # Kiro 전용 hooks
│   └── claude/                   # Claude 전용 hooks
├── agents/                       # 커스텀 에이전트 정의
└── settings/
    └── mcp.json                  # MCP 서버 설정
```

## 규칙 추가/수정

1. `rules/{프로젝트}/` 에 always-on 규칙, `skills/{프로젝트}/` 에 on-demand 스킬 추가
2. `git commit && git push`
3. 각 프로젝트에서 `node install.js <profile>` 재실행

## 팀원 온보딩

```bash
# 1. intellicore-harness 클론
git clone <repo-url> ~/intellicore-harness

# 2. 작업할 프로젝트로 이동
cd ~/project/cxnexus-backend

# 3. 프로필 설치
node ~/intellicore-harness/install.js cxnexus-backend
```

## Kiro CLI에서 설치

Kiro CLI 환경에서 직접 설치할 수도 있습니다.

```bash
# cxnexus-backend 프로필을 Claude 전용으로 설치
cd ~/project/intellicore && node install.js cxnexus-backend --ide claude
```
