---
applyTo: '**'
description: 'React project file structure and organization standards'
---

# React File Structure and Organization

> This document defines the organizational structure, naming, and layout standards for React projects, ensuring consistency and maintainability of the codebase.
> New files and directories should follow these standards, and existing structures should be gradually adjusted during refactoring.

## 1. Basic Principles

- File organization should reflect the application's functionality and feature structure
- Related files should be co-located in the same directory
- Directory and file names should clearly describe their content and purpose (see [Naming Conventions](./naming-conventions.instructions.md))
- Maintain consistent file naming and organization patterns across the project
- Avoid deep directory nesting (no more than 4-5 levels recommended)
- Promote files to shared locations only when reused across multiple features

## 2. Project Root Directory Structure

```
project-root/
├── src/                 # Source code
│   ├── components/      # Shared/reusable components
│   ├── view/            # Page/route view components
│   ├── hooks/           # Shared custom hooks
│   ├── atom/            # Global jotai atoms
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── services/        # API endpoint definitions (not implementation)
│   ├── assets/          # Source assets (images, fonts, icons, mock data)
│   ├── styles/          # Global styles and variables
│   ├── routes/          # Route definitions (TanStack Router or similar)
│   ├── i18n/            # Internationalization files
│   └── App.tsx          # Root application component
├── __tests__/           # Global test utilities and fixtures
├── env/                 # Environment type definitions
├── cicd/                # CI/CD pipeline configurations
├── scripts/             # Build and automation scripts
├── docs/                # Project documentation
├── .env                 # Environment variables
├── package.json
├── tsconfig.json
└── rsbuild.config.ts    # or vite.config.ts/webpack config
```

## 3. Source Directory Organization (src/)

### 3.1 Components Directory

Shared/reusable components used across multiple features.

```
src/components/
├── button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── index.ts
├── input/
│   ├── Input.tsx
│   ├── Input.test.tsx
│   └── index.ts
└── modal/
    ├── Modal.tsx
    ├── Modal.test.tsx
    ├── hooks/
    │   └── use-modal.ts
    └── index.ts
```

### 3.2 View Directory

View directory contains page/route components. Each page is isolated and **cannot import from other pages**.

```
src/view/
├── dashboard/
│   ├── index.tsx               # Main dashboard page component
│   ├── atom/                   # Page-specific atoms
│   │   └── dashboard-filters.atom.ts
│   ├── hooks/                  # Page-specific hooks (business logic)
│   │   ├── use-dashboard-data.ts
│   │   └── use-chart-config.ts
│   ├── utils/                  # Page-specific utilities
│   │   └── format-dashboard-data.ts
│   └── components/             # Page-specific components
│       ├── chart-panel/
│       │   ├── ChartPanel.tsx
│       │   └── ChartPanel.test.tsx
│       └── stats-card/
│           ├── StatsCard.tsx
│           └── StatsCard.test.tsx
├── user-profile/
│   ├── index.tsx
│   ├── atom/
│   │   └── profile-form.atom.ts
│   ├── hooks/
│   │   ├── use-user-profile.ts
│   │   └── use-profile-validation.ts
│   └── components/
│       ├── ProfileHeader.tsx
│       └── ProfileForm.tsx
└── poet/
    ├── index.tsx
    ├── hooks/
    │   └── use-poet-detail.ts
    └── components/
        └── PoetDetail.tsx
```

**Critical Rule**: View pages **cannot import from each other**. If code needs to be shared:
- Extract to `src/components/` (for UI components)
- Extract to `src/hooks/` (for shared hooks)
- Extract to `src/utils/` (for utilities)
- Extract to `src/atom/` (for global state)

### 3.3 Component Co-location Pattern

Each component directory contains all related files:

```
component-name/
├── ComponentName.tsx           # Component implementation
├── ComponentName.test.tsx      # Component tests
├── hooks/                      # Component-specific hooks (if any)
│   ├── use-component-logic.ts
│   └── use-validation.ts
├── component-name.atom.ts      # Component-specific atom (optional)
└── component-name.types.ts     # Component-specific types (optional)
```

**Hook Rule**: One hook per file, one exported `useXxx` function per file.

**File naming rules**:
- Component file: **PascalCase** (e.g., `UserProfile.tsx`)
- Hook file: **kebab-case** (e.g., `use-user-profile.ts`)
- Atom file: **kebab-case + .atom.ts** (e.g., `user-profile.atom.ts`)
- Type file: **kebab-case + .types.ts** (e.g., `user-profile.types.ts`)
- Test file: **matching name + .test.tsx/.test.ts** (e.g., `UserProfile.test.tsx`, `use-user-profile.test.ts`)

### 3.4 Hooks Directory

Shared custom hooks used across multiple features.

```
src/hooks/
├── use-auth.ts
├── use-debounce.ts
├── use-local-storage.ts
└── use-viewport.ts
```

### 3.5 Atoms Directory

Global jotai atoms for application-wide state.

