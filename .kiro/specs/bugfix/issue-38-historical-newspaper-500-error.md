# Bug Report #38: Historical Newspaper API Returns 500 Error

**Date**: 2025-12-17  
**Status**: Open  
**Severity**: High  
**Component**: Backend API (Historical Newspaper)  
**GitHub Issue**: https://github.com/kumagaias/my-rss-press/issues/38

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

## Investigation Needed

- [ ] Check CloudWatch logs for Lambda function errors
- [ ] Verify date format validation in route handler
- [ ] Check DynamoDB query structure for historical newspapers
- [ ] Review error handling in `historicalNewspaperService.ts`
- [ ] Test with various date formats and edge cases
- [ ] Verify newspaper ID exists in database

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

## Next Steps

1. Create GitHub Issue
2. Check CloudWatch logs for detailed error
3. Add comprehensive error handling
4. Add input validation for date parameter
5. Add unit tests for edge cases
6. Deploy fix and verify

---

**Related Documentation**:
- Phase 2 Design: `.kiro/specs/phase-2/design.md` (Historical Newspapers)
- API Routes: `backend/src/routes/newspapers.ts`
- Service: `backend/src/services/historicalNewspaperService.ts`
