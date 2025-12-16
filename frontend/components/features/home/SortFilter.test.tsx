import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SortFilter from './SortFilter';

describe('SortFilter', () => {
  const mockOnSortChange = vi.fn();

  beforeEach(() => {
    mockOnSortChange.mockClear();
  });

  describe('English Locale', () => {
    it('should render sort options in English', () => {
      render(
        <SortFilter
          sortBy="popular"
          onSortChange={mockOnSortChange}
          locale="en"
        />
      );

      expect(screen.getByText('Sort by:')).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Popular')).toBeInTheDocument();
      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('should have selected sort as value', () => {
      render(
        <SortFilter
          sortBy="recent"
          onSortChange={mockOnSortChange}
          locale="en"
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('recent');
    });

    it('should call onSortChange when selecting a sort option', () => {
      render(
        <SortFilter
          sortBy="popular"
          onSortChange={mockOnSortChange}
          locale="en"
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'recent' } });

      expect(mockOnSortChange).toHaveBeenCalledWith('recent');
    });
  });

  describe('Japanese Locale', () => {
    it('should render sort options in Japanese', () => {
      render(
        <SortFilter
          sortBy="popular"
          onSortChange={mockOnSortChange}
          locale="ja"
        />
      );

      expect(screen.getByText('並び替え:')).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('人気順')).toBeInTheDocument();
      expect(screen.getByText('新着順')).toBeInTheDocument();
    });

    it('should have selected sort as value', () => {
      render(
        <SortFilter
          sortBy="popular"
          onSortChange={mockOnSortChange}
          locale="ja"
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('popular');
    });

    it('should call onSortChange when selecting a sort option', () => {
      render(
        <SortFilter
          sortBy="recent"
          onSortChange={mockOnSortChange}
          locale="ja"
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'popular' } });

      expect(mockOnSortChange).toHaveBeenCalledWith('popular');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label', () => {
      render(
        <SortFilter
          sortBy="popular"
          onSortChange={mockOnSortChange}
          locale="en"
        />
      );

      const label = screen.getByText('Sort by:');
      const select = screen.getByRole('combobox');

      expect(label).toBeInTheDocument();
      expect(select).toHaveAttribute('id', 'sort-filter');
    });

    it('should be keyboard accessible', () => {
      render(
        <SortFilter
          sortBy="popular"
          onSortChange={mockOnSortChange}
          locale="en"
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).not.toBeDisabled();
    });
  });
});
