/*
@nwWrld name: AudioCrystalCavePulse
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, Noise, AudioAnalyzer
*/

class AudioCrystalCavePulse extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "crystalCount", defaultVal: 50, type: "number", min: 20, max: 100 },
        { name: "dustIntensity", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setCrystalCount",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 50, type: "number", min: 20, max: 100 }],
    },
    {
      name: "setDustIntensity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE || !Noise) return;

    this.name = AudioCrystalCavePulse.name;
    this.customGroup = new THREE.Group();
    this.crystals = [];
    this.dust = null;
    this.noise = new Noise(Math.random());
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.crystalCount = 50;
    this.dustIntensity = 1.0;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.time = 0;
    this.init();
  }

  async start({ sensitivity = 2.0, crystalCount = 50, dustIntensity = 1.0 } = {}) {
    const sensVal = Number(sensitivity);
    const countVal = Number(crystalCount);
    const dustVal = Number(dustIntensity);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.crystalCount = Math.max(20, Math.min(100, Number.isFinite(countVal) ? Math.floor(countVal) : 50));
    this.dustIntensity = Math.max(0.1, Math.min(3.0, Number.isFinite(dustVal) ? dustVal : 1.0));
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }

  init() {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;

    this.setupLighting();
    this.createCrystals();
    this.createDust();
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.audioAnimate.bind(this));
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambient);

    const pointLight = new THREE.PointLight(0xffffff, 1, 20);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
    this.pointLight = pointLight;
  }

  createCrystals() {
    for (let i = 0; i < this.crystalCount; i++) {
      const size = 0.3 + Math.random() * 0.5;
      const geometry = new THREE.OctahedronGeometry(size, 3);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.2,
        roughness: 0.05,
        transmission: 0.95,
        thickness: 0.8,
        transparent: true,
        opacity: 0.85,
        envMapIntensity: 2.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide,
      });

      const crystal = new THREE.Mesh(geometry, material);
      crystal.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );

      crystal.userData = {
        baseSize: size,
        basePosition: crystal.position.clone(),
        phase: Math.random() * Math.PI * 2,
      };

      this.customGroup.add(crystal);
      this.crystals.push(crystal);
    }
  }

  createDust() {
    const dustCount = 300;
    const positions = [];
    const colors = [];

    for (let i = 0; i < dustCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      const color = new THREE.Color().setHSL(0.6, 0.5, 0.7);
      colors.push(color.r, color.g, color.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    this.dust = new THREE.Points(geometry, material);
    this.customGroup.add(this.dust);
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

    this.updateCrystals();
    this.updateDust();
    this.updateCamera();
  }

  updateCrystals() {
    this.crystals.forEach((crystal) => {
      const pulse = 1 + this.bass * 0.5;
      crystal.scale.setScalar(crystal.userData.baseSize * pulse);

      const hue = (this.time * 0.1 + crystal.userData.phase) % 1;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.5 + this.bass * 0.3);
      crystal.material.color.copy(color);
      crystal.material.emissive = color.clone().multiplyScalar(this.bass * 0.5);

      crystal.rotation.x += 0.01;
      crystal.rotation.y += 0.01;
      crystal.rotation.z += 0.01;

      const shimmer = Math.sin(this.time * 2 + crystal.userData.phase) * 0.1;
      crystal.position.y = crystal.userData.basePosition.y + shimmer;
    });
  }

  updateDust() {
    if (this.dust) {
      const positions = this.dust.geometry.attributes.position;
      const colors = this.dust.geometry.attributes.color;

      for (let i = 0; i < positions.count; i++) {
        const i3 = i * 3;
        positions.array[i3 + 1] += 0.01 * (1 + this.treble * 0.5);
        if (positions.array[i3 + 1] > 10) {
          positions.array[i3 + 1] = -10;
          positions.array[i3] = (Math.random() - 0.5) * 20;
          positions.array[i3 + 2] = (Math.random() - 0.5) * 20;
        }

        const brightness = 0.5 + this.treble * 0.5 * this.dustIntensity;
        colors.array[i3] *= brightness;
        colors.array[i3 + 1] *= brightness;
        colors.array[i3 + 2] *= brightness;
      }

      positions.needsUpdate = true;
      colors.needsUpdate = true;
      this.dust.material.opacity = 0.4 + this.treble * 0.4 * this.dustIntensity;
    }
  }

  updateCamera() {
    const pushSpeed = 0.01 + this.bass * 0.02;
    this.camera.position.z += pushSpeed;
    if (this.camera.position.z > 8) {
      this.camera.position.z = 5;
    }
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setCrystalCount({ value = 50 } = {}) {
    const val = Number(value);
    this.crystalCount = Math.max(20, Math.min(100, Number.isFinite(val) ? Math.floor(val) : 50));
    this.crystals.forEach((crystal) => {
      this.customGroup.remove(crystal);
      crystal.geometry.dispose();
      crystal.material.dispose();
    });
    this.crystals = [];
    this.createCrystals();
  }

  setDustIntensity({ value = 1.0 } = {}) {
    const val = Number(value);
    this.dustIntensity = Math.max(0.1, Math.min(3.0, Number.isFinite(val) ? val : 1.0));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  destroy() {
    this.destroyed = true;


    if (this.crystals) {
      this.crystals.forEach((crystal) => {
        crystal.geometry.dispose();
        crystal.material.dispose();
        this.customGroup.remove(crystal);
      });
      this.crystals = [];
    }

    if (this.dust) {
      this.dust.geometry.dispose();
      this.dust.material.dispose();
      this.customGroup.remove(this.dust);
    }

    if (this.pointLight) {
      this.scene.remove(this.pointLight);
    }

    if (this.customGroup) {
      this.scene.remove(this.customGroup);
    }

    super.destroy();
  }
}

export default AudioCrystalCavePulse;
