# Requirements Document (Future Extensions)

## Introduction

This document defines requirements for future extensions of MyRSSPress. These features are not included in the current implementation, but the architecture should be prepared to facilitate future implementation.

## Glossary

- **Privacy Settings**: Settings to control public/private status of newspapers
- **Private Newspaper**: Newspaper viewable only by creator
- **Public Newspaper**: Newspaper viewable by all users

## 要件

### 要件1: 新聞のプライバシー設定

**ユーザーストーリー:** ユーザーとして、新聞を公開するか非公開にするかを選択したい。そうすることで、個人的な新聞とシェアしたい新聞を分けて管理できる。

#### 受入基準

1. 新聞設定モーダルを表示するとき、MyRSSPressシステムは公開/非公開選択オプションを含めなければならない
2. ユーザーが公開を選択したとき、MyRSSPressシステムは新聞を他のユーザーが閲覧可能な状態で保存しなければならない
3. ユーザーが非公開を選択したとき、MyRSSPressシステムは新聞を作成者のみが閲覧可能な状態で保存しなければならない
4. 人気の新聞セクションを表示するとき、MyRSSPressシステムは公開設定の新聞のみを表示しなければならない
5. ユーザーが自分の新聞一覧を閲覧するとき、MyRSSPressシステムは公開/非公開の両方の新聞を表示しなければならない
6. 各新聞カードを表示するとき、MyRSSPressシステムは公開/非公開のステータスを視覚的に示さなければならない

### 要件2: マイ新聞一覧

**ユーザーストーリー:** ユーザーとして、自分が作成した新聞の一覧を閲覧したい。そうすることで、過去に作成した新聞を簡単に見つけられる。

#### 受入基準

1. ユーザーがマイ新聞ページにアクセスしたとき、MyRSSPressシステムは作成者が自分である新聞の一覧を表示しなければならない
2. マイ新聞一覧を表示するとき、MyRSSPressシステムは作成日時の降順に新聞を並べなければならない
3. 各新聞カードを表示するとき、MyRSSPressシステムはサムネイル画像、タイトル、作成日、公開/非公開ステータスを含めなければならない
4. ユーザーが新聞カードをクリックしたとき、MyRSSPressシステムはその新聞の詳細ページに遷移しなければならない

### 要件3: 新聞の編集と削除

**ユーザーストーリー:** ユーザーとして、作成した新聞の設定を後から変更したり削除したりしたい。そうすることで、新聞を柔軟に管理できる。

#### 受入基準

1. ユーザーが自分の新聞を閲覧しているとき、MyRSSPressシステムは編集ボタンと削除ボタンを表示しなければならない
2. ユーザーが編集ボタンをクリックしたとき、MyRSSPressシステムは設定モーダルを表示しなければならない
3. 設定モーダルを表示するとき、MyRSSPressシステムは現在の設定値を入力フィールドに表示しなければならない
4. ユーザーが設定を変更して保存したとき、MyRSSPressシステムはデータベースの新聞情報を更新しなければならない
5. ユーザーが削除ボタンをクリックしたとき、MyRSSPressシステムは確認ダイアログを表示しなければならない
6. ユーザーが削除を確認したとき、MyRSSPressシステムはデータベースから新聞を削除しなければならない

### 要件4: ユーザー認証（メールアドレス/パスワード）

**ユーザーストーリー:** ユーザーとして、メールアドレスとパスワードでアカウントを作成してログインしたい。そうすることで、自分の新聞を管理し、他のユーザーと区別できる。

#### 受入基準

1. ユーザーがアプリケーションにアクセスしたとき、MyRSSPressシステムはログイン/サインアップオプションを表示しなければならない
2. ユーザーがサインアップを選択したとき、MyRSSPressシステムはメールアドレスとパスワードの入力を求めなければならない
3. パスワードを入力するとき、MyRSSPressシステムは以下の要件を満たすことを検証しなければならない：
   - 最小8文字
   - 大文字、小文字、数字を含む
