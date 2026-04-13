# Frontend Engineering Guide

<aside>
💡읽기 좋은 코드, 유지보수 효율에 초점을 맞추어 코드를 작성합니다.
</aside>

## 1. 기본 원칙 (Core Principles)

1. **점진적 TypeScript 전환 (Boy Scout Rule / Clean code):**
    - 내가 작업하는 파일이 `.js/jsx`라면, 작업 시점에 `.ts/tsx`로 변환을 시도합니다.
    - 단, 타입 정의 때문에 비즈니스 로직 구현이 막힌다면, MVP 제작까지는 **`any`를 허용**합니다. (단, 추후 수정을 위해 TODO 주석 남기기 → 추후 TODO만 검색하여 수정 가능하기 위함)
2. **View와 Logic의 분리:**
    - UI 렌더링 코드와 비즈니스 로직(상태 관리, API 호출 등)을 분리하여 컴포넌트의 복잡도를 낮춥니다.
3. **성급한 최적화 지양:**
    - `useMemo`, `useCallback`은 성능 이슈가 확실하거나 꼭 필요할 때만 사용합니다. 남용은 지양합니다.
4. PR 전 자신의 작업된 내용을 꼭 `npm run build` 명령어 실행 후 push합니다.
5. 작업이 완료되었을 때, 최신버전 main과 Sync를 항상 맞춰주세요.

---

## 2. 파일 및 폴더 구조 (File Structure)

```jsx
  cxnexus-front/
  ├── .git/                 # Git 저장소
  ├── .github/              # GitHub 관련 설정
  │   └── workflows/        # GitHub Actions
  ├── .idea/                # IntelliJ IDEA 설정
  ├── build/                # 빌드 결과물
  ├── database/             # 데이터베이스 관련
  ├── docs/                 # 문서
  ├── node_modules/         # 의존성 패키지
  ├── public/               # 정적 파일
  │   └── images/
  └── src/                  # 소스 코드
      ├── api/              # API 모듈 및 axios 인스턴스
      ├── assets/           # 정적 리소스
      │   ├── css/
      │   └── images/
      ├── components/       # 공통 컴포넌트
      │   ├── chatbot/      # 챗봇 컴포넌트
      │   ├── common/       # 공통 UI 컴포넌트
      │   ├── dataflow/     # 데이터 플로우 컴포넌트
      │   ├── layout/       # 레이아웃 컴포넌트
      │   ├── logicflow/    # 로직 플로우 컴포넌트
      │   │   ├── canvas/   # 캔버스/노드타입/툴바
      │   │   ├── modals/   # Expression 관련 모달
      │   │   ├── nodes/    # React Flow 노드 컴포넌트
      │   │   ├── panels/   # 우측 패널/속성 패널
      │   │   └── index.ts  # logicflow 배럴 export
      │   ├── pagebuilder/  # 페이지 빌더 컴포넌트
      │   └── workflow/     # 워크플로우 컴포넌트
      ├── config/           # 설정
      ├── constants/        # 도메인/기능별 상수
      │   ├── logicFlow.ts  # 로직플로우 노드 카탈로그/메타
      │   └── ...
      ├── contexts/         # 전역 React Context
      │   ├── DatabaseContext.js
      │   ├── EditorContext.tsx
      │   ├── ImagesContext.tsx
      │   ├── NavigationGuardContext.tsx
      │   ├── RightPanelContext.jsx
      │   ├── ThemeContext.js
      │   └── index.js
      ├── hooks/            # 커스텀 훅
      │   ├── logicflow/    # 로직플로우 훅
      │   ├── dataflow/     # 데이터플로우 훅
      │   └── ...
      ├── pages/            # 페이지 컴포넌트
      │   ├── auth/         # 인증 페이지
      │   ├── app-studio/   # App Studio 메인 화면/탭
      │   ├── dataflow/     # 데이터 플로우 페이지
      │   ├── logicflow/    # 로직 플로우 페이지
      │   ├── menu/         # 메뉴 페이지
      │   ├── notice/       # 공지사항 페이지
      │   ├── pagebuilder/  # 페이지 빌더
      │   ├── settings/     # 설정 페이지
      │   ├── theme-settings/ # 테마 설정
      │   ├── translate/    # 번역 페이지
      │   ├── user/         # 사용자 관리
      │   └── usergroup/    # 사용자 그룹 관리
      ├── services/         # 서비스 레이어
      ├── store/            # Redux 스토어
      │   ├── api/          # RTK Query API
      │   └── slices/       # Redux 슬라이스
      ├── styles/           # 전역 스타일/디자인 시스템
      │   ├── common/       # theme, tokens
      │   ├── app-studio/
      │   └── pagebuilder/
      ├── types/            # TypeScript 타입 정의
      └── utils/            # 유틸리티 함수
```

