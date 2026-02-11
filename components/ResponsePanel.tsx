import React, { useState, useMemo } from 'react';
import { ApiResponse } from '../types';
import { Clock, Database, Copy, Check, Terminal, Table as TableIcon, Code, List } from 'lucide-react';

interface ResponsePanelProps {
  response: ApiResponse | null;
  isLoading: boolean;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({ response, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'body' | 'table' | 'headers'>('body');

  const handleCopy = () => {
    if (response?.data) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Logic to determine if table view is available and prepare data
  const tableData = useMemo(() => {
    if (!response || !response.data) return null;
    
    // Case 1: Array of objects
    if (Array.isArray(response.data) && response.data.length > 0 && typeof response.data[0] === 'object') {
        const headers = Array.from(new Set(response.data.flatMap(item => Object.keys(item || {}))));
        return { type: 'array', headers, rows: response.data };
    }
    
    // Case 2: Single Object
    if (typeof response.data === 'object' && response.data !== null && !Array.isArray(response.data)) {
        return { type: 'object', headers: ['Key', 'Value'], rows: Object.entries(response.data) };
    }

    return null;
  }, [response]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted gap-6 bg-surface/50">
        <div className="w-12 h-12 border-2 border-border border-t-white rounded-full animate-spin"></div>
        <p className="animate-pulse font-medium tracking-wide">PROCESSING REQUEST...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted gap-4 opacity-40 bg-surface/30">
        <div className="p-6 bg-surface rounded-full border border-border">
            <Terminal size={48} />
        </div>
        <p className="font-medium tracking-wide">READY FOR REQUEST</p>
      </div>
    );
  }

  const isError = response.status >= 400;
  const statusColor = response.status < 300 ? 'text-green-500' : response.status < 400 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border">
      {/* Response Meta */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center gap-6 text-sm">
          <span className={`font-bold ${statusColor} flex items-center gap-2 bg-surface px-3 py-1 rounded border border-border`}>
             <span className={`w-2 h-2 rounded-full ${response.status < 300 ? 'bg-green-500' : 'bg-red-500'}`}></span>
             {response.status} {response.statusText}
          </span>
          <span className="text-muted flex items-center gap-1.5 font-mono text-xs">
            <Clock size={14} />
            {response.time}ms
          </span>
          <span className="text-muted flex items-center gap-1.5 font-mono text-xs">
            <Database size={14} />
            {response.size}
          </span>
          {response.isMock && (
             <span className="text-white bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/20">
               AI Mock
             </span>
          )}
        </div>
        
        <div className="flex gap-2">
           <button onClick={handleCopy} className="p-2 text-muted hover:text-white rounded hover:bg-white/10 transition-colors" title="Copy JSON">
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
           </button>
        </div>
      </div>

      {/* Response Tabs */}
      <div className="flex border-b border-border px-5 gap-6 text-sm bg-background">
          <button 
             onClick={() => setActiveTab('body')}
             className={`py-3 font-semibold border-b-2 transition-colors tracking-wide flex items-center gap-2 ${activeTab === 'body' ? 'border-white text-white' : 'border-transparent text-muted hover:text-white'}`}
          >
             <Code size={14} /> JSON
          </button>
          {tableData && (
             <button 
                onClick={() => setActiveTab('table')}
                className={`py-3 font-semibold border-b-2 transition-colors tracking-wide flex items-center gap-2 ${activeTab === 'table' ? 'border-white text-white' : 'border-transparent text-muted hover:text-white'}`}
             >
                <TableIcon size={14} /> Table
             </button>
          )}
          <button 
             onClick={() => setActiveTab('headers')}
             className={`py-3 font-semibold border-b-2 transition-colors tracking-wide flex items-center gap-2 ${activeTab === 'headers' ? 'border-white text-white' : 'border-transparent text-muted hover:text-white'}`}
          >
             <List size={14} /> Headers
          </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-0 relative group bg-background">
        {activeTab === 'body' && (
           <pre className="p-5 text-sm font-mono text-white/90 bg-background min-h-full m-0 tab-4 leading-relaxed whitespace-pre-wrap break-words">
            {typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
           </pre>
        )}
        
        {activeTab === 'table' && tableData && (
            <div className="p-5 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr>
                            {tableData.headers.map((header) => (
                                <th key={header} className="border-b border-border p-3 text-muted font-medium bg-surface/50 whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.type === 'array' ? (
                            (tableData.rows as any[]).map((row, idx) => (
                                <tr key={idx} className="group hover:bg-surface/30">
                                    {tableData.headers.map((header) => (
                                        <td key={`${idx}-${header}`} className="border-b border-border p-3 text-white/90 truncate max-w-[200px] group-hover:text-white">
                                            {typeof row[header] === 'object' 
                                                ? JSON.stringify(row[header]) 
                                                : String(row[header] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            (tableData.rows as [string, any][]).map(([key, value]) => (
                                <tr key={key} className="group hover:bg-surface/30">
                                    <td className="border-b border-border p-3 font-medium text-white/80">{key}</td>
                                    <td className="border-b border-border p-3 text-white/90">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'headers' && (
           <div className="p-5">
              <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm font-mono">
                 {Object.entries(response.headers).map(([k, v]) => (
                    <React.Fragment key={k}>
                       <span className="text-muted text-right">{k}:</span>
                       <span className="text-white break-all">{v}</span>
                    </React.Fragment>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};