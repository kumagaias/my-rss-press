# Requirements Document: One-Click Newspaper Generation

## Introduction

This document specifies the requirements for simplifying the newspaper generation flow by combining feed suggestion and newspaper generation into a single action, moving feed editing to the save modal, and reducing the prominence of default feed articles.

## Glossary

- **One-Click Generation**: Single button action that suggests feeds, generates newspaper, and navigates to newspaper page
- **Feed Editing**: Ability to add, remove, or modify RSS feed URLs
- **Save Modal**: Modal dialog shown when user clicks "Save" button on newspaper page
- **Default Feed**: Fallback RSS feed used when Bedrock AI fails or returns insufficient feeds
- **Theme**: User-entered keyword describing their interest area
- **Loading Animation**: Visual feedback shown during newspaper generation process
- **Session Storage**: Browser storage used to temporarily store newspaper data before saving

## Requirements

### Requirement 1: One-Click Newspaper Generation

**User Story:** As a user, I want to generate a newspaper with a single click, so that I can quickly see my personalized newspaper without multiple steps.

#### Acceptance Criteria

1. WHEN a user enters a theme and clicks the generation button, THE System SHALL suggest feeds, generate a newspaper, and navigate to the newspaper page in a single action
2. WHEN the generation process starts, THE System SHALL display a loading animation with appropriate text
3. WHEN the generation completes successfully, THE System SHALL navigate to the newspaper page automatically
4. WHEN the generation fails, THE System SHALL display an error message and remain on the home page
5. THE System SHALL complete the entire generation process within 30 seconds under normal conditions

### Requirement 2: Button Text and UI Changes

**User Story:** As a user, I want clear button labels, so that I understand what action will be performed.

#### Acceptance Criteria

1. THE Home_Page SHALL display a button labeled "Generate Newspaper" (English) or "新聞を生成" (Japanese)
2. THE Home_Page SHALL NOT display a "Get Feed Suggestions" button
3. THE Home_Page SHALL NOT display a feed list or feed editing interface before generation
4. WHEN the button is clicked, THE System SHALL change the button text to indicate loading state
5. THE System SHALL disable the button during generation to prevent duplicate requests

### Requirement 3: Loading Animation

**User Story:** As a user, I want to see progress feedback during generation, so that I know the system is working.

#### Acceptance Criteria

1. WHEN newspaper generation starts, THE System SHALL display a loading animation
2. THE Loading_Animation SHALL display text "Generating your newspaper..." in English
3. THE Loading_Animation SHALL display text "新聞を生成中..." in Japanese
4. THE Loading_Animation SHALL use the existing Phase 2 loading animation component
5. THE Loading_Animation SHALL remain visible until generation completes or fails

### Requirement 4: Feed Editing in Save Modal

**User Story:** As a user, I want to review and edit the feeds used for my newspaper when saving, so that I can customize my newspaper before making it permanent.

#### Acceptance Criteria

1. WHEN a user clicks "Save" on the newspaper page, THE Save_Modal SHALL display the list of feeds used to generate the newspaper
2. THE Save_Modal SHALL allow users to add new feed URLs
3. THE Save_Modal SHALL allow users to remove existing feeds
4. THE Save_Modal SHALL validate feed URLs before allowing addition
5. THE Save_Modal SHALL prevent duplicate feed URLs
6. WHEN a user saves with modified feeds, THE System SHALL store the modified feed list with the newspaper
7. THE Save_Modal SHALL display feed titles (from RSS metadata) when available

### Requirement 5: Default Feed Article Reduction

**User Story:** As a system administrator, I want to limit articles from default feeds, so that theme-relevant articles from AI-suggested feeds are prioritized.

#### Acceptance Criteria

1. WHEN selecting articles for a newspaper, THE Article_Selector SHALL prioritize articles from AI-suggested feeds over default feeds
2. WHEN a feed is marked as default, THE Article_Selector SHALL limit articles from that feed to a maximum of 2 articles
3. WHEN insufficient articles are available from AI-suggested feeds, THE Article_Selector SHALL supplement with default feed articles up to the limit
4. THE System SHALL mark feeds as default when they are used as fallback (not from Bedrock)
5. THE Article_Selector SHALL maintain the minimum article count requirement (8 articles) even when limiting default feeds

### Requirement 6: Backend API Changes

**User Story:** As a developer, I want a streamlined API flow, so that the frontend can generate newspapers with a single request.

#### Acceptance Criteria

1. THE Backend SHALL provide an endpoint that combines feed suggestion and newspaper generation
2. THE Endpoint SHALL accept a theme parameter
3. THE Endpoint SHALL return newspaper data including articles, feed URLs, and metadata
4. THE Endpoint SHALL handle errors gracefully and return appropriate error messages
5. THE Endpoint SHALL complete within 30 seconds or return a timeout error

### Requirement 7: Session Storage Management

**User Story:** As a developer, I want to store newspaper data in session storage, so that users can save their newspaper after viewing it.

#### Acceptance Criteria

1. WHEN a newspaper is generated, THE System SHALL store articles in session storage
2. WHEN a newspaper is generated, THE System SHALL store feed URLs in session storage
3. WHEN a newspaper is generated, THE System SHALL store feed metadata (titles, languages) in session storage
4. WHEN a newspaper is generated, THE System SHALL mark default feeds in session storage
5. WHEN a user saves the newspaper, THE System SHALL retrieve data from session storage
6. WHEN a user navigates away, THE System SHALL clear session storage after a reasonable timeout

### Requirement 8: Backward Compatibility

**User Story:** As a system administrator, I want existing saved newspapers to continue working, so that users don't lose access to their content.

#### Acceptance Criteria

1. THE System SHALL continue to support viewing existing saved newspapers
2. THE System SHALL handle newspapers saved before this feature without errors
3. THE System SHALL display appropriate defaults for newspapers without feed metadata
4. THE System SHALL not require migration of existing newspaper data

### Requirement 9: Error Handling

**User Story:** As a user, I want clear error messages, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN feed suggestion fails, THE System SHALL display an error message and suggest trying again
2. WHEN newspaper generation fails, THE System SHALL display an error message with the failure reason
3. WHEN the request times out, THE System SHALL display a timeout message
4. WHEN network errors occur, THE System SHALL display a network error message
5. THE System SHALL log all errors for debugging purposes

### Requirement 10: Internationalization

**User Story:** As a user, I want the interface in my language, so that I can understand all messages and labels.

#### Acceptance Criteria

1. THE System SHALL support English and Japanese languages
2. THE System SHALL translate all button labels based on user locale
3. THE System SHALL translate all loading messages based on user locale
4. THE System SHALL translate all error messages based on user locale
5. THE System SHALL translate all modal text based on user locale
