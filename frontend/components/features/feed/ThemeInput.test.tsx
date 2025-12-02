import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeInput } from './ThemeInput';

describe('ThemeInput', () => {
  it('should render input field and button', () => {
    const onSubmit = vi.fn();

    render(<ThemeInput onSubmit={onSubmit} isLoading={false} locale="en" />);

    expect(screen.getByPlaceholderText(/Enter your interest theme/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Feed Suggestions/ })).toBeInTheDocument();
  });

  it('should render Japanese text when locale is ja', () => {
    const onSubmit = vi.fn();

    render(<ThemeInput onSubmit={onSubmit} isLoading={false} locale="ja" />);

    expect(screen.getByPlaceholderText(/興味のあるテーマを入力してください/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /フィード提案を取得/ })).toBeInTheDocument();
  });

  it('should update input value when typing', () => {
    const onSubmit = vi.fn();

    render(<ThemeInput onSubmit={onSubmit} isLoading={false} locale="en" />);

    const input = screen.getByPlaceholderText(/Enter your interest theme/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Technology' } });

    expect(input.value).toBe('Technology');
  });

  it('should show error when submitting empty input', () => {
    const onSubmit = vi.fn();

    render(<ThemeInput onSubmit={onSubmit} isLoading={false} locale="en" />);

    const button = screen.getByRole('button', { name: /Get Feed Suggestions/ });
    fireEvent.click(button);

    expect(screen.getByText(/Please enter a theme/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should show error when submitting whitespace-only input', () => {
    const onSubmit = vi.fn();

    render(<ThemeInput onSubmit={onSubmit} isLoading={false} locale="en" />);

    const input = screen.getByPlaceholderText(/Enter your interest theme/);
    fireEvent.change(input, { target: { value: '   ' } });

    const button = screen.getByRole('button', { name: /Get Feed Suggestions/ });
    fireEvent.click(button);

    expect(screen.getByText(/Please enter a valid theme/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with trimmed value when valid input is submitted', () => {
    const onSubmit = vi.fn();

    render(<ThemeInput onSubmit={onSubmit} isLoading={false} locale="en" />);

    const input = screen.getByPlaceholderText(/Enter your interest theme/);
    fireEvent.change(input, { target: { value: '  Technology  ' } });

    const button = screen.getByRole('button', { name: /Get Feed Suggestions/ });
    fireEvent.click(button);

    expect(onSubmit).toHaveBeenCalledWith('Technology');
  });

  it('should submit on Enter key press', () => {
    const onSubmit = vi.fn();

    const { container } = render(<ThemeInput onSubmit={onSubmit} isLoading={false} locale="en" />);

    const input = screen.getByPlaceholderText(/Enter your interest theme/);
    fireEvent.change(input, { target: { value: 'Sports' } });
    
    // Pressing Enter in an input inside a form triggers form submission
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    expect(onSubmit).toHaveBeenCalledWith('Sports');
  });

  it('should disable input and button when loading', () => {
    const onSubmit = vi.fn();

    render(<ThemeInput onSubmit={onSubmit} isLoading={true} locale="en" />);

    const input = screen.getByPlaceholderText(/Enter your interest theme/);
    const button = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should clear error when user starts typing', () => {
    const onSubmit = vi.fn();

    render(<ThemeInput onSubmit={onSubmit} isLoading={false} locale="en" />);

    // Submit empty to trigger error
    const button = screen.getByRole('button', { name: /Get Feed Suggestions/ });
    fireEvent.click(button);

    expect(screen.getByText(/Please enter a theme/)).toBeInTheDocument();

    // Start typing
    const input = screen.getByPlaceholderText(/Enter your interest theme/);
    fireEvent.change(input, { target: { value: 'T' } });

    expect(screen.queryByText(/Please enter a theme/)).not.toBeInTheDocument();
  });

  it('should allow button click even when input is empty (to show validation)', () => {
    const onSubmit = vi.fn();

    render(<ThemeInput onSubmit={onSubmit} isLoading={false} locale="en" />);

    const button = screen.getByRole('button', { name: /Get Feed Suggestions/ });
    // Button should not be disabled - we want to show validation errors
    expect(button).not.toBeDisabled();

    const input = screen.getByPlaceholderText(/Enter your interest theme/);
    fireEvent.change(input, { target: { value: '   ' } });

    // Button should still not be disabled
    expect(button).not.toBeDisabled();

    fireEvent.change(input, { target: { value: 'Tech' } });
    expect(button).not.toBeDisabled();
  });
});
