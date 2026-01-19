/*
@nwWrld name: RetroGrid
@nwWrld category: Visual
@nwWrld imports: ModuleBase, p5
*/

class RetroGrid extends ModuleBase {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "gridSize", defaultVal: 20, type: "number", min: 10, max: 50 },
        { name: "color", defaultVal: "#00ff00", type: "color" },
        { name: "pulseSpeed", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 },
      ],
    },
    {
      name: "setGridSize",
      executeOnLoad: false,
      options: [{ name: "gridSize", defaultVal: 20, type: "number", min: 10, max: 50 }],
    },
    {
      name: "setColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#00ff00", type: "color" }],
    },
    {
      name: "setPulseSpeed",
      executeOnLoad: false,
      options: [{ name: "pulseSpeed", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = RetroGrid.name;
    this.myp5 = null;
    this.destroyed = false;
    this.gridSize = 20;
    this.color = "#00ff00";
    this.pulseSpeed = 1.0;
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
      };

      p.draw = () => {
        p.background(0);
        const colorRgb = this.hexToRgb(this.color);

        const cols = Math.floor(this.canvasWidth / this.gridSize);
        const rows = Math.floor(this.canvasHeight / this.gridSize);

        const pulse = Math.sin(p.frameCount * 0.05 * this.pulseSpeed) * 0.5 + 0.5;

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const distance = p.dist(
              x * this.gridSize,
              y * this.gridSize,
              this.canvasWidth / 2,
              this.canvasHeight / 2
            );
            const maxDist = p.dist(0, 0, this.canvasWidth / 2, this.canvasHeight / 2);
            const normalizedDist = distance / maxDist;
            const brightness = (1 - normalizedDist) * pulse;

            p.stroke(
              colorRgb.r * brightness,
              colorRgb.g * brightness,
              colorRgb.b * brightness
            );
            p.strokeWeight(1);
            p.point(x * this.gridSize, y * this.gridSize);
          }
        }

        p.stroke(colorRgb.r, colorRgb.g, colorRgb.b, 30);
        p.strokeWeight(1);

        for (let x = 0; x <= cols; x++) {
          p.line(x * this.gridSize, 0, x * this.gridSize, this.canvasHeight);
        }

        for (let y = 0; y <= rows; y++) {
          p.line(0, y * this.gridSize, this.canvasWidth, y * this.gridSize);
        }
      };
    };

    this.myp5 = new p5(sketch);
  }

  async start({ gridSize = 20, color = "#00ff00", pulseSpeed = 1.0 } = {}) {
    this.gridSize = Math.max(10, Math.min(50, Number(gridSize) || 20));
    this.color = String(color);
    this.pulseSpeed = Math.max(0.1, Math.min(3.0, Number(pulseSpeed) || 1.0));
  }

  setGridSize({ gridSize = 20 } = {}) {
    this.gridSize = Math.max(10, Math.min(50, Number(gridSize) || 20));
  }

  setColor({ color = "#00ff00" } = {}) {
    this.color = String(color);
  }

  setPulseSpeed({ pulseSpeed = 1.0 } = {}) {
    this.pulseSpeed = Math.max(0.1, Math.min(3.0, Number(pulseSpeed) || 1.0));
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

export default RetroGrid;
