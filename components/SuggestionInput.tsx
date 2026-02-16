import React, { useState, useRef, useEffect } from 'react';
import { KeyValueItem } from '../types';
import { Braces } from 'lucide-react';

interface SuggestionInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  variables: KeyValueItem[];
  textarea?: boolean;
  wrapperClassName?: string;
}

export const SuggestionInput: React.FC<SuggestionInputProps> = ({
  value,
  onChange,
  variables,
  textarea = false,
  className = '',
  wrapperClassName = '',
  ...props
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [filter, setFilter] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    
    // Simple heuristic: look for {{ at the end of the string segment before cursor
    const textBeforeCursor = value.slice(0, cursorIndex);
    const match = textBeforeCursor.match(/\{\{([a-zA-Z0-9_]*)$/);

    if (match && variables.length > 0) {
      setFilter(match[1]);
      setShowSuggestions(true);
      setFocusedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, cursorIndex, variables]);

  const handleSelect = (variable: string) => {
      const textBeforeCursor = value.slice(0, cursorIndex);
      const textAfterCursor = value.slice(cursorIndex);
      
      const match = textBeforeCursor.match(/\{\{([a-zA-Z0-9_]*)$/);
      if (match) {
          const prefix = textBeforeCursor.substring(0, match.index);
          const newValue = `${prefix}{{${variable}}}${textAfterCursor}`;
          onChange(newValue);
          setShowSuggestions(false);
          
          setTimeout(() => {
              if (inputRef.current) {
                  inputRef.current.focus();
                  const newCursorPos = prefix.length + variable.length + 4; 
                  inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
              }
          }, 0);
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCursorIndex(e.target.selectionStart || 0);
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!showSuggestions) {
          if (props.onKeyDown) props.onKeyDown(e);
          return;
      }

      const filtered = variables.filter(v => v.key.toLowerCase().includes(filter.toLowerCase()));

      if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedIndex(i => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedIndex(i => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
          if (filtered.length > 0) {
              e.preventDefault();
              handleSelect(filtered[focusedIndex].key);
          } else {
              setShowSuggestions(false);
          }
      } else if (e.key === 'Escape') {
          setShowSuggestions(false);
      }
  };

  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
              setShowSuggestions(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Component = textarea ? 'textarea' : 'input';
  const filteredVars = variables.filter(v => v.key.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className={`relative w-full ${wrapperClassName}`} ref={containerRef}>
      <Component
        {...props as any}
        ref={inputRef as any}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={(e: any) => setCursorIndex(e.target.selectionStart)}
        onClick={(e: any) => setCursorIndex(e.target.selectionStart)}
        className={className}
        autoComplete="off"
        spellCheck={false}
      />
      
      {showSuggestions && filteredVars.length > 0 && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-surface border border-border rounded shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 p-1">
              <div className="px-2 py-1.5 text-[10px] font-bold text-muted uppercase bg-surface/50">
                  Environment Variables
              </div>
              {filteredVars.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelect(v.key)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-sm
                        ${i === focusedIndex ? 'bg-white text-black' : 'text-white hover:bg-surfaceHover'}
                    `}
                  >
                      <div className="flex items-center gap-2 truncate">
                          <Braces size={12} className={i === focusedIndex ? 'opacity-70' : 'text-muted'} />
                          <span className="font-mono">{v.key}</span>
                      </div>
                      <span className={`text-[10px] truncate max-w-[80px] ${i === focusedIndex ? 'opacity-70' : 'text-muted'}`}>
                          {v.value}
                      </span>
                  </button>
              ))}
          </div>
      )}
    </div>
  );
};