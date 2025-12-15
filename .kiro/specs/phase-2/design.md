# 設計書 Phase-2

## 概要

Phase-2 では、MyRSSPress に言語対応機能、過去の新聞閲覧、検索機能の強化、視覚的な改善を追加します。システムは記事の言語を自動検出（日本語/英語）し、言語によるフィルタリングを可能にし、日付ベースの新聞アーカイブ（7日間保持）を提供し、ローディングアニメーションと AI 生成の要約でユーザー体験を向上させます。

主な機能強化:
1. 言語検出とフィルタリング（JP/EN）
2. 日付ベース URL による過去の新聞閲覧
3. 新聞のフリーワード検索
4. 生成中のローディングアニメーション
5. 画像保証付きメインエリアの強化
6. AI 生成の新聞要約（3行、100-200文字）
7. 新機能のための拡張データベーススキーマ

プロジェクト構造は Phase-1 と同じ:
- `backend/` - TypeScript/Hono API サーバー（Lambda 用）
- `frontend/` - Next.js + TailwindCSS（Amplify Hosting 用）
- `infra/` - Terraform IaC コード

## アーキテクチャ

### システムアーキテクチャの更新

Phase-2 では既存のアーキテクチャに以下のコンポーネントを追加:

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Next.js + TailwindCSS)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 言語         │  │ 日付ベース   │  │ 検索         │      │
│  │ フィルター   │  │ ナビゲーション│  │ コンポーネント│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│           Backend API (TypeScript/Hono on Lambda)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 言語         │  │ 過去の新聞   │  │ 要約         │      │
│  │ 検出器       │  │ サービス     │  │ 生成器       │      │
│  │              │  │              │  │ (Bedrock)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   AWS Bedrock    │  │   DynamoDB       │  │  EventBridge │
│   (言語 +        │  │   (拡張          │  │  (クリーンアップ│
│    要約)         │  │    スキーマ)     │  │   スケジュール)│
└──────────────────┘  └──────────────────┘  └──────────────┘
```

### 新しいコンポーネント

**フロントエンド:**
- 言語フィルターコンポーネント（JP/EN 選択）
- 過去の新聞用の日付ピッカー
- リアルタイムフィルタリング付き検索入力
- ローディングアニメーションコンポーネント
- 著作権フリー画像プレースホルダーサービス

**バックエンド:**
- 言語検出サービス
- 過去の新聞サービス
- 要約生成サービス（Bedrock）
- クリーンアップ Lambda 関数（スケジュール実行）

**インフラストラクチャ:**
- 毎日のクリーンアップ用 EventBridge ルール
- 拡張 DynamoDB スキーマ


## 主要サービスの設計

### 0. フィード品質改善サービス

**目的**: AI提案フィードの品質を向上させ、無効/終了したフィードURLを減らす

**問題**: 現在、Bedrock AIが提案するフィードURLの中に、無効（404）や終了したサービスのURLが含まれることがある。これによりユーザーが記事を取得できないエラーが発生する。

**解決策**:

#### 1. カテゴリ別信頼できるフィードリストの維持

**実装方法**: デフォルトフィードを拡張し、カテゴリ別に整理

```typescript
// backend/src/constants/reliableFeeds.ts
export const RELIABLE_FEEDS_BY_CATEGORY = {
  technology: [
    { url: 'https://techcrunch.com/feed/', title: 'TechCrunch', language: 'EN' },
    { url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge', language: 'EN' },
    { url: 'https://www.wired.com/feed/rss', title: 'WIRED', language: 'EN' },
  ],
  business: [
    { url: 'https://www.bloomberg.com/feed/podcast/etf-report.xml', title: 'Bloomberg', language: 'EN' },
    { url: 'https://www.ft.com/?format=rss', title: 'Financial Times', language: 'EN' },
  ],
  politics: [
    { url: 'https://www.bbc.com/news/politics/rss.xml', title: 'BBC Politics', language: 'EN' },
    { url: 'https://www.politico.com/rss/politics08.xml', title: 'Politico', language: 'EN' },
  ],
  // 日本語カテゴリ
  'technology-jp': [
    { url: 'https://www.itmedia.co.jp/rss/2.0/news_bursts.xml', title: 'ITmedia', language: 'JP' },
    { url: 'https://japan.cnet.com/rss/index.rdf', title: 'CNET Japan', language: 'JP' },
  ],
  'business-jp': [
    { url: 'https://www.nikkei.com/rss/', title: '日本経済新聞', language: 'JP' },
  ],
  // ... 他のカテゴリ
};

// カテゴリマッピング（テーマからカテゴリを推測）
export function getCategoryFromTheme(theme: string, locale: 'en' | 'ja'): string | null {
  const themeL lower = theme.toLowerCase();
  const suffix = locale === 'ja' ? '-jp' : '';
  
  if (themeL.includes('tech') || themeL.includes('テクノロジー')) {
    return `technology${suffix}`;
  }
  if (themeL.includes('business') || themeL.includes('ビジネス')) {
    return `business${suffix}`;
  }
  if (themeL.includes('politics') || themeL.includes('政治')) {
    return `politics${suffix}`;
  }
  // ... 他のカテゴリ
  
  return null; // カテゴリが見つからない場合
}
```

#### 2. フィードヘルスチェックの追加

**実装方法**: 定期的にフィードの健全性をチェック

```typescript
// backend/src/services/feedHealthCheckService.ts
interface FeedHealthStatus {
  url: string;
  isHealthy: boolean;
  lastChecked: Date;
  lastArticleDate?: Date;
  errorMessage?: string;
}

async function checkFeedHealth(url: string): Promise<FeedHealthStatus> {
  try {
    const feed = await parser.parseURL(url);
    
    // 記事が存在するかチェック
    if (!feed.items || feed.items.length === 0) {
      return {
        url,
        isHealthy: false,
        lastChecked: new Date(),
        errorMessage: 'No articles found',
      };
    }
    
    // 最新記事の日付をチェック（30日以内なら健全）
    const latestArticle = feed.items[0];
    const latestDate = latestArticle.pubDate ? new Date(latestArticle.pubDate) : null;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const isHealthy = latestDate ? latestDate > thirtyDaysAgo : false;
    
    return {
      url,
      isHealthy,
      lastChecked: new Date(),
      lastArticleDate: latestDate || undefined,
      errorMessage: isHealthy ? undefined : 'No recent articles (> 30 days)',
    };
  } catch (error) {
    return {
      url,
      isHealthy: false,
      lastChecked: new Date(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 信頼できるフィードリストの健全性を定期的にチェック
async function checkAllReliableFeeds(): Promise<Map<string, FeedHealthStatus>> {
  const results = new Map<string, FeedHealthStatus>();
  
  for (const [category, feeds] of Object.entries(RELIABLE_FEEDS_BY_CATEGORY)) {
    for (const feed of feeds) {
      const status = await checkFeedHealth(feed.url);
      results.set(feed.url, status);
    }
  }
  
  return results;
}
```

#### 3. Bedrockプロンプトの改善

**実装方法**: プロンプトに信頼できるフィードリストを含め、キーワードとの関連性を重視

```typescript
async function suggestFeedsWithReliableList(
  theme: string,
  locale: 'en' | 'ja'
): Promise<FeedSuggestion[]> {
  // カテゴリを推測
  const category = getCategoryFromTheme(theme, locale);
  
  // 信頼できるフィードリストを取得
  const reliableFeeds = category 
    ? RELIABLE_FEEDS_BY_CATEGORY[category] || []
    : [];
  
  // プロンプトに信頼できるフィードを含める
  const reliableFeedsList = reliableFeeds
    .map(f => `- ${f.title}: ${f.url}`)
    .join('\n');
  
  const prompt = locale === 'ja'
    ? `ユーザーは「${theme}」に興味があります。
以下の信頼できるRSSフィードリストを優先的に使用し、10個のRSSフィードを提案してください。

信頼できるフィード:
${reliableFeedsList}

重要な制約:
1. 上記の信頼できるフィードリストから、テーマに関連するものを優先的に選択してください
2. リストにない場合のみ、他の実在する主要メディアの公式RSSフィードを提案してください
3. テーマとの関連性を最優先してください（一般的な主要ニュースソースになりすぎないように）
4. 実在しないフィードや終了したサービスのURLは絶対に提案しないでください
5. 正しいフィードURL形式（/rss, /feed, /rss.xml など）を使用してください

JSON形式で10個のフィードを返してください:
[
  {
    "url": "https://example.com/feed",
    "title": "Feed Title",
    "reasoning": "テーマとの関連性の説明"
  }
]`
    : `User is interested in "${theme}".
Please suggest 10 RSS feeds, prioritizing the following reliable feed list.

Reliable feeds:
${reliableFeedsList}

Important constraints:
1. Prioritize feeds from the reliable list above that are relevant to the theme
2. Only suggest other real, official RSS feeds from major media if not in the list
3. Prioritize relevance to the theme (avoid becoming too generic major news sources)
4. Never suggest non-existent feeds or terminated service URLs
5. Use correct feed URL formats (/rss, /feed, /rss.xml, etc.)

Return 10 feeds in JSON format:
[
  {
    "url": "https://example.com/feed",
    "title": "Feed Title",
    "reasoning": "Explanation of relevance to theme"
  }
]`;
  
  // Bedrock API呼び出し
  const suggestions = await callBedrockAPI(prompt);
  
  // URL検証（既存のロジック）
  const validatedSuggestions = await validateFeedUrls(suggestions);
  
  // 不足している場合、信頼できるフィードから補完
  if (validatedSuggestions.length < 5 && reliableFeeds.length > 0) {
    const supplementFeeds = reliableFeeds
      .slice(0, 5 - validatedSuggestions.length)
      .map(f => ({
        url: f.url,
        title: f.title,
        reasoning: `Reliable ${category} feed`,
      }));
    
    validatedSuggestions.push(...supplementFeeds);
  }
  
  return validatedSuggestions;
}
```

#### 4. 動作確認済みフィードのキャッシュ

**実装方法**: DynamoDBに検証済みフィードをキャッシュ

```typescript
// DynamoDB スキーマ
interface ValidatedFeed {
  PK: string; // VALIDATED_FEED#{url_hash}
  SK: string; // METADATA
  url: string;
  title: string;
  category?: string;
  language: 'JP' | 'EN';
  lastValidated: string; // ISO 8601
  validationCount: number; // 検証成功回数
  failureCount: number; // 検証失敗回数
  isHealthy: boolean;
  lastArticleDate?: string;
}

// キャッシュから取得
async function getValidatedFeed(url: string): Promise<ValidatedFeed | null> {
  const urlHash = hashUrl(url);
  const result = await dynamodb.get({
    PK: `VALIDATED_FEED#${urlHash}`,
    SK: 'METADATA',
  });
  
  return result.Item as ValidatedFeed | null;
}

// キャッシュに保存
async function saveValidatedFeed(feed: ValidatedFeed): Promise<void> {
  await dynamodb.put({ Item: feed });
}

// フィード提案時にキャッシュを活用
async function suggestFeedsWithCache(
  theme: string,
  locale: 'en' | 'ja'
): Promise<FeedSuggestion[]> {
  // Bedrockから提案を取得
  const suggestions = await suggestFeedsWithReliableList(theme, locale);
  
  // キャッシュをチェック
  const cachedResults = await Promise.all(
    suggestions.map(async (s) => {
      const cached = await getValidatedFeed(s.url);
      return { suggestion: s, cached };
    })
  );
  
  // キャッシュされた健全なフィードを優先
  const healthyFeeds = cachedResults
    .filter(r => r.cached?.isHealthy)
    .map(r => r.suggestion);
  
  // 新しいフィードを検証
  const newFeeds = cachedResults
    .filter(r => !r.cached)
    .map(r => r.suggestion);
  
  const validatedNewFeeds = await validateFeedUrls(newFeeds);
  
  // キャッシュに保存
  for (const feed of validatedNewFeeds) {
    await saveValidatedFeed({
      PK: `VALIDATED_FEED#${hashUrl(feed.url)}`,
      SK: 'METADATA',
      url: feed.url,
      title: feed.title,
      language: locale === 'ja' ? 'JP' : 'EN',
      lastValidated: new Date().toISOString(),
      validationCount: 1,
      failureCount: 0,
      isHealthy: true,
    });
  }
  
  return [...healthyFeeds, ...validatedNewFeeds];
}
```

**メリット**:
1. **品質向上**: 信頼できるフィードを優先的に提案
2. **エラー削減**: 無効なURLの提案を減らす
3. **パフォーマンス**: キャッシュにより検証時間を短縮
4. **学習**: 検証結果を蓄積し、将来の提案に活用

**実装優先度**: Phase-2の後（Phase-3として実装）

### 1. 言語検出サービス

**実装方法:** RSS フィードの language フィールド + 文字ベースの検出

```typescript
// RSS パーサーで language フィールドを取得
async function parseFeedWithLanguage(url: string): Promise<{ articles: Article[], language?: string }> {
  const feed = await parser.parseURL(url);
  const language = feed.language; // RSS の <language> フィールド
  
  const articles = feed.items.map(item => ({
    title: item.title,
    description: item.description,
    link: item.link,
    pubDate: new Date(item.pubDate),
    imageUrl: extractImageUrl(item),
    feedSource: url,
  }));
  
  return { articles, language };
}

// 文字ベースの言語検出（フォールバック）
function detectLanguage(text: string): 'JP' | 'EN' {
  // 日本語文字（ひらがな、カタカナ、漢字）をカウント
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g);
  const japaneseCount = japaneseChars ? japaneseChars.length : 0;
  
  // 10% 以上が日本語文字なら日本語と判定
  const threshold = text.length * 0.1;
  return japaneseCount > threshold ? 'JP' : 'EN';
}

async function detectLanguages(
  articles: Article[], 
  feedLanguages: Map<string, string>
): Promise<string[]> {
  const languages = new Set<string>();
  
  for (const article of articles) {
    // 優先順位 1: RSS フィードの <language> フィールドをチェック
    const feedLanguage = feedLanguages.get(article.feedSource);
    if (feedLanguage) {
      const lang = feedLanguage.startsWith('ja') ? 'JP' : 'EN';
      languages.add(lang);
      continue;
    }
    
    // 優先順位 2: 記事内容から判定（タイトル + description の最初の 50 文字）
    const description = article.description || '';
    const text = `${article.title} ${description.substring(0, 50)}`;
    const language = detectLanguage(text);
    languages.add(language);
  }
  
  return Array.from(languages);
}
```

**選択理由:**
- コスト: ゼロ
- 速度: < 1ms/記事
- 精度: 日本語/英語の判別には十分
- AWS Comprehend は使用しない（コスト削減）

**代替案:** AWS Comprehend（より正確だが高コスト）
- コスト: $0.0001/リクエスト
- 速度: ~100ms/記事
- 必要に応じて後でアップグレード可能

### 2. 要約生成サービス

**実装方法:** Bedrock (Claude 3 Haiku) を使用

```typescript
async function generateSummary(
  articles: Article[],
  theme: string,
  languages: string[] // 新聞の言語属性
): Promise<string> {
  const articleList = articles
    .slice(0, 10) // 上位 10 記事のみ使用
    .map((a, i) => `${i + 1}. ${a.title}`)
    .join('\n');
  
  // 新聞の言語に基づいて要約の言語を決定
  // 優先順位: JP > EN > その他（将来の拡張を考慮）
  const summaryLanguage = determineSummaryLanguage(languages);
  
  const prompt = summaryLanguage === 'ja'
    ? `以下は「${theme}」に関する新聞記事のタイトルです。
この新聞の内容を3行（100-200文字）で要約してください。

記事タイトル:
${articleList}

要約（3行、100-200文字）:`
    : `The following are newspaper article titles about "${theme}".
Please summarize the content of this newspaper in 3 lines (100-200 characters).

Article titles:
${articleList}

Summary (3 lines, 100-200 characters):`;
  
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });
  
  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.content[0].text.trim();
}
```

**言語決定ロジック（将来の拡張を考慮）:**
```typescript
function determineSummaryLanguage(languages: string[]): string {
  // 優先順位: JP > EN > その他（将来の拡張用）
  if (languages.includes('JP')) return 'ja';
  if (languages.includes('EN')) return 'en';
  
  // 将来的に他の言語を追加する場合はここに追加
  // if (languages.includes('ZH')) return 'zh'; // 中国語
  // if (languages.includes('KO')) return 'ko'; // 韓国語
  
  // デフォルトは英語
  return 'en';
}
```

**キャッシング戦略:**
- 初回生成: ~5-10 秒
- 2回目以降: DynamoDB から取得（< 100ms）
- コスト: ~$0.0001/要約

**エラーハンドリング:**
- Bedrock API 失敗時: 要約なしで新聞を表示
- タイムアウト: 10 秒
- リトライ: 最大 3 回（指数バックオフ）


### 3. 過去の新聞サービス

**URL 構造:**
```
/newspapers/[newspaperId]/[date]
例: /newspapers/uuid-1234/2025-12-09
```

**実装方法:**

```typescript
async function getOrCreateNewspaper(
  newspaperId: string,
  date: string,
  feedUrls: string[],
  theme: string
): Promise<NewspaperData> {
  // 日付検証
  const validation = validateDate(date);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // 既存の新聞を取得
  const existing = await getNewspaperByDate(newspaperId, date);
  if (existing) {
    return existing; // キャッシュから返す
  }
  
  // 新しい新聞を生成
  const articles = await fetchArticlesForDate(feedUrls, date);
  const articlesWithImportance = await calculateImportance(articles, theme);
  const languages = await detectLanguages(articlesWithImportance);
  const summary = await generateSummary(articlesWithImportance, theme, 'ja');
  
  const newspaper: NewspaperData = {
    newspaperId,
    newspaperDate: date,
    articles: articlesWithImportance,
    languages,
    summary,
    createdAt: new Date().toISOString(),
  };
  
  await saveNewspaper(newspaper);
  return newspaper;
}

function validateDate(date: string): { valid: boolean; error?: string } {
  // すべての日付は JST (Asia/Tokyo) で処理
  const targetDate = new Date(date + 'T00:00:00+09:00'); // JST
  const today = new Date();
  
  // JST の今日の日付（00:00:00）
  const todayJST = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  todayJST.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(todayJST);
  sevenDaysAgo.setDate(todayJST.getDate() - 7);
  
  // Check if future
  if (targetDate > todayJST) {
    return { valid: false, error: 'Future newspapers are not available' };
  }
  
  // Check if older than 7 days
  if (targetDate < sevenDaysAgo) {
    return { valid: false, error: 'Newspapers older than 7 days are not available' };
  }
  
  return { valid: true };
}
```

**記事取得ロジック:**
```typescript
async function fetchArticlesForDate(
  feedUrls: string[],
  date: string
): Promise<Article[]> {
  // すべての日付は JST (Asia/Tokyo) で処理
  const targetDate = new Date(date + 'T00:00:00+09:00'); // JST
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const todayJST = new Date(nowJST);
  todayJST.setHours(0, 0, 0, 0);
  
  const endTime = targetDate.getTime() === todayJST.getTime()
    ? nowJST // 今日なら現在時刻まで（JST）
    : new Date(targetDate.setHours(23, 59, 59, 999)); // それ以外は終日
  
  // すべての記事を取得
  const allArticles = await Promise.all(
    feedUrls.map(url => parseFeed(url))
  ).then(results => results.flat());
  
  // 日付範囲でフィルタリング
  let articles = allArticles.filter(article => {
    const pubDate = new Date(article.pubDate);
    return pubDate >= startOfDay && pubDate <= endTime;
  });
  
  // 不足している場合、さらに遡る
  const minArticles = 8;
  if (articles.length < minArticles) {
    const sevenDaysAgo = new Date(startOfDay);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    articles = allArticles.filter(article => {
      const pubDate = new Date(article.pubDate);
      return pubDate >= sevenDaysAgo && pubDate <= endTime;
    });
  }
  
  // 日付順にソート（新しい順）して 8-15 記事を選択
  articles.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  
  const targetCount = Math.floor(Math.random() * 8) + 8; // 8-15
  return articles.slice(0, targetCount);
}
```

### 4. クリーンアップサービス

**実装方法:** 毎日 3 AM JST に実行

```typescript
async function cleanupOldNewspapers(): Promise<{ deletedCount: number }> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 7日より古い新聞をクエリ
  const oldNewspapers = await queryOldNewspapers(cutoffDate);
  
  // バッチで削除
  let deletedCount = 0;
  const batchSize = 25; // DynamoDB バッチ書き込み制限
  
  for (let i = 0; i < oldNewspapers.length; i += batchSize) {
    const batch = oldNewspapers.slice(i, i + batchSize);
    await deleteBatch(batch);
    deletedCount += batch.length;
  }
  
  console.log(`クリーンアップ完了: ${deletedCount} 件の新聞を削除`);
  return { deletedCount };
}
```

**EventBridge スケジュール:**
```hcl
# infra/modules/eventbridge/main.tf
resource "aws_cloudwatch_event_rule" "cleanup_schedule" {
  name                = "myrsspress-cleanup-schedule"
  description         = "毎日 3 AM JST にクリーンアップ Lambda をトリガー"
  schedule_expression = "cron(0 18 * * ? *)" # 3 AM JST = 6 PM UTC (前日)
}
```


### 5. 著作権フリー画像サービス

**実装方法:** Unsplash Source API を使用

```typescript
export function CopyrightFreeImage({ theme, alt }: { theme?: string; alt: string }) {
  // Unsplash Source API を使用
  const imageUrl = theme 
    ? `https://source.unsplash.com/800x600/?${encodeURIComponent(theme)}`
    : 'https://source.unsplash.com/800x600/?newspaper,news';
  
  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-auto object-cover"
      onError={(e) => {
        // フォールバック: ローカルプレースホルダー
        e.currentTarget.src = '/placeholder-newspaper.jpg';
      }}
    />
  );
}
```

**使用例:**
```typescript
// リード記事
<article className="lead-article">
  {layout.lead.imageUrl ? (
    <img src={layout.lead.imageUrl} alt={layout.lead.title} />
  ) : (
    <CopyrightFreeImage theme={theme} alt={layout.lead.title} />
  )}
  {/* 記事の残り */}
