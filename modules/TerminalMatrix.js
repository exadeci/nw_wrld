/*
@nwWrld name: TerminalMatrix
@nwWrld category: Text
@nwWrld imports: ModuleBase, p5
*/

class TerminalMatrix extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "speed", defaultVal: 2.0, type: "number", min: 0.5, max: 5.0 },
        { name: "density", defaultVal: 0.8, type: "number", min: 0.1, max: 100.0 },
        { name: "color", defaultVal: "#00ff00", type: "color" },
        { name: "screenfill", defaultVal: 1.0, type: "number", min: 0.5, max: 10.0 },
      ],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "speed", defaultVal: 2.0, type: "number", min: 0.5, max: 5.0 }],
    },
    {
      name: "setDensity",
      executeOnLoad: false,
      options: [{ name: "density", defaultVal: 0.8, type: "number", min: 0.1, max: 100.0 }],
    },
    {
      name: "setColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#00ff00", type: "color" }],
    },
    {
      name: "setScreenfill",
      executeOnLoad: false,
      options: [{ name: "screenfill", defaultVal: 1.0, type: "number", min: 0.5, max: 5.0 }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = TerminalMatrix.name;
    this.myp5 = null;
    this.destroyed = false;
    this.speed = 2.0;
    this.density = 0.8;
    this.color = "#00ff00";
    this.screenfill = 1.0;
    this.drops = [];
    this.chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
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
        p.textAlign(p.CENTER);

        const fontSize = 14;
        p.textSize(fontSize);
        this.fontSize = fontSize;
        const baseCols = Math.floor(this.canvasWidth / fontSize);
        this.cols = Math.floor(baseCols * this.screenfill);

        this.drops = [];
        for (let i = 0; i < this.cols; i++) {
          this.drops[i] = p.random(-this.canvasHeight, 0);
        }
      };

      p.draw = () => {
        p.background(0, 20);
        const colorRgb = this.hexToRgb(this.color);
        p.fill(colorRgb.r, colorRgb.g, colorRgb.b);

        for (let i = 0; i < this.cols; i++) {
          const densityMultiplier = this.density / 100.0;
          const numChars = Math.max(1, Math.floor(densityMultiplier * 5));
          const colSpacing = this.canvasWidth / this.cols;
          
          for (let j = 0; j < numChars; j++) {
            if (Math.random() < densityMultiplier) {
              const x = i * colSpacing;
              const y = (this.drops[i] + j * 3) * this.fontSize;

              if (y >= 0 && y <= this.canvasHeight) {
                const char = this.chars.charAt(
                  Math.floor(p.random() * this.chars.length)
                );
                p.text(char, x, y);
              }
            }
          }

          if (this.drops[i] * this.fontSize > this.canvasHeight && Math.random() > 0.975) {
            this.drops[i] = 0;
          }

          this.drops[i] += this.speed * 0.1;
        }
      };
    };

    this.myp5 = new p5(sketch);
  }

  async start({ speed = 2.0, density = 0.8, color = "#00ff00", screenfill = 1.0 } = {}) {
    this.speed = Math.max(0.5, Math.min(5.0, Number(speed) || 2.0));
    this.density = Math.max(0.1, Math.min(100.0, Number(density) || 0.8));
    this.color = String(color);
    this.screenfill = Math.max(0.5, Math.min(5.0, Number(screenfill) || 1.0));
    
    if (this.myp5 && this.myp5.setup) {
      const baseCols = Math.floor(this.canvasWidth / this.fontSize);
      this.cols = Math.floor(baseCols * this.screenfill);
      
      this.drops = [];
      for (let i = 0; i < this.cols; i++) {
        this.drops[i] = this.myp5.random(-this.canvasHeight, 0);
      }
    }
  }

  setSpeed({ speed = 2.0 } = {}) {
    this.speed = Math.max(0.5, Math.min(5.0, Number(speed) || 2.0));
  }

  setDensity({ density = 0.8 } = {}) {
    this.density = Math.max(0.1, Math.min(100.0, Number(density) || 0.8));
  }

  setColor({ color = "#00ff00" } = {}) {
    this.color = String(color);
  }

  setScreenfill({ screenfill = 1.0 } = {}) {
    this.screenfill = Math.max(0.5, Math.min(5.0, Number(screenfill) || 1.0));
    
    if (this.myp5 && this.myp5.setup) {
      const baseCols = Math.floor(this.canvasWidth / this.fontSize);
      this.cols = Math.floor(baseCols * this.screenfill);
      
      this.drops = [];
      for (let i = 0; i < this.cols; i++) {
        this.drops[i] = this.myp5.random(-this.canvasHeight, 0);
      }
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

export default TerminalMatrix;
