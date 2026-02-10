---
applyTo: "**/*.ts,**/*.tsx"
description: 'JSDoc comment standards for TypeScript/React projects - exported functions, components, hooks, and utilities'
---

# JSDoc Standards for React Projects

> This document defines JSDoc comment standards for TypeScript/React projects. Focuses on public APIs, exported functions, custom hooks, and complex utilities.

## 1. Core Principles

- **Document exported APIs that provide real value** - JSDoc for functions/hooks with non-obvious behavior, custom hooks, components with complex props, reusable utilities
- **Skip JSDoc for obvious or trivial exports** - Simple helpers, obvious getters/setters, one-liners, pass-through wrappers
- **Business-specific constants MUST have detailed comments explaining their purpose and context**
- **Avoid unnecessary comments when code is self-explanatory** - Let clear variable names and logic speak for themselves
- Write in English, use complete sentences
- Focus on **why** and **how to use**, not **what** (code already shows that)
- Keep comments concise but meaningful
- Update comments when code changes

## 2. Which Exports Need JSDoc?

### 2.1 ✅ MUST Document

- **Custom hooks** - Always document (contains logic developers need to understand)
- **React components** with complex or non-obvious props
- **Public utility functions** with non-obvious behavior
- **API/service functions** that interact with external systems
- **Business-critical functions** where misuse could cause problems
- **Atoms/state management exports** (Jotai, Redux, etc.)

### 2.2 ❌ Skip JSDoc

- **Simple pass-through exports** - Trivial getters, one-liners
- **Obvious wrapper functions** - No logic, just wraps something
- **Helper exports that mirror their name** - `getUserId(user)` returning `user.id`
- **Type/interface exports** - Type definitions are self-documenting
- **Re-exported dependencies** - Just forwarding from another module

### 2.3 Examples of What to Document vs. Skip

```typescript
// ✅ DOCUMENT - Custom hook with logic
export function usePoetry() {
  // Hook implementation
}

// ❌ SKIP - Obvious one-liner
export const formatDate = (date: Date) => date.toISOString();

// ✅ DOCUMENT - Complex component with non-obvious props
export function UserProfile({ user, onUserUpdate, readonly }: UserProfileProps) {
  // Component implementation
}

// ❌ SKIP - Simple pass-through
export const getUser = (id: string) => database.getUser(id);

// ✅ DOCUMENT - API function with side effects
export async function updateUserAPI(userId: string, data: Partial<User>) {
  // Implementation
}

// ❌ SKIP - Just exporting a type
export type User = {
  id: string;
  name: string;
};

// ✅ DOCUMENT - Jotai atom with business meaning
export const userDataAtom = atom<User | null>(null);

// ❌ SKIP - Trivial config re-export
export { CONFIG } from './config';
```

## 2. Required JSDoc Tags

### 2.1 Minimum Required Tags

For exported functions/components/hooks that need documentation:

- **Description** (first line) - What it does and when to use it
- **`@param`** - For each parameter (TypeScript types handle type info)
- **`@returns`** - What the function returns (if not void)

### 2.2 Optional but Recommended Tags

- **`@example`** - For complex or reusable utilities (HIGHLY recommended)
- **`@throws`** - For functions that may throw errors
- **`@deprecated`** - For deprecated APIs with migration path
- **`@see`** - For related functions or documentation

### 2.3 Tag Guidelines

**`@param` format:**
```typescript
@param paramName - Description of what this parameter does
```
TypeScript already provides type information, so focus on **purpose** and **constraints**.

**`@returns` format:**
```typescript
@returns Description of what is returned and when
```

**`@example` format:**
```typescript
@example
const result = myFunction('input');
console.log(result); // Expected output
```

## 3. Standards by Function Type

### 3.1 React Components

**For exported components:**
- Describe purpose and usage scenario
- Document props (TypeScript interface handles types)
- Note any side effects or data fetching

**Props documentation:**
Use TypeScript interface with JSDoc comments on the interface, not on the component function.

### 3.2 Custom Hooks

**Always document:**
- What the hook does and when to use it
- Parameters (if any)
- Return value structure
- Side effects (API calls, subscriptions, etc.)
- Dependencies (atoms, SWR keys, etc.)

### 3.3 Utility Functions

**Focus on:**
- Purpose and use cases
- Input constraints (valid ranges, formats, etc.)
- Edge cases and error handling
- Examples for complex logic

### 3.4 API/Service Functions

**Document:**
- What API endpoint is called
- Expected response format
- Error scenarios
- Authentication requirements (if any)

## 4. Examples

### 4.1 Utility Function

