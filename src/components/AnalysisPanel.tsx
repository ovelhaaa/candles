import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Activity, X, Play, Info } from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';

export function AnalysisPanel() {
  const isAnalysisOpen = useStore((state) => state.isAnalysisOpen);
  const setAnalysisOpen = useStore((state) => state.setAnalysisOpen);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rt60, setRt60] = useState<number | null>(null);
  const [edc, setEdc] = useState<Float32Array | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const analyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await audioEngine.analyzeIR(nodes, edges, 3.0);
      setRt60(result.rt60);
      setEdc(result.edc);
    } catch (e) {
      console.error(e);
    }
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (edc && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      for (let i = 0; i < edc.length; i++) {
        const x = (i / edc.length) * w;
        // db range from 0 to -60
        let db = edc[i];
        if (db < -60) db = -60;
        const y = h - ((db + 60) / 60) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [edc]);

  if (!isAnalysisOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => setAnalysisOpen(false)}
      />
      <div className="fixed inset-x-0 bottom-0 sm:top-0 sm:left-auto sm:right-0 sm:w-96 sm:h-full bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-700 sm:bottom-auto shadow-2xl z-50 flex flex-col transition-transform transform rounded-t-3xl sm:rounded-none max-h-[85vh] sm:max-h-full">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Activity className="text-blue-500" size={20} />
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-widest text-sm">Acoustic Analysis</h2>
          </div>
          <button 
            onClick={() => setAnalysisOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
           <button 
             onClick={analyze}
             disabled={isAnalyzing}
             className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
           >
             {isAnalyzing ? (
               <span className="animate-pulse">Analyzing Space...</span>
             ) : (
               <>
                 <Play size={18} />
                 <span>Capture Impulse Response</span>
               </>
             )}
           </button>

           {rt60 !== null && (
             <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl space-y-4">
               <div>
                 <div className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                   <span>RT60 (Decay Time)</span>
                   <Info size={12} className="text-slate-600" />
                 </div>
                 <div className="text-3xl font-bold font-mono text-emerald-400">
                   {rt60.toFixed(2)}s
                 </div>
                 <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                   Time required for the reverb energy to drop by 60dB. Calculated using Schroeder integration extrapolated from T25.
                 </p>
               </div>
               
               <div>
                 <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Energy Decay Curve</div>
                 <div className="w-full h-32 bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden">
                    <canvas ref={canvasRef} width={300} height={128} className="w-full h-full" />
                    
                    {/* Grid lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                      <div className="absolute top-1/4 w-full border-t border-slate-500"></div>
                      <div className="absolute top-1/2 w-full border-t border-slate-500"></div>
                      <div className="absolute top-3/4 w-full border-t border-slate-500"></div>
                    </div>
                 </div>
                 <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                   <span>0dB</span>
                   <span>-60dB</span>
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </>
  );
}
