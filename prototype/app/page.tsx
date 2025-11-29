'use client';

import { useState, useEffect } from 'react';
import UnifiedHome from '@/components/UnifiedHome';
import NewspaperRenderer from '@/components/NewspaperRenderer';
import { Article } from '@/types';
import { detectLocale, Locale } from '@/lib/i18n';

export default function Home() {
  const [step, setStep] = useState<'home' | 'newspaper'>('home');
  const [articles, setArticles] = useState<Article[]>([]);
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const handleGenerate = (selectedUrls: string[]) => {
    // ダミーデータ: 記事
    const dummyArticles: Article[] = [
      {
        title: 'AI Breakthrough: New Model Achieves Human-Level Performance',
        description: 'Researchers announce a groundbreaking AI model that matches human capabilities in complex reasoning tasks.',
        link: 'https://example.com/article1',
        pubDate: new Date('2025-11-26T10:00:00Z'),
        imageUrl: 'https://picsum.photos/400/300?random=1',
        importance: 95,
      },
      {
        title: 'Tech Giants Announce Climate Initiative',
        description: 'Major technology companies commit to carbon neutrality by 2030.',
        link: 'https://example.com/article2',
        pubDate: new Date('2025-11-26T08:00:00Z'),
        imageUrl: 'https://picsum.photos/400/300?random=2',
        importance: 80,
      },
      {
        title: 'Startup Raises $100M for Quantum Computing',
        description: 'A promising quantum computing startup secures major funding round.',
        link: 'https://example.com/article3',
        pubDate: new Date('2025-11-25T15:00:00Z'),
        importance: 70,
      },
      {
        title: 'New Programming Language Gains Popularity',
        description: 'Developers embrace a new language designed for safety and performance.',
        link: 'https://example.com/article4',
        pubDate: new Date('2025-11-25T12:00:00Z'),
        imageUrl: 'https://picsum.photos/400/300?random=3',
        importance: 65,
      },
      {
        title: 'Cybersecurity Alert: New Vulnerability Discovered',
        description: 'Security researchers identify critical flaw in popular software.',
        link: 'https://example.com/article5',
        pubDate: new Date('2025-11-25T09:00:00Z'),
        importance: 85,
      },
    ];
    setArticles(dummyArticles);
    setStep('newspaper');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {step === 'home' && <UnifiedHome locale={locale} onGenerate={handleGenerate} />}
      {step === 'newspaper' && (
        <NewspaperRenderer
          articles={articles}
          onBookmark={(url) => console.log('Bookmarked:', url)}
          onBackToHome={() => setStep('home')}
          locale={locale}
        />
      )}
    </main>
  );
}
