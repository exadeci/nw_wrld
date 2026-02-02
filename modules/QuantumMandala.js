/*
@nwWrld name: QuantumMandala
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
  precision highp float;

  varying vec2 vUv;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec3 uAudioBands;
  uniform float uEnergy;

  #define PI 3.14159265359
  #define TAU 6.28318530718

  float glow(float d, float w){ return clamp(w/max(w,d),0.,1.); }
  mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
  float hash21(vec2 p){ p=fract(p*vec2(13.81,741.76)); p+=dot(p,p+42.23); return fract(p.x*p.y); }

  float sdCircle(vec2 p, float r){ return length(p)-r; }

  float sdBox(vec2 p, vec2 b){
    vec2 d = abs(p)-b;
    return length(max(d,0.0))+min(max(d.x,d.y),0.0);
  }

  float sdTri(vec2 p){
    const float k = 1.732;
    p.x = abs(p.x)-1.0;
    p.y = p.y+1.0/k;
    if(p.x+k*p.y>0.0) p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp(p.x,-2.0,0.0);
    return -length(p)*sign(p.y);
  }

  vec3 palette(float t){
    return 0.5 + 0.5*cos(TAU*(t+vec3(0.0,0.33,0.67)));
  }

  float shatter(vec2 p){
    vec2 id = floor(p);
    float h = hash21(id)*uEnergy;
    vec2 fp = fract(p)-0.5;
    float d = length(fp*(0.6+0.4*sin(h+iTime))) - 0.25;
    return smoothstep(0.02,0.0,abs(d)) * (0.3+0.7*h);
  }

  void main() {
    vec2 uv = (vUv * iResolution.xy - 0.5 * iResolution.xy) / min(iResolution.y, iResolution.x);
    uv.y *= -1.0;

    float bass = uAudioBands.x;
    float mid  = uAudioBands.y;
    float high = uAudioBands.z;

    float t = iTime*0.25;

    float a = atan(uv.y,uv.x);
    float r = length(uv);
    float k = 6.0 + floor(mid*6.0);
    a = mod(a, TAU/k) - TAU/(2.0*k);
    uv = vec2(cos(a),sin(a))*r;

    vec2 p = uv * rot(t*0.3);
    float dC = sdCircle(p, 0.22+0.05*bass);
    float dT = sdTri(p*3.0)/(3.0);
    float dB = sdBox(p, vec2(0.20+0.04*mid));

    float m1 = smoothstep(0.2,0.8,mid);
    float m2 = smoothstep(0.3,0.9,high);
    float d = mix(dC,dT,m1);
    d = mix(d,dB,m2);

    float core = glow(abs(d),0.01)*(0.7+bass*1.8);
    float ring = glow(abs(r-0.5-0.05*sin(t+mid)),0.01)*(0.5+high);

    float flow = sin(p.x*4.0 + t + bass*2.0)
               + sin(p.y*3.0 - t*1.2 + mid*2.0);
    flow /= 2.0;
    float ribbon = smoothstep(0.05,0.0,abs(flow));

    vec2 sp = uv*8.0*rot(t*0.2);
    float sh = 0.0;
    for(float i=0.0;i<4.0;i++){
        sh += shatter(sp + vec2(i*1.3, -i*0.7));
    }
    sh *= (0.3+0.7*high);

    float energy = ribbon*0.8 + core + ring*0.9 + sh*0.6;
    float hue = t*0.1 + r*0.4 + mid*0.35 + sh*0.2;
    vec3 col = palette(hue);
    col *= energy*2.4;
    col += vec3(0.03,0.04,0.06);
    col *= smoothstep(1.1,0.3,r);

    gl_FragColor = vec4(col,1.0);
  }
`;

class QuantumMandala extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 10.0 },
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 10.0 }],
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

    this.name = QuantumMandala.name;
    this.customGroup = new THREE.Group();
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.speed = 1.0;
    this.audioReactive = true;
    this.destroyed = false;
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.clock = null;
  }

  async start({ sensitivity = 2.0, speed = 1.0 } = {}) {
    const sensVal = Number(sensitivity);
    this.sensitivity = Number.isFinite(sensVal) ? Math.max(0.1, Math.min(10, sensVal)) : 2.0;
    this.speed = Number.isFinite(Number(speed)) ? Math.max(0.1, Math.min(5, Number(speed))) : 1.0;

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
        uAudioBands: { value: new THREE.Vector3(0.5, 0.4, 0.3) },
        uEnergy: { value: 0.5 },
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

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    const t = elapsed * this.speed;

    let bass = 0.5, mid = 0.4, high = 0.3, vol = 0.5;
    if (this.audioReactive && this.analyzer && this.audioReady) {
      vol = this.analyzer.getVolume() * this.sensitivity;
      bass = this.analyzer.getBass() * this.sensitivity;
      mid = this.analyzer.getMid() * this.sensitivity;
      high = this.analyzer.getTreble() * this.sensitivity;
    } else {
      bass = 0.5 + 0.3 * Math.sin(t * 2);
      mid = 0.4 + 0.2 * Math.cos(t * 1.5);
      high = 0.3 + 0.2 * Math.sin(t * 3);
      vol = 0.5;
    }

    const u = this.material.uniforms;
    if (u) {
      u.iTime.value = t;
      u.uAudioBands.value.set(bass, mid, high);
      u.uEnergy.value = vol;
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
    this.sensitivity = Math.max(0.1, Math.min(10, Number.isFinite(val) ? val : 2.0));
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

export default QuantumMandala;
