# Common Technical Practices (General)

General best practices for TypeScript/React/Node.js projects.

---

## Project Initialization Guide

### Quick Start (Existing Project)

When cloning an existing project:

```bash
# 1. Clone repository
git clone <repository-url>
cd <project-name>

# 2. Install dependencies
npm ci
cd frontend && npm ci && cd ..
cd backend && npm ci && cd ..

# 3. Setup Git hooks
rm -rf .husky && ln -s .kiro/hooks/common/.husky .husky

# 4. Install gitleaks (security checks)
brew install gitleaks  # macOS
# Or see: https://github.com/gitleaks/gitleaks#installing

# 5. Configure environment variables
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.local.example backend/.env.local
# Edit .env.local files with your values

# 6. Run tests to verify setup
make test
```

### New Project Setup (From Scratch)

When starting a new project with this structure:

#### Step 1: Copy Common Files

```bash
# Create new project directory
mkdir my-new-project && cd my-new-project
git init

# Copy .kiro directory from template
cp -r <template-project>/.kiro .kiro

# Copy essential files
cp <template-project>/.gitignore .gitignore
cp <template-project>/.gitleaks.toml .gitleaks.toml
cp <template-project>/Makefile Makefile
```

#### Step 2: Setup Git Hooks

```bash
# Create symbolic link
ln -s .kiro/hooks/common/.husky .husky

# Initialize husky
npm install husky --save-dev
npx husky install
```

#### Step 3: Install Security Tools

```bash
# Install gitleaks
# macOS
brew install gitleaks

# Linux (Debian/Ubuntu)
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.1/gitleaks_8.18.1_linux_x64.tar.gz
tar -xzf gitleaks_8.18.1_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/

# Windows (via Scoop)
scoop install gitleaks

# Verify installation
gitleaks version
```

#### Step 4: Configure Project Structure

```bash
# Create project directories
mkdir -p frontend backend infra docs scripts

# Copy package.json templates
cp <template-project>/package.json .
cp <template-project>/frontend/package.json frontend/
cp <template-project>/backend/package.json backend/

# Update package.json with your project name
```

#### Step 5: Install Dependencies

```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..

# Backend dependencies
cd backend && npm install && cd ..
```

#### Step 6: Verify Setup

```bash
# Run tests
make test

# Check security
make test-security

# Verify Git hooks work
git add .
git commit -m "test: Verify hooks" --allow-empty
# Should run security checks automatically
```

### Essential Files Checklist

When setting up a new project, ensure these files exist:

- [ ] `.kiro/hooks/common/.husky/` - Git hooks
- [ ] `.kiro/hooks/scripts/security-check.sh` - Security script
- [ ] `.kiro/steering/common/` - Common guidelines
- [ ] `.gitignore` - Ignore patterns
- [ ] `.gitleaks.toml` - Gitleaks configuration
- [ ] `Makefile` - Common tasks
- [ ] `package.json` - Root dependencies
- [ ] `.tool-versions` - Tool version requirements

### Tool Installation

#### Required Tools

```bash
# Node.js (via nvm or asdf)
nvm install 24  # or version in .tool-versions
nvm use 24

# Gitleaks (security scanning)
brew install gitleaks  # macOS
# See: https://github.com/gitleaks/gitleaks#installing

# Make (usually pre-installed)
make --version
```

#### Optional Tools

```bash
# Terraform (if using IaC)
brew install terraform  # macOS

# AWS CLI (if using AWS)
brew install awscli  # macOS

# Docker (if using containers)
brew install docker  # macOS
```

### Troubleshooting

#### Git Hooks Not Running

```bash
# Verify symbolic link
ls -la .husky
# Should show: .husky -> .kiro/hooks/common/.husky

# Recreate if needed
rm -rf .husky && ln -s .kiro/hooks/common/.husky .husky

# Verify hook permissions
chmod +x .kiro/hooks/common/.husky/pre-commit
chmod +x .kiro/hooks/common/.husky/pre-push
chmod +x .kiro/hooks/scripts/security-check.sh
```

#### Gitleaks Not Found

```bash
# Check installation
which gitleaks

# Install if missing
brew install gitleaks  # macOS

# Verify
gitleaks version
```

#### Security Check Fails

```bash
# Run manually to see details
./.kiro/hooks/scripts/security-check.sh

# Check specific files
gitleaks detect --source . --verbose
```

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
