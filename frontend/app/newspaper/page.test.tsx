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
let mockNewspaperId: string | null = null;

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'id') return mockNewspaperId;
      return null;
    },
  }),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  saveNewspaper: vi.fn(),
  getNewspaper: vi.fn(),
}));

// Mock i18n to return en-US locale
vi.mock('@/lib/i18n', async () => {
  const actual = await vi.importActual('@/lib/i18n');
  return {
    ...actual,
    detectLocale: () => 'en-US' as const,
  };
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
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
    mockNewspaperId = null; // Reset to no newspaper ID by default
    
    // Mock localStorage to return en-US locale
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'locale') return 'en-US';
      return null;
    });
    
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === 'newspaperArticles') return JSON.stringify(mockArticles);
      if (key === 'newspaperTheme') return 'Technology';
      if (key === 'newspaperFeeds') return JSON.stringify(['https://example.com/feed']);
      return null;
    });
    
    // Mock getNewspaper to return newspaper data (only called when newspaperId exists)
    (api.getNewspaper as any).mockResolvedValue({
      newspaperId: 'test-newspaper-id',
      newspaperName: 'Test Newspaper',
      userName: 'Test User',
      articles: mockArticles,
      feedUrls: ['https://example.com/feed'],
      createdAt: '2025-12-01T10:00:00Z',
      viewCount: 5,
      isPublic: true,
    });
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

  it('renders save button when not saved', async () => {
    render(<NewspaperPage />);

    // Button text comes from i18n
    expect(await screen.findByRole('button', { name: /save/i }, { timeout: 5000 })).toBeInTheDocument();
  });

  it('opens settings modal when save button is clicked', async () => {
    render(<NewspaperPage />);

    const saveButton = await screen.findByRole('button', { name: /save/i }, { timeout: 3000 });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Newspaper Settings')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('saves newspaper with settings', async () => {
    (api.saveNewspaper as any).mockResolvedValueOnce({
      newspaperId: 'test-id',
      createdAt: '2025-12-01T10:00:00Z',
    });

    render(<NewspaperPage />);

    const saveButton = await screen.findByRole('button', { name: /save/i }, { timeout: 3000 });
    fireEvent.click(saveButton);

    await screen.findByText('Newspaper Settings', {}, { timeout: 3000 });

    // Fill in settings
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'My Newspaper' } });

    const saveSettingsButton = screen.getByText('Save');
    fireEvent.click(saveSettingsButton);

    await waitFor(() => {
      expect(api.saveNewspaper).toHaveBeenCalled();
      expect(screen.getByText(/Saved/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('navigates back to home when back button is clicked', async () => {
    render(<NewspaperPage />);

    const backButton = await screen.findByText(/Back to Home/, {}, { timeout: 3000 });
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('newspaperArticles');
  });

  it('redirects to home if no articles in session', () => {
    mockSessionStorage.getItem.mockReturnValue(null);
    (api.getNewspaper as any).mockResolvedValue(null);

    render(<NewspaperPage />);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('displays error when save fails', async () => {
    (api.saveNewspaper as any).mockRejectedValueOnce(new Error('Save failed'));

    render(<NewspaperPage />);

    const saveButton = await screen.findByRole('button', { name: /save/i }, { timeout: 3000 });
    fireEvent.click(saveButton);

    await screen.findByText('Newspaper Settings', {}, { timeout: 3000 });

    const saveSettingsButton = screen.getByText('Save');
    fireEvent.click(saveSettingsButton);

    await screen.findByText(/Save failed/, {}, { timeout: 3000 });
  });
});