---

## 3. 네이밍 컨벤션 (Naming Convention)

### 3.1 파일 및 컴포넌트

- **컴포넌트 파일:** `PascalCase` (예: `UserProfile.tsx`)
- **Hook 파일:** `camelCase`이며 `use`로 시작 (예: `useAuth.ts`)
- **유틸/함수 파일:** `camelCase` (예: `formatDate.ts`)

### 3.2 변수 및 함수

- **변수/함수:** `camelCase`
- **Boolean 변수:** `is`, `has`, `should` 접두사 사용
    - `isLoading` (O), `loading` (X - 명사형 지양)
    - `hasError` (O)
- **상수:** `UPPER_SNAKE_CASE` (예: `MAX_COUNT`)

### 3.3 이벤트 핸들러 (중요 ⭐)

User Interaction을 처리하는 함수명은 **`handle`** 접두사로 통일합니다.

- **Props로 넘겨줄 때:** `on` 접두사 (이벤트 발생 시점)
- **함수를 정의할 때:** `handle` 접두사 (이벤트 처리)

```tsx
// 좋은 예
const handleClick = () => { ... };
const handleSubmit = () => { ... };

return (
  <Button onClick={handleClick} />
);

// 컴포넌트 Props 정의 시 -> /types로 분리
interface Props {
  onSave: () => void; // 부모 입장에서 '저장될 때' 호출
}
```

---

## 4. 컴포넌트 아키텍처 (View & Logic Separation)

컴포넌트 가독성 및 비대해지는 것을 막기 위해 **Custom Hook 패턴**을 적극 사용합니다.

### 4.1 작성 규칙

1. 컴포넌트 내부에 `useState`, `useEffect`, 핸들러 함수가 많아지면 `use[Feature]Logic.ts`로 분리합니다.
2. Hook은 **상태(State)**와 **액션(Actions)**을 객체 형태로 반환합니다.
3. View(TSX)에서는 로직을 몰라도 되도록 직관적인 이름으로 반환합니다.

### 4.2 예시 코드

**❌ Bad (모든 로직이 뷰에 포함됨)**

```tsx
// UserList.tsx
export const UserList = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        // 복잡한 데이터 페칭 로직...
    }, []);

    const handleDelete = (id) => {
        // 복잡한 삭제 로직...
    };

    return <div>...</div>;
};
```

**✅ Good (로직 분리)**

```tsx
// useUserList.ts (로직)
export const useUserList = () => {
  const [users, setUsers] = useState([]);
  // ...데이터 페칭 및 상태 관리 로직

  const handleDelete = (id: string) => { ... };

  return {
    users,
    handleDelete,
    isLoading
  };
};
```

```tsx
// UserList.tsx (뷰)
import { useUserList } from './useUserList';

export const UserList = () => {
    const { users, handleDelete, isLoading } = useUserList();

    if (isLoading) return <Loader />;

    return (
        <div>
            {users.map((user) => (
                <UserItem key={user.id} user={user} onDelete={handleDelete} />
            ))}
        </div>
    );
};
```

---

## 5. TypeScript 마이그레이션 전략 : Control Props 패턴

우리는 현재 JS에서 TS로 전환 중입니다. 개발 속도를 저해하지 않는 선에서 타입을 적용합니다.

1. 1차 MVP 개발 단계까지는 타입을 엄격하게 처리할 필요는 없습니다. 다만, 타입 설정이 가능한 경우는 설정해주세요.
2. **`any` 허용:**
    - 복잡한 외부 라이브러리 타입이나, 당장 타입을 정의하기 어려운 레거시 데이터 구조의 경우 `any`를 허용합니다.
    - 단, 나중에 고칠 수 있도록 주석을 남깁니다. (TODO 표시)
    - `const data: any = response.data; // TODO: API 응답 타입 정의 필요`