```
src/atom/
├── user.atom.ts
├── theme.atom.ts
├── global-settings.atom.ts
└── auth.atom.ts
```

### 3.6 Utils Directory

Utility functions and helper modules.

```
src/utils/
├── format-date.ts
├── validate-email.ts
├── api-client.ts
└── local-storage.ts
```

### 3.7 Types Directory

Shared TypeScript type definitions.

```
src/types/
├── user.types.ts
├── api.types.ts
├── common.types.ts
└── index.ts              # Re-export all types
```

### 3.8 Services Directory

API endpoint definitions only. **Business logic and data fetching implementations belong in hooks**.

```
src/services/
├── api.common.ts           # Common API utilities (base URL, headers)
├── api.user.ts             # User API endpoints
├── api.auth.ts             # Auth API endpoints
└── api.product.ts          # Product API endpoints
```

Example service file (API definitions as string templates):

```ts
// src/services/api.user.ts
export const userApi = {
  getProfile: '/api/users/{userId}',
  updateProfile: '/api/users/profile',
  listUsers: '/api/users',
  searchUsers: '/api/users/search',
};
```

Fetch data using `fetcher` utility and format paths with `build-query-string` in hooks:

```ts
// src/hooks/use-user-profile.ts
import { userApi } from '@/services/api.user';
import { fetcher } from '@/utils/fetcher';
import { buildQueryString } from '@/utils/build-query-string';

export function useUserProfile(userId: string) {
  const url = userApi.getProfile.replace('{userId}', userId);
  return useSWR(url, fetcher);
}

export function useUserSearch(query: string) {
  const url = buildQueryString(userApi.searchUsers, { q: query });
  return useSWR(url, fetcher);
}
```

## 4. Component Classification and Placement

### 4.1 Presentational Components

Pure UI components with minimal logic.

**Placement**: `src/components/` (if reusable) or `src/view/[page]/components/` (if page-specific)

```tsx
// src/components/button/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  return <button className={styles[variant]} onClick={onClick}>{children}</button>;
}
```

### 4.2 Container Components

Components with business logic, data fetching, and state management.

**Placement**: `src/view/` or feature-specific directories

```tsx
// src/view/user-profile/UserProfilePage.tsx
export function UserProfilePage() {
  const { user, loading } = useUserProfile();
  
  if (loading) return <LoadingSpinner />;
  return <ProfileView user={user} />;
}
```

### 4.3 Layout Components

Components that define page structure and layout.

**Placement**: `src/components/layout/`

```
src/components/layout/
├── main-layout/
│   ├── MainLayout.tsx
│   ├── MainLayout.test.tsx
│   └── index.ts
├── header/
│   ├── Header.tsx
│   ├── Header.test.tsx
│   └── index.ts
└── footer/
    ├── Footer.tsx
    ├── Footer.test.tsx
    └── index.ts
```

## 5. State Management Organization

### 5.1 Local State

Use `useState` or `useReducer` within component files.

### 5.2 Component-Level State (Atoms)

For state shared within a component tree, co-locate atoms with the component.

```
src/view/dashboard/
├── DashboardPage.tsx
└── atom/
    └── dashboard-filters.atom.ts
```

### 5.3 Global State (Atoms)

For application-wide state, place atoms in `src/atom/`.

```
src/atom/
├── user.atom.ts           # Current user
├── theme.atom.ts          # UI theme
└── auth.atom.ts           # Auth status
```

## 6. Asset Organization

### 6.1 Public Assets

Static files served directly without processing.

```
public/
├── favicon.ico
├── robots.txt
└── images/
    ├── logo.png
    └── banner.jpg
```

### 6.2 Source Assets

Assets imported in code (processed by bundler).

```
src/assets/
├── images/
│   ├── icon-user.svg
│   └── background-pattern.png
├── fonts/
│   ├── roboto-regular.woff2
│   └── roboto-bold.woff2
└── icons/
    ├── chevron-down.svg
    └── close-icon.svg
```

## 7. Code Organization Principles

### 7.1 Single Responsibility

- Each component should have one clear purpose
- Extract complex logic into custom hooks
- Split large components into smaller sub-components

### 7.2 Co-location

- Keep related files together (component + styles + tests + hooks)
- Only promote to shared locations when truly reusable

### 7.3 File Size Limits

- Components: < 300 lines
- Hooks: < 300 lines
- Utility functions: < 300 lines

### 7.4 Promotion Strategy

Start local, promote when reused:

1. **Initial**: View-specific (in `src/view/[view-name]/`)
2. **Reused in same view**: Keep in view's components folder
3. **Reused across 2+ views**: **Must** promote to `src/components/` (view pages in `src/view/` cannot import from each other)
4. **Shared hooks**: Extract to `src/hooks/`
5. **Shared state**: Extract atoms to `src/atom/`
6. **Shared utilities**: Extract to `src/utils/`

**Critical**: If view A needs something from view B, extract it to a shared location. Direct cross-view imports are **forbidden**.

