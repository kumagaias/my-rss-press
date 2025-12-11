# Product Specification - MyRSSPress

This document describes the product specifications for MyRSSPress.

**Related Documents:**
- [tech.md](./tech.md) - Technical architecture
- [tech-common.md](./tech-common.md) - General best practices
- [structure.md](./structure.md) - Project structure
- [project-standards.md](./project-standards.md) - Project standards

---

## Product Overview

MyRSSPress is a web application that transforms RSS feeds into visually appealing newspaper-style layouts. Users enter topics of interest, receive AI-powered RSS feed suggestions, select feeds, and generate personalized digital newspapers with realistic paper textures and intelligent article layouts.

**Target Users:** Primarily US/UK (English-speaking) users, with Japanese language support for Japanese users.

**Primary Region:** US/UK (English-speaking countries)

## Core Features

### 1. Multi-language Support

**Feature:** Display interface in Japanese or English based on browser language settings

**Specifications:**
- Browser language is Japanese → Japanese UI
- Browser language is not Japanese → English UI
- Translate all UI text, labels, and messages
- Date formatting also adapts to locale

**Implementation:**
- Manage translations in `lib/i18n.ts`
- Get translations with `useTranslations(locale)` hook
- Auto-detect browser language with `detectLocale()`

### 2. Unified Home Screen

**Feature:** Achieve interest input, feed management, and popular newspaper browsing on one screen

**Sections:**
1. **Interest Input Section**
   - Theme keyword input
   - Submit with Enter key or button
   - AI-driven feed suggestions

2. **Feed Management Section**
   - Manual feed URL addition
   - Feed deletion
   - Duplicate prevention

3. **Popular Newspapers Section**
   - Display public newspapers created by other users
   - Sort: By popularity (view count) / By recency (creation date)
   - Newspaper cards: Thumbnail, title, creator, date, topics, view count

### 3. AI Feed Suggestions

**Feature:** AI suggests RSS feeds based on theme

**Specifications:**
- **AI**: AWS Bedrock (Claude 3 Haiku)
- **Suggestion count**: 10 feeds
- **Validation**: Check URL existence (HEAD request, 5 second timeout)
- **Parallel processing**: Parallel validation with Promise.all (up to 15x faster)
- **Fallback**: Supplement with default feeds (BBC, NYT, etc.) if many invalid URLs
- **Minimum guarantee**: 5 feeds

**Performance:**
- Response time: ~30-40 seconds
- Lambda timeout: 60 seconds

**Prompt Constraints:**
- Suggest only real feeds
- Prioritize major media and official sites
- Correct feed URL format (/rss, /feed, /rss.xml, etc.)
- Sort by relevance to theme

### 4. Newspaper Generation

**Feature:** Generate newspaper from selected feeds

**Article Retrieval:**
- **Article count**: 8-15 articles (random)
- **Period**: Latest 3 days → Extend to 7 days if insufficient
- **Priority**: Newest RSS publication date first
- **Data**: Title, description, link, image, publication date

**Article Importance Calculation:**
- **AI**: AWS Bedrock (Claude 3 Haiku)
- **Consideration factors**:
  1. Theme relevance (highest priority)
  2. Image presence (+10 point bonus)
  3. Title length
- **Fallback**: Calculate from title length and image presence if Bedrock fails

**Layout:**
- **Lead article**: Displayed large in main area
  - **Priority 1**: Articles with images (highest importance among them)
  - **Priority 2**: If no images, highest importance article overall
  - Visual appeal is maximized by prioritizing images for main display
- **Top stories**: Next important articles by importance score (3 columns)
- **Others**: Remaining articles by importance score (2 columns)

**Performance:**
- Target: Within 5 seconds
- High load: Under 8 seconds

### 5. Newspaper Settings and Metadata

**Feature:** Set user name and newspaper name after newspaper generation

**Settings:**
- **Newspaper name**: Auto-generated default, user can change
- **User name**: Optional input
- **Public setting**: Public/Private

**Display:**
- Display newspaper name, creation date, user name in newspaper header
- Display saved status

### 6. Paper Texture Design

**Feature:** Visual experience like real newspaper

**Design Elements:**
- **Background**: Realistic paper texture
- **Font**: Serif font (traditional newspaper typography)
- **Consistency**: Unified visual theme across all elements

**Performance:**
- Texture asset loading: Within 2 seconds

### 7. Image Display

**Feature:** Display images if article has them

**Image Sources:**
- RSS enclosure (`<enclosure>` tag)
- Media RSS (`media:content`, `media:thumbnail`)
- `<img>` tags in article content
- Feed's `<image>` tag

