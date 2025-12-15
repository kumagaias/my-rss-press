import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewspaperPage from './page';
import * as api from '@/lib/api';

// Mock next/navigation
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

// Mock useSearchParams - can be overridden in individual tests
let mockNewspaperId: string | null = 'test-newspaper-id'; // Default to having an ID
let mockDate: string | null = null;

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'id') return mockNewspaperId;
      if (key === 'date') return mockDate;
      return null;
    },
  }),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  saveNewspaper: vi.fn(),
  getNewspaper: vi.fn(),
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

const mockArticles = [
  {
    title: 'Test Article 1',
    description: 'Description 1',
    link: 'https://example.com/1',
    pubDate: new Date('2025-12-01'),
    importance: 90,
  },
  {
    title: 'Test Article 2',
    description: 'Description 2',
    link: 'https://example.com/2',
    pubDate: new Date('2025-12-01'),
    importance: 70,
  },
];

describe('NewspaperPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNewspaperId = 'test-newspaper-id'; // Default to having an ID
    mockDate = null; // Reset date
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === 'newspaperArticles') return JSON.stringify(mockArticles);
      if (key === 'newspaperTheme') return 'Technology';
      if (key === 'newspaperFeeds') return JSON.stringify(['https://example.com/feed']);
      return null;
    });
    
    // Mock fetch for API calls
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/newspapers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              newspaperId: 'test-newspaper-id',
              name: 'Test Newspaper',
              userName: 'Test User',
              articles: mockArticles,
              feedUrls: ['https://example.com/feed'],
              newspaperDate: '2025-12-01T10:00:00Z',
              viewCount: 5,
              isPublic: true,
            },
          }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as any;
  });

  it('renders newspaper layout with articles', async () => {
    render(<NewspaperPage />);

    // Wait for articles to appear
    expect(await screen.findByText('Test Article 1', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Test Article 2')).toBeInTheDocument();
  });

  it('renders back to home button', async () => {
    render(<NewspaperPage />);

    expect(await screen.findByText(/Back to Home/, {}, { timeout: 5000 })).toBeInTheDocument();
  });



  it('navigates back to home when back button is clicked', async () => {
    render(<NewspaperPage />);

    const backButton = await screen.findByText(/Back to Home/, {}, { timeout: 3000 });
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('shows error when no newspaper ID is provided', async () => {
    mockNewspaperId = null; // No ID in query params

    render(<NewspaperPage />);

    // Should show error message
    expect(await screen.findByText(/Newspaper ID is required/i, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('displays error when fetch fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Newspaper not found' }),
      } as Response)
    ) as any;

    render(<NewspaperPage />);

    // Should show error message
    expect(await screen.findByText(/Newspaper not found/i, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
