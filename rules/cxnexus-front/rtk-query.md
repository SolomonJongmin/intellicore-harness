# RTK / RTK Query 사용법 (cxnexus-front)

이 문서는 현재 코드베이스에 구현된 Redux Toolkit(RTK)과 RTK Query 사용 패턴을 정리한 가이드입니다.

---

## 0) 왜 RTK Query를 사용하는가?

### 일반적인 RTK Slice의 문제점

기존 Redux 패턴(createSlice + createAsyncThunk)으로 API 데이터를 관리할 경우:

```ts
// ❌ 기존 방식: 모든 데이터를 전역 상태에 저장
const pageBuilderSlice = createSlice({
    name: 'pageBuilder',
    initialState: {
        data: null, // 전체 페이지 데이터
        loading: false,
        error: null,
    },
    reducers: {
        /* ... */
    },
});
```

**문제점:**

1. **메모리 낭비**: 서버에서 받은 모든 데이터를 Redux store에 중복 저장
2. **수동 동기화**: 데이터가 변경되면 수동으로 refetch 해야 함
3. **보일러플레이트 코드**: 로딩/에러 상태를 매번 직접 관리
4. **캐싱 없음**: 같은 데이터를 여러 번 요청하면 매번 네트워크 요청 발생
5. **중복 요청**: 여러 컴포넌트가 같은 데이터를 동시에 요청하면 중복 발생

### RTK Query의 장점

RTK Query는 **서버 상태 관리**에 최적화된 도구로, 다음과 같은 이점을 제공합니다:

#### 1. 자동 캐싱 및 중복 요청 제거

```tsx
// 여러 컴포넌트에서 동시에 호출해도 실제 네트워크 요청은 한 번만 발생
function ComponentA() {
    const { data } = useGetPageBuilderQuery({ projectId: 1, moduleId: 2 });
}

function ComponentB() {
    const { data } = useGetPageBuilderQuery({ projectId: 1, moduleId: 2 }); // 캐시된 데이터 사용
}
```

#### 2. 자동 리페칭 및 동기화

```ts
// 저장 후 자동으로 관련 데이터 리페치
savePageBuilder: builder.mutation({
    query: (data) => ({ url: '/pagebuilder', method: 'POST', body: data }),
    invalidatesTags: ['PageBuilder'], // 자동으로 getPageBuilder 다시 호출
}),
```

#### 3. 메모리 효율성

- 사용하지 않는 캐시는 자동으로 정리 (기본 60초 후)
- 필요한 데이터만 메모리에 유지
- 전역 상태 크기를 최소화

#### 4. 보일러플레이트 감소

```tsx
// RTK Query: 로딩/에러 상태 자동 관리
const { data, isLoading, error } = useGetPageBuilderQuery(params);

// vs. 기존 방식: 수동 관리 필요
const dispatch = useDispatch();
const { data, loading, error } = useSelector((state) => state.pageBuilder);
useEffect(() => {
    dispatch(fetchPageBuilder(params));
}, [params]);
```

---

### 노코드 툴처럼 대용량 데이터를 다루는 경우 특히 중요한 이유

현재 프로젝트(cxnexus-front)는 **노코드 개발 도구**로, 다음과 같이 **대용량 데이터**를 다룹니다:

#### 1. PageBuilder: HTML/CSS/메타데이터

```json
{
    "pages": [
        {
            "id": "page1",
            "html": "<!-- 수천 줄의 HTML -->",
            "css": "/* 수천 줄의 CSS */",
            "content": "{ /* GrapesJS 데이터 */ }",
            "pageMeta": {
                "pageVars": {
                    /* ... */
                },
                "datasources": [
                    /* 배열 */
                ],
                "actions": [
                    /* 배열 */
                ]
            }
        }
        // ... 수십 개의 페이지
    ]
}
```

#### 2. DataFlow: 엔티티/다이어그램

```json
{
    "entity": [
        {
            "id": "entity1",
            "attributes": [
                /* 수십 개의 속성 */
            ]
        }
        // ... 수십 개의 엔티티
    ],
    "diagram": [
        /* 다이어그램 배열 */
    ]
}
```

#### 3. LogicFlow: 로직 노드/엣지

```json
{
    "logic": [
        {
            "id": "logic1",
            "flowData": {
                "nodes": [
                    /* 수백 개의 노드 */
                ],
                "edges": [
                    /* 수백 개의 엣지 */
                ]
            }
        }
    ]
}
```

#### 전역 Slice로 관리할 경우의 문제

```ts
// ❌ 모든 데이터를 전역 상태에 저장하면...
const appStudioSlice = createSlice({
    name: 'appStudio',
    initialState: {
        pages: [], // 수천 줄의 HTML/CSS
        entities: [], // 수백 개의 엔티티
        logics: [], // 수백 개의 로직
        // ...
    },
});
```

**문제:**

- Redux store가 비대해짐 (수 MB 이상)
- 모든 컴포넌트 리렌더링 시 전체 데이터 직렬화/역직렬화
- Redux DevTools가 느려짐
- 메모리 사용량 증가
- 브라우저 성능 저하

#### RTK Query로 해결

```ts
// ✅ 서버 상태는 RTK Query 캐시에, 편집 상태만 slice에
export const pageBuilderApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getPageBuilder: builder.query({
            query: (params) => `/pagebuilder?...`,
            providesTags: ['PageBuilder'],
        }),
    }),
});

// slice에는 최소한의 UI 상태만 저장
const appStudioSlice = createSlice({
    name: 'appStudio',
    initialState: {
        activeCanvas: 'interface', // UI 상태
        selectedPageId: null, // 선택된 ID만
        selectedEntityId: null, // 선택된 ID만
        // 실제 데이터는 RTK Query 캐시에 저장
    },
});
```

**이점:**

- 서버 데이터는 `state.api.queries`에 캐싱 (자동 관리)
- UI 상태만 slice에 저장 (가벼움)
- 탭 전환 시 캐시 재사용 (네트워크 요청 불필요)
- 여러 컴포넌트에서 동일 데이터 접근 시 중복 저장 없음

---

### 서버 상태 vs 클라이언트 상태 분리

