# Design Document - Phase 3: Dynamic Category Management

## Architecture Overview

Phase 3 introduces a dynamic category management system using DynamoDB, replacing hardcoded constants with database-driven configuration.

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (bedrockService.ts, feedSuggestionService.ts)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  categoryService.ts                                   │  │
│  │  - getCategoryByTheme(theme, locale)                 │  │
│  │  - getAllCategories(locale)                          │  │
│  │  - getFeedsByCategory(categoryId)                    │  │
│  │  - createCategory(), updateCategory(), etc.         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cache Layer                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  categoryCache.ts                                     │  │
│  │  - In-memory cache (5-minute TTL)                    │  │
│  │  - Background refresh                                │  │
│  │  - Fallback to stale cache on error                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  categoryRepository.ts                                │  │
│  │  - DynamoDB access layer                             │  │
│  │  - Query/Put/Update/Delete operations               │  │
│  │  - GSI queries for locale-based filtering           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      DynamoDB                                │
│  Table: myrsspress-newspapers-production                    │
│  - Categories: PK=CATEGORY#{id}, SK=METADATA               │
│  - Feeds: PK=CATEGORY#{id}, SK=FEED#{url}                 │
│  - GSI1: Locale-based queries                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Category Entity

```typescript
interface Category {
  categoryId: string;        // e.g., "technology", "business"
  parentCategory?: string;   // e.g., "tech", "news"
  locale: 'en' | 'ja';      // Language
  displayName: string;       // e.g., "Technology", "テクノロジー"
  keywords: string[];        // e.g., ["tech", "technology", "IT"]
  order: number;             // Sort order (lower = higher priority)
  isActive: boolean;         // Active/inactive status
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}
```

### Feed Entity

```typescript
interface Feed {
  categoryId: string;        // Parent category
  url: string;               // RSS feed URL
  title: string;             // Feed title
  description: string;       // Feed description
  language: string;          // Feed language
  priority: number;          // Sort order (lower = higher priority)
  isActive: boolean;         // Active/inactive status
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}
```

## DynamoDB Schema

### Table Structure

Using existing `myrsspress-newspapers-production` table:

**Categories:**
```
PK: CATEGORY#{categoryId}
SK: METADATA
GSI1PK: CATEGORY_LOCALE#{locale}
GSI1SK: ORDER#{order}

Attributes: (all Category fields)
```

**Feeds:**
```
PK: CATEGORY#{categoryId}
SK: FEED#{url}

Attributes: (all Feed fields)
```

### Access Patterns

1. **Get category by ID**
   - Query: PK = `CATEGORY#{categoryId}`, SK = `METADATA`

2. **Get all categories by locale**
   - Query GSI1: GSI1PK = `CATEGORY_LOCALE#{locale}`, sort by GSI1SK

3. **Get feeds by category**
   - Query: PK = `CATEGORY#{categoryId}`, SK begins_with `FEED#`

4. **Get category by theme (keyword matching)**
   - Scan all categories (cached), match keywords in memory

## Cache Strategy

### In-Memory Cache

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // 5 minutes = 300000ms
}

class CategoryCache {
  private categoriesCache: Map<string, CacheEntry<Category[]>>;
  private feedsCache: Map<string, CacheEntry<Feed[]>>;
  
