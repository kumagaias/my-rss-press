import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PopularNewspapers } from './PopularNewspapers';
import type { NewspaperData } from '@/types';

// Mock fetch
global.fetch = vi.fn();

const mockNewspapers: NewspaperData[] = [
  {
    newspaperId: '1',
    name: 'Tech News Daily',
    userName: 'John Doe',
    feedUrls: ['https://techcrunch.com/feed/', 'https://news.ycombinator.com/rss'],
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-01T10:00:00Z',
    viewCount: 150,
    isPublic: true,
  },
  {
    newspaperId: '2',
    name: 'Sports Weekly',
    userName: 'Jane Smith',
    feedUrls: ['https://espn.com/feed/'],
    createdAt: '2025-12-02T10:00:00Z',
    updatedAt: '2025-12-02T10:00:00Z',
    viewCount: 75,
    isPublic: true,
  },
];

describe('PopularNewspapers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders popular newspapers title by default', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ newspapers: [] }),
    });

    render(<PopularNewspapers locale="en" />);
    expect(screen.getByText('Popular Newspapers')).toBeInTheDocument();
  });

  it('fetches and displays newspapers', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ newspapers: mockNewspapers }),
    });

    render(<PopularNewspapers locale="en" />);

    await waitFor(() => {
      expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
      expect(screen.getByText('Sports Weekly')).toBeInTheDocument();
    });
  });

  it('switches between popular and recent sort', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ newspapers: mockNewspapers }),
    });

    render(<PopularNewspapers locale="en" />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
    });

    // Click recent button
    const recentButton = screen.getByText('Recent');
    fireEvent.click(recentButton);

    await waitFor(() => {
      expect(screen.getByText('Recent Newspapers')).toBeInTheDocument();
    });

    // Verify fetch was called with correct sort parameter
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sort=recent')
    );
  });

  it('displays loading state', () => {
    (global.fetch as any).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    );

    render(<PopularNewspapers locale="en" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays error state', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<PopularNewspapers locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
    });
  });

  it('displays empty state when no newspapers', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ newspapers: [] }),
    });

    render(<PopularNewspapers locale="en" />);

    await waitFor(() => {
      expect(screen.getByText('No newspapers found')).toBeInTheDocument();
    });
  });

  it('calls onNewspaperClick when newspaper card is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ newspapers: mockNewspapers }),
    });

    const handleClick = vi.fn();
    render(<PopularNewspapers locale="en" onNewspaperClick={handleClick} />);

    await waitFor(() => {
      expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
    });

    const card = screen.getByText('Tech News Daily').closest('.cursor-pointer');
    if (card) {
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledWith('1');
    }
  });

  it('displays newspaper metadata correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ newspapers: mockNewspapers }),
    });

    render(<PopularNewspapers locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/Created by: John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Views: 150/)).toBeInTheDocument();
    });
  });

  it('displays feed URLs as tags', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ newspapers: mockNewspapers }),
    });

    render(<PopularNewspapers locale="en" />);

    await waitFor(() => {
      expect(screen.getByText('techcrunch.com')).toBeInTheDocument();
      expect(screen.getByText('news.ycombinator.com')).toBeInTheDocument();
    });
  });

  it('uses Japanese translations when locale is ja', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ newspapers: [] }),
    });

    render(<PopularNewspapers locale="ja" />);

    await waitFor(() => {
      expect(screen.getByText('人気の新聞')).toBeInTheDocument();
    });
  });
});
