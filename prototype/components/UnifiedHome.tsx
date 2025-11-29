'use client';

import { useState } from 'react';
import { Locale, useTranslations } from '@/lib/i18n';

interface UnifiedHomeProps {
  locale: Locale;
  onGenerate: (feedUrls: string[]) => void;
}

export default function UnifiedHome({ locale, onGenerate }: UnifiedHomeProps) {
  const t = useTranslations(locale);
  const [interests, setInterests] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [feeds, setFeeds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFindFeeds = () => {
    if (!interests.trim()) {
      return;
    }

    // ダミーデータ: AI提案フィード
    const suggestedFeeds = [
      'https://news.ycombinator.com/rss',
      'https://techcrunch.com/feed/',
    ];

    setFeeds((prev) => [...prev, ...suggestedFeeds.filter((f) => !prev.includes(f))]);
    setInterests('');
  };

  const handleAddManualFeed = () => {
    if (!manualUrl.trim()) {
      return;
    }

    if (feeds.includes(manualUrl)) {
      setError('This feed is already added');
      return;
    }

    setFeeds((prev) => [...prev, manualUrl]);
    setManualUrl('');
    setError(null);
  };

  const handleRemoveFeed = (url: string) => {
    setFeeds((prev) => prev.filter((f) => f !== url));
  };

  const handleGenerate = () => {
    if (feeds.length === 0) {
      setError(t.selectAtLeastOneFeed);
      return;
    }
    setError(null);
    onGenerate(feeds);
  };

  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US';

  // ダミーデータ: 他のユーザーの新聞（アクセス数順）
  const featuredNewspapers = [
    {
      id: 1,
      title: 'Tech Trends 2025',
      author: 'Sarah Chen',
      date: '2025-11-27',
      thumbnail: 'https://picsum.photos/400/300?random=10',
      topics: ['AI', 'Startups', 'Innovation'],
      views: 12500,
    },
    {
      id: 2,
      title: 'Crypto Weekly Digest',
      author: 'Mike Johnson',
      date: '2025-11-27',
      thumbnail: 'https://picsum.photos/400/300?random=11',
      topics: ['Crypto', 'Blockchain', 'Finance'],
      views: 8300,
    },
    {
      id: 3,
      title: 'Design Inspiration',
      author: 'Emma Wilson',
      date: '2025-11-26',
      thumbnail: 'https://picsum.photos/400/300?random=12',
      topics: ['Design', 'UX', 'Creative'],
      views: 6700,
    },
    {
      id: 4,
      title: 'Science Breakthroughs',
      author: 'Dr. James Lee',
      date: '2025-11-26',
      thumbnail: 'https://picsum.photos/400/300?random=13',
      topics: ['Science', 'Research', 'Innovation'],
      views: 5400,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b-4 border-gray-800 py-4">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-1 text-gray-900">
            📰 {t.appName}
          </h1>
          <p className="text-gray-600 italic text-sm">{t.appTagline}</p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* 興味入力セクション */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-amber-800 mb-2">
              ✨ {t.tellUsInterests}
            </h2>
            <p className="text-gray-600 text-sm mb-3">{t.interestsDescription}</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFindFeeds()}
                placeholder={t.interestsPlaceholder}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 text-sm"
              />
              <button
                onClick={handleFindFeeds}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {t.findFeeds}
              </button>
            </div>
          </div>

          {/* RSSフィードセクション */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              📡 {t.yourRssFeeds}
            </h2>

            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddManualFeed()}
                placeholder={t.pasteUrlPlaceholder}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 text-sm"
              />
              <button
                onClick={handleAddManualFeed}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {t.addFeed}
              </button>
            </div>

            {/* フィードリスト */}
            <div className="space-y-2 mb-4">
              {feeds.map((feed) => (
                <div
                  key={feed}
                  className="flex items-center justify-between bg-amber-50 px-3 py-2 rounded border border-amber-200"
                >
                  <span className="text-xs text-gray-700 truncate flex-1">{feed}</span>
                  <button
                    onClick={() => handleRemoveFeed(feed)}
                    className="ml-3 text-red-600 hover:text-red-800 font-medium text-xs"
                  >
                    {t.remove}
                  </button>
                </div>
              ))}
            </div>

            {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

            {/* 生成ボタン */}
            <button
              onClick={handleGenerate}
              disabled={feeds.length === 0}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              ✨ {t.generateNewspaper}
            </button>
          </div>
        </div>

        {/* デモボタン */}
        <div className="text-center mb-8">
          <button
            onClick={() =>
              onGenerate(['https://news.ycombinator.com/rss', 'https://techcrunch.com/feed/'])
            }
            className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            📰 {t.viewDemoNewspaper}
          </button>
        </div>

        {/* 人気の新聞セクション */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1 text-center">
            {locale === 'ja' ? '🔥 人気の新聞' : '🔥 Popular Newspapers'}
          </h2>
          <p className="text-center text-gray-600 text-sm mb-4">
            {locale === 'ja'
              ? '他のユーザーが作成した人気の新聞をチェック'
              : 'Check out popular newspapers created by other users'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredNewspapers.map((newspaper) => (
              <div
                key={newspaper.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={newspaper.thumbnail}
                    alt={newspaper.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    👁️ {newspaper.views.toLocaleString()}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-serif font-bold text-gray-900 mb-1">
                    {newspaper.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>
                      {locale === 'ja' ? '作成者' : 'By'}: {newspaper.author}
                    </span>
                    <span>{new Date(newspaper.date).toLocaleDateString(dateLocale)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {newspaper.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
