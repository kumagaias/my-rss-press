# Tasks Document - Issue #75: Default Feed Management

## Overview

This document outlines the implementation tasks for centralizing default feed management in MyRSSPress. Tasks are organized by phase and include acceptance criteria, implementation details, and testing requirements.

**Related Documents:**
- [Requirements Document](./requirements.md)
- [Design Document](./design.md)
- [Issue #75](https://github.com/kumagaias/my-rss-press/issues/75)

## Task Breakdown

### Phase 1: Backend Foundation (Default Feed Service)

#### Task 1.1: Create Default Feed Service

**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Description:** Create centralized service for managing default feeds

**Implementation:**
1. Create `backend/src/services/defaultFeedService.ts`
2. Define `DefaultFeed` interface
3. Define default feeds for EN and JP locales
4. Implement `getDefaultFeeds(locale)` function
5. Implement `isDefaultFeed(url)` function
6. Implement `fetchDefaultFeedArticles(locale, date?, limit?)` function
7. Implement date filtering logic (JST timezone)
8. Implement image extraction logic
9. Add error handling and logging

**Acceptance Criteria:**
- [ ] Service exports all required functions
- [ ] Default feeds defined for EN (4 feeds) and JP (4 feeds)
- [ ] `getDefaultFeeds()` returns correct feeds for locale
- [ ] `isDefaultFeed()` correctly identifies default feed URLs
- [ ] `fetchDefaultFeedArticles()` fetches articles with date filtering
- [ ] Articles limited to specified count per feed (default: 2)
- [ ] Date filtering works in JST timezone
- [ ] Parallel fetching implemented with Promise.all
- [ ] Individual feed failures don't affect other feeds
- [ ] All errors logged to console

**Files:**
- `backend/src/services/defaultFeedService.ts` (new)

**Testing:**
- Unit tests for all exported functions
- Test date filtering logic
- Test error handling
- Test parallel fetching

---

#### Task 1.2: Create Default Feed API Route

**Priority:** High  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 1.1

**Description:** Create API endpoint for fetching default feed articles

**Implementation:**
1. Create `backend/src/routes/defaultFeeds.ts`
2. Define query parameter schema with Zod
3. Implement GET `/api/default-feeds` endpoint
4. Add input validation (locale, date)
5. Add date range validation (not future, not > 7 days old)
6. Call `fetchDefaultFeedArticles()` service
7. Return JSON response with articles, totalFeeds, successfulFeeds
8. Add error handling (400 for validation, 500 for server errors)
9. Register route in `backend/src/app.ts`

**Acceptance Criteria:**
- [ ] Route registered at `/api/default-feeds`
- [ ] Accepts `locale` query parameter (required, 'en' | 'ja')
- [ ] Accepts `date` query parameter (optional, YYYY-MM-DD format)
- [ ] Returns 400 for invalid locale
- [ ] Returns 400 for invalid date format
- [ ] Returns 400 for future date
- [ ] Returns 400 for date older than 7 days
- [ ] Returns 200 with articles array on success
- [ ] Response includes totalFeeds and successfulFeeds
- [ ] All errors logged to CloudWatch

**Files:**
- `backend/src/routes/defaultFeeds.ts` (new)
- `backend/src/app.ts` (update)

**Testing:**
- Integration tests for API endpoint
- Test valid requests
- Test invalid locale
- Test invalid date format
- Test future date
- Test old date
- Test error responses

---

### Phase 2: Newspaper Service Updates

#### Task 2.1: Update Newspaper Service to Filter Default Feeds

**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** Task 1.1

**Description:** Filter out default feeds before saving newspapers

**Implementation:**
1. Update `backend/src/services/newspaperService.ts`
2. Import `isDefaultFeed` from defaultFeedService
3. In `createNewspaper()`, filter feedUrls to remove default feeds
4. Add logging for filtered feeds count
5. Ensure backward compatibility (existing newspapers unchanged)

**Acceptance Criteria:**
- [ ] `createNewspaper()` filters default feeds from feedUrls
- [ ] Only user-selected feeds saved to DynamoDB
- [ ] Logging shows original and filtered feed counts
- [ ] Existing newspapers not affected
- [ ] All tests pass

**Files:**
- `backend/src/services/newspaperService.ts` (update)

**Testing:**
- Unit tests for feed filtering
- Test with default feeds in input
- Test with no default feeds in input
- Test with only default feeds in input
- Verify backward compatibility

---

#### Task 2.2: Update Historical Newspaper Service

**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.1, Task 2.1

**Description:** Apply consistent article balancing and use default feed API

**Implementation:**
1. Update `backend/src/services/historicalNewspaperService.ts`
2. Import `fetchDefaultFeedArticles` from defaultFeedService
3. In `getOrCreateNewspaper()`:
   - Fetch user feed articles
   - Fetch default feed articles (call API internally)
   - Merge articles
   - Apply `balanceArticlesAcrossFeed()`
   - Apply `limitDefaultFeedArticles()`
   - Calculate importance
   - Select 8-15 articles
4. Add logging for article counts
5. Handle default feed fetch failures gracefully

**Acceptance Criteria:**
- [ ] Historical newspapers fetch default feed articles
- [ ] User and default articles merged correctly
- [ ] `balanceArticlesAcrossFeed()` applied to all articles
- [ ] `limitDefaultFeedArticles()` applied to all articles
- [ ] Default feeds limited to 2 articles each
- [ ] Same balancing logic as regular newspaper generation
- [ ] Default feed fetch failures don't prevent generation
- [ ] All tests pass

**Files:**
- `backend/src/services/historicalNewspaperService.ts` (update)

**Testing:**
- Unit tests for article merging
- Test with user feeds only
- Test with default feeds only
- Test with both user and default feeds
- Test default feed fetch failure
- Verify article balancing
- Verify article limits

---

### Phase 3: Testing

#### Task 3.1: Unit Tests for Default Feed Service

**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.1

**Description:** Comprehensive unit tests for default feed service

**Implementation:**
1. Create `backend/tests/unit/services/defaultFeedService.test.ts`
2. Test `getDefaultFeeds()` for EN and JP
3. Test `isDefaultFeed()` with various URLs
4. Test `fetchDefaultFeedArticles()` with mocked RSS parser
5. Test date filtering logic
6. Test article limiting
7. Test error handling
8. Test parallel fetching
9. Aim for >80% coverage

**Acceptance Criteria:**
- [ ] All functions have unit tests
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Coverage >80%
- [ ] All tests pass

**Files:**
- `backend/tests/unit/services/defaultFeedService.test.ts` (new)

---

#### Task 3.2: Integration Tests for Default Feed API

**Priority:** High  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 1.2

**Description:** Integration tests for default feed API endpoint

**Implementation:**
1. Create `backend/tests/integration/routes/defaultFeeds.test.ts`
2. Test GET `/api/default-feeds?locale=en`
3. Test GET `/api/default-feeds?locale=ja`
4. Test with date parameter
5. Test invalid locale
6. Test invalid date format
7. Test future date
8. Test old date
9. Test response format

**Acceptance Criteria:**
- [ ] All API scenarios tested
- [ ] Valid requests return 200
- [ ] Invalid requests return 400
- [ ] Response format validated
- [ ] All tests pass

**Files:**
- `backend/tests/integration/routes/defaultFeeds.test.ts` (new)

---

#### Task 3.3: Update Existing Tests

**Priority:** Medium  
**Estimated Time:** 1 hour  
**Dependencies:** Task 2.1, Task 2.2

**Description:** Update existing tests to account for new behavior

**Implementation:**
1. Update `newspaperService.test.ts` to expect filtered feedUrls
2. Update `historicalNewspaperService.test.ts` to mock default feed fetching
3. Update any tests that check feedUrls
4. Ensure all existing tests pass

**Acceptance Criteria:**
- [ ] All existing tests updated
- [ ] No test failures
- [ ] Coverage maintained or improved

**Files:**
- `backend/tests/unit/services/newspaperService.test.ts` (update)
- `backend/tests/unit/services/historicalNewspaperService.test.ts` (update)

---

### Phase 4: Documentation

#### Task 4.1: Update API Documentation

**Priority:** Low  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 1.2

**Description:** Document new default feed API endpoint

**Implementation:**
1. Update `backend/README.md` with new endpoint
2. Add request/response examples
3. Document query parameters
4. Document error responses

**Acceptance Criteria:**
- [ ] API endpoint documented
- [ ] Examples provided
- [ ] Error responses documented

**Files:**
- `backend/README.md` (update)

---

#### Task 4.2: Update Steering Files

**Priority:** Low  
**Estimated Time:** 30 minutes  
**Dependencies:** All implementation tasks

**Description:** Update steering files with new architecture

**Implementation:**
1. Update `.kiro/steering/tech.md` with default feed service
2. Update `.kiro/steering/structure.md` with new files
3. Update `.kiro/steering/product.md` if needed

**Acceptance Criteria:**
- [ ] Steering files reflect new architecture
- [ ] New services documented
- [ ] File structure updated

**Files:**
- `.kiro/steering/tech.md` (update)
- `.kiro/steering/structure.md` (update)

---

### Phase 5: Deployment and Verification

#### Task 5.1: Deploy to Production

**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** All previous tasks

**Description:** Deploy changes to production

**Implementation:**
1. Merge PR to main branch
2. GitHub Actions builds and deploys backend
3. Monitor deployment logs
4. Verify Lambda function updated
5. Verify API Gateway routes updated

**Acceptance Criteria:**
- [ ] Backend deployed successfully
- [ ] No deployment errors
- [ ] Lambda function running
- [ ] API Gateway routes accessible

---

#### Task 5.2: Production Verification

**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** Task 5.1

**Description:** Verify functionality in production

**Implementation:**
1. Test default feed API endpoint
   - `GET /api/default-feeds?locale=en`
   - `GET /api/default-feeds?locale=ja`
   - `GET /api/default-feeds?locale=en&date=2026-01-13`
2. Create new newspaper and verify no default feeds in feedUrls
3. Generate historical newspaper and verify article balance
4. Check CloudWatch logs for errors
5. Monitor performance metrics

**Acceptance Criteria:**
- [ ] Default feed API returns articles
- [ ] New newspapers don't include default feeds
- [ ] Historical newspapers have balanced articles
- [ ] No errors in CloudWatch logs
- [ ] Performance within acceptable range

---

#### Task 5.3: Monitor and Adjust

**Priority:** Medium  
**Estimated Time:** Ongoing  
**Dependencies:** Task 5.2

**Description:** Monitor production behavior and adjust if needed

**Implementation:**
1. Monitor default feed API usage
2. Monitor default feed fetch success rate
3. Monitor newspaper generation performance
4. Monitor error rates
5. Adjust article limits if needed
6. Replace unhealthy default feeds if needed

**Acceptance Criteria:**
- [ ] Monitoring dashboard set up
- [ ] Alerts configured for errors
- [ ] Performance metrics tracked
- [ ] Issues addressed promptly

---

## Task Summary

### By Phase

**Phase 1: Backend Foundation**
- Task 1.1: Create Default Feed Service (2h)
- Task 1.2: Create Default Feed API Route (1.5h)

**Phase 2: Newspaper Service Updates**
- Task 2.1: Update Newspaper Service (1h)
- Task 2.2: Update Historical Newspaper Service (2h)

**Phase 3: Testing**
- Task 3.1: Unit Tests for Default Feed Service (2h)
- Task 3.2: Integration Tests for Default Feed API (1.5h)
- Task 3.3: Update Existing Tests (1h)

**Phase 4: Documentation**
- Task 4.1: Update API Documentation (0.5h)
- Task 4.2: Update Steering Files (0.5h)

**Phase 5: Deployment**
- Task 5.1: Deploy to Production (1h)
- Task 5.2: Production Verification (1h)
- Task 5.3: Monitor and Adjust (ongoing)

### Total Estimated Time

- Implementation: 6.5 hours
- Testing: 4.5 hours
- Documentation: 1 hour
- Deployment: 2 hours
- **Total: 14 hours**

### Critical Path

1. Task 1.1 (Default Feed Service)
2. Task 1.2 (Default Feed API)
3. Task 2.1 (Update Newspaper Service)
4. Task 2.2 (Update Historical Newspaper Service)
5. Task 3.1-3.3 (Testing)
6. Task 5.1-5.2 (Deployment & Verification)

### Dependencies Graph

```
Task 1.1 (Default Feed Service)
  ├─> Task 1.2 (Default Feed API)
  ├─> Task 2.1 (Update Newspaper Service)
  │     └─> Task 2.2 (Update Historical Newspaper Service)
  │           └─> Task 3.3 (Update Existing Tests)
  └─> Task 3.1 (Unit Tests)

Task 1.2
  └─> Task 3.2 (Integration Tests)
  └─> Task 4.1 (API Documentation)

All Implementation Tasks
  └─> Task 4.2 (Update Steering Files)
  └─> Task 5.1 (Deploy to Production)
        └─> Task 5.2 (Production Verification)
              └─> Task 5.3 (Monitor and Adjust)
```

## Checklist

### Before Starting
- [ ] Read requirements document
- [ ] Read design document
- [ ] Understand current architecture
- [ ] Set up development environment

### During Implementation
- [ ] Follow coding standards
- [ ] Write tests alongside code
- [ ] Add logging for debugging
- [ ] Handle errors gracefully
- [ ] Document complex logic

### Before Deployment
- [ ] All tests pass
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Backward compatibility verified
- [ ] Performance tested

### After Deployment
- [ ] Production verification complete
- [ ] Monitoring set up
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Issue closed

## Notes

- All dates processed in JST (Asia/Tokyo) timezone
- Default feeds limited to 2 articles each
- Backward compatibility maintained (no migration needed)
- Error messages in English
- All errors logged to CloudWatch

## Related Documents

- [Requirements Document](./requirements.md)
- [Design Document](./design.md)
- [Issue #75](https://github.com/kumagaias/my-rss-press/issues/75)
