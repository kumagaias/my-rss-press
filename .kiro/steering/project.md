# Project Standards - MyRSSPress

**Related**: [common-project.md](./common-project.md) - General project standards

---

## Communication

- **Agent chat**: Japanese
- **Files in `.kiro`**: Japanese
- **README files**: English (max 200 lines)
- **GitHub PRs/Issues**: English
- **Commit messages**: English
- **Code comments**: English

## Tool Versions

See `.tool-versions`:
- Node.js: 24.x or 22.x LTS
- Terraform: >= 1.11.0
- AWS CLI: >= 2.0
- Docker: >= 20.0
- Gitleaks: Latest

## CLI Pager Configuration

**CRITICAL**: Disable pagers to prevent command interruption:

```bash
# Add to ~/.zshrc or ~/.bashrc
export AWS_PAGER=""
export GIT_PAGER=""

# Apply
source ~/.zshrc
```

## Makefile Commands

```bash
make test              # All tests (unit + security)
make test-unit         # Unit tests only
make test-security     # Security checks only
make install           # Install dependencies
make check-tools       # Check tool versions
```

## Development Flow

### Branch Naming

```
<type>/task-<number>-<description>
```

Examples:
- `feat/task-1.1-setup-hono-app`
- `fix/issue-42-newspaper-generation-error`

### Commit Message

```
<type>: <subject> (task-X.X)

<body>

Task: X.X
```

## Bug Fix Workflow (MANDATORY)

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

# 5. Create PR
gh pr create --title "Fix: [description]" --body "Fixes #{number}"

# 6. After merge, close issue and update documentation
./.kiro/hooks/common/scripts/close-bugfix-issue.sh {number}
```

### Manual Workflow

1. **Create GitHub Issue** (via GitHub MCP) - Get Issue number first
2. **Document bug**: Create detailed report in `.kiro/specs/bugfix/issue-{number}-{description}.md`
3. **Create fix branch**: `fix/issue-{number}-{description}`
4. **Fix & test**: `make test`
5. **Commit**: Include `Fixes #{number}`
6. **Create PR** (via GitHub MCP)
7. **Request Copilot review** (via GitHub MCP)
8. **Check Copilot comments** (via GitHub MCP)
9. **Code review**
10. **Merge** (after user approval)
11. **Update bug report**: Mark as resolved with PR link

**❌ Prohibited:**
- Skipping Issue creation
- Fixing directly on main branch
- Merging without user approval

**File Naming**: Always use `issue-{number}-{description}.md` format (e.g., `issue-42-newspaper-generation-error.md`)

**Helper Scripts**:
- `.kiro/hooks/common/scripts/create-bugfix-issue.sh` - Create Issue + bugfix doc
- `.kiro/hooks/common/scripts/close-bugfix-issue.sh` - Close Issue + update doc

**Bug Reports Location**: `.kiro/specs/bugfix/` - See `../common/project.md` for format

## Spec Implementation Priority

1. **Phase 1 (MVP)**: `.kiro/specs/phase-1/` ✅ Complete
2. **Phase 2 (Enhanced)**: `.kiro/specs/phase-2/` 🔄 In progress
3. **Phase 3 (Dynamic Categories)**: `.kiro/specs/phase-3/` ⏳ Planned

## Deployment

### Frontend (Amplify)
- Auto-deploy on push to `main`
- Build: `amplify.yml`

### Backend (GitHub Actions)
- Auto-deploy on push to `main` with `backend/**` changes
- Build Docker → Push to ECR → Update Lambda

### Infrastructure (Terraform)
- Manual execution from local
- Always run `terraform plan` before `apply`

**⚠️ IMPORTANT:**
- Always run `git pull` before `git push`
- Always run `make test` before push
- Never chain `git push` with `&&`

## Agent Hooks

Available in `.kiro/hooks/`:
- `run-tests.json` - Unit tests (manual)
- `run-all-tests.json` - All tests (auto on execution complete)
- `pre-commit-security.json` - Security check (manual)
- `disable-pagers-on-session-start.json` - Auto-disable pagers (auto on session start)
- `check-pager-config.json` - Verify pager config (manual)
- `documentation-update-reminder.json` - Doc update reminder (auto on execution complete)
- `commit-push-pr.json` - Commit, push, and create PR (manual)

Execute via Command Palette: "Agent Hooks"

---

**For detailed guidelines:**
- `tech.md` - Technical details
- `../common/tech.md` - General best practices
- `../common/project.md` - Bug report format and workflow
- `../../specs/bugfix/` - Bug reports and investigations
