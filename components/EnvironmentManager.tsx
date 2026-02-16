import React, { useState, useEffect } from 'react';
import { Environment, KeyValueItem } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { X, Plus, Trash2, Check } from 'lucide-react';

interface EnvironmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  environments: Environment[];
  onUpdateEnvironments: (envs: Environment[]) => void;
}

export const EnvironmentManager: React.FC<EnvironmentManagerProps> = ({ 
  isOpen, 
  onClose, 
  environments, 
  onUpdateEnvironments 
}) => {
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen && environments.length > 0 && !selectedEnvId) {
      setSelectedEnvId(environments[0].id);
    }
  }, [isOpen, environments, selectedEnvId]);

  if (!isOpen) return null;

  const selectedEnv = environments.find(e => e.id === selectedEnvId);

  const handleAddEnvironment = () => {
    const newEnv: Environment = {
      id: crypto.randomUUID(),
      name: 'New Environment',
      variables: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }]
    };
    onUpdateEnvironments([...environments, newEnv]);
    setSelectedEnvId(newEnv.id);
  };

  const handleDeleteEnvironment = (id: string) => {
    const newEnvs = environments.filter(e => e.id !== id);
    onUpdateEnvironments(newEnvs);
    if (selectedEnvId === id) {
      setSelectedEnvId(newEnvs.length > 0 ? newEnvs[0].id : null);
    }
  };

  const handleUpdateName = (name: string) => {
    if (!selectedEnv) return;
    const updated = environments.map(e => e.id === selectedEnv.id ? { ...e, name } : e);
    onUpdateEnvironments(updated);
  };

  const handleUpdateVariables = (variables: KeyValueItem[]) => {
    if (!selectedEnv) return;
    const updated = environments.map(e => e.id === selectedEnv.id ? { ...e, variables } : e);
    onUpdateEnvironments(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[800px] h-[600px] bg-surface border border-border shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-white">Manage Environments</h2>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-border bg-background flex flex-col">
            <div className="flex-1 overflow-y-auto p-2">
              {environments.map(env => (
                <button
                  key={env.id}
                  onClick={() => setSelectedEnvId(env.id)}
                  className={`w-full text-left px-4 py-3 rounded mb-1 flex justify-between items-center group transition-colors
                    ${selectedEnvId === env.id ? 'bg-surfaceHover text-white' : 'text-muted hover:text-white hover:bg-surfaceHover'}`}
                >
                  <span className="truncate font-medium">{env.name}</span>
                  <div 
                    onClick={(e) => { e.stopPropagation(); handleDeleteEnvironment(env.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </div>
                </button>
              ))}
              {environments.length === 0 && (
                <div className="text-center p-4 text-muted text-sm italic">No environments created</div>
              )}
            </div>
            <div className="p-4 border-t border-border">
              <button 
                onClick={handleAddEnvironment}
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-2 font-bold hover:bg-neutral-200 transition-colors rounded-sm"
              >
                <Plus size={16} /> New Environment
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-surface">
            {selectedEnv ? (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border">
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Environment Name</label>
                  <input 
                    type="text" 
                    value={selectedEnv.name}
                    onChange={(e) => handleUpdateName(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-2 text-white outline-none focus:border-white transition-colors"
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="mb-4 text-sm text-muted">
                    Define variables using key-value pairs. Reference them in your requests using <code className="text-white bg-white/10 px-1 rounded">{'{{variableName}}'}</code>.
                  </div>
                  <KeyValueEditor 
                    items={selectedEnv.variables}
                    onChange={handleUpdateVariables}
                    variables={selectedEnv.variables}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted">
                Select or create an environment to edit
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};