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
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('All Languages')).toBeInTheDocument();
      expect(screen.getByText('日本語')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should have selected language as value', () => {
      render(
        <LanguageFilter
          selectedLanguage="EN"
          onLanguageChange={mockOnLanguageChange}
          locale="en"
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('EN');
    });

    it('should call onLanguageChange when selecting a language', () => {
      render(
        <LanguageFilter
          selectedLanguage="ALL"
          onLanguageChange={mockOnLanguageChange}
          locale="en"
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'JP' } });

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
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('すべて')).toBeInTheDocument();
      expect(screen.getByText('日本語')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should have selected language as value', () => {
      render(
        <LanguageFilter
          selectedLanguage="JP"
          onLanguageChange={mockOnLanguageChange}
          locale="ja"
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('JP');
    });

    it('should call onLanguageChange when selecting a language', () => {
      render(
        <LanguageFilter
          selectedLanguage="ALL"
          onLanguageChange={mockOnLanguageChange}
          locale="ja"
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'EN' } });

      expect(mockOnLanguageChange).toHaveBeenCalledWith('EN');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label', () => {
      render(
        <LanguageFilter
          selectedLanguage="ALL"
          onLanguageChange={mockOnLanguageChange}
          locale="en"
        />
      );

      const label = screen.getByText('Language:');
      const select = screen.getByRole('combobox');

      expect(label).toBeInTheDocument();
      expect(select).toHaveAttribute('id', 'language-filter');
    });

    it('should be keyboard accessible', () => {
      render(
        <LanguageFilter
          selectedLanguage="EN"
          onLanguageChange={mockOnLanguageChange}
          locale="en"
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).not.toBeDisabled();
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

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'ALL' } });

      expect(mockOnLanguageChange).toHaveBeenCalledWith('ALL');
    });
  });
});
