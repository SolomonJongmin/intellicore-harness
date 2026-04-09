# AX Nexus 백엔드 규칙 (FastAPI + Python)

## 기술 스택

- Python 3.11+ / FastAPI
- SQLAlchemy 2.0 + Alembic (마이그레이션)
- PostgreSQL (asyncpg)
- Redis 캐시
- OpenAI / LangChain / Langfuse (AI/LLM)
- Pydantic v2 (검증)

## 프로젝트 구조

```
app/
├── api/
│   └── v1/
│       └── {domain}.py          # 라우터
├── core/
│   ├── config.py                # 설정
│   ├── security.py              # 인증/JWT
│   └── exceptions.py            # 커스텀 예외
├── models/
│   └── {domain}.py              # SQLAlchemy 모델
├── schemas/
│   └── {domain}.py              # Pydantic 스키마
├── services/
│   └── {domain}_service.py      # 비즈니스 로직
├── repositories/
│   └── {domain}_repository.py   # DB 접근
└── main.py
```

## 코딩 규칙

- async/await 일관 사용 (동기 함수 혼용 금지)
- Pydantic v2 모델로 입출력 검증
- SQLAlchemy 2.0 스타일 쿼리 (select() 문법)
- 환경변수는 `pydantic-settings`로 관리

## 네이밍

| 유형 | 패턴 |
|------|------|
| 라우터 | `{domain}.py` |
| 모델 | `{DomainName}` (PascalCase) |
| 스키마 | `{DomainName}Create`, `{DomainName}Response` |
| 서비스 | `{domain}_service.py` |
| 리포지토리 | `{domain}_repository.py` |

## 예외 처리

```python
# 커스텀 예외 사용 — HTTPException 직접 raise 금지
raise AppException(status_code=404, detail="리소스를 찾을 수 없습니다", error_code="DATA_NOT_FOUND")
```

- error_code 범위: 인증(`AUTH_*`), 데이터(`DATA_*`), 서버(`SERVER_*`), 클라이언트(`CLIENT_*`), 외부서비스(`EXTERNAL_*`)
- `HTTPException` 직접 사용 금지 → `AppException`으로 통일

## API 응답 형식

```python
# 성공: ApiResponse.success("메시지", data)
{"success": True, "message": "조회 성공", "data": {...}}

# 목록 (페이징): ApiResponse.success("메시지", data, pagination)
{"success": True, "message": "목록 조회 성공", "data": [...], "pagination": {"total": 100, "page": 0, "size": 20}}

# 에러: raise AppException → exception_handler가 변환
{"success": False, "message": "리소스를 찾을 수 없습니다", "error_code": "DATA_NOT_FOUND"}
```

## DB 마이그레이션

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## 보안

- JWT 토큰 인증 (PyJWT)
- CORS 설정 필수
- SQL Injection 방지: SQLAlchemy ORM/파라미터 바인딩
- 민감 정보 `.env`로 관리, 로그 출력 금지
