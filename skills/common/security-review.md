---
inclusion: manual
---
# Security Review Skill

코드의 보안 취약점을 체계적으로 점검하는 스킬. 프로젝트 기술 스택에 맞는 보안 패턴을 적용한다.

## When to Activate

- 인증/인가 구현 시
- 사용자 입력 처리 또는 파일 업로드 시
- 새 API 엔드포인트 생성 시
- 시크릿/크리덴셜 관련 작업 시
- 민감 데이터 저장/전송 시
- 외부 API 연동 시
- 의존성 업데이트 시

## 1. Secrets Management

- 소스 코드에 API 키, 토큰, 비밀번호 하드코딩 금지
- 환경변수 또는 시크릿 매니저(Vault, AWS Secrets Manager) 사용
- 애플리케이션 시작 시 필수 시크릿 존재 검증 — 없으면 즉시 실패
- `.env` 파일은 `.gitignore`에 포함

### Java/Spring Boot
```java
// BAD
private static final String API_KEY = "sk-abc123...";

// GOOD
String apiKey = System.getenv("PAYMENT_API_KEY");
Objects.requireNonNull(apiKey, "PAYMENT_API_KEY must be set");

// GOOD — Spring application.yml
spring:
  datasource:
    password: ${DB_PASSWORD}
```

### Python/FastAPI
```python
# BAD
API_KEY = "sk-abc123..."

# GOOD — pydantic-settings
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_password: str
    api_key: str

    class Config:
        env_file = ".env"
```

### TypeScript/React
```typescript
// BAD
const apiKey = "sk-abc123..."

// GOOD
const apiKey = process.env.REACT_APP_API_KEY
if (!apiKey) throw new Error('API_KEY not configured')
```

## 2. Input Validation

모든 시스템 경계에서 입력을 검증한다.

### Java — Bean Validation
```java
public record CreateUserDto(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Email String email,
    @NotNull @Min(0) @Max(150) Integer age
) {}

@PostMapping("/users")
public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserDto dto) {
    return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(dto));
}
```

### Python — Pydantic
```python
from pydantic import BaseModel, EmailStr, Field

class CreateUserRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(ge=0, le=150)
```

### TypeScript — Zod
```typescript
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150)
})
```

### File Upload Validation
- 파일 크기 제한 (예: 5MB)
- Content-Type 화이트리스트
- 확장자 검증
- 웹 루트 외부에 저장

## 3. SQL Injection Prevention

문자열 연결로 쿼리를 구성하지 않는다. 항상 파라미터 바인딩 사용.

### Java — JPA/JDBC
```java
// BAD
@Query(value = "SELECT * FROM users WHERE name = '" + name + "'", nativeQuery = true)

// GOOD — 파라미터 바인딩
@Query(value = "SELECT * FROM users WHERE name = :name", nativeQuery = true)
List<User> findByName(@Param("name") String name);

// GOOD — Spring Data 파생 쿼리
List<User> findByEmailAndActiveTrue(String email);
```

### Python — SQLAlchemy
```python
# BAD
db.execute(f"SELECT * FROM users WHERE name = '{name}'")

# GOOD
stmt = select(User).where(User.name == name)
result = await db.execute(stmt)
```

## 4. Authentication & Authorization

- 커스텀 암호화 구현 금지 — 검증된 라이브러리 사용
- 비밀번호는 bcrypt/argon2로 해시 — MD5/SHA1 금지
- 서비스 경계에서 인가 검증 필수
- 로그에 비밀번호, 토큰, PII 출력 금지

### Java — Spring Security
```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/admin/users")
public List<UserDto> listUsers() { ... }

@PreAuthorize("@authz.isOwner(#id, authentication)")
@DeleteMapping("/users/{id}")
public ResponseEntity<Void> deleteUser(@PathVariable Long id) { ... }
```

### Python — FastAPI Depends
```python
from fastapi import Depends, HTTPException
from app.core.security import get_current_user

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
```

## 5. XSS Prevention

- 사용자 제공 HTML은 반드시 새니타이즈
- CSP 헤더 설정
- 프레임워크의 자동 이스케이핑 활용

### React
```tsx
// BAD — dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// GOOD
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Spring Boot — Security Headers
```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
    .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin));
```

## 6. CORS Configuration

- 프로덕션에서 `*` 사용 금지 — 허용 오리진 명시
- 보안 필터 레벨에서 설정 (컨트롤러별 아님)

### Spring Boot
```java
config.setAllowedOrigins(List.of("https://app.example.com"));
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
config.setAllowCredentials(true);
```

### FastAPI
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_credentials=True,
)
```

## 7. Rate Limiting

공개 API에 반드시 적용. 비용이 큰 작업에는 더 엄격한 제한.

### Spring Boot — Bucket4j
```java
Bucket bucket = Bucket.builder()
    .addLimit(Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1))))
    .build();
```

### FastAPI — slowapi
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.get("/search")
@limiter.limit("10/minute")
async def search(request: Request): ...
```

## 8. Error Messages

- API 응답에 스택 트레이스, 내부 경로, SQL 에러 노출 금지
- 서버 로그에 상세 기록, 클라이언트에는 일반 메시지 반환

```java
// BAD
return ApiResponse.error(ex.getMessage());

// GOOD
log.error("Unexpected error: id={}", id, ex);
return ApiResponse.error("Internal server error");
```

## 9. Dependency Security

| 스택 | 감사 명령 |
|------|----------|
| Java/Gradle | `./gradlew dependencyCheckAnalyze` (OWASP) |
| Java/Maven | `mvn dependency-check:check` |
| Python | `pip-audit`, `safety check` |
| Node.js | `npm audit --audit-level=high` |

- CI에서 자동 실행
- 알려진 CVE가 있는 의존성은 머지 차단
- lock 파일 커밋 필수

## Pre-Deployment Checklist

- [ ] 시크릿: 하드코딩 없음, 환경변수 사용
- [ ] 입력 검증: 모든 사용자 입력 검증됨
- [ ] SQL Injection: 모든 쿼리 파라미터화
- [ ] XSS: 사용자 콘텐츠 새니타이즈
- [ ] 인증: 토큰 검증 및 만료 처리
- [ ] 인가: 역할 기반 접근 제어
- [ ] Rate Limiting: 공개 API에 적용
- [ ] HTTPS: 프로덕션에서 강제
- [ ] Security Headers: CSP, X-Frame-Options
- [ ] 에러 처리: 민감 정보 미노출
- [ ] 로깅: 민감 데이터 미기록
- [ ] 의존성: 최신, 취약점 없음
- [ ] CORS: 허용 오리진 명시
- [ ] 파일 업로드: 크기/타입 검증
