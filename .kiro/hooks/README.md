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
│   │   └── start-kiro.sh      # Kiro startup wrapper (loads .env, disables pagers)
│   ├── check-pager-config.json
│   ├── commit-push-pr.json
│   ├── documentation-update-reminder.json
│   ├── pre-commit-security.json
│   ├── run-all-tests.json
│   ├── run-tests.json
│   └── setup-git-hooks.json
└── README.md                    # This file
```

## Common Hooks (Reusable)

### Testing
- **run-tests.json** - Run unit tests manually
- **run-all-tests.json** - Run all tests (unit + security) on execution complete

### Security
- **pre-commit-security.json** - Check for sensitive information before commit

### CLI Configuration
- **check-pager-config.json** - Verify pager configuration (manual check)

### Project Setup
- **setup-git-hooks.json** - Create symbolic link from .husky to .kiro/hooks/common/.husky

### Documentation
- **documentation-update-reminder.json** - Remind to update docs on execution complete

### Development Workflow
- **commit-push-pr.json** - Commit, push, and create PR with auto-generated content

## Kiro Startup Wrapper Script

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

**Note:** The wrapper script handles both pager configuration and environment variables, so you don't need separate hooks for these tasks.

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
