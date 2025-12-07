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


### 要件10: 新聞の自動発行（定期更新）

**ユーザーストーリー:** ユーザーとして、お気に入りの新聞を毎日自動的に更新したい。そうすることで、同じフィード構成で最新の記事を継続的に読める。

#### 受入基準

1. ユーザーがログインしているとき、MyRSSPressシステムは新聞保存時に「自動発行を有効にする」オプションを表示しなければならない
2. ユーザーが自動発行を有効にしたとき、MyRSSPressシステムは新聞テンプレートとして保存しなければならない
3. 新聞テンプレートを保存するとき、MyRSSPressシステムは固有のテンプレートIDを生成しなければならない
4. 固有のURLを生成するとき、MyRSSPressシステムは以下の形式を使用しなければならない：
   - 最新版: `/newspapers/{templateId}/latest`
   - 特定日版: `/newspapers/{templateId}/issues/{YYYY-MM-DD}`
5. ユーザーが最新版URLにアクセスしたとき、MyRSSPressシステムは以下の処理を実行しなければならない：
   - 今日の日付で発行版が存在するか確認
   - 存在する場合：保存された発行版を表示
   - 存在しない場合：テンプレート設定を使用して新しい発行版を生成し、保存
6. 新しい発行版を生成するとき、MyRSSPressシステムはテンプレートの設定（フィードURL、記事数、ページ数、テーマ、要約有効/無効）を適用しなければならない
7. 発行版を保存するとき、MyRSSPressシステムは以下の情報を含めなければならない：
   - 発行日（YYYY-MM-DD）
   - 記事データ（タイトル、説明、リンク、画像、要約）
   - テンプレートID
8. 自動発行が有効な新聞を表示するとき、MyRSSPressシステムは以下のボタンを表示しなければならない：
   - 「最新版を見る」ボタン
   - 「過去の発行版を見る」ボタン
9. ユーザーが「過去の発行版を見る」をクリックしたとき、MyRSSPressシステムは発行日のリストを表示しなければならない
10. ユーザーが特定の発行日を選択したとき、MyRSSPressシステムはその日の発行版を表示しなければならない
11. マイ新聞一覧を表示するとき、MyRSSPressシステムは自動発行が有効なテンプレートに「自動更新」バッジを表示しなければならない
12. ユーザーがテンプレート設定を編集するとき、MyRSSPressシステムは自動発行のオン/オフを切り替えられなければならない
13. テンプレート設定が更新されたとき、MyRSSPressシステムは次回の発行版から新しい設定を適用しなければならない
14. 自動発行が無効化されたとき、MyRSSPressシステムは既存の発行版を保持し、新しい発行版の生成を停止しなければならない

### 要件11: 記事要約機能

**ユーザーストーリー:** ユーザーとして、記事の要約を読みたい。そうすることで、全文を読む前に内容を素早く把握できる。

#### 受入基準

1. 新聞生成時、MyRSSPressシステムは各記事に対してAI要約を生成しなければならない
2. AI要約を生成するとき、MyRSSPressシステムはAWS Bedrock（Claude 3 Haiku）を使用しなければならない
3. 要約を生成するとき、MyRSSPressシステムは記事のタイトルと説明を入力として使用しなければならない
4. 生成された要約は、MyRSSPressシステムは2〜3文（50〜100文字程度）に制限しなければならない
5. 記事を表示するとき、MyRSSPressシステムは要約欄を記事の下部に表示しなければならない
6. 要約欄を表示するとき、MyRSSPressシステムは「要約」ラベルを付けて視覚的に区別しなければならない
7. 要約が生成できなかったとき、MyRSSPressシステムは元の記事説明を表示しなければならない
8. 新聞設定で要約機能を有効/無効にできるとき、MyRSSPressシステムは設定に従って要約を表示または非表示にしなければならない
9. 要約生成がタイムアウトしたとき、MyRSSPressシステムは要約なしで記事を表示しなければならない
10. 複数記事の要約を生成するとき、MyRSSPressシステムは並行処理で生成時間を最小化しなければならない

### 要件12: 記事の既読機能

**ユーザーストーリー:** ユーザーとして、クリックした記事を既読として記録したい。そうすることで、どの記事を読んだか把握でき、複数デバイスで既読状態を同期できる。

#### 受入基準

1. ユーザーが記事リンクをクリックしたとき、MyRSSPressシステムはその記事を既読としてマークしなければならない
2. ユーザーがログインしているとき、MyRSSPressシステムは既読記事をDynamoDBに保存しなければならない
3. ユーザーがログインしていないとき、MyRSSPressシステムは既読記事をブラウザのローカルストレージに保存しなければならない
4. ユーザーがログインしたとき、MyRSSPressシステムはローカルストレージの既読記事をDynamoDBに移行しなければならない
5. 既読の記事を表示するとき、MyRSSPressシステムは視覚的に区別しなければならない（例：タイトルの色を薄くする、既読バッジを表示）
6. 新聞ページを読み込むとき、MyRSSPressシステムはユーザーの既読記事リストを取得しなければならない
7. ログインユーザーの既読記事を取得するとき、MyRSSPressシステムはDynamoDBから取得しなければならない
8. 未ログインユーザーの既読記事を取得するとき、MyRSSPressシステムはローカルストレージから取得しなければならない
9. ユーザーが別のデバイスでログインしたとき、MyRSSPressシステムは既読状態を同期しなければならない
10. 既読記事データを保存するとき、MyRSSPressシステムは記事URL、既読日時、ユーザーIDを含めなければならない

