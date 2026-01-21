/*
@nwWrld name: AudioCloudPointIceberg
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, createNoise3D, AudioAnalyzer
*/

class AudioCloudPointIceberg extends BaseThreeJsModule {
  static name = "AudioCloudPointIceberg";
  static category = "Audio";

  static methods = [
    ...BaseThreeJsModule.methods,
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 1.5, type: "number", min: 0.1, max: 5.0 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.5, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE || !createNoise3D) return;

    this.name = AudioCloudPointIceberg.name;
    this.customGroup = new THREE.Group();
    this.wireMesh = null;
    this.pointCloud = null;
    this.noise = createNoise3D();
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 1.5;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.baseScale = 1;
    this.targetScale = 1;
    this.currentHue = 0;

    this.init();
  }

  async start({ sensitivity = 1.5 } = {}) {
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number(sensitivity) || 1.5));
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }

  init() {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;
    this.createIcebergShape();
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.audioAnimate.bind(this));
    this.render();
  }

  audioAnimate() {
    if (this.destroyed) return;

    if (this.audioReactive && this.analyzer && this.audioReady) {
      const sensitivity = this.sensitivity || 1.0;
      this.volume = this.analyzer.getVolume() * sensitivity;
      this.bass = this.analyzer.getBass() * sensitivity;
      this.mid = this.analyzer.getMid() * sensitivity;
      this.treble = this.analyzer.getTreble() * sensitivity;
    } else if (!this.audioReactive) {
      const sensitivity = this.sensitivity || 1.0;
      this.volume = 0.3 * sensitivity;
      this.bass = 0.2 * sensitivity;
      this.mid = 0.3 * sensitivity;
      this.treble = 0.2 * sensitivity;
    }

    this.targetScale = 1 + this.bass * 0.5;
    this.baseScale += (this.targetScale - this.baseScale) * 0.1;
    this.customGroup.scale.setScalar(this.baseScale);

    const rotSpeed = 0.002 + this.volume * 0.02;
    this.customGroup.rotation.y += rotSpeed;
    this.customGroup.rotation.x += rotSpeed * 0.3;

    if (this.pointCloud && this.pointCloud.material) {
      this.pointCloud.material.size = 0.03 + this.treble * 0.05;
      
      if (this.bass > 0.5) {
        this.currentHue = (this.currentHue + 2) % 1;
      }
    }

    if (this.wireMesh && this.wireMesh.material) {
      this.wireMesh.material.opacity = 0.3 + this.mid * 0.5;
    }
  }

  createIcebergShape() {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;

    const segments = 16;
    const baseSize = 3.5;
    const noiseSeed = Math.random() * 1000;
    this.noise.seed = noiseSeed;

    const vertexCount = (segments + 1) * (segments + 1);
    const vertices = new Float32Array(vertexCount * 3);
    const wireIndices = [];
    const pointPositions = [];
    const pointColors = [];

    const redShellDirection = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize();
    const redShellThreshold = 0.3;

    const cosCache = new Float32Array(segments + 1);
    const sinCache = new Float32Array(segments + 1);
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      cosCache[i] = Math.cos(theta);
      sinCache[i] = Math.sin(theta);
    }

    const getRadiusAtPoint = (cosTheta, sinTheta, phi, normalizedY) => {
      const baseRadius = baseSize * (0.7 + normalizedY * 0.6);
      const noise1 = this.noise(cosTheta * 3 + noiseSeed, sinTheta * 3 + noiseSeed, normalizedY * 3 + noiseSeed);
      const noise2 = this.noise(sinTheta * 4.2 + noiseSeed * 1.3, cosTheta * 4.2 + noiseSeed * 1.3, normalizedY * 4.2 + noiseSeed * 1.3);
      const combinedNoise = noise1 * 0.6 + noise2 * 0.4;
      return baseRadius * (0.8 + Math.abs(combinedNoise) * 0.4);
    };

    let vertexIdx = 0;
    for (let i = 0; i <= segments; i++) {
      const cosTheta = cosCache[i];
      const sinTheta = sinCache[i];
      for (let j = 0; j <= segments; j++) {
        const normalizedY = j / segments;
        const phi = Math.acos(1 - 2 * normalizedY);
        const radius = getRadiusAtPoint(cosTheta, sinTheta, phi, normalizedY);
        const sinPhi = Math.sin(phi);
        const x = radius * sinPhi * cosTheta;
        const z = radius * sinPhi * sinTheta;
        const y = (normalizedY - 0.5) * 7;
        vertices[vertexIdx++] = x;
        vertices[vertexIdx++] = y;
        vertices[vertexIdx++] = z;
      }
    }

    const segmentsPlus1 = segments + 1;
    for (let i = 0; i < segments; i++) {
      const iOffset = i * segmentsPlus1;
      const iNextOffset = (i + 1) * segmentsPlus1;
      for (let j = 0; j < segments; j++) {
        const a = iOffset + j;
        const b = a + 1;
        const c = iNextOffset + j;
        const d = c + 1;
        wireIndices.push(a, b, a, c);
        if (j < segments && i < segments) wireIndices.push(b, d, c, d);
      }
    }

    const wireGeometry = new THREE.BufferGeometry();
    wireGeometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    wireGeometry.setIndex(wireIndices);
    const wireMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
    this.wireMesh = new THREE.LineSegments(wireGeometry, wireMaterial);
    this.customGroup.add(this.wireMesh);

    const pointCount = 8000;
    for (let i = 0; i < pointCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const normalizedY = v;
      const theta = u * Math.PI * 2;
      const phi = Math.acos(1 - 2 * v);
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      const radius = getRadiusAtPoint(cosTheta, sinTheta, phi, normalizedY) * (0.7 + Math.random() * 0.3);
      const sinPhi = Math.sin(phi);
      const x = radius * sinPhi * cosTheta;
      const z = radius * sinPhi * sinTheta;
      const y = (normalizedY - 0.5) * 7;
      pointPositions.push(x, y, z);

      const tempVec = new THREE.Vector3(x, y, z).normalize();
      const dotProduct = tempVec.dot(redShellDirection);
      if (dotProduct > redShellThreshold) {
        pointColors.push(1, 0.2, 0.2);
      } else {
        pointColors.push(0, 1, 1);
      }
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(pointPositions, 3));
    pointGeometry.setAttribute("color", new THREE.Float32BufferAttribute(pointColors, 3));
    const pointMaterial = new THREE.PointsMaterial({ size: 0.03, vertexColors: true, transparent: true, opacity: 0.9 });
    this.pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    this.customGroup.add(this.pointCloud);
  }

  setSensitivity({ value = 1.5 } = {}) {
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number(value) || 1.5));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  destroy() {
    this.destroyed = true;
    if (this.wireMesh) {
      if (this.wireMesh.geometry) this.wireMesh.geometry.dispose();
      if (this.wireMesh.material) this.wireMesh.material.dispose();
      this.customGroup.remove(this.wireMesh);
    }
    if (this.pointCloud) {
      if (this.pointCloud.geometry) this.pointCloud.geometry.dispose();
      if (this.pointCloud.material) this.pointCloud.material.dispose();
      this.customGroup.remove(this.pointCloud);
    }
    if (this.customGroup) {
      this.scene.remove(this.customGroup);
    }
    super.destroy();
  }
}

export default AudioCloudPointIceberg;
