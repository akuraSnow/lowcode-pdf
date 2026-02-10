---
applyTo: '**/*.ts, **/*.tsx, **/*.html, **/*.css, **/*.scss'
description: 'React-specific naming conventions. Apply to all new code; refactor existing code gradually.'
---

# React Naming Conventions

> This document defines naming rules for React projects, ensuring consistency and readability across components, hooks, styles, and utilities.

## 1. Basic Principles

- Names should be simple yet meaningful, avoiding overly simple names (e.g., 'a', 'abc')
- Strictly prohibit using Chinese characters, pinyin, or a mix of pinyin and English in naming
- Names should reflect the element's purpose, behavior, or attributes
- Use English vocabulary and avoid abbreviations (except widely accepted ones like HTTP, URL, API, etc.)
- Follow naming conventions specific to element types

## 2. React Component Naming

### 2.1 Component Names (PascalCase)

All React components use **PascalCase**.

```tsx
// ✅ Good
function UserProfile() { /* ... */ }
const Button = () => { /* ... */ };
export default function LoginForm() { /* ... */ }
export  function LoginForm() { /* ... */ }

// ❌ Bad
function userProfile() { /* ... */ }
const button = () => { /* ... */ };
```

### 2.2 Component File Names (PascalCase)

Component files match the component name with `.tsx` extension.

```
UserProfile.tsx
Button.tsx
LoginForm.tsx
```

### 2.3 Props Interface Names (PascalCase + Props suffix)

Props interfaces use component name + `Props`. Define them in the same file as the component.

```tsx
// ✅ Good
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // ...
}

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button = ({ variant = 'primary', ...props }: ButtonProps) => {
  // ...
};

// ❌ Bad
interface UserProps { /* ... */ }          // Missing 'Profile' context
interface UserProfileInterface { /* ... */ } // Wrong suffix
type UserProfileProps = { /* ... */ };     // Use interface for object types
```

## 3. React Hooks Naming

### 3.1 Custom Hooks (use + camelCase)

Custom hooks **must** start with `use` prefix.

```tsx
// ✅ Good
function useUserData(userId: string) { /* ... */ }
function useFormValidation() { /* ... */ }
function useDebounce<T>(value: T, delay: number) { /* ... */ }

// ❌ Bad
function getUserData(userId: string) { /* ... */ }  // Missing 'use' prefix
function formValidation() { /* ... */ }              // Missing 'use' prefix
```

### 3.2 Hook File Names (kebab-case + .ts/.tsx)

Hook files use kebab-case with `.ts` or `.tsx` extension.

```
// ✅ Good
use-user-data.ts
use-form-validation.ts
use-debounce.tsx

// ❌ Bad
useUserData.ts
use_user_data.ts
```

## 4. State Management (Jotai)

> Prefer jotai atoms over React Context for state management. Atoms can be used for global state, page-level state, or component-specific state.

### 4.1 Atom File Names (kebab-case + .atom.ts)

Atom definition files use kebab-case with `.atom.ts` suffix.

**Atom Scope Guidelines**:
- **Global atoms** (`src/atom/`): Application-wide state (user, theme, auth)
- **Page-level atoms** (`src/view/[page]/atom/`): Page-specific state (form data, filters)
- **Component-level atoms** (in component dir): Component-scoped state (optional)

```
// ✅ Good
src/atom/
├── user.atom.ts           # Global user state
├── theme.atom.ts          # Global theme state
└── auth.atom.ts           # Global auth state

src/view/dashboard/atom/
└── dashboard-filters.atom.ts  # Dashboard-specific filters

// ❌ Bad
userAtom.atom.ts
globalSettings.atom.ts
user_profile.atom.ts
```

### 4.2 Atom Variable Names (camelCase + Atom suffix)

```tsx
// ✅ Good
export const userAtom = atom<User | null>(null);
export const themeAtom = atom<'light' | 'dark'>('light');
export const loadingAtom = atom(false);

// ❌ Bad
export const User = atom<User | null>(null);      // Missing 'Atom' suffix
export const THEME = atom<'light' | 'dark'>('light');  // Wrong case
```

