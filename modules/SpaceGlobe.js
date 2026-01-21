/*
@nwWrld name: SpaceGlobe
@nwWrld category: Three.js
@nwWrld imports: BaseThreeJsModule, THREE, OrbitControls, createNoise2D, assetUrl
*/

class SpaceGlobe extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "autoRotateSpeed", defaultVal: 5, type: "number", min: 0, max: 20 },
        { name: "blobScale", defaultVal: 2, type: "number", min: 0.5, max: 5 },
        { name: "nucleusDetail", defaultVal: 28, type: "number", min: 1, max: 30 },
      ],
    },
    {
      name: "setAutoRotateSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 5, type: "number", min: 0, max: 20 }],
    },
    {
      name: "setBlobScale",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2, type: "number", min: 0.5, max: 5 }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = SpaceGlobe.name;
    this.customGroup = new THREE.Group();

    this.autoRotateSpeed = 5;
    this.blobScale = 2;
    this.nucleusDetail = 28;

    this.clock = new THREE.Clock();
    this.delta = 0;
    this.textures = {};
    this.texturePromise = null;

    this.nucleus = null;
    this.originalPositions = null;
    this.noise = null;
    this.sphereBg = null;
    this.pointStars = null;
    this.pointStars2 = null;
    this.pointComet1 = null;
    this.planet1 = null;
    this.planet2 = null;
    this.planet3 = null;
    this.stars = null;
    this.originalY = null;
    this.nucleusPosition = null;
    this.positionsStar = null;
    this.velocitiesStar = null;
    this.startPositions = null;
    this.time = null;

    this.animationStartTime3 = Date.now() + 6000;
    this.animationStartTime6 = Date.now() + 15000;
    this.expansionStartTime = Date.now() + 9000;
    this.MAX_EXPANSION_DISTANCE = 95;
    this.contractionStartTime = Date.now() + 20000;
    this.contractionDuration = 8000;
    this.centeringStartTime = Date.now() + 25000;
    this.centeringDuration = 8000;
    this.pointStarsContractStartTime = Date.now() + 25000;
    this.pointStarsContractDuration = 6000;
    this.TARGET_RADIUS = 95;

    this.destroyed = false;
  }

  async start({
    autoRotateSpeed = 5,
    blobScale = 2,
    nucleusDetail = 28,
  } = {}) {
    this.autoRotateSpeed = Math.max(0, Math.min(20, Number(autoRotateSpeed) || 5));
    this.blobScale = Math.max(0.5, Math.min(5, Number(blobScale) || 2));
    this.nucleusDetail = Math.max(1, Math.min(30, Math.floor(Number(nucleusDetail) || 28)));

    if (!this.renderer || !this.scene || !this.camera) {
      console.error("SpaceGlobe: Renderer, scene, or camera not available");
      return;
    }

    this.renderer.setClearColor(0x000000, 0);

    this.noise = createNoise2D();

    console.log("SpaceGlobe: Starting initialization...");
    console.log("SpaceGlobe: assetUrl available:", typeof assetUrl === "function");
    
    this.createElements();
    console.log("SpaceGlobe: Elements created (nucleus, sphereBg)");
    
    this.createMovingStars();
    console.log("SpaceGlobe: Moving stars created");
    
    this.createPointElement();
    console.log("SpaceGlobe: Point elements created (stars, planets, comet)");

    console.log("SpaceGlobe: Starting texture loading...");
    this.texturePromise = this.textureLoader();
    await this.texturePromise;
    
    const loadedTextures = Object.keys(this.textures).filter(k => this.textures[k]);
    console.log(`SpaceGlobe: Texture loading complete. Loaded ${loadedTextures.length}/${Object.keys(this.textures).length} textures:`, loadedTextures);
    
    this.applyTextures();
    console.log("SpaceGlobe: Textures applied to materials");

    this.scene.add(this.customGroup);

    const directionalLight = new THREE.DirectionalLight("#fff", 3);
    directionalLight.position.set(0, 50, -20);
    this.scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight("#ffffff", 1);
    ambientLight.position.set(0, -20, -40);
    this.scene.add(ambientLight);

    this.modelBoundingBox = new THREE.Box3().setFromObject(this.customGroup);
    this.modelCenter = new THREE.Vector3(0, 0, 0);
    this.modelSize = 180;

    const aspect = this.elem.offsetWidth / this.elem.offsetHeight || 16 / 9;
    this.camera.aspect = aspect;
    this.camera.fov = 55;
    this.camera.near = 0.01;
    this.camera.far = 1000;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, 150);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();

    if (this.controls) {
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = this.autoRotateSpeed;
      this.controls.maxDistance = 350;
      this.controls.minDistance = 150;
      this.controls.enablePan = false;
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }

    if (!this.isInitialized) {
      this.isInitialized = true;
      try {
        const { animationManager } = await import("../../src/projector/helpers/animationManager.js");
        if (animationManager) {
          animationManager.subscribe(this.animate.bind(this));
        }
      } catch (e) {
        console.warn("SpaceGlobe: Could not import animationManager, using custom animate only");
      }
    }

    this.setCustomAnimate(this.animate.bind(this));

    this.markNeedsRender();
    this.render(true);
  }

  async textureLoader() {
    const textureLoader = new THREE.TextureLoader();
    console.log("SpaceGlobe: Initializing texture loader");

    const texturePaths = {
      sky: "images/sky2.jpg",
      star: "images/star.jpg",
      flare1: "images/p1.png",
      flare2: "images/p2.png",
      flare3: "images/p7.png",
      planet1: "images/planet1.webp",
      planet2: "images/planet2.webp",
      planet3: "images/planet3.webp",
    };

    const textureMap = {};
    console.log("SpaceGlobe: Resolving texture paths using assetUrl...");
    console.log("SpaceGlobe: assetUrl type:", typeof assetUrl, "available:", typeof assetUrl === "function");
    
    if (typeof assetUrl !== "function") {
      console.error("SpaceGlobe: assetUrl is not available! Textures will not load.");
      console.error("SpaceGlobe: Make sure 'assetUrl' is in the @nwWrld imports list");
    }
    
    for (const [key, relPath] of Object.entries(texturePaths)) {
      let fullPath;
      if (typeof assetUrl === "function") {
        fullPath = assetUrl(relPath);
        if (!fullPath) {
          console.error(`SpaceGlobe: [${key}] assetUrl("${relPath}") returned null - assetsBaseUrl may not be set`);
          console.error(`SpaceGlobe: [${key}] This usually means the asset base URL is not configured`);
          fullPath = relPath;
        } else {
          console.log(`SpaceGlobe: [${key}] assetUrl("${relPath}") → "${fullPath}"`);
        }
      } else {
        fullPath = relPath;
        console.warn(`SpaceGlobe: [${key}] assetUrl not available, using relative path: "${relPath}"`);
        console.warn(`SpaceGlobe: [${key}] This will likely fail - check module imports`);
      }
      textureMap[key] = fullPath;
    }

    console.log("SpaceGlobe: Starting async texture loading for", Object.keys(textureMap).length, "textures");
    const startTime = Date.now();

    const results = await Promise.all(
      Object.entries(textureMap).map(([key, path]) => {
        return new Promise((resolve) => {
          if (!path) {
            console.warn(`SpaceGlobe: [${key}] No path resolved, skipping`);
            resolve(false);
            return;
          }
          
          if (path === texturePaths[key] && typeof assetUrl === "function") {
            console.error(`SpaceGlobe: [${key}] Path was not resolved by assetUrl!`);
            console.error(`SpaceGlobe: [${key}] assetUrl returned the same relative path, which means it's not working`);
            console.error(`SpaceGlobe: [${key}] This texture will likely fail to load`);
          }
          
          const loadStartTime = Date.now();
          console.log(`SpaceGlobe: [${key}] Attempting to load from: "${path}"`);
          console.log(`SpaceGlobe: [${key}] Path type: ${typeof path}, is URL: ${path.startsWith('http')}, is absolute: ${path.startsWith('/')}`);
          
          textureLoader.load(
            path,
            (texture) => {
              const loadTime = Date.now() - loadStartTime;
              if (!texture || !texture.image) {
                console.error(`SpaceGlobe: [${key}] Texture loaded but has no image data`);
                resolve(false);
                return;
              }
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.anisotropy = 16;
              this.textures[key] = texture;
              console.log(`SpaceGlobe: [${key}] ✓ Loaded successfully (${loadTime}ms) - Size: ${texture.image.width}x${texture.image.height}`);
              resolve(true);
            },
            (progress) => {
              if (progress && progress.total > 0) {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                console.log(`SpaceGlobe: [${key}] Loading progress: ${percent}% (${progress.loaded}/${progress.total} bytes)`);
              }
            },
            (error) => {
              const loadTime = Date.now() - loadStartTime;
              console.error(`SpaceGlobe: [${key}] ✗ Failed to load from "${path}" (${loadTime}ms)`);
              console.error(`SpaceGlobe: [${key}] Error:`, error);
              if (error && error.message) {
                console.error(`SpaceGlobe: [${key}] Error message:`, error.message);
              }
              if (error && error.target) {
                console.error(`SpaceGlobe: [${key}] Failed URL:`, error.target.src || error.target);
              }
              resolve(false);
            }
          );
        });
      })
    );

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r === true).length;
    const failCount = results.filter(r => r === false).length;
    console.log(`SpaceGlobe: Texture loading finished in ${totalTime}ms - Success: ${successCount}, Failed: ${failCount}`);

    return results;
  }

  applyTextures() {
    console.log("SpaceGlobe: Applying textures to materials...");
    let appliedCount = 0;
    
    if (this.pointStars && this.textures.flare1) {
      this.pointStars.material.map = this.textures.flare1;
      this.pointStars.material.needsUpdate = true;
      appliedCount++;
      console.log("SpaceGlobe: ✓ Applied flare1 to pointStars");
    } else {
      console.warn("SpaceGlobe: ✗ pointStars or flare1 texture missing");
    }
    
    if (this.pointStars2 && this.textures.flare2) {
      this.pointStars2.material.map = this.textures.flare2;
      this.pointStars2.material.needsUpdate = true;
      appliedCount++;
      console.log("SpaceGlobe: ✓ Applied flare2 to pointStars2");
    } else {
      console.warn("SpaceGlobe: ✗ pointStars2 or flare2 texture missing");
    }
    
    if (this.pointComet1 && this.textures.flare3) {
      this.pointComet1.material.map = this.textures.flare3;
      this.pointComet1.material.needsUpdate = true;
      appliedCount++;
      console.log("SpaceGlobe: ✓ Applied flare3 to pointComet1");
    } else {
      console.warn("SpaceGlobe: ✗ pointComet1 or flare3 texture missing");
    }
    
    if (this.planet1 && this.textures.planet1) {
      this.planet1.material.map = this.textures.planet1;
      this.planet1.material.needsUpdate = true;
      appliedCount++;
      console.log("SpaceGlobe: ✓ Applied planet1 texture");
    } else {
      console.warn("SpaceGlobe: ✗ planet1 or planet1 texture missing");
    }
    
    if (this.planet2 && this.textures.planet2) {
      this.planet2.material.map = this.textures.planet2;
      this.planet2.material.needsUpdate = true;
      appliedCount++;
      console.log("SpaceGlobe: ✓ Applied planet2 texture");
    } else {
      console.warn("SpaceGlobe: ✗ planet2 or planet2 texture missing");
    }
    
    if (this.planet3 && this.textures.planet3) {
      this.planet3.material.map = this.textures.planet3;
      this.planet3.material.needsUpdate = true;
      appliedCount++;
      console.log("SpaceGlobe: ✓ Applied planet3 texture");
    } else {
      console.warn("SpaceGlobe: ✗ planet3 or planet3 texture missing");
    }
    
    if (this.nucleus && this.textures.star) {
      this.nucleus.material.map = this.textures.star;
      this.nucleus.material.needsUpdate = true;
      appliedCount++;
      console.log("SpaceGlobe: ✓ Applied star texture to nucleus");
    } else {
      console.warn("SpaceGlobe: ✗ nucleus or star texture missing");
    }
    
    if (this.sphereBg && this.textures.sky) {
      this.sphereBg.material.map = this.textures.sky;
      this.sphereBg.material.needsUpdate = true;
      appliedCount++;
      console.log("SpaceGlobe: ✓ Applied sky texture to sphereBg");
    } else {
      console.warn("SpaceGlobe: ✗ sphereBg or sky texture missing");
    }
    
    if (this.stars && this.textures.flare2) {
      this.stars.material.map = this.textures.flare2;
      this.stars.material.needsUpdate = true;
      appliedCount++;
      console.log("SpaceGlobe: ✓ Applied flare2 to stars");
    } else {
      console.warn("SpaceGlobe: ✗ stars or flare2 texture missing");
    }
    
    console.log(`SpaceGlobe: Texture application complete - ${appliedCount}/9 textures applied`);
  }

  createElements() {
    const icosahedronGeometry = new THREE.IcosahedronGeometry(20, this.nucleusDetail);
    this.originalPositions = new Float32Array(
      icosahedronGeometry.attributes.position.array
    );
    const lambertMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
    });
    this.nucleus = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    this.nucleus.position.set(0, 0, 0);
    this.customGroup.add(this.nucleus);

    const geometrySphereBg = new THREE.SphereGeometry(90, 50, 50);
    const materialSphereBg = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0x000000,
    });
    this.sphereBg = new THREE.Mesh(geometrySphereBg, materialSphereBg);
    this.sphereBg.position.set(0, 0, 0);
    this.customGroup.add(this.sphereBg);
  }

  createPointElement() {
    this.pointStars = this.createPointParticles({
      size: 0.5,
      total: 200,
      transparent: true,
      max: 130,
      min: 130,
    });
    this.customGroup.add(this.pointStars);

    this.pointStars2 = this.createPointParticles({
      size: 3,
      total: 600,
      transparent: true,
      max: 33,
      min: 25,
      pointY: 0,
    });
    this.customGroup.add(this.pointStars2);

    this.pointComet1 = this.createPointParticles({
      size: 12,
      total: 1,
      transparent: true,
      max: 25,
      min: 25,
    });
    this.customGroup.add(this.pointComet1);

    this.planet1 = this.createPointParticles({
      size: 9,
      total: 1,
      transparent: false,
      max: 60,
      min: 40,
    });
    this.planet2 = this.createPointParticles({
      size: 12,
      total: 1,
      transparent: false,
      max: 60,
      min: 40,
    });
    this.planet3 = this.createPointParticles({
      size: 12,
      total: 1,
      transparent: false,
      max: 60,
      min: 40,
    });
    this.customGroup.add(this.planet1);
    this.customGroup.add(this.planet2);
    this.customGroup.add(this.planet3);
  }

  createPointParticles({
    size,
    total,
    transparent = true,
    max = 150,
    min = 70,
    pointY,
  }) {
    const positions = new Float32Array(total * 3);
    const originalY = new Float32Array(total);
    let point, idx;

    for (let i = 0; i < total; i++) {
      point = this.randomPointSphere(THREE.MathUtils.randInt(max, min));
      idx = i * 3;
      positions[idx] = point.x;
      positions[idx + 2] = point.z;
      if (pointY !== undefined) {
        positions[idx + 1] = pointY;
        originalY[i] = point.y;
      } else {
        positions[idx + 1] = point.y;
      }
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointGeometry.setAttribute("originalY", new THREE.BufferAttribute(originalY, 1));

    const blending = transparent ? THREE.AdditiveBlending : THREE.NormalBlending;
    const pointMaterial = new THREE.PointsMaterial({
      size: size,
      blending: blending,
      transparent: true,
      depthWrite: false,
    });

    return new THREE.Points(pointGeometry, pointMaterial);
  }

  createMovingStars() {
    const totalStars = 5;
    const positions = new Float32Array(totalStars * 3);
    const velocities = new Float32Array(totalStars);
    const startPositions = new Float32Array(totalStars * 3);
    let point, radius, idx;

    for (let i = 0; i < totalStars; i++) {
      radius = THREE.MathUtils.randFloat(200, 300);
      point = this.randomPointSphere(radius);
      idx = i * 3;

      positions[idx] = point.x;
      positions[idx + 1] = point.y;
      positions[idx + 2] = point.z;

      startPositions[idx] = point.x;
      startPositions[idx + 1] = point.y;
      startPositions[idx + 2] = point.z;

      velocities[i] = THREE.MathUtils.randInt(50, 400);
    }

    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 1));
    starsGeometry.setAttribute("startPosition", new THREE.BufferAttribute(startPositions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 14,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.stars.name = "moving_stars";
    this.stars.visible = false;
    this.customGroup.add(this.stars);
  }

  randomPointSphere(radius) {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    const dx = 0 + radius * Math.sin(phi) * Math.cos(theta);
    const dy = 0 + radius * Math.sin(phi) * Math.sin(theta);
    const dz = 0 + radius * Math.cos(phi);

    return new THREE.Vector3(dx, dy, dz);
  }

  updateNucleus() {
    if (Date.now() < this.animationStartTime3) return;

    const animationEasing1 = Math.min(1, (Date.now() - this.animationStartTime3) / 2000);

    for (let i = 0; i < this.nucleusPosition.count; i++) {
      const xNucleus = this.originalPositions[i * 3];
      const yNucleus = this.originalPositions[i * 3 + 1];
      const zNucleus = this.originalPositions[i * 3 + 2];

      const lengthNucleus = Math.sqrt(
        xNucleus * xNucleus + yNucleus * yNucleus + zNucleus * zNucleus
      );
      const nxNucleus = xNucleus / lengthNucleus;
      const nyNucleus = yNucleus / lengthNucleus;
      const nzNucleus = zNucleus / lengthNucleus;

      const distanceNucleus =
        20 +
        this.noise(
          nxNucleus + this.time * 0.0004,
          nyNucleus + this.time * 0.0004
        ) *
          this.blobScale *
          animationEasing1;

      this.nucleusPosition.array[i * 3] = nxNucleus * distanceNucleus;
      this.nucleusPosition.array[i * 3 + 1] = nyNucleus * distanceNucleus;
      this.nucleusPosition.array[i * 3 + 2] = nzNucleus * distanceNucleus;
    }
    this.nucleusPosition.needsUpdate = true;
    this.nucleus.geometry.computeVertexNormals();
  }

  updateMovingStars() {
    if (Date.now() < this.animationStartTime6) return;

    const movingStarsEasing = Math.min(1, (Date.now() - this.animationStartTime6) / 2000);

    for (let i = 0; i < this.positionsStar.count; i++) {
      this.updateSingleMovingStar(i, movingStarsEasing);
    }

    this.positionsStar.needsUpdate = true;
    this.velocitiesStar.needsUpdate = true;
  }

  updateSingleMovingStar(i, easing) {
    const idx = i * 3;
    const moveAmount =
      easing * ((0 - this.positionsStar.array[idx]) / this.velocitiesStar.array[i]);

    this.positionsStar.array[idx] += moveAmount;
    this.positionsStar.array[idx + 1] +=
      easing * ((0 - this.positionsStar.array[idx + 1]) / this.velocitiesStar.array[i]);
    this.positionsStar.array[idx + 2] +=
      easing * ((0 - this.positionsStar.array[idx + 2]) / this.velocitiesStar.array[i]);

    this.velocitiesStar.array[i] -= 0.1 * easing;

    if (
      this.positionsStar.array[idx] <= 2 &&
      this.positionsStar.array[idx] >= -2 &&
      this.positionsStar.array[idx + 2] <= 2 &&
      this.positionsStar.array[idx + 2] >= -2
    ) {
      this.positionsStar.array[idx] = this.startPositions.array[idx];
      this.positionsStar.array[idx + 1] = this.startPositions.array[idx + 1];
      this.positionsStar.array[idx + 2] = this.startPositions.array[idx + 2];
      this.velocitiesStar.array[i] = 120;
    }
  }

  updatePointStars2() {
    for (let i = 0; i < this.originalY.count; i++) {
      this.updateSinglePointStar2(i);
    }
    if (this.pointStars2 && this.pointStars2.geometry) {
      this.pointStars2.geometry.attributes.position.needsUpdate = true;
    }
  }

  updateSinglePointStar2(i) {
    const positions = this.pointStars2.geometry.attributes.position;
    const currentY = positions.array[i * 3 + 1];
    const targetY = this.originalY.array[i];

    if (Date.now() >= this.animationStartTime3) {
      const newYInitial = currentY + (targetY - currentY) * 0.02;
      positions.array[i * 3 + 1] = newYInitial;
    }

    if (Date.now() >= this.expansionStartTime && Date.now() < this.contractionStartTime) {
      const xExpansion = positions.array[i * 3];
      const yExpansion = positions.array[i * 3 + 1];
      const zExpansion = positions.array[i * 3 + 2];

      const currentDistanceExpansion = Math.sqrt(
        xExpansion * xExpansion + yExpansion * yExpansion + zExpansion * zExpansion
      );

      if (currentDistanceExpansion < this.MAX_EXPANSION_DISTANCE) {
        const distanceRatioExpansion = currentDistanceExpansion / this.MAX_EXPANSION_DISTANCE;
        const expansionFactor = 1 + 0.008 * (1 - distanceRatioExpansion);

        positions.array[i * 3] = xExpansion * expansionFactor;
        positions.array[i * 3 + 1] = yExpansion * expansionFactor;
        positions.array[i * 3 + 2] = zExpansion * expansionFactor;
      }
    }

    if (Date.now() >= this.contractionStartTime) {
      const timeSinceStartContr = Date.now() - this.contractionStartTime;
      const easingContr = Math.min(1, timeSinceStartContr / this.contractionDuration);

      const xContr = positions.array[i * 3];
      const yContr = positions.array[i * 3 + 1];
      const zContr = positions.array[i * 3 + 2];

      const currentDistanceContr = Math.sqrt(
        xContr * xContr + yContr * yContr + zContr * zContr
      );
      const originalRadiusContr = THREE.MathUtils.randFloat(25, 33);

      const normalizedXContr = (xContr / currentDistanceContr) * originalRadiusContr;
      const normalizedYContr = (yContr / currentDistanceContr) * originalRadiusContr;
      const normalizedZContr = (zContr / currentDistanceContr) * originalRadiusContr;

      const contractionSpeedContr = 0.02 * easingContr;
      positions.array[i * 3] = xContr + (normalizedXContr - xContr) * contractionSpeedContr;
      positions.array[i * 3 + 1] = yContr + (normalizedYContr - yContr) * contractionSpeedContr;
      positions.array[i * 3 + 2] = zContr + (normalizedZContr - zContr) * contractionSpeedContr;
    }

    if (Date.now() >= this.centeringStartTime) {
      const timeSinceStartCenter = Date.now() - this.centeringStartTime;
      const easingCenter = Math.min(1, timeSinceStartCenter / this.centeringDuration);

      const xCenter = positions.array[i * 3];
      const yCenter = positions.array[i * 3 + 1];
      const zCenter = positions.array[i * 3 + 2];

      const centeringSpeed = 0.02 * easingCenter;
      positions.array[i * 3] = xCenter + (0 - xCenter) * centeringSpeed;
      positions.array[i * 3 + 1] = yCenter + (0 - yCenter) * centeringSpeed;
      positions.array[i * 3 + 2] = zCenter + (0 - zCenter) * centeringSpeed;

      this.pointStars2.material.opacity = 1 - easingCenter;

      if (easingCenter >= 1) {
        this.pointStars2.visible = false;
        if (this.stars) {
          this.stars.visible = true;
        }
      }
    }
  }

  updateRotations() {
    if (this.pointStars) {
      this.pointStars.rotation.y -= 0.0007;
    }
    if (this.pointComet1) {
      this.pointComet1.rotation.z -= 0.01;
      this.pointComet1.rotation.y += 0.001;
    }
    if (this.pointStars2) {
      this.pointStars2.rotation.x -= 0.001;
    }
    if (this.planet1) {
      this.planet1.rotation.y += 0.001;
    }
    if (this.planet2) {
      this.planet2.rotation.z += 0.003;
    }
    if (this.planet3) {
      this.planet3.rotation.x += 0.0005;
    }
  }

  updatePointStarsContraction() {
    const timeSinceStartContraction = Date.now() - this.pointStarsContractStartTime;
    const easingContraction = Math.min(
      1,
      timeSinceStartContraction / this.pointStarsContractDuration
    );
    const positionsContraction = this.pointStars.geometry.attributes.position;

    this.pointStars.material.size = 0.4 + 0.7 * easingContraction;

    for (let i = 0; i < positionsContraction.count; i++) {
      const xPointContr = positionsContraction.array[i * 3];
      const yPointContr = positionsContraction.array[i * 3 + 1];
      const zPointContr = positionsContraction.array[i * 3 + 2];

      const currentDistancePointContr = Math.sqrt(
        xPointContr * xPointContr +
          yPointContr * yPointContr +
          zPointContr * zPointContr
      );

      const nxPointContr = xPointContr / currentDistancePointContr;
      const nyPointContr = yPointContr / currentDistancePointContr;
      const nzPointContr = zPointContr / currentDistancePointContr;

      const targetXPointContr = nxPointContr * this.TARGET_RADIUS;
      const targetYPointContr = nyPointContr * this.TARGET_RADIUS;
      const targetZPointContr = nzPointContr * this.TARGET_RADIUS;

      const contractionSpeedPointContr = 0.02 * easingContraction;
      positionsContraction.array[i * 3] =
        xPointContr + (targetXPointContr - xPointContr) * contractionSpeedPointContr;
      positionsContraction.array[i * 3 + 1] =
        yPointContr + (targetYPointContr - yPointContr) * contractionSpeedPointContr;
      positionsContraction.array[i * 3 + 2] =
        zPointContr + (targetZPointContr - zPointContr) * contractionSpeedPointContr;
    }

    positionsContraction.needsUpdate = true;
  }

  animate() {
    if (this.destroyed || !this.clock || !this.renderer || !this.scene || !this.camera) return;

    if (!this.nucleus || !this.pointStars2) {
      this.markNeedsRender();
      return;
    }

    this.nucleusPosition = this.nucleus.geometry.attributes.position;
    this.originalY = this.pointStars2.geometry.attributes.originalY;
    this.time = Date.now();

    this.updateNucleus();

    if (this.stars) {
      this.positionsStar = this.stars.geometry.attributes.position;
      this.velocitiesStar = this.stars.geometry.attributes.velocity;
      this.startPositions = this.stars.geometry.attributes.startPosition;
      this.updateMovingStars();
    }

    this.updatePointStars2();
    this.updateRotations();

    if (Date.now() >= this.pointStarsContractStartTime) {
      this.updatePointStarsContraction();
    }

    if (this.controls) {
      this.controls.autoRotateSpeed = this.autoRotateSpeed;
      this.controls.update();
    }

    this.markNeedsRender();
  }

  setAutoRotateSpeed({ value = 5 } = {}) {
    const val = Number(value);
    this.autoRotateSpeed = Math.max(0, Math.min(20, Number.isFinite(val) ? val : 5));
    if (this.controls) {
      this.controls.autoRotateSpeed = this.autoRotateSpeed;
    }
  }

  setBlobScale({ value = 2 } = {}) {
    const val = Number(value);
    this.blobScale = Math.max(0.5, Math.min(5, Number.isFinite(val) ? val : 2));
  }

  destroy() {
    this.destroyed = true;

    if (this.textures) {
      Object.values(this.textures).forEach((texture) => {
        if (texture && texture.dispose) {
          texture.dispose();
        }
      });
    }

    super.destroy();
  }
}

export default SpaceGlobe;