| 상태 종류           | 저장 위치      | 예시                                                           |
| ------------------- | -------------- | -------------------------------------------------------------- |
| **서버 상태**       | RTK Query 캐시 | PageBuilder 데이터, Entity 데이터, Logic 데이터                |
| **클라이언트 상태** | Redux Slice    | 선택된 페이지 ID, 활성 탭, UI 표시 여부, 편집 중인 임시 데이터 |

```tsx
// ✅ 서버 상태: RTK Query
const { data: pageData } = useGetPageBuilderQuery({ projectId, moduleId });

// ✅ 클라이언트 상태: Redux Slice
const selectedPageId = useAppSelector((state) => state.appStudio.selectedPageId);
const dispatch = useAppDispatch();
dispatch(setSelectedPageId('page1'));
```

---

### 실전 예시: App Studio 탭 전환

```tsx
function AppStudio() {
    const activeCanvas = useAppSelector((state) => state.appStudio.activeCanvas);

    // 각 탭의 데이터는 RTK Query로 자동 캐싱
    const { data: pageData } = usePageBuilderQuery(); // Interface 탭
    const { data: dataFlow } = useDataFlowQuery(); // Data 탭
    const { data: logicFlow } = useLogicFlowQuery(); // Logic 탭

    return (
        <div>
            <TabPanel value={activeCanvas} index="interface">
                {/* pageData 사용 - 이미 캐싱됨 */}
            </TabPanel>
            <TabPanel value={activeCanvas} index="data">
                {/* dataFlow 사용 - 탭 전환 시 리페치 불필요 */}
            </TabPanel>
            <TabPanel value={activeCanvas} index="logic">
                {/* logicFlow 사용 - 네트워크 요청 없이 캐시 사용 */}
            </TabPanel>
        </div>
    );
}
```

**이점:**

- 탭을 여러 번 전환해도 데이터를 한 번만 fetch
- 전역 상태에 모든 탭 데이터를 저장하지 않아도 됨
- 메모리 효율적이고 성능 우수

---

### 결론

**RTK Query를 사용해야 하는 이유:**

1. ✅ **자동 캐싱** - 불필요한 네트워크 요청 감소
2. ✅ **중복 요청 제거** - 여러 컴포넌트가 동시에 요청해도 한 번만 fetch
3. ✅ **자동 동기화** - 데이터 변경 시 자동 리페치
4. ✅ **메모리 효율** - 대용량 데이터를 전역 상태에 중복 저장하지 않음
5. ✅ **보일러플레이트 감소** - 로딩/에러 상태 자동 관리
6. ✅ **서버 상태 분리** - 서버 데이터와 UI 상태를 명확히 구분

**특히 노코드 툴처럼 대용량 데이터를 다루는 경우, RTK Query는 필수입니다.**

---

## 1) 전역 스토어 구성

- 스토어는 `src/store/index.ts`에서 `configureStore`로 생성됩니다.
- 일반 slice reducer들과 함께 RTK Query의 `baseApi.reducer`가 등록됩니다.
- middleware는 기본 middleware에 `baseApi.middleware`를 추가하고, `dirtyTrackingMiddleware`를 prepend합니다.

```ts
// src/store/index.ts
export const store = configureStore({
    reducer: {
        notice: noticeSlice,
        ui: uiSlice,
        // ...
        [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(baseApi.middleware)
            .prepend(dirtyTrackingMiddleware.middleware),
});
```

Typed hooks는 `src/store/hooks.ts`에 정의되어 있습니다.

