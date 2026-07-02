/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TopBar } from './components/TopBar';
import { Graph } from './components/Graph';
import { CycleWarnings } from './components/CycleWarnings';
import { PropertiesPanel } from './components/PropertiesPanel';
import { AddNodeSheet } from './components/AddNodeSheet';
import { BottomActionBar } from './components/BottomActionBar';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { PresetsPanel } from './components/PresetsPanel';
import { AnalysisPanel } from './components/AnalysisPanel';
import { useEffect } from 'react';
import { useStore } from './store';

export default function App() {
  const { undo, redo, copySelection, pasteSelection } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        // e.preventDefault();
        copySelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        // e.preventDefault();
        pasteSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, copySelection, pasteSelection]);

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-slate-950 text-slate-200 font-sans touch-none overscroll-none overflow-hidden relative">
      <ReactFlowProvider>
        <TopBar />
        <div className="flex-1 relative border-slate-800">
          <Graph />
          <CycleWarnings />
        </div>

        <BottomActionBar />
        <AddNodeSheet />
        <PropertiesPanel />
        <PresetsPanel />
        <AnalysisPanel />
        <OnboardingOverlay />
      </ReactFlowProvider>
    </div>
  );
}
