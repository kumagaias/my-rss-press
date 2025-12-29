# Requirements Document MVP

## Introduction

MyRSSPress is a web application that transforms RSS feeds into visually appealing newspaper-style layouts. Users enter topics of interest, receive AI-powered RSS feed suggestions, select feeds, and generate personalized digital newspapers with realistic paper textures and intelligent article layouts. The system emphasizes visual immersion through authentic newspaper design and fast generation times suitable for demo environments. Additionally, multi-language support provides the interface in Japanese or English based on user browser settings.

## Glossary

- **MyRSSPress System**: The complete web application including frontend interface, backend processing, and AI integration
- **Theme Keyword**: Text input representing user's area of interest (e.g., "Tech", "Sports")
- **RSS Feed**: Web feed format containing syndicated content from websites
- **Feed Suggestion**: AI-generated recommendations of RSS feed URLs related to user's theme
- **Newspaper Page**: Generated output displaying articles in newspaper-style layout
- **Article Importance**: Calculated metric determining visual prominence based on factors like title length and image presence
- **Paper Texture**: Visual styling simulating physical newspaper appearance including texture and typography
- **Generation Process**: Complete workflow from feed selection to newspaper page creation
- **Locale**: User's language setting (Japanese or English)
- **Unified Home Screen**: Interface integrating interest input, feed management, and popular newspaper display on one screen
- **Newspaper Settings**: Newspaper metadata including newspaper name, user name, and public/private settings
- **Popular Newspapers**: Public newspapers created by other users, displayed sorted by view count

## Requirements

### Requirement 1: Multi-language Support

**User Story:** As a user, I want the interface to display in the appropriate language based on my browser settings, so that I can comfortably use the application in my native language.

#### Acceptance Criteria

1. When a user accesses the application, the MyRSSPress System MUST detect the browser's language settings
2. When the browser language is Japanese, the MyRSSPress System MUST display the Japanese interface
3. When the browser language is not Japanese, the MyRSSPress System MUST display the English interface
4. When the language switches, the MyRSSPress System MUST display all UI text, labels, and messages in the selected language
5. When displaying dates, the MyRSSPress System MUST use locale format appropriate for the selected language

### Requirement 2: Unified Home Screen

**User Story:** As a user, I want to input interests, manage feeds, and browse popular newspapers on one screen, so that I can operate the application efficiently.

#### Acceptance Criteria

1. When a user accesses the top page, the MyRSSPress System MUST display a unified screen including interest input section, feed management section, and popular newspapers section
2. When a user enters an interest, the MyRSSPress System MUST accept submission via Enter key or button click
3. When a user manually enters an RSS feed URL, the MyRSSPress System MUST add it to the feed list
4. When a user adds a feed, the MyRSSPress System MUST prevent adding duplicate feeds
5. When a user deletes a feed, the MyRSSPress System MUST immediately remove it from the list

### Requirement 3: AI Feed Suggestions

**User Story:** As a user, I want to receive AI-driven RSS feed suggestions based on my theme, so that I can quickly find relevant content sources without manual searching.

#### Acceptance Criteria

1. When the MyRSSPress System receives a theme keyword, the MyRSSPress System MUST generate a list of related RSS feed URLs
2. When feed suggestions are generated, the MyRSSPress System MUST automatically add suggested feeds to the existing feed list
3. When adding feeds, the MyRSSPress System MUST prevent duplicate addition of feeds already in the list
4. When suggestions are complete, the MyRSSPress System MUST clear the interest input field

### Requirement 4: Display Newspapers Created by Other Users

**User Story:** As a user, I want to browse newspapers created by other users, so that I can get inspiration and discover interesting content.

#### Acceptance Criteria

1. When displaying the home screen, the MyRSSPress System MUST display a popular newspapers section
2. When displaying popular newspapers, the MyRSSPress System MUST provide sorting options
3. When providing sorting options, the MyRSSPress System MUST include two choices: "By Popularity (most views)" and "By Recency (creation date descending)"
4. When a user selects a sorting option, the MyRSSPress System MUST immediately update the newspaper list in the selected order
5. When displaying each newspaper card, the MyRSSPress System MUST include thumbnail image, title, creator name, creation date, topic tags, and view count
6. When a user clicks a newspaper card, the MyRSSPress System MUST navigate to that newspaper's detail page

### Requirement 5: Newspaper Generation

**User Story:** As a user, I want to generate a newspaper from selected feeds, so that I can view recent articles in an organized and visually appealing format.

#### Acceptance Criteria

1. When a user initiates newspaper generation, the MyRSSPress System MUST validate that at least one feed is selected
2. When no feeds are selected, the MyRSSPress System MUST display an error message
3. When a user initiates newspaper generation, the MyRSSPress System MUST prioritize retrieving the latest articles based on RSS publication date
4. When retrieving articles, the MyRSSPress System MUST randomly select 8-15 articles
5. When articles from the latest 3 days are insufficient for minimum article count (8 articles), the MyRSSPress System MUST retrieve articles going back 7 days
6. When even 7 days is insufficient for minimum article count, the MyRSSPress System MUST display all retrieved articles
7. When retrieving articles, the MyRSSPress System MUST parse RSS feed content including title, description, link, and image
8. When articles are collected, the MyRSSPress System MUST analyze content to determine article importance
9. When generation is complete, the MyRSSPress System MUST display a newspaper page containing all collected articles
10. When the generation process executes, the MyRSSPress System MUST complete within 5 seconds

### Requirement 6: Newspaper Settings and Metadata

**User Story:** As a user, I want to specify user name and newspaper name after newspaper generation, so that I can personalize my newspaper.

#### Acceptance Criteria

