import { Download, Code, List, Settings, Undo, Redo, AlertOctagon, RefreshCw, Wand2, EyeOff, Eye, Circle, Activity } from 'lucide-react';
import { useStore } from '../store';
import { audioEngine } from '../audio/AudioEngine';
import { exportToCpp } from '../utils/exportCpp';
import { useEffect, useState } from 'react';
import { NODE_TYPES } from '../config/nodeTypes';
import { flattenGraph } from '../utils/macroUtils';

export function TopBar() {
  const { nodes, edges, macros, setPresetsOpen, setAnalysisOpen, undo, redo, past, future, autoArrange, hideWarnings, setHideWarnings } = useStore();
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Sync graph to audio engine whenever it changes
    const flat = flattenGraph(nodes, edges, macros);
    audioEngine.updateGraph(flat.nodes, flat.edges);
  }, [nodes, edges, macros]);

  const handleExport = () => {
    const flat = flattenGraph(nodes, edges, macros);
    const code = exportToCpp(flat.nodes, flat.edges);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CustomReverb.cpp';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePanic = async () => {
    await audioEngine.suspendContext();
    audioEngine.panic();
  };

  const handleRestartAudio = async () => {
    audioEngine.panic();
    const flat = flattenGraph(nodes, edges, macros);
    audioEngine.updateGraph(flat.nodes, flat.edges);
    await audioEngine.resumeContext();
  };

  const toggleRecording = () => {
    if (isRecording) {
       audioEngine.stopRecording();
       setIsRecording(false);
    } else {
       audioEngine.startRecording();
       setIsRecording(true);
    }
  };

  return (
    <div className="h-14 sm:h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shadow-sm z-30 relative">
      <div className="flex items-center space-x-3 w-1/3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-inner">
          <span className="font-bold text-white text-lg leading-none">C</span>
        </div>
        <h1 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight leading-tight hidden sm:block">
          Candles<br/>
          <span className="text-[10px] sm:text-xs text-blue-400 font-medium uppercase tracking-wider">node based ambient dsp designer</span>
        </h1>
      </div>

      <div className="flex items-center justify-end space-x-2 w-2/3">
        <div className="flex items-center space-x-1 mr-2 border-r border-slate-700/50 pr-3">
          <button
            onClick={toggleRecording}
            className={`flex items-center space-x-1.5 p-1.5 rounded-lg transition-colors font-medium text-xs sm:px-3 ${isRecording ? 'text-red-400 bg-red-950/40 animate-pulse' : 'text-slate-400 hover:text-red-300 hover:bg-slate-800'}`}
            title="Record Audio to WAV"
          >
            <Circle size={16} className={isRecording ? "fill-red-400" : ""} />
            <span className="hidden sm:inline">{isRecording ? 'Recording...' : 'Record'}</span>
          </button>
          <button
            onClick={handlePanic}
            className="flex items-center space-x-1.5 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950 rounded-lg transition-colors font-medium text-xs sm:px-3"
            title="Stop Audio (Panic)"
          >
            <AlertOctagon size={16} />
            <span className="hidden sm:inline">Panic</span>
          </button>
          <button
            onClick={handleRestartAudio}
            className="flex items-center space-x-1.5 p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950 rounded-lg transition-colors font-medium text-xs sm:px-3"
            title="Restart Audio Engine"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>

        <div className="flex items-center space-x-1 mr-2 border-r border-slate-700/50 pr-3">
          <button
            onClick={() => setHideWarnings(!hideWarnings)}
            className={`p-1.5 rounded-lg transition-colors ${hideWarnings ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            title={hideWarnings ? "Show Warnings" : "Hide Warnings"}
          >
            {hideWarnings ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={autoArrange}
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Auto-Arrange Nodes"
          >
            <Wand2 size={18} />
          </button>
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Redo"
          >
            <Redo size={18} />
          </button>
        </div>

        <button
          onClick={() => setAnalysisOpen(true)}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          title="Acoustic Analysis"
        >
          <Activity size={16} className="text-emerald-400" />
          <span className="hidden sm:inline">Analysis</span>
        </button>

        <button
          onClick={() => setPresetsOpen(true)}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          title="Presets"
        >
          <List size={16} className="text-blue-400" />
          <span className="hidden sm:inline">Presets</span>
        </button>
        
        <button
          onClick={handleExport}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
          title="Export C++"
        >
          <Code size={16} />
          <span className="hidden sm:inline">Export Formats</span>
        </button>
      </div>
    </div>
  );
}
