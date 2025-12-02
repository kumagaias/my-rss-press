import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedSelector } from './FeedSelector';
import { FeedSuggestion } from '@/types';

const mockSuggestions: FeedSuggestion[] = [
  {
    url: 'https://techcrunch.com/feed/',
    title: 'TechCrunch',
    reasoning: 'Leading technology news and startup coverage',
  },
  {
    url: 'https://www.theverge.com/rss/index.xml',
    title: 'The Verge',
    reasoning: 'Technology, science, and culture news',
  },
  {
    url: 'https://news.ycombinator.com/rss',
    title: 'Hacker News',
    reasoning: 'Tech community news and discussions',
  },
];

describe('FeedSelector', () => {
  it('should render suggested feeds', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={mockSuggestions}
        selectedFeeds={[]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    expect(screen.getByText('Suggested Feeds')).toBeInTheDocument();
    expect(screen.getByText('TechCrunch')).toBeInTheDocument();
    expect(screen.getByText('The Verge')).toBeInTheDocument();
    expect(screen.getByText('Hacker News')).toBeInTheDocument();
  });

  it('should toggle feed selection', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={mockSuggestions}
        selectedFeeds={[]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(onSelectionChange).toHaveBeenCalledWith([mockSuggestions[0].url]);
  });

  it('should deselect feed when clicked again', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={mockSuggestions}
        selectedFeeds={[mockSuggestions[0].url]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('should add custom feed URL', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={[]}
        selectedFeeds={[]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    const input = screen.getByPlaceholderText(/Enter feed URL/);
    const addButton = screen.getByRole('button', { name: /Add/ });

    fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } });
    fireEvent.click(addButton);

    expect(onSelectionChange).toHaveBeenCalledWith(['https://example.com/feed.xml']);
  });

  it('should show error for invalid URL', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={[]}
        selectedFeeds={[]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    const input = screen.getByPlaceholderText(/Enter feed URL/);
    const addButton = screen.getByRole('button', { name: /Add/ });

    fireEvent.change(input, { target: { value: 'not-a-valid-url' } });
    fireEvent.click(addButton);

    expect(screen.getByText(/Please enter a valid URL/)).toBeInTheDocument();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should prevent duplicate feeds', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={[]}
        selectedFeeds={['https://example.com/feed.xml']}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    const input = screen.getByPlaceholderText(/Enter feed URL/);
    const addButton = screen.getByRole('button', { name: /Add/ });

    fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } });
    fireEvent.click(addButton);

    expect(screen.getByText(/This feed is already added/)).toBeInTheDocument();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should remove feed from selection', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={mockSuggestions}
        selectedFeeds={[mockSuggestions[0].url, mockSuggestions[1].url]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /Remove/ });
    fireEvent.click(removeButtons[0]);

    expect(onSelectionChange).toHaveBeenCalledWith([mockSuggestions[1].url]);
  });

  it('should display selected feed count', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={mockSuggestions}
        selectedFeeds={[mockSuggestions[0].url, mockSuggestions[1].url]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    expect(screen.getByText(/2 feeds selected/)).toBeInTheDocument();
  });

  it('should call onGenerate when generate button is clicked', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={mockSuggestions}
        selectedFeeds={[mockSuggestions[0].url]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    const generateButton = screen.getByRole('button', { name: /Generate Newspaper/ });
    fireEvent.click(generateButton);

    expect(onGenerate).toHaveBeenCalled();
  });

  it('should disable generate button when no feeds selected', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={mockSuggestions}
        selectedFeeds={[]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    const generateButton = screen.getByRole('button', { name: /Generate Newspaper/ });
    expect(generateButton).toBeDisabled();
  });

  it('should disable all inputs when generating', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={mockSuggestions}
        selectedFeeds={[mockSuggestions[0].url]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={true}
        locale="en"
      />
    );

    const input = screen.getByPlaceholderText(/Enter feed URL/);
    const addButton = screen.getByRole('button', { name: /Add/ });
    const removeButton = screen.getByRole('button', { name: /Remove/ });
    const generateButton = screen.getByRole('button', { name: /Loading/ });

    expect(input).toBeDisabled();
    expect(addButton).toBeDisabled();
    expect(removeButton).toBeDisabled();
    expect(generateButton).toBeDisabled();
  });

  it('should render Japanese text when locale is ja', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={mockSuggestions}
        selectedFeeds={[mockSuggestions[0].url]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="ja"
      />
    );

    expect(screen.getByText('提案されたフィード')).toBeInTheDocument();
    expect(screen.getByText('カスタムフィードを追加')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /新聞を生成/ })).toBeInTheDocument();
  });

  it('should clear input after adding custom feed', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={[]}
        selectedFeeds={[]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    const input = screen.getByPlaceholderText(/Enter feed URL/) as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: /Add/ });

    fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } });
    fireEvent.click(addButton);

    expect(input.value).toBe('');
  });

  it('should clear error when user starts typing', () => {
    const onSelectionChange = vi.fn();
    const onGenerate = vi.fn();

    render(
      <FeedSelector
        suggestions={[]}
        selectedFeeds={[]}
        onSelectionChange={onSelectionChange}
        onGenerate={onGenerate}
        isGenerating={false}
        locale="en"
      />
    );

    const input = screen.getByPlaceholderText(/Enter feed URL/);
    const addButton = screen.getByRole('button', { name: /Add/ });

    // Trigger error
    fireEvent.change(input, { target: { value: 'invalid-url' } });
    fireEvent.click(addButton);
    expect(screen.getByText(/Please enter a valid URL/)).toBeInTheDocument();

    // Start typing
    fireEvent.change(input, { target: { value: 'https://' } });
    expect(screen.queryByText(/Please enter a valid URL/)).not.toBeInTheDocument();
  });
});
