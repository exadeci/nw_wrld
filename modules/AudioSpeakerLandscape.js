/*
@nwWrld name: AudioSpeakerLandscape
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, createNoise2D, AudioAnalyzer
*/

class AudioSpeakerLandscape extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "resolution", defaultVal: 50, type: "number", min: 20, max: 100 },
        { name: "baseHue", defaultVal: 180, type: "number", min: 0, max: 360 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setResolution",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 50, type: "number", min: 20, max: 100 }],
    },
    {
      name: "setBaseHue",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 180, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#00BFFF", type: "color" }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE || !createNoise2D) return;

    this.name = AudioSpeakerLandscape.name;
    this.customGroup = new THREE.Group();
    this.landscape = null;
    this.noise = createNoise2D();
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.resolution = 50;
    this.baseHue = 180;
    this.audioReactive = true;
    this.customColor = null;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.time = 0;
    this.originalPositions = null;
    this.init();
  }

  async start({ sensitivity = 2.0, resolution = 50, baseHue = 180 } = {}) {
    const sensVal = Number(sensitivity);
    const resVal = Number(resolution);
    const hueVal = Number(baseHue);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.resolution = Math.max(20, Math.min(100, Number.isFinite(resVal) ? Math.floor(resVal) : 50));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 180));
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
    this.createLandscape();
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.audioAnimate.bind(this));
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 5);
    this.scene.add(mainLight);

    const neonLight = new THREE.PointLight(0x00ffff, 2, 20);
    neonLight.position.set(0, 5, 0);
    this.scene.add(neonLight);
    this.neonLight = neonLight;
  }

  createLandscape() {
    const geometry = new THREE.PlaneGeometry(10, 10, this.resolution * 2, this.resolution * 2);
    geometry.rotateX(-Math.PI / 2);
    this.originalPositions = geometry.attributes.position.array.slice();

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x000000,
      emissiveIntensity: 0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide,
    });

    this.landscape = new THREE.Mesh(geometry, material);
    this.customGroup.add(this.landscape);
  }

  audioAnimate() {
    if (this.destroyed) return;

    this.time += 0.016;

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

    this.deformLandscape();
    this.updateColors();
    this.updateCamera();
  }

  deformLandscape() {
    if (!this.landscape || !this.originalPositions) return;

    const positions = this.landscape.geometry.attributes.position;
    const bassDisplace = this.bass * 0.5;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      const ox = this.originalPositions[i3];
      const oy = this.originalPositions[i3 + 1];
      const oz = this.originalPositions[i3 + 2];

      const noise1 = this.noise(ox * 0.5 + this.time * 0.1, oz * 0.5 + this.time * 0.1);
      const noise2 = this.noise(ox * 2 + this.time * 0.2, oz * 2 + this.time * 0.2);

      const ripple = Math.sin(Math.sqrt(ox * ox + oz * oz) * 2 - this.time * 2) * bassDisplace;
      const dune = noise1 * 0.3 + noise2 * 0.1;

      positions.array[i3 + 1] = oy + ripple + dune;
    }

    positions.needsUpdate = true;
    this.landscape.geometry.computeVertexNormals();
  }

  updateColors() {
    if (!this.landscape) return;

    let color;
    if (this.customColor) {
      color = this.customColor.clone();
      const currentBrightness = (color.r + color.g + color.b) / 3;
      const targetBrightness = 0.3 + this.bass * 0.2;
      if (currentBrightness > 0) {
        color.multiplyScalar(targetBrightness / currentBrightness);
      }
    } else {
      const hue = (this.baseHue + this.volume * 30) % 360;
      color = new THREE.Color().setHSL(hue / 360, 0.8, 0.3 + this.bass * 0.2);
    }
    
    this.landscape.material.color.copy(color);
    this.landscape.material.emissive = color.clone().multiplyScalar(this.bass * 0.5);

    if (this.neonLight) {
      let lightColor;
      if (this.customColor) {
        lightColor = this.customColor.clone();
        lightColor.lerp(new THREE.Color(0xffffff), 0.3);
      } else {
        const lightHue = (this.baseHue + 60 + this.treble * 50) % 360;
        lightColor = new THREE.Color().setHSL(lightHue / 360, 1, 0.5);
      }
      this.neonLight.color.copy(lightColor);
      this.neonLight.intensity = 1 + this.treble * 2;
    }
  }

  updateCamera() {
    const distance = 8;
    const angle = this.time * 0.05;
    this.camera.position.x = Math.cos(angle) * distance;
    this.camera.position.z = Math.sin(angle) * distance;
    this.camera.position.y = 5;
    this.camera.lookAt(0, 0, 0);
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setResolution({ value = 50 } = {}) {
    const val = Number(value);
    this.resolution = Math.max(20, Math.min(100, Number.isFinite(val) ? Math.floor(val) : 50));
    if (this.landscape) {
      this.customGroup.remove(this.landscape);
      this.landscape.geometry.dispose();
      this.landscape.material.dispose();
    }
    this.createLandscape();
  }

  setBaseHue({ value = 180 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 180));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setColor({ color = "#00BFFF" } = {}) {
    if (color) {
      try {
        this.customColor = new THREE.Color(color);
      } catch (e) {
        console.warn(`[AudioSpeakerLandscape] Invalid color: ${color}`);
        this.customColor = null;
      }
    } else {
      this.customColor = null;
    }
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

    if (this.landscape) {
      this.landscape.geometry.dispose();
      this.landscape.material.dispose();
      this.customGroup.remove(this.landscape);
    }

    if (this.neonLight) {
      this.scene.remove(this.neonLight);
    }

    if (this.customGroup) {
      this.scene.remove(this.customGroup);
    }

    this.originalPositions = null;
    super.destroy();
  }
}

export default AudioSpeakerLandscape;
