# Requirements Document - Phase 3: Dynamic Category Management

## Introduction

Phase 3 では、RSS フィードのカテゴリ管理を DynamoDB ベースの動的システムに移行します。現在はコード内の定数として管理されているカテゴリ、キーワード、信頼できるフィードを、DynamoDB で管理することで、コードデプロイなしでの更新を可能にします。

## Glossary

- **Category（カテゴリ）**: RSS フィードを分類するための階層的な分類（例: technology, business）
- **Parent Category（親カテゴリ）**: 複数の子カテゴリをグループ化する上位カテゴリ（例: tech, news, lifestyle）
- **Keyword（キーワード）**: ユーザーのテーマ入力からカテゴリを推測するための検索語
- **Reliable Feed（信頼できるフィード）**: 各カテゴリに紐づく、品質が保証された RSS フィード
- **Locale（ロケール）**: 言語設定（"en" または "ja"）
- **Category Management System（カテゴリ管理システム）**: カテゴリ、キーワード、フィードを DynamoDB で管理するシステム

## Requirements

### Requirement 1: カテゴリマスタの DynamoDB 管理

**User Story:** As a system administrator, I want to manage categories in DynamoDB, so that I can add or modify categories without code deployment.

#### Acceptance Criteria

1. WHEN the system starts THEN the Category Management System SHALL load all active categories from DynamoDB
2. WHEN a category is retrieved THEN the system SHALL return category metadata including categoryId, parentCategory, locale, displayName, keywords, and order
3. WHEN categories are queried by locale THEN the system SHALL return only categories matching that locale
4. WHEN categories are queried THEN the system SHALL return them sorted by order field
5. WHEN a category is inactive (isActive=false) THEN the system SHALL exclude it from query results

### Requirement 2: 信頼できるフィードの DynamoDB 管理

**User Story:** As a system administrator, I want to manage reliable feeds in DynamoDB, so that I can add or update feeds without code deployment.

#### Acceptance Criteria

1. WHEN feeds are queried by category THEN the system SHALL return all active feeds for that category
2. WHEN a feed is retrieved THEN the system SHALL return feed metadata including url, title, description, language, and priority
3. WHEN feeds are queried THEN the system SHALL return them sorted by priority field
4. WHEN a feed is inactive (isActive=false) THEN the system SHALL exclude it from query results
5. WHEN a category has no active feeds THEN the system SHALL return an empty array

### Requirement 3: キーワードマッチングの動的化

**User Story:** As a system, I want to match user themes to categories using keywords from DynamoDB, so that category matching can be updated without code changes.

#### Acceptance Criteria

1. WHEN a user provides a theme THEN the system SHALL match it against keywords from all active categories
2. WHEN multiple categories match THEN the system SHALL return the first matching category based on order
3. WHEN no categories match THEN the system SHALL return null
4. WHEN keywords are updated in DynamoDB THEN the system SHALL use the updated keywords on the next request
5. WHEN matching keywords THEN the system SHALL perform case-insensitive matching

### Requirement 4: 階層構造の維持

**User Story:** As a developer, I want to maintain the hierarchical category structure in DynamoDB, so that parent-child relationships are preserved.

#### Acceptance Criteria

1. WHEN a category is retrieved THEN the system SHALL include its parentCategory field
2. WHEN child categories are queried for a parent THEN the system SHALL return all children of that parent
3. WHEN feeds are queried by parent category THEN the system SHALL aggregate feeds from all child categories
4. WHEN a parent category is specified THEN the system SHALL validate that it exists
5. WHEN the hierarchy is queried THEN the system SHALL return the complete parent-child structure

### Requirement 5: パフォーマンス最適化（キャッシュ）

**User Story:** As a system, I want to cache category data in memory, so that frequent queries do not impact DynamoDB performance.

#### Acceptance Criteria

1. WHEN categories are first loaded THEN the system SHALL cache them in memory
2. WHEN a category query is made THEN the system SHALL serve from cache if available
3. WHEN cache is older than 5 minutes THEN the system SHALL refresh from DynamoDB
4. WHEN cache refresh fails THEN the system SHALL continue serving stale cache data
5. WHEN the system starts THEN the system SHALL pre-load all categories into cache

