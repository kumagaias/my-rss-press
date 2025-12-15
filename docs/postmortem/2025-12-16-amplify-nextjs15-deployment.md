# Postmortem: Amplify Next.js 15 Deployment Issues

## Incident Overview

Multiple Amplify deployment failures occurred when upgrading to Next.js 15 and implementing dynamic routes. The issues spanned from December 15-16, 2025, causing production site downtime.

**Severity:** High (Production site inaccessible)

## Timeline

### 2025-12-15 21:16 JST - Issue #1: Named Export Error
- **Error:** `Module has no default export`
- **File:** `frontend/app/newspapers/[id]/[date]/page.tsx`
- **Cause:** `NewspaperLayout` was exported as named export but imported as default
- **Resolution:** Changed import from `import NewspaperLayout` to `import { NewspaperLayout }`
- **Commit:** fede5c5

### 2025-12-15 21:24 JST - Issue #2: Static Export Configuration Error
- **Error:** `Page "/newspapers/[id]/[date]" is missing "generateStaticParams()"`
- **Cause:** Dynamic routes require `generateStaticParams()` when using `output: 'export'`
- **Attempted Fix:** Removed `output: 'export'` from next.config.ts
- **Commit:** 37a991d

### 2025-12-15 21:28 JST - Issue #3: Artifact Directory Not Found
- **Error:** `Artifact directory doesn't exist: frontend/out`
- **Cause:** Without `output: 'export'`, Next.js outputs to `.next` directory, not `out`
- **Resolution:** Updated amplify.yml `baseDirectory` from `frontend/out` to `frontend/.next`
- **Commit:** 3a9821f

### 2025-12-15 21:45 JST - Issue #4: Site Returns 404
- **Error:** `HTTP/2 404` on https://www.my-rss-press.com/
- **Cause:** Amplify platform was `WEB` (static hosting), but Next.js was in SSR mode
- **Attempted Fix:** Changed platform to `WEB_COMPUTE` for SSR support
- **Commit:** 2d1d9d9

### 2025-12-15 21:55 JST - Issue #5: Deploy Manifest Missing
- **Error:** `Failed to find the deploy-manifest.json file`
- **Cause:** `WEB_COMPUTE` requires `@aws-amplify/adapter-nextjs` for Next.js SSR
- **Decision:** SSR is unnecessary complexity for our use case
- **Final Resolution:** Reverted to static export with `generateStaticParams()`
- **Commit:** 29c1969

## Root Causes

### Technical Causes

1. **Next.js 15 Breaking Changes**
   - Dynamic route params changed to async (Promise type)
   - Static export requires explicit `generateStaticParams()` for dynamic routes

2. **Amplify Platform Confusion**
   - `WEB` platform: Static hosting (requires `output: 'export'`)
   - `WEB_COMPUTE` platform: SSR/ISR support (requires adapter)
   - Mismatch between platform and Next.js configuration caused failures

3. **Build Output Directory Mismatch**
   - Static export: outputs to `out/` directory
   - SSR mode: outputs to `.next/` directory
   - amplify.yml `baseDirectory` must match the output location

### Process Causes

1. **Insufficient Understanding of Amplify Platforms**
   - Did not initially understand the difference between `WEB` and `WEB_COMPUTE`
   - Attempted SSR without understanding adapter requirements

2. **Incremental Fixes Without Full Context**
   - Fixed issues one by one without understanding the full picture
   - Led to multiple deployment attempts and extended downtime

3. **Skipped Local Build Testing**
   - First few attempts pushed code without running `npm run build` locally
   - Local build would have caught the same errors immediately
   - Only started testing locally after multiple failures

## Impact Scope

