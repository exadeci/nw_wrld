/*
@nwWrld name: AudioHolographicKoiSwarm
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

class AudioHolographicKoiSwarm extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "koiCount", defaultVal: 20, type: "number", min: 5, max: 50 },
        { name: "trailLength", defaultVal: 15, type: "number", min: 5, max: 30 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setKoiCount",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 20, type: "number", min: 5, max: 50 }],
    },
    {
      name: "setTrailLength",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 15, type: "number", min: 5, max: 30 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = AudioHolographicKoiSwarm.name;
    this.customGroup = new THREE.Group();
    this.koi = [];
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.koiCount = 20;
    this.trailLength = 15;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.time = 0;
    this.init();
  }

  async start({ sensitivity = 2.0, koiCount = 20, trailLength = 15 } = {}) {
    const sensVal = Number(sensitivity);
    const countVal = Number(koiCount);
    const trailVal = Number(trailLength);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.koiCount = Math.max(5, Math.min(50, Number.isFinite(countVal) ? Math.floor(countVal) : 20));
    this.trailLength = Math.max(5, Math.min(30, Number.isFinite(trailVal) ? Math.floor(trailVal) : 15));
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
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;

    this.setupLighting();
    this.createKoi();
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.audioAnimate.bind(this));
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambient);
  }

  createKoi() {
    for (let i = 0; i < this.koiCount; i++) {
      const koi = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        ),
        trail: [],
        hue: Math.random(),
        size: 0.3 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      };
      this.koi.push(koi);
    }
  }

  audioAnimate() {
    if (this.destroyed) return;

    this.time += 0.016;

    if (this.audioReactive && this.analyzer && this.audioReady) {
      this.volume = this.analyzer.getVolume() * this.sensitivity;
      this.bass = this.analyzer.getBass() * this.sensitivity;
      this.mid = this.analyzer.getMid() * this.sensitivity;
      this.treble = this.analyzer.getTreble() * this.sensitivity;
    } else if (!this.audioReactive) {
      this.volume = 0.3 * this.sensitivity;
      this.bass = 0.2 * this.sensitivity;
      this.mid = 0.3 * this.sensitivity;
      this.treble = 0.2 * this.sensitivity;
    }

    this.updateKoi();
    this.renderKoi();
  }

  updateKoi() {
    this.koi.forEach((koi) => {
      koi.phase += 0.02 + this.mid * 0.05;

      const arpeggioInfluence = Math.sin(koi.phase) * this.mid * 0.5;
      koi.velocity.x += (Math.random() - 0.5) * 0.01 + arpeggioInfluence * 0.1;
      koi.velocity.y += (Math.random() - 0.5) * 0.01;
      koi.velocity.z += (Math.random() - 0.5) * 0.01 + arpeggioInfluence * 0.1;

      koi.velocity.multiplyScalar(0.95);

      const speed = 0.1 + this.mid * 0.2;
      koi.position.add(koi.velocity.clone().multiplyScalar(speed));

      if (koi.position.x > 5) koi.position.x = -5;
      if (koi.position.x < -5) koi.position.x = 5;
      if (koi.position.y > 5) koi.position.y = -5;
      if (koi.position.y < -5) koi.position.y = 5;
      if (koi.position.z > 5) koi.position.z = -5;
      if (koi.position.z < -5) koi.position.z = 5;

      koi.trail.push(koi.position.clone());
      if (koi.trail.length > this.trailLength) {
        koi.trail.shift();
      }
    });
  }

  renderKoi() {
    this.koi.forEach((koi) => {
      if (koi.trail.length < 2) return;

      const trailGeometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];

      koi.trail.forEach((point, i) => {
        positions.push(point.x, point.y, point.z);
        const alpha = i / koi.trail.length;
        const hue = (koi.hue + this.time * 0.1 + this.volume * 0.2) % 1;
        const color = new THREE.Color().setHSL(hue, 1, 0.5 + alpha * 0.3);
        colors.push(color.r, color.g, color.b);
      });

      trailGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      trailGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

      const trailMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        linewidth: 3,
        blending: THREE.AdditiveBlending,
      });

      const trail = new THREE.Line(trailGeometry, trailMaterial);
      this.customGroup.add(trail);

      setTimeout(() => {
        if (trail.parent) {
          trail.parent.remove(trail);
          trail.geometry.dispose();
          trail.material.dispose();
        }
      }, 100);

      const bodyGeometry = new THREE.SphereGeometry(koi.size, 32, 32);
      const hue = (koi.hue + this.time * 0.1 + this.volume * 0.2) % 1;
      const bodyColor = new THREE.Color().setHSL(hue, 0.8, 0.6);
      const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: bodyColor,
        transparent: true,
        opacity: 0.8,
        emissive: bodyColor,
        emissiveIntensity: 1.0,
        metalness: 0.3,
        roughness: 0.4,
        transmission: 0.7,
        thickness: 0.5,
        side: THREE.DoubleSide,
      });

      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.copy(koi.position);
      this.customGroup.add(body);

      setTimeout(() => {
        if (body.parent) {
          body.parent.remove(body);
          body.geometry.dispose();
          body.material.dispose();
        }
      }, 100);
    });
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setKoiCount({ value = 20 } = {}) {
    const val = Number(value);
    this.koiCount = Math.max(5, Math.min(50, Number.isFinite(val) ? Math.floor(val) : 20));
    this.koi = [];
    this.createKoi();
  }

  setTrailLength({ value = 15 } = {}) {
    const val = Number(value);
    this.trailLength = Math.max(5, Math.min(30, Number.isFinite(val) ? Math.floor(val) : 15));
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

    if (this.customGroup) {
      this.customGroup.clear();
      this.scene.remove(this.customGroup);
    }

    this.koi = [];
    super.destroy();
  }
}

export default AudioHolographicKoiSwarm;
