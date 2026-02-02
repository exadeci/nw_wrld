/*
@nwWrld name: Live Visualizer
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

class LiveVisualizer extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "lineCount", defaultVal: 120, type: "number", min: 48, max: 256 },
        { name: "particleCount", defaultVal: 800, type: "number", min: 200, max: 2000 },
        { name: "baseHue", defaultVal: 230, type: "number", min: 0, max: 360 },
        { name: "lineHue", defaultVal: 50, type: "number", min: 0, max: 360 },
        { name: "backgroundDarkness", defaultVal: 0.92, type: "number", min: 0.3, max: 1 },
      ],
    },
    { name: "setSensitivity", executeOnLoad: false, options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }] },
    { name: "setLineCount", executeOnLoad: false, options: [{ name: "value", defaultVal: 120, type: "number", min: 48, max: 256 }] },
    { name: "setBaseHue", executeOnLoad: false, options: [{ name: "value", defaultVal: 230, type: "number", min: 0, max: 360 }] },
    { name: "setLineHue", executeOnLoad: false, options: [{ name: "value", defaultVal: 50, type: "number", min: 0, max: 360 }] },
    { name: "setAudioReactive", executeOnLoad: false, options: [{ name: "enabled", defaultVal: true, type: "boolean" }] },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;
    this.customGroup = new THREE.Group();
    this.spectrumLineMeshes = null;
    this.particles = null;
    this.centralRing = null;
    this.spiralRing = null;
    this.bgColor = new THREE.Color(0.03, 0.02, 0.08);
    this.targetBgColor = new THREE.Color(0.03, 0.02, 0.08);
    this.sensitivity = 2.0;
    this.lineCount = 120;
    this.particleCount = 800;
    this.baseHue = 230;
    this.lineHue = 50;
    this.backgroundDarkness = 0.92;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.smoothedSpectrum = null;
    this.particleBaseAngles = null;
    this.particleBaseRadii = null;
    this.particleBaseY = null;
    this.spiralTime = 0;
    this.init();
  }

  init() {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;
  }

  async start({ sensitivity = 2.0, lineCount = 120, particleCount = 800, baseHue = 230, lineHue = 50, backgroundDarkness = 0.92 } = {}) {
    const sensVal = Number(sensitivity);
    const lineVal = Number(lineCount);
    const partVal = Number(particleCount);
    const hueVal = Number(baseHue);
    const lineHueVal = Number(lineHue);
    const darkVal = Number(backgroundDarkness);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.lineCount = Math.max(48, Math.min(256, Number.isFinite(lineVal) ? Math.floor(lineVal) : 120));
    this.particleCount = Math.max(200, Math.min(2000, Number.isFinite(partVal) ? Math.floor(partVal) : 800));
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(hueVal) ? hueVal : 230));
    this.lineHue = Math.max(0, Math.min(360, Number.isFinite(lineHueVal) ? lineHueVal : 50));
    this.backgroundDarkness = Math.max(0.3, Math.min(1, Number.isFinite(darkVal) ? darkVal : 0.92));
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
    if (!this.renderer || !this.scene || !this.camera) return;
    this.buildScene();
    this.setModel(this.customGroup);
    if (this.camera) {
      this.camera.position.set(0, 0, 28);
      this.camera.lookAt(0, 0, 0);
      this.camera.updateProjectionMatrix();
    }
    this.setCustomAnimate(this.animate.bind(this));
    this.markNeedsRender();
  }

  async tryInitializeAudio() {
    if (this.audioReady || this.destroyed) return;
    const sdk = globalThis.nwWrldSdk;
    const stream = sdk?.audio?.getStream?.();
    if (stream && typeof AudioAnalyzer !== "undefined") {
      this.analyzer = new AudioAnalyzer();
      const initialized = await this.analyzer.init(stream);
      if (initialized) {
        this.audioReady = true;
        if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
      }
    }
  }

  startStreamPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      if (this.destroyed) { clearInterval(this.pollInterval); this.pollInterval = null; return; }
      this.tryInitializeAudio();
    }, 1000);
  }

  hueToRgb(h) {
    h = h % 360;
    if (h < 0) h += 360;
    const s = 0.9;
    const v = 0.95;
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return [r + m, g + m, b + m];
  }

  buildScene() {
    if (!this.renderer || !this.scene || this.destroyed) return;
    while (this.customGroup.children.length > 0) {
      const child = this.customGroup.children[0];
      this.customGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
    const lineRadius = 7.5;
    const [lr, lg, lb] = this.hueToRgb(this.lineHue);
    const lineMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(lr, lg, lb),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < this.lineCount; i++) {
      const angle = (i / this.lineCount) * Math.PI * 2;
      const segLen = (Math.PI * 2 * lineRadius) / this.lineCount * 0.85;
      const geo = new THREE.CylinderGeometry(0.04, 0.04, segLen, 6);
      const mesh = new THREE.Mesh(geo, lineMat.clone());
      mesh.position.x = Math.cos(angle) * lineRadius;
      mesh.position.z = Math.sin(angle) * lineRadius;
      mesh.rotation.y = -angle;
      mesh.rotation.z = Math.PI / 2;
      mesh.userData.baseAngle = angle;
      mesh.userData.index = i;
      this.customGroup.add(mesh);
    }
    this.spectrumLineMeshes = this.customGroup.children.slice(0, this.lineCount);
    this.smoothedSpectrum = new Float32Array(this.lineCount);

    const partPositions = new Float32Array(this.particleCount * 3);
    const partColors = new Float32Array(this.particleCount * 3);
    this.particleBaseAngles = new Float32Array(this.particleCount);
    this.particleBaseRadii = new Float32Array(this.particleCount);
    this.particleBaseY = new Float32Array(this.particleCount);
    for (let i = 0; i < this.particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 10;
      const baseY = (Math.random() - 0.5) * 4;
      this.particleBaseAngles[i] = angle;
      this.particleBaseRadii[i] = r;
      this.particleBaseY[i] = baseY;
      partPositions[i * 3] = Math.cos(angle) * r;
      partPositions[i * 3 + 1] = baseY;
      partPositions[i * 3 + 2] = Math.sin(angle) * r;
      const hue = (this.lineHue + (Math.random() - 0.5) * 80) % 360;
      const [rr, gg, bb] = this.hueToRgb(hue);
      partColors[i * 3] = rr;
      partColors[i * 3 + 1] = gg;
      partColors[i * 3 + 2] = bb;
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute("position", new THREE.BufferAttribute(partPositions, 3));
    partGeo.setAttribute("color", new THREE.BufferAttribute(partColors, 3));
    const partMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.particles = new THREE.Points(partGeo, partMat);
    this.customGroup.add(this.particles);

    const ringGeo = new THREE.TorusGeometry(2.2, 0.04, 8, 80);
    const [rr, rg, rb] = this.hueToRgb((this.lineHue + 30) % 360);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(rr, rg, rb),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.centralRing = new THREE.Mesh(ringGeo, ringMat);
    this.centralRing.rotation.x = Math.PI / 2;
    this.customGroup.add(this.centralRing);

    const spiralPoints = [];
    const spiralSegments = 200;
    const spiralR = 4;
    for (let i = 0; i <= spiralSegments; i++) {
      const t = (i / spiralSegments) * Math.PI * 2 * 3;
      const r = spiralR + Math.sin(t * 0.7) * 0.4;
      spiralPoints.push(new THREE.Vector3(Math.cos(t) * r, Math.sin(t * 0.3) * 0.5, Math.sin(t) * r));
    }
    const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
    const spiralTubeGeo = new THREE.TubeGeometry(spiralCurve, spiralSegments, 0.03, 8, false);
    const [sr, sg, sb] = this.hueToRgb((this.lineHue + 15) % 360);
    const spiralMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(sr, sg, sb),
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.spiralRing = new THREE.Mesh(spiralTubeGeo, spiralMat);
    this.customGroup.add(this.spiralRing);

    this.modelBoundingBox = new THREE.Box3().setFromObject(this.customGroup);
    this.modelCenter = new THREE.Vector3(0, 0, 0);
    this.modelSize = 25;
  }

  animate() {
    if (this.destroyed || !this.renderer || !this.scene || !this.camera) return;
    const sens = this.sensitivity || 1;
    if (this.audioReactive && this.analyzer && this.audioReady) {
      this.volume = this.analyzer.getVolume() * sens;
      this.bass = this.analyzer.getBass() * sens;
      this.mid = this.analyzer.getMid() * sens;
      this.treble = this.analyzer.getTreble() * sens;
      const freqData = this.analyzer.getFrequencyDataNormalized();
      if (freqData && freqData.length > 0 && this.smoothedSpectrum && this.spectrumLineMeshes) {
        const binsPerLine = Math.floor(freqData.length / this.lineCount);
        for (let i = 0; i < this.lineCount; i++) {
          let sum = 0;
          const start = i * binsPerLine;
          const end = Math.min((i + 1) * binsPerLine, freqData.length);
          for (let j = start; j < end; j++) sum += freqData[j] || 0;
          const val = (sum / (end - start)) * sens * 4;
          this.smoothedSpectrum[i] = this.smoothedSpectrum[i] * 0.5 + val * 0.5;
        }
      }
    } else {
      this.volume = 0.35 * sens;
      this.bass = 0.25 * sens;
      this.mid = 0.3 * sens;
      this.treble = 0.25 * sens;
      if (this.smoothedSpectrum) {
        for (let i = 0; i < this.lineCount; i++) {
          const wave = Math.sin((i / this.lineCount) * Math.PI * 6 + performance.now() * 0.002) * 0.5 + 0.5;
          this.smoothedSpectrum[i] = this.smoothedSpectrum[i] * 0.65 + wave * 0.35;
        }
      }
    }

    const hueShift = this.baseHue + this.bass * 35;
    const [tr, tg, tb] = this.hueToRgb(hueShift);
    const dark = this.backgroundDarkness;
    const bgPulse = 1 + this.volume * 0.15;
    this.targetBgColor.setRGB(
      (tr * (1 - dark) + 0.015) * bgPulse,
      (tg * (1 - dark) + 0.012) * bgPulse,
      (tb * (1 - dark) + 0.04) * bgPulse
    );
    this.bgColor.lerp(this.targetBgColor, 0.1);
    this.renderer.setClearColor(this.bgColor, 1);

    if (this.spectrumLineMeshes && this.smoothedSpectrum) {
      const lineRadius = 7.5;
      const lineHueShift = this.lineHue + this.bass * 30;
      this.spectrumLineMeshes.forEach((mesh, i) => {
        const val = this.smoothedSpectrum[i] || 0;
        const expansion = 1 + val * 6;
        const r = lineRadius * expansion;
        mesh.position.x = Math.cos(mesh.userData.baseAngle) * r;
        mesh.position.z = Math.sin(mesh.userData.baseAngle) * r;
        const segHue = (lineHueShift + (i / this.lineCount) * 50) % 360;
        const [rr, gg, bb] = this.hueToRgb(segHue);
        if (mesh.material.color) mesh.material.color.setRGB(rr, gg, bb);
        mesh.material.opacity = 0.5 + val * 0.55;
      });
    }

    if (this.particles && this.particles.geometry && this.particleBaseAngles && this.particleBaseY) {
      const posAttr = this.particles.geometry.attributes.position;
      const radiusScale = 1 + this.bass * 2;
      const rotationSpeed = 0.4 + this.mid * 1.2;
      for (let i = 0; i < this.particleCount; i++) {
        const angle = this.particleBaseAngles[i] + this.mid * 0.8 + performance.now() * 0.0003 * rotationSpeed;
        const r = this.particleBaseRadii[i] * radiusScale;
        const yWobble = Math.sin(i * 0.1 + this.treble * 2) * 0.4;
        posAttr.array[i * 3] = Math.cos(angle) * r;
        posAttr.array[i * 3 + 1] = this.particleBaseY[i] * (1 + this.volume * 0.25) + yWobble;
        posAttr.array[i * 3 + 2] = Math.sin(angle) * r;
      }
      posAttr.needsUpdate = true;
      if (this.particles.material) {
        this.particles.material.size = 0.06 + this.treble * 0.22;
        this.particles.material.opacity = 0.45 + this.volume * 0.55;
      }
    }

    if (this.centralRing) {
      const ringScale = 1 + this.bass * 1.2;
      this.centralRing.scale.setScalar(ringScale);
      this.centralRing.rotation.z += 0.008 + this.mid * 0.04;
      const [rr, gg, bb] = this.hueToRgb((this.lineHue + 30 + this.bass * 25) % 360);
      if (this.centralRing.material.color) this.centralRing.material.color.setRGB(rr, gg, bb);
      this.centralRing.material.opacity = 0.45 + this.volume * 0.5;
    }

    if (this.spiralRing) {
      this.spiralTime += 0.01 + this.mid * 0.04 + this.volume * 0.02;
      this.spiralRing.rotation.y = this.spiralTime;
      this.spiralRing.rotation.x = Math.sin(this.spiralTime * 0.5) * (0.1 + this.bass * 0.2);
      const spiralScale = 1 + this.bass * 0.5;
      this.spiralRing.scale.setScalar(spiralScale);
      const [sr, sg, sb] = this.hueToRgb((this.lineHue + 15 + this.volume * 30) % 360);
      if (this.spiralRing.material.color) this.spiralRing.material.color.setRGB(sr, sg, sb);
      this.spiralRing.material.opacity = 0.4 + this.volume * 0.5;
    }

    this.customGroup.rotation.y += 0.002 + this.volume * 0.02;
    this.renderer.render(this.scene, this.camera);
    this.markNeedsRender();
  }

  setSensitivity({ value = 2.0 } = {}) {
    const v = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5, Number.isFinite(v) ? v : 2.0));
  }

  setLineCount({ value = 120 } = {}) {
    const v = Number(value);
    this.lineCount = Math.max(48, Math.min(256, Math.floor(v) || 120));
    if (this.renderer && this.scene) this.buildScene();
  }

  setBaseHue({ value = 230 } = {}) {
    const v = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(v) ? v : 230));
  }

  setLineHue({ value = 50 } = {}) {
    const v = Number(value);
    this.lineHue = Math.max(0, Math.min(360, Number.isFinite(v) ? v : 50));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  destroy() {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
    if (this.analyzer && typeof this.analyzer.destroy === "function") { this.analyzer.destroy(); this.analyzer = null; }
    if (this.spectrumLineMeshes) {
      this.spectrumLineMeshes.forEach((m) => {
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      });
    }
    if (this.particles) {
      if (this.particles.geometry) this.particles.geometry.dispose();
      if (this.particles.material) this.particles.material.dispose();
    }
    if (this.centralRing) {
      if (this.centralRing.geometry) this.centralRing.geometry.dispose();
      if (this.centralRing.material) this.centralRing.material.dispose();
    }
    if (this.spiralRing) {
      if (this.spiralRing.geometry) this.spiralRing.geometry.dispose();
      if (this.spiralRing.material) this.spiralRing.material.dispose();
    }
    super.destroy();
  }
}

export default LiveVisualizer;