4. ユーザーがサインアップを完了したとき、MyRSSPressシステムは確認メールを送信しなければならない
5. ユーザーがメールアドレスを確認したとき、MyRSSPressシステムはアカウントを有効化しなければならない
6. ユーザーがログインしたとき、MyRSSPressシステムはAWS Cognitoでセッションを確立しなければならない
7. ユーザーがログインしているとき、MyRSSPressシステムは新聞保存時に作成者情報を自動的に関連付けなければならない
8. ユーザーがログアウトしたとき、MyRSSPressシステムはセッションを終了しなければならない
9. ユーザーがパスワードを忘れたとき、MyRSSPressシステムはパスワードリセット機能を提供しなければならない

### 要件5: ユーザー認証（Google OAuth）

**ユーザーストーリー:** ユーザーとして、Googleアカウントでログインしたい。そうすることで、新しいパスワードを作成せずに簡単にアクセスできる。

#### 受入基準

1. ログイン画面を表示するとき、MyRSSPressシステムは「Googleでログイン」ボタンを表示しなければならない
2. ユーザーが「Googleでログイン」ボタンをクリックしたとき、MyRSSPressシステムはGoogle OAuth認証フローを開始しなければならない
3. ユーザーがGoogleアカウントで認証したとき、MyRSSPressシステムはAWS Cognitoでセッションを確立しなければならない
4. 初回ログイン時、MyRSSPressシステムはGoogleプロフィール情報（名前、メールアドレス）を取得してユーザーアカウントを作成しなければならない
5. ユーザーがログインしているとき、MyRSSPressシステムは新聞保存時に作成者情報を自動的に関連付けなければならない
6. ユーザーがログアウトしたとき、MyRSSPressシステムはセッションを終了しなければならない

### 要件6: 新聞のテーマ（スキン）選択

**ユーザーストーリー:** ユーザーとして、新聞の見た目（テーマ/スキン）を選択したい。そうすることで、好みのデザインで新聞を楽しめる。

#### 受入基準

1. 新聞設定モーダルを表示するとき、MyRSSPressシステムはテーマ選択オプションを含めなければならない
2. テーマ選択オプションを表示するとき、MyRSSPressシステムは以下のテーマを提供しなければならない：
   - クラシック（デフォルト）：伝統的な新聞スタイル
   - モダン：現代的でクリーンなデザイン
   - ダーク：ダークモードスタイル
   - ビンテージ：レトロな新聞スタイル
3. 各テーマオプションを表示するとき、MyRSSPressシステムはプレビュー画像を含めなければならない
4. ユーザーがテーマを選択したとき、MyRSSPressシステムは新聞のスタイルを即座に更新しなければならない
5. 新聞を保存するとき、MyRSSPressシステムは選択されたテーマを新聞メタデータに含めなければならない
6. 保存された新聞を表示するとき、MyRSSPressシステムは保存されたテーマを適用しなければならない

### 要件7: 記事数の調整

**ユーザーストーリー:** ユーザーとして、新聞に表示する記事数を調整したい。そうすることで、読む時間に合わせて新聞のボリュームを変更できる。

#### 受入基準

1. 新聞生成前の設定画面を表示するとき、MyRSSPressシステムは記事数選択オプションを含めなければならない
2. 記事数選択オプションを表示するとき、MyRSSPressシステムは5から20の範囲でスライダーまたはドロップダウンを提供しなければならない
3. デフォルト値を設定するとき、MyRSSPressシステムは10記事を初期値として設定しなければならない
4. ユーザーが記事数を変更したとき、MyRSSPressシステムは選択された数の記事を取得しなければならない
5. 記事数が選択された数より少ないとき、MyRSSPressシステムは取得できたすべての記事を表示しなければならない
6. 新聞を保存するとき、MyRSSPressシステムは選択された記事数を新聞メタデータに含めなければならない

### 要件8: ページ数の調整

**ユーザーストーリー:** ユーザーとして、新聞のページ数を調整したい。そうすることで、より多くの記事を複数ページに分けて表示できる。

