# Common Technical Practices (General)

General best practices for TypeScript/React/Node.js projects.

---

## TypeScript Conventions

### Naming
- **Variables/Functions**: camelCase (`userName`, `fetchData`)
- **Classes/Components**: PascalCase (`UserProfile`, `Button`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Booleans**: Prefix with `is`, `has`, `should` (`isLoading`)
- **Event Handlers**: Prefix with `handle` (`handleClick`)

### Best Practices
- Prefer `interface` over `type` for public APIs
- Specify explicit return types for exported functions
- Avoid `any` type (use `unknown` if needed)
- Minimize type assertions (`as`)
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### Coding Style
- Use semicolons
- Single quotes (`'`) except in JSX
- 2 spaces indentation
- Max 100 characters per line
- Prefer arrow functions
- Use destructuring
- Use template literals

## Testing Strategy

### Coverage
- **Target**: 60% or higher
- **Unit Tests**: Jest/Vitest
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright
- **Integration Tests**: Supertest (backend)

### Test Organization
- Place tests near source files
- Use `.test.ts` or `.spec.ts` extension
- One test file per source file
- Use Page Object Model for E2E tests

## Security

### General
- Never hardcode sensitive information
- Use environment variables
- Configure CORS appropriately
- Implement rate limiting
- Sanitize input data
- Apply principle of least privilege

### Dependency Security
```bash
# Check vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Fix with breaking changes
npm audit fix --force
```

## Performance

### Frontend
- Use SSR/SSG appropriately
- Optimize images
- Code splitting
- CDN caching

### Backend
- Query optimization
- Parallel processing (`Promise.all`)
- Caching strategies
- Connection pooling

## Logging

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

## Prohibited Practices

### Code Quality
- ❌ Excessive use of `any` type
- ❌ Omitting error handling
- ❌ Console logs in production

### Git Workflow
- ❌ Direct commits to main branch
- ❌ Oversized PRs (> 500 lines)

### Performance
- ❌ Unlimited data fetching
- ❌ Synchronous mass API calls

## Deployment Best Practices

1. Pull before push
2. Always run tests before deployment
3. Check infrastructure changes
4. Gradual deployment
5. Rollback preparation
6. Monitor post-deployment
7. Set up notifications

```bash
# Correct push procedure
git add .
git commit -m "feat: Add feature"
git pull origin feat/branch
git push origin feat/branch
```