**Implementation:**
- Extract with `extractImageUrl()` in `rssFetcherService.ts`
- `imageUrl?: string` field in `Article` interface

### 8. Responsive Design

**Feature:** Display comfortably on all devices

**Breakpoints:**
- **Mobile**: 1 column layout
- **Tablet**: Adjust with appropriate breakpoints
- **Desktop**: 3 column layout

**Requirements:**
- Maintain text readability
- Appropriate layout adjustments

### 9. Language Detection and Filtering (Phase 2)

**Feature:** Automatically detect article languages and filter by language

**Specifications:**
- **Detection**: Analyze Japanese characters (hiragana, katakana, kanji) in title/description
- **Threshold**: >10% Japanese characters → JP, otherwise → EN
- **RSS Priority**: Use RSS `<language>` field if available
- **Filter UI**: Dropdown with options: All / JP / EN
- **Persistence**: Filter selection persists across navigation

**Implementation:**
- `languageDetectionService.ts` for detection logic
- Client-side filtering for instant response
- Languages stored in newspaper metadata

### 10. Free-word Search (Phase 2)

**Feature:** Search articles by keywords in real-time

**Specifications:**
- **Search scope**: Article title and description
- **Case-insensitive**: Matches regardless of case
- **Real-time**: Instant filtering as user types
- **Persistence**: Search query persists across navigation
- **Clear**: Empty search shows all articles

**Implementation:**
- Client-side search for instant response
- Debounced input for performance
- Highlight matching terms (optional)

### 11. Historical Newspapers (Phase 2)

**Feature:** Access past newspapers with date-based URLs

**Specifications:**
- **URL format**: `/newspapers/[id]/[YYYY-MM-DD]`
- **Valid range**: Today to 7 days ago
- **Validation**: Reject future dates and dates >7 days old
- **Generation**: First access generates newspaper for that date
- **Caching**: Second access retrieves cached newspaper
- **Articles**: Prioritize articles from target date (00:00 to current time)

**Performance:**
- Generation: ~5-8 seconds
- Cached retrieval: <1 second

### 12. AI Summary Generation (Phase 2)

**Feature:** Generate 3-line summary of newspaper content

**Specifications:**
- **AI**: AWS Bedrock (Claude 3 Haiku)
- **Length**: 100-250 characters (3 lines)
- **Language**: Matches newspaper's primary language (JP-only → Japanese, otherwise → English)
- **Timeout**: 10 seconds
- **Retry**: Up to 3 attempts with exponential backoff
- **Caching**: Summary saved with newspaper, not regenerated

**Implementation:**
- `summaryGenerationService.ts` for generation logic
- Summarizes top 10 articles by importance
- Fallback to null if generation fails

### 13. Date Navigation (Phase 2)

**Feature:** Navigate between dates with previous/next day buttons

**Specifications:**
- **Previous day**: Navigate to yesterday's newspaper
- **Next day**: Navigate to tomorrow's newspaper (disabled for today)
- **Validation**: Buttons disabled at boundaries (today, 7 days ago)
- **URL update**: URL changes to reflect new date
- **State preservation**: Language filter and search persist

**Implementation:**
- Client-side navigation with Next.js router
- Button state managed based on current date
- Smooth transitions between dates

### 14. Loading Animation (Phase 2)

**Feature:** Visual feedback during newspaper generation

**Specifications:**
- **Display**: Shown during API calls and newspaper generation
- **Animation**: Smooth, non-blocking animation
- **Accessibility**: Includes aria-label for screen readers
- **Duration**: Matches actual generation time (~5-8 seconds)
- **Cached**: Not shown (or very brief) for cached newspapers

**Implementation:**
- React state-based loading indicator
- Displayed during async operations
- Automatically hidden when content loads

### 15. Automatic Cleanup (Phase 2)

**Feature:** Automatically delete old newspapers to manage storage

**Specifications:**
- **Schedule**: Daily at 3 AM JST (cron: `0 18 * * ? *` in UTC)
- **Trigger**: AWS EventBridge rule
- **Target**: Newspapers older than 7 days
- **Batch size**: 25 newspapers per execution
- **Continuation**: Continues until all old newspapers deleted

**Implementation:**
- `cleanupService.ts` for cleanup logic
- Lambda function triggered by EventBridge
- DynamoDB scan with date filtering
- Batch delete for efficiency

## Technical Specifications

### Frontend
- **Framework**: Next.js 15.x (App Router)
- **Language**: TypeScript 5.9.x
- **Styling**: Tailwind CSS 3.x
- **Hosting**: AWS Amplify

