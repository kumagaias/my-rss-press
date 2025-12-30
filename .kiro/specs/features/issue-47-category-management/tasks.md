# Tasks - Phase 3: Dynamic Category Management

## Phase 3.1: Foundation (Backend Core)

### Task 3.1.1: Type Definitions
**Status**: ✅ Complete  
**Estimated Time**: 30 minutes

Create TypeScript interfaces for Category and Feed entities.

**Files to Create:**
- `backend/src/types/category.ts`

**Implementation:**
```typescript
export interface Category {
  categoryId: string;
  parentCategory?: string;
  locale: 'en' | 'ja';
  displayName: string;
  keywords: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Feed {
  categoryId: string;
  url: string;
  title: string;
  description: string;
  language: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithFeeds extends Category {
  feeds: Feed[];
}
```

**Acceptance Criteria:**
- [ ] Type definitions match design document
- [ ] Exported from types/category.ts
- [ ] No compilation errors

---

### Task 3.1.2: Category Repository
**Status**: ✅ Complete  
**Estimated Time**: 2 hours

Implement DynamoDB access layer for categories and feeds.

**Files to Create:**
- `backend/src/repositories/categoryRepository.ts`

**Implementation:**
- DynamoDB DocumentClient with `removeUndefinedValues: true`
- Methods:
  - `getCategoryById(categoryId: string): Promise<Category | null>`
  - `getCategoriesByLocale(locale: string): Promise<Category[]>`
  - `getAllCategories(): Promise<Category[]>`
  - `createCategory(category: Category): Promise<Category>`
  - `updateCategory(categoryId: string, updates: Partial<Category>): Promise<Category>`
  - `deleteCategory(categoryId: string): Promise<void>`
  - `getFeedsByCategory(categoryId: string): Promise<Feed[]>`
  - `createFeed(feed: Feed): Promise<Feed>`
  - `updateFeed(categoryId: string, url: string, updates: Partial<Feed>): Promise<Feed>`
  - `deleteFeed(categoryId: string, url: string): Promise<void>`

**DynamoDB Keys:**
- Categories: `PK=CATEGORY#{categoryId}`, `SK=METADATA`
- Feeds: `PK=CATEGORY#{categoryId}`, `SK=FEED#{url}`
- GSI1: `GSI1PK=CATEGORY_LOCALE#{locale}`, `GSI1SK=ORDER#{order}`

**Acceptance Criteria:**
- [ ] All CRUD operations implemented
- [ ] GSI queries for locale filtering
- [ ] Error handling for DynamoDB errors
- [ ] Returns null for not found items

---

### Task 3.1.3: Category Service
**Status**: ✅ Complete  
**Estimated Time**: 2 hours

Implement business logic layer for category management.

**Files to Create:**
- `backend/src/services/categoryService.ts`

**Implementation:**
- Methods:
  - `getCategoryByTheme(theme: string, locale: string): Promise<Category | null>`
  - `getAllCategories(locale?: string): Promise<Category[]>`
  - `getCategoryById(categoryId: string): Promise<Category | null>`
  - `getFeedsByCategory(categoryId: string): Promise<Feed[]>`
  - `createCategory(category: Omit<Category, 'createdAt' | 'updatedAt'>): Promise<Category>`
  - `updateCategory(categoryId: string, updates: Partial<Category>): Promise<Category>`
  - `deleteCategory(categoryId: string): Promise<void>`
  - `createFeed(feed: Omit<Feed, 'createdAt' | 'updatedAt'>): Promise<Feed>`
  - `updateFeed(categoryId: string, url: string, updates: Partial<Feed>): Promise<Feed>`
  - `deleteFeed(categoryId: string, url: string): Promise<void>`

**Keyword Matching Logic:**
```typescript
// Case-insensitive keyword matching
const normalizedTheme = theme.toLowerCase();
const matchingCategory = categories.find(cat =>
  cat.keywords.some(keyword => normalizedTheme.includes(keyword.toLowerCase()))
);
```

**Acceptance Criteria:**
- [ ] Keyword matching is case-insensitive
- [ ] Returns categories sorted by order
- [ ] Filters inactive categories
- [ ] Auto-generates timestamps for create/update

---

### Task 3.1.4: Unit Tests for Repository
**Status**: ✅ Complete  
**Estimated Time**: 1.5 hours

