import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders checkbox element', () => {
    render(<Checkbox label="Accept terms" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Checkbox label="Subscribe to newsletter" />);
    const label = screen.getByText('Subscribe to newsletter');
    expect(label).toBeInTheDocument();
  });

  it('can be checked and unchecked', () => {
    const handleChange = vi.fn();
    render(<Checkbox label="Test" onChange={handleChange} />);
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays helper text', () => {
    render(<Checkbox label="Option" helperText="Additional info" />);
    const helper = screen.getByText('Additional info');
    expect(helper).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Checkbox label="Required" error="This field is required" />);
    const error = screen.getByText('This field is required');
    expect(error).toBeInTheDocument();
    expect(error).toHaveClass('text-error');
  });

  it('can be disabled', () => {
    render(<Checkbox label="Disabled" disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('applies error styling when error prop is provided', () => {
    render(<Checkbox label="Test" error="Error" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('border-error');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Checkbox label="Test" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('sets aria-invalid when error is present', () => {
    render(<Checkbox label="Test" error="Error" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not show helper text when error is present', () => {
    render(<Checkbox label="Test" error="Error message" helperText="Helper text" />);
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('works without label', () => {
    render(<Checkbox aria-label="Hidden checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('can be controlled', () => {
    const { rerender } = render(<Checkbox label="Test" checked={false} onChange={() => {}} />);
    let checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    rerender(<Checkbox label="Test" checked={true} onChange={() => {}} />);
    checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });
});
