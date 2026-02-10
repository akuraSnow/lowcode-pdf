---
applyTo: "**/*.ts,**/*.tsx"
---

> This guide extends the Rules below:
>
> 1. [Project File Structure & Organization](./file-structure.instructions.md)
> 2. [Naming Conventions](./naming-conventions.instructions.md)

# React Development Guidelines

> Scope: React 18+ projects. For Next.js guidance, see ../next/next.instructions.md.

Quick Checklist (TL;DR)
- Keep components < 300 lines; extract hooks for complex logic; co-locate tests/styles/hooks/atoms with the component.
- Prefer jotai for global state; place atoms in `atom/` folders (global or feature-level) and type state shapes.
- Props minimal & explicit; default values in parameters; use `forwardRef` only when DOM ref needed.
- Optimize renders intentionally: `React.memo` + `useCallback` only when measuring churn; use dynamic imports for heavy parts.
- Accessibility first: semantic HTML, focus/ARIA on forms, keyboard navigation, and color contrast.
- Internationalization: avoid hardcoded UI text; structured translation keys; handle plural/formatting; follow [i18n Rules](./i18n.instructions.md).
- Security: sanitize user input, validate uploads, and avoid storing secrets in client code.
- Testing: RTL for components, `renderHook` for hooks; test behaviors, not implementation details.

> This document outlines the best practices, patterns, and conventions for React development in our project.
> All new React components and logic should adhere to these standards, and existing code should be gradually aligned during refactoring.

## 1. Component Architecture

### 1.1 Component Classification

- **Presentational Components**: Focus solely on UI rendering with minimal state
- **Container Components**: Handle data fetching, state management, and business logic
- **Layout Components**: Manage the arrangement and positioning of other components
- **HOCs/Providers**: Implement cross-cutting concerns like authentication or theming

### 1.2 Component Organization

- Group related components in dedicated directories
- Keep component files small and focused (< 300 lines)
- Extract complex logic into custom hooks
- Co-locate component tests and related files

**For complete file organization guidelines, see [Project File Structure & Organization](./file-structure.instructions.md).**

