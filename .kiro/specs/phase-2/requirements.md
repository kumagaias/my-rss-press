# Requirements Document (Future Extensions)

## Introduction

This document defines requirements for future extensions of MyRSSPress. These features are not included in the current implementation, but the architecture should be prepared to facilitate future implementation.

## Glossary

- **Privacy Settings**: Settings to control public/private status of newspapers
- **Private Newspaper**: Newspaper viewable only by creator
- **Public Newspaper**: Newspaper viewable by all users

## Requirements

### Requirement 1: Newspaper Privacy Settings

**User Story:** As a user, I want to choose whether to make my newspaper public or private, so that I can manage personal newspapers separately from those I want to share.

#### Acceptance Criteria

1. When displaying the newspaper settings modal, the MyRSSPress system MUST include public/private selection options
2. When a user selects public, the MyRSSPress system MUST save the newspaper in a state viewable by other users
3. When a user selects private, the MyRSSPress system MUST save the newspaper in a state viewable only by the creator
4. When displaying the popular newspapers section, the MyRSSPress system MUST display only public newspapers
5. When a user views their newspaper list, the MyRSSPress system MUST display both public and private newspapers
6. When displaying each newspaper card, the MyRSSPress system MUST visually indicate the public/private status

### Requirement 2: My Newspapers List

**User Story:** As a user, I want to view a list of newspapers I created, so that I can easily find newspapers I created in the past.

#### Acceptance Criteria

1. When a user accesses the My Newspapers page, the MyRSSPress system MUST display a list of newspapers where the creator is themselves
2. When displaying the My Newspapers list, the MyRSSPress system MUST sort newspapers in descending order by creation date
3. When displaying each newspaper card, the MyRSSPress system MUST include thumbnail image, title, creation date, and public/private status
4. When a user clicks a newspaper card, the MyRSSPress system MUST navigate to that newspaper's detail page

### Requirement 3: Newspaper Editing and Deletion

**User Story:** As a user, I want to change settings or delete newspapers I created later, so that I can manage newspapers flexibly.

#### Acceptance Criteria

1. When a user is viewing their own newspaper, the MyRSSPress system MUST display edit and delete buttons
2. When a user clicks the edit button, the MyRSSPress system MUST display the settings modal
3. When displaying the settings modal, the MyRSSPress system MUST display current setting values in input fields
4. When a user changes settings and saves, the MyRSSPress system MUST update the newspaper information in the database
5. When a user clicks the delete button, the MyRSSPress system MUST display a confirmation dialog
6. When a user confirms deletion, the MyRSSPress system MUST delete the newspaper from the database

### Requirement 4: User Authentication (Email/Password)

**User Story:** As a user, I want to create an account and log in with email and password, so that I can manage my newspapers and distinguish myself from other users.

#### Acceptance Criteria

1. When a user accesses the application, the MyRSSPress system MUST display login/signup options
2. When a user selects signup, the MyRSSPress system MUST request email address and password input
3. When entering a password, the MyRSSPress system MUST validate that it meets the following requirements:
   - Minimum 8 characters
   - Contains uppercase, lowercase, and numbers
4. When a user completes signup, the MyRSSPress system MUST send a confirmation email
5. When a user confirms their email address, the MyRSSPress system MUST activate the account
6. When a user logs in, the MyRSSPress system MUST establish a session with AWS Cognito
7. When a user is logged in, the MyRSSPress system MUST automatically associate creator information when saving newspapers
8. When a user logs out, the MyRSSPress system MUST terminate the session
9. When a user forgets their password, the MyRSSPress system MUST provide password reset functionality

### Requirement 5: User Authentication (Google OAuth)

**User Story:** As a user, I want to log in with my Google account, so that I can easily access without creating a new password.

#### Acceptance Criteria

