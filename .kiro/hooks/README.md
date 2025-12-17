# Agent Hooks

This directory contains agent automation hooks for MyRSSPress.

---

## Structure

```
.kiro/hooks/
├── common/                      # Reusable hooks (any project)
│   ├── check-pager-config.json
│   ├── disable-pagers-on-session-start.json
│   ├── pre-commit-security.json
│   ├── run-all-tests.json
│   ├── run-tests.json
│   └── setup-pager-config.json
├── myrsspress/                  # MyRSSPress-specific hooks
│   ├── commit-push-pr.json
│   ├── create-task-branch.json
│   ├── request-copilot-review.json
│   └── update-product-docs.json
└── README.md                    # This file
```

## Common Hooks (Reusable)

### Testing
- **run-tests.json** - Run unit tests manually
- **run-all-tests.json** - Run all tests (unit + security) on execution complete

### Security
- **pre-commit-security.json** - Check for sensitive information before commit

### CLI Configuration
- **disable-pagers-on-session-start.json** - Auto-disable pagers on session start
- **check-pager-config.json** - Verify pager configuration

## MyRSSPress-Specific Hooks

### Development Workflow
- **create-task-branch.json** - Create new branch from tasks.md
- **commit-push-pr.json** - Commit, push, and create PR with auto-generated content
- **request-copilot-review.json** - Request GitHub Copilot code review

### Documentation
- **update-product-docs.json** - Reminder to update product documentation

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
