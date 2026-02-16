import React, { useEffect, useRef } from 'react';
import { ApiRequest, HttpMethod } from '../types';
import { X, Plus } from 'lucide-react';

interface TabBarProps {
  tabs: ApiRequest[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

const MethodColor = ({ method }: { method: HttpMethod }) => {
   const colors = {
    [HttpMethod.GET]: 'text-green-500',
    [HttpMethod.POST]: 'text-yellow-500',
    [HttpMethod.PUT]: 'text-blue-500',
    [HttpMethod.DELETE]: 'text-red-500',
    [HttpMethod.PATCH]: 'text-purple-500',
  };
  return <span className={`text-[10px] font-bold ${colors[method]}`}>{method.substring(0, 3)}</span>;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeId, onSelect, onClose, onNew }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (scrollRef.current) {
        const activeElement = scrollRef.current.querySelector(`[data-active="true"]`);
        if (activeElement) {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }
  }, [activeId]);

  return (
    <div className="flex items-center bg-surface border-b border-border w-full">
      <div 
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto no-scrollbar items-center"
      >
        {tabs.map(tab => (
          <div
            key={tab.id}
            data-active={tab.id === activeId}
            onClick={() => onSelect(tab.id)}
            className={`
                group flex items-center gap-2 px-4 py-2.5 min-w-[120px] max-w-[200px] cursor-pointer border-r border-border text-sm select-none transition-colors
                ${tab.id === activeId ? 'bg-background border-t-2 border-t-primary text-white' : 'bg-surface text-muted hover:bg-surfaceHover hover:text-white border-t-2 border-t-transparent'}
            `}
          >
            <MethodColor method={tab.method} />
            <span className="truncate flex-1 font-medium">{tab.name}</span>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                className={`p-0.5 rounded-sm hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity ${tab.id === activeId ? 'opacity-100' : ''}`}
                title="Close Tab"
            >
                <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <button 
        onClick={onNew} 
        className="p-2 text-muted hover:text-white hover:bg-surfaceHover border-l border-border h-full flex items-center justify-center w-10 shrink-0"
        title="New Request"
      >
        <Plus size={18} />
      </button>
    </div>
  );
};