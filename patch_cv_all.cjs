const fs = require('fs');
let code = fs.readFileSync('src/audio/workletCode.ts', 'utf8');

// The pattern is: let paramName = node.data.paramName !== undefined ? node.data.paramName : defaultVal;
// Or let paramName = node.data.paramName || defaultVal;
// Let's replace manually for safety because regex might get complicated.

const replacements = [
  ['node.data.rate !== undefined ? node.data.rate : 1.0', 'getCV("rate", 1.0)'],
  ['node.data.depth !== undefined ? node.data.depth : 1.0', 'getCV("depth", 1.0)'],
  ['node.data.decay !== undefined ? node.data.decay : 0.8', 'getCV("decay", 0.8)'],
  ['node.data.semitones !== undefined ? node.data.semitones : 12', 'getCV("semitones", 12)'],
  ['node.data.windowMs !== undefined ? node.data.windowMs : 50', 'getCV("windowMs", 50)'],
  ['node.data.mix !== undefined ? node.data.mix : 1.0', 'getCV("mix", 1.0)'],
  ['node.data.t1 || 10', 'getCV("t1", 10)'],
  ['node.data.g1 || 0.5', 'getCV("g1", 0.5)'],
  ['node.data.t2 || 25', 'getCV("t2", 25)'],
  ['node.data.g2 || 0.3', 'getCV("g2", 0.3)'],
  ['node.data.t3 || 45', 'getCV("t3", 45)'],
  ['node.data.g3 || 0.15', 'getCV("g3", 0.15)'],
  ['node.data.t4 || 70', 'getCV("t4", 70)'],
  ['node.data.g4 || 0.05', 'getCV("g4", 0.05)'],
  ['(node.data.drive !== undefined ? node.data.drive : 1.0) + modIn * 5', 'getCV("drive", 1.0) + modIn * 5'],
  ['node.data.threshold !== undefined ? node.data.threshold : 1.0', 'getCV("threshold", 1.0)'],
  ['node.data.attack !== undefined ? node.data.attack : 10', 'getCV("attack", 10)'],
  ['node.data.release !== undefined ? node.data.release : 100', 'getCV("release", 100)'],
  ['node.data.width !== undefined ? node.data.width : 1.0', 'getCV("width", 1.0)'],
  ['(node.data.pan !== undefined ? node.data.pan : 0) + modIn', 'getCV("pan", 0) + modIn'],
  ['node.data.rate !== undefined ? node.data.rate : 1.5', 'getCV("rate", 1.5)'],
  ['node.data.depth !== undefined ? node.data.depth : 3.0', 'getCV("depth", 3.0)'],
  ['node.data.mix !== undefined ? node.data.mix : 0.5', 'getCV("mix", 0.5)'],
  ['node.data.rate !== undefined ? node.data.rate : 4.0', 'getCV("rate", 4.0)'],
  ['node.data.depth !== undefined ? node.data.depth : 0.8', 'getCV("depth", 0.8)'],
  ['node.data.stereoPhase !== undefined ? node.data.stereoPhase : 0', 'getCV("stereoPhase", 0)'],
  ['node.data.rate !== undefined ? node.data.rate : 0.5', 'getCV("rate", 0.5)'],
  ['node.data.depth !== undefined ? node.data.depth : 0.8', 'getCV("depth", 0.8)'],
  ['node.data.feedback !== undefined ? node.data.feedback : 0.4', 'getCV("feedback", 0.4)'],
  ['node.data.mix !== undefined ? node.data.mix : 0.5', 'getCV("mix", 0.5)'],
  ['node.data.masterGain !== undefined ? node.data.masterGain : 1.0', 'getCV("masterGain", 1.0)'],
  ['node.data.gain !== undefined ? node.data.gain : 1.0', 'getCV("gain", 1.0)'],
  ['node.data[`gain${j}`] !== undefined ? node.data[`gain${j}`] : 1.0', 'getCV(`gain${j}`, 1.0)']
];

for (let [search, replace] of replacements) {
   code = code.replaceAll(search, replace);
}

fs.writeFileSync('src/audio/workletCode.ts', code);
