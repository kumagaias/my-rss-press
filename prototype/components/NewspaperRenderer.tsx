'use client';

import { Article } from '@/types';
import { useState } from 'react';
import { Locale, useTranslations } from '@/lib/i18n';
import { ExternalLink } from 'lucide-react';

interface NewspaperRendererProps {
  articles: Article[];
  onBookmark: (articleUrl: string) => void;
  onBackToHome: () => void;
  locale: Locale;
}

export default function NewspaperRenderer({
  articles,
  onBookmark,
  onBackToHome,
  locale,
}: NewspaperRendererProps) {
  const [bookmarkedUrls, setBookmarkedUrls] = useState<Set<string>>(new Set());
  const [newspaperName, setNewspaperName] = useState('');
  const [userName, setUserName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const t = useTranslations(locale);

  const generateDefaultName = () => {
    return locale === 'ja' ? 'マイ新聞' : 'My Newspaper';
  };

  const handleBookmark = (url: string) => {
    const newBookmarks = new Set(bookmarkedUrls);
    if (newBookmarks.has(url)) {
      newBookmarks.delete(url);
    } else {
      newBookmarks.add(url);
    }
    setBookmarkedUrls(newBookmarks);
    onBookmark(url);
  };

  const sortedArticles = [...articles].sort((a, b) => b.importance - a.importance);
  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US';

  const leadStory = sortedArticles[0];
  const topStories = sortedArticles.slice(1, 4);
  const regularArticles = sortedArticles.slice(4);

  const handleSaveSettings = () => {
    if (!newspaperName.trim()) {
      setNewspaperName(generateDefaultName());
    }
    setShowSettings(false);
    setIsSaved(true);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 設定モーダル */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative">
              <button
                onClick={handleCloseSettings}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {locale === 'ja' ? '新聞の設定' : 'Newspaper Settings'}
              </h2>

              {/* ユーザー名入力 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {locale === 'ja' ? '👤 ユーザー名' : '👤 Your Name'}
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={locale === 'ja' ? '例: 山田太郎' : 'e.g., John Doe'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* 新聞名入力 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {locale === 'ja' ? '📰 新聞名' : '📰 Newspaper Name'}
                </label>
                <input
                  type="text"
                  value={newspaperName}
                  onChange={(e) => setNewspaperName(e.target.value)}
                  placeholder={locale === 'ja' ? '例: Tech 新聞' : 'e.g., The Tech Times'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* 公開設定 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {locale === 'ja' ? '🌐 公開設定' : '🌐 Privacy Settings'}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="privacy"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="w-4 h-4 text-orange-600"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {locale === 'ja' ? '🌍 公開' : '🌍 Public'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {locale === 'ja'
                          ? '他のユーザーがあなたの新聞を閲覧できます'
                          : 'Other users can view your newspaper'}
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="w-4 h-4 text-orange-600"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {locale === 'ja' ? '🔒 非公開' : '🔒 Private'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {locale === 'ja'
                          ? 'あなただけが新聞を閲覧できます'
                          : 'Only you can view your newspaper'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors"
              >
                {locale === 'ja' ? '保存して新聞を表示' : 'Save & View Newspaper'}
              </button>
            </div>
          </div>
        )}

        {/* サービス名ヘッダー */}
        <div className="bg-white border-b-4 border-gray-800 py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl">📰</span>
              <h1 className="text-5xl font-serif font-bold text-gray-900">
                {t.appName}
              </h1>
            </div>
          </div>
        </div>

        {/* 新聞コンテンツ */}
        <div className="bg-white shadow-2xl mb-6">
          {/* 新聞名・日付ヘッダー */}
          <div className="text-center py-6 border-b-4 border-double border-gray-800">
            {/* 新聞名 */}
            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-2">
              {newspaperName || generateDefaultName()}
            </h2>

            {/* 日付 */}
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="h-px bg-gray-400 w-20"></div>
              <p className="text-xs text-gray-700 font-bold uppercase tracking-wide">
                {new Date().toLocaleDateString(dateLocale, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <div className="h-px bg-gray-400 w-20"></div>
            </div>

            {/* ユーザー名 */}
            {userName && (
              <p className="text-sm text-gray-600 italic">
                {locale === 'ja' ? '編集:' : 'Edited by:'} {userName}
              </p>
            )}
          </div>

          {/* 記事コンテンツ */}
          <div className="p-8">
          {leadStory && (
            <div className="border-b-2 border-gray-900 pb-6 mb-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2
                  className="text-4xl font-serif font-black text-gray-900 leading-tight flex-1"
                  style={{ lineHeight: '1.1' }}
                >
                  {leadStory.title}
                </h2>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-3 py-1 bg-gray-900 text-white text-xs font-bold">
                    {leadStory.importance}/10
                  </span>
                </div>
              </div>
              {leadStory.imageUrl && (
                <img
                  src={leadStory.imageUrl}
                  alt={leadStory.title}
                  className="w-full h-96 object-cover mb-4"
                />
              )}
              <p className="text-lg text-gray-700 leading-relaxed mb-3 font-serif">
                {leadStory.description}
              </p>
              <div className="flex items-center justify-between border-t border-gray-300 pt-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBookmark(leadStory.link)}
                    className="text-xl hover:text-orange-600 transition-colors"
                    title={bookmarkedUrls.has(leadStory.link) ? t.bookmarked : t.bookmark}
                  >
                    {bookmarkedUrls.has(leadStory.link) ? '★' : '☆'}
                  </button>
                </div>
                <a
                  href={leadStory.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 hover:text-gray-600 flex items-center gap-1 text-sm font-bold uppercase"
                >
                  {t.readMore} <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {topStories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-400 pb-6 mb-6">
              {topStories.map((article, idx) => (
                <div key={article.link} className="border-r border-gray-300 pr-4 last:border-r-0 last:pr-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-serif font-bold text-gray-900 leading-tight">
                      {article.title}
                    </h3>
                  </div>
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-40 object-cover mb-3"
                    />
                  )}
                  <p className="text-sm text-gray-700 mb-3 font-serif leading-relaxed">
                    {article.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-2">
                      <span className="font-bold text-gray-900">{article.importance}/10</span>
                      <button
                        onClick={() => handleBookmark(article.link)}
                        className="hover:text-orange-600 transition-colors"
                        title={bookmarkedUrls.has(article.link) ? t.bookmarked : t.bookmark}
                      >
                        {bookmarkedUrls.has(article.link) ? '★' : '☆'}
                      </button>
                    </div>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:underline uppercase font-bold"
                    >
                      {t.readMore} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {regularArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regularArticles.map((article, idx) => (
                <div
                  key={article.link}
                  className={`${idx % 2 === 0 ? 'border-r border-gray-300 pr-6' : 'pl-0'}`}
                >
                  <h4 className="text-lg font-serif font-bold text-gray-900 mb-2 leading-tight">
                    {article.title}
                  </h4>
                  <p className="text-sm text-gray-700 mb-2 font-serif">{article.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-2 items-center">
                      <span className="font-bold text-gray-900">{article.importance}/10</span>
                      <button
                        onClick={() => handleBookmark(article.link)}
                        className="hover:text-orange-600 transition-colors"
                        title={bookmarkedUrls.has(article.link) ? t.bookmarked : t.bookmark}
                      >
                        {bookmarkedUrls.has(article.link) ? '★' : '☆'}
                      </button>
                    </div>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:underline uppercase font-bold"
                    >
                      {t.readMore} →
                    </a>
                  </div>
                  {idx < regularArticles.length - 1 && idx % 2 === 1 && (
                    <div className="border-b border-gray-200 my-4"></div>
                  )}
                </div>
              ))}
            </div>
          )}

            <div className="border-t-2 border-gray-900 mt-8 pt-4 text-center">
              <p className="text-xs text-gray-600 uppercase tracking-wide">
                © {new Date().getFullYear()} {t.appName} • All rights reserved
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onBackToHome}
            className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition"
          >
            {locale === 'ja' ? '← TOPに戻る' : '← Back to Home'}
          </button>
          {!isSaved && (
            <button
              onClick={handleOpenSettings}
              className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition"
            >
              {locale === 'ja' ? '💾 保存' : '💾 Save'}
            </button>
          )}
          {isSaved && (
            <div className="px-8 py-3 bg-green-100 text-green-800 font-bold rounded-lg flex items-center gap-2">
              ✓ {locale === 'ja' ? '保存済み' : 'Saved'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
