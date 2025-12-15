# Postmortem Guidelines

## Overview

A postmortem is a document that records the causes and countermeasures when an incident or problem occurs.

## Purpose

- Prevent recurrence of the same problem
- Share knowledge across the team
- Improve processes and tools
- Maintain transparency and promote learning culture

## Events to Record

Create a postmortem when the following events occur:

1. **Security Incidents**
   - Sensitive information leakage
   - Incorrect commit of credentials
   - Security check failures

2. **Production Environment Failures**
   - Service downtime
   - Data loss
   - Performance degradation

3. **Critical Bugs**
   - Bugs affecting users
   - Data consistency issues
   - Deployment failures

4. **Process Issues**
   - Tool misuse
   - Problems due to insufficient documentation
   - Communication failures

## Postmortem Structure

### 1. Incident Overview
- What happened (concisely in 1-2 sentences)
- When it occurred
- Severity (High/Medium/Low)

### 2. Timeline
- Chronological order from occurrence to resolution
- Actions taken at each step

### 3. Root Cause
- Why the problem occurred
- Technical causes
- Process causes

### 4. Impact Scope
- What was affected
- Impact on users
- Impact on system

### 5. Resolution
- How the problem was resolved
- Actions taken

### 6. Prevention Measures
- Measures to prevent the same problem in the future
- Process improvements
- Tool improvements
- Documentation updates

## Creation Procedure

1. **Use Template**
   ```bash
   cp docs/postmortem/TEMPLATE.md docs/postmortem/YYYY-MM-DD-{{title}}.md
   ```

2. **Fill in Content**
   - Record facts accurately
   - Write concisely (avoid verbose explanations)
   - Describe specific countermeasures

3. **Update README**
   - Add to index in `docs/postmortem/README.md`

4. **Commit**
   ```bash
   git add docs/postmortem/
   git commit -m "docs: Add postmortem for [incident]"
   ```

## Best Practices

- **Don't blame**: Focus on system and process improvements, not blaming individuals
- **Be concise**: Avoid long text, clarify key points
- **Be specific**: Describe specific facts and countermeasures, not vague expressions
- **Be timely**: Create as soon as possible after incident resolution
- **Share**: Read and share learnings across the team

## Past Incidents (Lessons Learned)

### 2025-12-02: Terraform tfplan Leakage
- **Cause**: Committed tfplan file, gitleaks only checked `--staged`, not after commit
- **Countermeasure**: Added tfplan to .gitignore, gitleaks now checks latest commit too
- **Lesson**: Explicitly exclude binary files, run security checks after commits too

### 2025-12-11: Amplify Build Failure in Monorepo
- **Cause**: amplify.yml only ran `npm ci` in frontend directory, missing root workspace dependencies
- **Error**: `Cannot find module 'styled-jsx'` - Next.js dependency not resolved
- **Countermeasure**: Updated amplify.yml to run `npm ci` at root first, then in frontend
- **Lesson**: In monorepo (npm workspaces), always install root dependencies before workspace dependencies

Details: Refer to `docs/postmortem/` directory
