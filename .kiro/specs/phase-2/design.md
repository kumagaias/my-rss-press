# 設計書 Phase 2

## 概要

Phase 2では、MyRSSPressに日次新聞機能を追加し、ユーザーが毎日新しい新聞を生成・閲覧できるようにします。新聞シリーズ（同じフィード構成で複数の日付）、日付ベースのナビゲーション、AIによるサマリー生成、ロケール固有のタイムゾーン表示、検索機能と言語フィルタの強化などを導入します。

Phase 2の主要な追加機能:
1. 日付ベースのURLを持つ日次新聞の概念
2. 新聞シリーズ管理（同じフィード、異なる日付）
3. Bedrock Runtime APIを使用したAI生成3行サマリー
4. ロケールサポート（ja、en-US、en-GB）とタイムゾーン対応の日付表示
5. 新聞名検索機能
6. 強化された言語フィルタ（3つのロケール）
7. Unsplash API統合によるメイン記事画像の保証
8. 新聞再生成機能

プロジェクト構造はPhase 1と同じ:
- `backend/` - TypeScript/Hono APIサーバー（Lambda用）
- `frontend/` - Next.js + TailwindCSS（Amplify Hosting用）
- `infra/` - Terraform IaCコード

## アーキテクチャの更新

### システムアーキテクチャ（Phase 2追加分）

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Next.js + TailwindCSS)                │
│                    [Amplify Hosting]                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 検索         │  │ 日付         │  │ サマリー     │      │
│  │ コンポーネント│  │ ナビゲーション│  │ 表示         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│           Backend API (TypeScript/Hono on Lambda)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ サマリー     │  │ 日付範囲     │  │ Unsplash     │      │
│  │ 生成         │  │ フィルタ     │  │ サービス     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   AWS Bedrock    │  │   DynamoDB       │  │  Unsplash    │
│   Runtime API    │  │   (シリーズデータ)│  │  API         │
└──────────────────┘  └──────────────────┘  └──────────────┘
```

## データモデル（Phase 2更新）

### Locale型
```typescript
export type Locale = 'ja' | 'en-US' | 'en-GB';
```

### NewspaperData（拡張）
```typescript
interface NewspaperData {
  // Phase 1からの既存フィールド
  newspaperId: string;      // 形式: {seriesId}_{YYYY-MM-DD}
  name: string;
  userName: string;
  feedUrls: string[];
  articles?: Article[];
  createdAt: string;        // UTC (ISO 8601)
  updatedAt: string;        // UTC (ISO 8601)
  viewCount: number;
  isPublic: boolean;
  
  // Phase 2追加分
  seriesId: string;         // 新聞シリーズのUUID
  publishDate: string;      // YYYY-MM-DD形式
  locale: Locale;           // 'ja' | 'en-US' | 'en-GB'
  summary: string;          // AI生成3行サマリー
}
```


### Article（拡張）
```typescript
interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;          // ISO 8601
  imageUrl?: string;
  importance: number;
  feedSource: string;
  
  // Phase 2追加分（Unsplash用）
  imageAttribution?: {
    photographer: string;
    photographerUrl: string;
    photoUrl: string;
  };
}
```

## DynamoDBスキーマ（Phase 2）

### テーブル構造

**プライマリキー:**
- PK: `SERIES#{seriesId}` (String)
- SK: `DATE#{publishDate}` (String)

**属性:**
- `newspaperId`: String（形式: `{seriesId}_{YYYY-MM-DD}`）
- `seriesId`: String（UUID）
- `publishDate`: String（YYYY-MM-DD）
- `name`: String
- `userName`: String
- `feedUrls`: List of Strings
- `articles`: List（オプション）
- `summary`: String（3行サマリー）
- `createdAt`: String（UTC ISO 8601）
- `updatedAt`: String（UTC ISO 8601）
- `viewCount`: Number
- `isPublic`: Boolean
- `locale`: String（'ja' | 'en-US' | 'en-GB'）

### グローバルセカンダリインデックス

**GSI: PublicNewspapersByDate**
- PK: `PUBLIC#{locale}` (String)
- SK: `DATE#{publishDate}#{seriesId}` (String)
- 目的: ロケールと日付で公開新聞を取得（Recent ソート用）
- プロジェクション: ALL

**GSI: PublicNewspapersByViews**
- PK: `PUBLIC#{locale}` (String)
- SK: `VIEWS#{viewCount}#{seriesId}` (String)
- 目的: ロケールと人気度で公開新聞を取得
- プロジェクション: ALL

