# Project Standards

## Communication Standards

- Agent chat should be conducted in Japanese.
- Files in the `.kiro` directory should be written in Japanese.
- README files should be written in English and kept within 200 lines.
- **GitHub Pull Requests and Issues must be written in English.**
  - Titles, descriptions, and comments should all be in English
  - **Commit messages must also be written in English**
  - PRs and Issues are public information and should be unified in English
- **Code comments must be written in English.**
  - Function, class, and variable description comments
  - Inline comments
  - JSDoc, TSDoc, Python docstrings, etc.
  - Reason: Code may be shared internationally

## Tool Version Management

### .tool-versions

Place a `.tool-versions` file in the project root and define required tools and their versions:

**Required Tools:**
- **Node.js**: 24.x (Active LTS) or 22.x (Maintenance LTS)
- **Terraform**: >= 1.11.0
- **AWS CLI**: >= 2.0
- **Docker**: >= 20.0
- **Gitleaks**: Latest version (for security checks)

### CLI Pager Configuration

**Important**: Disable pagers for AWS CLI and Git to prevent command interruption during agent execution.

**Setup (add to `~/.zshrc` or `~/.bashrc`):**

```bash
# Disable AWS CLI pager (prevents interruption)
export AWS_PAGER=""

# Disable Git pager (prevents interruption)
export GIT_PAGER=""
```

**Apply changes:**
```bash
source ~/.zshrc  # or source ~/.bashrc
```

**Verification:**
```bash
# Check environment variables
echo $AWS_PAGER    # Should output nothing
echo $GIT_PAGER    # Should output nothing

# Test AWS CLI (should output directly without pager)
aws help

# Test Git (should output directly without pager)
git log
```

**Why this is needed:**
- Pagers (like `less`) interrupt command execution and wait for user input
- This causes agent commands to hang and fail
- Disabling pagers ensures commands complete immediately
- Especially important for CI/CD and automated workflows

**Alternative (per-command basis):**
```bash
# AWS CLI
aws logs tail /aws/lambda/my-function --no-paginate

# Git
git --no-pager log
```

**Tool Installation:**

Using asdf (recommended):
```bash
# Install asdf (if not installed)
# macOS: brew install asdf
# Linux: https://asdf-vm.com/guide/getting-started.html

# Add plugins
asdf plugin add nodejs
asdf plugin add terraform

# Install based on .tool-versions
asdf install
```

Manual installation:
```bash
# Check tools
make check-tools

# Install each tool individually
# Node.js: https://nodejs.org/
# Terraform: https://www.terraform.io/downloads.html
# AWS CLI: https://aws.amazon.com/cli/
# Docker: https://www.docker.com/get-started
# Gitleaks: https://github.com/gitleaks/gitleaks
```

### Makefile

Place a `Makefile` in the project root and provide the following commands:

**Tool Management Commands:**
```bash
make check-tools       # Check installation status of required tools
make install-tools     # Install tools via asdf (if asdf is available)
```

**Test Commands:**
```bash
make test              # All tests (unit + security)
make test-unit         # Unit tests only
make test-security     # Security checks only
make security-check    # Security check (alias)
```

**Development Commands:**
```bash
make install           # Install dependencies (automatically runs check-tools)
make clean             # Clean build artifacts
make help              # Display available commands
```

**Log Display:** (Future implementation)
```bash
make logs              # Display CloudWatch Logs
make logs-frontend     # Frontend logs
make logs-backend      # Backend logs
```

### Test Execution Principles

- All test commands should be accessible from the Makefile
- `make test` should always run both unit tests and security checks
- Tests should return a non-zero exit code on failure
- CI/CD pipelines should run `make test`

## Documentation Requirements

Create and maintain the following documentation files:

- `product.md` - Product specifications (features, user flows, glossary)
- `tech.md` - Technical architecture and design decisions
- `tech-common.md` - General best practices
- `structure.md` - Project structure and organization
- `project-standards.md` - Project standards (this file)
- `review.md` - Code review response guide
- `postmortem.md` - Postmortem guidelines

### Documentation Update Rules

