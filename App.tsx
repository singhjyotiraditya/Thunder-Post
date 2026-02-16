import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RequestPanel } from './components/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { SaveDialog } from './components/SaveDialog';
import { EnvironmentManager } from './components/EnvironmentManager';
import { ImportDialog } from './components/ImportDialog';
import { TabBar } from './components/TabBar';
import { ApiRequest, ApiResponse, HistoryItem, HttpMethod, Collection, Environment, KeyValueItem, AuthConfig } from './types';
import { generateMockData } from './services/geminiService';
import { parsePostmanCollection, parseCurl } from './utils/importers';

const DEFAULT_AUTH: AuthConfig = {
  type: 'none',
  bearerToken: '',
  basicUsername: '',
  basicPassword: '',
  apiKeyKey: '',
  apiKeyValue: '',
  apiKeyLocation: 'header'
};

const DEFAULT_REQUEST: ApiRequest = {
  id: crypto.randomUUID(),
  name: 'New Request',
  method: HttpMethod.GET,
  url: '',
  params: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }],
  headers: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }],
  bodyType: 'json',
  bodyContent: '',
  auth: DEFAULT_AUTH
};

const STORAGE_KEYS = {
  REQUESTS: 'thunderpost_requests',
  COLLECTIONS: 'thunderpost_collections',
  HISTORY: 'thunderpost_history',
  ACTIVE_ID: 'thunderpost_active_id',
  OPEN_IDS: 'thunderpost_open_ids',
  ENVIRONMENTS: 'thunderpost_environments',
  ACTIVE_ENV_ID: 'thunderpost_active_env_id'
};

