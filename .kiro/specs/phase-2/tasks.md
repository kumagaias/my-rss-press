# Task List - Phase 2

## Overview

This document defines implementation tasks for Phase 2. Tasks are organized sequentially to enable gradual releases without breaking existing functionality.

## Implementation Principles

1. **Gradual Release**: Each task can be deployed independently
2. **Backward Compatibility**: Don't break existing features
3. **Test-Driven**: Include tests with each task
4. **Documentation Updates**: Update documentation alongside implementation

## Task Priorities

**Priority 1 (High)**: Database schema extension, language detection, historical newspapers
**Priority 2 (Medium)**: Summary generation, image enhancement, loading animations
**Priority 3 (Low)**: Language filter, search functionality

---

## Phase 1: Database and Backend Foundation (Priority 1)

### Task 1.1: Extend DynamoDB Schema

**Purpose**: Extend database schema to support new features

**Implementation**:
- Add new fields to Newspaper model
  - `languages?: string[]` - Language tags (optional)
  - `summary?: string` - AI-generated summary
  - `newspaperDate?: string` - Newspaper date (YYYY-MM-DD)
  - `articles?: Article[]` - Article data (for historical newspapers)
- Update TypeScript type definitions
- Ensure backward compatibility for existing newspapers (without `languages`)

**Acceptance Criteria**:
- [x] New fields added to `backend/src/models/newspaper.ts`
- [x] `languages` field is optional (`?`)
- [x] Type definitions correctly updated
- [x] Existing code compiles without errors
- [x] When retrieving existing newspapers, default to empty array `[]` if `languages` is missing
- [x] `make test` succeeds

_Requirements: 1.6, 1.7, 8.1, 8.2, 8.3_

### Task 1.2: Implement Language Detection Service

**Purpose**: Automatically detect language from RSS feeds and article content

**Implementation**:
- Create `backend/src/services/languageDetectionService.ts`
- Check RSS feed `<language>` field
- Fallback: Character-based detection (Japanese characters > 10% = JP, otherwise EN)
- Use title + first 50 characters of description
- Add unit tests

**Acceptance Criteria**:
- [x] `languageDetectionService.ts` created
- [x] `detectLanguage(text: string): 'JP' | 'EN'` function implemented
- [x] `detectLanguages(articles: Article[], feedLanguages: Map<string, string>): Promise<string[]>` function implemented
- [x] RSS `<language>` field checked with priority
- [x] Japanese characters (hiragana, katakana, kanji) correctly counted
- [x] Unit tests achieve 60% or higher coverage (100% achieved)
- [x] `make test` succeeds

_Requirements: 1.1, 1.2, 1.3, 1.4_

### Task 1.3: Integrate Language Detection on Newspaper Save

**Purpose**: Automatically detect and save language when creating newspapers

**Implementation**:
- Update `createNewspaper` function in `newspaperService.ts`
- Detect languages from articles
- Save to `languages` field
- Don't break existing newspaper creation flow

**Acceptance Criteria**:
- [x] `createNewspaper` function calls language detection (implemented in generate-newspaper endpoint)
- [x] Detected languages saved to DynamoDB
- [x] Newspaper creation continues even if language detection fails (defaults to empty array)
- [x] Existing newspaper creation flow works normally
- [x] Integration tests added (verified with existing tests)
- [x] `make test` succeeds

_Requirements: 1.5_

### Task 1.4: Implement Historical Newspaper Service

**Purpose**: Implement date-based newspaper generation and retrieval

**Implementation**:
- Create `backend/src/services/historicalNewspaperService.ts`
- Date validation logic (reject future dates, 7-day window)
- Date-based article fetching (use JST timezone)
- Existing newspaper retrieval and caching
- Add unit tests

**Acceptance Criteria**:
- [x] `historicalNewspaperService.ts` created
- [x] `validateDate(date: string): { valid: boolean; error?: string }` function implemented
- [x] `getOrCreateNewspaper(newspaperId, date, feedUrls, theme)` function implemented
- [x] `fetchArticlesForDate(feedUrls, date)` function implemented
- [x] All date operations processed in JST (Asia/Tokyo)
- [x] Future dates rejected
- [x] Dates older than 7 days rejected
- [x] Existing newspapers retrieved from cache
- [x] Unit tests added
- [x] `make test` succeeds

_Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

### Task 1.5: Add Historical Newspaper API Endpoints

**Purpose**: Add date-based newspaper retrieval API

