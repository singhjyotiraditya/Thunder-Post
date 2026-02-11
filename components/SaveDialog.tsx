import React, { useState } from 'react';
import { Collection } from '../types';
import { X, Plus, FolderPlus } from 'lucide-react';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onSave: (name: string, collectionId: string | null, newCollectionName?: string) => void;
  initialName: string;
}

export const SaveDialog: React.FC<SaveDialogProps> = ({ isOpen, onClose, collections, onSave, initialName }) => {
  const [requestName, setRequestName] = useState(initialName);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!requestName.trim()) return;
    if (isCreatingCollection && !newCollectionName.trim()) return;
    
    onSave(
      requestName, 
      isCreatingCollection ? null : (selectedCollectionId || null), 
      isCreatingCollection ? newCollectionName : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[400px] bg-surface border border-border p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Save Request</h2>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-2 uppercase tracking-wider font-semibold">Request Name</label>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 text-white focus:border-white outline-none transition-colors"
              placeholder="e.g. Get User Profile"
              autoFocus
            />
          </div>

          <div>
             <label className="block text-sm text-muted mb-2 uppercase tracking-wider font-semibold">Collection</label>
             {!isCreatingCollection ? (
               <div className="space-y-2">
                 <select
                   value={selectedCollectionId}
                   onChange={(e) => setSelectedCollectionId(e.target.value)}
                   className="w-full bg-background border border-border px-4 py-3 text-white focus:border-white outline-none transition-colors appearance-none"
                 >
                   <option value="">Select a Collection...</option>
                   {collections.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
                 <button 
                   onClick={() => setIsCreatingCollection(true)}
                   className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors pt-1"
                 >
                   <Plus size={16} /> Create New Collection
                 </button>
               </div>
             ) : (
               <div className="space-y-2">
                 <div className="flex gap-2">
                    <div className="bg-background border border-border px-3 py-3 flex items-center justify-center text-muted">
                        <FolderPlus size={18} />
                    </div>
                    <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        className="flex-1 bg-background border border-border px-4 py-3 text-white focus:border-white outline-none transition-colors"
                        placeholder="New Collection Name"
                    />
                 </div>
                 <button 
                   onClick={() => setIsCreatingCollection(false)}
                   className="text-sm text-muted hover:text-white transition-colors pt-1"
                 >
                   Cancel creating collection
                 </button>
               </div>
             )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-white hover:text-muted transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!requestName.trim() || (isCreatingCollection && !newCollectionName.trim())}
              className="bg-white text-black px-8 py-2 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};