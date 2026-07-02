const fs = require('fs');
let code = fs.readFileSync('src/audio/workletCode.ts', 'utf8');

const setGraphReplace = `
      if (e.data.type === 'SET_GRAPH') {
        this.nodes = e.data.nodes;
        // Pre-compile math expressions
        this.nodes.forEach(n => {
           if (n.type === 'math') {
               try {
                   n.compiledExpr = new Function('a', 'b', 'c', 'd', 'return (' + (n.data.expression || '0') + ');');
               } catch(err) {
                   n.compiledExpr = new Function('a', 'b', 'c', 'd', 'return 0;');
               }
           }
        });
        this.edges = e.data.edges;
`;
code = code.replace("      if (e.data.type === 'SET_GRAPH') {\n        this.nodes = e.data.nodes;\n        this.edges = e.data.edges;", setGraphReplace);

// Now for the knob and math processing.
// We can insert this right at the top of the node processing if/else chain, or at the bottom.
// In workletCode.ts:

const mathProc = `
         } else if (node.type === 'knob') {
             let val = node.data.value !== undefined ? node.data.value : 0.5;
             let min = node.data.minVal !== undefined ? node.data.minVal : 0;
             let max = node.data.maxVal !== undefined ? node.data.maxVal : 1;
             yL = min + val * (max - min);
             yR = yL;
         } else if (node.type === 'math') {
             let a = nodeInputs[node.id]['in-1'] ? nodeInputs[node.id]['in-1'].L : 0;
             let b = nodeInputs[node.id]['in-2'] ? nodeInputs[node.id]['in-2'].L : 0;
             let c = nodeInputs[node.id]['in-3'] ? nodeInputs[node.id]['in-3'].L : 0;
             let d = nodeInputs[node.id]['in-4'] ? nodeInputs[node.id]['in-4'].L : 0;
             if (node.compiledExpr) {
                 try {
                     yL = node.compiledExpr(a, b, c, d);
                 } catch(err) {
                     yL = 0;
                 }
             } else {
                 yL = 0;
             }
             yR = yL;
         } else if (node.type === 'delay') {`;

code = code.replace("         } else if (node.type === 'delay') {", mathProc);

fs.writeFileSync('src/audio/workletCode.ts', code);
