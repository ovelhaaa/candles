const fs = require('fs');
let code = fs.readFileSync('src/components/Graph.tsx', 'utf8');

code = code.replace(
  "  oscilloscope: DSPNode,",
  "  oscilloscope: DSPNode,\n  knob: DSPNode,\n  math: DSPNode,"
);

fs.writeFileSync('src/components/Graph.tsx', code);
