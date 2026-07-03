# Candles

**Candles** is a graphical ambient DSP (Digital Signal Processing) algorithm design tool. It allows users to visually design and chain audio signal processing algorithms in a node-based canvas, and export the resulting effects as C++ core code.

## Features

- **Visual Node Architecture**: Create and chain DSP elements dynamically in an intuitive graph-based canvas.
- **Extensive Node Library**:
  - **I/O**: Audio In/Out, Audio File Loop, Macro Knobs.
  - **Delays & Reverb**: Delay Line, Schroeder All-pass, Feedback Comb, Multi-Tap Delay, Modulated Delay (Chorus/Flanger).
  - **Filters & EQ**: Low-Pass (LPF), High-Pass (HPF), Biquad Parametric EQ, Loop Damping Filter.
  - **Matrix Mixers**: 4x4 and 8x8 Pure Matrix Mixers for building Feedback Delay Networks (FDNs).
  - **Modulation & Dynamics**: LFO, Envelope Follower, Clamper/Saturator, Tremolo, Phaser, Auto-Panner.
  - **Utility**: Math Expressions, 4-Channel Mixer, Stereo Spreader, Pitch Shifter.
  - **Analysis**: Oscilloscope, Spectrum Analyzer, Latency Analyzer.
- **C++ Export**: Seamlessly export your designed DSP effect as a skeleton C++ `AudioProcessor` class for integration into standard audio plugin frameworks.

## Tech Stack

- **Frontend Framework**: React (via Vite)
- **Node Graph Engine**: `@xyflow/react` (React Flow)
- **State Management**: Zustand
- **Styling**: Tailwind CSS

## Architecture

**Candles** is built as a highly interactive, state-driven single-page application.
- **Frontend Canvas**: Utilizes React Flow to render DSP nodes and their signal routing connections.
- **Node Architecture**: Each node represents a specific DSP unit. Node configurations, inputs, outputs, and parameters are defined in a centralized dictionary (`src/config/nodeTypes.ts`) and managed globally through Zustand.
- **C++ Generator**: The state of the visual node graph can be parsed and translated into C++ code (`src/utils/cppGenerator.ts`). The generator iterates through the active nodes to declare required DSP buffers (such as delays) and generates a `processBlock` function representing the audio signal flow, which can be exported for direct usage in a C++ audio project.

## Usage

### Run Locally

**Prerequisites:** [Node.js](https://nodejs.org/)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the provided local URL in your browser to access the design tool.
