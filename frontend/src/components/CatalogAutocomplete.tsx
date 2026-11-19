import React, { useState, useEffect, useRef } from 'react';
import { LucideIcon, Check, Plus, Loader2, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface CatalogItem {
  id: number;
  name: string;
  subtitle?: string;
  isVerified?: boolean;
}

interface CatalogAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  selectedId?: number;
  icon: LucideIcon;
  onSearch: (query: string) => Promise<CatalogItem[]>;
  onSelect: (item: CatalogItem) => void;
  onAddCustom?: (name: string) => Promise<CatalogItem>;
  onClear?: () => void;
  disabled?: boolean;
  required?: boolean;
}

export const CatalogAutocomplete: React.FC<CatalogAutocompleteProps> = ({
  label,
  placeholder,
  value,
  selectedId: _selectedId,
  icon: Icon,
  onSearch,
  onSelect,
  onAddCustom,
  onClear,
  disabled = false,
  required = false,
}) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await onSearch(text);
        setSuggestions(results);
      } catch (err) {
        console.error('Catalog search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const handleFocus = async () => {
    setIsOpen(true);
    if (suggestions.length === 0) {
      try {
        setLoading(true);
        const results = await onSearch(inputValue);
        setSuggestions(results);
      } catch (err) {
        console.error('Catalog initial search error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectItem = (item: CatalogItem) => {
    setInputValue(item.name);
    setIsOpen(false);
    onSelect(item);
  };

  const handleAddCustom = async () => {
    if (!onAddCustom || !inputValue.trim()) return;
    try {
      setAddingCustom(true);
      const newItem = await onAddCustom(inputValue.trim());
      setInputValue(newItem.name);
      setIsOpen(false);
      onSelect(newItem);
    } catch (err) {
      console.error('Failed to add custom catalog item:', err);
    } finally {
      setAddingCustom(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    if (onClear) onClear();
  };

  const hasExactMatch = suggestions.some(
    (s) => s.name.trim().toLowerCase() === inputValue.trim().toLowerCase()
  );

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: theme.secondaryText }}>
        {label} {required && <span className="opacity-70">*</span>}
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: theme.secondaryText }}>
          <Icon className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 border rounded-xl text-xs outline-none transition-colors disabled:opacity-50"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
            color: theme.primaryText,
          }}
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: theme.secondaryText }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 border rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          {loading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs" style={{ color: theme.secondaryText }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Searching catalog...</span>
            </div>
          ) : (
            <>
              {suggestions.map((item) => {
                const isSelected = item.name.toLowerCase() === inputValue.toLowerCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className="w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors"
                    style={{
                      backgroundColor: isSelected ? theme.accentMuted : 'transparent',
                      color: isSelected ? theme.accent : theme.primaryText,
                      borderColor: theme.border,
                    }}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium truncate">{item.name}</div>
                      {item.subtitle && (
                        <div className="text-[11px] truncate opacity-70" style={{ color: theme.secondaryText }}>{item.subtitle}</div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: theme.accent }} />}
                  </button>
                );
              })}

              {!hasExactMatch && inputValue.trim().length > 1 && onAddCustom && (
                <button
                  type="button"
                  onClick={handleAddCustom}
                  disabled={addingCustom}
                  className="w-full px-3.5 py-2.5 text-left text-xs flex items-center gap-2 font-medium transition-colors"
                  style={{
                    backgroundColor: theme.card,
                    color: theme.accent,
                    borderColor: theme.border,
                  }}
                >
                  {addingCustom ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span className="truncate">Add &ldquo;{inputValue.trim()}&rdquo;</span>
                </button>
              )}

              {suggestions.length === 0 && !inputValue.trim() && (
                <div className="p-3 text-xs text-center" style={{ color: theme.secondaryText }}>
                  Start typing to search or create
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