```typescript
/**
 * Formats a date string into a human-readable format.
 * Handles invalid dates gracefully by returning a fallback string.
 * 
 * @param dateString - ISO 8601 date string to format
 * @param locale - Locale for formatting (default: 'zh-TW')
 * @returns Formatted date string or 'Invalid Date' if parsing fails
 * 
 * @example
 * formatDate('2025-12-10T08:30:00Z');
 * // Returns: "2025年12月10日"
 * 
 * @example
 * formatDate('invalid-date');
 * // Returns: "Invalid Date"
 */
export function formatDate(dateString: string, locale = 'zh-TW'): string {
  // Implementation
}
```

### 4.2 React Component with Props Interface

```typescript
/**
 * UserProfileProps
 * @description Props for UserProfile component
 */
export interface UserProfileProps {
  /** User data to display */
  user: User;
  /** Callback triggered when user data is updated */
  onUserUpdate?: (user: User) => void;
  /** Whether the profile is in read-only mode */
  readonly?: boolean;
}

/**
 * Displays user profile information with optional editing capabilities.
 * Uses Tailwind CSS for styling and cn utility for dynamic classes.
 * 
 * @example
 * <UserProfile
 *   user={currentUser}
 *   onUserUpdate={handleUserUpdate}
 *   readonly={false}
 * />
 */
export function UserProfile({ 
  user, 
  onUserUpdate, 
  readonly = false 
}: UserProfileProps) {
  // Component implementation
}
```

### 4.3 Custom Hook with SWR

```typescript
/**
 * Fetches and manages user data with SWR caching.
 * Automatically syncs data to Jotai atom for cross-component sharing.
 * 
 * @param userId - The ID of the user to fetch
 * @returns Object containing user data, loading state, and error
 * 
 * @example
 * const { user, isLoading, error } = useUser('user-123');
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * return <UserCard user={user} />;
 */
export function useUser(userId: string) {
  // Hook implementation with useSWR and atom sync
}
```

### 4.4 Custom Hook with useSWRMutation

```typescript
/**
 * Provides a mutation function for updating user data.
 * Uses useSWRMutation for optimistic updates and automatic revalidation.
 * 
 * @returns Object containing updateUser mutation function, loading state, and error
 * 
 * @example
 * const { updateUser, isLoading, error } = useUserUpdate();
 * 
 * const handleSave = async () => {
 *   try {
 *     await updateUser('user-123', { name: 'New Name' });
 *   } catch (err) {
 *     console.error('Update failed:', err);
 *   }
 * };
 */
export function useUserUpdate() {
  // Hook implementation with useSWRMutation
}
```

### 4.5 Atom Definition

```typescript
/**
 * Stores the currently selected poetry file name.
 * Used to trigger SWR fetching when the file changes.
 * 
 * @example
 * const [selectedFile, setSelectedFile] = useAtom(selectedPoetryFileAtom);
 * setSelectedFile('libai.tang.json');
 */
export const selectedPoetryFileAtom = atom<string>('libai.tang.json');

/**
 * Stores fetched poetry data for cross-component sharing.
 * Updated by usePoetry hook when SWR fetches new data.
 */
export const poetryDataAtom = atom<Poem[]>([]);
```
## 5. When NOT to Use Comments

### 5.1 Self-Explanatory Code

**Skip comments when code is already clear through:**
- Descriptive variable names
- Clear function names
- Simple, readable logic
- Well-structured code

```typescript
// ❌ Bad - Unnecessary comments stating the obvious
// Get user by ID
const user = users.find(u => u.id === userId);

// Check if user exists
if (user) {
  // Update user name
  user.name = newName;
}

// ✅ Good - Clear code, no comments needed
const user = users.find(u => u.id === userId);
if (user) {
  user.name = newName;
}
```

```typescript
// ❌ Bad - Over-documenting obvious logic
// Loop through all items
items.forEach(item => {
  // Check if item is active
  if (item.isActive) {
    // Add item to active list
    activeItems.push(item);
  }
});

// ✅ Good - Logic is self-evident
const activeItems = items.filter(item => item.isActive);
```

### 5.2 Skip JSDoc for Simple Functions

```typescript
// ❌ Bad - JSDoc adds no value
/**
 * Gets the user name.
 * @param user - The user object
 * @returns The user name
 */
function getUserName(user: User): string {
  return user.name;
}

// ✅ Good - No JSDoc needed, code is clear
function getUserName(user: User): string {
  return user.name;
}
```

### 5.3 Skip for Obvious Cases

Skip JSDoc/comments for:
- **Private helper functions** with clear names
- **Simple getters/setters**
- **Obvious wrapper functions**
- **Test functions** (test name should be descriptive)
- **Simple mathematical operations**
- **Standard CRUD operations** with conventional names

## 6. Business Constants - Always Document