  async getCategories(locale: string): Promise<Category[]>;
  async getFeeds(categoryId: string): Promise<Feed[]>;
  invalidate(key: string): void;
  clear(): void;
}
```

### Cache Behavior

1. **Cache Hit**: Return cached data immediately (< 10ms)
2. **Cache Miss**: Query DynamoDB, cache result, return (< 100ms)
3. **Cache Expired**: Background refresh, return stale data
4. **DynamoDB Error**: Return stale cache if available, otherwise fallback

## Fallback Mechanism

### Fallback Strategy

```typescript
async function getCategoryByTheme(theme: string, locale: string): Promise<Category | null> {
  try {
    // Try DynamoDB first
    return await categoryService.getCategoryByTheme(theme, locale);
  } catch (error) {
    console.error('DynamoDB error, falling back to constants:', error);
    // Fallback to reliableFeeds.ts
    return getCategoryFromConstants(theme, locale);
  }
}
```

### Fallback Conditions

- DynamoDB service unavailable
- Network timeout
- Query errors
- Empty results (use constants as default)

## Migration Strategy

### Phase 3.1: Foundation
1. Create type definitions
2. Implement Repository layer
3. Implement Service layer
4. Add unit tests

### Phase 3.2: Data Migration
1. Create migration script
2. Implement cache layer
3. Test migration locally
4. Verify data integrity

### Phase 3.3: Integration
1. Update bedrockService to use categoryService
2. Implement fallback mechanism
3. Update existing tests
4. Add integration tests

### Phase 3.4: Admin API
1. Create admin routes
2. Implement CRUD operations
3. Add validation
4. Add API tests

### Phase 3.5: Deployment
1. Run migration in production
2. Deploy new code
3. Verify functionality
4. Remove old constants (after verification)

## API Design

### Admin API Endpoints

**Categories:**
- `POST /api/admin/categories` - Create category
- `GET /api/admin/categories` - List all categories
- `GET /api/admin/categories/:id` - Get category by ID
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Deactivate category

**Feeds:**
- `POST /api/admin/feeds` - Create feed
- `GET /api/admin/feeds/:categoryId` - List feeds by category
- `PUT /api/admin/feeds/:categoryId/:url` - Update feed
- `DELETE /api/admin/feeds/:categoryId/:url` - Deactivate feed

### Request/Response Examples

**Create Category:**
```json
POST /api/admin/categories
{
  "categoryId": "technology",
  "parentCategory": "tech",
  "locale": "en",
  "displayName": "Technology",
  "keywords": ["tech", "technology", "IT", "software"],
  "order": 1
}

Response: 201 Created
{
  "categoryId": "technology",
  "parentCategory": "tech",
  "locale": "en",
  "displayName": "Technology",
  "keywords": ["tech", "technology", "IT", "software"],
  "order": 1,
  "isActive": true,
  "createdAt": "2025-12-30T07:00:00.000Z",
  "updatedAt": "2025-12-30T07:00:00.000Z"
}
```

## Performance Considerations

### Optimization Strategies

1. **Cache First**: Always check cache before DynamoDB
2. **Batch Operations**: Use BatchGetItem for multiple categories
3. **GSI Queries**: Use GSI for locale-based filtering
4. **Background Refresh**: Refresh cache asynchronously
5. **Connection Pooling**: Reuse DynamoDB connections

### Performance Targets

- Cache hit: < 10ms
- DynamoDB query: < 100ms
- Cache refresh: < 200ms (background)
- Admin API: < 500ms

## Error Handling

### Error Types

1. **DynamoDB Errors**: Network, timeout, throttling
2. **Validation Errors**: Invalid input data
3. **Not Found Errors**: Category/feed doesn't exist
4. **Conflict Errors**: Duplicate category/feed

### Error Response Format

```json
{
  "error": "CATEGORY_NOT_FOUND",
  "message": "Category 'invalid-id' not found",
  "code": 404
}
```

## Testing Strategy

### Unit Tests
- Repository layer: Mock DynamoDB
- Service layer: Mock Repository
- Cache layer: Test TTL, refresh, invalidation

### Integration Tests
- Admin API: Test CRUD operations
- Category matching: Test keyword matching
- Fallback: Test DynamoDB failure scenarios

### Performance Tests
- Cache hit rate: > 90%
- Query latency: < 100ms (p95)
- Concurrent requests: 100 req/s

## Security Considerations

### Phase 3 (No Authentication)
- Admin API is unauthenticated
- Only accessible from internal network
- Rate limiting applied

### Future (Phase 4+)
- Add authentication (JWT)
- Add authorization (admin role)
- Add audit logging
- Add input sanitization

## Monitoring & Observability

### Metrics
- Cache hit rate
- DynamoDB query latency
- Fallback usage count
- Admin API usage

### Logs
- Category/feed CRUD operations
- Cache refresh events
- Fallback events
- Error events

### Alarms
- High DynamoDB error rate
- Low cache hit rate
- High fallback usage
- Admin API errors

## Rollback Plan

### Rollback Strategy

1. **Immediate Rollback**: Revert to previous deployment
2. **Fallback Activation**: Force fallback to constants
3. **Data Rollback**: Restore from DynamoDB backup
4. **Gradual Rollback**: Disable features incrementally

### Rollback Triggers

- High error rate (> 5%)
- Performance degradation (> 2x latency)
- Data corruption detected
- Critical bug discovered

## Future Enhancements

### Phase 4+
- Admin UI for category management
- Authentication & authorization
- Multi-language support (beyond en/ja)
- A/B testing for categories
- Analytics & reporting
- Automatic feed health checks
- Category recommendations
- User-defined categories

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-30  
**Status**: Draft
