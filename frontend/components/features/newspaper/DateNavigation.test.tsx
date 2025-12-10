import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DateNavigation from './DateNavigation';

describe('DateNavigation', () => {
  const mockOnDateChange = vi.fn();

  beforeEach(() => {
    mockOnDateChange.mockClear();
    // Mock current date to 2025-12-10 JST
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-10T12:00:00+09:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    currentDate: '2025-12-10',
    onDateChange: mockOnDateChange,
    locale: 'en' as const,
  };

  describe('Date Display', () => {
    it('should display current date in English format', () => {
      render(<DateNavigation {...defaultProps} />);

      expect(screen.getByText(/December/i)).toBeInTheDocument();
      expect(screen.getByText(/2025/i)).toBeInTheDocument();
    });

    it('should display current date in Japanese format', () => {
      render(<DateNavigation {...defaultProps} locale="ja" />);

      expect(screen.getByText(/2025年/)).toBeInTheDocument();
      expect(screen.getByText(/12月/)).toBeInTheDocument();
    });
  });

  describe('Previous Day Button', () => {
    it('should be enabled when current date is within 7 days', () => {
      render(<DateNavigation {...defaultProps} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      expect(previousButton).not.toBeDisabled();
      expect(previousButton).toHaveClass('bg-gray-800');
    });

    it('should be disabled when current date is 7 days ago', () => {
      render(<DateNavigation {...defaultProps} currentDate="2025-12-03" />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      expect(previousButton).toBeDisabled();
      expect(previousButton).toHaveClass('bg-gray-300');
    });

    it('should call onDateChange with previous day when clicked', () => {
      // Current date is 2025-12-09, so previous should be 2025-12-08
      render(<DateNavigation {...defaultProps} currentDate="2025-12-09" />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(previousButton);

      expect(mockOnDateChange).toHaveBeenCalledTimes(1);
      expect(mockOnDateChange).toHaveBeenCalledWith('2025-12-08');
    });

    it('should not call onDateChange when disabled', () => {
      render(<DateNavigation {...defaultProps} currentDate="2025-12-03" />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(previousButton);

      expect(mockOnDateChange).not.toHaveBeenCalled();
    });
  });

  describe('Next Day Button', () => {
    it('should be enabled when current date is before today', () => {
      render(<DateNavigation {...defaultProps} currentDate="2025-12-09" />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
      expect(nextButton).toHaveClass('bg-gray-800');
    });

    it('should be disabled when current date is today', () => {
      render(<DateNavigation {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('bg-gray-300');
    });

    it('should call onDateChange with next day when clicked', () => {
      // Current date is 2025-12-08, so next should be 2025-12-09
      render(<DateNavigation {...defaultProps} currentDate="2025-12-08" />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockOnDateChange).toHaveBeenCalledTimes(1);
      expect(mockOnDateChange).toHaveBeenCalledWith('2025-12-09');
    });

    it('should not call onDateChange when disabled', () => {
      render(<DateNavigation {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockOnDateChange).not.toHaveBeenCalled();
    });
  });

  describe('Date Boundaries', () => {
    it('should prevent navigation to future dates', () => {
      render(<DateNavigation {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should prevent navigation to dates older than 7 days', () => {
      render(<DateNavigation {...defaultProps} currentDate="2025-12-03" />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });

    it('should allow navigation within 7-day window', () => {
      render(<DateNavigation {...defaultProps} currentDate="2025-12-05" />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Localization', () => {
    it('should display Japanese labels when locale is ja', () => {
      render(<DateNavigation {...defaultProps} locale="ja" />);

      expect(screen.getByRole('button', { name: /前日/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /翌日/i })).toBeInTheDocument();
    });

    it('should display English labels when locale is en', () => {
      render(<DateNavigation {...defaultProps} locale="en" />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });
});
