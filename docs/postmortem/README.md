# Postmortem Documentation

This directory contains postmortem reports for incidents and issues that occurred during the development and operation of MyRSSPress.

## Purpose

Postmortem reports help us:
- Learn from mistakes and prevent recurrence
- Document root causes and remediation steps
- Improve our development processes and security practices
- Share knowledge across the team

## Structure

Each postmortem follows a standardized format:
- **Incident Summary**: Brief description of what happened
- **Timeline**: Chronological sequence of events
- **Root Cause**: Why the incident occurred
- **Impact**: What was affected
- **Resolution**: How the issue was fixed
- **Action Items**: Steps to prevent future occurrences

## Postmortem Index

| Date | Title | Severity | Status |
|------|-------|----------|--------|
| 2025-12-02 | [Terraform tfplan file committed with sensitive data](2025-12-02-tfplan-leak.md) | High | Resolved |

## Guidelines

For detailed guidelines on writing and managing postmortems, see [.kiro/steering/postmortem.md](../../.kiro/steering/postmortem.md).

## Template

Use [TEMPLATE.md](TEMPLATE.md) as a starting point for new postmortem reports.
