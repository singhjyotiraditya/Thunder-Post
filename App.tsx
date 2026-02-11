import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RequestPanel } from './components/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { SaveDialog } from './components/SaveDialog';
import { ApiRequest, ApiResponse, HistoryItem, HttpMethod, Collection } from './types';
import { generateMockData } from './services/geminiService';

const DEFAULT_REQUEST: ApiRequest = {
  id: crypto.randomUUID(),
  name: 'New Request',
  method: HttpMethod.GET,
  url: '',
  params: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }],
  headers: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }],
  bodyType: 'json',
  bodyContent: '',
};

const STORAGE_KEYS = {
  REQUESTS: 'thunderpost_requests',
  COLLECTIONS: 'thunderpost_collections',
  HISTORY: 'thunderpost_history',
  ACTIVE_ID: 'thunderpost_active_id'
};

const App: React.FC = () => {
  // Initialize state from localStorage or defaults
  const [requests, setRequests] = useState<Record<string, ApiRequest>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      return saved ? JSON.parse(saved) : { [DEFAULT_REQUEST.id]: DEFAULT_REQUEST };
    } catch {
      return { [DEFAULT_REQUEST.id]: DEFAULT_REQUEST };
    }
  });

  const [activeRequestId, setActiveRequestId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID) || DEFAULT_REQUEST.id;
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeRequestId);
  }, [activeRequestId]);


  const activeRequest = requests[activeRequestId] || requests[Object.keys(requests)[0]];

  const handleUpdateRequest = (updated: ApiRequest) => {
    setRequests(prev => ({ ...prev, [updated.id]: updated }));
  };

  const handleNewRequest = () => {
    const newReq = { 
        ...DEFAULT_REQUEST, 
        id: crypto.randomUUID(), 
        params: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }], 
        headers: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }],
        name: 'New Request'
    };
    setRequests(prev => ({ ...prev, [newReq.id]: newReq }));
    setActiveRequestId(newReq.id);
    setResponse(null);
  };

  const handleSelectCollectionRequest = (req: ApiRequest) => {
      // Check if this request is already open
      if (!requests[req.id]) {
          setRequests(prev => ({ ...prev, [req.id]: { ...req } }));
      }
      setActiveRequestId(req.id);
      setResponse(null);
  };

  const handleSelectHistory = (historyId: string) => {
      if (requests[historyId]) {
          setActiveRequestId(historyId);
          setResponse(null);
      }
  };

  const addToHistory = (req: ApiRequest, status: number) => {
    setHistory(prev => {
        const newItem: HistoryItem = {
            id: req.id,
            method: req.method,
            url: req.url,
            timestamp: Date.now(),
            status
        };
        const filtered = prev.filter(h => h.id !== req.id);
        return [newItem, ...filtered].slice(0, 20);
    });
  };

  const handleSaveRequest = (name: string, collectionId: string | null, newCollectionName?: string) => {
      const updatedRequest = { ...activeRequest, name, collectionId: collectionId || undefined };
      handleUpdateRequest(updatedRequest);

      setCollections(prev => {
          let newCollections = [...prev];
          let targetCollectionId = collectionId;

          if (newCollectionName) {
              const newCollection: Collection = {
                  id: crypto.randomUUID(),
                  name: newCollectionName,
                  requests: [],
                  isOpen: true
              };
              newCollections.push(newCollection);
              targetCollectionId = newCollection.id;
              updatedRequest.collectionId = newCollection.id;
          }

          if (targetCollectionId) {
              return newCollections.map(col => {
                  if (col.id === targetCollectionId) {
                      const exists = col.requests.find(r => r.id === updatedRequest.id);
                      if (exists) {
                          return {
                              ...col,
                              requests: col.requests.map(r => r.id === updatedRequest.id ? updatedRequest : r)
                          };
                      } else {
                          return {
                              ...col,
                              requests: [...col.requests, updatedRequest]
                          };
                      }
                  }
                  return col;
              });
          }
          return newCollections;
      });
  };
  
  const handleToggleCollection = (id: string) => {
      setCollections(prev => prev.map(c => c.id === id ? { ...c, isOpen: !c.isOpen } : c));
  };

  const constructUrl = (req: ApiRequest) => {
    try {
        const urlObj = new URL(req.url);
        req.params.filter(p => p.enabled && p.key).forEach(p => {
            urlObj.searchParams.append(p.key, p.value);
        });
        return urlObj.toString();
    } catch {
        return req.url;
    }
  };

  const executeRequest = async (mockMode: boolean = false) => {
    if (!activeRequest.url && !mockMode) return;
    
    setIsLoading(true);
    setResponse(null);
    const startTime = Date.now();

    try {
      if (mockMode) {
        const schema = activeRequest.bodyType === 'schema' ? activeRequest.bodyContent : '';
        const mockData = await generateMockData(schema || "No explicit schema", activeRequest.url, activeRequest.method);
        
        const endTime = Date.now();
        const mockRes: ApiResponse = {
          status: 200,
          statusText: 'OK',
          data: mockData,
          size: JSON.stringify(mockData).length + ' B',
          time: endTime - startTime,
          headers: { 'Content-Type': 'application/json', 'X-Powered-By': 'Gemini AI' },
          isMock: true
        };
        setResponse(mockRes);
        addToHistory(activeRequest, 200);

      } else {
        const finalUrl = constructUrl(activeRequest);
        const headers: Record<string, string> = {};
        activeRequest.headers.filter(h => h.enabled && h.key).forEach(h => headers[h.key] = h.value);
        
        const options: RequestInit = {
          method: activeRequest.method,
          headers: headers,
        };

        if (activeRequest.method !== HttpMethod.GET && activeRequest.method !== HttpMethod.DELETE) {
          if (activeRequest.bodyType === 'json') {
             try {
                JSON.parse(activeRequest.bodyContent); 
                headers['Content-Type'] = 'application/json';
                options.body = activeRequest.bodyContent;
             } catch {
                options.body = activeRequest.bodyContent;
             }
          } else {
             options.body = activeRequest.bodyContent;
          }
        }

        const res = await fetch(finalUrl, options);
        const endTime = Date.now();
        
        const contentType = res.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            data = await res.text();
        }

        const resHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => resHeaders[k] = v);

        setResponse({
            status: res.status,
            statusText: res.statusText,
            data,
            size: (JSON.stringify(data) || data).length + ' B',
            time: endTime - startTime,
            headers: resHeaders
        });

        addToHistory(activeRequest, res.status);
      }

    } catch (error: any) {
        setResponse({
            status: 0,
            statusText: 'Error',
            data: { error: error.message || 'Network Error or CORS issue' },
            size: '0 B',
            time: Date.now() - startTime,
            headers: {}
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden text-base">
      <Sidebar 
        history={history} 
        collections={collections}
        activeId={activeRequestId}
        onSelectHistory={handleSelectHistory}
        onSelectCollectionRequest={handleSelectCollectionRequest}
        onNewRequest={handleNewRequest}
        onToggleCollection={handleToggleCollection}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="flex-1 grid grid-rows-[60%_40%] lg:grid-rows-1 lg:grid-cols-2 overflow-hidden">
          <div className="h-full border-b lg:border-b-0 lg:border-r border-border min-h-0">
             <RequestPanel 
               request={activeRequest} 
               onUpdateRequest={handleUpdateRequest}
               onSend={() => executeRequest(false)}
               onMockSend={() => executeRequest(true)}
               onSave={() => setIsSaveDialogOpen(true)}
               isLoading={isLoading}
             />
          </div>

          <div className="h-full min-h-0">
             <ResponsePanel response={response} isLoading={isLoading} />
          </div>
        </div>
      </main>

      <SaveDialog 
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        collections={collections}
        onSave={handleSaveRequest}
        initialName={activeRequest.name}
      />
    </div>
  );
};

export default App;