# 에러 처리 가이드

## 📌 개요

일관된 에러 처리 시스템을 제공하여, 개발자가 손쉽게 디버깅하고 사용자에게 친화적인 메시지를 표시할 수 있도록 합니다.

### 특징

- ✅ **에러 코드 표준화**: 4자리 숫자로 에러를 분류
- ✅ **개발자 친화적**: 상세한 디버그 정보와 로깅
- ✅ **사용자 친화적**: 이해하기 쉬운 메시지와 조치
- ✅ **추적 가능**: 로그 저장 및 내보내기 기능
- ✅ **자동 분류**: HTTP 상태 코드 자동 매핑

---

## 🏗️ 아키텍처

```
constants/errors.ts          ← 에러 정의, 메시지, 심각도
         ↓
types/error.ts              ← TypeScript 타입 정의
         ↓
utils/errorUtils.ts         ← 에러 생성, 정규화, 로깅
         ↓
hooks/useError.ts           ← 커스텀 훅 (React 컴포넌트에서 사용)
         ↓
컴포넌트                      ← useError 훅 사용
```

---

## 🎯 에러 코드 분류

| 범주           | 코드 범위 | 설명                | 예시                     |
| -------------- | --------- | ------------------- | ------------------------ |
| **인증**       | 1000-1999 | 인증/권한 관련      | `AUTH_INVALID_TOKEN`     |
| **데이터**     | 2000-2999 | 데이터 검증/조회    | `DATA_NOT_FOUND`         |
| **서버**       | 3000-3999 | 서버 오류           | `SERVER_INTERNAL_ERROR`  |
| **클라이언트** | 4000-4999 | 클라이언트/네트워크 | `CLIENT_NETWORK_ERROR`   |
| **외부**       | 5000-5999 | 외부 서비스         | `EXTERNAL_SERVICE_ERROR` |

### 전체 에러 코드 목록

```typescript
// 인증 (1000-1999)
AUTH_INVALID_TOKEN = 1001; // 토큰 유효하지 않음
AUTH_TOKEN_EXPIRED = 1002; // 토큰 만료
AUTH_UNAUTHORIZED = 1003; // 인증 필요
AUTH_FORBIDDEN = 1004; // 권한 없음
AUTH_SESSION_EXPIRED = 1005; // 세션 만료

// 데이터 (2000-2999)
DATA_NOT_FOUND = 2001; // 데이터 없음
DATA_VALIDATION_FAILED = 2002; // 검증 실패
DATA_DUPLICATE = 2003; // 중복 데이터
DATA_INVALID_FORMAT = 2004; // 형식 오류
DATA_MISSING_REQUIRED_FIELD = 2005; // 필수 필드 누락
DATA_CONFLICT = 2006; // 충돌 발생

// 서버 (3000-3999)
SERVER_INTERNAL_ERROR = 3001; // 500 에러
SERVER_BAD_REQUEST = 3002; // 400 에러
SERVER_TIMEOUT = 3003; // 요청 타임아웃
SERVER_SERVICE_UNAVAILABLE = 3004; // 503 에러
SERVER_RATE_LIMITED = 3005; // 429 에러
SERVER_DATABASE_ERROR = 3006; // DB 오류

// 클라이언트 (4000-4999)
CLIENT_NETWORK_ERROR = 4001; // 네트워크 오류
CLIENT_PARSE_ERROR = 4002; // JSON 파싱 실패
CLIENT_FILE_UPLOAD_FAILED = 4003; // 파일 업로드 실패
CLIENT_FILE_SIZE_EXCEEDED = 4004; // 파일 크기 초과
CLIENT_INVALID_INPUT = 4005; // 입력값 검증 실패

// 외부 서비스 (5000-5999)
EXTERNAL_SERVICE_ERROR = 5001; // 외부 서비스 오류
EXTERNAL_PAYMENT_FAILED = 5002; // 결제 실패
EXTERNAL_API_TIMEOUT = 5003; // 외부 API 타임아웃
```

---

## 🚀 사용법

### 1. 기본 사용

```typescript
import { useError } from '@/hooks/useError';
import { ErrorCode } from '@/constants/errors';

export function MyComponent() {
  const { handleError, createError } = useError();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        // API 응답 에러 처리
        handleError(response);
        return;
      }
      const data = await response.json();
    } catch (error) {
      // 네트워크 에러 처리
      handleError(error, ErrorCode.CLIENT_NETWORK_ERROR);
    }
  };

  return <button onClick={fetchData}>데이터 로드</button>;
}
```

