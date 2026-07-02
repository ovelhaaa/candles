import { NODE_TYPES } from './nodeTypes';
import { MacroDef } from '../utils/macroUtils';

// Helper to quickly generate nodes
function createNode(id: string, type: string, x: number, y: number, params: any = {}) {
  const nodeDef = NODE_TYPES[type as keyof typeof NODE_TYPES];
  return {
    id,
    type,
    position: { x, y },
    data: { ...nodeDef, params: { ...nodeDef.params, ...params } },
  };
}

// Helper to create an edge
function createEdge(source: string, target: string, sourceHandle?: string, targetHandle?: string) {
  return {
    id: `e_${source}_${target}_${Math.random()}`,
    source,
    target,
    sourceHandle: sourceHandle || 'out',
    targetHandle: targetHandle || 'in-1', // Default to in-1 for most nodes now or explicitly define it below
  };
}

export const FACTORY_MACROS: Record<string, MacroDef> = {
  macro_series_apf: {
    id: 'macro_series_apf',
    name: 'Series AllPass Chain',
    nodes: [
      createNode('apf1', 'allpass', 0, 0, { delayMs: { value: 11.3 } }),
      createNode('apf2', 'allpass', 200, 0, { delayMs: { value: 3.7 } }),
      createNode('apf3', 'allpass', 400, 0, { delayMs: { value: 1.5 } }),
    ],
    edges: [
      createEdge('apf1', 'apf2', 'out', 'in-1'),
      createEdge('apf2', 'apf3', 'out', 'in-1'),
    ],
    inPorts: [{ id: 'in', internalNodeId: 'apf1', internalHandle: 'in-1' }],
    outPorts: [{ id: 'out', internalNodeId: 'apf3', internalHandle: 'out' }],
  },
  macro_parallel_comb: {
    id: 'macro_parallel_comb',
    name: 'Parallel Combs',
    nodes: [
      createNode('comb1', 'comb', 200, -100, { delayMs: { value: 29.7 } }),
      createNode('comb2', 'comb', 200, 50, { delayMs: { value: 37.1 } }),
      createNode('comb3', 'comb', 200, 200, { delayMs: { value: 41.1 } }),
      createNode('comb4', 'comb', 200, 350, { delayMs: { value: 43.7 } }),
      createNode('mix', 'mixer', 500, 100),
    ],
    edges: [
      createEdge('comb1', 'mix', 'out', 'in-1'),
      createEdge('comb2', 'mix', 'out', 'in-2'),
      createEdge('comb3', 'mix', 'out', 'in-3'),
      createEdge('comb4', 'mix', 'out', 'in-4'),
    ],
    inPorts: [
      { id: 'in-1', internalNodeId: 'comb1', internalHandle: 'in-1' },
      { id: 'in-2', internalNodeId: 'comb2', internalHandle: 'in-1' },
      { id: 'in-3', internalNodeId: 'comb3', internalHandle: 'in-1' },
      { id: 'in-4', internalNodeId: 'comb4', internalHandle: 'in-1' }
    ],
    outPorts: [{ id: 'out-1', internalNodeId: 'mix', internalHandle: 'out' }],
  },
  macro_schroeder_reverb: {
    id: 'macro_schroeder_reverb',
    name: 'Schroeder Reverb',
    nodes: [
      createNode('comb1', 'comb', 0, -150, { delayMs: { value: 29.7 }, feedback: { value: 0.8 } }),
      createNode('comb2', 'comb', 0, 0, { delayMs: { value: 37.1 }, feedback: { value: 0.8 } }),
      createNode('comb3', 'comb', 0, 150, { delayMs: { value: 41.1 }, feedback: { value: 0.8 } }),
      createNode('comb4', 'comb', 0, 300, { delayMs: { value: 43.7 }, feedback: { value: 0.8 } }),
      createNode('mix', 'mixer', 300, 50, { gain1: { value: 0.5 }, gain2: { value: 0.5 }, gain3: { value: 0.5 }, gain4: { value: 0.5 } }),
      createNode('apf1', 'allpass', 600, 50, { delayMs: { value: 5.0 }, gain: { value: 0.7 } }),
      createNode('apf2', 'allpass', 900, 50, { delayMs: { value: 1.7 }, gain: { value: 0.7 } })
    ],
    edges: [
      createEdge('comb1', 'mix', 'out', 'in-1'),
      createEdge('comb2', 'mix', 'out', 'in-2'),
      createEdge('comb3', 'mix', 'out', 'in-3'),
      createEdge('comb4', 'mix', 'out', 'in-4'),
      createEdge('mix', 'apf1', 'out', 'in-1'),
      createEdge('apf1', 'apf2', 'out', 'in-1')
    ],
    inPorts: [
      { id: 'in', internalNodeId: 'comb1', internalHandle: 'in-1' },
      { id: 'in', internalNodeId: 'comb2', internalHandle: 'in-1' },
      { id: 'in', internalNodeId: 'comb3', internalHandle: 'in-1' },
      { id: 'in', internalNodeId: 'comb4', internalHandle: 'in-1' }
    ],
    outPorts: [{ id: 'out', internalNodeId: 'apf2', internalHandle: 'out' }]
  },
  macro_mod_delay: {
    id: 'macro_mod_delay',
    name: 'Modulated Delay Strip',
    nodes: [
       createNode('lfo', 'lfo', 0, -150, { rate: { value: 0.5 }, depth: { value: 5.0 } }),
       createNode('delay', 'modDelay', 100, 50, { delayMs: { value: 20 }, feedback: { value: 0.5 } }),
    ],
    edges: [
       createEdge('lfo', 'delay', 'out', 'in-2'), // mod input is in-2
    ],
    inPorts: [{ id: 'in', internalNodeId: 'delay', internalHandle: 'in-1' }],
    outPorts: [{ id: 'out', internalNodeId: 'delay', internalHandle: 'out' }],
  },
};
