/*
@nwWrld name: PlanetSkeleton
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

class PlanetSkeleton extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "gradientStart", defaultVal: "#11e8bb", type: "color" },
        { name: "gradientEnd", defaultVal: "#8200c9", type: "color" },
        { name: "planetColor", defaultVal: "#ffffff", type: "color" },
        { name: "skeletonColor", defaultVal: "#ffffff", type: "color" },
        {
          name: "particleShape",
          defaultVal: "stars",
          type: "select",
          values: [
            "stars",
            "diamonds",
            "balls",
            "triangles",
            "cubes",
            "octahedrons",
            "icosahedrons",
            "dodecahedrons",
            "toruses",
            "cones",
            "cylinders",
            "rings",
            "crosses",
          ],
        },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setGradientStart",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#11e8bb", type: "color" }],
    },
    {
      name: "setGradientEnd",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#8200c9", type: "color" }],
    },
    {
      name: "setPlanetColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#ffffff", type: "color" }],
    },
    {
      name: "setSkeletonColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#ffffff", type: "color" }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setParticleShape",
      executeOnLoad: false,
      options: [
        {
          name: "shape",
          defaultVal: "stars",
          type: "select",
          values: [
            "stars",
            "diamonds",
            "balls",
            "triangles",
            "cubes",
            "octahedrons",
            "icosahedrons",
            "dodecahedrons",
            "toruses",
            "cones",
            "cylinders",
            "rings",
            "crosses",
          ],
        },
      ],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = PlanetSkeleton.name;
    this.customGroup = new THREE.Group();
    this.circle = new THREE.Object3D();
    this.skelet = new THREE.Object3D();
    this.particle = new THREE.Object3D();
    this.gradientStart = "#11e8bb";
    this.gradientEnd = "#8200c9";
    this.planetColor = "#ffffff";
    this.skeletonColor = "#ffffff";
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.audioReactive = true;
    this.particleShape = "stars";
    this.particleGeometry = null;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.destroyed = false;
    this.init();
  }

  hexToThreeColor(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return new THREE.Color(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      );
    }
    return new THREE.Color(0xffffff);
  }

  updateGradient() {
    if (this.elem) {
      this.elem.style.background = `linear-gradient(to bottom, ${this.gradientStart} 0%, ${this.gradientEnd} 100%)`;
    }
  }

  updatePlanetColor() {
    if (this.circle && this.circle.children.length > 0) {
      const planet = this.circle.children[0];
      if (planet && planet.material) {
        planet.material.color = this.hexToThreeColor(this.planetColor);
      }
    }
  }

  updateSkeletonColor() {
    if (this.skelet && this.skelet.children.length > 0) {
      const planet2 = this.skelet.children[0];
      if (planet2 && planet2.material) {
        planet2.material.color = this.hexToThreeColor(this.skeletonColor);
      }
    }
  }

  createParticleGeometry(shapeType) {
    const size = 2;
    
    switch (shapeType) {
      case "stars":
        return this.createStarGeometry(size, size * 0.5, 5);
      case "diamonds":
        return new THREE.OctahedronGeometry(size, 0);
      case "balls":
        return new THREE.SphereGeometry(size, 16, 16);
      case "triangles":
        return new THREE.TetrahedronGeometry(size, 0);
      case "cubes":
        return new THREE.BoxGeometry(size, size, size);
      case "octahedrons":
        return new THREE.OctahedronGeometry(size, 1);
      case "icosahedrons":
        return new THREE.IcosahedronGeometry(size, 0);
      case "dodecahedrons":
        return new THREE.DodecahedronGeometry(size, 0);
      case "toruses":
        return new THREE.TorusGeometry(size * 0.6, size * 0.3, 8, 16);
      case "cones":
        return new THREE.ConeGeometry(size, size * 1.5, 8);
      case "cylinders":
        return new THREE.CylinderGeometry(size * 0.6, size * 0.6, size * 1.2, 8);
      case "rings":
        return new THREE.RingGeometry(size * 0.5, size, 16);
      case "crosses":
        return this.createCrossGeometry(size);
      default:
        return this.createStarGeometry(size, size * 0.5, 5);
    }
  }

  createCrossGeometry(size) {
    const halfSize = size * 0.5;
    const thickness = size * 0.25;
    const depth = thickness * 0.5;
    
    const positions = [];
    const indices = [];
    let vertexIndex = 0;
    
    const addBox = (x, y, z, width, height, depth) => {
      const w = width * 0.5;
      const h = height * 0.5;
      const d = depth * 0.5;
      
      const vertices = [
        [x - w, y - h, z - d], [x + w, y - h, z - d], [x + w, y + h, z - d], [x - w, y + h, z - d],
        [x - w, y - h, z + d], [x + w, y - h, z + d], [x + w, y + h, z + d], [x - w, y + h, z + d],
      ];
      
      const boxIndices = [
        0, 1, 2, 0, 2, 3,
        4, 7, 6, 4, 6, 5,
        0, 4, 5, 0, 5, 1,
        2, 6, 7, 2, 7, 3,
        0, 3, 7, 0, 7, 4,
        1, 5, 6, 1, 6, 2,
      ];
      
      vertices.forEach((v) => {
        positions.push(...v);
      });
      
      boxIndices.forEach((idx) => {
        indices.push(vertexIndex + idx);
      });
      
      vertexIndex += 8;
    };
    
    addBox(0, 0, 0, halfSize * 2, thickness, depth);
    addBox(0, 0, 0, thickness, halfSize * 2, depth);
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }

  createStarGeometry(outerRadius = 1, innerRadius = 0.5, points = 5) {
    const shape = new THREE.Shape();
    const angleStep = (Math.PI * 2) / (points * 2);
    
    for (let i = 0; i < points * 2; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.lineTo(outerRadius, 0);
    
    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: false,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  init() {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;

    this.updateGradient();

    this.customGroup.add(this.circle);
    this.customGroup.add(this.skelet);
    this.customGroup.add(this.particle);

    this.particleGeometry = this.createParticleGeometry(this.particleShape);
    const geom = new THREE.IcosahedronGeometry(7, 1);
    const geom2 = new THREE.IcosahedronGeometry(15, 1);

    const material = new THREE.MeshPhongMaterial({
      color: this.hexToThreeColor(this.planetColor),
      flatShading: this.particleShape === "balls" ? false : true,
    });

    for (let i = 0; i < 1000; i++) {
      const mesh = new THREE.Mesh(this.particleGeometry, material);
      mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      mesh.position.multiplyScalar(90 + (Math.random() * 700));
      mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      this.particle.add(mesh);
    }

    const mat = new THREE.MeshPhongMaterial({
      color: this.hexToThreeColor(this.planetColor),
      flatShading: true,
    });

    const mat2 = new THREE.MeshPhongMaterial({
      color: this.hexToThreeColor(this.skeletonColor),
      wireframe: true,
      side: THREE.DoubleSide,
    });

    const planet = new THREE.Mesh(geom, mat);
    planet.scale.x = planet.scale.y = planet.scale.z = 16;
    this.circle.add(planet);

    const planet2 = new THREE.Mesh(geom2, mat2);
    planet2.scale.x = planet2.scale.y = planet2.scale.z = 10;
    this.skelet.add(planet2);

    const ambientLight = new THREE.AmbientLight(0x999999);
    this.scene.add(ambientLight);

    const lights = [];
    lights[0] = new THREE.DirectionalLight(0xffffff, 1);
    lights[0].position.set(1, 0, 0);
    lights[1] = new THREE.DirectionalLight(0x11E8BB, 1);
    lights[1].position.set(0.75, 1, 0.5);
    lights[2] = new THREE.DirectionalLight(0x8200C9, 1);
    lights[2].position.set(-0.75, -1, 0.5);
    this.scene.add(lights[0]);
    this.scene.add(lights[1]);
    this.scene.add(lights[2]);

    if (this.controls) {
      this.controls.enableDamping = false;
      this.controls.autoRotate = false;
      this.controls.enablePan = false;
      this.controls.enableRotate = false;
      this.controls.enableZoom = true;
    }
    
    this.cameraSettings.zoomLevel = 40;
    const originalConfigureCamera = this.configureCamera.bind(this);
    this.configureCamera = () => {
      originalConfigureCamera();
      if (this.cameraSettings.zoomLevel === 40) {
        this.updateCameraZoom(40);
      }
    };
    
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.animate.bind(this));
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

  animate() {
    if (this.destroyed || !this.renderer || !this.scene || !this.camera) return;

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

    const skeletonRotationMultiplier = 1.0 + (this.bass * 2.0) + (this.volume * 1.5);

    this.particle.rotation.x += 0.0000;
    this.particle.rotation.y -= 0.0040 * (1.0 + this.treble * 0.5);
    this.circle.rotation.x -= 0.0020 * (1.0 + this.mid * 0.3);
    this.circle.rotation.y -= 0.0030 * (1.0 + this.mid * 0.3);
    this.skelet.rotation.x -= 0.0010 * skeletonRotationMultiplier;
    this.skelet.rotation.y += 0.0020 * skeletonRotationMultiplier;

    if (this.skelet && this.skelet.children.length > 0) {
      const planet2 = this.skelet.children[0];
      if (planet2) {
        const scaleMultiplier = 1.0 + (this.bass * 0.3);
        planet2.scale.x = planet2.scale.y = planet2.scale.z = 10 * scaleMultiplier;
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  async start({ sensitivity = 2.0, gradientStart = "#11e8bb", gradientEnd = "#8200c9", planetColor = "#ffffff", skeletonColor = "#ffffff", particleShape = "stars" } = {}) {
    const sensVal = Number(sensitivity);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.gradientStart = String(gradientStart);
    this.gradientEnd = String(gradientEnd);
    this.planetColor = String(planetColor);
    this.skeletonColor = String(skeletonColor);
    this.updateGradient();
    this.updatePlanetColor();
    this.updateSkeletonColor();
    this.setParticleShape({ shape: particleShape });
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }

  setGradientStart({ color = "#11e8bb" } = {}) {
    this.gradientStart = String(color);
    this.updateGradient();
  }

  setGradientEnd({ color = "#8200c9" } = {}) {
    this.gradientEnd = String(color);
    this.updateGradient();
  }

  setPlanetColor({ color = "#ffffff" } = {}) {
    this.planetColor = String(color);
    this.updatePlanetColor();
  }

  setSkeletonColor({ color = "#ffffff" } = {}) {
    this.skeletonColor = String(color);
    this.updateSkeletonColor();
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setParticleShape({ shape = "stars" } = {}) {
    if (this.destroyed || !this.particle) return;
    
    const shapeType = String(shape).toLowerCase();
    const validShapes = [
      "stars",
      "diamonds",
      "balls",
      "triangles",
      "cubes",
      "octahedrons",
      "icosahedrons",
      "dodecahedrons",
      "toruses",
      "cones",
      "cylinders",
      "rings",
      "crosses",
    ];
    
    if (!validShapes.includes(shapeType)) {
      console.warn(`[PlanetSkeleton] Invalid particle shape: ${shape}. Using "stars" instead.`);
      return;
    }
    
    if (this.particleShape === shapeType) return;
    
    this.particleShape = shapeType;
    
    const oldMaterial = this.particle.children.length > 0 ? this.particle.children[0].material : null;
    
    if (this.particleGeometry) {
      this.particleGeometry.dispose();
    }
    
    this.particleGeometry = this.createParticleGeometry(shapeType);
    
    const smoothShadingShapes = ["balls", "toruses", "cones", "cylinders", "rings"];
    const material = new THREE.MeshPhongMaterial({
      color: this.hexToThreeColor(this.planetColor),
      flatShading: smoothShadingShapes.includes(shapeType) ? false : true,
    });
    
    if (oldMaterial && oldMaterial !== material) {
      oldMaterial.dispose();
    }
    
    this.particle.children.forEach((child) => {
      child.geometry = this.particleGeometry;
      child.material = material;
    });
  }

  destroy() {
    this.destroyed = true;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.analyzer) {
      this.analyzer.destroy();
      this.analyzer = null;
    }

    if (this.customGroup) {
      this.scene.remove(this.customGroup);
    }

    if (this.circle) {
      this.circle.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    if (this.skelet) {
      this.skelet.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    if (this.particle) {
      this.particle.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    super.destroy();
  }
}

export default PlanetSkeleton;
