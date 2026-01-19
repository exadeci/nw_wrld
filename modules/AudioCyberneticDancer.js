/*
@nwWrld name: AudioCyberneticDancer
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioCyberneticDancer extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "ribbonCount", defaultVal: 20, type: "number", min: 10, max: 40 },
        { name: "baseHue", defaultVal: 200, type: "number", min: 0, max: 360 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setRibbonCount",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 20, type: "number", min: 10, max: 40 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 200, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioCyberneticDancer.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.ribbonCount = 20;
    this.baseHue = 200;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.ribbons = [];
    this.lastClap = 0;
    this.init();
  }

  async start({ sensitivity = 2.0, ribbonCount = 20, baseHue = 200 } = {}) {
    const sensVal = Number(sensitivity);
    const countVal = Number(ribbonCount);
    const hueVal = Number(baseHue);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.ribbonCount = Math.max(10, Math.min(40, Number.isFinite(countVal) ? Math.floor(countVal) : 20));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 200));
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

        this.ribbons = [];
        for (let i = 0; i < this.ribbonCount; i++) {
          this.ribbons.push({
            points: [],
            hue: (this.baseHue + i * 10) % 360,
            phase: i * 0.1,
          });
        }
      };

      p.draw = () => {
        if (this.audioReactive && this.analyzer && this.audioReady) {
          this.volume = this.analyzer.getVolume() * this.sensitivity;
          this.bass = this.analyzer.getBass() * this.sensitivity;
          this.mid = this.analyzer.getMid() * this.sensitivity;
          this.treble = this.analyzer.getTreble() * this.sensitivity;
        } else if (!this.audioReactive) {
          this.volume = 0.3 * this.sensitivity;
          this.bass = 0.2 * this.sensitivity;
          this.mid = 0.3 * this.sensitivity;
          this.treble = 0.2 * this.sensitivity;
        }

        const clapHit = this.mid > 0.4 && this.mid > this.lastClap * 1.2;
        this.lastClap = this.mid;

        if (clapHit) {
          p.background(0, 0, 0, 50);
        } else {
          p.background(0, 0, 0, 5);
        }

        p.translate(this.canvasWidth / 2, this.canvasHeight / 2);

        const centerX = 0;
        const centerY = 0;
        const baseRadius = Math.min(this.canvasWidth, this.canvasHeight) * 0.3;

        this.ribbons.forEach((ribbon, i) => {
          ribbon.phase += 0.02 + this.mid * 0.05;

          const angle = (i / this.ribbonCount) * Math.PI * 2 + ribbon.phase;
          const radius = baseRadius * (1 + this.bass * 0.3);
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius + Math.sin(ribbon.phase * 2) * this.volume * 50;

          ribbon.points.push({ x, y });
          if (ribbon.points.length > 30) {
            ribbon.points.shift();
          }

          if (ribbon.points.length > 1) {
            p.stroke(ribbon.hue, 100, 100, 80);
            p.strokeWeight(3 + this.treble * 5);
            p.noFill();

            p.beginShape();
            ribbon.points.forEach((point, j) => {
              const alpha = j / ribbon.points.length;
              p.stroke(ribbon.hue, 100, 100, alpha * 100);
              p.vertex(point.x, point.y);
            });
            p.endShape();
          }

          if (clapHit) {
            p.fill(ribbon.hue, 100, 100, 100);
            p.noStroke();
            p.circle(x, y, 10 + this.mid * 20);
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

  setRibbonCount({ value = 20 } = {}) {
    const val = Number(value);
    this.ribbonCount = Math.max(10, Math.min(40, Number.isFinite(val) ? Math.floor(val) : 20));
    if (this.myp5 && this.ribbons) {
      this.ribbons = [];
      for (let i = 0; i < this.ribbonCount; i++) {
        this.ribbons.push({
          points: [],
          hue: (this.baseHue + i * 10) % 360,
          phase: i * 0.1,
        });
      }
    }
  }

  setBaseHue({ value = 200 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 200));
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

export default AudioCyberneticDancer;
