import React, { forwardRef } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
}, ref) {
  const baseStyles = 'font-serif font-bold transition-colors focus:outline-none border-2 border-black';
  
  const variantStyles = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-white text-black hover:bg-gray-100',
    outline: 'bg-white text-black hover:bg-gray-100',
    ghost: 'bg-transparent text-black hover:bg-gray-100 border-transparent',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      ref={ref}
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
});
