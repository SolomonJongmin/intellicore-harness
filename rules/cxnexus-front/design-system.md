# Design System v1.0.0

IntelliCore 프로젝트의 디자인 시스템 문서입니다.

### Figma 링크 | 초대 요청 : 장혜승 책임

`https://www.figma.com/design/8jIi3UVgbQuWqI4y0AHlZs/IntelliCore_Design_System?node-id=15-2&t=rsko5zCUagzKgol9-1`

---

## History Log

| 버전   | 날짜       | 작성자               | 변경 내용                                                  |
| ------ | ---------- | -------------------- | ---------------------------------------------------------- |
| v1.0.0 | 2026-02-04 | SI사업팀 장혜승 책임 | 최초 작성 - Colors, Typography, Spacing, WNButton 컴포넌트 |

---

## 목차

1. [개요](#개요)
2. [파일 구조](#파일-구조)
3. [Colors](#colors)
4. [Typography](#typography)
5. [Spacing & Radius](#spacing--radius)
6. [Border](#border)
7. [Components](#components)
8. [사용법](#사용법)

---

## 개요

Mantine UI 라이브러리를 기반으로 한 디자인 시스템입니다.

- **디자인 토큰**: `src/styles/design-system/tokens.ts`
- **Mantine 테마**: `src/styles/design-system/theme.ts`
- **CSS 변수**: Mantine이 자동 생성 (`--mantine-color-*`)

---

## 파일 구조

```
src/
├── styles/
│   ├── common/             # 디자인 시스템 (메인)
│   │   ├── index.ts        # Export 진입점
│   │   ├── tokens.ts       # 디자인 토큰 (색상, 간격, 폰트 등)
│   │   └── theme.ts        # Mantine 테마 설정
│   ├── design-system/      # Re-export (하위 호환)
│   │   └── index.ts        # ../common 재export
│   └── global.css          # 전역 CSS 변수
└── components/
    └── ui/
        ├── index.ts        # UI 컴포넌트 Export
        ├── WNButton.tsx    # 버튼 컴포넌트
        └── WNTitle.tsx     # 타이틀 컴포넌트
```

---

## Colors

### Primary (Blue-Purple)

| Index       | Code                | Hex                        |
| ----------- | ------------------- | -------------------------- |
| 0 (50)      | `colors.primary[0]` | #EFF0FA                    |
| 1 (100)     | `colors.primary[1]` | #E0E3F5                    |
| 2 (200)     | `colors.primary[2]` | #C3C9ED                    |
| 3 (300)     | `colors.primary[3]` | #9FA8E3                    |
| 4 (400)     | `colors.primary[4]` | #7681D6                    |
| 5 (500)     | `colors.primary[5]` | #5360C7                    |
| **6 (600)** | `colors.primary[6]` | **#2E3192** ← primaryShade |
| 7 (700)     | `colors.primary[7]` | #242673                    |
| 8 (800)     | `colors.primary[8]` | #1B1D5A                    |
| 9 (900)     | `colors.primary[9]` | #121341                    |

### Secondary (Orange)

| Index       | Code                  | Hex                        |
| ----------- | --------------------- | -------------------------- |
| 0 (50)      | `colors.secondary[0]` | #FFF4F0                    |
| 1 (100)     | `colors.secondary[1]` | #FFE6DB                    |
| 2 (200)     | `colors.secondary[2]` | #FFCBB8                    |
| 3 (300)     | `colors.secondary[3]` | #FFA98C                    |
| 4 (400)     | `colors.secondary[4]` | #FF8259                    |
| 5 (500)     | `colors.secondary[5]` | #FF7345                    |
| **6 (600)** | `colors.secondary[6]` | **#FE632F** ← primaryShade |
| 7 (700)     | `colors.secondary[7]` | #DB481F                    |
| 8 (800)     | `colors.secondary[8]` | #B83A19                    |
| 9 (900)     | `colors.secondary[9]` | #952E14                    |

### Status Colors

| Color       | Index 6 (Primary) | 용도       |
| ----------- | ----------------- | ---------- |
| **Danger**  | #F64C4C           | 에러, 삭제 |
| **Warning** | #FFAD0D           | 경고       |
| **Success** | #47B881           | 성공       |
| **Info**    | #3B82F6           | 정보       |

### Gray (Neutral)

| Index | Hex     | 용도        |
| ----- | ------- | ----------- |
| 0     | #F8F9FA | 배경        |
| 3     | #DEE2E6 | 테두리      |
| 5     | #ADB5BD | Placeholder |
| 6     | #868E96 | Muted Text  |
| 9     | #212529 | Text        |

---

## Typography

### Scale

| Role        | Size             | Weight | Line Height | Letter Spacing |
| ----------- | ---------------- | ------ | ----------- | -------------- |
| **Display** | 60px (3.75rem)   | 700    | 130%        | -1.5%          |
| **H1**      | 48px (3rem)      | 700    | 130%        | -1%            |
| **H2**      | 36px (2.25rem)   | 600    | 135%        | -1%            |
| **H3**      | 24px (1.5rem)    | 600    | 140%        | -0.5%          |
| **H4**      | 16px (1rem)      | 600    | 140%        | -0.5%          |
| **H5**      | 13px (0.8125rem) | 600    | 140%        | -0.5%          |
| **Body 1**  | 16px (1rem)      | 500    | 150%        | 0              |
| **Body 2**  | 13px (0.8125rem) | 400    | 150%        | 0              |
| **Caption** | 12px (0.75rem)   | 400    | 130%        | 0              |

### Font Family

```typescript
fontFamily: {
    sans: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
}
```

---

## Spacing & Radius

### Spacing

| Key | Value   | Pixels |
| --- | ------- | ------ |
| xs  | 0.5rem  | 8px    |
| sm  | 0.75rem | 12px   |
| md  | 1rem    | 16px   |
| lg  | 1.5rem  | 24px   |
| xl  | 2rem    | 32px   |
| 2xl | 2.5rem  | 40px   |
| 3xl | 3rem    | 48px   |

### Border Radius

| Key  | Value    | Pixels |
| ---- | -------- | ------ |
| xs   | 0.125rem | 2px    |
| sm   | 0.25rem  | 4px    |
| md   | 0.5rem   | 8px    |
| lg   | 1rem     | 16px   |
| xl   | 1.5rem   | 24px   |
| full | 9999px   | 원형   |

---

## Border

### Border Width

| Key    | Value | 용도        |
| ------ | ----- | ----------- |
| thin   | 1px   | 기본 테두리 |
| medium | 2px   | 강조 테두리 |
| thick  | 3px   | 굵은 테두리 |

### Border Color

| Key       | Hex     | 용도           |
| --------- | ------- | -------------- |
| default   | #DEE2E6 | 기본 테두리    |
| light     | #E9ECEF | 연한 테두리    |
| dark      | #CED4DA | 진한 테두리    |
| darker    | #ADB5BD | 더 진한 테두리 |
| primary   | #2E3192 | Primary 강조   |
| secondary | #FE632F | Secondary 강조 |
| success   | #47B881 | 성공 상태      |
| warning   | #FFAD0D | 경고 상태      |
| danger    | #F64C4C | 에러/삭제 상태 |
| info      | #3B82F6 | 정보 상태      |
| focus     | #5360C7 | 포커스 상태    |

### Pre-composed Borders

자주 사용하는 border 조합:

| Key       | Value                | 용도             |
| --------- | -------------------- | ---------------- |
| default   | `1px solid #DEE2E6`  | 기본 테두리      |
| light     | `1px solid #E9ECEF`  | 연한 테두리      |
| dark      | `1px solid #CED4DA`  | 진한 테두리      |
| medium    | `2px solid #DEE2E6`  | 2px 테두리       |
| thick     | `3px solid #DEE2E6`  | 3px 테두리       |
| primary   | `1px solid #2E3192`  | Primary 테두리   |
| secondary | `1px solid #FE632F`  | Secondary 테두리 |
| success   | `1px solid #47B881`  | 성공 테두리      |
| warning   | `1px solid #FFAD0D`  | 경고 테두리      |
| danger    | `1px solid #F64C4C`  | 에러 테두리      |
| focus     | `2px solid #5360C7`  | 포커스 테두리    |
| dashed    | `1px dashed #DEE2E6` | 점선 테두리      |
| dotted    | `1px dotted #CED4DA` | 도트 테두리      |

---

## Components

### WNButton

디자인 시스템 기반 버튼 컴포넌트입니다.

#### Props

| Prop          | Type                                                          | Default     | Description                  |
| ------------- | ------------------------------------------------------------- | ----------- | ---------------------------- |
| `variant`     | `'filled' \| 'light' \| 'outline' \| 'default' \| 'subtle'`   | `'filled'`  | 버튼 스타일                  |
| `colorScheme` | `'primary' \| 'secondary' \| 'danger' \| 'success' \| 'gray'` | `'primary'` | 버튼 색상                    |
| `size`        | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`                        | `'sm'`      | 버튼 크기                    |
| `leftIcon`    | `LucideIcon`                                                  | -           | 왼쪽 아이콘 (자동 크기 조절) |
| `disabled`    | `boolean`                                                     | `false`     | 비활성화                     |
| `onClick`     | `MouseEventHandler<HTMLButtonElement>`                        | -           | 클릭 이벤트 핸들러           |

#### Icon Sizes (자동 적용)

| Button Size | Icon Size |
| ----------- | --------- |
| xs          | 14px      |
| sm          | 16px      |
| md          | 18px      |
| lg          | 20px      |
| xl          | 24px      |

#### Color Schemes

| colorScheme   | Filled 배경 | Light 배경 | Outline 테두리 | 용도       |
| ------------- | ----------- | ---------- | -------------- | ---------- |
| **primary**   | #2E3192     | #EFF0FA    | #2E3192        | 기본 액션  |
| **secondary** | #FE632F     | #FFF4F0    | #FE632F        | 보조 액션  |
| **danger**    | #F64C4C     | #FFFBFB    | #F64C4C        | 삭제, 에러 |
| **success**   | #47B881     | #FBFEFC    | #47B881        | 확인, 성공 |
| **gray**      | #495057     | #F8F9FA    | #ADB5BD        | 취소, 중립 |

#### Variants

| Variant     | 설명                                    |
| ----------- | --------------------------------------- |
| **filled**  | 배경색 채움, 흰색 텍스트                |
| **light**   | 연한 배경색, 진한 텍스트                |
| **outline** | 투명 배경, 컬러 테두리                  |
| **default** | 흰색 배경, 회색 테두리                  |
| **subtle**  | 투명 배경, 텍스트만 (호버 시 연한 배경) |

### WNTitle

디자인 시스템 기반 타이틀 컴포넌트입니다.

#### Props

| Prop    | Type                                                         | Default  | Description |
| ------- | ------------------------------------------------------------ | -------- | ----------- |
| `order` | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                                 | `3`      | 제목 레벨   |
| `color` | `'primary' \| 'secondary' \| 'text' \| 'muted' \| 'inherit'` | `'text'` | 텍스트 색상 |

#### Order (Typography 매핑)

| Order | Typography | Font Size        | Font Weight | Line Height |
| ----- | ---------- | ---------------- | ----------- | ----------- |
| 1     | H1         | 48px (3rem)      | 700         | 130%        |
| 2     | H2         | 36px (2.25rem)   | 600         | 135%        |
| 3     | H3         | 24px (1.5rem)    | 600         | 140%        |
| 4     | H4         | 16px (1rem)      | 600         | 140%        |
| 5     | H5         | 13px (0.8125rem) | 600         | 140%        |
| 6     | Caption    | 12px (0.75rem)   | 400         | 130%        |

#### Colors

| Color         | Hex     | 용도           |
| ------------- | ------- | -------------- |
| **text**      | #212529 | 기본 (default) |
| **primary**   | #2E3192 | 강조           |
| **secondary** | #FE632F | 보조 강조      |
| **muted**     | #868E96 | 보조 텍스트    |
| **inherit**   | inherit | 부모 상속      |

---

## 사용법

### TypeScript에서 토큰 사용

```tsx
import {
    colors,
    spacing,
    typography,
    border,
    borderColor,
    borderWidth,
    radius,
} from '@/styles/design-system';

// 색상
const primaryColor = colors.primary[6]; // #2E3192
const errorColor = colors.danger[6]; // #F64C4C

// 간격
const padding = spacing.md; // 1rem

// 타이포그래피
const headingStyle = {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    lineHeight: typography.h1.lineHeight,
};

// Border (pre-composed)
const cardStyle = {
    border: border.default, // '1px solid #DEE2E6'
    borderRadius: radius.md,
};

// Border 개별 사용
const inputStyle = {
    borderWidth: borderWidth.thin, // '1px'
    borderColor: borderColor.default, // '#DEE2E6'
    borderStyle: 'solid',
};

// Status border
const errorInput = {
    border: border.danger, // '1px solid #F64C4C'
};
```

### CSS 변수 사용

Mantine이 테마 기반으로 자동 생성하는 CSS 변수:

```css
/* 색상 */
color: var(--mantine-color-primary-6);
background: var(--mantine-color-secondary-0);
border-color: var(--mantine-color-gray-3);

/* 시맨틱 변수 (global.css에서 정의) */
color: var(--color-text);
background: var(--color-surface);

/* Border 변수 */
border: var(--border-default); /* 1px solid gray-3 */
border: var(--border-light); /* 1px solid gray-2 */
border: var(--border-dark); /* 1px solid gray-4 */
border: var(--border-primary); /* 1px solid primary */
border: var(--border-danger); /* 1px solid danger */
border: var(--border-dashed); /* 1px dashed gray-3 */
border: var(--border-focus); /* 2px solid primary-5 */

/* Border 색상만 필요할 때 */
border-color: var(--color-border); /* gray-3 */
border-color: var(--color-border-light); /* gray-2 */
border-color: var(--color-border-dark); /* gray-4 */

/* Border 두께 */
border-width: var(--border-width-thin); /* 1px */
border-width: var(--border-width-medium); /* 2px */
border-width: var(--border-width-thick); /* 3px */

/* Status */
color: var(--color-success);
color: var(--color-error);
color: var(--color-warning);
color: var(--color-info);
```

### WNButton 사용

```tsx
import { WNButton } from '@/components/common';

// 기본 (Primary Filled)
<WNButton>확인</WNButton>

// Variants
<WNButton variant="filled">Filled</WNButton>
<WNButton variant="light">Light</WNButton>
<WNButton variant="outline">Outline</WNButton>
<WNButton variant="default">Default</WNButton>
<WNButton variant="subtle">Subtle</WNButton>

// Secondary Color
<WNButton colorScheme="secondary">Secondary</WNButton>
<WNButton colorScheme="secondary" variant="outline">Outline</WNButton>

// 크기
<WNButton size="xs">XS</WNButton>
<WNButton size="sm">SM</WNButton>
<WNButton size="md">MD</WNButton>
<WNButton size="lg">LG</WNButton>

// 비활성화
<WNButton disabled>Disabled</WNButton>

// 아이콘과 함께 (leftIcon 사용 - 권장)
import { Plus, Save, Trash2 } from 'lucide-react';
<WNButton leftIcon={Plus}>추가</WNButton>
<WNButton leftIcon={Save} colorScheme="success">저장</WNButton>
<WNButton leftIcon={Trash2} colorScheme="danger" variant="outline">삭제</WNButton>

// 크기별 아이콘 (자동 크기 조절)
<WNButton leftIcon={Plus} size="xs">XS (14px icon)</WNButton>
<WNButton leftIcon={Plus} size="sm">SM (16px icon)</WNButton>
<WNButton leftIcon={Plus} size="md">MD (18px icon)</WNButton>
<WNButton leftIcon={Plus} size="lg">LG (20px icon)</WNButton>
<WNButton leftIcon={Plus} size="xl">XL (24px icon)</WNButton>
```

### WNTitle 사용

```tsx
import { WNTitle } from '@/components/ui';

// 기본 (H3, text color)
<WNTitle>섹션 제목</WNTitle>

// Order 지정
<WNTitle order={1}>H1 페이지 타이틀</WNTitle>
<WNTitle order={2}>H2 섹션 타이틀</WNTitle>
<WNTitle order={3}>H3 서브섹션</WNTitle>
<WNTitle order={4}>H4 항목 제목</WNTitle>
<WNTitle order={5}>H5 작은 제목</WNTitle>
<WNTitle order={6}>H6 캡션 제목</WNTitle>

// Color 지정
<WNTitle color="primary">Primary 강조 제목</WNTitle>
<WNTitle color="secondary">Secondary 강조 제목</WNTitle>
<WNTitle color="muted">보조 텍스트</WNTitle>

// 조합
<WNTitle order={2} color="primary">Primary H2</WNTitle>
```

### Mantine Title/Text 사용 (직접 사용)

```tsx
import { Title, Text } from '@mantine/core';

// Headings (테마에서 자동 적용)
<Title order={1}>H1 제목</Title>
<Title order={2}>H2 제목</Title>
<Title order={3}>H3 제목</Title>

// Text
<Text size="md">Body 1 텍스트</Text>
<Text size="sm">Body 2 텍스트</Text>
<Text size="xs">Caption 텍스트</Text>
```
