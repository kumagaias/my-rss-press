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

## Phase 2: Service Layer

- [ ] Create `feedUsageService.ts`
  - [ ] `recordFeedUsage()` - Wrapper with error handling
  - [ ] `getPopularFeeds()` - Get popular feeds with filtering
  - [ ] `getFeedStats()` - Get statistics for a feed
- [ ] Add caching
  - [ ] Cache popular feeds (5-minute TTL)
  - [ ] Cache key: `popular_feeds:{categoryId}`
- [ ] Add logging
  - [ ] Log successful recordings
  - [ ] Log errors (don't throw)

## Phase 3: Integration

### A. Newspaper Service
- [ ] Import `feedUsageService`
- [ ] After newspaper generation:
  - [ ] Get category from theme
  - [ ] For each feed used:
    - [ ] Record usage (async, fire-and-forget)
    - [ ] Pass article count and success status
- [ ] Handle errors gracefully
  - [ ] Log errors
  - [ ] Don't fail newspaper generation

### B. Bedrock Service
- [ ] Import `feedUsageService`
- [ ] In `suggestFeeds()`:
  - [ ] Get popular feeds for category
  - [ ] Merge with Bedrock suggestions
  - [ ] Prioritize: Popular > Bedrock > Category > Default
  - [ ] Deduplicate by URL
- [ ] Add logging
  - [ ] Log popular feed count
  - [ ] Log merge results

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
