import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CopyrightFreeImage } from './CopyrightFreeImage';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: any) => {
    return (
      <img
        src={src}
        alt={alt}
        onError={onError}
        data-testid="copyright-free-image"
        {...props}
      />
    );
  },
}));

describe('CopyrightFreeImage', () => {
  it('renders with Unsplash URL by default', () => {
    render(<CopyrightFreeImage theme="technology" alt="Tech article" />);

    const img = screen.getByTestId('copyright-free-image');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('source.unsplash.com');
    expect(img.getAttribute('src')).toContain('technology');
  });

  it('uses custom dimensions', () => {
    render(
      <CopyrightFreeImage
        theme="sports"
        alt="Sports article"
        width={1200}
        height={800}
      />
    );

    const img = screen.getByTestId('copyright-free-image');
    expect(img.getAttribute('src')).toContain('1200x800');
  });

  it('encodes theme in URL', () => {
    render(
      <CopyrightFreeImage theme="artificial intelligence" alt="AI article" />
    );

    const img = screen.getByTestId('copyright-free-image');
    expect(img.getAttribute('src')).toContain('artificial%20intelligence');
  });

  it('falls back to placeholder div on error', () => {
    const { container } = render(<CopyrightFreeImage theme="technology" alt="Tech article" />);

    const img = screen.getByTestId('copyright-free-image');

    // Initially shows Unsplash URL
    expect(img.getAttribute('src')).toContain('source.unsplash.com');

    // Trigger error
    fireEvent.error(img);

    // Should now show placeholder div instead of image
    const placeholder = container.querySelector('div.bg-gray-200');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent('Tech article');
  });

  it('applies custom className', () => {
    render(
      <CopyrightFreeImage
        theme="technology"
        alt="Tech article"
        className="custom-class"
      />
    );

    const img = screen.getByTestId('copyright-free-image');
    expect(img).toHaveClass('custom-class');
  });

  it('sets correct alt text', () => {
    render(<CopyrightFreeImage theme="technology" alt="Custom alt text" />);

    const img = screen.getByAltText('Custom alt text');
    expect(img).toBeInTheDocument();
  });
});