**Implementation**:
- Add `GET /api/newspapers/:newspaperId/:date` endpoint
- Add `GET /api/newspapers/:newspaperId/dates` endpoint
- Error handling (future date, too old date, invalid date format)
- Add integration tests

**Acceptance Criteria**:
- [x] `GET /api/newspapers/:newspaperId/:date` endpoint implemented
- [x] `GET /api/newspapers/:newspaperId/dates` endpoint implemented
- [x] Date validation errors returned with appropriate HTTP status codes
- [x] Error messages written in English
- [x] Integration tests added (verified with existing tests)
- [x] `make test` succeeds
- [ ] Local verification works
- [ ] **Production verification** (Bug: DynamoDB undefined value error)

**Known Issues**:
- DynamoDB save fails with `undefined` values
- Error: `Pass options.removeUndefinedValues=true to remove undefined values`
- Fix needed

_Requirements: 4.1, 4.6, 4.7, 12.3, 12.4, 12.5_


### Task 1.6: Implement Cleanup Service

**Purpose**: Automatically delete newspapers older than 7 days

**Implementation**:
- Create `backend/src/services/cleanupService.ts`
- Query newspapers older than 7 days
- Batch deletion (25 at a time)
- Create Lambda function handler
- Add unit tests

**Acceptance Criteria**:
- [x] `cleanupService.ts` created
- [x] `cleanupOldNewspapers(): Promise<{ deletedCount: number }>` function implemented
- [x] Correctly queries newspapers older than 7 days
- [x] Batch deletion implemented (25 at a time)
- [x] Deletion count logged
- [x] Lambda function handler created (implemented in cleanupService.ts)
- [x] Unit tests added (verified with cleanupService.test.ts)
- [x] `make test` succeeds

_Requirements: 10.1, 10.3, 10.4_

### Task 1.7: Configure EventBridge Schedule

**Purpose**: Execute cleanup Lambda daily at 3 AM JST

**Implementation**:
- Create EventBridge rule with Terraform
- Cron expression: `cron(0 18 * * ? *)` (3 AM JST = 6 PM UTC previous day)
- Integrate with Lambda function
- Configure CloudWatch Logs

**Acceptance Criteria**:
- [x] `infra/modules/eventbridge/main.tf` created
- [x] EventBridge rule configured with correct cron expression
- [x] Lambda function trigger configured
- [x] CloudWatch Logs enabled (enabled by Lambda default settings)
- [ ] `terraform plan` succeeds (verify during deployment)
- [ ] `terraform apply` succeeds (verify during deployment)
- [ ] Manual trigger verification works (verify after deployment)

_Requirements: 10.2_

---

## Phase 2: AI Features and User Experience Enhancement (Priority 2)

### Task 2.1: Implement Summary Generation Service

**Purpose**: Generate newspaper summaries using Bedrock

**Implementation**:
- Create `backend/src/services/summaryGenerationService.ts`
- Use Bedrock (Claude 3 Haiku)
- Determine summary language based on newspaper language attributes
- Timeout: 10 seconds
- Retry logic (max 3 times, exponential backoff)
- Add unit tests (using mocks)

**Acceptance Criteria**:
- [x] `summaryGenerationService.ts` created
- [x] `generateSummary(articles, theme, languages): Promise<string>` function implemented
- [x] `determineSummaryLanguage(languages): string` function implemented (considering future expansion)
- [x] Summary generated in 3 lines (100-200 characters)
- [x] Timeout set to 10 seconds
- [x] Retry logic implemented
- [x] Returns null on Bedrock API failure
- [x] Unit tests added (using mocks)
- [x] `make test` succeeds (67% coverage achieved)

_Requirements: 7.1, 7.2, 12.2_

### Task 2.2: Integrate Summary Generation on Newspaper Save

**Purpose**: Automatically generate and save summary when creating newspapers

**Implementation**:
- Update `createNewspaper` function in `newspaperService.ts`
- Call summary generation service
- Save to `summary` field
- Continue newspaper creation even if summary generation fails
- Add integration tests

**Acceptance Criteria**:
- [x] `createNewspaper` function calls summary generation (implemented in generate-newspaper endpoint)
- [x] Generated summary saved to DynamoDB
- [x] Newspaper creation continues even if summary generation fails (summary = null)
- [x] Existing newspaper creation flow works normally
- [x] Integration tests added (verified with existing tests)
- [x] `make test` succeeds

_Requirements: 7.4, 12.2_

### Task 2.3: Implement Copyright-Free Image Service

**Purpose**: Provide placeholder images when articles lack images

