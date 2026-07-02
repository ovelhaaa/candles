import { useStore } from '../store';
import { X, Settings2, Trash2, ArrowLeftRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { NODE_TYPES } from '../config/nodeTypes';
import { useState } from 'react';

export function PropertiesPanel() {
  const selectedNode = useStore((state) => state.selectedNode);
  const selectedEdge = useStore((state) => state.selectedEdge);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const updateEdgeData = useStore((state) => state.updateEdgeData);
  const isPropertiesOpen = useStore((state) => state.isPropertiesOpen);
  const setPropertiesOpen = useStore((state) => state.setPropertiesOpen);
  const { deleteElements } = useReactFlow();

  const handleDelete = () => {
    if (selectedNode) {
      if (selectedNode.id === 'in' || selectedNode.id === 'out') {
         return;
      }
      deleteElements({ nodes: [selectedNode] });
      setPropertiesOpen(false);
    } else if (selectedEdge) {
      deleteElements({ edges: [selectedEdge] });
      setPropertiesOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isPropertiesOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setPropertiesOpen(false)}
      />
      
      {/* Right Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out transform ${isPropertiesOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Handle / Header */}
        <div className="flex-shrink-0 p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/90 sticky top-0 backdrop-blur-md">
          <div className="flex items-center space-x-2 text-slate-200">
            <Settings2 size={20} className="text-emerald-500" />
            <h2 className="text-base font-bold uppercase tracking-wider">Properties</h2>
          </div>
          <button 
            className="text-slate-400 bg-slate-800/50 hover:bg-slate-700/50 rounded-full p-2 transition-colors touch-manipulation" 
            onClick={() => setPropertiesOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {!selectedNode && !selectedEdge ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-500 text-sm flex-1">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Settings2 size={24} className="text-slate-600" />
            </div>
            Select a module or connection to edit its properties
          </div>
        ) : (
          <div className="overflow-y-auto overscroll-contain flex-1 flex flex-col">
            {selectedNode && <PropertiesPanelContent selectedNode={selectedNode} updateNodeData={updateNodeData} />}
            {selectedEdge && <EdgePropertiesPanelContent selectedEdge={selectedEdge} updateEdgeData={updateEdgeData} />}
            <div className="p-6 mt-auto">
              <button
                onClick={handleDelete}
                disabled={selectedNode?.id === 'in' || selectedNode?.id === 'out'}
                className="w-full flex items-center justify-center space-x-2 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-4 py-3 rounded-xl transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} />
                <span>{selectedNode ? 'Delete Module' : 'Delete Connection'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function EdgePropertiesPanelContent({ selectedEdge, updateEdgeData }: any) {
  const data = selectedEdge.data || {};
  const sourceChannel = data.sourceChannel || 'both';
  const targetChannel = data.targetChannel || 'both';

  return (
    <div className="pb-10">
      <div className="p-4 sm:p-6 border-b border-slate-800/50 bg-slate-800/20">
        <h3 className="text-xl font-bold text-slate-100">Connection Routing</h3>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-prose">Settings for how audio is routed across this connection.</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6 mt-2">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Source Signal</label>
          <select 
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            value={sourceChannel}
            onChange={(e) => updateEdgeData(selectedEdge.id, { sourceChannel: e.target.value })}
          >
            <option value="both">Stereo (Both Channels)</option>
            <option value="l">Left Channel Only</option>
            <option value="r">Right Channel Only</option>
            <option value="mono_sum">Mono Sum (L+R)</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Destination Input</label>
          <select 
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            value={targetChannel}
            onChange={(e) => updateEdgeData(selectedEdge.id, { targetChannel: e.target.value })}
          >
            <option value="both">Stereo Input (Dual Mono if Source is Mono)</option>
            <option value="l">Left Channel Input Only</option>
            <option value="r">Right Channel Input Only</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function ReplaceNodeSection({ selectedNode }: any) {
  const replaceNode = useStore((state) => state.replaceNode);
  const [selectedType, setSelectedType] = useState('');

  if (selectedNode.id === 'in' || selectedNode.id === 'out') return null;

  const currentDef = NODE_TYPES[selectedNode.type as keyof typeof NODE_TYPES];
  const newDef = selectedType ? NODE_TYPES[selectedType as keyof typeof NODE_TYPES] : null;

  let warning = null;
  if (currentDef && newDef) {
    if (newDef.inputs < currentDef.inputs || newDef.outputs < currentDef.outputs) {
      warning = `Warning: Some connections will be lost (${newDef.inputs} in, ${newDef.outputs} out vs ${currentDef.inputs} in, ${currentDef.outputs} out).`;
    }
  }

  return (
    <div className="p-4 sm:p-6 border-b border-slate-800/50 space-y-3">
      <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
        <ArrowLeftRight size={16} className="text-blue-400" />
        <span>Replace Component</span>
      </h4>
      
      <div className="flex space-x-2">
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
        >
          <option value="">Select new type...</option>
          {Object.entries(NODE_TYPES)
            .filter(([key, def]) => key !== 'audioIn' && key !== 'audioOut' && key !== selectedNode.type)
            .map(([key, def]) => (
            <option key={key} value={key}>{def.label}</option>
          ))}
        </select>
        <button 
          disabled={!selectedType}
          onClick={() => {
            if (selectedType) {
              replaceNode(selectedNode.id, selectedType);
              setSelectedType('');
            }
          }}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Replace
        </button>
      </div>

      {warning && (
        <div className="flex items-start space-x-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg text-xs mt-2">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span className="leading-snug font-medium">{warning}</span>
        </div>
      )}
    </div>
  );
}

function PropertiesPanelContent({ selectedNode, updateNodeData }: any) {
  const { data } = selectedNode;
  const params: Record<string, any> = data.params || {};

  const handleParamChange = (paramKey: string, value: number) => {
    updateNodeData(selectedNode.id, {
      params: {
        ...params,
        [paramKey]: {
          ...params[paramKey],
          value,
        },
      },
    });
  };

  const handleMatrixChange = (paramKey: string, r: number, c: number, val: number) => {
    const newMatrix = [...params[paramKey].value];
    newMatrix[r] = [...newMatrix[r]];
    newMatrix[r][c] = val;
    updateNodeData(selectedNode.id, {
      params: {
        ...params,
        [paramKey]: {
          ...params[paramKey],
          value: newMatrix,
        },
      },
    });
  };

  const applyMatrixTemplate = (paramKey: string, template: 'householder' | 'hadamard') => {
    const size = params[paramKey].size;
    let newMatrix = Array.from({length: size}, () => new Array(size).fill(0));
    
    if (template === 'householder') {
      const v = 2 / size;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          newMatrix[i][j] = Number(((i === j ? 1 : 0) - v).toFixed(3));
        }
      }
    } else if (template === 'hadamard') {
      // Create unnormalized hadamard
      let h = [[1]];
      for (let i = 1; i < size; i += i) {
        let nextH = [];
        for (let r = 0; r < i * 2; r++) {
          nextH[r] = [];
          for (let c = 0; c < i * 2; c++) {
             let sign = (r >= i && c >= i) ? -1 : 1;
             nextH[r][c] = h[r % i][c % i] * sign;
          }
        }
        h = nextH;
      }
      // Normalize
      const norm = 1 / Math.sqrt(size);
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          newMatrix[i][j] = Number((h[i]?.[j] || 0) * norm).toFixed(3);
        }
      }
      
      if (size !== 2 && size !== 4 && size !== 8 && size !== 16) {
         // Fallback if size is not power of 2
         for (let i = 0; i < size; i++) newMatrix[i][i] = 1; 
      }
    }

    updateNodeData(selectedNode.id, {
      params: {
        ...params,
        [paramKey]: {
          ...params[paramKey],
          value: newMatrix,
        },
      },
    });
  };

  return (
    <div className="pb-10">
      <div className="p-4 sm:p-6 border-b border-slate-800/50 bg-slate-800/20">
        <h3 className="text-lg font-bold text-slate-100 uppercase tracking-widest">{data.label}</h3>
        <p className="text-xs text-slate-400 mt-1 font-mono bg-slate-950/50 inline-block px-2 py-1 rounded-md">{selectedNode.id}</p>
        <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-prose">{data.description}</p>
      </div>

      <ReplaceNodeSection selectedNode={selectedNode} />

      <div className="p-4 sm:p-6 space-y-8 mt-2">
        {Object.entries(params).map(([key, param]: [string, any]) => {
          if (selectedNode.type === 'macro') {
            return (
              <div key={key} className="space-y-4 mb-4 border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                 <h3 className="text-[10px] font-bold text-slate-400 capitalize tracking-widest bg-slate-800/50 inline-block px-2 py-1 rounded">Module: {key.split('__').pop() || key}</h3>
                 {Object.keys(param).map(subKey => {
                   const subParam = param[subKey];
                   return (
                     <div key={`${key}_${subKey}`} className="space-y-4 pt-2">
                                              {subParam.type === 'string' ? (
                         <div className="space-y-2">
                           <div className="flex justify-between items-center pb-1">
                             <label className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{subParam.label || subKey}</label>
                           </div>
                           <input
                             type="text"
                             value={subParam.value}
                             onChange={(e) => {
                               const newParams = { ...params };
                               newParams[key] = { ...newParams[key] };
                               newParams[key][subKey] = { ...subParam, value: e.target.value };
                               updateNodeData(selectedNode.id, { params: newParams });
                             }}
                             className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono outline-none focus:border-blue-500"
                           />
                         </div>
                       ) : subParam.type === 'matrix' ? (
                         <div className="space-y-2">
                           <div className="flex justify-between items-center pb-1">
                             <div className="flex items-center space-x-2">
                               <label className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{subParam.label || subKey}</label>
                               <button 
                                 onClick={() => {
                                   const newParams = { ...params };
                                   newParams[key] = { ...newParams[key] };
                                   newParams[key][subKey] = { ...subParam, exposed: subParam.exposed === false ? true : false };
                                   updateNodeData(selectedNode.id, { params: newParams });
                                 }}
                                 className="text-slate-500 hover:text-blue-400 focus:outline-none"
                                 title={subParam.exposed === false ? 'Hidden on node' : 'Visible on node'}
                               >
                                 {subParam.exposed === false ? <EyeOff size={14} /> : <Eye size={14} />}
                               </button>
                             </div>
                           </div>
                           <div className="grid gap-2 overflow-x-auto pb-2" style={{ gridTemplateColumns: `repeat(${subParam.size}, minmax(4rem, 1fr))` }}>
                             {subParam.value.map((row: number[], r: number) => (
                               row.map((val: number, c: number) => (
                                 <input
                                   key={`${r}-${c}`}
                                   type="number"
                                   step={0.1}
                                   value={val}
                                   onChange={(e) => {
                                     const newMatrix = [...subParam.value];
                                     newMatrix[r] = [...newMatrix[r]];
                                     newMatrix[r][c] = parseFloat(e.target.value) || 0;
                                     
                                     const newParams = { ...params };
                                     newParams[key] = { ...newParams[key] };
                                     newParams[key][subKey] = { ...subParam, value: newMatrix };
                                     updateNodeData(selectedNode.id, { params: newParams });
                                   }}
                                   className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-center text-emerald-400 font-mono outline-none focus:border-blue-500 w-full"
                                 />
                               ))
                             ))}
                           </div>
                         </div>
                       ) : (
                         <>
                           <div className="flex justify-between items-end">
                             <div className="flex items-center space-x-2">
                               <label className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{subParam.label || subKey}</label>
                               <button 
                                 onClick={() => {
                                   const newParams = { ...params };
                                   newParams[key] = { ...newParams[key] };
                                   newParams[key][subKey] = { ...subParam, exposed: subParam.exposed === false ? true : false };
                                   updateNodeData(selectedNode.id, { params: newParams });
                                 }}
                                 className="text-slate-500 hover:text-blue-400 focus:outline-none"
                                 title={subParam.exposed === false ? 'Hidden on node' : 'Visible on node'}
                               >
                                 {subParam.exposed === false ? <EyeOff size={14} /> : <Eye size={14} />}
                               </button>
                             </div>
                             <div className="flex items-baseline space-x-1">
                               <span className="text-lg font-mono font-bold text-emerald-400">
                                 {Number(subParam.value).toFixed(Math.abs(subParam.step) < 0.1 ? 2 : 1)}
                               </span>
                             </div>
                           </div>
                           
                           <div className="relative pt-2 pb-2">
                             <input
                               type="range"
                               min={subParam.min}
                               max={subParam.max}
                               step={subParam.step}
                               value={subParam.value}
                               onChange={(e) => {
                                 const newParams = { ...params };
                                 newParams[key] = { ...newParams[key] };
                                 newParams[key][subKey] = { ...subParam, value: parseFloat(e.target.value) };
                                 updateNodeData(selectedNode.id, { params: newParams });
                               }}
                               className="w-full h-2.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 touch-manipulation focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                             />
                           </div>
                           
                           <div className="flex justify-between text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                             <span>Min {subParam.min}</span>
                             <span>Max {subParam.max}</span>
                           </div>
                         </>
                       )}
                     </div>
                   )
                 })}
              </div>
            )
          }

          return (
          <div key={key} className="space-y-4">
                        {param.type === 'string' ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{param.label || key}</label>
                <input
                   type="text"
                   value={param.value}
                   onChange={(e) => handleParamChange(key, e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono outline-none focus:border-blue-500"
                />
              </div>
            ) : param.type === 'matrix' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center pb-1">
                  <label className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{param.label || key}</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => applyMatrixTemplate(key, 'hadamard')} 
                      className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold px-2 py-1 rounded transition-colors uppercase tracking-wider"
                    >
                      Hadamard
                    </button>
                    <button 
                      onClick={() => applyMatrixTemplate(key, 'householder')} 
                      className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold px-2 py-1 rounded transition-colors uppercase tracking-wider"
                    >
                      Householder
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 overflow-x-auto pb-2" style={{ gridTemplateColumns: `repeat(${param.size}, minmax(4rem, 1fr))` }}>
                  {param.value.map((row: number[], r: number) => (
                    row.map((val: number, c: number) => (
                      <input
                        key={`${r}-${c}`}
                        type="number"
                        step={0.1}
                        value={val}
                        onChange={(e) => handleMatrixChange(key, r, c, parseFloat(e.target.value) || 0)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-center text-emerald-400 font-mono outline-none focus:border-blue-500 w-full"
                      />
                    ))
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{param.label || key}</label>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      {Number(param.value).toFixed(Math.abs(param.step) < 0.1 ? 2 : 1)}
                    </span>
                  </div>
                </div>
                
                <div className="relative pt-2 pb-2">
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={param.value}
                    onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                    className="w-full h-2.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 touch-manipulation focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                  />
                </div>
                
                <div className="flex justify-between text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  <span>Min {param.min}</span>
                  <span>Max {param.max}</span>
                </div>
              </>
            )}
          </div>
          );
        })}

        {Object.keys(params).length === 0 && (
          <div className="text-sm text-slate-500 italic text-center py-8">
            No configurable parameters for this module.
          </div>
        )}
      </div>
    </div>
  );
}