### Requirement 6: 初期データ投入

**User Story:** As a system administrator, I want to migrate existing category data to DynamoDB, so that the system can start with current categories.

#### Acceptance Criteria

1. WHEN the migration script runs THEN the system SHALL create all categories from reliableFeeds.ts
2. WHEN the migration script runs THEN the system SHALL create all feeds from reliableFeeds.ts
3. WHEN the migration script runs THEN the system SHALL preserve the hierarchical structure
4. WHEN the migration script runs THEN the system SHALL set appropriate order values
5. WHEN the migration script runs THEN the system SHALL mark all items as active

### Requirement 7: 後方互換性の維持

**User Story:** As a developer, I want to maintain backward compatibility during migration, so that existing code continues to work.

#### Acceptance Criteria

1. WHEN the DynamoDB system is unavailable THEN the system SHALL fall back to the constant-based system
2. WHEN both systems are available THEN the system SHALL prefer DynamoDB data
3. WHEN the API is called THEN the system SHALL return the same data structure as before
4. WHEN tests run THEN the system SHALL pass all existing tests
5. WHEN the migration is complete THEN the system SHALL remove the constant-based fallback

### Requirement 8: 管理 API の提供（将来拡張）

**User Story:** As a system administrator, I want REST APIs to manage categories, so that I can update them programmatically.

#### Acceptance Criteria

1. WHEN a POST request is made to /api/admin/categories THEN the system SHALL create a new category
2. WHEN a PUT request is made to /api/admin/categories/{id} THEN the system SHALL update the category
3. WHEN a DELETE request is made to /api/admin/categories/{id} THEN the system SHALL mark the category as inactive
4. WHEN a POST request is made to /api/admin/feeds THEN the system SHALL create a new feed
5. WHEN admin APIs are called THEN the system SHALL require authentication (future implementation)

## Non-Functional Requirements

### Performance

- カテゴリ取得: 10ms 以内（キャッシュヒット時）
- カテゴリ取得: 100ms 以内（DynamoDB クエリ時）
- キャッシュリフレッシュ: バックグラウンドで実行、ユーザーリクエストをブロックしない

### Scalability

- DynamoDB オンデマンドキャパシティを使用
- カテゴリ数: 最大 100 カテゴリ
- フィード数: 最大 1000 フィード

### Reliability

- DynamoDB 障害時は定数ベースのフォールバック
- キャッシュ更新失敗時は古いキャッシュを継続使用
- エラーログを CloudWatch に記録

## Out of Scope (Phase 3)

以下は Phase 3 の範囲外とし、将来のフェーズで実装します：

- 管理画面 UI（Requirement 8 の API のみ実装）
- 認証・認可機能（管理 API は未認証で実装、将来追加）
- カテゴリの多言語対応（現在の en/ja のみ）
- フィードの自動ヘルスチェック（Phase 2 の Task 6.2 で実装予定）
- A/B テスト機能

## Migration Strategy

Phase 3 の実装は段階的に行います：

1. **Phase 3.1**: DynamoDB テーブル作成、Repository/Service 層実装
2. **Phase 3.2**: 初期データ投入スクリプト、キャッシュ実装
3. **Phase 3.3**: 既存コードの移行、フォールバック実装
4. **Phase 3.4**: 管理 API 実装（基本的な CRUD）
5. **Phase 3.5**: テスト、本番デプロイ、定数削除

## Success Criteria

Phase 3 が成功したと判断する基準：

- [ ] 全カテゴリとフィードが DynamoDB に移行されている
- [ ] 既存の全テストが通過する
- [ ] パフォーマンスが現状と同等以上（キャッシュヒット時）
- [ ] DynamoDB 障害時にフォールバックが機能する
- [ ] 管理 API で新しいカテゴリを追加できる
- [ ] コードデプロイなしでカテゴリを更新できる