### クエリパターン

1. **特定日付の新聞を取得:**
   ```
   GetItem(PK=SERIES#{seriesId}, SK=DATE#{publishDate})
   ```

2. **シリーズの全新聞を取得:**
   ```
   Query(PK=SERIES#{seriesId}, SK begins_with DATE#)
   ```

3. **ロケール別公開新聞を取得（Recent）:**
   ```
   Query(GSI=PublicNewspapersByDate, PK=PUBLIC#{locale}, ScanIndexForward=false)
   ```

4. **ロケール別公開新聞を取得（Popular）:**
   ```
   Query(GSI=PublicNewspapersByViews, PK=PUBLIC#{locale}, ScanIndexForward=false)
   ```

5. **全ロケールの公開新聞を取得:**
   ```
   Query(GSI=PublicNewspapersByDate, PK=PUBLIC, ScanIndexForward=false)
   ```


## コンポーネントとインターフェース（Phase 2）

### フロントエンドコンポーネント

#### NewspaperSearchComponent
**目的:** Popular Newspapersセクションで新聞名を検索

**Props:**
```typescript
interface NewspaperSearchProps {
  onSearch: (query: string) => void;
  placeholder: string;
  locale: Locale;
}
```

**状態:**
- `searchQuery: string` - 現在の検索入力

**メソッド:**
- `handleSearch(query: string)` - 新聞名でフィルタリング（大文字小文字区別なし、部分一致）
- `clearSearch()` - 検索フィールドをクリアして全新聞を表示

**UI要素:**
- 左側に検索アイコン（🔍）
- 右側にクリアボタン（×）（入力値がある場合に表示）
- 幅: 100%（モバイル）、50%（デスクトップ）
- 高さ: 最小44px（タッチフレンドリー）

#### DateNavigationComponent
**目的:** 新聞シリーズ内の日付間をナビゲート

**Props:**
```typescript
interface DateNavigationProps {
  currentDate: string;      // YYYY-MM-DD
  seriesId: string;
  onDateChange: (date: string) => void;
  locale: Locale;
}
```

**状態:**
- `canGoPrevious: boolean` - 前の日ボタンが有効か（最大2日前まで）

**メソッド:**
- `goToPreviousDay()` - 前日の新聞に移動
- `calculateDaysDifference()` - 今日からの日数を計算
- `isWithinRange(date: string): boolean` - 日付が2日以内かチェック

**UI要素:**
- 「前の日」ボタン（2日以上前の場合は無効化）
- 無効化されたボタンのツールチップ: 「過去2日分のみ閲覧可能です」
- ロケール固有の形式で現在の日付を表示

#### SummaryDisplayComponent
**目的:** AI生成の3行サマリーを表示

**Props:**
```typescript
interface SummaryDisplayProps {
  summary: string;
  isLoading: boolean;
  locale: Locale;
}
```

**スタイリング:**
- フォントサイズ: 中（記事タイトルより小さく、本文より大きい）
- 行間: 適度な余白
- 配置: 左寄せまたは中央寄せ
- 背景: 薄いグレーまたは枠線で記事と区別
- 位置: 新聞タイトルと記事リストの間

#### RegenerateButtonComponent
**目的:** 最新の記事で新聞を再生成

**Props:**
```typescript
interface RegenerateButtonProps {
  newspaperId: string;
  onRegenerate: () => Promise<void>;
  locale: Locale;
}
```

**メソッド:**
- `handleRegenerate()` - 確認ダイアログを表示してから再生成
- `showConfirmDialog()` - 「最新の記事で再生成しますか？」メッセージを表示

**UI要素:**
- 再生成ボタン
- 確認モーダル
- 再生成中のローディングインジケーター


#### LanguageFilterComponent（拡張）
**目的:** ロケールで新聞をフィルタリング（3つのオプション）

**Props:**
```typescript
interface LanguageFilterProps {
  selectedLocale: 'all' | Locale;
  onLocaleChange: (locale: 'all' | Locale) => void;
  currentLocale: Locale;
}
```

**オプション:**
- All（すべて / All）
- 🇯🇵 日本語（ja）
- 🇺🇸 English (US)（en-US）
- 🇬🇧 English (UK)（en-GB）

