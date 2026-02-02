/*
@nwWrld name: Liquid Chrome Void
@nwWrld category: Shader
@nwWrld imports: BaseThreeJsModule, THREE
*/

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;

  varying vec2 vUv;

  float random(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  #define OCTAVES 6
  float fbm(in vec2 st) {
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.0;
    for (int i = 0; i < OCTAVES; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= .5;
    }
    return value;
  }

  vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
  }

  void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    st.x *= uResolution.x / uResolution.y;

    vec2 q = vec2(0.0);
    q.x = fbm( st + 0.00 * uTime);
    q.y = fbm( st + vec2(1.0));

    vec2 r = vec2(0.0);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*uTime);
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*uTime);

    float f = fbm(st+r);

    vec3 color = palette(f,
      vec3(0.5, 0.5, 0.5),
      vec3(0.5, 0.5, 0.5),
      vec3(1.0, 1.0, 1.0),
      vec3(0.00, 0.33, 0.67)
    );

    color = mix(color, vec3(0.1, 0.0, 0.2), clamp(length(q),0.0,1.0));
    color = mix(color, vec3(0.0, 1.0, 1.0), clamp(length(r.x),0.0,1.0));

    float vig = 1.0 - length(vUv - 0.5) * 1.5;
    color *= vig;

    gl_FragColor = vec4((f*f*f+.6*f*f+.5*f)*color, 1.0);
  }
`;

class LiquidChromeVoid extends BaseThreeJsModule {
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

    this.name = "Liquid Chrome Void";
    this.customGroup = new THREE.Group();

    this.speed = 1.0;
    this.time = 0;
    this.clock = null;
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.orthoCamera = null;
    this.rafId = null;
    this.destroyed = false;
  }

  async start({ speed = 1.0 } = {}) {
    const val = Number(speed);
    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.0));

    if (!this.renderer || !this.scene) {
      console.error("LiquidChromeVoid: Renderer or scene not available");
      return;
    }

    this.renderer.setClearColor(0x000000, 1);

    const w = this.elem.offsetWidth || 1920;
    const h = this.elem.offsetHeight || 1080;

    this.clock = new THREE.Clock();

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(w, h) },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.customGroup.add(this.mesh);

    await this.setModel(this.customGroup);

    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.camera = this.orthoCamera;

    this.setCustomAnimate(() => {});

    const loop = () => {
      this.rafId = requestAnimationFrame(loop);
      if (this.destroyed || !this.clock || !this.material || !this.renderer || !this.scene || !this.camera) return;

      const delta = this.clock.getDelta();
      this.time += delta * 0.01 * 60 * this.speed;

      if (this.material.uniforms) {
        this.material.uniforms.uTime.value = this.time;
        const ww = this.elem.offsetWidth || this.renderer.domElement.width || 1920;
        const hh = this.elem.offsetHeight || this.renderer.domElement.height || 1080;
        this.material.uniforms.uResolution.value.set(ww, hh);
      }

      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  setSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.0));
  }

  destroy() {
    this.destroyed = true;

    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.mesh && this.scene) {
      this.scene.remove(this.customGroup);
    }
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.orthoCamera = null;

    super.destroy();
  }
}

export default LiquidChromeVoid;
