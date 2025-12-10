import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchInput from './SearchInput';

describe('SearchInput', () => {
  const mockOnSearchChange = vi.fn();

  beforeEach(() => {
    mockOnSearchChange.mockClear();
  });

  describe('English Locale', () => {
    it('should render search input with English placeholder', () => {
      render(
        <SearchInput
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          locale="en"
        />
      );

      const input = screen.getByPlaceholderText(
        /search by newspaper name or feed url/i
      );
      expect(input).toBeInTheDocument();
    });

    it('should call onSearchChange when typing', () => {
      render(
        <SearchInput
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          locale="en"
        />
      );

      const input = screen.getByPlaceholderText(
        /search by newspaper name or feed url/i
      );
      fireEvent.change(input, { target: { value: 'technology' } });

      expect(mockOnSearchChange).toHaveBeenCalledWith('technology');
    });

    it('should display clear button when search query is not empty', () => {
      render(
        <SearchInput
          searchQuery="technology"
          onSearchChange={mockOnSearchChange}
          locale="en"
        />
      );

      const clearButton = screen.getByLabelText(/clear search/i);
      expect(clearButton).toBeInTheDocument();
    });

    it('should not display clear button when search query is empty', () => {
      render(
        <SearchInput
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          locale="en"
        />
      );

      const clearButton = screen.queryByLabelText(/clear search/i);
      expect(clearButton).not.toBeInTheDocument();
    });

    it('should clear search query when clicking clear button', () => {
      render(
        <SearchInput
          searchQuery="technology"
          onSearchChange={mockOnSearchChange}
          locale="en"
        />
      );

      const clearButton = screen.getByLabelText(/clear search/i);
      fireEvent.click(clearButton);

      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Japanese Locale', () => {
    it('should render search input with Japanese placeholder', () => {
      render(
        <SearchInput
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          locale="ja"
        />
      );

      const input = screen.getByPlaceholderText(
        /新聞名やフィードURLで検索/
      );
      expect(input).toBeInTheDocument();
    });

    it('should call onSearchChange when typing', () => {
      render(
        <SearchInput
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          locale="ja"
        />
      );

      const input = screen.getByPlaceholderText(
        /新聞名やフィードURLで検索/
      );
      fireEvent.change(input, { target: { value: 'テクノロジー' } });

      expect(mockOnSearchChange).toHaveBeenCalledWith('テクノロジー');
    });

    it('should display clear button with Japanese label', () => {
      render(
        <SearchInput
          searchQuery="テクノロジー"
          onSearchChange={mockOnSearchChange}
          locale="ja"
        />
      );

      const clearButton = screen.getByLabelText(/検索をクリア/);
      expect(clearButton).toBeInTheDocument();
    });

    it('should clear search query when clicking clear button', () => {
      render(
        <SearchInput
          searchQuery="テクノロジー"
          onSearchChange={mockOnSearchChange}
          locale="ja"
        />
      );

      const clearButton = screen.getByLabelText(/検索をクリア/);
      fireEvent.click(clearButton);

      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for input', () => {
      render(
        <SearchInput
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          locale="en"
        />
      );

      const input = screen.getByLabelText(
        /search by newspaper name or feed url/i
      );
      expect(input).toBeInTheDocument();
    });

    it('should have proper aria-label for clear button', () => {
      render(
        <SearchInput
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          locale="en"
        />
      );

      const clearButton = screen.getByLabelText(/clear search/i);
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Search Icon', () => {
    it('should display search icon', () => {
      const { container } = render(
        <SearchInput
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          locale="en"
        />
      );

      const searchIcon = container.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('Value Display', () => {
    it('should display current search query', () => {
      render(
        <SearchInput
          searchQuery="technology"
          onSearchChange={mockOnSearchChange}
          locale="en"
        />
      );

      const input = screen.getByDisplayValue('technology');
      expect(input).toBeInTheDocument();
    });
  });
});