```ts
// src/store/hooks.ts
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## 2) RTK Slice 패턴

- 일반 상태는 `createSlice`로 관리합니다.
- 일부 slice는 `createAsyncThunk` 기반의 비동기 작업을 사용합니다(레거시/관리자 기능 등).
- 예시 파일: `src/store/slices/*.ts`, `src/store/slices/*.js`

기본 패턴:

```ts
const slice = createSlice({
    name: 'feature',
    initialState,
    reducers: {
        setValue(state, action) {
            /* ... */
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchSomething.fulfilled, (state, action) => {
            /* ... */
        });
    },
});
```

## 3) RTK Query 기본 구성

RTK Query의 공통 설정은 `src/store/api/baseApi.ts`에 있습니다.

- `baseUrl`은 `REACT_APP_API_BASE_URL` 환경변수를 사용합니다.
- `prepareHeaders`에서 `accessToken`을 `Authorization` 헤더에 주입합니다.
- 공통 `tagTypes`를 정의해 캐시 무효화에 사용합니다.

```ts
export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('accessToken');
            if (token) headers.set('Authorization', `Bearer ${token}`);
            headers.set('accept', '*/*');
            return headers;
        },
    }),
    tagTypes: ['PageBuilder', 'DataFlow', 'LogicFlow', 'Entity', 'Diagram', 'Logic', 'Page'],
    endpoints: () => ({}),
});
```

## 4) Endpoint 정의 (injectEndpoints)

각 도메인 API는 `baseApi.injectEndpoints`로 확장합니다.

- `src/store/api/pageBuilderApi.ts`
- `src/store/api/dataflowApi.ts`
- `src/store/api/logicflowApi.ts`
- `src/store/api/adminApi.ts`
- `src/store/api/translateApi.ts`

대표 패턴:

```ts
export const pageBuilderApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getPageBuilder: builder.query<PageBuilderData, PageBuilderQueryParams>({
            query: ({ projectId, moduleId }) =>
                `/v1/workflow/pagebuilder?projectId=${projectId}&moduleId=${moduleId}`,
            transformResponse: (response: any) => {
                const payload =
                    response?.data?.pageContent ||
                    response?.data?.data ||
                    response?.data ||
                    response;
                return payload as PageBuilderData;
            },
            providesTags: ['PageBuilder'],
        }),
        savePageBuilder: builder.mutation<PageBuilderData, PageBuilderData>({
            query: (data) => ({ url: '/v1/workflow/pagebuilder', method: 'POST', body: data }),
            invalidatesTags: ['PageBuilder'],
        }),
    }),
});
```

특이 케이스:

- `src/store/api/translateApi.ts`는 외부 서비스 호출을 위해 `queryFn`을 사용합니다.
- `src/store/api/adminApi.ts`는 응답 구조가 다르기 때문에 `transformResponse`로 공통 unwrap을 적용합니다.

## 5) 컴포넌트에서 RTK Query 사용

Hook 사용 예시:

```ts
const { data, isLoading, error, refetch } = useGetPageBuilderQuery({ projectId, moduleId });
const [savePageBuilder, { isLoading: isSaving }] = useSavePageBuilderMutation();
```

`useAppDispatch`로 직접 실행하는 패턴도 있습니다.

```ts
await dispatch(dataflowApi.endpoints.getDataFlow.initiate({ projectId, moduleId })).unwrap();
```

## 6) 커스텀 Hook 패턴 (App Studio)

App Studio 영역은 프로젝트/모듈 ID를 자동으로 주입하는 커스텀 훅을 사용합니다.

- `src/hooks/app-studio/usePageBuilderQuery.ts`
- `src/hooks/app-studio/useDataFlowQuery.ts`
- `src/hooks/app-studio/useLogicFlowQuery.ts`

```ts
export function usePageBuilderQuery(options?: any) {
    const { projectId, moduleId } = useAppSelector(selectConfig);
    return useGetPageBuilderQuery(
        { projectId, moduleId },
        { skip: !projectId || !moduleId, ...options }
    );
}
```

## 7) 캐시 무효화/동기화

- `providesTags`/`invalidatesTags`로 자동 캐시 갱신을 수행합니다.
- `dataflowApi.util.invalidateTags(['DataFlow'])` 형태로 수동 무효화를 사용합니다.
    - 예: `src/hooks/dataflow/useDataflowManager.ts`
- `dirtyTrackingMiddleware`는 RTK Query 캐시(state.api.queries)를 읽어 초기 스냅샷을 잡고,
  저장 완료 시 상태를 초기화합니다.

## 8) 확장 시 체크리스트

- 새 API는 `baseApi.injectEndpoints`로 추가하기
- 응답 구조가 다르면 `transformResponse`로 normalize하기
- 캐시 관리가 필요하면 `providesTags`/`invalidatesTags` 지정하기
- UI에서 즉시 접근이 필요하면 `useXQuery` 커스텀 훅으로 래핑하기
- 전역 상태/로컬 상태 구분: 서버 캐싱은 RTK Query, 편집 상태는 slice에 저장하기

---

## 9) 새로운 API 추가하기 - 단계별 가이드

기존 API를 RTK Query로 마이그레이션하거나 새로운 API를 추가하는 경우, 다음 단계를 따라주세요.

### 예시: Client State API 추가하기

**기존 코드 (레거시 방식):**

```javascript
// src/api/clientStateApi.js
export const clientStatAPI = {
    getLatestClientStat: async (projectId, moduleId) => {
        const params = new URLSearchParams();
        if (projectId != null) params.set('projectId', String(projectId));
        if (moduleId != null) params.set('moduleId', String(moduleId));

        const query = params.toString();
        const response = await api.get(`/v1/client-state/latest${query ? `?${query}` : ''}`);

        return response?.data?.data ?? response?.data;
    },
};
```

**RTK Query로 변환:**

### Step 1: baseApi에 tagTypes 추가

먼저 `src/store/api/baseApi.ts`에서 새로운 태그 타입을 추가합니다.

```ts
// src/store/api/baseApi.ts
export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            headers.set('accept', '*/*');
            return headers;
        },
    }),
    tagTypes: [
        'PageBuilder',
        'DataFlow',
        'LogicFlow',
        'Entity',
        'Diagram',
        'Logic',
        'Page',
        'ClientState', // ← 새로 추가
    ],
    endpoints: () => ({}),
});
```

### Step 2: 새로운 API 파일 생성

`src/store/api/clientStateApi.ts` 파일을 생성합니다.

```ts
// src/store/api/clientStateApi.ts
import { baseApi } from './baseApi';

// ============================================
// Types
// ============================================
export interface ClientStateData {
    // 실제 응답 타입에 맞게 정의
    projectId?: number;
    moduleId?: number;
    state?: any;
    // ... 기타 필드들
}

export interface ClientStateQueryParams {
    projectId?: string | number;
    moduleId?: string | number;
}

