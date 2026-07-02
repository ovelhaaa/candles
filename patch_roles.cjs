const fs = require('fs');
let code = fs.readFileSync('src/components/AddNodeSheet.tsx', 'utf8');

code = code.replace(
  "biquad: \"Used for precise equalization of the reverb tank or cutting resonant modes.\",",
  "biquad: \"Used for precise equalization of the reverb tank or cutting resonant modes.\",\n    knob: \"Global parameter control. Use to map a single knob to multiple parameters inside the network.\",\n    math: \"Evaluates expressions (e.g. a * b, Math.exp(-a)). Essential for creating proportional mappings across multiple delays.\","
);

fs.writeFileSync('src/components/AddNodeSheet.tsx', code);