**When product specifications change:**
1. **Always update `product.md`**
2. Reflect new features, specification changes, performance improvements, etc.
3. Record changes in the update history section

**When technical implementation changes:**
1. **Update `tech.md`** (architecture, performance optimization, etc.)
2. **Update `tech-common.md`** (general best practices)

**When project structure changes:**
1. **Update `structure.md`**

**Update Timing:**
- When feature implementation is complete
- When creating a PR
- When specifications change

These files must be updated whenever there are related changes.

## Steering Files Management

### File Size Limits

**Lines per file:**
- **Recommended**: 500-1000 lines
- **Maximum**: 1500 lines
- **If exceeding 1500 lines**: Split by section

**Split Example:**
```
tech.md (1600 lines) → Split
├── tech-architecture.md    # Architecture overview
├── tech-frontend.md        # Frontend technology
└── tech-backend.md         # Backend technology
```

### File Count Limits

**Total steering files:**
- **Recommended**: 3-5 files
- **Maximum**: 10 files
- **If exceeding 10 files**: Consolidate where possible

### Current Steering Files

```
.kiro/steering/
├── project-standards.md    # Project standards (this file)
├── tech.md                 # Technical architecture
└── structure.md            # Project structure
```

### Management Rules

1. **Regular checks**: Check file sizes monthly
2. **Split decision**: Consider splitting immediately if exceeding 1500 lines
3. **Consolidation decision**: Consider consolidating small files (< 100 lines)
4. **Naming convention**: Use `<category>-<subcategory>.md` format
5. **Cross-references**: Clearly indicate cross-references between split files

### File Size Check Method

```bash
# Check line count of all steering files
wc -l .kiro/steering/*.md

# Detect files exceeding 1500 lines
find .kiro/steering -name "*.md" -exec wc -l {} \; | awk '$1 > 1500 {print $2 " has " $1 " lines (exceeds limit)"}'
```

## Development Flow

### Basic Development Flow

All feature development and bug fixes should follow this flow:

**1. Create a branch**
```bash
# Create a branch using task number
git checkout -b feat/task-1.1-setup-hono-app

# Or use a descriptive name
git checkout -b feat/setup-hono-application
```

**Branch Naming Convention:**
- `feat/task-X.X-<description>` - New feature
- `fix/task-X.X-<description>` - Bug fix
- `refactor/task-X.X-<description>` - Refactoring
- `test/task-X.X-<description>` - Test addition

**2. Verify locally**
```bash
# Run tests
make test

# Verify with local server
cd frontend && npm run dev
# or
cd backend && npm run dev

# Manual testing
# - Verify implemented feature works correctly
# - Verify no impact on existing features
# - Verify by actually operating in browser
```

**3. Push and create PR to main**
```bash
# Stage changes
git add .

# Commit (include task number)
git commit -m "feat: Set up Hono application (task-1.1)

- Create backend/src/app.ts
- Implement GET /api/health endpoint
- Add CORS and logging middleware

Task: 1.1"

# Push
git push origin feat/task-1.1-setup-hono-app
```

**⚠️ Important: git push Command Execution Rules**

Agents must follow these rules:

1. **Do not chain `git push` with `&&` to other commands**
   - ❌ Bad example: `git commit ... && git push origin main`
   - ✅ Good example: Execute separately and request user approval

2. **Always execute `git push` independently**
   ```bash
   # Step 1: Build
   npm run build
   
   # Step 2: Commit
   git add ... && git commit -m "..."
   
   # Step 3: Push (requires user approval)
   git push origin main
   ```

3. **Reason**
   - Chaining with `&&` may result in automatic approval
   - Prevents unintended pushes by user
   - Ensures final confirmation before deployment

**4. Review & Merge**
- Create Pull Request on GitHub
- Agent or team member reviews
- After approval, merge to main branch
- Delete branch

### Automated Workflow

Agents automatically execute the following:

**When starting a task:**
1. ✅ Generate branch name from task number
2. ✅ Execute `git checkout -b feat/task-X.X-<description>`
3. ✅ Start task implementation

