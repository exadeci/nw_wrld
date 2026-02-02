/*
@nwWrld name: Audio Octgrams
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

  float gTime = 0.;
  const float REPEAT = 5.0;

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c,s,-s,c);
  }

  float sdBox( vec3 p, vec3 b )
  {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
  }

  float box(vec3 pos, float scale) {
    pos *= scale;
    float base = sdBox(pos, vec3(.4,.4,.1)) /1.5;
    pos.xy *= 5.;
    pos.y -= 3.5;
    pos.xy *= rot(.75);
    float result = -base;
    return result;
  }

  float box_set(vec3 pos, float iTime) {
    vec3 pos_origin = pos;
    float bassAmp = 1.0 + uAudioBands.x * 1.2;
    float timeScale = 0.4 + uEnergy * 0.2;
    pos = pos_origin;
    pos .y += sin(gTime * timeScale) * 2.5 * bassAmp;
    pos.xy *=   rot(.8);
    float box1 = box(pos,2. - abs(sin(gTime * timeScale)) * 1.5);
    pos = pos_origin;
    pos .y -=sin(gTime * timeScale) * 2.5 * bassAmp;
    pos.xy *=   rot(.8);
    float box2 = box(pos,2. - abs(sin(gTime * timeScale)) * 1.5);
    pos = pos_origin;
    pos .x +=sin(gTime * timeScale) * 2.5 * bassAmp;
    pos.xy *=   rot(.8);
    float box3 = box(pos,2. - abs(sin(gTime * timeScale)) * 1.5);
    pos = pos_origin;
    pos .x -=sin(gTime * timeScale) * 2.5 * bassAmp;
    pos.xy *=   rot(.8);
    float box4 = box(pos,2. - abs(sin(gTime * timeScale)) * 1.5);
    pos = pos_origin;
    pos.xy *=   rot(.8);
    float box5 = box(pos,.5) * 6.;
    pos = pos_origin;
    float box6 = box(pos,.5) * 6.;
    float result = max(max(max(max(max(box1,box2),box3),box4),box5),box6);
    return result;
  }

  float map(vec3 pos, float iTime) {
    vec3 pos_origin = pos;
    float box_set1 = box_set(pos, iTime);
    return box_set1;
  }

  void main() {
    vec2 fragCoord = vUv * iResolution;
    vec2 p = (fragCoord * 2. - iResolution.xy) / min(iResolution.x, iResolution.y);
    vec3 ro = vec3(0., -0.2 ,iTime * 4.);
    vec3 ray = normalize(vec3(p, 1.5));
    ray.xy = ray.xy * rot(sin(iTime * .03) * 5.);
    ray.yz = ray.yz * rot(sin(iTime * .05) * .2);
    float t = 0.1;
    vec3 col = vec3(0.);
    float ac = 0.0;

    for (int i = 0; i < 99; i++){
      vec3 pos = ro + ray * t;
      pos = mod(pos-2., 4.) -2.;
      gTime = iTime -float(i) * 0.01;

      float d = map(pos, iTime);

      d = max(abs(d), 0.01);
      ac += exp(-d*23.);

      t += d* 0.55;
    }

    col = vec3(ac * 0.02);

    float greenPulse = 0.2 * abs(sin(iTime)) + uAudioBands.y * 0.3;
    float bluePulse = 0.5 + sin(iTime) * 0.2 + uAudioBands.z * 0.25;
    col += vec3(0., greenPulse, bluePulse);

    float alpha = 1.0 - t * (0.02 + 0.02 * sin(iTime) + uEnergy * 0.02);
    gl_FragColor = vec4(col, alpha);
  }
`;

class AudioOctgrams extends BaseThreeJsModule {
  static category = "Audio";
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 10.0 },
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
        { name: "audioReactive", defaultVal: true, type: "boolean" },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 10.0 }],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
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

    this.name = AudioOctgrams.name;
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

  async start({ sensitivity = 2.0, speed = 1.0, audioReactive = true } = {}) {
    const sensVal = Number(sensitivity);
    this.sensitivity = Number.isFinite(sensVal) ? Math.max(0.1, Math.min(10, sensVal)) : 2.0;
    const speedVal = Number(speed);
    this.speed = Number.isFinite(speedVal) ? Math.max(0.1, Math.min(5, speedVal)) : 1.0;
    this.audioReactive = Boolean(audioReactive);

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
      transparent: true,
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

  setSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.speed = Math.max(0.1, Math.min(5, Number.isFinite(val) ? val : 1.0));
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

export default AudioOctgrams;