</article>
```

**代替サービス:**
- Unsplash Source API: `https://source.unsplash.com/`
- Picsum Photos: `https://picsum.photos/`
- Lorem Picsum: `https://loremflickr.com/`

**注意:** プレースホルダー画像をキャッシュして、繰り返しの API 呼び出しを避けることを検討。

## データモデル

### 拡張新聞モデル

```typescript
interface Newspaper {
  newspaperId: string;      // UUID
  newspaperDate?: string;   // ISO 8601 日付 (YYYY-MM-DD) - 新規
  name: string;             // 新聞名
  userName: string;         // 作成者名
  userId?: string;          // ユーザー ID（オプション）
  feedUrls: string[];       // RSS フィード URL
  languages?: string[];     // 言語タグ ["JP", "EN"] - 新規（オプショナル）
  summary?: string;         // AI 生成要約 - 新規
  articles?: Article[];     // 記事データ（過去の新聞用）- 新規
  createdAt: string;        // 作成タイムスタンプ (ISO 8601)
  updatedAt: string;        // 更新タイムスタンプ (ISO 8601)
  viewCount: number;        // 閲覧数
  isPublic: boolean;        // 公開/非公開
}
```

### 既存の新聞の後方互換性

**問題**: Phase-1 で作成された既存の新聞には `languages` フィールドがない

