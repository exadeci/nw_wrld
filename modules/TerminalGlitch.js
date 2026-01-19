/*
@nwWrld name: TerminalGlitch
@nwWrld category: Text
@nwWrld imports: ModuleBase, p5
*/

class TerminalGlitch extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "glitchIntensity", defaultVal: 0.5, type: "number", min: 0.1, max: 2.0 },
        { name: "glitchSpeed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
        { name: "color", defaultVal: "#00ff00", type: "color" },
        { name: "textSize", defaultVal: 16, type: "number", min: 8, max: 48 },
      ],
    },
    {
      name: "setGlitchIntensity",
      executeOnLoad: false,
      options: [{ name: "glitchIntensity", defaultVal: 0.5, type: "number", min: 0.1, max: 2.0 }],
    },
    {
      name: "setGlitchSpeed",
      executeOnLoad: false,
      options: [{ name: "glitchSpeed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#00ff00", type: "color" }],
    },
    {
      name: "setTextSize",
      executeOnLoad: false,
      options: [{ name: "textSize", defaultVal: 16, type: "number", min: 8, max: 48 }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = TerminalGlitch.name;
    this.myp5 = null;
    this.destroyed = false;
    this.glitchIntensity = 0.5;
    this.glitchSpeed = 1.0;
    this.color = "#00ff00";
    this.textSize = 16;
    this.lines = [];
    this.init();
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
        p.textAlign(p.LEFT);

        this.generateLines();
      };

      p.draw = () => {
        p.background(0, 30);
        const colorRgb = this.hexToRgb(this.color);
        p.fill(colorRgb.r, colorRgb.g, colorRgb.b);
        p.textSize(this.textSize);

        const glitchFrame = p.frameCount * 0.1 * this.glitchSpeed;
        const shouldGlitch = p.sin(glitchFrame) > 0.7;

        for (let i = 0; i < this.lines.length; i++) {
          const line = this.lines[i];
          let x = line.x;
          let y = line.y;

          if (shouldGlitch && Math.random() < this.glitchIntensity) {
            x += (p.random() - 0.5) * 20 * this.glitchIntensity;
            y += (p.random() - 0.5) * 10 * this.glitchIntensity;
            
            const glitchChars = "█▓▒░▄▀▌▐";
            const glitchChar = glitchChars.charAt(Math.floor(p.random() * glitchChars.length));
            p.text(glitchChar, x, y);
          } else {
            p.text(line.text, x, y);
          }

          line.y += line.speed;
          if (line.y > this.canvasHeight + 50) {
            line.y = -50;
            line.x = p.random(this.canvasWidth);
            line.text = this.generateRandomText();
          }
        }
      };
    };

    this.myp5 = new p5(sketch);
  }

  generateLines() {
    this.lines = [];
    const numLines = Math.floor(this.canvasHeight / (this.textSize * 2));
    for (let i = 0; i < numLines; i++) {
      this.lines.push({
        x: this.myp5.random(this.canvasWidth),
        y: this.myp5.random(-this.canvasHeight, 0),
        speed: this.myp5.random(0.5, 2.0),
        text: this.generateRandomText(),
      });
    }
  }

  generateRandomText() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let text = "";
    const length = Math.floor(this.myp5.random(10, 30));
    for (let i = 0; i < length; i++) {
      text += chars.charAt(Math.floor(this.myp5.random() * chars.length));
    }
    return text;
  }

  async start({ glitchIntensity = 0.5, glitchSpeed = 1.0, color = "#00ff00", textSize = 16 } = {}) {
    this.glitchIntensity = Math.max(0.1, Math.min(2.0, Number(glitchIntensity) || 0.5));
    this.glitchSpeed = Math.max(0.1, Math.min(5.0, Number(glitchSpeed) || 1.0));
    this.color = String(color);
    this.textSize = Math.max(8, Math.min(48, Number(textSize) || 16));
    
    if (this.myp5 && this.myp5.setup) {
      this.generateLines();
    }
  }

  setGlitchIntensity({ glitchIntensity = 0.5 } = {}) {
    this.glitchIntensity = Math.max(0.1, Math.min(2.0, Number(glitchIntensity) || 0.5));
  }

  setGlitchSpeed({ glitchSpeed = 1.0 } = {}) {
    this.glitchSpeed = Math.max(0.1, Math.min(5.0, Number(glitchSpeed) || 1.0));
  }

  setColor({ color = "#00ff00" } = {}) {
    this.color = String(color);
  }

  setTextSize({ textSize = 16 } = {}) {
    this.textSize = Math.max(8, Math.min(48, Number(textSize) || 16));
    
    if (this.myp5 && this.myp5.setup) {
      this.generateLines();
    }
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

export default TerminalGlitch;
