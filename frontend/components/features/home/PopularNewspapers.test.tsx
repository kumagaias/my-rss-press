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
    feedUrls: ['https://example.com/tech-feed', 'https://example.com/community-feed'],
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
      // example.com appears multiple times (2 feeds in first newspaper)
      expect(screen.getAllByText('example.com').length).toBeGreaterThan(0);
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

  describe('Language Filter', () => {
    const newspapersWithLanguages: NewspaperData[] = [
      {
        ...mockNewspapers[0],
        languages: ['EN'],
      },
      {
        ...mockNewspapers[1],
        languages: ['JP'],
      },
      {
        newspaperId: '3',
        name: 'Bilingual News',
        userName: 'Bob Wilson',
        feedUrls: ['https://example.com/bilingual'],
        createdAt: '2025-12-03T10:00:00Z',
        updatedAt: '2025-12-03T10:00:00Z',
        viewCount: 100,
        isPublic: true,
        languages: ['EN', 'JP'],
      },
      {
        newspaperId: '4',
        name: 'Legacy News',
        userName: 'Alice Brown',
        feedUrls: ['https://example.com/legacy'],
        createdAt: '2025-12-04T10:00:00Z',
        updatedAt: '2025-12-04T10:00:00Z',
        viewCount: 50,
        isPublic: true,
        // No languages field (backward compatibility)
      },
    ];

    it('filters newspapers by selected language', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ newspapers: newspapersWithLanguages }),
      });

      render(<PopularNewspapers locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
      });

      // Click JP filter
      const jpButton = screen.getByText('Japanese');
      fireEvent.click(jpButton);

      // Should show only JP newspapers and legacy newspapers (backward compatibility)
      await waitFor(() => {
        expect(screen.queryByText('Tech News Daily')).not.toBeInTheDocument();
        expect(screen.getByText('Sports Weekly')).toBeInTheDocument();
        expect(screen.getByText('Bilingual News')).toBeInTheDocument();
        expect(screen.getByText('Legacy News')).toBeInTheDocument();
      });
    });

    it('shows all newspapers when ALL is selected', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ newspapers: newspapersWithLanguages }),
      });

      render(<PopularNewspapers locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
      });

      // Click ALL filter
      const allButton = screen.getByText('All');
      fireEvent.click(allButton);

      // Should show all newspapers
      await waitFor(() => {
        expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
        expect(screen.getByText('Sports Weekly')).toBeInTheDocument();
        expect(screen.getByText('Bilingual News')).toBeInTheDocument();
        expect(screen.getByText('Legacy News')).toBeInTheDocument();
      });
    });

    it('shows newspapers without languages field in all filters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ newspapers: newspapersWithLanguages }),
      });

      render(<PopularNewspapers locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Legacy News')).toBeInTheDocument();
      });

      // Legacy News should be visible in EN filter
      expect(screen.getByText('Legacy News')).toBeInTheDocument();

      // Click JP filter
      const jpButton = screen.getByText('Japanese');
      fireEvent.click(jpButton);

      // Legacy News should still be visible in JP filter
      await waitFor(() => {
        expect(screen.getByText('Legacy News')).toBeInTheDocument();
      });
    });
  });

  describe('Search Filter', () => {
    it('filters newspapers by search query in name', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ newspapers: mockNewspapers }),
      });

      render(<PopularNewspapers locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
      });

      // Search for "tech"
      const searchInput = screen.getByPlaceholderText(/search by newspaper name/i);
      fireEvent.change(searchInput, { target: { value: 'tech' } });

      // Should show only Tech News Daily
      await waitFor(() => {
        expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
        expect(screen.queryByText('Sports Weekly')).not.toBeInTheDocument();
      });
    });

    it('filters newspapers by search query in feed URL', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ newspapers: mockNewspapers }),
      });

      render(<PopularNewspapers locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
      });

      // Search for "espn"
      const searchInput = screen.getByPlaceholderText(/search by newspaper name/i);
      fireEvent.change(searchInput, { target: { value: 'espn' } });

      // Should show only Sports Weekly
      await waitFor(() => {
        expect(screen.queryByText('Tech News Daily')).not.toBeInTheDocument();
        expect(screen.getByText('Sports Weekly')).toBeInTheDocument();
      });
    });

    it('shows no results message when search has no matches', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ newspapers: mockNewspapers }),
      });

      render(<PopularNewspapers locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
      });

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText(/search by newspaper name/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      // Should show no results message
      await waitFor(() => {
        expect(
          screen.getByText(/no newspapers found matching your search criteria/i)
        ).toBeInTheDocument();
      });
    });

    it('clears search when clear button is clicked', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ newspapers: mockNewspapers }),
      });

      render(<PopularNewspapers locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
      });

      // Search for "tech"
      const searchInput = screen.getByPlaceholderText(/search by newspaper name/i);
      fireEvent.change(searchInput, { target: { value: 'tech' } });

      await waitFor(() => {
        expect(screen.queryByText('Sports Weekly')).not.toBeInTheDocument();
      });

      // Click clear button
      const clearButton = screen.getByLabelText(/clear search/i);
      fireEvent.click(clearButton);

      // Should show all newspapers again
      await waitFor(() => {
        expect(screen.getByText('Tech News Daily')).toBeInTheDocument();
        expect(screen.getByText('Sports Weekly')).toBeInTheDocument();
      });
    });
  });

  describe('Combined Filters', () => {
    const newspapersWithLanguages: NewspaperData[] = [
      {
        ...mockNewspapers[0],
        name: 'English Tech News',
        languages: ['EN'],
      },
      {
        ...mockNewspapers[1],
        name: 'Japanese Sports News',
        languages: ['JP'],
      },
      {
        newspaperId: '3',
        name: 'English Sports News',
        userName: 'Bob Wilson',
        feedUrls: ['https://example.com/sports'],
        createdAt: '2025-12-03T10:00:00Z',
        updatedAt: '2025-12-03T10:00:00Z',
        viewCount: 100,
        isPublic: true,
        languages: ['EN'],
      },
    ];

    it('applies both language and search filters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ newspapers: newspapersWithLanguages }),
      });

      render(<PopularNewspapers locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('English Tech News')).toBeInTheDocument();
      });

      // Filter by EN language
      const enButton = screen.getByText('English');
      fireEvent.click(enButton);

      // Search for "sports"
      const searchInput = screen.getByPlaceholderText(/search by newspaper name/i);
      fireEvent.change(searchInput, { target: { value: 'sports' } });

      // Should show only English Sports News
      await waitFor(() => {
        expect(screen.queryByText('English Tech News')).not.toBeInTheDocument();
        expect(screen.queryByText('Japanese Sports News')).not.toBeInTheDocument();
        expect(screen.getByText('English Sports News')).toBeInTheDocument();
      });
    });
  });
});