**解決策**:

1. **フィールドをオプショナルにする**:
   - `languages?: string[]` - 存在しない場合もある
   - TypeScript の型定義で `?` を使用

2. **フロントエンドでのデフォルト処理**:
   ```typescript
   // 言語フィルターでの処理
   function filterByLanguage(newspapers: Newspaper[], selectedLanguage: 'JP' | 'EN'): Newspaper[] {
     return newspapers.filter(newspaper => {
       // languages フィールドがない場合は、すべての言語フィルターで表示
       if (!newspaper.languages || newspaper.languages.length === 0) {
         return true; // 言語不明の新聞は常に表示
       }
       return newspaper.languages.includes(selectedLanguage);
     });
   }
   ```

3. **バックエンドでの処理**:
   ```typescript
   // 既存の新聞を取得する際
   async function getNewspaper(newspaperId: string): Promise<Newspaper> {
     const newspaper = await dynamodb.get({ PK: `NEWSPAPER#${newspaperId}`, SK: 'METADATA' });
     
     // languages フィールドがない場合は空配列をデフォルトにする
     return {
       ...newspaper,
       languages: newspaper.languages || [],
     };
   }
   ```

4. **UI での表示**:
   - 言語タグがない新聞: 言語バッジを表示しない
   - または「言語不明」バッジを表示

5. **検索での扱い**:
   - 言語フィルター選択時、`languages` がない新聞も結果に含める
   - ユーザーは言語不明の新聞も閲覧できる

**マイグレーション不要**:
- 既存の新聞レコードを更新する必要はない
- 新しく作成される新聞のみ `languages` フィールドを持つ
- 段階的に新しいフィールドが追加される

**言語設定がない新聞の挙動**:

1. **表示**: すべての言語フィルターで表示される
   - JP フィルター選択時: ✅ 表示される
   - EN フィルター選択時: ✅ 表示される
   - 理由: ユーザーが既存の新聞を見られなくなるのを防ぐ

2. **検索**: フリーワード検索で検索できる
   - タイトルで検索: ✅ 検索できる
   - フィードURLで検索: ✅ 検索できる
   - 言語に関係なく検索される

3. **人気の新聞 / 最近の新聞**: 通常通り表示される
   - ソート順: 閲覧数または作成日時
   - 言語フィルター適用後も残る

4. **UI 表示**: 言語バッジを表示しない
   - 言語タグがない → バッジなし
   - または「言語不明」バッジを表示（オプション）

5. **API レスポンス**: `languages: []` として返す
   ```json
   {
     "newspaperId": "uuid-1234",
     "name": "Old Newspaper",
     "languages": [],  // 空配列
     "createdAt": "2025-12-01T10:00:00Z"
   }
   ```
```

