import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Header', () => {
  it('renders app name and tagline', () => {
    render(<Header locale="en" />);
    expect(screen.getByText('MyRSSPress')).toBeInTheDocument();
    expect(screen.getByText(/Your Personalized Morning Digest/)).toBeInTheDocument();
  });

  it('renders Japanese app name and tagline when locale is ja', () => {
    render(<Header locale="ja" />);
    expect(screen.getByText('MyRSSPress')).toBeInTheDocument();
    expect(screen.getByText(/AIがキュレートする/)).toBeInTheDocument();
  });

  it('renders language selector when onLocaleChange is provided', () => {
    const handleLocaleChange = vi.fn();
    render(<Header locale="en" onLocaleChange={handleLocaleChange} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('en');
  });

  it('does not render language selector when onLocaleChange is not provided', () => {
    render(<Header locale="en" />);
    
    const select = screen.queryByRole('combobox');
    expect(select).not.toBeInTheDocument();
  });

  it('calls onLocaleChange when language is changed', () => {
    const handleLocaleChange = vi.fn();
    render(<Header locale="en" onLocaleChange={handleLocaleChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ja' } });
    
    expect(handleLocaleChange).toHaveBeenCalledWith('ja');
  });

  it('has link to home page', () => {
    render(<Header locale="en" />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });
});