#### 受入基準

1. 新聞生成前の設定画面を表示するとき、MyRSSPressシステムはページ数選択オプションを含めなければならない
2. ページ数選択オプションを表示するとき、MyRSSPressシステムは1から4の範囲で選択肢を提供しなければならない
3. デフォルト値を設定するとき、MyRSSPressシステムは1ページを初期値として設定しなければならない
4. ユーザーがページ数を選択したとき、MyRSSPressシステムは記事を均等に各ページに配分しなければならない
5. 複数ページの新聞を表示するとき、MyRSSPressシステムはページナビゲーション（前へ/次へボタン）を提供しなければならない
6. ユーザーがページを切り替えたとき、MyRSSPressシステムは選択されたページの記事を表示しなければならない
7. 新聞を保存するとき、MyRSSPressシステムは選択されたページ数を新聞メタデータに含めなければならない
8. 各ページを表示するとき、MyRSSPressシステムは現在のページ番号と総ページ数を表示しなければならない

### 要件9: 環境分離（Development/Staging）

**ユーザーストーリー:** 開発者として、本番環境に影響を与えずに新機能をテストしたい。そうすることで、安全に開発とデプロイができる。

#### 受入基準

1. インフラストラクチャを構築するとき、MyRSSPressシステムはdevelopment環境を提供しなければならない
2. インフラストラクチャを構築するとき、MyRSSPressシステムはstaging環境を提供しなければならない
3. 各環境を構築するとき、MyRSSPressシステムは独立したAWSリソースを作成しなければならない
4. 環境を切り替えるとき、MyRSSPressシステムは環境固有の設定を使用しなければならない
5. コードをデプロイするとき、MyRSSPressシステムは以下のフローに従わなければならない：
   - developブランチ → development環境
   - stagingブランチ → staging環境
   - mainブランチ → production環境

## 設計上の考慮事項

これらの機能を将来実装する際に備えて、現在の設計では以下の点を考慮する必要があります：

1. **データモデル**: 新聞テンプレートと新聞発行版を分離

   **NewspaperTemplate（新聞テンプレート）**:
   - `templateId`: テンプレートID（UUID）
   - `userId`: 作成者のユーザーID（Cognito Sub）
   - `name`: 新聞名
   - `feedUrls`: RSSフィードURLリスト
   - `theme`: 選択されたテーマ/スキン
   - `articleCount`: 記事数
   - `pageCount`: ページ数
   - `isPublic`: 公開/非公開フラグ
   - `autoPublish`: 自動発行の有効/無効フラグ
   - `enableSummary`: 要約機能の有効/無効フラグ
   - `createdAt`: テンプレート作成日時
   - `updatedAt`: テンプレート更新日時
   
   **NewspaperIssue（新聞発行版）**:
   - `issueId`: 発行版ID（UUID）
   - `templateId`: 元のテンプレートID
   - `publishDate`: 発行日（YYYY-MM-DD形式）
   - `articles`: 記事データ（JSON配列）
   - `createdAt`: 発行日時
   - `viewCount`: 閲覧数
   
   **DynamoDBテーブル設計**:
   
   **NewspaperTemplatesテーブル**:
   - PK: `TEMPLATE#{templateId}`
   - SK: `METADATA`
   - 属性: 上記のNewspaperTemplateフィールド
   - GSI: `UserTemplates`（ユーザーのテンプレート一覧取得用）
     - PK: `USER#{userId}`
     - SK: `CREATED#{createdAt}#{templateId}`
   
   **NewspaperIssuesテーブル**:
   - PK: `TEMPLATE#{templateId}`
   - SK: `ISSUE#{publishDate}`
   - 属性: 上記のNewspaperIssueフィールド
   - GSI: `PublicIssues`（公開新聞の発行版一覧取得用）
     - PK: `PUBLIC`
     - SK: `PUBLISHED#{publishDate}#{issueId}`
   
   記事エンティティに以下のフィールドを追加：
   - `summary`: AI生成された要約テキスト
   
   **ReadArticle（既読記事）**:
   - `userId`: ユーザーID（Cognito Sub）
   - `articleUrl`: 記事URL
   - `readAt`: 既読日時（ISO 8601）
   
   **DynamoDBテーブル設計（既読記事）**:
   
   **ReadArticlesテーブル**:
   - PK: `USER#{userId}`
   - SK: `ARTICLE#{articleUrl}`
   - 属性: `userId`, `articleUrl`, `readAt`
   - TTL: 90日後に自動削除（古い既読記事を削除）
   
   **アクセスパターン**:
   - テンプレート取得: `GetItem(PK=TEMPLATE#{templateId}, SK=METADATA)`
   - ユーザーのテンプレート一覧: `Query(GSI=UserTemplates, PK=USER#{userId})`
   - 特定日の発行版取得: `GetItem(PK=TEMPLATE#{templateId}, SK=ISSUE#{publishDate})`
   - テンプレートの全発行版取得: `Query(PK=TEMPLATE#{templateId}, SK begins_with ISSUE#)`
   - 最新の発行版取得: `Query(PK=TEMPLATE#{templateId}, SK begins_with ISSUE#, ScanIndexForward=false, Limit=1)`
   - 公開新聞の発行版一覧: `Query(GSI=PublicIssues, PK=PUBLIC)`

