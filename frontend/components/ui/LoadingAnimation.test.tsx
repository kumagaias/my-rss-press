import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingAnimation } from './LoadingAnimation';

describe('LoadingAnimation', () => {
  it('renders newspaper type animation by default', () => {
    const { container } = render(<LoadingAnimation />);

    // Check for pen icon (newspaper type)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-bounce');
    
    // Should not have wave bars for newspaper type
    const bars = container.querySelectorAll('.animate-wave');
    expect(bars.length).toBe(0);
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

  it('renders feed type animation when specified', () => {
    const { container } = render(<LoadingAnimation type="feed" />);

    // Check for wave bars (feed type)
    const bars = container.querySelectorAll('.animate-wave');
    expect(bars.length).toBeGreaterThanOrEqual(4);
    
    // Should not have pen icon for feed type
    const svg = container.querySelector('svg');
    expect(svg).toBeNull();
  });

  it('renders newspaper type animation when specified', () => {
    const { container } = render(<LoadingAnimation type="newspaper" />);

    // Check for pen icon (newspaper type)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-bounce');
    
    // Should not have wave bars for newspaper type
    const bars = container.querySelectorAll('.animate-wave');
    expect(bars.length).toBe(0);
  });

  it('has correct structure', () => {
    const { container } = render(<LoadingAnimation message="Please wait..." />);

    // Check for flex container
    const flexContainer = container.querySelector('.flex');
    expect(flexContainer).toBeInTheDocument();
  });
});
