/*
@nwWrld name: AudioWaveRings
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioWaveRings extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 1.5, type: "number", min: 0.1, max: 5.0 },
        { name: "ringCount", defaultVal: 12, type: "number", min: 5, max: 30 },
        { name: "baseHue", defaultVal: 180, type: "number", min: 0, max: 360 },
        { name: "pulseMode", defaultVal: "all", type: "select", values: ["bass", "mid", "treble", "all"] },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.5, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setRingCount",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 12, type: "number", min: 5, max: 30 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 180, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setPulseMode",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "all", type: "select", values: ["bass", "mid", "treble", "all"] }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioWaveRings.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 1.5;
    this.ringCount = 12;
    this.baseHue = 180;
    this.pulseMode = "all";
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.rings = [];
    this.init();
  }

  async start({ sensitivity = 1.5, ringCount = 12, baseHue = 180, pulseMode = "all" } = {}) {
    const sensVal = Number(sensitivity);
    const countVal = Number(ringCount);
    const hueVal = Number(baseHue);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 1.5));
    this.ringCount = Math.max(5, Math.min(30, Number.isFinite(countVal) ? Math.floor(countVal) : 12));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 180));
    this.pulseMode = ["bass", "mid", "treble", "all"].includes(pulseMode) ? pulseMode : "all";
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
        p.noFill();

        this.rings = [];
        const maxRadius = Math.min(this.canvasWidth, this.canvasHeight) * 0.4;
        for (let i = 0; i < this.ringCount; i++) {
          const baseRadius = (i / this.ringCount) * maxRadius;
          this.rings.push({
            baseRadius,
            currentRadius: baseRadius,
            phase: (i / this.ringCount) * Math.PI * 2,
            speed: 0.02 + Math.random() * 0.03,
            thickness: 2 + Math.random() * 3,
            hueOffset: (i * 360) / this.ringCount,
          });
        }
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

        p.clear();
        p.translate(this.canvasWidth / 2, this.canvasHeight / 2);

        let pulseValue = this.volume;
        if (this.pulseMode === "bass") pulseValue = this.bass;
        else if (this.pulseMode === "mid") pulseValue = this.mid;
        else if (this.pulseMode === "treble") pulseValue = this.treble;

        this.rings.forEach((ring, i) => {
          ring.phase += ring.speed * (1 + this.volume * 0.5);

          let audioInfluence = pulseValue;
          if (this.pulseMode === "all") {
            if (i < this.ringCount / 3) audioInfluence = this.bass;
            else if (i < (this.ringCount * 2) / 3) audioInfluence = this.mid;
            else audioInfluence = this.treble;
          }

          const wave = Math.sin(ring.phase) * 0.5 + 0.5;
          const expansion = audioInfluence * 0.3;
          ring.currentRadius = ring.baseRadius * (1 + wave * expansion + audioInfluence * 0.2);

          const hue = (this.baseHue + ring.hueOffset + this.volume * 50) % 360;
          const saturation = 80 + audioInfluence * 20;
          const brightness = 70 + audioInfluence * 30;

          p.stroke(hue, saturation, brightness, 90);
          p.strokeWeight(ring.thickness + audioInfluence * 5);
          p.ellipse(0, 0, ring.currentRadius * 2);

          if (audioInfluence > 0.3) {
            p.stroke(hue, 100, 100, 60);
            p.strokeWeight(ring.thickness * 0.5);
            p.ellipse(0, 0, ring.currentRadius * 2.1);
          }
        });
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 1.5 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.5));
  }

  setRingCount({ value = 12 } = {}) {
    const val = Number(value);
    this.ringCount = Math.max(5, Math.min(30, Number.isFinite(val) ? Math.floor(val) : 12));
    if (this.myp5 && this.rings) {
      const maxRadius = Math.min(this.canvasWidth, this.canvasHeight) * 0.4;
      this.rings = [];
      for (let i = 0; i < this.ringCount; i++) {
        const baseRadius = (i / this.ringCount) * maxRadius;
        this.rings.push({
          baseRadius,
          currentRadius: baseRadius,
          phase: (i / this.ringCount) * Math.PI * 2,
          speed: 0.02 + Math.random() * 0.03,
          thickness: 2 + Math.random() * 3,
          hueOffset: (i * 360) / this.ringCount,
        });
      }
    }
  }

  setBaseHue({ value = 180 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 180));
  }

  setPulseMode({ value = "all" } = {}) {
    this.pulseMode = ["bass", "mid", "treble", "all"].includes(value) ? value : "all";
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

export default AudioWaveRings;
