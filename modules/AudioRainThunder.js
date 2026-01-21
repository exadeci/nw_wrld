/*
@nwWrld name: AudioRainThunder
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer, assetUrl
*/

class AudioRainThunder extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "rainCount", defaultVal: 9500, type: "number", min: 1000, max: 20000 },
        { name: "rainSize", defaultVal: 0.1, type: "number", min: 0.05, max: 1.0 },
        { name: "cloudCount", defaultVal: 25, type: "number", min: 5, max: 50 },
        { name: "fogColor", defaultVal: "#11111f", type: "color" },
        { name: "fogDensity", defaultVal: 0.002, type: "number", min: 0.0001, max: 0.01 },
        { name: "thunderSensitivity", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setThunderSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 3.0 }],
    },
    {
      name: "setRainSize",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.1, type: "number", min: 0.05, max: 1.0 }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = AudioRainThunder.name;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.thunderSensitivity = 1.0;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;

    this.rainCount = 9500;
    this.rainSize = 0.1;
    this.cloudCount = 25;
    this.fogColor = new THREE.Color(0x11111f);
    this.fogDensity = 0.002;

    this.rain = null;
    this.rainGeo = null;
    this.rainMaterial = null;
    this.cloudParticles = [];
    this.flash = null;
    this.ambient = null;
    this.directionalLight = null;
    this.smokeTexture = null;
    this.customGroup = new THREE.Group();

    this.destroyed = false;
  }

  async start({ 
    sensitivity = 2.0, 
    rainCount = 9500,
    rainSize = 0.1,
    cloudCount = 25,
    fogColor = "#11111f",
    fogDensity = 0.002,
    thunderSensitivity = 1.0
  } = {}) {
    const sensVal = Number(sensitivity);
    const rainVal = Number(rainCount);
    const rainSizeVal = Number(rainSize);
    const cloudVal = Number(cloudCount);
    const fogDensVal = Number(fogDensity);
    const thunderSensVal = Number(thunderSensitivity);

    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.rainCount = Math.max(1000, Math.min(20000, Math.floor(Number.isFinite(rainVal) ? rainVal : 9500)));
    this.rainSize = Math.max(0.05, Math.min(1.0, Number.isFinite(rainSizeVal) ? rainSizeVal : 0.1));
    this.cloudCount = Math.max(5, Math.min(50, Math.floor(Number.isFinite(cloudVal) ? cloudVal : 25)));
    this.fogDensity = Math.max(0.0001, Math.min(0.01, Number.isFinite(fogDensVal) ? fogDensVal : 0.002));
    this.thunderSensitivity = Math.max(0.1, Math.min(3.0, Number.isFinite(thunderSensVal) ? thunderSensVal : 1.0));

    if (fogColor && typeof fogColor === 'string') {
      this.fogColor.set(fogColor);
    }

    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();

    this.init();
    this.show();
  }

  init() {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;

    if (this.controls) {
      this.controls.enabled = false;
    }

    this.setupScene();
    this.setupLights();
    this.createRain();
    this.loadSmokeTexture();

    this.setModel(this.customGroup);
    this.setupCamera();
    this.setCustomAnimate(this.audioAnimate.bind(this));
  }

  setupScene() {
    this.scene.fog = new THREE.FogExp2(this.fogColor, this.fogDensity);
    this.renderer.setClearColor(this.fogColor);
  }

  setupCamera() {
    this.camera.fov = 60;
    this.camera.position.set(0, 0, 1);
    this.camera.rotation.x = 1.16;
    this.camera.rotation.y = -0.12;
    this.camera.rotation.z = 0.27;
    this.camera.near = 1;
    this.camera.far = 1000;
    this.camera.updateProjectionMatrix();
  }

  setupLights() {
    // Ambient Light
    this.ambient = new THREE.AmbientLight(0x555555);
    this.scene.add(this.ambient);

    // Directional Light
    this.directionalLight = new THREE.DirectionalLight(0xffeedd);
    this.directionalLight.position.set(0, 0, 1);
    this.scene.add(this.directionalLight);

    // Point Light (Flash)
    this.flash = new THREE.PointLight(0x062d89, 30, 500, 1.7);
    this.flash.position.set(200, 300, 100);
    this.scene.add(this.flash);
  }

  createRain() {
    // Exact conversion from original THREE.Geometry to BufferGeometry
    this.rainGeo = new THREE.BufferGeometry();
    const positions = [];
    this.rainVelocities = [];

    // Original: for(let i=0; i<rainCount; i++)
    for (let i = 0; i < this.rainCount; i++) {
      // Original: rainDrop = new THREE.Vector3(Math.random()*400-200, Math.random()*500-250, Math.random()*400-200)
      positions.push(
        Math.random() * 400 - 200,
        Math.random() * 500 - 250,
        Math.random() * 400 - 200
      );
      // Original: rainDrop.velocity = 0
      this.rainVelocities.push(0);
    }

    this.rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    // Original: rainMaterial = new THREE.PointsMaterial({color: 0xaaaaaa, size: 0.1, transparent: true})
    this.rainMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: this.rainSize,
      transparent: true
    });

    this.rain = new THREE.Points(this.rainGeo, this.rainMaterial);
    this.customGroup.add(this.rain);
    this.markNeedsRender();
  }

  loadSmokeTexture() {
    const loader = new THREE.TextureLoader();

    // Try to use assetUrl if available, otherwise fall back to original URL
    const smokeUrl = typeof assetUrl === "function" 
      ? assetUrl("images/smoke.png") 
      : "https://raw.githubusercontent.com/navin-navi/codepen-assets/master/images/smoke.png";

    loader.load(
      smokeUrl,
      (texture) => {
        if (this.destroyed) {
          texture.dispose();
          return;
        }

        this.smokeTexture = texture;
        this.createClouds();
      },
      undefined,
      (error) => {
        console.warn("[AudioRainThunder] Failed to load smoke texture:", error);
        this.createClouds();
      }
    );
  }

  createClouds() {
    if (this.destroyed) return;

    // Original: cloudGeo = new THREE.PlaneBufferGeometry(500,500);
    const cloudGeo = new THREE.PlaneGeometry(500, 500);

    // Original: cloudMaterial = new THREE.MeshLambertMaterial({map:texture, transparent: true});
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: this.smokeTexture,
      transparent: true
    });

    // Original: for(let p=0; p<25; p++)
    for (let p = 0; p < this.cloudCount; p++) {
      const cloud = new THREE.Mesh(cloudGeo.clone(), cloudMaterial.clone());

      // Original: cloud.position.set(Math.random()*800 -400, 500, Math.random()*500-500);
      cloud.position.set(
        Math.random() * 800 - 400,
        500,
        Math.random() * 500 - 500
      );

      // Original camera rotation values
      cloud.rotation.x = 1.16;
      cloud.rotation.y = -0.12;
      cloud.rotation.z = Math.random() * 2 * Math.PI;

      // Original: cloud.material.opacity = 0.55;
      cloud.material.opacity = 0.55;

      this.cloudParticles.push(cloud);
      this.customGroup.add(cloud);
    }

    cloudGeo.dispose();
    this.markNeedsRender();
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

    // Original: Cloud Rotation Animation
    // cloudParticles.forEach(p => { p.rotation.z -= 0.002; })
    if (this.cloudParticles && this.cloudParticles.length > 0) {
      this.cloudParticles.forEach(p => {
        p.rotation.z -= 0.002;
      });
    }

    // Original: RainDrop Animation
    // rainGeo.vertices.forEach(p => {
    //   p.velocity -= 3*Math.random()*1;
    //   p.y += p.velocity;
    //   if(p.y < -100){ p.y = 100; p.velocity = 0; }
    // })
    // rainGeo.verticesNeedUpdate = true;
    // rain.rotation.y += 0.002;
    if (this.rainGeo && this.rain && this.rainVelocities) {
      const positions = this.rainGeo.attributes.position;

      for (let i = 0; i < positions.count; i++) {
        const i3 = i * 3;

        // Original: p.velocity -= 3*Math.random()*1;
        this.rainVelocities[i] -= 3 * Math.random() * 1;

        // Original: p.y += p.velocity;
        positions.array[i3 + 1] += this.rainVelocities[i];

        // Original: if(p.y < -100){ p.y = 100; p.velocity = 0; }
        if (positions.array[i3 + 1] < -100) {
          positions.array[i3 + 1] = 100;
          positions.array[i3] = Math.random() * 400 - 200;
          positions.array[i3 + 2] = Math.random() * 400 - 200;
          this.rainVelocities[i] = 0;
        }
      }

      // Original: rainGeo.verticesNeedUpdate = true;
      positions.needsUpdate = true;

      // Original: rain.rotation.y += 0.002;
      this.rain.rotation.y += 0.002;
    }

    // Original: Lightening Animation
    // if(Math.random() > 0.96 || flash.power > 100) {
    //   if(flash.power<100) {
    //     flash.position.set(Math.random()*400, 300+Math.random()*200, 100);
    //   }
    //   flash.power = 50 + Math.random() * 500;
    // }
    if (this.flash) {
      const bassBoost = (this.audioReactive && this.audioReady && this.bass > 0.3) 
        ? this.bass * 200 * this.thunderSensitivity 
        : 0;

      // Use bass to trigger or original random condition
      const shouldFlash = (this.audioReactive && this.audioReady && this.bass > 0.3) 
        || Math.random() > 0.96 
        || this.flash.power > 100;

      if (shouldFlash) {
        if (this.flash.power < 100) {
          this.flash.position.set(
            Math.random() * 400,
            300 + Math.random() * 200,
            100
          );
        }
        this.flash.power = 50 + bassBoost + (Math.random() * 500);
      }
    }

    // Lock camera rotation
    if (this.controls && !this.controls.enabled) {
      this.camera.rotation.x = 1.16;
      this.camera.rotation.y = -0.12;
      this.camera.rotation.z = 0.27;
    }

    this.markNeedsRender();
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setThunderSensitivity({ value = 1.0 } = {}) {
    const val = Number(value);
    this.thunderSensitivity = Math.max(0.1, Math.min(3.0, Number.isFinite(val) ? val : 1.0));
  }

  setRainSize({ value = 0.1 } = {}) {
    const val = Number(value);
    this.rainSize = Math.max(0.05, Math.min(1.0, Number.isFinite(val) ? val : 0.1));
    if (this.rainMaterial) {
      this.rainMaterial.size = this.rainSize;
      this.markNeedsRender();
    }
  }

  destroy() {
    this.destroyed = true;

    if (this.cloudParticles) {
      this.cloudParticles.forEach(cloud => {
        if (cloud.geometry) cloud.geometry.dispose();
        if (cloud.material) {
          if (cloud.material.map) cloud.material.map.dispose();
          cloud.material.dispose();
        }
        if (cloud.parent) cloud.parent.remove(cloud);
      });
      this.cloudParticles = [];
    }

    if (this.rain) {
      if (this.rainGeo) {
        this.rainGeo.dispose();
      }
      if (this.rainMaterial) {
        this.rainMaterial.dispose();
      }
      if (this.rain.parent) {
        this.rain.parent.remove(this.rain);
      }
    }

    if (this.smokeTexture) {
      this.smokeTexture.dispose();
    }

    if (this.flash && this.flash.parent) {
      this.scene.remove(this.flash);
    }
    if (this.directionalLight && this.directionalLight.parent) {
      this.scene.remove(this.directionalLight);
    }
    if (this.ambient && this.ambient.parent) {
      this.scene.remove(this.ambient);
    }

    super.destroy();
  }
}

export default AudioRainThunder;