### DynamoDB スキーマ更新

**Newspapers テーブル:**

**プライマリキー:**
- パーティションキー: `PK` = `NEWSPAPER#{newspaperId}` (String)
- ソートキー: `SK` = `DATE#{date}` または `METADATA` (String)

**属性:**
- Phase-1 の既存属性すべて
- `languages: string[]` - 言語タグ（例: ["JP", "EN"]）
- `summary: string` - AI 生成要約（100-200 文字）
- `newspaperDate: string` - YYYY-MM-DD 形式の日付
- `articles: Article[]` - 完全な記事データ（過去の新聞用）

**アクセスパターン:**

1. **新聞メタデータを取得（現在）:**
   - `PK = NEWSPAPER#{newspaperId}`, `SK = METADATA`

2. **特定の日付の新聞を取得:**
   - `PK = NEWSPAPER#{newspaperId}`, `SK = DATE#{date}`

3. **新聞のすべての日付を取得:**
   - `PK = NEWSPAPER#{newspaperId}`, `SK begins_with DATE#`

4. **言語で公開新聞を取得:**
   - GSI を使用してクエリ後、クライアント側で言語フィルタリング

**レコード例:**

```typescript
// 現在の新聞（メタデータのみ）
{
  PK: "NEWSPAPER#uuid-1234",
  SK: "METADATA",
  newspaperId: "uuid-1234",
  name: "Tech Morning Digest",
  userName: "John Doe",
  feedUrls: ["https://example.com/tech-feed"],
  languages: ["EN"],
  summary: "今日のテクノロジーニュースは AI の進歩、スタートアップの資金調達、クラウドコンピューティングのトレンドをカバーしています。",
  createdAt: "2025-12-09T10:00:00Z",
  updatedAt: "2025-12-09T10:00:00Z",
  viewCount: 42,
  isPublic: true,
  GSI1PK: "PUBLIC",
  GSI1SK: "VIEWS#0042#uuid-1234",
  GSI2PK: "PUBLIC",
  GSI2SK: "CREATED#2025-12-09T10:00:00Z#uuid-1234"
}

// 過去の新聞（記事付き）
{
  PK: "NEWSPAPER#uuid-1234",
  SK: "DATE#2025-12-09",
  newspaperId: "uuid-1234",
  newspaperDate: "2025-12-09",
  name: "Tech Morning Digest",
  feedUrls: ["https://example.com/tech-feed"],
  languages: ["EN"],
  summary: "今日のテクノロジーニュースは AI の進歩...",
  articles: [
    {
      title: "AI Breakthrough",
      description: "...",
      link: "https://...",
      pubDate: "2025-12-09T08:00:00Z",
      imageUrl: "https://...",
      importance: 85
    }
  ],
  createdAt: "2025-12-09T10:00:00Z"
}
```


