---
applyTo: '**/*.ts, **/*.tsx, **/*.html, **/*.css, **/*.scss'
description: 'React-specific code review standards and checkpoints for ensuring code quality, consistency, and best practices'
---

# React Code Review Standards

> Code review is a collaborative process to ensure code quality, maintainability, and consistency in React projects. Focus on actual issues, not style preferences or tool false positives.
> 
> **⚠️ IMPORTANT**: This document is referenced by `.github/copilot-instructions.md` and MUST be read before performing any GitHub PR code review.

## 1. React-Specific Review Checklist

### 1.1 Functionality & Logic

- ✅ Does the code meet the requirements?
- ✅ Are edge cases and error scenarios handled?
- ✅ Are error messages clear and helpful?
- ✅ No obvious bugs or logic errors?
- ✅ Reasonable handling of async operations (SWR, atoms, etc.)?

### 1.2 Code Quality & Maintainability

 ✅ **Naming**: Check against [Naming Conventions](./naming-conventions.instructions.md) - Report only actual violations
 ✅ **Structure**: See [File Structure](./file-structure.instructions.md) for all component/hook/file organization rules.
 ✅ **Complexity**: Component/hook file ≤ 300 lines (see [File Structure](./file-structure.instructions.md))

### 1.3 React/Hooks Best Practices

- ✅ **State management**: Using `useState` only for simple state? Complex state uses Jotai atoms?
- ✅ **Data fetching**: SWR wrapped in custom hooks, not exposed in components?
- ✅ **Mutations**: Using `useSWRMutation` for API mutations?
- ✅ **Props**: Minimal and explicit? Using TypeScript interfaces?
- ✅ **Rendering**: Using React.memo only when necessary?
- ✅ **Hooks**: Dependencies array correct? No infinite loops?

### 1.4 Styling with Tailwind CSS

- ✅ **Tailwind CSS**: Primary approach used? Utilities properly organized?
- ✅ **Dynamic classes**: Using `cn()` utility for complex classnames?
- ✅ **No inline styles**: All styles in classnames or CSS modules?
- ✅ **CSS organization**: Base → Sizing/Spacing → Variants → States → Responsive?


### 1.6 Performance & Security

- ✅ No performance regressions?
- ✅ No unnecessary re-renders or effect runs?
- ✅ User input validated and sanitized?
- ✅ No secrets or sensitive data in code?
- ✅ Proper error boundaries for error handling?

## 2. What to Report vs. What to Skip

### 2.1 ✅ REPORT

**Always report**:
- Missing JSDoc for exported custom hooks and complex functions
- Business constants without context comments
- Magic numbers/strings used without explanation
- Edge cases not handled
- **API addresses hardcoded in hooks or components (MUST come from `src/services/api.*.ts`)**
- **SWR called directly in components (MUST be wrapped in custom hooks)**
- State management misuse (complex state in useState instead of atoms)
- Missing error handling
- Security issues (unvalidated input, exposed secrets, etc.)
- Performance issues (unnecessary re-renders, missing dependencies)
- Actual naming violations per conventions

### 2.2 ❌ SKIP

**Don't report**:
- Trivial one-liner exports without JSDoc (obvious from name)
- Self-explanatory code with clear variable names
- Single-word CSS class names like `.info`, `.header`
- Tool false positives (e.g., tool flagging correct kebab-case as wrong)
- Naming already in correct format per conventions
- Comments that would just restate obvious code
- Formatting differences (use prettier, not code review)
- Stylistic preferences (if code is readable)

### 2.3 Example: What to Comment

```typescript
// ❌ DON'T flag this - no JSDoc needed for obvious export
export const formatDate = (date: Date) => date.toISOString();

// ✅ DO flag this - business constant needs context
const RETRY_DELAY = 3000; // No context! Should have comment explaining why

// ✅ DO flag this - SWR should be wrapped in hook
const { data } = useSWR('/api/users', fetcher); // In component - not wrapped!

// ✅ DO flag this - API address hardcoded (should come from services)
const { data } = useSWR(`/api/users/${userId}`, fetcher); // In hook but not from services!

// ✅ DO flag this - hardcoded API address in API call
const users = await fetch('/api/users/list').then(r => r.json()); // Hardcoded!

// ❌ DON'T flag this - comment is redundant
// Increment counter
count++;

// ✅ DO flag this - complex state in useState
const [userState, setUserState] = useState({ name: '', email: '', role: '' });
// Should use Jotai atom instead
```