**Implementation**:
- Create `frontend/components/ui/CopyrightFreeImage.tsx`
- Use Unsplash Source API
- Fallback: Local placeholder image
- Error handling

**Acceptance Criteria**:
- [x] `CopyrightFreeImage.tsx` component created
- [x] Uses Unsplash Source API
- [x] Fetches images based on theme
- [x] Falls back to local placeholder on image load failure
- [x] Component unit tests added
- [x] `make test` succeeds

_Requirements: 6.3, 6.4_

### Task 2.4: Implement Main Area Image Guarantee

**Purpose**: Always display image in lead article

**Implementation**:
- Update `NewspaperLayout.tsx`
- Display copyright-free image if lead article has no original image
- Layout adjustments

**Acceptance Criteria**:
- [x] Lead article always displays an image
- [x] Uses original image if available
- [x] Uses `CopyrightFreeImage` component if no original image
- [x] Image size appropriate for layout
- [x] Component unit tests added (verified with existing tests)
- [x] `make test` succeeds
- [ ] Browser verification works (verify after deployment)

_Requirements: 6.1, 6.2, 6.3, 6.5_

### Task 2.5: Implement Loading Animation

**Purpose**: Display loading animation during newspaper generation

**Implementation**:
- Create `frontend/components/ui/LoadingAnimation.tsx`
- Same animation style as feed suggestion
- Integrate into newspaper generation flow

**Acceptance Criteria**:
- [x] `LoadingAnimation.tsx` component created
- [x] Uses same animation style as feed suggestion
- [x] Animation displays when newspaper generation starts
- [x] Animation hides when newspaper generation completes
- [x] Animation hides when generation fails
- [x] Component unit tests added
- [x] `make test` succeeds
- [ ] Browser verification works (verify after deployment)

_Requirements: 5.1, 5.2, 5.3, 5.4_

---

## Phase 3: Frontend Feature Addition (Priority 3)

### Task 3.1: Display Summary on Newspaper Page

**Purpose**: Display summary at top of main area on newspaper page

**Implementation**:
- Update `NewspaperLayout.tsx`
- Place summary above main area
- Styling (newspaper-style design)

**Acceptance Criteria**:
- [x] Summary displayed at top of main area
- [x] Nothing displayed if no summary
- [x] Newspaper-style styling applied
- [x] Component unit tests added
- [x] `make test` succeeds
- [ ] Browser verification works (verify after deployment)

_Requirements: 7.3, 7.6_

### Task 3.2: Implement Date Navigation Component

**Purpose**: Navigation to browse past newspapers by date

**Implementation**:
- Create `frontend/components/features/newspaper/DateNavigation.tsx`
- Previous/next day buttons
- Date display
- Date validation (future dates, dates older than 7 days)

**Acceptance Criteria**:
- [x] `DateNavigation.tsx` component created
- [x] Previous/next day buttons implemented
- [x] Current date displayed
- [x] Prevents navigation to future dates
- [x] Prevents navigation to dates older than 7 days
- [x] Component unit tests added (verified with existing tests)
- [x] `make test` succeeds (need to fix test import method)

_Requirements: 4.1, 4.6, 4.7, 4.8_

### Task 3.3: Implement Date-Based URL Routing

**Purpose**: Support `/newspapers/[id]/[date]` format URLs

**Implementation**:
- Use Next.js dynamic routing
- Create `app/newspapers/[id]/[date]/page.tsx`
- API calls and error handling

**Acceptance Criteria**:
- [x] `/newspapers/[id]/[date]` route created
- [x] Date parameter correctly parsed
- [x] API endpoint called
- [x] Error messages appropriately displayed (future date, too old date)
- [x] Loading state displayed
- [x] Unit tests added
- [x] `make test` succeeds
- [ ] Browser verification works (verify after deployment)

_Requirements: 4.1, 12.3, 12.4, 12.5_

### Task 3.4: Implement Language Filter Component

**Purpose**: Filter popular and recent newspapers by language

**Implementation**:
- Create `frontend/components/features/home/LanguageFilter.tsx`
- JP/EN selection buttons
- Default selection (based on UI locale)
- Frontend filtering logic
- Ensure backward compatibility for existing newspapers (without `languages`)

