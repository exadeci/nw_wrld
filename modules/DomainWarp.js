/*
@nwWrld name: DomainWarp
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vUv;
uniform vec2 iResolution;
uniform float iTime;
uniform float uBass;
uniform float uMids;
uniform vec3 uBaseColor;
uniform vec3 uAccentColor;
uniform vec3 uHighlightColor;

// ---- NOISE FUNCTIONS ----
float noise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float res = mix(mix(fract(sin(dot(i + vec2(0.0,0.0), vec2(12.9898,78.233)))*43758.5453123),
                      fract(sin(dot(i + vec2(1.0,0.0), vec2(12.9898,78.233)))*43758.5453123),f.x),
                  mix(fract(sin(dot(i + vec2(0.0,1.0), vec2(12.9898,78.233)))*43758.5453123),
                      fract(sin(dot(i + vec2(1.0,1.0), vec2(12.9898,78.233)))*43758.5453123),f.x),f.y);
  return res;
}

float fbm(in vec2 p) {
  float f = 0.0;
  f += 0.5000*noise(p); p = p*2.02 + vec2(0.15);
  f += 0.2500*noise(p); p = p*2.03 + vec2(0.15);
  f += 0.1250*noise(p); p = p*2.01 + vec2(0.15);
  f += 0.0625*noise(p);
  return f/0.9375;
}

void main() {
  vec2 fragCoord = vUv * iResolution.xy;
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;

  float bass = uBass;
  float mids = uMids;
  float bassActivity = smoothstep(0.3, 0.7, bass) * 1.5;
  float midActivity = pow(mids, 2.0) * 2.0;

  vec2 p = uv * 3.0;
  vec2 q = vec2(fbm(p + iTime * 0.2),
                fbm(p + vec2(5.2, 1.3) - iTime * 0.1));
  vec2 r = vec2(fbm(p + 4.0*q + vec2(1.7, 9.2) + bassActivity + iTime*0.5),
                fbm(p + 4.0*q + vec2(8.3, 2.8) - bassActivity + iTime*0.3));
  float f = fbm(p + 4.0*r);

  vec3 col = mix(uBaseColor, uAccentColor, f);
  float highlight = dot(r, r);
  col = mix(col, uHighlightColor, highlight * highlight * 0.8);
  col *= (0.8 + midActivity * 1.2);
  col = col * col * 3.8;
  col *= 1.0 - length(uv) * 0.4;

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToVec3(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return new THREE.Vector3(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    );
  }
  return new THREE.Vector3(1, 1, 1);
}

class DomainWarp extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
        { name: "baseColor", defaultVal: "#141a4d", type: "color" },
        { name: "accentColor", defaultVal: "#3366cc", type: "color" },
        { name: "highlightColor", defaultVal: "#e6b34d", type: "color" },
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
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setBaseColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#141a4d", type: "color" }],
    },
    {
      name: "setAccentColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#3366cc", type: "color" }],
    },
    {
      name: "setHighlightColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#e6b34d", type: "color" }],
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

    this.name = DomainWarp.name;
    this.customGroup = new THREE.Group();
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.speed = 1.0;
    this.audioReactive = true;
    this.baseColor = "#141a4d";
    this.accentColor = "#3366cc";
    this.highlightColor = "#e6b34d";
    this.bass = 0;
    this.mids = 0;
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.clock = null;
    this.destroyed = false;
  }

  async start({
    sensitivity = 2.0,
    speed = 1.0,
    baseColor = "#141a4d",
    accentColor = "#3366cc",
    highlightColor = "#e6b34d",
  } = {}) {
    const sensVal = Number(sensitivity);
    const speedVal = Number(speed);
    this.sensitivity = Number.isFinite(sensVal) ? Math.max(0.1, Math.min(5, sensVal)) : 2.0;
    this.speed = Number.isFinite(speedVal) ? Math.max(0.1, Math.min(5, speedVal)) : 1.0;
    this.baseColor = String(baseColor || "#141a4d");
    this.accentColor = String(accentColor || "#3366cc");
    this.highlightColor = String(highlightColor || "#e6b34d");

    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();

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
    this.updateColorUniforms();
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
        uBass: { value: 0 },
        uMids: { value: 0 },
        uBaseColor: { value: hexToVec3(this.baseColor) },
        uAccentColor: { value: hexToVec3(this.accentColor) },
        uHighlightColor: { value: hexToVec3(this.highlightColor) },
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

  updateColorUniforms() {
    if (!this.material || !this.material.uniforms) return;
    this.material.uniforms.uBaseColor.value.copy(hexToVec3(this.baseColor));
    this.material.uniforms.uAccentColor.value.copy(hexToVec3(this.accentColor));
    this.material.uniforms.uHighlightColor.value.copy(hexToVec3(this.highlightColor));
  }

  animate() {
    if (this.destroyed || !this.clock || !this.material || !this.renderer || !this.scene || !this.camera) return;

    const elapsed = this.clock.getElapsedTime();
    const t = elapsed * this.speed;

    let bass = 0.3, mids = 0.3;
    if (this.audioReactive && this.analyzer && this.audioReady) {
      bass = this.analyzer.getBass() * this.sensitivity;
      mids = this.analyzer.getMid() * this.sensitivity;
    }

    const u = this.material.uniforms;
    if (u) {
      u.iTime.value = t;
      u.uBass.value = bass;
      u.uMids.value = mids;
      if (this.elem) {
        const w = Math.max(this.elem.offsetWidth || this.renderer.domElement?.width || 1920, 1);
        const h = Math.max(this.elem.offsetHeight || this.renderer.domElement?.height || 1080, 1);
        u.iResolution.value.set(w, h);
      }
    }

    this.renderer.render(this.scene, this.camera);
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

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5, Number.isFinite(val) ? val : 2.0));
  }

  setSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.speed = Math.max(0.1, Math.min(5, Number.isFinite(val) ? val : 1.0));
  }

  setBaseColor({ color = "#141a4d" } = {}) {
    this.baseColor = String(color || "#141a4d");
    this.updateColorUniforms();
  }

  setAccentColor({ color = "#3366cc" } = {}) {
    this.accentColor = String(color || "#3366cc");
    this.updateColorUniforms();
  }

  setHighlightColor({ color = "#e6b34d" } = {}) {
    this.highlightColor = String(color || "#e6b34d");
    this.updateColorUniforms();
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
      if (typeof this.analyzer.destroy === "function") this.analyzer.destroy();
      this.analyzer = null;
    }
    if (this.mesh && this.customGroup) this.customGroup.remove(this.mesh);
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    super.destroy();
  }
}

export default DomainWarp;
