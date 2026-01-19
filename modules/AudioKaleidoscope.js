/*
@nwWrld name: AudioKaleidoscope
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioKaleidoscope extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "segments", defaultVal: 8, type: "number", min: 3, max: 16 },
        { name: "baseHue", defaultVal: 0, type: "number", min: 0, max: 360 },
        { name: "complexity", defaultVal: 5, type: "number", min: 1, max: 10 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setSegments",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 8, type: "number", min: 3, max: 16 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setComplexity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 5, type: "number", min: 1, max: 10 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioKaleidoscope.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.segments = 8;
    this.baseHue = 0;
    this.complexity = 5;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.particles = [];
    this.init();
  }

  async start({ sensitivity = 2.0, segments = 8, baseHue = 0, complexity = 5 } = {}) {
    const sensVal = Number(sensitivity);
    const segVal = Number(segments);
    const hueVal = Number(baseHue);
    const compVal = Number(complexity);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.segments = Math.max(3, Math.min(16, Number.isFinite(segVal) ? Math.floor(segVal) : 8));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 0));
    this.complexity = Math.max(1, Math.min(10, Number.isFinite(compVal) ? Math.floor(compVal) : 5));
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
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

        this.particles = [];
        const particleCount = 50 * this.complexity;
        for (let i = 0; i < particleCount; i++) {
          this.particles.push({
            angle: p.random(Math.PI * 2),
            radius: p.random(50, Math.min(this.canvasWidth, this.canvasHeight) * 0.4),
            speed: p.random(0.5, 2),
            size: p.random(3, 8),
            hue: p.random(360),
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
          this.volume = 0.3;
          this.bass = 0.2;
          this.mid = 0.3;
          this.treble = 0.2;
        }

        p.background(0, 0, 0, 15);
        p.translate(this.canvasWidth / 2, this.canvasHeight / 2);

        const segmentAngle = (Math.PI * 2) / this.segments;

        this.particles.forEach((particle) => {
          particle.angle += particle.speed * 0.01 * (1 + this.volume * 0.5);
          particle.radius += Math.sin(particle.angle * 2) * this.bass * 0.5;
          particle.radius = p.constrain(particle.radius, 20, Math.min(this.canvasWidth, this.canvasHeight) * 0.45);

          const x = Math.cos(particle.angle) * particle.radius;
          const y = Math.sin(particle.angle) * particle.radius;

          for (let i = 0; i < this.segments; i++) {
            p.push();
            p.rotate(i * segmentAngle);
            const hue = (this.baseHue + particle.hue + this.volume * 50) % 360;
            const brightness = 60 + this.mid * 40;
            p.fill(hue, 100, brightness, 80);
            p.noStroke();
            p.circle(x, y, particle.size + this.treble * 5);

            if (this.bass > 0.3) {
              p.stroke(hue, 100, 100, 60);
              p.strokeWeight(2);
              p.line(0, 0, x, y);
            }
            p.pop();
          }
        });

        if (this.volume > 0.2) {
          const centerHue = (this.baseHue + this.volume * 100) % 360;
          p.fill(centerHue, 100, 100, 30);
          p.noStroke();
          p.circle(0, 0, this.volume * Math.min(this.canvasWidth, this.canvasHeight) * 0.3);
        }
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setSegments({ value = 8 } = {}) {
    const val = Number(value);
    this.segments = Math.max(3, Math.min(16, Number.isFinite(val) ? Math.floor(val) : 8));
  }

  setBaseHue({ value = 0 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 0));
  }

  setComplexity({ value = 5 } = {}) {
    const val = Number(value);
    this.complexity = Math.max(1, Math.min(10, Number.isFinite(val) ? Math.floor(val) : 5));
    if (this.myp5 && this.particles) {
      this.particles = [];
      const particleCount = 50 * this.complexity;
      for (let i = 0; i < particleCount; i++) {
        this.particles.push({
          angle: this.myp5.random(Math.PI * 2),
          radius: this.myp5.random(50, Math.min(this.canvasWidth, this.canvasHeight) * 0.4),
          speed: this.myp5.random(0.5, 2),
          size: this.myp5.random(3, 8),
          hue: this.myp5.random(360),
        });
      }
    }
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  destroy() {
    this.destroyed = true;
    if (this.myp5) {
      this.myp5.remove();
      this.myp5 = null;
    }
    super.destroy();
  }
}

export default AudioKaleidoscope;
