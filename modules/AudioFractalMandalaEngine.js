/*
@nwWrld name: AudioFractalMandalaEngine
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioFractalMandalaEngine extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "layers", defaultVal: 8, type: "number", min: 4, max: 16 },
        { name: "baseHue", defaultVal: 0, type: "number", min: 0, max: 360 },
        { name: "removeBackground", defaultVal: false, type: "boolean" },
        { name: "backgroundColor", defaultVal: "#000000", type: "color" },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setLayers",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 8, type: "number", min: 4, max: 16 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setRemoveBackground",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: false, type: "boolean" }],
    },
    {
      name: "setBackgroundColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#000000", type: "color" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioFractalMandalaEngine.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.layers = 8;
    this.baseHue = 0;
    this.audioReactive = true;
    this.removeBackground = false;
    this.backgroundColor = "#000000";
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.rotation = 0;
    this.sparkles = [];
    this.init();
  }

  async start({ sensitivity = 2.0, layers = 8, baseHue = 0, removeBackground = false, backgroundColor = "#000000" } = {}) {
    const sensVal = Number(sensitivity);
    const layersVal = Number(layers);
    const hueVal = Number(baseHue);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.layers = Math.max(4, Math.min(16, Number.isFinite(layersVal) ? Math.floor(layersVal) : 8));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 0));
    this.removeBackground = Boolean(removeBackground);
    this.backgroundColor = typeof backgroundColor === "string" ? backgroundColor : "#000000";
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
      };

      p.draw = () => {
        if (this.audioReactive && this.analyzer && this.audioReady) {
          const sensitivity = this.sensitivity || 1.0;
          this.volume = this.analyzer.getVolume() * sensitivity;
          this.bass = this.analyzer.getBass() * sensitivity;
          this.mid = this.analyzer.getMid() * sensitivity;
          this.treble = this.analyzer.getTreble() * sensitivity;
        } else if (!this.audioReactive) {
          const sensitivity = this.sensitivity || 1.0;
          this.volume = 0.3 * sensitivity;
          this.bass = 0.2 * sensitivity;
          this.mid = 0.3 * sensitivity;
          this.treble = 0.2 * sensitivity;
        }

        if (this.removeBackground) {
          p.clear();
        } else {
          p.push();
          p.colorMode(p.RGB, 255);
          const bgColor = p.color(this.backgroundColor);
          p.colorMode(p.HSB, 360, 100, 100, 100);
          const bgHue = p.hue(bgColor);
          const bgSat = p.saturation(bgColor);
          const bgBright = p.brightness(bgColor);
          p.background(bgHue, bgSat, bgBright, 10);
          p.pop();
        }

        this.rotation += 0.005 + this.volume * 0.01;

        p.translate(this.canvasWidth / 2, this.canvasHeight / 2);

        const maxRadius = Math.min(this.canvasWidth, this.canvasHeight) * 0.4;
        const baseRadius = maxRadius * (1 + this.bass * 0.3);

        for (let layer = 0; layer < this.layers; layer++) {
          const layerProgress = layer / this.layers;
          const radius = baseRadius * (1 - layerProgress);
          const segments = 6 + layer * 2;
          const layerRotation = this.rotation * (1 + layer * 0.1) * (layer % 2 === 0 ? 1 : -1);

          const hue = (this.baseHue + layer * 30 + this.volume * 50) % 360;
          const saturation = 80 + this.mid * 20;
          const brightness = 60 + this.treble * 40;

          p.stroke(hue, saturation, brightness, 90);
          p.strokeWeight(2 + layer * 0.5);
          p.noFill();

          p.push();
          p.rotate(layerRotation);

          for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2;
            const angle2 = ((i + 1) / segments) * Math.PI * 2;

            const x1 = Math.cos(angle1) * radius;
            const y1 = Math.sin(angle1) * radius;
            const x2 = Math.cos(angle2) * radius;
            const y2 = Math.sin(angle2) * radius;

            p.line(x1, y1, x2, y2);

            if (layer > 0) {
              const prevRadius = baseRadius * (1 - (layer - 1) / this.layers);
              const prevX1 = Math.cos(angle1) * prevRadius;
              const prevY1 = Math.sin(angle1) * prevRadius;
              p.line(x1, y1, prevX1, prevY1);
            }
          }

          if (this.mid > 0.3) {
            const morphSegments = segments + Math.floor(this.mid * 4);
            for (let i = 0; i < morphSegments; i++) {
              const angle = (i / morphSegments) * Math.PI * 2;
              const morphRadius = radius * (1 + Math.sin(this.mid * 10 + angle) * 0.1);
              const x = Math.cos(angle) * morphRadius;
              const y = Math.sin(angle) * morphRadius;
              p.point(x, y);
            }
          }

          p.pop();
        }

        if (this.treble > 0.2) {
          for (let i = 0; i < this.treble * 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sparkleRadius = Math.random() * maxRadius;
            const x = Math.cos(angle) * sparkleRadius;
            const y = Math.sin(angle) * sparkleRadius;
            const sparkleHue = (this.baseHue + Math.random() * 60) % 360;
            p.fill(sparkleHue, 100, 100, 80);
            p.noStroke();
            p.circle(x, y, 3 + this.treble * 5);
          }
        }
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setLayers({ value = 8 } = {}) {
    const val = Number(value);
    this.layers = Math.max(4, Math.min(16, Number.isFinite(val) ? Math.floor(val) : 8));
  }

  setBaseHue({ value = 0 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 0));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setRemoveBackground({ enabled = false } = {}) {
    this.removeBackground = Boolean(enabled);
  }

  setBackgroundColor({ color = "#000000" } = {}) {
    this.backgroundColor = typeof color === "string" ? color : "#000000";
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

export default AudioFractalMandalaEngine;
