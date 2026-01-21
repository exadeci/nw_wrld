/*
@nwWrld name: AudioCRTGlitchShrine
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class AudioCRTGlitchShrine extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "glitchIntensity", defaultVal: 1.0, type: "number", min: 0.1, max: 2.0 },
        { name: "vhsWobble", defaultVal: 0.5, type: "number", min: 0.0, max: 1.0 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setGlitchIntensity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 2.0 }],
    },
    {
      name: "setVHSWobble",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.5, type: "number", min: 0.0, max: 1.0 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AudioCRTGlitchShrine.name;
    this.myp5 = null;
    this.destroyed = false;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.glitchIntensity = 1.0;
    this.vhsWobble = 0.5;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.glitchLines = [];
    this.faceBlocks = [];
    this.lastSnare = 0;
    this.init();
  }

  async start({ sensitivity = 2.0, glitchIntensity = 1.0, vhsWobble = 0.5 } = {}) {
    const sensVal = Number(sensitivity);
    const glitchVal = Number(glitchIntensity);
    const wobbleVal = Number(vhsWobble);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.glitchIntensity = Math.max(0.1, Math.min(2.0, Number.isFinite(glitchVal) ? glitchVal : 1.0));
    this.vhsWobble = Math.max(0.0, Math.min(1.0, Number.isFinite(wobbleVal) ? wobbleVal : 0.5));
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
        p.colorMode(p.RGB, 255);
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

        const snareHit = this.mid > 0.4 && this.mid > this.lastSnare * 1.3;
        this.lastSnare = this.mid;

        if (snareHit) {
          for (let i = 0; i < 5; i++) {
            this.faceBlocks.push({
              x: p.random(this.canvasWidth),
              y: p.random(this.canvasHeight),
              width: p.random(50, 200),
              height: p.random(50, 200),
              color: p.color(
                p.random(255),
                p.random(255),
                p.random(255)
              ),
              life: 1.0,
            });
          }
        }

        p.background(0);

        this.faceBlocks = this.faceBlocks.filter((block) => {
          block.life -= 0.02;
          p.fill(block.color);
          p.noStroke();
          p.rect(block.x, block.y, block.width * block.life, block.height * block.life);
          return block.life > 0;
        });

        const wobble = Math.sin(p.frameCount * 0.1) * this.vhsWobble * 2;
        p.push();
        p.translate(wobble, 0);

        for (let y = 0; y < this.canvasHeight; y += 2) {
          const scanlineGlitch = Math.random() < this.treble * 0.1 * this.glitchIntensity;
          if (scanlineGlitch) {
            p.stroke(255, 0, 0, 100);
            p.strokeWeight(1);
            p.line(0, y, this.canvasWidth, y);
          } else {
            p.stroke(0, 255, 0, 20);
            p.strokeWeight(1);
            p.line(0, y, this.canvasWidth, y);
          }
        }

        const datamoshLines = Math.floor(this.treble * 10 * this.glitchIntensity);
        for (let i = 0; i < datamoshLines; i++) {
          const y = p.random(this.canvasHeight);
          const offset = (p.random() - 0.5) * this.bass * 50;
          p.stroke(255, 255, 0, 150);
          p.strokeWeight(2);
          p.line(0, y, this.canvasWidth, y + offset);
        }


        p.pop();
      };
    };

    this.myp5 = new p5(sketch);
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setGlitchIntensity({ value = 1.0 } = {}) {
    const val = Number(value);
    this.glitchIntensity = Math.max(0.1, Math.min(2.0, Number.isFinite(val) ? val : 1.0));
  }

  setVHSWobble({ value = 0.5 } = {}) {
    const val = Number(value);
    this.vhsWobble = Math.max(0.0, Math.min(1.0, Number.isFinite(val) ? val : 0.5));
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

export default AudioCRTGlitchShrine;
