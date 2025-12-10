import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LanguageFilter from './LanguageFilter';

describe('LanguageFilter', () => {
  const mockOnLanguageChange = vi.fn();

  beforeEach(() => {
    mockOnLanguageChange.mockClear();
  });

  describe('English Locale', () => {
    it('should render all language options in English', () => {
      render(
        <LanguageFilter
          selectedLanguage="ALL"
          onLanguageChange={mockOnLanguageChange}
          locale="en"
        />
      );

      expect(screen.getByText('Language:')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Japanese')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should highlight selected language', () => {
      render(
        <LanguageFilter
          selectedLanguage="EN"
          onLanguageChange={mockOnLanguageChange}
          locale="en"
        />
      );

      const englishButton = screen.getByText('English');
      expect(englishButton).toHaveClass('bg-gray-900', 'text-white');

      const allButton = screen.getByText('All');
      expect(allButton).toHaveClass('bg-gray-200', 'text-gray-700');
    });

    it('should call onLanguageChange when clicking a language button', () => {
      render(
        <LanguageFilter
          selectedLanguage="ALL"
          onLanguageChange={mockOnLanguageChange}
          locale="en"
        />
      );

      const japaneseButton = screen.getByText('Japanese');
      fireEvent.click(japaneseButton);

      expect(mockOnLanguageChange).toHaveBeenCalledWith('JP');
    });
  });

  describe('Japanese Locale', () => {
    it('should render all language options in Japanese', () => {
      render(
        <LanguageFilter
          selectedLanguage="ALL"
          onLanguageChange={mockOnLanguageChange}
          locale="ja"
        />
      );

      expect(screen.getByText('言語:')).toBeInTheDocument();
      expect(screen.getByText('すべて')).toBeInTheDocument();
      expect(screen.getByText('日本語')).toBeInTheDocument();
      expect(screen.getByText('英語')).toBeInTheDocument();
    });

    it('should highlight selected language', () => {
      render(
        <LanguageFilter
          selectedLanguage="JP"
          onLanguageChange={mockOnLanguageChange}
          locale="ja"
        />
      );

      const japaneseButton = screen.getByText('日本語');
      expect(japaneseButton).toHaveClass('bg-gray-900', 'text-white');

      const allButton = screen.getByText('すべて');
      expect(allButton).toHaveClass('bg-gray-200', 'text-gray-700');
    });

    it('should call onLanguageChange when clicking a language button', () => {
      render(
        <LanguageFilter
          selectedLanguage="ALL"
          onLanguageChange={mockOnLanguageChange}
          locale="ja"
        />
      );

      const englishButton = screen.getByText('英語');
      fireEvent.click(englishButton);

      expect(mockOnLanguageChange).toHaveBeenCalledWith('EN');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels', () => {
      render(
        <LanguageFilter
          selectedLanguage="ALL"
          onLanguageChange={mockOnLanguageChange}
          locale="en"
        />
      );

      const allButton = screen.getByLabelText('Filter by All');
      const japaneseButton = screen.getByLabelText('Filter by Japanese');
      const englishButton = screen.getByLabelText('Filter by English');

      expect(allButton).toBeInTheDocument();
      expect(japaneseButton).toBeInTheDocument();
      expect(englishButton).toBeInTheDocument();
    });

    it('should have aria-pressed attribute', () => {
      render(
        <LanguageFilter
          selectedLanguage="EN"
          onLanguageChange={mockOnLanguageChange}
          locale="en"
        />
      );

      const englishButton = screen.getByText('English');
      expect(englishButton).toHaveAttribute('aria-pressed', 'true');

      const allButton = screen.getByText('All');
      expect(allButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('All Languages', () => {
    it('should allow selecting ALL to show all newspapers', () => {
      render(
        <LanguageFilter
          selectedLanguage="JP"
          onLanguageChange={mockOnLanguageChange}
          locale="en"
        />
      );

      const allButton = screen.getByText('All');
      fireEvent.click(allButton);

      expect(mockOnLanguageChange).toHaveBeenCalledWith('ALL');
    });
  });
});
