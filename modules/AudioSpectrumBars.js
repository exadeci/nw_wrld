/*
@nwWrld name: AudioSpectrumBars
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioSpectrumBars extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "barCount", defaultVal: 64, type: "number", min: 16, max: 256 },
        { name: "baseHue", defaultVal: 240, type: "number", min: 0, max: 360 },
        { name: "mode", defaultVal: "circular", type: "select", values: ["circular", "linear", "spiral"] },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setBarCount",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 64, type: "number", min: 16, max: 256 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 240, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setMode",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "circular", type: "select", values: ["circular", "linear", "spiral"] }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioSpectrumBars.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.barCount = 64;
    this.baseHue = 240;
    this.mode = "circular";
    this.audioReactive = true;
    this.volume = 0;
    this.frequencyData = [];
    this.smoothedData = [];
    this.init();
  }

  async start({ sensitivity = 2.0, barCount = 64, baseHue = 240, mode = "circular" } = {}) {
    const sensVal = Number(sensitivity);
    const countVal = Number(barCount);
    const hueVal = Number(baseHue);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.barCount = Math.max(16, Math.min(256, Number.isFinite(countVal) ? Math.floor(countVal) : 64));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 240));
    this.mode = ["circular", "linear", "spiral"].includes(mode) ? mode : "circular";
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }

  async tryInitializeAudio() {
    if (this.audioReady || this.destroyed) return;
    const sdk = globalThis.nwWrldSdk;
    const stream = sdk?.audio?.getStream?.();
    if (stream) {
      this.analyzer = new AudioAnalyzer();
      const initialized = await this.analyzer.init(stream);
      if (initialized) {
        this.audioReady = true;
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
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

  init() {
    const sketch = (p) => {
      this.myp5 = p;

      p.setup = () => {
        this.canvasWidth = this.elem.clientWidth;
        this.canvasHeight = this.elem.clientHeight;
        this.canvas = p.createCanvas(this.canvasWidth, this.canvasHeight);
        this.canvas.parent(this.elem);
        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.rectMode(p.CENTER);

        this.smoothedData = new Array(this.barCount).fill(0);
      };

      p.draw = () => {
        if (this.audioReactive && this.analyzer && this.audioReady) {
          this.volume = this.analyzer.getVolume() * this.sensitivity;
          const freqData = this.analyzer.getFrequencyDataNormalized();
          if (freqData && freqData.length > 0) {
            const binsPerBar = Math.floor(freqData.length / this.barCount);
            for (let i = 0; i < this.barCount; i++) {
              let sum = 0;
              const startBin = i * binsPerBar;
              const endBin = Math.min((i + 1) * binsPerBar, freqData.length);
              for (let j = startBin; j < endBin; j++) {
                sum += freqData[j] || 0;
              }
              const avg = (sum / (endBin - startBin)) * this.sensitivity;
              this.smoothedData[i] = this.smoothedData[i] * 0.7 + avg * 0.3;
            }
          }
        } else if (!this.audioReactive) {
          this.volume = 0.3;
          for (let i = 0; i < this.barCount; i++) {
            const wave = Math.sin((i / this.barCount) * Math.PI * 4 + p.frameCount * 0.02) * 0.5 + 0.5;
            this.smoothedData[i] = this.smoothedData[i] * 0.7 + wave * 0.3 * this.sensitivity;
          }
        }

        p.background(0, 0, 0, 10);
        p.translate(this.canvasWidth / 2, this.canvasHeight / 2);

        const maxRadius = Math.min(this.canvasWidth, this.canvasHeight) * 0.4;
        const angleStep = (Math.PI * 2) / this.barCount;

        this.smoothedData.forEach((value, i) => {
          const angle = i * angleStep;
          const hue = (this.baseHue + (i / this.barCount) * 120 + this.volume * 30) % 360;
          const saturation = 80 + value * 20;
          const brightness = 60 + value * 40;

          if (this.mode === "circular") {
            const radius = maxRadius * 0.3;
            const barLength = value * maxRadius * 0.7;
            const x1 = Math.cos(angle) * radius;
            const y1 = Math.sin(angle) * radius;
            const x2 = Math.cos(angle) * (radius + barLength);
            const y2 = Math.sin(angle) * (radius + barLength);

            p.stroke(hue, saturation, brightness, 100);
            p.strokeWeight(3 + value * 5);
            p.line(x1, y1, x2, y2);

            p.fill(hue, 100, 100, 80);
            p.noStroke();
            p.circle(x2, y2, 5 + value * 10);
          } else if (this.mode === "linear") {
            const barWidth = (this.canvasWidth * 0.8) / this.barCount;
            const barHeight = value * this.canvasHeight * 0.6;
            const x = (i - this.barCount / 2) * barWidth;
            const y = -this.canvasHeight / 4;

            p.fill(hue, saturation, brightness, 100);
            p.noStroke();
            p.rect(x, y - barHeight / 2, barWidth * 0.8, barHeight);
          } else if (this.mode === "spiral") {
            const spiralRadius = (i / this.barCount) * maxRadius;
            const spiralAngle = angle + p.frameCount * 0.01;
            const barLength = value * maxRadius * 0.3;
            const x1 = Math.cos(spiralAngle) * spiralRadius;
            const y1 = Math.sin(spiralAngle) * spiralRadius;
            const x2 = Math.cos(spiralAngle) * (spiralRadius + barLength);
            const y2 = Math.sin(spiralAngle) * (spiralRadius + barLength);

            p.stroke(hue, saturation, brightness, 100);
            p.strokeWeight(2 + value * 4);
            p.line(x1, y1, x2, y2);
          }
        });
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setBarCount({ value = 64 } = {}) {
    const val = Number(value);
    this.barCount = Math.max(16, Math.min(256, Number.isFinite(val) ? Math.floor(val) : 64));
    this.smoothedData = new Array(this.barCount).fill(0);
  }

  setBaseHue({ value = 240 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 240));
  }

  setMode({ value = "circular" } = {}) {
    this.mode = ["circular", "linear", "spiral"].includes(value) ? value : "circular";
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
    if (this.analyzer) {
      this.analyzer.destroy();
      this.analyzer = null;
    }
    if (this.myp5) {
      this.myp5.remove();
      this.myp5 = null;
    }
    super.destroy();
  }
}

export default AudioSpectrumBars;
