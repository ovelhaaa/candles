import React from 'react';
import { useStore } from '../store';
import { Plus, Play, Maximize, BoxSelect, Ungroup, Save } from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';
import { useReactFlow } from '@xyflow/react';

export function BottomActionBar() {
  const setAddNodeOpen = useStore((state) => state.setAddNodeOpen);
  const groupSelectedToMacro = useStore(state => state.groupSelectedToMacro);
  const ungroupMacro = useStore(state => state.ungroupMacro);
  
  const nodes = useStore((state) => state.nodes);
  const selectedNodes = nodes.filter(n => n.selected);
  const isMultiselect = selectedNodes.length > 1;
  const isMacroSelected = selectedNodes.length === 1 && selectedNodes[0].type === 'macro';
  
  const { fitView } = useReactFlow();
  
  const handlePlayImpulse = async () => {
    await audioEngine.init();
    audioEngine.playTestImpulse();
  };

  const handleGroup = () => {
    const name = window.prompt("Enter Macro Name", "New Macro");
    if (name) {
      groupSelectedToMacro(name);
    }
  };

  const handleUngroup = () => {
    if (isMacroSelected) {
       ungroupMacro(selectedNodes[0].id);
    }
  };

  const handleSaveMacro = () => {
    if (isMacroSelected) {
      const macroId = selectedNodes[0].data.macroId;
      const macroDef = useStore.getState().macros[macroId as string];
      if (macroDef) {
        const savedMacrosStr = localStorage.getItem('reverb_user_macros') || '[]';
        let savedMacros = [];
        try {
          savedMacros = JSON.parse(savedMacrosStr);
        } catch (e) {}
        
        // Remove if it already exists to overwrite, or just append
        savedMacros = savedMacros.filter((m: any) => m.id !== macroId);
        savedMacros.push(macroDef);
        
        localStorage.setItem('reverb_user_macros', JSON.stringify(savedMacros));
        alert('Macro saved as reusable module!');
      }
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center bg-slate-900/90 backdrop-blur-md rounded-full shadow-lg border border-slate-700/50 p-2 space-x-2">
      
      {isMultiselect && (
        <>
          <button 
            onClick={handleGroup}
            className="flex items-center gap-2 px-4 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors touch-manipulation shadow-sm text-sm"
            aria-label="Group to Macro"
          >
            <BoxSelect size={18} />
            <span>Group Macro</span>
          </button>
          <div className="w-px h-8 bg-slate-700 mx-1 rounded-full opacity-50"></div>
        </>
      )}

      {isMacroSelected && (
        <>
          <button 
            onClick={handleUngroup}
            className="flex items-center gap-2 px-4 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors touch-manipulation shadow-sm text-sm"
            aria-label="Ungroup Macro"
          >
            <Ungroup size={18} />
            <span>Ungroup</span>
          </button>
          <button 
            onClick={handleSaveMacro}
            className="flex items-center gap-2 px-4 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors touch-manipulation shadow-sm text-sm"
            aria-label="Save Macro to Library"
          >
            <Save size={18} />
            <span>Save to Library</span>
          </button>
          <div className="w-px h-8 bg-slate-700 mx-1 rounded-full opacity-50"></div>
        </>
      )}

      <button 
        onClick={handlePlayImpulse}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors touch-manipulation shadow-sm group"
        aria-label="Play Test Impulse"
        title="Play Test Impulse (Click node or press Play to trigger sound)"
      >
        <Play size={22} className="group-active:scale-95 transition-transform translate-x-[1px]" />
      </button>

      <div className="w-px h-8 bg-slate-700 mx-1 rounded-full opacity-50"></div>

      <button 
        onClick={() => setAddNodeOpen(true)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors touch-manipulation shadow-md ring-4 ring-slate-900 group"
        aria-label="Add Module"
        title="Add Modules"
      >
        <Plus size={28} className="group-active:scale-90 transition-transform" />
      </button>
      
      <div className="w-px h-8 bg-slate-700 mx-1 rounded-full opacity-50"></div>

      <button 
        onClick={() => {
          fitView({ duration: 800, padding: 0.2 });
        }}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors touch-manipulation shadow-sm group"
        aria-label="Center Graph"
        title="Center View"
      >
        <Maximize size={20} className="group-active:scale-75 transition-transform duration-300" />
      </button>

    </div>
  );
}
