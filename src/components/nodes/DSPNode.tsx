import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Square, Upload, Settings2, Download } from 'lucide-react';
import { audioEngine } from '../../audio/AudioEngine';
import { useStore } from '../../store';

const FREE_LOOPS = [
  { name: 'Lo-Fi Melody (Loop)', url: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-buffer-source-node/loop/rnb-lofi-melody-loop.wav' },
  { name: 'Viper (Track)', url: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-analyser/viper.mp3' },
  { name: 'Outfoxing (Track)', url: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-basics/outfoxing.mp3' },
  { name: 'Drums (Loop)', url: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/multi-track/drums.mp3' }
];

export function DSPNode({ id, data, isConnectable, selected }: any) {
  const isAudioFile = data.type === 'audioFile' || data.type === 'audioIn' || Array.from(data.label || '').join('') === 'Audio File Loop';
  const isOscilloscope = data.type === 'oscilloscope';
  const isSpectrum = data.type === 'spectrum';
  const isAudioOut = data.type === 'audioOut';
  const isLatency = data.type === 'latency';
  
  const [fileLoaded, setFileLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isLoadingLoop, setIsLoadingLoop] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [peak, setPeak] = useState({ L: 0, R: 0 });
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  
  useEffect(() => {
    if (!isAudioOut) return;
    let isSubscribed = true;
    const handlePeak = (l: number, r: number) => {
        if (isSubscribed) setPeak({ L: l, R: r });
    };
    audioEngine.addPeakListener(handlePeak);
    return () => {
        isSubscribed = false;
        audioEngine.removePeakListener(handlePeak);
    };
  }, [isAudioOut]);

  useEffect(() => {
      if (!isLatency) return;
      let isSubscribed = true;
      const handleLatency = (ms: number) => {
          if (isSubscribed) setLatencyMs(ms);
      };
      audioEngine.addLatencyListener(id, handleLatency);
      return () => {
          isSubscribed = false;
          audioEngine.removeLatencyListener(id, handleLatency);
      };
  }, [id, isLatency]);
  
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setErrorMessage(null);
      try {
        const buffer = await audioEngine.loadAudioFileForNode(id, e.target.files[0]);
        setAudioBuffer(buffer);
        setFileLoaded(true);
      } catch (err: any) {
        setErrorMessage(err.message);
      }
    }
  };

  const loadFreeLoop = async (url: string) => {
    setIsLoadingLoop(true);
    setErrorMessage(null);
    try {
      const buffer = await audioEngine.loadAudioUrlForNode(id, url);
      setAudioBuffer(buffer);
      setFileLoaded(true);
    } catch (e: any) {
      console.error('Failed to load loop', e);
      setErrorMessage(e.message || 'Failed to load loop');
    }
    setIsLoadingLoop(false);
  };

  const togglePlay = () => {
    if (playing) {
      audioEngine.setAudioFilePlaying(id, false);
      setPlaying(false);
    } else {
      audioEngine.setAudioFilePlaying(id, true, false); // don't reset ptr by default unless we want strict restart
      setPlaying(true);
    }
  };
  
  const stopPlay = () => {
    audioEngine.setAudioFilePlaying(id, false, true);
    setPlaying(false);
  };

  useEffect(() => {
    if (!isOscilloscope && !isSpectrum) return;
    
    // WebGL or Canvas 2D spectrum analyzer
    const ctx = canvasRef.current?.getContext('2d');
    
    const handleVizData = (buffer: Float32Array) => {
      const canvas = canvasRef.current;
      if (!canvas || !ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      if (isOscilloscope) {
        ctx.beginPath();
        ctx.strokeStyle = '#22c55e'; // Emerald 500
        ctx.lineWidth = 2;
        
        const sliceWidth = width / buffer.length;
        let x = 0;
        
        for (let i = 0; i < buffer.length; i++) {
          // values are typically -1 to +1
          const v = buffer[i] * 0.5 + 0.5; // push up by half to make it 0 to 1
          const y = height - (v * height);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
      } else if (isSpectrum) {
         // Simple time-domain approximate "energy" or we would need an FFT here.
         // Actually doing FFT on the main thread inside UI isn't ideal but we can do a very crude rendering.
         // For a true spectrum, we'd do an FFT. Let's do a simple fast FFT approximation or just render raw buckets if we just want a placeholder.
         // For now, let's visualize absolute envelope since real FFT without a lib in vanilla JS takes ~100 lines.
         ctx.fillStyle = '#8b5cf6'; // Violet 500
         const buckets = 32;
         const step = Math.floor(buffer.length / buckets);
         const barWidth = (width / buckets) - 1;
         
         for (let i=0; i<buckets; i++) {
            let sum = 0;
            for(let j=0; j<step; j++) {
                sum += Math.abs(buffer[i * step + j]);
            }
            const avg = sum / step;
            // scale up for visibility
            const h = Math.min(avg * height * 4, height);
            ctx.fillRect(i * (barWidth + 1), height - h, barWidth, h);
         }
      }
    };

    audioEngine.addVizListener(id, handleVizData);
    
    return () => {
      audioEngine.removeVizListener(id, handleVizData);
    };
  }, [id, isOscilloscope, isSpectrum]);

  return (
    <div className={`
      relative min-w-[180px] rounded-xl border bg-slate-800 overflow-visible
      transition-all duration-200 flex flex-col shadow-xl z-10
      ${selected ? "border-blue-500 shadow-blue-500/30 ring-1 ring-blue-500 scale-[1.02] z-20" : "border-slate-700"}
    `}>
      {/* Node Header (Module Title) */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-slate-900 border-b border-slate-700 rounded-t-xl flex justify-between items-center px-3 z-0 pointer-events-none"></div>
      
      <div className="flex-1 px-4 pt-3 pb-4 flex flex-col z-10 relative">
      {data.inputs > 0 && (
        <>
          {Array.from({ length: data.inputs }).map((_, i) => {
            const prefix = data.inputs === 1 ? 'in' : `in-${i + 1}`;
            const blockHeight = 100 / data.inputs;
            const topBase = i * blockHeight;
            return (
              <React.Fragment key={i}>
                <Handle type="target" id={prefix} position={Position.Left} isConnectable={isConnectable} style={{ top: `${topBase + blockHeight * 0.5}%`, background: '#10b981', width: '18px', height: '18px', marginLeft: '-9px', border: '3px solid #1e293b' }} />
                {data.inputs > 1 && (
                  <div className="absolute -left-9 flex flex-col justify-center gap-[12px] text-[10px] font-bold text-slate-400 font-mono text-right w-6" style={{ top: `${topBase}%`, height: `${blockHeight}%` }}>
                    <span className="text-slate-300 font-bold mb-[2px] -ml-2 text-[8px] uppercase tracking-wider absolute w-full" style={{top: '50%', transform: 'translateY(-50%)'}}>
                      {(() => {
                         if (['delay', 'modDelay', 'comb', 'allpass', 'biquad', 'lpf', 'hpf', 'damping', 'clamp', 'panner'].includes(data.type)) {
                             return i === 0 ? 'IN' : 'MOD';
                         }
                         return `IN${i+1}`;
                      })()}
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </>
      )}
      
      <div className="font-bold text-sm mb-4 border-b border-slate-700/50 pb-2 text-slate-100 flex flex-col relative h-8 justify-center mt-[-4px]">
        <div className="flex justify-between items-center z-10">
          <span className={`text-xs uppercase tracking-wide ${data.bypassed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
            {data.label}
          </span>
          <div className="flex bg-slate-800 rounded-md">
            {id !== 'in' && id !== 'out' && data.type !== 'audioIn' && data.type !== 'audioOut' && data.type !== 'audioFile' && (
              <button 
                className={`p-1.5 transition-colors rounded-l-md ${data.bypassed ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'text-slate-400 hover:text-red-400 hover:bg-slate-700'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  useStore.getState().updateNodeData(id, { bypassed: !data.bypassed });
                }}
                title={data.bypassed ? "Enable Module" : "Bypass Module"}
              >
                <div className="w-3 h-3 rounded-full border-2 border-current flex items-center justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${data.bypassed ? 'bg-current' : 'bg-transparent'}`} />
                </div>
              </button>
            )}
            <button 
              className={`p-1.5 transition-colors ${data.bypassed ? 'rounded-md' : 'rounded-r-md'} text-slate-400 hover:text-blue-400 hover:bg-slate-700`}
              onClick={(e) => {
                e.stopPropagation();
                useStore.getState().setPropertiesOpen(true);
              }}
              title="Settings"
            >
              <Settings2 size={14} />
            </button>
          </div>
        </div>
      </div>
      
      {isAudioFile && (
        <div className="mb-2 flex flex-col gap-2 nodrag nopan pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          {errorMessage && (
            <div className="text-[10px] text-red-400 bg-red-950/50 p-1.5 rounded border border-red-900/50 leading-tight">
              {errorMessage}
            </div>
          )}
          {!fileLoaded ? (
            <>
              <label className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 cursor-pointer p-1.5 rounded text-xs transition-colors">
                <Upload size={14} />
                <span>Upload Audio</span>
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" onClick={(e) => e.stopPropagation()} />
              </label>
              <div className="text-[10px] text-center text-slate-500 font-medium">OR</div>
              <select 
                className="w-full bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded p-1.5 outline-none cursor-pointer"
                onChange={(e) => e.target.value && loadFreeLoop(e.target.value)}
                disabled={isLoadingLoop}
                value=""
              >
                <option value="" disabled>{isLoadingLoop ? 'Loading...' : 'Select a Free Loop...'}</option>
                {FREE_LOOPS.map((loop, idx) => (
                  <option key={idx} value={loop.url}>{loop.name}</option>
                ))}
              </select>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              {audioBuffer && (
                <div className="h-12 w-full bg-slate-900 rounded border border-slate-700 overflow-hidden relative">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full stroke-emerald-500 stroke-[0.5] fill-emerald-500/20">
                    <path d={(() => {
                      const data = audioBuffer.getChannelData(0);
                      const step = Math.ceil(data.length / 200);
                      let path = 'M 0,50';
                      for (let i = 0; i < 200; i++) {
                        const start = i * step;
                        if (start >= data.length) break;
                        let min = 1, max = -1;
                        for (let j = 0; j < step && start + j < data.length; j++) {
                          const v = data[start + j];
                          if (v < min) min = v;
                          if (v > max) max = v;
                        }
                        path += ` L ${i / 2},${50 - (max * 50)} L ${i / 2},${50 - (min * 50)}`;
                      }
                      return path;
                    })()} />
                  </svg>
                  {playing && (
                     <div className="absolute top-0 bottom-0 left-0 bg-white/20 w-1 animate-pulse" />
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 p-1.5 rounded-md text-xs font-bold transition-colors shadow-sm ${playing ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                   {playing ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                   {playing ? 'Pause' : 'Play'}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); stopPlay(); }} 
                  className="bg-slate-700 hover:bg-red-500 p-1.5 rounded-md transition-colors text-slate-300 hover:text-white"
                  title="Stop"
                >
                  <Square size={12} fill="currentColor" />
                </button>
              </div>
              <button 
                onClick={() => {
                  setFileLoaded(false);
                  setAudioBuffer(null);
                  stopPlay();
                }}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 p-1 rounded transition-colors"
              >
                Change Audio
              </button>
            </div>
          )}
        </div>
      )}

      {isLatency && (
          <div className="mb-2 flex flex-col gap-2 nodrag nopan pointer-events-auto items-center" onClick={(e) => e.stopPropagation()}>
            <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setLatencyMs(-2); // Reset to measuring state
                    audioEngine.triggerLatencyPing(id); 
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium p-2 rounded text-xs transition-colors shadow-sm"
            >
                Measure Ping
            </button>
            <div className="bg-slate-900 border border-slate-700 w-full h-10 flex items-center justify-center rounded-md font-mono text-sm shadow-inner">
                {latencyMs === null ? (
                    <span className="text-slate-500 text-xs">Waiting</span>
                ) : latencyMs === -2 ? (
                    <span className="text-blue-400 text-xs animate-pulse">Measuring...</span>
                ) : latencyMs === -1 ? (
                    <span className="text-red-400 font-bold">Timeout</span>
                ) : (
                    <span className="text-emerald-400 font-bold">{latencyMs.toFixed(2)} ms</span>
                )}
            </div>
          </div>
      )}

      {(isOscilloscope || isSpectrum) && (
        <div className="mb-2 border border-slate-900 rounded bg-black/50 overflow-hidden">
          <canvas ref={canvasRef} width={150} height={60} className="w-full block" />
        </div>
      )}
      
      {data.params && Object.keys(data.params).length > 0 && (
        <div className="text-xs text-slate-400 space-y-1">
          {(() => {
            let paramsToRender: { id: string, label: string, value: any, type: string, size?: number }[] = [];
            
            if (data.type === 'macro') {
              Object.entries(data.params).forEach(([nodeId, nodeParams]: [string, any]) => {
                Object.entries(nodeParams).forEach(([paramId, p]: [string, any]) => {
                  if (p.exposed !== false) {
                    paramsToRender.push({
                      id: `${nodeId}_${paramId}`,
                      label: `${nodeId.split('-')[0]}: ${p.label || paramId}`,
                      value: p.value,
                      type: p.type,
                      size: p.size
                    });
                  }
                });
              });
            } else {
              Object.entries(data.params).forEach(([k, v]: [string, any]) => {
                paramsToRender.push({
                  id: k,
                  label: v.label || k,
                  value: v.value,
                  type: v.type,
                  size: v.size
                });
              });
            }

            return (
              <>
                {paramsToRender.filter(p => p.type === 'matrix').map(p => (
                  <div key={p.id} className="flex justify-between items-center text-slate-500 italic mt-1">
                    <span className="truncate mr-2 border-slate-700/50">{p.label}:</span>
                    <span className="font-mono bg-slate-800/50 px-1 rounded">[{p.size}x{p.size}]</span>
                  </div>
                ))}

                {paramsToRender.filter(p => p.type === 'string').map(p => (
                  <div key={p.id} className="flex flex-col gap-1 nodrag cursor-auto" onClick={e => e.stopPropagation()}>
                    <span className="truncate mr-2 text-[10px] uppercase text-slate-500">{p.label}</span>
                    <input 
                      type="text" 
                      value={p.value}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-emerald-400 font-mono nodrag"
                      onChange={(e) => {
                         const val = e.target.value;
                         if (data.type === 'macro') {
                           const [nodeId, paramId] = p.id.split('_');
                           useStore.getState().updateNodeData(id, {
                             params: { ...data.params, [nodeId]: { ...data.params[nodeId], [paramId]: { ...data.params[nodeId][paramId], value: val } } }
                           });
                         } else {
                           useStore.getState().updateNodeData(id, {
                             params: { ...data.params, [p.id]: { ...data.params[p.id], value: val } }
                           });
                         }
                      }}
                    />
                  </div>
                ))}

                {paramsToRender.length > 4 && data.type !== 'matrix' ? (
                   <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2">
                   {paramsToRender.filter(p => p.type !== 'matrix' && p.type !== 'string').map(p => {
                     const def = p.id.includes('_') ? data.params[p.id.split('_')[0]][p.id.split('_')[1]] : data.params[p.id];
                     return (
                       <div key={p.id} className="flex flex-col gap-1 nodrag cursor-auto relative group" onClick={e => e.stopPropagation()}>
                         <Handle type="target" id={`param-${p.id}`} position={Position.Left} style={{ top: '10px', left: '-12px', background: '#eab308', width: '8px', height: '8px', border: '1px solid #1e293b' }} />
                         <div className="absolute -left-9 top-1 text-[8px] font-bold text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">CV</div>
                         <div className="flex justify-between items-center">
                           <span className="truncate mr-1 text-[9px] uppercase text-slate-500">{p.label}</span>
                           <span className="font-mono text-[10px] text-slate-200">{Number(p.value).toFixed(1)}</span>
                         </div>
                         <input 
                           type="range" 
                           className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500 nodrag"
                           min={def?.min} max={def?.max} step={def?.step} value={p.value}
                           onChange={(e) => {
                             const val = parseFloat(e.target.value);
                             if (data.type === 'macro') {
                               const [nodeId, paramId] = p.id.split('_');
                               useStore.getState().updateNodeData(id, {
                                 params: { ...data.params, [nodeId]: { ...data.params[nodeId], [paramId]: { ...data.params[nodeId][paramId], value: val } } }
                               });
                             } else {
                               useStore.getState().updateNodeData(id, {
                                 params: { ...data.params, [p.id]: { ...data.params[p.id], value: val } }
                               });
                             }
                           }}
                         />
                       </div>
                     )
                   })}
                   </div>
                ) : (
                   <div className="space-y-2 mt-2">
                   {paramsToRender.filter(p => p.type !== 'matrix' && p.type !== 'string').map(p => {
                     const def = p.id.includes('_') ? data.params[p.id.split('_')[0]][p.id.split('_')[1]] : data.params[p.id];
                     return (
                       <div key={p.id} className="flex flex-col gap-1 nodrag cursor-auto relative group" onClick={e => e.stopPropagation()}>
                         <Handle type="target" id={`param-${p.id}`} position={Position.Left} style={{ top: '10px', left: '-12px', background: '#eab308', width: '8px', height: '8px', border: '1px solid #1e293b' }} />
                         <div className="absolute -left-9 top-1 text-[8px] font-bold text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">CV</div>
                         <div className="flex justify-between items-center">
                           <span className="truncate mr-2 text-[10px] uppercase text-slate-500">{p.label}</span>
                           <span className="font-mono text-xs text-slate-200">{Number(p.value).toFixed(2)}</span>
                         </div>
                         <input 
                           type="range" 
                           className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500 nodrag"
                           min={def?.min} max={def?.max} step={def?.step} value={p.value}
                           onChange={(e) => {
                             const val = parseFloat(e.target.value);
                             if (data.type === 'macro') {
                               const [nodeId, paramId] = p.id.split('_');
                               useStore.getState().updateNodeData(id, {
                                 params: { ...data.params, [nodeId]: { ...data.params[nodeId], [paramId]: { ...data.params[nodeId][paramId], value: val } } }
                               });
                             } else {
                               useStore.getState().updateNodeData(id, {
                                 params: { ...data.params, [p.id]: { ...data.params[p.id], value: val } }
                               });
                             }
                           }}
                         />
                       </div>
                     )
                   })}
                   </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      
      {isAudioOut && (
        <div className="flex flex-col gap-1 mt-2">
           <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-1">
             <span>L</span>
             <span>{Math.max(-60, 20 * Math.log10(peak.L || 0.0001)).toFixed(1)} dB</span>
           </div>
           <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
             <div 
               className="h-full bg-emerald-500 transition-all duration-100 ease-out origin-left" 
               style={{ width: `${Math.min(100, Math.max(0, (20 * Math.log10(peak.L || 0.0001) + 60) / 60 * 100))}%` }} 
             />
             {peak.L > 0.99 && <div className="absolute top-0 right-0 h-full w-1 bg-red-500" />}
           </div>
           
           <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-1 mb-1">
             <span>R</span>
             <span>{Math.max(-60, 20 * Math.log10(peak.R || 0.0001)).toFixed(1)} dB</span>
           </div>
           <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
             <div 
               className="h-full bg-emerald-500 transition-all duration-100 ease-out origin-left" 
               style={{ width: `${Math.min(100, Math.max(0, (20 * Math.log10(peak.R || 0.0001) + 60) / 60 * 100))}%` }} 
             />
             {peak.R > 0.99 && <div className="absolute top-0 right-0 h-full w-1 bg-red-500" />}
           </div>
        </div>
      )}

      {Object.keys(data.params || {}).length === 0 && !isAudioFile && !isOscilloscope && !isSpectrum && !isAudioOut && (
        <div className="text-xs text-slate-500 italic">No parameters</div>
      )}

      {data.outputs > 0 && (
        <>
          {Array.from({ length: data.outputs }).map((_, i) => {
            const prefix = data.outputs === 1 ? 'out' : `out-${i + 1}`;
            const blockHeight = 100 / data.outputs;
            const topBase = i * blockHeight;
            return (
              <React.Fragment key={i}>
                <Handle type="source" id={prefix} position={Position.Right} isConnectable={isConnectable} style={{ top: `${topBase + blockHeight * 0.5}%`, background: '#3b82f6', width: '18px', height: '18px', marginRight: '-9px', border: '3px solid #1e293b' }} />
                {data.outputs > 1 && (
                  <div className="absolute -right-9 flex flex-col justify-center gap-[12px] text-[10px] font-bold text-slate-400 font-mono text-left w-6" style={{ top: `${topBase}%`, height: `${blockHeight}%` }}>
                    <span className="text-slate-300 font-bold -mr-2 text-[8px] uppercase tracking-wider absolute w-full" style={{top: '50%', transform: 'translateY(-50%)'}}>OUT{i+1}</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </>
      )}
      </div>
    </div>
  );
}
