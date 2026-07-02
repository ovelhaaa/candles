import React, { useState, useEffect } from 'react';
import { X, Check, Save, Upload, Trash2, List, Code2 } from 'lucide-react';
import { useStore } from '../store';
import { PRESETS } from '../config/presets';
import { generateCpp } from '../utils/cppGenerator';

export function PresetsPanel() {
  const { isPresetsOpen, setPresetsOpen, setNodes, setEdges, nodes, edges } = useStore();
  const [userPresets, setUserPresets] = useState<any[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'presets' | 'code'>('presets');

  useEffect(() => {
    const saved = localStorage.getItem('reverb_user_presets');
    if (saved) {
      try {
        setUserPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse user presets", e);
      }
    }
  }, [isPresetsOpen]); // reload when opened

  const saveToDefaultPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset = {
      id: `user-${Date.now()}`,
      name: newPresetName,
      description: 'Custom user preset',
      nodes: nodes,
      edges: edges
    };
    const updated = [...userPresets, newPreset];
    setUserPresets(updated);
    localStorage.setItem('reverb_user_presets', JSON.stringify(updated));
    setNewPresetName('');
    setIsSaving(false);
  };

  const loadPreset = (preset: any) => {
    setNodes(preset.nodes);
    setEdges(preset.edges);
    useStore.getState().clearHistory();
    setPresetsOpen(false);
  };

  const deleteUserPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = userPresets.filter((p) => p.id !== id);
    setUserPresets(updated);
    localStorage.setItem('reverb_user_presets', JSON.stringify(updated));
  };

  if (!isPresetsOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => setPresetsOpen(false)}
      />
      <div className="fixed inset-x-0 bottom-0 sm:top-0 sm:left-auto sm:right-0 sm:w-96 sm:h-full bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-700 sm:bottom-auto shadow-2xl z-50 flex flex-col transition-transform transform rounded-t-3xl sm:rounded-none max-h-[85vh] sm:max-h-full">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <List className="text-slate-400" size={20} />
            <h2 className="text-lg font-bold text-slate-100">Presets & Export</h2>
          </div>
          <button 
            onClick={() => setPresetsOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex bg-slate-800/50 p-1 m-4 rounded-lg">
           <button 
             onClick={() => setViewMode('presets')}
             className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'presets' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
           >
              Presets
           </button>
           <button 
             onClick={() => setViewMode('code')}
             className={`flex-1 flex items-center justify-center space-x-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'code' ? 'bg-blue-600 outline outline-1 outline-blue-500 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
           >
              <Code2 size={12} />
              <span>C++ Code</span>
           </button>
        </div>

        <div className="px-4 pb-4 flex-1 overflow-y-auto min-h-0 space-y-6 flex flex-col">
          {viewMode === 'presets' ? (
            <>
              {/* Save Current */}
              <div className="space-y-3">
                {!isSaving ? (
                  <button 
                    onClick={() => setIsSaving(true)}
                    className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-900 font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save size={18} />
                    <span>Save Current as Preset</span>
                  </button>
                ) : (
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex space-x-2">
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="Preset Name..." 
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveToDefaultPreset()}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={saveToDefaultPreset}
                      disabled={!newPresetName.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={() => setIsSaving(false)}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Built-in Presets</h3>
                <div className="space-y-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => loadPreset(preset)}
                      className="w-full text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 p-3 justify-between rounded-xl transition-all group flex items-start space-x-3"
                    >
                      <div className="mt-0.5 bg-blue-500/10 p-1.5 rounded-lg text-blue-400 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <Upload size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-200 text-sm">{preset.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 leading-snug">{preset.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {userPresets.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Your Presets</h3>
                  <div className="space-y-2">
                    {userPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="w-full flex items-stretch bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all group overflow-hidden"
                      >
                        <button
                          onClick={() => loadPreset(preset)}
                          className="flex-1 text-left p-3 hover:bg-slate-800 flex items-start space-x-3 transition-colors"
                        >
                          <div className="mt-0.5 bg-emerald-500/10 p-1.5 rounded-lg text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Save size={16} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-200 text-sm">{preset.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5 leading-snug">{preset.description}</div>
                          </div>
                        </button>
                        <button
                          onClick={(e) => deleteUserPreset(preset.id, e)}
                          className="px-3 border-l border-slate-700/50 hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col h-full">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">C++ Class Export</h3>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                 A structural code generation of your current routing network. This generates the skeleton for an AudioProcessor with your specific modules and buffers ready for standard C++ DSP execution.
              </p>
              <textarea 
                className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-[10px] font-mono text-blue-200 leading-relaxed outline-none resize-none"
                readOnly
                value={generateCpp(nodes, edges)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
