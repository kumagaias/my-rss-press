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

### Quick Start (Using Scripts)

```bash
# 1. Create Issue and bugfix documentation
./.kiro/hooks/common/scripts/create-bugfix-issue.sh

# 2. Create fix branch (use suggested name from script output)
git checkout -b fix/issue-{number}-{description}

# 3. Fix & test
make test

# 4. Commit with issue reference
git commit -m "fix: [description] (Fixes #{number})"

# 5. Create PR (via GitHub CLI or MCP)
gh pr create --title "Fix: [description]" --body "Fixes #{number}"

# 6. After merge, close issue and update documentation
./.kiro/hooks/common/scripts/close-bugfix-issue.sh {number}
```

### Manual Workflow

1. **Create GitHub Issue** (via GitHub MCP or CLI) - Get Issue number
2. **Document bug**: Create detailed report in `.kiro/specs/bugfix/issue-{number}-{description}.md`
3. **Create fix branch**: `fix/issue-{number}-{description}`
4. **Fix & test**: `make test`
5. **Commit**: Include `Fixes #{number}` in message
6. **Create PR** (via GitHub MCP or CLI)
7. **Code review**
8. **Merge** (after approval)
9. **Update bug report**: Mark as resolved with PR link

**❌ Prohibited:**
- Skipping Issue creation
- Fixing directly on main branch
- Merging without approval

**File Naming**: Always use `issue-{number}-{description}.md` format to prevent number conflicts

**Helper Scripts**:
- `.kiro/hooks/common/scripts/create-bugfix-issue.sh` - Create Issue + bugfix doc
- `.kiro/hooks/common/scripts/close-bugfix-issue.sh` - Close Issue + update doc

### Bug Report Format

Create detailed bug reports in `.kiro/specs/bugfix/` directory:

```markdown
# Bug Report #issue-{number}: {Title}

**Date**: YYYY-MM-DD
**Status**: Open/In Progress/Resolved
**Severity**: Low/Medium/High/Critical
**Component**: {Component name}

## Summary
Brief description of the bug

## Error Details
Error messages, stack traces, logs

## Reproduction Steps
1. Step 1
2. Step 2
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Possible Causes
List of potential root causes

## Investigation Needed
- [ ] Check logs
- [ ] Review code
- [ ] Test edge cases

## Impact
User experience and scope

## Next Steps
Action items
```

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