Core principles:
- Component file: `ComponentName.tsx` (PascalCase)
- Test file: `ComponentName.test.tsx`
- Hooks: in `hooks/` subdirectory, one hook per file with `use` prefix (see [Naming Conventions](./naming-conventions.instructions.md))
- Atoms: in `atom/` subdirectory for component-specific state
- Styles: Use Tailwind CSS (see [7. Styling Approaches](#7-styling-approaches))

## 2. State Management

### 2.1 Local State Guidelines

- Use `useState` **only** for simple, transient state with no inter-component sharing (e.g., form field input, UI toggles, temporary hover states)
- For any state that might be shared across components or has complex logic, **use jotai atoms** (even for component-level atoms in `atom/` subdirectories)
- Initialize state with sensible defaults to avoid undefined errors

### 2.2 Application State

- **Prefer jotai for state management (both local and global) over useContext and useReducer**
- Define atoms in dedicated `atom` folders: either in the global `src/atom/` directory or in component-level `atom/` folders
- Use jotai's atomic approach for better performance and maintainability
- Document state shape with TypeScript interfaces
- Implement optimistic UI updates where appropriate

### 2.3 Jotai Best Practices

Use one of the four patterns below (base, derived read-only, derived writable, async/persistent) instead of inventing new shapes; reuse these templates to avoid duplicate state logic.

#### 2.3.1 Atom Organization

```tsx
// Global atoms - src/atom/
src/atom/
  ├── user.atom.ts          // User-related state
  ├── theme.atom.ts         // Theme-related state
  └── global.atom.ts        // Global common state

// Component-level atoms - in respective component directories
src/view/dashboard/atom/
  └── poetry.atom.ts        // Component-specific state
```

#### 2.3.2 Atom Definition Patterns

```tsx
// Basic atom definition
import { atom } from 'jotai';

export interface PoetryState {
  tabKey: string;
  rates: Record<string, number>;
  loading: boolean;
  error: string | null;
}

const defaultPoetryState: PoetryState = {
  tabKey: 'libai.tang.json',
  rates: {},
  loading: false,
  error: null,
};

// Base atom
export const poetryAtom = atom<PoetryState>(defaultPoetryState);

// Derived atom - read-only
export const currentTabDataAtom = atom((get) => {
  const { tabKey } = get(poetryAtom);
  return tabKey;
});

// Derived atom - writable
export const poetryTabAtom = atom(
  (get) => get(poetryAtom).tabKey,
  (get, set, newTabKey: string) => {
    set(poetryAtom, { ...get(poetryAtom), tabKey: newTabKey });
  }
);
```

#### 2.3.3 Async Operations with Atoms

```tsx
// Async atom for data fetching
export const poetryDataAtom = atom(async (get) => {
  const { tabKey } = get(poetryAtom);
  const data = await fetchJson(tabKey);
  return data;
});

// Writable async atom for API calls
export const updatePoetryRateAtom = atom(
  null,
  async (get, set, { poetId, rate }: { poetId: string; rate: number }) => {
    const currentState = get(poetryAtom);

    try {
      set(poetryAtom, {
        ...currentState,
        rates: { ...currentState.rates, [poetId]: rate },
        loading: true,
      });

      // API call
      await updateRateAPI(poetId, rate);

      set(poetryAtom, (prev) => ({ ...prev, loading: false }));
    } catch (error) {
      set(poetryAtom, (prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }
);
```

#### 2.3.4 Using Atoms in Components

```tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { poetryAtom, poetryTabAtom } from '../atom/poetry.atom';

export default function PoetryComponent() {
  // Read-only access
  const poetryState = useAtomValue(poetryAtom);

  // Write-only access
  const setTabKey = useSetAtom(poetryTabAtom);

  // Read and write access
  const [currentTab, setCurrentTab] = useAtom(poetryTabAtom);

  const handleTabChange = (newTab: string) => {
    setCurrentTab(newTab);
  };

  return (
    <div>
      <p>Current Tab: {currentTab}</p>
      {/* Component logic */}
    </div>
  );
}
```

#### 2.3.5 Persistent State with atomWithStorage

```tsx
import { atomWithStorage } from 'jotai/utils';

// Persist theme preference
export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');

// Persist user preferences
export const userPreferencesAtom = atomWithStorage('userPreferences', {
  language: 'zh-TW',
  autoSave: true,
});
```

#### 2.3.6 SWR + Atom Best Practices

**Core Pattern: Always wrap SWR in custom hooks; use SWR's built-in state, sync data to atoms only when needed**

The recommended approach is to:
1. Always use SWR inside custom hooks (never expose `useSWR` directly in components)
2. Use SWR's built-in state (`isLoading`, `error`, `data`) - no need to duplicate in atoms
3. Sync **only the data** to atoms when multiple components need to share it
4. Keep the public fetcher function unchanged

**Step 1: Define atoms for shared data (data only, not loading/error)**

```tsx
// atom/poetry.atom.ts
import { atom } from 'jotai';

export interface Poem {
  no: string;
  title: string;
  author: string;
  content: string;
}

// Only store the actual data, not loading/error states
export const poetryDataAtom = atom<Poem[]>([]);

// Store selected file name to trigger SWR
export const selectedPoetryFileAtom = atom<string>('libai.tang.json');
```

**Step 2: Encapsulate SWR in custom hooks with data sync**

```tsx
// hooks/usePoetry.ts
import useSWR from 'swr';
import { useAtom } from 'jotai';
import { poetryDataAtom, selectedPoetryFileAtom } from '@/atom/poetry.atom';

async function fetchJson(jsonName: string) {
  if (jsonName === 'libai.tang.json')
    return (await import('@/assets/mock/libai.tang.json')).default
  // ... other files
}

export function usePoetry() {
  const [, setPoetryData] = useAtom(poetryDataAtom);
  const [selectedFile] = useAtom(selectedPoetryFileAtom);

  // SWR handles loading, error, and data states - no need to duplicate
  const { data: poems = [], isLoading, error } = useSWR(
    selectedFile,
    fetchJson,
    { revalidateOnFocus: false }
  );

  // Sync data to atom only (loading/error come from SWR)
  useEffect(() => {
    if (poems.length > 0) {
      setPoetryData(poems);
    }
  }, [poems, setPoetryData]);

  return {
    poems,
    isLoading,  // From SWR
    error,      // From SWR
  };
}
```

**Step 3: Use in components (simple, no manual state management)**

```tsx
// components/PoetryCardPager.tsx
import { usePoetry } from '@/hooks/usePoetry';

export function PoetryCardPager() {
  const { poems, isLoading, error } = usePoetry();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {poems.map(poem => (
        <PoetryCard key={poem.no} {...poem} />
      ))}
    </div>
  );
}
```

**Pattern: Share fetched data across components**

When multiple components need the same poetry data:

```tsx
// components/PoetryList.tsx
import { usePoetry } from '@/hooks/usePoetry';

export function PoetryList() {
  const { poems, isLoading, error } = usePoetry();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return poems.map(poem => <PoetryItem key={poem.no} poem={poem} />);
}

// components/PoetrySearch.tsx
import { usePoetry } from '@/hooks/usePoetry';

export function PoetrySearch() {
  const { poems } = usePoetry();
  // Same hook, same SWR cache - poems are automatically shared
  
  return <div>{/* search with poems data */}</div>;
}
```

**Pattern: Mutations with SWR revalidation**

```tsx
// atom/user.atom.ts
import { atom } from 'jotai';

export interface User {
  id: string;
  name: string;
  email: string;
}

// Store only the data, not loading/error
export const userDataAtom = atom<User | null>(null);

// Mutation atom - handles optimistic updates and rollback
export const updateUserAtom = atom(
  null,
  async (get, set, updates: Partial<User>) => {
    const currentUser = get(userDataAtom);
    if (!currentUser) return;

    const previousUser = currentUser;

    try {
      // Optimistic update
      set(userDataAtom, { ...currentUser, ...updates });

      // API call via fetcher (generic, unchanged)
      const updatedUser = await fetcher<User>(
        `/api/users/${currentUser.id}`,
        {
          method: 'PATCH',
          body: updates,
        }
      );

      // Sync response to atom
      set(userDataAtom, updatedUser);

      // Revalidate SWR cache if needed
      mutate('/api/users');
    } catch (error) {
      // Rollback on error
      set(userDataAtom, previousUser);
      throw error;
    }
  }
);
```

**Usage in hooks - SWR handles loading/error, atom syncs data**

```tsx
// hooks/useUser.ts
import useSWR, { mutate } from 'swr';
import { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { userDataAtom, updateUserAtom } from '@/atom/user.atom';
import fetcher from '@/utils/fetcher';

export function useUser(userId: string) {
  const [, setUserData] = useAtom(userDataAtom);
  const updateUser = useSetAtom(updateUserAtom);

  // SWR handles loading and error states
  const { data: user, isLoading, error } = useSWR(
    `/api/users/${userId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Sync data to atom only
  useEffect(() => {
    if (user) {
      setUserData(user);
    }
  }, [user, setUserData]);

  return { 
    user, 
    isLoading,  // From SWR
    error,      // From SWR
    updateUser 
  };
}

// components/UserProfile.tsx
import { useUser } from '@/hooks/useUser';

export function UserProfile({ userId }: Props) {
  const { user, isLoading, error, updateUser } = useUser(userId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => updateUser({ name: 'New Name' })}>
        Update Name
      </button>
    </div>
  );
}
```

**Key Principles**:
- ✅ **Never expose `useSWR` directly to components** - always wrap in custom hooks
- ✅ **Use SWR's built-in states** (`isLoading`, `error`, `data`) - don't duplicate them in atoms
- ✅ **Sync only data to atoms** when multiple components need to share it
- ✅ **Keep fetcher unchanged** - no special parameters, just handles HTTP requests
- ✅ **Use `mutate()` to revalidate** SWR cache after mutations
- ✅ **Implement mutations in atoms** with optimistic updates + rollback
- ✅ **Keep atoms minimal** - one logical data unit per atom

## 3. Props Handling

### 3.1 Props Design

- Keep props interfaces focused and minimal
- Use TypeScript to define prop types explicitly
- Provide sensible default props when applicable
- Destructure props in component parameters

**For Props interface naming conventions, see [Naming Conventions](./naming-conventions.instructions.md).**

```tsx
// Good example
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
}

