import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DateNavigation from './DateNavigation';

describe('DateNavigation', () => {
  const mockOnDateChange = vi.fn();

  beforeEach(() => {
    mockOnDateChange.mockClear();
    // Mock current date to 2025-12-10 00:00:00 UTC (09:00:00 JST)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-10T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    currentDate: '2025-12-09', // Yesterday (not today)
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

    it('should be hidden when current date is 7 days ago', () => {
      // If today is 2025-12-10, 7 days ago is 2025-12-03
      // When viewing 2025-12-03, previous button should be hidden
      // because previous day (2025-12-02) would be 8 days ago
      render(<DateNavigation {...defaultProps} currentDate="2025-12-03" />);

      const previousButton = screen.queryByRole('button', { name: /previous/i });
      expect(previousButton).not.toBeInTheDocument();
    });

    it('should call onDateChange with previous day when clicked', () => {
      // Current date is 2025-12-09, so previous should be 2025-12-08
      render(<DateNavigation {...defaultProps} currentDate="2025-12-09" />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(previousButton);

      expect(mockOnDateChange).toHaveBeenCalledTimes(1);
      expect(mockOnDateChange).toHaveBeenCalledWith('2025-12-08');
    });

    it('should not be present when at 7-day limit', () => {
      // If today is 2025-12-10, 7 days ago is 2025-12-03
      // When viewing 2025-12-03, previous button should be hidden
      // because previous day (2025-12-02) would be 8 days ago
      render(<DateNavigation {...defaultProps} currentDate="2025-12-03" />);

      const previousButton = screen.queryByRole('button', { name: /previous/i });
      expect(previousButton).not.toBeInTheDocument();
    });
  });

  describe('Next Day Button', () => {
    it('should be enabled when current date is before today', () => {
      render(<DateNavigation {...defaultProps} currentDate="2025-12-09" />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
      expect(nextButton).toHaveClass('bg-gray-800');
    });

    it('should be hidden when current date is today', () => {
      render(<DateNavigation {...defaultProps} currentDate="2025-12-10" />);

      const nextButton = screen.queryByRole('button', { name: /next/i });
      expect(nextButton).not.toBeInTheDocument();
    });

    it('should call onDateChange with next day when clicked', () => {
      // Current date is 2025-12-08, so next should be 2025-12-09
      render(<DateNavigation {...defaultProps} currentDate="2025-12-08" />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockOnDateChange).toHaveBeenCalledTimes(1);
      expect(mockOnDateChange).toHaveBeenCalledWith('2025-12-09');
    });

    it('should not be present when at today', () => {
      render(<DateNavigation {...defaultProps} currentDate="2025-12-10" />);

      const nextButton = screen.queryByRole('button', { name: /next/i });
      expect(nextButton).not.toBeInTheDocument();
    });
  });

  describe('Date Boundaries', () => {
    it('should hide next button for future dates', () => {
      render(<DateNavigation {...defaultProps} currentDate="2025-12-10" />);

      const nextButton = screen.queryByRole('button', { name: /next/i });
      expect(nextButton).not.toBeInTheDocument();
    });

    it('should hide previous button for dates older than 7 days', () => {
      // If today is 2025-12-10, 7 days ago is 2025-12-03
      // When viewing 2025-12-03, previous button should be hidden
      // because previous day (2025-12-02) would be 8 days ago
      render(<DateNavigation {...defaultProps} currentDate="2025-12-03" />);

      const previousButton = screen.queryByRole('button', { name: /previous/i });
      expect(previousButton).not.toBeInTheDocument();
    });

    it('should show both buttons within 7-day window', () => {
      render(<DateNavigation {...defaultProps} currentDate="2025-12-05" />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(previousButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
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

  describe('Loading State', () => {
    it('should disable buttons when isLoading is true', () => {
      render(<DateNavigation {...defaultProps} isLoading={true} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(previousButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should apply loading styles when isLoading is true', () => {
      render(<DateNavigation {...defaultProps} isLoading={true} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(previousButton).toHaveClass('bg-gray-300');
      expect(previousButton).toHaveClass('text-gray-500');
      expect(previousButton).toHaveClass('cursor-not-allowed');
      
      expect(nextButton).toHaveClass('bg-gray-300');
      expect(nextButton).toHaveClass('text-gray-500');
      expect(nextButton).toHaveClass('cursor-not-allowed');
    });

    it('should not call onDateChange when buttons are clicked during loading', () => {
      render(<DateNavigation {...defaultProps} isLoading={true} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      fireEvent.click(previousButton);
      fireEvent.click(nextButton);

      expect(mockOnDateChange).not.toHaveBeenCalled();
    });

    it('should enable buttons when isLoading is false', () => {
      render(<DateNavigation {...defaultProps} isLoading={false} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
      expect(previousButton).toHaveClass('bg-gray-800');
      expect(nextButton).toHaveClass('bg-gray-800');
    });
  });
});
