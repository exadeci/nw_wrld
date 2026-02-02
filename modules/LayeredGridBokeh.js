/*
@nwWrld name: Layered Grid Bokeh
@nwWrld category: Shader
@nwWrld imports: BaseThreeJsModule, THREE
*/

// Layered grid + bokeh/dirt shader.
// TheGrid by dila — https://www.shadertoy.com/view/llcXWr
// The Drive Home (Bokeh) by BigWings — https://www.shadertoy.com/view/MdfBRX

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 iResolution;
  uniform float iTime;

  #define PI 3.141592654

  mat2 rot(float x) {
    return mat2(cos(x), sin(x), -sin(x), cos(x));
  }

  vec2 foldRotate(in vec2 p, in float s) {
    float a = PI / s - atan(p.x, p.y);
    float n = PI * 2. / s;
    a = floor(a / n) * n;
    p *= rot(a);
    return p;
  }

  float sdRect(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
  }

  float tex(vec2 p, float z) {
    p = foldRotate(p, 8.0);
    vec2 q = (fract(p / 10.0) - 0.5) * 10.0;
    for (int i = 0; i < 3; ++i) {
      for (int j = 0; j < 2; j++) {
        q = abs(q) - .25;
        q *= rot(PI * .25);
      }
      q = abs(q) - vec2(1.0, 1.5);
      q *= rot(PI * .25 * z);
      q = foldRotate(q, 3.0);
    }
    float d = sdRect(q, vec2(1., 1.));
    float f = 1.0 / (1.0 + abs(d));
    return smoothstep(.9, 1., f);
  }

  float Bokeh(vec2 p, vec2 sp, float size, float mi, float blur) {
    float d = length(p - sp);
    float c = smoothstep(size, size * (1. - blur), d);
    c *= mix(mi, 1., smoothstep(size * .8, size, d));
    return c;
  }

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
  }

  float dirt(vec2 uv, float n) {
    vec2 p = fract(uv * n);
    vec2 st = (floor(uv * n) + 0.5) / n;
    vec2 rnd = hash(st);
    return Bokeh(p, vec2(0.5, 0.5) + vec2(0.2) * rnd, 0.05, abs(rnd.y * 0.4) + 0.3, 0.25 + rnd.x * rnd.y * 0.2);
  }

  float sm(float start, float end, float t, float smo) {
    return smoothstep(start, start + smo, t) - smoothstep(end - smo, end, t);
  }

  void main() {
    vec2 uv = vUv;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    uv *= 2.0;

    vec3 col = vec3(0.0);

    #define N 6
    #define NN float(N)
    #define INTERVAL 3.0

    float time = iTime;

    for (int i = 0; i < N; i++) {
      float t;
      float ii = float(N - i);

      t = ii * INTERVAL - mod(time - INTERVAL * 0.75, INTERVAL);
      vec3 intensity = vec3((NN * INTERVAL - t) / (NN * INTERVAL));
      col = mix(col, intensity, dirt(mod(uv * max(0.0, t) * 0.1 + vec2(.2, -.2) * time, 1.2), 3.5));

      t = ii * INTERVAL - mod(time + INTERVAL * 0.5, INTERVAL);
      intensity = vec3((NN * INTERVAL - t) / (NN * INTERVAL));
      col = mix(col, intensity * vec3(0.7, 0.8, 1.0) * 1.3, tex(uv * max(0.0, t), 4.45));

      t = ii * INTERVAL - mod(time - INTERVAL * 0.25, INTERVAL);
      intensity = vec3((NN * INTERVAL - t) / (NN * INTERVAL));
      col = mix(col, intensity * vec3(1.), dirt(mod(uv * max(0.0, t) * 0.1 + vec2(-.2, -.2) * time, 1.2), 3.5));

      t = ii * INTERVAL - mod(time, INTERVAL);
      intensity = vec3((NN * INTERVAL - t) / (NN * INTERVAL));
      float r = length(uv * 2.0 * max(0.0, t));
      float rr = sm(-24.0, -0.0, (r - mod(time * 30.0, 90.0)), 10.0);
      col = mix(col, mix(intensity * vec3(1.), intensity * vec3(0.7, 0.5, 1.0) * 3.0, rr), tex(uv * 2.0 * max(0.0, t), 0.27 + (2.0 * rr)));
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

class LayeredGridBokeh extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
      ],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = LayeredGridBokeh.name;
    this.customGroup = new THREE.Group();
    this.speed = 1.0;
    this.destroyed = false;
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.clock = null;
  }

  async start({ speed = 1.0 } = {}) {
    const val = Number(speed);
    this.speed = Number.isFinite(val) ? Math.max(0.1, Math.min(5, val)) : 1.0;

    if (!this.renderer || !this.scene || !this.camera) return;

    const w = Math.max(this.elem?.offsetWidth || 0, 1);
    const h = Math.max(this.elem?.offsetHeight || 0, 1);
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (this.renderer.domElement) {
      this.renderer.domElement.style.display = "block";
      this.renderer.domElement.style.width = "100%";
      this.renderer.domElement.style.height = "100%";
    }

    if (!this.rendererInitialized && this.useWebGPU) {
      await this.renderer.init();
      this.rendererInitialized = true;
    }

    this.renderer.setClearColor(0x000000, 1);
    this.clock = new THREE.Clock();
    this.createShaderPlane();

    if (!this.mesh || !this.material) return;

    await this.setModel(this.customGroup);

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
    if (typeof this.show === "function") this.show();
  }

  createShaderPlane() {
    if (this.mesh) {
      if (this.customGroup) this.customGroup.remove(this.mesh);
      if (this.geometry) this.geometry.dispose();
      if (this.material) this.material.dispose();
    }

    const width = Math.max(this.elem?.offsetWidth || 1920, 1);
    const height = Math.max(this.elem?.offsetHeight || 1080, 1);

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        iResolution: { value: new THREE.Vector2(width, height) },
        iTime: { value: 0 },
      },
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.frustumCulled = false;
    this.customGroup.add(this.mesh);
  }

  animate() {
    if (this.destroyed || !this.clock || !this.material || !this.renderer || !this.scene || !this.camera) return;

    const elapsed = this.clock.getElapsedTime();
    const t = elapsed * this.speed;

    const u = this.material.uniforms;
    if (u) {
      u.iTime.value = t;
      if (this.elem) {
        const w = Math.max(this.elem.offsetWidth || this.renderer.domElement?.width || 1920, 1);
        const h = Math.max(this.elem.offsetHeight || this.renderer.domElement?.height || 1080, 1);
        u.iResolution.value.set(w, h);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  setSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.speed = Math.max(0.1, Math.min(5, Number.isFinite(val) ? val : 1.0));
  }

  destroy() {
    this.destroyed = true;
    if (this.mesh && this.customGroup) this.customGroup.remove(this.mesh);
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    super.destroy();
  }
}

export default LayeredGridBokeh;
