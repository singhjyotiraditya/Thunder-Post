import React, { useState, useRef } from 'react';
import { X, Upload, Terminal } from 'lucide-react';

interface ImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImportFile: (file: File) => void;
    onImportCurl: (curl: string) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ isOpen, onClose, onImportFile, onImportCurl }) => {
    const [activeTab, setActiveTab] = useState<'file'|'curl'>('file');
    const [curlText, setCurlText] = useState('');
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[500px] bg-surface border border-border shadow-2xl flex flex-col">
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
                        Postman Collection
                    </button>
                    <button 
                        onClick={() => setActiveTab('curl')}
                        className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'curl' ? 'border-white text-white' : 'border-transparent text-muted hover:text-white'}`}
                    >
                        cURL
                    </button>
                </div>

                <div className="p-6">
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
                </div>
            </div>
        </div>
    );
};