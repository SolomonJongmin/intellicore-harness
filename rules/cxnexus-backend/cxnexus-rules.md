# CX Nexus 프로젝트 규칙 (Always-On)

## DDD 패키지 구조

```
{domain}/
├── application/
│   ├── {DomainName}Service.java
│   ├── command/{Action}{DomainName}Command.java
│   └── query/{Action}{DomainName}Query.java
├── controller/
│   ├── {DomainName}Controller.java
│   ├── request/{Action}{DomainName}Request.java
│   └── response/{DomainName}Response.java
├── domain/
│   ├── {DomainName}.java
│   └── {DomainName}Repository.java (Interface)
└── infrastructure/
    ├── {DomainName}JpaRepository.java
    └── {DomainName}RepositoryImpl.java
```

레이어 의존 방향: Controller → Application → Domain ← Infrastructure

## Entity 규칙

- `AuditEntity` 상속 필수 (createdDate, changedDate, createdUser, changedUser 자동 관리)
- Lombok: `@Entity`, `@Builder`, `@NoArgsConstructor(access = PROTECTED)`, `@AllArgsConstructor(access = PRIVATE)`, `@Getter`
- `@Setter` 사용 금지 — 상태 변경은 도메인 메서드로만
- `@Table`에 schema 명시적 지정

## CQRS 패턴

- 변경(Create/Update/Delete) → Command 객체 (`@Builder` + record)
- 조회(Read) → Query 객체 (`@Builder` + record)
- Command와 Query를 하나의 DTO로 합치지 않음

## Response 규칙

- Response는 Class 사용 (record 아님)
- `from()` 정적 팩토리 + `fromList()` 제공

## API 응답 형식

```java
// 성공: ApiResponse.success("메시지", data)
// 에러: throw new BusinessException(ErrorCode.XXX, "한글 메시지")
```

## 예외 처리

- `RuntimeException` 직접 throw 금지 → `BusinessException(ErrorCode.XXX)` 사용
- ErrorCode 범위: 인증(1000~), 데이터(2000~), 서버(3000~), 클라이언트(4000~), 외부서비스(5000~)

## 네이밍

| 유형 | 패턴 |
|------|------|
| Entity | `{DomainName}` |
| Service | `{DomainName}Service` |
| Controller | `{DomainName}Controller` |
| Request | `{Action}{DomainName}Request` |
| Response | `{DomainName}Response` |
| Command | `{Action}{DomainName}Command` |
| Query | `{Action}{DomainName}Query` |

CRUD 메서드: `create`, `get`, `getAll`, `update`, `delete`

## 의존성 주입

`@RequiredArgsConstructor` + `private final` 필드

## Swagger 문서화

- Controller: `@Tag`, `@Operation`, `@Parameter`
- DTO: `@Schema(description, example)`
- Request: `@NotBlank`, `@Size` 등 validation + `@Valid`

## 로깅

- `@Slf4j` 사용, 주요 로직 `log.info()`, 상세 `log.debug()`
- 민감 정보(비밀번호, 토큰) 로그 출력 금지

## DB

- Flyway: `V{version}__{description}.sql`, PostgreSQL 문법
- 대량 조회 시 페이징 적용
- N+1 방지: `@EntityGraph` 또는 `JOIN FETCH`

## 배포 포트 규칙

- backend: `20000 + projectId`
- frontend: `30000 + projectId`
