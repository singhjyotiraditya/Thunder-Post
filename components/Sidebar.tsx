import React, { useState, useMemo } from 'react';
import { HistoryItem, HttpMethod, Collection, ApiRequest, Environment } from '../types';
import { Activity, Folder, FolderOpen, ChevronRight, Settings, Upload, Box, ChevronDown, Search, X } from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';

interface SidebarProps {
  width: number;
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
  width,
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
  const [searchQuery, setSearchQuery] = useState('');

  const envOptions = [
      { label: 'No Environment', value: '' },
      ...environments.map(env => ({ label: env.name, value: env.id }))
  ];

  // Filter collections based on search query
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;

    const lowerQuery = searchQuery.toLowerCase();
    
    // Return collections that have matching requests OR matching collection name
    // If collection matches, show all. If request matches, show only matching requests.
    return collections.map(col => {
      const nameMatches = col.name.toLowerCase().includes(lowerQuery);
      const matchingRequests = col.requests.filter(req => 
        req.name.toLowerCase().includes(lowerQuery) || 
        req.url.toLowerCase().includes(lowerQuery)
      );

      if (nameMatches) {
          // If collection name matches, show all requests
          return { ...col, isOpen: true }; 
      }

      if (matchingRequests.length > 0) {
          // If only requests match, show filtered requests
          return { ...col, requests: matchingRequests, isOpen: true };
      }

      return null;
    }).filter(Boolean) as Collection[];
  }, [collections, searchQuery]);

  return (
    <div 
      style={{ width: `${width}px` }}
      className="h-full bg-surface border-r border-border flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="p-5 border-b border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
            <Activity size={24} className="text-white" />
            <span className="truncate">ThunderPost</span>
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
                // Prevent creating new request from resizing sidebar
                onMouseDown={(e) => e.stopPropagation()} 
            >
                <Box size={20} />
            </button>
          </div>
        </div>

        {/* Environment Selector */}
        <div className="flex items-center gap-2">
            <CustomDropdown 
                value={activeEnvironmentId || ''}
                options={envOptions}
                onChange={(val) => onSelectEnvironment(val || null)}
                className="flex-1 min-w-0"
                triggerClassName="py-2 text-xs bg-background rounded-sm"
            />
            <button 
                onClick={onOpenEnvironmentManager}
                className="p-2 bg-background border border-border text-muted hover:text-white rounded-sm transition-colors shrink-0"
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

      {/* Search Bar (Only for Collections) */}
      {activeTab === 'collections' && (
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..." 
              className="w-full bg-background border border-border rounded-sm py-1.5 pl-8 pr-8 text-xs text-white placeholder-muted outline-none focus:border-white transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

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
            
            {filteredCollections.length === 0 && collections.length > 0 && (
                 <div className="p-8 text-center text-muted text-sm">
                    No results found for "{searchQuery}"
                 </div>
            )}

            {filteredCollections.map((collection) => (
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
         <span className="opacity-50">v1.3.0</span>
      </div>
    </div>
  );
};