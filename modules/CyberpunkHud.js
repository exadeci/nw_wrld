/*
@nwWrld name: CyberpunkHud
@nwWrld category: Visual
@nwWrld imports: ModuleBase, p5
*/

class CyberpunkHud extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "color", defaultVal: "#00ff00", type: "color" },
        { name: "scanSpeed", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 },
        { name: "gridDensity", defaultVal: 0.3, type: "number", min: 0.1, max: 1.0 },
      ],
    },
    {
      name: "setColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#00ff00", type: "color" }],
    },
    {
      name: "setScanSpeed",
      executeOnLoad: false,
      options: [{ name: "scanSpeed", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 }],
    },
    {
      name: "setGridDensity",
      executeOnLoad: false,
      options: [{ name: "gridDensity", defaultVal: 0.3, type: "number", min: 0.1, max: 1.0 }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = CyberpunkHud.name;
    this.myp5 = null;
    this.destroyed = false;
    this.color = "#00ff00";
    this.scanSpeed = 1.0;
    this.gridDensity = 0.3;
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
      };

      p.draw = () => {
        p.background(0, 5);
        const colorRgb = this.hexToRgb(this.color);

        const gridSize = 40;
        const cols = Math.floor(this.canvasWidth / gridSize);
        const rows = Math.floor(this.canvasHeight / gridSize);

        p.stroke(colorRgb.r, colorRgb.g, colorRgb.b, 30);
        p.strokeWeight(1);

        for (let x = 0; x <= cols; x++) {
          if (Math.random() < this.gridDensity) {
            p.line(x * gridSize, 0, x * gridSize, this.canvasHeight);
          }
        }

        for (let y = 0; y <= rows; y++) {
          if (Math.random() < this.gridDensity) {
            p.line(0, y * gridSize, this.canvasWidth, y * gridSize);
          }
        }

        const scanY = (p.frameCount * 2 * this.scanSpeed) % (this.canvasHeight + 100) - 50;
        p.stroke(colorRgb.r, colorRgb.g, colorRgb.b, 150);
        p.strokeWeight(2);
        p.line(0, scanY, this.canvasWidth, scanY);

        p.fill(colorRgb.r, colorRgb.g, colorRgb.b, 100);
        p.noStroke();
        p.triangle(0, scanY - 5, 0, scanY + 5, 20, scanY);
        p.triangle(this.canvasWidth, scanY - 5, this.canvasWidth, scanY + 5, this.canvasWidth - 20, scanY);

        p.fill(colorRgb.r, colorRgb.g, colorRgb.b);
        p.textSize(12);
        p.textAlign(p.LEFT);
        p.text(`SYSTEM ONLINE`, 10, 20);
        p.text(`SCAN: ${p.frameCount % 10000}`, 10, 40);
        
        p.textAlign(p.RIGHT);
        p.text(`${Math.floor(p.frameCount / 60)}:${String(Math.floor((p.frameCount % 60) / 10))}${String(p.frameCount % 10)}`, this.canvasWidth - 10, 20);
        p.text(`STATUS: OK`, this.canvasWidth - 10, 40);
      };
    };

    this.myp5 = new p5(sketch);
  }

  async start({ color = "#00ff00", scanSpeed = 1.0, gridDensity = 0.3 } = {}) {
    this.color = String(color);
    this.scanSpeed = Math.max(0.1, Math.min(3.0, Number(scanSpeed) || 1.0));
    this.gridDensity = Math.max(0.1, Math.min(1.0, Number(gridDensity) || 0.3));
  }

  setColor({ color = "#00ff00" } = {}) {
    this.color = String(color);
  }

  setScanSpeed({ scanSpeed = 1.0 } = {}) {
    this.scanSpeed = Math.max(0.1, Math.min(3.0, Number(scanSpeed) || 1.0));
  }

  setGridDensity({ gridDensity = 0.3 } = {}) {
    this.gridDensity = Math.max(0.1, Math.min(1.0, Number(gridDensity) || 0.3));
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

export default CyberpunkHud;