**Files to Create:**
- `backend/tests/unit/repositories/categoryRepository.test.ts`

**Test Cases:**
- Get category by ID (found/not found)
- Get categories by locale
- Get all categories
- Create category
- Update category
- Delete category (soft delete)
- Get feeds by category
- Create feed
- Update feed
- Delete feed

**Acceptance Criteria:**
- [ ] 100% code coverage for repository
- [ ] Mock DynamoDB DocumentClient
- [ ] Test error scenarios

---

### Task 3.1.5: Unit Tests for Service
**Status**: ✅ Complete  
**Estimated Time**: 1.5 hours

**Files to Create:**
- `backend/tests/unit/services/categoryService.test.ts`

**Test Cases:**
- Get category by theme (match/no match)
- Get all categories (with/without locale filter)
- Get category by ID
- Get feeds by category
- Create category (success/validation error)
- Update category
- Delete category
- Create feed
- Update feed
- Delete feed
- Keyword matching (case-insensitive)

**Acceptance Criteria:**
- [ ] 100% code coverage for service
- [ ] Mock repository layer
- [ ] Test business logic edge cases

---

## Phase 3.2: Data Migration & Cache

### Task 3.2.1: Category Cache Implementation
**Status**: ✅ Complete  
**Estimated Time**: 2 hours

**Files to Create:**
- `backend/src/services/categoryCache.ts`

