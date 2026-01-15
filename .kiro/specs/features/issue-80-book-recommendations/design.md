# Design Document: Book Recommendations

## Overview

This feature adds book recommendations below the editorial column in newspapers. The system uses Google Books API to search for relevant books based on the newspaper's theme and editorial content, displaying 2 recommendations with cover images, titles, authors, and descriptions. The architecture is designed with extensibility in mind to support future integration of additional content sources (Amazon, podcasts, etc.).

## Architecture

### High-Level Architecture

```
Newspaper Generation Flow
    ↓
Editorial Column Generation (existing)
    ↓
Book Recommendation Service (new)
    ├→ Google Books API Client
    ├→ Keyword Extraction
    ├→ Result Filtering & Ranking
    └→ Data Transformation
    ↓
Store in DynamoDB (with newspaper)
    ↓
Frontend Display (BookRecommendations component)
```

### Plugin Architecture (Future-Ready)

The system is designed with a provider pattern to support multiple recommendation sources:

```typescript
interface RecommendationProvider {
  search(keywords: string[], locale: Locale): Promise<ContentRecommendation[]>;
  getName(): string;
}

class GoogleBooksProvider implements RecommendationProvider {
  // Initial implementation
}

// Future providers
class AmazonProvider implements RecommendationProvider { }
class PodcastProvider implements RecommendationProvider { }
```

## Components and Interfaces

### Backend Components

#### 1. Book Recommendation Service (`bookRecommendationService.ts`)

**Purpose**: Orchestrates book recommendation generation

**Key Functions**:
```typescript
/**
 * Generate book recommendations for a newspaper
 * @param theme - Newspaper theme
 * @param editorialColumn - Editorial column text (for keyword extraction)
 * @param locale - Language ('en' or 'ja')
 * @returns Array of 2 book recommendations
 */
async function generateBookRecommendations(
  theme: string,
  editorialColumn: string,
  locale: 'en' | 'ja'
): Promise<BookRecommendation[]>

/**
 * Extract keywords from theme and editorial column
 * @param theme - Newspaper theme
 * @param editorialColumn - Editorial column text
 * @param locale - Language
 * @returns Array of search keywords
 */
function extractKeywords(
  theme: string,
  editorialColumn: string,
  locale: 'en' | 'ja'
): string[]
```

**Error Handling**:
- Catches all errors and returns empty array
- Logs errors for monitoring
- Never throws exceptions that would break newspaper generation

**Performance**:
- 5-second timeout for API calls
- Included in overall 10-second newspaper generation timeout

#### 2. Google Books API Client (`googleBooksClient.ts`)

**Purpose**: Handles communication with Google Books API

**Key Functions**:
```typescript
/**
 * Search for books using Google Books API
 * @param query - Search query string
 * @param locale - Language for results
 * @param maxResults - Maximum number of results (default: 2)
 * @returns Array of book data from API
 */
async function searchBooks(
  query: string,
  locale: 'en' | 'ja',
  maxResults: number = 2
): Promise<GoogleBooksResponse>

/**
 * Transform Google Books API response to internal format
 * @param apiResponse - Raw API response
 * @returns Array of BookRecommendation objects
 */
function transformResponse(
  apiResponse: GoogleBooksResponse
): BookRecommendation[]
```

**API Configuration**:
- Endpoint: `https://www.googleapis.com/books/v1/volumes`
- No API key required (free tier)
- Query parameters:
  - `q`: search query
  - `maxResults`: 2
  - `langRestrict`: 'en' or 'ja'
  - `orderBy`: 'relevance'

**Validation**:
- Validates required fields (title, authors)
- Skips books with missing data
- Handles malformed responses gracefully

#### 3. Data Model Updates (`newspaper.ts`)

**New Interface**:
```typescript
interface BookRecommendation {
  title: string;
  authors: string[];
  description: string;
  thumbnail?: string;
  infoLink: string;
  publishedDate?: string;
  contentType: 'book'; // For future expansion
}

interface Newspaper {
  // ... existing fields
  editorialColumn?: string;
  bookRecommendations?: BookRecommendation[]; // New optional field
}
```

#### 4. Integration Point (`historicalNewspaperService.ts`)

