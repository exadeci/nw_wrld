/*
@nwWrld name: Ocean
@nwWrld category: Shader
@nwWrld imports: BaseThreeJsModule, THREE
*/

try {
  console.log("[Ocean] Module file loaded - top level");
} catch (e) {
  console.error("[Ocean] Error in top-level log:", e);
}

class Ocean extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
        { name: "seaHeight", defaultVal: 0.6, type: "number", min: 0.1, max: 2.0 },
        { name: "seaChoppy", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 },
        { name: "seaFreq", defaultVal: 0.16, type: "number", min: 0.01, max: 0.5 },
      ],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setSeaHeight",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.6, type: "number", min: 0.1, max: 2.0 }],
    },
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
  ];

  constructor(container) {
    super(container);
    console.log("[Ocean] Constructor called");
    if (!THREE) {
      console.error("[Ocean] THREE is not available");
      return;
    }

    this.name = Ocean.name;
    this.customGroup = new THREE.Group();
    console.log("[Ocean] Custom group created");

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
    console.log("[Ocean] Constructor complete");
  }

  async start({
    speed = 1.0,
    seaHeight = 0.6,
    seaChoppy = 1.0,
    seaFreq = 0.16,
  } = {}) {
    console.log("[Ocean] Start method called with params:", { speed, seaHeight, seaChoppy, seaFreq });
    const speedVal = Number(speed);
    const seaHeightVal = Number(seaHeight);
    const seaChoppyVal = Number(seaChoppy);
    const seaFreqVal = Number(seaFreq);

    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(speedVal) ? speedVal : 1.0));
    this.seaHeight = Math.max(0.1, Math.min(2.0, Number.isFinite(seaHeightVal) ? seaHeightVal : 0.6));
    this.seaChoppy = Math.max(0.1, Math.min(3.0, Number.isFinite(seaChoppyVal) ? seaChoppyVal : 1.0));
    this.seaFreq = Math.max(0.01, Math.min(0.5, Number.isFinite(seaFreqVal) ? seaFreqVal : 0.16));
    console.log("[Ocean] Parameters set:", { speed: this.speed, seaHeight: this.seaHeight, seaChoppy: this.seaChoppy, seaFreq: this.seaFreq });

    if (!this.renderer || !this.scene || !this.camera) {
      console.error("[Ocean] Renderer, scene, or camera not available", {
        renderer: !!this.renderer,
        scene: !!this.scene,
        camera: !!this.camera
      });
      return;
    }

    console.log("[Ocean] Renderer info:", {
      type: this.renderer.constructor.name,
      useWebGPU: this.useWebGPU,
      rendererInitialized: this.rendererInitialized,
      domElement: !!this.renderer.domElement
    });

    if (!this.rendererInitialized && this.useWebGPU) {
      console.log("[Ocean] Initializing WebGPU renderer...");
      try {
        await this.renderer.init();
        this.rendererInitialized = true;
        console.log("[Ocean] WebGPU renderer initialized successfully");
      } catch (error) {
        console.error("[Ocean] Failed to initialize WebGPU renderer:", error);
      }
    }

    this.renderer.setClearColor(0x000000, 0);
    console.log("[Ocean] Clear color set");

    this.clock = new THREE.Clock();
    console.log("[Ocean] Clock created");

    console.log("[Ocean] Creating shader plane...");
    this.createShaderPlane();

    if (!this.mesh || !this.material) {
      console.error("[Ocean] Failed to create shader plane", {
        mesh: !!this.mesh,
        material: !!this.material,
        geometry: !!this.geometry
      });
      return;
    }
    console.log("[Ocean] Shader plane created successfully");

    this.scene.add(this.customGroup);
    console.log("[Ocean] Custom group added to scene");

    this.modelBoundingBox = new THREE.Box3().setFromObject(this.customGroup);
    this.modelCenter = new THREE.Vector3(0, 0, 0);
    this.modelSize = 2;
    console.log("[Ocean] Model bounding box set");

    const aspect = this.elem.offsetWidth / this.elem.offsetHeight || 16 / 9;
    console.log("[Ocean] Element dimensions:", {
      width: this.elem.offsetWidth,
      height: this.elem.offsetHeight,
      aspect: aspect
    });
    this.camera.aspect = aspect;
    this.camera.fov = 75;
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    console.log("[Ocean] Camera configured:", {
      position: this.camera.position.toArray(),
      aspect: this.camera.aspect,
      fov: this.camera.fov
    });

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
        console.warn("Ocean: Could not import animationManager, using custom animate only");
      }
    }

    this.setCustomAnimate(this.animate.bind(this));
    console.log("[Ocean] Custom animate set");

    this.markNeedsRender();
    console.log("[Ocean] Calling render...");
    this.render(true);
    console.log("[Ocean] Start method complete");
  }

  createShaderPlane() {
    console.log("[Ocean] createShaderPlane called");
    if (this.mesh) {
      console.log("[Ocean] Removing existing mesh");
      this.scene.remove(this.mesh);
      if (this.geometry) this.geometry.dispose();
      if (this.material) this.material.dispose();
    }

    const vertexShader = `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float iGlobalTime;
      uniform vec2 iResolution;
      uniform float u_seaHeight;
      uniform float u_seaChoppy;
      uniform float u_seaFreq;
      uniform float u_seaSpeed;
      
      // WebGL2/WebGPU compatible shader using 'out' parameters

      const int NUM_STEPS = 8;
      const float PI = 3.1415;
      const float EPSILON = 1e-3;

      const int ITER_GEOMETRY = 3;
      const int ITER_FRAGMENT = 5;
      const vec3 SEA_BASE = vec3(0.1,0.19,0.22);
      const vec3 SEA_WATER_COLOR = vec3(0.8,0.9,0.6);
      float SEA_TIME = iGlobalTime * u_seaSpeed;
      mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

      mat3 fromEuler(vec3 ang) {
        vec2 a1 = vec2(sin(ang.x),cos(ang.x));
        vec2 a2 = vec2(sin(ang.y),cos(ang.y));
        vec2 a3 = vec2(sin(ang.z),cos(ang.z));
        mat3 m;
        m[0] = vec3(
          a1.y*a3.y+a1.x*a2.x*a3.x,
          a1.y*a2.x*a3.x+a3.y*a1.x,
          -a2.y*a3.x
        );
        m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
        m[2] = vec3(
          a3.y*a1.x*a2.x+a1.y*a3.x,
          a1.x*a3.x-a1.y*a3.y*a2.x,
          a2.y*a3.y
        );
        return m;
      }

      float hash(vec2 p) {
        float h = dot(p,vec2(127.1,311.7));
        return fract(sin(h)*43758.5453123);
      }

      float noise(in vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return -1.0 + 2.0 * mix(
          mix(
            hash(i + vec2(0.0,0.0)
          ),
          hash(i + vec2(1.0,0.0)), u.x),
          mix(hash(i + vec2(0.0,1.0)),
          hash(i + vec2(1.0,1.0)), u.x),
          u.y
        );
      }

      float diffuse(vec3 n,vec3 l,float p) {
        return pow(dot(n,l) * 0.4 + 0.6,p);
      }

      float specular(vec3 n,vec3 l,vec3 e,float s) {
        float nrm = (s + 8.0) / (3.1415 * 8.0);
        return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
      }

      vec3 getSkyColor(vec3 e) {
        e.y = max(e.y, 0.0);
        vec3 ret;
        ret.x = pow(1.0 - e.y, 2.0);
        ret.y = 1.0 - e.y;
        ret.z = 0.6+(1.0 - e.y) * 0.4;
        return ret;
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
        for(int i = 0; i < ITER_GEOMETRY; i++) {
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
        for(int i = 0; i < ITER_FRAGMENT; i++) {
          d = sea_octave((uv+SEA_TIME) * freq, choppy);
          d += sea_octave((uv-SEA_TIME) * freq, choppy);
          h += d * amp;
          uv *= octave_m;
          freq *= 1.9;
          amp *= 0.22;
          choppy = mix(choppy,1.0,0.2);
        }
        return p.y - h;
      }

      vec3 getSeaColor(
        vec3 p,
        vec3 n,
        vec3 l,
        vec3 eye,
        vec3 dist
      ) {
        float fresnel = 1.0 - max(dot(n,-eye),0.0);
        fresnel = pow(fresnel,3.0) * 0.65;

        vec3 reflected = getSkyColor(reflect(eye,n));
        vec3 refracted = SEA_BASE + diffuse(n,l,80.0) * SEA_WATER_COLOR * 0.12;

        vec3 color = mix(refracted,reflected,fresnel);

        float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
        color += SEA_WATER_COLOR * (p.y - u_seaHeight) * 0.18 * atten;

        color += vec3(specular(n,l,eye,60.0));

        return color;
      }

      vec3 getNormal(vec3 p, float eps) {
        vec3 n;
        n.y = map_detailed(p);
        n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
        n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
        n.y = eps;
        return normalize(n);
      }

      void heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {
        float tm = 0.0;
        float tx = 1000.0;
        float hx = map(ori + dir * tx);

        if(hx > 0.0) {
          p = ori + dir * tx;
          return;
        }

        float hm = map(ori + dir * tm);
        float tmid = 0.0;
        p = ori;
        for(int i = 0; i < NUM_STEPS; i++) {
          tmid = mix(tm,tx, hm/(hm-hx));
          p = ori + dir * tmid;
          float hmid = map(p);
          if(hmid < 0.0) {
            tx = tmid;
            hx = hmid;
          } else {
            tm = tmid;
            hm = hmid;
          }
        }
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        uv = uv * 2.0 - 1.0;
        uv.x *= iResolution.x / iResolution.y;
        float time = iGlobalTime * 0.3;

        vec3 ang = vec3(
          sin(time*3.0)*0.1,sin(time)*0.2+0.3,time
        );
        vec3 ori = vec3(0.0,3.5,time*5.0);
        vec3 dir = normalize(
          vec3(uv.xy,-2.0)
        );
        dir.z += length(uv) * 0.15;
        dir = normalize(dir);

        vec3 p;
        heightMapTracing(ori,dir,p);
        vec3 dist = p - ori;
        float eps = 0.1 / iResolution.x;
        vec3 n = getNormal(
          p,
          dot(dist,dist) * eps
        );
        vec3 light = normalize(vec3(0.0,1.0,0.8));

        vec3 color = mix(
          getSkyColor(dir),
          getSeaColor(p,n,light,dir,dist),
          pow(smoothstep(0.0,-0.05,dir.y),0.3)
        );

        gl_FragColor = vec4(pow(color,vec3(0.75)), 1.0);
      }
    `;

    const width = this.elem.offsetWidth || 1920;
    const height = this.elem.offsetHeight || 1080;
    console.log("[Ocean] Creating geometry and material with dimensions:", { width, height });

    this.geometry = new THREE.PlaneGeometry(2, 2);
    console.log("[Ocean] Geometry created");

    try {
      this.material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          iGlobalTime: { value: 0.0 },
          iResolution: { value: new THREE.Vector2(width, height) },
          u_seaHeight: { value: this.seaHeight },
          u_seaChoppy: { value: this.seaChoppy },
          u_seaFreq: { value: this.seaFreq },
          u_seaSpeed: { value: this.speed },
        },
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
      });
      console.log("[Ocean] ShaderMaterial created successfully");
      
      if (this.renderer.getContext) {
        const gl = this.renderer.getContext();
        if (gl) {
          gl.getError();
          console.log("[Ocean] WebGL context available, error check cleared");
        }
      }
    } catch (error) {
      console.error("[Ocean] Failed to create ShaderMaterial:", error);
      console.error("[Ocean] Error details:", {
        message: error.message,
        stack: error.stack
      });
      return;
    }

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.frustumCulled = false;
    const aspect = width / height;
    this.mesh.scale.set(aspect, 1, 1);
    console.log("[Ocean] Mesh created and configured:", {
      position: this.mesh.position.toArray(),
      scale: this.mesh.scale.toArray(),
      aspect: aspect
    });
    
    this.customGroup.add(this.mesh);
    console.log("[Ocean] Mesh added to custom group. Group children count:", this.customGroup.children.length);
  }

  animate() {
    if (this.destroyed || !this.clock || !this.material || !this.renderer || !this.scene || !this.camera) {
      if (!this._animateWarningLogged) {
        console.warn("[Ocean] Animate skipped - missing dependencies:", {
          destroyed: this.destroyed,
          clock: !!this.clock,
          material: !!this.material,
          renderer: !!this.renderer,
          scene: !!this.scene,
          camera: !!this.camera
        });
        this._animateWarningLogged = true;
      }
      return;
    }

    if (!this.rendererInitialized && this.useWebGPU) {
      if (!this._initPromise) {
        console.log("[Ocean] WebGPU renderer not initialized, creating init promise...");
        this._initPromise = this.renderer.init().then(() => {
          this.rendererInitialized = true;
          this._initPromise = null;
          console.log("[Ocean] WebGPU renderer initialized in animate");
        }).catch((error) => {
          console.error("[Ocean] WebGPU init failed in animate:", error);
          this._initPromise = null;
        });
      }
      return;
    }

    if (!this.time) this.time = 0;
    const delta = this.clock.getDelta();
    this.time += delta * this.speed;

    if (this.material && this.material.uniforms) {
      this.material.uniforms.iGlobalTime.value = this.time;

      if (this.elem) {
        const width = this.elem.offsetWidth || this.renderer.domElement.width || 1920;
        const height = this.elem.offsetHeight || this.renderer.domElement.height || 1080;
        this.material.uniforms.iResolution.value.set(width, height);

        const aspect = width / height;
        if (this.mesh) {
          this.mesh.scale.set(aspect, 1, 1);
        }
      }
    }

    if (this.renderer && this.scene && this.camera) {
      try {
        this.renderer.render(this.scene, this.camera);
        if (!this._renderLogged) {
          console.log("[Ocean] First render call successful");
          console.log("[Ocean] Scene info:", {
            children: this.scene.children.length,
            meshInScene: this.scene.children.some(c => c === this.mesh || (c.children && c.children.includes(this.mesh)))
          });
          this._renderLogged = true;
        }
        
        if (this.renderer.getContext) {
          const gl = this.renderer.getContext();
          if (gl) {
            const error = gl.getError();
            if (error !== gl.NO_ERROR && !this._glErrorLogged) {
              console.error("[Ocean] WebGL error after render:", {
                errorCode: error,
                errorName: this.getGLErrorName(gl, error)
              });
              this._glErrorLogged = true;
            }
          }
        }
      } catch (error) {
        if (!this._renderErrorLogged) {
          console.error("[Ocean] Render error:", error);
          console.error("[Ocean] Render error details:", {
            message: error.message,
            stack: error.stack,
            renderer: this.renderer.constructor.name,
            sceneChildren: this.scene.children.length,
            cameraPosition: this.camera.position.toArray()
          });
          this._renderErrorLogged = true;
        }
      }
    }
  }

  getGLErrorName(gl, error) {
    const errorMap = {
      [gl.NO_ERROR]: "NO_ERROR",
      [gl.INVALID_ENUM]: "INVALID_ENUM",
      [gl.INVALID_VALUE]: "INVALID_VALUE",
      [gl.INVALID_OPERATION]: "INVALID_OPERATION",
      [gl.INVALID_FRAMEBUFFER_OPERATION]: "INVALID_FRAMEBUFFER_OPERATION",
      [gl.OUT_OF_MEMORY]: "OUT_OF_MEMORY",
      [gl.CONTEXT_LOST_WEBGL]: "CONTEXT_LOST_WEBGL"
    };
    return errorMap[error] || `UNKNOWN_ERROR_${error}`;
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

console.log("[Ocean] Class definition complete, about to export");
export default Ocean;
console.log("[Ocean] Export complete");
