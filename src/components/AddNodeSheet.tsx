import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { NODE_TYPES } from '../config/nodeTypes';
import { X, Blocks, BoxSelect } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { FACTORY_MACROS } from '../config/factoryMacros';

export function AddNodeSheet() {
  const addNode = useStore((state) => state.addNode);
  const isAddNodeOpen = useStore((state) => state.isAddNodeOpen);
  const setAddNodeOpen = useStore((state) => state.setAddNodeOpen);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const [userMacros, setUserMacros] = useState<any[]>([]);

  useEffect(() => {
    if (isAddNodeOpen) {
      try {
        const savedMacrosStr = localStorage.getItem('reverb_user_macros');
        if (savedMacrosStr) {
          setUserMacros(JSON.parse(savedMacrosStr));
        }
      } catch (e) {
        console.error('Failed to load user macros', e);
      }
    }
  }, [isAddNodeOpen]);

  const REVERB_ROLES: Record<string, string> = {
    delay: "Creates the foundational discrete echoes that make up early reflections.",
    multitap: "Calculates precise early reflection spacing before the diffuse tail begins.",
    modDelay: "Adds subtle pitch drift to tail, breaking up metallic resonances (Chorus/Flanging).",
    allpass: "Smears the signal phase to create diffusion without coloring frequency. Essential for the dense late 'tail'.",
    comb: "Creates modal density and simulates sound bouncing back and forth between two parallel walls.",
    fdn4: "Feedback Delay Network used to scatter energy recursively. A staple of modern algorithmic reverbs.",
    fdn8: "Highly complex scattering matrix. Produces smooth, color-less, incredibly dense late reverberation.",
    lpf: "Simulates air absorption. High frequencies decay faster in physical spaces. Place in feedback loops.",
    hpf: "Removes low-end 'mud' from building up recursively inside a reverb tank.",
    biquad: "Used for precise equalization of the reverb tank or cutting resonant modes.",
    knob: "Global parameter control. Use to map a single knob to multiple parameters inside the network.",
    math: "Evaluates expressions (e.g. a * b, Math.exp(-a)). Essential for creating proportional mappings across multiple delays.",
    damping: "Specialized 1-pole filter meant inside recursive loops to simulate the room's high-frequency absorption.",
    pitchShift: "Pitched feedback loops create 'Shimmer' Reverbs (e.g., feeding an octave-up signal back into the tank).",
    lfo: "Used to independently modulate delay line lengths to create a richer, animated, less static tail.",
    stereoWidth: "Usually placed at the end to artificially widen the diffuse tail.",
    panner: "Auto-panning discrete echoes across the stereo field creates a wider perceptual space.",
    chorus: "Often placed in the tank to simulate Lexicon-style modulated tails.",
    clamp: "Essential safety valve. Prevents volume explosions or runaway feedback when building experimental reverbs."
  };

  const handleNodeClick = (type: string) => {
    // Add somewhat randomly in center-ish, adjusting for mobile view
    const x = Math.random() * 50 + 100;
    const y = Math.random() * 50 + 100;
    addNode(type, { x, y });
    setAddNodeOpen(false);
  };

  const handleMacroClick = (macroDefToLoad: any) => {
     // Instantiating a macro from the factory
     const x = Math.random() * 50 + 100;
     const y = Math.random() * 50 + 100;
     
     // We need to mutate the store to inject this macro.
     // To keep things simple, we'll write a quick callback to zustand.
     useStore.setState(state => {
         const newMacroId = `macro_${Date.now()}`;
         
         // Clone definition with new ID mapping
         const newDef = JSON.parse(JSON.stringify(macroDefToLoad));
         newDef.id = newMacroId;
         
         const macroParams: any = {};
         for (const n of newDef.nodes) {
            if (n.data?.params) {
               macroParams[n.id] = n.data.params;
            }
         }
         
         const macroNode = {
            id: `n_${Date.now()}`,
            type: 'macro',
            selected: true,
            position: { x, y },
            data: {
              type: 'macro',
              macroId: newMacroId,
              label: newDef.name,
              params: macroParams,
              inputs: newDef.inPorts.length,
              outputs: newDef.outPorts.length
            }
         };
         
         return {
            nodes: [...state.nodes.map(n => ({...n, selected: false})), macroNode],
            macros: { ...state.macros, [newMacroId]: newDef }
         };
     });
     
     setAddNodeOpen(false);
  }

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isAddNodeOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setAddNodeOpen(false)}
      />
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-full sm:w-96 bg-slate-900 border-r border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out transform ${isAddNodeOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Handle / Header */}
        <div className="flex-shrink-0 p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/90 top-0 backdrop-blur-md">
          <div className="flex items-center space-x-2 text-slate-200">
            <Blocks size={20} className="text-blue-500" />
            <h2 className="text-base font-bold uppercase tracking-wider">Add Module</h2>
          </div>
          <button 
            className="text-slate-400 bg-slate-800/50 hover:bg-slate-700/50 rounded-full p-2 transition-colors touch-manipulation" 
            onClick={() => setAddNodeOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modules List */}
        <div className="p-4 overflow-y-auto overscroll-contain flex-1 pb-10 space-y-6">
          
          {userMacros.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BoxSelect size={14} className="text-emerald-400"/>
                Custom Modules (Sub-graphs)
              </h3>
              <div className="flex flex-col gap-3">
                {userMacros.map((def, idx) => (
                  <div key={def.id || idx} className="relative group">
                    <button
                      className="w-full text-left bg-emerald-900/20 border border-emerald-500/20 p-4 rounded-xl hover:border-emerald-400/50 hover:bg-emerald-900/40 active:scale-95 transition-all touch-manipulation shadow-sm flex justify-between items-center"
                      onClick={() => handleMacroClick(def)}
                    >
                      <div>
                        <div className="font-semibold text-sm text-emerald-300 group-hover:text-emerald-200 transition-colors uppercase tracking-wide">{def.name}</div>
                        <div className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                          Custom macro containing {def.nodes?.length || 0} grouped modules.
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = userMacros.filter((m) => m.id !== def.id);
                        setUserMacros(updated);
                        localStorage.setItem('reverb_user_macros', JSON.stringify(updated));
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Sub-graph Preset"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BoxSelect size={14} className="text-indigo-400"/>
              Factory Macros
            </h3>
            <div className="flex flex-col gap-3">
              {Object.entries(FACTORY_MACROS).map(([macroId, def]) => {
                return (
                  <button
                    key={macroId}
                    className="text-left bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-xl hover:border-indigo-400/50 hover:bg-indigo-900/40 active:scale-95 transition-all touch-manipulation shadow-sm group"
                    onClick={() => handleMacroClick(def)}
                  >
                    <div className="font-semibold text-sm text-indigo-300 group-hover:text-indigo-200 transition-colors uppercase tracking-wide">{def.name}</div>
                    <div className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                      Macro containing {def.nodes.length} grouped modules.
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {(() => {
            const categories = [
              { title: 'Sources', icon: <Blocks size={14} />, nodes: ['audioIn', 'audioFile', 'lfo', 'envelope'] },
              { title: 'Gain & Panning', icon: <Blocks size={14} />, nodes: ['stereoWidth', 'panner', 'mixer'] },
              { title: 'Delays', icon: <Blocks size={14} />, nodes: ['delay', 'multitap', 'modDelay'] },
              { title: 'Filters & EQ', icon: <Blocks size={14} />, nodes: ['lpf', 'hpf', 'biquad', 'damping'] },
              { title: 'Modulation', icon: <Blocks size={14} />, nodes: ['chorus', 'tremolo', 'phaser', 'pitchShift'] },
              { title: 'Reverb Blocks', icon: <Blocks size={14} />, nodes: ['allpass', 'comb', 'fdn4', 'fdn8'] },
              { title: 'Dynamics', icon: <Blocks size={14} />, nodes: ['clamp'] },
              { title: 'Analysis', icon: <Blocks size={14} />, nodes: ['oscilloscope', 'spectrum', 'latency'] },
              { title: 'Macros & Math', icon: <Blocks size={14} />, nodes: ['knob', 'math'] }
            ];

            return categories.map(({ title, nodes, icon }) => (
              <div key={title} className="pt-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="text-blue-400 opacity-80">{icon}</span>
                  {title}
                </h3>
                <div className="flex flex-col gap-3">
                  {nodes.map(type => {
                    const def = NODE_TYPES[type as keyof typeof NODE_TYPES];
                    if (!def) return null;
                    const tooltipText = REVERB_ROLES[type];

                    return (
                      <div key={type} className="relative group">
                        <button
                          className="w-full text-left bg-slate-800 border border-slate-700 p-4 rounded-xl hover:border-blue-500/50 hover:bg-slate-700/80 active:scale-95 transition-all touch-manipulation shadow-sm"
                          onClick={() => handleNodeClick(type)}
                          onMouseEnter={() => setHoveredNode(type)}
                          onMouseLeave={() => setHoveredNode(null)}
                        >
                          <div className="font-semibold text-sm text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-wide flex justify-between items-center">
                            {def.label}
                            {tooltipText && (
                              <div className="w-4 h-4 rounded-full border border-slate-600 text-slate-500 flex items-center justify-center text-[10px] font-bold group-hover:border-blue-500/50 group-hover:text-blue-400 transition-colors pointer-events-none">?</div>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                            {def.description}
                          </div>
                        </button>

                        {/* Tooltip */}
                        {tooltipText && hoveredNode === type && (
                          <div className="absolute left-[103%] top-1/2 -translate-y-1/2 w-64 bg-slate-900 border border-blue-500/30 p-3 rounded-lg shadow-2xl z-50 pointer-events-none hidden sm:block animate-in fade-in zoom-in-95 duration-200">
                            <div className="absolute w-2 h-2 bg-slate-900 border-l border-b border-blue-500/30 rotate-45 -left-[5px] top-1/2 -translate-y-1/2"></div>
                            <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider mb-1">Reverb Signal Path Role</div>
                            <div className="text-xs text-slate-300 leading-relaxed font-medium">
                              {tooltipText}
                            </div>
                          </div>
                        )}
                        {/* Mobile inline tooltip equivalent if needed */}
                        {tooltipText && hoveredNode === type && (
                           <div className="mt-2 p-3 bg-blue-950/30 border border-blue-900/50 rounded-lg sm:hidden animate-in slide-in-from-top-2 duration-200">
                              <div className="text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Reverb Role
                              </div>
                              <div className="text-[11px] text-blue-100/70 leading-relaxed font-medium">
                                {tooltipText}
                              </div>
                           </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </>
  );
}
