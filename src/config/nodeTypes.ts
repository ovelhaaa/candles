export const NODE_TYPES = {
  knob: {
    type: 'knob',
    label: 'Macro Knob',
    description: 'Outputs a constant CV value. Use to control multiple parameters at once.',
    params: {
      value: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Value' },
      minVal: { value: 0, min: -1000, max: 1000, step: 0.1, label: 'Min Output' },
      maxVal: { value: 1, min: -1000, max: 1000, step: 0.1, label: 'Max Output' },
    },
    inputs: 0,
    outputs: 1,
  },
  math: {
    type: 'math',
    label: 'Math Expression',
    description: 'Evaluates a mathematical expression. Inputs mapped to variables a, b, c, d.',
    params: {
      expression: { type: 'string', value: 'a + b', label: 'Expression' }
    },
    inputs: 4,
    outputs: 1,
  },

  audioIn: {
    type: 'audioIn',
    label: 'Audio In',
    description: 'Input signal from live audio or audio file loop.',
    params: {},
    inputs: 0,
    outputs: 1,
  },
  audioOut: {
    type: 'audioOut',
    label: 'Audio Out',
    description: 'Final output signal to speakers.',
    params: {
      gain: { value: 1.0, min: 0.0, max: 2.0, step: 0.01, label: 'Output Gain' },
      limiter: { value: 1, min: 0, max: 1, step: 1, label: 'Limiter (0=Off, 1=On)' }
    },
    inputs: 1,
    outputs: 0,
  },
  delay: {
    type: 'delay',
    label: 'Delay Line',
    description: 'Delays the signal by a specified time. Essential building block for echoes and room size.',
    params: {
      delayMs: { value: 50, min: 0.1, max: 2000, step: 0.1, label: 'Delay (ms)' },
      feedback: { value: 0.0, min: -0.99, max: 0.99, step: 0.01, label: 'Feedback' },
    },
    inputs: 2,
    outputs: 1,
  },
  allpass: {
    type: 'allpass',
    label: 'Schroeder All-pass',
    description: 'Passes all frequencies equally but alters phase. Creates dense echoes (diffusion) without metallic ringing.',
    params: {
      delayMs: { value: 5, min: 0.1, max: 100, step: 0.1, label: 'Delay (ms)' },
      gain: { value: 0.7, min: -0.99, max: 0.99, step: 0.01, label: 'Gain (g)' },
    },
    inputs: 2,
    outputs: 1,
  },
  comb: {
    type: 'comb',
    label: 'Feedback Comb',
    description: 'A delay line with feedback and damping. Simulates sound bouncing between two parallel walls.',
    params: {
      delayMs: { value: 30, min: 0.1, max: 200, step: 0.1, label: 'Delay (ms)' },
      feedback: { value: 0.8, min: -0.99, max: 0.99, step: 0.01, label: 'Feedback' },
      damping: { value: 0.2, min: 0, max: 1, step: 0.01, label: 'Damping' },
    },
    inputs: 2,
    outputs: 1,
  },
  lpf: {
    type: 'lpf',
    label: 'Low-Pass Filter',
    description: 'Attenuates high frequencies. Used to simulate air absorption in large spaces.',
    params: {
      cutoff: { value: 5000, min: 20, max: 20000, step: 10, label: 'Cutoff (Hz)' },
    },
    inputs: 2,
    outputs: 1,
  },
  hpf: {
    type: 'hpf',
    label: 'High-Pass Filter',
    description: 'Attenuates low frequencies. Used to remove muddy rumble from reverb tails.',
    params: {
      cutoff: { value: 100, min: 20, max: 20000, step: 10, label: 'Cutoff (Hz)' },
    },
    inputs: 2,
    outputs: 1,
  },
  pitchShift: {
    type: 'pitchShift',
    label: 'Pitch Shifter',
    description: 'Shifts the pitch using granular delay lines. Great for shimmer reverbs.',
    params: {
      semitones: { value: 12, min: -24, max: 24, step: 1, label: 'Pitch (Semitones)' },
      windowMs: { value: 50, min: 10, max: 200, step: 1, label: 'Window Size (ms)' },
      mix: { value: 1.0, min: 0, max: 1, step: 0.01, label: 'Mix (Dry/Wet)' },
    },
    inputs: 1,
    outputs: 1,
  },
  audioFile: {
    type: 'audioFile',
    label: 'Audio File Loop',
    description: 'Upload and recursively loop an audio file through the graph.',
    params: {},
    inputs: 0,
    outputs: 1,
  },
  latency: {
    type: 'latency',
    label: 'Latency Analyzer',
    description: 'Measures propagation delay (ping graph). Produces an impulse and times its return.',
    params: {},
    inputs: 1,
    outputs: 1,
  },
  oscilloscope: {
    type: 'oscilloscope',
    label: 'Oscilloscope',
    description: 'Visualizes the waveform in time-domain.',
    params: {},
    inputs: 1,
    outputs: 1,
  },
  spectrum: {
    type: 'spectrum',
    label: 'Spectrum Analyzer',
    description: 'Visualizes the frequencies of the signal over time.',
    params: {},
    inputs: 1,
    outputs: 1,
  },
  lfo: {
    type: 'lfo',
    label: 'LFO',
    description: 'Low Frequency Oscillator for modulating other nodes.',
    params: {
      rate: { value: 1.0, min: 0.1, max: 20, step: 0.1, label: 'Rate (Hz)' },
      depth: { value: 1.0, min: 0, max: 100, step: 0.1, label: 'Depth' },
    },
    inputs: 0,
    outputs: 1,
  },
  modDelay: {
    type: 'modDelay',
    label: 'Modulated Delay',
    description: 'Delay line with modulation input (Chorus/Flanger).',
    params: {
      delayMs: { value: 20, min: 0.1, max: 100, step: 0.1, label: 'Base Delay (ms)' },
      feedback: { value: 0.5, min: -0.99, max: 0.99, step: 0.01, label: 'Feedback' },
    },
    inputs: 2, // 1: Audio, 2: Mod
    outputs: 1,
  },
  fdn4: {
    type: 'fdn4',
    label: '4x4 Matrix Mixer',
    description: 'Pure matrix mixer for building FDNs. Connect to external Delay and Damping nodes to form a full FDN loop.',
    params: {
      decay: { value: 0.8, min: 0.01, max: 1.0, step: 0.01, label: 'Decay' },
      matrix: {
        type: 'matrix',
        value: [
          [ 0.5,  0.5,  0.5,  0.5],
          [ 0.5, -0.5,  0.5, -0.5],
          [ 0.5,  0.5, -0.5, -0.5],
          [ 0.5, -0.5, -0.5,  0.5]
        ],
        size: 4,
        label: 'Feedback Matrix'
      }
    },
    inputs: 4,
    outputs: 4,
  },
  fdn8: {
    type: 'fdn8',
    label: '8x8 Matrix Mixer',
    description: '8x8 Pure matrix mixer for advanced FDN scattering topologies. Route through external Delays.',
    params: {
      decay: { value: 0.8, min: 0.01, max: 1.0, step: 0.01, label: 'Decay' },
      matrix: {
        type: 'matrix',
        value: [
          // 8x8 Householder
          [ 0.75, -0.25, -0.25, -0.25, -0.25, -0.25, -0.25, -0.25],
          [-0.25,  0.75, -0.25, -0.25, -0.25, -0.25, -0.25, -0.25],
          [-0.25, -0.25,  0.75, -0.25, -0.25, -0.25, -0.25, -0.25],
          [-0.25, -0.25, -0.25,  0.75, -0.25, -0.25, -0.25, -0.25],
          [-0.25, -0.25, -0.25, -0.25,  0.75, -0.25, -0.25, -0.25],
          [-0.25, -0.25, -0.25, -0.25, -0.25,  0.75, -0.25, -0.25],
          [-0.25, -0.25, -0.25, -0.25, -0.25, -0.25,  0.75, -0.25],
          [-0.25, -0.25, -0.25, -0.25, -0.25, -0.25, -0.25,  0.75]
        ],
        size: 8,
        label: '8x8 Feedback Matrix'
      }
    },
    inputs: 8,
    outputs: 8,
  },
  multitap: {
    type: 'multitap',
    label: 'Multi-Tap Delay',
    description: '4-tap delay line for specific early reflection simulation.',
    params: {
      t1: { value: 10, min: 0.1, max: 500, step: 0.1, label: 'Tap 1 (ms)' },
      g1: { value: 0.5, min: -1, max: 1, step: 0.01, label: 'Tap 1 Gain' },
      t2: { value: 25, min: 0.1, max: 500, step: 0.1, label: 'Tap 2 (ms)' },
      g2: { value: 0.3, min: -1, max: 1, step: 0.01, label: 'Tap 2 Gain' },
      t3: { value: 45, min: 0.1, max: 500, step: 0.1, label: 'Tap 3 (ms)' },
      g3: { value: 0.15, min: -1, max: 1, step: 0.01, label: 'Tap 3 Gain' },
      t4: { value: 70, min: 0.1, max: 500, step: 0.1, label: 'Tap 4 (ms)' },
      g4: { value: 0.05, min: -1, max: 1, step: 0.01, label: 'Tap 4 Gain' },
    },
    inputs: 1,
    outputs: 1,
  },
  damping: {
    type: 'damping',
    label: 'Loop Damping Filter',
    description: '1-pole filter specifically designed for placing inside feedback loops (absorber).',
    params: {
      cutoff: { value: 5000, min: 20, max: 20000, step: 10, label: 'Cutoff (Hz)' },
      filterType: { value: 0, min: 0, max: 1, step: 1, label: 'Filter Type (0=LP, 1=HP)' },
    },
    inputs: 2,
    outputs: 1,
  },
  macro: {
    type: 'macro',
    label: 'Macro Node',
    description: 'A collapsed view of multiple nodes grouped together.',
    params: {},
    inputs: 1,
    outputs: 1,
  },
  biquad: {
    type: 'biquad',
    label: 'Parametric EQ',
    description: 'Biquad filter (0:LPF, 1:HPF, 2:BPF, 3:LowShelf, 4:HighShelf, 5:Peak, 6:Notch)',
    params: {
      filterType: { value: 0, min: 0, max: 6, step: 1, label: 'Type' },
      freq: { value: 1000, min: 20, max: 20000, step: 1, label: 'Frequency' },
      q: { value: 0.707, min: 0.1, max: 10, step: 0.01, label: 'Q' },
      gain: { value: 0, min: -24, max: 24, step: 0.1, label: 'Gain (dB)' },
    },
    inputs: 2,
    outputs: 1,
  },
  clamp: {
    type: 'clamp',
    label: 'Clamper / Saturator',
    description: 'Prevents signal explosions. Modes: 0=Hard Clip, 1=Soft Clip (tanh), 2=Compressor',
    params: {
      mode: { value: 1, min: 0, max: 2, step: 1, label: 'Mode (0=Hard, 1=Soft, 2=Comp)' },
      threshold: { value: 1.0, min: 0.01, max: 2.0, step: 0.01, label: 'Threshold' },
      drive: { value: 1.0, min: 0.1, max: 10.0, step: 0.1, label: 'Drive' },
    },
    inputs: 2,
    outputs: 1,
  },
  mixer: {
    type: 'mixer',
    label: '4-Channel Mixer',
    description: 'Sums up to 4 stereo signals with individual gain controls.',
    params: {
      gain1: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Gain 1' },
      gain2: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Gain 2' },
      gain3: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Gain 3' },
      gain4: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Gain 4' },
      masterGain: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Master Gain' },
    },
    inputs: 4,
    outputs: 1,
  },
  envelope: {
    type: 'envelope',
    label: 'Envelope Follower',
    description: 'Extracts amplitude envelope, outputs slow varying signal for modulation.',
    params: {
      attack: { value: 10, min: 1, max: 500, step: 1, label: 'Attack (ms)' },
      release: { value: 100, min: 1, max: 2000, step: 1, label: 'Release (ms)' },
    },
    inputs: 1,
    outputs: 1,
  },
  stereoWidth: {
    type: 'stereoWidth',
    label: 'Stereo Spreader',
    description: 'Adjusts stereo width using Mid/Side processing.',
    params: {
      width: { value: 1.0, min: 0, max: 3, step: 0.01, label: 'Width' },
    },
    inputs: 1,
    outputs: 1,
  },
  panner: {
    type: 'panner',
    label: 'Auto-Panner',
    description: 'Pans signal. Use mod input 2 for LFO panning.',
    params: {
      pan: { value: 0, min: -1, max: 1, step: 0.01, label: 'Pan (L-R)' },
    },
    inputs: 2,
    outputs: 1,
  },
  chorus: {
    type: 'chorus',
    label: 'Chorus',
    description: 'Thickens audio via multiple modulating delay lines.',
    params: {
      rate: { value: 1.5, min: 0.1, max: 10, step: 0.1, label: 'Rate (Hz)' },
      depth: { value: 3.0, min: 0, max: 20, step: 0.1, label: 'Depth (ms)' },
      mix: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Mix' }
    },
    inputs: 1,
    outputs: 1,
  },
  tremolo: {
    type: 'tremolo',
    label: 'Tremolo',
    description: 'Amplitude modulation effect.',
    params: {
      rate: { value: 4.0, min: 0.1, max: 20, step: 0.1, label: 'Rate (Hz)' },
      depth: { value: 0.8, min: 0, max: 1, step: 0.01, label: 'Depth' },
      stereoPhase: { value: 0, min: 0, max: 180, step: 1, label: 'Phase (deg)' }
    },
    inputs: 1,
    outputs: 1,
  },
  phaser: {
    type: 'phaser',
    label: 'Phaser',
    description: 'Classic phaser sweeping all-pass filters.',
    params: {
      rate: { value: 0.5, min: 0.01, max: 10, step: 0.01, label: 'Rate (Hz)' },
      depth: { value: 0.8, min: 0, max: 1, step: 0.01, label: 'Depth' },
      feedback: { value: 0.4, min: -0.9, max: 0.9, step: 0.01, label: 'Feedback' },
      mix: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Mix' }
    },
    inputs: 1,
    outputs: 1,
  }
};
