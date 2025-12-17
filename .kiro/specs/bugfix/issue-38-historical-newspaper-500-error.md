# Bug Report #38: Historical Newspaper API Returns 500 Error

**Date**: 2025-12-17  
**Status**: In Progress  
**Severity**: High  
**Component**: Backend API (Historical Newspaper)  
**GitHub Issue**: https://github.com/kumagaias/my-rss-press/issues/38  
**Pull Request**: https://github.com/kumagaias/my-rss-press/pull/39

---

## Summary

The historical newspaper API endpoint returns a 500 Internal Server Error when attempting to retrieve a newspaper for a specific date.

## Error Details

```
Request URL: https://api.my-rss-press.com/api/newspapers/zipmbuMQdFfJyYwi4bu87/2025-12-17
Request Method: GET
Status Code: 500 Internal Server Error
Remote Address: 35.73.140.100:443
```

**Browser Console Error**:
```
page-4f1c31ed0b894bda.js:1  GET https://api.my-rss-press.com/api/newspapers/zipmbuMQdFfJyYwi4bu87/2025-12-17 500 (Internal Server Error)
```

## Reproduction Steps

1. Access a newspaper page with a specific date parameter
2. Navigate to: `/newspaper?id=zipmbuMQdFfJyYwi4bu87&date=2025-12-17`
3. Frontend makes GET request to: `/api/newspapers/{newspaperId}/{date}`
4. API returns 500 error

## Expected Behavior

- API should return the historical newspaper data for the specified date
- If newspaper doesn't exist for that date, should return 404 with appropriate error message
- Should never return 500 unless there's an actual server error

## Actual Behavior

- API returns 500 Internal Server Error
- No error details visible to client
- User sees error state in UI

## Affected Endpoint

```
GET /api/newspapers/{newspaperId}/{date}
```

**Implementation**: `backend/src/routes/newspapers.ts`  
**Service**: `backend/src/services/historicalNewspaperService.ts`

## Possible Causes

1. **Date format mismatch**: Date parameter might not be in expected format (YYYY-MM-DD)
2. **DynamoDB query error**: Issue with querying historical newspapers by date
3. **Missing error handling**: Unhandled exception in service layer
4. **Data validation**: Invalid newspaper ID or date causing unhandled error
5. **Timezone issue**: JST date conversion causing unexpected behavior

## Investigation Completed

- [x] Check CloudWatch logs for Lambda function errors
- [x] Verify date format validation in route handler
- [x] Check DynamoDB query structure for historical newspapers
- [x] Review error handling in `historicalNewspaperService.ts`
- [x] Test with various date formats and edge cases
- [x] Verify newspaper ID exists in database

## Root Cause

The issue was caused by insufficient error handling in the route handler (`backend/src/routes/newspapers.ts`):

1. **Missing validation**: No check for `metadata.feedUrls` existence before passing to service
2. **Poor error logging**: Generic error messages without detailed context
3. **Unclear error responses**: 500 errors returned for various failure scenarios without specific error codes

When a newspaper metadata was missing `feedUrls` or the field was empty, the service would fail with an unhandled error, resulting in a 500 response.

## Related Code

**Route Handler** (`backend/src/routes/newspapers.ts`):
```typescript
// GET /api/newspapers/:newspaperId/:date
app.get('/api/newspapers/:newspaperId/:date', async (c) => {
  // Implementation here
});
```

**Service** (`backend/src/services/historicalNewspaperService.ts`):
```typescript
export async function getHistoricalNewspaper(
  newspaperId: string,
  date: string
): Promise<Newspaper | null>
```

## Impact

- **User Experience**: Users cannot view historical newspapers
- **Feature**: Date navigation feature is broken
- **Scope**: Affects all users trying to access newspapers by date

## Priority

**High** - Core feature (date navigation) is non-functional

## Fix Implementation

### Changes Made

1. **Enhanced error handling in route handler** (`backend/src/routes/newspapers.ts`):
   - Added validation for `metadata.feedUrls` existence
   - Added detailed error logging with context (newspaperId, date, stack trace)
   - Added specific error codes for different failure scenarios:
     - `NEWSPAPER_NOT_FOUND` (404)
     - `INVALID_NEWSPAPER_CONFIG` (500)
     - `FUTURE_DATE` (400)
     - `DATE_TOO_OLD` (400)
     - `INVALID_DATE` (400)
     - `INSUFFICIENT_ARTICLES` (400)
     - `INTERNAL_ERROR` (500)

2. **Improved logging**:
   - Log newspaper ID and date at request start
   - Log success/failure with context
   - Include error stack traces for debugging

### Testing

- [x] Existing unit tests pass (historicalNewspaperService.test.ts)
- [x] Date validation tests pass (8/8)
- [ ] Manual testing with production data
- [ ] Verify CloudWatch logs show detailed error information

---

**Related Documentation**:
- Phase 2 Design: `.kiro/specs/phase-2/design.md` (Historical Newspapers)
- API Routes: `backend/src/routes/newspapers.ts`
- Service: `backend/src/services/historicalNewspaperService.ts`