## 8. Styling with Tailwind CSS

### 8.1 Tailwind CSS First

Use **Tailwind CSS** as the primary and recommended styling solution for all components and layouts.

**Benefits**:
- Consistent design system and spacing scale
- Simple and responsive layouts
- Reduced CSS file sizes (tree-shaking unused styles)
- Faster development with utility classes

### 8.2 Managing Long or Dynamic Classnames with `cn`

When className becomes long or needs to use JavaScript variables, classify and group the utilities, then wrap with the `cn` utility from `@/utils/classname.ts`.

**Without cn (hard to read)**

```tsx
// ❌ Not recommended - hard to maintain
function Card({ variant, isActive, size }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
        variant === 'primary' ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-50 text-gray-900 border-gray-200'
      } ${
        isActive ? 'shadow-lg ring-2 ring-blue-300' : 'shadow-sm'
      } ${
        size === 'lg' ? 'px-6 py-4' : size === 'sm' ? 'px-2 py-1 text-sm' : 'px-4 py-3'
      }`}
    >
      {/* content */}
    </div>
  );
}
```

**With cn (clean and organized)**

Organize utilities in this order:

1. **Base styles** - Layout, positioning, basic structure
2. **Sizing & Spacing** - Width, height, padding, margin (use object notation)
3. **Variant styles** - Color, background, border based on props (use object notation)
4. **State styles** - Hover, focus, active, disabled states (use object notation)
5. **Responsive & Conditional** - Media queries, conditional classes

```tsx
import { cn } from '@/utils/classname';

function Card({ variant, isActive, size, disabled }) {
  return (
    <div
      className={cn(
        // 1. Base styles
        'flex items-center justify-between',
        'rounded-lg border transition-colors',
        // 2. Sizing & Spacing (use object notation for conditional)
        {
          'px-4 py-3 gap-2': !size || size === 'md',
          'px-6 py-4 gap-3': size === 'lg',
          'px-2 py-1 gap-1': size === 'sm'
        },
        // 3. Variant (object notation)
        {
          'bg-blue-500 text-white border-blue-600': variant === 'primary',
          'bg-gray-50 text-gray-900 border-gray-200': variant !== 'primary'
        },
        // 4. State (object notation)
        {
          'shadow-lg ring-2 ring-blue-300': isActive,
          'shadow-sm': !isActive,
          'opacity-50 cursor-not-allowed': disabled
        },
        // 5. Responsive
        'md:px-6 md:py-4 lg:text-lg'
      )}
    >
      {/* content */}
    </div>
  );
}
```


### 9.1 Component Tests

Co-locate with component files using `.test.tsx` suffix.

```
src/components/button/
├── Button.tsx
└── Button.test.tsx
```

### 9.2 Hook Tests

Co-locate with hook files using `.test.ts` suffix.

```
src/hooks/
├── use-user-profile.ts
└── use-user-profile.test.ts
```

### 9.3 Utility Tests

Co-locate with utility files using `.test.ts` suffix.

```
src/utils/
├── format-date.ts
└── format-date.test.ts
```

### 9.4 Test Utilities and Fixtures

Shared test helpers and fixtures in `__tests__` directory.

```
__tests__/
└── utils/
    ├── fetcher.test.ts
    ├── i18n.test.ts
    └── utils.test.ts
```

## 10. Best Practices Summary

✅ **Do:**
- Co-locate related files (component + tests)
- Component hooks go in `hooks/` subfolder, one hook per file
- Use kebab-case for directories and non-component files
- Use PascalCase for component files
- Keep components small and focused (< 300 lines)
- Extract reusable logic to hooks (business logic in hooks, not services)
- Use jotai atoms for shared state (global, view-level, or component-level)
- Name all test files with `.test.tsx` or `.test.ts` suffix
- Extract shared code from view pages to common folders (components/hooks/utils/atom)
- Use `fetcher` utility for all API requests
- Define API endpoints as strings in services (e.g., `/api/users/{userId}`)
- Use `build-query-string` for query parameters
- Use **Tailwind CSS** for all component styles
- Use `cn` utility from `@/utils/classname.ts` for long or dynamic classnames
- Organize classnames: base styles → sizing/spacing → variants → states → responsive

❌ **Don't:**
- Import between view pages (forbidden - extract to shared locations instead)
- Put business logic in services (services are API definitions only)
- Create multiple hooks in one file (one hook = one file)
- Put component hooks at component root (must be in `hooks/` subfolder)
- Create deeply nested directory structures (> 4-5 levels)
- Mix component files with unrelated logic
- Prematurely promote components to shared locations
- Use generic names like `utils.ts` or `helpers.ts`
- Create circular dependencies
- Put all state in global atoms (prefer local state when possible)
- Use custom fetch implementations (use `fetcher` utility instead)
- Manually construct query strings (use `build-query-string` utility)
- Hard-code long classname strings (use `cn` utility for dynamic/long classnames)
- Mix different styling approaches (use Tailwind CSS consistently)
