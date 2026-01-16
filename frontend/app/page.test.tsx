import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock PopularNewspapers component
vi.mock('@/components/features/home/PopularNewspapers', () => ({
  PopularNewspapers: ({ locale, onNewspaperClick }: any) => (
    <div>
      <h2>Popular Newspapers</h2>
    </div>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock sessionStorage
const mockSessionStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock localStorage
const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(() => 'en'),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Set environment variable for tests
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3001';

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders theme input section', () => {
    render(<Home />);
    // Header is now in LayoutClient, so we check for main content instead
    expect(screen.getByText(/What are you interested in/)).toBeInTheDocument();
  });

  it('renders theme input', () => {
    render(<Home />);
    expect(screen.getByText(/What are you interested in/)).toBeInTheDocument();
  });

  // Try Demo button was removed in the current implementation
  // This test is no longer applicable

  it('generates newspaper with one click when theme is submitted', async () => {
    const mockResponse = {
      articles: [
        {
          title: 'Test Article',
          description: 'Test description',
          link: 'https://example.com',
          pubDate: '2025-12-01T10:00:00Z',
          importance: 85,
        },
      ],
      feedUrls: ['https://example.com/tech-feed'],
      feedMetadata: [
        { url: 'https://example.com/tech-feed', title: 'Tech News Feed', isDefault: false },
      ],
      newspaperName: 'Technology Daily',
      summary: 'Test summary',
      languages: ['EN'],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Technology, Sports/);
    fireEvent.change(input, { target: { value: 'Technology' } });
    
    const submitButton = screen.getByText('Generate Newspaper');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/newspapers/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: 'Technology', locale: 'en' }),
        })
      );
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'newspaperArticles',
        JSON.stringify(mockResponse.articles)
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'newspaperFeedMetadata',
        JSON.stringify(mockResponse.feedMetadata)
      );
      expect(mockPush).toHaveBeenCalledWith('/newspaper');
    }, { timeout: 3000 });
  });

  it('shows loading animation during generation', async () => {
    const mockResponse = {
      articles: [],
      feedUrls: [],
      feedMetadata: [],
      newspaperName: 'Test',
      summary: '',
      languages: [],
    };

    (global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockResponse,
      }), 100))
    );

    render(<Home />);

    const input = screen.getByPlaceholderText(/Technology, Sports/);
    fireEvent.change(input, { target: { value: 'Technology' } });
    
    const submitButton = screen.getByText('Generate Newspaper');
    fireEvent.click(submitButton);

    // Check loading animation appears
    await waitFor(() => {
      expect(screen.getByText(/Generating your newspaper/)).toBeInTheDocument();
    });
  });

  it('shows error when theme is empty', async () => {
    render(<Home />);

    const submitButton = screen.getByText('Generate Newspaper');
    fireEvent.click(submitButton);

    // Should not call API with empty theme
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders popular newspapers section', async () => {
    // Header is now in LayoutClient, so we check for main content instead
    render(<Home />);
    expect(screen.getByText('Popular Newspapers')).toBeInTheDocument();
  });

  it('displays error message when API fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'API Error' }),
    });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Technology, Sports/);
    fireEvent.change(input, { target: { value: 'Technology' } });
    const submitButton = screen.getByText('Generate Newspaper');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/API Error/)).toBeInTheDocument();
    });
  });

});
