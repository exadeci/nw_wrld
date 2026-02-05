/*
@nwWrld name: Audio Neon Vortex
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

class AudioNeonVortex extends BaseThreeJsModule {
  static category = "Audio";
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        {
          name: "direction",
          defaultVal: "forward",
          type: "select",
          values: ["forward", "backward"],
        },
        {
          name: "speed",
          defaultVal: 0.15,
          type: "number",
          min: 0.02,
          max: 1.0,
          step: 0.01,
        },
        {
          name: "audioReactive",
          defaultVal: true,
          type: "boolean",
        },
        { name: "insideColor", defaultVal: "#00ffff", type: "color" },
        { name: "outsideColor", defaultVal: "#ff00ff", type: "color" },
      ],
    },
    {
      name: "setDirection",
      executeOnLoad: false,
      options: [
        {
          name: "value",
          defaultVal: "forward",
          type: "select",
          values: ["forward", "backward"],
        },
      ],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [
        { name: "value", defaultVal: 0.15, type: "number", min: 0.02, max: 1.0, step: 0.01 },
      ],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setInsideColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#00ffff", type: "color" }],
    },
    {
      name: "setOutsideColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#ff00ff", type: "color" }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = AudioNeonVortex.name;
    this.starField = null;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.direction = "forward";
    this.speed = 0.15;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;

    this.pointsCount = 4000;
    this.tunnelRadius = 4;
    this.tunnelLength = 100;
    this.directionSign = 1;
    this.insideColor = "#00ffff";
    this.outsideColor = "#ff00ff";

    this.init();
  }

  normalizeHex(val, fallback) {
    if (val == null || String(val).trim() === "") return fallback;
    const s = String(val).trim().replace(/^#/, "");
    return s ? "#" + s : fallback;
  }

  async start({ direction = "forward", speed = 0.15, audioReactive = true, insideColor = "#00ffff", outsideColor = "#ff00ff" } = {}) {
    this.direction = direction === "backward" ? "backward" : "forward";
    this.directionSign = this.direction === "forward" ? 1 : -1;
    const speedVal = Number(speed);
    this.speed = Math.max(0.02, Math.min(1.0, Number.isFinite(speedVal) ? speedVal : 0.15));
    this.audioReactive = Boolean(audioReactive);
    this.insideColor = this.normalizeHex(insideColor, "#00ffff");
    this.outsideColor = this.normalizeHex(outsideColor, "#ff00ff");
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

  setDirection({ value = "forward" } = {}) {
    this.direction = value === "backward" ? "backward" : "forward";
    this.directionSign = this.direction === "forward" ? 1 : -1;
  }

  setSpeed({ value = 0.15 } = {}) {
    const val = Number(value);
    this.speed = Math.max(0.02, Math.min(1.0, Number.isFinite(val) ? val : 0.15));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setInsideColor({ value = "#00ffff" } = {}) {
    this.insideColor = this.normalizeHex(value, "#00ffff");
    this.updateVortexColors();
  }

  setOutsideColor({ value = "#ff00ff" } = {}) {
    this.outsideColor = this.normalizeHex(value, "#ff00ff");
    this.updateVortexColors();
  }

  updateVortexColors() {
    if (!this.starField?.geometry?.attributes?.color) return;
    const color1 = new THREE.Color(this.insideColor);
    const color2 = new THREE.Color(this.outsideColor);
    const positions = this.starField.geometry.attributes.position.array;
    const colors = this.starField.geometry.attributes.color.array;
    for (let i = 0; i < this.pointsCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const angle = Math.atan2(y, x);
      const mixedColor = color1.clone().lerp(color2, (Math.sin(angle * 2) + 1) / 2);
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }
    this.starField.geometry.attributes.color.needsUpdate = true;
  }

  init() {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;

    this.scene.fog = new THREE.FogExp2(0x000000, 0.03);
    this.createTunnel();
    this.setModel(this.starField);
    this.setCustomAnimate(this.vortexAnimate.bind(this));
  }

  createTunnel() {
    const pointsGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(this.pointsCount * 3);
    const colorsArray = new Float32Array(this.pointsCount * 3);
    const sizesArray = new Float32Array(this.pointsCount);

    const color1 = new THREE.Color(this.insideColor);
    const color2 = new THREE.Color(this.outsideColor);

    for (let i = 0; i < this.pointsCount; i++) {
      const i3 = i * 3;
      const angle = i * 0.1 + Math.random() * 0.5;
      const z = (i / this.pointsCount) * this.tunnelLength - this.tunnelLength / 2;
      const r = this.tunnelRadius + (Math.random() - 0.5) * 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      posArray[i3] = x;
      posArray[i3 + 1] = y;
      posArray[i3 + 2] = z;

      const mixedColor = color1.clone().lerp(color2, (Math.sin(angle * 2) + 1) / 2);
      colorsArray[i3] = mixedColor.r;
      colorsArray[i3 + 1] = mixedColor.g;
      colorsArray[i3 + 2] = mixedColor.b;

      sizesArray[i] = Math.random() * 2.0;
    }

    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    pointsGeometry.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));
    pointsGeometry.setAttribute("size", new THREE.BufferAttribute(sizesArray, 1));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.8,
    });

    this.starField = new THREE.Points(pointsGeometry, particlesMaterial);
  }

  vortexAnimate() {
    if (this.destroyed || !this.starField) return;

    if (this.audioReactive && this.analyzer && this.audioReady) {
      this.volume = this.analyzer.getVolume();
      this.bass = this.analyzer.getBass();
      this.mid = this.analyzer.getMid();
      this.treble = this.analyzer.getTreble();
    } else {
      this.volume = 0.2;
      this.bass = 0.15;
      this.mid = 0.2;
      this.treble = 0.15;
    }

    const baseSpeed = this.speed * this.directionSign;
    const speedBoost = 1 + this.volume * 0.8;
    const moveSpeed = baseSpeed * speedBoost;

    const rotSpeed = 0.01 + this.bass * 0.02;
    const rotDir = this.directionSign;

    const positions = this.starField.geometry.attributes.position.array;
    const halfLength = this.tunnelLength / 2;

    for (let i = 0; i < this.pointsCount; i++) {
      const i3 = i * 3;
      positions[i3 + 2] += moveSpeed;

      if (this.directionSign > 0) {
        if (positions[i3 + 2] > halfLength) {
          positions[i3 + 2] = -halfLength;
        }
      } else {
        if (positions[i3 + 2] < -halfLength) {
          positions[i3 + 2] = halfLength;
        }
      }

      const x = positions[i3];
      const y = positions[i3 + 1];
      const cosR = Math.cos(rotSpeed * rotDir);
      const sinR = Math.sin(rotSpeed * rotDir);
      positions[i3] = x * cosR - y * sinR;
      positions[i3 + 1] = x * sinR + y * cosR;
    }
    this.starField.geometry.attributes.position.needsUpdate = true;

    this.starField.rotation.z += 0.2 * (1 + this.mid * 0.5) * (1 / 60);
    this.markNeedsRender();
  }

  destroy() {
    this.destroyed = true;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.analyzer) {
      if (typeof this.analyzer.destroy === "function") this.analyzer.destroy();
      this.analyzer = null;
    }
    if (this.starField) {
      if (this.starField.geometry) this.starField.geometry.dispose();
      if (this.starField.material) this.starField.material.dispose();
      if (this.scene) this.scene.remove(this.starField);
      this.starField = null;
    }
    super.destroy();
  }
}

export default AudioNeonVortex;