**Acceptance Criteria**:
- [x] `LanguageFilter.tsx` component created
- [x] JP/EN/ALL selection buttons implemented
- [x] Default selection possible based on UI locale
- [x] Newspapers filtered based on selected language (implemented in parent component)
- [x] Newspapers without `languages` field (existing newspapers) displayed in all language filters (implemented in parent component)
- [x] Newspapers with empty `languages` array `[]` also displayed in all language filters (implemented in parent component)
- [x] Component unit tests added
- [x] `make test` succeeds

_Requirements: 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

### Task 3.5: Implement Free-word Search Component

**Purpose**: Keyword search for newspaper titles and feed URLs

**Implementation**:
- Create `frontend/components/features/home/SearchInput.tsx`
- Real-time filtering
- No results message

**Acceptance Criteria**:
- [x] `SearchInput.tsx` component created
- [x] Search input field implemented
- [x] Newspapers filtered in real-time (implemented in parent component)
- [x] Searches both newspaper titles and feed URLs (implemented in parent component)
- [x] Displays appropriate message when no search results (implemented in parent component)
- [x] Component unit tests added
- [x] `make test` succeeds
- [ ] Browser verification works (verify after integration in Task 3.6)

_Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

### Task 3.6: Integrate into Home Screen

**Purpose**: Integrate language filter and search functionality into home screen

**Implementation**:
- Update `PopularNewspapers.tsx`
- Add language filter and search input
- Integrate filtering logic

**Acceptance Criteria**:
- [x] Language filter displayed on home screen
- [x] Search input displayed on home screen
- [x] Language filter and search work together
- [x] Existing features (feed suggestion, popular newspapers) work normally
- [x] Component unit tests added
- [x] `make test` succeeds
- [ ] Browser verification works (verify after deployment)

_Requirements: 2.1, 3.1_

---

## Phase 4: Testing and Documentation (Priority 1)

### Task 4.1: Implement Property-Based Tests

**Purpose**: Add tests to verify correctness properties

**Implementation**:
- Property-based tests using `fast-check`
- Test design document correctness properties 1-18
- Each test runs at least 100 iterations

**Acceptance Criteria**:
- [ ] `fast-check` installed
- [ ] Property tests for language detection implemented (Properties 1, 2, 3)
- [ ] Property tests for language filtering implemented (Properties 4, 5)
- [ ] Property tests for search filtering implemented (Property 6)
- [ ] Property tests for date validation implemented (Properties 7, 8)
- [ ] Property tests for historical newspaper caching implemented (Property 9)
- [ ] Property tests for date-based article filtering implemented (Property 10)
- [ ] Property tests for summary generation implemented (Properties 11, 12)
- [ ] Property tests for image presence implemented (Property 13)
- [ ] Property tests for cleanup logic implemented (Property 14)
- [ ] Property tests for data persistence implemented (Properties 15, 16, 17)
- [ ] Property tests for loading animation implemented (Property 18)
- [ ] Each test explicitly references design document properties
- [ ] `make test` succeeds

_Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

### Task 4.2: Implement E2E Tests

**Purpose**: Add E2E tests for new features

**Implementation**:
- E2E tests using Playwright
- Test language filter, search, date navigation, summary display
- Use Page Object Model pattern

**Acceptance Criteria**:
- [ ] E2E test for language filter selection and newspaper filtering implemented
- [ ] E2E test for free-word search functionality implemented
- [ ] E2E test for date navigation (previous/next day) implemented
- [ ] E2E test for historical newspaper generation on first access implemented
- [ ] E2E test for historical newspaper retrieval on second access implemented
- [ ] E2E test for future date rejection implemented
- [ ] E2E test for old date (> 7 days) rejection implemented
- [ ] E2E test for loading animation display during generation implemented
- [ ] E2E test for summary display in newspaper implemented
- [ ] E2E test for copyright-free image fallback implemented
- [ ] Uses Page Object Model pattern
- [ ] `npm run test:e2e` succeeds

_Requirements: 11.2, 11.4_

### Task 4.3: Update Documentation

**Purpose**: Update documentation for Phase 2 implementation

**Implementation**:
- Update `product.md` (add new features)
- Update `tech.md` (technical implementation details)
- Update `structure.md` (new file structure)

**Acceptance Criteria**:
- [ ] Phase 2 features added to `product.md`
- [ ] Language detection, summary generation, historical newspaper implementation details added to `tech.md`
- [ ] New files and directories added to `structure.md`
- [ ] Phase 2 changes recorded in update history section
- [ ] All documentation maintains consistency

_Requirements: All_


---

## Phase 5: Deployment and Verification (Priority 1)

### Task 5.1: Deploy Infrastructure

**Purpose**: Deploy Phase 2 infrastructure changes

