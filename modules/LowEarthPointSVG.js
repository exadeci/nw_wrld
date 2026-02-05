/*
@nwWrld name: LowEarthPointSVG
@nwWrld category: 2D
@nwWrld imports: BaseSVGModule
*/

const sampleN = (arr, n) => {
  if (!arr || arr.length === 0) return [];
  const copy = arr.slice();
  const out = [];
  const count = Math.max(0, Math.min(copy.length, n));
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
};

const rotate2D = (x, y, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c - y * s, y: x * s + y * c };
};

class LowEarthPointSVG extends BaseSVGModule {
  static methods = [
    {
      name: "primary",
      executeOnLoad: false,
      options: [
        { name: "duration", defaultVal: 500, type: "number", unit: "ms" },
      ],
    },
  ];

  constructor(container) {
    super(container);
    this.name = LowEarthPointSVG.name;
    this.points = [];
    this.redPoints = [];
    this.rotation = 0;
    this.rotationSpeed = 0.0005;
    this.pulseCircles = [];
    this.createPoints();
    this.createRedPoints();
    this.setCustomAnimate(this.animateLoop.bind(this));
  }

  createPoints() {
    const count = 500;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      this.points.push({ x, y });
    }
  }

  createRedPoints() {
    const count = 250;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * 2 - 1) * 0.5;
      const y = (Math.random() * 2 - 1) * 0.5;
      this.redPoints.push({ x, y });
    }
  }

  project(p, width, height) {
    const r = rotate2D(p.x, p.y, this.rotation);
    const scale = Math.min(width, height) * 0.4;
    return {
      x: width / 2 + r.x * scale,
      y: height / 2 + r.y * scale,
    };
  }

  drawSVG() {
    if (!this.svgRoot || this.destroyed) return;
    const w = this.svgRoot.clientWidth || this.elem?.offsetWidth || 800;
    const h = this.svgRoot.clientHeight || this.elem?.offsetHeight || 600;
    const ns = this.svgNS;

    while (this.svgRoot.firstChild) {
      this.svgRoot.removeChild(this.svgRoot.firstChild);
    }

    const gLines = document.createElementNS(ns, "g");
    gLines.setAttribute("stroke-opacity", "0.2");
    gLines.setAttribute("stroke", "#ffffff");
    gLines.setAttribute("stroke-width", "1");
    const lineCount = Math.min(50, Math.floor(this.points.length / 10));
    for (let i = 0; i < lineCount; i++) {
      const idx1 = Math.floor(Math.random() * this.points.length);
      const idx2 = Math.floor(Math.random() * this.points.length);
      if (idx1 === idx2) continue;
      const a = this.project(this.points[idx1], w, h);
      const b = this.project(this.points[idx2], w, h);
      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", String(a.x));
      line.setAttribute("y1", String(a.y));
      line.setAttribute("x2", String(b.x));
      line.setAttribute("y2", String(b.y));
      gLines.appendChild(line);
    }
    this.svgRoot.appendChild(gLines);

    const gRedLines = document.createElementNS(ns, "g");
    gRedLines.setAttribute("stroke-opacity", "0.15");
    gRedLines.setAttribute("stroke", "#ff0000");
    gRedLines.setAttribute("stroke-width", "1");
    const halfRed = Math.floor(this.redPoints.length / 2);
    for (let i = 0; i < halfRed; i++) {
      for (let j = i + 1; j < Math.min(i + 4, this.redPoints.length); j++) {
        const a = this.project(this.redPoints[i], w, h);
        const b = this.project(this.redPoints[j], w, h);
        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", String(a.x));
        line.setAttribute("y1", String(a.y));
        line.setAttribute("x2", String(b.x));
        line.setAttribute("y2", String(b.y));
        gRedLines.appendChild(line);
      }
    }
    this.svgRoot.appendChild(gRedLines);

    const gPoints = document.createElementNS(ns, "g");
    gPoints.setAttribute("fill", "#ffffff");
    this.points.forEach((p) => {
      const proj = this.project(p, w, h);
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", String(proj.x));
      circle.setAttribute("cy", String(proj.y));
      circle.setAttribute("r", "2");
      gPoints.appendChild(circle);
    });
    this.svgRoot.appendChild(gPoints);

    const gRedPoints = document.createElementNS(ns, "g");
    gRedPoints.setAttribute("fill", "#ff0000");
    this.redPoints.forEach((p) => {
      const proj = this.project(p, w, h);
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", String(proj.x));
      circle.setAttribute("cy", String(proj.y));
      circle.setAttribute("r", "1.8");
      gRedPoints.appendChild(circle);
    });
    this.svgRoot.appendChild(gRedPoints);

    const gPulse = document.createElementNS(ns, "g");
    gPulse.setAttribute("fill", "#ffffff");
    this.pulseCircles.forEach(({ point, life }) => {
      const proj = this.project(point, w, h);
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", String(proj.x));
      circle.setAttribute("cy", String(proj.y));
      circle.setAttribute("r", String(2 + (1 - life) * 6));
      circle.setAttribute("opacity", String(life));
      gPulse.appendChild(circle);
    });
    this.svgRoot.appendChild(gPulse);
  }

  animateLoop() {
    if (this.destroyed) return;
    this.rotation += this.rotationSpeed;
    this.pulseCircles = this.pulseCircles.filter((entry) => {
      entry.life -= 0.015;
      return entry.life > 0;
    });
  }

  primary({ duration = 500 } = {}) {
    if (this.destroyed) return;
    const millis = Number(duration) || 500;
    const selected = sampleN(this.points, 5);
    selected.forEach((p) => {
      this.pulseCircles.push({ point: { x: p.x, y: p.y }, life: 1 });
    });
  }

  destroy() {
    this.pulseCircles = [];
    super.destroy();
  }
}

export default LowEarthPointSVG;