3. **Props 타입:**
    - `interface` 사용을 권장합니다. (type과 혼용하지 말아주세요.)
    - 이름은 `[ComponentName]Props`로 통일합니다. (ex) CXButtonProps

```tsx
interface UserCardProps {
  name: string;
  age?: number; // Optional
  data: any;    // 잘 모를 땐 any 허용 (점진적 개선)
}

export const UserCard = ({ name, age, data }: UserCardProps) => { ... };
```

---

## 6. 스타일링 및 UI 라이브러리 (Mantine & Lucide)

1. **Mantine Core:** UI 컴포넌트는 Mantine을 최우선으로 사용합니다.
2. **Icons:** 아이콘은 `lucide-react`를 사용합니다.
    - `import { IconSearch } from 'lucide-react';`
3. **Styling:**
    - 간단한 레이아웃/간격: Mantine Props (`m`, `p`, `mt`, `c`) 사용.
    - 복잡한 스타일: Styled Components(mantine/styled 패키지)
    - **인라인 스타일(`style={{}}`) 지양합니다. → 컴포넌트 가독성 저하**

---

## 7. 성능 최적화 (Optimization)

1. **기본:** 습관적인 `useMemo`, `useCallback` 사용을 꼭 필요한 경우 외에는 사용을 지양합니다.
    - 단순한 객체/배열 생성, 간단한 함수 정의에는 사용하지 마세요.
2. **사용해야 할 때:**
    - **참조 동일성 유지:** `useEffect`의 의존성 배열에 함수나 객체가 들어갈 때.
    - **무거운 연산:** 대용량 배열 필터링, 복잡한 수학 연산 등.
    - **렌더링 방지:** 자식 컴포넌트가 `React.memo`로 감싸져 있고, 불필요한 리렌더링을 막아야 할 때.

---

## 8. Redux 사용 가이드 (Typed Hooks 사용 필수)

앞으로 useDispatch, useSelector를 react-redux에서 직접 import 하여 사용하는 것을 지양해 주세요.

대신, 미리 설정해 둔 **hooks 디렉토리 내의 useAppDispatch, useAppSelector**를 사용해야 합니다.

이유: 이렇게 해야 State 타입을 매번 적지 않아도 자동 추론(Auto-inference)이 되어 코딩이 훨씬 빠르고 안전해집니다.

---

## 9. 스타일 분리 및 관리 (Style Separation)

컴포넌트 파일의 가독성을 높이고 스타일을 재사용 가능하도록 관리하기 위해 **스타일을 별도 파일로 분리**합니다.

### 9.1 스타일 분리 원칙

1. **인라인 스타일 금지:**
    - 컴포넌트 내부에 `style={{}}` 형태의 인라인 스타일을 작성하지 않습니다.
    - 간단한 스타일도 별도 파일로 분리하여 재사용성과 가독성을 높입니다.

2. **스타일 파일 위치:**
    - 페이지별 스타일: `/src/styles/[페이지명]/` 디렉토리에 위치
    - 예시: `/src/styles/pagebuilder/`, `/src/styles/frontflow/`

3. **TypeScript 타입 활용:**
    - 모든 스타일 객체는 `CSSProperties` 타입을 사용합니다.
    - 타입 안정성을 확보하고 IDE 자동완성을 활용합니다.

### 9.2 스타일 파일 구조

각 페이지/기능별 스타일 디렉토리는 다음과 같이 구성합니다:

```tsx
/src/styles/[feature명]/
├── index.ts              # 모든 스타일 export
├── themeTokens.ts        # CSS 변수를 TypeScript 상수로 매핑
├── baseStyles.ts         # 공통 기본 스타일 패턴
├── componentStyles.ts    # 컴포넌트별 스타일
├── treeStyles.ts         # 특정 영역별 스타일
└── customGraphJs.ts      # 외부 라이브러리 커스터마이징 스타일
```

### 9.3 스타일 및 디자인 시스템 관련 - 하기 Appendix 참조

### 9.5 네이밍 규칙

- **스타일 상수명:** `UPPER_SNAKE_CASE`로 작성하고 `_STYLE` 접미사 사용
    - 예: `PANEL_CONTAINER_STYLE`, `FLEX_ROW_STYLE`