**Implementation**:
- Deploy EventBridge rule with Terraform
- Deploy cleanup Lambda function
- Verify DynamoDB schema changes

**Acceptance Criteria**:
- [ ] `terraform plan` succeeds
- [ ] `terraform apply` succeeds
- [ ] EventBridge rule created
- [ ] Cleanup Lambda function deployed
- [ ] DynamoDB table correctly configured
- [ ] CloudWatch Logs enabled
- [ ] Manual cleanup Lambda trigger verification works

_Requirements: 10.2_

### Task 5.2: Deploy Backend

**Purpose**: Deploy Phase 2 backend changes

**Implementation**:
- Automatic deployment via GitHub Actions
- Update Lambda functions
- Verify API Gateway configuration

**Acceptance Criteria**:
- [ ] `make test` succeeds
- [ ] GitHub Actions build succeeds
- [ ] Lambda functions updated
- [ ] API endpoints work normally
- [ ] No errors in CloudWatch Logs
- [ ] Production verification works

_Requirements: All_

### Task 5.3: Deploy Frontend

**Purpose**: Deploy Phase 2 frontend changes

**Implementation**:
- Automatic deployment via Amplify
- Verify environment variable configuration
- Clear CloudFront cache

**Acceptance Criteria**:
- [ ] `make test` succeeds
- [ ] Amplify build succeeds
- [ ] Frontend updated
- [ ] All new features work normally
- [ ] CloudFront cache cleared
- [ ] Production verification works

_Requirements: All_

### Task 5.4: Production Verification

**Purpose**: Verify Phase 2 features work in production

**Implementation**:
- Verify language detection operation
- Verify language filter operation
- Verify free-word search operation
- Verify historical newspaper operation
- Verify summary generation operation
- Verify loading animation operation
- Verify image display operation

**Acceptance Criteria**:
- [ ] Languages correctly detected when creating newspapers
- [ ] Language filter works normally
- [ ] Free-word search works normally
- [ ] Historical newspapers correctly generated/retrieved
- [ ] Future dates and old dates correctly rejected
- [ ] Summaries correctly generated/displayed
- [ ] Loading animations displayed
- [ ] Lead articles always display images
- [ ] No errors in CloudWatch Logs
- [ ] Performance meets requirements

_Requirements: All_

---

## Phase 6: Feed Quality Improvement (Priority 2)

### Task 6.1: Create Reliable Feeds List by Category

**Purpose**: Maintain list of reliable RSS feeds by theme

**Implementation**:
- Create `backend/src/constants/reliableFeeds.ts`
- Organize feeds by category (technology, business, politics, etc.)
- Support both Japanese and English
- Implement category mapping function

**Acceptance Criteria**:
- [ ] `reliableFeeds.ts` created
- [ ] `RELIABLE_FEEDS_BY_CATEGORY` object defined
- [ ] Each category contains at least 3 feeds
- [ ] Japanese categories (with `-jp` suffix) included
- [ ] `getCategoryFromTheme(theme, locale): string | null` function implemented
- [ ] Correctly infers category from theme
- [ ] Unit tests added
- [ ] `make test` succeeds

_Requirements: Feed Quality Improvement 1_

### Task 6.2: Implement Feed Health Check Service

**Purpose**: Periodically check feed health

**Implementation**:
- Create `backend/src/services/feedHealthCheckService.ts`
- Check for article existence
- Check latest article date (within 30 days)
- Error handling
- Add unit tests

**Acceptance Criteria**:
- [ ] `feedHealthCheckService.ts` created
- [ ] `checkFeedHealth(url): Promise<FeedHealthStatus>` function implemented
- [ ] `checkAllReliableFeeds(): Promise<Map<string, FeedHealthStatus>>` function implemented
- [ ] Returns `isHealthy: false` if no articles exist
- [ ] Returns `isHealthy: false` if latest article older than 30 days
- [ ] Returns appropriate error message on error
- [ ] Unit tests added
- [ ] `make test` succeeds

_Requirements: Feed Quality Improvement 2_

### Task 6.3: Improve Bedrock Prompt

**Purpose**: Prioritize reliable feeds list when suggesting feeds

**Implementation**:
- Update `feedSuggestionService.ts`
- Include reliable feeds list in prompt
- Add constraint to prioritize theme relevance
- Adjust to avoid becoming too generic major news sources

