import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewspaperLayout } from './NewspaperLayout';
import { Article } from '@/types';

// Mock articles for testing
const mockArticles: Article[] = [
  {
    title: 'Breaking News: Major Discovery',
    description: 'Scientists have made a groundbreaking discovery that will change everything.',
    link: 'https://example.com/article1',
    pubDate: new Date('2025-12-01'),
    imageUrl: 'https://example.com/image1.jpg',
    importance: 95,
  },
  {
    title: 'Technology Update',
    description: 'Latest advancements in AI technology.',
    link: 'https://example.com/article2',
    pubDate: new Date('2025-12-01'),
    importance: 85,
  },
  {
    title: 'Sports Highlights',
    description: 'Recap of today\'s major sporting events.',
    link: 'https://example.com/article3',
    pubDate: new Date('2025-12-01'),
    importance: 75,
  },
  {
    title: 'Weather Forecast',
    description: 'Sunny skies expected for the weekend.',
    link: 'https://example.com/article4',
    pubDate: new Date('2025-12-01'),
    importance: 65,
  },
  {
    title: 'Business News',
    description: 'Stock market reaches new highs.',
    link: 'https://example.com/article5',
    pubDate: new Date('2025-12-01'),
    importance: 55,
  },
];

describe('NewspaperLayout', () => {
  it('should render newspaper header with name and date', () => {
    render(
      <NewspaperLayout
        articles={mockArticles}
        newspaperName="Test Newspaper"
        createdAt={new Date('2025-12-01')}
        locale="en"
      />
    );

    expect(screen.getByText('Test Newspaper')).toBeInTheDocument();
    expect(screen.getByText(/December/)).toBeInTheDocument();
  });

  it('should render newspaper header with user name when provided', () => {
    render(
      <NewspaperLayout
        articles={mockArticles}
        newspaperName="Test Newspaper"
        userName="John Doe"
        createdAt={new Date('2025-12-01')}
        locale="en"
      />
    );

    expect(screen.getByText(/Created by: John Doe/)).toBeInTheDocument();
  });

  it('should render lead article prominently', () => {
    render(
      <NewspaperLayout
        articles={mockArticles}
        newspaperName="Test Newspaper"
        createdAt={new Date('2025-12-01')}
        locale="en"
      />
    );

    // Lead article should be the one with highest importance
    expect(screen.getByText('Breaking News: Major Discovery')).toBeInTheDocument();
    expect(
      screen.getByText('Scientists have made a groundbreaking discovery that will change everything.')
    ).toBeInTheDocument();
  });

  it('should render all articles', () => {
    render(
      <NewspaperLayout
        articles={mockArticles}
        newspaperName="Test Newspaper"
        createdAt={new Date('2025-12-01')}
        locale="en"
      />
    );

    mockArticles.forEach((article) => {
      expect(screen.getByText(article.title)).toBeInTheDocument();
    });
  });

  it('should render images when available', () => {
    render(
      <NewspaperLayout
        articles={mockArticles}
        newspaperName="Test Newspaper"
        createdAt={new Date('2025-12-01')}
        locale="en"
      />
    );

    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
  });

  it('should render "Read more" links for all articles', () => {
    render(
      <NewspaperLayout
        articles={mockArticles}
        newspaperName="Test Newspaper"
        createdAt={new Date('2025-12-01')}
        locale="en"
      />
    );

    const readMoreLinks = screen.getAllByText(/Read more/);
    expect(readMoreLinks).toHaveLength(mockArticles.length);
  });

  it('should use Japanese locale when specified', () => {
    render(
      <NewspaperLayout
        articles={mockArticles}
        newspaperName="テスト新聞"
        userName="山田太郎"
        createdAt={new Date('2025-12-01')}
        locale="ja"
      />
    );

    expect(screen.getByText(/作成者: 山田太郎/)).toBeInTheDocument();
    const readMoreLinks = screen.getAllByText(/続きを読む/);
    expect(readMoreLinks).toHaveLength(mockArticles.length);
  });

  it('should handle single article', () => {
    const singleArticle = [mockArticles[0]];

    render(
      <NewspaperLayout
        articles={singleArticle}
        newspaperName="Test Newspaper"
        createdAt={new Date('2025-12-01')}
        locale="en"
      />
    );

    expect(screen.getByText('Breaking News: Major Discovery')).toBeInTheDocument();
  });

  it('should apply responsive grid classes', () => {
    const { container } = render(
      <NewspaperLayout
        articles={mockArticles}
        newspaperName="Test Newspaper"
        createdAt={new Date('2025-12-01')}
        locale="en"
      />
    );

    // Check for responsive grid classes
    const gridElements = container.querySelectorAll('[class*="md:grid-cols"]');
    expect(gridElements.length).toBeGreaterThan(0);
  });
});