**メソッド:**
- `filterNewspapers(locale: 'all' | Locale)` - 選択されたロケールでフィルタリング
- `getLocaleBadge(locale: Locale)` - 適切な国旗絵文字とテキストを返す

### バックエンドサービス（Phase 2）

#### SummaryGeneratorService
**目的:** Bedrock Runtime APIを使用して3行の新聞サマリーを生成

**インターフェース:**
```typescript
interface SummaryGeneratorService {
  generateSummary(articles: Article[], locale: Locale): Promise<string>;
}
```

**メソッド:**
- `generateSummary(articles, locale)` - 記事タイトルから3行サマリーを生成
- `buildSummaryPrompt(articles, locale)` - Bedrock用のプロンプトを構築
- `parseSummaryResponse(response)` - レスポンスから3行テキストを抽出
- `getDefaultSummary(articles, locale)` - エラー時のフォールバックサマリー

**Bedrock設定:**
- モデル: `anthropic.claude-3-5-haiku-20241022-v1:0`
- タイムアウト: 10秒
- Temperature: 0.7（一貫性のあるサマリー用）

**プロンプトテンプレート:**
```typescript
function buildSummaryPrompt(articles: Article[], locale: Locale): string {
  const language = locale === 'ja' ? '日本語' : 'English';
  const instruction = locale === 'ja' 
    ? '以下の記事タイトルから、この新聞全体の内容を3行で要約してください。各行は簡潔に、重要なトピックを含めてください。'
    : 'Summarize the overall content of this newspaper in exactly 3 lines based on the following article titles. Each line should be concise and include important topics.';
  
  const titles = articles.map((a, i) => `${i + 1}. ${a.title}`).join('\n');
  
  return `${instruction}

記事タイトル:
${titles}

要約（${language}で3行）:`;
}
```

**デフォルトサマリー（フォールバック）:**
```typescript
function getDefaultSummary(articles: Article[], locale: Locale): string {
  const count = articles.length;
  const topics = extractMainTopics(articles); // 2-3個の主要トピックを抽出
  
  if (locale === 'ja') {
    return `この新聞には${count}件の記事が含まれています。\n主なトピック: ${topics.join('、')}。\n最新のニュースをお届けします。`;
  } else {
    return `This newspaper contains ${count} articles.\nMain topics: ${topics.join(', ')}.\nBringing you the latest news.`;
  }
}
```


#### DateRangeFilterService
**目的:** 日付範囲で記事をフィルタリング（前日から当日まで）

**インターフェース:**
```typescript
interface DateRangeFilterService {
  filterArticlesByDateRange(articles: Article[], targetDate: string): Promise<Article[]>;
}
```

**メソッド:**
- `filterArticlesByDateRange(articles, targetDate)` - 対象日付の記事をフィルタリング
- `getDateRange(targetDate: string)` - 日付範囲を計算（前日00:00から対象日23:59:59）
- `extendDateRange(articles, minArticles)` - 記事が不足している場合7日間まで拡張

**アルゴリズム:**
```typescript
async function filterArticlesByDateRange(
  articles: Article[], 
  targetDate: string
): Promise<Article[]> {
  const minArticles = 3;
  
  // ステップ1: 前日から対象日までをフィルタリング
  const oneDayBefore = new Date(targetDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  oneDayBefore.setHours(0, 0, 0, 0);
  
  const targetDayEnd = new Date(targetDate);
  targetDayEnd.setHours(23, 59, 59, 999);
  
  let filtered = articles.filter(article => {
    const pubDate = new Date(article.pubDate);
    return pubDate >= oneDayBefore && pubDate <= targetDayEnd;
  });
  
  // ステップ2: 不足している場合、7日間まで拡張
  if (filtered.length < minArticles) {
    const sevenDaysBefore = new Date(targetDate);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
    sevenDaysBefore.setHours(0, 0, 0, 0);
    
    filtered = articles.filter(article => {
      const pubDate = new Date(article.pubDate);
      return pubDate >= sevenDaysBefore && pubDate <= targetDayEnd;
    });
  }
  
  // ステップ3: 公開日で並び替え（新しい順）
  return filtered.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}
```

#### UnsplashService
**目的:** 画像のないメイン記事用に著作権フリーの画像を取得

**インターフェース:**
```typescript
interface UnsplashService {
  searchPhoto(query: string): Promise<UnsplashPhoto | null>;
}

interface UnsplashPhoto {
  url: string;
  photographer: string;
  photographerUrl: string;
  photoUrl: string;
}
```