### Backend
- **Runtime**: AWS Lambda (Node.js 24.x)
- **Framework**: Hono 4.x
- **Language**: TypeScript 5.9.x
- **Database**: DynamoDB
- **AI**: AWS Bedrock (Claude 3 Haiku)

### Infrastructure
- **IaC**: Terraform 1.11.x
- **CI/CD**: AWS Amplify (Frontend), GitHub Actions (Backend)
- **Region**: ap-northeast-1 (Tokyo)

## Quality Requirements

### Testing
- **Coverage**: 60% or higher
- **Unit Tests**: Jest/Vitest
- **E2E Tests**: Playwright
- **Test Scenarios**:
  - Newspaper creation flow
  - Manual feed addition and deletion
  - Newspaper settings save
  - Popular newspapers browsing and sorting
  - Responsive design

### Security
- **Sensitive information check**: Gitleaks (pre-commit/pre-push)
- **Environment variable management**: `.env.local` (gitignored)
- **AWS authentication**: Environment variables or AWS Secrets Manager
- **Input validation**: Validation at all API endpoints
- **CORS**: Allowed origins only

### Performance
- **Newspaper generation**: Within 5 seconds (target), under 8 seconds (high load)
- **Feed suggestions**: 30-40 seconds
- **Parallel processing**: Feed retrieval, URL validation

## User Flows

### Newspaper Creation Flow
```
1. Access home screen
   ↓
2. Enter theme keyword
   ↓
3. AI suggests feeds (auto-added)
   ↓
4. Manually add/delete feeds as needed
   ↓
5. Click "Generate Newspaper" button
   ↓
6. Newspaper page is displayed
   ↓
7. Open settings modal with "Save" button
   ↓
8. Enter newspaper name, user name, public setting
   ↓
9. Save complete
```

### Popular Newspapers Browsing Flow
```
1. Access home screen
   ↓
2. Scroll popular newspapers section
   ↓
3. Select sort (by popularity/by recency)
   ↓
4. Click newspaper card
   ↓
5. Newspaper detail page is displayed
```

## Glossary

- **Theme keyword**: Interest area entered by user (e.g., "Tech", "Sports")
- **RSS feed**: Content distribution format from websites
- **Feed suggestion**: RSS feed URL recommendations generated by AI
- **Newspaper page**: Generated output displaying articles in newspaper style
- **Article importance**: Calculated metric determining visual prominence
- **Paper texture**: Visual style simulating physical newspaper appearance
- **Locale**: User's language setting (Japanese or English)
- **Unified home screen**: Integrate interest input, feed management, popular newspapers on one screen
- **Newspaper settings**: Newspaper name, user name, public/private settings

## Update History

This document is updated according to product specification changes.

**Format:**
```
- **YYYY-MM-DD**: Summary of changes
  - Detail 1
  - Detail 2
  - Related Issue: #number or URL
```

---

- **2025-12-05**: Initial version created
  - Integrated Phase 1 (MVP) specifications
  - Reflected feed suggestion performance optimization (15→10 feeds)
  - Added image display feature
  - Related Issue: [#15](https://github.com/kumagaias/my-rss-press/issues/15)

- **2025-12-05**: Added image priority feature for main article
  - Prioritize articles with images for lead article (top)
  - Implemented Fisher-Yates shuffle algorithm (performance improvement)
  - Improved visual appeal of newspaper
  - Related Issue: [#17](https://github.com/kumagaias/my-rss-press/issues/17)

- **2025-12-05**: Implemented mobile responsive support
  - Mobile optimization for home page and newspaper page
  - Touch-friendly button size (44px or larger)
  - Responsive layout (mobile: 1 column, desktop: 3 columns)
  - Support for 320px-768px screen sizes
  - Related Issue: [#19](https://github.com/kumagaias/my-rss-press/issues/19)

- **2025-12-11**: Phase 2 implementation completed
  - **Language Detection & Filtering**: Automatic detection of article languages (JP/EN), language filter UI
  - **Free-word Search**: Search articles by title/description with real-time filtering
  - **Historical Newspapers**: Access past newspapers (up to 7 days), date-based URL structure
  - **AI Summary Generation**: Bedrock-powered 3-line summaries (100-250 chars) in appropriate language
  - **Date Navigation**: Previous/next day buttons with validation (future dates rejected, 7-day limit)
  - **Loading Animation**: Visual feedback during newspaper generation
  - **Automatic Cleanup**: EventBridge-triggered cleanup of old newspapers (>7 days)
  - **Property-Based Testing**: 18 correctness properties verified with fast-check (375 total tests)
  - **E2E Testing**: 28 Playwright tests covering all Phase 2 features
  - Related: Phase 2 implementation
