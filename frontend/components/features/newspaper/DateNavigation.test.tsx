import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DateNavigation } from './DateNavigation';

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
    currentDate: new Date('2025-12-10T00:00:00+09:00'),
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
      expect(previousButton).toHaveClass('bg-blue-600');
    });

    it('should be disabled when current date is 7 days ago', () => {
      const sevenDaysAgo = new Date('2025-12-03T00:00:00+09:00');
      render(<DateNavigation {...defaultProps} currentDate={sevenDaysAgo} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      expect(previousButton).toBeDisabled();
      expect(previousButton).toHaveClass('bg-gray-300');
    });

    it('should call onDateChange with previous day when clicked', () => {
      render(<DateNavigation {...defaultProps} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(previousButton);

      expect(mockOnDateChange).toHaveBeenCalledTimes(1);
      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.getDate()).toBe(9); // December 9
    });

    it('should not call onDateChange when disabled', () => {
      const sevenDaysAgo = new Date('2025-12-03T00:00:00+09:00');
      render(<DateNavigation {...defaultProps} currentDate={sevenDaysAgo} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(previousButton);

      expect(mockOnDateChange).not.toHaveBeenCalled();
    });
  });

  describe('Next Day Button', () => {
    it('should be enabled when current date is before today', () => {
      const yesterday = new Date('2025-12-09T00:00:00+09:00');
      render(<DateNavigation {...defaultProps} currentDate={yesterday} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
      expect(nextButton).toHaveClass('bg-blue-600');
    });

    it('should be disabled when current date is today', () => {
      render(<DateNavigation {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('bg-gray-300');
    });

    it('should call onDateChange with next day when clicked', () => {
      const yesterday = new Date('2025-12-09T00:00:00+09:00');
      render(<DateNavigation {...defaultProps} currentDate={yesterday} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockOnDateChange).toHaveBeenCalledTimes(1);
      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.getDate()).toBe(10); // December 10
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
      const sevenDaysAgo = new Date('2025-12-03T00:00:00+09:00');
      render(<DateNavigation {...defaultProps} currentDate={sevenDaysAgo} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });

    it('should allow navigation within 7-day window', () => {
      const fiveDaysAgo = new Date('2025-12-05T00:00:00+09:00');
      render(<DateNavigation {...defaultProps} currentDate={fiveDaysAgo} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Localization', () => {
    it('should display Japanese labels when locale is ja', () => {
      render(<DateNavigation {...defaultProps} locale="ja" />);

      expect(screen.getByText('前日')).toBeInTheDocument();
      expect(screen.getByText('翌日')).toBeInTheDocument();
    });

    it('should display English labels when locale is en', () => {
      render(<DateNavigation {...defaultProps} locale="en" />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });
});
