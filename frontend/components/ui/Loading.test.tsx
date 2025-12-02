import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading, LoadingSpinner } from './Loading';

describe('Loading', () => {
  it('renders loading spinner', () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with message', () => {
    render(<Loading message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders without message', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders small size', () => {
    const { container } = render(<Loading size="sm" />);
    const spinner = container.querySelector('.w-6');
    expect(spinner).toBeInTheDocument();
  });

  it('renders medium size by default', () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector('.w-10');
    expect(spinner).toBeInTheDocument();
  });

  it('renders large size', () => {
    const { container } = render(<Loading size="lg" />);
    const spinner = container.querySelector('.w-16');
    expect(spinner).toBeInTheDocument();
  });
});

describe('LoadingSpinner', () => {
  it('renders spinner', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const spinner = container.querySelector('.custom-class');
    expect(spinner).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { container: smallContainer } = render(<LoadingSpinner size="sm" />);
    expect(smallContainer.querySelector('.w-4')).toBeInTheDocument();

    const { container: mediumContainer } = render(<LoadingSpinner size="md" />);
    expect(mediumContainer.querySelector('.w-6')).toBeInTheDocument();

    const { container: largeContainer } = render(<LoadingSpinner size="lg" />);
    expect(largeContainer.querySelector('.w-8')).toBeInTheDocument();
  });
});
