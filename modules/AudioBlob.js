/*
@nwWrld name: AudioBlob
@nwWrld category: 2D
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioBlob extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        {
          name: "sensitivity",
          defaultVal: 1.0,
          type: "number",
          min: 0.1,
          max: 5.0,
        },
        {
          name: "smoothing",
          defaultVal: 0.8,
          type: "number",
          min: 0.0,
          max: 1.0,
        },
        {
          name: "colorHue",
          defaultVal: 220,
          type: "number",
          min: 0,
          max: 360,
        },
        {
          name: "colorSaturation",
          defaultVal: 70,
          type: "number",
          min: 0,
          max: 100,
        },
        {
          name: "colorBrightness",
          defaultVal: 70,
          type: "number",
          min: 0,
          max: 100,
        },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setSmoothing",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.8, type: "number", min: 0.0, max: 1.0 }],
    },
    {
      name: "setColorHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 220, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setColorSaturation",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 70, type: "number", min: 0, max: 100 }],
    },
    {
      name: "setColorBrightness",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 70, type: "number", min: 0, max: 100 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    console.log("[AudioBlob] 🎵 Constructor called!");
    this.name = AudioBlob.name;
    this.myp5 = null;
    this.canvas = null;
    this.destroyed = false;

    this.analyzer = null;
    this.audioReady = false;
    this.animationId = null;
    this.pollInterval = null;

    // Audio data
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.waveform = [];
    this.frequencyData = [];

    // Smoothed values
    this.smoothedVolume = 0;
    this.smoothedBass = 0;
    this.smoothedMid = 0;
    this.smoothedTreble = 0;

    // Settings
    this.sensitivity = 1.0;
    this.smoothing = 0.8;

    // Visual settings
    this.colorHue = 220;
    this.colorSaturation = 70;
    this.colorBrightness = 70;
    this.audioReactive = true;

    this.noiseOffsets = [];
    this.init();
  }

  async start({
    sensitivity = 1.0,
    smoothing = 0.8,
    colorHue = 220,
    colorSaturation = 70,
    colorBrightness = 70,
  } = {}) {
    console.log("[AudioBlob] 🎵 start() method called!");
    try {
      const sensVal = Number(sensitivity);
      const smoothVal = Number(smoothing);
      const hueVal = Number(colorHue);
      const satVal = Number(colorSaturation);
      const brightVal = Number(colorBrightness);
      this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 1.0));
      this.smoothing = Math.max(0.0, Math.min(1.0, Number.isFinite(smoothVal) ? smoothVal : 0.8));
      this.colorHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 220));
      this.colorSaturation = Math.max(0, Math.min(100, Number.isFinite(satVal) ? satVal : 70));
      this.colorBrightness = Math.max(0, Math.min(100, Number.isFinite(brightVal) ? brightVal : 70));

      // Check if AudioAnalyzer is available
      if (typeof AudioAnalyzer === "undefined") {
        console.warn("[AudioBlob] AudioAnalyzer not available in SDK");
        return;
      }

      // Try to get audio stream - use SDK (sandbox context)
      await this.tryInitializeAudio();
      
      // If not available, start polling for stream
      if (!this.audioReady) {
        this.startStreamPolling();
      }
    } catch (error) {
      console.error("[AudioBlob] Error in start method:", error);
    }
  }

  async tryInitializeAudio() {
    if (this.audioReady || this.destroyed) return;
    
    const sdk = globalThis.nwWrldSdk;
    const stream = sdk?.audio?.getStream?.();

    console.log("[AudioBlob] Checking for stream... sdk:", !!sdk, "stream:", !!stream);

    if (stream) {
      try {
        console.log("[AudioBlob] Stream found! Initializing AudioAnalyzer...");
        this.analyzer = new AudioAnalyzer();
        const initialized = await this.analyzer.init(stream);
        console.log("[AudioBlob] AudioAnalyzer initialized:", initialized);
        if (initialized) {
          this.audioReady = true;
          this.startAudioLoop();
          if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
          }
          console.log("[AudioBlob] ✅ Audio stream connected and ready!");
        }
      } catch (error) {
        console.error("[AudioBlob] Failed to initialize audio:", error);
      }
    }
  }

  startStreamPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      if (this.destroyed) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
        return;
      }
      this.tryInitializeAudio();
    }, 1000);
  }

  startAudioLoop() {
    const updateAudio = () => {
      if (this.destroyed || !this.analyzer) return;

      if (this.audioReactive) {
        this.volume = this.analyzer.getVolume();
        this.bass = this.analyzer.getBass();
        this.mid = this.analyzer.getMid();
        this.treble = this.analyzer.getTreble();
        this.waveform = this.analyzer.getWaveformNormalized();
        this.frequencyData = this.analyzer.getFrequencyDataNormalized();
      } else {
        this.volume = 0.3;
        this.bass = 0.2;
        this.mid = 0.3;
        this.treble = 0.2;
        this.waveform = [];
        this.frequencyData = [];
      }

      // Smooth values
      const smoothFactor = this.smoothing;
      this.smoothedVolume =
        this.smoothedVolume * smoothFactor +
        this.volume * (1 - smoothFactor);
      this.smoothedBass =
        this.smoothedBass * smoothFactor + this.bass * (1 - smoothFactor);
      this.smoothedMid =
        this.smoothedMid * smoothFactor + this.mid * (1 - smoothFactor);
      this.smoothedTreble =
        this.smoothedTreble * smoothFactor + this.treble * (1 - smoothFactor);

      this.animationId = requestAnimationFrame(updateAudio);
    };
    updateAudio();
  }

  init() {
    if (!p5) return;
    const sketch = (p) => {
      this.myp5 = p;

      p.setup = () => {
        if (!this.elem) return;

        const canvasWidth = this.elem.clientWidth;
        const canvasHeight = this.elem.clientHeight;
        this.canvas = p.createCanvas(canvasWidth, canvasHeight);
        this.canvas.parent(this.elem);
        // Make canvas background transparent
        this.canvas.style.backgroundColor = "transparent";
        p.noFill();
        p.angleMode(p.DEGREES);

        const numLayers = 10;
        this.noiseOffsets = [];
        for (let i = 0; i < numLayers; i++) {
          this.noiseOffsets.push(p.random(1000));
        }
      };

      p.draw = () => {
        if (!this.elem) return;
        
        // Clear with transparent background
        p.clear();
        
        if (!this.audioReady) {
          // Don't draw anything if no audio - let other modules show through
          return;
        }
        p.translate(p.width / 2, p.height / 2);

        const numLayers = 10;
        if (this.noiseOffsets.length < numLayers) {
          while (this.noiseOffsets.length < numLayers) {
            this.noiseOffsets.push(p.random(1000));
          }
        }

        // Use audio data to drive the visualization
        const intensity = this.smoothedVolume * this.sensitivity * 200;
        const bassIntensity = this.smoothedBass * this.sensitivity * 150;
        const midIntensity = this.smoothedMid * this.sensitivity * 100;
        const trebleIntensity = this.smoothedTreble * this.sensitivity * 50;

        const maxRadius = (Math.min(p.width, p.height) * 0.8) / 2;
        const minStrokeWeight = 0.1;
        const maxStrokeWeight = 1;
        let previousLayerRadii = [];

        for (let i = 0; i < numLayers; i++) {
          const radius = maxRadius - (i * maxRadius) / numLayers;
          p.strokeWeight(
            p.map(i, 0, numLayers - 1, minStrokeWeight, maxStrokeWeight)
          );

          // Color based on frequency bands
          let hue = this.colorHue;
          if (i < numLayers / 3) {
            // Bass layers - use bass intensity
            hue = this.colorHue + this.smoothedBass * 30;
          } else if (i < (numLayers * 2) / 3) {
            // Mid layers
            hue = this.colorHue + this.smoothedMid * 20;
          } else {
            // Treble layers
            hue = this.colorHue + this.smoothedTreble * 10;
          }
          hue = ((hue % 360) + 360) % 360;

          p.stroke(
            p.color(
              `hsb(${hue}, ${this.colorSaturation}%, ${this.colorBrightness}%)`
            )
          );

          // Apply compression based on bass
          const applyCompression = this.smoothedBass > 0.3;
          let compressionAngle = 0;
          let minCompression = 1;
          if (applyCompression) {
            compressionAngle = (p.frameCount * 0.5) % 360;
            minCompression = 0.3 + this.smoothedBass * 0.4;
          }

          const currentLayerRadii = [];
          p.beginShape();
          for (let angle = 0; angle <= 360; angle += 5) {
            const xoff = p.map(p.cos(angle), -1, 1, 0, 1);
            const yoff = p.map(p.sin(angle), -1, 1, 0, 1);
            const n = p.noise(
              (xoff + this.noiseOffsets[i]) * 0.5,
              (yoff + this.noiseOffsets[i]) * 0.5
            );

            // Use different frequency bands for different layers
            let audioIntensity = intensity;
            if (i < numLayers / 3) {
              audioIntensity = bassIntensity;
            } else if (i < (numLayers * 2) / 3) {
              audioIntensity = midIntensity;
            } else {
              audioIntensity = trebleIntensity;
            }

            const maxOffset = audioIntensity * ((numLayers - i) / numLayers);
            const offset = p.map(n, 0.4, 0.6, -maxOffset, maxOffset, true);
            let currentRadius = radius + offset;

            if (applyCompression) {
              let angleDifference = angle - compressionAngle;
              angleDifference = ((angleDifference + 180) % 360) - 180;
              const compressionFactor = p.map(
                p.cos(p.radians(angleDifference)),
                -1,
                1,
                1,
                minCompression
              );
              currentRadius = currentRadius * compressionFactor;
            }

            if (i > 0) {
              const prevRadius = previousLayerRadii[angle] || radius;
              const maxAllowedRadius = prevRadius - 1;
              if (currentRadius > maxAllowedRadius)
                currentRadius = maxAllowedRadius;
            } else if (currentRadius > maxRadius) {
              currentRadius = maxRadius;
            }

            const x = currentRadius * p.cos(angle);
            const y = currentRadius * p.sin(angle);

            currentLayerRadii[angle] = currentRadius;
            p.curveVertex(x, y);
          }
          p.endShape(p.CLOSE);

          previousLayerRadii = currentLayerRadii;
          // Speed up noise animation based on volume
          const noiseSpeed = 0.005 + this.smoothedVolume * 0.02;
          this.noiseOffsets[i] += noiseSpeed;
        }
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 1.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.0));
  }

  setSmoothing({ value = 0.8 } = {}) {
    const val = Number(value);
    this.smoothing = Math.max(0.0, Math.min(1.0, Number.isFinite(val) ? val : 0.8));
  }

  setColorHue({ value = 220 } = {}) {
    const val = Number(value);
    this.colorHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 220));
  }

  setColorSaturation({ value = 70 } = {}) {
    const val = Number(value);
    this.colorSaturation = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 70));
  }

  setColorBrightness({ value = 70 } = {}) {
    const val = Number(value);
    this.colorBrightness = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 70));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  destroy() {
    this.destroyed = true;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.analyzer) {
      this.analyzer.destroy();
      this.analyzer = null;
    }
    if (this.myp5) {
      this.myp5.remove();
      this.myp5 = null;
    }
    this.canvas = null;
    super.destroy();
  }
}

export default AudioBlob;