**Modification**:
```typescript
// After editorial column generation
const editorialColumn = await generateEditorialColumn(...);

// Generate book recommendations (with timeout)
let bookRecommendations: BookRecommendation[] = [];
try {
  const recommendationPromise = generateBookRecommendations(
    theme,
    editorialColumn,
    locale
  );
  
  bookRecommendations = await Promise.race([
    recommendationPromise,
    new Promise<BookRecommendation[]>((resolve) => 
      setTimeout(() => resolve([]), 5000)
    )
  ]);
} catch (error) {
  console.error('[Book Recommendations] Generation failed:', error);
  // Continue without recommendations
}

// Include in newspaper data
const newspaper = {
  ...existingData,
  editorialColumn,
  bookRecommendations,
};
```

### Frontend Components

#### 1. BookRecommendations Component (`BookRecommendations.tsx`)

**Purpose**: Display book recommendations below editorial column

**Props**:
```typescript
interface BookRecommendationsProps {
  recommendations: BookRecommendation[];
  locale: Locale;
}
```

**Layout**:
- Section header: "Recommended Books" / "関連書籍"
- Grid layout: 2 columns (desktop), 1 column (mobile)
- Each book card contains:
  - Cover image (or placeholder)
  - Title
  - Authors
  - Description (truncated to 150 chars)
  - Link to Google Books

**Styling**:
- Newspaper aesthetic (serif font, paper texture)
- Subtle border around cards
- Hover effect on cards
- Responsive grid

#### 2. BookCard Component (`BookCard.tsx`)

**Purpose**: Display individual book recommendation

**Props**:
```typescript
interface BookCardProps {
  book: BookRecommendation;
  locale: Locale;
}
```

**Features**:
- Clickable card (entire card is a link)
- Opens in new tab (`target="_blank" rel="noopener noreferrer"`)
- Accessible (proper ARIA labels)
- Touch-friendly (44px minimum touch target)

#### 3. NewspaperLayout Updates (`NewspaperLayout.tsx`)

**Modification**:
```tsx
{/* Editorial Column */}
{newspaper.editorialColumn && (
  <EditorialColumn content={newspaper.editorialColumn} locale={locale} />
)}

{/* Book Recommendations - NEW */}
{newspaper.bookRecommendations && newspaper.bookRecommendations.length > 0 && (
  <BookRecommendations 
    recommendations={newspaper.bookRecommendations} 
    locale={locale} 
  />
)}
```

## Data Models

### BookRecommendation

```typescript
interface BookRecommendation {
  title: string;              // Required
  authors: string[];          // Required (at least one author)
  description: string;        // Required (truncated to 150 chars in display)
  thumbnail?: string;         // Optional (URL to cover image)
  infoLink: string;          // Required (Google Books URL)
  publishedDate?: string;    // Optional (publication date)
  contentType: 'book';       // For future expansion to other content types
}
```

### Google Books API Response

