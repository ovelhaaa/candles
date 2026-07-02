const fs = require('fs');
let code = fs.readFileSync('src/config/nodeTypes.ts', 'utf8');

code = code.replace(
  "label: '4x4 FDN Matrix',",
  "label: '4x4 Matrix Mixer',"
);
code = code.replace(
  "description: 'Hadamard matrix mixer for dense reverberation scattering.',",
  "description: 'Pure matrix mixer for building FDNs. Connect to external Delay and Damping nodes to form a full FDN loop.',"
);

code = code.replace(
  "label: '8x8 FDN Matrix',",
  "label: '8x8 Matrix Mixer',"
);
code = code.replace(
  "description: 'Large scattering matrix for highly dense late reverberation tails.',",
  "description: '8x8 Pure matrix mixer for advanced FDN scattering topologies. Route through external Delays.',"
);

fs.writeFileSync('src/config/nodeTypes.ts', code);
