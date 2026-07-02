const fs = require('fs');
let code = fs.readFileSync('src/components/AddNodeSheet.tsx', 'utf8');

code = code.replace(
  "{ title: 'Analysis', icon: <Blocks size={14} />, nodes: ['oscilloscope', 'spectrum', 'latency'] }",
  "{ title: 'Analysis', icon: <Blocks size={14} />, nodes: ['oscilloscope', 'spectrum', 'latency'] },\n              { title: 'Macros & Math', icon: <Blocks size={14} />, nodes: ['knob', 'math'] }"
);

fs.writeFileSync('src/components/AddNodeSheet.tsx', code);
