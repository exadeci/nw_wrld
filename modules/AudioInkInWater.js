/*
@nwWrld name: AudioInkInWater
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioInkInWater extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "inkDensity", defaultVal: 1.0, type: "number", min: 0.1, max: 2.0 },
        { name: "baseHue", defaultVal: 200, type: "number", min: 0, max: 360 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setInkDensity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 2.0 }],
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
    this.name = AudioInkInWater.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.inkDensity = 1.0;
    this.baseHue = 200;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.inkClouds = [];
    this.shockwaves = [];
    this.lastBassPeak = 0;
    this.init();
  }

  async start({ sensitivity = 2.0, inkDensity = 1.0, baseHue = 200 } = {}) {
    const sensVal = Number(sensitivity);
    const densityVal = Number(inkDensity);
    const hueVal = Number(baseHue);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.inkDensity = Math.max(0.1, Math.min(2.0, Number.isFinite(densityVal) ? densityVal : 1.0));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 200));
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

        p.background(0, 0, 0, 5);

        if (this.bass > 0.4 && this.bass > this.lastBassPeak * 1.2) {
          const centerX = p.random(this.canvasWidth);
          const centerY = p.random(this.canvasHeight);
          this.inkClouds.push({
            x: centerX,
            y: centerY,
            radius: 0,
            maxRadius: Math.min(this.canvasWidth, this.canvasHeight) * 0.4,
            hue: (this.baseHue + p.random(-60, 60)) % 360,
            intensity: this.bass,
            particles: [],
          });

          this.shockwaves.push({
            x: centerX,
            y: centerY,
            radius: 0,
            maxRadius: Math.min(this.canvasWidth, this.canvasHeight) * 0.6,
            life: 1.0,
          });
        }
        this.lastBassPeak = this.bass;

        this.inkClouds = this.inkClouds.filter((cloud) => {
          cloud.radius += 0.5 * (1 + this.bass * 0.5) * this.inkDensity;

          const alpha = p.map(cloud.radius, 0, cloud.maxRadius, 100, 0);
          const hue = (cloud.hue + this.volume * 20) % 360;

          p.fill(hue, 100, 100, alpha * 0.3);
          p.noStroke();
          p.circle(cloud.x, cloud.y, cloud.radius * 2);

          p.stroke(hue, 100, 100, alpha);
          p.strokeWeight(2 + cloud.intensity * 3);
          p.noFill();
          p.circle(cloud.x, cloud.y, cloud.radius * 2);

          if (cloud.radius < cloud.maxRadius * 0.5) {
            for (let i = 0; i < this.inkDensity * 5; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = Math.random() * cloud.radius;
              cloud.particles.push({
                x: cloud.x + Math.cos(angle) * dist,
                y: cloud.y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                life: 1.0,
              });
            }
          }

          cloud.particles = cloud.particles.filter((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.vx *= 0.98;
            particle.vy *= 0.98;

            p.fill(hue, 100, 100, particle.life * 100);
            p.noStroke();
            p.circle(particle.x, particle.y, 3 * particle.life);

            return particle.life > 0 && particle.x > 0 && particle.x < this.canvasWidth && particle.y > 0 && particle.y < this.canvasHeight;
          });

          return cloud.radius < cloud.maxRadius;
        });

        this.shockwaves = this.shockwaves.filter((wave) => {
          wave.radius += 3 * (1 + this.bass);
          wave.life -= 0.02;

          const alpha = wave.life * 100;
          const hue = (this.baseHue + 60) % 360;

          p.stroke(hue, 100, 100, alpha);
          p.strokeWeight(3);
          p.noFill();
          p.circle(wave.x, wave.y, wave.radius * 2);

          return wave.radius < wave.maxRadius && wave.life > 0;
        });
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setInkDensity({ value = 1.0 } = {}) {
    const val = Number(value);
    this.inkDensity = Math.max(0.1, Math.min(2.0, Number.isFinite(val) ? val : 1.0));
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
    if (this.myp5) {
      this.myp5.remove();
      this.myp5 = null;
    }
    super.destroy();
  }
}

export default AudioInkInWater;