### 6.1 Required Documentation for Business Constants

**All business-specific constants MUST have detailed comments explaining:**
- **What the value represents** in business context
- **Why this specific value** is used
- **Where it comes from** (business rule, API limit, regulatory requirement, etc.)
- **When it should be changed** or under what conditions

```typescript
// ❌ Bad - No context about business meaning
const MAX_ITEMS = 50;
const RETRY_DELAY = 3000;
const STATUS_CODE = 'A';

// ✅ Good - Clear business context
/**
 * Maximum number of items allowed in a single order.
 * This limit is set by the logistics department due to packaging constraints.
 * Contact logistics team before changing this value.
 */
const MAX_ORDER_ITEMS = 50;

/**
 * Delay in milliseconds before retrying a failed payment transaction.
 * Based on payment gateway's rate limiting policy (max 20 requests/minute).
 * See: https://payment-docs.example.com/rate-limits
 */
const PAYMENT_RETRY_DELAY_MS = 3000;

/**
 * Order status code for "Awaiting Payment".
 * Defined in Order Management System v2.0 specification.
 * Related statuses: 'B' (Paid), 'C' (Cancelled), 'D' (Delivered)
 */
const ORDER_STATUS_AWAITING_PAYMENT = 'A';
```

### 6.2 Configuration and Magic Numbers

```typescript
// ❌ Bad - Magic numbers without explanation
if (user.age < 18) {
  return false;
}

if (retryCount > 3) {
  throw new Error('Max retries exceeded');
}

// ✅ Good - Named constants with business context
/**
 * Minimum age required for account registration.
 * Based on legal requirements for data privacy compliance (GDPR Article 8).
 */
const MINIMUM_REGISTRATION_AGE = 18;

/**
 * Maximum number of retry attempts for API calls before giving up.
 * Balances user experience (not waiting too long) with system reliability.
 */
const MAX_API_RETRY_ATTEMPTS = 3;

if (user.age < MINIMUM_REGISTRATION_AGE) {
  return false;
}

if (retryCount > MAX_API_RETRY_ATTEMPTS) {
  throw new Error('Max retries exceeded');
}
```

### 6.3 Business Rules and Thresholds

```typescript
/**
 * Discount percentage applied to orders over the VIP threshold.
 * Set by marketing department for Q4 2025 promotion campaign.
 * Review date: 2025-12-31
 */
const VIP_DISCOUNT_PERCENTAGE = 15;

/**
 * Minimum order amount (in cents) to qualify for free shipping.
 * Based on average shipping cost analysis and profit margin requirements.
 * Last updated: 2025-10-01 by Finance Team
 */
const FREE_SHIPPING_THRESHOLD_CENTS = 199900; // $1,999.00

/**
 * Session timeout duration in minutes for inactive users.
 * Complies with security policy requirement for financial transactions.
 * Reference: Security Policy Doc v3.2, Section 4.1.2
 */
const SESSION_TIMEOUT_MINUTES = 15;
```

## 7. Best Practices

### 7.1 Do's

✅ Document **why**, not **what**
✅ **Selectively document exports** - Only those with real complexity or non-obvious behavior
✅ **Always document business constants** with full context
✅ Include practical examples for complex functions and hooks
✅ Update comments when code changes
✅ Use TypeScript types instead of JSDoc type annotations
✅ Focus on exported APIs that need explanation
✅ Describe edge cases and error scenarios
✅ Let clear code speak for itself - avoid redundant comments
✅ **Ask: Would a developer be confused without this comment?** If no, skip it

### 7.2 Don'ts

❌ Don't document trivial one-liners or obvious pass-throughs
❌ Don't restate the obvious
❌ Don't add comments when variable names and logic are self-explanatory
❌ Don't use magic numbers without explanation
❌ Don't duplicate TypeScript type information in comments
❌ Don't write novels - keep it concise
❌ Don't leave outdated comments
❌ Don't document every single export just to "have documentation"
❌ Don't leave business constants undocumented

## 8. Special Cases

### 8.1 Deprecated Functions
```typescript
/**
 * @deprecated Use useUserUpdate() with useSWRMutation instead.
 * This function will be removed in v2.0.
 * 
 * @see useUserUpdate
 */
export function updateUserOld(userId: string, data: Partial<User>) {
  // Implementation
}
```

### 8.2 Complex Algorithms

```typescript
/**
 * Implements the Levenshtein distance algorithm for string similarity.
 * Time complexity: O(m * n), Space complexity: O(min(m, n))
 * 
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Edit distance between the two strings
 * 
 * @example
 * levenshteinDistance('kitten', 'sitting');
 * // Returns: 3
 */
export function levenshteinDistance(str1: string, str2: string): number {
  // Implementation
}
```


