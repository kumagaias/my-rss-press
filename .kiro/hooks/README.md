# Agent Hooks

This directory contains agent automation hooks for MyRSSPress.

---

## Structure

```
.kiro/hooks/
├── common/                      # Reusable hooks (any project)
│   ├── .husky/                 # Git hooks (source of truth)
│   │   ├── _/
│   │   ├── pre-commit
│   │   └── pre-push
│   ├── scripts/                # Shared scripts
│   │   ├── security-check.sh
│   │   ├── setup-git-hooks.sh # One-time Git hooks setup
│   │   └── start-kiro.sh      # Kiro startup wrapper (loads .env, disables pagers)
│   ├── commit-push-pr.json
│   ├── documentation-update-reminder.json
│   ├── pre-commit-security.json
│   ├── run-all-tests.json
│   ├── run-tests.json
│   └── setup-on-session-start.json
└── README.md                    # This file
```

## Common Hooks (Reusable)

### Testing
- **run-tests.json** - Run unit tests manually
- **run-all-tests.json** - Run all tests (unit + security) on execution complete

### Security
- **pre-commit-security.json** - Check for sensitive information before commit

### Session Setup
- **setup-on-session-start.json** - Auto-configure environment on session start (pagers, etc.)

### Documentation
- **documentation-update-reminder.json** - Remind to update docs on execution complete

### Development Workflow
- **commit-push-pr.json** - Commit, push, and create PR with auto-generated content

## Project Setup Scripts

### One-Time Setup: Git Hooks

Run once when setting up the project:

```bash
./.kiro/hooks/common/scripts/setup-git-hooks.sh
```

**What it does:**
- Creates symbolic link from `.husky` to `.kiro/hooks/common/.husky`
- Enables pre-commit and pre-push security checks

### Kiro Startup Wrapper (Optional)

For optimal Kiro experience, use the startup wrapper script:

```bash
./.kiro/hooks/common/scripts/start-kiro.sh
```

**What it does:**
- Disables CLI pagers (AWS_PAGER, GIT_PAGER) to prevent command interruption
- Loads environment variables from `.env` for MCP servers (e.g., GitHub MCP)

**Setup:**
1. Copy `.env.example` to `.env` (if using MCP servers)
2. Fill in your credentials
3. Start Kiro with `./.kiro/hooks/common/scripts/start-kiro.sh`

**Note:** Environment setup is also handled automatically by the `setup-on-session-start.json` hook.

## Usage

### Via Command Palette
1. Open Command Palette (Cmd+Shift+P)
2. Search "Agent Hooks"
3. Select hook to execute

### Via Chat
Ask the agent to run a specific hook:
```
Run the "Run Unit Tests" hook
```

## Hook Types

### Trigger Types
- **manual** - Execute manually via Command Palette or chat
- **onExecutionComplete** - Auto-execute when agent execution completes
- **onSessionCreate** - Auto-execute when new session starts

### Action Types
- **message** - Send message to agent
- **command** - Execute shell command
- **shell** - Execute shell command (alias for command)

## Creating New Hooks

### Common Hook (Reusable)
Place in `common/` if the hook:
- Can be used in any project
- Has no project-specific dependencies
- Implements general best practices

### Project-Specific Hook
Place in `myrsspress/` if the hook:
- References MyRSSPress-specific files or paths
- Implements MyRSSPress-specific workflows
- Uses project-specific conventions

## Related Documentation

- **Steering**: `.kiro/steering/` - Development guidelines
- **Specs**: `.kiro/specs/` - Feature specifications

---

**Questions?** Check the relevant hook file or ask the team.