// ============================================
// API Endpoints
// ============================================
export const clientStateApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // GET: 최신 client state 조회
        getLatestClientState: builder.query<ClientStateData, ClientStateQueryParams>({
            query: ({ projectId, moduleId }) => {
                const params = new URLSearchParams();
                if (projectId != null) params.set('projectId', String(projectId));
                if (moduleId != null) params.set('moduleId', String(moduleId));

                const query = params.toString();
                return `/v1/client-state/latest${query ? `?${query}` : ''}`;
            },
            transformResponse: (response: any) => {
                // 백엔드 응답 형태가 { data: ... } 또는 { data: { data: ... } } 등으로 섞일 수 있어 방어적으로 처리
                return response?.data?.data ?? response?.data ?? response;
            },
            providesTags: ['ClientState'],
        }),

        // POST: client state 저장
        saveClientState: builder.mutation<ClientStateData, ClientStateData>({
            query: (data) => ({
                url: '/v1/client-state',
                method: 'POST',
                body: data,
            }),
            transformResponse: (response: any) => {
                return response?.data ?? response;
            },
            invalidatesTags: ['ClientState'], // 저장 후 자동으로 getLatestClientState 캐시 무효화
        }),

        // PUT: client state 업데이트
        updateClientState: builder.mutation<
            ClientStateData,
            { id: string; data: Partial<ClientStateData> }
        >({
            query: ({ id, data }) => ({
                url: `/v1/client-state/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['ClientState'],
        }),
    }),
});

// ============================================
// Export Hooks
// ============================================
export const {
    useGetLatestClientStateQuery,
    useSaveClientStateMutation,
    useUpdateClientStateMutation,
} = clientStateApi;
```

### Step 3: API 파일을 index에서 export

`src/store/api/index.ts`에서 새로운 API를 export합니다.

```ts
// src/store/api/index.ts
export * from './baseApi';
export * from './pageBuilderApi';
export * from './dataflowApi';
export * from './logicflowApi';
export * from './adminApi';
export * from './translateApi';
export * from './clientStateApi'; // ← 새로 추가
```

### Step 4: 컴포넌트에서 사용

이제 컴포넌트에서 RTK Query hooks를 사용할 수 있습니다.

**Query (데이터 조회) 사용 예시:**

```tsx
import { useGetLatestClientStateQuery } from '@/store/api/clientStateApi';

function MyComponent() {
    const projectId = 1;
    const moduleId = 2;

    // 자동으로 데이터 fetch, 캐싱, 리페치 관리
    const { data, isLoading, error, refetch } = useGetLatestClientStateQuery({
        projectId,
        moduleId,
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h1>Client State</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
            <button onClick={() => refetch()}>Refresh</button>
        </div>
    );
}
```

**Mutation (데이터 수정) 사용 예시:**

```tsx
import { useSaveClientStateMutation } from '@/store/api/clientStateApi';

function SaveButton() {
    const [saveClientState, { isLoading, error }] = useSaveClientStateMutation();

    const handleSave = async () => {
        try {
            const result = await saveClientState({
                projectId: 1,
                moduleId: 2,
                state: {
                    /* ... */
                },
            }).unwrap(); // .unwrap()으로 Promise를 얻을 수 있음

            console.log('Saved successfully:', result);
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    return (
        <button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
        </button>
    );
}
```

### Step 5: (선택사항) 커스텀 Hook으로 래핑

App Studio처럼 projectId/moduleId를 자동으로 주입하고 싶다면, 커스텀 훅을 만듭니다.

```ts
// src/hooks/app-studio/useClientStateQuery.ts
import { useAppSelector } from '@/store/hooks';
import { useGetLatestClientStateQuery } from '@/store/api/clientStateApi';

export function useClientStateQuery(options?: any) {
    const { projectId, moduleId } = useAppSelector((state) => state.config);

    return useGetLatestClientStateQuery(
        { projectId, moduleId },
        {
            skip: !projectId || !moduleId, // projectId나 moduleId가 없으면 요청 스킵
            ...options,
        }
    );
}
```

**사용 예시:**

```tsx
import { useClientStateQuery } from '@/hooks/app-studio/useClientStateQuery';

function MyComponent() {
    // projectId, moduleId가 자동으로 주입됨
    const { data, isLoading } = useClientStateQuery();

    // ...
}
```

---

## 10) RTK Query 주요 개념

### Query vs Mutation

- **Query**: 데이터를 **읽기** (GET 요청)
    - `builder.query<ResponseType, ParamsType>()`
    - Hook: `useXxxQuery(params, options)`
    - 자동 캐싱, 리페칭, 중복 요청 제거

- **Mutation**: 데이터를 **쓰기/수정/삭제** (POST, PUT, DELETE 요청)
    - `builder.mutation<ResponseType, ParamsType>()`
    - Hook: `useXxxMutation()`
    - 수동 트리거, 캐시 무효화

### transformResponse

백엔드 응답 구조가 일관되지 않을 때 정규화하는 함수입니다.

```ts
transformResponse: (response: any) => {
    // response.data 또는 response.data.data 등 다양한 케이스 처리
    return response?.data?.data ?? response?.data ?? response;
};
```

### providesTags / invalidatesTags

캐시 관리를 위한 태그 시스템입니다.

- **providesTags**: 이 endpoint가 제공하는 데이터의 태그
- **invalidatesTags**: 이 endpoint가 실행되면 무효화할 태그

```ts
// 조회 API
getItems: builder.query({
    query: () => '/items',
    providesTags: ['Items'], // 'Items' 태그를 제공
}),

// 생성 API
createItem: builder.mutation({
    query: (data) => ({ url: '/items', method: 'POST', body: data }),
    invalidatesTags: ['Items'], // 'Items' 태그를 무효화 → getItems가 자동 리페치
}),
```

### skip 옵션

조건부로 요청을 스킵할 수 있습니다.

```ts
const { data } = useGetDataQuery(
    { id },
    { skip: !id } // id가 없으면 요청하지 않음
);
```

---

## 11) 디버깅 팁

### Redux DevTools에서 확인

- RTK Query 상태는 `state.api`에 저장됩니다
- 각 endpoint의 캐시 상태, 로딩 상태 등을 확인할 수 있습니다

### 수동으로 캐시 무효화

```ts
import { dataflowApi } from '@/store/api/dataflowApi';
import { useAppDispatch } from '@/store/hooks';

const dispatch = useAppDispatch();

// 특정 태그 무효화
dispatch(dataflowApi.util.invalidateTags(['DataFlow']));

// 모든 캐시 초기화
dispatch(dataflowApi.util.resetApiState());
```

### 에러 핸들링

```tsx
const { data, error } = useGetDataQuery(params);

if (error) {
    if ('status' in error) {
        // RTK Query 에러
        console.error('API Error:', error.status, error.data);
    } else {
        // 네트워크 에러 등
        console.error('Unknown Error:', error);
    }
}
```

---

## 12) 다른 컴포넌트에서 전역 상태 사용하기

전역 상태를 컴포넌트에서 사용하는 방법을 패턴별로 설명합니다.

### 12-1. Typed Hooks 가져오기

먼저 타입이 적용된 hooks를 import 합니다.

```tsx
import { useAppSelector, useAppDispatch } from '@/store/hooks';
```

### 12-2. Redux Slice 상태 읽기 (useAppSelector)

Redux Slice에 저장된 **클라이언트 상태**를 읽을 때 사용합니다.

```tsx
import { useAppSelector } from '@/store/hooks';

function MyComponent() {
    // 1. 기본 사용법: state에서 원하는 값 선택
    const activeCanvas = useAppSelector((state) => state.appStudio.activeCanvas);
    const selectedPageId = useAppSelector((state) => state.appStudio.selectedPageId);

    // 2. config slice에서 projectId/moduleId 읽기
    const projectId = useAppSelector((state) => state.config.projectId);
    const moduleId = useAppSelector((state) => state.config.moduleId);

    // 3. UI 상태 읽기
    const isSidebarOpen = useAppSelector((state) => state.ui.sidebar.isOpen);
    const colorScheme = useAppSelector((state) => state.ui.colorScheme);

    // 4. auth 상태 읽기
    const user = useAppSelector((state) => state.auth.user);
    const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);

    return (
        <div>
            <p>Active Canvas: {activeCanvas}</p>
            <p>Selected Page ID: {selectedPageId}</p>
            <p>User: {user?.username}</p>
        </div>
    );
}
```

### 12-3. Entity Adapter Selectors 사용

Entity Adapter를 사용하는 slice는 **전용 selector**를 제공합니다.

```tsx
import { useAppSelector } from '@/store/hooks';
import { pagesSelectors, entitiesSelectors, diagramsSelectors, logicsSelectors } from '@/store';

function MyComponent() {
    // 1. 모든 항목 가져오기
    const pages = useAppSelector(pagesSelectors.selectAll);
    const entities = useAppSelector(entitiesSelectors.selectAll);
    const diagrams = useAppSelector(diagramsSelectors.selectAll);
    const logics = useAppSelector(logicsSelectors.selectAll);

    // 2. ID로 특정 항목 가져오기
    const page = useAppSelector((state) => pagesSelectors.selectById(state, 'page1'));
    const entity = useAppSelector((state) => entitiesSelectors.selectById(state, 'entity1'));

    // 3. 전체 개수 가져오기
    const totalPages = useAppSelector(pagesSelectors.selectTotal);
    const totalEntities = useAppSelector(entitiesSelectors.selectTotal);

    // 4. 모든 ID만 가져오기
    const pageIds = useAppSelector(pagesSelectors.selectIds);

    return (
        <div>
            <h2>Pages ({totalPages})</h2>
            <ul>
                {pages.map((page) => (
                    <li key={page.id}>{page.name}</li>
                ))}
            </ul>
        </div>
    );
}
```

### 12-4. 미리 정의된 Selector 사용

`src/store/index.ts`에서 export된 selector를 사용할 수 있습니다.

```tsx
import { useAppSelector } from '@/store/hooks';
import {
    selectActiveCanvas,
    selectSelectedPage,
    selectSelectedEntity,
    selectSelectedLogic,
} from '@/store';

function MyComponent() {
    // 선택된 항목 가져오기 (ID가 아닌 전체 객체)
    const selectedPage = useAppSelector(selectSelectedPage);
    const selectedEntity = useAppSelector(selectSelectedEntity);
    const selectedLogic = useAppSelector(selectSelectedLogic);

    return (
        <div>
            {selectedPage && (
                <div>
                    <h3>{selectedPage.name}</h3>
                    <div dangerouslySetInnerHTML={{ __html: selectedPage.html }} />
                </div>
            )}
        </div>
    );
}
```

### 12-5. Redux Slice Actions 실행 (useAppDispatch)

Redux Slice의 상태를 **변경**할 때 사용합니다.

```tsx
import { useAppDispatch } from '@/store/hooks';
import {
    switchCanvas,
    setSelectedPageId,
    setSelectedEntityId,
    updatePage,
    addPage,
    removePage,
} from '@/store';

function MyComponent() {
    const dispatch = useAppDispatch();

    // 1. 탭 전환
    const handleTabChange = (canvas: string) => {
        dispatch(switchCanvas(canvas)); // 'interface' | 'data' | 'logic'
    };

    // 2. 선택된 페이지 변경
    const handlePageSelect = (pageId: string) => {
        dispatch(setSelectedPageId(pageId));
    };

    // 3. 페이지 업데이트
    const handlePageUpdate = () => {
        dispatch(
            updatePage({
                id: 'page1',
                changes: {
                    name: 'Updated Page Name',
                    html: '<div>New HTML</div>',
                },
            })
        );
    };

    // 4. 새 페이지 추가
    const handleAddPage = () => {
        dispatch(
            addPage({
                id: 'new-page',
                name: 'New Page',
                type: 'page',
                html: '',
                css: '',
                content: '',
                pageMeta: {
                    pageVars: { inputParams: {}, localVars: {} },
                    datasources: [],
                    actions: [],
                },
            })
        );
    };

    // 5. 페이지 삭제
    const handleRemovePage = (pageId: string) => {
        dispatch(removePage(pageId));
    };

    return (
        <div>
            <button onClick={() => handleTabChange('interface')}>Interface</button>
            <button onClick={() => handleTabChange('data')}>Data</button>
            <button onClick={() => handleTabChange('logic')}>Logic</button>
            <button onClick={handleAddPage}>Add Page</button>
        </div>
    );
}
```

### 12-6. RTK Query Hooks 사용 (서버 상태)

RTK Query로 **서버 데이터**를 조회하거나 변경할 때 사용합니다.

#### Query (데이터 조회)

```tsx
import { useGetPageBuilderQuery, useGetDataFlowQuery } from '@/store/api';

function MyComponent() {
    const projectId = 1;
    const moduleId = 2;

    // 1. 기본 사용법
    const { data, isLoading, error, refetch } = useGetPageBuilderQuery({
        projectId,
        moduleId,
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error occurred</div>;

    return (
        <div>
            <h1>Page Builder Data</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
            <button onClick={() => refetch()}>Refresh</button>
        </div>
    );
}
```

#### Mutation (데이터 변경)

```tsx
import { useSavePageBuilderMutation, useSaveDataFlowMutation } from '@/store/api';

function MyComponent() {
    const [savePageBuilder, { isLoading, error }] = useSavePageBuilderMutation();

    const handleSave = async () => {
        try {
            const result = await savePageBuilder({
                projectId: 1,
                moduleId: 2,
                data: {
                    /* ... */
                },
            }).unwrap(); // .unwrap()으로 Promise를 얻음

            console.log('Saved successfully:', result);
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    return (
        <button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
        </button>
    );
}
```

### 12-7. 커스텀 Hooks 사용 (권장)

App Studio에서는 **커스텀 hooks**를 사용하여 projectId/moduleId를 자동 주입합니다.

```tsx
import { usePageBuilderQuery, useDataFlowQuery, useLogicFlowQuery } from '@/hooks/app-studio';

function MyComponent() {
    // projectId, moduleId가 자동으로 주입됨
    const { data: pageData, isLoading: isLoadingPages } = usePageBuilderQuery();
    const { data: dataFlow, isLoading: isLoadingData } = useDataFlowQuery();
    const { data: logicFlow, isLoading: isLoadingLogic } = useLogicFlowQuery();

    if (isLoadingPages || isLoadingData || isLoadingLogic) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>Pages: {pageData?.pages?.length}</h2>
            <h2>Entities: {dataFlow?.entity?.length}</h2>
            <h2>Logics: {logicFlow?.logic?.length}</h2>
        </div>
    );
}
```

### 12-8. 모든 데이터 한 번에 가져오기 (useAppStudioData)

App Studio 전용 hook으로 **모든 데이터를 한 번에** 로드합니다.

```tsx
import { useAppStudioData } from '@/hooks/app-studio';

function AppStudioLayout() {
    const {
        // 로딩 상태
        isLoading,
        isLoadingPages,
        isLoadingEntities,
        isLoadingLogics,

        // 에러
        error,
        pagesError,
        entitiesError,
        logicsError,

        // Redux에서 가져온 데이터 (이미 동기화됨)
        pages,
        entities,
        diagrams,
        logics,

        // 선택된 항목
        selectedPage,
        selectedEntity,
        selectedLogic,
    } = useAppStudioData();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h1>App Studio</h1>
            <p>Total Pages: {pages.length}</p>
            <p>Total Entities: {entities.length}</p>
            <p>Selected Page: {selectedPage?.name}</p>
        </div>
    );
}
```

### 12-9. 실전 예시: 컴포넌트에서 전역 상태 읽기/쓰기

```tsx
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { switchCanvas, setSelectedPageId, pagesSelectors } from '@/store';
import { usePageBuilderQuery, useSavePageBuilderMutation } from '@/hooks/app-studio';

function PageManager() {
    const dispatch = useAppDispatch();

    // 1. Redux Slice에서 클라이언트 상태 읽기
    const activeCanvas = useAppSelector((state) => state.appStudio.activeCanvas);
    const selectedPageId = useAppSelector((state) => state.appStudio.selectedPageId);
    const pages = useAppSelector(pagesSelectors.selectAll);

    // 2. RTK Query로 서버 상태 조회
    const { data: pageData, isLoading } = usePageBuilderQuery();

    // 3. RTK Query Mutation
    const [savePage, { isLoading: isSaving }] = useSavePageBuilderMutation();

    // 4. 액션 실행
    const handleSelectPage = (pageId: string) => {
        dispatch(setSelectedPageId(pageId));
    };

    const handleSwitchToInterface = () => {
        dispatch(switchCanvas('interface'));
    };

    const handleSave = async () => {
        await savePage(pageData).unwrap();
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <h2>Active Canvas: {activeCanvas}</h2>
            <h3>Pages ({pages.length})</h3>
            <ul>
                {pages.map((page) => (
                    <li
                        key={page.id}
                        onClick={() => handleSelectPage(page.id)}
                        style={{
                            fontWeight: selectedPageId === page.id ? 'bold' : 'normal',
                        }}
                    >
                        {page.name}
                    </li>
                ))}
            </ul>
            <button onClick={handleSwitchToInterface}>Go to Interface</button>
            <button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
            </button>
        </div>
    );
}
```

### 12-10. 주요 Import 경로 정리

```tsx
// Typed Hooks
import { useAppSelector, useAppDispatch } from '@/store/hooks';

// Redux Slice Actions
import {
    switchCanvas,
    setPages,
    addPage,
    updatePage,
    removePage,
    setSelectedPageId,
    setEntities,
    addEntity,
    updateEntity,
    removeEntity,
    setSelectedEntityId,
    setLogics,
    addLogic,
    updateLogic,
    removeLogic,
    setSelectedLogicId,
} from '@/store';

// Entity Adapter Selectors
import { pagesSelectors, entitiesSelectors, diagramsSelectors, logicsSelectors } from '@/store';

// Memoized Selectors
import {
    selectActiveCanvas,
    selectSelectedPage,
    selectSelectedEntity,
    selectSelectedLogic,
} from '@/store';

// RTK Query API Hooks (직접 사용)
import {
    useGetPageBuilderQuery,
    useSavePageBuilderMutation,
    useGetDataFlowQuery,
    useSaveDataFlowMutation,
    useGetLogicFlowQuery,
    useSaveLogicFlowMutation,
} from '@/store/api';

// App Studio 커스텀 Hooks (권장)
import {
    usePageBuilderQuery,
    useDataFlowQuery,
    useLogicFlowQuery,
    useAppStudioData,
} from '@/hooks/app-studio';
```

---

## 13) 마이그레이션 체크리스트

레거시 API를 RTK Query로 변환할 때:

- [ ] `baseApi.ts`에 새로운 `tagType` 추가
- [ ] `src/store/api/xxxApi.ts` 파일 생성
- [ ] TypeScript 타입 정의 (Request/Response)
- [ ] `baseApi.injectEndpoints`로 endpoint 정의
- [ ] `transformResponse`로 응답 정규화 (필요 시)
- [ ] `providesTags`/`invalidatesTags` 설정
- [ ] Hooks export
- [ ] `src/store/api/index.ts`에서 export
- [ ] 기존 API 호출 코드를 RTK Query hooks로 교체
- [ ] 커스텀 hook 생성 (필요 시)
- [ ] 테스트 및 검증

---

## 14) TO-DO: 레거시 API 전환 계획

### 📊 현재 상황 (2025-12-22 기준)

#### ✅ RTK Query 전환 완료

- **App Studio 핵심 기능**
    - `pageBuilderApi` - PageBuilder 데이터 조회/저장
    - `dataflowApi` - Entity/Diagram 데이터 조회/저장
    - `logicflowApi` - Logic 데이터 조회/저장
- **관리자 기능 (일부)**
    - `adminApi` - 로그인, 공지사항 조회
- **외부 서비스**
    - `translateApi` - 번역/요약 API (외부 서비스 호출)

#### ⚠️ 레거시 방식 사용 중

- **사용자 관리**
    - `src/api/endpoints.js` → `usersAPI`
    - `src/store/slices/userSlice.js` → `createAsyncThunk` 사용
- **사용자 그룹 관리**
    - `src/api/endpoints.js` → `userGroupsAPI`
    - `src/store/slices/userGroupSlice.js` → `createAsyncThunk` 사용
- **메뉴 관리**
    - `src/api/endpoints.js` → `menusAPI`
    - `src/store/slices/menuSlice.js` → `createAsyncThunk` 사용
- **기타**
    - `themesAPI` - 테마 관리
    - `rolebridgeAPI` - 역할-메뉴 연결
    - `clientStatAPI` - 클라이언트 상태 관리 (App Studio 핵심!)
    - `frontFlowAPI` - FrontFlow 데이터
    - `projectAPI` - 프로젝트 관리

---

### 🎯 전환 우선순위 및 계획

#### 1단계: **즉시 작업 (HIGH 우선순위)** ⚡

**대상:** `clientStatAPI` → RTK Query 전환

**이유:**

- App Studio의 핵심 기능 (선택된 페이지/다이어그램 상태 관리)
- 현재 `src/services/clientStateService.ts`에서 직접 호출 중
- 문서에 이미 예시 코드 작성 완료 (섹션 9 참고)

**작업 항목:**

- [ ] `src/store/api/baseApi.ts`에 `'ClientState'` tagType 추가
- [ ] `src/store/api/clientStateApi.ts` 파일 생성
    - [ ] `ClientStateData`, `ClientStateQueryParams` 타입 정의
    - [ ] `getLatestClientState` query 정의
    - [ ] `saveClientState` mutation 정의
    - [ ] `updateClientState` mutation 정의 (필요 시)
    - [ ] Hooks export (`useGetLatestClientStateQuery`, `useSaveClientStateMutation`)
- [ ] `src/store/api/index.ts`에서 export 추가
- [ ] `src/services/clientStateService.ts` 수정
    - [ ] `clientStatAPI` import 제거
    - [ ] RTK Query hooks로 교체
- [ ] 테스트
    - [ ] App Studio 탭 전환 시 상태 저장/복원 확인
    - [ ] 브라우저 새로고침 시 상태 복원 확인

---

#### 2단계: **중기 작업 (MEDIUM 우선순위)** 📅

**대상:** 관리자 기능 API 전환

**이유:**

- 독립적인 관리자 페이지에서만 사용
- App Studio와 분리되어 있어 전환 리스크 낮음
- createAsyncThunk 방식의 보일러플레이트 제거

##### 2-1. Users API 전환

- [ ] `src/store/api/adminApi.ts` 확장
    - [ ] `getUsers` query 정의
    - [ ] `getUser` query 정의
    - [ ] `createUser` mutation 정의
    - [ ] `updateUser` mutation 정의
    - [ ] `deleteUser` mutation 정의
    - [ ] `checkEmailDuplicate` query 정의
- [ ] `src/store/slices/userSlice.js` 리팩토링
    - [ ] `createAsyncThunk` 제거
    - [ ] RTK Query hooks로 전환
    - [ ] slice는 UI 상태만 관리하도록 축소
- [ ] 사용 중인 컴포넌트 수정
    - [ ] `src/pages/user/UserManagementPage.js`
    - [ ] `src/pages/user/UserDetailPage.js`
- [ ] 테스트
    - [ ] 사용자 목록 조회
    - [ ] 사용자 생성/수정/삭제
    - [ ] 이메일 중복 체크

##### 2-2. UserGroups API 전환

- [ ] `src/store/api/adminApi.ts` 확장
    - [ ] `getUserGroups` query 정의
    - [ ] `getUserGroup` query 정의
    - [ ] `createUserGroup` mutation 정의
    - [ ] `updateUserGroup` mutation 정의
    - [ ] `deleteUserGroup` mutation 정의
    - [ ] `getGroupUsers` query 정의
    - [ ] `addUserToGroup` mutation 정의
    - [ ] `removeUserFromGroup` mutation 정의
- [ ] `src/store/slices/userGroupSlice.js` 리팩토링
- [ ] 사용 중인 컴포넌트 수정
    - [ ] `src/pages/usergroup/UserGroupManagementPage.js`
    - [ ] `src/pages/usergroup/UserGroupCreatePage.js`
    - [ ] `src/pages/usergroup/UserGroupEditPage.js`
- [ ] 테스트

##### 2-3. Menus API 전환

- [ ] `src/store/api/adminApi.ts` 확장
    - [ ] `getMenus` query 정의
    - [ ] `getMenuTree` query 정의
    - [ ] `getMenu` query 정의
    - [ ] `createMenu` mutation 정의
    - [ ] `updateMenu` mutation 정의
    - [ ] `deleteMenu` mutation 정의
- [ ] `src/store/slices/menuSlice.js` 리팩토링
- [ ] 사용 중인 컴포넌트 수정
    - [ ] `src/pages/menu/MenuManagementPage.js`
    - [ ] `src/pages/menu/useMenuLogic.ts`
- [ ] 테스트

---

#### 3단계: **장기 작업 (LOW 우선순위)** 📆

**대상:** 기타 API 전환

**이유:**

- 사용 빈도가 낮거나 실험적 기능
- 긴급하지 않음

##### 3-1. Themes API 전환

- [ ] `src/store/api/adminApi.ts` 또는 별도 `themesApi.ts` 생성
    - [ ] `getThemes` query 정의
    - [ ] `createTheme` mutation 정의
    - [ ] `updateTheme` mutation 정의
    - [ ] `deleteTheme` mutation 정의
- [ ] 사용 중인 컴포넌트 수정
    - [ ] `src/pages/theme-settings/ThemeSettingsPage.js`
- [ ] 테스트

##### 3-2. RoleBridge API 전환

- [ ] `src/store/api/adminApi.ts` 확장
    - [ ] `createRoleBridge` mutation 정의
    - [ ] `getRoleBridgesByMenu` query 정의
    - [ ] `deleteRoleBridge` mutation 정의
    - [ ] `restoreRoleBridge` mutation 정의
- [ ] 사용 중인 컴포넌트 수정
- [ ] 테스트

##### 3-3. Project API 전환

- [ ] `src/store/api/projectApi.ts` 파일 생성
    - [ ] `getProject` query 정의
    - [ ] `saveProject` mutation 정의
    - [ ] `updateProject` mutation 정의
    - [ ] `deleteProject` mutation 정의
- [ ] 사용 중인 컴포넌트 수정
    - [ ] `src/pages/project/ProjectPage.js`
- [ ] 테스트

##### 3-4. FrontFlow API 전환

- [ ] `src/store/api/frontflowApi.ts` 파일 생성
    - [ ] `getFrontFlow` query 정의
    - [ ] 필요 시 save/publish mutation 추가
- [ ] 사용 중인 컴포넌트 수정
    - [ ] `src/pages/frontflow/FrontFlowPage.js`
- [ ] 테스트

---

#### 4단계: **레거시 파일 정리** 🧹

**모든 API가 RTK Query로 전환된 후 진행**

- [ ] `src/api/endpoints.js` 파일 삭제
    - [ ] 삭제 전 모든 import 확인
    - [ ] 남은 사용처가 없는지 확인
- [ ] `src/api/config.js` 파일 삭제
    - [ ] `api`, `axnexusApi`, `webhookApi` 사용처 확인
    - [ ] 401 에러 핸들링은 RTK Query에서 처리 확인
- [ ] `src/api/index.js` 파일 삭제
- [ ] 모든 `import from '@/api'` 제거 확인
    - [ ] `src/services/clientStateService.ts`
    - [ ] 기타 파일들
- [ ] 회귀 테스트
    - [ ] 전체 기능 테스트
    - [ ] 로그인/로그아웃
    - [ ] 관리자 기능
    - [ ] App Studio 기능

---

### 📈 전환 완료 시 기대 효과

#### 성능

- ✅ 자동 캐싱으로 불필요한 네트워크 요청 감소
- ✅ 중복 요청 자동 제거
- ✅ 메모리 사용량 감소 (자동 캐시 정리)

#### 개발 경험

- ✅ 보일러플레이트 코드 90% 감소
- ✅ 로딩/에러 상태 자동 관리
- ✅ TypeScript 타입 안정성 향상
- ✅ 코드베이스 일관성 향상

#### 유지보수

- ✅ 중복 코드 제거 (axios instance vs RTK Query)
- ✅ API 엔드포인트가 한 곳에 집중됨
- ✅ 캐시 무효화 로직이 명확해짐

### 📝 진행 상황 추적

| 단계 | API                 | 상태 | 담당자 | 완료일 |
| ---- | ------------------- | ---- | ------ | ------ |
| 1    | clientStatAPI       | ⏳   | -      | -      |
| 2-1  | usersAPI            | ⏳   | -      | -      |
| 2-2  | userGroupsAPI       | ⏳   | -      | -      |
| 2-3  | menusAPI            | ⏳   | -      | -      |
| 3-1  | themesAPI           | ⏳   | -      | -      |
| 3-2  | rolebridgeAPI       | ⏳   | -      | -      |
| 3-3  | projectAPI          | ⏳   | -      | -      |
| 3-4  | frontFlowAPI        | ⏳   | -      | -      |
| 4    | 레거시 파일 정리    | ⏳   | -      | -      |
| -    | pageBuilderAPI      | ✅   | -      | 완료   |
| -    | dataflowAPI         | ✅   | -      | 완료   |
| -    | logicflowAPI        | ✅   | -      | 완료   |
| -    | adminAPI (일부)     | ✅   | -      | 완료   |
| -    | translateAPI (일부) | ✅   | -      | 완료   |

**상태:**

- ✅ 완료
- 🔄 진행 중
- ⏳ 대기 중
- ❌ 보류

---

### 💡 빠른 시작: clientStatAPI 전환 예시

1단계 작업을 바로 시작할 수 있도록 예시 코드를 제공합니다.

#### Step 1: baseApi에 tagType 추가

```typescript
// src/store/api/baseApi.ts
export const baseApi = createApi({
    // ...
    tagTypes: [
        'PageBuilder',
        'DataFlow',
        'LogicFlow',
        'Entity',
        'Diagram',
        'Logic',
        'Page',
        'ClientState', // ← 추가
    ],
    // ...
});
```

#### Step 2: clientStateApi 파일 생성

```typescript
// src/store/api/clientStateApi.ts
import { baseApi } from './baseApi';

export interface ClientStateData {
    projectId?: number;
    moduleId?: number;
    selectedPage?: string;
    selectedPageId?: string;
    selectedDiagram?: string;
    selectedDiagramId?: string;
}

export interface ClientStateQueryParams {
    projectId?: string | number;
    moduleId?: string | number;
}

export const clientStateApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getLatestClientState: builder.query<ClientStateData, ClientStateQueryParams>({
            query: ({ projectId, moduleId }) => {
                const params = new URLSearchParams();
                if (projectId != null) params.set('projectId', String(projectId));
                if (moduleId != null) params.set('moduleId', String(moduleId));

                const query = params.toString();
                return `/v1/client-state/latest${query ? `?${query}` : ''}`;
            },
            transformResponse: (response: any) => {
                return response?.data?.data ?? response?.data ?? response;
            },
            providesTags: ['ClientState'],
        }),

        saveClientState: builder.mutation<ClientStateData, ClientStateData>({
            query: (data) => ({
                url: '/v1/client-state',
                method: 'POST',
                body: data,
            }),
            transformResponse: (response: any) => {
                return response?.data ?? response;
            },
            invalidatesTags: ['ClientState'],
        }),
    }),
});

export const { useGetLatestClientStateQuery, useSaveClientStateMutation } = clientStateApi;
```

#### Step 3: index.ts에서 export

```typescript
// src/store/api/index.ts
export * from './baseApi';
export * from './pageBuilderApi';
export * from './dataflowApi';
export * from './logicflowApi';
export * from './adminApi';
export * from './translateApi';
export * from './clientStateApi'; // ← 추가
```

#### Step 4: clientStateService 수정

```typescript
// src/services/clientStateService.ts (수정 후)
import { useGetLatestClientStateQuery } from '@/store/api/clientStateApi';
import type { ClientStateLike, SyncClientStateOptions } from '@/types/chatbot/clientState';

// ... 기존 코드는 RTK Query hooks 사용 방식으로 변경
```
