import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopicMarquee } from './TopicMarquee';

describe('TopicMarquee', () => {
  const mockKeywords = ['Technology', 'Sports', 'Business'];
  const mockOnKeywordClick = vi.fn();

  it('renders all keywords', () => {
    render(
      <TopicMarquee keywords={mockKeywords} onKeywordClick={mockOnKeywordClick} />
    );

    // Keywords are duplicated for seamless loop, so each appears twice
    const technologyButtons = screen.getAllByText('Technology');
    expect(technologyButtons).toHaveLength(2);
  });

  it('calls onKeywordClick when a keyword is clicked', () => {
    render(
      <TopicMarquee keywords={mockKeywords} onKeywordClick={mockOnKeywordClick} />
    );

    const technologyButton = screen.getAllByText('Technology')[0];
    fireEvent.click(technologyButton);

    expect(mockOnKeywordClick).toHaveBeenCalledWith('Technology');
    expect(mockOnKeywordClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct styling classes', () => {
    const { container } = render(
      <TopicMarquee keywords={mockKeywords} onKeywordClick={mockOnKeywordClick} />
    );

    // Check for marquee animation class
    const marqueeElement = container.querySelector('.animate-marquee-slow');
    expect(marqueeElement).toBeInTheDocument();
  });

  it('renders keywords as buttons with hover effects', () => {
    render(
      <TopicMarquee keywords={mockKeywords} onKeywordClick={mockOnKeywordClick} />
    );

    const button = screen.getAllByText('Technology')[0];
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveClass('hover:bg-black');
    expect(button).toHaveClass('hover:text-white');
  });
});
