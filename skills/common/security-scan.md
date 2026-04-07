---
inclusion: manual
---
# Security Scan Skill

프로젝트의 보안 취약점을 자동으로 스캔하고 리포트를 생성하는 스킬.

## When to Activate

- 새 프로젝트 설정 시
- 의존성 업데이트 후
- 에이전트/MCP 설정 변경 후
- 배포 전 보안 점검
- 정기 보안 감사

## 스캔 영역

### 1. 소스 코드 정적 분석

기술 스택별 스캔 도구:

| 스택 | 도구 | 명령 |
|------|------|------|
| Java | SpotBugs, OWASP DC | `./gradlew spotbugsMain`, `./gradlew dependencyCheckAnalyze` |
| Python | bandit, pip-audit | `bandit -r app/`, `pip-audit` |
| TypeScript | eslint-plugin-security | `npx eslint . --plugin security` |

### 2. 의존성 취약점

| 스택 | 명령 |
|------|------|
| Java/Gradle | `./gradlew dependencyCheckAnalyze` |
| Java/Maven | `mvn dependency-check:check` |
| Python | `pip-audit`, `safety check` |
| Node.js | `npm audit --audit-level=high` |

### 3. 시크릿 탐지

```bash
# 모든 스택 공통 — grep 기반 시크릿 탐지
grep -rn --include="*.java" --include="*.py" --include="*.ts" --include="*.tsx" \
  -E '(password|secret|api_key|token)\s*=\s*["\x27][^"\x27]{8,}' src/ app/

# .env 파일이 gitignore에 포함되어 있는지 확인
grep -q '\.env' .gitignore && echo "OK" || echo "WARNING: .env not in .gitignore"
```

### 4. 에이전트 설정 스캔

[AgentShield](https://github.com/affaan-m/agentshield) 사용:

```bash
npx ecc-agentshield scan                          # 기본 스캔
npx ecc-agentshield scan --min-severity medium     # 중간 이상만
npx ecc-agentshield scan --format json             # CI/CD용 JSON
npx ecc-agentshield scan --fix                     # 자동 수정
```

스캔 대상:
| 파일 | 점검 항목 |
|------|----------|
| `CLAUDE.md` | 하드코딩된 시크릿, 프롬프트 인젝션 패턴 |
| `settings.json` | 과도한 허용 목록, 누락된 거부 목록 |
| `mcp.json` | 위험한 MCP 서버, 하드코딩된 env 시크릿 |
| `hooks/` | 커맨드 인젝션, 데이터 유출, 에러 무시 |
| `agents/*.md` | 무제한 도구 접근, 프롬프트 인젝션 표면 |

## 심각도 등급

| 등급 | 점수 | 의미 |
|------|------|------|
| A | 90-100 | 안전한 설정 |
| B | 75-89 | 경미한 이슈 |
| C | 60-74 | 주의 필요 |
| D | 40-59 | 상당한 위험 |
| F | 0-39 | 심각한 취약점 |

## 결과 해석

### Critical (즉시 수정)
- 설정 파일에 하드코딩된 API 키/토큰
- 무제한 셸 접근 허용
- hooks에서 커맨드 인젝션 가능

### High (프로덕션 전 수정)
- 인증 모듈 테스트 부재
- 누락된 거부 목록
- 에이전트에 불필요한 Bash 접근

### Medium (권장)
- hooks에서 에러 무시 (`2>/dev/null`, `|| true`)
- MCP 서버 설정에 `npx -y` 자동 설치
- 보안 hooks 미설정