**When completing a task:**
1. ✅ Run `make test` to verify all tests pass
2. ✅ Verify locally (as needed)
3. ✅ Commit changes (include task number)
4. ✅ Push branch
5. ✅ Create PR using GitHub MCP
6. ✅ Conduct code review
7. ✅ After approval, merge PR
8. ✅ Delete branch

**Agent Interaction Example:**
```
User: "Implement task 1.1"

Agent: 
1. Creating branch: feat/task-1.1-setup-hono-app
2. Setting up Hono application
3. Testing locally
4. Creating PR

[After implementation complete]

Agent: "Implementation complete. Shall I create a PR and review?"

User: "Please do"

Agent: "Created PR #1. Reviewing and approving."
[Review complete]

Agent: "Merged PR. Proceed to next task?"
```

### Commit Message Convention

**Language: Write in English**

**Format:**
```
<type>: <subject> (task-X.X)

<body>

Task: X.X
```

**Type:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (whitespace, formatting)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Changes to build process or tools

**Example:**
```
feat: Set up Hono application (task-1.1)

- Create backend/src/app.ts
- Implement GET /api/health endpoint
- Add CORS and logging middleware
- Verify local server starts successfully

Task: 1.1
```

### PR Creation Template

```markdown
## Overview
Task 1.1: Set up Hono application

## Changes
- Create backend/src/app.ts
- Implement GET /api/health endpoint
- Add CORS and logging middleware

## Acceptance Criteria
- [x] backend/src/app.ts is created
- [x] GET /api/health endpoint is implemented
- [x] Local server starts with npm run dev
- [x] curl http://localhost:3001/api/health returns {"status":"ok"}

## Testing
- [x] make test passes
- [x] Verified locally

## Screenshots (if applicable)
[Attach screenshots]

Task: 1.1
```

## Bug Report and Bug Fix Workflow

### ⚠️ Important: This workflow is mandatory

**Instructions for agents:**
- When a bug or issue is discovered, **always** follow this workflow
- Do not fix directly on main branch
- Do not skip Issue creation

### Bug Report Flow

**1. User reports to agent**
```
User: "Error occurs when clicking newspaper generation button"
```

**2. Agent creates GitHub Issue (mandatory)**

Agent **must** create an Issue using GitHub MCP:

```
Agent: "Creating GitHub Issue..."

[Create Issue via GitHub MCP]
- Title: "Bug: Error occurs on newspaper generation button"
- Body: Problem description, reproduction steps, expected behavior, environment info
- Label: "bug"
- Assignee: Auto-set

Issue #42 created
```

**❌ Prohibited: Skipping Issue creation**
- Do not skip Issues because "it's a small fix"
- Track all bug fixes with Issues

**3. Create fix branch (mandatory)**
```bash
# Get Issue number (e.g., #42)
ISSUE_NUMBER=42

# Create fix/ branch (mandatory)
git checkout -b fix/issue-${ISSUE_NUMBER}-newspaper-generation-error

# Or use descriptive name
git checkout -b fix/newspaper-generation-button-error
```

**❌ Prohibited: Fixing directly on main branch**
- Always create a fix branch
- Include Issue number in branch name

### Bug Fix Flow

**4. Fix work**
```bash
# Identify and fix the problem
# - Code investigation
# - Implement fix
# - Add/update tests
```

**5. Verify locally**
```bash
# Run tests
make test

# Verify with local server
cd frontend && npm run dev
# or
cd backend && npm run dev

# Manual testing
# 1. Execute reproduction steps
# 2. Verify fix works
# 3. Verify no impact on other features
```

**6. Commit and push**
```bash
# Stage changes
git add .

# Commit (include Issue number)
git commit -m "fix: Fix newspaper generation button error (#42)

- Add validation for feed selection
- Improve error handling
- Add related tests

Fixes #42"

# Push
git push origin fix/issue-42-newspaper-generation-error
```

**7. Create Pull Request**

Agent automatically creates PR using GitHub MCP:

```
Agent: "Creating Pull Request..."

[Create PR via GitHub MCP]
- Title: "fix: Fix newspaper generation button error (#42)"
- Base branch: main
- Head branch: fix/issue-42-newspaper-generation-error
- Body: Changes, fixes, test results
- Label: "bug"
- Related Issue: #42

PR #43 created
```

**8. Request GitHub Copilot review (mandatory)**

Agent requests Copilot review using GitHub MCP:

```
Agent: "Requesting GitHub Copilot review..."

[Request Copilot review via GitHub MCP]
- PR number: #43
- Automatically analyze code
- Detect potential issues
- Provide improvement suggestions

Copilot review requested
```

**8-1. Check Copilot review comments (mandatory)**

Agent retrieves and checks Copilot review comments:

```
Agent: "Checking Copilot review comments..."

[Get review comments via GitHub MCP]
- PR number: #43
- method: get_review_comments

Copilot comments:
- File: backend/src/services/rssFetcherService.ts
  Line: 195
  Comment: "Consider adding error handling for empty arrays"
  
- File: backend/src/services/rssFetcherService.ts
  Line: 200
  Comment: "This shuffle logic could be extracted to a utility function"

Agent: "Received 2 comments from Copilot. Checking if action is needed."
```

**9. Code review (Agent)**

Agent conducts code review using GitHub MCP:

```
Agent: "Conducting code review..."

[Review items]
- [x] Code quality
- [x] Test coverage
- [x] Security check
- [x] Performance impact
- [x] Documentation updates
- [x] Check Copilot review points
- [x] Evaluate response to Copilot comments

[Review via GitHub MCP]
- Check changes
- Check Copilot points
- Add comments as needed
- Approve if no issues

Review complete: APPROVED
```

**Note**: Since you cannot approve your own PR, agent skips approval and asks user for confirmation.

**10. Merge (after user approval)**

Agent merges after getting user approval:

```
Agent: "Copilot review and code review complete. May I merge?"

User: "Please do"

Agent: "Merging PR..."

[Merge via GitHub MCP]
- Merge method: Squash and merge (recommended)
- Branch deletion: Automatic

PR #43 merged
Issue #42 automatically closed
```

**❌ Prohibited: Merging without user approval**
- Always ask user "May I merge?"
- Get user approval before merging

### Commit Message Convention

**Language: Write in English**

**Format:**
```
<type>: <subject> (#issue-number)

<body>

<footer>
```

**Type:**
- `fix`: Bug fix
- `feat`: New feature
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (whitespace, formatting)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Changes to build process or tools

**Example:**
```
fix: Fix newspaper generation button error (#42)

Feed selection validation was missing, causing an error
when clicking the generate button with an empty feed list.

- Add validation for feed selection
- Improve error messages
- Add related tests

Fixes #42
```

### Branch Naming Convention

**Format:**
```
<type>/<issue-number>-<short-description>
```

**Examples:**
- `fix/42-newspaper-generation-error`
- `feat/15-bookmark-feature`
- `docs/23-update-readme`
- `refactor/31-improve-layout-algorithm`

### GitHub MCP Setup

**Prerequisites:**
- GitHub account
- GitHub Personal Access Token

**Setup Method:**

1. **Create GitHub token:**
   - GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - Required scopes:
     - `repo` (full access)
     - `workflow` (GitHub Actions management)
   - Copy token

