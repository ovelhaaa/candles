import { NODE_TYPES } from './nodeTypes';

export const PRESETS = [
  {
    id: 'schroeder',
    name: 'Schroeder Reverb',
    description: 'Classic algorithmic reverb with comb and allpass filters.',
    nodes: [
      { id: 'in', type: 'audioIn', position: { x: 50, y: 200 }, data: { ...NODE_TYPES.audioIn } },
      { id: 'c1', type: 'comb', position: { x: 250, y: 50 }, data: { ...NODE_TYPES.comb, params: { delayMs: { value: 29.7, min: 0.1, max: 200, step: 0.1, label: 'Delay (ms)' }, feedback: { value: 0.75, min: -0.99, max: 0.99, step: 0.01, label: 'Feedback' }, damping: { value: 0.2, min: 0, max: 1, step: 0.01, label: 'Damping' } } } },
      { id: 'c2', type: 'comb', position: { x: 250, y: 200 }, data: { ...NODE_TYPES.comb, params: { delayMs: { value: 37.1, min: 0.1, max: 200, step: 0.1, label: 'Delay (ms)' }, feedback: { value: 0.75, min: -0.99, max: 0.99, step: 0.01, label: 'Feedback' }, damping: { value: 0.2, min: 0, max: 1, step: 0.01, label: 'Damping' } } } },
      { id: 'c3', type: 'comb', position: { x: 250, y: 350 }, data: { ...NODE_TYPES.comb, params: { delayMs: { value: 41.1, min: 0.1, max: 200, step: 0.1, label: 'Delay (ms)' }, feedback: { value: 0.75, min: -0.99, max: 0.99, step: 0.01, label: 'Feedback' }, damping: { value: 0.2, min: 0, max: 1, step: 0.01, label: 'Damping' } } } },
      { id: 'mix', type: 'mixer', position: { x: 450, y: 200 }, data: { ...NODE_TYPES.mixer, params: { gain1: { value: 0.3, min: 0, max: 2, step: 0.01, label: 'Gain 1' }, gain2: { value: 0.3, min: 0, max: 2, step: 0.01, label: 'Gain 2' }, gain3: { value: 0.3, min: 0, max: 2, step: 0.01, label: 'Gain 3' }, gain4: { value: 0.0, min: 0, max: 2, step: 0.01, label: 'Gain 4' }, masterGain: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Master Gain' } } } },
      { id: 'ap1', type: 'allpass', position: { x: 600, y: 200 }, data: { ...NODE_TYPES.allpass, params: { delayMs: { value: 5.0, min: 0.1, max: 100, step: 0.1, label: 'Delay (ms)' }, gain: { value: 0.7, min: -0.99, max: 0.99, step: 0.01, label: 'Gain (g)' } } } },
      { id: 'ap2', type: 'allpass', position: { x: 750, y: 200 }, data: { ...NODE_TYPES.allpass, params: { delayMs: { value: 1.7, min: 0.1, max: 100, step: 0.1, label: 'Delay (ms)' }, gain: { value: 0.7, min: -0.99, max: 0.99, step: 0.01, label: 'Gain (g)' } } } },
      { id: 'out', type: 'audioOut', position: { x: 900, y: 200 }, data: { ...NODE_TYPES.audioOut } },
    ],
    edges: [
      { id: 'e-in-c1', source: 'in', target: 'c1', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-in-c2', source: 'in', target: 'c2', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-in-c3', source: 'in', target: 'c3', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-c1-mix', source: 'c1', target: 'mix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-c2-mix', source: 'c2', target: 'mix', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-c3-mix', source: 'c3', target: 'mix', sourceHandle: 'out', targetHandle: 'in-3' },
      { id: 'e-mix-ap1', source: 'mix', target: 'ap1', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-ap1-ap2', source: 'ap1', target: 'ap2', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-ap2-out', source: 'ap2', target: 'out', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e-in-out', source: 'in', target: 'out', sourceHandle: 'out', targetHandle: 'in' }, // Dry signal
    ]
  },
  {
    id: 'simple-delay',
    name: 'Simple Echo',
    description: 'A basic delay module fed back into itself via a mixer.',
    nodes: [
      { id: 'in', type: 'audioIn', position: { x: 50, y: 200 }, data: { ...NODE_TYPES.audioIn } },
      { id: 'mix', type: 'mixer', position: { x: 250, y: 200 }, data: { ...NODE_TYPES.mixer, params: { gain1: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Dry Gain' }, gain2: { value: 0.6, min: 0, max: 2, step: 0.01, label: 'Feedback Gain' }, gain3: { value: 0.0, min: 0, max: 2, step: 0.01, label: 'Gain 3' }, gain4: { value: 0.0, min: 0, max: 2, step: 0.01, label: 'Gain 4' }, masterGain: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Master Gain' } } } },
      { id: 'delay', type: 'delay', position: { x: 450, y: 350 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 300, min: 1, max: 2000, step: 1, label: 'Delay Time (ms)' } } } },
      { id: 'out', type: 'audioOut', position: { x: 550, y: 200 }, data: { ...NODE_TYPES.audioOut } }
    ],
    edges: [
      { id: 'e-in-mix', source: 'in', target: 'mix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-mix-out', source: 'mix', target: 'out', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e-mix-delay', source: 'mix', target: 'delay', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-delay-mix', source: 'delay', target: 'mix', sourceHandle: 'out', targetHandle: 'in-2' }
    ]
  },
  {
    id: 'fdn-reverb',
    name: '4x4 FDN Reverb',
    description: 'Modern algorithmic reverb using a 4x4 Feedback Delay Network.',
    nodes: [
      { id: 'in', type: 'audioIn', position: { x: 50, y: 250 }, data: { ...NODE_TYPES.audioIn } },
      { id: 'in-mix', type: 'mixer', position: { x: 250, y: 250 }, data: { ...NODE_TYPES.mixer, params: { ...NODE_TYPES.mixer.params } } },
      { id: 'd1', type: 'delay', position: { x: 450, y: 50 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 29.7, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'd2', type: 'delay', position: { x: 450, y: 150 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 37.1, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'd3', type: 'delay', position: { x: 450, y: 250 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 41.1, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'd4', type: 'delay', position: { x: 450, y: 350 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 43.7, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'fdn', type: 'fdn4', position: { x: 700, y: 200 }, data: { ...NODE_TYPES.fdn4, params: { ...NODE_TYPES.fdn4.params } } },
      { id: 'out-mix', type: 'mixer', position: { x: 950, y: 250 }, data: { ...NODE_TYPES.mixer, params: { ...NODE_TYPES.mixer.params } } },
      { id: 'out', type: 'audioOut', position: { x: 1150, y: 250 }, data: { ...NODE_TYPES.audioOut } }
    ],
    edges: [
      { id: 'e-in-inmix', source: 'in', target: 'in-mix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-inmix-d1', source: 'in-mix', target: 'd1', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-inmix-d2', source: 'in-mix', target: 'd2', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-inmix-d3', source: 'in-mix', target: 'd3', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-inmix-d4', source: 'in-mix', target: 'd4', sourceHandle: 'out', targetHandle: 'in-1' },
      
      { id: 'e-d1-fdn', source: 'd1', target: 'fdn', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-d2-fdn', source: 'd2', target: 'fdn', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-d3-fdn', source: 'd3', target: 'fdn', sourceHandle: 'out', targetHandle: 'in-3' },
      { id: 'e-d4-fdn', source: 'd4', target: 'fdn', sourceHandle: 'out', targetHandle: 'in-4' },
      
      { id: 'e-fdn-d1', source: 'fdn', target: 'd1', sourceHandle: 'out-1', targetHandle: 'in-1' },
      { id: 'e-fdn-d2', source: 'fdn', target: 'd2', sourceHandle: 'out-2', targetHandle: 'in-1' },
      { id: 'e-fdn-d3', source: 'fdn', target: 'd3', sourceHandle: 'out-3', targetHandle: 'in-1' },
      { id: 'e-fdn-d4', source: 'fdn', target: 'd4', sourceHandle: 'out-4', targetHandle: 'in-1' },
      
      { id: 'e-fdn-outmix1', source: 'fdn', target: 'out-mix', sourceHandle: 'out-1', targetHandle: 'in-1' },
      { id: 'e-fdn-outmix2', source: 'fdn', target: 'out-mix', sourceHandle: 'out-2', targetHandle: 'in-2' },
      { id: 'e-in-outmix', source: 'in', target: 'out-mix', sourceHandle: 'out', targetHandle: 'in-4' }, // Dry
      { id: 'e-outmix-out', source: 'out-mix', target: 'out', sourceHandle: 'out', targetHandle: 'in' }
    ]
  },
  {
    id: 'chorus',
    name: 'Simple Chorus',
    description: 'Modulated delay line creating a widening chorus effect.',
    nodes: [
      { id: 'in', type: 'audioIn', position: { x: 50, y: 200 }, data: { ...NODE_TYPES.audioIn } },
      { id: 'mix', type: 'mixer', position: { x: 550, y: 200 }, data: { ...NODE_TYPES.mixer, params: { ...NODE_TYPES.mixer.params, gain1: { value: 0.7, min: 0, max: 2, step: 0.01, label: 'Dry' }, gain2: { value: 0.7, min: 0, max: 2, step: 0.01, label: 'Wet' } } } },
      { id: 'mod', type: 'modDelay', position: { x: 300, y: 350 }, data: { ...NODE_TYPES.modDelay, params: { ...NODE_TYPES.modDelay.params, baseDelay: { value: 20, min: 0.1, max: 100, step: 0.1, label: 'Base Delay (ms)' }, modDepth: { value: 5, min: 0, max: 50, step: 0.1, label: 'Depth (ms)' }, modRate: { value: 1.5, min: 0.1, max: 20, step: 0.1, label: 'Rate (Hz)' } } } },
      { id: 'lfo', type: 'lfo', position: { x: 50, y: 350 }, data: { ...NODE_TYPES.lfo, params: { rate: { value: 1.5, min: 0.1, max: 20, step: 0.1, label: 'Rate (Hz)' }, depth: { value: 5, min: 0, max: 100, step: 0.1, label: 'Depth' } } } },
      { id: 'out', type: 'audioOut', position: { x: 750, y: 200 }, data: { ...NODE_TYPES.audioOut } }
    ],
    edges: [
      { id: 'e-in-mix', source: 'in', target: 'mix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-in-mod', source: 'in', target: 'mod', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-lfo-mod', source: 'lfo', target: 'mod', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-mod-mix', source: 'mod', target: 'mix', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-mix-out', source: 'mix', target: 'out', sourceHandle: 'out', targetHandle: 'in' }
    ]
  },
  {
    id: 'early-reflections-diffusion',
    name: 'Early Reflections & Diffusion',
    description: 'A setup demonstrating multi-tap delays for early reflections feeding into a series of all-pass filters for dense diffusion, simulating a natural room.',
    nodes: [
      { id: 'in', type: 'audioIn', position: { x: 50, y: 300 }, data: { ...NODE_TYPES.audioIn } },
      { id: 'mt', type: 'multitap', position: { x: 250, y: 150 }, data: { ...NODE_TYPES.multitap, params: { ...NODE_TYPES.multitap.params, t1: { value: 15.3, min: 0.1, max: 500, step: 0.1, label: 'Tap 1 (ms)' }, g1: { value: 0.7, min: -1, max: 1, step: 0.01, label: 'Tap 1 Gain' }, t2: { value: 29.5, min: 0.1, max: 500, step: 0.1, label: 'Tap 2 (ms)' }, g2: { value: 0.5, min: -1, max: 1, step: 0.01, label: 'Tap 2 Gain' }, t3: { value: 47.1, min: 0.1, max: 500, step: 0.1, label: 'Tap 3 (ms)' }, g3: { value: 0.3, min: -1, max: 1, step: 0.01, label: 'Tap 3 Gain' }, t4: { value: 68.2, min: 0.1, max: 500, step: 0.1, label: 'Tap 4 (ms)' }, g4: { value: 0.2, min: -1, max: 1, step: 0.01, label: 'Tap 4 Gain' } } } },
      { id: 'ap1', type: 'allpass', position: { x: 550, y: 150 }, data: { ...NODE_TYPES.allpass, params: { delayMs: { value: 4.3, min: 0.1, max: 100, step: 0.1, label: 'Delay (ms)' }, gain: { value: 0.7, min: -0.99, max: 0.99, step: 0.01, label: 'Gain (g)' } } } },
      { id: 'ap2', type: 'allpass', position: { x: 750, y: 150 }, data: { ...NODE_TYPES.allpass, params: { delayMs: { value: 1.7, min: 0.1, max: 100, step: 0.1, label: 'Delay (ms)' }, gain: { value: 0.7, min: -0.99, max: 0.99, step: 0.01, label: 'Gain (g)' } } } },
      { id: 'damp', type: 'damping', position: { x: 950, y: 150 }, data: { ...NODE_TYPES.damping, params: { cutoff: { value: 4000, min: 20, max: 20000, step: 10, label: 'Cutoff (Hz)' }, filterType: { value: 0, min: 0, max: 1, step: 1, label: 'Filter Type (0=LP, 1=HP)' } } } },
      { id: 'mix', type: 'mixer', position: { x: 1150, y: 300 }, data: { ...NODE_TYPES.mixer, params: { ...NODE_TYPES.mixer.params, gain1: { value: 0.7, min: 0, max: 2, step: 0.01, label: 'Dry' }, gain2: { value: 0.5, min: 0, max: 2, step: 0.01, label: 'Wet' } } } },
      { id: 'out', type: 'audioOut', position: { x: 1350, y: 300 }, data: { ...NODE_TYPES.audioOut } }
    ],
    edges: [
      { id: 'e-in-mix', source: 'in', target: 'mix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-in-mt', source: 'in', target: 'mt', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e-mt-ap1', source: 'mt', target: 'ap1', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-ap1-ap2', source: 'ap1', target: 'ap2', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-ap2-damp', source: 'ap2', target: 'damp', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e-damp-mix', source: 'damp', target: 'mix', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-mix-out', source: 'mix', target: 'out', sourceHandle: 'out', targetHandle: 'in' }
    ]
  },
  {
    id: 'shimmer-echo',
    name: 'Shimmer Echo',
    description: 'An ethereal echo that shifts pitch up an octave each repetition.',
    nodes: [
      { id: 'in', type: 'audioIn', position: { x: 50, y: 200 }, data: { ...NODE_TYPES.audioIn } },
      { id: 'fbMix', type: 'mixer', position: { x: 250, y: 200 }, data: { ...NODE_TYPES.mixer, params: { ...NODE_TYPES.mixer.params, gain1: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'In' }, gain2: { value: 0.6, min: 0, max: 2, step: 0.01, label: 'FB' } } } },
      { id: 'pitch', type: 'pitchShift', position: { x: 450, y: 200 }, data: { ...NODE_TYPES.pitchShift, params: { ...NODE_TYPES.pitchShift.params, semitones: { value: 12, min: -24, max: 24, step: 1, label: 'Pitch' }, mix: { value: 1.0, min: 0, max: 1, step: 0.01, label: 'Mix' } } } },
      { id: 'delay', type: 'delay', position: { x: 650, y: 200 }, data: { ...NODE_TYPES.delay, params: { ...NODE_TYPES.delay.params, delayMs: { value: 400, min: 1, max: 2000, step: 1, label: 'Time (ms)' } } } },
      { id: 'outMix', type: 'mixer', position: { x: 850, y: 350 }, data: { ...NODE_TYPES.mixer, params: { ...NODE_TYPES.mixer.params, gain1: { value: 0.8, min: 0, max: 2, step: 0.01, label: 'Dry' }, gain2: { value: 0.6, min: 0, max: 2, step: 0.01, label: 'Wet' } } } },
      { id: 'out', type: 'audioOut', position: { x: 1050, y: 350 }, data: { ...NODE_TYPES.audioOut } }
    ],
    edges: [
      { id: 'e-in-fbmix', source: 'in', target: 'fbMix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-fbmix-pitch', source: 'fbMix', target: 'pitch', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e-pitch-delay', source: 'pitch', target: 'delay', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-delay-fbmix', source: 'delay', target: 'fbMix', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-in-outmix', source: 'in', target: 'outMix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-delay-outmix', source: 'delay', target: 'outMix', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-outmix-out', source: 'outMix', target: 'out', sourceHandle: 'out', targetHandle: 'in' }
    ]
  },
  {
    id: 'tape-echo',
    name: 'Tape Echo',
    description: 'A driven analog-style delay with modulation, filtering, and soft clipping in the feedback loop.',
    nodes: [
      { id: 'in', type: 'audioIn', position: { x: 50, y: 200 }, data: { ...NODE_TYPES.audioIn } },
      { id: 'mix', type: 'mixer', position: { x: 250, y: 200 }, data: { ...NODE_TYPES.mixer, params: { ...NODE_TYPES.mixer.params, gain1: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Dry' }, gain2: { value: 0.8, min: 0, max: 2, step: 0.01, label: 'FB' } } } },
      { id: 'lpf', type: 'lpf', position: { x: 450, y: 350 }, data: { ...NODE_TYPES.lpf, params: { ...NODE_TYPES.lpf.params, cutoff: { value: 2000, min: 20, max: 20000, step: 10, label: 'Tone' } } } },
      { id: 'lfo', type: 'lfo', position: { x: 450, y: 450 }, data: { ...NODE_TYPES.lfo, params: { ...NODE_TYPES.lfo.params, rate: { value: 0.5, min: 0.01, max: 20, step: 0.01, label: 'Wow Rate' }, depth: { value: 0.03, min: 0, max: 1, step: 0.01, label: 'Wow Dpth' } } } },
      { id: 'delay', type: 'modDelay', position: { x: 650, y: 350 }, data: { ...NODE_TYPES.modDelay, params: { ...NODE_TYPES.modDelay.params, delayMs: { value: 400, min: 1, max: 2000, step: 1, label: 'Time' } } } },
      { id: 'clamp', type: 'clamp', position: { x: 850, y: 350 }, data: { ...NODE_TYPES.clamp, params: { ...NODE_TYPES.clamp.params, mode: { value: 1, min: 0, max: 2, step: 1, label: 'Mode' }, threshold: { value: 0.5, min: 0.01, max: 2.0, step: 0.01, label: 'Threshold' }, drive: { value: 1.5, min: 0.1, max: 10.0, step: 0.1, label: 'Drive' } } } },
      { id: 'outMix', type: 'mixer', position: { x: 1050, y: 200 }, data: { ...NODE_TYPES.mixer, params: { ...NODE_TYPES.mixer.params, gain1: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Dry' }, gain2: { value: 0.5, min: 0, max: 2, step: 0.01, label: 'Wet' } } } },
      { id: 'out', type: 'audioOut', position: { x: 1250, y: 200 }, data: { ...NODE_TYPES.audioOut } }
    ],
    edges: [
      { id: 'e-in-mix', source: 'in', target: 'mix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-in-outmix', source: 'in', target: 'outMix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-mix-lpf', source: 'mix', target: 'lpf', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-lfo-mod', source: 'lfo', target: 'delay', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-lpf-delay', source: 'lpf', target: 'delay', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-delay-clamp', source: 'delay', target: 'clamp', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-clamp-outmix', source: 'clamp', target: 'outMix', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-clamp-mixFB', source: 'clamp', target: 'mix', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-outmix-out', source: 'outMix', target: 'out', sourceHandle: 'out', targetHandle: 'in' },
    ]
  },
  {
    id: 'shimmer-reverb',
    name: 'Shimmer Reverb',
    description: 'Ethereal reverb with an octave pitch shifter enclosed inside a feedback loop.',
    nodes: [
      { id: 'in', type: 'audioIn', position: { x: 50, y: 250 }, data: { ...NODE_TYPES.audioIn } },
      { id: 'in-mix', type: 'mixer', position: { x: 250, y: 250 }, data: { ...NODE_TYPES.mixer, params: { ...NODE_TYPES.mixer.params } } },
      { id: 'd1', type: 'delay', position: { x: 450, y: 50 }, data: { ...NODE_TYPES.delay, params: { ...NODE_TYPES.delay.params, delayMs: { value: 67.0, min: 1, max: 2000, step: 0.1, label: 'Time' } } } },
      { id: 'd2', type: 'delay', position: { x: 450, y: 150 }, data: { ...NODE_TYPES.delay, params: { ...NODE_TYPES.delay.params, delayMs: { value: 71.0, min: 1, max: 2000, step: 0.1, label: 'Time' } } } },
      { id: 'd3', type: 'delay', position: { x: 450, y: 250 }, data: { ...NODE_TYPES.delay, params: { ...NODE_TYPES.delay.params, delayMs: { value: 73.0, min: 1, max: 2000, step: 0.1, label: 'Time' } } } },
      { id: 'pitch', type: 'pitchShift', position: { x: 450, y: 400 }, data: { ...NODE_TYPES.pitchShift, params: { ...NODE_TYPES.pitchShift.params, semitones: { value: 12.0, min: -24, max: 24, step: 0.1, label: 'Pitch' } } } },
      { id: 'fdn', type: 'fdn4', position: { x: 700, y: 200 }, data: { ...NODE_TYPES.fdn4, params: { ...NODE_TYPES.fdn4.params, decay: { value: 0.7, min: 0.01, max: 1.0, step: 0.01, label: 'Decay' } } } },
      { id: 'out-mix', type: 'mixer', position: { x: 950, y: 250 }, data: { ...NODE_TYPES.mixer, params: { ...NODE_TYPES.mixer.params } } },
      { id: 'out', type: 'audioOut', position: { x: 1150, y: 250 }, data: { ...NODE_TYPES.audioOut } }
    ],
    edges: [
      { id: 'e-in-mix', source: 'in', target: 'in-mix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-in-outmix', source: 'in', target: 'out-mix', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m-d1', source: 'in-mix', target: 'd1', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m-d2', source: 'in-mix', target: 'd2', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m-d3', source: 'in-mix', target: 'd3', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m-pitch', source: 'in-mix', target: 'pitch', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-d1-f', source: 'd1', target: 'fdn', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-d2-f', source: 'd2', target: 'fdn', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-d3-f', source: 'd3', target: 'fdn', sourceHandle: 'out', targetHandle: 'in-3' },
      { id: 'e-pitch-f', source: 'pitch', target: 'fdn', sourceHandle: 'out', targetHandle: 'in-4' },
      { id: 'e-f-m1', source: 'fdn', target: 'in-mix', sourceHandle: 'out-1', targetHandle: 'in-2' },
      { id: 'e-f-m2', source: 'fdn', target: 'in-mix', sourceHandle: 'out-2', targetHandle: 'in-3' },
      { id: 'e-f-o1', source: 'fdn', target: 'out-mix', sourceHandle: 'out-1', targetHandle: 'in-2' },
      { id: 'e-f-o2', source: 'fdn', target: 'out-mix', sourceHandle: 'out-2', targetHandle: 'in-3' },
      { id: 'e-f-o3', source: 'fdn', target: 'out-mix', sourceHandle: 'out-3', targetHandle: 'in-4' },
      { id: 'e-o-o', source: 'out-mix', target: 'out', sourceHandle: 'out', targetHandle: 'in' },
    ]
  },
  {
    id: 'giant-space-fdn8',
    name: 'Giant Space (FDN-8)',
    description: 'A huge, dense reverb using an 8x8 Feedback Delay Network.',
    nodes: [
      { id: 'in', type: 'audioIn', position: { x: 50, y: 400 }, data: { ...NODE_TYPES.audioIn } },
      // Mix incoming down to 8 lines
      { id: 'inMix1', type: 'mixer', position: { x: 200, y: 200 }, data: { ...NODE_TYPES.mixer } },
      { id: 'inMix2', type: 'mixer', position: { x: 200, y: 600 }, data: { ...NODE_TYPES.mixer } },
      
      { id: 'd1', type: 'delay', position: { x: 400, y: 50 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 73.1, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'd2', type: 'delay', position: { x: 400, y: 150 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 89.3, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'd3', type: 'delay', position: { x: 400, y: 250 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 101.9, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'd4', type: 'delay', position: { x: 400, y: 350 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 111.7, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'd5', type: 'delay', position: { x: 400, y: 450 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 123.1, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'd6', type: 'delay', position: { x: 400, y: 550 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 137.3, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'd7', type: 'delay', position: { x: 400, y: 650 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 149.9, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      { id: 'd8', type: 'delay', position: { x: 400, y: 750 }, data: { ...NODE_TYPES.delay, params: { delayMs: { value: 163.7, min: 1, max: 2000, step: 0.1, label: 'Delay Time (ms)' } } } },
      
      { id: 'fdn8', type: 'fdn8', position: { x: 650, y: 400 }, data: { ...NODE_TYPES.fdn8, params: { ...NODE_TYPES.fdn8.params, decay: { value: 0.75, min: 0.01, max: 1.0, step: 0.01, label: 'Decay' } } } },
      
      { id: 'outMix1', type: 'mixer', position: { x: 900, y: 300 }, data: { ...NODE_TYPES.mixer } },
      { id: 'clamp1', type: 'clamp', position: { x: 1000, y: 300 }, data: { ...NODE_TYPES.clamp, params: { ...NODE_TYPES.clamp.params, mode: {value: 1, min: 0, max: 2, step: 1, label: 'Mode'}, drive: {value: 2.0, min: 0.1, max: 10, step: 0.1, label: 'Drive'} } } },
      { id: 'out', type: 'audioOut', position: { x: 1200, y: 300 }, data: { ...NODE_TYPES.audioOut } }
    ],
    edges: [
      { id: 'e-in-mix1', source: 'in', target: 'inMix1', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-in-mix2', source: 'in', target: 'inMix2', sourceHandle: 'out', targetHandle: 'in-1' },
      
      { id: 'e-m1-d1', source: 'inMix1', target: 'd1', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m1-d2', source: 'inMix1', target: 'd2', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m1-d3', source: 'inMix1', target: 'd3', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m1-d4', source: 'inMix1', target: 'd4', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m2-d5', source: 'inMix2', target: 'd5', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m2-d6', source: 'inMix2', target: 'd6', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m2-d7', source: 'inMix2', target: 'd7', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-m2-d8', source: 'inMix2', target: 'd8', sourceHandle: 'out', targetHandle: 'in-1' },
      
      { id: 'e-d1-f', source: 'd1', target: 'fdn8', sourceHandle: 'out', targetHandle: 'in-1' },
      { id: 'e-d2-f', source: 'd2', target: 'fdn8', sourceHandle: 'out', targetHandle: 'in-2' },
      { id: 'e-d3-f', source: 'd3', target: 'fdn8', sourceHandle: 'out', targetHandle: 'in-3' },
      { id: 'e-d4-f', source: 'd4', target: 'fdn8', sourceHandle: 'out', targetHandle: 'in-4' },
      { id: 'e-d5-f', source: 'd5', target: 'fdn8', sourceHandle: 'out', targetHandle: 'in-5' },
      { id: 'e-d6-f', source: 'd6', target: 'fdn8', sourceHandle: 'out', targetHandle: 'in-6' },
      { id: 'e-d7-f', source: 'd7', target: 'fdn8', sourceHandle: 'out', targetHandle: 'in-7' },
      { id: 'e-d8-f', source: 'd8', target: 'fdn8', sourceHandle: 'out', targetHandle: 'in-8' },
      
      { id: 'e-f-d1', source: 'fdn8', target: 'd1', sourceHandle: 'out-1', targetHandle: 'in-1' },
      { id: 'e-f-d2', source: 'fdn8', target: 'd2', sourceHandle: 'out-2', targetHandle: 'in-1' },
      { id: 'e-f-d3', source: 'fdn8', target: 'd3', sourceHandle: 'out-3', targetHandle: 'in-1' },
      { id: 'e-f-d4', source: 'fdn8', target: 'd4', sourceHandle: 'out-4', targetHandle: 'in-1' },
      { id: 'e-f-d5', source: 'fdn8', target: 'd5', sourceHandle: 'out-5', targetHandle: 'in-1' },
      { id: 'e-f-d6', source: 'fdn8', target: 'd6', sourceHandle: 'out-6', targetHandle: 'in-1' },
      { id: 'e-f-d7', source: 'fdn8', target: 'd7', sourceHandle: 'out-7', targetHandle: 'in-1' },
      { id: 'e-f-d8', source: 'fdn8', target: 'd8', sourceHandle: 'out-8', targetHandle: 'in-1' },
      
      { id: 'e-f-o1', source: 'fdn8', target: 'outMix1', sourceHandle: 'out-1', targetHandle: 'in-1' },
      { id: 'e-f-o2', source: 'fdn8', target: 'outMix1', sourceHandle: 'out-2', targetHandle: 'in-2' },
      { id: 'e-f-o3', source: 'fdn8', target: 'outMix1', sourceHandle: 'out-3', targetHandle: 'in-3' },
      { id: 'e-f-o4', source: 'fdn8', target: 'outMix1', sourceHandle: 'out-4', targetHandle: 'in-4' },
      
      { id: 'e-o-c', source: 'outMix1', target: 'clamp1', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e-c-o', source: 'clamp1', target: 'out', sourceHandle: 'out', targetHandle: 'in' }
    ]
  }
];

