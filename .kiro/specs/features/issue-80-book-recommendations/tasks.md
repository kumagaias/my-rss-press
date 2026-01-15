# Implementation Plan: Book Recommendations

## Overview

Implement book recommendation feature that displays 2 relevant books below the editorial column using Google Books API. The implementation follows a plugin architecture to support future expansion to other content sources.

## Tasks

- [ ] 1. Create Google Books API client
  - Create `backend/src/services/googleBooksClient.ts`
  - Implement `searchBooks()` function with query parameters
  - Implement `transformResponse()` to convert API response to internal format
  - Add data validation for required fields (title, authors)
  - Handle malformed responses gracefully
  - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.2, 8.3, 8.5_

- [ ]* 1.1 Write unit tests for Google Books client
  - Test API request formatting
  - Test response transformation
  - Test data validation
  - Test malformed response handling
  - _Requirements: 8.1, 8.3, 10.2_

- [ ] 2. Create book recommendation service
  - Create `backend/src/services/bookRecommendationService.ts`
  - Implement `generateBookRecommendations()` function
  - Implement `extractKeywords()` for theme and editorial content
  - Add 5-second timeout using Promise.race
  - Return empty array on any error
  - Support both English and Japanese keywords
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 5.1, 5.4_

- [ ]* 2.1 Write property test for result count consistency
  - **Property 2: Result Count Consistency**
  - **Validates: Requirements 1.3**

- [ ]* 2.2 Write property test for language-appropriate keywords
  - **Property 3: Language-Appropriate Keywords**
  - **Validates: Requirements 1.4, 1.5**

- [ ]* 2.3 Write property test for error resilience
  - **Property 9: Error Resilience**
  - **Validates: Requirements 5.2, 5.3, 10.1, 10.2, 10.5**

- [ ] 3. Update data models
  - Update `backend/src/models/newspaper.ts`
  - Add `BookRecommendation` interface
  - Add optional `bookRecommendations` field to `Newspaper` interface
  - Add `contentType: 'book'` field for future expansion
  - _Requirements: 7.4_

- [ ] 4. Integrate with newspaper generation
  - Update `backend/src/services/historicalNewspaperService.ts`
  - Call `generateBookRecommendations()` after editorial column generation
  - Wrap in try-catch to prevent errors from breaking newspaper generation
  - Use Promise.race with 5-second timeout
  - Include recommendations in newspaper data saved to DynamoDB
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4, 5.5, 7.1_

- [ ]* 4.1 Write property test for data persistence round-trip
  - **Property 10: Data Persistence Round-Trip**
  - **Validates: Requirements 5.5, 7.1, 7.2**

- [ ] 5. Create BookCard component
  - Create `frontend/components/features/newspaper/BookCard.tsx`
  - Display book cover image or placeholder
  - Display title, authors, truncated description
  - Make entire card clickable link to Google Books
  - Add `target="_blank"` and `rel="noopener noreferrer"`
  - Apply newspaper-style design (serif font, subtle border)
  - Add hover effect
  - Ensure 44px minimum touch target for mobile
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.4, 3.5, 4.1, 4.2, 4.3, 9.5_

- [ ]* 5.1 Write property test for link attributes
  - **Property 6: Link Attributes**
  - **Validates: Requirements 2.6, 4.3**

- [ ]* 5.2 Write property test for description truncation
  - **Property 7: Description Truncation**
  - **Validates: Requirements 2.3**

- [ ]* 5.3 Write property test for touch target size
  - **Property 14: Touch Target Size**
  - **Validates: Requirements 9.5**

- [ ] 6. Create BookRecommendations component
  - Create `frontend/components/features/newspaper/BookRecommendations.tsx`
  - Display section header ("Recommended Books" / "関連書籍")
  - Render 2 BookCard components in grid layout
  - Implement responsive layout (2 columns desktop, 1 column mobile)
  - Apply newspaper-style design
  - _Requirements: 2.7, 3.1, 3.2, 3.3, 3.6, 6.1, 6.2, 9.1, 9.2_

- [ ]* 6.1 Write property test for conditional section display
  - **Property 11: Conditional Section Display**
  - **Validates: Requirements 7.3, 10.3**

- [ ]* 6.2 Write property test for localized UI labels
  - **Property 12: Localized UI Labels**
  - **Validates: Requirements 6.1, 6.2**

- [ ] 7. Update NewspaperLayout component
  - Update `frontend/components/features/newspaper/NewspaperLayout.tsx`
  - Add BookRecommendations component below EditorialColumn
  - Conditionally render only when recommendations exist
  - _Requirements: 3.1, 7.3_

- [ ] 8. Add translations
  - Update `frontend/lib/i18n.ts`
  - Add `recommendedBooks`: "Recommended Books" / "関連書籍"
  - Add `viewOnGoogleBooks`: "View on Google Books" / "Google Booksで見る"
  - _Requirements: 6.1, 6.2_

- [ ] 9. Add placeholder image
  - Add book placeholder image to `frontend/public/images/`
  - Use when book has no thumbnail
  - Ensure image matches newspaper aesthetic
  - _Requirements: 2.5_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify newspaper generation works with and without recommendations
  - Test error scenarios (API failure, timeout, malformed data)
  - Verify responsive layout on mobile and desktop
  - Ask the user if questions arise

- [ ]* 11. Write integration tests
  - Test end-to-end newspaper generation with book recommendations
  - Test historical newspaper retrieval with stored recommendations
  - Test error scenarios (API down, timeout, malformed data)
  - _Requirements: 5.2, 5.3, 7.2, 10.1, 10.5_

- [ ] 12. Final checkpoint - Manual testing
  - Test on production-like environment
  - Verify books display correctly on desktop (2 columns)
  - Verify books display correctly on mobile (stacked)
  - Verify clicking book opens Google Books in new tab
  - Verify placeholder images show when no thumbnail
  - Verify Japanese newspapers show Japanese UI labels
  - Verify English newspapers show English UI labels
  - Verify newspaper generates successfully when API fails
  - Verify no book section appears when no recommendations
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Manual testing ensures real-world usability
