import { Node, Edge } from '@xyflow/react';

export interface MacroPort {
  id: string; // 'in-1', 'out-1'
  internalNodeId: string;
  internalHandle: string;
}

export interface MacroDef {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  inPorts: MacroPort[];
  outPorts: MacroPort[];
}

export function flattenGraph(nodes: Node[], edges: Edge[], macros: Record<string, MacroDef>): { nodes: Node[], edges: Edge[] } {
  let currentNodes = JSON.parse(JSON.stringify(nodes)) as Node[];
  let currentEdges = JSON.parse(JSON.stringify(edges)) as Edge[];

  let hasMacros = true;
  while (hasMacros) {
    hasMacros = false;
    let nextNodes: Node[] = [];
    let nextEdges: Edge[] = [];

    const macroNodes = new Set(currentNodes.filter(n => n.type === 'macro').map(n => n.id));
    if (macroNodes.size > 0) hasMacros = true;

    for (const node of currentNodes) {
      if (node.type === 'macro') {
        const def = macros[node.data.macroId as string];
        if (!def) continue;

        for (const inode of def.nodes) {
          const cloned = JSON.parse(JSON.stringify(inode));
          cloned.id = `${node.id}__${inode.id}`;
          
          if (node.data.params && node.data.params[inode.id]) {
            cloned.data.params = JSON.parse(JSON.stringify(node.data.params[inode.id]));
          }
          nextNodes.push(cloned);
        }

        for (const iedge of def.edges) {
          nextEdges.push({
            ...iedge,
            id: `${node.id}__${iedge.id}`,
            source: `${node.id}__${iedge.source}`,
            target: `${node.id}__${iedge.target}`,
          });
        }
      } else {
        nextNodes.push(node);
      }
    }

    for (const edge of currentEdges) {
      if (macroNodes.has(edge.source) || macroNodes.has(edge.target)) {
        let sPorts = [{ id: edge.source, handle: edge.sourceHandle }];
        let tPorts = [{ id: edge.target, handle: edge.targetHandle }];

        if (macroNodes.has(edge.source)) {
          const sNode = currentNodes.find(n => n.id === edge.source);
          const def = macros[sNode?.data.macroId as string];
          const ports = def?.outPorts.filter(p => p.id === (edge.sourceHandle || 'out')) || [];
          if (ports.length > 0) {
            sPorts = ports.map(p => ({
              id: `${edge.source}__${p.internalNodeId}`,
              handle: p.internalHandle || 'out'
            }));
          } else {
             sPorts = []; // Invalid connection
          }
        }

        if (macroNodes.has(edge.target)) {
          const tNode = currentNodes.find(n => n.id === edge.target);
          const def = macros[tNode?.data.macroId as string];
          const ports = def?.inPorts.filter(p => p.id === (edge.targetHandle || 'in')) || [];
          if (ports.length > 0) {
            tPorts = ports.map(p => ({
              id: `${edge.target}__${p.internalNodeId}`,
              handle: p.internalHandle || 'in'
            }));
          } else {
            tPorts = []; // Invalid connection
          }
        }

        // Fan out connections
        for (const s of sPorts) {
          for (const t of tPorts) {
            nextEdges.push({
              ...edge,
              id: `${edge.id}_${s.id}_${t.id}`,
              source: s.id,
              sourceHandle: s.handle,
              target: t.id,
              targetHandle: t.handle,
            });
          }
        }
      } else {
        nextEdges.push(edge);
      }
    }

    currentNodes = nextNodes;
    currentEdges = nextEdges;
  }

  return { nodes: currentNodes, edges: currentEdges };
}
