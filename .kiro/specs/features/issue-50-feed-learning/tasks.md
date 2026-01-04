# Feed Usage Tracking - Tasks

**Issue**: #50  
**Phase**: 3.5

## Phase 1: Data Layer ✅

- [x] Add type definitions
  - [x] `FeedUsage` interface
  - [x] `RecordFeedUsageInput` interface
  - [x] `CreateFeedUsageInput` type
- [x] Create `feedUsageRepository.ts`
  - [x] `recordFeedUsage()` - Upsert with statistics
  - [x] `getFeedUsage()` - Get specific usage
  - [x] `getPopularFeedsByCategory()` - Query top feeds
- [x] Commit and push Phase 1

## Phase 2: Service Layer ✅

- [x] Create `feedUsageService.ts`
  - [x] `recordFeedUsage()` - Wrapper with error handling
  - [x] `getPopularFeeds()` - Get popular feeds with filtering
  - [x] `getFeedStats()` - Get statistics for a feed
- [x] Add caching
  - [x] Cache popular feeds (5-minute TTL)
  - [x] Cache key: `popular_feeds:{categoryId}`
- [x] Add logging
  - [x] Log successful recordings
  - [x] Log errors (don't throw)
- [x] Commit and push Phase 2

## Phase 3: Integration ✅

### A. Newspaper Service
- [x] Import `feedUsageService`
- [x] After newspaper generation:
  - [x] Get category from theme
  - [x] For each feed used:
    - [x] Record usage (async, fire-and-forget)
    - [x] Pass article count and success status
- [x] Handle errors gracefully
  - [x] Log errors
  - [x] Don't fail newspaper generation

### B. Bedrock Service
- [x] Import `feedUsageService`
- [x] In `suggestFeeds()`:
  - [x] Get popular feeds for category
  - [x] Merge with Bedrock suggestions
  - [x] Prioritize: Popular > Bedrock > Category > Default
  - [x] Deduplicate by URL
- [x] Add logging
  - [x] Log popular feed count
  - [x] Log merge results
- [x] Commit and push Phase 3

## Phase 4: Testing

### Unit Tests
- [ ] `feedUsageRepository.test.ts`
  - [ ] Test `recordFeedUsage()` - create new
  - [ ] Test `recordFeedUsage()` - update existing
  - [ ] Test statistics calculation
  - [ ] Test `getFeedUsage()`
  - [ ] Test `getPopularFeedsByCategory()`
- [ ] `feedUsageService.test.ts`
  - [ ] Test error handling
  - [ ] Test caching
  - [ ] Test logging

### Integration Tests
- [ ] Test newspaper generation records usage
- [ ] Test feed suggestions use popular feeds
- [ ] Test end-to-end flow

## Phase 5: Monitoring

- [ ] Add CloudWatch metrics
  - [ ] `FeedUsage.RecordCount`
  - [ ] `FeedUsage.RecordErrors`
  - [ ] `FeedUsage.QueryLatency`
  - [ ] `FeedUsage.CacheHitRate`
- [ ] Add structured logging
- [ ] Create CloudWatch dashboard

## Deployment

- [ ] Review and test locally
- [ ] Create PR
- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Verify usage tracking works

## Verification

- [ ] Generate test newspaper
- [ ] Check DynamoDB for usage records
- [ ] Generate another newspaper with same theme
- [ ] Verify popular feeds appear in suggestions
- [ ] Check CloudWatch logs
- [ ] Verify no performance impact

## Estimated Time

- Phase 1: ✅ Complete (1 hour)
- Phase 2: 2 hours
- Phase 3: 3 hours
- Phase 4: 4 hours
- Phase 5: 2 hours
- **Total**: ~12 hours (1.5 days)