function Button({
  label,
  variant = 'primary',
  onClick,
  disabled = false,
}: ButtonProps) {
  // Component implementation
}
```

### 3.2 Props Forwarding

- Use `React.forwardRef` when components need to expose DOM refs
- Implement `React.ComponentPropsWithoutRef<>` for component props that extend HTML elements

## 4. Hooks Usage

### 4.1 Built-in Hooks

- Follow the Rules of Hooks strictly
- Use `useCallback` and `useMemo` only when performance issues are identified
- Implement `useEffect` with proper dependency arrays
- Avoid nested hook calls

### 4.2 Custom Hooks

- Create custom hooks for reusable logic
- Name custom hooks with `use` prefix
- Keep custom hooks simple and focused on a single concern
- Document hook parameters and return values

```tsx
// Custom hook example
function useFormField<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    setError(null);
  }, []);

  return { value, setValue, error, setError, handleChange };
}
```

## 5. Performance Optimization

### 5.1 Rendering Optimization

- Use `React.memo` for components that render often with the same props
- Implement `useCallback` for event handlers passed to memoized child components
- Avoid anonymous function props when they cause unnecessary re-renders
- Split large render trees into smaller chunks
- For Next.js builds, pair these with the code-splitting guidance in 10.4.3 to prevent redundant bundling advice.

### 5.2 Data Handling

- Implement virtualization for long lists
- Use pagination or infinite scrolling for large datasets
- Consider client-side caching for frequently accessed data
- Avoid prop drilling with Context API or component composition

## 6. Testing Strategies

### 6.1 Component Tests

- Test component behavior, not implementation details
- Focus on user interactions and outcomes
- Use React Testing Library with user-centric queries
- Implement snapshot tests sparingly and review them critically

**For detailed testing practices, see [Testing Best Practices](./coding-practices/testing.instructions.md).**

### 6.2 Hook Tests

- Test custom hooks with `renderHook` from React Testing Library
- Verify state changes and side effects
- Mock external dependencies consistently

## 7. Styling Approaches

### 7.1 Tailwind CSS - Primary Approach

- Use **Tailwind CSS** as the primary styling solution for all components
- Leverage the `cn` utility from `@/utils/classname.ts` for long or dynamic classnames
- Organize utilities in order: base styles → sizing/spacing → variants → states → responsive

**For comprehensive Tailwind CSS guidance and examples, see [File Structure - Styling with Tailwind CSS](./file-structure.instructions.md).**

### 7.2 Responsive Design

- Design for mobile-first
- Use relative units (rem, em) instead of fixed pixels
- Implement responsive breakpoints consistently
- Test across device sizes

## 8. Accessibility Standards

### 8.1 Core Requirements

- Use semantic HTML elements appropriately
- Implement ARIA attributes when necessary
- Ensure keyboard navigation works properly
- Maintain sufficient color contrast

### 8.2 Testing Accessibility

- Use automated tools (axe, lighthouse) for basic checks
- Perform manual keyboard navigation testing
- Verify screen reader compatibility
- Document accessibility features and limitations

## 9. Error Handling

### 9.1 Component Error Boundaries

- Implement error boundaries to catch and handle rendering errors
- Display user-friendly fallback UIs
- Log errors to monitoring services

### 9.2 Async Error Handling

- Use try/catch with async/await
- Implement consistent error states in UI
- Provide clear error messages to users
- Add retry mechanisms where appropriate

## 10. Example Implementation

Reference only; in real code keep component, hook, and form pieces in their own small files and co-locate tests/styles/atoms as shown in 1.2.

### 11.1 Complete Component Example

```tsx
// src/components/features/UserProfile/UserProfile.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/utils/classname';
import { User } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUserUpdate } from '@/hooks/useUserUpdate';