2. **認証**: AWS Cognitoを使用したユーザー認証
   - ユーザープール設定
   - Google OAuth統合
   - JWTトークン検証

3. **アクセス制御**: 新聞の閲覧権限をチェックするロジック
   - 公開新聞：すべてのユーザーが閲覧可能
   - 非公開新聞：作成者のみ閲覧可能

4. **UI/UX**: 拡張可能なコンポーネント設計
   - 公開/非公開設定UI
   - テーマ選択UI
   - 記事数・ページ数調整UI
   - ページナビゲーション
   - 自動発行設定UI
   - 要約表示UI
   - 固有URL表示とコピー機能
   - 発行版履歴表示UI（カレンダービューまたはリスト）
   - 発行日選択UI
   - テンプレート/発行版の区別表示

5. **API設計**: 拡張可能なエンドポイント
   - 認証が必要なエンドポイント（Authorization ヘッダー）
   
   **テンプレート管理**:
   - `POST /templates` - 新聞テンプレート作成
   - `GET /templates/{templateId}` - テンプレート取得
   - `PUT /templates/{templateId}` - テンプレート更新
   - `DELETE /templates/{templateId}` - テンプレート削除
   - `GET /users/{userId}/templates` - ユーザーのテンプレート一覧
   
   **発行版管理**:
   - `GET /templates/{templateId}/latest` - 最新の発行版取得（存在しない場合は生成）
   - `GET /templates/{templateId}/issues/{date}` - 特定日の発行版取得
   - `GET /templates/{templateId}/issues` - テンプレートの全発行版一覧
   - `POST /templates/{templateId}/issues` - 手動で発行版を生成
   
   **既読記事管理**:
   - `POST /users/{userId}/read-articles` - 既読記事を記録
   - `GET /users/{userId}/read-articles` - ユーザーの既読記事一覧取得
   - `DELETE /users/{userId}/read-articles/{articleUrl}` - 既読記事を削除（未読に戻す）
   
   **その他**:
   - 記事要約生成（Bedrock統合）
   - ブックマークの管理

6. **インフラストラクチャ**: 
   - Terraformモジュールは環境を追加しやすい構造
   - Cognitoユーザープールとアプリクライアント
   - Google OAuth設定

7. **環境変数**: 環境ごとに異なる設定
   - Cognito User Pool ID
   - Cognito App Client ID
   - Google OAuth Client ID/Secret
   - Bedrock Model ID（要約用）
   - 要約生成のタイムアウト設定

8. **パフォーマンス**: 要約生成の最適化
   - 複数記事の要約を並行処理
   - 要約キャッシュの検討（同じ記事の再要約を避ける）
   - タイムアウト設定（記事あたり3秒以内）


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