## 3. State Management Review

### 3.1 useState Usage

**✅ Good Use Cases**:
- Simple, transient UI state (input field focus, dropdown open/closed)
- State that doesn't need to be shared across components
- State with no complex update logic

**❌ Red Flags**:
- Complex state objects that would fit Jotai atoms
- State that needs to be accessed by multiple components
- State with interdependent fields

Example review comment:

```markdown
**Required**: This state should use a Jotai atom instead of useState.

Current:
```typescript
const [filters, setFilters] = useState({ status: '', date: '', priority: '' });
```

Reason: Multiple components need access to these filters, and they're related fields.

Suggested: Move to `atom/dashboard-filters.atom.ts` and use `useAtom()` in components.
```

### 3.2 Jotai Atoms

**✅ Check**:
- Atoms properly placed in global `src/atom/` or feature `src/view/[feature]/atom/` folders
- Atoms are typed with interfaces (not bare types)
- Complex state broken into logical atoms
- Derived atoms used appropriately (read-only with selectors)
- Async atoms use proper loading/error states

**❌ Anti-patterns**:
- Monolithic atom with too many fields
- Missing TypeScript interfaces for atom shape
- Atom logic scattered across multiple components
- No clear ownership of atom updates

## 4. SWR & Data Fetching Review

### 4.1 Hook Wrapping Pattern & API Address Sourcing

**✅ Good - API address from services**:
```typescript
// src/services/api.user.ts
export const userApi = {
  getProfile: '/api/users/{userId}',
  updateProfile: '/api/users/profile',
};

// src/hooks/useUserProfile.ts - SWR wrapped in hook
import { userApi } from '@/services/api.user';
import { buildQueryString } from '@/utils/build-query-string';

export function useUserProfile(userId: string) {
  const url = buildQueryString(userApi.getProfile, { userId });
  const { data: user, isLoading, error } = useSWR(
    url,
    fetcher
  );
  return { user, isLoading, error };
}

// Component - use hook, not SWR directly
const { user, isLoading, error } = useUserProfile(userId);
```

**❌ Bad - API address hardcoded**:
```typescript
// Component directly using SWR with hardcoded API address
const { data: user } = useSWR('/api/users/' + userId, fetcher);
```

**❌ Bad - API address in hook but not from services**:
```typescript
// Hook but hardcoding API address (should come from services)
export function useUserProfile(userId: string) {
  const { data: user } = useSWR(`/api/users/${userId}`, fetcher);
  return { user };
}
```

### 4.2 Data Fetching Checklist

- ✅ **API addresses MUST be sourced from `src/services/api.*.ts`** (never hardcoded in components or hooks)
- ✅ SWR always wrapped in custom hooks (never exposed in components)
- ✅ Hook returns: `{ data, isLoading, error }`
- ✅ API endpoints defined as string templates in `src/services/api.*.ts`
- ✅ Query parameters built with `build-query-string` utility
- ✅ Error handling implemented in hooks, not components
- ✅ Mutations use `useSWRMutation` with proper error handling

### 4.3 Mutations with Optimistic Updates

**✅ Good Pattern - API address from services**:
```typescript
// src/services/api.user.ts
export const userApi = {
  updateProfile: '/api/users/{userId}',
};

// src/hooks/useUserUpdate.ts - In custom hook with atom sync
import { userApi } from '@/services/api.user';
import { buildQueryString } from '@/utils/build-query-string';

export function useUserUpdate() {
  const apiURL = buildQueryString(userApi.updateProfile, { userId });
  
  const { trigger, isMutating, error } = useSWRMutation(
    apiURL,
    async (url, { arg }: { arg: Partial<User> }) => {
      const updated = await fetcher<User>(apiURL, {
        method: 'PATCH',
        body: arg,
      });
      setUserData(updated); // Sync to atom if needed
      return updated;
    }
  );

  return { trigger, isMutating, error };
};
```

