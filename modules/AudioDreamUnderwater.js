/*
@nwWrld name: AudioDreamUnderwater
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, createNoise2D, AudioAnalyzer
*/

class AudioDreamUnderwater extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 10.0 },
        { name: "kelpDensity", defaultVal: 20, type: "number", min: 0, max: 100 },
        { name: "coralsDensity", defaultVal: 15, type: "number", min: 0, max: 100 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
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
    if (!THREE || !createNoise2D) return;

    this.name = AudioDreamUnderwater.name;
    this.customGroup = new THREE.Group();
    this.kelp = [];
    this.kelpSegments = [];
    this.corals = [];
    this.coralSegments = [];
    this.bubbles = null;
    this.oceanFloor = [];
    this.oceanFloorSegments = [];
    this.noise = createNoise2D();
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.speed = 1.0;
    this.kelpDensity = 20;
    this.coralsDensity = 15;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.time = 0;
    this.cameraX = 0;
    this.floorTexture = null;
    this.sky = null;
    this.sun = null;
    this.sunRings = [];
    this.spotlight = null;
    this.rimLight = null;
    this.ambientLight = null;
    this.init();
  }

  async start({ sensitivity = 2.0, speed = 1.0, kelpDensity = 20, coralsDensity = 15 } = {}) {
    const sensVal = Number(sensitivity);
    const speedVal = Number(speed);
    const kelpDensVal = Number(kelpDensity);
    const coralsDensVal = Number(coralsDensity);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.speed = Math.max(0.1, Math.min(3.0, Number.isFinite(speedVal) ? speedVal : 1.0));
    const newKelpDensity = Math.max(0, Math.min(100, Number.isFinite(kelpDensVal) ? kelpDensVal : 20));
    const newCoralsDensity = Math.max(0, Math.min(100, Number.isFinite(coralsDensVal) ? coralsDensVal : 15));
    
    if (this.kelpDensity !== newKelpDensity) {
      if (this.kelp) {
        this.kelp.forEach((kelp) => {
          kelp.geometry.dispose();
          kelp.material.dispose();
        });
        this.kelp = [];
      }
      if (this.kelpSegments) {
        this.kelpSegments.forEach((segment) => {
          this.customGroup.remove(segment);
        });
        this.kelpSegments = [];
      }
      this.kelpDensity = newKelpDensity;
      this.createKelp(this.kelpDensity);
    }
    
    if (this.coralsDensity !== newCoralsDensity) {
      if (this.corals) {
        this.corals.forEach((coral) => {
          coral.geometry.dispose();
          coral.material.dispose();
        });
        this.corals = [];
      }
      if (this.coralSegments) {
        this.coralSegments.forEach((segment) => {
          this.customGroup.remove(segment);
        });
        this.coralSegments = [];
      }
      this.coralsDensity = newCoralsDensity;
      this.createCorals(this.coralsDensity);
    }
    
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

    this.scene.fog = new THREE.FogExp2(0x001122, 0.012);
    this.renderer.setClearColor(0x001122);
    
    this.setupLighting();
    this.createOceanFloor();
    this.createKelp(this.kelpDensity);
    this.createCorals(this.coralsDensity);
    this.createBubbles();
    this.createUnderwaterSky();
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.audioAnimate.bind(this));
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x0066cc, 0.5);
    this.scene.add(ambientLight);
    this.ambientLight = ambientLight;

    const spotlight = new THREE.SpotLight(0x88ccff, 18, 35, Math.PI * 0.2, 0.4);
    spotlight.position.set(0, 25, 10);
    spotlight.target.position.set(0, -5, 0);
    this.scene.add(spotlight);
    this.scene.add(spotlight.target);
    this.spotlight = spotlight;

    const rimLight = new THREE.SpotLight(0x00aaff, 12, 30, Math.PI * 0.25, 0.5);
    rimLight.position.set(-12, 15, -8);
    rimLight.target.position.set(0, -5, 0);
    this.scene.add(rimLight);
    this.scene.add(rimLight.target);
    this.rimLight = rimLight;
  }

  createOceanFloor() {
    this.oceanFloorSegments = [];
    const segmentSize = 200;
    const segmentCount = 3;
    
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const ctx = floorCanvas.getContext('2d');
    
    ctx.fillStyle = '#1a3a2a';
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.strokeStyle = '#2a4a3a';
    ctx.lineWidth = 2;
    
    const gridSize = 32;
    for (let i = 0; i <= 512; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    this.floorTexture = new THREE.CanvasTexture(floorCanvas);
    this.floorTexture.wrapS = THREE.RepeatWrapping;
    this.floorTexture.wrapT = THREE.RepeatWrapping;
    this.floorTexture.repeat.set(8, 8);
    
    for (let i = 0; i < segmentCount; i++) {
      const geometry = new THREE.PlaneGeometry(segmentSize, 200, 64, 64);
      geometry.rotateX(-Math.PI / 2);
      const originalPositions = geometry.attributes.position.array.slice();

      const material = new THREE.MeshStandardMaterial({
        map: this.floorTexture,
        color: 0x2a4a3a,
        metalness: 0.3,
        roughness: 0.9,
        emissive: 0x1a3a2a,
        emissiveIntensity: 0.1,
      });

      const segment = new THREE.Mesh(geometry, material);
      segment.position.set((i - 1) * segmentSize, -8, 0);
      segment.userData = {
        originalPositions: originalPositions,
        segmentIndex: i,
      };
      this.customGroup.add(segment);
      this.oceanFloorSegments.push(segment);
      this.oceanFloor.push(segment);
    }
  }

  createKelp(density = 20) {
    this.kelpSegments = [];
    const segmentSize = 200;
    const segmentCount = 3;
    const kelpPerSegment = Math.round(density);
    
    for (let segIndex = 0; segIndex < segmentCount; segIndex++) {
      const segmentGroup = new THREE.Group();
      segmentGroup.position.set((segIndex - 1) * segmentSize, 0, 0);
      
      for (let i = 0; i < kelpPerSegment; i++) {
        const height = 3 + Math.random() * 5;
        const segments = 8;
        const geometry = new THREE.CylinderGeometry(0.1, 0.2, height, 8, segments);
        
        const material = new THREE.MeshPhysicalMaterial({
          color: 0x228822,
          metalness: 0.1,
          roughness: 0.8,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        });

        const kelp = new THREE.Mesh(geometry, material);
        kelp.position.set(
          (Math.random() - 0.5) * segmentSize,
          -5 + height / 2,
          (Math.random() - 0.5) * 200 - 30
        );
        kelp.userData = {
          baseHeight: height,
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 0.5,
        };
        segmentGroup.add(kelp);
        this.kelp.push(kelp);
      }
      
      segmentGroup.userData = {
        segmentIndex: segIndex,
      };
      this.customGroup.add(segmentGroup);
      this.kelpSegments.push(segmentGroup);
    }
  }

  createCorals(density = 15) {
    this.coralSegments = [];
    const segmentSize = 200;
    const segmentCount = 3;
    const coralsPerSegment = Math.round(density);
    
    for (let segIndex = 0; segIndex < segmentCount; segIndex++) {
      const segmentGroup = new THREE.Group();
      segmentGroup.position.set((segIndex - 1) * segmentSize, 0, 0);
      
      for (let i = 0; i < coralsPerSegment; i++) {
        const size = 0.5 + Math.random() * 1.5;
        const geometry = new THREE.ConeGeometry(size, size * 2, 8, 1);
        
        const hue = 0.8 + Math.random() * 0.2;
        const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
        const material = new THREE.MeshPhysicalMaterial({
          color: color,
          metalness: 0.2,
          roughness: 0.6,
          emissive: color,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        });

        const coral = new THREE.Mesh(geometry, material);
        coral.position.set(
          (Math.random() - 0.5) * segmentSize,
          -5,
          (Math.random() - 0.5) * 200 - 30
        );
        coral.userData = {
          phase: Math.random() * Math.PI * 2,
        };
        segmentGroup.add(coral);
        this.corals.push(coral);
      }
      
      segmentGroup.userData = {
        segmentIndex: segIndex,
      };
      this.customGroup.add(segmentGroup);
      this.coralSegments.push(segmentGroup);
    }
  }

  createBubbles() {
    const positions = [];
    const colors = [];
    const sizes = [];

    for (let i = 0; i < 400; i++) {
      positions.push(
        (Math.random() - 0.5) * 600,
        -10 + Math.random() * 30,
        (Math.random() - 0.5) * 400
      );
      colors.push(0.7, 0.9, 1.0);
      sizes.push(0.1 + Math.random() * 0.25);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.18,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    this.bubbles = new THREE.Points(geometry, material);
    this.customGroup.add(this.bubbles);
  }

  createUnderwaterSky() {
    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x001122) },
        bottomColor: { value: new THREE.Color(0x003366) },
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

    const sunGeo = new THREE.SphereGeometry(18, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.85
    });
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.sun.position.set(0, 30, -120);
    this.scene.add(this.sun);
    this.sunRings = [];
    
    for (let i = 0; i < 8; i++) {
      const ringGeo = new THREE.RingGeometry(18 + i * 2.5, 18 + i * 2.5 + 0.4, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75 - i * 0.09
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(this.sun.position);
      ring.lookAt(0, -5, 0);
      this.scene.add(ring);
      this.sunRings.push(ring);
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

    const flySpeed = this.speed * (1 + this.volume * 0.5);
    this.cameraX += flySpeed * 0.3;

    this.updateOceanFloor();
    this.updateKelp();
    this.updateCorals();
    this.updateBubbles();
    this.updateLighting();
    this.updateCamera();
  }

  updateOceanFloor() {
    if (!this.oceanFloorSegments || this.oceanFloorSegments.length === 0) return;

    const segmentSize = 200;
    
    this.oceanFloorSegments.forEach((segment, index) => {
      const relativePos = segment.position.x - this.cameraX;
      
      if (relativePos < -segmentSize * 1.5) {
        segment.position.x += segmentSize * 3;
      }
      
      if (segment.material.map) {
        segment.material.map.offset.x = -(this.cameraX * 8 / segmentSize) % 8;
      }
    });
  }

  updateKelp() {
    if (!this.kelpSegments || this.kelpSegments.length === 0) return;
    
    const segmentSize = 200;
    
    this.kelpSegments.forEach((segmentGroup, index) => {
      const relativePos = segmentGroup.position.x - this.cameraX;
      
      if (relativePos < -segmentSize * 1.5) {
        segmentGroup.position.x += segmentSize * 3;
      }
      
      segmentGroup.children.forEach((kelp) => {
        kelp.userData.phase += 0.02 * kelp.userData.speed * (1 + this.mid * 0.6);
        const sway = Math.sin(kelp.userData.phase) * 0.4;
        kelp.rotation.z = sway;
        kelp.rotation.x = Math.sin(kelp.userData.phase * 0.7) * 0.25;

        const brightness = 0.7 + this.mid * 0.3;
        kelp.material.color.setRGB(0.13 * brightness, 0.53 * brightness, 0.13 * brightness);
        kelp.material.emissiveIntensity = 0.05 + this.treble * 0.15;
      });
    });
  }

  updateCorals() {
    if (!this.coralSegments || this.coralSegments.length === 0) return;
    
    const segmentSize = 200;
    
    this.coralSegments.forEach((segmentGroup, index) => {
      const relativePos = segmentGroup.position.x - this.cameraX;
      
      if (relativePos < -segmentSize * 1.5) {
        segmentGroup.position.x += segmentSize * 3;
      }
      
      segmentGroup.children.forEach((coral) => {
        coral.userData.phase += 0.015 * (1 + this.bass * 0.4);
        coral.rotation.y = coral.userData.phase;
        coral.scale.y = 1 + Math.sin(coral.userData.phase * 2) * 0.25 * this.bass;

        const hue = 0.8 + Math.sin(coral.userData.phase) * 0.12;
        const color = new THREE.Color().setHSL(hue, 0.8, 0.45 + this.bass * 0.35);
        coral.material.color.copy(color);
        coral.material.emissive.copy(color);
        coral.material.emissiveIntensity = 0.25 + this.bass * 0.45;
      });
    });
  }

  updateBubbles() {
    if (!this.bubbles) return;

    const positions = this.bubbles.geometry.attributes.position;
    const colors = this.bubbles.geometry.attributes.color;
    const viewDistance = 300;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      
      positions.array[i3 + 1] += 0.12 * (1 + this.treble * 0.6);
      positions.array[i3] += Math.sin(this.time * 2.5 + i) * 0.06;
      
      if (positions.array[i3 + 1] > 15) {
        positions.array[i3 + 1] = -10;
        positions.array[i3] = this.cameraX + (Math.random() - 0.5) * viewDistance;
        positions.array[i3 + 2] = (Math.random() - 0.5) * 400;
      }
      
      const distFromCamera = positions.array[i3] - this.cameraX;
      if (distFromCamera < -viewDistance / 2) {
        positions.array[i3] = this.cameraX + viewDistance / 2;
        positions.array[i3 + 1] = -10 + Math.random() * 20;
        positions.array[i3 + 2] = (Math.random() - 0.5) * 400;
      }

      const brightness = 0.6 + this.treble * 0.4;
      colors.array[i3] = 0.7 * brightness;
      colors.array[i3 + 1] = 0.9 * brightness;
      colors.array[i3 + 2] = 1.0 * brightness;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    this.bubbles.material.size = 0.15 + this.treble * 0.12;
  }

  updateLighting() {
    if (this.spotlight) {
      this.spotlight.intensity = 18 + this.bass * 22;
      this.spotlight.position.x = this.cameraX;
      this.spotlight.target.position.x = this.cameraX;
    }
    if (this.rimLight) {
      this.rimLight.intensity = 12 + this.mid * 16;
      this.rimLight.position.x = this.cameraX - 12;
      this.rimLight.target.position.x = this.cameraX;
    }
    if (this.sun) {
      this.sun.position.x = this.cameraX;
    }
    if (this.sunRings) {
      this.sunRings.forEach((ring) => {
        ring.position.x = this.cameraX;
      });
    }
  }

  updateCamera() {
    const baseHeight = -2;
    const height = baseHeight + Math.sin(this.time * 0.18) * 1.2;
    this.camera.position.x = this.cameraX;
    this.camera.position.y = height;
    this.camera.position.z = 4;
    this.camera.lookAt(this.cameraX + 18, height - 1, 0);
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
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

    if (this.kelp) {
      this.kelp.forEach((kelp) => {
        kelp.geometry.dispose();
        kelp.material.dispose();
      });
      this.kelp = [];
    }

    if (this.kelpSegments) {
      this.kelpSegments.forEach((segment) => {
        this.customGroup.remove(segment);
      });
      this.kelpSegments = [];
    }

    if (this.corals) {
      this.corals.forEach((coral) => {
        coral.geometry.dispose();
        coral.material.dispose();
      });
      this.corals = [];
    }

    if (this.coralSegments) {
      this.coralSegments.forEach((segment) => {
        this.customGroup.remove(segment);
      });
      this.coralSegments = [];
    }

    if (this.bubbles) {
      this.bubbles.geometry.dispose();
      this.bubbles.material.dispose();
      this.customGroup.remove(this.bubbles);
    }

    if (this.floorTexture) {
      this.floorTexture.dispose();
    }

    if (this.oceanFloor) {
      this.oceanFloor.forEach((floor) => {
        floor.geometry.dispose();
        floor.material.dispose();
        this.customGroup.remove(floor);
      });
      this.oceanFloor = [];
      this.oceanFloorSegments = [];
    }

    if (this.sky) {
      this.sky.geometry.dispose();
      this.sky.material.dispose();
      this.scene.remove(this.sky);
    }

    if (this.sun) {
      this.sun.geometry.dispose();
      this.sun.material.dispose();
      this.scene.remove(this.sun);
    }

    if (this.sunRings) {
      this.sunRings.forEach((ring) => {
        ring.geometry.dispose();
        ring.material.dispose();
        this.scene.remove(ring);
      });
      this.sunRings = [];
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

export default AudioDreamUnderwater;