1. When a newspaper is generated, the MyRSSPress System MUST display a save button
2. When a user clicks the save button, the MyRSSPress System MUST display a settings modal
3. When displaying the settings modal, the MyRSSPress System MUST include user name input field and newspaper name input field
4. When a user does not enter a newspaper name, the MyRSSPress System MUST automatically set a default newspaper name
5. When a user saves settings, the MyRSSPress System MUST close the modal and reflect settings on the newspaper page
6. When a newspaper is saved, the MyRSSPress System MUST display saved status
7. When displaying the newspaper page, the MyRSSPress System MUST display newspaper name, creation date, and user name (if set) in the header section within the newspaper layout

### Requirement 7: Paper Texture Design

**User Story:** As a user, I want the newspaper to look like real paper, so that I can enjoy an immersive reading experience.

#### Acceptance Criteria

1. When the newspaper page renders, the MyRSSPress System MUST apply realistic paper texture to the background
2. When displaying text content, the MyRSSPress System MUST use serif fonts similar to traditional newspaper typography
3. When styling the page, the MyRSSPress System MUST maintain consistent visual theme across all newspaper elements
4. When the page loads, the MyRSSPress System MUST ensure texture assets do not delay initial rendering by more than 2 seconds

### Requirement 8: Automatic Layout

**User Story:** As a user, I want articles to be automatically arranged in various sizes, so that important content stands out visually.

#### Acceptance Criteria

1. When calculating article importance, the MyRSSPress System MUST use AWS Bedrock (Claude 3 Haiku)
2. When calculating importance, the MyRSSPress System MUST prioritize relevance between user's theme keyword and article
3. When calculating importance, the MyRSSPress System MUST consider image presence (articles with images get +10 point bonus)
4. When Bedrock API fails, the MyRSSPress System MUST use fallback algorithm (title length and image presence)
5. When laying out articles, the MyRSSPress System MUST assign larger heading sizes to articles with higher importance
6. When positioning articles, the MyRSSPress System MUST place articles with higher importance in more prominent positions
7. When displaying the highest importance article, the MyRSSPress System MUST display it large as the lead article
8. When displaying next highest importance articles, the MyRSSPress System MUST display them as top stories in 3-column layout
9. When displaying remaining articles, the MyRSSPress System MUST display them in 2-column layout
10. When layout is generated, the MyRSSPress System MUST ensure all selected articles are displayed on the page

### Requirement 9: Navigation and User Flow

**User Story:** As a user, I want to return to the home screen from the newspaper page, so that I can create new newspapers or browse other newspapers.

#### Acceptance Criteria

1. When displaying the newspaper page, the MyRSSPress System MUST display a return to home button
2. When a user clicks the return to home button, the MyRSSPress System MUST navigate to the unified home screen
3. When displaying a demo button on the home screen, the MyRSSPress System MUST generate a demo newspaper using pre-configured feeds on click

### Requirement 10: Performance Requirements

**User Story:** As a demo presenter, I want newspaper generation to complete quickly, so that I can showcase the system without delays during hackathon demos.

#### Acceptance Criteria

1. When the newspaper generation process executes, the MyRSSPress System MUST complete all processing within 5 seconds
2. When multiple feeds are selected, the MyRSSPress System MUST fetch and process feeds in parallel to minimize total time
3. When the system experiences high load, the MyRSSPress System MUST maintain generation time under 8 seconds
4. When generation is in progress, the MyRSSPress System MUST display a progress indicator to the user

### Requirement 11: Responsive Design

**User Story:** As a user, I want to comfortably use the application on mobile devices, so that I can access it from any device.

#### Acceptance Criteria

1. When screen size changes, the MyRSSPress System MUST adjust layout appropriately
2. When displaying on mobile devices, the MyRSSPress System MUST change 3-column layout to 1-column
3. When displaying on tablet devices, the MyRSSPress System MUST adjust layout at appropriate breakpoints
4. When displaying on all devices, the MyRSSPress System MUST maintain text readability

### Requirement 12: Testing Requirements

**User Story:** As a developer, I want to implement comprehensive tests to ensure code quality, so that I can detect bugs early and safely refactor.

#### Acceptance Criteria

1. When implementing frontend components, the MyRSSPress System MUST include unit tests
2. When implementing backend APIs, the MyRSSPress System MUST include unit tests and integration tests
3. When implementing key user flows, the MyRSSPress System MUST include E2E tests using Playwright
4. When implementing E2E tests, the MyRSSPress System MUST cover the following scenarios:
   - Newspaper creation flow (theme input → feed suggestions → newspaper generation)
   - Manual feed addition and deletion
   - Newspaper settings save
   - Popular newspapers browsing and sorting
   - Responsive design behavior verification
5. When implementing tests, the MyRSSPress System MUST use Page Object Model pattern
6. When running tests, the MyRSSPress System MUST verify behavior on multiple browsers (Chrome, Firefox, Safari)
7. When measuring test coverage, the MyRSSPress System MUST achieve 60% or higher coverage
8. When running CI/CD pipeline, the MyRSSPress System MUST automatically execute all tests (unit, integration, E2E, security)

### Requirement 13: Security Requirements

**User Story:** As a developer, I want to prevent sensitive information leakage, so that I can prevent security incidents.

#### Acceptance Criteria

1. When committing code, the MyRSSPress System MUST check for sensitive information using Gitleaks
2. When sensitive information is detected, the MyRSSPress System MUST reject the commit
3. When managing environment variables, the MyRSSPress System MUST include `.env.local` file in `.gitignore`
4. When using AWS credentials, the MyRSSPress System MUST manage them with environment variables or AWS Secrets Manager
5. When implementing API endpoints, the MyRSSPress System MUST execute input data validation and sanitization
6. When configuring CORS, the MyRSSPress System MUST accept only allowed origins