**メソッド:**
- `searchPhoto(query)` - 記事タイトルまたはテーマでUnsplash APIを検索
- `buildSearchQuery(article)` - 記事タイトルからキーワードを抽出
- `formatAttribution(photo)` - 帰属表示テキストをフォーマット

**API設定:**
- エンドポイント: `https://api.unsplash.com/search/photos`
- レート制限: 50リクエスト/時間
- 認証: 環境変数のアクセスキー

**実装:**
```typescript
async function searchPhoto(query: string): Promise<UnsplashPhoto | null> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
        signal: AbortSignal.timeout(5000), // 5秒タイムアウト
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.results.length === 0) return null;
    
    const photo = data.results[0];
    return {
      url: photo.urls.regular,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      photoUrl: photo.links.html,
    };
  } catch (error) {
    console.error('Unsplash API error:', error);
    return null;
  }
}
```

**フォールバック戦略:**
1. 記事タイトルでUnsplash APIを試行
2. 失敗した場合、新聞テーマで試行
3. それでも失敗した場合、デフォルトのプレースホルダー画像を使用


## 国際化（i18n）- Phase 2

### ロケールサポート

**サポートされるロケール:**
- `ja` - 日本語（Asia/Tokyo、UTC+9）
- `en-US` - 英語（米国）（America/New_York、UTC-5/-4）
- `en-GB` - 英語（英国）（Europe/London、UTC+0/+1）

### タイムゾーン設定

