# Common Project Standards (General)

General project standards applicable to various projects.

---

## Communication Standards

- **Agent chat**: Project language (Japanese/English)
- **README files**: English (max 200 lines)
- **GitHub PRs/Issues**: English
- **Commit messages**: English
- **Code comments**: English

## Development Flow

### Basic Flow

```bash
# 1. Create branch
git checkout -b feat/task-X-description

# 2. Implement & test
make test

# 3. Commit (English)
git add .
git commit -m "feat: Add feature"

# 4. Push
git push origin feat/task-X-description

# 5. Create PR (English)
# 6. Review & merge
```

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Branch Naming

```
<type>/<description>
```

Examples:
- `feat/add-user-authentication`
- `fix/resolve-memory-leak`
- `docs/update-readme`

## Bug Fix Workflow

1. **Create GitHub Issue**
2. **Create fix branch**: `fix/issue-{number}-{description}`
3. **Fix & test**: `make test`
4. **Commit**: Include `Fixes #{number}` in message
5. **Create PR**
6. **Code review**
7. **Merge** (after approval)

**❌ Prohibited:**
- Skipping Issue creation
- Fixing directly on main branch
- Merging without approval

## Testing Requirements

```bash
make test              # All tests
make test-unit         # Unit tests only
make test-security     # Security checks
```

**Coverage Target**: 60% or higher

## Security Checks

### Pre-commit/Pre-push
- Run security checks automatically
- Check for sensitive information
- Validate dependencies

### Manual Checks
```bash
# Check vulnerabilities
npm audit

# Fix automatically
npm audit fix
```

## Documentation Requirements

### Required Files
- `README.md` - Project overview
- `common-structure.md` - General structure patterns
- `common-tech.md` - General tech practices
- `common-project.md` - This file
- `structure.md` - Project-specific structure
- `tech.md` - Project-specific tech details
- `project.md` - Project-specific standards

### Update Timing
- When features change
- When specs change
- When structure changes

## Deployment Standards

### Pre-deployment Checklist
- [ ] All tests pass
- [ ] Security checks pass
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Changes tested locally

### Deployment Process
1. Pull latest changes
2. Run all tests
3. Deploy to staging (if available)
4. Verify in staging
5. Deploy to production
6. Monitor logs
7. Verify in production

## Postmortem Guidelines

### When to Create
- Security incidents
- Production failures
- Critical bugs
- Process issues

### Postmortem Structure
1. **Overview**: What happened (1-2 sentences)
2. **Timeline**: Chronological events
3. **Root Cause**: Why it occurred
4. **Impact**: What was affected
5. **Resolution**: How it was fixed
6. **Prevention**: Future countermeasures

### Best Practices
- Don't blame individuals
- Be concise and specific
- Focus on system improvements
- Create promptly after resolution
- Share learnings with team

## Tool Version Management

### .tool-versions
Define required tools and versions:
- Runtime (Node.js, Python, etc.)
- Infrastructure (Terraform, etc.)
- CLI tools (AWS CLI, etc.)
- Security tools (Gitleaks, etc.)

### Installation
```bash
# Check tools
make check-tools

# Install tools (if using asdf)
asdf install
```

## Makefile Standards

### Required Commands
```bash
make test              # All tests
make test-unit         # Unit tests
make test-security     # Security checks
make install           # Install dependencies
make clean             # Clean build artifacts
make help              # Display available commands
```

## Agent Hooks

### Common Hooks
- `run-tests.json` - Run tests
- `security-check.json` - Security check
- `lint-check.json` - Linting check

### Execution
- Via Command Palette: "Agent Hooks"
- Manual: `make <command>`

---

**For project-specific details, refer to:**
- `structure.md` - Project structure
- `tech.md` - Technical details
- `project.md` - Project standards
