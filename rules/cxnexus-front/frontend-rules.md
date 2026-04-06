# CX Nexus / AX Nexus 프론트엔드 규칙

## 기술 스택

- React 19 + TypeScript 5
- CRA (craco) 빌드
- react-router-dom (라우팅)
- react-i18next (다국어)

## 프로젝트 구조

```
src/
├── components/          # 재사용 컴포넌트
│   ├── common/          # 공통 (Button, Modal, Table 등)
│   └── {feature}/       # 기능별 컴포넌트
├── pages/               # 페이지 컴포넌트 (라우트 단위)
├── hooks/               # 커스텀 훅
├── services/            # API 호출 레이어
├── store/               # 상태 관리
├── types/               # TypeScript 타입 정의
├── utils/               # 유틸리티 함수
└── i18n/                # 다국어 리소스
```

## 네이밍 컨벤션

| 유형 | 패턴 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `UserList.tsx` |
| 훅 | camelCase, use 접두사 | `useAuth.ts` |
| 서비스 | camelCase | `userService.ts` |
| 타입 | PascalCase | `UserResponse.ts` |
| 유틸 | camelCase | `formatDate.ts` |

## 컴포넌트 규칙

- 함수형 컴포넌트만 사용 (클래스 컴포넌트 금지)
- Props는 interface로 정의, `Props` 접미사
- 컴포넌트 파일 하나에 하나의 export default

```tsx
interface UserListProps {
  users: User[];
  onSelect: (id: number) => void;
}

export default function UserList({ users, onSelect }: UserListProps) {
  return (/* ... */);
}
```

## API 호출

- axios 인스턴스 공통 설정 (baseURL, interceptor)
- 서비스 레이어에서 API 호출 캡슐화
- 에러 핸들링은 interceptor에서 공통 처리

## 상태 관리

- 서버 상태: API 호출 결과 캐싱
- 클라이언트 상태: 최소한으로 유지
- props drilling 3단계 이상이면 상태 관리 도입 검토

## TypeScript

- `any` 사용 금지 — `unknown` 사용 후 타입 가드
- API 응답 타입 반드시 정의
- optional chaining 적극 활용
