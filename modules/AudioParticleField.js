/*
@nwWrld name: AudioParticleField
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioParticleField extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "particleCount", defaultVal: 500, type: "number", min: 100, max: 2000 },
        { name: "baseHue", defaultVal: 200, type: "number", min: 0, max: 360 },
        { name: "trailLength", defaultVal: 5, type: "number", min: 1, max: 20 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setParticleCount",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 500, type: "number", min: 100, max: 2000 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 200, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setTrailLength",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 5, type: "number", min: 1, max: 20 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioParticleField.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.particleCount = 500;
    this.baseHue = 200;
    this.trailLength = 5;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.particles = [];
    this.init();
  }

  async start({ sensitivity = 2.0, particleCount = 500, baseHue = 200, trailLength = 5 } = {}) {
    const sensVal = Number(sensitivity);
    const countVal = Number(particleCount);
    const hueVal = Number(baseHue);
    const trailVal = Number(trailLength);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.particleCount = Math.max(100, Math.min(2000, Number.isFinite(countVal) ? Math.floor(countVal) : 500));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 200));
    this.trailLength = Math.max(1, Math.min(20, Number.isFinite(trailVal) ? Math.floor(trailVal) : 5));
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

        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
          this.particles.push({
            x: p.random(this.canvasWidth),
            y: p.random(this.canvasHeight),
            vx: (p.random() - 0.5) * 2,
            vy: (p.random() - 0.5) * 2,
            size: p.random(2, 6),
            hue: (this.baseHue + p.random(-30, 30)) % 360,
            history: [],
            frequencyBand: Math.floor(p.random(3)),
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

        p.background(0, 0, 0, 20);

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        this.particles.forEach((particle) => {
          let audioForce = 0;
          if (particle.frequencyBand === 0) audioForce = this.bass;
          else if (particle.frequencyBand === 1) audioForce = this.mid;
          else audioForce = this.treble;

          const angle = p.atan2(particle.y - centerY, particle.x - centerX);
          const distance = p.dist(particle.x, particle.y, centerX, centerY);
          const maxDistance = p.dist(0, 0, this.canvasWidth, this.canvasHeight) / 2;

          const repulsionForce = (1 - distance / maxDistance) * audioForce * 0.1;
          particle.vx += Math.cos(angle) * repulsionForce;
          particle.vy += Math.sin(angle) * repulsionForce;

          particle.vx *= 0.95;
          particle.vy *= 0.95;

          particle.x += particle.vx * (1 + audioForce * 0.5);
          particle.y += particle.vy * (1 + audioForce * 0.5);

          if (particle.x < 0 || particle.x > this.canvasWidth) particle.vx *= -1;
          if (particle.y < 0 || particle.y > this.canvasHeight) particle.vy *= -1;
          particle.x = p.constrain(particle.x, 0, this.canvasWidth);
          particle.y = p.constrain(particle.y, 0, this.canvasHeight);

          particle.history.push({ x: particle.x, y: particle.y });
          if (particle.history.length > this.trailLength) {
            particle.history.shift();
          }

          const hue = (particle.hue + this.volume * 30) % 360;
          const brightness = 50 + audioForce * 50;

          if (particle.history.length > 1) {
            for (let i = 1; i < particle.history.length; i++) {
              const alpha = (i / particle.history.length) * 80;
              p.stroke(hue, 100, brightness, alpha);
              p.strokeWeight(particle.size * (i / particle.history.length));
              p.line(
                particle.history[i - 1].x,
                particle.history[i - 1].y,
                particle.history[i].x,
                particle.history[i].y
              );
            }
          }

          p.fill(hue, 100, brightness, 100);
          p.noStroke();
          p.circle(particle.x, particle.y, particle.size + audioForce * 3);
        });
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setParticleCount({ value = 500 } = {}) {
    const val = Number(value);
    this.particleCount = Math.max(100, Math.min(2000, Number.isFinite(val) ? Math.floor(val) : 500));
    if (this.myp5 && this.particles) {
      this.particles = [];
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push({
          x: this.myp5.random(this.canvasWidth),
          y: this.myp5.random(this.canvasHeight),
          vx: (this.myp5.random() - 0.5) * 2,
          vy: (this.myp5.random() - 0.5) * 2,
          size: this.myp5.random(2, 6),
          hue: (this.baseHue + this.myp5.random(-30, 30)) % 360,
          history: [],
          frequencyBand: Math.floor(this.myp5.random(3)),
        });
      }
    }
  }

  setBaseHue({ value = 200 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 200));
  }

  setTrailLength({ value = 5 } = {}) {
    const val = Number(value);
    this.trailLength = Math.max(1, Math.min(20, Number.isFinite(val) ? Math.floor(val) : 5));
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

export default AudioParticleField;