2. **Update MCP config file:**
```json
// .kiro/settings/mcp.json
{
  "mcpServers": {
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

3. **Manage with environment variables (recommended):**
```bash
# ~/.zshrc or ~/.bashrc
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"
```

```json
// .kiro/settings/mcp.json
{
  "mcpServers": {
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

4. **Restart MCP server:**
   - Restart Kiro, or reconnect from MCP Server view

### Agent Interaction Example

**From bug report to fix:**

```
User: "Error occurs when clicking newspaper generation button"

Agent: "Confirmed the issue. First, creating GitHub Issue."
[✅ Step 1: GitHub MCP: Create Issue #42]

Agent: "Created Issue #42. Next, creating fix branch."
[✅ Step 2: Git: Create fix/issue-42-newspaper-generation-error branch]

Agent: "Identified the problem. Feed selection validation was missing. Fixing."
[✅ Step 3: Code fix, add tests]

Agent: "Verified locally. Problem is resolved."
[✅ Step 4: Run make test, manual testing]

Agent: "Committing changes and creating Pull Request."
[✅ Step 5: Git: commit & push]
[✅ Step 6: GitHub MCP: Create PR #43]

Agent: "Requesting GitHub Copilot review."
[✅ Step 7: GitHub MCP: Request Copilot review]

Agent: "Checking Copilot review comments."
[✅ Step 7-1: GitHub MCP: Get review comments]

Agent: "Received comments from Copilot. Checking content and responding."
[✅ Step 7-2: Evaluate Copilot comments]

Agent: "Conducting code review."
[✅ Step 8: GitHub MCP: Conduct review]

Agent: "Copilot review and code review complete. May I merge?"

User: "Please do"

Agent: "Merged. Issue #42 also closed."
[✅ Step 9: GitHub MCP: Merge PR #43]
```

### Workflow Checklist (for agents)

Check this checklist before starting bug fix:

- [ ] **Step 1**: Created GitHub Issue?
- [ ] **Step 2**: Created fix branch (`fix/issue-{number}-{description}`)?
- [ ] **Step 3**: Not working directly on main branch?
- [ ] **Step 4**: Included Issue number (`#42`) in commit message?
- [ ] **Step 5**: Included Issue number in PR title and body?
- [ ] **Step 6**: Included `Fixes #42` in commit message?
- [ ] **Step 7**: Requested GitHub Copilot review?
- [ ] **Step 7-1**: Retrieved Copilot review comments?
- [ ] **Step 7-2**: Checked and evaluated Copilot points?
- [ ] **Step 8**: Conducted code review?
- [ ] **Step 9**: Got user approval before merging?

**If these steps are skipped:**
- Traceability is lost
- Change history cannot be tracked
- May miss code quality issues
- Violates project standards

### Automation (Optional)

Can also automate with agent hooks:

```json
// .kiro/hooks/create-bug-fix-branch.json
{
  "name": "Create bug fix branch",
  "description": "Create bug fix branch from GitHub Issue",
  "trigger": {
    "type": "manual"
  },
  "action": {
    "type": "message",
    "message": "Please provide the Issue number for the bug fix. I will create a branch and start the bug fix."
  }
}
```

## Spec Implementation Priority

Feature implementation should proceed in the following priority order:

### 1. MVP (Highest Priority)

**Directory**: `.kiro/specs/mvp/`

MVP provides a product that works with minimal features. Includes:

- Basic UI/UX
- Core feature implementation
- Production environment deployment

**Implementation Order:**
1. Check requirements in `mvp/requirements.md`
2. Implement according to design in `mvp/design.md`
3. Verify all tests pass
4. Deploy to production environment

### 2. MyRSSPress (Next Priority)

**Directory**: `.kiro/specs/mvp/`

Feature set to implement after MVP. Includes:

- Multi-language support (Japanese/English)
- Newspaper settings and metadata
- Popular newspapers display
- Responsive design

**Implementation Order:**
1. Verify MVP is complete
2. Check requirements in `phase-2/requirements.md`
3. Implement according to design in `phase-2/design.md`
4. Deploy incrementally

**Implementation Timing:**
- After Phase 1 implementation is complete
- Adjust priorities based on user feedback

### Spec Implementation Rules

1. **Follow order**: Phase 1 → Phase 2
2. **Complete**: Fully implement each spec before moving to next
3. **Write tests**: Write tests for all requirements
4. **Update documentation**: Update tech.md, structure.md according to implementation
5. **Review**: Conduct code review upon completion of each spec

### Task Acceptance Criteria

**All tasks must include acceptance criteria**

**Acceptance Criteria Format:**
```markdown
- [ ] 1. Task name
  - Implementation description
  - **Acceptance Criteria:**
    - [ ] Criterion 1: Specific verifiable condition
    - [ ] Criterion 2: Specific verifiable condition
    - [ ] Criterion 3: Specific verifiable condition
  - _Requirements: X.X_
```

**How to write acceptance criteria:**
- **Specific**: Avoid ambiguous expressions
- **Verifiable**: Can be verified through testing or confirmation
- **Definition of done**: Task is complete when these conditions are met

**Good Example:**
```markdown
- [ ] 1.1 Set up Hono application
  - **Acceptance Criteria:**
    - [ ] `backend/src/app.ts` is created
    - [ ] `GET /api/health` endpoint is implemented
    - [ ] Local server starts with `npm run dev`
    - [ ] `curl http://localhost:3001/api/health` returns `{"status":"ok"}`
```

**Bad Example:**
```markdown
- [ ] 1.1 Set up Hono application
  - **Acceptance Criteria:**
    - [ ] Works correctly (❌ Ambiguous)
    - [ ] Write clean code (❌ Not verifiable)
```

**Acceptance Criteria Categories:**
1. **File/Code existence**: Required files are created
2. **Feature operation**: Expected results from specific operations
3. **Test passing**: All related tests pass
4. **Performance**: Meets performance requirements like response time
5. **Deployment**: Works correctly in production environment

## Agent Hooks

Create agent hooks to automate quality checks:

### Available Hooks

1. **Run unit tests** (`.kiro/hooks/run-tests.json`)
   - Command: `make test-unit`
   - Purpose: Run unit tests only
   - Trigger: Manual execution

2. **Run all tests** (`.kiro/hooks/run-all-tests.json`)
   - Command: `make test`
   - Purpose: Unit tests + security checks
   - Trigger: Auto-execute on task completion

3. **Security check** (`.kiro/hooks/pre-commit-security.json`)
   - Command: `make security-check`
   - Purpose: Check for sensitive information before commit
   - Trigger: Manual execution

4. **Setup CLI pager configuration** (`.kiro/hooks/setup-pager-config.json`)
   - Command: Add pager disable settings to `~/.zshrc`
   - Purpose: Prevent AWS CLI and Git command interruption
   - Trigger: Manual execution (run once during initial setup)

5. **Check CLI pager configuration** (`.kiro/hooks/check-pager-config.json`)
   - Command: Verify pager settings
   - Purpose: Confirm pagers are disabled correctly
   - Trigger: Manual execution

### How to Execute Hooks (for manual trigger)

**Method 1: Command Palette (Recommended)**
1. Open command palette with `Cmd + Shift + P` (macOS) or `Ctrl + Shift + P` (Windows/Linux)
2. Search for "Agent Hooks"
3. Select the hook you want to execute (e.g., "Run unit tests")

**Method 2: Agent Hooks View**
1. Open "Agent Hooks" section in sidebar
2. Click the hook you want to execute

**Method 3: Execute directly from Makefile (without using hooks)**
```bash
make test-unit          # Unit tests only
make test               # All tests
make security-check     # Security check only
```

### Hook Creation Guidelines

When creating new hooks, follow these guidelines:

- Place hook definition files in `.kiro/hooks/`
- Write in JSON format
- Use clear Japanese for `name`
- Clearly describe purpose in `description`
- Use Makefile commands for `command`
- `trigger.type` should generally be `manual` (manual execution)

These hooks keep code quality and documentation synchronized with implementation.

## Deployment and Verification

### Deployment Timing

**Principle**: Deploy proactively when deployment is possible and verify operation

**Deployment Opportunities:**
1. **When infrastructure construction is complete**
   - Deploy immediately after building infrastructure with Terraform
   - When basic configuration like Route53, Amplify, API Gateway, Lambda is ready

2. **When feature unit is complete**
   - Deploy when one feature (e.g., feed suggestion API) is complete
   - Deploy when frontend and backend can work together

3. **When bug fix is complete**
   - Deploy after fix is complete and local tests pass
   - Verify operation in production environment

**Deployment Procedure:**
```bash
# Backend deployment
cd backend
npm run build
# GitHub Actions automatically deploys to ECR + Lambda

# Frontend deployment
cd frontend
git push origin main
# Amplify automatically builds & deploys

# Infrastructure changes
cd infra/environments/production
terraform plan
terraform apply
```

**Verification:**
1. **Health check**: `https://api.my-rss-press.com/api/health`
2. **Frontend**: `https://my-rss-press.com`
3. **Feature test**: Verify by actually operating from UI
4. **Log check**: Check CloudWatch Logs for errors

### E2E Testing Policy

**Principle**: Write E2E tests for each feature unit

**E2E Tests by Feature:**
```
frontend/tests/e2e/specs/
├── newspaper/
│   ├── create-newspaper.spec.ts    # Newspaper creation flow
│   ├── view-newspaper.spec.ts      # Newspaper viewing
│   └── share-newspaper.spec.ts     # Newspaper sharing
├── feed/
│   ├── select-feeds.spec.ts        # Feed selection
│   └── suggest-feeds.spec.ts       # AI suggestions
└── home/
    ├── popular-newspapers.spec.ts  # Popular newspapers
    └── recent-newspapers.spec.ts   # Recent newspapers
```

**E2E Test Implementation Timing:**
1. **With feature implementation**: Write E2E tests when implementing features
2. **Before deployment**: Run E2E tests before deployment to verify operation
3. **Continuous addition**: Add E2E tests whenever adding new features

**E2E Test Execution:**
```bash
# Test in local environment
cd frontend
npm run test:e2e

# Test in production environment (after deployment)
BASE_URL=https://my-rss-press.com npm run test:e2e
```

**E2E Test Best Practices:**
- Make each test independently executable
- Manage test data with fixtures
- Use Page Object Model pattern
- Automatically save screenshots on failure
- Integrate into CI/CD pipeline

## Security Checks

### Overview

Check for sensitive information before commits or pushes. This prevents leakage of AWS credentials, private keys, tokens, etc.

### Tools Used

**Gitleaks** - Sensitive information detection tool
- AWS Access Key ID / Secret Access Key
- Private keys (RSA, DSA, EC)
- GitHub Token / OAuth Token
- Common password and API key patterns

### Setup

1. **Install Gitleaks:**
   ```bash
   # macOS
   brew install gitleaks
   
   # Other platforms
   # https://github.com/gitleaks/gitleaks#installing
   ```

2. **Configuration files:**
   - `.gitleaks.toml` - Detection rules and exclusion settings
   - `scripts/security-check.sh` - Check script
   - `.kiro/hooks/pre-commit-security.json` - Kiro hook configuration

### Execution Methods

**Method 1: Direct script execution**
```bash
./scripts/security-check.sh
```

**Method 2: Kiro agent hook**
1. Open command palette (Cmd/Ctrl + Shift + P)
2. Search for "Agent Hooks"
3. Execute "Security check (pre-commit)"

**Method 3: Execute from Makefile**
```bash
make security-check
```

### Check Content

Script checks the following:

1. **AWS credentials**
   - Access Key ID: `AKIA[0-9A-Z]{16}`
   - Secret Access Key: 40-character alphanumeric string

2. **Private keys**
   - `-----BEGIN PRIVATE KEY-----` pattern

3. **GitHub Token**
   - Personal Access Token: `ghp_[0-9a-zA-Z]{36}`
   - OAuth Token: `gho_[0-9a-zA-Z]{36}`

4. **Common passwords/API keys**
   - Patterns like `password=`, `api_key=`

### Exclusion Settings

The following files are automatically excluded:
- Markdown files (`.md`)
- `package-lock.json`
- `.gitleaks.toml` (configuration file itself)

### Error Response

When sensitive information is detected:

1. **Remove sensitive information from detected files**
2. **Move to environment variables**
   - `.env.local` (gitignored)
   - AWS Secrets Manager
   - Set as environment variables
3. **Add to `.gitignore` as needed**
4. **If already committed**
   - Remove from Git history (`git filter-branch` or `BFG Repo-Cleaner`)
   - Rotate credentials (invalidate and reissue)

### Best Practices

- Always run security checks before commits
- Manage sensitive information with environment variables
- Include `.env` files in `.gitignore`
- Use placeholders like `your-api-key-here` in sample code
- Manage production credentials with AWS Secrets Manager
