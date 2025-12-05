# Technical Best Practices (General)

This document describes general best practices reusable across Next.js/React/TypeScript/AWS projects.

**Applicable Projects:**
- Next.js + TypeScript
- AWS Serverless (Lambda, DynamoDB, etc.)
- React component development

**Project-Specific Information:**
- For MyRSSPress-specific implementation details, refer to [tech.md](./tech.md)

---

## TypeScript/JavaScript Conventions

### Naming Conventions

- Use camelCase for variables and functions (e.g., `userName`, `fetchData`)
- Use PascalCase for classes and React components (e.g., `UserProfile`, `NewspaperCard`)
- Use UPPER_SNAKE_CASE for constants (e.g., `MAX_RETRY_COUNT`, `API_BASE_URL`)
- Use prefixes like `is`, `has`, `should` for boolean variables (e.g., `isLoading`, `hasError`)
- Use `handle` prefix for event handlers (e.g., `handleClick`, `handleSubmit`)

### File Structure

- Place one component per file
- Group related components in folders
- Use index.ts files for exports
- Match file names with component names (e.g., `UserProfile.tsx`)
- Place test files in the same directory with `.test.ts` or `.spec.ts` extension

### TypeScript Best Practices

- Prefer interface over type for public APIs
- Specify explicit return types for exported functions
- Avoid using `any` type (consider `unknown` if unavoidable)
- Minimize type assertions (`as`)
- Use union and intersection types appropriately
- Leverage generics to create reusable types
- Clearly distinguish between `null` and `undefined`
- Leverage optional chaining (`?.`) and nullish coalescing (`??`)

### Coding Style

- Use semicolons
- Prefer single quotes (`'`) (double quotes in JSX)
- Use 2 spaces for indentation
- Aim for line length within 100 characters
- Prefer arrow functions (`function` keyword only for special reasons)
- Actively use destructuring
- Use template literals for string construction

### Import/Export

- Prefer named exports (minimize default exports)
- Group imports in the following order:
  1. External libraries (React, Next.js, etc.)
  2. Internal modules (paths starting with `@/`)
  3. Relative paths (`./`, `../`)
  4. Type-only imports (`import type`)
- Remove unused imports

### Prohibition of Real Service Names in Tests and Documentation

**Principle**: Do not use real service names in test code, specifications, design documents, and documentation

**Reasons**:
1. Avoid trademark infringement risks
2. Not affected by service specification changes or termination
3. Keep code generic and understandable
4. Do not suggest dependency on specific services

**Prohibited Examples**:
- ❌ TechCrunch, Hacker News, Reddit, Twitter/X
- ❌ Google, Facebook, Amazon (as service names)
- ❌ Other real web services, company names, product names

**Recommended Alternatives**:
```typescript
// ❌ Bad: Real service names
const mockFeeds = [
  { url: 'https://techcrunch.com/feed/', title: 'TechCrunch', reasoning: 'Tech news' },
  { url: 'https://news.ycombinator.com/rss', title: 'Hacker News', reasoning: 'Tech community' },
];

// ✅ Good: Generic names
const mockFeeds = [
  { url: 'https://example.com/tech-feed', title: 'Tech News Feed', reasoning: 'Technology news' },
  { url: 'https://example.com/community-feed', title: 'Tech Community Feed', reasoning: 'Community discussions' },
];

// ✅ Good: More descriptive names
const mockFeeds = [
  { url: 'https://example.com/feed1', title: 'Sample Tech Blog', reasoning: 'Technology articles' },
  { url: 'https://example.com/feed2', title: 'Sample News Site', reasoning: 'General news' },
];
```

**Scope of Application**:
- Unit tests (`*.test.ts`, `*.spec.ts`)
- E2E tests (Playwright, etc.)
- Specifications (`.kiro/specs/`)
- Design documents (`design.md`, `requirements.md`)
- Documentation (`README.md`, `docs/`)
- Example comments in code

**Exceptions**:
- When actually using that service's API in production code (e.g., AWS SDK, Bedrock API)
- When connecting to actual service in integration tests (explicitly mark)
- When explaining as concrete example in user-facing documentation (explicitly state "Example:")

## Code Organization

### File Size Limits

- Keep each file within 300 lines
- Split into multiple files if exceeding
- Maintain clear separation of concerns when splitting files

### Component Splitting Example

