/*
@nwWrld name: AudioDreamOcean
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, Noise, AudioAnalyzer
*/

class AudioDreamOcean extends BaseThreeJsModule {
    static methods = [
      {
        name: "start",
        executeOnLoad: true,
        options: [
          { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
          { name: "waveIntensity", defaultVal: 1.0, type: "number", min: 0.1, max: 100.0 },
          { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 10.0 },
          { name: "cameraVerticalPosition", defaultVal: 0, type: "number", min: -500, max: 500 },
          { name: "fogColor", defaultVal: "#0a0015", type: "color" },
          { name: "enableFog", defaultVal: true, type: "boolean" },
        ],
      },
      {
        name: "setSensitivity",
        executeOnLoad: false,
        options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
      },
      {
        name: "setWaveIntensity",
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
      {
        name: "setCameraVerticalPosition",
        executeOnLoad: false,
        options: [{ name: "position", defaultVal: 0, type: "number", min: -500, max: 500 }],
      },
      {
        name: "setEnableFog",
        executeOnLoad: false,
        options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
      },
    ];
  
    constructor(container) {
      super(container);
      if (!THREE || !Noise) return;
  
      this.name = AudioDreamOcean.name;
      this.customGroup = new THREE.Group();
      this.ocean = null;
      this.oceanSegments = [];
      this.noise = new Noise(Math.random());
      this.analyzer = null;
      this.audioReady = false;
      this.pollInterval = null;
      this.sensitivity = 2.0;
      this.waveIntensity = 1.0;
      this.speed = 1.0;
      this.audioReactive = true;
      this.cameraVerticalPosition = 0;
      this.fogColor = new THREE.Color(0x0a0015);
      this.enableFog = true;
      this.volume = 0;
      this.bass = 0;
      this.mid = 0;
      this.treble = 0;
      this.time = 0;
      this.cameraX = 0;
      this.originalPositions = null;
      this.destroyed = false;
      this.currentWaveHeight = 0;
      this.gridTexture = null;
      this.metalnessTexture = null;
      this.sky = null;
      this.sun = null;
      this.sunRings = [];
      this.spotlight = null;
      this.rimLight = null;
      this.init();
    }
  
    async start({ sensitivity = 2.0, waveIntensity = 1.0, speed = 1.0, cameraVerticalPosition = 0, fogColor = "#0a0015", enableFog = true } = {}) {
      const sensVal = Number(sensitivity);
      const waveVal = Number(waveIntensity);
      const speedVal = Number(speed);
      const posVal = Number(cameraVerticalPosition);
      this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
      this.waveIntensity = Math.max(0.1, Math.min(3.0, Number.isFinite(waveVal) ? waveVal : 1.0));
      this.speed = Math.max(0.1, Math.min(3.0, Number.isFinite(speedVal) ? speedVal : 1.0));
      this.cameraVerticalPosition = Number.isFinite(posVal) ? Math.max(-500, Math.min(500, posVal)) : 0;
      
      if (fogColor && typeof fogColor === 'string') {
        this.fogColor.set(fogColor);
      }
      this.enableFog = Boolean(enableFog);
      
      if (this.scene) {
        this.updateFog();
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
  
      this.updateFog();
      
      this.setupLighting();
      this.createTextures();
      this.createOcean();
      this.createVaporwaveSky();
      this.setModel(this.customGroup);
      this.setCustomAnimate(this.audioAnimate.bind(this));
    }

    updateFog() {
      if (!this.scene || !this.renderer) return;
      
      if (this.enableFog) {
        this.scene.fog = new THREE.FogExp2(this.fogColor, 0.005);
        this.renderer.setClearColor(this.fogColor);
      } else {
        this.scene.fog = null;
        this.renderer.setClearColor(0x000000, 0);
      }
    }
  
    setupLighting() {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      this.scene.add(ambientLight);
      this.ambientLight = ambientLight;
  
      const spotlight = new THREE.SpotLight(0xff6ec7, 25, 30, Math.PI * 0.15, 0.3);
      spotlight.position.set(0, 15, 5);
      spotlight.target.position.set(0, 0, 0);
      this.scene.add(spotlight);
      this.scene.add(spotlight.target);
      this.spotlight = spotlight;
  
      const rimLight = new THREE.SpotLight(0x01cdfe, 15, 25, Math.PI * 0.2, 0.4);
      rimLight.position.set(-10, 8, -5);
      rimLight.target.position.set(0, 0, 0);
      this.scene.add(rimLight);
      this.scene.add(rimLight.target);
      this.rimLight = rimLight;
    }
  
    createTextures() {
      const gridCanvas = document.createElement('canvas');
      gridCanvas.width = 512;
      gridCanvas.height = 512;
      const ctx = gridCanvas.getContext('2d');
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 512);
      
      ctx.strokeStyle = '#ff71ce';
      ctx.lineWidth = 3;
      
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
      
      this.gridTexture = new THREE.CanvasTexture(gridCanvas);
      this.gridTexture.wrapS = THREE.RepeatWrapping;
      this.gridTexture.wrapT = THREE.RepeatWrapping;
      this.gridTexture.repeat.set(10, 10);
  
      const metalnessCanvas = document.createElement('canvas');
      metalnessCanvas.width = 512;
      metalnessCanvas.height = 512;
      const mCtx = metalnessCanvas.getContext('2d');
      
      const mImageData = mCtx.createImageData(512, 512);
      const mData = mImageData.data;
      
      for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
          const i = (y * 512 + x) * 4;
          const gridX = x % gridSize;
          const gridY = y % gridSize;
          const isLine = gridX < 4 || gridY < 4;
          const value = isLine ? 255 : 50;
          
          mData[i] = value;
          mData[i + 1] = value;
          mData[i + 2] = value;
          mData[i + 3] = 255;
        }
      }
      
      mCtx.putImageData(mImageData, 0, 0);
      this.metalnessTexture = new THREE.CanvasTexture(metalnessCanvas);
      this.metalnessTexture.wrapS = THREE.RepeatWrapping;
      this.metalnessTexture.wrapT = THREE.RepeatWrapping;
      this.metalnessTexture.repeat.set(10, 10);
    }
  