### 要件13: ブックマーク機能

**ユーザーストーリー:** ユーザーとして、読んでいる間に記事をブックマークしたい。そうすることで、興味深いコンテンツを後で参照するために保存できる。

#### 受入基準

1. 記事を閲覧しているとき、MyRSSPressシステムは各記事にブックマークアイコンを表示しなければならない
2. ユーザーがブックマークアイコンをクリックしたとき、MyRSSPressシステムは記事URLをブックマークリストに追加しなければならない
3. 記事がブックマークされたとき、MyRSSPressシステムはアイコンを塗りつぶし状態に変更しなければならない
4. ユーザーがブックマーク済みアイコンをクリックしたとき、MyRSSPressシステムはブックマークを解除しなければならない
5. ブックマーク状態が変更されたとき、MyRSSPressシステムは即座にUIを更新しなければならない
6. ユーザーがブックマーク一覧ページにアクセスしたとき、MyRSSPressシステムは保存されたすべての記事URLを取得して表示しなければならない

### 要件14: エラーコードの標準化

**ユーザーストーリー:** 開発者として、APIエラーを標準化されたエラーコードで管理したい。そうすることで、フロントエンドで適切な多言語エラーメッセージを表示でき、デバッグも容易になる。

#### 背景

現在、バックエンドAPIは日本語のエラーメッセージを直接返しています：

```json
{
  "error": "記事数が不足しています。別のフィードを追加するか、後でもう一度お試しください。",
  "articleCount": 0
}
```

これには以下の問題があります：
1. 多言語対応が困難（エラーメッセージがハードコード）
2. フロントエンドでエラーの種類を判別できない
3. デバッグ時にエラーの原因が分かりにくい

#### 受入基準

**バックエンド:**

1. APIエラーを返すとき、MyRSSPressシステムは以下の形式を使用しなければならない：
```json
{
  "error": "Developer-friendly error message in English",
  "errorCode": "ERROR_CODE_CONSTANT",
  "details": {
    "additionalInfo": "value"
  }
}
```

2. エラーコードを定義するとき、MyRSSPressシステムは以下の命名規則に従わなければならない：
   - 大文字のスネークケース（例：`GENERATE_NEWSPAPER_NO_ARTICLES`）
   - 機能名をプレフィックスとして使用（例：`GENERATE_NEWSPAPER_*`、`SUGGEST_FEEDS_*`）
   - 説明的で明確な名前

3. エラーコードを管理するとき、MyRSSPressシステムは`backend/src/constants/errorCodes.ts`ファイルに集約しなければならない

4. エラーコードファイルを作成するとき、MyRSSPressシステムは以下の構造を使用しなければならない：
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

5. エラーレスポンスを返すとき、MyRSSPressシステムは以下の例に従わなければならない：
```typescript
// 例1: 記事が取得できない
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

// 例2: 記事数が不足
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

**フロントエンド:**

6. エラーメッセージを定義するとき、MyRSSPressシステムは`frontend/lib/i18n.ts`に追加しなければならない

7. エラーメッセージを追加するとき、MyRSSPressシステムは以下の構造を使用しなければならない：
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

8. APIエラーを処理するとき、MyRSSPressシステムは以下のヘルパー関数を使用しなければならない：
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

9. APIを呼び出すとき、MyRSSPressシステムは以下のパターンを使用しなければならない：
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

**ドキュメント:**

10. エラーコードを追加するとき、MyRSSPressシステムは`docs/API.md`にエラーコード一覧を記載しなければならない

11. エラーコードドキュメントを作成するとき、MyRSSPressシステムは以下の情報を含めなければならない：
    - エラーコード
    - HTTPステータスコード
    - 説明
    - 発生条件
    - 対処方法

**移行戦略:**

12. 既存のエラーレスポンスを移行するとき、MyRSSPressシステムは以下の順序で実行しなければならない：
    - ステップ1: `errorCodes.ts`を作成してエラーコードを定義
    - ステップ2: バックエンドのエラーレスポンスを更新
    - ステップ3: フロントエンドのi18nにエラーメッセージを追加
    - ステップ4: フロントエンドのエラーハンドリングを更新
    - ステップ5: 既存のハードコードされたエラーメッセージを削除

13. 移行を完了するとき、MyRSSPressシステムは以下のファイルを更新しなければならない：
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

14. 移行を完了するとき、MyRSSPressシステムは以下のファイルをプロパティベーステストに書き換えなければならない：
    - `frontend/lib/layoutCalculator.test.ts`
    - `frontend/components/features/newspaper/NewspaperLayout.test.tsx`
    - `frontend/components/features/feed/FeedSelector.test.tsx`
    - `backend/src/services/importanceCalculator.test.ts`
    - `backend/src/services/rssParser.test.ts`
    - `backend/src/routes/*.test.ts`（すべてのAPIエンドポイント）
