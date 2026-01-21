/*
@nwWrld name: AudioASCIIWave
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioASCIIWave extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "chars", defaultVal: "█▓▒░", type: "text" },
        { name: "color", defaultVal: "#00ff00", type: "color" },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setChars",
      executeOnLoad: false,
      options: [{ name: "chars", defaultVal: "█▓▒░", type: "text" }],
    },
    {
      name: "setColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#00ff00", type: "color" }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioASCIIWave.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.chars = "█▓▒░";
    this.color = "#00ff00";
    this.audioReactive = true;
    this.volume = 0;
    this.init();
  }

  init() {
    const sketch = (p) => {
      this.myp5 = p;

      p.setup = () => {
        this.canvasWidth = this.elem.clientWidth;
        this.canvasHeight = this.elem.clientHeight;
        this.canvas = p.createCanvas(this.canvasWidth, this.canvasHeight);
        this.canvas.parent(this.elem);
        p.colorMode(p.RGB, 255);
        p.textFont("monospace");
        p.textAlign(p.CENTER);
        p.textSize(12);
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

        p.background(0);
        const colorRgb = this.hexToRgb(this.color);
        p.fill(colorRgb.r, colorRgb.g, colorRgb.b);

        const cols = 80;
        const colWidth = this.canvasWidth / cols;
        const centerY = this.canvasHeight / 2;

        for (let i = 0; i < cols; i++) {
          const x = i * colWidth + colWidth / 2;
          const normalizedVolume = Math.min(1, this.volume);
          const waveHeight = Math.sin((i / cols) * Math.PI * 4 + p.frameCount * 0.1) * normalizedVolume * 100;
          const height = Math.abs(waveHeight) * normalizedVolume;
          const charIndex = Math.floor((height / 100) * (this.chars.length - 1));
          const char = this.chars.charAt(Math.max(0, Math.min(this.chars.length - 1, charIndex)));

          p.text(char, x, centerY + waveHeight);
        }
      };
    };

    this.myp5 = new p5(sketch);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 255, b: 0 };
  }

  async start({ sensitivity = 2.0, chars = "█▓▒░", color = "#00ff00" } = {}) {
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number(sensitivity) || 2.0));
    this.chars = String(chars);
    this.color = String(color);
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }

  setSensitivity({ value = 2.0 } = {}) {
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number(value) || 2.0));
  }

  setChars({ chars = "█▓▒░" } = {}) {
    this.chars = String(chars);
  }

  setColor({ color = "#00ff00" } = {}) {
    this.color = String(color);
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

export default AudioASCIIWave;
