---
inclusion: manual
---
# Backend Development Patterns

CX Nexus 백엔드(Java 21 / Spring Boot) 아키텍처 패턴 및 모범 사례.

## When to Activate

- REST API 엔드포인트 설계
- Controller → Service → Repository 레이어 구현
- 데이터베이스 쿼리 최적화 (N+1, 인덱싱, 커넥션 풀)
- 캐싱 (Redis, in-memory, HTTP cache headers) 추가
- 백그라운드 작업 또는 비동기 처리 설정
- API 에러 처리 및 검증 구조화
- 미들웨어 (인증, 로깅, Rate Limiting) 구축

## API Design Patterns

### RESTful API Structure

```
GET    /api/{domain}                 # 목록 조회
GET    /api/{domain}/:id             # 단건 조회
POST   /api/{domain}                 # 생성
PUT    /api/{domain}/:id             # 수정
DELETE /api/{domain}/:id             # 삭제

# 필터링, 정렬, 페이징은 쿼리 파라미터
GET /api/markets?status=active&sort=volume&page=0&size=20
```

### Controller 패턴

```java
@RestController
@RequestMapping("/api/markets")
@RequiredArgsConstructor
@Tag(name = "Market", description = "마켓 API")
class MarketController {
    private final MarketService marketService;

    @GetMapping
    @Operation(summary = "마켓 목록 조회")
    ApiResponse<Page<MarketResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success("마켓 목록 조회 성공",
                marketService.getAll(PageRequest.of(page, size)));
    }

    @PostMapping
    @Operation(summary = "마켓 생성")
    ApiResponse<MarketResponse> create(@Valid @RequestBody CreateMarketRequest request) {
        return ApiResponse.success("마켓 생성 성공",
                marketService.create(request.toCommand()));
    }
}
```

### Repository 패턴

```java
// Domain layer — interface
public interface MarketRepository {
    Optional<Market> findById(Long id);
    Page<Market> findAll(Pageable pageable);
    Market save(Market market);
    void deleteById(Long id);
}

// Infrastructure layer — JPA 구현
public interface MarketJpaRepository extends JpaRepository<Market, Long> {
    @Query("SELECT m FROM Market m WHERE m.status = :status")
    List<Market> findByStatus(@Param("status") MarketStatus status, Pageable pageable);
}
```

### Service Layer 패턴

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MarketService {
    private final MarketRepository marketRepository;

    @Transactional
    public MarketResponse create(CreateMarketCommand command) {
        log.info("마켓 생성: {}", command.name());
        Market market = Market.create(command);
        Market saved = marketRepository.save(market);
        return MarketResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public MarketResponse get(Long id) {
        Market market = marketRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "마켓을 찾을 수 없습니다"));
        return MarketResponse.from(market);
    }
}
```

## Database Patterns

### N+1 Query Prevention

```java
// BAD — N+1
List<Market> markets = marketRepository.findAll();
markets.forEach(m -> m.getCategories().size()); // N개 추가 쿼리

// GOOD — EntityGraph
@EntityGraph(attributePaths = {"categories"})
List<Market> findAllWithCategories();

// GOOD — JOIN FETCH
@Query("SELECT m FROM Market m JOIN FETCH m.categories")
List<Market> findAllWithCategories();
```

### 페이징

```java
PageRequest page = PageRequest.of(pageNumber, pageSize, Sort.by("createdDate").descending());
Page<Market> results = marketRepository.findAll(page);
```

## Caching

```java
@Service
@RequiredArgsConstructor
public class MarketCacheService {
    private final MarketRepository repo;

    @Cacheable(value = "market", key = "#id")
    public MarketResponse getById(Long id) {
        return repo.findById(id)
                .map(MarketResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "마켓을 찾을 수 없습니다"));
    }

    @CacheEvict(value = "market", key = "#id")
    public void evict(Long id) {}
}
```

## Error Handling

### BusinessException 중앙 집중

```java
// Service에서 throw
throw new BusinessException(ErrorCode.DATA_NOT_FOUND, "마켓을 찾을 수 없습니다");
throw new BusinessException(ErrorCode.CLIENT_INVALID_INPUT, "잘못된 요청입니다");

// GlobalExceptionHandler가 ApiResponse.error()로 변환
// ErrorCode 범위: 인증(1000~), 데이터(2000~), 서버(3000~), 클라이언트(4000~), 외부서비스(5000~)
```

### Retry with Exponential Backoff

```java
public <T> T withRetry(Supplier<T> supplier, int maxRetries) {
    int attempts = 0;
    while (true) {
        try {
            return supplier.get();
        } catch (Exception ex) {
            attempts++;
            if (attempts >= maxRetries) throw ex;
            try {
                Thread.sleep((long) Math.pow(2, attempts) * 100L);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw ex;
            }
        }
    }
}
```

## Middleware / Filters

```java
@Component
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        long start = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            log.info("req method={} uri={} status={} durationMs={}",
                    request.getMethod(), request.getRequestURI(),
                    response.getStatus(), System.currentTimeMillis() - start);
        }
    }
}
```

## Logging

- `@Slf4j` 사용, 주요 로직 `log.info()`, 상세 `log.debug()`
- 민감 정보(비밀번호, 토큰) 로그 출력 금지
- 구조화된 로깅: `log.info("action={} marketId={}", "create", id)`

**Remember**: Controller는 얇게, Service는 집중적으로, Repository는 단순하게, 에러는 중앙에서 처리.