## 5. Component Structure Review

### 5.1 Component Decomposition

**✅ Check**:
- Component files ≤ 300 lines
- Complex logic extracted to custom hooks
- Presentational logic separated from business logic
- Props interfaces defined
- Components have clear single responsibility

**❌ Anti-patterns**:
- Massive components (>500 lines)
- Business logic scattered in useEffect
- Props drilling (pass required data via atoms or composition)
- Multiple responsibilities (rendering + fetching + state management)

### 5.2 Props Interface

**✅ Good**:
```typescript
interface UserCardProps {
  user: User;
  onUpdate?: (user: User) => void;
  variant?: 'compact' | 'full';
}

function UserCard({ user, onUpdate, variant = 'compact' }: UserCardProps) {
  // ...
}
```

**❌ Problems to Flag**:
- Props not using TypeScript interface
- Unused props passed down
- Props without defaults documented
- Non-optional props that should be optional

## 6. Styling Review

### 6.1 Tailwind CSS

**✅ Check**:
- Primary styling done with Tailwind utilities
- Complex/dynamic classnames use `cn()` utility
- Responsive design uses Tailwind breakpoints
- No hardcoded colors outside design system
- CSS organization follows: base → sizing/spacing → variants → states → responsive

**❌ Anti-patterns**:
- Inline styles in JSX
- Custom CSS without strong justification
- Inconsistent color values
- Not using `cn()` for conditional classes
- Magic spacing numbers instead of Tailwind scale

### 6.2 Example Review

```markdown
**Suggested**: Use `cn()` utility for these dynamic classes.

Current:
```tsx
className={`px-4 py-2 ${size === 'lg' ? 'px-6 py-3' : ''} ${disabled ? 'opacity-50' : ''}`}
```

Better:
```tsx
className={cn(
  'px-4 py-2',
  { 'px-6 py-3': size === 'lg' },
  { 'opacity-50': disabled }
)}
```
```

## 7. Code Review Process

### 7.1 Communication

- **Be constructive**: Focus on the code, not the person
- **Be specific**: Explain *what* is wrong and *why*
- **Suggest solutions**: Provide examples when possible
- **Acknowledge good practices**: Praise what's done well
- **Distinguish levels**: Mark as "Required" vs. "Optional/Nice-to-have"

### 7.2 Required Change Indicators

Use consistent language:
- "**Required**: " - Must fix before merge
- "**Suggested**: " - Nice improvement, not blocking
- "**Question**: " - Clarification needed

### 7.3 Example Review Comment

```markdown
**Required**: This component should use a custom hook for SWR.

Current code:
```typescript
const { data } = useSWR('/api/users', fetcher);
```

Suggested fix - create `hooks/useUsers.ts`:
```typescript
export function useUsers() {
  return useSWR('/api/users', fetcher);
}
```

This keeps data fetching logic separate from components.
Reference: [SWR + Atom Best Practices](./react.instructions.md)
```

## 8. Common Issues Checklist

- [ ] API addresses hardcoded in hooks or components (must come from services)
- [ ] SWR called directly in component instead of wrapped in hook
- [ ] Complex state in useState instead of Jotai atoms
- [ ] Missing error boundaries or error handling
- [ ] Magic numbers without explanation
- [ ] Business constants undocumented
- [ ] Props not using TypeScript interfaces
- [ ] Unnecessary comments on obvious code
- [ ] Missing or insufficient tests
- [ ] Performance concerns (unnecessary effects, missing dependencies)
- [ ] Security issues (unvalidated input, secrets exposed)
- [ ] Tailwind CSS not used consistently
- [ ] Hard-coded inline styles
- [ ] Props drilling instead of using atoms
- [ ] Component files > 300 lines
- [ ] Missing `cn()` for complex classnames

## 9. References

- [React Best Practices](./react.instructions.md)
- [Naming Conventions](./naming-conventions.instructions.md)
- [File Structure](./file-structure.instructions.md)
- [JSDoc Standards](./jsdoc-standards.instructions.md)
- [General Code Review Standards](../workflow/code-review.instructions.md)
