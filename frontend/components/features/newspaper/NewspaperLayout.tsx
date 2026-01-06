'use client';

import { Article } from '@/types';
import { calculateLayout } from '@/lib/layoutCalculator';
import { useTranslations, formatDate } from '@/lib/i18n';
import { getPlaceholderImage } from '@/lib/placeholderImages';

interface NewspaperLayoutProps {
  articles: Article[];
  newspaperName: string;
  userName?: string;
  createdAt: Date;
  locale: 'en' | 'ja';
  summary?: string | null;
}

/**
 * NewspaperLayout Component
 * 
 * Renders articles in a newspaper-style layout with paper texture styling.
 * Implements responsive design that adapts to different screen sizes.
 * 
 * Layout structure:
 * - Lead article: Full-width, large display
 * - Top stories: 3-4 column grid
 * - Remaining articles: 2 column grid
 */
export function NewspaperLayout({
  articles,
  newspaperName,
  userName,
  createdAt,
  locale,
  summary,
}: NewspaperLayoutProps) {
  const t = useTranslations(locale);
  const formattedDate = formatDate(createdAt, locale);

  // Handle empty article list
  if (!articles || articles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8 bg-[#f5f5dc] font-serif min-h-screen">
        <header className="text-center border-b-4 border-black pb-4 mb-8">
          <h1 className="text-6xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            {newspaperName || 'MyRSSPress'}
          </h1>
          <div className="text-sm mt-2 flex items-center justify-center gap-3">
            <div className="text-gray-700">{formattedDate}</div>
            {userName && (
              <>
                <span className="text-gray-400">|</span>
                <div className="text-gray-600">
                  {t.createdBy}: {userName}
                </div>
              </>
            )}
          </div>
        </header>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">{t.noNewspapersFound}</p>
        </div>
      </div>
    );
  }

  const layout = calculateLayout(articles);

  return (
    <div className="max-w-7xl mx-auto p-8 bg-[#f5f5dc] font-serif min-h-screen">
      {/* Newspaper Header */}
      <header className="text-center border-b-4 border-black pb-4 mb-8">
        <h1 className="text-6xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          {newspaperName || 'MyRSSPress'}
        </h1>
        <div className="text-sm mt-2 flex items-center justify-center gap-3">
          <div className="text-gray-700">{formattedDate}</div>
          {userName && (
            <>
              <span className="text-gray-400">|</span>
              <div className="text-gray-600">
                {t.createdBy}: {userName}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Summary Section */}
      {summary && (
        <div className="mb-8 pb-6 border-b-2 border-gray-400">
          <div className="bg-gray-50 border-2 border-gray-800 p-6 rounded shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-3">
              {t.summary}
            </h2>
            <p className="text-base leading-relaxed text-gray-900 whitespace-pre-line">
              {summary}
            </p>
          </div>
        </div>
      )}

      {/* Lead Article (Most Important) - Always has an image */}
      <a
        href={layout.lead.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <article className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-gray-800">
          <div className="w-full">
            <img
              src={layout.lead.imageUrl || getPlaceholderImage(layout.lead.title, layout.lead.description)}
              alt={layout.lead.title || 'Article image'}
              className="w-full h-auto object-cover rounded"
            />
          </div>
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              {layout.lead.title}
            </h2>
            {layout.lead.feedTitle && (
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                {layout.lead.feedTitle}
              </p>
            )}
            <p className="text-lg leading-relaxed mb-4 text-gray-800">
              {layout.lead.description}
            </p>
            <span className="text-blue-600 hover:underline inline-flex items-center">
              {t.readMore} →
            </span>
          </div>
        </article>
      </a>

      {/* Top Stories (3-4 columns based on article count) */}
      {layout.topStories.length > 0 && (
        <div
          className={`grid gap-8 mb-8 pb-8 border-b border-gray-600 ${
            layout.topStories.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'
          }`}
        >
          {layout.topStories.map((article, index) => (
            <a
              key={`top-${index}`}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-gray-100 transition-colors cursor-pointer p-2 -m-2 rounded"
            >
              <article className="space-y-2">
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title || 'Article image'}
                    className="w-full h-48 object-cover rounded"
                  />
                )}
                <h3 className="text-2xl font-bold leading-tight">
                  {article.title}
                </h3>
                {article.feedTitle && (
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {article.feedTitle}
                  </p>
                )}
                <p className="text-sm leading-relaxed text-gray-800">
                  {article.description}
                </p>
                <span className="text-blue-600 hover:underline text-sm inline-flex items-center">
                  {t.readMore} →
                </span>
              </article>
            </a>
          ))}
        </div>
      )}

      {/* Remaining Articles (2 columns) */}
      {layout.remaining.length > 0 && (
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
          {layout.remaining.map((article, index) => (
            <a
              key={`remaining-${index}`}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-gray-100 transition-colors cursor-pointer p-2 -m-2 rounded"
            >
              <article className="pb-6 border-b border-gray-300">
                <h4 className="text-xl font-bold leading-tight mb-2">
                  {article.title}
                </h4>
                {article.feedTitle && (
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    {article.feedTitle}
                  </p>
                )}
                <p className="text-sm leading-relaxed mb-2 text-gray-800">
                  {article.description}
                </p>
                <span className="text-blue-600 hover:underline text-sm inline-flex items-center">
                  {t.readMore} →
                </span>
              </article>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