```typescript
// lib/i18n.ts
export type Locale = 'ja' | 'en-US' | 'en-GB';

export const timezones: Record<Locale, string> = {
  'ja': 'Asia/Tokyo',
  'en-US': 'America/New_York',
  'en-GB': 'Europe/London',
};

export function formatNewspaperDate(isoDate: string, locale: Locale): string {
  const date = new Date(isoDate);
  const timezone = timezones[locale];
  
  return date.toLocaleDateString(locale, {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

### 日付表示例

**日本語（ja）:**
```
2025年12月8日 月曜日
```

**英語（米国）:**
```
Monday, December 8, 2025
```

**英語（英国）:**
```
Monday, 8 December 2025
```

### 翻訳キー（Phase 2追加分）

```typescript
// lib/i18n.ts
export const translations = {
  ja: {
    // Phase 1からの既存翻訳...
    
    // Phase 2追加分
    searchPlaceholder: '新聞名で検索...',
    clearSearch: 'クリア',
    previousDay: '前の日',
    regenerate: '再生成',
    regenerateConfirm: '現在の新聞を最新の記事で再生成しますか？',
    regenerating: '再生成中...',
    noPreviousNewspaper: '前の日の新聞はありません',
    onlyPast2Days: '過去2日分のみ閲覧可能です',
    noSearchResults: '検索結果が見つかりませんでした',
    allLanguages: 'すべて',
    japaneseOnly: '日本語のみ',
    englishUSOnly: 'English (US) only',
    englishUKOnly: 'English (UK) only',
    summary: '要約',
    photoBy: '写真提供:',
    onUnsplash: 'on Unsplash',
  },
  'en-US': {
    // Phase 1からの既存翻訳...
    
    // Phase 2追加分
    searchPlaceholder: 'Search by newspaper name...',
    clearSearch: 'Clear',
    previousDay: 'Previous Day',
    regenerate: 'Regenerate',
    regenerateConfirm: 'Regenerate this newspaper with the latest articles?',
    regenerating: 'Regenerating...',
    noPreviousNewspaper: 'No newspaper for previous day',
    onlyPast2Days: 'Only past 2 days viewable',
    noSearchResults: 'No search results found',
    allLanguages: 'All',
    japaneseOnly: '日本語のみ',
    englishUSOnly: 'English (US) only',
    englishUKOnly: 'English (UK) only',
    summary: 'Summary',
    photoBy: 'Photo by',
    onUnsplash: 'on Unsplash',
  },
  'en-GB': {
    // en-USと同じ（Phase 2では）
    // （必要に応じてイギリス英語用にカスタマイズ可能）
  },
};
```

## 正確性プロパティ（Phase 2）

*プロパティは、システムのすべての有効な実行において真であるべき特性を定義します。*

### プロパティ1: 日付範囲フィルタリングの正確性
*任意の*対象日付に対して、フィルタリングされた記事は（対象日付 - 1日）00:00:00から（対象日付）23:59:59の間に公開されたもののみを含むべき
**検証: 要件1.1、1.2**

### プロパティ2: 日付範囲の拡張
*任意の*主要日付範囲で3記事未満の記事セットに対して、システムは7日前まで拡張すべき
**検証: 要件1.3、1.4**

### プロパティ3: 新聞ID形式
*任意の*生成された新聞に対して、newspaperIdは`{seriesId}_{YYYY-MM-DD}`形式に従うべき
**検証: 要件2.1、2.2**

### プロパティ4: 日付抽出の妥当性
*任意の*新聞IDに対して、日付部分を抽出すると有効なYYYY-MM-DD形式の日付が得られるべき
**検証: 要件2.4、2.5**

### プロパティ5: 再生成時の保持
*任意の*再生成された新聞に対して、すべてのメタデータ（newspaperId、name、userName、feedUrls、createdAt、viewCount、isPublic、locale）は変更されないべき
**検証: 要件3.8**

### プロパティ6: 再生成時の更新
*任意の*再生成された新聞に対して、articlesとupdatedAtフィールドは新しい値で更新されるべき
**検証: 要件3.7**

### プロパティ7: シリーズデータの一貫性
*任意の*シリーズ内の新聞に対して、seriesIdはすべての日付で一貫しているべき
**検証: 要件4.1、4.6、4.7**

### プロパティ8: 日付ナビゲーション範囲
*任意の*新聞日付に対して、「前の日」ボタンは日付が今日から2日以内の場合のみ有効化されるべき
**検証: 要件5.2、5.7、5.10、5.11**

### プロパティ9: メイン記事画像の保証
*任意の*新聞レイアウトに対して、記事に画像がない場合、メイン記事はUnsplash APIまたはプレースホルダーから画像を持つべき
**検証: 要件6.3、6.9、6.10**

### プロパティ10: Unsplash帰属表示の完全性
*任意の*Unsplash由来の画像に対して、帰属表示は写真家名とUnsplashリンクを含むべき
**検証: 要件6.6、6.7、6.8**

### プロパティ11: ソート順の正確性
*任意の*公開新聞リストに対して、「Recent」ソートはpublishDate降順、「Popular」ソートはviewCount降順で並べるべき
**検証: 要件7.5、7.6**

### プロパティ12: 言語フィルタの正確性
*任意の*選択されたロケールフィルタに対して、返される新聞はそのロケールに一致するもののみを含むべき（「All」選択時はすべて）
**検証: 要件8.4、8.5、8.6、8.7**

### プロパティ13: サマリー行数
*任意の*生成されたサマリーに対して、正確に3行のテキストを含むべき
**検証: 要件9.5**

### プロパティ14: サマリー言語の一貫性
*任意の*ロケールLを持つ新聞に対して、サマリーはLに対応する言語で生成されるべき
**検証: 要件9.6**

### プロパティ15: サマリーフォールバック
*任意の*Bedrock API失敗またはタイムアウトに対して、システムはデフォルトサマリーを生成すべき
**検証: 要件9.10、9.13**

### プロパティ16: タイムゾーン表示の正確性
*任意の*ロケールLを持つ新聞に対して、表示される日付はLのタイムゾーンとフォーマット規則に従ってフォーマットされるべき
**検証: 要件10.2、10.3、10.4**

### プロパティ17: 検索の大文字小文字非依存性
*任意の*検索クエリQに対して、Qを含む名前を持つ新聞（大文字小文字区別なし）が返されるべき
**検証: 要件10.6、10.7**

### プロパティ18: 検索の部分一致
*任意の*検索クエリQに対して、Qに部分的に一致する名前を持つ新聞が返されるべき
**検証: 要件10.7**

### プロパティ19: 検索フィルタの組み合わせ
*任意の*言語フィルタとソート順を持つ検索クエリに対して、3つのフィルタすべてが同時に適用されるべき
**検証: 要件10.10**

### プロパティ20: 空検索の動作
*任意の*空の検索クエリに対して、すべての新聞（言語フィルタの対象）が表示されるべき
**検証: 要件10.8**


## テスト戦略（Phase 2）

### ユニットテスト

**フロントエンド:**
- 日付ナビゲーションコンポーネントのロジック
- 検索フィルタリングアルゴリズム（大文字小文字区別なし、部分一致）
- ロケール固有の日付フォーマット
- サマリー表示コンポーネント
- 言語フィルタコンポーネント（3つのロケール）

**バックエンド:**
- サマリー生成サービス（Bedrockモック使用）
- 日付範囲フィルタリングロジック
- Unsplash API統合（モック使用）
- 新聞シリーズクエリ
- 再生成ロジック
- 検索機能

**カバレッジ目標:** 60%以上

### プロパティベーステスト

**テストフレームワーク:** fast-check

**設定:**
- プロパティテストごとに最低100回の反復
- テスト説明に明示的なプロパティ参照
- タグ形式: `**Feature: myrsspress-phase2, Property {番号}: {プロパティテキスト}**`

**テストするプロパティ:**
1. 日付範囲フィルタリング（プロパティ1、2）
2. 新聞ID形式（プロパティ3、4）
3. 再生成動作（プロパティ5、6）
4. シリーズデータの一貫性（プロパティ7）
5. 日付ナビゲーション範囲（プロパティ8）
6. メイン記事画像の保証（プロパティ9、10）
7. ソート順の正確性（プロパティ11）
8. 言語フィルタの正確性（プロパティ12）
9. サマリー生成（プロパティ13、14、15）
10. タイムゾーン表示（プロパティ16）
11. 検索機能（プロパティ17、18、19、20）

**ジェネレータ戦略:**
```typescript
import * as fc from 'fast-check';