## 5. TypeScript Naming Conventions

### 5.1 PascalCase

Applicable to: `Interfaces`, `Types`, `Enums`, `Classes`, `Type Parameters`

```typescript
// Interfaces & Types
interface User {
  id: string;
  name: string;
}

type Status = 'pending' | 'success' | 'error';

// Enums
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}

// Type Parameters
function identity<T>(value: T): T {
  return value;
}
```

### 5.2 camelCase

Applicable to: `Variables`, `Parameters`, `Functions`, `Methods`, `Properties`

```typescript
const userName = 'John';
function getUserProfile(userId: string) { /* ... */ }
const isLoggedIn = true;
```

### 5.3 CONSTANT_CASE

Applicable to: Global `Constants`, `Enum Values`, `Configuration Values`

```typescript
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;
```

### 5.4 Function Naming

Functions use **camelCase** and start with a verb describing their action.

#### 5.4.1 Common Verb Patterns

| Verb | Use Case | Examples |
|------|----------|----------|
| `get` | Retrieve/query data (no side effects) | `getUserProfile`, `getLatestVersion` |
| `fetch` | Retrieve data from remote | `fetchUserData`, `fetchPosts` |
| `calculate` | Perform calculations | `calculateTotal`, `calculateAge` |
| `format` | Format data for display | `formatDate`, `formatCurrency` |
| `validate` | Check data validity | `validateEmail`, `validateForm` |
| `parse` | Parse strings/data | `parseJson`, `parseUrl` |
| `convert` | Convert data types | `convertToJson`, `convertToArray` |
| `update` | Update state/data | `updateUser`, `updateSettings` |
| `create` | Create new objects | `createAccount`, `createInstance` |
| `handle` | Handle events | `handleSubmit`, `handleClick` |

#### 5.4.2 Function Type Patterns

- **Boolean functions**: `isXxx`, `hasXxx`, `canXxx`, `shouldXxx`
  - Examples: `isValid`, `hasPermission`, `canEdit`, `shouldRender`
- **Event handlers**: `handleXxx`
  - Examples: `handleSubmit`, `handleClick`, `handleChange`
- **Callbacks**: `onXxx`
  - Examples: `onSuccess`, `onError`, `onComplete`
- **Render helpers**: `renderXxx`
  - Examples: `renderUserList`, `renderHeader`

#### 5.4.3 Function Naming Quality

Good function names:
- Start with a clear verb
- Are self-explanatory without reading implementation
- Use specific terms over generic ones
- Avoid overly long names (>50 chars)

```tsx
// ✅ Good
function fetchUserProfile(userId: string) { /* ... */ }
function isUserAuthorized(user: User) { /* ... */ }
function handleFormSubmit(event: FormEvent) { /* ... */ }

// ❌ Bad
function getData() { /* ... */ }           // Too generic
function process() { /* ... */ }           // Unclear action
function userCheck() { /* ... */ }         // Missing verb
function doStuff() { /* ... */ }           // Meaningless
```

## 6. CSS/Style Naming Conventions

### 6.1 Styling Approach: Tailwind CSS First

Use **Tailwind CSS** as the primary styling approach. Use CSS Modules only when necessary for component-scoped styles.

### 6.2 Tailwind CSS Class Organization

When using Tailwind, leverage the `cn` utility from `@/utils/classname.ts` for long or dynamic classnames.

**Organization order** (see file-structure.instructions.md for details):
1. Base styles - Layout, positioning, basic structure
2. Sizing & Spacing - Width, height, padding, margin (use object notation)
3. Variant styles - Color, background, border (use object notation)
4. State styles - Hover, focus, active, disabled (use object notation)
5. Responsive - Media queries and responsive classes

