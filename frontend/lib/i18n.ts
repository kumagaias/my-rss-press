// Internationalization (i18n) support for MyRSSPress
// Supports Japanese (ja) and English (en)

export type Locale = 'en' | 'ja';

// Translation keys and their values for each supported language
export const translations = {
  en: {
    // App metadata
    appName: 'MyRSSPress',
    appTagline: 'Your Personalized Morning Digest, Curated by AI',
    
    // Navigation
    home: 'Home',
    backToHome: 'Back to Home',
    
    // Theme input
    themeInputLabel: 'What are you interested in?',
    themeInputPlaceholder: 'e.g., Technology, Sports, Business',
    suggestFeeds: 'Suggest Feeds',
    
    // Feed selection
    feedSelectorTitle: 'Select RSS Feeds',
    suggestedFeeds: 'Suggested Feeds',
    addCustomFeed: 'Add Custom Feed',
    addFeedManually: 'Add Feed Manually',
    feedUrlPlaceholder: 'Enter feed URL',
    addFeed: 'Add',
    addButton: 'Add',
    removeFeed: 'Remove',
    removeButton: 'Remove',
    generateNewspaper: 'Generate Newspaper',
    generateButton: 'Generate Newspaper',
    selectedCount: (count: number) => `${count} feed${count !== 1 ? 's' : ''} selected`,
    getFeedSuggestions: 'Get Feed Suggestions',
    generatingNewspaper: 'Generating your newspaper...',
    pleaseWait: 'This may take up to 30 seconds',
    generationFailed: 'Failed to generate newspaper. Please try again.',
    
    // Feed editing in modal
    feedsUsed: 'Feeds Used',
    editFeeds: 'Edit Feeds',
    feedList: 'Feed List',
    defaultFeed: 'Default Feed',
    
    // Newspaper
    newspaperTitle: 'Your Newspaper',
    createdBy: 'Created by',
    createdAt: 'Created at',
    viewCount: 'Views',
    saveNewspaper: 'Save Newspaper',
    readMore: 'Read more',
    summary: 'Summary',
    
    // Book recommendations
    recommendedBooks: 'Recommended Books',
    viewOnGoogleBooks: 'View on Google Books',
    
    // Settings
    newspaperSettings: 'Newspaper Settings',
    newspaperName: 'Newspaper Name',
    userName: 'Your Name',
    userNamePlaceholder: 'Your name (optional)',
    makePublic: 'Make this newspaper public',
    save: 'Save',
    cancel: 'Cancel',
    defaultNewspaperName: (date: string) => `${date} Newspaper`,
    defaultNameNote: 'Default name will be used if left empty',
    anonymousNote: 'Will be displayed as "Anonymous" if left empty',
    publicNote: 'When public, other users can view your newspaper',
    
    // Popular newspapers
    popularNewspapers: 'Popular Newspapers',
    recentNewspapers: 'Recent Newspapers',
    sortBy: 'Sort by',
    popular: 'Popular',
    recent: 'Recent',
    
    // Loading and errors
    loading: 'Loading...',
    loadingSuggestions: 'AI is gathering information...',
    generating: 'Generating your newspaper...',
    error: 'Error',
    errorOccurred: 'An error occurred',
    tryAgain: 'Try Again',
    newspaperNotFound: 'Newspaper not found',
    loadingArticles: 'Loading articles...',
    noNewspapersFound: 'No newspapers found',
    newspaperLoadError: 'Failed to load newspaper',
    
    // Validation messages
    themeRequired: 'Please enter a theme',
    themeEmpty: 'Please enter a theme',
    feedRequired: 'Please select at least one feed',
    errorSelectFeed: 'Please select at least one feed',
    invalidUrl: 'Please enter a valid URL',
    errorInvalidUrl: 'Please enter a valid URL',
    duplicateFeed: 'This feed is already added',
    errorDuplicate: 'This feed is already added',
    
    // Status
    saved: 'Saved',
    saving: 'Saving...',
    saveFailed: 'Failed to save newspaper. Please try again.',
    
    // Date navigation
    previousDay: 'Previous',
    nextDay: 'Next',
    
    // Footer
    footerTagline: 'Powered by Kiro',
    
    // Subscription
    subscribe: 'Subscribe',
    subscribed: 'Subscribed',
    subscribedNewspapers: 'Subscribed Newspapers',
    subscriptionLimitReached: 'You can subscribe to a maximum of 50 newspapers',
    noSubscriptions: 'No subscribed newspapers yet',
    noSubscriptionsMessage: 'Start subscribing to newspapers to see them here',
    subscriptionCount: '{count} newspapers subscribed',
    browsePopular: 'Browse Popular Newspapers',
    subscribedOn: 'Subscribed on',
    dragToReorder: 'Drag to reorder',
    goToHome: 'Go to Home',
    missingNewspapersTitle: 'Missing Newspapers',
    missingNewspapersMessage: 'Some subscribed newspapers could not be found. They may have been deleted.',
    removeFromSubscriptions: 'Remove',
    
    // Menu
    menu: 'Menu',
    closeMenu: 'Close Menu',
    
    // Topic keywords
    topicKeywords: [
      'Technology', 'Sports', 'Business', 'Politics', 'Entertainment',
      'Science', 'Health', 'Travel', 'Food', 'Fashion',
      'Music', 'Movies', 'Books', 'Gaming', 'Art',
      'Photography', 'Design', 'Education', 'Finance', 'Real Estate',
      'Automotive', 'Environment', 'Space', 'AI', 'Cryptocurrency',
      'Startups', 'Marketing', 'Programming', 'Fitness', 'Yoga',
      'Cooking', 'Wine', 'Coffee', 'Tea', 'Pets',
      'Gardening', 'DIY', 'Home Decor', 'Parenting', 'Relationships',
      'Psychology', 'Philosophy', 'History', 'Geography', 'Culture',
      'Language', 'Religion', 'Spirituality', 'Meditation', 'Wellness',
    ],
  },
  ja: {
    // アプリメタデータ
    appName: 'MyRSSPress',
    appTagline: 'AIがキュレートする、あなた専用の朝刊',
    
    // ナビゲーション
    home: 'ホーム',
    backToHome: 'ホームに戻る',
    
    // テーマ入力
    themeInputLabel: '興味のあるトピックは？',
    themeInputPlaceholder: '例：テクノロジー、スポーツ、ビジネス',
    suggestFeeds: 'フィードを提案',
    
    // フィード選択
    feedSelectorTitle: 'RSSフィードを選択',
    suggestedFeeds: '提案されたフィード',
    addCustomFeed: 'カスタムフィードを追加',
    addFeedManually: '手動でフィードを追加',
    feedUrlPlaceholder: 'フィードURLを入力',
    addFeed: '追加',
    addButton: '追加',
    removeFeed: '削除',
    removeButton: '削除',
    generateNewspaper: '新聞を生成',
    generateButton: '新聞を生成',
    selectedCount: (count: number) => `${count}個のフィードを選択中`,
    getFeedSuggestions: 'フィード提案を取得',
    generatingNewspaper: '新聞を生成中...',
    pleaseWait: '最大30秒かかる場合があります',
    generationFailed: '新聞の生成に失敗しました。もう一度お試しください。',
    
    // モーダルでのフィード編集
    feedsUsed: '使用したフィード',
    editFeeds: 'フィードを編集',
    feedList: 'フィード一覧',
    defaultFeed: 'デフォルトフィード',
    
    // 新聞
    newspaperTitle: 'あなたの新聞',
    createdBy: '作成者',
    createdAt: '作成日',
    viewCount: '閲覧数',
    saveNewspaper: '新聞を保存',
    readMore: '続きを読む',
    summary: '要約',
    
    // 書籍推薦
    recommendedBooks: '関連書籍',
    viewOnGoogleBooks: 'Google Booksで見る',
    
    // 設定
    newspaperSettings: '新聞設定',
    newspaperName: '新聞名',
    userName: 'あなたの名前',
    userNamePlaceholder: 'あなたの名前（任意）',
    makePublic: 'この新聞を公開する',
    save: '保存',
    cancel: 'キャンセル',
    defaultNewspaperName: (date: string) => `${date}の新聞`,
    defaultNameNote: '空欄の場合、デフォルト名が使用されます',
    anonymousNote: '空欄の場合、「匿名」として表示されます',
    publicNote: '公開すると、他のユーザーがあなたの新聞を閲覧できます',
    
    // 人気の新聞
    popularNewspapers: '人気の新聞',
    recentNewspapers: '新着の新聞',
    sortBy: '並び替え',
    popular: '人気順',
    recent: '新着順',
    
    // ローディングとエラー
    loading: '読み込み中...',
    loadingSuggestions: 'AIが情報収集しています...',
    generating: '新聞を生成中...',
    error: 'エラー',
    errorOccurred: 'エラーが発生しました',
    tryAgain: '再試行',
    newspaperNotFound: '新聞が見つかりません',
    loadingArticles: '記事を読み込んでいます...',
    noNewspapersFound: '新聞が見つかりません',
    newspaperLoadError: '新聞の読み込みに失敗しました',
    
    // バリデーションメッセージ
    themeRequired: 'テーマを入力してください',
    themeEmpty: 'テーマを入力してください',
    feedRequired: '少なくとも1つのフィードを選択してください',
    errorSelectFeed: '少なくとも1つのフィードを選択してください',
    invalidUrl: '有効なURLを入力してください',
    errorInvalidUrl: '有効なURLを入力してください',
    duplicateFeed: 'このフィードは既に追加されています',
    errorDuplicate: 'このフィードは既に追加されています',
    
    // ステータス
    saved: '保存済み',
    saving: '保存中...',
    saveFailed: '新聞の保存に失敗しました。もう一度お試しください。',
    
    // 日付ナビゲーション
    previousDay: '前日',
    nextDay: '翌日',
    
    // フッター
    footerTagline: 'Powered by Kiro',
    
    // Subscription
    subscribe: '購読',
    subscribed: '購読中',
    subscribedNewspapers: '購読中の新聞',
    subscriptionLimitReached: '購読できる新聞は最大50件です',
    noSubscriptions: '購読中の新聞はありません',
    noSubscriptionsMessage: '新聞を購読すると、ここに表示されます',
    subscriptionCount: '{count}件の新聞を購読中',
    browsePopular: '人気の新聞を見る',
    subscribedOn: '購読日',
    dragToReorder: 'ドラッグして並び替え',
    goToHome: 'ホームへ',
    missingNewspapersTitle: '見つからない新聞',
    missingNewspapersMessage: '一部の購読中の新聞が見つかりませんでした。削除された可能性があります。',
    removeFromSubscriptions: '削除',
    
    // Menu
    menu: 'メニュー',
    closeMenu: 'メニューを閉じる',
    
    // トピックキーワード
    topicKeywords: [
      'テクノロジー', 'スポーツ', 'ビジネス', '政治', 'エンタメ',
      '科学', '健康', '旅行', '料理', 'ファッション',
      '音楽', '映画', '読書', 'ゲーム', 'アート',
      '写真', 'デザイン', '教育', '金融', '不動産',
      '自動車', '環境', '宇宙', 'AI', '暗号通貨',
      'スタートアップ', 'マーケティング', 'プログラミング', 'フィットネス', 'ヨガ',
      '料理', 'ワイン', 'コーヒー', 'お茶', 'ペット',
      'ガーデニング', 'DIY', 'インテリア', '子育て', '人間関係',
      '心理学', '哲学', '歴史', '地理', '文化',
      '言語', '宗教', 'スピリチュアル', '瞑想', 'ウェルネス',
    ],
  },
};

/**
 * Detect the user's preferred locale based on browser settings
 * @returns 'ja' if browser language starts with 'ja', otherwise 'en'
 */
export function detectLocale(): Locale {
  // Server-side rendering: default to English
  if (typeof window === 'undefined') {
    return 'en';
  }
  
  // Client-side: detect from browser
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}

/**
 * Get translations for a specific locale
 * @param locale - The locale to get translations for
 * @returns Translation object for the specified locale
 */
export function useTranslations(locale: Locale) {
  return translations[locale];
}

/**
 * Format a date according to the specified locale
 * @param date - The date to format
 * @param locale - The locale to use for formatting
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number, locale: Locale): string {
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    // Fallback for invalid input
    dateObj = new Date();
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US';
  
  return dateObj.toLocaleDateString(dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a number according to the specified locale
 * @param num - The number to format
 * @param locale - The locale to use for formatting
 * @returns Formatted number string
 */
export function formatNumber(num: number, locale: Locale): string {
  const numLocale = locale === 'ja' ? 'ja-JP' : 'en-US';
  return num.toLocaleString(numLocale);
}
