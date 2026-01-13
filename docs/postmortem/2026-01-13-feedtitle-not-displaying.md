# Postmortem: feedTitle Not Displaying in Newspaper Articles

**Date:** 2026-01-13  
**Severity:** Medium  
**Status:** Resolved  
**Related PR:** #75

## Summary

After deploying PR #70, the `feedTitle` field (RSS feed source name) was not displaying in newspaper articles, even though the field was correctly set in the backend code.

## Timeline (JST)

- **14:00** - PR #70 merged and deployed
- **15:00** - User reported feedTitle not displaying in newspaper articles
- **15:10** - Confirmed issue: API response missing `feedTitle` field
- **15:20** - Investigation: Backend code showed correct feedTitle assignment
- **15:30** - Added debug logs to track feedTitle through the pipeline
- **15:40** - Debug logs confirmed feedTitle was set correctly in rssFetcherService
- **15:50** - **Root cause identified:** `ArticleSchema` in Zod validation was missing `feedTitle` and `feedSource` fields
- **16:00** - Fix deployed: Added missing fields to ArticleSchema

## Root Cause

The `ArticleSchema` Zod validation schema in `backend/src/routes/newspapers.ts` was missing the `feedTitle` and `feedSource` fields. When articles were validated before saving to DynamoDB, Zod stripped out any fields not defined in the schema, causing `feedTitle` to be removed.

**Code location:**
```typescript
// Before (missing fields)
const ArticleSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string().url(),
  pubDate: z.string(),
  imageUrl: z.string().url().optional(),
  importance: z.number(),
});

// After (fixed)
const ArticleSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string().url(),
  pubDate: z.string(),
  imageUrl: z.string().url().optional(),
  importance: z.number(),
  feedSource: z.string().optional(),
  feedTitle: z.string().optional(),
});
```

## Impact

- **User Impact:** Medium - Users could not see which RSS feed each article came from
- **Duration:** ~2 hours (from deployment to fix)
- **Affected Features:** Newspaper article display (feedTitle missing)

## Resolution

1. Added `feedTitle` and `feedSource` fields to `ArticleSchema` in `backend/src/routes/newspapers.ts`
2. Removed debug logs added during investigation
3. Deployed fix via PR #75

## Lessons Learned

### What Went Well

- Debug logs quickly confirmed feedTitle was being set correctly in the service layer
- Issue was isolated to validation layer within 30 minutes
- Fix was straightforward once root cause was identified

### What Could Be Improved

1. **Schema Validation Coverage:** Zod schemas should be kept in sync with TypeScript interfaces
2. **Testing:** Add integration tests that verify all Article interface fields are preserved through the API
3. **Code Review:** Check that validation schemas match interface definitions

## Action Items

- [ ] Add integration test for feedTitle field preservation (Issue #76)
- [ ] Review all Zod schemas to ensure they match TypeScript interfaces
- [ ] Consider using `zod-to-ts` or similar tools to generate schemas from interfaces

## Related Documents

- [Article Interface Definition](../../backend/src/models/newspaper.ts)
- [RSS Fetcher Service](../../backend/src/services/rssFetcherService.ts)
- [Newspaper Routes](../../backend/src/routes/newspapers.ts)
