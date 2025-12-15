# Postmortem: Amplify Build Failure in Monorepo Structure

## Incident Overview

Amplify build failed with "Cannot find module 'styled-jsx'" error after implementing Phase 2 features. The root cause was incorrect npm workspace dependency installation order in the monorepo structure.

**Severity:** High (Production deployment blocked)

## Timeline

### 2025-12-11 (Time in JST)

| Time | Event |
|------|-------|
| Initial | Amplify build triggered after Phase 2 implementation |
| Build Phase | Build failed with "Cannot find module 'styled-jsx'" error |
| Investigation | Identified that styled-jsx is a Next.js dependency hoisted to root node_modules |
| Root Cause | amplify.yml only ran `npm ci` in frontend directory, missing root dependencies |
| Resolution | Updated amplify.yml to run `npm ci` at root first, then in frontend |
| Verification | Build succeeded (Deployment #146+) |

## Root Cause

### Technical Cause

**npm Workspaces Dependency Hoisting:**
- MyRSSPress uses npm workspaces (monorepo structure)
- Common dependencies are "hoisted" to root `node_modules/` for efficiency
- `styled-jsx` is a Next.js dependency that was hoisted to root
- Frontend's `node_modules/` only contains frontend-specific dependencies

**Incorrect Installation Order:**
```yaml
# ❌ Bad: Only installs frontend dependencies
preBuild:
  commands:
    - cd frontend
    - npm ci
```

When only running `npm ci` in the frontend directory:
1. npm tries to install frontend dependencies
2. Looks for hoisted dependencies in root `node_modules/`
3. Root `node_modules/` doesn't exist (never ran `npm ci` at root)
4. Build fails with "Cannot find module 'styled-jsx'"

### Process Cause

- Insufficient understanding of npm workspaces dependency resolution
- amplify.yml configuration didn't account for monorepo structure
- No documentation about correct installation order in monorepo

## Impact Scope

- **Duration:** ~1 hour (investigation + fix + deployment)
- **Affected:** Production deployment pipeline
- **User Impact:** No user impact (caught before production deployment)
- **Deployments:** Multiple failed builds until fix

## Resolution

### Solution: Install Root Dependencies First

```yaml
# ✅ Good: Install root dependencies first, then frontend
preBuild:
  commands:
    - npm ci                    # 1. Install root + hoisted dependencies
    - cd frontend
    - npm ci                    # 2. Install frontend-specific dependencies
```

**Why This Works:**
1. `npm ci` at root analyzes workspace structure
2. Installs common dependencies to root `node_modules/`
3. Hoists shared dependencies (react, next, styled-jsx, etc.)
4. `npm ci` in frontend installs remaining frontend-specific dependencies
5. Frontend can now resolve both hoisted and local dependencies

### Files Changed

- `infra/modules/amplify/amplify.yml`: Updated preBuild commands
- Added cache for both root and frontend `node_modules/`

## Prevention Measures

### Documentation Updates

1. **Added to tech.md:**
   - Comprehensive monorepo structure documentation
   - Explanation of root node_modules role
   - Correct dependency installation order
   - CI/CD configuration examples

2. **Added to postmortem.md:**
   - This incident entry (2025-12-11)

### Process Improvements

1. **Makefile Commands:**
   - Document installation order in Makefile
   - Provide clear commands for developers

2. **CI/CD Best Practices:**
   - Always install root dependencies first in monorepo
   - Cache both root and workspace node_modules
   - Document workspace structure in README

### Technical Improvements

1. **Amplify Configuration:**
   ```yaml
   preBuild:
     commands:
       - npm ci                    # Root first
       - cd frontend
       - npm ci                    # Then workspace
   cache:
     paths:
       - node_modules/**/*         # Cache root
       - frontend/node_modules/**/* # Cache frontend
   ```

2. **GitHub Actions (Backend):**
   ```yaml
   - name: Install dependencies
     run: |
       npm ci                      # Root first
       cd backend
       npm ci                      # Then workspace
   ```

## Lessons Learned

### What Worked

1. ✅ **Systematic Investigation**
   - Checked Amplify build logs
   - Identified missing module
   - Traced dependency resolution path

2. ✅ **Understanding Monorepo Structure**
   - Learned about npm workspaces hoisting
   - Understood dependency resolution order
   - Applied knowledge to fix

3. ✅ **Comprehensive Documentation**
   - Added detailed monorepo documentation to tech.md
   - Explained root node_modules role
   - Provided CI/CD examples

### What Didn't Work

1. ❌ **Initial Configuration**
   - Didn't account for monorepo structure
   - Only installed frontend dependencies
   - Missed root dependency installation

2. ❌ **Lack of Documentation**
   - No documentation about monorepo setup
   - No CI/CD configuration examples
   - Developers might face same issue

### Key Takeaways

1. **Monorepo Dependency Order Matters**
   - Always install root dependencies first
   - Then install workspace dependencies
   - This order is critical for hoisting to work

2. **Document Infrastructure Patterns**
   - Monorepo structure needs clear documentation
   - CI/CD configurations should be documented
   - Provide examples for common scenarios

3. **Cache All node_modules**
   - Cache root node_modules
   - Cache each workspace's node_modules
   - Improves build performance

4. **Test CI/CD Configurations**
   - Verify builds work in CI/CD environment
   - Don't assume local setup matches CI/CD
   - Test after infrastructure changes

## References

- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v8/using-npm/workspaces)
- [AWS Amplify Build Specification](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html)
- [Next.js Monorepo Setup](https://nextjs.org/docs/advanced-features/monorepos)

## Related Files

- `infra/modules/amplify/amplify.yml`: Amplify build configuration
- `.kiro/steering/tech.md`: Monorepo documentation
- `package.json`: Root workspace configuration
- `frontend/package.json`: Frontend workspace configuration
- `backend/package.json`: Backend workspace configuration

## Action Items

- [x] Fix amplify.yml to install root dependencies first (Completed: 2025-12-11)
- [x] Add cache for root node_modules (Completed: 2025-12-11)
- [x] Document monorepo structure in tech.md (Completed: 2025-12-11)
- [x] Create postmortem documentation (Completed: 2025-12-11)
- [ ] Add monorepo setup to README.md (Due: 2025-12-12)
- [ ] Create troubleshooting guide for common monorepo issues (Due: 2025-12-15)

