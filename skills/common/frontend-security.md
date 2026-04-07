---
inclusion: manual
---
# Frontend Security Review

React/TypeScript 프론트엔드의 보안 취약점을 점검하는 스킬.

## When to Activate

- 사용자 입력 처리 컴포넌트 작성 시
- API 호출 레이어 구현 시
- 인증/세션 관리 구현 시
- 외부 콘텐츠 렌더링 시

## 1. XSS Prevention

```tsx
// BAD — 사용자 입력을 직접 렌더링
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// GOOD — DOMPurify로 새니타이즈
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// BEST — React의 자동 이스케이핑 활용
<div>{userInput}</div>
```

## 2. API 호출 보안

```typescript
// axios interceptor에서 토큰 관리
axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken(); // httpOnly cookie에서 가져오기 권장
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 에러 응답에서 민감 정보 필터링
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 사용자에게는 일반 메시지만 표시
    const message = error.response?.status === 401
      ? '인증이 만료되었습니다'
      : '요청 처리 중 오류가 발생했습니다';
    return Promise.reject(new Error(message));
  }
);
```

## 3. 토큰/인증 관리

- localStorage에 토큰 저장 금지 (XSS 취약)
- httpOnly + Secure + SameSite=Strict 쿠키 사용
- 토큰 만료 시 자동 갱신 또는 로그아웃

## 4. 입력 검증

- 프론트에서도 검증하되, 서버 검증이 최종 방어선
- 파일 업로드: 크기/타입/확장자 클라이언트 사전 검증
- URL 파라미터: 화이트리스트 기반 검증

## 5. 의존성 보안

```bash
npm audit --audit-level=high
npm outdated
```

- `any` 타입 사용 금지 — 타입 안전성이 보안의 첫 방어선
- 미사용 의존성 정기 제거
