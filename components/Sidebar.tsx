import React, { useState } from 'react';
import { HistoryItem, HttpMethod, Collection, ApiRequest, Environment } from '../types';
import { History, Plus, Activity, Box, Folder, FolderOpen, ChevronRight, ChevronDown, MoreHorizontal, Settings, Database, Upload } from 'lucide-react';

interface SidebarProps {
  history: HistoryItem[];
  collections: Collection[];
  activeId: string;
  environments: Environment[];
  activeEnvironmentId: string | null;
  onSelectHistory: (id: string) => void;
  onSelectCollectionRequest: (req: ApiRequest) => void;
  onNewRequest: () => void;
  onToggleCollection: (id: string) => void;
  onSelectEnvironment: (id: string | null) => void;
  onOpenEnvironmentManager: () => void;
  onOpenImport: () => void;
}

const MethodBadge: React.FC<{ method: HttpMethod }> = ({ method }) => {
  const colors = {
    [HttpMethod.GET]: 'text-green-500',
    [HttpMethod.POST]: 'text-yellow-500',
    [HttpMethod.PUT]: 'text-blue-500',
    [HttpMethod.DELETE]: 'text-red-500',
    [HttpMethod.PATCH]: 'text-purple-500',
  };
  return <span className={`text-[10px] font-bold w-10 ${colors[method]}`}>{method.substring(0, 3)}</span>;
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  history, 
  collections, 
  activeId, 
  environments,
  activeEnvironmentId,
  onSelectHistory, 
  onSelectCollectionRequest, 
  onNewRequest,
  onToggleCollection,
  onSelectEnvironment,
  onOpenEnvironmentManager,
  onOpenImport
}) => {
  const [activeTab, setActiveTab] = useState<'collections' | 'history'>('collections');

  return (
    <div className="w-72 h-full bg-surface border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
            <Activity size={24} className="text-white" />
            <span>ThunderPost</span>
          </div>
          <div className="flex items-center gap-1">
            <button 
                onClick={onOpenImport}
                className="p-2 hover:bg-white text-white hover:text-black transition-all rounded-sm"
                title="Import (Postman / cURL)"
            >
                <Upload size={20} />
            </button>
            <button 
                onClick={onNewRequest}
                className="p-2 hover:bg-white text-white hover:text-black transition-all rounded-sm"
                title="New Request"
            >
                <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Environment Selector */}
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <select 
                    value={activeEnvironmentId || ''} 
                    onChange={(e) => onSelectEnvironment(e.target.value || null)}
                    className="w-full appearance-none bg-background border border-border text-xs text-white px-3 py-2 pr-8 rounded-sm outline-none focus:border-white transition-colors cursor-pointer"
                >
                    <option value="">No Environment</option>
                    {environments.map(env => (
                        <option key={env.id} value={env.id}>{env.name}</option>
                    ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
            <button 
                onClick={onOpenEnvironmentManager}
                className="p-2 bg-background border border-border text-muted hover:text-white rounded-sm transition-colors"
                title="Manage Environments"
            >
                <Settings size={14} />
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-colors
            ${activeTab === 'collections' ? 'bg-surface text-white border-b-2 border-white' : 'text-muted hover:text-white hover:bg-surfaceHover'}`}
        >
          Collections
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-colors
            ${activeTab === 'history' ? 'bg-surface text-white border-b-2 border-white' : 'text-muted hover:text-white hover:bg-surfaceHover'}`}
        >
          History
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'collections' && (
          <div className="p-2 flex flex-col gap-1">
            {collections.length === 0 && (
              <div className="p-8 text-center">
                <Folder size={32} className="mx-auto text-muted mb-3 opacity-20" />
                <p className="text-muted text-sm">No collections yet.</p>
                <p className="text-muted text-xs mt-1">Save a request to create one.</p>
              </div>
            )}
            {collections.map((collection) => (
              <div key={collection.id} className="mb-1">
                <button
                  onClick={() => onToggleCollection(collection.id)}
                  className="w-full flex items-center gap-2 p-2 text-sm font-medium text-muted hover:text-white hover:bg-surfaceHover transition-colors rounded-sm group"
                >
                   {collection.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                   {collection.isOpen ? <FolderOpen size={16} className="text-white" /> : <Folder size={16} />}
                   <span className="flex-1 text-left truncate">{collection.name}</span>
                   <span className="text-[10px] bg-border px-1.5 py-0.5 rounded text-muted group-hover:text-white">
                     {collection.requests.length}
                   </span>
                </button>
                
                {collection.isOpen && (
                  <div className="ml-2 pl-2 border-l border-border mt-1 flex flex-col gap-1">
                    {collection.requests.map(req => (
                      <button
                        key={req.id}
                        onClick={() => onSelectCollectionRequest(req)}
                        className={`w-full flex items-center gap-3 p-2 text-sm text-left transition-colors rounded-sm
                          ${activeId === req.id 
                            ? 'bg-white text-black' 
                            : 'text-muted hover:text-white hover:bg-surfaceHover'
                          }`}
                      >
                        <MethodBadge method={req.method} />
                        <span className="truncate font-medium">{req.name}</span>
                      </button>
                    ))}
                    {collection.requests.length === 0 && (
                       <div className="px-4 py-2 text-xs text-muted italic">Empty collection</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col">
             {history.length === 0 && (
                <div className="p-8 text-center text-muted text-sm">No recent requests.</div>
             )}
             {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectHistory(item.id)}
                className={`px-5 py-4 flex items-center gap-3 text-sm text-left transition-all border-b border-border/50
                  ${activeId === item.id 
                    ? 'bg-surfaceHover text-white' 
                    : 'text-muted hover:text-white hover:bg-surfaceHover'
                  }`}
              >
                <MethodBadge method={item.method} />
                <span className="truncate flex-1 font-mono text-xs opacity-80">{item.url || 'Untitled Request'}</span>
                {item.status && (
                  <span className={`text-[10px] font-bold ${item.status >= 200 && item.status < 300 ? 'text-green-500' : 'text-red-500'}`}>
                    {item.status}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border text-xs text-muted flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Box size={14} />
            <span>Workspace</span>
         </div>
         <span className="opacity-50">v1.1.0</span>
      </div>
    </div>
  );
};