- **토큰 객체명:** `THEME_TOKENS`, `COLOR_TOKENS` 등

---

## 10. 리팩토링 가이드 (Refactoring Guide)

페이지 리팩토링 시 다음 절차를 따라주세요:

### 10.1 리팩토링 체크리스트

1. **스타일 분리:**
    - [ ] `/src/styles/[페이지명]/` 디렉토리 생성
    - [ ] 인라인 스타일을 스타일 파일로 이동
    - [ ] `CSSProperties` 타입 적용
    - [ ] index.ts에서 export

2. **로직 분리:**
    - [ ] 복잡한 상태 관리/비즈니스 로직을 커스텀 훅으로 분리
    - [ ] Hook 파일명: `use[Feature]Logic.ts` 형식 사용
    - [ ] 컴포넌트는 순수한 View 역할만 수행하도록 정리

3. **TypeScript 전환:**
    - [ ] `.js/.jsx` 파일을 `.ts/.tsx`로 변환
    - [ ] Props 인터페이스 정의 (`[ComponentName]Props`)
    - [ ] 타입 정의가 어려운 경우 `any` 사용 + TODO 주석

4. **Import 정리:**
    - [ ] Import 순서 정리 (React → Utils/Hooks → Components → Types/Styles)
    - [ ] 절대 경로(`@/`) 사용

### 10.2 리팩토링 우선순위

다음 순서로 리팩토링을 진행합니다:

1. **1단계:** 스타일 분리 (가장 빠른 효과)
2. **2단계:** 커스텀 훅으로 로직 분리 (가독성 향상)
3. **3단계:** TypeScript 전환 (타입 안정성)

---

## 11. Redux Toolkit 컨벤션 (Redux Best Practices)

### 11.1 기본 원칙

1. **Typed Hooks 사용 필수:**
    - `useDispatch`, `useSelector`를 직접 import 하지 않습니다.
    - 반드시 `/src/store/hooks.ts`의 `useAppDispatch`, `useAppSelector`를 사용합니다.
    - 이유: 타입 안정성 확보 및 자동 타입 추론

```tsx
// ❌ Bad
import { useDispatch, useSelector } from 'react-redux';

// ✅ Good
import { useAppDispatch, useAppSelector } from '@/store/hooks';
```

2. **점진적 TypeScript 전환:**
    - 새로운 Slice는 `.ts` 파일로 작성합니다.
    - 기존 `.js` Slice를 수정할 때는 `.ts`로 전환을 시도합니다.
    - 단, MVP 개발 중이라면 `any` 사용 허용 (TODO 주석 남기기)

### 11.2 Slice 파일 구조 및 네이밍

#### 파일명 규칙

- **형식:** `[domain]Slice.ts` (예: `userSlice.ts`, `authSlice.ts`)
- 모든 Slice 파일은 `/src/store/slices/` 디렉토리에 위치

#### Slice 작성 순서

Slice 파일은 다음 순서로 작성합니다:

```tsx
// 1. Import
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '@/api';

// 2. 타입 정의 (TypeScript)
interface User {
    id: string;
    username: string;
    email: string;
}

interface UserState {
    users: User[];
    currentUser: User | null;
    loading: boolean;
    error: string | null;
    pagination: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
    };
}

// 3. createAsyncThunk (비동기 액션)
export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async ({ page = 0, size = 10 }: { page?: number; size?: number }) => {
        const response = await usersAPI.getUsers(page, size);
        return response;
    }
);

// 4. initialState
const initialState: UserState = {
    users: [],
    currentUser: null,
    loading: false,
    error: null,
    pagination: {
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
    },
};

// 5. createSlice
const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearCurrentUser: (state) => {
            state.currentUser = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // builder 패턴 사용
    },
});

// 6. Export
export const { clearCurrentUser, clearError } = userSlice.actions;
export default userSlice.reducer;
```

### 11.3 createAsyncThunk 패턴

#### 기본 구조

```tsx
export const fetchUser = createAsyncThunk(
    'users/fetchUser', // type prefix (슬라이스명/액션명)
    async (userId: string) => {
        const response = await usersAPI.getUser(userId);
        return response;
    }
);
```

#### 에러 핸들링 (rejectWithValue 패턴)

