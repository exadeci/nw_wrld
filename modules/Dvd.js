/*
@nwWrld name: DVD
@nwWrld category: Overlays
@nwWrld imports: BaseThreeJsModule, THREE
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
  uniform vec2 uLogoPos;

  float vmin(vec2 v) {
    return min(v.x, v.y);
  }

  float ellip(vec2 p, vec2 s) {
    float m = vmin(s);
    return (length(p / s) * m) - m;
  }

  float halfEllip(vec2 p, vec2 s) {
    p.x = max(0., p.x);
    float m = vmin(s);
    return (length(p / s) * m) - m;
  }

  float dvd_d(vec2 p) {
    float d = halfEllip(p, vec2(.8, .5));
    d = max(d, -p.x - .5);
    float d2 = halfEllip(p, vec2(.45, .3));
    d2 = max(d2, min(-p.y + .2, -p.x - .15));
    d = max(d, -d2);
    return d;
  }

  float dvd_v(vec2 p) {
    vec2 pp = p;
    p.y += .7;
    p.x = abs(p.x);
    vec2 a = normalize(vec2(1,-.55));
    float d = dot(p, a);
    float d2 = d + .3;
    p = pp;
    d = min(d, -p.y + .3);
    d2 = min(d2, -p.y + .5);
    d = max(d, -d2);
    d = max(d, abs(p.x + .3) - 1.1);
    return d;
  }

  float dvd_c(vec2 p) {
    p.y += .95;
    float d = ellip(p, vec2(1.8,.25));
    float d2 = ellip(p, vec2(.45,.09));
    d = max(d, -d2);
    return d;
  }

  float dvd_raw(vec2 p) {
    p.y -= .345;
    p.x -= .035;
    p *= mat2(1,-.2,0,1);
    float d = dvd_v(p);
    d = min(d, dvd_c(p));
    p.x += 1.3;
    d = min(d, dvd_d(p));
    p.x -= 2.4;
    d = min(d, dvd_d(p));
    return d;
  }
  
  // Wrapper to center the shape perfectly around (0,0)
  float dvd(vec2 p) {
     p.x -= 0.55; // Correcting horizontal asymmetry
     p.y += 0.35; // Correcting vertical asymmetry
     return dvd_raw(p);
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 p = (-iResolution.xy + 2.0 * fragCoord) / iResolution.y;

    float logoScale = .05;
    vec3 bg = vec3(0.05, 0.05, 0.08);
    
    // Draw logo
    float d = dvd((p - uLogoPos) / logoScale);
    
    // Anti-aliasing
    float w = fwidth(d);
    float logo = 1. - smoothstep(-w, w, d);
    
    // Color
    vec3 logoColor = vec3(1., 1., 1.);
    
    // Simple corner hit color cycle logic could be added here
    // For now, classic white
    
    vec3 col = mix(bg, logoColor, logo);

    // 2px grey border at viewport edges
    float left = 1.0 - step(2.0, fragCoord.x);
    float right = step(iResolution.x - 2.0, fragCoord.x);
    float bottom = 1.0 - step(2.0, fragCoord.y);
    float top = step(iResolution.y - 2.0, fragCoord.y);
    float border = min(1.0, left + right + bottom + top);
    vec3 borderColor = vec3(0.35, 0.35, 0.38);
    col = mix(col, borderColor, border);

    col = pow(col, vec3(1. / 1.5)); // Gamma correction
    gl_FragColor = vec4(col, 1.0);
  }
`;

class Dvd extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.2, max: 3.0 },
      ],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.2, max: 3.0 }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = Dvd.name;
    this.customGroup = new THREE.Group();
    this.speed = 1.0;
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.clock = null;
    this.logoPos = { x: 0, y: 0 };
    this.logoVel = { x: 0.4, y: 0.25 };
    
    // Bounding box: dvd() applies p.x -= 0.55 so shape extends further left of center
    this.logoHalf = { x: 0.14, y: 0.05 };
    this.logoHalfLeft = 0.12 - 1 * 0.05;
    this.logoPaddingRight = -0.02;
    this.logoPaddingTop = -0.02;
    this.logoPaddingBottom = -0.02;
  }

  async start({ speed = 1.0 } = {}) {
    const v = Number(speed);
    this.speed = Number.isFinite(v) ? Math.max(0.2, Math.min(3, v)) : 1.0;

    if (!this.renderer || !this.scene || !this.camera) return;

    const w = Math.max(this.elem?.clientWidth || 0, 1);
    const h = Math.max(this.elem?.clientHeight || 0, 1);
    
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    
    // Ensure canvas fills the container
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
    
    // Disable controls if present to prevent interference
    if (this.controls) {
      this.controls.enabled = false;
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

    // Initial size setup
    const width = Math.max(this.elem?.clientWidth || 1920, 1);
    const height = Math.max(this.elem?.clientHeight || 1080, 1);

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.logoPos = { x: 0, y: 0 };
    
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        iResolution: { value: new THREE.Vector2(width, height) },
        uLogoPos: { value: new THREE.Vector2(0, 0) },
      },
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.customGroup.add(this.mesh);
  }

  animate() {
    if (!this.clock || !this.material || !this.renderer || !this.scene || !this.camera) return;

    const canvas = this.renderer.domElement;
    const cssW = Math.max(this.elem?.clientWidth ?? canvas?.clientWidth ?? 100, 1);
    const cssH = Math.max(this.elem?.clientHeight ?? canvas?.clientHeight ?? 100, 1);

    this.renderer.setSize(cssW, cssH);

    const drawSize = new THREE.Vector2();
    this.renderer.getDrawingBufferSize(drawSize);
    const w = Math.max(drawSize.x, 1);
    const h = Math.max(drawSize.y, 1);

    const delta = this.clock.getDelta();
    const aspect = w / h;
    const u = this.material.uniforms;
    u.iResolution.value.set(w, h);

    const step = delta * this.speed;
    this.logoPos.x += this.logoVel.x * step;
    this.logoPos.y += this.logoVel.y * step;

    // Left uses smaller margin (dvd() shifts shape right by 0.55*logoScale)
    const xMin = -aspect + this.logoHalfLeft;
    const xMax = aspect - this.logoHalf.x - this.logoPaddingRight;
    const yMin = -1.0 + this.logoHalf.y - this.logoPaddingBottom
    const yMax = 1.0 - this.logoHalf.y - this.logoPaddingTop;

    let hit = false;
    if (this.logoPos.x >= xMax) {
      this.logoPos.x = xMax;
      this.logoVel.x = -Math.abs(this.logoVel.x);
      hit = true;
    } else if (this.logoPos.x <= xMin) {
      this.logoPos.x = xMin;
      this.logoVel.x = Math.abs(this.logoVel.x);
      hit = true;
    }
    
    if (this.logoPos.y >= yMax) {
      this.logoPos.y = yMax;
      this.logoVel.y = -Math.abs(this.logoVel.y);
      hit = true;
    } else if (this.logoPos.y <= yMin) {
      this.logoPos.y = yMin;
      this.logoVel.y = Math.abs(this.logoVel.y);
      hit = true;
    }

    u.uLogoPos.value.set(this.logoPos.x, this.logoPos.y);
    this.renderer.render(this.scene, this.camera);
  }

  setSpeed({ value = 1.0 } = {}) {
    const v = Number(value);
    this.speed = Number.isFinite(v) ? Math.max(0.2, Math.min(3, v)) : 1.0;
  }

  destroy() {
    if (this.mesh && this.customGroup) this.customGroup.remove(this.mesh);
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    super.destroy();
  }
}

export default Dvd;