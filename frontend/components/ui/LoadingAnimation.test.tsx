import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingAnimation } from './LoadingAnimation';

describe('LoadingAnimation', () => {
  it('renders spinner', () => {
    const { container } = render(<LoadingAnimation />);

    // Check for spinner elements
    const spinners = container.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);
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

  it('applies animation classes', () => {
    const { container } = render(<LoadingAnimation message="Loading..." />);

    // Check for animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();

    // Check for animate-pulse class on message
    const message = screen.getByText('Loading...');
    expect(message).toHaveClass('animate-pulse');
  });

  it('has correct structure', () => {
    const { container } = render(<LoadingAnimation message="Please wait..." />);

    // Check for flex container
    const flexContainer = container.querySelector('.flex');
    expect(flexContainer).toBeInTheDocument();

    // Check for spinner container
    const spinnerContainer = container.querySelector('.relative');
    expect(spinnerContainer).toBeInTheDocument();
  });
});
