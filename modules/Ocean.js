/*
@nwWrld name: Ocean
@nwWrld category: Shader
@nwWrld imports: BaseThreeJsModule, THREE
*/

class Ocean extends BaseThreeJsModule {
  static methods = [
    ...BaseThreeJsModule.methods,
    {
      name: "setSeaChoppy",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 }],
    },
    {
      name: "setSeaFreq",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.16, type: "number", min: 0.01, max: 0.5 }],
    },
    {
      name: "setSeaHeight",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.6, type: "number", min: 0.1, max: 2.0 }],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "seaChoppy", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 },
        { name: "seaFreq", defaultVal: 0.16, type: "number", min: 0.01, max: 0.5 },
        { name: "seaHeight", defaultVal: 0.6, type: "number", min: 0.1, max: 2.0 },
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
      ],
    },
  ];

  constructor(container) {
    super(container);
    this._log("constructor", { hasTHREE: !!THREE, hasElem: !!container });
    if (!THREE) {
      this._log("THREE not available, skipping init");
      return;
    }

    this.name = Ocean.name;
    this.customGroup = new THREE.Group();

    this.speed = 1.0;
    this.seaHeight = 0.6;
    this.seaChoppy = 1.0;
    this.seaFreq = 0.16;

    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.clock = null;
    this.time = 0;
    this.destroyed = false;
    this._animateLogCount = 0;
  }

  /** Log to sandbox console and to main process (visible in terminal / projector) */
  _log(...args) {
    const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    console.log(msg);
    try {
      const ipc = typeof globalThis !== "undefined" && globalThis.nwSandboxIpc;
      if (ipc && typeof ipc.send === "function") {
        ipc.send({
          __nwWrldSandbox: true,
          type: "module-log",
          module: "Ocean",
          message: msg,
        });
      }
    } catch (_) {}
  }

  async start({
    speed = 1.0,
    seaHeight = 0.6,
    seaChoppy = 1.0,
    seaFreq = 0.16,
  } = {}) {
    this._log("start()", { speed, seaHeight, seaChoppy, seaFreq });
    this.speed = Math.max(0.1, Math.min(5.0, Number(speed) || 1.0));
    this.seaHeight = Math.max(0.1, Math.min(2.0, Number(seaHeight) || 0.6));
    this.seaChoppy = Math.max(0.1, Math.min(3.0, Number(seaChoppy) || 1.0));
    this.seaFreq = Math.max(0.01, Math.min(0.5, Number(seaFreq) || 0.16));

    if (!this.renderer || !this.scene || !this.camera) {
      this._log("Renderer, scene, or camera not available", {
        renderer: !!this.renderer,
        scene: !!this.scene,
        camera: !!this.camera,
      });
      return;
    }
    const w = Math.max(this.elem.offsetWidth || 0, 1);
    const h = Math.max(this.elem.offsetHeight || 0, 1);
    this._log("renderer OK", {
      useWebGPU: this.useWebGPU,
      rendererInitialized: this.rendererInitialized,
      elemSize: this.elem ? `${w}x${h}` : "no elem",
    });

    // Resize renderer to current container size (constructor may have run when container was 0x0)
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (this.renderer.domElement) {
      this.renderer.domElement.style.display = "block";
      this.renderer.domElement.style.width = "100%";
      this.renderer.domElement.style.height = "100%";
    }

    // WebGPU: ensure renderer is initialized (other modules do this via setModel)
    if (!this.rendererInitialized && this.useWebGPU) {
      this._log("initializing WebGPU renderer...");
      await this.renderer.init();
      this.rendererInitialized = true;
      this._log("WebGPU renderer initialized");
    }

    // Opaque clear so the canvas is visible (same as LiquidChromeVoid / AudioWaterGradient)
    this.renderer.setClearColor(0x000000, 1);
    this.clock = new THREE.Clock();

    this.createShaderPlane();

    if (!this.mesh || !this.material) {
      this._log("Failed to create shader plane", { mesh: !!this.mesh, material: !!this.material });
      return;
    }
    this._log("shader plane created");

    // Use setModel like other modules: adds to scene, sets bbox, subscribes to animationManager
    this._log("calling setModel(this.customGroup)...");
    await this.setModel(this.customGroup);
    this._log("setModel done");

    // Orthographic camera + NDC quad (like LiquidChromeVoid) so the fullscreen shader always draws
    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.camera = this.orthoCamera;

    if (this.controls) {
      this.controls.enableDamping = false;
      this.controls.enableZoom = false;
      this.controls.enablePan = false;
      this.controls.enableRotate = false;
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }

    this.setCustomAnimate(this.animate.bind(this));
    this.markNeedsRender();
    this.render(true);
    // ModuleBase starts with visibility: hidden; show() makes the container visible on the projector
    if (typeof this.show === "function") this.show();
    this._log("start() complete");
  }

  createShaderPlane() {
    this._log("createShaderPlane()");
    if (this.mesh) {
      if (this.customGroup) this.customGroup.remove(this.mesh);
      if (this.geometry) this.geometry.dispose();
      if (this.material) this.material.dispose();
    }

    // Fullscreen NDC quad (like LiquidChromeVoid) so the shader always fills the view
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // "Seascape" by Alexander Alekseev aka TDM - 2014
    // License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
    const fragmentShader = `
      precision highp float;

      varying vec2 vUv;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec4 iMouse;
      uniform float u_seaHeight;
      uniform float u_seaChoppy;
      uniform float u_seaFreq;
      uniform float u_seaSpeed;

      const int NUM_STEPS = 32;
      const float PI = 3.141592;
      const float EPSILON = 1e-3;
      #define EPSILON_NRM (0.1 / iResolution.x)

      const int ITER_GEOMETRY = 3;
      const int ITER_FRAGMENT = 5;
      const vec3 SEA_BASE = vec3(0.0, 0.09, 0.18);
      const vec3 SEA_WATER_COLOR = vec3(0.8, 0.9, 0.6) * 0.6;
      #define SEA_TIME (1.0 + iTime * u_seaSpeed)
      const mat2 octave_m = mat2(1.6, 1.2, -1.2, 1.6);

      mat3 fromEuler(vec3 ang) {
        vec2 a1 = vec2(sin(ang.x), cos(ang.x));
        vec2 a2 = vec2(sin(ang.y), cos(ang.y));
        vec2 a3 = vec2(sin(ang.z), cos(ang.z));
        mat3 m;
        m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x, a1.y*a2.x*a3.x+a3.y*a1.x, -a2.y*a3.x);
        m[1] = vec3(-a2.y*a1.x, a1.y*a2.y, a2.x);
        m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x, a1.x*a3.x-a1.y*a3.y*a2.x, a2.y*a3.y);
        return m;
      }

      float hash(vec2 p) {
        float h = dot(p, vec2(127.1, 311.7));
        return fract(sin(h) * 43758.5453123);
      }

      float noise(in vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return -1.0 + 2.0 * mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float diffuse(vec3 n, vec3 l, float p) {
        return pow(dot(n, l) * 0.4 + 0.6, p);
      }

      float specular(vec3 n, vec3 l, vec3 e, float s) {
        float nrm = (s + 8.0) / (PI * 8.0);
        return pow(max(dot(reflect(e, n), l), 0.0), s) * nrm;
      }

      vec3 getSkyColor(vec3 e) {
        e.y = (max(e.y, 0.0) * 0.8 + 0.2) * 0.8;
        return vec3(pow(1.0 - e.y, 2.0), 1.0 - e.y, 0.6 + (1.0 - e.y) * 0.4) * 1.1;
      }

      float sea_octave(vec2 uv, float choppy) {
        uv += noise(uv);
        vec2 wv = 1.0 - abs(sin(uv));
        vec2 swv = abs(cos(uv));
        wv = mix(wv, swv, wv);
        return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
      }

      float map(vec3 p) {
        float freq = u_seaFreq;
        float amp = u_seaHeight;
        float choppy = u_seaChoppy;
        vec2 uv = p.xz;
        uv.x *= 0.75;

        float d, h = 0.0;
        for (int i = 0; i < ITER_GEOMETRY; i++) {
          d = sea_octave((uv + SEA_TIME) * freq, choppy);
          d += sea_octave((uv - SEA_TIME) * freq, choppy);
          h += d * amp;
          uv *= octave_m;
          freq *= 1.9;
          amp *= 0.22;
          choppy = mix(choppy, 1.0, 0.2);
        }
        return p.y - h;
      }

      float map_detailed(vec3 p) {
        float freq = u_seaFreq;
        float amp = u_seaHeight;
        float choppy = u_seaChoppy;
        vec2 uv = p.xz;
        uv.x *= 0.75;

        float d, h = 0.0;
        for (int i = 0; i < ITER_FRAGMENT; i++) {
          d = sea_octave((uv + SEA_TIME) * freq, choppy);
          d += sea_octave((uv - SEA_TIME) * freq, choppy);
          h += d * amp;
          uv *= octave_m;
          freq *= 1.9;
          amp *= 0.22;
          choppy = mix(choppy, 1.0, 0.2);
        }
        return p.y - h;
      }

      vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {
        float fresnel = clamp(1.0 - dot(n, -eye), 0.0, 1.0);
        fresnel = min(fresnel * fresnel * fresnel, 0.5);

        vec3 reflected = getSkyColor(reflect(eye, n));
        vec3 refracted = SEA_BASE + diffuse(n, l, 80.0) * SEA_WATER_COLOR * 0.12;

        vec3 color = mix(refracted, reflected, fresnel);

        float atten = max(1.0 - dot(dist, dist) * 0.001, 0.0);
        color += SEA_WATER_COLOR * (p.y - u_seaHeight) * 0.18 * atten;

        float spec = specular(n, l, eye, 600.0 * inversesqrt(dot(dist, dist)));
        color += vec3(spec);

        return color;
      }

      vec3 getNormal(vec3 p, float eps) {
        vec3 n;
        n.y = map_detailed(p);
        n.x = map_detailed(vec3(p.x + eps, p.y, p.z)) - n.y;
        n.z = map_detailed(vec3(p.x, p.y, p.z + eps)) - n.y;
        n.y = eps;
        return normalize(n);
      }

      float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {
        float tm = 0.0;
        float tx = 1000.0;
        float hx = map(ori + dir * tx);
        if (hx > 0.0) {
          p = ori + dir * tx;
          return tx;
        }
        float hm = map(ori);
        for (int i = 0; i < NUM_STEPS; i++) {
          float tmid = mix(tm, tx, hm / (hm - hx));
          p = ori + dir * tmid;
          float hmid = map(p);
          if (hmid < 0.0) {
            tx = tmid;
            hx = hmid;
          } else {
            tm = tmid;
            hm = hmid;
          }
          if (abs(hmid) < EPSILON) break;
        }
        return mix(tm, tx, hm / (hm - hx));
      }

      vec3 getPixel(in vec2 coord, float time) {
        vec2 uv = coord / iResolution.xy;
        uv = uv * 2.0 - 1.0;
        uv.x *= iResolution.x / iResolution.y;

        vec3 ang = vec3(sin(time*3.0)*0.1, sin(time)*0.2+0.3, time);
        vec3 ori = vec3(0.0, 3.5, time*5.0);
        vec3 dir = normalize(vec3(uv.xy, -2.0));
        dir.z += length(uv) * 0.14;
        dir = normalize(dir) * fromEuler(ang);

        vec3 p;
        heightMapTracing(ori, dir, p);
        vec3 dist = p - ori;
        vec3 n = getNormal(p, dot(dist, dist) * EPSILON_NRM);
        vec3 light = normalize(vec3(0.0, 1.0, 0.8));

        return mix(
          getSkyColor(dir),
          getSeaColor(p, n, light, dir, dist),
          pow(smoothstep(0.0, -0.02, dir.y), 0.2)
        );
      }

      void main() {
        vec2 fragCoord = vUv * iResolution;
        float time = iTime * 0.3 + iMouse.x * 0.01;

        vec3 color = getPixel(fragCoord, time);

        gl_FragColor = vec4(pow(color, vec3(0.65)), 1.0);
      }
    `;

    const width = Math.max(this.elem.offsetWidth || 1920, 1);
    const height = Math.max(this.elem.offsetHeight || 1080, 1);

    this.geometry = new THREE.PlaneGeometry(2, 2);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        iTime: { value: 0.0 },
        iResolution: { value: new THREE.Vector2(width, height) },
        iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
        u_seaHeight: { value: this.seaHeight },
        u_seaChoppy: { value: this.seaChoppy },
        u_seaFreq: { value: this.seaFreq },
        u_seaSpeed: { value: this.speed },
      },
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.frustumCulled = false;
    // Ortho + NDC: quad is -1..1, no scale needed (aspect handled in fragment via iResolution)
    this.mesh.scale.set(1, 1, 1);

    this.customGroup.add(this.mesh);
    this._log("createShaderPlane() done", { width, height });
  }

  updateShaderUniforms(delta, time) {
    if (!this.time) this.time = 0;
    this.time += delta * this.speed;

    if (this.material && this.material.uniforms) {
      this.material.uniforms.iTime.value = this.time;

      if (this.elem) {
        const width = Math.max(this.elem.offsetWidth || this.renderer.domElement.width || 1920, 1);
        const height = Math.max(this.elem.offsetHeight || this.renderer.domElement.height || 1080, 1);
        this.material.uniforms.iResolution.value.set(width, height);
      }
    }
  }

  animate() {
    if (this.destroyed || !this.clock || !this.material || !this.renderer || !this.scene || !this.camera) {
      if (this._animateLogCount < 3) {
        this._log("animate() early return", {
          destroyed: this.destroyed,
          clock: !!this.clock,
          material: !!this.material,
          renderer: !!this.renderer,
          scene: !!this.scene,
          camera: !!this.camera,
        });
        this._animateLogCount = (this._animateLogCount || 0) + 1;
      }
      return;
    }
    if (this._animateLogCount === 0) {
      this._log("animate() running");
      this._animateLogCount = 1;
    }

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    this.updateShaderUniforms(delta, elapsedTime);

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.0));
    if (this.material && this.material.uniforms) {
      this.material.uniforms.u_seaSpeed.value = this.speed;
    }
  }

  setSeaHeight({ value = 0.6 } = {}) {
    const val = Number(value);
    this.seaHeight = Math.max(0.1, Math.min(2.0, Number.isFinite(val) ? val : 0.6));
    if (this.material && this.material.uniforms) {
      this.material.uniforms.u_seaHeight.value = this.seaHeight;
    }
  }

  setSeaChoppy({ value = 1.0 } = {}) {
    const val = Number(value);
    this.seaChoppy = Math.max(0.1, Math.min(3.0, Number.isFinite(val) ? val : 1.0));
    if (this.material && this.material.uniforms) {
      this.material.uniforms.u_seaChoppy.value = this.seaChoppy;
    }
  }

  setSeaFreq({ value = 0.16 } = {}) {
    const val = Number(value);
    this.seaFreq = Math.max(0.01, Math.min(0.5, Number.isFinite(val) ? val : 0.16));
    if (this.material && this.material.uniforms) {
      this.material.uniforms.u_seaFreq.value = this.seaFreq;
    }
  }

  destroy() {
    this._log("destroy()");
    this.destroyed = true;

    if (this.mesh && this.customGroup) {
      this.customGroup.remove(this.mesh);
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }

    super.destroy();
  }
}

export default Ocean;
