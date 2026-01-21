/*
@nwWrld name: Cloud
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer, assetUrl
*/

class Cloud extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
        { name: "cloudCount", defaultVal: 8000, type: "number", min: 1000, max: 15000 },
        { name: "fogColor", defaultVal: "#4584b4", type: "color" },
        { name: "showBackground", defaultVal: true, type: "boolean" },
        { name: "cameraVerticalPosition", defaultVal: 0, type: "number", min: -500, max: 500 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setShowBackground",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setCameraVerticalPosition",
      executeOnLoad: false,
      options: [{ name: "position", defaultVal: 0, type: "number", min: -500, max: 500 }],
    },
    {
      name: "setCloudColor",
      executeOnLoad: false,
      options: [{ name: "color", defaultVal: "#ffffff", type: "color" }],
    },
    {
      name: "reset",
      executeOnLoad: false,
      options: [],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) {
      console.error("THREE is not available");
      return;
    }

    this.name = Cloud.name;
    this.customGroup = new THREE.Group();
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.speed = 1.0;
    this.audioReactive = true;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.startTime = Date.now();
    this.position = 0;
    this.cloudMeshes = [];
    this.fogColor = new THREE.Color(0x4584b4);
    this.cloudColor = new THREE.Color(0xffffff);
    this.cloudCount = 8000;
    this.showBackground = true;
    this.cameraVerticalPosition = 0;
    this.baseCameraY = 0;
    
    this.loadTexture();
  }

  async start({ sensitivity = 2.0, speed = 1.0, cloudCount = 8000, fogColor = "#4584b4", showBackground = true, cameraVerticalPosition = "center" } = {}) {
    const sensVal = Number(sensitivity);
    const speedVal = Number(speed);
    const countVal = Number(cloudCount);
    
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(speedVal) ? speedVal : 1.0));
    this.cloudCount = Math.max(1000, Math.min(15000, Number.isFinite(countVal) ? countVal : 8000));
    
    if (fogColor && typeof fogColor === 'string') {
      this.fogColor.set(fogColor);
    }
    
    this.showBackground = Boolean(showBackground);
    const posVal = Number(cameraVerticalPosition);
    this.cameraVerticalPosition = Number.isFinite(posVal) ? Math.max(-500, Math.min(500, posVal)) : 0;
    
    if (this.camera) {
      this.updateCameraVerticalPosition();
    }
    
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }

  loadTexture() {
    const textureLoader = new THREE.TextureLoader();
    const relPath = "images/cloud10.png";
    const textureUrl = typeof assetUrl === "function" ? assetUrl(relPath) : null;
    if (!textureUrl) {
      console.error("[Cloud] assetUrl helper not available");
      return;
    }
    console.log("[Cloud] Attempting to load texture from:", textureUrl);
    textureLoader.load(
      textureUrl,
      (texture) => {
        console.log("[Cloud] Texture loaded successfully");
        texture.colorSpace = THREE.SRGBColorSpace;
        this.init(texture);
      },
      (progress) => {
        if (progress && progress.total) {
          console.log("[Cloud] Texture loading progress:", Math.round((progress.loaded / progress.total) * 100) + "%");
        }
      },
      (error) => {
        console.error("[Cloud] Failed to load cloud texture");
        console.error("[Cloud] Error type:", error?.constructor?.name);
        console.error("[Cloud] Error message:", error?.message);
        console.error("[Cloud] Error details:", {
          type: error?.type,
          target: error?.target?.src || error?.target?.href,
          status: error?.target?.status,
          statusText: error?.target?.statusText,
        });
        if (error?.stack) {
          console.error("[Cloud] Error stack:", error.stack);
        }
      }
    );
  }

  // Manual geometry merging function (fallback when BufferGeometryUtils unavailable)
  mergeGeometries(geometries) {
    if (!geometries || geometries.length === 0) return null;
    
    // Calculate total vertices
    let totalVertices = 0;
    let totalIndices = 0;
    
    geometries.forEach(geo => {
      totalVertices += geo.attributes.position.count;
      if (geo.index) {
        totalIndices += geo.index.count;
      }
    });

    // Create merged geometry
    const mergedGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(totalVertices * 3);
    const uvArray = new Float32Array(totalVertices * 2);
    const indexArray = totalIndices > 0 ? new Uint32Array(totalIndices) : null;

    let vertexOffset = 0;
    let indexOffset = 0;
    let currentVertex = 0;

    geometries.forEach(geo => {
      const positions = geo.attributes.position;
      const uvs = geo.attributes.uv;
      const indices = geo.index;

      // Copy positions
      for (let i = 0; i < positions.count; i++) {
        posArray[vertexOffset * 3 + i * 3] = positions.getX(i);
        posArray[vertexOffset * 3 + i * 3 + 1] = positions.getY(i);
        posArray[vertexOffset * 3 + i * 3 + 2] = positions.getZ(i);
      }

      // Copy UVs
      if (uvs) {
        for (let i = 0; i < uvs.count; i++) {
          uvArray[vertexOffset * 2 + i * 2] = uvs.getX(i);
          uvArray[vertexOffset * 2 + i * 2 + 1] = uvs.getY(i);
        }
      }

      // Copy indices with offset
      if (indices && indexArray) {
        for (let i = 0; i < indices.count; i++) {
          indexArray[indexOffset + i] = indices.getX(i) + currentVertex;
        }
        indexOffset += indices.count;
      }

      vertexOffset += positions.count;
      currentVertex += positions.count;
    });

    mergedGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    mergedGeo.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    if (indexArray) {
      mergedGeo.setIndex(new THREE.BufferAttribute(indexArray, 1));
    }

    return mergedGeo;
  }

  init(texture) {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;

    // Setup fog and background
    let fog = null;
    if (this.showBackground) {
      fog = new THREE.Fog(this.fogColor, -100, 3000);
      this.scene.fog = fog;
      this.renderer.setClearColor(this.fogColor);
    } else {
      this.scene.fog = null;
      this.renderer.setClearColor(0x000000, 0);
    }

    // Setup camera
    this.camera.position.z = 6000;
    this.camera.fov = 30;
    this.camera.updateProjectionMatrix();
    this.updateCameraVerticalPosition();

    // Create cloud shader material
    texture.magFilter = THREE.LinearMipMapLinearFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    const fogColorValue = fog ? fog.color : new THREE.Color(0x000000);
    const fogNearValue = fog ? fog.near : -100;
    const fogFarValue = fog ? fog.far : 3000;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        fogColor: { value: fogColorValue },
        fogNear: { value: fogNearValue },
        fogFar: { value: fogFarValue },
        useFog: { value: this.showBackground ? 1.0 : 0.0 },
        cloudColor: { value: this.cloudColor },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec3 fogColor;
        uniform vec3 cloudColor;
        uniform float fogNear;
        uniform float fogFar;
        uniform float useFog;
        varying vec2 vUv;

        void main() {
          gl_FragColor = texture2D(map, vUv);
          gl_FragColor.rgb *= cloudColor;
          gl_FragColor.w *= pow(gl_FragCoord.z, 20.0);
          
          if (useFog > 0.5) {
            float depth = gl_FragCoord.z / gl_FragCoord.w;
            float fogFactor = smoothstep(fogNear, fogFar, depth);
            gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);
          }
        }
      `,
      depthWrite: false,
      depthTest: false,
      transparent: true,
    });

    // Create cloud planes
    const planeGeo = new THREE.PlaneGeometry(64, 64);
    const planeObj = new THREE.Object3D();
    const geometries = [];

    for (let i = 0; i < this.cloudCount; i++) {
      planeObj.position.x = Math.random() * 1000 - 500;
      planeObj.position.y = -Math.random() * Math.random() * 200 - 15;
      planeObj.position.z = i;
      planeObj.rotation.z = Math.random() * Math.PI;
      planeObj.scale.x = planeObj.scale.y = Math.random() * Math.random() * 1.5 + 0.5;
      planeObj.updateMatrix();

      const clonedPlaneGeo = planeGeo.clone();
      clonedPlaneGeo.applyMatrix4(planeObj.matrix);
      geometries.push(clonedPlaneGeo);
    }

    // Merge geometries using manual merge
    const mergedGeo = this.mergeGeometries(geometries);
    
    if (!mergedGeo) {
      console.error("Failed to merge geometries");
      return;
    }

    const planesMesh = new THREE.Mesh(mergedGeo, material);
    planesMesh.renderOrder = 2;
    planesMesh.userData.baseZ = 0;

    const planesMeshA = planesMesh.clone();
    planesMeshA.position.z = -this.cloudCount;
    planesMeshA.renderOrder = 1;
    planesMeshA.userData.baseZ = -this.cloudCount;

    this.customGroup.add(planesMesh);
    this.customGroup.add(planesMeshA);
    
    this.cloudMeshes.push(planesMesh, planesMeshA);

    // Cleanup temp geometries
    geometries.forEach(geo => geo.dispose());
    planeGeo.dispose();

    this.setModel(this.customGroup);
    this.setCustomAnimate(this.audioAnimate.bind(this));
  }

  audioAnimate() {
    if (this.destroyed) return;

    // Update audio values
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

    // Calculate speed with audio reactivity
    const audioSpeedBoost = 1 + this.bass * 0.3;
    const effectiveSpeed = this.speed * audioSpeedBoost;
    const rawPosition = (Date.now() - this.startTime) * 0.03 * effectiveSpeed;
    this.position = rawPosition % this.cloudCount;

    // Update camera position (keep camera relatively stationary)
    this.camera.position.x = 0;
    this.camera.position.y = this.baseCameraY;
    this.camera.position.z = this.cloudCount;

    // Make clouds appear infinite by moving meshes forward and wrapping them
    if (this.cloudMeshes.length >= 2) {
      const mesh1 = this.cloudMeshes[0];
      const mesh2 = this.cloudMeshes[1];
      const cloudRange = this.cloudCount;
      
      // Move meshes forward (away from camera) to create flying-through effect
      const offset = this.position;
      mesh1.position.z = offset;
      mesh2.position.z = offset - cloudRange;
      
      // When a mesh goes too far behind camera, wrap it forward
      if (mesh1.position.z < -cloudRange) {
        mesh1.position.z += cloudRange * 2;
      }
      if (mesh2.position.z < -cloudRange) {
        mesh2.position.z += cloudRange * 2;
      }
      
      // Ensure meshes stay in correct relative positions
      if (mesh1.position.z > mesh2.position.z + cloudRange) {
        mesh2.position.z = mesh1.position.z - cloudRange;
      }
      if (mesh2.position.z > mesh1.position.z + cloudRange) {
        mesh1.position.z = mesh2.position.z - cloudRange;
      }
    }

    // Audio-reactive fog
    if (this.showBackground && this.scene.fog) {
      const fogIntensity = 1 + this.mid * 0.2;
      this.scene.fog.far = 3000 * fogIntensity;
    }

    // Audio-reactive cloud opacity
    if (this.cloudMeshes.length > 0) {
      const opacityBoost = 1 + this.treble * 0.3;
      this.cloudMeshes.forEach(mesh => {
        if (mesh.material.uniforms) {
          mesh.material.uniforms.fogFar.value = 3000 * opacityBoost;
        }
      });
    }
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.0));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setShowBackground({ enabled = true } = {}) {
    this.showBackground = Boolean(enabled);
    if (this.renderer) {
      if (this.showBackground) {
        const fog = new THREE.Fog(this.fogColor, -100, 3000);
        this.scene.fog = fog;
        this.renderer.setClearColor(this.fogColor);
        if (this.cloudMeshes.length > 0) {
          this.cloudMeshes.forEach(mesh => {
            if (mesh.material.uniforms) {
              mesh.material.uniforms.fogColor.value = fog.color;
              mesh.material.uniforms.fogNear.value = fog.near;
              mesh.material.uniforms.fogFar.value = fog.far;
              mesh.material.uniforms.useFog.value = 1.0;
            }
          });
        }
      } else {
        this.scene.fog = null;
        this.renderer.setClearColor(0x000000, 0);
        if (this.cloudMeshes.length > 0) {
          this.cloudMeshes.forEach(mesh => {
            if (mesh.material.uniforms) {
              mesh.material.uniforms.useFog.value = 0.0;
            }
          });
        }
      }
    }
  }

  setCameraVerticalPosition({ position = 0 } = {}) {
    const posVal = Number(position);
    this.cameraVerticalPosition = Number.isFinite(posVal) ? Math.max(-500, Math.min(500, posVal)) : 0;
    this.updateCameraVerticalPosition();
  }

  updateCameraVerticalPosition() {
    if (!this.camera) return;
    
    this.baseCameraY = this.cameraVerticalPosition;
    this.camera.position.y = this.baseCameraY;
  }

  setCloudColor({ color = "#ffffff" } = {}) {
    if (color && typeof color === 'string') {
      this.cloudColor.set(color);
      if (this.cloudMeshes.length > 0) {
        this.cloudMeshes.forEach(mesh => {
          if (mesh.material.uniforms) {
            mesh.material.uniforms.cloudColor.value = this.cloudColor;
          }
        });
      }
    }
  }

  reset() {
    this.sensitivity = 2.0;
    this.speed = 1.0;
    this.cloudCount = 8000;
    this.fogColor.set("#4584b4");
    this.cloudColor.set("#ffffff");
    this.showBackground = true;
    this.cameraVerticalPosition = 0;
    this.audioReactive = true;
    
    if (this.camera) {
      this.updateCameraVerticalPosition();
    }
    
    if (this.renderer && this.scene) {
      if (this.showBackground) {
        const fog = new THREE.Fog(this.fogColor, -100, 3000);
        this.scene.fog = fog;
        this.renderer.setClearColor(this.fogColor);
      } else {
        this.scene.fog = null;
        this.renderer.setClearColor(0x000000, 0);
      }
    }
    
    if (this.cloudMeshes.length > 0) {
      this.cloudMeshes.forEach(mesh => {
        if (mesh.material.uniforms) {
          mesh.material.uniforms.fogColor.value = this.fogColor;
          mesh.material.uniforms.cloudColor.value = this.cloudColor;
          mesh.material.uniforms.useFog.value = this.showBackground ? 1.0 : 0.0;
        }
      });
    }
  }

  destroy() {
    this.destroyed = true;

    if (this.cloudMeshes) {
      this.cloudMeshes.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (mesh.material.uniforms?.map?.value) {
            mesh.material.uniforms.map.value.dispose();
          }
          mesh.material.dispose();
        }
      });
      this.cloudMeshes = [];
    }

    if (this.customGroup) {
      this.scene.remove(this.customGroup);
    }

    super.destroy();
  }
}

export default Cloud;