```typescript
interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: {
      title: string;
      authors?: string[];
      description?: string;
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
      infoLink: string;
      publishedDate?: string;
    };
  }>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Book Search Invocation

*For any* newspaper with an editorial column, generating the newspaper should trigger a book search using the theme and editorial content as keywords.

**Validates: Requirements 1.1, 1.2**

### Property 2: Result Count Consistency

*For any* Google Books API response, the system should return exactly 0 or 2 book recommendations (never 1, never more than 2).

**Validates: Requirements 1.3**

### Property 3: Language-Appropriate Keywords

*For any* newspaper with language L, the book search should use keywords appropriate for language L (Japanese keywords for Japanese newspapers, English keywords for English newspapers).

**Validates: Requirements 1.4, 1.5**

### Property 4: Required Fields Display

*For any* book recommendation, the displayed card should contain the title, at least one author, and a description.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Image Display Logic

*For any* book recommendation with a thumbnail URL, the displayed card should show the image; for any recommendation without a thumbnail, the card should show a placeholder image.

**Validates: Requirements 2.4, 2.5**

### Property 6: Link Attributes

*For any* book recommendation, the link should have `target="_blank"` and `rel="noopener noreferrer"` attributes.

**Validates: Requirements 2.6, 4.3**

### Property 7: Description Truncation

*For any* book description longer than 150 characters, the displayed description should be truncated to exactly 150 characters (plus ellipsis).

**Validates: Requirements 2.3**

### Property 8: API Timeout Enforcement

*For any* book recommendation generation that takes longer than 5 seconds, the system should return an empty array and continue newspaper generation.

**Validates: Requirements 5.1, 5.4**

### Property 9: Error Resilience

*For any* error during book recommendation generation (API failure, malformed data, network timeout), the newspaper generation should complete successfully without book recommendations.

**Validates: Requirements 5.2, 5.3, 10.1, 10.2, 10.5**

### Property 10: Data Persistence Round-Trip

*For any* newspaper with book recommendations, saving to DynamoDB and then retrieving should return the same book recommendations.

**Validates: Requirements 5.5, 7.1, 7.2**

### Property 11: Conditional Section Display

*For any* newspaper without book recommendations (empty array or undefined), the book recommendations section should not be displayed in the UI.

**Validates: Requirements 7.3, 10.3**

### Property 12: Localized UI Labels

*For any* newspaper with language L, the book recommendations section header and button text should be in language L.

**Validates: Requirements 6.1, 6.2**

### Property 13: Data Validation

*For any* book from the API missing required fields (title or authors), that book should be skipped and not included in the recommendations.

**Validates: Requirements 10.4**

### Property 14: Touch Target Size

*For any* book card on mobile viewport, the clickable area should be at least 44px in height.

**Validates: Requirements 9.5**

## Error Handling

### API Errors

**Scenarios**:
1. Google Books API is unavailable (network error, 500 error)
2. API returns malformed JSON
3. API returns empty results
4. API timeout (>5 seconds)

**Handling**:
- Log error with context (theme, locale, error message)
- Return empty array `[]`
- Continue newspaper generation
- Do not display book recommendations section

### Data Validation Errors

**Scenarios**:
1. Book missing title
2. Book missing authors
3. Book missing infoLink
4. Invalid thumbnail URL

**Handling**:
- Skip invalid book
- Continue processing remaining books
- Log validation error
- Return only valid books

### Timeout Handling

**Implementation**:
```typescript
const bookRecommendations = await Promise.race([
  generateBookRecommendations(theme, editorialColumn, locale),
  new Promise<BookRecommendation[]>((resolve) => 
    setTimeout(() => {
      console.log('[Book Recommendations] Timeout after 5 seconds');
      resolve([]);
    }, 5000)
  )
]);
```

## Testing Strategy

### Unit Tests

**Backend**:
- `bookRecommendationService.test.ts`
  - Keyword extraction from theme and editorial
  - Error handling (API failures, timeouts)
  - Empty result handling
  - Language-specific keyword generation

- `googleBooksClient.test.ts`
  - API request formatting
  - Response transformation
  - Data validation
  - Malformed response handling

**Frontend**:
- `BookRecommendations.test.tsx`
  - Rendering with 0, 1, 2 books
  - Responsive layout (desktop/mobile)
  - Localized labels

- `BookCard.test.tsx`
  - Image display (with/without thumbnail)
  - Description truncation
  - Link attributes
  - Accessibility

### Property-Based Tests

Each property test should run minimum 100 iterations and reference its design document property.

**Backend Property Tests**:
```typescript
// Property 2: Result Count Consistency
test('Property 2: Result count is always 0 or 2', async () => {
  // Generate random API responses with varying item counts
  // Verify output is always 0 or 2 books
});

// Property 3: Language-Appropriate Keywords
test('Property 3: Keywords match newspaper language', async () => {
  // Generate random themes and locales
  // Verify keywords are in the correct language
});

// Property 9: Error Resilience
test('Property 9: Errors never break newspaper generation', async () => {
  // Generate random error conditions
  // Verify newspaper generation always succeeds
});

// Property 10: Data Persistence Round-Trip
test('Property 10: Save and retrieve preserves recommendations', async () => {
  // Generate random book recommendations
  // Save to DynamoDB, retrieve, verify equality
});
```

**Frontend Property Tests**:
```typescript
// Property 7: Description Truncation
test('Property 7: Long descriptions are truncated to 150 chars', () => {
  // Generate random descriptions of varying lengths
  // Verify displayed text is max 150 chars
});

