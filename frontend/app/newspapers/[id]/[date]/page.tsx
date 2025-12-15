'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewspaperLayout } from '@/components/features/newspaper/NewspaperLayout';
import DateNavigation from '@/components/features/newspaper/DateNavigation';
import { detectLocale, useTranslations, type Locale } from '@/lib/i18n';

interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  importance: number;
}

interface Newspaper {
  newspaperId: string;
  name: string;
  userName?: string;
  feedUrls: string[];
  theme?: string;
  articles: Article[];
  newspaperDate: string;
  summary?: string;
  languages?: string[];
}

interface PageProps {
  params: Promise<{
    id: string;
    date: string;
  }>;
}

export default function NewspaperDatePage({ params }: PageProps) {
  const router = useRouter();
  const [locale] = useState<Locale>(detectLocale());
  const t = useTranslations(locale);
  
  const [newspaper, setNewspaper] = useState<Newspaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string>('');
  const [date, setDate] = useState<string>('');

  // Unwrap params Promise
  useEffect(() => {
    params.then(({ id: paramId, date: paramDate }) => {
      setId(paramId);
      setDate(paramDate);
    });
  }, [params]);

  useEffect(() => {
    // Wait for id and date to be set
    if (!id || !date) return;

    const fetchNewspaper = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
          setError('Invalid date format. Please use YYYY-MM-DD format.');
          setLoading(false);
          return;
        }

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(
          `${apiBaseUrl}/api/newspapers/${id}/${date}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          
          if (response.status === 400) {
            // Date validation errors
            setError(errorData.error || 'Invalid date');
          } else if (response.status === 404) {
            setError('Newspaper not found');
          } else {
            setError('Failed to load newspaper');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setNewspaper(data.data);
      } catch (err) {
        console.error('Error fetching newspaper:', err);
        setError('Failed to load newspaper');
      } finally {
        setLoading(false);
      }
    };

    fetchNewspaper();
  }, [id, date]);

  const handleDateChange = (newDate: string) => {
    // Navigate to the new date
    router.push(`/newspapers/${id}/${newDate}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex gap-2 justify-center mb-4">
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '450ms' }}></div>
          </div>
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t.error}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

  if (!newspaper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">{t.newspaperNotFound}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Date Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <DateNavigation
            currentDate={date}
            onDateChange={handleDateChange}
            locale={locale}
          />
        </div>
      </div>

      {/* Newspaper Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <NewspaperLayout
          articles={newspaper.articles}
          newspaperName={newspaper.name}
          userName={newspaper.userName}
          createdAt={new Date(newspaper.newspaperDate)}
          locale={locale}
          summary={newspaper.summary}
        />
      </div>

      {/* Back to Home Button */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          {t.backToHome}
        </button>
      </div>
    </div>
  );
}
