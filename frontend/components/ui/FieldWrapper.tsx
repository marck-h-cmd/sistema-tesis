import React from 'react';
import { cn } from '@/lib/utils/cn';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string | null;
  success?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldWrapper({
  label,
  required,
  error,
  success,
  hint,
  children,
  className,
}: FieldWrapperProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium leading-none">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Inject error/success border into child via wrapper */}
      <div
        className={cn(
          '[&_input]:transition-colors [&_textarea]:transition-colors [&_select]:transition-colors',
          error &&
            '[&_input]:border-red-400 [&_input]:focus-visible:ring-red-400 [&_textarea]:border-red-400 [&_textarea]:focus-visible:ring-red-400 [&_select]:border-red-400',
          success &&
            '[&_input]:border-green-400 [&_input]:focus-visible:ring-green-400 [&_textarea]:border-green-400 [&_textarea]:focus-visible:ring-green-400 [&_select]:border-green-400',
        )}
      >
        {children}
      </div>

      {/* Error message */}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600 animate-in slide-in-from-top-1 duration-150">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Success indicator */}
      {!error && success && (
        <p className="flex items-center gap-1 text-xs text-green-600 animate-in slide-in-from-top-1 duration-150">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          Válido
        </p>
      )}

      {/* Hint */}
      {!error && hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}