1. When displaying the login screen, the MyRSSPress system MUST display a "Sign in with Google" button
2. When a user clicks the "Sign in with Google" button, the MyRSSPress system MUST initiate the Google OAuth authentication flow
3. When a user authenticates with their Google account, the MyRSSPress system MUST establish a session with AWS Cognito
4. On first login, the MyRSSPress system MUST retrieve Google profile information (name, email address) and create a user account
5. When a user is logged in, the MyRSSPress system MUST automatically associate creator information when saving newspapers
6. When a user logs out, the MyRSSPress system MUST terminate the session

### Requirement 6: Newspaper Theme (Skin) Selection

**User Story:** As a user, I want to select the appearance (theme/skin) of my newspaper, so that I can enjoy newspapers in my preferred design.

#### Acceptance Criteria

1. When displaying the newspaper settings modal, the MyRSSPress system MUST include theme selection options
2. When displaying theme selection options, the MyRSSPress system MUST provide the following themes:
   - Classic (default): Traditional newspaper style
   - Modern: Contemporary and clean design
   - Dark: Dark mode style
   - Vintage: Retro newspaper style
3. When displaying each theme option, the MyRSSPress system MUST include a preview image
4. When a user selects a theme, the MyRSSPress system MUST immediately update the newspaper style
5. When saving a newspaper, the MyRSSPress system MUST include the selected theme in newspaper metadata
6. When displaying a saved newspaper, the MyRSSPress system MUST apply the saved theme

### Requirement 7: Article Count Adjustment

**User Story:** As a user, I want to adjust the number of articles displayed in the newspaper, so that I can change the newspaper volume according to my reading time.

#### Acceptance Criteria

1. When displaying the pre-generation settings screen, the MyRSSPress system MUST include article count selection options
2. When displaying article count selection options, the MyRSSPress system MUST provide a slider or dropdown in the range of 5 to 20
3. When setting default values, the MyRSSPress system MUST set 10 articles as the initial value
4. When a user changes the article count, the MyRSSPress system MUST fetch the selected number of articles
5. When the article count is less than the selected number, the MyRSSPress system MUST display all fetched articles
6. When saving a newspaper, the MyRSSPress system MUST include the selected article count in newspaper metadata

### Requirement 8: Page Count Adjustment

**User Story:** As a user, I want to adjust the number of pages in the newspaper, so that I can display more articles across multiple pages.

#### Acceptance Criteria

1. When displaying the pre-generation settings screen, the MyRSSPress system MUST include page count selection options
2. When displaying page count selection options, the MyRSSPress system MUST provide choices in the range of 1 to 4
3. When setting default values, the MyRSSPress system MUST set 1 page as the initial value
4. When a user selects page count, the MyRSSPress system MUST distribute articles evenly across each page
5. When displaying a multi-page newspaper, the MyRSSPress system MUST provide page navigation (previous/next buttons)
6. When a user switches pages, the MyRSSPress system MUST display articles for the selected page
7. When saving a newspaper, the MyRSSPress system MUST include the selected page count in newspaper metadata
8. When displaying each page, the MyRSSPress system MUST display the current page number and total page count

### Requirement 9: Environment Separation (Development/Staging)

**User Story:** As a developer, I want to test new features without affecting the production environment, so that I can develop and deploy safely.

#### Acceptance Criteria

1. When building infrastructure, the MyRSSPress system MUST provide a development environment
2. When building infrastructure, the MyRSSPress system MUST provide a staging environment
3. When building each environment, the MyRSSPress system MUST create independent AWS resources
4. When switching environments, the MyRSSPress system MUST use environment-specific configurations
5. When deploying code, the MyRSSPress system MUST follow this flow:
   - develop branch → development environment
   - staging branch → staging environment
   - main branch → production environment

## Design Considerations

To prepare for future implementation of these features, the current design should consider the following points:

1. **Data Model**: Separate newspaper templates and newspaper issues

   **NewspaperTemplate**:
   - `templateId`: Template ID (UUID)
   - `userId`: Creator's user ID (Cognito Sub)
   - `name`: Newspaper name
   - `feedUrls`: RSS feed URL list
   - `theme`: Selected theme/skin
   - `articleCount`: Article count
   - `pageCount`: Page count
   - `isPublic`: Public/private flag
   - `autoPublish`: Auto-publish enable/disable flag
   - `enableSummary`: Summary feature enable/disable flag
   - `createdAt`: Template creation datetime
   - `updatedAt`: Template update datetime
   
   **NewspaperIssue**:
   - `issueId`: Issue ID (UUID)
   - `templateId`: Original template ID
   - `publishDate`: Publication date (YYYY-MM-DD format)
   - `articles`: Article data (JSON array)
   - `createdAt`: Publication datetime
   - `viewCount`: View count
   
   **DynamoDB Table Design**:
   
   **NewspaperTemplates Table**:
   - PK: `TEMPLATE#{templateId}`
   - SK: `METADATA`
   - Attributes: NewspaperTemplate fields above
   - GSI: `UserTemplates` (for retrieving user's template list)
     - PK: `USER#{userId}`
     - SK: `CREATED#{createdAt}#{templateId}`
   
   **NewspaperIssues Table**:
   - PK: `TEMPLATE#{templateId}`
   - SK: `ISSUE#{publishDate}`
   - Attributes: NewspaperIssue fields above
   - GSI: `PublicIssues` (for retrieving public newspaper issue list)
     - PK: `PUBLIC`
     - SK: `PUBLISHED#{publishDate}#{issueId}`
   
   Add the following field to article entity:
   - `summary`: AI-generated summary text
   
   **ReadArticle**:
   - `userId`: User ID (Cognito Sub)
   - `articleUrl`: Article URL
   - `readAt`: Read datetime (ISO 8601)
   
   **DynamoDB Table Design (Read Articles)**:
   
   **ReadArticles Table**:
   - PK: `USER#{userId}`
   - SK: `ARTICLE#{articleUrl}`
   - Attributes: `userId`, `articleUrl`, `readAt`
   - TTL: Auto-delete after 90 days (remove old read articles)
   
   **Access Patterns**:
   - Get template: `GetItem(PK=TEMPLATE#{templateId}, SK=METADATA)`
   - User's template list: `Query(GSI=UserTemplates, PK=USER#{userId})`
   - Get specific date issue: `GetItem(PK=TEMPLATE#{templateId}, SK=ISSUE#{publishDate})`
   - Get all template issues: `Query(PK=TEMPLATE#{templateId}, SK begins_with ISSUE#)`
   - Get latest issue: `Query(PK=TEMPLATE#{templateId}, SK begins_with ISSUE#, ScanIndexForward=false, Limit=1)`
   - Public newspaper issue list: `Query(GSI=PublicIssues, PK=PUBLIC)`

2. **Authentication**: User authentication using AWS Cognito
   - User pool configuration
   - Google OAuth integration
   - JWT token validation

3. **Access Control**: Logic to check newspaper viewing permissions
   - Public newspapers: Viewable by all users
   - Private newspapers: Viewable only by creator

4. **UI/UX**: Extensible component design
   - Public/private settings UI
   - Theme selection UI
   - Article count/page count adjustment UI
   - Page navigation
   - Auto-publish settings UI
   - Summary display UI
   - Unique URL display and copy functionality
   - Issue history display UI (calendar view or list)
   - Publication date selection UI
   - Template/issue distinction display

5. **API Design**: Extensible endpoints
   - Endpoints requiring authentication (Authorization header)
   
   **Template Management**:
   - `POST /templates` - Create newspaper template
   - `GET /templates/{templateId}` - Get template
   - `PUT /templates/{templateId}` - Update template
   - `DELETE /templates/{templateId}` - Delete template
   - `GET /users/{userId}/templates` - User's template list
   
   **Issue Management**:
   - `GET /templates/{templateId}/latest` - Get latest issue (generate if not exists)
   - `GET /templates/{templateId}/issues/{date}` - Get specific date issue
   - `GET /templates/{templateId}/issues` - All template issues list
   - `POST /templates/{templateId}/issues` - Manually generate issue
   
   **Read Article Management**:
   - `POST /users/{userId}/read-articles` - Record read article
   - `GET /users/{userId}/read-articles` - Get user's read articles list
   - `DELETE /users/{userId}/read-articles/{articleUrl}` - Delete read article (mark as unread)
   
   **Other**:
   - Article summary generation (Bedrock integration)
   - Bookmark management

6. **Infrastructure**: 
   - Terraform modules structured for easy environment addition
   - Cognito user pool and app client
   - Google OAuth configuration

7. **Environment Variables**: Different settings per environment
   - Cognito User Pool ID
   - Cognito App Client ID
   - Google OAuth Client ID/Secret
   - Bedrock Model ID (for summaries)
   - Summary generation timeout settings

8. **Performance**: Summary generation optimization
   - Parallel processing for multiple article summaries
   - Consider summary caching (avoid re-summarizing same articles)
   - Timeout settings (within 3 seconds per article)


### Requirement 10: Newspaper Auto-Publishing (Periodic Updates)

**User Story:** As a user, I want my favorite newspapers to automatically update daily, so that I can continuously read the latest articles with the same feed configuration.

#### Acceptance Criteria

1. When a user is logged in, the MyRSSPress system MUST display an "Enable auto-publish" option when saving newspapers
2. When a user enables auto-publish, the MyRSSPress system MUST save as a newspaper template
3. When saving a newspaper template, the MyRSSPress system MUST generate a unique template ID
4. When generating unique URLs, the MyRSSPress system MUST use the following format:
   - Latest version: `/newspapers/{templateId}/latest`
   - Specific date version: `/newspapers/{templateId}/issues/{YYYY-MM-DD}`
5. When a user accesses the latest version URL, the MyRSSPress system MUST execute the following process:
   - Check if an issue exists for today's date
   - If exists: Display the saved issue
   - If not exists: Generate and save a new issue using template settings
6. When generating a new issue, the MyRSSPress system MUST apply template settings (feed URLs, article count, page count, theme, summary enable/disable)
7. When saving an issue, the MyRSSPress system MUST include the following information:
   - Publication date (YYYY-MM-DD)
   - Article data (title, description, link, image, summary)
   - Template ID
8. When displaying a newspaper with auto-publish enabled, the MyRSSPress system MUST display the following buttons:
   - "View Latest" button
   - "View Past Issues" button
9. When a user clicks "View Past Issues", the MyRSSPress system MUST display a list of publication dates
10. When a user selects a specific publication date, the MyRSSPress system MUST display that day's issue
11. When displaying the My Newspapers list, the MyRSSPress system MUST display an "Auto-update" badge on templates with auto-publish enabled
12. When a user edits template settings, the MyRSSPress system MUST allow toggling auto-publish on/off
13. When template settings are updated, the MyRSSPress system MUST apply new settings from the next issue onwards
14. When auto-publish is disabled, the MyRSSPress system MUST retain existing issues and stop generating new issues

### Requirement 11: Article Summary Feature

**User Story:** As a user, I want to read article summaries, so that I can quickly grasp content before reading the full text.

#### Acceptance Criteria

1. When generating newspapers, the MyRSSPress system MUST generate AI summaries for each article
2. When generating AI summaries, the MyRSSPress system MUST use AWS Bedrock (Claude 3 Haiku)
3. When generating summaries, the MyRSSPress system MUST use article title and description as input
4. For generated summaries, the MyRSSPress system MUST limit to 2-3 sentences (approximately 50-100 characters)
5. When displaying articles, the MyRSSPress system MUST display the summary section below the article
6. When displaying the summary section, the MyRSSPress system MUST visually distinguish it with a "Summary" label
7. When a summary cannot be generated, the MyRSSPress system MUST display the original article description
8. When summary feature can be enabled/disabled in newspaper settings, the MyRSSPress system MUST show or hide summaries according to settings
9. When summary generation times out, the MyRSSPress system MUST display articles without summaries
10. When generating summaries for multiple articles, the MyRSSPress system MUST minimize generation time with parallel processing

### Requirement 12: Article Read Status Feature

**User Story:** As a user, I want to record clicked articles as read, so that I can track which articles I've read and sync read status across multiple devices.

#### Acceptance Criteria

1. When a user clicks an article link, the MyRSSPress system MUST mark that article as read
2. When a user is logged in, the MyRSSPress system MUST save read articles to DynamoDB
3. When a user is not logged in, the MyRSSPress system MUST save read articles to browser local storage
4. When a user logs in, the MyRSSPress system MUST migrate read articles from local storage to DynamoDB
5. When displaying read articles, the MyRSSPress system MUST visually distinguish them (e.g., lighten title color, display read badge)
6. When loading a newspaper page, the MyRSSPress system MUST retrieve the user's read articles list
7. When retrieving read articles for logged-in users, the MyRSSPress system MUST retrieve from DynamoDB
8. When retrieving read articles for non-logged-in users, the MyRSSPress system MUST retrieve from local storage
9. When a user logs in on another device, the MyRSSPress system MUST sync read status
10. When saving read article data, the MyRSSPress system MUST include article URL, read datetime, and user ID

### Requirement 13: Bookmark Feature

**User Story:** As a user, I want to bookmark articles while reading, so that I can save interesting content for later reference.

#### Acceptance Criteria

1. When viewing articles, the MyRSSPress system MUST display a bookmark icon on each article
2. When a user clicks the bookmark icon, the MyRSSPress system MUST add the article URL to the bookmark list
3. When an article is bookmarked, the MyRSSPress system MUST change the icon to a filled state
4. When a user clicks a bookmarked icon, the MyRSSPress system MUST remove the bookmark
5. When bookmark status changes, the MyRSSPress system MUST immediately update the UI
6. When a user accesses the bookmarks list page, the MyRSSPress system MUST retrieve and display all saved article URLs

### Requirement 14: Error Code Standardization

**User Story:** As a developer, I want to manage API errors with standardized error codes, so that I can display appropriate multilingual error messages on the frontend and make debugging easier.

#### Background

Currently, the backend API returns error messages directly in Japanese:

```json
{
  "error": "記事数が不足しています。別のフィードを追加するか、後でもう一度お試しください。",
  "articleCount": 0
}
```

This has the following problems:
1. Difficult to support multiple languages (error messages are hardcoded)
2. Frontend cannot determine error type
3. Error causes are unclear during debugging

#### Acceptance Criteria

**Backend:**

1. When returning API errors, the MyRSSPress system MUST use the following format:
```json
{
  "error": "Developer-friendly error message in English",
  "errorCode": "ERROR_CODE_CONSTANT",
  "details": {
    "additionalInfo": "value"
  }
}
```

2. When defining error codes, the MyRSSPress system MUST follow these naming conventions:
   - Uppercase snake case (e.g., `GENERATE_NEWSPAPER_NO_ARTICLES`)
   - Use feature name as prefix (e.g., `GENERATE_NEWSPAPER_*`, `SUGGEST_FEEDS_*`)
   - Descriptive and clear names

3. When managing error codes, the MyRSSPress system MUST consolidate them in the `backend/src/constants/errorCodes.ts` file

4. When creating the error codes file, the MyRSSPress system MUST use the following structure:
```typescript
export const ErrorCodes = {
  // Newspaper generation errors
  GENERATE_NEWSPAPER_NO_ARTICLES: 'GENERATE_NEWSPAPER_NO_ARTICLES',
  GENERATE_NEWSPAPER_INSUFFICIENT_ARTICLES: 'GENERATE_NEWSPAPER_INSUFFICIENT_ARTICLES',
  GENERATE_NEWSPAPER_INVALID_FEED_URL: 'GENERATE_NEWSPAPER_INVALID_FEED_URL',
  GENERATE_NEWSPAPER_FEED_FETCH_FAILED: 'GENERATE_NEWSPAPER_FEED_FETCH_FAILED',
  
  // Feed suggestion errors
  SUGGEST_FEEDS_INVALID_THEME: 'SUGGEST_FEEDS_INVALID_THEME',
  SUGGEST_FEEDS_BEDROCK_ERROR: 'SUGGEST_FEEDS_BEDROCK_ERROR',
  SUGGEST_FEEDS_NO_SUGGESTIONS: 'SUGGEST_FEEDS_NO_SUGGESTIONS',
  
  // Newspaper save errors
  SAVE_NEWSPAPER_INVALID_NAME: 'SAVE_NEWSPAPER_INVALID_NAME',
  SAVE_NEWSPAPER_NO_ARTICLES: 'SAVE_NEWSPAPER_NO_ARTICLES',
  
  // Newspaper retrieval errors
  GET_NEWSPAPER_NOT_FOUND: 'GET_NEWSPAPER_NOT_FOUND',
  GET_NEWSPAPER_ACCESS_DENIED: 'GET_NEWSPAPER_ACCESS_DENIED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Generic errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

5. When returning error responses, the MyRSSPress system MUST follow these examples:
```typescript
// Example 1: No articles could be fetched
return c.json(
  {
    error: 'No articles could be fetched from the provided feeds',
    errorCode: ErrorCodes.GENERATE_NEWSPAPER_NO_ARTICLES,
    details: {
      articleCount: 0,
      feedCount: feedUrls.length,
    },
  },
  400
);

// Example 2: Insufficient articles
return c.json(
  {
    error: 'Insufficient articles to generate newspaper (minimum: 3)',
    errorCode: ErrorCodes.GENERATE_NEWSPAPER_INSUFFICIENT_ARTICLES,
    details: {
      articleCount: articles.length,
      minimumRequired: 3,
    },
  },
  400
);
```

**Frontend:**

6. When defining error messages, the MyRSSPress system MUST add them to `frontend/lib/i18n.ts`

7. When adding error messages, the MyRSSPress system MUST use the following structure:
```typescript
export const translations = {
  en: {
    // ... existing translations
    
    // Error messages
    errors: {
      GENERATE_NEWSPAPER_NO_ARTICLES: 'No articles could be fetched from the feeds. Please check the feed URLs or try different feeds.',
      GENERATE_NEWSPAPER_INSUFFICIENT_ARTICLES: 'Not enough articles to generate a newspaper. Please add more feeds or try again later.',
      GENERATE_NEWSPAPER_INVALID_FEED_URL: 'One or more feed URLs are invalid. Please check and try again.',
      GENERATE_NEWSPAPER_FEED_FETCH_FAILED: 'Failed to fetch articles from one or more feeds. Please try again later.',
      SUGGEST_FEEDS_INVALID_THEME: 'Please enter a valid theme.',
      SUGGEST_FEEDS_BEDROCK_ERROR: 'AI service is temporarily unavailable. Please try again later.',
      SUGGEST_FEEDS_NO_SUGGESTIONS: 'No feed suggestions found for this theme. Please try a different theme.',
      SAVE_NEWSPAPER_INVALID_NAME: 'Please enter a valid newspaper name.',
      SAVE_NEWSPAPER_NO_ARTICLES: 'Cannot save a newspaper without articles.',
      GET_NEWSPAPER_NOT_FOUND: 'Newspaper not found.',
      GET_NEWSPAPER_ACCESS_DENIED: 'You do not have permission to view this newspaper.',
      VALIDATION_ERROR: 'Invalid input. Please check your data and try again.',
      INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
      RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
      UNKNOWN_ERROR: 'An error occurred. Please try again.',
    },
  },
  ja: {
    // ... existing translations
    
    // エラーメッセージ
    errors: {
      GENERATE_NEWSPAPER_NO_ARTICLES: 'フィードから記事を取得できませんでした。フィードURLを確認するか、別のフィードをお試しください。',
      GENERATE_NEWSPAPER_INSUFFICIENT_ARTICLES: '新聞を生成するのに十分な記事がありません。フィードを追加するか、後でもう一度お試しください。',
      GENERATE_NEWSPAPER_INVALID_FEED_URL: '1つ以上のフィードURLが無効です。確認してもう一度お試しください。',
      GENERATE_NEWSPAPER_FEED_FETCH_FAILED: '1つ以上のフィードから記事を取得できませんでした。後でもう一度お試しください。',
      SUGGEST_FEEDS_INVALID_THEME: '有効なテーマを入力してください。',
      SUGGEST_FEEDS_BEDROCK_ERROR: 'AIサービスが一時的に利用できません。後でもう一度お試しください。',
      SUGGEST_FEEDS_NO_SUGGESTIONS: 'このテーマのフィード提案が見つかりませんでした。別のテーマをお試しください。',
      SAVE_NEWSPAPER_INVALID_NAME: '有効な新聞名を入力してください。',
      SAVE_NEWSPAPER_NO_ARTICLES: '記事のない新聞は保存できません。',
      GET_NEWSPAPER_NOT_FOUND: '新聞が見つかりませんでした。',
      GET_NEWSPAPER_ACCESS_DENIED: 'この新聞を閲覧する権限がありません。',
      VALIDATION_ERROR: '入力が無効です。データを確認してもう一度お試しください。',
      INTERNAL_SERVER_ERROR: '予期しないエラーが発生しました。後でもう一度お試しください。',
      RATE_LIMIT_EXCEEDED: 'リクエストが多すぎます。しばらく待ってからもう一度お試しください。',
      UNKNOWN_ERROR: 'エラーが発生しました。もう一度お試しください。',
    },
  },
};
```

8. When handling API errors, the MyRSSPress system MUST use the following helper function:
```typescript
// frontend/lib/errorHandler.ts
import { translations, Locale } from './i18n';

export interface APIError {
  error: string;
  errorCode?: string;
  details?: Record<string, any>;
}

export function getErrorMessage(error: APIError, locale: Locale): string {
  const t = translations[locale];
  
  // If errorCode exists and has a translation, use it
  if (error.errorCode && error.errorCode in t.errors) {
    return t.errors[error.errorCode as keyof typeof t.errors];
  }
  
  // Fallback to generic error message
  return t.errors.UNKNOWN_ERROR;
}
```

9. When calling APIs, the MyRSSPress system MUST use the following pattern:
```typescript
// frontend/lib/api.ts
import { getErrorMessage } from './errorHandler';

export async function generateNewspaper(
  feedUrls: string[],
  theme: string,
  locale: Locale = 'en'
): Promise<Article[]> {
  const response = await fetch(`${API_BASE_URL}/api/generate-newspaper`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedUrls, theme }),
  });

  if (!response.ok) {
    const errorData: APIError = await response.json();
    const userMessage = getErrorMessage(errorData, locale);
    throw new Error(userMessage);
  }

  const data = await response.json();
  return data.articles || [];
}
```

**Documentation:**

10. When adding error codes, the MyRSSPress system MUST document the error code list in `docs/API.md`

11. When creating error code documentation, the MyRSSPress system MUST include the following information:
    - Error code
    - HTTP status code
    - Description
    - Occurrence conditions
    - Resolution method

**Migration Strategy:**

12. When migrating existing error responses, the MyRSSPress system MUST execute in the following order:
    - Step 1: Create `errorCodes.ts` and define error codes
    - Step 2: Update backend error responses
    - Step 3: Add error messages to frontend i18n
    - Step 4: Update frontend error handling
    - Step 5: Remove existing hardcoded error messages

13. When completing migration, the MyRSSPress system MUST update the following files:
    - `backend/src/routes/newspapers.ts`
    - `backend/src/routes/feeds.ts`
    - `frontend/lib/api.ts`
    - `frontend/app/page.tsx`
    - `frontend/app/newspaper/page.tsx`

### 要件15: プロパティベーステストへの移行

**ユーザーストーリー:** 開発者として、例ベースのテストをプロパティベーステストに書き換えたい。そうすることで、より広範囲の入力パターンをテストし、エッジケースを自動的に発見できる。

#### 受入基準

**フロントエンド:**

1. `layoutCalculator.ts`のテストを書き換えるとき、MyRSSPressシステムは以下のプロパティを検証しなければならない：
   - **完全性**: すべての記事がレイアウトに含まれる（lead + topStories + remaining = 元の記事数）
   - **順序性**: 記事は重要度の降順に並んでいる
   - **境界条件**: 0記事、1記事、100記事などの極端なケースで正しく動作する
   - **不変性**: 元の記事配列が変更されない

2. UIコンポーネントのテストを書き換えるとき、MyRSSPressシステムは以下のプロパティを検証しなければならない：
   - **Button**: どんなテキストでも正しくレンダリングされる
   - **Input**: 任意の文字列入力を受け付ける
   - **FeedSelector**: 任意の数のフィード（0〜100）を正しく表示する
   - **NewspaperLayout**: 任意の数の記事（1〜100）を正しくレイアウトする

3. プロパティベーステストを実装するとき、MyRSSPressシステムは`fast-check`ライブラリを使用しなければならない

4. 各プロパティテストを実行するとき、MyRSSPressシステムは最低100回のランダムケースを生成しなければならない

5. テストが失敗したとき、MyRSSPressシステムは失敗を引き起こした最小の入力例（shrunk example）を表示しなければならない

**バックエンド:**

6. `importanceCalculator.ts`のテストを書き換えるとき、MyRSSPressシステムは以下のプロパティを検証しなければならない：
   - **範囲**: すべての重要度スコアが0〜100の範囲内である
   - **完全性**: 入力記事数と出力記事数が一致する
   - **画像ボーナス**: 画像付き記事のスコアが画像なし記事より高い（同じ条件の場合）

7. `rssParser.ts`のテストを書き換えるとき、MyRSSPressシステムは以下のプロパティを検証しなければならない：
   - **日付フィルタリング**: フィルタリング後の記事はすべて指定期間内である
   - **重複排除**: 同じURLの記事が複数含まれない
   - **必須フィールド**: すべての記事がtitle、link、pubDateを持つ

8. APIエンドポイントのテストを書き換えるとき、MyRSSPressシステムは以下のプロパティを検証しなければならない：
   - **べき等性**: 同じリクエストを複数回送信しても結果が一貫している
   - **エラーハンドリング**: 不正な入力に対して適切なエラーレスポンスを返す
   - **レスポンス形式**: すべてのレスポンスが定義されたスキーマに従う

9. プロパティベーステストを実装するとき、MyRSSPressシステムは`fast-check`ライブラリを使用しなければならない

10. 各プロパティテストを実行するとき、MyRSSPressシステムは最低100回のランダムケースを生成しな��ればならない

**ドキュメント:**

11. プロパティベーステストを追加するとき、MyRSSPressシステムは各テストファイルにプロパティの説明コメントを含めなければならない

12. テストカバレッジを測定するとき、MyRSSPressシステムはプロパティベーステストを含めた総合カバレッジを報告しなければならない

**移行戦略:**

13. 既存の例ベースのテストを削除するとき、MyRSSPressシステムは段階的に移行しなければならない：
    - ステップ1: プロパティベーステストを追加（例ベースのテストと並行）
    - ステップ2: プロパティベーステストが安定したら例ベースのテストを削除
    - ステップ3: すべてのテストファイルで移行を完了

14. When completing migration, the MyRSSPress system MUST rewrite the following files to property-based tests:
    - `frontend/lib/layoutCalculator.test.ts`
    - `frontend/components/features/newspaper/NewspaperLayout.test.tsx`
    - `frontend/components/features/feed/FeedSelector.test.tsx`
    - `backend/src/services/importanceCalculator.test.ts`
    - `backend/src/services/rssParser.test.ts`
    - `backend/src/routes/*.test.ts` (all API endpoints)
