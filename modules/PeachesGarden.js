/*
@nwWrld name: PeachesGarden
@nwWrld category: 3D
@nwWrld imports: BaseThreeJsModule, THREE
*/

class PeachesGarden extends BaseThreeJsModule {
  static methods = [
    ...BaseThreeJsModule.methods,
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "gridSize", defaultVal: 4, type: "number", min: 2, max: 8 },
        { name: "peachCount", defaultVal: 5, type: "number", min: 1, max: 20 },
        { name: "rotationSpeed", defaultVal: 1, type: "number", min: 0.1, max: 5 },
      ],
    },
    {
      name: "addPeach",
      executeOnLoad: false,
      options: [],
    },
  ];

  constructor(container) {
    super(container);
    this.name = PeachesGarden.name;
    this.peaches = [];
    this.arrayCamera = null;
    this.customScene = null;
    this.gridSize = 4;
    this.peachCount = 5;
    this.rotationSpeed = 1;
    this.background = null;
    this.customLights = [];
    this.init();
  }

  start({ gridSize = 4, peachCount = 5, rotationSpeed = 1 } = {}) {
    this.gridSize = Math.max(2, Math.min(8, Math.floor(Number(gridSize) || 4)));
    this.peachCount = Math.max(1, Math.min(20, Math.floor(Number(peachCount) || 5)));
    this.rotationSpeed = Math.max(0.1, Math.min(5, Number(rotationSpeed) || 1));
    
    this.rebuildScene();
  }

  init() {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;

    this.setupArrayCamera();
    this.setupLighting();
    this.setupBackground();
    this.createPeaches(this.peachCount);

    this.setCustomAnimate(this.animateLoop.bind(this));
  }

  render() {
    if (this.destroyed || !this.renderer) return;
    if (this.arrayCamera) {
      this.renderer.render(this.scene, this.arrayCamera);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  rebuildScene() {
    this.peaches.forEach((peach) => {
      this.scene.remove(peach.group);
      peach.group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    });
    this.peaches = [];

    this.setupArrayCamera();
    this.createPeaches(this.peachCount);
  }

  setupArrayCamera() {
    if (!this.elem) return;

    const width = this.elem.clientWidth;
    const height = this.elem.clientHeight;
    const aspectRatio = width / height;
    const amount = this.gridSize;

    const subWidth = (width / amount) * window.devicePixelRatio;
    const subHeight = (height / amount) * window.devicePixelRatio;

    const cameras = [];

    for (let y = 0; y < amount; y++) {
      for (let x = 0; x < amount; x++) {
        const subcamera = new THREE.PerspectiveCamera(40, aspectRatio, 0.1, 100);
        subcamera.viewport = new THREE.Vector4(
          Math.floor(x * subWidth),
          Math.floor(y * subHeight),
          Math.ceil(subWidth),
          Math.ceil(subHeight)
        );
        subcamera.position.x = ((x / amount) - 0.5) * 2;
        subcamera.position.y = (0.5 - (y / amount)) * 2;
        subcamera.position.z = 3;
        subcamera.lookAt(0, 0, 0);
        subcamera.updateMatrixWorld();
        cameras.push(subcamera);
      }
    }

    this.arrayCamera = new THREE.ArrayCamera(cameras);
    this.arrayCamera.position.z = 3;
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffeedd, 0.6);
    this.scene.add(ambient);
    this.customLights.push(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(2, 3, 2);
    mainLight.castShadow = true;
    mainLight.shadow.camera.zoom = 2;
    this.scene.add(mainLight);
    this.customLights.push(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffccaa, 0.5);
    fillLight.position.set(-2, 1, 1);
    this.scene.add(fillLight);
    this.customLights.push(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff9966, 0.3);
    rimLight.position.set(0, -2, 2);
    this.scene.add(rimLight);
    this.customLights.push(rimLight);
  }

  setupBackground() {
    const bgGeometry = new THREE.PlaneGeometry(50, 50);
    const bgMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x1a0a05,
      side: THREE.DoubleSide,
    });
    this.background = new THREE.Mesh(bgGeometry, bgMaterial);
    this.background.receiveShadow = true;
    this.background.position.set(0, 0, -3);
    this.scene.add(this.background);
  }

  createPeach() {
    const group = new THREE.Group();

    const peachGeometry = new THREE.SphereGeometry(0.35, 32, 32);
    const positions = peachGeometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      const newY = y * 0.9;
      let newX = x;
      let newZ = z;

      if (y > 0) {
        const indent = Math.sin(Math.atan2(z, x) * 2) * 0.03 * (y / 0.35);
        newX += indent * Math.cos(Math.atan2(z, x));
        newZ += indent * Math.sin(Math.atan2(z, x));
      }

      if (y > 0.2) {
        const crease = Math.abs(Math.sin(Math.atan2(z, x))) * 0.05;
        newX *= (1 - crease * (y - 0.2) / 0.15);
      }

      positions.setXYZ(i, newX, newY, newZ);
    }
    peachGeometry.computeVertexNormals();

    const peachColor = new THREE.Color().setHSL(
      0.05 + Math.random() * 0.03,
      0.7 + Math.random() * 0.2,
      0.6 + Math.random() * 0.15
    );

    const peachMaterial = new THREE.MeshPhongMaterial({
      color: peachColor,
      shininess: 30,
      specular: 0x332211,
    });

    const peachMesh = new THREE.Mesh(peachGeometry, peachMaterial);
    peachMesh.castShadow = true;
    peachMesh.receiveShadow = true;
    group.add(peachMesh);

    const stemGeometry = new THREE.CylinderGeometry(0.015, 0.02, 0.12, 8);
    const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.35;
    stem.rotation.z = (Math.random() - 0.5) * 0.3;
    group.add(stem);

    if (Math.random() > 0.5) {
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(0.04, 0.06, 0, 0.15);
      leafShape.quadraticCurveTo(-0.04, 0.06, 0, 0);

      const leafGeometry = new THREE.ShapeGeometry(leafShape);
      const leafMaterial = new THREE.MeshPhongMaterial({
        color: 0x2d5a27,
        side: THREE.DoubleSide,
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.set(0.02, 0.38, 0);
      leaf.rotation.x = -0.3;
      leaf.rotation.z = Math.random() * Math.PI;
      group.add(leaf);
    }

    return {
      group,
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.01,
      },
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.5 + Math.random() * 0.5,
    };
  }

  createPeaches(count) {
    for (let i = 0; i < count; i++) {
      const peach = this.createPeach();
      
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 0.5;
      peach.group.position.x = Math.cos(angle) * radius * (0.5 + Math.random() * 0.5);
      peach.group.position.y = (Math.random() - 0.5) * 1.5;
      peach.group.position.z = Math.sin(angle) * radius * 0.3 + (Math.random() - 0.5) * 0.5;

      peach.group.rotation.x = Math.random() * Math.PI;
      peach.group.rotation.y = Math.random() * Math.PI;

      this.scene.add(peach.group);
      this.peaches.push(peach);
    }
  }

  addPeach() {
    if (this.destroyed || this.peaches.length >= 30) return;

    const peach = this.createPeach();
    peach.group.position.x = (Math.random() - 0.5) * 2;
    peach.group.position.y = (Math.random() - 0.5) * 2;
    peach.group.position.z = (Math.random() - 0.5) * 1;
    peach.group.rotation.x = Math.random() * Math.PI;
    peach.group.rotation.y = Math.random() * Math.PI;

    this.scene.add(peach.group);
    this.peaches.push(peach);
  }

  animateLoop() {
    if (this.destroyed) return;

    const time = Date.now() * 0.001;
    const speed = this.rotationSpeed;

    this.peaches.forEach((peach) => {
      peach.group.rotation.x += peach.rotationSpeed.x * speed;
      peach.group.rotation.y += peach.rotationSpeed.y * speed;
      peach.group.rotation.z += peach.rotationSpeed.z * speed;

      const floatY = Math.sin(time * peach.floatSpeed + peach.floatOffset) * 0.05;
      peach.group.position.y += floatY * 0.01;
    });
  }

  destroy() {
    if (this.destroyed) return;

    this.peaches.forEach((peach) => {
      peach.group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
      this.scene.remove(peach.group);
    });
    this.peaches = [];

    this.customLights.forEach((light) => {
      this.scene.remove(light);
    });
    this.customLights = [];

    if (this.background) {
      this.background.geometry.dispose();
      this.background.material.dispose();
      this.scene.remove(this.background);
      this.background = null;
    }

    this.arrayCamera = null;

    super.destroy();
  }
}

export default PeachesGarden;
