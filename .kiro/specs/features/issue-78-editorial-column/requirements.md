# Requirements Document - Issue #78: Editorial Column

**Related Issue**: [#78](https://github.com/kumagaias/my-rss-press/issues/78)

## Overview

Add an AI-generated editorial column to the newspaper layout. The column should weave together the day's articles with historical anecdotes and philosophical insights, creating a narrative that connects technology news to broader human themes.

## Reference

- **Example newspaper**: https://www.my-rss-press.com/newspaper?id=tEF8jSGEL-q8PBUOsNy2E

## User Stories

### As a reader
- I want to see an editorial column that provides context and reflection on the day's news
- I want the column to connect technology news to broader human themes
- I want the column to be concise and thought-provoking (150-200 words)
- I want the column to be available in my language (English or Japanese)

### As a newspaper creator
- I want the editorial column to be automatically generated when I create a newspaper
- I want the column to reflect the theme and content of my selected articles
- I want the column to enhance the newspaper experience without slowing down generation

## Functional Requirements

### FR-1: Content Generation
- **FR-1.1**: Generate editorial column using AWS Bedrock (Claude 3 Haiku)
- **FR-1.2**: Column length: 150-200 words
- **FR-1.3**: Style: Editorial style (weave articles with historical/philosophical insights)
- **FR-1.4**: Input: articles array, theme, locale
- **FR-1.5**: Output: editorial text with title

### FR-2: Multi-language Support
- **FR-2.1**: Support English language
  - Title: "Editor's Note" or "Daily Reflection"
  - Content: English editorial text
- **FR-2.2**: Support Japanese language
  - Title: "編集後記" (Editorial Note)
  - Content: Japanese editorial text
- **FR-2.3**: Language detection based on newspaper locale

### FR-3: Layout & Display
- **FR-3.1**: Position: Bottom section of newspaper (after Remaining Articles)
- **FR-3.2**: Layout: Full-width column box
- **FR-3.3**: Visual distinction from article sections
- **FR-3.4**: Responsive design (mobile and desktop)

### FR-4: Integration
- **FR-4.1**: Generate column during newspaper creation (`/api/newspapers/generate`)
- **FR-4.2**: Generate column for historical newspapers
- **FR-4.3**: Store column in DynamoDB as `editorialColumn` field
- **FR-4.4**: Optional feature (gracefully handle generation failures)

## Non-Functional Requirements

### NFR-1: Performance
- **NFR-1.1**: Column generation should not significantly impact newspaper generation time
- **NFR-1.2**: Target: < 3 seconds for column generation
- **NFR-1.3**: Parallel generation with other AI tasks (summary, importance)

### NFR-2: Quality
- **NFR-2.1**: Column should be coherent and well-written
- **NFR-2.2**: Column should accurately reflect article themes
- **NFR-2.3**: Column should include relevant historical/philosophical references
- **NFR-2.4**: Column should maintain appropriate tone (thoughtful, reflective)

### NFR-3: Reliability
- **NFR-3.1**: Graceful degradation if Bedrock fails
- **NFR-3.2**: Newspaper generation should succeed even if column generation fails
- **NFR-3.3**: Error logging for debugging

### NFR-4: Maintainability
- **NFR-4.1**: Prompt templates should be easily modifiable
- **NFR-4.2**: Service should be testable with mock data
- **NFR-4.3**: Clear separation of concerns (service, API, UI)

## Data Requirements

### DR-1: Database Schema
```typescript
interface NewspaperData {
  // ... existing fields
  editorialColumn?: string; // AI-generated editorial text (optional)
}
```

### DR-2: API Response
```typescript
interface NewspaperGenerateResponse {
  // ... existing fields
  editorialColumn?: string; // Editorial column text
}
```

## Constraints

### C-1: Technical Constraints
- Must use existing Bedrock infrastructure
- Must not introduce new dependencies
- Must maintain backward compatibility (optional field)

### C-2: Business Constraints
- Column generation is optional (not required for newspaper)
- Must support both English and Japanese
- Must maintain newspaper generation performance

### C-3: Design Constraints
- Must fit newspaper aesthetic
- Must be visually distinct from articles
- Must work on mobile and desktop

## Success Criteria

- [ ] Editorial column appears at bottom of newspaper
- [ ] Content is thoughtful and connects article themes
- [ ] Includes historical/philosophical references
- [ ] Length is appropriate (150-200 words)
- [ ] Works in both English and Japanese
- [ ] Visually distinct from article sections
- [ ] Loads without impacting performance
- [ ] Gracefully handles generation failures

## Out of Scope

- User customization of column style
- Multiple column styles
- Column editing by users
- Column sharing/social features
- Column archives/history

## Dependencies

- AWS Bedrock (Claude 3 Haiku) - existing
- DynamoDB - existing
- Existing summary generation service (reference implementation)

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Bedrock API failures | Medium | Low | Graceful degradation, optional feature |
| Poor column quality | Medium | Medium | Prompt engineering, testing, refinement |
| Performance impact | High | Low | Parallel generation, timeout limits |
| Multi-language quality | Medium | Medium | Language-specific prompts, testing |

## Related Documents

- [Design Document](./design.md)
- [Tasks Document](./tasks.md)
- Issue #46: Phase 2 Enhanced Features (AI summaries reference)