## API エンドポイント

### 新しいエンドポイント

#### GET /api/newspapers/:newspaperId/:date
**目的:** 特定の日付の新聞を取得または作成

**リクエスト:**
```
GET /api/newspapers/uuid-1234/2025-12-09
```

**レスポンス:**
```json
{
  "newspaperId": "uuid-1234",
  "newspaperDate": "2025-12-09",
  "name": "Tech Morning Digest",
  "languages": ["EN"],
  "summary": "今日のテクノロジーニュースは AI の進歩、スタートアップの資金調達、クラウドコンピューティングのトレンドをカバーしています。",
  "articles": [...],
  "createdAt": "2025-12-09T10:00:00Z"
}
```

**エラーレスポンス:**
```json
// Future date
{
  "error": "Future newspapers are not available",
  "code": "FUTURE_DATE"
}

// Too old
{
  "error": "Newspapers older than 7 days are not available",
  "code": "DATE_TOO_OLD"
}

// Invalid date format
{
  "error": "Invalid date format. Use YYYY-MM-DD",
  "code": "INVALID_DATE"
}
```

#### GET /api/newspapers/:newspaperId/dates
**目的:** 新聞の利用可能な日付リストを取得

**レスポンス:**
```json
{
  "dates": [
    "2025-12-09",
    "2025-12-08",
    "2025-12-07",
    "2025-12-06"
  ]
}
```