- **Duration:** ~2 hours (21:16 - 23:04 JST)
- **Affected:** Production site (https://www.my-rss-press.com/)
- **User Impact:** Site completely inaccessible (404 errors)
- **Deployments:** 5 failed deployments (#151-155)

## Resolution

### Final Solution: Static Export with generateStaticParams

```typescript
// frontend/next.config.ts
const nextConfig: NextConfig = {
  output: 'export',  // Static export
  images: {
    unoptimized: true,  // Required for static export
  },
};

// frontend/app/newspapers/[id]/[date]/page.tsx
export function generateStaticParams() {
  return [];  // Generate pages on-demand
}
```

```yaml
# infra/modules/amplify/amplify.yml
artifacts:
  baseDirectory: frontend/out  # Static export output
```

```hcl
# infra/modules/amplify/main.tf
resource "aws_amplify_app" "main" {
  platform = "WEB"  # Static hosting (default)
  
  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"  # SPA routing
  }
}
```

### Why This Solution Works

1. **Static Export is Sufficient**
   - Our app is primarily client-side rendered
   - Dynamic routes can be generated on-demand
   - No need for server-side rendering complexity

2. **Simpler Architecture**
   - No adapter required
   - Standard Amplify static hosting
   - Faster builds and deployments

3. **Cost Effective**
   - `WEB` platform is cheaper than `WEB_COMPUTE`
   - No Lambda@Edge costs

## Prevention Measures

### Documentation Updates

1. **Added to tech.md:**
   - Amplify platform types (`WEB` vs `WEB_COMPUTE`)
   - Next.js 15 static export requirements
   - Dynamic route configuration with `generateStaticParams()`

2. **Added to postmortem.md:**
   - This incident summary
   - Lessons learned

### Process Improvements

1. **Deployment Strategy**
   - Test builds locally before pushing to production
   - Use `next build` to verify output directory
   - Check Amplify console for detailed error logs

2. **Architecture Decisions**
   - Document why we chose static export over SSR
   - Evaluate complexity vs. benefits before major changes
   - Prefer simpler solutions when they meet requirements

### Technical Improvements

1. **Local Testing**
   ```bash
   # Test static export locally
   cd frontend
   npm run build
   ls -la out/  # Verify output directory exists
   ```

2. **Amplify Configuration Validation**
   - Verify `baseDirectory` matches Next.js output
   - Ensure platform type matches hosting mode
   - Test custom rules for SPA routing

## Lessons Learned

### What Worked

1. ✅ **Systematic Debugging**
   - Checked Amplify logs via AWS CLI
   - Identified each error sequentially
   - Documented each fix attempt

2. ✅ **Reverting to Simpler Solution**
   - Recognized SSR was unnecessary complexity
   - Chose static export as the right solution
   - Avoided over-engineering

3. ✅ **Infrastructure as Code**
   - Terraform made it easy to revert platform changes
   - Version control tracked all configuration changes

### What Didn't Work

1. ❌ **Removing `output: 'export'` Without Understanding**
   - Caused cascade of issues
   - Should have added `generateStaticParams()` first

2. ❌ **Attempting SSR Without Adapter**
   - `WEB_COMPUTE` requires `@aws-amplify/adapter-nextjs`
   - Didn't research requirements before attempting

3. ❌ **Not Testing Locally First**
   - Pushed code without running `npm run build` locally
   - Local build would have caught named export and generateStaticParams errors immediately
   - Only started local testing after multiple production failures

### Key Takeaways

1. **Always Test Locally Before Deploying**
   - **CRITICAL**: Run `npm run build` locally before every push
   - Catches build errors immediately (named export, generateStaticParams, etc.)
   - Verifies output directory structure
   - Prevents production deployment failures

2. **Understand Platform Requirements**
   - Know the difference between Amplify platforms (`WEB` vs `WEB_COMPUTE`)
   - Match Next.js configuration to platform capabilities
   - Research requirements before attempting major changes (SSR, adapters, etc.)

3. **Prefer Simplicity**
   - Static export is sufficient for most SPAs
   - SSR adds complexity without clear benefits for our use case
   - Query parameters simpler than dynamic routes for user-generated content

4. **Document Architecture Decisions**
   - Why we chose static export over SSR
   - Why we chose query parameters over dynamic routes
   - Trade-offs and requirements for each approach

## References

- [Next.js 15 Documentation - Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [AWS Amplify Hosting - Platform Types](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- [Next.js Dynamic Routes - generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)

## Related Commits

- fede5c5: Fix named export import
- 37a991d: Remove static export config (mistake)
- 3a9821f: Update baseDirectory to .next
- 2d1d9d9: Enable WEB_COMPUTE platform (mistake)
- 29c1969: Revert to static export (final fix)