// 日付ジェネレータ（YYYY-MM-DD）
const dateArb = fc.date().map(d => d.toISOString().split('T')[0]);

// ロケールジェネレータ
const localeArb = fc.constantFrom('ja', 'en-US', 'en-GB');

// シリーズIDジェネレータ
const seriesIdArb = fc.uuid();

// 新聞IDジェネレータ
const newspaperIdArb = fc.tuple(fc.uuid(), dateArb).map(
  ([id, date]) => `${id}_${date}`
);

// 検索クエリジェネレータ
const searchQueryArb = fc.string({ minLength: 0, maxLength: 50 });

// サマリージェネレータ（3行）
const summaryArb = fc.tuple(
  fc.string({ minLength: 10, maxLength: 100 }),
  fc.string({ minLength: 10, maxLength: 100 }),
  fc.string({ minLength: 10, maxLength: 100 })
).map(([l1, l2, l3]) => `${l1}\n${l2}\n${l3}`);
```

### E2Eテスト（Playwright）

**テストシナリオ:**
- 新聞検索フロー: クエリ入力 → 結果フィルタリング → 新聞クリック
- 日付ナビゲーション: 新聞表示 → 「前の日」クリック → 日付変更確認
- 新聞再生成: 「再生成」クリック → 確認 → 更新されたコンテンツ確認
- 言語フィルタ: ロケール選択 → フィルタリングされた新聞確認
- サマリー表示: 新聞生成 → 3行サマリー表示確認
- タイムゾーン表示: ロケール切り替え → 日付形式変更確認
- モバイルレスポンシブ: モバイルで検索フィールド、日付ナビゲーションをテスト

### パフォーマンステスト

**Phase 2追加分:**
- サマリー生成時間: 10秒未満
- Unsplash APIレスポンス時間: 5秒未満
- 検索フィルタリングパフォーマンス: 100件の新聞で100ms未満
- 日付ナビゲーション: 前日読み込みに500ms未満
- 再生成時間: 15秒未満（RSS取得 + Bedrock含む）

## まとめ

Phase 2は、MyRSSPressに強力な日次新聞機能を追加し、ユーザーが複数の日付とロケールにわたって新聞を生成、ナビゲート、発見できるようにします。アーキテクチャはPhase 1のサーバーレスでコスト効率の高いアプローチを維持しながら、AI生成サマリー、タイムゾーン対応の日付表示、強化された検索機能などの高度な機能を追加します。

主な成果:
- 日付ベースのナビゲーションを持つ日次新聞シリーズ
- タイムゾーン対応のマルチロケールサポート（ja、en-US、en-GB）
- コンテンツの素早い概要のためのAI生成3行サマリー
- Unsplash統合によるメイン記事画像の保証
- 検索と言語フィルタリングを備えた強化されたPopular Newspapers
- 新鮮なコンテンツのための新聞再生成

システムは、すべてのデバイスとロケールで優れたユーザーエクスペリエンスを提供しながら、スケーラビリティ、保守性を考慮して設計されています。

