# Feed Usage Tracking - Design

**Issue**: #50  
**Phase**: 3.5

## Architecture

```
Newspaper Generation → Record Usage → DynamoDB
                                    ↓
Feed Suggestions ← Query Popular ← Cache (5min)
```

## Data Model

### DynamoDB Schema
```typescript
PK: FEED_USAGE#{url}
SK: CATEGORY#{categoryId}
GSI1PK: CATEGORY#{categoryId}
GSI1SK: USAGE_COUNT#{count}  // Padded for sorting

{
  url: string,
  categoryId: string,
  title: string,
  usageCount: number,
  lastUsedAt: string,
  successRate: number,        // 0-100
  averageArticles: number,
  createdAt: string,
  updatedAt: string
}
```

### Statistics Calculation
```typescript
// On each usage:
newCount = oldCount + 1
newSuccessCount = (oldRate * oldCount / 100) + (success ? 1 : 0)
newSuccessRate = (newSuccessCount / newCount) * 100
newAvgArticles = (oldAvg * oldCount + articleCount) / newCount
```

## Components

### 1. Repository Layer
**File**: `feedUsageRepository.ts`
- `recordFeedUsage()` - Upsert with statistics
- `getFeedUsage()` - Get specific usage
- `getPopularFeedsByCategory()` - Query top feeds

### 2. Service Layer
**File**: `feedUsageService.ts`
- Business logic wrapper
- Error handling
- Logging

### 3. Integration Points

#### A. Newspaper Service
```typescript
// After successful generation
await recordFeedUsage({
  url: feed.url,
  categoryId: category.categoryId,
  title: feed.title,
  articleCount: articles.length,
  success: articles.length > 0
});
```

#### B. Bedrock Service
```typescript
// Get popular feeds
const popularFeeds = await getPopularFeedsByCategory(categoryId, 5);

// Merge with priority
const allFeeds = [
  ...popularFeeds,      // Highest priority
  ...bedrockFeeds,
  ...categoryFeeds,
  ...defaultFeeds
];
```

## Performance

### Caching Strategy
- Cache popular feeds: 5 minutes
- Cache key: `popular_feeds:{categoryId}`
- Invalidate on new usage (optional)

### Async Recording
- Don't block newspaper generation
- Fire-and-forget pattern
- Log errors, don't throw

## Error Handling

### Recording Failures
```typescript
try {
  await recordFeedUsage(input);
} catch (error) {
  console.error('Failed to record usage:', error);
  // Continue - don't fail newspaper generation
}
```

### Query Failures
```typescript
try {
  return await getPopularFeeds(categoryId);
} catch (error) {
  console.error('Failed to get popular feeds:', error);
  return []; // Return empty, use other sources
}
```

## Monitoring

### CloudWatch Metrics
- `FeedUsage.RecordCount` - Total recordings
- `FeedUsage.RecordErrors` - Failed recordings
- `FeedUsage.QueryLatency` - Query performance
- `FeedUsage.CacheHitRate` - Cache effectiveness

### Logs
- `[FeedUsage] Recorded: {url} for {categoryId}`
- `[FeedUsage] Popular feeds: {count} for {categoryId}`
- `[FeedUsage] Error: {message}`