const App: React.FC = () => {
  // --- STATE ---
  const [requests, setRequests] = useState<Record<string, ApiRequest>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      const parsed = saved ? JSON.parse(saved) : { [DEFAULT_REQUEST.id]: DEFAULT_REQUEST };
      // Migration: Ensure auth object exists for old requests
      Object.values(parsed).forEach((req: any) => {
          if (!req.auth) req.auth = { ...DEFAULT_AUTH };
      });
      return parsed;
    } catch {
      return { [DEFAULT_REQUEST.id]: DEFAULT_REQUEST };
    }
  });

  const [activeRequestId, setActiveRequestId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID) || DEFAULT_REQUEST.id;
  });

  const [openRequestIds, setOpenRequestIds] = useState<string[]>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.OPEN_IDS);
        const ids = saved ? JSON.parse(saved) : [DEFAULT_REQUEST.id];
        return ids.length ? ids : [DEFAULT_REQUEST.id];
    } catch {
        return [DEFAULT_REQUEST.id];
    }
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

  const [environments, setEnvironments] = useState<Environment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeEnvironmentId, setActiveEnvironmentId] = useState<string | null>(() => {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_ENV_ID) || null;
  });
  
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isEnvManagerOpen, setIsEnvManagerOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections)); }, [collections]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeRequestId); }, [activeRequestId]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.OPEN_IDS, JSON.stringify(openRequestIds)); }, [openRequestIds]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(environments)); }, [environments]);
  useEffect(() => { 
      if(activeEnvironmentId) localStorage.setItem(STORAGE_KEYS.ACTIVE_ENV_ID, activeEnvironmentId);
      else localStorage.removeItem(STORAGE_KEYS.ACTIVE_ENV_ID);
  }, [activeEnvironmentId]);


  // --- HANDLERS ---
  const activeRequest = requests[activeRequestId] || requests[Object.keys(requests)[0]];

  // Ensure active request is in open set (e.g. on first load)
  useEffect(() => {
    if (activeRequestId && !openRequestIds.includes(activeRequestId) && requests[activeRequestId]) {
        setOpenRequestIds(prev => [...prev, activeRequestId]);
    }
  }, [activeRequestId, requests]);

  const handleUpdateRequest = (updated: ApiRequest) => {
    setRequests(prev => ({ ...prev, [updated.id]: updated }));
  };

  const handleOpenTab = (id: string) => {
      if (!openRequestIds.includes(id)) {
          setOpenRequestIds(prev => [...prev, id]);
      }
      setActiveRequestId(id);
      setResponse(null); // Clear response on switch
  };

  const handleCloseTab = (id: string) => {
      const newOpenIds = openRequestIds.filter(pid => pid !== id);
      setOpenRequestIds(newOpenIds);

      if (id === activeRequestId) {
          // If closing active tab, switch to another
          if (newOpenIds.length > 0) {
             // Switch to the last opened one (or next neighbor)
             setActiveRequestId(newOpenIds[newOpenIds.length - 1]);
          } else {
             // If closed last tab, create a new one
             handleNewRequest();
          }
      }
      // Note: We keep the request in `requests` map so it can be reopened from history/collections
  };

  const handleNewRequest = () => {
    const newReq = { 
        ...DEFAULT_REQUEST, 
        id: crypto.randomUUID(), 
        params: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }], 
        headers: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }],
        name: 'New Request',
        auth: { ...DEFAULT_AUTH }
    };
    setRequests(prev => ({ ...prev, [newReq.id]: newReq }));
    handleOpenTab(newReq.id);
  };

  const handleSelectCollectionRequest = (req: ApiRequest) => {
      // Ensure the request has auth property if loaded from old collection data
      const reqWithAuth = req.auth ? req : { ...req, auth: { ...DEFAULT_AUTH } };
      
      if (!requests[req.id]) {
          setRequests(prev => ({ ...prev, [req.id]: { ...reqWithAuth } }));
      }
      handleOpenTab(req.id);
  };

  const handleSelectHistory = (historyId: string) => {
      if (requests[historyId]) {
          handleOpenTab(historyId);
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

  const handleImportFile = async (file: File) => {
      const text = await file.text();
      try {
          const json = JSON.parse(text);
          const newCollection = parsePostmanCollection(json);
          setCollections(prev => [...prev, newCollection]);
          // Add requests to the main pool
          const newRequestsMap = { ...requests };
          newCollection.requests.forEach(req => {
              newRequestsMap[req.id] = req;
          });
          setRequests(newRequestsMap);
      } catch (e) {
          console.error("Failed to parse collection", e);
          alert("Failed to parse Postman collection. Ensure it is v2.1 format.");
      }
  };

  const handleImportCurl = (curl: string) => {
      try {
          const newReq = parseCurl(curl);
          setRequests(prev => ({ ...prev, [newReq.id]: newReq }));
          handleOpenTab(newReq.id);
      } catch (e) {
          console.error("Failed to parse cURL", e);
          alert("Failed to parse cURL command.");
      }
  };

  // --- LOGIC ---

  // Helper to replace {{variables}}
  const substituteVariables = (text: string): string => {
      if (!activeEnvironmentId || !text) return text;
      const env = environments.find(e => e.id === activeEnvironmentId);
      if (!env) return text;

      let result = text;
      env.variables.forEach(v => {
          if (v.enabled && v.key) {
              const regex = new RegExp(`\\{\\{\\s*${v.key}\\s*\\}\\}`, 'g');
              result = result.replace(regex, v.value);
          }
      });
      return result;
  };

  const constructUrl = (req: ApiRequest) => {
    let urlWithVars = substituteVariables(req.url);
    try {
        const urlObj = new URL(urlWithVars);
        req.params.filter(p => p.enabled && p.key).forEach(p => {
            const val = substituteVariables(p.value);
            urlObj.searchParams.append(p.key, val);
        });
        
        // Add Query Params from Auth (API Key)
        if (req.auth.type === 'apikey' && req.auth.apiKeyLocation === 'query' && req.auth.apiKeyKey) {
            const key = substituteVariables(req.auth.apiKeyKey);
            const val = substituteVariables(req.auth.apiKeyValue);
            urlObj.searchParams.append(key, val);
        }

        return urlObj.toString();
    } catch {
        return urlWithVars;
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
        // Note: Mocking doesn't typically need variable substitution unless schema refers to it, but good for URL context.
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
        
        // 1. Standard Headers
        activeRequest.headers.filter(h => h.enabled && h.key).forEach(h => {
            headers[h.key] = substituteVariables(h.value);
        });

        // 2. Auth Injection
        const auth = activeRequest.auth;
        if (auth.type === 'bearer' && auth.bearerToken) {
            headers['Authorization'] = `Bearer ${substituteVariables(auth.bearerToken)}`;
        } else if (auth.type === 'basic') {
            const user = substituteVariables(auth.basicUsername || '');
            const pass = substituteVariables(auth.basicPassword || '');
            headers['Authorization'] = `Basic ${btoa(user + ':' + pass)}`;
        } else if (auth.type === 'apikey' && auth.apiKeyLocation === 'header' && auth.apiKeyKey) {
            headers[substituteVariables(auth.apiKeyKey)] = substituteVariables(auth.apiKeyValue);
        }

        const options: RequestInit = {
          method: activeRequest.method,
          headers: headers,
        };

        if (activeRequest.method !== HttpMethod.GET && activeRequest.method !== HttpMethod.DELETE) {
           const bodyContent = substituteVariables(activeRequest.bodyContent);
           if (activeRequest.bodyType === 'json') {
             try {
                JSON.parse(bodyContent); 
                headers['Content-Type'] = 'application/json';
                options.body = bodyContent;
             } catch {
                options.body = bodyContent;
             }
          } else {
             options.body = bodyContent;
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
            size: (typeof data === 'string' ? data.length : JSON.stringify(data).length) + ' B',
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

  // Filter requests for tabs
  const openTabs = openRequestIds
    .map(id => requests[id])
    .filter(Boolean);

  return (
    <div className="flex w-full h-screen overflow-hidden text-base">
      <Sidebar 
        history={history} 
        collections={collections}
        activeId={activeRequestId}
        environments={environments}
        activeEnvironmentId={activeEnvironmentId}
        onSelectHistory={handleSelectHistory}
        onSelectCollectionRequest={handleSelectCollectionRequest}
        onNewRequest={handleNewRequest}
        onToggleCollection={handleToggleCollection}
        onSelectEnvironment={setActiveEnvironmentId}
        onOpenEnvironmentManager={() => setIsEnvManagerOpen(true)}
        onOpenImport={() => setIsImportDialogOpen(true)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <TabBar 
            tabs={openTabs}
            activeId={activeRequestId}
            onSelect={handleOpenTab}
            onClose={handleCloseTab}
            onNew={handleNewRequest}
        />
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
      
      <EnvironmentManager 
        isOpen={isEnvManagerOpen}
        onClose={() => setIsEnvManagerOpen(false)}
        environments={environments}
        onUpdateEnvironments={setEnvironments}
      />

      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportFile={handleImportFile}
        onImportCurl={handleImportCurl}
      />
    </div>
  );
};

export default App;