    createOcean() {
      this.oceanSegments = [];
      const segmentSize = 200;
      const segmentCount = 3;
      
      for (let i = 0; i < segmentCount; i++) {
        const geometry = new THREE.PlaneGeometry(segmentSize, 200, 128, 128);
        geometry.rotateX(-Math.PI / 2);
        const originalPositions = geometry.attributes.position.array.slice();
  
        const material = new THREE.MeshStandardMaterial({
          map: this.gridTexture,
          metalnessMap: this.metalnessTexture,
          metalness: 0.95,
          roughness: 0.3,
          color: 0xff71ce,
          emissive: 0xff71ce,
          emissiveIntensity: 0.2,
        });
  
        const segment = new THREE.Mesh(geometry, material);
        segment.position.set((i - 1) * segmentSize, 0, 0);
        segment.userData = {
          originalPositions: originalPositions,
          segmentIndex: i,
        };
        this.customGroup.add(segment);
        this.oceanSegments.push(segment);
      }
    }
  
    createVaporwaveSky() {
      const skyGeo = new THREE.SphereGeometry(500, 32, 32);
      const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          topColor: { value: new THREE.Color(0x0a0015) },
          bottomColor: { value: new THREE.Color(0x1a0033) },
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
  
      const sunGeo = new THREE.SphereGeometry(20, 32, 32);
      const sunMat = new THREE.MeshBasicMaterial({
        color: 0xffeb3b,
        transparent: true,
        opacity: 0.9
      });
      this.sun = new THREE.Mesh(sunGeo, sunMat);
      this.sun.position.set(0, 25, -120);
      this.scene.add(this.sun);
      this.sunRings = [];
      
      for (let i = 0; i < 10; i++) {
        const ringGeo = new THREE.RingGeometry(20 + i * 3, 20 + i * 3 + 0.5, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xff6ec7,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8 - i * 0.07
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(this.sun.position);
        ring.lookAt(0, 0, 0);
        this.scene.add(ring);
        this.sunRings.push(ring);
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
  
      const flySpeed = this.speed * (1 + this.volume * 0.5);
      this.cameraX += flySpeed * 0.3;
  
      this.updateOcean();
      this.updateLighting();
      this.updateCamera();
    }
  
    updateOcean() {
      if (!this.oceanSegments || this.oceanSegments.length === 0) return;
  
      const waveHeight = this.waveIntensity * 2 * (0.8 + this.bass * 0.6);
      this.currentWaveHeight = waveHeight;
      const segmentSize = 200;
      
      this.oceanSegments.forEach((segment, index) => {
        const segmentIndex = Math.floor(this.cameraX / segmentSize) + (index - 1);
        const targetX = segmentIndex * segmentSize;
        
        if (Math.abs(segment.position.x - targetX) > segmentSize * 0.1) {
          segment.position.x = targetX;
        }
        
        const positions = segment.geometry.attributes.position;
        const originalPositions = segment.userData.originalPositions;
        
        for (let i = 0; i < positions.count; i++) {
          const i3 = i * 3;
          const ox = originalPositions[i3];
          const oz = originalPositions[i3 + 2];
          
          const worldX = ox + segment.position.x;
          const worldZ = oz;
  
          const wave1 = Math.sin(worldX * 0.08 + this.time * 2) * waveHeight;
          const wave2 = Math.sin((worldZ + this.time * 1.5) * 0.12 + this.time * 1.5) * waveHeight * 0.6;
          const noise = this.noise.simplex2(worldX * 0.04 + this.time * 0.5, worldZ * 0.04) * waveHeight * 0.4;
  
          positions.array[i3 + 1] = originalPositions[i3 + 1] + wave1 + wave2 + noise;
        }
        
        positions.needsUpdate = true;
        segment.geometry.computeVertexNormals();
        
        const hue = 0.88 + Math.sin(this.time * 0.5) * 0.08 + this.mid * 0.05;
        segment.material.color.setHSL(hue, 1.0, 0.55);
        segment.material.emissive.setHSL(hue, 1.0, 0.4);
        segment.material.emissiveIntensity = 0.2 + this.treble * 0.3;
        
        if (segment.material.map) {
          segment.material.map.offset.x = (segment.position.x / segmentSize) * 10;
        }
        if (segment.material.metalnessMap) {
          segment.material.metalnessMap.offset.x = (segment.position.x / segmentSize) * 10;
        }
      });
    }
  
    updateLighting() {
      if (this.spotlight) {
        this.spotlight.intensity = 25 + this.bass * 30;
        this.spotlight.position.x = this.cameraX;
        this.spotlight.target.position.x = this.cameraX;
      }
      if (this.rimLight) {
        this.rimLight.intensity = 15 + this.mid * 20;
        this.rimLight.position.x = this.cameraX - 10;
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
      const baseHeight = 8;
      const waveHeightOffset = this.currentWaveHeight * 0.5;
      const height = baseHeight + waveHeightOffset + Math.sin(this.time * 0.2) * 1.5 + this.cameraVerticalPosition;
      this.camera.position.x = this.cameraX;
      this.camera.position.y = height;
      this.camera.position.z = 5;
      this.camera.lookAt(this.cameraX + 20, height - 2, 0);
    }
  
    setSensitivity({ value = 2.0 } = {}) {
      const val = Number(value);
      this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
    }
  
    setWaveIntensity({ value = 1.0 } = {}) {
      const val = Number(value);
      this.waveIntensity = Math.max(0.1, Math.min(3.0, Number.isFinite(val) ? val : 1.0));
    }
  
    setSpeed({ value = 1.0 } = {}) {
      const val = Number(value);
      this.speed = Math.max(0.1, Math.min(3.0, Number.isFinite(val) ? val : 1.0));
    }
  
    setAudioReactive({ enabled = true } = {}) {
      this.audioReactive = Boolean(enabled);
    }

    setCameraVerticalPosition({ position = 0 } = {}) {
      const posVal = Number(position);
      this.cameraVerticalPosition = Number.isFinite(posVal) ? Math.max(-500, Math.min(500, posVal)) : 0;
    }

    setEnableFog({ enabled = true } = {}) {
      this.enableFog = Boolean(enabled);
      this.updateFog();
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
  
      if (this.ocean) {
        this.ocean.geometry.dispose();
        this.ocean.material.dispose();
        this.customGroup.remove(this.ocean);
      }
      
      if (this.oceanSegments) {
        this.oceanSegments.forEach((segment) => {
          segment.geometry.dispose();
          segment.material.dispose();
          this.customGroup.remove(segment);
        });
        this.oceanSegments = [];
      }
  
      if (this.gridTexture) this.gridTexture.dispose();
      if (this.metalnessTexture) this.metalnessTexture.dispose();
  
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
  
      this.originalPositions = null;
      super.destroy();
    }
  }
  
  export default AudioDreamOcean;
  