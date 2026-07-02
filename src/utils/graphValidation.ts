import { Edge, Node } from '@xyflow/react';

export function analyzeCycles(nodes: Node[], edges: Edge[]): { zeroDelayEdges: string[], validFeedbackEdges: string[] } {
  const zeroDelayEdges = new Set<string>();
  const validFeedbackEdges = new Set<string>();

  const nodeMap = new Map<string, Node>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  const adj = new Map<string, { target: string; edgeId: string }[]>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    if (!adj.has(edge.source)) {
      adj.set(edge.source, []);
    }
    adj.get(edge.source)!.push({ target: edge.target, edgeId: edge.id });
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const edgeStack: { nodeId: string; edgeId: string }[] = [];

  const DELAY_NODES = new Set(['delay', 'modDelay', 'allpass', 'comb', 'pitchShift', 'multitap']);

  function dfs(nodeId: string) {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.target)) {
        edgeStack.push({ nodeId, edgeId: neighbor.edgeId });
        dfs(neighbor.target);
        edgeStack.pop();
      } else if (recursionStack.has(neighbor.target)) {
        // Cycle detected
        const cycleEdgeIds = [neighbor.edgeId];
        const cycleNodeIds = [neighbor.target]; // The target is part of the cycle
        
        for (let i = edgeStack.length - 1; i >= 0; i--) {
          cycleEdgeIds.push(edgeStack[i].edgeId);
          cycleNodeIds.push(edgeStack[i].nodeId);
          if (edgeStack[i].nodeId === neighbor.target) {
            break;
          }
        }

        let hasDelay = false;
        for (const cid of cycleNodeIds) {
          const n = nodeMap.get(cid);
          if (n && DELAY_NODES.has(n.type || '')) {
            hasDelay = true;
            break;
          }
        }

        for (const e of cycleEdgeIds) {
          if (hasDelay) {
            validFeedbackEdges.add(e);
          } else {
            zeroDelayEdges.add(e);
          }
        }
      }
    }

    recursionStack.delete(nodeId);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return {
    zeroDelayEdges: Array.from(zeroDelayEdges),
    validFeedbackEdges: Array.from(validFeedbackEdges),
  };
}
