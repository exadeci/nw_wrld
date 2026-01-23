/*
@nwWrld name: OceanCinematic
@nwWrld category: Shader
@nwWrld imports: BaseThreeJsModule, THREE
*/

class OceanCinematic extends BaseThreeJsModule {
  static methods = [
    ...BaseThreeJsModule.methods,
    {
      name: "setCloudColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#101018", type: "string" }],
    },
    {
      name: "setCloudDensity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.3, type: "number", min: 0.0, max: 3.0 }],
    },
    {
      name: "setCloudSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.05, type: "number", min: 0.0, max: 1.0 }],
    },
    {
      name: "setDustStrength",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.0, max: 5.0 }],
    },
    {
      name: "setEnableClouds",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setEnableFX",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setEnableGrid",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setEnableReflections",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setFlareAngle",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 140, type: "number", min: 0, max: 360 }],
    },
    {
      name: "setFlareGhosting",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.8, type: "number", min: 0.0, max: 5.0 }],
    },
    {
      name: "setFlareIntensity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.5, type: "number", min: 0.0, max: 5.0 }],
    },
    {
      name: "setFlareStreak",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.0, max: 5.0 }],
    },
    {
      name: "setFlySpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.5, type: "number", min: 0.0, max: 5.0 }],
    },
    {
      name: "setGrainAmount",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.0, type: "number", min: 0.0, max: 0.5 }],
    },
    {
      name: "setGrainScale",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 50.0, type: "number", min: 10.0, max: 200.0 }],
    },
    {
      name: "setHaloRadius",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.3, type: "number", min: 0.0, max: 1.0 }],
    },
    {
      name: "setHaloSize",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.02, type: "number", min: 0.0, max: 0.1 }],
    },
    {
      name: "setHaloStrength",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.5, type: "number", min: 0.0, max: 2.0 }],
    },
    {
      name: "setHorizonColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#0a0a15", type: "string" }],
    },
    {
      name: "setHorizonFade",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.05, type: "number", min: 0.0, max: 0.2 }],
    },
    {
      name: "setPreset",
      executeOnLoad: false,
      options: [{ name: "preset", defaultVal: "Night", type: "select", values: ["Sunset", "Sunny", "Cloudy", "Night", "Twilight", "Dark"] }],
    },
    {
      name: "setReflectionStrength",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.5, type: "number", min: 0.0, max: 10.0 }],
    },
    {
      name: "setReflectionWidth",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.015, type: "number", min: 0.001, max: 0.5 }],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.2, type: "number", min: 0.0, max: 1.0 }],
    },
    {
      name: "setSssBaseColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#000005", type: "string" }],
    },
    {
      name: "setSssStrength",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 4.0, type: "number", min: 0.0, max: 10.0 }],
    },
    {
      name: "setSssTipColor",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: "#8888aa", type: "string" }],
    },
    {
      name: "setStyle",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2, type: "number", min: 0, max: 4 }],
    },
    {
      name: "setSunIntensity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 3.0, type: "number", min: 0.0, max: 10.0 }],
    },
    {
      name: "setSunPosX",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.0, type: "number", min: -1.5, max: 1.5 }],
    },
    {
      name: "setSunPosY",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.3, type: "number", min: -0.5, max: 1.0 }],
    },
    {
      name: "setSunSize",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.9, type: "number", min: 0.0, max: 5.0 }],
    },
    {
      name: "setVignetteStrength",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.65, type: "number", min: 0.0, max: 1.0 }],
    },
    {
      name: "setWaveChoppiness",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.5, type: "number", min: 0.0, max: 3.0 }],
    },
    {
      name: "setWaveHeight",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.2, type: "number", min: 0.0, max: 2.5 }],
    },
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "activePreset", defaultVal: "Night", type: "select", values: ["Sunset", "Sunny", "Cloudy", "Night", "Twilight", "Dark"] },
        { name: "cloudColor", defaultVal: "#101018", type: "string" },
        { name: "cloudDensity", defaultVal: 0.3, type: "number", min: 0.0, max: 3.0 },
        { name: "cloudSpeed", defaultVal: 0.05, type: "number", min: 0.0, max: 1.0 },
        { name: "dustStrength", defaultVal: 1.0, type: "number", min: 0.0, max: 5.0 },
        { name: "enableClouds", defaultVal: true, type: "boolean" },
        { name: "enableFX", defaultVal: true, type: "boolean" },
        { name: "enableGrid", defaultVal: true, type: "boolean" },
        { name: "enableReflections", defaultVal: true, type: "boolean" },
        { name: "flareAngle", defaultVal: 140, type: "number", min: 0, max: 360 },
        { name: "flareGhosting", defaultVal: 0.8, type: "number", min: 0.0, max: 5.0 },
        { name: "flareIntensity", defaultVal: 1.5, type: "number", min: 0.0, max: 5.0 },
        { name: "flareStreak", defaultVal: 1.0, type: "number", min: 0.0, max: 5.0 },
        { name: "flySpeed", defaultVal: 0.5, type: "number", min: 0.0, max: 5.0 },
        { name: "grainAmount", defaultVal: 0.0, type: "number", min: 0.0, max: 0.5 },
        { name: "grainScale", defaultVal: 50.0, type: "number", min: 10.0, max: 200.0 },
        { name: "haloRadius", defaultVal: 0.3, type: "number", min: 0.0, max: 1.0 },
        { name: "haloSize", defaultVal: 0.02, type: "number", min: 0.0, max: 0.1 },
        { name: "haloStrength", defaultVal: 1.5, type: "number", min: 0.0, max: 2.0 },
        { name: "horizonColor", defaultVal: "#0a0a15", type: "string" },
        { name: "horizonFade", defaultVal: 0.05, type: "number", min: 0.0, max: 0.2 },
        { name: "reflectionStrength", defaultVal: 2.5, type: "number", min: 0.0, max: 10.0 },
        { name: "reflectionWidth", defaultVal: 0.015, type: "number", min: 0.001, max: 0.5 },
        { name: "speed", defaultVal: 0.2, type: "number", min: 0.0, max: 1.0 },
        { name: "sssBaseColor", defaultVal: "#000005", type: "string" },
        { name: "sssStrength", defaultVal: 4.0, type: "number", min: 0.0, max: 10.0 },
        { name: "sssTipColor", defaultVal: "#8888aa", type: "string" },
        { name: "style", defaultVal: 2, type: "number", min: 0, max: 4 },
        { name: "sunIntensity", defaultVal: 3.0, type: "number", min: 0.0, max: 10.0 },
        { name: "sunPosX", defaultVal: 0.0, type: "number", min: -1.5, max: 1.5 },
        { name: "sunPosY", defaultVal: 0.3, type: "number", min: -0.5, max: 1.0 },
        { name: "sunSize", defaultVal: 0.9, type: "number", min: 0.0, max: 5.0 },
        { name: "vignetteStrength", defaultVal: 0.65, type: "number", min: 0.0, max: 1.0 },
        { name: "waveChoppiness", defaultVal: 2.5, type: "number", min: 0.0, max: 3.0 },
        { name: "waveHeight", defaultVal: 0.2, type: "number", min: 0.0, max: 2.5 },
      ],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = OceanCinematic.name;
    this.customGroup = new THREE.Group();

    this.PRESETS = {
      Sunset: {
        sunPosX: 0.0,
        sunPosY: 0.05,
        sunSize: 2.1,
        sunIntensity: 4.0,
        horizonColor: "#ff2200",
        enableClouds: true,
        cloudDensity: 0.6,
        cloudColor: "#ffaa00",
        waveHeight: 0.22,
        speed: 0.35,
        sssBaseColor: "#000000",
        sssTipColor: "#ff3300",
        reflectionStrength: 1.4,
        reflectionWidth: 0.05,
        haloStrength: 0.5,
        haloRadius: 0.3,
        haloSize: 0.02,
        vignetteStrength: 0.5,
        enableGrid: false,
        flareIntensity: 1.0,
        flareGhosting: 1.0,
        flareStreak: 2.0,
        flareAngle: 140
      },
      Sunny: {
        sunPosX: 0.0,
        sunPosY: 0.6,
        sunSize: 1.0,
        sunIntensity: 6.0,
        horizonColor: "#00bbff",
        enableClouds: true,
        cloudDensity: 0.25,
        cloudColor: "#ffffff",
        waveHeight: 0.25,
        speed: 0.4,
        sssBaseColor: "#001a33",
        sssTipColor: "#0099ff",
        reflectionStrength: 3.0,
        reflectionWidth: 0.1,
        haloStrength: 0.2,
        haloRadius: 0.3,
        haloSize: 0.02,
        vignetteStrength: 0.2,
        enableGrid: false,
        flareIntensity: 0.8,
        flareGhosting: 0.5,
        flareStreak: 3.0,
        flareAngle: 140
      },
      Cloudy: {
        sunPosX: 0.0,
        sunPosY: 0.3,
        sunSize: 3.0,
        sunIntensity: 1.5,
        horizonColor: "#667788",
        enableClouds: true,
        cloudDensity: 1.5,
        cloudColor: "#556677",
        waveHeight: 0.45,
        speed: 0.5,
        sssBaseColor: "#111520",
        sssTipColor: "#4a5a6a",
        reflectionStrength: 0.8,
        reflectionWidth: 0.3,
        haloStrength: 0.1,
        haloRadius: 0.3,
        haloSize: 0.02,
        vignetteStrength: 0.4,
        enableGrid: false,
        flareIntensity: 0.2,
        flareGhosting: 0.3,
        flareStreak: 0.5,
        flareAngle: 140
      },
      Night: {
        sunPosX: 0.0,
        sunPosY: 0.3,
        sunSize: 0.9,
        sunIntensity: 3.0,
        horizonColor: "#0a0a15",
        enableClouds: true,
        cloudDensity: 0.3,
        cloudColor: "#101018",
        waveHeight: 0.2,
        speed: 0.2,
        sssBaseColor: "#000005",
        sssTipColor: "#8888aa",
        reflectionStrength: 2.5,
        reflectionWidth: 0.015,
        haloStrength: 1.5,
        haloRadius: 0.3,
        haloSize: 0.02,
        vignetteStrength: 0.65,
        enableGrid: false,
        flareIntensity: 1.5,
        flareGhosting: 0.8,
        flareStreak: 1.0,
        flareAngle: 140
      },
      Twilight: {
        sunPosX: 0.0,
        sunPosY: -0.05,
        sunSize: 2.5,
        sunIntensity: 2.0,
        horizonColor: "#1a0a20",
        enableClouds: true,
        cloudDensity: 0.4,
        cloudColor: "#2a1a30",
        waveHeight: 0.3,
        speed: 0.25,
        sssBaseColor: "#050008",
        sssTipColor: "#6644aa",
        reflectionStrength: 1.8,
        reflectionWidth: 0.08,
        haloStrength: 0.8,
        haloRadius: 0.4,
        haloSize: 0.025,
        vignetteStrength: 0.55,
        enableGrid: false,
        flareIntensity: 1.2,
        flareGhosting: 1.0,
        flareStreak: 1.5,
        flareAngle: 140
      },
      Dark: {
        sunPosX: 0.0,
        sunPosY: 0.15,
        sunSize: 0.5,
        sunIntensity: 4.8,
        horizonColor: "#4476ff",
        enableClouds: true,
        cloudDensity: 0.15,
        cloudColor: "#080810",
        waveHeight: 0.35,
        speed: 0.15,
        sssBaseColor: "#000002",
        sssTipColor: "#222233",
        reflectionStrength: 8.2,
        reflectionWidth: 0.5,
        haloStrength: 0.6,
        haloRadius: 0.54,
        haloSize: 0.1,
        vignetteStrength: 0.75,
        enableGrid: false,
        flareIntensity: 0.8,
        flareGhosting: 0.4,
        flareStreak: 0.5,
        flareAngle: 140
      }
    };

    this.activePreset = ["Night"];
    this.presetAnimationSpeed = 0.1;
    this.presetAnimationTime = 0;
    this.style = 2;
    this.enableGrid = true;
    this.sunPosX = 0.0;
    this.sunPosY = 0.3;
    this.sunSize = 0.9;
    this.sunIntensity = 3.0;
    this.horizonColor = "#0a0a15";
    this.enableClouds = true;
    this.cloudDensity = 0.3;
    this.cloudSpeed = 0.05;
    this.cloudColor = "#101018";
    this.horizonFade = 0.05;
    this.waveHeight = 0.2;
    this.waveChoppiness = 2.5;
    this.speed = 0.2;
    this.sssBaseColor = "#000005";
    this.sssTipColor = "#8888aa";
    this.sssStrength = 4.0;
    this.enableReflections = true;
    this.reflectionStrength = 2.5;
    this.reflectionWidth = 0.015;
    this.flySpeed = 0.5;
    this.enableFX = true;
    this.dustStrength = 1.0;
    this.flareIntensity = 1.5;
    this.flareGhosting = 0.8;
    this.flareStreak = 1.0;
    this.flareAngle = 140;
    this.haloStrength = 1.5;
    this.haloRadius = 0.3;
    this.haloSize = 0.02;
    this.grainAmount = 0.0;
    this.grainScale = 50.0;
    this.vignetteStrength = 0.65;

    this.mousePos = new THREE.Vector2(0, 0);
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.clock = null;
    this.time = 0;
    this.destroyed = false;
    this.uniforms = null;
  }

  async start({
    activePreset = ["Night"],
    style = 2,
    enableGrid = true,
    sunPosX = 0.0,
    sunPosY = 0.3,
    sunSize = 0.9,
    sunIntensity = 3.0,
    horizonColor = "#0a0a15",
    enableClouds = true,
    cloudDensity = 0.3,
    cloudSpeed = 0.05,
    cloudColor = "#101018",
    horizonFade = 0.05,
    waveHeight = 0.2,
    waveChoppiness = 2.5,
    speed = 0.2,
    sssBaseColor = "#000005",
    sssTipColor = "#8888aa",
    sssStrength = 4.0,
    enableReflections = true,
    reflectionStrength = 2.5,
    reflectionWidth = 0.015,
    flySpeed = 0.5,
    enableFX = true,
    dustStrength = 1.0,
    flareIntensity = 1.5,
    flareGhosting = 0.8,
    flareStreak = 1.0,
    flareAngle = 140,
    haloStrength = 1.5,
    haloRadius = 0.3,
    haloSize = 0.02,
    grainAmount = 0.0,
    grainScale = 50.0,
    vignetteStrength = 0.65,
  } = {}) {
    this.activePreset = Array.isArray(activePreset) ? activePreset : (activePreset ? [activePreset] : ["Night"]);
    this.presetAnimationTime = 0;
    
    const presetName = Array.isArray(activePreset) ? activePreset[0] : activePreset;
    const presetApplied = presetName && this.PRESETS[presetName];
    
    if (presetApplied) {
      const firstPreset = this.PRESETS[presetName];
      const styleToPreserve = style !== undefined ? Number(style) : this.style;
      Object.assign(this, firstPreset);
      this.style = Math.max(0, Math.min(4, styleToPreserve || 2));
    } else {
      this.style = Math.max(0, Math.min(4, Number(style) || this.style || 2));
    }
    
    this.enableGrid = Boolean(enableGrid !== undefined ? enableGrid : this.enableGrid);
    if (sunPosX !== undefined) this.sunPosX = Math.max(-1.5, Math.min(1.5, Number(sunPosX) || 0.0));
    if (sunPosY !== undefined) this.sunPosY = Math.max(-0.5, Math.min(1.0, Number(sunPosY) || 0.3));
    if (sunSize !== undefined) this.sunSize = Math.max(0.0, Math.min(5.0, Number(sunSize) || 0.9));
    if (sunIntensity !== undefined) this.sunIntensity = Math.max(0.0, Math.min(10.0, Number(sunIntensity) || 3.0));
    if (horizonColor !== undefined) this.horizonColor = horizonColor || "#0a0a15";
    if (enableClouds !== undefined) this.enableClouds = Boolean(enableClouds);
    if (cloudDensity !== undefined) this.cloudDensity = Math.max(0.0, Math.min(3.0, Number(cloudDensity) || 0.3));
    if (cloudSpeed !== undefined) this.cloudSpeed = Math.max(0.0, Math.min(1.0, Number(cloudSpeed) || 0.05));
    if (cloudColor !== undefined) this.cloudColor = cloudColor || "#101018";
    if (horizonFade !== undefined) this.horizonFade = Math.max(0.0, Math.min(0.2, Number(horizonFade) || 0.05));
    if (waveHeight !== undefined) this.waveHeight = Math.max(0.0, Math.min(2.5, Number(waveHeight) || 0.2));
    if (waveChoppiness !== undefined) this.waveChoppiness = Math.max(0.0, Math.min(3.0, Number(waveChoppiness) || 2.5));
    if (speed !== undefined) this.speed = Math.max(0.0, Math.min(1.0, Number(speed) || 0.2));
    if (sssBaseColor !== undefined) this.sssBaseColor = sssBaseColor || "#000005";
    if (sssTipColor !== undefined) this.sssTipColor = sssTipColor || "#8888aa";
    if (sssStrength !== undefined) this.sssStrength = Math.max(0.0, Math.min(10.0, Number(sssStrength) || 4.0));
    if (enableReflections !== undefined) this.enableReflections = Boolean(enableReflections);
    if (reflectionStrength !== undefined) this.reflectionStrength = Math.max(0.0, Math.min(10.0, Number(reflectionStrength) || 2.5));
    if (reflectionWidth !== undefined) this.reflectionWidth = Math.max(0.001, Math.min(0.5, Number(reflectionWidth) || 0.015));
    if (flySpeed !== undefined) this.flySpeed = Math.max(0.0, Math.min(5.0, Number(flySpeed) || 0.5));
    if (enableFX !== undefined) this.enableFX = Boolean(enableFX);
    if (dustStrength !== undefined) this.dustStrength = Math.max(0.0, Math.min(5.0, Number(dustStrength) || 1.0));
    if (flareIntensity !== undefined) this.flareIntensity = Math.max(0.0, Math.min(5.0, Number(flareIntensity) || 1.5));
    if (flareGhosting !== undefined) this.flareGhosting = Math.max(0.0, Math.min(5.0, Number(flareGhosting) || 0.8));
    if (flareStreak !== undefined) this.flareStreak = Math.max(0.0, Math.min(5.0, Number(flareStreak) || 1.0));
    if (flareAngle !== undefined) this.flareAngle = Math.max(0, Math.min(360, Number(flareAngle) || 140));
    if (haloStrength !== undefined) this.haloStrength = Math.max(0.0, Math.min(2.0, Number(haloStrength) || 1.5));
    if (haloRadius !== undefined) this.haloRadius = Math.max(0.0, Math.min(1.0, Number(haloRadius) || 0.3));
    if (haloSize !== undefined) this.haloSize = Math.max(0.0, Math.min(0.1, Number(haloSize) || 0.02));
    if (grainAmount !== undefined) this.grainAmount = Math.max(0.0, Math.min(0.5, Number(grainAmount) || 0.0));
    if (grainScale !== undefined) this.grainScale = Math.max(10.0, Math.min(200.0, Number(grainScale) || 50.0));
    if (vignetteStrength !== undefined) this.vignetteStrength = Math.max(0.0, Math.min(1.0, Number(vignetteStrength) || 0.65));

    if (!this.renderer || !this.scene || !this.camera) {
      console.error("OceanCinematic: Renderer, scene, or camera not available");
      return;
    }

    this.renderer.setClearColor(0x000000, 0);
    this.clock = new THREE.Clock();
    this.time = 0;

    this.createShaderPlane();

    if (!this.mesh || !this.material) {
      console.error("OceanCinematic: Failed to create shader plane");
      return;
    }

    if (this.uniforms) {
      this.updateAllUniforms();
    }

    this.scene.add(this.customGroup);

    this.modelBoundingBox = new THREE.Box3().setFromObject(this.customGroup);
    this.modelCenter = new THREE.Vector3(0, 0, 0);
    this.modelSize = 2;

    const aspect = this.elem.offsetWidth / this.elem.offsetHeight || 16 / 9;
    this.camera.aspect = aspect;
    this.camera.fov = 75;
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, 1);
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

    this.setupMouseHandling();

    if (!this.isInitialized) {
      this.isInitialized = true;
      try {
        const { animationManager } = await import("../../src/projector/helpers/animationManager.js");
        if (animationManager) {
          animationManager.subscribe(this.animate.bind(this));
        }
      } catch (e) {
        console.warn("OceanCinematic: Could not import animationManager, using custom animate only");
      }
    }

    this.setCustomAnimate(this.animate.bind(this));
    this.markNeedsRender();
    this.render(true);
  }

  setupMouseHandling() {
    if (typeof window !== "undefined") {
      const handleMouseMove = (event) => {
        this.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePos.y = (event.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("mousemove", handleMouseMove);
      this.mouseMoveHandler = handleMouseMove;
    }
  }

  createShaderPlane() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      if (this.geometry) this.geometry.dispose();
      if (this.material) this.material.dispose();
    }

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMousePos;

      uniform float uStyle;      
      uniform float uEnableGrid; 
      uniform float uEnableClouds;
      uniform float uEnableReflections;
      uniform float uEnableFX;

      uniform float uFlareIntensity;
      uniform float uFlareGhosting;
      uniform float uFlareStreak;
      uniform float uFlareAngle;
      uniform float uCameraHeight;
      uniform float uCameraTilt;

      uniform float uWaveHeight;
      uniform float uWaveChoppiness;
      uniform float uSpeed;
      uniform float uFlySpeed;
      
      uniform float uSssStrength;
      uniform vec3 uSssBaseColor;
      uniform vec3 uSssTipColor;
      
      uniform float uSunSize;
      uniform float uSunIntensity;
      uniform float uSunPosX;
      uniform float uSunPosY;
      
      uniform float uReflectionStrength;
      uniform float uReflectionWidth;
      
      uniform float uCloudDensity;
      uniform float uCloudSpeed;
      uniform vec3 uCloudColor;
      uniform vec3 uHorizonColor;
      
      uniform float uHaloStrength;
      uniform float uHaloRadius;
      uniform float uHaloSize;
      
      uniform float uDustStrength;
      uniform float uHorizonFade;
      uniform float uVignetteStrength;
      
      uniform float uGrainAmount;
      uniform float uGrainScale;

      #define PI 3.14159265359

      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), f.x),
                     mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }
      
      float rand(vec2 uv, float t) {
          return fract(sin(dot(uv, vec2(1225.6548, 321.8942))) * 4251.4865 + t);
      }
      
      float gaussian(float z, float u, float o) {
          return (1.0 / (o * sqrt(2.0 * PI))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
      }
      
      vec3 grainScreen(vec3 a, vec3 b, float w) {
          return mix(a, vec3(1.0) - (vec3(1.0) - a) * (vec3(1.0) - b), w);
      }
      
      vec3 grainOverlay(vec3 a, vec3 b, float w) {
          vec3 mixed = mix(
              2.0 * a * b,
              vec3(1.0) - 2.0 * (vec3(1.0) - a) * (vec3(1.0) - b),
              step(vec3(0.5), a)
          );
          return mix(a, mixed, w);
      }
      
      float fbm(vec2 p) {
          float v = 0.0; float a = 0.5; 
          mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
          for(int i=0; i<3; i++) { v += a * noise(p); p = rot * p * 2.0; a *= 0.5; }
          return v;
      }
      
      float noise3D(vec3 p) {
          vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
          float n = dot(i, vec3(1.0, 57.0, 113.0));
          return mix(mix(mix(hash(vec2(n+0.0)), hash(vec2(n+1.0)), f.x),
                         mix(hash(vec2(n+57.0)), hash(vec2(n+58.0)), f.x), f.y),
                     mix(mix(hash(vec2(n+113.0)), hash(vec2(n+114.0)), f.x),
                         mix(hash(vec2(n+170.0)), hash(vec2(n+171.0)), f.x), f.y), f.z);
      }
      
      float cloudNoise(vec2 p) {
          float f = 0.0;
          f += 0.50000 * noise(p); p = p * 2.02;
          f += 0.25000 * noise(p); p = p * 2.03;
          f += 0.12500 * noise(p);
          return f;
      }

      float map(vec3 p) {
          vec2 q = p.xz * 0.35; 
          float h = 0.0;
          float a = 0.6 * uWaveHeight;
          if(uWaveChoppiness > 0.1) q += vec2(fbm(q + uTime * 0.05), fbm(q)) * uWaveChoppiness;
          for(int i=0; i<4; i++) {
              float ang = float(i) * 0.6;
              vec2 dir = vec2(sin(ang), cos(ang) * 1.5); dir = normalize(dir);
              float wave = 1.0 - abs(sin(dot(q, dir) - uTime * uSpeed + float(i)));
              wave = pow(wave, 3.0); h += a * wave;
              a *= 0.5; q *= 1.8; q.x += 1.0; 
          }
          return p.y - h;
      }

      vec3 getNormal(vec3 p) {
          float eps = 0.01 + uWaveHeight * 0.02;
          vec2 e = vec2(eps, 0.0);
          return normalize(vec3(map(p+e.xyy) - map(p-e.xyy), e.x * 2.0, map(p+e.yyx) - map(p-e.yyx)));
      }

      vec3 getSky(vec3 rd, vec3 sunDir, bool renderSun) {
          float sunDot = max(0.0, dot(rd, sunDir));
          vec3 zenithCol = vec3(0.0, 0.0, 0.02); 
          vec3 skyCol = mix(uHorizonColor, zenithCol, pow(max(0.0,rd.y + 0.05), 0.5));

          float occlusion = 0.0;
          if (uEnableClouds > 0.5) {
              if (uCloudDensity > 0.0 && rd.y > 0.0 && rd.y < 0.45) {
                 vec2 skyUV = rd.xz / max(0.05, rd.y); 
                 skyUV.x += uTime * uCloudSpeed;
                 float cl = cloudNoise(skyUV * 0.15); 
                 float heightMask = smoothstep(0.0, 0.1, rd.y) * smoothstep(0.45, 0.1, rd.y);
                 float cloudIntensity = smoothstep(0.3, 0.7, cl) * heightMask * uCloudDensity;
                 skyCol = mix(skyCol, uCloudColor, cloudIntensity);
                 occlusion = cloudIntensity;
              }
          }
          
          float sunRadiusThreshold = 0.99 - (uSunSize * 0.03); 
          float sun = (uSunSize < 0.1) ? 0.0 : smoothstep(sunRadiusThreshold, sunRadiusThreshold + 0.002, sunDot);
          float glow = (uSunSize < 0.1) ? 0.0 : pow(sunDot, 12.0 / uSunSize);
          float sunVis = 1.0 - clamp(occlusion * 1.5, 0.0, 0.9);

          vec3 sunCol = uSssTipColor * uSunIntensity * sunVis;
          skyCol += glow * sunCol * 1.5; 

          if (renderSun) { skyCol += sun * sunCol * 8.0; }
          
          if (uEnableFX > 0.5 && uHaloStrength > 0.0) {
              float baseR = 1.0 - uHaloRadius * 0.2; 
              float sizeR = uHaloSize; 
              float sizeG = uHaloSize + 0.005;
              float sizeB = uHaloSize + 0.010;

              float ringR = smoothstep(sizeR, 0.0, abs(sunDot - baseR));
              float ringG = smoothstep(sizeG, 0.0, abs(sunDot - (baseR + 0.005)));
              float ringB = smoothstep(sizeB, 0.0, abs(sunDot - (baseR + 0.010)));

              vec3 haloCol = vec3(ringR, ringG, ringB);
              skyCol += haloCol * uHaloStrength * 0.5 * (1.0 - occlusion * 0.5);
          }
          
          return skyCol;
      }

      vec4 lensflares(vec2 uv, vec2 pos, float ghostingScale, vec2 parallaxShift) {
          vec2 main = uv - pos;
          vec2 uvd = uv * (length(uv));
          
          float ang = atan(main.y, main.x);
          float dist = length(main); 
          dist = pow(dist, 0.1);
          
          float f0 = 1.0 / (length(uv - pos) * 25.0 + 1.0); 
          f0 = pow(f0, 2.0); 
          float star = sin(noise(vec2(sin(ang*2.0+pos.x)*4.0, cos(ang*3.0+pos.y)))*16.0);
          f0 = f0 + f0 * (star * 0.1 + dist * 0.1 + 0.8);
          
          vec2 scaledPos = (pos * ghostingScale) + parallaxShift;
          
          float centerDist = length(scaledPos);
          float distanceFactor = 1.0 + centerDist * 0.5;

          float f2  = max(1.0 / (1.0 + 32.0 * pow(length(uvd + 0.8 * scaledPos), 2.0)), 0.0) * 0.25;
          float f22 = max(1.0 / (1.0 + 32.0 * pow(length(uvd + 0.85 * scaledPos), 2.0)), 0.0) * 0.23;
          float f23 = max(1.0 / (1.0 + 32.0 * pow(length(uvd + 0.9 * scaledPos), 2.0)), 0.0) * 0.21;
          
          vec2 uvx = mix(uv, uvd, -0.5);
          
          float f4  = max(0.01 - pow(length(uvx + 0.4 * scaledPos), 2.4), 0.0) * 6.0;
          float f42 = max(0.01 - pow(length(uvx + 0.45 * scaledPos), 2.4), 0.0) * 5.0;
          float f43 = max(0.01 - pow(length(uvx + 0.5 * scaledPos), 2.4), 0.0) * 3.0;
          
          uvx = mix(uv, uvd, -0.4);
          
          float f5  = max(0.01 - pow(length(uvx + 0.2 * scaledPos), 5.5), 0.0) * 2.0;
          float f52 = max(0.01 - pow(length(uvx + 0.4 * scaledPos), 5.5), 0.0) * 2.0;
          float f53 = max(0.01 - pow(length(uvx + 0.6 * scaledPos), 5.5), 0.0) * 2.0;
          
          uvx = mix(uv, uvd, -0.5);
          
          float f6  = max(0.01 - pow(length(uvx - 0.3 * scaledPos), 1.6), 0.0) * 6.0;
          float f62 = max(0.01 - pow(length(uvx - 0.325 * scaledPos), 1.6), 0.0) * 3.0;
          float f63 = max(0.01 - pow(length(uvx - 0.35 * scaledPos), 1.6), 0.0) * 5.0;
          
          vec3 c = vec3(0.0);
          
          c.r += (f2 + f4 + f5 + f6) * distanceFactor; 
          c.g += (f22 + f42 + f52 + f62) * distanceFactor; 
          c.b += (f23 + f43 + f53 + f63) * distanceFactor;
          c = max(vec3(0.0), c * 1.3 - vec3(length(uvd) * 0.05));
          
          return vec4(c, f0);
      }
      
      vec3 anflares_optimized(vec2 uv, vec2 pos, float streakIntensity) {
          vec2 main = uv - pos;
          float v = smoothstep(0.02, 0.0, abs(main.y));
          float h = smoothstep(1.0, 0.0, abs(main.x) / 1.5); 
          return vec3(v * h) * streakIntensity * 0.8;
      }

      vec3 filmic(vec3 x) {
        vec3 a = max(vec3(0.0), x - vec3(0.004));
        return (a * (6.2 * a + 0.5)) / (a * (6.2 * a + 1.7) + 0.06);
      }
      
      float dither4x4(vec2 position, float brightness) {
        int x = int(mod(position.x, 4.0)); int y = int(mod(position.y, 4.0));
        int index = x + y * 4; float limit = 0.0;
        if (x < 8) {
          if (index == 0) limit = 0.0625; if (index == 1) limit = 0.5625; if (index == 2) limit = 0.1875; if (index == 3) limit = 0.6875;
          if (index == 4) limit = 0.8125; if (index == 5) limit = 0.3125; if (index == 6) limit = 0.9375; if (index == 7) limit = 0.4375;
          if (index == 8) limit = 0.25;   if (index == 9) limit = 0.75;   if (index == 10) limit = 0.125; if (index == 11) limit = 0.625;
          if (index == 12) limit = 1.0;   if (index == 13) limit = 0.5;   if (index == 14) limit = 0.875; if (index == 15) limit = 0.375;
        }
        return brightness < limit ? 0.0 : 1.0;
      }

      vec3 renderScene(vec3 ro, vec3 rd, vec3 sunDir) {
          float t = 0.0; float d = 0.0; float maxDist = 150.0;
          for(int i=0; i<100; i++) { d = map(ro + rd*t); t += d * 0.6; if(d<0.01 || t>maxDist) break; }
          vec3 col = vec3(0.0);
          
          if(t < maxDist) {
              vec3 p = ro + rd*t; 
              vec3 n = getNormal(p); 
              vec3 ref = reflect(rd, n);
              float fresnel = 0.02 + 0.98 * pow(1.0 - max(0.0, dot(n, -rd)), 5.0); 
              
              col = uSssBaseColor * (0.002 + 0.1*max(0.0, dot(n, sunDir)));
              col = mix(col, getSky(ref, sunDir, false), fresnel * 0.95); 
              
              float sss = pow(max(0.0, dot(n, -sunDir)), 2.0) * smoothstep(-0.2, uWaveHeight, p.y);
              col += uSssTipColor * sss * uSssStrength * 3.0; 
              
              if (uEnableReflections > 0.5) {
                  float refDot = dot(ref, sunDir);
                  float specPower = 1.0 / max(0.0001, uReflectionWidth * uReflectionWidth);
                  float specular = pow(max(0.0, refDot), specPower);
                  col += uSssTipColor * specular * uReflectionStrength;
              }
              if(uEnableGrid > 0.5) {
                  vec2 gridUV = p.xz * 0.5;
                  float grid = step(0.97, fract(gridUV.x)) + step(0.97, fract(gridUV.y));
                  float fade = smoothstep(50.0, 0.0, t);
                  col += uSssTipColor * grid * fade * 2.0;
              }
              float hBlend = smoothstep(maxDist * (1.0 - max(0.001, uHorizonFade)), maxDist, t);
              col = mix(col, getSky(rd, sunDir, true), hBlend);
          } else {
              col = getSky(rd, sunDir, true);
          }
          return col;
      }

      void main() {
        vec2 coord = gl_FragCoord.xy;
        vec2 uv = (coord * 2.0 - uResolution.xy) / uResolution.y;
        
        vec3 ro = vec3(0.0, uCameraHeight, uTime * (uFlySpeed * 2.0 + 1.0));
        
        vec3 ta = ro + vec3(0.0, uCameraTilt, 10.0); 
        vec3 ww = normalize(ta - ro);
        vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
        vec3 vv = normalize(cross(uu, ww));
        vec3 sunDir = normalize(vec3(uSunPosX, uSunPosY, 1.0)); 
        vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.5 * ww);
        
        vec3 col = renderScene(ro, rd, sunDir);
        
        if(uEnableFX > 0.5 && uDustStrength > 0.0) {
            vec3 pDust = rd * 8.0; pDust.y -= uTime * 0.3; 
            float specks = smoothstep(0.90, 1.0, noise3D(pDust));
            col += uSssTipColor * specks * uDustStrength;
        }

        if (uEnableFX > 0.5 && uFlareIntensity > 0.0) {
            vec3 sunView = vec3(dot(sunDir, uu), dot(sunDir, vv), dot(sunDir, ww));
            
            if (sunView.z > 0.0) { 
                float focalLength = 1.5;
                vec2 sunScreenPos = sunView.xy * focalLength; 
                
                float sunThreshold = 0.99 - uSunSize * 0.03;
                float angularRadius = acos(clamp(sunThreshold, 0.0, 1.0));
                float sunRadiusScreen = tan(angularRadius) * focalLength;
                
                float angleRad = uFlareAngle * PI / 180.0;
                
                vec2 edgeDirection = vec2(cos(angleRad), sin(angleRad));
                vec2 edgeOffset = edgeDirection * sunRadiusScreen;
                
                vec2 flareSource = sunScreenPos + edgeOffset;

                vec2 parallaxShift = uMousePos * 0.15;
                
                vec4 flareData = lensflares(uv, flareSource, uFlareGhosting, parallaxShift);
                vec3 ghosts = flareData.rgb;
                float core = flareData.a;
                
                vec3 streak = anflares_optimized(uv, flareSource, uFlareStreak);
                
                vec3 flareColorBase = vec3(0.643, 0.494, 0.867); 
                vec3 finalFlareColor = mix(flareColorBase, uSssTipColor, 0.7); 

                vec3 finalFlare = max(vec3(0.0), ghosts) * uFlareGhosting + streak;
                finalFlare += vec3(core) * 0.5;
                
                float flareBoost = 1.0;
                if (uStyle < 0.5 || uStyle > 2.5) {
                    flareBoost = 1.8;
                }
                if (uStyle > 3.5) {
                    flareBoost = 2.5;
                }
                
                col += max(vec3(0.0), finalFlare * uFlareIntensity * flareBoost * finalFlareColor);
            }
        }

        if (uStyle > 0.5 && uStyle < 1.5) {
             float lum = dot(col, vec3(0.299, 0.587, 0.114));
             vec3 mono = vec3(lum);
             mono = smoothstep(0.1, 0.9, mono);
             vec3 tint = mix(vec3(1.0), uHorizonColor, 0.2);
             col = mono * tint;
             
             float grainSpeed = 2.0;
             float grainIntensity = 0.08;
             float grainMean = 0.0;
             float grainVariance = 0.5;
             
             vec2 grainUV = coord / uResolution.xy;
             float t = uTime * grainSpeed;
             float seed = dot(grainUV, vec2(12.9898, 78.233));
             float filmNoise = fract(sin(seed) * 43758.5453 + t);
             filmNoise = gaussian(filmNoise, grainMean, grainVariance * grainVariance);
             
             vec3 grain = vec3(filmNoise) * (1.0 - col);
             col = grainOverlay(col, grain, grainIntensity);
        }
        
        if (uStyle > 1.5 && uStyle < 2.5) {
            float brightness = dot(col, vec3(0.299, 0.587, 0.114));
            float d = dither4x4(gl_FragCoord.xy, brightness * 1.5);
            col = uSssTipColor * d;
        }
        
        if (uStyle > 2.5 && uStyle < 3.5) {
            col = pow(col, vec3(1.2));
            
            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            vec3 pink = vec3(1.0, 0.44, 0.81);
            vec3 cyan = vec3(0.0, 0.8, 1.0);
            vec3 purple = vec3(0.69, 0.49, 0.97);
            
            vec3 synthColor = mix(purple, pink, smoothstep(0.0, 0.5, lum));
            synthColor = mix(synthColor, cyan, smoothstep(0.5, 1.0, lum));
            col = mix(col, synthColor * (lum + 0.2), 0.6);
            
            float scanline = sin(coord.y * 2.0) * 0.5 + 0.5;
            scanline = pow(scanline, 1.5) * 0.15;
            col -= scanline;
            
            vec2 uvNorm = coord / uResolution.xy;
            float aberration = 0.002;
            vec2 dir = uvNorm - 0.5;
            float dist = length(dir);
            col.r = col.r + dist * aberration * 10.0;
            col.b = col.b - dist * aberration * 10.0;
            
            col += lum * pink * 0.1;
        }
        
        if (uStyle > 3.5) {
            vec2 uvNorm = coord / uResolution.xy;
            
            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            float bloom = smoothstep(0.3, 1.0, lum);
            col += col * bloom * 0.6;
            
            vec3 warmTint = vec3(1.05, 1.0, 0.95);
            vec3 coolShadows = vec3(0.95, 0.97, 1.05);
            col *= mix(coolShadows, warmTint, lum);
            
            vec3 glowColor = vec3(1.0, 0.98, 0.95);
            col = mix(col, glowColor * lum, bloom * 0.3);
            
            vec2 vigUV = uvNorm - 0.5;
            float softVig = 1.0 - dot(vigUV, vigUV) * 0.5;
            softVig = smoothstep(0.0, 1.0, softVig);
            col *= softVig;
            
            float leak1 = smoothstep(0.7, 0.0, length(uvNorm - vec2(0.1, 0.9)));
            float leak2 = smoothstep(0.6, 0.0, length(uvNorm - vec2(0.9, 0.1)));
            col += vec3(1.0, 0.9, 0.7) * leak1 * 0.15;
            col += vec3(0.9, 0.8, 1.0) * leak2 * 0.1;
            
            float haze = smoothstep(0.0, 0.6, lum);
            col = mix(col, col + vec3(0.1, 0.08, 0.12), haze * 0.2);
            
            float pulse = sin(uTime * 0.5) * 0.5 + 0.5;
            col += col * pulse * 0.05;
            
            col = mix(vec3(0.5), col, 0.9);
        }

        col = filmic(col);
        col *= 1.0 - length(uv * uVignetteStrength); 

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const width = this.elem.offsetWidth || 1920;
    const height = this.elem.offsetHeight || 1080;

    this.geometry = new THREE.PlaneGeometry(2, 2);

    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uMousePos: { value: this.mousePos },
      uStyle: { value: this.style },
      uEnableGrid: { value: this.enableGrid ? 1.0 : 0.0 },
      uEnableClouds: { value: this.enableClouds ? 1.0 : 0.0 },
      uEnableReflections: { value: this.enableReflections ? 1.0 : 0.0 },
      uEnableFX: { value: this.enableFX ? 1.0 : 0.0 },
      uWaveHeight: { value: this.waveHeight },
      uWaveChoppiness: { value: this.waveChoppiness },
      uSpeed: { value: this.speed },
      uFlySpeed: { value: this.flySpeed },
      uSssStrength: { value: this.sssStrength },
      uSssBaseColor: { value: new THREE.Color(this.sssBaseColor) },
      uSssTipColor: { value: new THREE.Color(this.sssTipColor) },
      uSunSize: { value: this.sunSize },
      uSunIntensity: { value: this.sunIntensity },
      uSunPosX: { value: this.sunPosX },
      uSunPosY: { value: this.sunPosY },
      uReflectionStrength: { value: this.reflectionStrength },
      uReflectionWidth: { value: this.reflectionWidth },
      uCloudDensity: { value: this.cloudDensity },
      uCloudSpeed: { value: this.cloudSpeed },
      uCloudColor: { value: new THREE.Color(this.cloudColor) },
      uHorizonColor: { value: new THREE.Color(this.horizonColor) },
      uHaloStrength: { value: this.haloStrength },
      uHaloRadius: { value: this.haloRadius },
      uHaloSize: { value: this.haloSize },
      uDustStrength: { value: this.dustStrength },
      uHorizonFade: { value: this.horizonFade },
      uVignetteStrength: { value: this.vignetteStrength },
      uGrainAmount: { value: this.grainAmount },
      uGrainScale: { value: this.grainScale },
      uFlareIntensity: { value: this.flareIntensity },
      uFlareGhosting: { value: this.flareGhosting },
      uFlareStreak: { value: this.flareStreak },
      uFlareAngle: { value: this.flareAngle },
      uCameraHeight: { value: 4.0 },
      uCameraTilt: { value: -0.1 },
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      depthWrite: false,
      depthTest: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.frustumCulled = false;

    const aspect = width / height;
    this.mesh.scale.set(aspect, 1, 1);

    this.customGroup.add(this.mesh);
  }

  interpolatePresets(preset1, preset2, t) {
    const result = {};
    const keys = Object.keys(preset1);
    
    for (const key of keys) {
      if (typeof preset1[key] === 'number') {
        result[key] = preset1[key] + (preset2[key] - preset1[key]) * t;
      } else if (typeof preset1[key] === 'string' && preset1[key].startsWith('#')) {
        const c1 = new THREE.Color(preset1[key]);
        const c2 = new THREE.Color(preset2[key]);
        const c = new THREE.Color();
        c.lerpColors(c1, c2, t);
        result[key] = '#' + c.getHexString();
      } else if (typeof preset1[key] === 'boolean') {
        result[key] = t < 0.5 ? preset1[key] : preset2[key];
      } else {
        result[key] = preset1[key];
      }
    }
    
    return result;
  }

  updatePresetAnimation(delta) {
    if (!this.activePreset || this.activePreset.length === 0) return;
    if (this.activePreset.length === 1) {
      return;
    }

    this.presetAnimationTime += delta * this.presetAnimationSpeed;
    const cycleLength = this.activePreset.length;
    const normalizedTime = (this.presetAnimationTime % cycleLength) / cycleLength;
    
    const currentIndex = Math.floor(normalizedTime * cycleLength);
    const nextIndex = (currentIndex + 1) % cycleLength;
    const t = (normalizedTime * cycleLength) % 1.0;
    
    const preset1 = this.PRESETS[this.activePreset[currentIndex]];
    const preset2 = this.PRESETS[this.activePreset[nextIndex]];
    
    if (preset1 && preset2) {
      const currentStyle = this.style;
      const interpolated = this.interpolatePresets(preset1, preset2, t);
      Object.assign(this, interpolated);
      this.style = currentStyle;
      this.updateAllUniforms();
    }
  }

  updateShaderUniforms(delta, time) {
    if (!this.time) this.time = 0;
    this.time += delta;

    this.updatePresetAnimation(delta);

    if (this.uniforms) {
      this.uniforms.uTime.value = this.time;
      this.uniforms.uMousePos.value.set(this.mousePos.x, this.mousePos.y);
      this.uniforms.uFlySpeed.value = this.flySpeed;

      if (this.elem) {
        const width = this.elem.offsetWidth || this.renderer.domElement.width || 1920;
        const height = this.elem.offsetHeight || this.renderer.domElement.height || 1080;
        this.uniforms.uResolution.value.set(width, height);

        const aspect = width / height;
        if (this.mesh) {
          this.mesh.scale.set(aspect, 1, 1);
        }
      }
    }
  }

  animate() {
    if (this.destroyed || !this.clock || !this.material || !this.renderer || !this.scene || !this.camera) return;

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    this.updateShaderUniforms(delta, elapsedTime);

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateAllUniforms() {
    if (!this.uniforms) return;

    this.uniforms.uStyle.value = this.style;
    this.uniforms.uEnableGrid.value = this.enableGrid ? 1.0 : 0.0;
    this.uniforms.uEnableClouds.value = this.enableClouds ? 1.0 : 0.0;
    this.uniforms.uEnableReflections.value = this.enableReflections ? 1.0 : 0.0;
    this.uniforms.uEnableFX.value = this.enableFX ? 1.0 : 0.0;
    this.uniforms.uWaveHeight.value = this.waveHeight;
    this.uniforms.uWaveChoppiness.value = this.waveChoppiness;
    this.uniforms.uSpeed.value = this.speed;
    this.uniforms.uFlySpeed.value = this.flySpeed;
    this.uniforms.uSssStrength.value = this.sssStrength;
    if (this.uniforms.uSssBaseColor) this.uniforms.uSssBaseColor.value.set(this.sssBaseColor);
    if (this.uniforms.uSssTipColor) this.uniforms.uSssTipColor.value.set(this.sssTipColor);
    this.uniforms.uSunSize.value = this.sunSize;
    this.uniforms.uSunIntensity.value = this.sunIntensity;
    this.uniforms.uSunPosX.value = this.sunPosX;
    this.uniforms.uSunPosY.value = this.sunPosY;
    this.uniforms.uReflectionStrength.value = this.reflectionStrength;
    this.uniforms.uReflectionWidth.value = this.reflectionWidth;
    this.uniforms.uCloudDensity.value = this.cloudDensity;
    this.uniforms.uCloudSpeed.value = this.cloudSpeed;
    if (this.uniforms.uCloudColor) this.uniforms.uCloudColor.value.set(this.cloudColor);
    if (this.uniforms.uHorizonColor) this.uniforms.uHorizonColor.value.set(this.horizonColor);
    this.uniforms.uHaloStrength.value = this.haloStrength;
    this.uniforms.uHaloRadius.value = this.haloRadius;
    this.uniforms.uHaloSize.value = this.haloSize;
    this.uniforms.uDustStrength.value = this.dustStrength;
    this.uniforms.uHorizonFade.value = this.horizonFade;
    this.uniforms.uVignetteStrength.value = this.vignetteStrength;
    this.uniforms.uGrainAmount.value = this.grainAmount;
    this.uniforms.uGrainScale.value = this.grainScale;
    this.uniforms.uFlareIntensity.value = this.flareIntensity;
    this.uniforms.uFlareGhosting.value = this.flareGhosting;
    this.uniforms.uFlareStreak.value = this.flareStreak;
    this.uniforms.uFlareAngle.value = this.flareAngle;
  }

  setPreset({ preset = "Night" } = {}) {
    if (Array.isArray(preset)) {
      this.activePreset = preset;
      this.presetAnimationTime = 0;
      if (preset.length > 0) {
        const firstPreset = this.PRESETS[preset[0]];
        if (firstPreset) {
          const currentStyle = this.style;
          Object.assign(this, firstPreset);
          this.style = currentStyle;
          if (this.uniforms) {
            this.updateAllUniforms();
          }
          this.markNeedsRender();
        }
      }
    } else {
      this.activePreset = [preset];
      this.presetAnimationTime = 0;
      const p = this.PRESETS[preset];
      if (!p) {
        console.warn(`OceanCinematic: Preset "${preset}" not found`);
        return;
      }
      const currentStyle = this.style;
      Object.assign(this, p);
      this.style = currentStyle;
      if (this.uniforms) {
        this.updateAllUniforms();
      }
      this.markNeedsRender();
    }
  }

  setStyle({ value = 2 } = {}) {
    this.style = Math.max(0, Math.min(4, Number(value) || 2));
    if (this.uniforms) this.uniforms.uStyle.value = this.style;
  }

  setEnableGrid({ value = true } = {}) {
    this.enableGrid = Boolean(value);
    if (this.uniforms) this.uniforms.uEnableGrid.value = this.enableGrid ? 1.0 : 0.0;
  }

  setSunPosX({ value = 0.0 } = {}) {
    this.sunPosX = Math.max(-1.5, Math.min(1.5, Number(value) || 0.0));
    if (this.uniforms) this.uniforms.uSunPosX.value = this.sunPosX;
  }

  setSunPosY({ value = 0.3 } = {}) {
    this.sunPosY = Math.max(-0.5, Math.min(1.0, Number(value) || 0.3));
    if (this.uniforms) this.uniforms.uSunPosY.value = this.sunPosY;
  }

  setSunSize({ value = 0.9 } = {}) {
    this.sunSize = Math.max(0.0, Math.min(5.0, Number(value) || 0.9));
    if (this.uniforms) this.uniforms.uSunSize.value = this.sunSize;
  }

  setSunIntensity({ value = 3.0 } = {}) {
    this.sunIntensity = Math.max(0.0, Math.min(10.0, Number(value) || 3.0));
    if (this.uniforms) this.uniforms.uSunIntensity.value = this.sunIntensity;
  }

  setHorizonColor({ value = "#0a0a15" } = {}) {
    this.horizonColor = value || "#0a0a15";
    if (this.uniforms && this.uniforms.uHorizonColor) {
      this.uniforms.uHorizonColor.value.set(this.horizonColor);
    }
  }

  setEnableClouds({ value = true } = {}) {
    this.enableClouds = Boolean(value);
    if (this.uniforms) this.uniforms.uEnableClouds.value = this.enableClouds ? 1.0 : 0.0;
  }

  setCloudDensity({ value = 0.3 } = {}) {
    this.cloudDensity = Math.max(0.0, Math.min(3.0, Number(value) || 0.3));
    if (this.uniforms) this.uniforms.uCloudDensity.value = this.cloudDensity;
  }

  setCloudSpeed({ value = 0.05 } = {}) {
    this.cloudSpeed = Math.max(0.0, Math.min(1.0, Number(value) || 0.05));
    if (this.uniforms) this.uniforms.uCloudSpeed.value = this.cloudSpeed;
  }

  setCloudColor({ value = "#101018" } = {}) {
    this.cloudColor = value || "#101018";
    if (this.uniforms && this.uniforms.uCloudColor) {
      this.uniforms.uCloudColor.value.set(this.cloudColor);
    }
  }

  setHorizonFade({ value = 0.05 } = {}) {
    this.horizonFade = Math.max(0.0, Math.min(0.2, Number(value) || 0.05));
    if (this.uniforms) this.uniforms.uHorizonFade.value = this.horizonFade;
  }

  setWaveHeight({ value = 0.2 } = {}) {
    this.waveHeight = Math.max(0.0, Math.min(2.5, Number(value) || 0.2));
    if (this.uniforms) this.uniforms.uWaveHeight.value = this.waveHeight;
  }

  setWaveChoppiness({ value = 2.5 } = {}) {
    this.waveChoppiness = Math.max(0.0, Math.min(3.0, Number(value) || 2.5));
    if (this.uniforms) this.uniforms.uWaveChoppiness.value = this.waveChoppiness;
  }

  setSpeed({ value = 0.2 } = {}) {
    this.speed = Math.max(0.0, Math.min(1.0, Number(value) || 0.2));
    if (this.uniforms) this.uniforms.uSpeed.value = this.speed;
  }

  setSssBaseColor({ value = "#000005" } = {}) {
    this.sssBaseColor = value || "#000005";
    if (this.uniforms && this.uniforms.uSssBaseColor) {
      this.uniforms.uSssBaseColor.value.set(this.sssBaseColor);
    }
  }

  setSssTipColor({ value = "#8888aa" } = {}) {
    this.sssTipColor = value || "#8888aa";
    if (this.uniforms && this.uniforms.uSssTipColor) {
      this.uniforms.uSssTipColor.value.set(this.sssTipColor);
    }
  }

  setSssStrength({ value = 4.0 } = {}) {
    this.sssStrength = Math.max(0.0, Math.min(10.0, Number(value) || 4.0));
    if (this.uniforms) this.uniforms.uSssStrength.value = this.sssStrength;
  }

  setEnableReflections({ value = true } = {}) {
    this.enableReflections = Boolean(value);
    if (this.uniforms) this.uniforms.uEnableReflections.value = this.enableReflections ? 1.0 : 0.0;
  }

  setReflectionStrength({ value = 2.5 } = {}) {
    this.reflectionStrength = Math.max(0.0, Math.min(10.0, Number(value) || 2.5));
    if (this.uniforms) this.uniforms.uReflectionStrength.value = this.reflectionStrength;
  }

  setReflectionWidth({ value = 0.015 } = {}) {
    this.reflectionWidth = Math.max(0.001, Math.min(0.5, Number(value) || 0.015));
    if (this.uniforms) this.uniforms.uReflectionWidth.value = this.reflectionWidth;
  }

  setFlySpeed({ value = 0.5 } = {}) {
    this.flySpeed = Math.max(0.0, Math.min(5.0, Number(value) || 0.5));
    if (this.uniforms) this.uniforms.uFlySpeed.value = this.flySpeed;
  }

  setEnableFX({ value = true } = {}) {
    this.enableFX = Boolean(value);
    if (this.uniforms) this.uniforms.uEnableFX.value = this.enableFX ? 1.0 : 0.0;
  }

  setDustStrength({ value = 1.0 } = {}) {
    this.dustStrength = Math.max(0.0, Math.min(5.0, Number(value) || 1.0));
    if (this.uniforms) this.uniforms.uDustStrength.value = this.dustStrength;
  }

  setFlareIntensity({ value = 1.5 } = {}) {
    this.flareIntensity = Math.max(0.0, Math.min(5.0, Number(value) || 1.5));
    if (this.uniforms) this.uniforms.uFlareIntensity.value = this.flareIntensity;
  }

  setFlareGhosting({ value = 0.8 } = {}) {
    this.flareGhosting = Math.max(0.0, Math.min(5.0, Number(value) || 0.8));
    if (this.uniforms) this.uniforms.uFlareGhosting.value = this.flareGhosting;
  }

  setFlareStreak({ value = 1.0 } = {}) {
    this.flareStreak = Math.max(0.0, Math.min(5.0, Number(value) || 1.0));
    if (this.uniforms) this.uniforms.uFlareStreak.value = this.flareStreak;
  }

  setFlareAngle({ value = 140 } = {}) {
    this.flareAngle = Math.max(0, Math.min(360, Number(value) || 140));
    if (this.uniforms) this.uniforms.uFlareAngle.value = this.flareAngle;
  }

  setHaloStrength({ value = 1.5 } = {}) {
    this.haloStrength = Math.max(0.0, Math.min(2.0, Number(value) || 1.5));
    if (this.uniforms) this.uniforms.uHaloStrength.value = this.haloStrength;
  }

  setHaloRadius({ value = 0.3 } = {}) {
    this.haloRadius = Math.max(0.0, Math.min(1.0, Number(value) || 0.3));
    if (this.uniforms) this.uniforms.uHaloRadius.value = this.haloRadius;
  }

  setHaloSize({ value = 0.02 } = {}) {
    this.haloSize = Math.max(0.0, Math.min(0.1, Number(value) || 0.02));
    if (this.uniforms) this.uniforms.uHaloSize.value = this.haloSize;
  }

  setGrainAmount({ value = 0.0 } = {}) {
    this.grainAmount = Math.max(0.0, Math.min(0.5, Number(value) || 0.0));
    if (this.uniforms) this.uniforms.uGrainAmount.value = this.grainAmount;
  }

  setGrainScale({ value = 50.0 } = {}) {
    this.grainScale = Math.max(10.0, Math.min(200.0, Number(value) || 50.0));
    if (this.uniforms) this.uniforms.uGrainScale.value = this.grainScale;
  }

  setVignetteStrength({ value = 0.65 } = {}) {
    this.vignetteStrength = Math.max(0.0, Math.min(1.0, Number(value) || 0.65));
    if (this.uniforms) this.uniforms.uVignetteStrength.value = this.vignetteStrength;
  }

  destroy() {
    this.destroyed = true;

    if (this.mouseMoveHandler && typeof window !== "undefined") {
      window.removeEventListener("mousemove", this.mouseMoveHandler);
    }

    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }

    super.destroy();
  }
}

export default OceanCinematic;
