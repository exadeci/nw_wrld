/*
@nwWrld name: Bloom
@nwWrld category: Shader
@nwWrld imports: BaseThreeJsModule, THREE
*/

class Bloom extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
        { name: "scale", defaultVal: 1.4, type: "number", min: 0.5, max: 3.0 },
        { name: "rotationSpeed", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 },
      ],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setScale",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.4, type: "number", min: 0.5, max: 3.0 }],
    },
    {
      name: "setRotationSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = Bloom.name;
    this.customGroup = new THREE.Group();

    this.speed = 1.0;
    this.scale = 1.4;
    this.rotationSpeed = 1.0;

    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.clock = null;
    this.time = 0;
    this.destroyed = false;
  }

  async start({
    speed = 1.0,
    scale = 1.4,
    rotationSpeed = 1.0,
  } = {}) {
    const speedVal = Number(speed);
    const scaleVal = Number(scale);
    const rotSpeedVal = Number(rotationSpeed);

    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(speedVal) ? speedVal : 1.0));
    this.scale = Math.max(0.5, Math.min(3.0, Number.isFinite(scaleVal) ? scaleVal : 1.4));
    this.rotationSpeed = Math.max(0.1, Math.min(3.0, Number.isFinite(rotSpeedVal) ? rotSpeedVal : 1.0));

    if (!this.renderer || !this.scene || !this.camera) {
      console.error("Bloom: Renderer, scene, or camera not available");
      return;
    }

    this.renderer.setClearColor(0x000000, 0);

    this.clock = new THREE.Clock();

    this.createShaderPlane();

    if (!this.mesh || !this.material) {
      console.error("Bloom: Failed to create shader plane");
      return;
    }

    this.scene.add(this.customGroup);

    this.modelBoundingBox = new THREE.Box3().setFromObject(this.customGroup);
    this.modelCenter = new THREE.Vector3(0, 0, 0);
    this.modelSize = 2;

    const aspect = this.elem.offsetWidth / this.elem.offsetHeight || 16 / 9;
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
        console.warn("Bloom: Could not import animationManager, using custom animate only");
      }
    }

    this.setCustomAnimate(this.animate.bind(this));

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
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_scale;

      const int octaves = 6;
      const float seed = 43758.5453123;
      const float seed2 = 73156.8473192;

      vec2 random2(vec2 st, float seed){
        st = vec2(dot(st, vec2(127.1, 311.7)),
                  dot(st, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(st) * seed);
      }

      float noise(vec2 st, float seed) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(mix(dot(random2(i + vec2(0.0, 0.0), seed), f - vec2(0.0, 0.0)),
                      dot(random2(i + vec2(1.0, 0.0), seed), f - vec2(1.0, 0.0)), u.x),
                  mix(dot(random2(i + vec2(0.0, 1.0), seed), f - vec2(0.0, 1.0)),
                      dot(random2(i + vec2(1.0, 1.0), seed), f - vec2(1.0, 1.0)), u.x), u.y);
      }

      float fbm1(in vec2 _st, float seed) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5),
                        -sin(0.5), cos(0.50));
        for (int i = 0; i < octaves; ++i) {
          v += a * noise(_st, seed);
          _st = rot * _st * 2.0 + shift;
          a *= 0.4;
        }
        return v;
      }

      float pattern(vec2 uv, float seed, float time, inout vec2 q, inout vec2 r) {
        q = vec2(fbm1(uv + vec2(0.0, 0.0), seed),
                 fbm1(uv + vec2(5.2, 1.3), seed));

        r = vec2(fbm1(uv + 4.0 * q + vec2(1.7 - time / 2., 9.2), seed),
                 fbm1(uv + 4.0 * q + vec2(8.3 - time / 2., 2.8), seed));

        vec2 s = vec2(fbm1(uv + 4.0 * r + vec2(21.7 - time / 2., 90.2), seed),
                      fbm1(uv + 4.0 * r + vec2(80.3 - time / 2., 20.8), seed));

        vec2 t = vec2(fbm1(uv + 4.0 * s + vec2(121.7 - time / 2., 90.2), seed),
                      fbm1(uv + 4.0 * s + vec2(180.3 - time / 2., 20.8), seed));

        float rtn = fbm1(uv + 4.0 * t, seed);
        rtn = clamp(rtn, 0., 0.5);
        return rtn;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        uv *= 1.0 + dot(uv, uv) * 0.3;

        float time = u_time / 20.0;

        mat2 rot = mat2(cos(time), sin(time),
                        -sin(time), cos(time));
        uv = rot * uv;
        uv *= u_scale + sin(time) * 0.3;
        uv.x -= time;

        vec2 q = vec2(0.0, 0.0);
        vec2 r = vec2(0.0, 0.0);

        vec3 colour = vec3(pattern(uv, seed, time, q, r));
        float QR = clamp(dot(q, r), -1.0, 1.0);
        colour += vec3(
          (q.x + q.y) + QR * 30.0,
          QR * 15.0,
          r.x * r.y + QR * 5.0
        );
        colour += 0.1;
        colour = clamp(colour, 0.05, 1.0);

        gl_FragColor = vec4(colour + (abs(colour) * 0.5), 1.0);
      }
    `;

    const width = this.elem.offsetWidth || 1920;
    const height = this.elem.offsetHeight || 1080;

    this.geometry = new THREE.PlaneGeometry(2, 2);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(width, height) },
        u_mouse: { value: new THREE.Vector2(0, 0) },
        u_scale: { value: this.scale },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.frustumCulled = false;
    const aspect = width / height;
    this.mesh.scale.set(aspect, 1, 1);
    this.customGroup.add(this.mesh);
  }

  animate() {
    if (this.destroyed || !this.clock || !this.material || !this.renderer || !this.scene || !this.camera) return;

    if (!this.time) this.time = 0;
    const delta = this.clock.getDelta();
    this.time += delta * 0.05 * 60 * this.speed * this.rotationSpeed;
    
    if (this.material && this.material.uniforms) {
      this.material.uniforms.u_time.value = this.time;

      if (this.elem) {
        const width = this.elem.offsetWidth || this.renderer.domElement.width || 1920;
        const height = this.elem.offsetHeight || this.renderer.domElement.height || 1080;
        this.material.uniforms.u_resolution.value.set(width, height);
        
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

  setScale({ value = 1.4 } = {}) {
    const val = Number(value);
    this.scale = Math.max(0.5, Math.min(3.0, Number.isFinite(val) ? val : 1.4));
    if (this.material && this.material.uniforms) {
      this.material.uniforms.u_scale.value = this.scale;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setRotationSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.rotationSpeed = Math.max(0.1, Math.min(3.0, Number.isFinite(val) ? val : 1.0));
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

export default Bloom;