**Implementation:**
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CategoryCache {
  private categoriesCache: Map<string, CacheEntry<Category[]>>;
  private feedsCache: Map<string, CacheEntry<Feed[]>>;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async getCategories(locale: string): Promise<Category[]>;
  async getFeeds(categoryId: string): Promise<Feed[]>;
  invalidate(key: string): void;
  clear(): void;
  private isExpired(entry: CacheEntry<any>): boolean;
  private backgroundRefresh(key: string): void;
}
```

**Cache Behavior:**
- Cache hit: Return immediately
- Cache miss: Query DynamoDB, cache, return
- Cache expired: Return stale data, refresh in background
- DynamoDB error: Return stale cache if available

**Acceptance Criteria:**
- [ ] 5-minute TTL implemented
- [ ] Background refresh on expiry
- [ ] Fallback to stale cache on error
- [ ] Thread-safe cache operations

---

### Task 3.2.2: Migration Script
**Status**: ✅ Complete  
**Estimated Time**: 2 hours

**Files to Create:**
- `backend/src/scripts/migrateCategories.ts`

**Implementation:**
- Read from `backend/src/constants/reliableFeeds.ts`
- Transform to Category and Feed entities
- Batch write to DynamoDB
- Preserve hierarchical structure
- Set appropriate order values

**Script Features:**
- Dry-run mode (preview without writing)
- Rollback capability
- Progress logging
- Error handling

**Acceptance Criteria:**
- [ ] Migrates all categories from reliableFeeds.ts
- [ ] Migrates all feeds with correct categoryId
- [ ] Preserves parent-child relationships
- [ ] Sets isActive=true for all items
- [ ] Logs migration progress

---

### Task 3.2.3: Cache Unit Tests
**Status**: ✅ Complete  
**Estimated Time**: 1 hour

**Files to Create:**
- `backend/tests/unit/services/categoryCache.test.ts`

**Test Cases:**
- Cache hit (return immediately)
- Cache miss (query DynamoDB)
- Cache expiry (background refresh)
- DynamoDB error (return stale cache)
- Cache invalidation
- Cache clear

**Acceptance Criteria:**
- [ ] 100% code coverage
- [ ] Test TTL behavior
- [ ] Test background refresh
- [ ] Test error scenarios

---

### Task 3.2.4: Run Migration Locally
**Status**: ⏸️ Pending (Post-Deployment)  
**Estimated Time**: 30 minutes

**Steps:**
1. Set up local DynamoDB or use AWS credentials
2. Run migration script in dry-run mode
3. Verify output
4. Run actual migration
5. Query DynamoDB to verify data

**Acceptance Criteria:**
- [ ] Migration completes without errors
- [ ] All categories exist in DynamoDB
- [ ] All feeds exist in DynamoDB
- [ ] Data structure matches design

---

## Phase 3.3: Integration & Fallback

### Task 3.3.1: Update bedrockService
**Status**: ✅ Complete  
**Estimated Time**: 1 hour

**Files to Modify:**
- `backend/src/services/bedrockService.ts`

**Changes:**
- Replace `reliableFeeds` import with `categoryService`
- Use `categoryService.getCategoryByTheme()` for category matching
- Use `categoryService.getFeedsByCategory()` for feed retrieval
- Implement fallback to constants on error

**Acceptance Criteria:**
- [ ] Uses categoryService instead of constants
- [ ] Falls back to constants on DynamoDB error
- [ ] Maintains same API interface
- [ ] Logs fallback events

---

### Task 3.3.2: Fallback Mechanism
**Status**: ✅ Complete  
**Estimated Time**: 1 hour

**Files to Create:**
- `backend/src/services/categoryFallback.ts`

**Implementation:**
```typescript
export async function getCategoryWithFallback(
  theme: string,
  locale: string
): Promise<Category | null> {
  try {
    return await categoryService.getCategoryByTheme(theme, locale);
  } catch (error) {
    console.error('DynamoDB error, falling back to constants:', error);
    return getCategoryFromConstants(theme, locale);
  }
}
```

**Acceptance Criteria:**
- [ ] Tries DynamoDB first
- [ ] Falls back to constants on error
- [ ] Logs fallback usage
- [ ] Returns same data structure

---

### Task 3.3.3: Update Existing Tests
**Status**: ✅ Complete  
**Estimated Time**: 1 hour

**Files to Modify:**
- `backend/tests/unit/services/bedrockService.test.ts`
- Any other tests using reliableFeeds

**Changes:**
- Mock categoryService instead of reliableFeeds
- Update test data to match new structure
- Add tests for fallback behavior

**Acceptance Criteria:**
- [ ] All existing tests pass
- [ ] Tests use mocked categoryService
- [ ] Fallback scenarios tested

---

### Task 3.3.4: Integration Tests
**Status**: ⏭️ Skipped (Unit tests sufficient)  
**Estimated Time**: 1.5 hours

**Files to Create:**
- `backend/tests/integration/categoryManagement.test.ts`

**Test Cases:**
- End-to-end category creation and retrieval
- End-to-end feed creation and retrieval
- Category matching with real DynamoDB
- Cache behavior with real DynamoDB
- Fallback behavior (simulate DynamoDB failure)

**Acceptance Criteria:**
- [ ] Tests run against local DynamoDB
- [ ] Tests cover happy path and error scenarios
- [ ] Tests verify cache behavior

---

## Phase 3.4: Admin API

### Task 3.4.1: Admin Routes
**Status**: ✅ Complete  
**Estimated Time**: 2 hours

**Files to Create:**
- `backend/src/routes/admin/categories.ts`

**Endpoints:**
- `POST /api/admin/categories` - Create category
- `GET /api/admin/categories` - List all categories
- `GET /api/admin/categories/:id` - Get category by ID
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Deactivate category
- `POST /api/admin/feeds` - Create feed
- `GET /api/admin/feeds/:categoryId` - List feeds by category
- `PUT /api/admin/feeds/:categoryId/:url` - Update feed
- `DELETE /api/admin/feeds/:categoryId/:url` - Deactivate feed

**Acceptance Criteria:**
- [ ] All CRUD endpoints implemented
- [ ] Input validation using Zod
- [ ] Error handling with proper status codes
- [ ] Rate limiting applied

---

### Task 3.4.2: Input Validation
**Status**: ✅ Complete  
**Estimated Time**: 1 hour

**Files to Create:**
- `backend/src/validators/categoryValidators.ts`

**Validation Schemas:**
```typescript
const createCategorySchema = z.object({
  categoryId: z.string().min(1).max(50),
  parentCategory: z.string().optional(),
  locale: z.enum(['en', 'ja']),
  displayName: z.string().min(1).max(100),
  keywords: z.array(z.string()).min(1),
  order: z.number().int().min(0)
});

