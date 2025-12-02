import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage, InlineError } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders error title', () => {
    render(<ErrorMessage message="Test error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const handleRetry = vi.fn();
    render(<ErrorMessage message="Test error" onRetry={handleRetry} />);
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Test error" />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const handleRetry = vi.fn();
    render(<ErrorMessage message="Test error" onRetry={handleRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('uses custom retry label', () => {
    const handleRetry = vi.fn();
    render(
      <ErrorMessage
        message="Test error"
        onRetry={handleRetry}
        retryLabel="Retry Now"
      />
    );
    expect(screen.getByText('Retry Now')).toBeInTheDocument();
  });

  it('renders error icon', () => {
    const { container } = render(<ErrorMessage message="Test error" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

describe('InlineError', () => {
  it('renders error message', () => {
    render(<InlineError message="Inline error message" />);
    expect(screen.getByText('Inline error message')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <InlineError message="Test" className="custom-class" />
    );
    const errorDiv = container.querySelector('.custom-class');
    expect(errorDiv).toBeInTheDocument();
  });

  it('renders error icon', () => {
    const { container } = render(<InlineError message="Test error" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('has red styling', () => {
    const { container } = render(<InlineError message="Test error" />);
    const errorDiv = container.querySelector('.bg-red-50');
    expect(errorDiv).toBeInTheDocument();
  });
});
