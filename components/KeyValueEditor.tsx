import React from 'react';
import { KeyValueItem } from '../types';
import { Trash2, CheckSquare, Square } from 'lucide-react';

interface KeyValueEditorProps {
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ items, onChange }) => {
  const handleChange = (id: string, field: 'key' | 'value', text: string) => {
    const newItems = items.map(item => item.id === id ? { ...item, [field]: text } : item);
    // Add new empty row if editing the last one
    const lastItem = newItems[newItems.length - 1];
    if (lastItem.key || lastItem.value) {
        newItems.push({ id: crypto.randomUUID(), key: '', value: '', enabled: true });
    }
    onChange(newItems);
  };

  const handleToggle = (id: string) => {
    onChange(items.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const handleDelete = (id: string) => {
    if (items.length <= 1) return; // Keep at least one
    onChange(items.filter(item => item.id !== id));
  };

  return (
    <div className="w-full text-sm font-medium">
      <div className="grid grid-cols-[30px_1fr_1fr_30px] gap-2 border-b border-border pb-3 mb-2 text-muted uppercase tracking-wider text-xs px-2">
        <span></span>
        <span>Key</span>
        <span>Value</span>
        <span></span>
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-[30px_1fr_1fr_30px] gap-2 items-center group px-2 py-1.5 hover:bg-surface rounded transition-colors">
            <button onClick={() => handleToggle(item.id)} className="text-muted hover:text-white transition-colors">
              {item.enabled ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
            <input
              type="text"
              placeholder="Key"
              className="bg-transparent border-b border-transparent focus:border-border outline-none py-1.5 placeholder-neutral-700 transition-colors text-white"
              value={item.key}
              onChange={(e) => handleChange(item.id, 'key', e.target.value)}
            />
            <input
              type="text"
              placeholder="Value"
              className="bg-transparent border-b border-transparent focus:border-border outline-none py-1.5 placeholder-neutral-700 transition-colors text-white"
              value={item.value}
              onChange={(e) => handleChange(item.id, 'value', e.target.value)}
            />
            <button 
              onClick={() => handleDelete(item.id)}
              className="text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};