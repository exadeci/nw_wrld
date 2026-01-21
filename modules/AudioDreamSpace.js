/*
@nwWrld name: AudioDreamSpace
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

class AudioDreamSpace extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "starIntensity", defaultVal: 1.0, type: "number", min: 0.1, max: 100.0 },
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 10.0 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setStarIntensity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 100.0 }],
    },
    {
      name: "setSpeed",
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
    if (!THREE) return;

    this.name = AudioDreamSpace.name;
    this.customGroup = new THREE.Group();
    this.stars = null;
    this.starSegments = [];
    this.nebulas = [];
    this.planets = [];
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.starIntensity = 1.0;
    this.speed = 1.0;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.time = 0;
    this.cameraZ = 0;
    this.flySpeed = 1.0;
    this.sky = null;
    this.starField = null;
    this.spotlight = null;
    this.rimLight = null;
    this.ambientLight = null;
    this.init();
  }

  async start({ sensitivity = 2.0, starIntensity = 1.0, speed = 1.0 } = {}) {
    const sensVal = Number(sensitivity);
    const intensityVal = Number(starIntensity);
    const speedVal = Number(speed);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.starIntensity = Math.max(0.1, Math.min(3.0, Number.isFinite(intensityVal) ? intensityVal : 1.0));
    this.speed = Math.max(0.1, Math.min(3.0, Number.isFinite(speedVal) ? speedVal : 1.0));
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

    this.scene.fog = new THREE.FogExp2(0x000000, 0.003);
    this.renderer.setClearColor(0x000000);
    
    this.setupLighting();
    this.createStars();
    this.createNebulas();
    this.createPlanets();
    this.createSpaceSky();
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.audioAnimate.bind(this));
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);
    this.ambientLight = ambientLight;

    const spotlight = new THREE.SpotLight(0xffffff, 15, 50, Math.PI * 0.25, 0.5);
    spotlight.position.set(0, 0, 20);
    spotlight.target.position.set(0, 0, 0);
    this.scene.add(spotlight);
    this.scene.add(spotlight.target);
    this.spotlight = spotlight;

    const rimLight = new THREE.SpotLight(0x4488ff, 10, 40, Math.PI * 0.3, 0.6);
    rimLight.position.set(-20, 0, -10);
    rimLight.target.position.set(0, 0, 0);
    this.scene.add(rimLight);
    this.scene.add(rimLight.target);
    this.rimLight = rimLight;
  }

  createStars() {
    this.starSegments = [];
    const segmentSize = 200;
    const segmentCount = 3;
    const starsPerSegment = 2000;
    
    for (let segIndex = 0; segIndex < segmentCount; segIndex++) {
      const positions = [];
      const colors = [];
      const sizes = [];

      for (let i = 0; i < starsPerSegment; i++) {
        positions.push(
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200,
          (segIndex - 1) * segmentSize + (Math.random() - 0.5) * segmentSize
        );

        const hue = Math.random() * 0.15 + 0.5;
        const color = new THREE.Color().setHSL(hue, 0.4, 0.4 + Math.random() * 0.6);
        colors.push(color.r, color.g, color.b);

        sizes.push(0.5 + Math.random() * 2.5);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

      const material = new THREE.PointsMaterial({
        size: 1.2,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });

      const starField = new THREE.Points(geometry, material);
      starField.userData = {
        segmentIndex: segIndex,
        originalPositions: positions.slice(),
      };
      this.customGroup.add(starField);
      this.starSegments.push(starField);
    }
    
    this.stars = this.starSegments[0];
  }

  createNebulas() {
    for (let i = 0; i < 8; i++) {
      const geometry = new THREE.SphereGeometry(12 + Math.random() * 25, 32, 32);
      const hue = Math.random() * 0.3 + 0.5;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.4);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      });

      const nebula = new THREE.Mesh(geometry, material);
      nebula.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 400 - 100
      );
      nebula.userData = {
        baseZ: nebula.position.z,
      };
      this.customGroup.add(nebula);
      this.nebulas.push(nebula);
    }
  }

  createPlanets() {
    for (let i = 0; i < 5; i++) {
      const size = 2.5 + Math.random() * 4;
      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 0.7, 0.45);
      const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.4,
        roughness: 0.6,
        emissive: color,
        emissiveIntensity: 0.25,
      });

      const planet = new THREE.Mesh(geometry, material);
      planet.position.set(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 400 - 50
      );
      planet.userData = {
        baseZ: planet.position.z,
        rotationSpeed: 0.005 + Math.random() * 0.01,
      };
      this.customGroup.add(planet);
      this.planets.push(planet);
    }
  }

  createSpaceSky() {
    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x000000) },
        bottomColor: { value: new THREE.Color(0x000033) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y + offset * 0.01;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `
    });
    
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.sky);
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

    this.flySpeed = this.speed * (1 + this.volume * 0.5);
    this.cameraZ -= this.flySpeed * 0.5;

    this.updateStars();
    this.updateNebulas();
    this.updatePlanets();
    this.updateLighting();
    this.updateCamera();
  }

  updateStars() {
    if (!this.starSegments || this.starSegments.length === 0) return;

    const starBrightness = this.starIntensity * (0.8 + this.treble * 0.6);
    const segmentSize = 200;
    
    this.starSegments.forEach((starField, index) => {
      const segmentIndex = Math.floor(-this.cameraZ / segmentSize) + (index - 1);
      const targetZ = segmentIndex * segmentSize;
      
      const positions = starField.geometry.attributes.position;
      const originalPositions = starField.userData.originalPositions;
      const colors = starField.geometry.attributes.color;
      
      for (let i = 0; i < positions.count; i++) {
        const i3 = i * 3;
        const baseZ = originalPositions[i3 + 2];
        positions.array[i3 + 2] = baseZ + targetZ;
        
        if (positions.array[i3 + 2] > this.cameraZ + 50) {
          positions.array[i3 + 2] = this.cameraZ - 200;
          positions.array[i3] = (Math.random() - 0.5) * 200;
          positions.array[i3 + 1] = (Math.random() - 0.5) * 200;
          originalPositions[i3] = positions.array[i3];
          originalPositions[i3 + 1] = positions.array[i3 + 1];
          originalPositions[i3 + 2] = positions.array[i3 + 2] - targetZ;
        }

        const brightness = 0.6 + this.treble * 0.4;
        colors.array[i3] *= brightness;
        colors.array[i3 + 1] *= brightness;
        colors.array[i3 + 2] *= brightness;
      }

      positions.needsUpdate = true;
      colors.needsUpdate = true;
      starField.material.size = 1.2 + this.bass * 0.6;
    });
  }

  updateNebulas() {
    this.nebulas.forEach((nebula) => {
      nebula.position.z += this.flySpeed * 0.25;

      if (nebula.position.z > this.cameraZ + 50) {
        nebula.position.z = this.cameraZ - 200;
        nebula.position.x = (Math.random() - 0.5) * 150;
        nebula.position.y = (Math.random() - 0.5) * 150;
        nebula.userData.baseZ = nebula.position.z;
      }

      nebula.material.opacity = 0.08 + this.mid * 0.12;
      nebula.rotation.x += 0.0015 * (1 + this.mid * 0.3);
      nebula.rotation.y += 0.0015 * (1 + this.mid * 0.3);
      const scale = 1 + this.mid * 0.1;
      nebula.scale.set(scale, scale, scale);
    });
  }

  updatePlanets() {
    this.planets.forEach((planet) => {
      planet.position.z += this.flySpeed * 0.2;

      if (planet.position.z > this.cameraZ + 50) {
        planet.position.z = this.cameraZ - 200;
        planet.position.x = (Math.random() - 0.5) * 120;
        planet.position.y = (Math.random() - 0.5) * 120;
        planet.userData.baseZ = planet.position.z;
      }

      planet.rotation.y += planet.userData.rotationSpeed * (1 + this.bass * 0.2);
      planet.rotation.x += planet.userData.rotationSpeed * 0.5;
      planet.material.emissiveIntensity = 0.15 + this.bass * 0.35;
      const scale = 1 + this.bass * 0.05;
      planet.scale.set(scale, scale, scale);
    });
  }

  updateLighting() {
    if (this.spotlight) {
      this.spotlight.intensity = 15 + this.bass * 20;
      this.spotlight.position.z = this.cameraZ + 20;
      this.spotlight.target.position.z = this.cameraZ;
    }
    if (this.rimLight) {
      this.rimLight.intensity = 10 + this.mid * 15;
      this.rimLight.position.z = this.cameraZ - 10;
      this.rimLight.target.position.z = this.cameraZ;
    }
  }

  updateCamera() {
    this.camera.position.z = this.cameraZ;
    this.camera.position.x = Math.sin(this.time * 0.12) * 6;
    this.camera.position.y = Math.cos(this.time * 0.18) * 4;
    this.camera.lookAt(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z - 15
    );
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setStarIntensity({ value = 1.0 } = {}) {
    const val = Number(value);
    this.starIntensity = Math.max(0.1, Math.min(3.0, Number.isFinite(val) ? val : 1.0));
  }

  setSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.speed = Math.max(0.1, Math.min(3.0, Number.isFinite(val) ? val : 1.0));
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

    if (this.starSegments) {
      this.starSegments.forEach((starField) => {
        starField.geometry.dispose();
        starField.material.dispose();
        this.customGroup.remove(starField);
      });
      this.starSegments = [];
    }

    if (this.nebulas) {
      this.nebulas.forEach((nebula) => {
        nebula.geometry.dispose();
        nebula.material.dispose();
        this.customGroup.remove(nebula);
      });
      this.nebulas = [];
    }

    if (this.planets) {
      this.planets.forEach((planet) => {
        planet.geometry.dispose();
        planet.material.dispose();
        this.customGroup.remove(planet);
      });
      this.planets = [];
    }

    if (this.sky) {
      this.sky.geometry.dispose();
      this.sky.material.dispose();
      this.scene.remove(this.sky);
    }

    if (this.spotlight) {
      this.scene.remove(this.spotlight);
      this.scene.remove(this.spotlight.target);
    }
    if (this.rimLight) {
      this.scene.remove(this.rimLight);
      this.scene.remove(this.rimLight.target);
    }
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
    }

    if (this.customGroup) {
      this.scene.remove(this.customGroup);
    }

    super.destroy();
  }
}

export default AudioDreamSpace;
