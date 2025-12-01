import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Test input" />);
    const input = screen.getByPlaceholderText('Test input');
    expect(input).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    const label = screen.getByText('Email');
    expect(label).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    const error = screen.getByText('Invalid email');
    expect(error).toBeInTheDocument();
    expect(error).toHaveClass('text-error');
  });

  it('displays helper text', () => {
    render(<Input label="Password" helperText="Must be 8 characters" />);
    const helper = screen.getByText('Must be 8 characters');
    expect(helper).toBeInTheDocument();
    expect(helper).toHaveClass('text-gray-500');
  });

  it('applies error styling when error prop is provided', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-error');
  });

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
  });

  it('supports different input types', () => {
    const { rerender, container } = render(<Input type="email" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    input = container.querySelector('input[type="password"]')!;
    expect(input).toHaveAttribute('type', 'password');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not show helper text when error is present', () => {
    render(<Input error="Error message" helperText="Helper text" />);
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