### 更新されたエンドポイント

#### POST /api/newspapers
**リクエスト（更新）:**
```json
{
  "name": "Tech Morning Digest",
  "userName": "John Doe",
  "feedUrls": ["https://example.com/tech-feed"],
  "articles": [...],
  "theme": "Tech",
  "locale": "ja",
  "isPublic": true
}
```

**レスポンス（更新）:**
```json
{
  "newspaperId": "uuid-1234",
  "languages": ["EN"],
  "summary": "今日のテクノロジーニュースは AI の進歩...",
  "createdAt": "2025-12-09T10:00:00Z"
}
```

**バックエンド処理:**
1. 記事から言語を検出
2. Bedrock を使用して要約を生成
3. 言語と要約を含めて新聞を保存

#### GET /api/newspapers?sort=popular&limit=10&language=JP
**リクエスト（更新）:**
```
GET /api/newspapers?sort=popular&limit=10&language=JP
```

**クエリパラメータ:**
- `sort`: `popular` または `recent`
- `limit`: 結果数（デフォルト: 10、最大: 50）
- `language`: `JP`、`EN`、または省略で全て（新規）

**レスポンス（更新）:**
```json
{
  "newspapers": [
    {
      "newspaperId": "uuid-1234",
      "name": "Tech Morning Digest",
      "userName": "John Doe",
      "languages": ["JP", "EN"],
      "summary": "今日のテクノロジーニュース...",
      "createdAt": "2025-12-09T10:00:00Z",
      "viewCount": 42
    }
  ]
}
```

## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において真であるべき特性または動作です。本質的には、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証の橋渡しをします。*

### プロパティ 1: 日本語の言語検出
*任意の* 日本語文字（ひらがな、カタカナ、または漢字）を含む記事に対して、言語検出は "JP" と識別すべきである
**検証: 要件 1.1, 1.2**

### プロパティ 2: 英語の言語検出
*任意の* 日本語文字を含まない記事に対して、言語検出は "EN" と識別すべきである
**検証: 要件 1.1, 1.3**

