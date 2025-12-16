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
- **Suggestion count**: Request 30 feeds from Bedrock
- **Validation**: Check URL existence (HEAD request, 5 second timeout)
- **Parallel processing**: Parallel validation with Promise.all (up to 15x faster)
- **Minimum guarantee**: 3 feeds (at least 1 from Bedrock)
- **Retry logic**: If Bedrock returns 0 valid feeds, retry up to 3 times with exponential backoff
- **Fallback**: After 3 failed retries, return default feeds only (marked as default)
- **Default supplement**: If Bedrock returns 1-2 valid feeds, supplement with default feeds to reach minimum of 3

**Performance:**
- Response time: ~30-40 seconds (normal), up to 2 minutes (with retries)
- Lambda timeout: 60 seconds

**Prompt Constraints:**
- Suggest only real feeds
- Prioritize major media and official sites
- Correct feed URL format (/rss, /feed, /rss.xml, etc.)
- Sort by relevance to theme

### 4. Newspaper Generation

**Feature:** Generate newspaper from selected feeds

**Requirements:**
- **Minimum feeds**: 1 feed (users can generate newspaper with just 1 feed)
- **Maximum feeds**: 15 feeds
- **Recommended**: 3-5 feeds for best results

**Article Retrieval:**
- **Article count**: 8-15 articles (random)
- **Period**: Latest 7 days
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