API 호출 시 에러를 구조화하여 반환합니다:

```tsx
export const createUser = createAsyncThunk(
    'users/createUser',
    async (userData: CreateUserPayload, { rejectWithValue }) => {
        try {
            const response = await usersAPI.createUser(userData);
            return response;
        } catch (error: any) {
            // API 오류 응답에서 메시지 추출
            if (error.response?.data) {
                return rejectWithValue({
                    message: error.response.data.message || error.message,
                    code: error.response.data.code,
                });
            }
            return rejectWithValue({ message: error.message });
        }
    }
);
```

#### extraReducers에서 에러 처리

```tsx
extraReducers: (builder) => {
    builder
        .addCase(createUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createUser.fulfilled, (state, action) => {
            state.loading = false;
            state.users.unshift(action.payload);
        })
        .addCase(createUser.rejected, (state, action) => {
            state.loading = false;
            // rejectWithValue로 전달된 에러 처리
            if (action.payload) {
                state.error = (action.payload as any).message;
            } else {
                state.error = action.error.message || '오류가 발생했습니다.';
            }
        });
};
```

### 11.4 State 네이밍 규칙

#### State 구조 일관성 유지

모든 Slice는 다음 패턴을 따릅니다:

```tsx
interface SliceState {
    // 1. 데이터
    items: T[]; // 리스트 데이터
    currentItem: T | null; // 선택된 단일 데이터

    // 2. 로딩/에러 상태 (필수)
    loading: boolean;
    error: string | null;

    // 3. 부가 정보 (선택)
    pagination?: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
    };
}
```

#### Boolean 변수 네이밍

- `isLoading` (X) → `loading` (O)
- `hasError` (X) → `error` (O)
- 이유: Redux Toolkit의 관례를 따르며, 간결성 우선

### 11.5 Reducers vs ExtraReducers

#### reducers (동기 액션)

- UI 상태 변경, 간단한 데이터 조작
- 예: 모달 열기/닫기, 필터 설정, 데이터 초기화

```tsx
reducers: {
  clearCurrentUser: (state) => {
    state.currentUser = null;
  },
  setFilter: (state, action) => {
    state.filter = action.payload;
  },
}
```

#### extraReducers (비동기 액션)

- API 호출 결과 처리
- `createAsyncThunk`로 생성된 액션 처리

```tsx
extraReducers: (builder) => {
    builder
        .addCase(fetchUsers.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchUsers.fulfilled, (state, action) => {
            state.loading = false;
            state.users = action.payload.content || [];
        })
        .addCase(fetchUsers.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || '오류가 발생했습니다.';
        });
};
```

### 11.6 Store Export 패턴

`/src/store/index.ts`에서 중앙 집중식으로 관리합니다:

```tsx
// 1. Store 설정
export const store = configureStore({
    reducer: {
        users: userSlice,
        auth: authSlice,
        // ...
    },
});

// 2. 타입 정의 (Typed Hooks를 위한 필수)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 3. 액션 export (선택적 - 사용 편의성)
export { fetchUsers, createUser } from './slices/userSlice';
export { login, logout } from './slices/authSlice';
```

### 11.7 컴포넌트에서 사용 예시

#### ✅ Good Example

```tsx
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers, clearCurrentUser } from '@/store';

const UserList = () => {
    const dispatch = useAppDispatch();
    const { users, loading, error } = useAppSelector((state) => state.users);

    useEffect(() => {
        dispatch(fetchUsers({ page: 0, size: 10 }));
    }, [dispatch]);

    const handleClear = () => {
        dispatch(clearCurrentUser());
    };

    if (loading) return <Loader />;
    if (error) return <Error message={error} />;

    return <div>{/* 렌더링 */}</div>;
};
```

#### ❌ Bad Example

```tsx
// 타입이 지정되지 않은 hooks 사용
import { useDispatch, useSelector } from 'react-redux';

const UserList = () => {
    const dispatch = useDispatch(); // AppDispatch 타입 없음
    const users = useSelector((state: any) => state.users); // any 사용
    // ...
};
```

### 11.8 리팩토링 우선순위

기존 Slice를 리팩토링할 때 다음 순서로 진행합니다:

