/*
@nwWrld name: AudioLiquid
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, Noise, AudioAnalyzer
*/

class AudioLiquid extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "viscosity", defaultVal: 0.5, type: "number", min: 0.1, max: 1.0 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setViscosity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.5, type: "number", min: 0.1, max: 1.0 }],
    },
    {
      name: "setColorMode",
      executeOnLoad: true,
      options: [{ name: "value", defaultVal: "rainbow", type: "select", values: ["rainbow", "mercury", "lava", "ocean", "toxic"] }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#00AAFF", type: "color" }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE || !Noise) return;

    this.name = AudioLiquid.name;
    this.customGroup = new THREE.Group();
    this.liquidMesh = null;
    this.innerMesh = null;
    this.noise = new Noise(Math.random());
    this.originalPositions = null;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;

    this.sensitivity = 2.0;
    this.viscosity = 0.5;
    this.colorMode = "rainbow";
    this.audioReactive = true;
    this.customColor = null;

    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.smoothVolume = 0;
    this.smoothBass = 0;
    this.smoothMid = 0;
    this.smoothTreble = 0;

    this.time = 0;
    this.hue = 0;

    this.init();
  }

  async start({ sensitivity = 2.0, viscosity = 0.5 } = {}) {
    const sensVal = Number(sensitivity);
    const viscVal = Number(viscosity);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.viscosity = Math.max(0.1, Math.min(1.0, Number.isFinite(viscVal) ? viscVal : 0.5));
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }


  init() {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;

    this.setupLighting();
    this.createLiquid();
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.audioAnimate.bind(this));
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 5, 5);
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.8);
    fillLight.position.set(-5, -2, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xff4400, 1, 20);
    rimLight.position.set(0, 5, -5);
    this.scene.add(rimLight);

    this.lights = [ambient, mainLight, fillLight, rimLight];
  }

  createLiquid() {
    const geometry = new THREE.IcosahedronGeometry(2, 64);
    this.originalPositions = geometry.attributes.position.array.slice();

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x00aaff,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 1,
      envMapIntensity: 1,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });

    this.liquidMesh = new THREE.Mesh(geometry, material);
    this.liquidMesh.castShadow = true;
    this.liquidMesh.receiveShadow = true;
    this.customGroup.add(this.liquidMesh);

    const innerGeometry = new THREE.IcosahedronGeometry(1.2, 32);
    const innerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1,
      roughness: 0,
      transparent: true,
      opacity: 0.5,
      side: THREE.BackSide,
    });
    this.innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    this.customGroup.add(this.innerMesh);

    const glowGeometry = new THREE.IcosahedronGeometry(2.3, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.customGroup.add(this.glowMesh);
  }

  getColorForMode() {
    if (this.customColor) {
      const mainColor = this.customColor.clone();
      const currentBrightness = (mainColor.r + mainColor.g + mainColor.b) / 3;
      const targetBrightness = 0.4 + this.smoothVolume * 0.3;
      if (currentBrightness > 0) {
        mainColor.multiplyScalar(targetBrightness / currentBrightness);
      }
      
      const glowColor = this.customColor.clone();
      glowColor.lerp(new THREE.Color(0xffffff), 0.2);
      
      return {
        main: mainColor,
        glow: glowColor,
      };
    }

    const t = this.time * 0.5;
    switch (this.colorMode) {
      case "mercury":
        return {
          main: new THREE.Color().setHSL(0, 0, 0.7 + this.smoothVolume * 0.3),
          glow: new THREE.Color(0xcccccc),
        };
      case "lava":
        const lavaHue = 0.02 + Math.sin(t) * 0.02;
        return {
          main: new THREE.Color().setHSL(lavaHue, 1, 0.4 + this.smoothBass * 0.3),
          glow: new THREE.Color(0xff4400),
        };
      case "ocean":
        const oceanHue = 0.55 + Math.sin(t * 0.5) * 0.05;
        return {
          main: new THREE.Color().setHSL(oceanHue, 0.8, 0.4 + this.smoothMid * 0.2),
          glow: new THREE.Color(0x0066ff),
        };
      case "toxic":
        const toxicHue = 0.25 + this.smoothTreble * 0.1;
        return {
          main: new THREE.Color().setHSL(toxicHue, 1, 0.5),
          glow: new THREE.Color(0x00ff00),
        };
      case "rainbow":
      default:
        this.hue = (this.hue + 0.002 + this.smoothVolume * 0.01) % 1;
        return {
          main: new THREE.Color().setHSL(this.hue, 0.8, 0.5),
          glow: new THREE.Color().setHSL((this.hue + 0.5) % 1, 1, 0.5),
        };
    }
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

    const smoothing = 1 - this.viscosity * 0.9;
    this.smoothVolume += (this.volume - this.smoothVolume) * smoothing;
    this.smoothBass += (this.bass - this.smoothBass) * smoothing;
    this.smoothMid += (this.mid - this.smoothMid) * smoothing;
    this.smoothTreble += (this.treble - this.smoothTreble) * smoothing;

    this.deformLiquid();
    this.updateColors();
    this.updateRotation();
  }

  deformLiquid() {
    if (!this.liquidMesh || !this.originalPositions) return;

    const positions = this.liquidMesh.geometry.attributes.position;
    const time = this.time;

    const bassDisplace = 0.3 + this.smoothBass * 0.8;
    const midDisplace = 0.2 + this.smoothMid * 0.5;
    const trebleDisplace = 0.1 + this.smoothTreble * 0.3;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      const ox = this.originalPositions[i3];
      const oy = this.originalPositions[i3 + 1];
      const oz = this.originalPositions[i3 + 2];

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / len;
      const ny = oy / len;
      const nz = oz / len;

      const noise1 = this.noise.simplex3(
        nx * 2 + time * 0.5,
        ny * 2 + time * 0.3,
        nz * 2 + time * 0.4
      );

      const noise2 = this.noise.simplex3(
        nx * 4 + time * 0.8,
        ny * 4 + time * 0.6,
        nz * 4 + time * 0.7
      );

      const noise3 = this.noise.simplex3(
        nx * 8 + time * 1.2,
        ny * 8 + time * 1.0,
        nz * 8 + time * 1.1
      );

      const displacement =
        noise1 * bassDisplace +
        noise2 * midDisplace * 0.5 +
        noise3 * trebleDisplace * 0.25;

      const scale = 1 + displacement;

      positions.array[i3] = ox * scale;
      positions.array[i3 + 1] = oy * scale;
      positions.array[i3 + 2] = oz * scale;
    }

    positions.needsUpdate = true;
    this.liquidMesh.geometry.computeVertexNormals();

    if (this.innerMesh) {
      const innerScale = 0.6 + this.smoothBass * 0.3;
      this.innerMesh.scale.setScalar(innerScale);
    }

    if (this.glowMesh) {
      const glowScale = 1.15 + this.smoothVolume * 0.2;
      this.glowMesh.scale.setScalar(glowScale);
      this.glowMesh.material.opacity = 0.05 + this.smoothVolume * 0.15;
    }
  }

  updateColors() {
    const colors = this.getColorForMode();

    if (this.liquidMesh && this.liquidMesh.material) {
      this.liquidMesh.material.color.copy(colors.main);
      this.liquidMesh.material.emissive = colors.main.clone().multiplyScalar(this.smoothVolume * 0.3);
    }

    if (this.glowMesh && this.glowMesh.material) {
      this.glowMesh.material.color.copy(colors.glow);
    }

    if (this.innerMesh && this.innerMesh.material) {
      this.innerMesh.material.color.copy(colors.glow);
    }
  }

  updateRotation() {
    const rotSpeed = 0.003 + this.smoothVolume * 0.02;
    this.customGroup.rotation.y += rotSpeed;
    this.customGroup.rotation.x += rotSpeed * 0.3;

    if (this.innerMesh) {
      this.innerMesh.rotation.y -= rotSpeed * 2;
      this.innerMesh.rotation.x -= rotSpeed;
    }
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setViscosity({ value = 0.5 } = {}) {
    const val = Number(value);
    this.viscosity = Math.max(0.1, Math.min(1.0, Number.isFinite(val) ? val : 0.5));
  }

  setColorMode({ value = "rainbow" } = {}) {
    const validModes = ["rainbow", "mercury", "lava", "ocean", "toxic"];
    this.colorMode = validModes.includes(value) ? value : "rainbow";
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setColor({ color = "#00AAFF" } = {}) {
    if (color) {
      try {
        this.customColor = new THREE.Color(color);
      } catch (e) {
        console.warn(`[AudioLiquid] Invalid color: ${color}`);
        this.customColor = null;
      }
    } else {
      this.customColor = null;
    }
  }

  destroy() {
    this.destroyed = true;

    if (this.lights) {
      this.lights.forEach((light) => this.scene.remove(light));
      this.lights = [];
    }

    if (this.liquidMesh) {
      this.liquidMesh.geometry.dispose();
      this.liquidMesh.material.dispose();
      this.customGroup.remove(this.liquidMesh);
    }

    if (this.innerMesh) {
      this.innerMesh.geometry.dispose();
      this.innerMesh.material.dispose();
      this.customGroup.remove(this.innerMesh);
    }

    if (this.glowMesh) {
      this.glowMesh.geometry.dispose();
      this.glowMesh.material.dispose();
      this.customGroup.remove(this.glowMesh);
    }

    if (this.customGroup) {
      this.scene.remove(this.customGroup);
    }

    this.originalPositions = null;
    super.destroy();
  }
}

export default AudioLiquid;
