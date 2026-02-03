/*
@nwWrld name: Galaxy
@nwWrld category: 3D
@nwWrld imports: BaseThreeJsModule, THREE, OrbitControls
*/

class Galaxy extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "count", defaultVal: 100000, type: "number", min: 1000, max: 1000000 },
        { name: "size", defaultVal: 0.01, type: "number", min: 0.001, max: 0.1 },
        { name: "radius", defaultVal: 2.15, type: "number", min: 0.1, max: 10 },
        { name: "branches", defaultVal: 3, type: "number", min: 1, max: 8 },
        { name: "spin", defaultVal: 3, type: "number", min: 0, max: 10 },
        { name: "randomness", defaultVal: 5, type: "number", min: 0, max: 10 },
        { name: "randomnessPower", defaultVal: 4, type: "number", min: 1, max: 10 },
        { name: "insideColor", defaultVal: "#ff6030", type: "color" },
        { name: "outsideColor", defaultVal: "#0949f0", type: "color" },
        { name: "rotationSpeed", defaultVal: 0.05, type: "number", min: 0, max: 1 },
      ],
    },
    {
      name: "setCount",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 100000, type: "number", min: 1000, max: 1000000 }],
    },
    {
      name: "setSize",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.01, type: "number", min: 0.001, max: 0.1 }],
    },
    {
      name: "setRadius",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.15, type: "number", min: 0.1, max: 10 }],
    },
    {
      name: "setBranches",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 3, type: "number", min: 1, max: 8 }],
    },
    {
      name: "setSpin",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 3, type: "number", min: 0, max: 10 }],
    },
    {
      name: "setRandomness",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 5, type: "number", min: 0, max: 10 }],
    },
    {
      name: "setRandomnessPower",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 4, type: "number", min: 1, max: 10 }],
    },
    {
      name: "setInsideColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#ff6030", type: "color" }],
    },
    {
      name: "setOutsideColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#0949f0", type: "color" }],
    },
    {
      name: "setRotationSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.05, type: "number", min: 0, max: 1 }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = Galaxy.name;
    this.customGroup = new THREE.Group();

    this.parameters = {
      count: 100000,
      size: 0.01,
      radius: 2.15,
      branches: 3,
      spin: 3,
      randomness: 5,
      randomnessPower: 4,
      insideColor: "#ff6030",
      outsideColor: "#0949f0",
      rotationSpeed: 0.05,
    };

    this.material = null;
    this.geometry = null;
    this.points = null;
    this.clock = new THREE.Clock();
    this.destroyed = false;
  }

  async start({
    count = 100000,
    size = 0.01,
    radius = 2.15,
    branches = 3,
    spin = 3,
    randomness = 5,
    randomnessPower = 4,
    insideColor = "#ff6030",
    outsideColor = "#0949f0",
    rotationSpeed = 0.05,
  } = {}) {
    this.parameters.count = Math.max(1000, Math.min(1000000, Number(count) || 100000));
    this.parameters.size = Math.max(0.001, Math.min(0.1, Number(size) || 0.01));
    this.parameters.radius = Math.max(0.1, Math.min(10, Number(radius) || 2.15));
    this.parameters.branches = Math.max(1, Math.min(8, Math.floor(Number(branches) || 3)));
    this.parameters.spin = Math.max(0, Math.min(10, Number(spin) || 3));
    this.parameters.randomness = Math.max(0, Math.min(10, Number(randomness) || 5));
    this.parameters.randomnessPower = Math.max(1, Math.min(10, Number(randomnessPower) || 4));
    this.parameters.insideColor = String(insideColor || "#ff6030");
    this.parameters.outsideColor = String(outsideColor || "#0949f0");
    this.parameters.rotationSpeed = Math.max(0, Math.min(1, Number(rotationSpeed) || 0.05));

    if (!this.renderer || !this.scene || !this.camera) {
      console.error("Galaxy: Renderer, scene, or camera not available");
      return;
    }

    this.renderer.setClearColor(0x000000, 0);

    this.generateGalaxy();

    if (this.points) {
      this.scene.add(this.customGroup);
    }

    const aspect = this.elem.offsetWidth / this.elem.offsetHeight || 16 / 9;
    this.camera.aspect = aspect;
    this.camera.fov = 75;
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(3, 3, 3);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();

    if (this.controls) {
      this.controls.enableDamping = false;
      this.controls.enableZoom = false;
      this.controls.enablePan = false;
      this.controls.enableRotate = false;
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }

    this.setModel(this.customGroup);
    this.setCustomAnimate(this.animate.bind(this));

    this.markNeedsRender();
    this.render(true);
  }

  generateGalaxy() {
    if (this.points !== null) {
      if (this.geometry) this.geometry.dispose();
      if (this.material) this.material.dispose();
      this.customGroup.remove(this.points);
    }

    this.material = new THREE.PointsMaterial({
      size: this.parameters.size,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.parameters.count * 3);
    const colors = new Float32Array(this.parameters.count * 3);
    const colorInside = new THREE.Color(this.parameters.insideColor);
    const colorOutside = new THREE.Color(this.parameters.outsideColor);

    for (let i = 0; i < this.parameters.count; i++) {
      const i3 = i * 3;
      const radius =
        Math.pow(Math.random() * this.parameters.randomness, Math.random() * this.parameters.radius) *
        (this.parameters.radius / this.parameters.randomness);
      const spinAngle = radius * this.parameters.spin;
      const branchAngle =
        ((i % this.parameters.branches) / this.parameters.branches) * Math.PI * 2;

      const negPos = [1, -1];
      const randomX =
        Math.pow(Math.random(), this.parameters.randomnessPower) *
        negPos[Math.floor(Math.random() * negPos.length)];
      const randomY =
        Math.pow(Math.random(), this.parameters.randomnessPower) *
        negPos[Math.floor(Math.random() * negPos.length)];
      const randomZ =
        Math.pow(Math.random(), this.parameters.randomnessPower) *
        negPos[Math.floor(Math.random() * negPos.length)];

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      const mixedColor = colorInside.clone();
      mixedColor.lerp(colorOutside, (Math.random() * radius) / this.parameters.radius);

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    this.points = new THREE.Points(this.geometry, this.material);
    this.customGroup.add(this.points);
  }

  animate() {
    if (this.destroyed || !this.clock || !this.camera || !this.renderer || !this.scene) return;

    const elapsedTime = this.clock.getElapsedTime();

    if (!this.modelSize) {
      this.markNeedsRender();
      return;
    }

    const zoomLevel = this.cameraSettings?.zoomLevel || 50;
    const minDistance = this.modelSize * 0.001;
    const maxDistance = this.modelSize * 2.5;
    const clampedPercentage = THREE.MathUtils.clamp(zoomLevel, 0, 100);
    const distance = THREE.MathUtils.lerp(
      minDistance,
      maxDistance,
      clampedPercentage / 100
    );

    const orbitRadius = distance;
    const angle = elapsedTime * this.parameters.rotationSpeed;
    this.camera.position.x = Math.cos(angle) * orbitRadius;
    this.camera.position.y = orbitRadius * 0.7;
    this.camera.position.z = Math.sin(angle) * orbitRadius;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();

    if (this.controls) {
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }

    this.markNeedsRender();
  }

  setCount({ value = 100000 } = {}) {
    const val = Number(value);
    this.parameters.count = Math.max(1000, Math.min(1000000, Number.isFinite(val) ? val : 100000));
    this.generateGalaxy();
    this.markNeedsRender();
  }

  setSize({ value = 0.01 } = {}) {
    const val = Number(value);
    this.parameters.size = Math.max(0.001, Math.min(0.1, Number.isFinite(val) ? val : 0.01));
    if (this.material) {
      this.material.size = this.parameters.size;
    }
    this.markNeedsRender();
  }

  setRadius({ value = 2.15 } = {}) {
    const val = Number(value);
    this.parameters.radius = Math.max(0.1, Math.min(10, Number.isFinite(val) ? val : 2.15));
    this.generateGalaxy();
    this.markNeedsRender();
  }

  setBranches({ value = 3 } = {}) {
    const val = Number(value);
    this.parameters.branches = Math.max(1, Math.min(8, Math.floor(Number.isFinite(val) ? val : 3)));
    this.generateGalaxy();
    this.markNeedsRender();
  }

  setSpin({ value = 3 } = {}) {
    const val = Number(value);
    this.parameters.spin = Math.max(0, Math.min(10, Number.isFinite(val) ? val : 3));
    this.generateGalaxy();
    this.markNeedsRender();
  }

  setRandomness({ value = 5 } = {}) {
    const val = Number(value);
    this.parameters.randomness = Math.max(0, Math.min(10, Number.isFinite(val) ? val : 5));
    this.generateGalaxy();
    this.markNeedsRender();
  }

  setRandomnessPower({ value = 4 } = {}) {
    const val = Number(value);
    this.parameters.randomnessPower = Math.max(1, Math.min(10, Number.isFinite(val) ? val : 4));
    this.generateGalaxy();
    this.markNeedsRender();
  }

  setInsideColor({ value = "#ff6030" } = {}) {
    this.parameters.insideColor = String(value || "#ff6030");
    this.generateGalaxy();
    this.markNeedsRender();
  }

  setOutsideColor({ value = "#0949f0" } = {}) {
    this.parameters.outsideColor = String(value || "#0949f0");
    this.generateGalaxy();
    this.markNeedsRender();
  }

  setRotationSpeed({ value = 0.05 } = {}) {
    const val = Number(value);
    this.parameters.rotationSpeed = Math.max(0, Math.min(1, Number.isFinite(val) ? val : 0.05));
  }

  destroy() {
    this.destroyed = true;

    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    if (this.points) {
      this.customGroup.remove(this.points);
    }

    super.destroy();
  }
}

export default Galaxy;
