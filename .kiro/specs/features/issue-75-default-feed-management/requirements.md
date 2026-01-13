# Requirements Document - Issue #75: Default Feed Management

## Introduction

This document defines the requirements for centralizing default feed management in MyRSSPress. The current implementation has default feeds hardcoded in multiple places and includes them directly in newspapers, leading to article imbalance in historical newspapers. This feature will centralize default feed management, create a dedicated API for fetching default feed articles, and ensure consistent article balancing across all newspaper types.

**Related Issue:** [#75](https://github.com/kumagaias/my-rss-press/issues/75)

## Glossary

- **Default Feed**: Pre-configured RSS feeds provided by the system when AI suggestions fail or return insufficient feeds
- **Article Balance**: Distribution of articles across different feeds to prevent any single feed from dominating
- **Historical Newspaper**: Past newspaper generated for a specific date (up to 7 days ago)
- **Article Limit**: Maximum number of articles allowed per feed in a newspaper
- **Centralized Management**: Single source of truth for default feed configuration

## Problem Statement

### Current Issues

1. **Article Imbalance**: Historical newspapers show 5/8 articles from Guardian (62.5%), poor user experience
2. **Hardcoded Feeds**: Default feeds defined in multiple files (`bedrockService.ts`, `categoryFallback.ts`)
3. **Inconsistent Logic**: Regular newspapers use balancing, historical newspapers use random selection
4. **No Article Limits**: Default feeds not limited in historical newspapers
5. **Maintenance Burden**: Updating default feeds requires changes in multiple places

### Root Cause

- Regular newspaper generation: Uses `balanceArticlesAcrossFeed` + `articleLimiter`
- Historical newspaper generation: Random selection without balancing
- Guardian has ~45 articles/day, so random selection heavily favors it

## Requirements

### Requirement 1: Centralized Default Feed Service

**User Story:** As a system, I want to manage default feeds in one place, so that updates are consistent across the application.

**Priority:** High

#### Acceptance Criteria

1. WHEN default feeds are needed THEN the system SHALL retrieve them from a centralized service
2. WHEN the service is initialized THEN it SHALL define default feeds for EN and JP locales
3. WHEN a locale is specified THEN the service SHALL return appropriate default feeds
4. WHEN default feeds are updated THEN only one file SHALL need modification
5. WHEN the service is called THEN it SHALL return feed metadata (URL, title, language)

**Implementation Details:**
- File: `backend/src/services/defaultFeedService.ts`
- Exports: `getDefaultFeeds(locale: 'en' | 'ja'): DefaultFeed[]`
- Default feeds: 4 per locale (EN: BBC, NYT, Reuters, Guardian / JP: NHK, Asahi, Yahoo, ITmedia)

### Requirement 2: Default Feed API Endpoint

**User Story:** As a client, I want to fetch default feed articles via API, so that I can include them in newspapers on-demand.

**Priority:** High

#### Acceptance Criteria

1. WHEN the API is called with locale THEN it SHALL return articles from default feeds for that locale
2. WHEN the API is called with a date parameter THEN it SHALL return articles from that specific date
3. WHEN the API is called without a date THEN it SHALL return articles from the last 7 days
4. WHEN fetching articles THEN the system SHALL limit to 2 articles per feed
5. WHEN a feed fails to fetch THEN the system SHALL continue with other feeds
6. WHEN all feeds fail THEN the system SHALL return an empty array
7. WHEN the API response is returned THEN it SHALL include article metadata (title, description, link, pubDate, imageUrl, feedSource, feedTitle, importance)

**API Specification:**
```
GET /api/default-feeds?locale={locale}&date={date}

Query Parameters:
- locale: 'en' | 'ja' (required)
- date: YYYY-MM-DD (optional, defaults to last 7 days)

Response:
{
  "articles": Article[],
  "totalFeeds": number,
  "successfulFeeds": number
}
```

**Implementation Details:**
- Route: `backend/src/routes/defaultFeeds.ts`
- Service: `backend/src/services/defaultFeedService.ts`
- Article limit: 2 per feed (configurable)

### Requirement 3: Remove Default Feeds from Newspapers

**User Story:** As a system, I want to store only user-selected feeds in newspapers, so that default feeds can be managed separately.

**Priority:** High

#### Acceptance Criteria

1. WHEN a newspaper is created THEN the system SHALL NOT include default feeds in `feedUrls`
2. WHEN saving a newspaper THEN the system SHALL filter out default feed URLs
3. WHEN displaying a newspaper THEN the system SHALL fetch default feed articles separately
4. WHEN an existing newspaper is retrieved THEN the system SHALL continue to work (backward compatible)
5. WHEN a newspaper has default feeds in `feedUrls` THEN the system SHALL still display them correctly

**Implementation Details:**
- Update: `backend/src/services/newspaperService.ts`
- Filter default feeds before saving
- Maintain backward compatibility for existing newspapers

### Requirement 4: Consistent Article Balancing

**User Story:** As a user, I want balanced article distribution in all newspapers, so that no single feed dominates.

**Priority:** High

#### Acceptance Criteria

1. WHEN generating a regular newspaper THEN the system SHALL apply article balancing
2. WHEN generating a historical newspaper THEN the system SHALL apply the same article balancing
3. WHEN balancing articles THEN the system SHALL use `balanceArticlesAcrossFeed`
4. WHEN limiting articles THEN the system SHALL use `articleLimiter`
5. WHEN default feed articles are included THEN they SHALL be limited to 2 per feed
6. WHEN user-selected feed articles are included THEN they SHALL follow existing limits

**Implementation Details:**
- Update: `backend/src/services/historicalNewspaperService.ts`
- Use same balancing logic as regular newspaper generation
- Apply `articleLimiter` to all feeds including defaults

### Requirement 5: Date-Aware Default Feed Fetching

**User Story:** As a system, I want to fetch default feed articles for specific dates, so that historical newspapers show relevant content.

**Priority:** Medium

#### Acceptance Criteria

1. WHEN fetching default feed articles for a date THEN the system SHALL filter by that date
2. WHEN the target date has insufficient articles THEN the system SHALL expand to 7 days prior
3. WHEN fetching for today THEN the system SHALL include articles up to current time (JST)
4. WHEN fetching for past dates THEN the system SHALL include full day (00:00-23:59 JST)
5. WHEN date validation fails THEN the system SHALL return 400 error

**Implementation Details:**
- Service: `backend/src/services/defaultFeedService.ts`
- Method: `fetchDefaultFeedArticles(locale, date?, limit?)`
- Timezone: JST (Asia/Tokyo)

### Requirement 6: Backward Compatibility

**User Story:** As a system, I want existing newspapers to continue working, so that users don't lose access to their content.

**Priority:** High

#### Acceptance Criteria

1. WHEN an existing newspaper contains default feeds THEN it SHALL display correctly
2. WHEN retrieving an existing newspaper THEN the system SHALL not modify its `feedUrls`
3. WHEN generating historical newspapers from existing newspapers THEN the system SHALL handle both old and new formats
4. WHEN displaying articles THEN the system SHALL merge default feed articles if needed
5. WHEN a newspaper has no default feeds THEN the system SHALL not fetch them

**Implementation Details:**
- No migration required
- Handle both formats in display logic
- Gradual transition as new newspapers are created

## Non-Functional Requirements

### Performance

- Default feed API response time: < 5 seconds
- Article fetching per feed: < 2 seconds (with 2s timeout)
- Parallel fetching: All default feeds fetched concurrently
- Caching: Consider caching default feed articles (future enhancement)

### Scalability

- Support up to 10 default feeds per locale
- Handle concurrent requests for default feed articles
- Efficient article filtering and balancing

### Reliability

- Default feed fetch failure SHALL NOT prevent newspaper generation
- Individual feed failures SHALL NOT affect other feeds
- All errors SHALL be logged to CloudWatch Logs
- Fallback: Return empty array if all feeds fail

### Security

- Input validation for locale and date parameters
- Prevent injection attacks in date parsing
- Error messages SHALL NOT expose sensitive information
- All error messages SHALL be in English

### Maintainability

- Single source of truth for default feeds
- Easy to add/remove/update default feeds
- Clear separation of concerns
- Well-documented code

## Success Criteria

- [ ] Default feeds managed in centralized service
- [ ] API endpoint returns date-aware default feed articles
- [ ] Default feeds limited to 2 articles each
- [ ] Historical newspapers use same balancing logic as regular newspapers
- [ ] No default feeds stored in new newspaper `feedUrls`
- [ ] Existing newspapers continue to work
- [ ] Unit tests for default feed service (>80% coverage)
- [ ] Integration tests for API endpoint
- [ ] No regressions in existing features
- [ ] Performance meets requirements

## Dependencies

- Existing RSS fetcher service
- Existing article balancing logic
- Existing article limiter
- DynamoDB for newspaper storage

## Out of Scope

The following are explicitly out of scope for this feature:

- Migration of existing newspapers (backward compatibility maintained instead)
- Caching of default feed articles (future enhancement)
- User-configurable default feeds
- Dynamic default feed selection based on theme
- Feed health monitoring
- Feed quality scoring

## Related Documents

- [Design Document](./design.md)
- [Tasks Document](./tasks.md)
- [Issue #75](https://github.com/kumagaias/my-rss-press/issues/75)
- [Postmortem: feedTitle not displaying](../../../docs/postmortem/2026-01-13-feedtitle-not-displaying.md)
