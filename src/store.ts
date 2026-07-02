import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { NODE_TYPES } from './config/nodeTypes';
import { MacroDef, flattenGraph } from './utils/macroUtils';
import * as d3 from 'd3-force';

export type AppNode = Node;

type AppState = {
  nodes: AppNode[];
  edges: Edge[];
  macros: Record<string, MacroDef>;
  selectedNode: AppNode | null;
  selectedEdge: Edge | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (type: string, position: { x: number, y: number }) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  updateEdgeData: (edgeId: string, data: any) => void;
  replaceNode: (nodeId: string, newType: string) => void;
  setSelectedNode: (node: AppNode | null) => void;
  setSelectedEdge: (edge: Edge | null) => void;
  isAddNodeOpen: boolean;
  isPropertiesOpen: boolean;
  isPresetsOpen: boolean;
  isAnalysisOpen: boolean;
  setAddNodeOpen: (isOpen: boolean) => void;
  setPropertiesOpen: (isOpen: boolean) => void;
  setPresetsOpen: (isOpen: boolean) => void;
  setAnalysisOpen: (isOpen: boolean) => void;

  autoArrange: () => void;

  clipboard: { nodes: AppNode[]; edges: Edge[] } | null;
  copySelection: () => void;
  pasteSelection: () => void;
  // Settings
  hideWarnings: boolean;
  setHideWarnings: (hide: boolean) => void;
  // History system
  past: { nodes: AppNode[]; edges: Edge[]; macros: Record<string, MacroDef> }[];
  future: { nodes: AppNode[]; edges: Edge[]; macros: Record<string, MacroDef> }[];
  pushHistory: () => void;
  pushSequenceHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  groupSelectedToMacro: (name: string) => void;
  ungroupMacro: (nodeId: string) => void;
};

