/*
@nwWrld name: AudioRipple
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioRipple extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "baseHue", defaultVal: 180, type: "number", min: 0, max: 360 },
        { name: "rippleSpeed", defaultVal: 2.0, type: "number", min: 0.5, max: 5.0 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 180, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setRippleSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.5, max: 5.0 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioRipple.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.baseHue = 180;
    this.rippleSpeed = 2.0;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.ripples = [];
    this.lastBassPeak = 0;
    this.init();
  }

  async start({ sensitivity = 2.0, baseHue = 180, rippleSpeed = 2.0 } = {}) {
    const sensVal = Number(sensitivity);
    const hueVal = Number(baseHue);
    const speedVal = Number(rippleSpeed);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 180));
    this.rippleSpeed = Math.max(0.5, Math.min(5.0, Number.isFinite(speedVal) ? speedVal : 2.0));
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
        p.noFill();
      };

      p.draw = () => {
        if (this.audioReactive && this.analyzer && this.audioReady) {
          const sensitivity = this.sensitivity || 1.0;
          this.volume = this.analyzer.getVolume() * sensitivity;
          this.bass = this.analyzer.getBass() * sensitivity;
          this.mid = this.analyzer.getMid() * sensitivity;
          this.treble = this.analyzer.getTreble() * sensitivity;

          if (this.bass > 0.4 && this.bass > this.lastBassPeak * 1.2) {
            const centerX = p.random(this.canvasWidth);
            const centerY = p.random(this.canvasHeight);
            this.ripples.push({
              x: centerX,
              y: centerY,
              radius: 0,
              maxRadius: Math.min(this.canvasWidth, this.canvasHeight) * 0.6,
              hue: (this.baseHue + p.random(-60, 60)) % 360,
              intensity: this.bass,
            });
          }
          this.lastBassPeak = this.bass;
        } else if (!this.audioReactive) {
          const sensitivity = this.sensitivity || 1.0;
          this.volume = 0.3 * sensitivity;
          this.bass = 0.2 * sensitivity;
          this.mid = 0.3 * sensitivity;
          this.treble = 0.2 * sensitivity;
          if (p.frameCount % 60 === 0) {
            const centerX = p.random(this.canvasWidth);
            const centerY = p.random(this.canvasHeight);
            this.ripples.push({
              x: centerX,
              y: centerY,
              radius: 0,
              maxRadius: Math.min(this.canvasWidth, this.canvasHeight) * 0.6,
              hue: (this.baseHue + p.random(-60, 60)) % 360,
              intensity: 0.5,
            });
          }
        }

        p.background(0, 0, 0, 5);

        this.ripples = this.ripples.filter((ripple) => {
          ripple.radius += this.rippleSpeed * (1 + this.volume * 0.3);

          const alpha = p.map(ripple.radius, 0, ripple.maxRadius, 100, 0);
          const hue = (ripple.hue + this.volume * 20) % 360;
          const saturation = 80 + ripple.intensity * 20;

          p.stroke(hue, saturation, 100, alpha);
          p.strokeWeight(3 + ripple.intensity * 5);
          p.circle(ripple.x, ripple.y, ripple.radius * 2);

          if (ripple.radius > ripple.maxRadius * 0.3) {
            p.stroke(hue, 100, 100, alpha * 0.5);
            p.strokeWeight(1);
            p.circle(ripple.x, ripple.y, ripple.radius * 2.2);
          }

          return ripple.radius < ripple.maxRadius;
        });

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const maxR = Math.min(this.canvasWidth, this.canvasHeight) * 0.4;

        for (let r = 0; r < maxR; r += 10) {
          const wave = Math.sin((r / maxR) * Math.PI * 4 - p.frameCount * 0.1) * this.mid * 20;
          const hue = (this.baseHue + (r / maxR) * 120 + this.volume * 50) % 360;
          const alpha = p.map(r, 0, maxR, 80, 20);
          p.stroke(hue, 80, 100, alpha);
          p.strokeWeight(2);
          p.circle(centerX, centerY, (r + wave) * 2);
        }
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setBaseHue({ value = 180 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 180));
  }

  setRippleSpeed({ value = 2.0 } = {}) {
    const val = Number(value);
    this.rippleSpeed = Math.max(0.5, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
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

export default AudioRipple;