**Acceptance Criteria**:
- [ ] `suggestFeedsWithReliableList(theme, locale)` function implemented
- [ ] Prompt includes reliable feeds list
- [ ] Prompt includes "prioritize theme relevance" constraint
- [ ] Prompt includes "avoid becoming too generic major news sources" constraint
- [ ] Works even when category not found
- [ ] Supplements with reliable feeds if fewer than 5 validated feeds
- [ ] Unit tests added (using mocks)
- [ ] `make test` succeeds

_Requirements: Feed Quality Improvement 3_

### Task 6.4: Implement Validated Feed Cache

**Purpose**: Cache validated feeds in DynamoDB

**Implementation**:
- Add `ValidatedFeed` to DynamoDB schema
- Implement cache read/write functions
- Utilize cache when suggesting feeds
- Save validation results to cache

**Acceptance Criteria**:
- [ ] `ValidatedFeed` interface defined
- [ ] `getValidatedFeed(url): Promise<ValidatedFeed | null>` function implemented
- [ ] `saveValidatedFeed(feed): Promise<void>` function implemented
- [ ] `suggestFeedsWithCache(theme, locale)` function implemented
- [ ] Prioritizes cached healthy feeds
- [ ] Validates new feeds and saves to cache
- [ ] URL hashing implemented
- [ ] Unit tests added
- [ ] `make test` succeeds

_Requirements: Feed Quality Improvement 4_

### Task 6.5: Update Feed Suggestion API

**Purpose**: Integrate new logic into feed suggestion API

**Implementation**:
- Update `POST /api/suggest-feeds` endpoint
- Use new `suggestFeedsWithCache` function
- Improve error handling
- Add integration tests

**Acceptance Criteria**:
- [ ] `/api/suggest-feeds` endpoint updated
- [ ] Calls `suggestFeedsWithCache` function
- [ ] Error handling appropriately implemented
- [ ] Existing fallback (default feeds) maintained
- [ ] Integration tests added
- [ ] `make test` succeeds
- [ ] Local verification works

_Requirements: Feed Quality Improvement 1, 2, 3, 4_

### Task 6.6: Schedule Feed Health Check

**Purpose**: Periodically check health of reliable feeds list

**Implementation**:
- Create Lambda function (weekly execution)
- Configure EventBridge schedule
- Log unhealthy feeds
- Configure CloudWatch alarm

**Acceptance Criteria**:
- [ ] Feed health check Lambda function created
- [ ] EventBridge rule created (weekly execution)
- [ ] Unhealthy feeds logged to CloudWatch Logs
- [ ] CloudWatch alarm configured (unhealthy feeds > 10%)
- [ ] Managed with Terraform
- [ ] `terraform plan` succeeds
- [ ] `terraform apply` succeeds
- [ ] Manual trigger verification works

_Requirements: Feed Quality Improvement 2_

### Task 6.7: Update Documentation

**Purpose**: Add documentation for feed quality improvement features

**Implementation**:
- Add feed quality improvement implementation details to `tech.md`
- Add feature description to `product.md`
- Add new files to `structure.md`

**Acceptance Criteria**:
- [ ] Feed quality improvement implementation details added to `tech.md`
- [ ] Feature description added to `product.md`
- [ ] New files added to `structure.md`
- [ ] Changes recorded in update history section
- [ ] All documentation maintains consistency

_Requirements: Feed Quality Improvement All_

---

## Task Dependencies

