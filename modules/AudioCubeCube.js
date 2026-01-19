/*
@nwWrld name: AudioCubeCube
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

class AudioCubeCube extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 1.5, type: "number", min: 0.1, max: 5.0 },
        { name: "pulseMode", defaultVal: "bass", type: "select", values: ["bass", "mid", "treble", "all"] },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.5, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setPulseMode",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "bass", type: "select", values: ["bass", "mid", "treble", "all"] }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);

    this.name = AudioCubeCube.name;
    this.cubeGroup = new THREE.Group();
    this.cubeSize = 1;
    this.cubeGrid = [];
    this.hexagons = [];
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 1.5;
    this.pulseMode = "bass";
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.pulsePhase = 0;
    this.init();
  }

  async start({ sensitivity = 1.5, pulseMode = "bass" } = {}) {
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number(sensitivity) || 1.5));
    this.pulseMode = ["bass", "mid", "treble", "all"].includes(pulseMode) ? pulseMode : "bass";
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }

  init() {
    if (this.destroyed) return;
    this.createCubeGrid();
    this.createQuadrants();
    this.createRing();
    this.createHexagons();
    this.setModel(this.cubeGroup);
    this.setCustomAnimate(this.audioAnimateLoop.bind(this));
  }

  createCubeGrid() {
    const offset = (8 * this.cubeSize) / 2;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        for (let z = 0; z < 8; z++) {
          const geometry = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
          const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            wireframe: false,
          });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(
            x * this.cubeSize - offset,
            y * this.cubeSize - offset,
            z * this.cubeSize - offset
          );
          cube.userData.gridPos = { x, y, z };
          this.cubeGroup.add(cube);
          this.cubeGrid.push(cube);
        }
      }
    }
  }

  createQuadrants() {
    const quadrantSize = 4 * this.cubeSize;
    const offset = (8 * this.cubeSize) / 2;
    const geometry = new THREE.BoxGeometry(quadrantSize, quadrantSize, quadrantSize);
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          const line = new THREE.LineSegments(edges, lineMaterial.clone());
          line.position.set(
            x * quadrantSize - offset + quadrantSize / 2,
            y * quadrantSize - offset + quadrantSize / 2,
            z * quadrantSize - offset + quadrantSize / 2
          );
          this.cubeGroup.add(line);
        }
      }
    }
  }

  createRing() {
    const ringGeometry = new THREE.RingGeometry(8, 8.1, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    this.ring = ring;
    this.cubeGroup.add(ring);
  }

  createHexagons() {
    const hexagonGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 6);
    const hexagonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.7 });

    for (let i = 0; i < 12; i++) {
      const hexagon = new THREE.Mesh(hexagonGeometry, hexagonMaterial.clone());
      const angle = (i / 12) * Math.PI * 2;
      hexagon.userData = { angle, baseSpeed: 0.002 + Math.random() * 0.003 };
      hexagon.position.set(8 * Math.cos(angle), 0, 8 * Math.sin(angle));
      hexagon.lookAt(0, 0, 0);
      this.cubeGroup.add(hexagon);
      this.hexagons.push(hexagon);
    }
  }

  audioAnimateLoop() {
    if (this.destroyed) return;

    if (this.audioReactive && this.analyzer && this.audioReady) {
      this.volume = this.analyzer.getVolume() * this.sensitivity;
      this.bass = this.analyzer.getBass() * this.sensitivity;
      this.mid = this.analyzer.getMid() * this.sensitivity;
      this.treble = this.analyzer.getTreble() * this.sensitivity;
    } else if (!this.audioReactive) {
      this.volume = 0.3 * this.sensitivity;
      this.bass = 0.2 * this.sensitivity;
      this.mid = 0.3 * this.sensitivity;
      this.treble = 0.2 * this.sensitivity;
    }

    let pulseValue = this.volume;
    if (this.pulseMode === "bass") pulseValue = this.bass;
    else if (this.pulseMode === "mid") pulseValue = this.mid;
    else if (this.pulseMode === "treble") pulseValue = this.treble;

    const rotSpeed = 0.001 + this.volume * 0.01;
    this.cubeGroup.rotation.x += rotSpeed;
    this.cubeGroup.rotation.y += rotSpeed;

    this.pulsePhase += 0.05 + this.volume * 0.1;

    this.cubeGrid.forEach((cube, i) => {
      const { x, y, z } = cube.userData.gridPos;
      const dist = Math.sqrt((x - 3.5) ** 2 + (y - 3.5) ** 2 + (z - 3.5) ** 2);
      const wave = Math.sin(this.pulsePhase - dist * 0.5) * 0.5 + 0.5;
      const audioWave = wave * pulseValue;

      if (audioWave > 0.3) {
        cube.material.opacity = audioWave * 0.4;
        const hue = (dist / 6 + this.pulsePhase * 0.01) % 1;
        cube.material.color.setHSL(hue, 1, 0.5 + audioWave * 0.3);
      } else {
        cube.material.opacity = 0;
      }
    });

    this.hexagons.forEach((hexagon) => {
      hexagon.rotation.z += 0.05 + this.treble * 0.2;
      const speed = hexagon.userData.baseSpeed * (1 + this.volume * 5);
      hexagon.userData.angle += speed;
      const radius = 8 + this.bass * 2;
      hexagon.position.set(
        radius * Math.cos(hexagon.userData.angle),
        0,
        radius * Math.sin(hexagon.userData.angle)
      );
      hexagon.lookAt(0, 0, 0);
      hexagon.material.opacity = 0.3 + this.mid * 0.7;
    });

    if (this.ring) {
      this.ring.scale.setScalar(1 + this.bass * 0.3);
      this.ring.material.opacity = 0.3 + this.volume * 0.5;
    }
  }

  setSensitivity({ value = 1.5 } = {}) {
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number(value) || 1.5));
  }

  setPulseMode({ value = "bass" } = {}) {
    this.pulseMode = ["bass", "mid", "treble", "all"].includes(value) ? value : "bass";
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  destroy() {
    this.destroyed = true;
    if (this.cubeGroup) {
      this.cubeGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
      this.scene.remove(this.cubeGroup);
    }
    this.cubeGrid = [];
    this.hexagons = [];
    super.destroy();
  }
}

export default AudioCubeCube;
