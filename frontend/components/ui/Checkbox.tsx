import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, error, className = '', ...props }, ref) => {
    const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={`
              w-4 h-4 text-primary-500 border-gray-300 rounded
              focus:ring-2 focus:ring-primary-500 focus:ring-offset-0
              disabled:cursor-not-allowed disabled:opacity-50
              transition-colors
              ${error ? 'border-error' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${checkboxId}-error` : helperText ? `${checkboxId}-helper` : undefined
            }
            {...props}
          />
        </div>
        {(label || helperText || error) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                htmlFor={checkboxId}
                className={`font-medium ${
                  props.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'
                }`}
              >
                {label}
              </label>
            )}
            {helperText && !error && (
              <p id={`${checkboxId}-helper`} className="text-gray-500 mt-0.5">
                {helperText}
              </p>
            )}
            {error && (
              <p id={`${checkboxId}-error`} className="text-error mt-0.5" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