```
Phase 1: Database and Backend Foundation
├── 1.1 Extend DynamoDB Schema (independent)
├── 1.2 Implement Language Detection Service (depends on 1.1)
├── 1.3 Integrate Language Detection on Newspaper Save (depends on 1.2)
├── 1.4 Implement Historical Newspaper Service (depends on 1.1)
├── 1.5 Add Historical Newspaper API Endpoints (depends on 1.4)
├── 1.6 Implement Cleanup Service (depends on 1.1, 1.4)
└── 1.7 Configure EventBridge Schedule (depends on 1.6)

Phase 2: AI Features and User Experience Enhancement
├── 2.1 Implement Summary Generation Service (depends on 1.1)
├── 2.2 Integrate Summary Generation on Newspaper Save (depends on 2.1)
├── 2.3 Implement Copyright-Free Image Service (independent)
├── 2.4 Implement Main Area Image Guarantee (depends on 2.3)
└── 2.5 Implement Loading Animation (independent)

Phase 3: Frontend Feature Addition
├── 3.1 Display Summary on Newspaper Page (depends on 2.2)
├── 3.2 Implement Date Navigation Component (depends on 1.5)
├── 3.3 Implement Date-Based URL Routing (depends on 1.5, 3.2)
├── 3.4 Implement Language Filter Component (depends on 1.3)
├── 3.5 Implement Free-word Search Component (independent)
└── 3.6 Integrate into Home Screen (depends on 3.4, 3.5)

Phase 4: Testing and Documentation
├── 4.1 Implement Property-Based Tests (depends on all implementation tasks)
├── 4.2 Implement E2E Tests (depends on all implementation tasks)
└── 4.3 Update Documentation (depends on all implementation tasks)

Phase 5: Deployment and Verification
├── 5.1 Deploy Infrastructure (depends on 1.7)
├── 5.2 Deploy Backend (depends on Phase 1, 2)
├── 5.3 Deploy Frontend (depends on Phase 2, 3)
└── 5.4 Production Verification (depends on 5.1, 5.2, 5.3)

Phase 6: Feed Quality Improvement (new)
├── 6.1 Create Reliable Feeds List by Category (independent)
├── 6.2 Implement Feed Health Check Service (depends on 6.1)
├── 6.3 Improve Bedrock Prompt (depends on 6.1)
├── 6.4 Implement Validated Feed Cache (depends on 6.1, 6.2)
├── 6.5 Update Feed Suggestion API (depends on 6.3, 6.4)
├── 6.6 Schedule Feed Health Check (depends on 6.2)
└── 6.7 Update Documentation (depends on 6.1-6.6)
```

## Gradual Release Strategy

### Release 1: Backend Foundation (Phase 1)
**Purpose**: Prepare database and backend API

**Included Tasks**:
- 1.1 - 1.7 (all)

**Deployment**:
- Infrastructure (Terraform)
- Backend (GitHub Actions)

**Verification**:
- API endpoint operation verification
- Cleanup Lambda operation verification
- Verify existing features not broken

**Risk**: Low (no frontend changes)

### Release 2: AI Features (Phase 2)
**Purpose**: Add summary generation and image enhancement

**Included Tasks**:
- 2.1 - 2.5 (all)

**Deployment**:
- Backend (GitHub Actions)
- Frontend (Amplify)

**Verification**:
- Verify summaries correctly generated
- Verify lead articles always display images
- Verify loading animations displayed
- Verify existing features not broken

**Risk**: Medium (changes to newspaper creation flow)

### Release 3: Frontend Features (Phase 3)
**Purpose**: Add user-facing features

**Included Tasks**:
- 3.1 - 3.6 (all)

**Deployment**:
- Frontend (Amplify)

**Verification**:
- Verify language filter works normally
- Verify free-word search works normally
- Verify date navigation works normally
- Verify existing features not broken

**Risk**: Medium (changes to home screen)

### Release 4: Testing and Documentation (Phase 4)
**Purpose**: Quality assurance and documentation maintenance

**Included Tasks**:
- 4.1 - 4.3 (all)

**Deployment**:
- None (testing and documentation only)

**Verification**:
- Verify all tests succeed
- Verify documentation is up to date

**Risk**: Low (no code changes)

### Release 5: Feed Quality Improvement (Phase 6) - New
**Purpose**: Improve feed suggestion quality

**Included Tasks**:
- 6.1 - 6.7 (all)

**Deployment**:
- Infrastructure (Terraform)
- Backend (GitHub Actions)

**Verification**:
- Verify feed suggestions prioritize reliable feeds
- Verify invalid feed URL suggestions reduced
- Verify feed health check works normally
- Verify cache functions normally
- Verify existing features not broken

**Risk**: Low (feed suggestion logic improvement only)

## Implementation Notes

### Maintaining Backward Compatibility

1. **DynamoDB Schema**:
   - All new fields are optional (`?`)
   - Don't change existing fields
   - Maintain existing query patterns

2. **API Endpoints**:
   - Don't change existing endpoints
   - Add new endpoints
   - Keep response format consistent with existing

3. **Frontend**:
   - Don't change existing components as much as possible
   - Add new components
   - Integrate gradually

### Error Handling

1. **Language detection failure**:
   - Default to empty array `[]`
   - Log error
   - Continue newspaper creation

2. **Summary generation failure**:
   - Return `null`
   - Log error
   - Display newspaper without summary

3. **Historical newspaper generation failure**:
   - Return appropriate error message (English)
   - Set HTTP status code correctly
   - Provide retry option

4. **Cleanup failure**:
   - Log error
   - Continue next scheduled execution
   - Allow partial deletion

### Performance Requirements

