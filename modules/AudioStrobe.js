/*
@nwWrld name: AudioStrobe
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioStrobe extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.5, type: "number", min: 0.1, max: 5.0 },
        { name: "baseHue", defaultVal: 0, type: "number", min: 0, max: 360 },
        { name: "strobeIntensity", defaultVal: 0.7, type: "number", min: 0.1, max: 1.0 },
        { name: "pattern", defaultVal: "burst", type: "select", values: ["burst", "grid", "radial", "wave"] },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.5, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setStrobeIntensity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.7, type: "number", min: 0.1, max: 1.0 }],
    },
    {
      name: "setPattern",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "burst", type: "select", values: ["burst", "grid", "radial", "wave"] }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioStrobe.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.5;
    this.baseHue = 0;
    this.strobeIntensity = 0.7;
    this.pattern = "burst";
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.lastPeak = 0;
    this.init();
  }

  async start({ sensitivity = 2.5, baseHue = 0, strobeIntensity = 0.7, pattern = "burst" } = {}) {
    const sensVal = Number(sensitivity);
    const hueVal = Number(baseHue);
    const intensityVal = Number(strobeIntensity);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.5));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 0));
    this.strobeIntensity = Math.max(0.1, Math.min(1.0, Number.isFinite(intensityVal) ? intensityVal : 0.7));
    this.pattern = ["burst", "grid", "radial", "wave"].includes(pattern) ? pattern : "burst";
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
      };

      p.draw = () => {
        if (this.audioReactive && this.analyzer && this.audioReady) {
          this.volume = this.analyzer.getVolume() * this.sensitivity;
          this.bass = this.analyzer.getBass() * this.sensitivity;
          this.mid = this.analyzer.getMid() * this.sensitivity;
          this.treble = this.analyzer.getTreble() * this.sensitivity;
        } else if (!this.audioReactive) {
          this.volume = 0.3;
          this.bass = 0.2;
          this.mid = 0.3;
          this.treble = 0.2;
        }

        const shouldStrobe = this.audioReactive 
          ? (this.bass > 0.3 && this.bass > this.lastPeak * 1.1)
          : (p.frameCount % 30 === 0);
        this.lastPeak = this.bass;

        if (shouldStrobe) {
          p.background(
            (this.baseHue + this.volume * 50) % 360,
            100,
            100,
            100 * this.strobeIntensity
          );
        } else {
          p.background(0, 0, 0, 30);
        }

        const hue = (this.baseHue + this.volume * 50) % 360;
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        if (this.pattern === "burst") {
          const rays = 16;
          for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2 + p.frameCount * 0.02;
            const length = this.bass * Math.min(this.canvasWidth, this.canvasHeight) * 0.4;
            p.stroke(hue, 100, 100, 80);
            p.strokeWeight(3);
            p.line(
              centerX,
              centerY,
              centerX + Math.cos(angle) * length,
              centerY + Math.sin(angle) * length
            );
          }
        } else if (this.pattern === "grid") {
          const gridSize = 10;
          const cellWidth = this.canvasWidth / gridSize;
          const cellHeight = this.canvasHeight / gridSize;
          for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
              const cellHue = (hue + (x + y) * 20) % 360;
              const intensity = (this.bass + this.mid + this.treble) / 3;
              p.fill(cellHue, 100, 100, intensity * 80);
              p.noStroke();
              p.rect(x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2, cellWidth * intensity, cellHeight * intensity);
            }
          }
        } else if (this.pattern === "radial") {
          const rings = 8;
          for (let i = 0; i < rings; i++) {
            const radius = (i / rings) * Math.min(this.canvasWidth, this.canvasHeight) * 0.4;
            const ringHue = (hue + i * 30) % 360;
            const intensity = (this.bass + this.mid) / 2;
            p.stroke(ringHue, 100, 100, intensity * 100);
            p.strokeWeight(5 + intensity * 10);
            p.noFill();
            p.circle(centerX, centerY, radius * 2 * (1 + intensity * 0.5));
          }
        } else if (this.pattern === "wave") {
          p.stroke(hue, 100, 100, 90);
          p.strokeWeight(4);
          p.noFill();
          p.beginShape();
          for (let x = 0; x < this.canvasWidth; x += 5) {
            const wave = Math.sin((x / this.canvasWidth) * Math.PI * 4 + p.frameCount * 0.1) * this.bass * 50;
            const y = centerY + wave + Math.sin(x * 0.01 + p.frameCount * 0.05) * this.mid * 30;
            p.vertex(x, y);
          }
          p.endShape();
        }
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 2.5 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.5));
  }

  setBaseHue({ value = 0 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 0));
  }

  setStrobeIntensity({ value = 0.7 } = {}) {
    const val = Number(value);
    this.strobeIntensity = Math.max(0.1, Math.min(1.0, Number.isFinite(val) ? val : 0.7));
  }

  setPattern({ value = "burst" } = {}) {
    this.pattern = ["burst", "grid", "radial", "wave"].includes(value) ? value : "burst";
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

export default AudioStrobe;
