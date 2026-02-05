/*
@nwWrld name: Audio Superformula
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

const POINTS = 300000;
const BASE_SCALE = 30.0;
const REVOLUTIONS = 200;

const VERTEX_SHADER = `
  attribute float lineDistance;
  uniform float time;
  varying float vDistance;
  varying float vDepth;
  varying vec3 vPos;
  void main() {
    vDistance = lineDistance;
    vPos = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform float time;
  uniform float uFlowSpeed;
  uniform float uAudioPulse;
  uniform vec3 uColorA1;
  uniform vec3 uColorA2;
  uniform vec3 uColorA3;
  uniform vec3 uColorB1;
  uniform vec3 uColorB2;
  uniform vec3 uColorB3;
  uniform float uTransition;
  varying float vDistance;
  varying float vDepth;
  varying vec3 vPos;
  void main() {
    vec3 c1 = mix(uColorA1, uColorB1, uTransition);
    vec3 c2 = mix(uColorA2, uColorB2, uTransition);
    vec3 c3 = mix(uColorA3, uColorB3, uTransition);
    float flowFrequency = 150.0;
    float flow = fract(vDistance * flowFrequency - time * uFlowSpeed);
    float pulse = smoothstep(0.2, 0.98, flow);
    float head = smoothstep(0.95, 1.0, flow) * 3.0;
    vec3 finalColor = c1 * 0.25;
    finalColor += c3 * pulse * (4.0 + uAudioPulse);
    finalColor += c2 * head;
    float alpha = 0.12;
    alpha += pulse * (0.65 + uAudioPulse * 0.3);
    alpha += head;
    float depthFade = 1.0 - smoothstep(100.0, 400.0, vDepth);
    alpha *= depthFade;
    float heightFade = smoothstep(-80.0, 80.0, vPos.y);
    alpha *= (0.6 + 0.4 * heightFade);
    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
  }
`;

const SHAPES = [
  {
    name: "Quantum Star",
    params: { m: 7, n1: 0.2, n2: 1.7, n3: 1.7, a: 1, b: 1 },
    scaleMultiplier: 1.0,
    accent: [0x001133, 0x00ffff, 0x0066ff],
  },
  {
    name: "Hyper-Thorn",
    params: { m: 19, n1: 0.5, n2: 0.2, n3: 0.2, a: 1, b: 1 },
    scaleMultiplier: 1.5,
    accent: [0x220000, 0xff0000, 0xaa0000],
  },
  {
    name: "Void Prism",
    params: { m: 6, n1: 0.4, n2: 1, n3: 1, a: 1, b: 1 },
    scaleMultiplier: 1.2,
    accent: [0x110022, 0xff00ff, 0xaa00ff],
  },
  {
    name: "Cosmic Shell",
    params: { m: 12, n1: 0.5, n2: 0.5, n3: 0.5, a: 1, b: 1 },
    scaleMultiplier: 1.0,
    accent: [0x331100, 0xffaa00, 0xff4400],
  },
  {
    name: "Vortex Flower",
    params: { m: 5, n1: 18, n2: 4, n3: 2, a: 1, b: 1 },
    scaleMultiplier: 1.0,
    accent: [0x220022, 0xff00ff, 0xaa00aa],
  },
];

const SEQUENCE_PRESETS = SHAPES.map((s) => s.name);

function superShape(theta, m, n1, n2, n3, a, b) {
  let t1 = Math.abs((1 / a) * Math.cos((m * theta) / 4));
  t1 = Math.pow(t1, n2);
  let t2 = Math.abs((1 / b) * Math.sin((m * theta) / 4));
  t2 = Math.pow(t2, n3);
  const t3 = t1 + t2;
  return Math.pow(t3, -1 / n1);
}

class AudioSuperformula extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 1.5, type: "number" },
        { name: "audioReactive", defaultVal: true, type: "boolean" },
        { name: "holdTime", defaultVal: 3000, type: "number" },
        { name: "transitionDuration", defaultVal: 2000, type: "number" },
        {
          name: "sequence",
          defaultVal: "Quantum Star",
          type: "select",
          values: SEQUENCE_PRESETS,
        },
      ],
    },
    { name: "setSensitivity", executeOnLoad: false, options: [{ name: "value", defaultVal: 1.5, type: "number" }] },
    { name: "setAudioReactive", executeOnLoad: false, options: [{ name: "enabled", defaultVal: true, type: "boolean" }] },
    {
      name: "setSequence",
      executeOnLoad: false,
      options: [
        {
          name: "value",
          defaultVal: "Quantum Star",
          type: "select",
          values: SEQUENCE_PRESETS,
        },
      ],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = AudioSuperformula.name;
    this.customGroup = new THREE.Group();
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.audioReactive = true;
    this.sensitivity = 1.5;
    this.holdTime = 3000;
    this.transitionDuration = 2000;
    this.sequencePresetIndex = 0;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.line = null;
    this.geometry = null;
    this.material = null;
    this.stars = null;
    this.composer = null;
    this.bloomPass = null;
    this.clock = null;
    this.shapeManager = null;

    this.setCustomAnimate(this.audioAnimateLoop.bind(this));
    this.init();
  }

  async start({
    sensitivity = 1.5,
    audioReactive = true,
    holdTime = 3000,
    transitionDuration = 2000,
    sequence = "Quantum Star",
  } = {}) {
    this.sensitivity = Math.max(0.1, Math.min(5, Number(sensitivity) || 1.5));
    this.audioReactive = Boolean(audioReactive);
    this.holdTime = Math.max(1000, Number(holdTime) || 3000);
    this.transitionDuration = Math.max(500, Number(transitionDuration) || 2000);
    let presetIndex = SEQUENCE_PRESETS.indexOf(String(sequence).trim());
    if (presetIndex < 0) presetIndex = 0;
    this.sequencePresetIndex = presetIndex;

    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();

    if (this.shapeManager) {
      this.shapeManager.holdTime = this.holdTime;
      this.shapeManager.duration = this.transitionDuration;
      this.shapeManager.jumpToIndex(this.sequencePresetIndex);
    }
    this.markNeedsRender();
  }

  init() {
    if (this.destroyed || !this.renderer || !this.scene || !this.camera) return;

    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x050505, 0.001);

    this.clock = new THREE.Clock();
    this.buildGeometry();
    this.buildMaterial();
    this.buildLine();
    this.buildStars();
    this.shapeManager = new ShapeManager(this);
    this.shapeManager.holdTime = this.holdTime;
    this.shapeManager.duration = this.transitionDuration;
    this.shapeManager.jumpToIndex(this.sequencePresetIndex);
    this.geometry.computeBoundingSphere();
    this.geometry.computeBoundingBox();
    this.line.frustumCulled = false;

    this.customGroup.add(this.line);
    this.customGroup.add(this.stars);
    this.createComposer();

    this.setModel(this.customGroup);
  }

  buildGeometry() {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(POINTS * 3);
    const lineDistances = new Float32Array(POINTS);
    for (let i = 0; i < POINTS; i++) lineDistances[i] = i / POINTS;
    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute("lineDistance", new THREE.BufferAttribute(lineDistances, 1));
  }

  buildMaterial() {
    const s = SHAPES[0];
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uFlowSpeed: { value: 4.0 },
        uAudioPulse: { value: 0 },
        uTransition: { value: 0 },
        uColorA1: { value: new THREE.Color(s.accent[0]) },
        uColorA2: { value: new THREE.Color(s.accent[1]) },
        uColorA3: { value: new THREE.Color(s.accent[2]) },
        uColorB1: { value: new THREE.Color(s.accent[0]) },
        uColorB2: { value: new THREE.Color(s.accent[1]) },
        uColorB3: { value: new THREE.Color(s.accent[2]) },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }

  buildLine() {
    this.line = new THREE.Line(this.geometry, this.material);
    this.geometry.computeBoundingSphere();
  }

  buildStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsPositions = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000 * 3; i += 3) {
      starsPositions[i] = THREE.MathUtils.randFloatSpread(2000);
      starsPositions[i + 1] = THREE.MathUtils.randFloatSpread(2000);
      starsPositions[i + 2] = THREE.MathUtils.randFloatSpread(2000);
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.1,
      transparent: true,
    });
    this.stars = new THREE.Points(starsGeometry, starsMaterial);
  }

  createComposer() {
    if (!this.renderer || !this.scene || !this.camera) return;
    const EffectComposer = window.EffectComposer || THREE.EffectComposer;
    const RenderPass = window.RenderPass || THREE.RenderPass;
    const UnrealBloomPass = window.UnrealBloomPass || THREE.UnrealBloomPass;
    const OutputPass = window.OutputPass || THREE.OutputPass;
    if (
      typeof EffectComposer === "undefined" ||
      typeof RenderPass === "undefined" ||
      typeof UnrealBloomPass === "undefined"
    ) {
      return;
    }
    try {
      const size = new THREE.Vector2();
      this.renderer.getSize(size);
      const w = size.x || 1;
      const h = size.y || 1;
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(w, h),
        1.5,
        0.4,
        0.85
      );
      this.bloomPass.threshold = 0.1;
      this.bloomPass.strength = 0.8;
      this.bloomPass.radius = 0.4;
      this.composer.addPass(this.bloomPass);
      if (typeof OutputPass !== "undefined") {
        this.composer.addPass(new OutputPass());
      } else {
        this.bloomPass.renderToScreen = true;
      }
    } catch (err) {
      this.composer = null;
      this.bloomPass = null;
    }
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

  audioAnimateLoop() {
    if (this.destroyed || !this.clock || !this.material || !this.line) return;

    if (this.audioReactive && this.analyzer && this.audioReady) {
      const sens = this.sensitivity || 1.0;
      this.volume = this.analyzer.getVolume() * sens;
      this.bass = this.analyzer.getBass() * sens;
      this.mid = this.analyzer.getMid() * sens;
      this.treble = this.analyzer.getTreble() * sens;
    } else {
      const sens = this.sensitivity || 1.0;
      this.volume = 0.3 * sens;
      this.bass = 0.2 * sens;
      this.mid = 0.3 * sens;
      this.treble = 0.2 * sens;
    }

    const delta = this.clock.getDelta();
    this.material.uniforms.time.value += delta;

    const rotX = 0.1 + this.bass * 0.15;
    const rotY = 0.05 + this.mid * 0.08;
    this.line.rotation.x += delta * rotX;
    this.line.rotation.y += delta * rotY;
    if (this.stars) this.stars.rotation.y += delta * (0.001 + this.treble * 0.0005);

    this.material.uniforms.uFlowSpeed.value = 4.0 + this.treble * 3 + this.volume * 2;
    this.material.uniforms.uAudioPulse.value = this.volume * 0.5 + this.bass * 0.3;

    if (this.bloomPass) {
      this.bloomPass.strength = 0.8 + this.volume * 0.4;
      this.bloomPass.radius = 0.4 + this.treble * 0.1;
    }

    this.shapeManager.update();

    this.markNeedsRender();
  }

  setSensitivity({ value = 1.5 } = {}) {
    const v = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5, Number.isFinite(v) ? v : 1.5));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setSequence({ value = "Quantum Star" } = {}) {
    if (!this.shapeManager) return;
    const name = String(value).trim();
    const idx = SEQUENCE_PRESETS.indexOf(name);
    if (idx >= 0) this.shapeManager.jumpToIndex(idx);
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.stars?.geometry) this.stars.geometry.dispose();
    if (this.stars?.material) this.stars.material.dispose();
    this.line = null;
    this.geometry = null;
    this.material = null;
    this.stars = null;
    this.composer = null;
    this.bloomPass = null;
    this.shapeManager = null;
    super.destroy();
  }
}

class ShapeManager {
  constructor(moduleRef) {
    this.module = moduleRef;
    this.currentIndex = 0;
    this.nextIndex = 1;
    this.transitionStartTime = 0;
    this.isTransitioning = false;
    this.duration = 2000;
    this.holdTime = 3000;
    this.lastSwitchTime = Date.now();
    this.currentParams = { ...SHAPES[0].params };
    this.currentScaleMult = SHAPES[0].scaleMultiplier;
  }

  setInitialState() {
    const s = SHAPES[this.currentIndex];
    const mat = this.module.material;
    if (!mat || !mat.uniforms) return;
    mat.uniforms.uColorA1.value.setHex(s.accent[0]);
    mat.uniforms.uColorA2.value.setHex(s.accent[1]);
    mat.uniforms.uColorA3.value.setHex(s.accent[2]);
    mat.uniforms.uColorB1.value.setHex(s.accent[0]);
    mat.uniforms.uColorB2.value.setHex(s.accent[1]);
    mat.uniforms.uColorB3.value.setHex(s.accent[2]);
    mat.uniforms.uTransition.value = 0;
    this.currentParams = { ...s.params };
    this.currentScaleMult = s.scaleMultiplier;
    this.updateGeometry();
  }

  jumpToIndex(index) {
    const i = Math.max(0, Math.min(index, SHAPES.length - 1));
    this.currentIndex = i;
    this.nextIndex = (i + 1) % SHAPES.length;
    this.isTransitioning = false;
    this.lastSwitchTime = Date.now();
    this.setInitialState();
  }

  updateGeometry() {
    const { geometry } = this.module;
    if (!geometry || !geometry.attributes.position) return;
    const arr = geometry.attributes.position.array;
    const p = this.currentParams;
    const finalScale = BASE_SCALE * this.currentScaleMult;
    let idx = 0;
    for (let i = 0; i < POINTS; i++) {
      const progress = i / POINTS;
      const phi = progress * Math.PI * 2 * REVOLUTIONS;
      const theta = progress * Math.PI - Math.PI / 2;
      const r1 = superShape(phi, p.m, p.n1, p.n2, p.n3, p.a, p.b);
      const r2 = superShape(theta, p.m, p.n1, p.n2, p.n3, p.a, p.b);
      const x = finalScale * r1 * Math.cos(phi) * r2 * Math.cos(theta);
      const y = finalScale * r1 * Math.sin(phi) * r2 * Math.cos(theta);
      const z = finalScale * r2 * Math.sin(theta);
      arr[idx++] = x;
      arr[idx++] = y;
      arr[idx++] = z;
    }
    geometry.attributes.position.needsUpdate = true;
  }

  update() {
    const now = Date.now();
    const mat = this.module.material;
    if (!mat || !mat.uniforms) return;

    if (!this.isTransitioning) {
      if (now - this.lastSwitchTime > this.holdTime) this.startTransition(now);
      return;
    }

    const elapsed = now - this.transitionStartTime;
    const rawProgress = Math.min(elapsed / this.duration, 1.0);
    const progress =
      rawProgress < 0.5
        ? 2 * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;

    mat.uniforms.uTransition.value = progress;

    const startS = SHAPES[this.currentIndex];
    const endS = SHAPES[this.nextIndex];
    this.currentParams.m = THREE.MathUtils.lerp(startS.params.m, endS.params.m, progress);
    this.currentParams.n1 = THREE.MathUtils.lerp(startS.params.n1, endS.params.n1, progress);
    this.currentParams.n2 = THREE.MathUtils.lerp(startS.params.n2, endS.params.n2, progress);
    this.currentParams.n3 = THREE.MathUtils.lerp(startS.params.n3, endS.params.n3, progress);
    this.currentScaleMult = THREE.MathUtils.lerp(
      startS.scaleMultiplier,
      endS.scaleMultiplier,
      progress
    );
    this.updateGeometry();

    if (rawProgress >= 1.0) this.completeTransition(now);
  }

  startTransition(now) {
    this.isTransitioning = true;
    this.transitionStartTime = now;
    const nextTheme = SHAPES[this.nextIndex];
    const mat = this.module.material;
    if (mat?.uniforms) {
      mat.uniforms.uColorB1.value.setHex(nextTheme.accent[0]);
      mat.uniforms.uColorB2.value.setHex(nextTheme.accent[1]);
      mat.uniforms.uColorB3.value.setHex(nextTheme.accent[2]);
    }
  }

  completeTransition(now) {
    this.isTransitioning = false;
    this.lastSwitchTime = now;
    const mat = this.module.material;
    if (mat?.uniforms) {
      mat.uniforms.uTransition.value = 0;
      mat.uniforms.uColorA1.value.copy(mat.uniforms.uColorB1.value);
      mat.uniforms.uColorA2.value.copy(mat.uniforms.uColorB2.value);
      mat.uniforms.uColorA3.value.copy(mat.uniforms.uColorB3.value);
    }
    this.currentIndex = this.nextIndex;
    this.nextIndex = (this.nextIndex + 1) % SHAPES.length;
  }
}

export default AudioSuperformula;
