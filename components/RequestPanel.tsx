import React, { useState } from 'react';
import { ApiRequest, HttpMethod, TabType } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { Play, Sparkles, Save, ChevronDown } from 'lucide-react';

interface RequestPanelProps {
  request: ApiRequest;
  onUpdateRequest: (req: ApiRequest) => void;
  onSend: () => void;
  onMockSend: () => void;
  onSave: () => void;
  isLoading: boolean;
}

export const RequestPanel: React.FC<RequestPanelProps> = ({ request, onUpdateRequest, onSend, onMockSend, onSave, isLoading }) => {
  const [activeTab, setActiveTab] = useState<TabType>('params');

  const updateField = (field: keyof ApiRequest, value: any) => {
    onUpdateRequest({ ...request, [field]: value });
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'params', label: 'Query Params', count: request.params.filter(p => p.key).length },
    { id: 'headers', label: 'Headers', count: request.headers.filter(h => h.key).length },
    { id: 'body', label: 'JSON Body' },
    { id: 'schema', label: 'AI Mock' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Top Bar / URL */}
      <div className="p-5 border-b border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 overflow-hidden">
             <span className="text-lg font-bold truncate text-white">{request.name}</span>
             {request.collectionId && <span className="text-xs text-muted px-2 py-0.5 border border-border rounded">Saved</span>}
           </div>
           <button 
              onClick={onSave}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted hover:text-white transition-colors border border-transparent hover:border-border rounded"
           >
              <Save size={16} />
              Save
           </button>
        </div>

        <div className="flex gap-2 items-stretch h-12">
          <div className="relative group">
              <select
                value={request.method}
                onChange={(e) => updateField('method', e.target.value)}
                className="h-full appearance-none bg-surface border border-border rounded-l px-4 pr-8 font-bold text-sm outline-none focus:border-white focus:ring-0 cursor-pointer text-white tracking-wider"
              >
                {Object.values(HttpMethod).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                <ChevronDown size={12} />
              </div>
          </div>
          
          <input
            type="text"
            value={request.url}
            onChange={(e) => updateField('url', e.target.value)}
            placeholder="https://api.example.com/v1/resource"
            className="flex-1 bg-background border-y border-r border-border px-4 text-base outline-none focus:border-white text-white placeholder-neutral-700 font-mono"
          />
          
          <button
            onClick={onSend}
            disabled={isLoading}
            className={`flex items-center gap-2 px-6 rounded-r font-bold text-sm tracking-wide transition-all
                ${isLoading ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-white text-black hover:bg-neutral-200'}
            `}
          >
            <Play size={16} fill="currentColor" />
            SEND
          </button>
          
          <div className="w-px bg-border mx-2"></div>

          <button
            onClick={onMockSend}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 rounded font-medium text-sm transition-all border
                ${isLoading ? 'border-border text-muted cursor-not-allowed' : 'border-border hover:border-white text-white'}
            `}
            title="Generate a response using AI based on the schema/type defined"
          >
            <Sparkles size={16} />
            Mock
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-5 border-b border-border gap-8 overflow-x-auto bg-background">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap tracking-wide
              ${activeTab === tab.id 
                ? 'border-white text-white' 
                : 'border-transparent text-muted hover:text-white'
              }`}
          >
            {tab.label}
            {tab.count ? <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded-full text-white">{tab.count}</span> : null}
            {tab.id === 'schema' && <Sparkles size={12} className="text-white opacity-70" />}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 bg-background">
        {activeTab === 'params' && (
          <KeyValueEditor 
            items={request.params} 
            onChange={(items) => updateField('params', items)} 
          />
        )}
        
        {activeTab === 'headers' && (
          <KeyValueEditor 
            items={request.headers} 
            onChange={(items) => updateField('headers', items)} 
          />
        )}
        
        {activeTab === 'body' && (
          <div className="h-full flex flex-col">
            <div className="mb-4 flex items-center gap-6 text-sm text-muted font-medium">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input 
                  type="radio" 
                  name="bodyType" 
                  checked={request.bodyType === 'json'}
                  onChange={() => updateField('bodyType', 'json')} 
                  className="accent-white"
                /> 
                Raw JSON
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input 
                  type="radio" 
                  name="bodyType" 
                  checked={request.bodyType === 'text'}
                  onChange={() => updateField('bodyType', 'text')} 
                  className="accent-white"
                /> 
                Text
              </label>
            </div>
            <textarea
              value={request.bodyContent}
              onChange={(e) => updateField('bodyContent', e.target.value)}
              className="flex-1 w-full bg-surface border border-border rounded p-4 font-mono text-sm text-white outline-none focus:border-white resize-none leading-relaxed"
              placeholder={request.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Raw text content'}
              spellCheck={false}
            />
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="h-full flex flex-col">
             <div className="bg-surface border border-border rounded p-4 mb-4 flex gap-3 items-start">
                <div className="p-2 bg-white/10 rounded-full">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">AI Mock Generator</h4>
                  <p className="text-sm text-muted leading-relaxed">
                    Define your data structure using TypeScript interfaces or plain English. 
                    Click the <strong>Mock</strong> button in the top bar to generate realistic data instantly.
                  </p>
                </div>
             </div>
             <textarea
              value={request.bodyType === 'schema' ? request.bodyContent : ''}
              onChange={(e) => {
                  updateField('bodyType', 'schema');
                  updateField('bodyContent', e.target.value);
              }}
              className="flex-1 w-full bg-surface border border-border rounded p-4 font-mono text-sm text-white outline-none focus:border-white resize-none leading-relaxed"
              placeholder={`interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  isActive: boolean;
}

// Or just: "List of 5 users with realistic names"`}
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};