1. **1단계:** Typed Hooks 사용으로 전환 (컴포넌트)
2. **2단계:** Slice 파일 TypeScript 전환 (`.js` → `.ts`)
3. **3단계:** State 인터페이스 정의
4. **4단계:** 에러 핸들링 패턴 통일 (`rejectWithValue`)

### 11.9 주의사항

1. **직접 상태 변경 가능:**
    - Redux Toolkit은 내부적으로 Immer를 사용하므로 `state.users.push(newUser)` 같은 직접 변경 가능
    - 불변성 걱정 없이 간결하게 작성하세요.

2. **localStorage 관리:**
    - 현재 프로젝트에서는 Slice 내부에서 localStorage를 직접 관리합니다.
    - 추후 middleware로 분리할 수 있지만, MVP 단계에서는 현재 방식 유지

3. **비동기 로직 위치:**
    - API 호출은 `createAsyncThunk` 사용 (Slice 파일)
    - 복잡한 비즈니스 로직은 Custom Hook에서 처리 후 dispatch

---

## 12. 코드 가독성 및 유지보수성 (Code Quality)

코드는 작성하는 시간보다 읽는 시간이 훨씬 깁니다. 가독성과 유지보수성을 높이기 위한 패턴을 따릅니다.

### 12.1 Magic Number 네이밍 (상수화)

**규칙:** 의미 없는 숫자 리터럴을 명명된 상수로 교체합니다.

**이유:**

- 코드의 의도를 명확히 전달
- 값 변경 시 한 곳만 수정하면 됨
- 유지보수성 향상

**❌ Bad**

```tsx
async function handleLikeClick() {
    await postLike(url);
    await delay(300); // 300이 무엇을 의미하는지 불명확
    await refetchPostLike();
}

// 페이지 크기 관련
const users = await fetchUsers(0, 10);
```

**✅ Good**

```tsx
const ANIMATION_DELAY_MS = 300;
const DEBOUNCE_DELAY_MS = 500;
const DEFAULT_PAGE_SIZE = 10;

async function handleLikeClick() {
    await postLike(url);
    await delay(ANIMATION_DELAY_MS); // 애니메이션 대기 시간임을 명확히 표현
    await refetchPostLike();
}

// 페이지 크기
const users = await fetchUsers(0, DEFAULT_PAGE_SIZE);
```

**적용 기준:**

- 2번 이상 사용되는 숫자는 상수화 필수
- 1번만 사용되더라도 의미가 불명확하면 상수화
- 간단한 0, 1, -1 같은 값은 상수화 불필요

---

### 12.2 복잡한 조건문 네이밍

**규칙:** 복잡한 boolean 조건식을 의미 있는 변수명으로 추출합니다.

**이유:**

- 조건의 의도를 명확히 표현
- 디버깅 시 조건 확인 용이
- 재사용 가능

**❌ Bad**

```tsx
const matchedProducts = products.filter((product) => {
    return (
        product.categories.some((category) => category.id === targetCategory.id) &&
        product.prices.some((price) => price >= minPrice && price <= maxPrice)
    );
});

// 복잡한 조건문
if (user.role === 'admin' && user.isActive && user.permissions.includes('write')) {
    // ...
}
```

**✅ Good**

```tsx
const matchedProducts = products.filter((product) => {
    // 카테고리가 일치하는지 확인
    const isSameCategory = product.categories.some((category) => category.id === targetCategory.id);

    // 가격이 범위 내에 있는지 확인
    const isPriceInRange = product.prices.some((price) => price >= minPrice && price <= maxPrice);

    // 전체 조건이 훨씬 명확함
    return isSameCategory && isPriceInRange;
});

// 권한 확인 로직을 변수로 추출
const hasWritePermission =
    user.role === 'admin' && user.isActive && user.permissions.includes('write');

if (hasWritePermission) {
    // ...
}
```

**적용 기준:**

- AND(&&) 또는 OR(||)가 2개 이상 연결되면 변수로 추출 고려
- 조건이 재사용되거나 테스트가 필요하면 반드시 추출

---

### 12.3 복잡한 삼항 연산자 단순화

**규칙:** 중첩된 삼항 연산자는 IIFE 또는 if/else 문으로 대체합니다.

**이유:**

- 가독성 대폭 향상
- 조건 분기를 한눈에 파악 가능
- 디버깅 용이

