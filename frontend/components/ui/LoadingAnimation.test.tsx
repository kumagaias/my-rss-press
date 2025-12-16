import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingAnimation } from './LoadingAnimation';

describe('LoadingAnimation', () => {
  it('renders vertical bars animation', () => {
    const { container } = render(<LoadingAnimation />);

    // Check for vertical bars (should have 5 bars)
    const bars = container.querySelectorAll('.animate-pulse');
    expect(bars.length).toBeGreaterThanOrEqual(5);
  });

  it('renders without message', () => {
    const { container } = render(<LoadingAnimation />);

    // Should not have any text
    const text = container.querySelector('p');
    expect(text).toBeNull();
  });

  it('renders with custom message', () => {
    render(<LoadingAnimation message="Generating newspaper..." />);

    const message = screen.getByText('Generating newspaper...');
    expect(message).toBeInTheDocument();
  });

  it('renders newspaper type animation by default', () => {
    const { container } = render(<LoadingAnimation />);

    // Check for pen icon (newspaper type)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-bounce');
  });

  it('renders feed type animation when specified', () => {
    const { container } = render(<LoadingAnimation type="feed" />);

    // Check for RSS icon (feed type)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Check for ping animation (RSS waves)
    const pingElements = container.querySelectorAll('.animate-ping');
    expect(pingElements.length).toBeGreaterThan(0);
  });

  it('has correct structure', () => {
    const { container } = render(<LoadingAnimation message="Please wait..." />);

    // Check for flex container
    const flexContainer = container.querySelector('.flex');
    expect(flexContainer).toBeInTheDocument();

    // Check for vertical bars container
    const barsContainer = container.querySelector('.flex.gap-2');
    expect(barsContainer).toBeInTheDocument();
  });
});
