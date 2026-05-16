export type Locale = 'en' | 'ja';

export const translations = {
  en: {
    appName: 'MyRSSPress',
    appTagline: 'Your Personalized Morning Digest, Curated by AI',
    tellUsInterests: 'Tell Us Your Interests',
    interestsDescription:
      'What topics are you interested in? (e.g., "AI and startups", "crypto", "design")',
    interestsPlaceholder: 'Enter your interests...',
    themeInputLabel: 'Theme',
    themeInputPlaceholder: 'Enter a newspaper theme...',
    themeInputError: 'Please enter a theme',
    suggestFeedsButton: 'Suggest Feeds',
    findFeeds: 'Find Feeds',
    yourRssFeeds: 'Your RSS Feeds',
    pasteUrlPlaceholder: 'Or paste RSS feed URL manually...',
    addFeed: 'Add Feed',
    remove: 'Remove',
    selectFeedsTitle: 'Select Your Feeds',
    selectFeedsSubtitle: 'Choose the RSS feeds to include in your newspaper.',
    generateButton: 'Generate Newspaper',
    feedsSelected: 'feeds selected',
    generateNewspaper: 'Generate Morning Newspaper',
    viewDemoNewspaper: 'View Demo Newspaper',
    processing: 'Processing...',
    readMore: 'Read more',
    bookmarked: 'Bookmarked',
    bookmark: 'Bookmark',
    selectAtLeastOneFeed: 'Please select at least one feed',
  },
  ja: {
    appName: 'MyRSSPress',
    appTagline: 'AIがキュレートする、あなた専用の朝刊',
    tellUsInterests: 'あなたの興味を教えてください',
    interestsDescription:
      'どんなトピックに興味がありますか？（例：「AIとスタートアップ」「暗号通貨」「デザイン」）',
    interestsPlaceholder: '興味のあるトピックを入力...',
    themeInputLabel: 'テーマ',
    themeInputPlaceholder: '新聞のテーマを入力...',
    themeInputError: 'テーマを入力してください',
    suggestFeedsButton: 'フィードを提案',
    findFeeds: 'フィードを探す',
    yourRssFeeds: 'あなたのRSSフィード',
    pasteUrlPlaceholder: 'または、RSSフィードのURLを直接入力...',
    addFeed: 'フィードを追加',
    remove: '削除',
    selectFeedsTitle: 'フィードを選択',
    selectFeedsSubtitle: '新聞に含めるRSSフィードを選択してください。',
    generateButton: '新聞を生成',
    feedsSelected: '件選択中',
    generateNewspaper: '朝刊を生成',
    viewDemoNewspaper: 'デモ新聞を見る',
    processing: '処理中...',
    readMore: '続きを読む',
    bookmarked: 'ブックマーク済み',
    bookmark: 'ブックマーク',
    selectAtLeastOneFeed: '少なくとも1つのフィードを選択してください',
  },
};

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}

export function useTranslations(locale: Locale) {
  return translations[locale];
}