const createFeedSchema = z.object({
  categoryId: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1).max(200),
  description: z.string().max(500),
  language: z.string().length(2),
  priority: z.number().int().min(0)
});
```

**Acceptance Criteria:**
- [ ] All input fields validated
- [ ] URL validation for feeds
- [ ] Locale validation (en/ja only)
- [ ] Returns 400 for invalid input

---

### Task 3.4.3: Admin API Tests
**Status**: ✅ Complete  
**Estimated Time**: 2 hours

**Files to Create:**
- `backend/tests/unit/routes/admin/categories.test.ts`

**Test Cases:**
- Create category (success/validation error/duplicate)
- List categories (all/by locale)
- Get category by ID (found/not found)
- Update category (success/not found)
- Delete category (success/not found)
- Create feed (success/validation error)
- List feeds by category
- Update feed
- Delete feed

**Acceptance Criteria:**
- [ ] 100% route coverage
- [ ] Test all status codes
- [ ] Test validation errors
- [ ] Mock service layer

---

## Phase 3.5: Deployment & Cleanup

### Task 3.5.1: Terraform Updates
**Status**: ✅ Complete  
**Estimated Time**: 1 hour

**Files to Modify:**
- `infra/modules/dynamodb/main.tf`

**Changes:**
- Add GSI1 for locale-based queries
- Update table schema documentation
- Add tags for category/feed items

**GSI Configuration:**
```hcl
global_secondary_index {
  name            = "GSI1"
  hash_key        = "GSI1PK"
  range_key       = "GSI1SK"
  projection_type = "ALL"
}
```

**Acceptance Criteria:**
- [ ] GSI1 added to DynamoDB table
- [ ] Terraform plan shows only GSI addition
- [ ] No data loss during update

---

### Task 3.5.2: Run Migration in Production
**Status**: ⏸️ Pending (Post-Deployment)  
**Estimated Time**: 30 minutes

**Steps:**
1. Backup DynamoDB table
2. Run migration script in dry-run mode
3. Verify output
4. Run actual migration
5. Verify data in production DynamoDB

**Acceptance Criteria:**
- [ ] Backup created
- [ ] Migration completes successfully
- [ ] All data verified in production
- [ ] No errors in CloudWatch logs

---

### Task 3.5.3: Deploy Backend
**Status**: ⏸️ Pending (Post-PR Merge)  
**Estimated Time**: 30 minutes

**Steps:**
1. Run all tests locally
2. Commit and push changes
3. Wait for GitHub Actions to build and deploy
4. Verify deployment in AWS Console
5. Test API endpoints in production

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] GitHub Actions succeeds
- [ ] Lambda function updated
- [ ] API endpoints respond correctly

---

### Task 3.5.4: Verify Functionality
**Status**: ⏸️ Pending (Post-Deployment)  
**Estimated Time**: 30 minutes

**Verification Steps:**
1. Test feed suggestions with various themes
2. Verify category matching works
3. Test admin API endpoints
4. Check CloudWatch logs for errors
5. Monitor cache hit rate

**Acceptance Criteria:**
- [ ] Feed suggestions work correctly
- [ ] Category matching is accurate
- [ ] Admin API responds correctly
- [ ] No errors in logs
- [ ] Cache hit rate > 90%

---

### Task 3.5.5: Remove Old Constants (Optional)
**Status**: ⏸️ Pending (After 1 Week Monitoring)  
**Estimated Time**: 30 minutes

**Files to Modify/Delete:**
- `backend/src/constants/reliableFeeds.ts` (delete or mark deprecated)
- Remove fallback code after verification period

**Steps:**
1. Wait 1 week after deployment
2. Verify no fallback usage in logs
3. Remove reliableFeeds.ts
4. Remove fallback code
5. Update tests

**Acceptance Criteria:**
- [ ] No fallback usage in 1 week
- [ ] Old constants removed
- [ ] All tests still pass
- [ ] Code cleanup complete

---

## Summary

**Total Estimated Time**: ~24 hours

**Phase Breakdown:**
- Phase 3.1 (Foundation): ~7.5 hours
- Phase 3.2 (Migration & Cache): ~5.5 hours
- Phase 3.3 (Integration): ~4.5 hours
- Phase 3.4 (Admin API): ~5 hours
- Phase 3.5 (Deployment): ~2.5 hours

**Priority Order:**
1. Phase 3.1 (Foundation) - Required for everything else
2. Phase 3.2 (Migration & Cache) - Required for data and performance
3. Phase 3.3 (Integration) - Required for production use
4. Phase 3.4 (Admin API) - Nice to have, can be done later
5. Phase 3.5 (Deployment) - Final step

**Recommended Approach:**
- Complete Phase 3.1-3.3 first (core functionality)
- Deploy and verify in production
- Add Phase 3.4 (Admin API) in a follow-up PR
- Phase 3.5.5 (cleanup) can wait until system is stable