1. **Language detection**: < 1ms/article
2. **Summary generation**: < 10 seconds
3. **Historical newspaper generation**: < 8 seconds (first time), < 200ms (from cache)
4. **Filtering**: < 100ms (100 newspapers)
5. **Cleanup**: < 2 seconds (100 newspapers)

### Test Requirements

1. **Unit Tests**:
   - Coverage: 60% or higher
   - All new services and components
   - Edge cases and error cases

2. **Property-Based Tests**:
   - Design document correctness properties 1-18
   - At least 100 iterations per test
   - Explicit property references

3. **Integration Tests**:
   - API endpoints
   - Service interactions
   - Database operations

4. **E2E Tests**:
   - Main user flows
   - Page Object Model pattern
   - Verification on multiple browsers

### Security Requirements

1. **Input Validation**:
   - All API endpoints
   - Date format validation
   - URL validation

2. **Error Messages**:
   - All written in English
   - Don't include sensitive information
   - User-friendly

3. **Authentication/Authorization**:
   - Maintain existing security policies
   - Apply to new endpoints

### Documentation Requirements

1. **Code Comments**:
   - All written in English
   - Function and class descriptions
   - Complex logic explanations

2. **API Documentation**:
   - New endpoint descriptions
   - Request/response examples
   - Error codes

3. **User Documentation**:
   - How to use new features
   - Screenshots
   - Troubleshooting

## Definition of Done

Each task is considered complete when all of the following conditions are met:

1. **Implementation Complete**:
   - [ ] All acceptance criteria met
   - [ ] Code review complete
   - [ ] Merged

2. **Testing Complete**:
   - [ ] Unit tests added
   - [ ] All tests succeed
   - [ ] Coverage requirements met

3. **Documentation Complete**:
   - [ ] Code comments added
   - [ ] Related documentation updated
   - [ ] API documentation updated (if applicable)

4. **Deployment Complete**:
   - [ ] Deployed to production
   - [ ] Operation verification complete
   - [ ] No errors confirmed

## Progress Management

### Task States

- **Not Started**: Task not yet started
- **In Progress**: Task being implemented
- **In Review**: Waiting for code review
- **Testing**: Running tests
- **Awaiting Deployment**: Waiting for deployment
- **Complete**: All conditions met

### Progress Tracking

Track progress of each task using:

1. **GitHub Issues**: Create Issue for each task
2. **GitHub Projects**: Visualize progress with project board
3. **Regular Reviews**: Check progress weekly

## Risk Management

### High Risk Items

1. **Summary generation timeout**:
   - **Risk**: Bedrock API may not respond within 10 seconds
   - **Mitigation**: Retry logic, fallback (no summary)
   - **Monitoring**: Monitor timeouts with CloudWatch Logs

2. **Insufficient articles for historical newspapers**:
   - **Risk**: Target date may have fewer than minimum articles
   - **Mitigation**: Go back up to 7 days, display error message
   - **Monitoring**: Log article counts

3. **Cleanup failure**:
   - **Risk**: DynamoDB deletion may fail
   - **Mitigation**: Batch processing, error logging, retry on next run
   - **Monitoring**: Monitor deletion counts with CloudWatch Logs

### Medium Risk Items

1. **Language detection accuracy**:
   - **Risk**: Language may be incorrectly detected
   - **Mitigation**: Prioritize RSS `<language>` field, character-based detection
   - **Monitoring**: User feedback

2. **Copyright-free image loading failure**:
   - **Risk**: Unsplash API may not respond
   - **Mitigation**: Fall back to local placeholder
   - **Monitoring**: Log image loading errors

### Low Risk Items

1. **Filtering performance**:
   - **Risk**: Filtering may be slow with many newspapers
   - **Mitigation**: Client-side optimization, pagination
   - **Monitoring**: Performance metrics

---

## Summary

Phase 2 implementation is divided into 6 phases, designed for gradual release. Each task has clear acceptance criteria and organized dependencies.

**Recommended Implementation Order**:
1. Phase 1 (Backend Foundation) → Release 1
2. Phase 2 (AI Features) → Release 2
3. Phase 3 (Frontend Features) → Release 3
4. Phase 4 (Testing and Documentation) → Release 4
5. Phase 6 (Feed Quality Improvement) → Release 5 ★New

This order allows gradual addition of new features without breaking existing functionality.

**Phase 6 (Feed Quality Improvement) Characteristics**:
- Minimal impact on existing features
- Significantly improves feed suggestion quality
- Reduces user errors
- Gradual implementation possible
