import React, { useCallback, useRef, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  useReactFlow,
  ConnectionMode,
} from '@xyflow/react';
import { Map, EyeOff } from 'lucide-react';
import { useStore } from '../store';
import { DSPNode } from './nodes/DSPNode';
import { analyzeCycles } from '../utils/graphValidation';

const nodeTypes = {
  audioIn: DSPNode,
  audioOut: DSPNode,
  delay: DSPNode,
  allpass: DSPNode,
  comb: DSPNode,
  lpf: DSPNode,
  hpf: DSPNode,
  mixer: DSPNode,
  lfo: DSPNode,
  modDelay: DSPNode,
  fdn4: DSPNode,
  fdn8: DSPNode,
  biquad: DSPNode,
  multitap: DSPNode,
  damping: DSPNode,
  macro: DSPNode,
  pitchShift: DSPNode,
  audioFile: DSPNode,
  oscilloscope: DSPNode,
  knob: DSPNode,
  math: DSPNode,
  spectrum: DSPNode,
  clamp: DSPNode,
  latency: DSPNode,
  envelope: DSPNode,
  stereoWidth: DSPNode,
  panner: DSPNode,
  chorus: DSPNode,
  tremolo: DSPNode,
  phaser: DSPNode,
};

export function Graph() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [showMiniMap, setShowMiniMap] = useState(true);
  
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const addNode = useStore((state) => state.addNode);
  const setSelectedNode = useStore((state) => state.setSelectedNode);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode],
  );

  const onSelectionChange = useCallback(({ nodes, edges: selectedEdges }: { nodes: any[], edges: any[] }) => {
    if (nodes.length > 0) {
      setSelectedNode(nodes[0]);
    } else {
      setSelectedNode(null);
    }
    
    if (selectedEdges.length > 0) {
      useStore.getState().setSelectedEdge(selectedEdges[0]);
    } else {
      useStore.getState().setSelectedEdge(null);
    }
  }, [setSelectedNode]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    useStore.getState().setPropertiesOpen(true);
  }, []);

  const styledEdges = useMemo(() => {
    const { zeroDelayEdges, validFeedbackEdges } = analyzeCycles(nodes, edges);
    const zeroDelaySet = new Set(zeroDelayEdges);
    const validFeedbackSet = new Set(validFeedbackEdges);
    return edges.map(edge => {
      if (zeroDelaySet.has(edge.id)) {
        return {
          ...edge,
          style: { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '4 4' }, // Red dashed for problematic
          animated: true,
        };
      }
      if (validFeedbackSet.has(edge.id)) {
        return {
          ...edge,
          style: { stroke: '#eab308', strokeWidth: 3 }, // Amber/Yellow for valid feedback cycles
          animated: true,
        };
      }
      return {
        ...edge,
        style: { stroke: '#64748b', strokeWidth: 3 },
        animated: false,
      }
    });
  }, [nodes, edges]);

  return (
    <div className="w-full h-full bg-slate-950" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onSelectionChange}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        connectionRadius={60}
        connectOnClick={true}
        fitView
        className="react-flow-dark"
      >
        <Background variant={BackgroundVariant.Dots} color="#334155" gap={24} size={2} />
        <Controls className="bg-slate-800 border-slate-700 fill-slate-200" />
        
        <Panel position="bottom-right" className="flex flex-col items-end gap-2 mb-4 mr-4">
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className="flex items-center justify-center w-8 h-8 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700 transition-colors shadow-md z-50"
            title={showMiniMap ? "Hide Minimap" : "Show Minimap"}
          >
            {showMiniMap ? <EyeOff size={16} /> : <Map size={16} />}
          </button>
        </Panel>

        {showMiniMap && (
          <MiniMap 
            nodeColor={(n: any) => {
              if (n.type === 'audioFile') return '#3b82f6';
              if (n.type === 'audioOut') return '#10b981';
              return '#1e293b';
            }}
            maskColor="rgba(15, 23, 42, 0.7)"
            className="bg-slate-900 border-slate-800 rounded-lg overflow-hidden !m-0 !mb-14 !mr-4" 
          />
        )}
      </ReactFlow>
    </div>
  );
}
