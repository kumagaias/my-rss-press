# Code Review Response Guide

## Overview

This document summarizes commonly pointed out items from GitHub Copilot Pull Request Reviewer and others, along with response policies.

---

## Points to Address

### 1. Improve Error Messages

**Example Comment:**
```
Generic error messages make debugging difficult.
```

**Response:**
- Include HTTP status code
- Describe specific error content

```typescript
// ❌ Bad
throw new Error('Failed to fetch data');

// ✅ Good
throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
```

---

### 2. Missing useEffect Dependencies

**Example Comment:**
```
Missing dependency in useEffect.
```

**Response:**
- Include all used variables and functions in dependency array
- Wrap functions with `useCallback`

```typescript
// ❌ Bad
useEffect(() => {
  fetchData();
}, []);

// ✅ Good
const fetchData = useCallback(async () => {
  // ...
}, [dependency]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

---

### 3. Hardcoded Text

**Example Comment:**
```
Hardcoded English text that should be localized.
```

**Response:**
- Add translation to `lib/i18n.ts`
- Use `t.translationKey`

```typescript
// ❌ Bad
<p>No data found</p>

// ✅ Good
<p>{t.noDataFound}</p>
```

---

### 4. Unhandled URL Parsing Errors

**Example Comment:**
```
Potential URL parsing error not handled.
```

**Response:**
- Use `getHostnameFromUrl` from `lib/utils.ts`

```typescript
// ❌ Bad
const hostname = new URL(url).hostname;

// ✅ Good
const hostname = getHostnameFromUrl(url);
```

---

### 5. Missing Input Validation

**Example Comment:**
```
Missing input validation for API parameters.
```

**Response:**
- Validate at function start
- Clear error messages

```typescript
// ✅ Good
export async function generateNewspaper(feedUrls: string[]) {
  if (!feedUrls || feedUrls.length === 0) {
    throw new Error('At least one feed URL is required');
  }
  if (feedUrls.length > 10) {
    throw new Error('Maximum 10 feed URLs allowed');
  }
  // ...
}
```

---

### 6. Empty Array/Data Handling

**Example Comment:**
```
Missing error handling for empty array.
```

**Response:**
- Check before function call
- Appropriate fallback UI

```typescript
// ✅ Good
if (!articles || articles.length === 0) {
  return <div>{t.noArticles}</div>;
}
const layout = calculateLayout(articles);
```

---

### 7. Accessibility (alt attribute)

**Example Comment:**
```
Missing alt text for images could impact accessibility.
```

**Response:**
- Always set fallback for alt attribute

```typescript
// ❌ Bad
<img src={url} alt={title} />

// ✅ Good
<img src={url} alt={title || 'Article image'} />
```

---

### 8. Performance Optimization

**Example Comment:**
```
Inefficient array operation inside render.
```

**Response:**
- Create Map with `useMemo` for O(1) lookup

```typescript
// ✅ Good
const suggestionMap = useMemo(
  () => new Map(suggestions.map(s => [s.url, s])),
  [suggestions]
);

// Inside render
const suggestion = suggestionMap.get(url);
```

---

## Points Not Requiring Response

### 1. Nitpick (Minor Points)

**Example Comment:**
```
[nitpick] Inconsistent timeout values in test configuration.
```

**Decision:**
- No response needed if tagged with `[nitpick]`
- Minor points not affecting functionality

---

### 2. Unused Variables (When Intentional)

**Example Comment:**
```
Unused variable t.
```

**Decision:**
- No response needed if planned for future use
- Delete if truly unnecessary

---

### 3. Stable Object Dependencies

**Example Comment:**
```
Missing router dependency in useEffect.
```

**Decision:**
- Next.js stable objects like `router`, `searchParams` can be omitted
- However, no problem including them explicitly

---

## Points Requiring Judgment

### 1. Code Duplication

**Example Comment:**
```
Duplicated error handling logic.
```

**Decision Criteria:**
- 3+ duplications → Extract to utility function
- 2 or fewer → Leave as is (avoid excessive abstraction)

---

### 2. Duplicate Type Definitions

**Example Comment:**
```
Duplicate type definitions.
```

**Decision Criteria:**
- Within same project → Unify in `types/index.ts`
- Between different packages → Define in each package (avoid dependencies)

---

## Response Priority

1. **High**: Security, error handling, accessibility
2. **Medium**: Performance, type consistency, i18n
3. **Low**: Code duplication, nitpick

---

## References

- [tech-common.md](./tech-common.md) - General best practices
- [tech.md](./tech.md) - Project-specific technical details
