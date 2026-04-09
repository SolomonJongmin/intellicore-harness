---
inclusion: manual
---
# FastAPI Security Review

Python/FastAPI 백엔드의 보안 취약점을 점검하는 스킬.

## When to Activate

- 인증/인가 구현 시 (JWT, OAuth2)
- 새 API 엔드포인트 추가 시
- 사용자 입력 처리 시
- DB 쿼리 작성 시
- 시크릿/환경변수 관리 시

## 1. Authentication

```python
# JWT 토큰 검증 — Depends로 주입
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        user = await user_repo.find_by_id(payload["sub"])
        if not user:
            raise AppException(status_code=401, detail="사용자를 찾을 수 없습니다", error_code="AUTH_USER_NOT_FOUND")
        return user
    except jwt.ExpiredSignatureError:
        raise AppException(status_code=401, detail="토큰이 만료되었습니다", error_code="AUTH_TOKEN_EXPIRED")
    except jwt.InvalidTokenError:
        raise AppException(status_code=401, detail="유효하지 않은 토큰입니다", error_code="AUTH_TOKEN_INVALID")
```

## 2. Authorization

```python
# 역할 기반 접근 제어
def require_role(role: str):
    async def checker(user: User = Depends(get_current_user)):
        if user.role != role:
            raise AppException(status_code=403, detail="접근 권한이 없습니다", error_code="AUTH_FORBIDDEN")
        return user
    return checker

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, admin: User = Depends(require_role("admin"))):
    await user_service.delete(user_id)
```

## 3. Input Validation — Pydantic

```python
from pydantic import BaseModel, EmailStr, Field, field_validator

class CreateUserRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(ge=0, le=150)

    @field_validator('name')
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        # HTML 태그 제거
        import re
        return re.sub(r'<[^>]+>', '', v).strip()
```

## 4. SQL Injection Prevention

```python
# BAD — 문자열 포매팅
await db.execute(f"SELECT * FROM users WHERE name = '{name}'")

# GOOD — SQLAlchemy ORM
stmt = select(User).where(User.name == name)
result = await db.execute(stmt)

# GOOD — 파라미터 바인딩
stmt = text("SELECT * FROM users WHERE name = :name")
result = await db.execute(stmt, {"name": name})
```

## 5. Secrets Management

```python
# pydantic-settings로 환경변수 관리
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    redis_url: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"

settings = Settings()  # .env 없으면 환경변수에서 로드
```

## 6. CORS

```python
from fastapi.middleware.cors import CORSMiddleware

# BAD — 프로덕션에서 * 사용
app.add_middleware(CORSMiddleware, allow_origins=["*"])

# GOOD — 허용 오리진 명시
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_credentials=True,
)
```

## 7. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.get("/search")
@limiter.limit("10/minute")
async def search(request: Request, q: str):
    ...
```

## 8. Error Handling

```python
# BAD — 내부 정보 노출
@app.exception_handler(Exception)
async def handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": str(exc)})

# GOOD — AppException은 그대로 변환, 나머지는 일반 메시지 + 서버 로그
import logging
logger = logging.getLogger(__name__)

@app.exception_handler(AppException)
async def app_exception_handler(request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail, "error_code": exc.error_code},
    )

@app.exception_handler(Exception)
async def unhandled_handler(request, exc):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "서버 내부 오류가 발생했습니다", "error_code": "SERVER_ERROR"},
    )
```

## 9. Dependency Security

```bash
pip-audit              # 의존성 취약점 스캔
safety check           # 알려진 CVE 확인
bandit -r app/         # 정적 보안 분석
```

## Checklist

- [ ] 모든 엔드포인트에 인증 Depends 적용
- [ ] 역할 기반 인가 구현
- [ ] Pydantic으로 모든 입력 검증
- [ ] SQLAlchemy ORM/파라미터 바인딩 사용
- [ ] 시크릿은 pydantic-settings로 관리
- [ ] CORS 허용 오리진 명시
- [ ] Rate limiting 적용
- [ ] 에러 메시지에 내부 정보 미노출
- [ ] 로그에 민감 데이터 미기록
- [ ] 의존성 취약점 스캔 통과
