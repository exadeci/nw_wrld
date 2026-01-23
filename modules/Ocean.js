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
    if (!THREE) return;

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
  }

  async start({
    speed = 1.0,
    seaHeight = 0.6,
    seaChoppy = 1.0,
    seaFreq = 0.16,
  } = {}) {
    this.speed = Math.max(0.1, Math.min(5.0, Number(speed) || 1.0));
    this.seaHeight = Math.max(0.1, Math.min(2.0, Number(seaHeight) || 0.6));
    this.seaChoppy = Math.max(0.1, Math.min(3.0, Number(seaChoppy) || 1.0));
    this.seaFreq = Math.max(0.01, Math.min(0.5, Number(seaFreq) || 0.16));

    if (!this.renderer || !this.scene || !this.camera) {
      console.error("Ocean: Renderer, scene, or camera not available");
      return;
    }

    this.renderer.setClearColor(0x000000, 0);
    this.clock = new THREE.Clock();

    this.createShaderPlane();

    if (!this.mesh || !this.material) {
      console.error("Ocean: Failed to create shader plane");
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
        console.warn("Ocean: Could not import animationManager, using custom animate only");
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

    // FIXED: Using standard matrices like Bloom to ensure it renders in the camera view
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
      
      uniform float iGlobalTime;
      uniform vec2 iResolution;
      uniform float u_seaHeight;
      uniform float u_seaChoppy;
      uniform float u_seaFreq;
      uniform float u_seaSpeed;
      
      const int ITER_GEOMETRY = 3;
      const int ITER_FRAGMENT = 5;
      const float PI = 3.141592;
      
      // Colors
      const vec3 BASE_COLOR = vec3(0.0, 0.05, 0.1); 
      const vec3 WATER_COLOR = vec3(0.4, 0.6, 0.7); 
      const vec3 SKY_COLOR = vec3(0.6, 0.7, 0.8);
      
      float SEA_TIME = iGlobalTime * u_seaSpeed;
      mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

      float hash(vec2 p) {
        float h = dot(p,vec2(127.1,311.7));
        return fract(sin(h)*43758.5453123);
      }

      float noise(in vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return -1.0 + 2.0 * mix(
          mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
          mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
          u.y
        );
      }

      float diffuse(vec3 n,vec3 l,float p) {
        return pow(dot(n,l) * 0.4 + 0.6,p);
      }

      float specular(vec3 n,vec3 l,vec3 e,float s) {
        float nrm = (s + 8.0) / (PI * 8.0);
        return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
      }

      vec3 getSkyColor(vec3 e) {
        e.y = max(e.y, 0.0);
        return vec3(pow(1.0 - e.y, 2.0), 1.0 - e.y, 0.6 + (1.0 - e.y) * 0.4) * SKY_COLOR; 
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

      vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {
        float fresnel = 1.0 - max(dot(n,-eye),0.0);
        fresnel = pow(fresnel,3.0) * 0.65;
        
        vec3 reflected = getSkyColor(reflect(eye,n));
        vec3 refracted = BASE_COLOR + diffuse(n,l,80.0) * WATER_COLOR * 0.12;
        vec3 color = mix(refracted, reflected, fresnel);

        float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
        color += WATER_COLOR * (p.y - u_seaHeight) * 0.18 * atten;
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
        for(int i = 0; i < 8; i++) {
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
        // FIXED: Use vUv (Texture space) instead of gl_FragCoord (Screen space)
        // to ensure the water stays attached to the plane.
        vec2 uv = vUv * 2.0 - 1.0;
        
        // Correct aspect ratio so waves aren't stretched
        uv.x *= iResolution.x / iResolution.y;
        
        float time = iGlobalTime * 0.3;

        // Camera Ray Generation
        vec3 ang = vec3(sin(time*3.0)*0.1, sin(time)*0.2+0.3, time);
        vec3 ori = vec3(0.0, 3.5, time*5.0);
        
        // Ray direction
        vec3 dir = normalize(vec3(uv.xy, -2.0));
        dir.z += length(uv) * 0.15; // Lens distortion
        dir = normalize(dir);

        vec3 p;
        heightMapTracing(ori, dir, p);
        vec3 dist = p - ori;
        
        float eps = 0.1 / iResolution.x;
        vec3 n = getNormal(p, dot(dist,dist) * eps);
        vec3 light = normalize(vec3(0.0, 1.0, 0.8));

        vec3 color = mix(
          getSkyColor(dir),
          getSeaColor(p, n, light, dir, dist),
          pow(smoothstep(0.0, -0.05, dir.y), 0.3)
        );

        gl_FragColor = vec4(pow(color, vec3(0.75)), 1.0);
      }
    `;

    const width = this.elem.offsetWidth || 1920;
    const height = this.elem.offsetHeight || 1080;

    this.geometry = new THREE.PlaneGeometry(2, 2);

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
      depthWrite: false,
      depthTest: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.frustumCulled = false;
    
    // Scale mesh to match aspect ratio like Bloom does
    const aspect = width / height;
    this.mesh.scale.set(aspect, 1, 1);
    
    this.customGroup.add(this.mesh);
  }

  updateShaderUniforms(delta, time) {
    if (!this.time) this.time = 0;
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
  }

  animate() {
    if (this.destroyed || !this.clock || !this.material || !this.renderer || !this.scene || !this.camera) return;

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

export default Ocean;