**❌ Bad**

```tsx
// 중첩된 삼항 연산자 - 읽기 어려움
const status = ACondition ? (BCondition ? 'BOTH' : 'A') : BCondition ? 'B' : 'NONE';

// JSX에서 더 심각
return (
    <div>
        {user.role === 'admin' ? (
            user.isActive ? (
                <AdminDashboard />
            ) : (
                <InactivePage />
            )
        ) : (
            <UserDashboard />
        )}
    </div>
);
```

**✅ Good**

```tsx
// IIFE 패턴 사용 (즉시 실행 함수)
const status = (() => {
    if (ACondition && BCondition) return 'BOTH';
    if (ACondition) return 'A';
    if (BCondition) return 'B';
    return 'NONE';
})();

// JSX에서도 동일하게 적용
return (
    <div>
        {(() => {
            if (user.role === 'admin' && user.isActive) return <AdminDashboard />;
            if (user.role === 'admin') return <InactivePage />;
            return <UserDashboard />;
        })()}
    </div>
);

// 또는 컴포넌트로 분리 (더 권장)
function Dashboard() {
    if (user.role === 'admin' && user.isActive) return <AdminDashboard />;
    if (user.role === 'admin') return <InactivePage />;
    return <UserDashboard />;
}
```

**적용 기준:**

- 삼항 연산자가 2단계 이상 중첩되면 IIFE 사용
- JSX에서는 컴포넌트 분리를 먼저 고려

---

### 12.4 조건부 렌더링 - 컴포넌트 분리

**규칙:** 조건에 따라 UI/로직이 크게 달라지면 별도 컴포넌트로 분리합니다.

**이유:**

- 각 컴포넌트의 책임이 명확해짐
- 코드 복잡도 감소
- 테스트 및 유지보수 용이

**❌ Bad**

```tsx
function SubmitButton() {
    const isAdmin = useRole() === 'admin';
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            // 애니메이션 로직
            setShowAnimation(true);
        }
    }, [isAdmin]);

    return (
        <Button
            disabled={!isAdmin}
            className={showAnimation ? 'animate' : ''}
            onClick={isAdmin ? handleAdminSubmit : undefined}
        >
            {isAdmin ? 'Submit' : 'View Only'}
        </Button>
    );
}
```

**✅ Good**

```tsx
// 역할에 따라 컴포넌트 분리
function SubmitButton() {
    const isAdmin = useRole() === 'admin';

    return isAdmin ? <AdminSubmitButton /> : <ViewerSubmitButton />;
}

// Admin 전용 컴포넌트
function AdminSubmitButton() {
    useEffect(() => {
        showAnimation(); // Admin만의 로직
    }, []);

    return <Button onClick={handleAdminSubmit}>Submit</Button>;
}

// Viewer 전용 컴포넌트
function ViewerSubmitButton() {
    return <Button disabled>View Only</Button>;
}
```

---

### 12.5 Props Drilling 제거 - Component Composition

**규칙:** 중간 컴포넌트를 거쳐 props를 전달하는 대신 컴포넌트 조합(Composition)을 사용합니다.

**이유:**

- 중간 컴포넌트의 불필요한 의존성 제거
- 리팩토링 시 영향 범위 감소
- 컴포넌트 재사용성 향상

**❌ Bad (Props Drilling)**

```tsx
// 3단계 props 전달
function Modal({ items, onConfirm }) {
    return <ModalBody items={items} onConfirm={onConfirm} />;
}

function ModalBody({ items, onConfirm }) {
    return <ItemList items={items} onConfirm={onConfirm} />;
}

function ItemList({ items, onConfirm }) {
    return (
        <ul>
            {items.map((item) => (
                <li key={item.id} onClick={() => onConfirm(item)}>
                    {item.name}
                </li>
            ))}
        </ul>
    );
}
```

**✅ Good (Composition)**

```tsx
// 직접 조합 - 중간 단계 제거
function Modal({ items, onConfirm }) {
    return (
        <ModalContainer>
            <ItemList items={items} onConfirm={onConfirm} />
        </ModalContainer>
    );
}

// ModalBody 컴포넌트 제거됨 - 불필요한 추상화 제거
function ModalContainer({ children }) {
    return <div className="modal">{children}</div>;
}

function ItemList({ items, onConfirm }) {
    return (
        <ul>
            {items.map((item) => (
                <li key={item.id} onClick={() => onConfirm(item)}>
                    {item.name}
                </li>
            ))}
        </ul>
    );
}
```

