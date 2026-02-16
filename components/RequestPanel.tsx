import React, { useState, useEffect } from 'react';
import { ApiRequest, HttpMethod, TabType, AuthType, KeyValueItem } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { Play, Save, ChevronDown, Lock, Eye, EyeOff, Code, Check } from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
import { SuggestionInput } from './SuggestionInput';

interface RequestPanelProps {
  request: ApiRequest;
  onUpdateRequest: (req: ApiRequest) => void;
  onSend: () => void;
  onSave: () => void;
  isLoading: boolean;
  style?: React.CSSProperties;
  environmentVariables: KeyValueItem[];
}

export const RequestPanel: React.FC<RequestPanelProps> = ({ request, onUpdateRequest, onSend, onSave, isLoading, style, environmentVariables }) => {
  const [activeTab, setActiveTab] = useState<TabType>('params');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(request.name);
  const [copiedCurl, setCopiedCurl] = useState(false);

  useEffect(() => {
    setTempName(request.name);
  }, [request.name]);

  const updateField = (field: keyof ApiRequest, value: any) => {
    onUpdateRequest({ ...request, [field]: value });
  };

  const updateAuth = (field: string, value: any) => {
      onUpdateRequest({ 
          ...request, 
          auth: { ...request.auth, [field]: value }
      });
  };

  const handleNameSave = () => {
      if (tempName.trim() && tempName !== request.name) {
          updateField('name', tempName);
      } else {
          setTempName(request.name);
      }
      setIsEditingName(false);
  };

  const handleCopyCurl = () => {
    let fullUrl = request.url;
    
    // Append query params
    const queryParams = request.params
        .filter(p => p.enabled && p.key)
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`);
    
    if (request.auth.type === 'apikey' && request.auth.apiKeyLocation === 'query' && request.auth.apiKeyKey) {
        queryParams.push(`${encodeURIComponent(request.auth.apiKeyKey)}=${encodeURIComponent(request.auth.apiKeyValue)}`);
    }

    if (queryParams.length > 0) {
        const separator = fullUrl.includes('?') ? '&' : '?';
        fullUrl += separator + queryParams.join('&');
    }

    let curl = `curl -X ${request.method} "${fullUrl}"`;

    // Headers
    request.headers.forEach(h => {
        if (h.enabled && h.key) {
            curl += ` \\\n  -H "${h.key}: ${h.value}"`;
        }
    });

    // Auth Headers
    if (request.auth.type === 'bearer' && request.auth.bearerToken) {
        curl += ` \\\n  -H "Authorization: Bearer ${request.auth.bearerToken}"`;
    } else if (request.auth.type === 'basic') {
        const auth = btoa(`${request.auth.basicUsername}:${request.auth.basicPassword}`);
        curl += ` \\\n  -H "Authorization: Basic ${auth}"`;
    } else if (request.auth.type === 'apikey' && request.auth.apiKeyLocation === 'header' && request.auth.apiKeyKey) {
        curl += ` \\\n  -H "${request.auth.apiKeyKey}: ${request.auth.apiKeyValue}"`;
    }
    
    // Explicit Content-Type if JSON and not present
    if (request.bodyType === 'json' && !request.headers.some(h => h.key.toLowerCase() === 'content-type')) {
         curl += ` \\\n  -H "Content-Type: application/json"`;
    }

    // Body
    if (request.method !== 'GET' && request.method !== 'DELETE' && request.bodyContent) {
        // Simple escaping for single quotes in body for shell
        const escapedBody = request.bodyContent.replace(/'/g, "'\\''");
        curl += ` \\\n  -d '${escapedBody}'`;
    }

    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'params', label: 'Query Params', count: request.params.filter(p => p.key).length },
    { id: 'headers', label: 'Headers', count: request.headers.filter(h => h.key).length },
    { id: 'auth', label: 'Auth', count: request.auth.type !== 'none' ? 1 : 0 },
    { id: 'body', label: 'JSON Body' },
  ];

  const methodOptions = Object.values(HttpMethod).map(m => {
    let color = 'text-white';
    if(m === HttpMethod.GET) color = 'text-green-500';
    if(m === HttpMethod.POST) color = 'text-yellow-500';
    if(m === HttpMethod.PUT) color = 'text-blue-500';
    if(m === HttpMethod.DELETE) color = 'text-red-500';
    if(m === HttpMethod.PATCH) color = 'text-purple-500';
    
    return {
        label: <span className={`font-bold tracking-wider ${color}`}>{m}</span>,
        value: m
    };
  });

  const authTypeOptions = [
      { label: 'No Auth', value: 'none' },
      { label: 'Bearer Token', value: 'bearer' },
      { label: 'Basic Auth', value: 'basic' },
      { label: 'API Key', value: 'apikey' }
  ];

  const apiKeyLocationOptions = [
      { label: 'Header', value: 'header' },
      { label: 'Query Params', value: 'query' }
  ];

  return (
    <div style={style} className="flex flex-col h-full overflow-hidden bg-background">
      {/* Top Bar / URL */}
      <div className="p-5 border-b border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 overflow-hidden flex-1 mr-4">
             {isEditingName ? (
                <input 
                    type="text" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    className="text-lg font-bold text-white bg-transparent outline-none border-b border-white w-full max-w-md"
                    autoFocus
                />
             ) : (
                <span 
                    onDoubleClick={() => setIsEditingName(true)}
                    className="text-lg font-bold truncate text-white cursor-text hover:text-gray-200 border border-transparent hover:border-border px-1 -ml-1 rounded transition-colors select-none"
                    title="Double click to rename"
                >
                    {request.name}
                </span>
             )}
             {request.collectionId && <span className="text-xs text-muted px-2 py-0.5 border border-border rounded shrink-0">Saved</span>}
           </div>
           <div className="flex items-center gap-2">
                <button 
                  onClick={handleCopyCurl}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted hover:text-white transition-colors border border-transparent hover:border-border rounded shrink-0"
                  title="Copy as cURL"
                >
                   {copiedCurl ? <Check size={16} className="text-green-500" /> : <Code size={16} />}
                   <span className="hidden sm:inline">cURL</span>
                </button>
                <button 
                    onClick={onSave}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted hover:text-white transition-colors border border-transparent hover:border-border rounded shrink-0"
                >
                    <Save size={16} />
                    Save
                </button>
           </div>
        </div>

        <div className="flex gap-2 items-stretch h-12">
          <div className="w-[120px]">
              <CustomDropdown
                value={request.method}
                options={methodOptions}
                onChange={(val) => updateField('method', val)}
                className="h-full"
                triggerClassName="h-full rounded-l rounded-r-none border-r-0 bg-surface"
              />
          </div>
          
          <SuggestionInput
            value={request.url}
            onChange={(val) => updateField('url', val)}
            variables={environmentVariables}
            placeholder="https://api.example.com/v1/resource"
            className="w-full h-full bg-background border-y border-r border-border px-4 text-base outline-none focus:border-white text-white placeholder-neutral-700 font-mono"
            wrapperClassName="flex-1"
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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-5 border-b border-border gap-8 overflow-x-auto bg-background no-scrollbar">
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
            {tab.id === 'auth' && request.auth.type !== 'none' && <Lock size={12} className="text-white opacity-70" />}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 bg-background">
        {activeTab === 'params' && (
          <KeyValueEditor 
            items={request.params} 
            onChange={(items) => updateField('params', items)} 
            variables={environmentVariables}
          />
        )}
        
        {activeTab === 'headers' && (
          <KeyValueEditor 
            items={request.headers} 
            onChange={(items) => updateField('headers', items)} 
            variables={environmentVariables}
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
            <SuggestionInput
              textarea
              value={request.bodyContent}
              onChange={(val) => updateField('bodyContent', val)}
              variables={environmentVariables}
              className="w-full h-full bg-surface border border-border rounded p-4 font-mono text-sm text-white outline-none focus:border-white resize-none leading-relaxed"
              wrapperClassName="flex-1"
              placeholder={request.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Raw text content'}
            />
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="h-full flex flex-col max-w-2xl">
             <div className="flex items-center gap-4 mb-6">
                 <label className="text-sm font-semibold text-white w-24">Auth Type</label>
                 <div className="flex-1">
                    <CustomDropdown 
                        value={request.auth.type}
                        options={authTypeOptions}
                        onChange={(val) => updateAuth('type', val)}
                        className="w-full"
                        triggerClassName="py-3 px-4 rounded"
                    />
                 </div>
             </div>

             {request.auth.type === 'none' && (
                 <div className="text-center text-muted p-12 bg-surface rounded border border-border border-dashed">
                     <Lock size={32} className="mx-auto mb-3 opacity-30" />
                     <p>This request does not use any authorization.</p>
                 </div>
             )}

             {request.auth.type === 'bearer' && (
                 <div className="space-y-4 p-6 bg-surface border border-border rounded">
                     <div className="flex flex-col gap-2">
                         <label className="text-xs font-bold text-muted uppercase tracking-wider">Token</label>
                         <div className="relative">
                            <SuggestionInput 
                                type={showPassword ? "text" : "password"}
                                value={request.auth.bearerToken}
                                onChange={(val) => updateAuth('bearerToken', val)}
                                variables={environmentVariables}
                                className="w-full bg-background border border-border px-4 py-3 text-white focus:border-white outline-none"
                                placeholder="Token"
                            />
                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white z-10">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                         </div>
                     </div>
                 </div>
             )}

             {request.auth.type === 'basic' && (
                 <div className="space-y-4 p-6 bg-surface border border-border rounded">
                     <div className="flex flex-col gap-2">
                         <label className="text-xs font-bold text-muted uppercase tracking-wider">Username</label>
                         <SuggestionInput
                            value={request.auth.basicUsername}
                            onChange={(val) => updateAuth('basicUsername', val)}
                            variables={environmentVariables}
                            className="w-full bg-background border border-border px-4 py-3 text-white focus:border-white outline-none"
                            placeholder="Username"
                        />
                     </div>
                     <div className="flex flex-col gap-2">
                         <label className="text-xs font-bold text-muted uppercase tracking-wider">Password</label>
                         <div className="relative">
                            <SuggestionInput 
                                type={showPassword ? "text" : "password"}
                                value={request.auth.basicPassword}
                                onChange={(val) => updateAuth('basicPassword', val)}
                                variables={environmentVariables}
                                className="w-full bg-background border border-border px-4 py-3 text-white focus:border-white outline-none"
                                placeholder="Password"
                            />
                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white z-10">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                         </div>
                     </div>
                 </div>
             )}

             {request.auth.type === 'apikey' && (
                 <div className="space-y-4 p-6 bg-surface border border-border rounded">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted uppercase tracking-wider">Key</label>
                            <SuggestionInput 
                                value={request.auth.apiKeyKey}
                                onChange={(val) => updateAuth('apiKeyKey', val)}
                                variables={environmentVariables}
                                className="w-full bg-background border border-border px-4 py-3 text-white focus:border-white outline-none"
                                placeholder="Key (e.g. X-API-KEY)"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted uppercase tracking-wider">Value</label>
                            <div className="relative">
                                <SuggestionInput 
                                    type={showPassword ? "text" : "password"}
                                    value={request.auth.apiKeyValue}
                                    onChange={(val) => updateAuth('apiKeyValue', val)}
                                    variables={environmentVariables}
                                    className="w-full bg-background border border-border px-4 py-3 text-white focus:border-white outline-none"
                                    placeholder="Value"
                                />
                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white z-10">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2">
                         <label className="text-xs font-bold text-muted uppercase tracking-wider">Add to</label>
                         <CustomDropdown
                             value={request.auth.apiKeyLocation}
                             options={apiKeyLocationOptions}
                             onChange={(val) => updateAuth('apiKeyLocation', val)}
                             triggerClassName="py-3 px-4 bg-background"
                         />
                     </div>
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};