/*
@nwWrld name: AudioLowEarthPoint
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
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

const clearThreeGroup = (group) => {
  if (!group) return;
  group.children.forEach((child) => {
    try {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m && m.dispose && m.dispose());
        else child.material.dispose && child.material.dispose();
      }
    } catch {}
  });
  group.clear();
};

const hexToNum = (hex) => {
  if (hex == null || hex === "") return 0x00ffff;
  const s = String(hex).replace(/^#/, "");
  return parseInt(s, 16) || 0x00ffff;
};

const normalizeHex = (val, fallback) => {
  if (val == null) return fallback;
  if (typeof val === "number" && Number.isFinite(val)) {
    const hex = Math.max(0, Math.min(0xffffff, Math.floor(val))).toString(16).padStart(6, "0");
    return "#" + hex;
  }
  if (typeof val === "object" && val !== null && "r" in val && "g" in val && "b" in val) {
    const r = Math.max(0, Math.min(1, Number(val.r) || 0));
    const g = Math.max(0, Math.min(1, Number(val.g) || 0));
    const b = Math.max(0, Math.min(1, Number(val.b) || 0));
    const hex = ((1 << 24) + (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255)).toString(16).slice(1);
    return "#" + hex;
  }
  const s = String(val).trim().replace(/^#/, "");
  return s ? "#" + s : fallback;
};

const applyColorToMaterial = (material, hexStr) => {
  if (!material || !material.color) return;
  const str = String(hexStr || "").trim();
  if (str.startsWith("#")) {
    material.color.setStyle(str);
  } else {
    material.color.setHex(hexToNum(hexStr));
  }
};

class AudioLowEarthPoint extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 1.5, type: "number" },
        { name: "particleCount", defaultVal: 500, type: "number" },
        { name: "pointsColor", defaultVal: "#00ffff", type: "color" },
        { name: "redPointsColor", defaultVal: "#ff0000", type: "color" },
        { name: "linesColor", defaultVal: "#00ffff", type: "color" },
        { name: "pulseColor", defaultVal: "#ffffff", type: "color" },
        { name: "pointsSize", defaultVal: 0.05, type: "number" },
        { name: "redPointsSize", defaultVal: 0.06, type: "number" },
        { name: "linesOpacity", defaultVal: 0.2, type: "number" },
        { name: "linesThickness", defaultVal: 1, type: "number" },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.5, type: "number" }],
    },
    {
      name: "setParticleCount",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 500, type: "number" }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setPointsColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#00ffff", type: "color" }],
    },
    {
      name: "setRedPointsColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#ff0000", type: "color" }],
    },
    {
      name: "setLinesColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#00ffff", type: "color" }],
    },
    {
      name: "setPulseColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#ffffff", type: "color" }],
    },
    {
      name: "setPointsSize",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.05, type: "number" }],
    },
    {
      name: "setRedPointsSize",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.06, type: "number" }],
    },
    {
      name: "setLinesOpacity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.2, type: "number" }],
    },
    {
      name: "setLinesThickness",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1, type: "number" }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = AudioLowEarthPoint.name;
    this.customGroup = new THREE.Group();
    this.points = [];
    this.redPoints = [];
    this.linesGroup = new THREE.Group();
    this.customGroup.add(this.linesGroup);
    this.pointCloud = null;
    this.redPointCloud = null;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 1.5;
    this.particleCount = 500;
    this.audioReactive = true;
    this.pointsColor = "#00ffff";
    this.redPointsColor = "#ff0000";
    this.linesColor = "#00ffff";
    this.pulseColor = "#ffffff";
    this.pointsSize = 0.05;
    this.redPointsSize = 0.06;
    this.linesOpacity = 0.2;
    this.linesThickness = 1;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.pulsePhase = 0;
    this.activeSpheres = [];

    this.setCustomAnimate(this.audioAnimateLoop.bind(this));
    this.init();
  }

  async start({
    sensitivity = 1.5,
    particleCount = 500,
    pointsColor = "#00ffff",
    redPointsColor = "#ff0000",
    linesColor = "#00ffff",
    pulseColor = "#ffffff",
    pointsSize = 0.05,
    redPointsSize = 0.06,
    linesOpacity = 0.2,
    linesThickness = 1,
  } = {}) {
    this.sensitivity = Number(sensitivity) || 1.5;
    this.particleCount = Number(particleCount) || 500;
    this.pointsColor = normalizeHex(pointsColor, "#00ffff");
    this.redPointsColor = normalizeHex(redPointsColor, "#ff0000");
    this.linesColor = normalizeHex(linesColor, "#00ffff");
    this.pulseColor = normalizeHex(pulseColor, "#ffffff");
    this.pointsSize = Number(pointsSize) ?? 0.05;
    this.redPointsSize = Number(redPointsSize) ?? 0.06;
    this.linesOpacity = Number(linesOpacity) ?? 0.2;
    this.linesThickness = Number(linesThickness) ?? 1;
    this.applyColorsToMaterials();
    this.linesGroup.children.forEach((child) => {
      if (child.material) {
        child.material.opacity = this.linesOpacity;
        child.material.linewidth = this.linesThickness;
      }
    });
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }

  applyColorsToMaterials() {
    applyColorToMaterial(this.pointCloud?.material, this.pointsColor);
    applyColorToMaterial(this.redPointCloud?.material, this.redPointsColor);
    this.linesGroup.children.forEach((child) => {
      applyColorToMaterial(child.material, this.linesColor);
    });
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
    if (this.destroyed) return;
    this.createPoints();
    this.createRedPoints();
    this.createLines();
    this.setModel(this.customGroup);
  }

  createPoints() {
    if (this.destroyed) return;

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({ color: hexToNum(this.pointsColor), size: this.pointsSize, transparent: true, opacity: 0.8 });
    const positions = [];

    for (let i = 0; i < this.particleCount; i++) {
      const x = Math.random() * 10 - 5;
      const y = Math.random() * 10 - 5;
      const z = Math.random() * 10 - 5;
      positions.push(x, y, z);
      this.points.push(new THREE.Vector3(x, y, z));
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    this.pointCloud = new THREE.Points(geometry, material);
    this.customGroup.add(this.pointCloud);
  }

  createRedPoints() {
    if (this.destroyed) return;

    const redGeometry = new THREE.BufferGeometry();
    const redMaterial = new THREE.PointsMaterial({ color: hexToNum(this.redPointsColor), size: this.redPointsSize, transparent: true, opacity: 0.9 });
    const redPositions = [];

    const count = Math.floor(this.particleCount / 2);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * 10 - 5) * 0.5;
      const y = (Math.random() * 10 - 5) * 0.5;
      const z = (Math.random() * 10 - 5) * 0.5;
      redPositions.push(x, y, z);
      this.redPoints.push(new THREE.Vector3(x, y, z));
    }

    redGeometry.setAttribute("position", new THREE.Float32BufferAttribute(redPositions, 3));
    this.redPointCloud = new THREE.Points(redGeometry, redMaterial);
    this.customGroup.add(this.redPointCloud);
  }

  createLines() {
    if (this.destroyed) return;

    clearThreeGroup(this.linesGroup);

    const lineCount = Math.min(50, Math.floor(this.points.length / 10));
    const positions = [];

    for (let i = 0; i < lineCount; i++) {
      const p1 = this.points[Math.floor(Math.random() * this.points.length)];
      const p2 = this.points[Math.floor(Math.random() * this.points.length)];
      positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: hexToNum(this.linesColor),
      transparent: true,
      opacity: this.linesOpacity,
      linewidth: this.linesThickness,
    });
    const lines = new THREE.LineSegments(geometry, material);
    this.linesGroup.add(lines);
  }

  audioAnimateLoop() {
    if (this.destroyed) return;

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

    const rotSpeed = 0.001 + this.volume * 0.01;

    if (this.pointCloud) {
      this.pointCloud.rotation.x += rotSpeed;
      this.pointCloud.rotation.y += rotSpeed * 0.7;
      this.pointCloud.material.size = this.pointsSize + this.treble * 0.1;
      this.pointCloud.material.opacity = 0.5 + this.volume * 0.5;
    }

    if (this.redPointCloud) {
      this.redPointCloud.rotation.x -= rotSpeed * 0.5;
      this.redPointCloud.rotation.y -= rotSpeed * 0.8;
      this.redPointCloud.material.size = this.redPointsSize + this.bass * 0.15;
      
      const scale = 1 + this.bass * 0.5;
      this.redPointCloud.scale.setScalar(scale);
    }

    this.linesGroup.rotation.x += rotSpeed * 0.3;
    this.linesGroup.rotation.y += rotSpeed * 0.5;

    if (this.bass > 0.6 && Math.random() < 0.3) {
      this.spawnPulseSphere();
    }

    this.updatePulseSpheres();
  }

  spawnPulseSphere() {
    const selected = sampleN(this.points, 3);
    selected.forEach((point) => {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: hexToNum(this.pulseColor), transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(point);
      mesh.userData.life = 1;
      mesh.userData.speed = 0.02 + Math.random() * 0.03;
      this.scene.add(mesh);
      this.activeSpheres.push(mesh);
    });
  }

  updatePulseSpheres() {
    for (let i = this.activeSpheres.length - 1; i >= 0; i--) {
      const sphere = this.activeSpheres[i];
      sphere.userData.life -= sphere.userData.speed;
      sphere.material.opacity = sphere.userData.life;
      sphere.scale.setScalar(1 + (1 - sphere.userData.life) * 2);

      if (sphere.userData.life <= 0) {
        this.scene.remove(sphere);
        sphere.geometry.dispose();
        sphere.material.dispose();
        this.activeSpheres.splice(i, 1);
      }
    }
  }

  setSensitivity({ value = 1.5 } = {}) {
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number(value) || 1.5));
  }

  setParticleCount({ value = 500 } = {}) {
    const newCount = Math.max(100, Math.min(2000, Math.floor(Number(value) || 500)));
    if (newCount !== this.particleCount) {
      this.particleCount = newCount;
      this.rebuildPoints();
    }
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setPointsColor({ value = "#00ffff" } = {}) {
    this.pointsColor = normalizeHex(value, "#00ffff");
    applyColorToMaterial(this.pointCloud?.material, this.pointsColor);
  }

  setRedPointsColor({ value = "#ff0000" } = {}) {
    this.redPointsColor = normalizeHex(value, "#ff0000");
    applyColorToMaterial(this.redPointCloud?.material, this.redPointsColor);
  }

  setLinesColor({ value = "#00ffff" } = {}) {
    this.linesColor = normalizeHex(value, "#00ffff");
    this.linesGroup.children.forEach((child) => {
      applyColorToMaterial(child.material, this.linesColor);
    });
  }

  setPulseColor({ value = "#ffffff" } = {}) {
    this.pulseColor = normalizeHex(value, "#ffffff");
  }

  setPointsSize({ value = 0.05 } = {}) {
    this.pointsSize = Number(value) ?? 0.05;
    if (this.pointCloud?.material) this.pointCloud.material.size = this.pointsSize;
  }

  setRedPointsSize({ value = 0.06 } = {}) {
    this.redPointsSize = Number(value) ?? 0.06;
    if (this.redPointCloud?.material) this.redPointCloud.material.size = this.redPointsSize;
  }

  setLinesOpacity({ value = 0.2 } = {}) {
    this.linesOpacity = Number(value) ?? 0.2;
    this.linesGroup.children.forEach((child) => {
      if (child.material) child.material.opacity = this.linesOpacity;
    });
  }

  setLinesThickness({ value = 1 } = {}) {
    this.linesThickness = Number(value) ?? 1;
    this.linesGroup.children.forEach((child) => {
      if (child.material) child.material.linewidth = this.linesThickness;
    });
  }

  rebuildPoints() {
    if (this.pointCloud) {
      this.pointCloud.geometry.dispose();
      this.pointCloud.material.dispose();
      this.customGroup.remove(this.pointCloud);
    }
    if (this.redPointCloud) {
      this.redPointCloud.geometry.dispose();
      this.redPointCloud.material.dispose();
      this.customGroup.remove(this.redPointCloud);
    }
    clearThreeGroup(this.linesGroup);
    this.points = [];
    this.redPoints = [];
    this.createPoints();
    this.createRedPoints();
    this.createLines();
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

    this.activeSpheres.forEach((sphere) => {
      this.scene.remove(sphere);
      sphere.geometry.dispose();
      sphere.material.dispose();
    });
    this.activeSpheres = [];

    if (this.pointCloud) {
      this.pointCloud.geometry.dispose();
      this.pointCloud.material.dispose();
    }
    if (this.redPointCloud) {
      this.redPointCloud.geometry.dispose();
      this.redPointCloud.material.dispose();
    }
    clearThreeGroup(this.linesGroup);

    if (this.customGroup) {
      this.scene.remove(this.customGroup);
    }

    this.points = [];
    this.redPoints = [];
    super.destroy();
  }
}

export default AudioLowEarthPoint;
