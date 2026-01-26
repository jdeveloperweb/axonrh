'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ==================== Types ====================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ==================== Component ====================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      success,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            id={inputId}
            className={cn(
              'input',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'input-error',
              success && !error && 'input-success',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <span
            id={`${inputId}-error`}
            className="text-sm text-[var(--color-error)] mt-1"
            role="alert"
          >
            {error}
          </span>
        )}

        {hint && !error && (
          <span className="text-sm text-[var(--color-text-secondary)] mt-1">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
