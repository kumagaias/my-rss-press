import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';
import NewspaperDatePage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock components
vi.mock('@/components/features/newspaper/NewspaperLayout', () => ({
  NewspaperLayout: ({ articles, newspaperName, userName, createdAt, locale, summary }: any) => (
    <div data-testid="newspaper-layout">
      <div>{newspaperName}</div>
      <div>{createdAt.toISOString().split('T')[0]}</div>
      <div>{articles.length} articles</div>
    </div>
  ),
}));

vi.mock('@/components/features/newspaper/DateNavigation', () => ({
  default: ({ currentDate, onDateChange }: any) => (
    <div data-testid="date-navigation">
      <button onClick={() => onDateChange('2025-12-09')}>Previous</button>
      <div>{currentDate}</div>
      <button onClick={() => onDateChange('2025-12-11')}>Next</button>
    </div>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

describe('NewspaperDatePage', () => {
  const mockPush = vi.fn();
  const mockRouter = {
    push: mockPush,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  const mockNewspaper = {
    newspaperId: 'test-id',
    name: 'Test Newspaper',
    userName: 'Test User',
    feedUrls: ['https://example.com/feed'],
    theme: 'Technology',
    articles: [
      {
        title: 'Test Article',
        description: 'Test description',
        link: 'https://example.com/article',
        pubDate: '2025-12-10T00:00:00Z',
        importance: 10,
      },
    ],
    newspaperDate: '2025-12-10',
    summary: 'Test summary',
    languages: ['EN'],
  };

  it('should display loading state initially', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <NewspaperDatePage
        params={{ id: 'test-id', date: '2025-12-10' }}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should fetch and display newspaper for valid date', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockNewspaper }),
    });

    render(
      <NewspaperDatePage
        params={{ id: 'test-id', date: '2025-12-10' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('newspaper-layout')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Newspaper')).toBeInTheDocument();
    expect(screen.getAllByText('2025-12-10').length).toBeGreaterThan(0);
  });

  it('should display error for invalid date format', async () => {
    render(
      <NewspaperDatePage
        params={{ id: 'test-id', date: 'invalid-date' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/invalid date format/i)).toBeInTheDocument();
    });
  });

  it('should display error for future date (400)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Future dates are not allowed' }),
    });

    render(
      <NewspaperDatePage
        params={{ id: 'test-id', date: '2025-12-20' }}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/future dates are not allowed/i)
      ).toBeInTheDocument();
    });
  });

  it('should display error for date older than 7 days (400)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Date is older than 7 days' }),
    });

    render(
      <NewspaperDatePage
        params={{ id: 'test-id', date: '2025-12-01' }}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/date is older than 7 days/i)
      ).toBeInTheDocument();
    });
  });

  it('should display error for newspaper not found (404)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Newspaper not found' }),
    });

    render(
      <NewspaperDatePage
        params={{ id: 'non-existent-id', date: '2025-12-10' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/newspaper not found/i)).toBeInTheDocument();
    });
  });

  it('should display error for server error (500)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    render(
      <NewspaperDatePage
        params={{ id: 'test-id', date: '2025-12-10' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load newspaper/i)).toBeInTheDocument();
    });
  });

  it('should navigate to new date when date changes', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockNewspaper }),
    });

    render(
      <NewspaperDatePage
        params={{ id: 'test-id', date: '2025-12-10' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('date-navigation')).toBeInTheDocument();
    });

    const previousButton = screen.getByText('Previous');
    previousButton.click();

    expect(mockPush).toHaveBeenCalledWith('/newspapers/test-id/2025-12-09');
  });

  it('should display date navigation with current date', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockNewspaper }),
    });

    render(
      <NewspaperDatePage
        params={{ id: 'test-id', date: '2025-12-10' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('date-navigation')).toBeInTheDocument();
    });

    expect(screen.getAllByText('2025-12-10').length).toBeGreaterThan(0);
  });

  it('should have back to home button', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockNewspaper }),
    });

    render(
      <NewspaperDatePage
        params={{ id: 'test-id', date: '2025-12-10' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('newspaper-layout')).toBeInTheDocument();
    });

    const backButton = screen.getAllByText(/back to home/i)[0];
    expect(backButton).toBeInTheDocument();
    
    backButton.click();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