```typescript
// ❌ Bad: One large component (500 lines)
export default function NewspaperPage() {
  // All logic and UI in one file...
}

// ✅ Good: Split into multiple small components
// NewspaperPage.tsx (100 lines)
export default function NewspaperPage() {
  return (
    <>
      <NewspaperHeader />
      <NewspaperContent />
      <NewspaperFooter />
    </>
  );
}

// NewspaperHeader.tsx (50 lines)
// NewspaperContent.tsx (150 lines)
// NewspaperFooter.tsx (50 lines)
```

### Separation of Concerns

- **Presentation Components**: Handle UI only
- **Container Components**: Handle logic and data fetching
- **Hooks**: Extract reusable logic
- **Utils**: Generic helper functions

## Testing Strategy

### Frontend Testing

- **Unit Tests**: Jest/Vitest
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright
- **Coverage Target**: 60% or higher

### Backend Testing

- **Unit Tests**: Jest/Vitest
- **Integration Tests**: Supertest + Hono
- **Mock**: AWS SDK Mock
- **Coverage Target**: 60% or higher

### Property-Based Testing

**Principle**: Use property-based testing in addition to example-based testing

**Library**: `fast-check`

**Property Examples**:
- **Completeness**: All inputs are included in output
- **Ordering**: Sort results are in correct order
- **Immutability**: Original data is not modified
- **Idempotency**: Same input produces same output

**Implementation Example**:
```typescript
import * as fc from 'fast-check';

it('Property: All items must be included (Completeness)', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
      (items) => {
        const result = processItems(items);
        return result.length === items.length;
      }
    ),
    { numRuns: 100 }
  );
});
```

## Code Quality & Linting

### ESLint Configuration

**Principle**: Use ESLint in all projects to maintain code quality

**Frontend (Next.js)**:
```json
// frontend/.eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:storybook/recommended"
  ],
  "rules": {
    "@next/next/no-html-link-for-pages": "off",
    "@next/next/no-img-element": "off",
    "react/no-unescaped-entities": "off",
    "storybook/no-renderer-packages": "off"
  }
}
```

**Backend (Node.js + TypeScript)**:
```json
// backend/.eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": "off"
  },
  "env": {
    "node": true,
    "es2022": true
  },
  "ignorePatterns": ["dist", "node_modules", "tests"]
}
```

**Execution Method**:
```bash
# Individual execution
cd frontend && npm run lint
cd backend && npm run lint

# Execute from Makefile (recommended)
make test-lint

# Run all tests (unit + ESLint + security + vulnerabilities)
make test
```

**Best Practices**:
- Always run ESLint before commits
- Fix warnings as much as possible
- Minimize use of `any` type
- Remove unused variables
- Run ESLint in CI/CD pipeline

## Security

### General Security Practices

- Manage sensitive information with environment variables
- Do not hardcode sensitive information in code
- Configure CORS appropriately
- Implement rate limiting
- Sanitize input data
- Apply principle of least privilege

### Frontend Security

- XSS protection (React default protection)
- CSRF protection (SameSite Cookie)
- Content Security Policy (CSP) configuration

### Backend Security

- Store sensitive information in environment variables
- Manage sensitive information using Secrets Manager
- Apply principle of least privilege with IAM roles

### Dependency Security (npm vulnerability check)

**Overview:**

Automatically check npm dependency vulnerabilities and prevent pushes if Medium or higher severity vulnerabilities are found.

**Check Tool:**
- `npm audit` - npm official vulnerability check tool
- Severity levels: Critical, High, Moderate, Low

**Automatic Check Timing:**
1. **pre-push hook**: Automatic check on `git push` execution (optional)
2. **Manual execution**: `make test-vulnerabilities` or `make audit`

**Severity Response Policy:**
- **Critical/High/Moderate**: Block push, immediate fix required
- **Low**: Warning only, push allowed (consider periodic fixes)

**Execution Method:**

```bash
# Manual vulnerability check
make test-vulnerabilities
# or
make audit

# All tests (unit + security + vulnerabilities)
make test
```

**Response When Vulnerabilities Found:**

```bash
# 1. Navigate to relevant directory
cd frontend  # or backend

# 2. Check vulnerability details
npm audit

# 3. Attempt automatic fix (non-destructive)
npm audit fix

# 4. If automatic fix fails, fix with destructive changes
npm audit fix --force

# 5. Commit package-lock.json
git add package-lock.json
git commit -m "fix: Update dependencies to fix vulnerabilities"
```