### 2. 커스텀 메시지와 함께 사용

```typescript
const { handleError } = useError();

try {
    // 유효성 검사
    if (!email.includes('@')) {
        const error = createError(ErrorCode.DATA_VALIDATION_FAILED, {
            userMessage: '유효한 이메일을 입력해주세요',
            context: { field: 'email', value: email },
        });
        handleError(error);
        return;
    }
} catch (error) {
    handleError(error);
}
```

### 3. 처리 옵션 설정

```typescript
const { handleError } = useError();

try {
    await deleteItem(id);
} catch (error) {
    // 사용자 알림 없이 조용히 처리
    handleError(error, undefined, {
        showNotification: false, // 알림 표시 안 함
        sendToServer: false, // 서버 전송 안 함
        saveToLocalStorage: false, // 로컬 저장 안 함
        onError: (appError) => {
            console.log('Custom handler:', appError);
        },
    });
}
```

### 4. 에러 로그 조회

```typescript
const { getSavedErrors, exportErrorLogs, clearErrorLogs } = useError();

// 저장된 에러 조회
const errors = getSavedErrors();
console.log(errors);

// JSON으로 내보내기 (사용자 지원용)
const logs = exportErrorLogs();
const blob = new Blob([logs], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// 다운로드 링크 생성

// 초기화
clearErrorLogs();
```

---

## 📊 에러 메시지 구조

각 에러는 다음 정보를 포함합니다:

```typescript
interface AppError {
    // 식별자
    code: ErrorCode; // 에러 코드 (예: 2001)

    // 메시지
    message: string; // 시스템 메시지
    userMessage?: string; // 사용자용 메시지
    devMessage?: string; // 개발자용 상세 정보

    // 상태
    severity: ErrorSeverity; // 심각도 (info/warning/error/critical)
    retryable: boolean; // 재시도 가능 여부
    action?: string; // 권장 조치

    // 메타데이터
    timestamp: Date; // 발생 시간
    originalError?: Error; // 원본 에러
    context?: Record<string, any>; // 추가 정보

    // API 응답
    statusCode?: number; // HTTP 상태 코드
    responseData?: any; // API 응답 본문
    traceId?: string; // 서버 추적 ID
}
```

### 예시

```
Code: 2001
Message: 요청한 데이터를 찾을 수 없습니다.
UserMessage: 해당 항목이 없습니다.
DevMessage: Resource not found - 404 status or empty result
Severity: WARNING
Retryable: false
Action: 데이터가 삭제되었거나 존재하지 않을 수 있습니다
Context: { userId: 123, resourceId: 'abc' }
```

---

## 🔍 디버깅 팁

### 1. 콘솔에서 에러 확인

에러가 발생하면 콘솔에 다음과 같이 출력됩니다:

```
[2001] WARNING
메시지: 요청한 데이터를 찾을 수 없습니다.
사용자 메시지: 해당 항목이 없습니다.
개발자 메시지: Resource not found - 404 status or empty result
권장 조치: 데이터가 삭제되었거나 존재하지 않을 수 있습니다
컨텍스트: { userId: 123 }
추적 ID: 1710829261234-a3c5d8f2e
원본 에러: Error: 404 Not Found
```

### 2. 브라우저 개발자 도구에서 에러 조회

```javascript
// 콘솔에서 실행
const { useError } = window.__APP_HOOKS__;
const logs = useError().errorLogger.getLogs();
console.table(logs);
```

### 3. 에러 로그 다운로드

```javascript
// 콘솔에서 실행
const { exportErrorLogs } = window.__APP_HOOKS__;
const logs = exportErrorLogs();
console.log(logs);
// JSON 파일로 저장해서 분석
```

### 4. 특정 심각도의 에러만 조회

```typescript
const { errorLogger } = useError();

// 에러만 조회
const errors = errorLogger.getLogsBySeverity(ErrorSeverity.ERROR);
console.table(errors);

// 심각한 에러만 조회
const critical = errorLogger.getLogsBySeverity(ErrorSeverity.CRITICAL);
```

---

## 🎓 실전 예제

### 예제 1: API 호출 with 에러 처리

```typescript
import { useError } from '@/hooks/useError';
import { ErrorCode } from '@/constants/errors';

export function UserList() {
  const { handleError } = useError();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');

      if (!response.ok) {
        // API 에러 자동 처리
        handleError(response);
        return;
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      // 네트워크 또는 파싱 에러
      handleError(error, ErrorCode.CLIENT_NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={loadUsers} disabled={loading}>
      {loading ? '로딩중...' : '사용자 로드'}
    </button>
  );
}
```