let changeSequenceTimeout: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<AppState>((set, get) => ({
  nodes: [
    { id: 'in', type: 'audioIn', position: { x: 50, y: 200 }, data: { ...NODE_TYPES.audioIn } },
    { id: 'out', type: 'audioOut', position: { x: 600, y: 200 }, data: { ...NODE_TYPES.audioOut } },
  ],
  edges: [],
  selectedNode: null,
  selectedEdge: null,
  clipboard: null,
  copySelection: () => {
    const state = get();
    const selectedNodes = state.nodes.filter((n) => n.selected);
    const selectedEdges = state.edges.filter((e) => e.selected);
    
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    
    set({ clipboard: { nodes: selectedNodes, edges: selectedEdges } });
  },
  pasteSelection: () => {
    const state = get();
    if (!state.clipboard) return;
    
    state.pushHistory();
    
    const { nodes: clipNodes, edges: clipEdges } = state.clipboard;
    
    // Map old IDs to new IDs
    const idMap = new Map<string, string>();
    const newNodes = clipNodes.map((n) => {
      const newId = `${n.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        selected: true,
        position: { x: n.position.x + 50, y: n.position.y + 50 } // offset
      };
    });
    
    const newEdges = clipEdges.map((e) => {
      const newId = `e-${idMap.get(e.source) || e.source}-${idMap.get(e.target) || e.target}-${Date.now()}`;
      return {
        ...e,
        id: newId,
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
        selected: true
      };
    }).filter(e => idMap.has(e.source) && idMap.has(e.target));
    // only paste edges if both source and target were copied and pasted together
    
    // Deselect current nodes/edges
    const currentNodes = state.nodes.map(n => ({ ...n, selected: false }));
    const currentEdges = state.edges.map(e => ({ ...e, selected: false }));
    
    set({
      nodes: [...currentNodes, ...newNodes],
      edges: [...currentEdges, ...newEdges]
    });
  },
  hideWarnings: false,
  setHideWarnings: (hide) => set({ hideWarnings: hide }),
  macros: {},
  past: [],
  future: [],
  pushHistory: () => set((state) => ({
    past: [...state.past, { nodes: state.nodes, edges: state.edges, macros: state.macros }].slice(-50),
    future: []
  })),
  pushSequenceHistory: () => {
    if (!changeSequenceTimeout) {
      get().pushHistory();
    }
    if (changeSequenceTimeout) clearTimeout(changeSequenceTimeout);
    changeSequenceTimeout = setTimeout(() => {
      changeSequenceTimeout = null;
    }, 1000);
  },
  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);
    return {
      past: newPast,
      nodes: previous.nodes,
      edges: previous.edges,
      macros: previous.macros || {},
      future: [{ nodes: state.nodes, edges: state.edges, macros: state.macros }, ...state.future],
      selectedNode: null,
      selectedEdge: null
    };
  }),
  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    return {
      past: [...state.past, { nodes: state.nodes, edges: state.edges, macros: state.macros }],
      nodes: next.nodes,
      edges: next.edges,
      macros: next.macros || {},
      future: newFuture,
      selectedNode: null,
      selectedEdge: null
    };
  }),
  clearHistory: () => set({ past: [], future: [] }),
  onNodesChange: (changes: NodeChange[]) => {
    if (changes.some(c => c.type === 'remove')) {
      get().pushHistory();
    } else if (changes.some(c => c.type === 'position')) {
      get().pushSequenceHistory();
    }
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    if (changes.some(c => c.type === 'remove')) {
      get().pushHistory();
    }
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    get().pushHistory();
    const newEdge = { ...connection, data: { sourceChannel: 'both', targetChannel: 'both' } };
    set({
      edges: addEdge(newEdge, get().edges),
    });
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (type, position) => {
    get().pushHistory();
    const nodeDef = NODE_TYPES[type as keyof typeof NODE_TYPES];
    if (!nodeDef) return;
    
    const newNode: AppNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { ...nodeDef },
    };
    set({ nodes: [...get().nodes, newNode] });
  },
  updateNodeData: (nodeId, data) => {
    get().pushSequenceHistory();
    set((state) => {
      const updatedNodes = state.nodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, ...data } };
        }
        return n;
      });
      const updatedNode = updatedNodes.find((n) => n.id === nodeId);
      return {
        nodes: updatedNodes,
        selectedNode: state.selectedNode?.id === nodeId ? updatedNode : state.selectedNode,
      };
    });
  },
  updateEdgeData: (edgeId, data) => {
    get().pushSequenceHistory();
    set((state) => {
      const updatedEdges = state.edges.map((e) => {
        if (e.id === edgeId) {
          return { ...e, data: { ...e.data, ...data } };
        }
        return e;
      });
      const updatedEdge = updatedEdges.find((e) => e.id === edgeId);
      return {
        edges: updatedEdges,
        selectedEdge: state.selectedEdge?.id === edgeId ? updatedEdge : state.selectedEdge,
      };
    });
  },
  replaceNode: (nodeId, newType) => {
    get().pushHistory();
    const nodeDef = NODE_TYPES[newType as keyof typeof NODE_TYPES];
    if (!nodeDef) return;

    set((state) => {
      let nodeRef = state.nodes.find(n => n.id === nodeId);
      if (!nodeRef) return state;

      const newNode = {
        ...nodeRef,
        type: newType,
        data: { ...nodeDef }
      };

      const newEdges = state.edges.filter(edge => {
        if (edge.source === nodeId) {
          if (nodeDef.outputs === 0) return false;
        }

        if (edge.target === nodeId) {
          if (nodeDef.inputs === 0) return false;
          const handle = edge.targetHandle;
          if (handle) {
            const match = handle.match(/^in-(\d+)$/);
            if (match) {
              const inIdx = parseInt(match[1]);
              if (inIdx > nodeDef.inputs) return false;
            } else if (handle === 'in' && nodeDef.inputs < 1) {
               return false;
            }
          }
        }
        return true;
      });

      return {
        nodes: state.nodes.map(n => n.id === nodeId ? newNode : n),
        edges: newEdges,
        selectedNode: state.selectedNode?.id === nodeId ? newNode : state.selectedNode,
      };
    });
  },
  setSelectedNode: (node) => set({ selectedNode: node }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge }),
  isAddNodeOpen: false,
  isPropertiesOpen: false,
  isPresetsOpen: false,
  isAnalysisOpen: false,
  setAddNodeOpen: (isOpen) => set({ isAddNodeOpen: isOpen }),
  setPropertiesOpen: (isOpen) => set({ isPropertiesOpen: isOpen }),
  setPresetsOpen: (isOpen) => set({ isPresetsOpen: isOpen }),
  setAnalysisOpen: (isOpen) => set({ isAnalysisOpen: isOpen }),
  autoArrange: () => {
    get().pushSequenceHistory();
    const state = get();
    const nodes = [...state.nodes];
    const edges = [...state.edges];
    
    // Create force nodes
    const forceNodes = nodes.map(n => ({
      ...n,
      vx: 0,
      vy: 0,
       // pin audioIn and audioOut to specific places if we want, or just let them float.
      fx: n.type === 'audioIn' ? 50 : undefined,
      fy: n.type === 'audioIn' ? 200 : undefined,
    }));
    
    // Audio out could be pinned to the right
    const inNode = forceNodes.find(n => n.type === 'audioIn');
    const outNode = forceNodes.find(n => n.type === 'audioOut');
    if (outNode && inNode) {
        // We'll let it be pulled by forces but maybe push it rightwards.
    }
    
    const forceLinks = edges.map(e => ({
      source: e.source,
      target: e.target
    }));

    const simulation = d3.forceSimulation(forceNodes as any)
      .force('link', d3.forceLink(forceLinks).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('collide', d3.forceCollide().radius(70).iterations(2))
      .force('x', d3.forceX(400).strength(0.05))
      .force('y', d3.forceY(300).strength(0.05));
      
    // Run simulation synchronously
    simulation.stop();
    for (let i = 0; i < 300; ++i) simulation.tick();
    
    const simNodes = forceNodes as any[];
    // Shift everything so it is mostly visible
    const xs = simNodes.map(n => n.x);
    const ys = simNodes.map(n => n.y);
    const minX = Math.min(...xs) - 50;
    const minY = Math.min(...ys) - 50;

    const newNodes = nodes.map((n, i) => {
        return {
            ...n,
            position: { x: simNodes[i].x - minX, y: simNodes[i].y - minY }
        };
    });
    
    set({ nodes: newNodes });
  },
  groupSelectedToMacro: (name) => set((state) => {
    const selectedNodes = state.nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) return {};
    
    state.pushHistory();

    const selectedIds = new Set(selectedNodes.map(n => n.id));
    
    const internalEdges = state.edges.filter(e => selectedIds.has(e.source) && selectedIds.has(e.target));
    const incomingEdges = state.edges.filter(e => !selectedIds.has(e.source) && selectedIds.has(e.target));
    const outgoingEdges = state.edges.filter(e => selectedIds.has(e.source) && !selectedIds.has(e.target));
    
    const inPorts: any[] = [];
    const inMap = new Map();
    let inCounter = 1;
    incomingEdges.forEach(e => {
      const key = `${e.target}-${e.targetHandle}`;
      if (!inMap.has(key)) {
        const portId = `in-${inCounter++}`;
        inMap.set(key, portId);
        inPorts.push({ id: portId, internalNodeId: e.target, internalHandle: e.targetHandle! });
      }
    });

    const outPorts: any[] = [];
    const outMap = new Map();
    let outCounter = 1;
    outgoingEdges.forEach(e => {
      const key = `${e.source}-${e.sourceHandle}`;
      if (!outMap.has(key)) {
        const portId = `out-${outCounter++}`;
        outMap.set(key, portId);
        outPorts.push({ id: portId, internalNodeId: e.source, internalHandle: e.sourceHandle! });
      }
    });

    const macroId = `macro_${Date.now()}`;
    const macroParams: any = {};
    for (const n of selectedNodes) {
      if (n.data?.params && Object.keys(n.data.params).length > 0) {
        macroParams[n.id] = JSON.parse(JSON.stringify(n.data.params));
      }
    }

    const cx = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
    const cy = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length;

    const macroNode = {
      id: `n_${Date.now()}`,
      type: 'macro',
      position: { x: cx, y: cy },
      data: {
        type: 'macro',
        macroId,
        label: name,
        params: macroParams,
        inputs: inPorts.length,
        outputs: outPorts.length
      }
    };

    let newEdges = state.edges.filter(e => !internalEdges.includes(e) && !incomingEdges.includes(e) && !outgoingEdges.includes(e));

    incomingEdges.forEach(e => {
      newEdges.push({
        ...e,
        target: macroNode.id,
        targetHandle: inMap.get(`${e.target}-${e.targetHandle}`)
      });
    });

    outgoingEdges.forEach(e => {
      newEdges.push({
        ...e,
        source: macroNode.id,
        sourceHandle: outMap.get(`${e.source}-${e.sourceHandle}`)
      });
    });

    return {
      nodes: [...state.nodes.filter(n => !selectedIds.has(n.id)), macroNode],
      edges: newEdges,
      macros: { 
        ...state.macros, 
        [macroId]: {
          id: macroId,
          name,
          nodes: JSON.parse(JSON.stringify(selectedNodes.map(n => ({...n, selected: false})))),
          edges: JSON.parse(JSON.stringify(internalEdges)),
          inPorts,
          outPorts
        }
      }
    };
  }),

  ungroupMacro: (nodeId) => set((state) => {
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'macro') return {};
    const macroDef = state.macros[node.data.macroId as string];
    if (!macroDef) return {};

    state.pushHistory();

    const cx = node.position.x;
    const cy = node.position.y;
    
    // Calculate offset
    const defCx = macroDef.nodes.reduce((sum, n) => sum + n.position.x, 0) / (macroDef.nodes.length || 1);
    const defCy = macroDef.nodes.reduce((sum, n) => sum + n.position.y, 0) / (macroDef.nodes.length || 1);
    const offsetX = cx - defCx;
    const offsetY = cy - defCy;

    const idMap = new Map();
    const unrolledNodes = macroDef.nodes.map(n => {
      const newId = `n_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      idMap.set(n.id, newId);
      
      const nodeParams = (node.data.params && node.data.params[n.id]) ? JSON.parse(JSON.stringify(node.data.params[n.id])) : n.data?.params;
      
      return {
        ...n,
        id: newId,
        selected: true,
        position: { x: n.position.x + offsetX, y: n.position.y + offsetY },
        data: { ...n.data, params: nodeParams }
      };
    });

    const unrolledEdges = macroDef.edges.map(e => ({
      ...e,
      id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      source: idMap.get(e.source),
      target: idMap.get(e.target)
    }));

    let newEdges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId);

    state.edges.forEach(e => {
      if (e.target === nodeId) {
        const port = macroDef.inPorts.find(p => p.id === e.targetHandle);
        if (port) {
          newEdges.push({
            ...e,
            target: idMap.get(port.internalNodeId),
            targetHandle: port.internalHandle
          });
        }
      }
      if (e.source === nodeId) {
        const port = macroDef.outPorts.find(p => p.id === e.sourceHandle);
        if (port) {
          newEdges.push({
            ...e,
            source: idMap.get(port.internalNodeId),
            sourceHandle: port.internalHandle
          });
        }
      }
    });

    return {
      nodes: [...state.nodes.filter(n => n.id !== nodeId), ...unrolledNodes.map(n => ({...n, selected: true}))],
      edges: [...newEdges, ...unrolledEdges]
    };
  })
}));
