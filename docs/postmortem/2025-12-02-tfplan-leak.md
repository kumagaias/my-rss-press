# Terraform tfplan File Committed with Sensitive Data - 2025-12-02

## Incident Summary

**Date**: 2025-12-02  
**Severity**: High  
**Status**: Resolved  
**Duration**: ~15 minutes  

A Terraform plan file (`tfplan`) containing potentially sensitive information was committed to the Git repository and pushed to GitHub. The file was detected by GitHub's secret scanning, which revoked a GitHub Personal Access Token (PAT) found in the commit.

## Timeline

| Time | Event |
|------|-------|
| 09:25 | tfplan file created during Terraform planning |
| 09:57 | Commit `444ff8e` included tfplan file |
| 10:00 | GitHub detected PAT in commit and revoked it |
| 10:02 | Incident reported by user |
| 10:03 | tfplan file removed from Git and added to .gitignore |
| 10:05 | Git history cleaned with `git filter-branch` |
| 10:05 | Force push to remove tfplan from GitHub remote |
| 10:09 | Gitleaks configuration improved |
| 10:10 | Incident resolved |

## Root Cause

### Technical Cause
- Terraform plan files (`tfplan`) are binary files that can contain sensitive information including secrets, tokens, and resource configurations
- The file was not excluded in `.gitignore` initially
- tfplan files were not explicitly excluded in `.gitleaks.toml`

### Process Cause
- Gitleaks security check used `--staged` flag only, which checks staged files but not committed files
- No validation to prevent binary Terraform files from being committed
- Lack of awareness about tfplan file sensitivity

## Impact

### User Impact
- No direct user impact (development phase)
- GitHub PAT was automatically revoked by GitHub

### System Impact
- Sensitive Terraform plan data was briefly exposed in Git history
- GitHub PAT needed to be regenerated
- Git history required rewriting (force push)

## Resolution

### Immediate Actions
1. Removed tfplan file from Git: `git rm infra/environments/production/tfplan`
2. Added tfplan patterns to `.gitignore`
3. Cleaned Git history with `git filter-branch`
4. Force pushed to remove file from GitHub remote
5. Verified no PAT remained in Git history

### Long-term Fix
- Updated `.gitignore` to exclude `tfplan` and `*.tfplan`
- Updated `.gitleaks.toml` to exclude tfplan files from scanning
- Improved security check script to scan latest commit, not just staged files

## Prevention

### Action Items
- [x] Add tfplan to .gitignore (Completed: 2025-12-02)
- [x] Add tfplan to .gitleaks.toml allowlist (Completed: 2025-12-02)
- [x] Improve gitleaks check to scan commits (Completed: 2025-12-02)
- [ ] Document Terraform workflow in tech.md (Due: 2025-12-03)
- [ ] Add pre-commit hook to block binary files (Due: 2025-12-05)

### Process Improvements
- Always run `terraform plan -out=tfplan` and delete tfplan immediately after review
- Never commit Terraform plan files
- Review `.gitignore` before working with new tools

### Tool Improvements
- Enhanced `scripts/security-check.sh`:
  - Added `gitleaks detect --log-opts="-1"` to check latest commit
  - Improved error messages with remediation steps
- Updated `.gitleaks.toml`:
  - Added tfplan patterns to allowlist
  - Added node_modules to reduce false positives

### Documentation Updates
- Created postmortem documentation structure
- Added `.kiro/steering/postmortem.md` with guidelines
- Updated `docs/postmortem/README.md` with incident index

## Lessons Learned

- Gitleaks `--staged` flag is insufficient; must also check committed files
- Binary files from infrastructure tools (Terraform, etc.) should be explicitly excluded
- GitHub's secret scanning is effective but reactive; proactive prevention is better
- Git history rewriting (force push) should be done immediately when sensitive data is committed

## Related Documents

- Commit: `444ff8e` (original commit with tfplan)
- Commit: `5ee3a16` → `0eae2e1` (removal and cleanup)
- Commit: `af797f1` (improved security checks)
- [.gitignore](../../infra/.gitignore)
- [.gitleaks.toml](../../.gitleaks.toml)
- [security-check.sh](../../scripts/security-check.sh)
