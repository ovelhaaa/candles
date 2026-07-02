const fs = require('fs');
let code = fs.readFileSync('src/audio/workletCode.ts', 'utf8');

// Insert getCV
code = code.replace(
  '         let s = this.state[node.id];',
  `         let s = this.state[node.id];
         let getCV = (param, def) => {
             let base = node.data[param] !== undefined ? node.data[param] : def;
             let cv = nodeInputs[node.id]['param-' + param];
             return cv ? base + cv.L : base;
         };`
);

// delay
code = code.replace(
  'let baseDelaySamples = ((node.data.delayMs || 50) / 1000) * this.sampleRate;',
  'let baseDelaySamples = (getCV("delayMs", 50) / 1000) * this.sampleRate;'
);
code = code.replace(
  'let fb = node.data.feedback || 0;',
  'let fb = getCV("feedback", 0);'
);

// allpass
code = code.replace(
  'let baseDelaySamples = ((node.data.delayMs || 5) / 1000) * this.sampleRate;',
  'let baseDelaySamples = (getCV("delayMs", 5) / 1000) * this.sampleRate;'
);
code = code.replace(
  'let g = node.data.gain || 0.5;',
  'let g = getCV("gain", 0.5);'
);

// comb
code = code.replace(
  'let baseDelaySamples = ((node.data.delayMs || 30) / 1000) * this.sampleRate;',
  'let baseDelaySamples = (getCV("delayMs", 30) / 1000) * this.sampleRate;'
);
code = code.replace(
  'let damp = node.data.damping || 0;',
  'let damp = getCV("damping", 0);'
);
code = code.replace(
  'let fb = node.data.feedback || 0.5;',
  'let fb = getCV("feedback", 0.5);'
);

// modDelay
code = code.replace(
  'let baseDelayMs = node.data.delayMs || 20;',
  'let baseDelayMs = getCV("delayMs", 20);'
);
// note fb already replaced maybe? let's do modDelay fb
code = code.replace(
  'let fb = node.data.feedback || 0;', // wait, modDelay uses this too?
  'let fb = getCV("feedback", 0);'
); // actually grep shows fb twice?

// filter (lpf/hpf)
code = code.replace(
  'let cutoff = (node.data.cutoff || 1000) + modIn * 1000;',
  'let cutoff = getCV("cutoff", 1000) + modIn * 1000;'
);
code = code.replace(
  'let cutoff = (node.data.cutoff || 100) + modIn * 1000;',
  'let cutoff = getCV("cutoff", 100) + modIn * 1000;'
);
// damping
code = code.replace(
  'let cutoff = (node.data.cutoff || 5000) + modIn * 1000;',
  'let cutoff = getCV("cutoff", 5000) + modIn * 1000;'
);

// biquad
code = code.replace(
  'let freq = (node.data.freq || 1000) + modIn * 1000;',
  'let freq = getCV("freq", 1000) + modIn * 1000;'
);
code = code.replace(
  'let Q = node.data.q || 0.707;',
  'let Q = getCV("q", 0.707);'
);
code = code.replace(
  'let dbGain = node.data.gain || 0;',
  'let dbGain = getCV("gain", 0);'
);

fs.writeFileSync('src/audio/workletCode.ts', code);