// Property 14: Touch Target Size
test('Property 14: Mobile touch targets are at least 44px', () => {
  // Render book cards in mobile viewport
  // Verify height >= 44px
});
```

### Integration Tests

- End-to-end newspaper generation with book recommendations
- Historical newspaper retrieval with stored recommendations
- Error scenarios (API down, timeout, malformed data)

### Manual Testing Checklist

- [ ] Books display correctly on desktop (2 columns)
- [ ] Books display correctly on mobile (stacked)
- [ ] Clicking book opens Google Books in new tab
- [ ] Placeholder images show when no thumbnail
- [ ] Japanese newspapers show Japanese UI labels
- [ ] English newspapers show English UI labels
- [ ] Newspaper generates successfully when API fails
- [ ] No book section appears when no recommendations

## Performance Considerations

### Timing Budget

- Book recommendation generation: 5 seconds max
- Included in overall newspaper generation: 10 seconds total
- API call timeout: 5 seconds
- Parallel execution with editorial column: No (sequential)

### Optimization Strategies

1. **Keyword Optimization**: Extract only most relevant keywords (max 5)
2. **API Efficiency**: Request only 2 results from API (not more)
3. **Caching**: Store recommendations in DynamoDB (no re-fetch on view)
4. **Timeout**: Fail fast after 5 seconds, don't retry
5. **Lazy Loading**: Consider lazy-loading book cover images (future)

### Monitoring

Log the following metrics:
- API call duration
- Success/failure rate
- Timeout frequency
- Books found per search
- Validation failure rate

## Security Considerations

### External Links

- Use `rel="noopener noreferrer"` to prevent tab-nabbing
- Open in new tab to preserve user's newspaper
- No user data sent to Google Books

### API Security

- No API key required (public API)
- No authentication needed
- Rate limiting handled by Google (not our concern)
- No sensitive data in requests

### Data Validation

- Validate all fields from API response
- Sanitize HTML in descriptions (use React's built-in escaping)
- Validate URLs before storing
- No executable code in book data

## Deployment Considerations

### Backend Deployment

- No new environment variables needed
- No new AWS resources needed
- Deploy via existing GitHub Actions workflow
- Backward compatible (optional field in Newspaper model)

### Frontend Deployment

- New components added to existing structure
- No breaking changes to existing components
- Deploy via existing Amplify workflow
- Graceful degradation (works without recommendations)

### Database Migration

- No migration needed (optional field)
- Existing newspapers: `bookRecommendations` will be `undefined`
- New newspapers: `bookRecommendations` will be array or `undefined`
- Frontend handles both cases

### Rollback Plan

If issues arise:
1. Remove book recommendation generation call from `historicalNewspaperService.ts`
2. Frontend will gracefully handle missing recommendations
3. No data cleanup needed (optional field)
4. Re-deploy previous version

## Future Extensibility

### Provider Pattern

The architecture supports adding new recommendation providers:

```typescript
// Future: Amazon Provider
class AmazonProvider implements RecommendationProvider {
  async search(keywords: string[], locale: Locale): Promise<ContentRecommendation[]> {
    // Amazon Product Advertising API integration
  }
}

// Future: Podcast Provider
class PodcastProvider implements RecommendationProvider {
  async search(keywords: string[], locale: Locale): Promise<ContentRecommendation[]> {
    // Podcast API integration
  }
}

// Recommendation Service can use multiple providers
const providers = [
  new GoogleBooksProvider(),
  new AmazonProvider(),
  new PodcastProvider(),
];

const recommendations = await Promise.all(
  providers.map(p => p.search(keywords, locale))
);
```

### Content Type Abstraction

The `contentType` field enables future content diversity:

```typescript
type ContentType = 'book' | 'podcast' | 'video' | 'course' | 'product';

interface ContentRecommendation {
  contentType: ContentType;
  // ... other fields
}

// Frontend can render different card types
function ContentCard({ content }: { content: ContentRecommendation }) {
  switch (content.contentType) {
    case 'book': return <BookCard {...content} />;
    case 'podcast': return <PodcastCard {...content} />;
    case 'video': return <VideoCard {...content} />;
    // ...
  }
}
```

### Personalization Hooks

The architecture allows for future personalization:

```typescript
// Future: User preference tracking
interface UserPreferences {
  favoriteTopics: string[];
  contentTypePreferences: ContentType[];
  readingHistory: string[];
}

// Recommendation service can incorporate preferences
async function generatePersonalizedRecommendations(
  theme: string,
  userPreferences?: UserPreferences
): Promise<ContentRecommendation[]> {
  // Blend theme-based and preference-based recommendations
}
```

## Notes

- Initial implementation focuses on Google Books API only
- Architecture designed for future expansion
- No breaking changes to existing functionality
- Graceful degradation ensures reliability
