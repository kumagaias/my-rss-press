# Common Technical Practices (General)

General best practices for TypeScript/React/Node.js projects.

---

## Project Initialization Checklist

When setting up a new project or cloning an existing one:

### 1. Install Dependencies
```bash
# Root dependencies
npm ci

# Frontend dependencies
cd frontend && npm ci

# Backend dependencies
cd ../backend && npm ci
```

### 2. Setup Git Hooks
```bash
# Create symbolic link from .husky to .kiro/hooks/common/.husky
# Run via Kiro hook: "Setup Git Hooks"
# Or manually:
rm -rf .husky && ln -s .kiro/hooks/common/.husky .husky
```

### 3. Configure Environment Variables
```bash
# Copy example files
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.local.example backend/.env.local

# Edit with your values
# frontend/.env.local
# backend/.env.local
```

### 4. Verify Tool Versions
```bash
# Check required tools
make check-tools

# Or manually check:
node --version    # Should match .tool-versions
npm --version
terraform --version
aws --version
docker --version
```

### 5. Run Tests
```bash
# All tests
make test

# Unit tests only
make test-unit

# Security checks
make test-security
```

### 6. Disable CLI Pagers (Optional)
```bash
# Auto-disabled on Kiro session start
# Or add to ~/.zshrc manually:
export AWS_PAGER=""
export GIT_PAGER=""
```

### 7. Review Documentation
- Read `README.md` for project overview
- Check `.kiro/steering/` for development guidelines
- Review `.kiro/specs/` for feature specifications

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

## Code Review Best Practices

### Common Issues to Address

1. **Error Messages**: Include HTTP status and specific details
2. **useEffect Dependencies**: Include all used variables/functions
3. **Hardcoded Text**: Use i18n translation keys
4. **Input Validation**: Validate at function start with clear errors
5. **Empty Data Handling**: Check before processing, provide fallback UI
6. **Accessibility**: Always provide alt text fallbacks
7. **Performance**: Use `useMemo` for expensive operations

### Response Priority

- **High**: Security, error handling, accessibility
- **Medium**: Performance, type consistency, i18n
- **Low**: Code duplication, nitpicks

### When to Refactor

- **3+ duplications**: Extract to utility function
- **2 or fewer**: Leave as is (avoid over-abstraction)

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
