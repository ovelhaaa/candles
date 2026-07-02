export const workletCode = `
class ReverbProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.nodes = [];
    this.edges = [];
    this.state = {};
    this.audioFiles = {}; // { nodeId: { L: Float32Array, R: Float32Array, ptr: number, playing: boolean } }
    this.sampleRate = 44100;
    this.peakL = 0;
    this.peakR = 0;
    this.lastPeakPostTime = 0;
    this.port.onmessage = (e) => {

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

        this.sampleRate = e.data.sampleRate;
        this.initNodes();
      } else if (e.data.type === 'SET_AUDIO_FILE') {
        this.audioFiles[e.data.id] = {
          L: e.data.bufferL,
          R: e.data.bufferR,
          ptr: 0,
          playing: e.data.playing
        };
      } else if (e.data.type === 'PLAY_AUDIO_FILE') {
        if (this.audioFiles[e.data.id]) {
            this.audioFiles[e.data.id].playing = e.data.playing;
            if (e.data.playing && e.data.resetPtr) {
                this.audioFiles[e.data.id].ptr = 0;
            }
        }
      } else if (e.data.type === 'PANIC') {
        this.state = {};
        this.initNodes();
      } else if (e.data.type === 'TRIGGER_LATENCY_PING') {
        if (this.state[e.data.id]) {
            this.state[e.data.id].pingTriggered = true;
            this.state[e.data.id].pingTimer = 0;
            this.state[e.data.id].pingActive = true;
        }
      }
    };
  }

  initNodes() {
    this.nodes.forEach(node => {
      if (!this.state[node.id]) {
        this.state[node.id] = { outL: 0, outR: 0 };
         if (node.type === 'delay' || node.type === 'modDelay' || node.type === 'allpass' || node.type === 'comb' || node.type === 'pitchShift' || node.type === 'multitap') {
           const maxDelaySamples = this.sampleRate * 2;
           this.state[node.id].bufferL = new Float32Array(maxDelaySamples);
           this.state[node.id].bufferR = new Float32Array(maxDelaySamples);
           this.state[node.id].ptr = 0;
           this.state[node.id].lastOutL = 0;
           this.state[node.id].lastOutR = 0;
           if (node.type === 'pitchShift') {
               this.state[node.id].phase = 0;
           }
        }
        if (node.type === 'lpf' || node.type === 'hpf' || node.type === 'biquad' || node.type === 'damping') {
           this.state[node.id].z1L = 0; this.state[node.id].z1R = 0;
           this.state[node.id].lastXL = 0; this.state[node.id].lastXR = 0;
           if (node.type === 'biquad') {
               this.state[node.id].x1L = 0; this.state[node.id].x2L = 0;
               this.state[node.id].y1L = 0; this.state[node.id].y2L = 0;
               this.state[node.id].x1R = 0; this.state[node.id].x2R = 0;
               this.state[node.id].y1R = 0; this.state[node.id].y2R = 0;
           }
        }
        if (node.type === 'oscilloscope' || node.type === 'spectrum') {
           this.state[node.id].vizBuffer = new Float32Array(1024);
           this.state[node.id].vizPtr = 0;
           this.state[node.id].lastPostTime = 0;
        }
        if (node.type === 'lfo') {
           this.state[node.id].phase = 0;
        }
        if (node.type === 'clamp') {
           this.state[node.id].env = 0; // Envelope follower for compressor mode
        }
        if (node.type === 'fdn4') {
           this.state[node.id].outs = Array.from({length: 4}, () => ({L: 0, R: 0}));
        }
        if (node.type === 'fdn8') {
           this.state[node.id].outs = Array.from({length: 8}, () => ({L: 0, R: 0}));
        }
        if (node.type === 'chorus') {
           this.state[node.id].phase1 = 0;
           this.state[node.id].phase2 = Math.PI / 2;
           this.state[node.id].phase3 = Math.PI;
           this.state[node.id].bufferL = new Float32Array(this.sampleRate);
           this.state[node.id].bufferR = new Float32Array(this.sampleRate);
           this.state[node.id].ptr = 0;
        }
        if (node.type === 'tremolo') {
           this.state[node.id].phase = 0;
        }
        if (node.type === 'phaser') {
           this.state[node.id].phase = 0;
           this.state[node.id].z1L = [0,0,0,0,0,0,0,0];
           this.state[node.id].z1R = [0,0,0,0,0,0,0,0];
        }
        if (node.type === 'envelope') {
           this.state[node.id].env = 0;
        }
      }
    });
  }

  readCubic(buffer, readPtr) {
    let idx = Math.floor(readPtr);
    let frac = readPtr - idx;
    let len = buffer.length;
    let i0 = (idx - 1 + len) % len;
    let i1 = idx;
    let i2 = (idx + 1) % len;
    let i3 = (idx + 2) % len;
    
    let y0 = buffer[i0];
    let y1 = buffer[i1];
    let y2 = buffer[i2];
    let y3 = buffer[i3];
    
    let a = -y0/2.0 + (3.0*y1)/2.0 - (3.0*y2)/2.0 + y3/2.0;
    let b = y0 - (5.0*y1)/2.0 + 2.0*y2 - y3/2.0;
    let c = -y0/2.0 + y2/2.0;
    let d = y1;
    
    return a*frac*frac*frac + b*frac*frac + c*frac + d;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !output) return true;

    const numSamples = (input[0] || output[0] || []).length;
    if (numSamples === 0) return true;

    for (let i = 0; i < numSamples; i++) {
      let inSampleL = input[0] ? input[0][i] : 0;
      let inSampleR = input[1] ? input[1][i] : inSampleL; // Fallback to mono if no right channel

      let nodeInputs = {};
      this.nodes.forEach(n => {
        nodeInputs[n.id] = {};
        let numInputs = n.data.inputs !== undefined ? n.data.inputs : 1;
        if (n.type === 'oscilloscope' || n.type === 'spectrum' || numInputs === 1) {
            nodeInputs[n.id]['in'] = { L: 0, R: 0 };
        } else if (numInputs > 1) {
            for(let j=1; j<=numInputs; j++) {
                nodeInputs[n.id][\`in-\${j}\`] = { L: 0, R: 0 };
            }
        }
      });
      
      let inNode = this.nodes.find(n => n.type === 'audioIn');
      if (inNode) {
        nodeInputs[inNode.id] = { 'in': { L: inSampleL, R: inSampleR } };
      }

      this.edges.forEach(edge => {
         const sState = this.state[edge.source];
         if (!sState) return;
         
         let sHandle = edge.sourceHandle || 'out';
         let sIndex = 0;
         if (sHandle.startsWith('out-') && sHandle.length > 4) {
             sIndex = parseInt(sHandle.replace('out-', ''), 10) - 1;
         }

         let sourceOut = sState.outs && sState.outs[sIndex] ? sState.outs[sIndex] : { L: sState.outL, R: sState.outR };

         let sChannel = edge.data?.sourceChannel || 'both';
         let valL = 0, valR = 0;
         if (sChannel === 'l') { valL = sourceOut.L; valR = sourceOut.L; }
         else if (sChannel === 'r') { valL = sourceOut.R; valR = sourceOut.R; }
         else if (sChannel === 'mono_sum') { let m = (sourceOut.L + sourceOut.R) * 0.5; valL = m; valR = m; }
         else { valL = sourceOut.L; valR = sourceOut.R; }

         if (nodeInputs[edge.target]) {
           let portKey = edge.targetHandle || 'in';
           let tChannel = edge.data?.targetChannel || 'both';

           if (!nodeInputs[edge.target][portKey]) nodeInputs[edge.target][portKey] = {L:0, R:0};
           
           if (tChannel === 'l') { nodeInputs[edge.target][portKey].L += valL; }
           else if (tChannel === 'r') { nodeInputs[edge.target][portKey].R += valR; }
           else { nodeInputs[edge.target][portKey].L += valL; nodeInputs[edge.target][portKey].R += valR; }
         }
      });

         this.nodes.forEach(node => {
         let xL = 0, xR = 0;
         let numInputs = node.data.inputs !== undefined ? node.data.inputs : 1;
         if (numInputs === 1 || node.type === 'oscilloscope' || node.type === 'spectrum') {
             xL = nodeInputs[node.id]['in'] ? nodeInputs[node.id]['in'].L : 0;
             xR = nodeInputs[node.id]['in'] ? nodeInputs[node.id]['in'].R : 0;
         } else if (numInputs > 1) {
             xL = nodeInputs[node.id]['in-1'] ? nodeInputs[node.id]['in-1'].L : 0;
             xR = nodeInputs[node.id]['in-1'] ? nodeInputs[node.id]['in-1'].R : 0;
         }
         
         let yL = 0, yR = 0;
         let s = this.state[node.id];
         let getCV = (param, def) => {
             let base = node.data[param] !== undefined ? node.data[param] : def;
             let cv = nodeInputs[node.id]['param-' + param];
             return cv ? base + cv.L : base;
         };
         if (!s) return;

         if (node.data.bypassed && node.type !== 'audioIn' && node.type !== 'audioFile' && node.type !== 'audioOut') {
            s.outL = xL;
            s.outR = xR;
            if (s.outs) {
               for(let i=0; i<s.outs.length; i++) {
                   s.outs[i].L = xL;
                   s.outs[i].R = xR;
               }
            }
            return;
         }

         if (node.type === 'audioIn' || node.type === 'audioFile') {
            let file = this.audioFiles[node.id];
            if (file && file.playing && file.L && file.L.length > 0) {
               yL = file.L[file.ptr];
               yR = file.R ? file.R[file.ptr] : yL;
               file.ptr++;
               if (file.ptr >= file.L.length) {
                   file.ptr = 0; // Loop seamlessly
               }
            } else if (node.type === 'audioIn') {
               yL = xL; yR = xR;
            }
         } else if (node.type === 'lfo') {
            let rate = getCV("rate", 1.0);
            let depth = getCV("depth", 1.0);
            s.phase += rate / this.sampleRate;
            if (s.phase >= 1.0) s.phase -= 1.0;
            yL = Math.sin(s.phase * 2 * Math.PI) * depth;
            yR = yL;
         } else if (node.type === 'modDelay') {
            let audioIn = nodeInputs[node.id]['in-1'] || {L:0, R:0};
            let modIn = nodeInputs[node.id]['in-2'] || {L:0, R:0};
            xL = audioIn.L; xR = audioIn.R;
            
            let baseDelayMs = getCV("delayMs", 20);
            let fb = getCV("feedback", 0);
            
            let modSamplesL = (modIn.L / 1000.0) * this.sampleRate;
            let modSamplesR = (modIn.R / 1000.0) * this.sampleRate;
            
            let delaySamplesL = (baseDelayMs / 1000.0) * this.sampleRate + modSamplesL;
            let delaySamplesR = (baseDelayMs / 1000.0) * this.sampleRate + modSamplesR;
            
            if (delaySamplesL < 1) delaySamplesL = 1;
            if (delaySamplesR < 1) delaySamplesR = 1;
            if (delaySamplesL >= s.bufferL.length) delaySamplesL = s.bufferL.length - 1;
            if (delaySamplesR >= s.bufferR.length) delaySamplesR = s.bufferR.length - 1;
            
            let readPtrL = s.ptr - delaySamplesL;
            if (readPtrL < 0) readPtrL += s.bufferL.length;
            yL = this.readCubic(s.bufferL, readPtrL);
            
            let readPtrR = s.ptr - delaySamplesR;
            if (readPtrR < 0) readPtrR += s.bufferR.length;
            yR = this.readCubic(s.bufferR, readPtrR);
            
            s.bufferL[s.ptr] = xL + yL * fb;
            s.bufferR[s.ptr] = xR + yR * fb;
            s.ptr = (s.ptr + 1) % s.bufferL.length;
         } else if (node.type === 'biquad') {
            let modIn = nodeInputs[node.id]['in-2'] ? nodeInputs[node.id]['in-2'].L : 0;
            let filterType = node.data.filterType !== undefined ? node.data.filterType : 0;
            let freq = getCV("freq", 1000) + modIn * 1000;
            if (freq < 20) freq = 20; if (freq > 20000) freq = 20000;
            let Q = getCV("q", 0.707);
            let dbGain = getCV("gain", 0);
            
            let A = Math.pow(10, dbGain / 40);
            let w0 = 2 * Math.PI * freq / this.sampleRate;
            let alpha = Math.sin(w0) / (2 * Q);
            let cosW0 = Math.cos(w0);
            
            let b0=1, b1=0, b2=0, a0=1, a1=0, a2=0;
            
            if (filterType === 0) { // LPF
                b0 = (1 - cosW0) / 2; b1 = 1 - cosW0; b2 = (1 - cosW0) / 2;
                a0 = 1 + alpha; a1 = -2 * cosW0; a2 = 1 - alpha;
            } else if (filterType === 1) { // HPF
                b0 = (1 + cosW0) / 2; b1 = -(1 + cosW0); b2 = (1 + cosW0) / 2;
                a0 = 1 + alpha; a1 = -2 * cosW0; a2 = 1 - alpha;
            } else if (filterType === 2) { // BPF
                b0 = alpha; b1 = 0; b2 = -alpha;
                a0 = 1 + alpha; a1 = -2 * cosW0; a2 = 1 - alpha;
            } else if (filterType === 3) { // LowShelf
                b0 = A * ((A + 1) - (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha);
                b1 = 2 * A * ((A - 1) - (A + 1) * cosW0);
                b2 = A * ((A + 1) - (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha);
                a0 = (A + 1) + (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha;
                a1 = -2 * ((A - 1) + (A + 1) * cosW0);
                a2 = (A + 1) + (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha;
            } else if (filterType === 4) { // HighShelf
                b0 = A * ((A + 1) + (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha);
                b1 = -2 * A * ((A - 1) + (A + 1) * cosW0);
                b2 = A * ((A + 1) + (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha);
                a0 = (A + 1) - (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha;
                a1 = 2 * ((A - 1) - (A + 1) * cosW0);
                a2 = (A + 1) - (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha;
            } else if (filterType === 5) { // Peaking
                b0 = 1 + alpha * A; b1 = -2 * cosW0; b2 = 1 - alpha * A;
                a0 = 1 + alpha / A; a1 = -2 * cosW0; a2 = 1 - alpha / A;
            } else if (filterType === 6) { // Notch
                b0 = 1; b1 = -2 * cosW0; b2 = 1;
                a0 = 1 + alpha; a1 = -2 * cosW0; a2 = 1 - alpha;
            }
            
            yL = (b0/a0)*xL + (b1/a0)*s.x1L + (b2/a0)*s.x2L - (a1/a0)*s.y1L - (a2/a0)*s.y2L;
            s.x2L = s.x1L; s.x1L = xL; s.y2L = s.y1L; s.y1L = yL;
            
            yR = (b0/a0)*xR + (b1/a0)*s.x1R + (b2/a0)*s.x2R - (a1/a0)*s.y1R - (a2/a0)*s.y2R;
            s.x2R = s.x1R; s.x1R = xR; s.y2R = s.y1R; s.y1R = yR;
         } else if (node.type === 'fdn4' || node.type === 'fdn8') {
             let size = node.type === 'fdn4' ? 4 : 8;
             let insL = [];
             let insR = [];
             for(let i=1; i<=size; i++) {
                 let input = nodeInputs[node.id]['in-' + i] || {L:0, R:0};
                 insL.push(input.L);
                 insR.push(input.R);
             }
             
             let matrix = node.data.matrix || [];
             // Fallbacks if matrix configuration is broken
             if(matrix.length !== size || matrix[0].length !== size) {
                 matrix = Array.from({length: size}, (_, i) => Array.from({length: size}, (_, j) => (i===j ? 1 : 0))); 
             }
             
             let decay = getCV("decay", 0.8);
             for(let m=0; m<size; m++) {
                 s.outs[m].L = 0; s.outs[m].R = 0;
                 for(let k=0; k<size; k++) {
                     s.outs[m].L += matrix[m][k] * insL[k] * decay;
                     s.outs[m].R += matrix[m][k] * insR[k] * decay;
                 }
             }

             yL = s.outs[0].L; yR = s.outs[0].R; // primary output backwards compat

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
         } else if (node.type === 'delay') {
            let audioIn = nodeInputs[node.id]['in-1'] || {L:0, R:0};
            let modIn = nodeInputs[node.id]['in-2'] || {L:0, R:0};
            xL = audioIn.L; xR = audioIn.R;

            let delayModL = (modIn.L / 1000.0) * this.sampleRate;
            let delayModR = (modIn.R / 1000.0) * this.sampleRate;
            
            let baseDelaySamples = (getCV("delayMs", 50) / 1000) * this.sampleRate;
            
            let delaySamplesL = baseDelaySamples + delayModL;
            let delaySamplesR = baseDelaySamples + delayModR;
            
            if (delaySamplesL < 1) delaySamplesL = 1;
            if (delaySamplesR < 1) delaySamplesR = 1;
            if (delaySamplesL >= s.bufferL.length) delaySamplesL = s.bufferL.length - 1;
            if (delaySamplesR >= s.bufferR.length) delaySamplesR = s.bufferR.length - 1;
            
            let readPtrL = s.ptr - delaySamplesL;
            if (readPtrL < 0) readPtrL += s.bufferL.length;
            yL = this.readCubic(s.bufferL, readPtrL);
            
            let readPtrR = s.ptr - delaySamplesR;
            if (readPtrR < 0) readPtrR += s.bufferR.length;
            yR = this.readCubic(s.bufferR, readPtrR);
            
            let fb = getCV("feedback", 0);
            s.bufferL[s.ptr] = xL + yL * fb;
            s.bufferR[s.ptr] = xR + yR * fb;
            s.ptr = (s.ptr + 1) % s.bufferL.length;
         } else if (node.type === 'allpass') {
            let audioIn = nodeInputs[node.id]['in-1'] || {L:0, R:0};
            let modIn = nodeInputs[node.id]['in-2'] || {L:0, R:0};
            xL = audioIn.L; xR = audioIn.R;

            let delayModL = (modIn.L / 1000.0) * this.sampleRate;
            let delayModR = (modIn.R / 1000.0) * this.sampleRate;
            let baseDelaySamples = (getCV("delayMs", 5) / 1000) * this.sampleRate;
            
            let delaySamplesL = baseDelaySamples + delayModL;
            let delaySamplesR = baseDelaySamples + delayModR;
            
            if (delaySamplesL < 1) delaySamplesL = 1;
            if (delaySamplesR < 1) delaySamplesR = 1;
            if (delaySamplesL >= s.bufferL.length) delaySamplesL = s.bufferL.length - 1;
            if (delaySamplesR >= s.bufferR.length) delaySamplesR = s.bufferR.length - 1;
            
            let readPtrL = s.ptr - delaySamplesL;
            if (readPtrL < 0) readPtrL += s.bufferL.length;
            let delayedL = this.readCubic(s.bufferL, readPtrL);
            
            let readPtrR = s.ptr - delaySamplesR;
            if (readPtrR < 0) readPtrR += s.bufferR.length;
            let delayedR = this.readCubic(s.bufferR, readPtrR);
            
            let g = getCV("gain", 0.5);
            
            yL = -g * xL + delayedL;
            yR = -g * xR + delayedR;
            
            s.bufferL[s.ptr] = xL + g * delayedL;
            s.bufferR[s.ptr] = xR + g * delayedR;
            s.ptr = (s.ptr + 1) % s.bufferL.length;
         } else if (node.type === 'comb') {
            let audioIn = nodeInputs[node.id]['in-1'] || {L:0, R:0};
            let modIn = nodeInputs[node.id]['in-2'] || {L:0, R:0};
            xL = audioIn.L; xR = audioIn.R;

            let delayModL = (modIn.L / 1000.0) * this.sampleRate;
            let delayModR = (modIn.R / 1000.0) * this.sampleRate;
            let baseDelaySamples = (getCV("delayMs", 30) / 1000) * this.sampleRate;
            
            let delaySamplesL = baseDelaySamples + delayModL;
            let delaySamplesR = baseDelaySamples + delayModR;
            
            if (delaySamplesL < 1) delaySamplesL = 1;
            if (delaySamplesR < 1) delaySamplesR = 1;
            if (delaySamplesL >= s.bufferL.length) delaySamplesL = s.bufferL.length - 1;
            if (delaySamplesR >= s.bufferR.length) delaySamplesR = s.bufferR.length - 1;
            
            let readPtrL = s.ptr - delaySamplesL;
            if (readPtrL < 0) readPtrL += s.bufferL.length;
            let delayedL = this.readCubic(s.bufferL, readPtrL);
            
            let readPtrR = s.ptr - delaySamplesR;
            if (readPtrR < 0) readPtrR += s.bufferR.length;
            let delayedR = this.readCubic(s.bufferR, readPtrR);
            
            let damp = getCV("damping", 0);
            let fb = getCV("feedback", 0.5);
            
            s.lastOutL = delayedL * (1 - damp) + s.lastOutL * damp;
            s.lastOutR = delayedR * (1 - damp) + s.lastOutR * damp;
            
            yL = delayedL;
            yR = delayedR;
            
            s.bufferL[s.ptr] = xL + s.lastOutL * fb;
            s.bufferR[s.ptr] = xR + s.lastOutR * fb;
            s.ptr = (s.ptr + 1) % s.bufferL.length;
         } else if (node.type === 'pitchShift') {
            let semitones = getCV("semitones", 12);
            let windowMs = getCV("windowMs", 50);
            let mix = getCV("mix", 1.0);
            
            let pitchRatio = Math.pow(2, semitones / 12.0);
            let windowSamples = (windowMs / 1000.0) * this.sampleRate;
            
            let phaseInc = (1.0 - pitchRatio) / windowSamples;
            
            s.phase += phaseInc;
            if (s.phase >= 1.0) s.phase -= 1.0;
            if (s.phase < 0.0) s.phase += 1.0;
            
            let phase1 = s.phase;
            let phase2 = (s.phase + 0.5) % 1.0;
            
            let delay1 = phase1 * windowSamples;
            let delay2 = phase2 * windowSamples;
            
            s.bufferL[s.ptr] = xL;
            s.bufferR[s.ptr] = xR;
            
            let readPtr1 = s.ptr - Math.floor(delay1);
            if (readPtr1 < 0) readPtr1 += s.bufferL.length;
            let readPtr2 = s.ptr - Math.floor(delay2);
            if (readPtr2 < 0) readPtr2 += s.bufferL.length;
            
            let fade1 = 1.0 - Math.abs(phase1 * 2.0 - 1.0);
            let fade2 = 1.0 - Math.abs(phase2 * 2.0 - 1.0);
            
            let wetL = s.bufferL[readPtr1] * fade1 + s.bufferL[readPtr2] * fade2;
            let wetR = s.bufferR[readPtr1] * fade1 + s.bufferR[readPtr2] * fade2;
            
            yL = xL * (1.0 - mix) + wetL * mix;
            yR = xR * (1.0 - mix) + wetR * mix;
            
            s.ptr = (s.ptr + 1) % s.bufferL.length;
         } else if (node.type === 'lpf') {
            let modIn = nodeInputs[node.id]['in-2'] ? nodeInputs[node.id]['in-2'].L : 0;
            let cutoff = getCV("cutoff", 1000) + modIn * 1000;
            if (cutoff < 20) cutoff = 20; if (cutoff > 20000) cutoff = 20000;
            let dt = 1.0 / this.sampleRate;
            let rc = 1.0 / (2 * Math.PI * cutoff);
            let alpha = dt / (rc + dt);
            
            yL = s.z1L + alpha * (xL - s.z1L);
            yR = s.z1R + alpha * (xR - s.z1R);
            s.z1L = yL;
            s.z1R = yR;
         } else if (node.type === 'hpf') {
            let modIn = nodeInputs[node.id]['in-2'] ? nodeInputs[node.id]['in-2'].L : 0;
            let cutoff = getCV("cutoff", 100) + modIn * 1000;
            if (cutoff < 20) cutoff = 20; if (cutoff > 20000) cutoff = 20000;
            let dt = 1.0 / this.sampleRate;
            let rc = 1.0 / (2 * Math.PI * cutoff);
            let alpha = rc / (rc + dt);
            
            yL = alpha * (s.z1L + xL - s.lastXL);
            yR = alpha * (s.z1R + xR - s.lastXR);
            s.z1L = yL;
            s.z1R = yR;
            s.lastXL = xL;
            s.lastXR = xR;
         } else if (node.type === 'damping') {
            let modIn = nodeInputs[node.id]['in-2'] ? nodeInputs[node.id]['in-2'].L : 0;
            let cutoff = getCV("cutoff", 5000) + modIn * 1000;
            if (cutoff < 20) cutoff = 20; if (cutoff > 20000) cutoff = 20000;
            let type = node.data.filterType || 0; // 0 LPF, 1 HPF
            let dt = 1.0 / this.sampleRate;
            let rc = 1.0 / (2 * Math.PI * cutoff);
            
            if (type === 0) {
              let alpha = dt / (rc + dt);
              yL = s.z1L + alpha * (xL - s.z1L);
              yR = s.z1R + alpha * (xR - s.z1R);
              s.z1L = yL;
              s.z1R = yR;
            } else {
              let alpha = rc / (rc + dt);
              yL = alpha * (s.z1L + xL - s.lastXL);
              yR = alpha * (s.z1R + xR - s.lastXR);
              s.z1L = yL;
              s.z1R = yR;
              s.lastXL = xL;
              s.lastXR = xR;
            }
         } else if (node.type === 'multitap') {
            let t1 = getCV("t1", 10);
            let g1 = getCV("g1", 0.5);
            let t2 = getCV("t2", 25);
            let g2 = getCV("g2", 0.3);
            let t3 = getCV("t3", 45);
            let g3 = getCV("g3", 0.15);
            let t4 = getCV("t4", 70);
            let g4 = getCV("g4", 0.05);
            
            s.bufferL[s.ptr] = xL;
            s.bufferR[s.ptr] = xR;
            
            yL = 0; yR = 0;
            [[t1, g1], [t2, g2], [t3, g3], [t4, g4]].forEach(([t, g]) => {
                let delaySamples = Math.floor((t / 1000) * this.sampleRate);
                let readPtr = s.ptr - delaySamples;
                if (readPtr < 0) readPtr += s.bufferL.length;
                yL += s.bufferL[readPtr] * g;
                yR += s.bufferR[readPtr] * g;
            });
            
            s.ptr = (s.ptr + 1) % s.bufferL.length;
         } else if (node.type === 'clamp') {
            let modIn = nodeInputs[node.id]['in-2'] ? nodeInputs[node.id]['in-2'].L : 0;
            let mode = node.data.mode !== undefined ? node.data.mode : 1;
            let drive = getCV("drive", 1.0) + modIn * 5;
            if (drive < 0) drive = 0;
            let threshold = getCV("threshold", 1.0);
            
            let applyClamp = (sig) => {
                let driven = sig * drive;
                if (mode === 0) { // Hard clip
                    return Math.max(-threshold, Math.min(driven, threshold));
                } else if (mode === 1) { // Soft clip (tanh)
                    // fast tanh approx or just Math.tanh
                    return Math.tanh(driven / threshold) * threshold;
                } else if (mode === 2) { // Compressor (very basic limiter style)
                   let absSig = Math.abs(driven);
                   // Attack/Release envelope follower
                   let attack = 0.01; // fast attack
                   let release = 0.001; // slower release
                   s.env = absSig > s.env ? 
                           s.env + attack * (absSig - s.env) : 
                           s.env + release * (absSig - s.env);
                   let gain = 1.0;
                   if (s.env > threshold) {
                       let ratio = 4.0; // 4:1 compression
                       let excess = s.env - threshold;
                       // We need the gain reduction linear multiplier
                       let dbEnv = 20 * Math.log10(s.env);
                       let dbThresh = 20 * Math.log10(threshold);
                       let dbExcess = dbEnv - dbThresh;
                       let targetDb = dbThresh + (dbExcess / ratio);
                       let makeupGain = dbThresh - targetDb; // Negative value
                       gain = Math.pow(10, makeupGain / 20);
                   }
                   return driven * gain;
                }
                return driven;
            };
            
            yL = applyClamp(xL);
            yR = applyClamp(xR);
         } else if (node.type === 'envelope') {
             let attackMs = getCV("attack", 10);
             let releaseMs = getCV("release", 100);
             let attack = Math.exp(-1.0 / (attackMs * 0.001 * this.sampleRate));
             let release = Math.exp(-1.0 / (releaseMs * 0.001 * this.sampleRate));
             let envIn = Math.abs((xL + xR) * 0.5);
             if (envIn > s.env) {
                 s.env = attack * s.env + (1.0 - attack) * envIn;
             } else {
                 s.env = release * s.env + (1.0 - release) * envIn;
             }
             yL = s.env;
             yR = s.env;
         } else if (node.type === 'stereoWidth') {
             let width = getCV("width", 1.0);
             let mid = (xL + xR) * 0.5;
             let side = (xL - xR) * 0.5 * width;
             yL = mid + side;
             yR = mid - side;
         } else if (node.type === 'panner') {
             let modIn = nodeInputs[node.id]['in-2'] ? nodeInputs[node.id]['in-2'].L : 0;
             let pan = getCV("pan", 0) + modIn;
             pan = Math.max(-1, Math.min(1, pan));
             let angle = (pan + 1) * 0.25 * Math.PI; // -1 to 1 -> 0 to pi/2
             let gainL = Math.cos(angle);
             let gainR = Math.sin(angle);
             let inputMono = (xL + xR) * 0.5;
             yL = inputMono * gainL * 1.414; // Compensate for mono sum half gain
             yR = inputMono * gainR * 1.414;
         } else if (node.type === 'chorus') {
             let rate = getCV("rate", 1.5);
             let depthMs = getCV("depth", 3.0);
             let mix = getCV("mix", 0.5);
             
             s.phase1 += rate / this.sampleRate; if (s.phase1 >= 1.0) s.phase1 -= 1.0;
             s.phase2 += rate * 1.1 / this.sampleRate; if (s.phase2 >= 1.0) s.phase2 -= 1.0;
             s.phase3 += rate * 0.9 / this.sampleRate; if (s.phase3 >= 1.0) s.phase3 -= 1.0;
             
             let lfo1 = Math.sin(s.phase1 * 2 * Math.PI);
             let lfo2 = Math.sin(s.phase2 * 2 * Math.PI);
             let lfo3 = Math.sin(s.phase3 * 2 * Math.PI);
             
             let baseDelaySamples = 0.02 * this.sampleRate; // 20ms base
             let depthSamples = (depthMs / 1000.0) * this.sampleRate;
             
             s.bufferL[s.ptr] = xL;
             s.bufferR[s.ptr] = xR;
             
             let readL1 = s.ptr - (baseDelaySamples + lfo1 * depthSamples);
             let readR1 = s.ptr - (baseDelaySamples + lfo2 * depthSamples);
             let readL2 = s.ptr - (baseDelaySamples + lfo3 * depthSamples);
             let readR2 = s.ptr - (baseDelaySamples + lfo1 * depthSamples);
             
             while (readL1 < 0) readL1 += s.bufferL.length;
             while (readR1 < 0) readR1 += s.bufferL.length;
             while (readL2 < 0) readL2 += s.bufferL.length;
             while (readR2 < 0) readR2 += s.bufferL.length;
             
             let wetL = (this.readCubic(s.bufferL, readL1) + this.readCubic(s.bufferL, readL2)) * 0.5;
             let wetR = (this.readCubic(s.bufferR, readR1) + this.readCubic(s.bufferR, readR2)) * 0.5;
             
             yL = xL * (1 - mix) + wetL * mix;
             yR = xR * (1 - mix) + wetR * mix;
             s.ptr = (s.ptr + 1) % s.bufferL.length;
         } else if (node.type === 'tremolo') {
             let rate = getCV("rate", 4.0);
             let depth = getCV("depth", 0.8);
             let phaseOffset = getCV("stereoPhase", 0);
             
             s.phase += rate / this.sampleRate;
             if (s.phase >= 1.0) s.phase -= 1.0;
             
             let lfoL = (Math.sin(s.phase * 2 * Math.PI) + 1) * 0.5;
             let phaseR = s.phase + (phaseOffset / 360.0);
             if (phaseR >= 1.0) phaseR -= 1.0;
             let lfoR = (Math.sin(phaseR * 2 * Math.PI) + 1) * 0.5;
             
             let modGainL = 1.0 - (depth * (1.0 - lfoL));
             let modGainR = 1.0 - (depth * (1.0 - lfoR));
             
             yL = xL * modGainL;
             yR = xR * modGainR;
         } else if (node.type === 'phaser') {
             let rate = getCV("rate", 0.5);
             let depth = getCV("depth", 0.8);
             let fb = getCV("feedback", 0.4);
             let mix = getCV("mix", 0.5);
             
             s.phase += rate / this.sampleRate;
             if (s.phase >= 1.0) s.phase -= 1.0;
             let lfo = (Math.sin(s.phase * 2 * Math.PI) + 1) * 0.5; // 0 to 1
             
             let fMin = 400; let fMax = 4000;
             let currentFreq = fMin * Math.pow(fMax/fMin, lfo * depth);
             let w0 = 2 * Math.PI * currentFreq / this.sampleRate;
             let a1 = (Math.tan(w0/2) - 1) / (Math.tan(w0/2) + 1);
             
             let processAPF = (inSamp, z1Arr) => {
                 let numStages = 4;
                 let val = inSamp;
                 for(let i=0; i<numStages; i++) {
                     let v = val - a1 * z1Arr[i];
                     let out = a1 * v + z1Arr[i];
                     z1Arr[i] = v;
                     val = out;
                 }
                 return val;
             };
             
             let inL = xL + s.z1L[7] * fb; 
             let inR = xR + s.z1R[7] * fb;
             
             let wetL = processAPF(inL, s.z1L);
             let wetR = processAPF(inR, s.z1R);
             
             s.z1L[7] = wetL;
             s.z1R[7] = wetR;
             
             yL = xL * (1 - mix) + wetL * mix;
             yR = xR * (1 - mix) + wetR * mix;
         } else if (node.type === 'mixer') {
            let mG = getCV("masterGain", 1.0);
            yL = 0; yR = 0;
            for(let j=1; j<=4; j++) {
                let port = nodeInputs[node.id][\`in-\${j}\`];
                if (port) {
                    let g = node.data[\`gain\${j}\`] !== undefined ? node.data[\`gain\${j}\`] : 1.0;
                    yL += port.L * g;
                    yR += port.R * g;
                }
            }
            yL *= mG;
            yR *= mG;
         } else if (node.type === 'oscilloscope' || node.type === 'spectrum') {
            yL = xL; yR = xR; // Pass-through
            s.vizBuffer[s.vizPtr] = (xL + xR) * 0.5; // Mono sum for visualization
            s.vizPtr++;
            if (s.vizPtr >= s.vizBuffer.length) {
                s.vizPtr = 0;
                let now = currentTime; // Web Audio API global in Worklets
                if (now - s.lastPostTime > 1.0 / 30.0) { // Max 30fps
                    // We must slice to create a new array because ArrayBuffers can't be safely transferred or reused synchronously like this easily without complex logic, slice copies.
                    this.port.postMessage({ type: 'VIZ_DATA', id: node.id, buffer: s.vizBuffer.slice(0) });
                    s.lastPostTime = now;
                }
            }
         } else if (node.type === 'latency') {
            yL = xL; yR = xR;
            if (s.pingTriggered) {
                // Output a delta impulse this sample
                yL = 1.0; yR = 1.0;
                s.pingTriggered = false;
            } else if (s.pingActive) {
                s.pingTimer++;
                // If we receive the impulse back (some threshold)
                // Need to make sure we don't catch our own impulse in the same sample
                // We use xL and xR directly, which is the input to the node.
                if (s.pingTimer > 0 && Math.max(Math.abs(xL), Math.abs(xR)) > 0.01) {
                    let ms = (s.pingTimer / this.sampleRate) * 1000;
                    this.port.postMessage({ type: 'LATENCY_RESULT', id: node.id, latencyMs: ms });
                    s.pingActive = false;
                } else if (s.pingTimer > this.sampleRate * 5) { // 5 second timeout
                    this.port.postMessage({ type: 'LATENCY_RESULT', id: node.id, latencyMs: -1 });
                    s.pingActive = false;
                }
            }
         } else if (node.type === 'audioOut') {
            let gain = getCV("gain", 1.0);
            let limiter = node.data.limiter !== undefined ? node.data.limiter : 1;
            
            yL = xL * gain;
            yR = xR * gain;
            
            if (limiter === 1) {
                // simple soft clip
                yL = Math.tanh(yL);
                yR = Math.tanh(yR);
            }
         }
         
         if (node.type !== 'audioFile' || (node.type === 'audioFile' && this.audioFiles[node.id]?.playing)) {
             s.outL = yL;
             s.outR = yR;
         } else {
             s.outL = 0;
             s.outR = 0;
         }
      });

      let outNode = this.nodes.find(n => n.type === 'audioOut');
      let outSampleL = outNode && this.state[outNode.id] ? this.state[outNode.id].outL : 0;
      let outSampleR = outNode && this.state[outNode.id] ? this.state[outNode.id].outR : 0;

      if (Math.abs(outSampleL) > this.peakL) this.peakL = Math.abs(outSampleL);
      if (Math.abs(outSampleR) > this.peakR) this.peakR = Math.abs(outSampleR);

      if (output[0]) output[0][i] = outSampleL;
      if (output[1]) output[1][i] = outSampleR;
    }
    
    let now = currentTime;
    if (now - this.lastPeakPostTime >= 1.0 / 30.0) {
      this.port.postMessage({ type: 'PEAK_DATA', peakL: this.peakL, peakR: this.peakR });
      this.peakL = 0;
      this.peakR = 0;
      this.lastPeakPostTime = now;
    }

    return true;
  }
}
registerProcessor('reverb-dsp-processor', ReverbProcessor);
`;