```tsx
// ✅ Good: Use cn utility for dynamic classnames
import { cn } from '@/utils/classname';

function Button({ variant, size, disabled }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        {
          'px-4 py-2': size === 'md',
          'px-6 py-3': size === 'lg',
          'px-2 py-1 text-sm': size === 'sm'
        },
        {
          'bg-blue-500 text-white': variant === 'primary',
          'bg-gray-200 text-gray-900': variant === 'secondary'
        },
        {
          'opacity-50 cursor-not-allowed': disabled
        }
      )}
    >
      Click
    </button>
  );
}
```

### 6.3 CSS Module Files (PascalCase + .module.css)

CSS modules use component name + `.module.css` extension (use only when necessary).

```
UserProfile.module.css
Button.module.css
LoginForm.module.css
```

### 6.4 CSS Class Names (camelCase)

CSS class names in modules use **camelCase** (only when using CSS Modules).

```css
/* ✅ Good - use in CSS Modules only when necessary */
.userProfile {
  display: flex;
}

.primaryButton {
  background-color: blue;
}

.formInputError {
  color: red;
}

/* ❌ Bad */
.user-profile { /* ... */ }
.UserProfile { /* ... */ }
.form_input_error { /* ... */ }
```

**Best Practice**: Prefer Tailwind CSS with `cn` utility over CSS Modules for most styling needs.

## 7. File and Directory Naming

### 7.1 Component Directories (kebab-case)

All directories **must** use kebab-case.

```
// ✅ Good
src/components/user-profile/
src/components/login-form/
src/hooks/use-user-data/

// ❌ Bad
src/components/UserProfile/
src/components/loginForm/
src/hooks/useUserData/
```

### 7.2 Utility and Helper Files (kebab-case)

Non-component files use kebab-case.

```
// ✅ Good
format-date.ts
validate-email.ts
api-client.ts
constants.ts

// ❌ Bad
formatDate.ts
validate_email.ts
ApiClient.ts
```

### 7.3 Type Definition Files (kebab-case + .types.ts)

```
// ✅ Good
user.types.ts
api.types.ts
common.types.ts
user-profile.types.ts

// ❌ Bad
userTypes.ts
user_types.ts
UserProfile.types.ts
```

## 8. Test File Naming

Test files use `.test.ts`, `.test.tsx`, or `.test.js` suffix, matching the tested file name.

```
UserProfile.test.tsx
use-user-data.test.ts
format-date.test.ts
```

**File naming patterns**:
- Component tests: `ComponentName.test.tsx`
- Hook tests: `use-hook-name.test.ts`
- Utility tests: `utility-name.test.ts`
- Service tests: `service-name.test.ts`

## 9. Special Naming Rules

### 9.1 Higher-Order Components (with + PascalCase)

```tsx
function withAuth<P>(Component: React.ComponentType<P>) {
  return (props: P) => { /* ... */ };
}

const withLogging = (Component) => { /* ... */ };
```

### 9.2 Route/Page Components

Page components can add `Page` suffix for clarity.

```
HomePage.tsx
UserProfilePage.tsx
DashboardPage.tsx
```

## 10. Asset File Naming

All asset files use **kebab-case**.

### 10.1 Images and Icons

```
// ✅ Good
user-avatar.png
company-logo.svg
icon-check.svg
background-pattern.jpg
banner-image.webp

// ❌ Bad
userAvatar.png
icon_check.svg
BackgroundPattern.jpg
```

### 10.2 Other Assets

- Fonts: kebab-case (`roboto-regular.woff2`, `open-sans-bold.ttf`)
- Videos: kebab-case (`intro-video.mp4`, `tutorial-clip.webm`)
- Data files: kebab-case (`user-data.json`, `config-settings.yaml`)

## 11. Naming Convention Enforcement

Use linting tools to ensure consistency:

- **ESLint**: Configure naming-convention rules for TypeScript/React
- **StyleLint**: Check CSS/SCSS class naming
- **Prettier**: Enforce consistent formatting
- **Code Reviews**: Verify naming compliance before merging
