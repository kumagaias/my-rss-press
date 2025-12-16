# TypeScript Best Practices

General TypeScript conventions and best practices.

---

## Naming Conventions

- **Variables/Functions**: camelCase (`userName`, `fetchData`)
- **Classes/Components**: PascalCase (`UserProfile`, `Button`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_BASE_URL`)
- **Booleans**: Prefix with `is`, `has`, `should` (`isLoading`, `hasError`)
- **Event Handlers**: Prefix with `handle` (`handleClick`, `handleSubmit`)

## Type System

### Best Practices
- Prefer `interface` over `type` for public APIs
- Specify explicit return types for exported functions
- Avoid `any` type (use `unknown` if needed)
- Minimize type assertions (`as`)
- Use union and intersection types appropriately
- Leverage generics for reusable types
- Distinguish between `null` and `undefined`
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### Examples

```typescript
// ✅ Good: Explicit return type
export function fetchUser(id: string): Promise<User> {
  return api.get(`/users/${id}`);
}

// ✅ Good: Interface for public API
export interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Generic type
export function createArray<T>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

// ❌ Bad: Using any
function processData(data: any) {
  return data.value;
}

// ✅ Good: Using unknown with type guard
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}
```

## Coding Style

- Use semicolons
- Single quotes (`'`) except in JSX (double quotes)
- 2 spaces indentation
- Max 100 characters per line
- Prefer arrow functions
- Use destructuring
- Use template literals

```typescript
// ✅ Good
const greeting = `Hello, ${name}!`;
const { id, name } = user;
const fetchData = async () => { /* ... */ };

// ❌ Bad
const greeting = 'Hello, ' + name + '!';
const id = user.id;
const name = user.name;
function fetchData() { /* ... */ }
```

## Import/Export

- Prefer named exports (minimize default exports)
- Group imports in order:
  1. External libraries
  2. Internal modules (`@/`)
  3. Relative paths (`./`, `../`)
  4. Type-only imports (`import type`)
- Remove unused imports

```typescript
// ✅ Good
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { formatDate } from './utils';
import type { User } from '@/types';

// ❌ Bad
import type { User } from '@/types';
import { formatDate } from './utils';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
```

## Error Handling

```typescript
// ✅ Good: Specific error with context
throw new Error(`Failed to fetch user ${userId}: ${response.statusText}`);

// ✅ Good: Custom error class
class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// ✅ Good: Try-catch with proper handling
try {
  const data = await fetchData();
  return data;
} catch (error) {
  if (error instanceof NotFoundError) {
    return null;
  }
  throw error;
}
```

## File Organization

- One component/class per file
- Keep files under 300 lines
- Use index.ts for exports
- Match file names with exports

```typescript
// components/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';

// components/Button/Button.tsx
export interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```
