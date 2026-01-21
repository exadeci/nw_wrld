/*
@nwWrld name: UnifiedShipibo
@nwWrld category: Shader
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

class UnifiedShipibo extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
        { name: "iterations", defaultVal: 4, type: "number", min: 1, max: 8 },
        { name: "intensity", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 },
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
      ],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setIterations",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 4, type: "number", min: 1, max: 8 }],
    },
    {
      name: "setIntensity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 }],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
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

    this.name = UnifiedShipibo.name;
    this.customGroup = new THREE.Group();
    
    this.speed = 1.0;
    this.iterations = 4;
    this.intensity = 1.0;
    this.sensitivity = 2.0;
    
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.clock = null;
    this.destroyed = false;
  }

  async start({
    speed = 1.0,
    iterations = 4,
    intensity = 1.0,
    sensitivity = 2.0,
  } = {}) {
    const speedVal = Number(speed);
    const iterVal = Number(iterations);
    const intVal = Number(intensity);
    const sensVal = Number(sensitivity);
    
    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(speedVal) ? speedVal : 1.0));
    this.iterations = Math.max(1, Math.min(8, Number.isFinite(iterVal) ? Math.floor(iterVal) : 4));
    this.intensity = Math.max(0.1, Math.min(3.0, Number.isFinite(intVal) ? intVal : 1.0));
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
    
    if (!this.renderer || !this.scene || !this.camera) {
      console.error("UnifiedShipibo: Renderer, scene, or camera not available");
      return;
    }

    this.renderer.setClearColor(0x000000, 0);
    
    this.clock = new THREE.Clock();
    
    this.createShaderPlane();
    
    if (!this.mesh || !this.material) {
      console.error("UnifiedShipibo: Failed to create shader plane");
      return;
    }
    
    this.scene.add(this.customGroup);
    
    this.modelBoundingBox = new THREE.Box3().setFromObject(this.customGroup);
    this.modelCenter = new THREE.Vector3(0, 0, 0);
    this.modelSize = 2;
    
    const aspect = this.elem.offsetWidth / this.elem.offsetHeight || 16/9;
    this.camera.aspect = aspect;
    this.camera.fov = 75;
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    
    if (this.controls) {
      this.controls.enableDamping = false;
      this.controls.enableZoom = false;
      this.controls.enablePan = false;
      this.controls.enableRotate = false;
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
    
    if (!this.isInitialized) {
      this.isInitialized = true;
      try {
        const { animationManager } = await import("../../src/projector/helpers/animationManager.js");
        if (animationManager) {
          animationManager.subscribe(this.animate.bind(this));
        }
      } catch (e) {
        console.warn("UnifiedShipibo: Could not import animationManager, using custom animate only");
      }
    }
    
    this.setCustomAnimate(this.animate.bind(this));
    
    this.updateShader();
    
    this.markNeedsRender();
    this.render(true);
  }

  createShaderPlane() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      if (this.geometry) this.geometry.dispose();
      if (this.material) this.material.dispose();
    }

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float time;
      uniform vec2 resolution;
      uniform float intensity;
      uniform float audioVolume;
      uniform float audioBass;
      uniform float audioMid;
      uniform float audioTreble;

      vec3 palette( float t ) {
          vec3 a = vec3(0.5, 0.5, 0.5);
          vec3 b = vec3(0.5, 0.5, 0.5);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.00, 0.15, 0.20);
          return a + b*cos( 6.28318*(c*t+d) );
      }

      mat2 rot(float a) {
          float s = sin(a), c = cos(a);
          return mat2(c, -s, s, c);
      }

      void main() {
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / resolution.y;
          vec2 uv0 = uv;
          vec3 finalColor = vec3(0.0);
          
          float audioInfluence = audioVolume * 0.5;
          float baseTime = time;
          float timeWithAudio = baseTime * (1.0 + audioBass * 0.3);
          float rotationSpeed = 0.1 + audioMid * 0.05;
          float waveSpeed = 0.4 + audioTreble * 0.2;
          
          for (float i = 0.0; i < 4.0; i++) {
              uv = abs(uv) - 0.9;
              uv *= rot(timeWithAudio * rotationSpeed + i);
              uv += sin(uv.yx * 2.5 + timeWithAudio * waveSpeed) * (0.3 + audioInfluence * 0.2);
              
              float d = length(uv);
              vec3 col = palette(length(uv0) + i * 0.4 + timeWithAudio * 0.3 + audioBass * 0.5);
              
              d = sin(d * (10.0 + audioTreble * 5.0) + timeWithAudio) / 10.0;
              d = abs(d);
              d = pow(0.012 / d, 1.2 + audioVolume * 0.3);
              
              finalColor += col * d * intensity * (1.0 + audioInfluence);
          }
          
          finalColor *= 1.2 - length(uv0) * 0.8;
          finalColor = pow(finalColor, vec3(0.8));

          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const width = this.elem.offsetWidth || 1920;
    const height = this.elem.offsetHeight || 1080;
    const aspect = width / height;
    
    this.geometry = new THREE.PlaneGeometry(2, 2);
    
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
        audioVolume: { value: 0 },
        audioBass: { value: 0 },
        audioMid: { value: 0 },
        audioTreble: { value: 0 },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.scale.set(aspect, 1, 1);
    this.mesh.frustumCulled = false;
    this.customGroup.add(this.mesh);
  }

  updateShader() {
    if (this.material) {
      this.material.uniforms.intensity.value = this.intensity;
    }
  }

  animate() {
    if (this.destroyed || !this.clock || !this.material || !this.renderer) return;
    
    if (this.audioReactive && this.analyzer && this.audioReady) {
      const sensitivity = this.sensitivity || 1.0;
      this.volume = this.analyzer.getVolume() * sensitivity;
      this.bass = this.analyzer.getBass() * sensitivity;
      this.mid = this.analyzer.getMid() * sensitivity;
      this.treble = this.analyzer.getTreble() * sensitivity;
    } else {
      this.volume = 0;
      this.bass = 0;
      this.mid = 0;
      this.treble = 0;
    }
    
    const elapsedTime = this.clock.getElapsedTime() * this.speed;
    
    if (this.material && this.material.uniforms) {
      this.material.uniforms.time.value = elapsedTime;
      this.material.uniforms.audioVolume.value = this.volume;
      this.material.uniforms.audioBass.value = this.bass;
      this.material.uniforms.audioMid.value = this.mid;
      this.material.uniforms.audioTreble.value = this.treble;
      
      if (this.elem) {
        const width = this.elem.offsetWidth || this.renderer.domElement.width || 1920;
        const height = this.elem.offsetHeight || this.renderer.domElement.height || 1080;
        this.material.uniforms.resolution.value.set(width, height);
        
        const aspect = width / height;
        if (this.mesh) {
          this.mesh.scale.set(aspect, 1, 1);
        }
      }
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.0));
  }

  setIterations({ value = 4 } = {}) {
    const val = Number(value);
    this.iterations = Math.max(1, Math.min(8, Number.isFinite(val) ? Math.floor(val) : 4));
    this.updateShader();
  }

  setIntensity({ value = 1.0 } = {}) {
    const val = Number(value);
    this.intensity = Math.max(0.1, Math.min(3.0, Number.isFinite(val) ? val : 1.0));
    this.updateShader();
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
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

  destroy() {
    this.destroyed = true;

    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }

    super.destroy();
  }
}

export default UnifiedShipibo;
