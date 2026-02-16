import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
  label: string | React.ReactNode;
  value: string;
}

interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className = '',
  triggerClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-surface border border-border px-3 py-2 text-sm text-white hover:border-white transition-colors outline-none focus:border-white whitespace-nowrap ${triggerClassName}`}
        type="button"
      >
        <span className="truncate flex-1 text-left">
          {selectedOption ? selectedOption.label : <span className="text-muted">{placeholder}</span>}
        </span>
        <ChevronDown size={14} className={`ml-2 text-muted transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[120px] bg-surface border border-border rounded shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-surfaceHover transition-colors flex items-center
                ${option.value === value ? 'text-white bg-white/5' : 'text-muted hover:text-white'}
              `}
              type="button"
            >
              {option.label}
            </button>
          ))}
          {options.length === 0 && (
            <div className="p-3 text-xs text-muted text-center italic">No options</div>
          )}
        </div>
      )}
    </div>
  );
};