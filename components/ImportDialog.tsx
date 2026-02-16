import React, { useState, useRef } from 'react';
import { X, Upload, Terminal, Globe, Loader2, FileCode } from 'lucide-react';

interface ImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImportFile: (file: File) => void;
    onImportCurl: (curl: string) => void;
    onImportSwagger: (json: any, url?: string) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ isOpen, onClose, onImportFile, onImportCurl, onImportSwagger }) => {
    const [activeTab, setActiveTab] = useState<'file'|'curl'|'swagger'>('file');
    const [curlText, setCurlText] = useState('');
    const [swaggerUrl, setSwaggerUrl] = useState('');
    const [swaggerJsonText, setSwaggerJsonText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImportFile(e.target.files[0]);
            onClose();
        }
    };

    const handleCurlImport = () => {
        if (curlText.trim()) {
            onImportCurl(curlText);
            onClose();
            setCurlText('');
        }
    };

    const handleSwaggerFetch = async () => {
        if (!swaggerUrl.trim()) return;
        
        setIsLoading(true);
        setError('');
        
        try {
            const res = await fetch(swaggerUrl);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const json = await res.json();
            
            // Basic validation
            if (!json.openapi && !json.swagger) {
                throw new Error("Invalid Swagger/OpenAPI JSON");
            }

            onImportSwagger(json, swaggerUrl);
            onClose();
            setSwaggerUrl('');
            setSwaggerJsonText('');
        } catch (err: any) {
            setError('Failed to fetch. This is likely due to CORS restrictions on the server. Please copy the JSON content manually and paste it below.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwaggerPasteImport = () => {
        try {
            const json = JSON.parse(swaggerJsonText);
             // Basic validation
            if (!json.openapi && !json.swagger) {
                throw new Error("Invalid Swagger/OpenAPI JSON");
            }
            onImportSwagger(json, undefined);
            onClose();
            setSwaggerJsonText('');
            setError('');
        } catch (e) {
            setError('Invalid JSON format. Please check your input.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[600px] max-h-[90vh] bg-surface border border-border shadow-2xl flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-border">
                    <h2 className="text-xl font-bold text-white">Import</h2>
                    <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex border-b border-border">
                    <button 
                        onClick={() => setActiveTab('file')}
                        className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'file' ? 'border-white text-white' : 'border-transparent text-muted hover:text-white'}`}
                    >
                        Postman (File)
                    </button>
                    <button 
                        onClick={() => setActiveTab('curl')}
                        className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'curl' ? 'border-white text-white' : 'border-transparent text-muted hover:text-white'}`}
                    >
                        cURL
                    </button>
                    <button 
                        onClick={() => setActiveTab('swagger')}
                        className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'swagger' ? 'border-white text-white' : 'border-transparent text-muted hover:text-white'}`}
                    >
                        Swagger / OpenAPI
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {activeTab === 'file' && (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-10 gap-4 hover:bg-surfaceHover transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Upload size={48} className="text-muted" />
                            <p className="text-muted text-sm text-center">Click to upload Postman Collection (.json)</p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".json" 
                                onChange={handleFileChange}
                            />
                        </div>
                    )}

                    {activeTab === 'curl' && (
                        <div className="flex flex-col gap-4">
                            <textarea 
                                className="w-full h-40 bg-background border border-border p-3 text-sm font-mono text-white outline-none focus:border-white resize-none rounded"
                                placeholder="curl -X POST https://api.example.com/data -d '...'"
                                value={curlText}
                                onChange={(e) => setCurlText(e.target.value)}
                            />
                            <button 
                                onClick={handleCurlImport}
                                disabled={!curlText.trim()}
                                className="bg-white text-black py-2 rounded font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50"
                            >
                                Import cURL
                            </button>
                        </div>
                    )}

                    {activeTab === 'swagger' && (
                        <div className="flex flex-col gap-6">
                            <div className="space-y-2">
                                <label className="text-xs text-muted uppercase font-bold tracking-wide">Import from URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        className="flex-1 bg-background border border-border px-4 py-2 text-white outline-none focus:border-white rounded transition-colors"
                                        placeholder="https://api.example.com/docs-json"
                                        value={swaggerUrl}
                                        onChange={(e) => setSwaggerUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSwaggerFetch()}
                                    />
                                    <button 
                                        onClick={handleSwaggerFetch}
                                        disabled={!swaggerUrl.trim() || isLoading}
                                        className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                                        Fetch
                                    </button>
                                </div>
                                <p className="text-[10px] text-muted">
                                    Tip: If you have a Swagger UI link, try appending <code>-json</code> to the end.
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </div>
                            )}

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-surface px-2 text-muted">Or Paste JSON</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted uppercase font-bold tracking-wide flex items-center gap-2">
                                    <FileCode size={12} />
                                    JSON Content
                                </label>
                                <textarea 
                                    className="w-full h-32 bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-white resize-none rounded custom-scrollbar"
                                    placeholder='{"openapi": "3.0.0", "paths": { ... }}'
                                    value={swaggerJsonText}
                                    onChange={(e) => setSwaggerJsonText(e.target.value)}
                                />
                                <button 
                                    onClick={handleSwaggerPasteImport}
                                    disabled={!swaggerJsonText.trim()}
                                    className="w-full bg-surface border border-border text-white py-2 rounded font-bold hover:bg-surfaceHover transition-colors disabled:opacity-50"
                                >
                                    Import JSON
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};