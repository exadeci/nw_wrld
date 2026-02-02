/*
@nwWrld name: Dancing Glow Lights
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

// Fork: Dancing Glow Lights 0.1.230824 by QuantumSuper
// Forked from Glow Lights 0.5.230821 by QuantumSuper
// auto-vj of a 2.5d arrangement of lights & particles circling an invisible sphere
// - use with music in iChannel0 -

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
  uniform float iFrame;
  uniform vec4 uFft;
  uniform vec4 uFfts;

  #define PI 3.14159265359
  #define aTime 2.5*iTime
  vec4 fft, ffts;

  mat2 rotM(float r){float c = cos(r), s = sin(r); return mat2(c,s,-s,c);}
  float hash21(vec2 p){p = fract(p*vec2(13.81,741.76)); p += dot(p, p+42.23); return fract(p.x*p.y);}

  void compressFft() {
    fft = uFft;
    ffts = uFfts;
  }

  float particle(vec2 p) {
    return smoothstep( .1, .0, length(p)) * smoothstep( .1, .06, length(p-vec2(0.,.02)));
  }

  float particleLayer(vec2 p) {
    float id = hash21(floor(p));
    return smoothstep(0.,1.,id) *
        particle((fract(p)-vec2(.5+.4*cos(id*iTime),.5+.4*sin(.8*id*iTime))) * rotM((id-fft.x)*2.*PI)/vec2(cos(.5*id*iTime),1));
  }

  void main() {
    vec2 fragCoord = vUv * iResolution;
    vec4 fragColor;

    compressFft();
    vec2 uv = (2.*fragCoord-iResolution.xy) / max(iResolution.x, iResolution.y);
    vec3 col = vec3(0);

    vec3 p;
    vec3 camPos = vec3(0,0,-1.3+(.3*sin(aTime/16.)));
    float v1, v2;
    const float a = 11.;
    for (float n=1.;n<a;n++) {
      v1 = aTime + n/a*PI*4. - fft.x*n/a*1.;
      v2 = iTime + n/a*PI + fft.y*mod(1.-n*2./a,2.)*1.;
      p = vec3( cos(v1)*cos(v2), sin(v1)*cos(v2), sin(v2)) * .5*max(ffts.w,fft.x);
      p.yz *= rotM(n);
      col += 1./((p.z-camPos.z)*(p.z-camPos.z)+dot(p.xy,p.xy)) *
          .001*(.8+1.*fft.x*fft.x) / max( .001, length(uv-camPos.xy-p.xy/(p.z-camPos.z)) - .02/(p.z-camPos.z)) *
          (.5 + clamp( .01/max( .001, length(uv-camPos.xy-p.xy/(p.z-camPos.z)+.005*normalize(p.xy))), .0, .9)) *
          (vec3(mod(n+.5,2.),mod(n,2.),mod(n*PI,2.))*ffts.xyz*.5 + .5*vec3(ffts.x<=ffts.y,ffts.y<=ffts.z,ffts.z<=ffts.x));
    }

    uv *= rotM(iTime*.1-.5*length(uv));
    float aFrac, amp = 0.;
    for (float n=0.;n<4.;n++) {
      aFrac = fract(-.05*iTime+.25*n)-.02*fft.w*fft.w*fft.w;
      amp += 1.4*(.2+.8*fft.z)*particleLayer( (uv*mix(1.,length(uv),ffts.w)+n*vec2(.1,.05))*25.*aFrac) * smoothstep(1.,.33,aFrac) * (.1+.9*smoothstep(.33,.66,aFrac));
    }
    col *= (1. + amp*40.*(1.+.5*fft.x*fft.x*fft.x/abs(length(uv)-fract(aTime)*1.15)));
    col += .05*step(.95, fft.x)*hash21(vec2(aTime,iFrame))*mod(float(iFrame),2.)/abs(length(uv)-fract(aTime+.1)*1.15);

    col *= .3*hash21(uv*iTime) + .7;
    col -= length(uv) * .005;
    col = pow(col, vec3(.4545));
    fragColor = vec4(col,1.);
    gl_FragColor = fragColor;
  }
`;

class DancingGlowLights extends BaseThreeJsModule {
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

    this.name = DancingGlowLights.name;
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
    this.frameCount = 0;
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

    const defaultFft = new THREE.Vector4(0.3, 0.3, 0.3, 0.3);
    const defaultFfts = new THREE.Vector4(0.1, 0.1, 0.1, 0.3);

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        iResolution: { value: new THREE.Vector2(width, height) },
        iTime: { value: 0 },
        iFrame: { value: 0 },
        uFft: { value: defaultFft.clone() },
        uFfts: { value: defaultFfts.clone() },
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
    this.frameCount += 1;

    let bass = 0.3, mid = 0.3, high = 0.3, vol = 0.3;
    if (this.audioReactive && this.analyzer && this.audioReady) {
      vol = this.analyzer.getVolume() * this.sensitivity;
      bass = this.analyzer.getBass() * this.sensitivity;
      mid = this.analyzer.getMid() * this.sensitivity;
      high = this.analyzer.getTreble() * this.sensitivity;
    } else {
      bass = 0.3 + 0.2 * Math.sin(t * 2);
      mid = 0.3 + 0.2 * Math.cos(t * 1.5);
      high = 0.3 + 0.2 * Math.sin(t * 3);
      vol = 0.3 + 0.2 * Math.sin(t);
    }

    // Map analyzer bands to FFT vec4s (shader expects: fft.x=bass, fft.y=speech, fft.z=presence, fft.w=brilliance; ffts.xyz=speech split, ffts.w=overall)
    const fftX = Math.min(1, bass);
    const fftY = Math.min(1, mid);
    const fftZ = Math.min(1, high);
    const fftW = Math.min(1, high);
    const speech = mid;
    const fftsX = speech / 3;
    const fftsY = speech / 3;
    const fftsZ = speech / 3;
    const fftsW = Math.min(1, vol);

    const u = this.material.uniforms;
    if (u) {
      u.iTime.value = t;
      u.iFrame.value = this.frameCount;
      u.uFft.value.set(fftX, fftY, fftZ, fftW);
      u.uFfts.value.set(fftsX, fftsY, fftsZ, fftsW);
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

export default DancingGlowLights;
