/*
@nwWrld name: AudioOrbitalPlane
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioOrbitalPlane extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 1.5, type: "number", min: 0.1, max: 5.0 },
        { name: "baseHue", defaultVal: 0, type: "number", min: 0, max: 360 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.5, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setEqualizerMode",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioOrbitalPlane.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 1.5;
    this.baseHue = 0;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.equalizerMode = false;
    this.audioReactive = true;
    this.frequencyBands = new Array(7).fill(0);
    this.init();
  }

  async start({ sensitivity = 1.5, baseHue = 0 } = {}) {
    const sensVal = Number(sensitivity);
    const hueVal = Number(baseHue);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 1.5));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 0));
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

        this.orbits = [];
        for (let i = 0; i < 7; i++) {
          let radius = p.map(i, 0, 6, 80, (this.canvasHeight / 2.5) * 0.85);
          let rotationSpeed = p.random(0.02, 0.12) * (p.random() > 0.5 ? 1 : -1);
          let offset = p.createVector(p.random(-3, 3), p.random(-3, 3));
          this.orbits.push({
            baseRadius: radius,
            radius,
            rotationSpeed,
            baseSpeed: rotationSpeed,
            points: [],
            offset,
            hueOffset: i * 30,
          });
          for (let angle = 0; angle < 360; angle += p.random(15, 35)) {
            this.orbits[i].points.push(angle);
          }
        }
      };

      p.draw = () => {
        if (this.audioReactive && this.analyzer && this.audioReady) {
          this.volume = this.analyzer.getVolume() * this.sensitivity;
          this.bass = this.analyzer.getBass() * this.sensitivity;
          this.mid = this.analyzer.getMid() * this.sensitivity;
          this.treble = this.analyzer.getTreble() * this.sensitivity;

          if (this.equalizerMode) {
            const freqData = this.analyzer.getFrequencyDataNormalized();
            if (freqData && freqData.length > 0) {
              const totalBins = freqData.length;
              const binsPerBand = Math.floor(totalBins / 7);
              
              for (let i = 0; i < 7; i++) {
                const startBin = i * binsPerBand;
                const endBin = i === 6 ? totalBins : (i + 1) * binsPerBand;
                let sum = 0;
                for (let j = startBin; j < endBin; j++) {
                  sum += freqData[j] || 0;
                }
                this.frequencyBands[i] = (sum / (endBin - startBin)) * this.sensitivity * 2.0;
              }
            }
          }
        } else if (!this.audioReactive) {
          this.volume = 0.3;
          this.bass = 0.2;
          this.mid = 0.3;
          this.treble = 0.2;
        }

        p.clear();
        p.translate(this.canvasWidth / 2, this.canvasHeight / 2);

        this.orbits.forEach((orbit, i) => {
          let audioInfluence = 0;
          if (this.equalizerMode) {
            audioInfluence = this.frequencyBands[i] || 0;
          } else {
            if (i < 2) audioInfluence = this.bass;
            else if (i < 5) audioInfluence = this.mid;
            else audioInfluence = this.treble;
          }

          const reactionMultiplier = this.equalizerMode ? 0.6 : 0.3;
          const speedMultiplier = this.equalizerMode ? 3.0 : 2.0;
          
          orbit.radius = orbit.baseRadius * (1 + audioInfluence * reactionMultiplier);
          orbit.rotationSpeed = orbit.baseSpeed * (1 + this.volume * speedMultiplier);

          const hue = (this.baseHue + orbit.hueOffset + this.volume * 60) % 360;
          const saturation = 70 + audioInfluence * (this.equalizerMode ? 50 : 30);
          const brightness = 60 + this.volume * 40;

          p.stroke(hue, saturation, brightness, 80);
          p.strokeWeight(1 + audioInfluence * (this.equalizerMode ? 3 : 2));
          p.ellipse(orbit.offset.x, orbit.offset.y, orbit.radius * 2);

          const pointWeight = this.equalizerMode ? (3 + audioInfluence * 6) : (3 + this.bass * 5);
          p.strokeWeight(pointWeight);
          orbit.points.forEach((angle) => {
            let x = orbit.radius * p.cos(p.radians(angle)) + orbit.offset.x;
            let y = orbit.radius * p.sin(p.radians(angle)) + orbit.offset.y;
            p.point(x, y);
          });

          orbit.points = orbit.points.map((angle) => (angle + orbit.rotationSpeed) % 360);
        });
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 1.5 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.5));
  }

  setBaseHue({ value = 0 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 0));
  }

  setEqualizerMode({ enabled = true } = {}) {
    const wasEnabled = this.equalizerMode;
    this.equalizerMode = Boolean(enabled);
    
    if (this.equalizerMode && !wasEnabled && this.myp5 && this.orbits) {
      this.orbits.forEach((orbit) => {
        orbit.radius = orbit.baseRadius;
      });
    }
    
    if (!this.equalizerMode) {
      this.frequencyBands.fill(0);
    }
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

export default AudioOrbitalPlane;