### 예제 2: 폼 검증 with 커스텀 에러

```typescript
import { useError } from '@/hooks/useError';
import { ErrorCode } from '@/constants/errors';

export function RegisterForm() {
  const { handleError, createError } = useError();

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      const error = createError(ErrorCode.DATA_VALIDATION_FAILED, {
        userMessage: '유효한 이메일을 입력해주세요 (예: user@example.com)',
        context: { field: 'email', value: email },
      });
      handleError(error);
      return false;
    }
    return true;
  };

  const handleSubmit = (formData: any) => {
    if (!validateEmail(formData.email)) {
      return;
    }

    // 제출
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### 예제 3: 처리 옵션 커스터마이징

```typescript
const { handleError } = useError();

// 관리자 권한 확인
const checkAdminAccess = async () => {
    try {
        const response = await fetch('/api/admin/dashboard');

        if (!response.ok) {
            handleError(response, undefined, {
                // 권한 없음은 조용히 처리 (로그인 페이지로 리디렉트)
                showNotification: response.status === 403 ? false : true,
                onError: (error) => {
                    if (error.code === ErrorCode.AUTH_FORBIDDEN) {
                        window.location.href = '/login';
                    }
                },
            });
            return;
        }

        // 관리자 패널 표시
    } catch (error) {
        handleError(error);
    }
};
```

---

## 📝 Best Practices

### ✅ DO

1. **구체적인 에러 코드 사용**

    ```typescript
    // ✅ 좋음
    handleError(error, ErrorCode.DATA_NOT_FOUND);

    // ❌ 나쁨
    handleError(error); // 에러 코드 없음
    ```

2. **컨텍스트 정보 포함**

    ```typescript
    // ✅ 좋음
    const error = createError(ErrorCode.DATA_VALIDATION_FAILED, {
        context: { field: 'email', value: email, userId: 123 },
    });

    // ❌ 나쁨
    const error = createError(ErrorCode.DATA_VALIDATION_FAILED);
    ```

3. **사용자 메시지 커스터마이징**

    ```typescript
    // ✅ 좋음
    const error = createError(ErrorCode.SERVER_TIMEOUT, {
        userMessage:
            '서버 응답 시간이 오래 걸리고 있습니다. 잠시 후 다시 시도해주세요.',
    });

    // ❌ 나쁨
    const error = createError(ErrorCode.SERVER_TIMEOUT);
    ```

### ❌ DON'T

1. **에러 무시하기**

    ```typescript
    // ❌ 나쁨
    try {
        await fetchData();
    } catch (error) {
        // 에러 무시
    }
    ```

2. **원본 에러 메시지 그대로 표시**

    ```typescript
    // ✅ 좋음
    const appError = handleError(error);
    // 자동으로 사용자 친화적 메시지 표시됨
    ```

3. **에러 코드 중복 정의**

    ```typescript
    // ❌ 나쁨
    const MY_ERROR = 2001; // 이미 정의됨

    // ✅ 좋음
    import { ErrorCode } from '@/constants/errors';
    // 정의된 코드 사용
    ```

---

## 🔧 고급 사용법

### 에러 핸들러 래퍼 함수

자주 사용되는 패턴을 함수로 만들어 재사용:

```typescript
// utils/apiClient.ts
export async function apiCall<T>(url: string): Promise<T> {
    const { handleError } = useError();

    try {
        const response = await fetch(url);

        if (!response.ok) {
            handleError(response);
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        handleError(error);
        throw error;
    }
}

// 사용
try {
    const users = await apiCall<User[]>('/api/users');
} catch (error) {
    // 에러는 이미 처리됨
}
```

### 글로벌 에러 바운더리

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
    componentDidCatch(error: Error, info: any) {
        const { handleError } = useError();
        handleError(error, ErrorCode.CLIENT_PARSE_ERROR, {
            context: { componentStack: info.componentStack },
        });
    }

    render() {
        // ...
    }
}
```

---

## 📞 지원

에러 처리에 대한 질문이나 새로운 에러 코드가 필요한 경우:

1. `/src/constants/errors.ts`에 새 코드 추가
2. 에러 메시지 정의
3. 문서 업데이트

---

**마지막 업데이트**: 2026-03-19
