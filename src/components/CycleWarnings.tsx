import React, { useMemo } from 'react';
import { useStore } from '../store';
import { analyzeCycles } from '../utils/graphValidation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { flattenGraph } from '../utils/macroUtils';

export function CycleWarnings() {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const macros = useStore((state) => state.macros);
  const hideWarnings = useStore((state) => state.hideWarnings);

  const { zeroDelayEdges, validFeedbackEdges } = useMemo(() => {
    return analyzeCycles(nodes, edges);
  }, [nodes, edges]);

  if (hideWarnings) return null;
  if (zeroDelayEdges.length === 0 && validFeedbackEdges.length === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-2 pointer-events-none">
      {zeroDelayEdges.length > 0 && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-sm">
          <AlertCircle className="w-4 h-4" />
          Zero-delay feedback loop detected. Audio may glitch! Add a delay node.
        </div>
      )}
      {validFeedbackEdges.length > 0 && zeroDelayEdges.length === 0 && (
        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          Valid feedback loop (closed with unit delay).
        </div>
      )}
    </div>
  );
}