interface UserProfileProps {
  user: User;
  onUserUpdate?: (updatedUser: User) => void;
  readonly?: boolean;
}

/**
 * User profile component for displaying and editing user information
 *
 * @param user - User data to display
 * @param onUserUpdate - Callback when user data is updated
 * @param readonly - Whether the profile is in read-only mode
 */
export function UserProfile({
  user,
  onUserUpdate,
  readonly = false,
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateUser, isLoading, error } = useUserUpdate();

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(
    async (formData: Partial<User>) => {
      try {
        const updatedUser = await updateUser(user.id, formData);
        onUserUpdate?.(updatedUser);
        setIsEditing(false);
      } catch (err) {
        // Error handling is managed by the custom hook
        console.error('Failed to update user:', err);
      }
    },
    [user.id, updateUser, onUserUpdate]
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  if (isEditing) {
    return (
      <UserProfileEditForm
        user={user}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  return (
    <div className={cn('flex gap-6 p-6 rounded-lg border')}>
      <div className={cn('flex-shrink-0')}>
        <img
          src={user.avatarUrl}
          alt={`${user.name}'s avatar`}
          className={cn('w-20 h-20 rounded-full object-cover')}
        />
      </div>

      <div className={cn('flex-1')}>
        <h2 className={cn('text-xl font-semibold')}>{user.name}</h2>
        <p className={cn('text-gray-600')}>{user.email}</p>
        <p className={cn('text-sm text-gray-500')}>{user.role}</p>
      </div>

      {!readonly && (
        <div className={cn('flex-shrink-0')}>
          <Button
            onClick={handleEdit}
            variant="primary"
          >
            Edit Profile
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 11.2 Custom Hook Example - Using useSWRMutation for mutations

```tsx
// src/hooks/useUserUpdate.ts
import useSWRMutation from 'swr/mutation';
import { User } from '@/types/user';
import fetcher from '@/utils/fetcher';

export function useUserUpdate() {
  const { trigger, isMutating, error } = useSWRMutation(
    '/api/users',
    async (url: string, { arg }: { arg: { userId: string; data: Partial<User> } }) => {
      return fetcher<User>(
        `${url}/${arg.userId}`,
        {
          method: 'PATCH',
          body: arg.data,
        }
      );
    }
  );

  const updateUser = async (userId: string, data: Partial<User>): Promise<User> => {
    return trigger({ userId, data });
  };

  return {
    updateUser,
    isLoading: isMutating,
    error: error?.message || null,
  };
}
```

**Or with atom sync for shared state:**

```tsx
// src/hooks/useUserUpdate.ts
import useSWRMutation from 'swr/mutation';
import { useSetAtom } from 'jotai';
import { User } from '@/types/user';
import { userDataAtom } from '@/atom/user.atom';
import fetcher from '@/utils/fetcher';

export function useUserUpdate() {
  const setUserData = useSetAtom(userDataAtom);

  const { trigger, isMutating, error } = useSWRMutation(
    '/api/users',
    async (url: string, { arg }: { arg: { userId: string; data: Partial<User> } }) => {
      const updatedUser = await fetcher<User>(
        `${url}/${arg.userId}`,
        {
          method: 'PATCH',
          body: arg.data,
        }
      );

      // Sync updated user to atom
      setUserData(updatedUser);
      return updatedUser;
    }
  );

  const updateUser = async (userId: string, data: Partial<User>): Promise<User> => {
    return trigger({ userId, data });
  };

  return {
    updateUser,
    isLoading: isMutating,
    error: error?.message || null,
  };
}
```
