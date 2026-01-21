/*
@nwWrld name: AudioTunnel
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

class AudioTunnel extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "baseHue", defaultVal: 200, type: "number", min: 0, max: 360 },
        { name: "tunnelSpeed", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 },
        { name: "segments", defaultVal: 16, type: "number", min: 8, max: 32 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 200, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setTunnelSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 }],
    },
    {
      name: "setSegments",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 16, type: "number", min: 8, max: 32 }],
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

    this.name = AudioTunnel.name;
    this.customGroup = new THREE.Group();
    this.tunnelRings = [];
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.baseHue = 200;
    this.tunnelSpeed = 1.0;
    this.segments = 16;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.tunnelPosition = 0;
    this.init();
  }

  async start({ sensitivity = 2.0, baseHue = 200, tunnelSpeed = 1.0, segments = 16 } = {}) {
    const sensVal = Number(sensitivity);
    const hueVal = Number(baseHue);
    const speedVal = Number(tunnelSpeed);
    const segVal = Number(segments);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 200));
    this.tunnelSpeed = Math.max(0.1, Math.min(3.0, Number.isFinite(speedVal) ? speedVal : 1.0));
    this.segments = Math.max(8, Math.min(32, Number.isFinite(segVal) ? Math.floor(segVal) : 16));
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
    this.createTunnel();
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.audioAnimate.bind(this));
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambient);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
    this.pointLight = pointLight;
  }

  createTunnel() {
    const ringCount = 50;
    const maxRadius = 5;
    const minRadius = 0.5;

    for (let i = 0; i < ringCount; i++) {
      const z = -i * 0.5;
      const radius = minRadius + ((maxRadius - minRadius) * i) / ringCount;
      const geometry = new THREE.RingGeometry(radius * 0.8, radius, this.segments);
      const hue = (this.baseHue + (i / ringCount) * 60) % 360;
      const color = new THREE.Color().setHSL(hue / 360, 1, 0.5);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });

      const ring = new THREE.Mesh(geometry, material);
      ring.position.z = z;
      ring.userData = {
        baseZ: z,
        baseRadius: radius,
        index: i,
      };
      this.customGroup.add(ring);
      this.tunnelRings.push(ring);
    }
  }

  audioAnimate() {
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

    const speed = this.tunnelSpeed * (1 + this.volume * 0.5);
    this.tunnelPosition += speed * 0.02;

    this.tunnelRings.forEach((ring, i) => {
      const baseZ = ring.userData.baseZ;
      ring.position.z = baseZ + this.tunnelPosition;

      if (ring.position.z > 2) {
        ring.position.z -= 25;
        this.tunnelPosition -= 25;
      }

      const distance = Math.abs(ring.position.z);
      const scale = 1 + this.bass * 0.3;
      ring.scale.setScalar(scale);

      const hue = (this.baseHue + (i / this.tunnelRings.length) * 120 + this.volume * 50) % 360;
      const color = new THREE.Color().setHSL(hue / 360, 1, 0.5 + this.mid * 0.3);
      ring.material.color.copy(color);
      ring.material.opacity = 0.4 + this.treble * 0.4;

      ring.rotation.z += (0.01 + this.volume * 0.02) * (i % 2 === 0 ? 1 : -1);
    });

    if (this.pointLight) {
      const lightHue = (this.baseHue + this.volume * 100) % 360;
      const lightColor = new THREE.Color().setHSL(lightHue / 360, 1, 0.5);
      this.pointLight.color.copy(lightColor);
      this.pointLight.intensity = 0.5 + this.bass * 1.5;
    }

    this.customGroup.rotation.y += 0.002 + this.volume * 0.01;
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setBaseHue({ value = 200 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 200));
  }

  setTunnelSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.tunnelSpeed = Math.max(0.1, Math.min(3.0, Number.isFinite(val) ? val : 1.0));
  }

  setSegments({ value = 16 } = {}) {
    const val = Number(value);
    this.segments = Math.max(8, Math.min(32, Number.isFinite(val) ? Math.floor(val) : 16));
    if (this.tunnelRings.length > 0) {
      this.tunnelRings.forEach((ring) => {
        this.customGroup.remove(ring);
        ring.geometry.dispose();
        ring.material.dispose();
      });
      this.tunnelRings = [];
      this.createTunnel();
    }
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

    if (this.pointLight) {
      this.scene.remove(this.pointLight);
    }

    if (this.tunnelRings) {
      this.tunnelRings.forEach((ring) => {
        ring.geometry.dispose();
        ring.material.dispose();
        this.customGroup.remove(ring);
      });
      this.tunnelRings = [];
    }

    if (this.customGroup) {
      this.scene.remove(this.customGroup);
    }

    super.destroy();
  }
}

export default AudioTunnel;