### プロパティ 3: 混合言語検出
*任意の* 日本語と英語の両方の記事を含む新聞に対して、languages 配列は ["JP", "EN"] の両方を含むべきである
**検証: 要件 1.4**

### プロパティ 4: 言語フィルターの正確性
*任意の* 言語フィルター選択（JP または EN）に対して、表示されるすべての新聞はその言語を languages 配列に含むべきである
**検証: 要件 2.4, 2.5, 2.6**

### プロパティ 5: デフォルト言語選択
*任意の* 日本語 UI ロケールのユーザーに対して、デフォルトの言語フィルターは "JP" であるべきで、英語 UI ロケールの場合は "EN" であるべきである
**検証: 要件 2.2, 2.3**

### プロパティ 6: 検索フィルターの完全性
*任意の* 検索クエリに対して、表示されるすべての新聞はタイトルまたはフィード URL にクエリ文字列を含むべきである
**検証: 要件 3.3, 3.4**

### プロパティ 7: 日付検証 - 未来の拒否
*任意の* 未来の日付に対して、システムは「未来の新聞は利用できません」エラーでリクエストを拒否すべきである
**検証: 要件 4.6**

### プロパティ 8: 日付検証 - 7日間ウィンドウ
*任意の* 今日から 7 日より古い日付に対して、システムは適切なエラーメッセージでリクエストを拒否すべきである
**検証: 要件 4.7**

### プロパティ 9: 過去の新聞のキャッシング
*任意の* 以前にアクセスされた日付に対して、2 回目のアクセスは再生成せずに同じ新聞を返すべきである
**検証: 要件 4.5**

### プロパティ 10: 日付ベースの記事フィルタリング
*任意の* 過去の新聞生成に対して、記事は対象日付（00:00 から現在時刻まで）から優先されるべきである
**検証: 要件 4.3, 4.4**

### プロパティ 11: 要約の長さ制約
*任意の* 生成された要約に対して、100 から 250 文字の間であるべきである
**検証: 要件 7.2**

### プロパティ 12: 要約のキャッシング
*任意の* 要約付きで保存された新聞に対して、再度取得すると再生成せずに同じ要約を返すべきである
**検証: 要件 7.5**

### プロパティ 13: メインエリアの画像存在
*任意の* 新聞レイアウトに対して、リード記事は常に画像を持つべきである（元画像または著作権フリープレースホルダー）
**検証: 要件 6.1, 6.3**

### プロパティ 14: クリーンアップの日付閾値
*任意の* 7 日より古い新聞に対して、クリーンアッププロセスはそれを削除すべきである
**検証: 要件 10.1**

### プロパティ 15: 言語の永続性
*任意の* 保存された新聞に対して、ID で取得すると同じ languages 配列を返すべきである
**検証: 要件 1.5, 8.1**

### プロパティ 16: 要約の永続性
*任意の* 要約付きで保存された新聞に対して、ID で取得すると同じ要約を返すべきである
**検証: 要件 7.4, 8.2**

### プロパティ 17: 日付ベース URL 構造
*任意の* 日付パラメータ付きの新聞に対して、URL は /newspapers/[id]/[YYYY-MM-DD] の形式に従うべきである
**検証: 要件 4.1**

### プロパティ 18: ローディングアニメーション表示
*任意の* 新聞生成プロセスに対して、完了までローディングアニメーションが表示されるべきである
**検証: 要件 5.1, 5.2, 5.3**


## テスト戦略

### ユニットテスト

**フロントエンド:**
- 言語フィルターコンポーネントの動作
- 検索フィルターロジック
- 日付検証ロジック
- 日付ナビゲーションコンポーネント
- ローディングアニメーション表示
- 著作権フリー画像のフォールバック

**バックエンド:**
- 言語検出アルゴリズム（日本語文字カウント）
- Bedrock を使用した要約生成
- 過去の新聞サービス
- 日付検証ロジック
- クリーンアップサービスロジック
- 日付範囲による記事フィルタリング

**カバレッジ目標:** 60% 以上

### プロパティベーステスト

**テストフレームワーク:** fast-check

**設定:**
- 各プロパティテストは最低 100 回の反復を実行
- 各テストは設計書の正確性プロパティを明示的に参照
- タグ形式: `**Feature: phase-2, Property {number}: {property_text}**`

**テストするプロパティ:**
1. 言語検出（プロパティ 1, 2, 3）
2. 言語フィルタリング（プロパティ 4, 5）
3. 検索フィルタリング（プロパティ 6）
4. 日付検証（プロパティ 7, 8）
5. 過去の新聞のキャッシング（プロパティ 9）
6. 日付ベースの記事フィルタリング（プロパティ 10）
7. 要約生成（プロパティ 11, 12）
8. 画像の存在（プロパティ 13）
9. クリーンアップロジック（プロパティ 14）
10. データの永続性（プロパティ 15, 16, 17）
11. ローディングアニメーション（プロパティ 18）

### E2E テスト (Playwright)

**新しいテストシナリオ:**
- 言語フィルター選択と新聞フィルタリング
- フリーワード検索機能
- 日付ナビゲーション（前日/翌日）
- 初回アクセス時の過去の新聞生成
- 2 回目アクセス時の過去の新聞取得
- 未来の日付の拒否
- 古い日付（> 7 日）の拒否
- 生成中のローディングアニメーション表示
- 新聞内の要約表示
- 著作権フリー画像のフォールバック

## パフォーマンス最適化

### 言語検出

