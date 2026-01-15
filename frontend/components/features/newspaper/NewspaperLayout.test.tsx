import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NewspaperLayout } from './NewspaperLayout';
import { Article } from '@/types';

describe('NewspaperLayout', () => {
  const mockArticles: Article[] = [
    {
      title: 'Test Article 1',
      description: 'Test description 1',
      link: 'https://example.com/1',
      pubDate: new Date('2025-12-10'),
      imageUrl: 'https://example.com/image1.jpg',
      importance: 10,
    },
    {
      title: 'Test Article 2',
      description: 'Test description 2',
      link: 'https://example.com/2',
      pubDate: new Date('2025-12-10'),
      importance: 8,
    },
  ];

  const defaultProps = {
    articles: mockArticles,
    newspaperName: 'Test Newspaper',
    userName: 'Test User',
    createdAt: new Date('2025-12-10'),
    locale: 'en' as const,
  };

  // Summary Display tests - Temporarily disabled (summary hidden in UI)
  describe.skip('Summary Display', () => {
    it('should display summary when provided', () => {
      const summary = 'This is a test summary of the newspaper content.';
      render(<NewspaperLayout {...defaultProps} summary={summary} />);

      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText(summary)).toBeInTheDocument();
    });

    it('should not display summary section when summary is null', () => {
      render(<NewspaperLayout {...defaultProps} summary={null} />);

      expect(screen.queryByText('Summary')).not.toBeInTheDocument();
    });

    it('should not display summary section when summary is undefined', () => {
      render(<NewspaperLayout {...defaultProps} />);

      expect(screen.queryByText('Summary')).not.toBeInTheDocument();
    });

    it('should display summary in Japanese when locale is ja', () => {
      const summary = 'これはテスト要約です。';
      render(<NewspaperLayout {...defaultProps} locale="ja" summary={summary} />);

      expect(screen.getByText('要約')).toBeInTheDocument();
      expect(screen.getByText(summary)).toBeInTheDocument();
    });

    it('should display summary above the lead article', () => {
      const summary = 'Test summary';
      const { container } = render(<NewspaperLayout {...defaultProps} summary={summary} />);

      const summaryElement = screen.getByText(summary).closest('div');
      const leadArticle = screen.getByText('Test Article 1').closest('article');

      // Summary should appear before lead article in DOM
      expect(summaryElement).toBeTruthy();
      expect(leadArticle).toBeTruthy();
      
      if (summaryElement && leadArticle) {
        const summaryPosition = Array.from(container.querySelectorAll('*')).indexOf(summaryElement);
        const leadPosition = Array.from(container.querySelectorAll('*')).indexOf(leadArticle);
        expect(summaryPosition).toBeLessThan(leadPosition);
      }
    });

    it('should apply newspaper-style styling to summary', () => {
      const summary = 'Test summary';
      render(<NewspaperLayout {...defaultProps} summary={summary} />);

      const summaryContainer = screen.getByText(summary).closest('div');
      expect(summaryContainer).toHaveClass('bg-gray-50', 'border-2', 'border-gray-800');
    });
  });

  describe('Basic Layout', () => {
    it('should render newspaper header with name', () => {
      render(<NewspaperLayout {...defaultProps} />);

      expect(screen.getByText('Test Newspaper')).toBeInTheDocument();
    });

    it('should render articles', () => {
      render(<NewspaperLayout {...defaultProps} />);

      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
      expect(screen.getByText('Test Article 2')).toBeInTheDocument();
    });

    it('should display empty state when no articles', () => {
      render(<NewspaperLayout {...defaultProps} articles={[]} />);

      expect(screen.getByText(/no newspapers found/i)).toBeInTheDocument();
    });
  });
});
