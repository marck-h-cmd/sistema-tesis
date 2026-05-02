'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, User, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Option {
  id: number;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  [key: string]: any;
}

interface ComboBoxProps {
  label: string;
  placeholder: string;
  options: Option[];
  value?: Option | null;
  onChange: (option: Option | null) => void;
  onSearch: (term: string) => void;
  searchTerm: string;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  emptyMessage?: string;
}

export function ComboBox({
  label,
  placeholder,
  options,
  value,
  onChange,
  onSearch,
  searchTerm,
  isLoading = false,
  disabled = false,
  error,
  required = false,
  emptyMessage = 'No se encontraron resultados',
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        {/* Input de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={value ? value.label : searchTerm}
            onChange={(e) => {
              onSearch(e.target.value);
              onChange(null);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full h-10 pl-10 pr-10 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          
          {/* Botón limpiar o flecha */}
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                onSearch('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <ChevronDown
              className={cn(
                "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          )}
        </div>

        {/* Dropdown */}
        {isOpen && !value && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
              </div>
            ) : options.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    {option.icon || (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{option.label}</p>
                      {option.subtitle && (
                        <p className="text-xs text-muted-foreground">{option.subtitle}</p>
                      )}
                    </div>
                    {value?.id === option.id && (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}