**戦略:** 文字ベースの検出（外部 API なし）
- 実行時間: < 1ms/記事
- コスト: ゼロ
- 精度: JP/EN 検出には十分

### 要約生成

**戦略:** DynamoDB に要約をキャッシュ
- 初回生成: ~5-10 秒
- 以降の取得: < 100ms（キャッシュから）
- コスト: ~$0.0001/生成

### 過去の新聞の読み込み

**戦略:** 遅延読み込みとキャッシング
- 初回アクセス: 生成して保存（~5-8 秒）
- 2 回目アクセス: DynamoDB から取得（< 200ms）
- 再生成不要

### 検索とフィルタリング

**戦略:** クライアント側フィルタリング（バックエンドクエリなし）
- 実行時間: 100 件の新聞で < 100ms
- バックエンドコスト: ゼロ
- リアルタイム更新

### クリーンアップパフォーマンス

**戦略:** ページネーション付きバッチ削除
- バッチあたり 25 件の新聞を処理（DynamoDB 制限）
- 実行時間: 100 件の新聞あたり ~1-2 秒
- 低トラフィック時間帯（3 AM JST）にスケジュール

## デプロイ

### インフラストラクチャの更新

**新しいリソース:**
- クリーンアップスケジュール用 EventBridge ルール
- クリーンアップ Lambda 関数
- 拡張 DynamoDB スキーマ（マイグレーション不要）

**Terraform モジュール:**
```hcl
# infra/modules/eventbridge/
module "cleanup_schedule" {
  source = "./modules/eventbridge"
  
  lambda_function_arn = module.lambda.cleanup_function_arn
  schedule_expression = "cron(0 18 * * ? *)" # 3 AM JST
}

# infra/modules/lambda/
resource "aws_lambda_function" "cleanup" {
  function_name = "myrsspress-cleanup"
  handler       = "cleanup.handler"
  runtime       = "nodejs24.x"
  timeout       = 60
  memory_size   = 256
  
  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
    }
  }
}
```

### デプロイ戦略

**Phase-2 デプロイ:**
1. インフラストラクチャの更新をデプロイ（Terraform）
2. 新しいエンドポイントを含むバックエンドをデプロイ（GitHub Actions）
3. 新しいコンポーネントを含むフロントエンドをデプロイ（Amplify）
4. クリーンアップ Lambda の実行を確認
5. CloudWatch Logs を監視

**ロールバック計画:**
- バックエンド: 以前の Lambda イメージに戻す
- フロントエンド: Amplify デプロイを戻す
- インフラストラクチャ: 以前の状態で `terraform apply`

### 監視

**CloudWatch メトリクス:**
- 言語検出の実行時間
- 要約生成の成功率
- 過去の新聞のキャッシュヒット率
- クリーンアップの実行回数
- エンドポイントごとのエラー率

**CloudWatch アラーム:**
- 要約生成の失敗率 > 10%
- クリーンアップ Lambda の失敗
- 過去の新聞生成時間 > 10 秒
- DynamoDB のスロットリング

## エラーハンドリング

### フロントエンドエラー

**言語フィルターエラー:**
- フィルターに一致する新聞がない → 「新聞が見つかりません」メッセージを表示
- フィルタリング中のネットワークエラー → 再試行オプション付きエラーを表示

**検索エラー:**
- 検索結果なし → 「'{query}' の検索結果が見つかりません」メッセージを表示

**日付ナビゲーションエラー:**
- 未来の日付を選択 → "Future newspapers are not available" アラートを表示
- 7 日より古い日付 → "Newspapers older than 7 days are not available" アラートを表示
- 無効な日付形式 → "Invalid date format" アラートを表示

**画像読み込みエラー:**
- 著作権フリー画像の読み込み失敗 → ローカルプレースホルダー画像にフォールバック
- 元記事画像の失敗 → 著作権フリープレースホルダーを表示

### バックエンドエラー

**言語検出エラー:**
- 検出失敗 → 空の配列 `[]` をデフォルトにしてエラーをログ
- 新聞生成を続行

**要約生成エラー:**
- Bedrock API タイムアウト → 要約に `null` を返し、要約なしで新聞を表示
- API レート制限 → 指数バックオフで再試行（最大 3 回）
- 無効なレスポンス → エラーをログして `null` を返す

**過去の新聞エラー:**
- 日付検証失敗 → 特定のメッセージで 400 エラーを返す
- 日付の記事不足 → 400 エラー "Insufficient articles for this date" を返す
- DynamoDB クエリ失敗 → 指数バックオフで再試行（最大 3 回）

**クリーンアップエラー:**
- DynamoDB バッチ削除失敗 → エラーをログして次のバッチを続行
- Lambda タイムアウト → 部分完了をログして次のスケジュール実行で再試行

### エラーロギング

すべてのエラーは CloudWatch Logs に以下を含めてログ:
- タイムスタンプ
- エラータイプ
- スタックトレース
- リクエストコンテキスト（newspaperId、日付、言語など）
- ユーザーアクション（該当する場合）

### エラー回復

**自動再試行:**
- Bedrock API 呼び出し: 指数バックオフで 3 回試行
- DynamoDB 操作: 指数バックオフで 3 回試行
- RSS フィード取得: 失敗したフィードをスキップして続行

**グレースフルデグラデーション:**
- 要約生成失敗 → 要約なしで新聞を表示
- 言語検出失敗 → 言語タグなしで新聞を表示
- 画像読み込み失敗 → プレースホルダー画像を表示
