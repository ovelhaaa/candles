import { workletCode } from './workletCode';

export class AudioEngine {
  ctx: AudioContext | null = null;
  workletNode: AudioWorkletNode | null = null;
  isPlaying = false;
  
  // For test sound
  osc: OscillatorNode | null = null;
  gain: GainNode | null = null;

  vizListeners: Record<string, ((buffer: Float32Array) => void)[]> = {};
  peakListeners: ((peakL: number, peakR: number) => void)[] = [];
  latencyListeners: Record<string, ((latencyMs: number) => void)[]> = {};
  
  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];
  isRecording = false;
  mediaDest: MediaStreamAudioDestinationNode | null = null;

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    
    await this.ctx.audioWorklet.addModule(url);
    
    this.workletNode = new AudioWorkletNode(this.ctx, 'reverb-dsp-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    this.workletNode.port.onmessage = (e) => {
      if (e.data.type === 'VIZ_DATA') {
        const cbs = this.vizListeners[e.data.id];
        if (cbs) {
          cbs.forEach(cb => cb(e.data.buffer));
        }
      } else if (e.data.type === 'PEAK_DATA') {
        this.peakListeners.forEach(cb => cb(e.data.peakL, e.data.peakR));
      } else if (e.data.type === 'LATENCY_RESULT') {
        const cbs = this.latencyListeners[e.data.id];
        if (cbs) cbs.forEach(cb => cb(e.data.latencyMs));
      }
    };
    
    this.workletNode.connect(this.ctx.destination);
  }

  addVizListener(id: string, cb: (buffer: Float32Array) => void) {
    if (!this.vizListeners[id]) this.vizListeners[id] = [];
    this.vizListeners[id].push(cb);
  }

  removeVizListener(id: string, cb: (buffer: Float32Array) => void) {
    if (this.vizListeners[id]) {
      this.vizListeners[id] = this.vizListeners[id].filter(fn => fn !== cb);
    }
  }

  addLatencyListener(id: string, cb: (ms: number) => void) {
    if (!this.latencyListeners[id]) this.latencyListeners[id] = [];
    this.latencyListeners[id].push(cb);
  }

  removeLatencyListener(id: string, cb: (ms: number) => void) {
    if (this.latencyListeners[id]) {
        this.latencyListeners[id] = this.latencyListeners[id].filter(fn => fn !== cb);
    }
  }

  triggerLatencyPing(id: string) {
    if (this.workletNode) {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.workletNode.port.postMessage({ type: 'TRIGGER_LATENCY_PING', id });
    }
  }

  addPeakListener(cb: (peakL: number, peakR: number) => void) {
    this.peakListeners.push(cb);
  }

  removePeakListener(cb: (peakL: number, peakR: number) => void) {
    this.peakListeners = this.peakListeners.filter(fn => fn !== cb);
  }

  async loadAudioFileForNode(id: string, file: File): Promise<AudioBuffer> {
    if (!this.ctx || !this.workletNode) await this.init();
    
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
    
    if (audioBuffer.sampleRate !== this.ctx!.sampleRate) {
        throw new Error(`Sample rate mismatch! File is ${audioBuffer.sampleRate}Hz but graph is running at ${this.ctx!.sampleRate}Hz. Please resample your audio.`);
    }

    const bufferL = audioBuffer.getChannelData(0);
    const bufferR = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : bufferL;

    this.workletNode?.port.postMessage({
      type: 'SET_AUDIO_FILE',
      id,
      bufferL,
      bufferR,
      playing: false
    });
    
    return audioBuffer;
  }

  async loadAudioUrlForNode(id: string, url: string): Promise<AudioBuffer> {
    if (!this.ctx || !this.workletNode) await this.init();
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
    
    if (audioBuffer.sampleRate !== this.ctx!.sampleRate) {
        // We log warning for remote but maybe don't strictly throw if it's an internal loop, or we can throw.
        console.warn(`Sample rate mismatch: ${audioBuffer.sampleRate} vs ${this.ctx!.sampleRate}`);
    }
    
    const bufferL = audioBuffer.getChannelData(0);
    const bufferR = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : bufferL;

    this.workletNode?.port.postMessage({
      type: 'SET_AUDIO_FILE',
      id,
      bufferL,
      bufferR,
      playing: false
    });
    
    return audioBuffer;
  }

  setAudioFilePlaying(id: string, playing: boolean, resetPtr = false) {
    if (!this.workletNode) return;
    if (playing && this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    this.workletNode.port.postMessage({
      type: 'PLAY_AUDIO_FILE',
      id,
      playing,
      resetPtr
    });
  }

  playTestImpulse() {
    if (!this.ctx || !this.workletNode) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Create a percussive "click" or "pluck" sound
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.workletNode);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  updateGraph(nodes: any[], edges: any[]) {
    if (!this.workletNode || !this.ctx) return;
    
    const workletNodes = nodes.map(n => {
      const data: Record<string, any> = {};
      if (n.data && n.data.params) {
        Object.entries(n.data.params).forEach(([k, v]: [string, any]) => {
          data[k] = v.value;
        });
      }
      return {
        id: n.id,
        type: n.type || n.data.type,
        data
      };
    });
    
    const workletEdges = edges.map(e => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || 'out-both',
      targetHandle: e.targetHandle || 'in-both'
    }));

    this.workletNode.port.postMessage({
      type: 'SET_GRAPH',
      nodes: workletNodes,
      edges: workletEdges,
      sampleRate: this.ctx.sampleRate
    });
  }

  panic() {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'PANIC' });
    }
  }

  async resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async suspendContext() {
     if (this.ctx && this.ctx.state === 'running') {
       await this.ctx.suspend();
     }
  }

  startRecording() {
    if (!this.ctx || !this.workletNode) return;
    if (this.isRecording) return;
    
    if (!this.mediaDest) {
       this.mediaDest = this.ctx.createMediaStreamDestination();
       this.workletNode.connect(this.mediaDest);
    }
    
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.mediaDest.stream, { mimeType: 'audio/webm' });
    
    this.mediaRecorder.ondataavailable = (e) => {
       if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    
    this.mediaRecorder.onstop = async () => {
       const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
       
       // Converting to WAV manually is preferred but webm is easier to export fast in browser. 
       // They asked for .wav, let's just save as webm and call it .webm or try offline audio context export.
       // For a functional "Save as WAV" without giant libraries, downloading standard webm is often acceptable,
       // but wait, if it's strictly .wav, we need to decode and encode to WAV. Standard WebAudio can do this.
       
       const arrayBuffer = await blob.arrayBuffer();
       let audioBuffer: AudioBuffer;
       try {
         audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
       } catch(e) {
         console.error('Failed to decode recorded audio', e);
         return;
       }
       
       const wavData = this.audioBufferToWav(audioBuffer);
       const wavBlob = new Blob([new DataView(wavData)], { type: 'audio/wav' });
       const url = URL.createObjectURL(wavBlob);
       const a = document.createElement('a');
       a.href = url;
       a.download = 'candles_export.wav';
       a.click();
       URL.revokeObjectURL(url);
    };
    
    this.mediaRecorder.start();
    this.isRecording = true;
  }

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;
    this.mediaRecorder.stop();
    this.isRecording = false;
  }
  
  async analyzeIR(nodes: any[], edges: any[], durationSec: number = 3.0): Promise<{
     buffer: AudioBuffer,
     rt60: number,
     edc: Float32Array
  }> {
     const sampleRate = this.ctx ? this.ctx.sampleRate : 48000;
     const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);
     const blob = new Blob([workletCode], { type: 'application/javascript' });
     const url = URL.createObjectURL(blob);
     await offlineCtx.audioWorklet.addModule(url);
     
     const workletNode = new AudioWorkletNode(offlineCtx, 'reverb-dsp-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2]
     });
     
     const workletNodes = nodes.map(n => {
        const data: Record<string, any> = {};
        if (n.data && n.data.params) {
          Object.entries(n.data.params).forEach(([k, v]: [string, any]) => {
            data[k] = v.value;
          });
        }
        return {
          id: n.id,
          type: n.type || n.data.type,
          data
        };
     });
     
     const workletEdges = edges.map(e => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || 'out-both',
        targetHandle: e.targetHandle || 'in-both'
     }));
     
     workletNode.port.postMessage({
        type: 'SET_GRAPH',
        nodes: workletNodes,
        edges: workletEdges,
        sampleRate: offlineCtx.sampleRate
     });
     
     // Give the worklet a tiny bit of time to parse message
     await new Promise(resolve => setTimeout(resolve, 50));
     
     // Dirac impulse
     const impulseBuffer = offlineCtx.createBuffer(1, 1, sampleRate);
     impulseBuffer.getChannelData(0)[0] = 1.0;
     
     const source = offlineCtx.createBufferSource();
     source.buffer = impulseBuffer;
     source.connect(workletNode);
     workletNode.connect(offlineCtx.destination);
     
     source.start(0);
     
     const renderedBuffer = await offlineCtx.startRendering();
     
     // Calculate RT60 & EDC
     const channelData = renderedBuffer.getChannelData(0);
     const length = channelData.length;
     const edc = new Float32Array(length);
     let sum = 0;
     
     for(let i = length - 1; i >= 0; i--) {
        sum += channelData[i] * channelData[i];
        edc[i] = sum;
     }
     
     const maxEdc = edc[0];
     let rt60 = 0;
     
     const decimatedEdc = new Float32Array(500);
     const step = Math.floor(length / 500);
     
     if (maxEdc > 0) {
        let t5 = -1, t25 = -1;
        for(let i=0; i<length; i++) {
           const db = 10 * Math.log10(edc[i] / maxEdc);
           if (t5 === -1 && db <= -5) t5 = i;
           if (t25 === -1 && db <= -25) { t25 = i; break; }
        }
        if (t5 !== -1 && t25 !== -1) {
            const decayTime = (t25 - t5) / sampleRate;
            rt60 = decayTime * 3; 
        }
        
        for(let i=0; i<500; i++) {
            const val = edc[Math.min(i * step, length - 1)] / maxEdc;
            decimatedEdc[i] = 10 * Math.log10(val > 1e-10 ? val : 1e-10);
        }
     } else {
        for(let i=0; i<500; i++) decimatedEdc[i] = -100;
     }
     
     return { buffer: renderedBuffer, rt60, edc: decimatedEdc };
  }

  audioBufferToWav(buffer: AudioBuffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const result = new ArrayBuffer(44 + buffer.length * numChannels * 2);
    const view = new DataView(result);
    
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * numChannels * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * numChannels * 2, true);
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            let sample = buffer.getChannelData(channel)[i];
            sample = Math.max(-1, Math.min(1, sample));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, sample, true);
            offset += 2;
        }
    }
    return result;
  }
}

export const audioEngine = new AudioEngine();
