# Implementation Plan: One-Click Newspaper Generation

## Overview

This implementation plan breaks down the one-click newspaper generation feature into discrete, manageable tasks. The approach focuses on backend changes first, then frontend integration, and finally testing and refinement.

## Tasks

- [x] 1. Backend: Create article limiter service
  - Create `backend/src/services/articleLimiter.ts`
  - Implement `limitDefaultFeedArticles()` function
  - Limit default feed articles to max 2 per feed
  - Preserve minimum article count (8 articles)
  - _Requirements: 5.2, 5.5_

- [ ]* 1.1 Write unit tests for article limiter
  - Test limiting default feed articles
  - Test preserving non-default articles
  - Test minimum count preservation
  - Test edge cases (no default feeds, all default feeds)
  - _Requirements: 5.2, 5.5_

- [x] 2. Backend: Create combined generation endpoint
  - Add POST `/api/newspapers/generate` endpoint in `backend/src/routes/newspapers.ts`
  - Accept theme and locale parameters
  - Call `suggestFeeds()` to get feed suggestions
  - Mark default feeds in response
  - Call `fetchArticlesForNewspaper()` to get articles
  - Call `limitDefaultFeedArticles()` to limit default articles
  - Calculate importance for articles
  - Generate summary
  - Return complete newspaper data with feed metadata
  - _Requirements: 1.1, 6.1, 6.2, 6.3_

- [ ]* 2.1 Write unit tests for generation endpoint
  - Test successful generation flow
  - Test with various themes
  - Test default feed marking
  - Test article limiting integration
  - Test error handling
  - _Requirements: 1.1, 6.4_

- [x] 3. Backend: Update bedrockService to mark default feeds
  - Modify `suggestFeeds()` in `backend/src/services/bedrockService.ts`
  - Add `isDefault: true` flag to default feeds
  - Ensure flag is preserved through the flow
  - _Requirements: 5.4_

- [x] 4. Frontend: Update i18n translations
  - Add "Generate Newspaper" / "新聞を生成" button text
  - Add "Generating your newspaper..." / "新聞を生成中..." loading text
  - Add "This may take up to 30 seconds" / "最大30秒かかる場合があります" helper text
  - Add feed editing modal translations
  - Add error message translations
  - _Requirements: 2.1, 3.2, 3.3, 10.2, 10.3, 10.4_

- [x] 5. Frontend: Simplify home page
  - Remove `FeedSelector` component from display
  - Change button text to "Generate Newspaper"
  - Remove `handleGetSuggestions` function
  - Update `handleGenerateNewspaper` to call new endpoint
  - Add loading state management
  - Add error state management
  - Store response data in session storage
  - Navigate to newspaper page on success
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 7.1, 7.2, 7.3, 7.4_

- [ ] 6. Frontend: Add loading animation to home page
  - Show loading animation when generation starts
  - Display "Generating your newspaper..." message
  - Display helper text "This may take up to 30 seconds"
  - Hide animation when generation completes or fails
  - Disable button during generation
  - _Requirements: 1.2, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Frontend: Update newspaper settings modal
  - Add feed list display to modal
  - Show feed titles from metadata
  - Add visual indicator for default feeds
  - Add input field for new feed URL
  - Add "Add Feed" button
  - Add "Remove" button for each feed
  - Implement feed URL validation
  - Prevent duplicate feeds
  - Update save handler to accept modified feed list
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 8. Frontend: Update newspaper page to pass feeds to modal
  - Read feed metadata from session storage
  - Pass feed list to settings modal
  - Handle modified feed list from modal
  - Update save API call to include feeds
  - _Requirements: 4.1, 7.5_

- [ ] 9. Checkpoint - Test end-to-end flow
  - Ensure all tests pass
  - Test complete flow manually
  - Verify loading animation
  - Verify feed editing in modal
  - Verify default feed article limits
  - Ask user if questions arise

- [ ]* 10. Write integration tests
  - Test complete generation flow
  - Test error scenarios
  - Test timeout handling
  - Test feed editing in modal
  - Test session storage management
  - _Requirements: 1.1, 1.4, 9.1, 9.2, 9.3, 9.4_

- [ ]* 11. Write property-based tests
  - **Property 1: One-Click Generation Completeness**
  - **Validates: Requirements 1.1, 1.3, 1.4**
  
- [ ]* 11.1 Write property test for default feed article limit
  - **Property 2: Default Feed Article Limit**
  - **Validates: Requirements 5.2**

- [ ]* 11.2 Write property test for minimum article count
  - **Property 3: Minimum Article Count Preservation**
  - **Validates: Requirements 5.5**

- [ ]* 11.3 Write property test for feed metadata consistency
  - **Property 4: Feed Metadata Consistency**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [ ]* 11.4 Write property test for button state consistency
  - **Property 5: Button State Consistency**
  - **Validates: Requirements 2.5**

- [ ]* 11.5 Write property test for loading animation visibility
  - **Property 6: Loading Animation Visibility**
  - **Validates: Requirements 3.1, 3.5**

- [ ]* 11.6 Write property test for feed editing preservation
  - **Property 7: Feed Editing Preservation**
  - **Validates: Requirements 4.6**

- [ ]* 11.7 Write property test for locale-specific text
  - **Property 8: Locale-Specific Text**
  - **Validates: Requirements 10.2, 10.3, 10.4, 10.5**

- [ ] 12. Final checkpoint - Verify all requirements
  - Ensure all tests pass
  - Verify backward compatibility
  - Test with both EN and JA locales
  - Verify error handling
  - Ask user for final review

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Backend changes should be completed before frontend changes
- Session storage is temporary and doesn't require database migration