**적용 기준:**

- Props가 2단계 이상 전달되면 Composition 고려
- Context는 진짜 전역 상태(테마, 인증 등)에만 사용
- 대부분의 경우 Composition으로 해결 가능

---

### 12.6 커스텀 훅 반환 형태 통일

**규칙:** 같은 목적의 커스텀 훅은 일관된 반환 형태를 사용합니다.

**이유:**

- 예측 가능성 향상
- 사용법 학습 비용 감소
- 타입 안정성 확보

**❌ Bad (일관성 없음)**

```tsx
// 각 훅마다 다른 반환 형태
function useUser() {
    const [user, setUser] = useState(null);
    return user; // 데이터만 반환
}

function useProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    return [products, loading]; // 배열로 반환
}

function useOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    return { orders, loading, error, refetch }; // 객체로 반환 (일관성 없음)
}
```

**✅ Good (일관된 패턴)**

```tsx
// API 호출 훅은 항상 같은 형태로 반환
interface UseQueryResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

function useUser(): UseQueryResult<User> {
    const [data, setData] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        setLoading(true);
        try {
            const user = await fetchUser();
            setData(user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, refetch };
}

function useProducts(): UseQueryResult<Product[]> {
    // 동일한 패턴
    return { data, loading, error, refetch };
}

function useOrders(): UseQueryResult<Order[]> {
    // 동일한 패턴
    return { data, loading, error, refetch };
}
```

**적용 기준:**

- **API 호출 훅**: `{ data, loading, error, refetch }` 형태 권장
- **상태 관리 훅**: `[state, setState]` 또는 `{ state, actions }` 형태 통일
- **유틸리티 훅**: 단일 값 반환 가능 (예: `useWindowSize()` → `{ width, height }`)

---

### 12.7 Early Return 패턴

**규칙:** 조건이 맞지 않으면 일찍 반환(early return)하여 중첩을 줄입니다.

**이유:**

- 중첩 depth 감소로 가독성 향상
- 주요 로직에 집중 가능
- 에러 케이스를 먼저 처리

**❌ Bad**

```tsx
function processUser(user) {
    if (user) {
        if (user.isActive) {
            if (user.role === 'admin') {
                // 실제 로직
                return doAdminProcess(user);
            } else {
                return { error: 'Not admin' };
            }
        } else {
            return { error: 'User not active' };
        }
    } else {
        return { error: 'User not found' };
    }
}
```

**✅ Good**

```tsx
function processUser(user) {
    // 에러 케이스를 먼저 처리
    if (!user) return { error: 'User not found' };
    if (!user.isActive) return { error: 'User not active' };
    if (user.role !== 'admin') return { error: 'Not admin' };

    // 주요 로직만 남음 - 중첩 제거
    return doAdminProcess(user);
}
```

---

## 13. 기타 규칙

- **Import 순서:**
    1. React / Library (`react`, `@mantine/core` 등)
    2. Utils / Hooks / Store
    3. Components
    4. Types / Styles
- **주석:** 꼭 필요한 내용만 간단하게 작성해주세요. 투머치한 친절함 금물입니다. 작성 시에는, 코드가 '무엇'을 하는지보다 **'왜'** 그렇게 짰는지를 설명합니다.

```tsx
function processUser(user) {
    // 에러 케이스를 먼저 처리
    if (!user) return { error: 'User not found' };
    if (!user.isActive) return { error: 'User not active' };
    if (user.role !== 'admin') return { error: 'Not admin' };

    // 주요 로직만 남음 - 중첩 제거
    return doAdminProcess(user);
}
```

---

## 13. 기타 규칙

- **Import 순서:**
    1. React / Library (`react`, `@mantine/core` 등)
    2. Utils / Hooks / Store
    3. Components
    4. Types / Styles
- **주석:** 꼭 필요한 내용만 간단하게 작성해주세요. 투머치한 친절함 금물입니다. 작성 시에는, 코드가 '무엇'을 하는지보다 **'왜'** 그렇게 짰는지를 설명합니다.