**Best Practices:**
1. Regularly run `npm audit` to check vulnerabilities
2. Update dependencies carefully and run tests
3. `npm audit fix --force` includes destructive changes, always test after execution
4. For unfixable vulnerabilities, consider alternative packages or report issue
5. Run vulnerability checks in CI/CD pipeline

**Response to Unfixable Vulnerabilities:**

When vulnerabilities cannot be fixed immediately due to dependency conflicts:

1. **Assess impact**: Development environment only, or production affected?
2. **Create GitHub Issue**: Record vulnerability details and fix plan
3. **Temporary workaround**: 
   - If development environment only, verify no impact on production build
   - If production affected, consider alternative packages or emergency response
4. **Periodic re-evaluation**: Retry fix when updating dependencies

## Monitoring & Logging

### Logging

```typescript
const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta }));
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      error: error?.message,
      stack: error?.stack,
      ...meta 
    }));
  },
};
```

- Use structured logging (JSON format)
- Properly log errors and warnings
- Record performance metrics

### Monitoring

- Monitor performance with metrics
- Set alerts with alarms
- Detailed tracking with tracing
- Get detailed metrics

## Performance Optimization

### Frontend

- Appropriately use SSR/SSG
- Image optimization (Next.js Image)
- Code splitting (Dynamic Import)
- Cache with CDN

### Backend

- Function warm-up
- Query optimization
- Leverage parallel processing (Promise.all)
- Leverage caching

## Deployment Best Practices

1. **Pull before push**: Always run `git pull` before `git push` to incorporate remote changes
2. **Always run tests**: Run `make test` before deployment
3. **Check infrastructure changes**: Check changes with `terraform plan`
4. **Gradual deployment**: Deploy important changes gradually
5. **Image tag management**: Use Git commit SHA as image tag
6. **Rollback preparation**: Be able to revert to previous image tag
7. **Monitoring**: Check post-deployment operation with logs
8. **Notification setup**: Notify deployment success/failure to Slack, etc.

**Correct Push Procedure:**
```bash
# 1. Commit changes
git add .
git commit -m "feat: Add new feature"

# 2. Incorporate remote changes (Important!)
git pull origin feat/your-branch

# 3. Resolve conflicts if any
# (Manually resolve and commit if conflicts exist)

# 4. Push
git push origin feat/your-branch
```

## Prohibited Practices

This section defines development practices that must never be performed in the project.

### Code Quality

**❌ Prohibited: Excessive use of TypeScript `any` type**
- Minimize use of `any` type
- Consider `unknown` if unavoidable

**❌ Prohibited: Omitting error handling**
- Implement error handling for all asynchronous processing
- Always use try-catch or .catch()

**❌ Prohibited: Leaving console logs in production**
- Use `console.log()` only during development
- Use structured logging (JSON format) in production

### Internationalization (i18n)

**❌ Prohibited: Direct translation branching in components**
- Direct branching like `locale === 'ja' ? '日本語' : 'English'` is prohibited
- Always use translation files in `lib/i18n.ts`
- Get translations using `useTranslations(locale)`

**Bad Example:**
```typescript
// ❌ Bad: Direct branching
const buttonText = locale === 'ja' ? '保存' : 'Save';
const placeholder = locale === 'ja' 
  ? 'テーマを入力してください'
  : 'Enter your theme';
```

**Good Example:**
```typescript
// ✅ Good: Use i18n file
import { useTranslations } from '@/lib/i18n';

const t = useTranslations(locale);
const buttonText = t.save;
const placeholder = t.themeInputPlaceholder;
```

**Reasons:**
- Centralized translation management
- Easy to add/change translations
- Improved code readability
- Prevent translation omissions
- Easy future multi-language support

### Git Workflow

**❌ Prohibited: Direct commits to main branch**
- Always create feature branch and go through PR
- Exception: Emergency hotfixes only

**❌ Prohibited: Oversized PRs**
- Aim for PRs within 500 lines
- Split large changes into multiple PRs

### Performance

**❌ Prohibited: Unlimited data fetching**
- Always set Limit on queries
- Implement pagination

**❌ Prohibited: Synchronous mass API calls**
- Parallelize multiple API calls with `Promise.all()`
- Consider rate limiting

---

Violating these prohibited practices can seriously impact system stability, security, and maintainability. Always comply.

## Bug Fix Workflow

When a bug is discovered, follow this workflow to fix it.

### 1. Create Issue

When a bug is discovered, first create a GitHub Issue:

```markdown
## Description
Detailed description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
Expected behavior

## Current Behavior
Current behavior

## Technical Details
- Location: File path and line number
- Suspected Cause: Suspected cause

## Investigation Needed
List of items requiring investigation

## Priority
High/Medium/Low
```

**Issue Labels:**
- `bug`: Bug fix
- Depending on impact: `frontend`, `backend`, `database`, `infrastructure`

### 2. Create Branch

Create branch including Issue number:

```bash
git checkout -b fix/issue-{number}-{short-description}

# Example
git checkout -b fix/issue-13-saved-newspapers-no-articles
```

### 3. Investigate Problem

**Investigation Steps:**

1. **Confirm reproduction**: Verify bug can actually be reproduced
2. **Code review**: Read related code to identify cause
3. **Check logs**: Check error logs and console output
4. **Check data**: Check database and API responses

**Investigation Points:**
- Check both frontend and backend
- Track data flow (UI → API → Service → Database)
- Check type definition and interface mismatches
- Check if return value includes required fields

### 4. Implement Fix

**Fix Principles:**
- **Minimal changes**: Change only minimum code to solve problem
- **Check impact**: Verify changes don't affect other features
- **Type safety**: Leverage TypeScript type checking
- **Testing**: Verify existing tests pass

**Fix Example (Issue #13 case):**

```typescript
// ❌ Bad: articles field missing
return result.Items.map(item => ({
  newspaperId: item.newspaperId,
  name: item.name,
  // ... articles not included
}));

// ✅ Good: Add articles field
return result.Items.map(item => ({
  newspaperId: item.newspaperId,
  name: item.name,
  articles: item.articles, // Added
  // ...
}));
```

### 5. Run Tests

After fix, always run tests:

```bash
# Unit tests
make test-unit

# All tests
make test

# Manual testing
# 1. Execute bug reproduction steps
# 2. Verify fix works
# 3. Verify no impact on other features
```

### 6. Commit and Push

**Commit Message Format:**

```
fix: {concise description}

- Change 1
- Change 2
- Root cause explanation

Fixes #{Issue number}
```

**Example:**
```bash
git add backend/src/services/newspaperService.ts
git commit -m "fix: Include articles in getPublicNewspapers response

- Add articles field to the response of getPublicNewspapers
- This fixes the issue where saved newspapers show 'no articles' message
- Articles were being saved but not returned when fetching public newspapers

Fixes #13"

git push origin fix/issue-13-saved-newspapers-no-articles
```

### 7. Create Pull Request

**PR Content:**

```markdown
## Overview
Fixes #{Issue number} - Concise problem description

## Problem
Detailed bug description

## Root Cause
Root cause explanation

## Solution
Fix description

## Changes
- **Backend**: Changed files and content
- **Frontend**: Changed files and content

## Testing
- ✅ Test item 1
- ✅ Test item 2

## Verification Steps
Steps to verify fix

Fixes #{Issue number}
```

### 8. Review and Merge

1. Create PR
2. Verify CI/CD passes
3. Code review (as needed)
4. Merge to main branch
5. Verify Issue automatically closes

### Bug Fix Checklist

Check the following before fixing:

- [ ] Created Issue
- [ ] Used appropriate branch name
- [ ] Identified root cause of problem
- [ ] Fixed with minimal changes
- [ ] Verified tests pass
- [ ] Verified operation with manual testing
- [ ] Included `Fixes #number` in commit message
- [ ] PR description is clear
- [ ] Verified no impact on other features

### Common Bug Patterns

**1. Missing API response fields**
- Symptom: Data not displayed on frontend
- Cause: Backend response doesn't include required fields
- Fix: Add fields to response mapping

**2. Type definition mismatch**
- Symptom: TypeScript compilation error
- Cause: Interface and implementation don't match
- Fix: Update type definition or fix implementation

**3. Insufficient async error handling**
- Symptom: Errors not notified to users
- Cause: Missing try-catch
- Fix: Add appropriate error handling

**4. State management issues**
- Symptom: UI not updating or unexpected behavior
- Cause: React state updates not performed correctly
- Fix: Check useEffect dependency array, fix state update logic

### Debugging Tips

**Frontend:**
- Check Network tab in browser DevTools
- Check error messages in Console
- Check state with React DevTools

**Backend:**
- Check error logs in CloudWatch Logs
- Debug locally with `console.log`
- Check API responses with curl or Postman

**Database:**
- Check data directly in DynamoDB console
- Verify query conditions are correct
- Verify GSI (Global Secondary Index) is configured correctly
