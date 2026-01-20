/*
@nwWrld name: GridIcosahedron
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer, assetUrl
*/

const getNormalizedMousePos = (e) => {
  return {
    x: (e.clientX / window.innerWidth) * 2 - 1,
    y: -(e.clientY / window.innerHeight) * 2 + 1
  };
};

const getBaryCoord = (bufferGeometry) => {
  const length = bufferGeometry.attributes.position.array.length;
  const count = length / 3;
  const bary = [];
  for (let i = 0; i < count; i++) {
    bary.push(0, 0, 1, 0, 1, 0, 1, 0, 0);
  }
  const aCenter = new Float32Array(bary);
  bufferGeometry.setAttribute("aCenter", new THREE.BufferAttribute(aCenter, 3));
};

const gridIcosahedronShapeVertexShader = `
#define GLSLIFY 1
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

vec4 getWorldPosition(mat4 modelMat,vec3 pos){
    vec4 worldPosition=modelMat*vec4(pos,1.);
    return worldPosition;
}

vec3 getEyeVector(mat4 modelMat,vec3 pos,vec3 camPos){
    vec4 worldPosition=getWorldPosition(modelMat,pos);
    vec3 eyeVector=normalize(worldPosition.xyz-camPos);
    return eyeVector;
}

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEyeVector;

uniform float uNoiseDensity;

void main(){
    vec3 noise=pow(cnoise(normal),3.)*normal*uNoiseDensity;
    vec3 newPos=position+noise;
    
    vec4 modelPosition=modelMatrix*vec4(newPos,1.);
    vec4 viewPosition=viewMatrix*modelPosition;
    vec4 projectedPosition=projectionMatrix*viewPosition;
    gl_Position=projectedPosition;
    
    vUv=uv;
    
    vNormal=normalize(normalMatrix*normal);
    vEyeVector=getEyeVector(modelMatrix,position,cameraPosition);
}
`;

const gridIcosahedronShapeFragmentShader = `
#define GLSLIFY 1
vec3 computeNormal(vec3 normal){
    vec3 X=dFdx(normal);
    vec3 Y=dFdy(normal);
    vec3 cNormal=normalize(cross(X,Y));
    return cNormal;
}

vec2 hash22(vec2 p){
    p=fract(p*vec2(5.3983,5.4427));
    p+=dot(p.yx,p.xy+vec2(21.5351,14.3137));
    return fract(vec2(p.x*p.y*95.4337,p.x*p.y*97.597));
}

float fresnel(float bias,float scale,float power,vec3 I,vec3 N)
{
    return bias+scale*pow(1.+dot(I,N),power);
}

uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform float uRefractionStrength;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEyeVector;

void main(){
    vec2 newUv=vUv;
    vec3 cNormal=computeNormal(vNormal);
    float diffuse=dot(cNormal,vec3(1.));
    
    vec2 rand=hash22(vec2(floor(diffuse*10.)));
    vec2 strength=vec2(sign((rand.x-.5))+(rand.x-.5)*.6,sign((rand.y-.5))+(rand.y-.5)*.6);
    newUv=strength*gl_FragCoord.xy/vec2(1000.);
    
    vec3 refraction=.3*refract(vEyeVector,cNormal,1./3.);
    newUv+=refraction.xy;
    
    vec4 texture=texture2D(uTexture,newUv);
    vec4 color=texture;
    
    float F=fresnel(0.,1.,2.,vEyeVector,cNormal);
    color*=(1.-F);
    
    gl_FragColor=color;
}
`;

const gridIcosahedronEdgeVertexShader = `
#define GLSLIFY 1
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

varying vec2 vUv;
varying vec3 vCenter;
attribute vec3 aCenter;
uniform float uNoiseDensity;

void main(){
    vec3 noise=pow(cnoise(normal),3.)*normal*uNoiseDensity;
    vec3 newPos=position+noise;
    
    vec4 modelPosition=modelMatrix*vec4(newPos,1.);
    vec4 viewPosition=viewMatrix*modelPosition;
    vec4 projectedPosition=projectionMatrix*viewPosition;
    gl_Position=projectedPosition;
    
    vUv=uv;
    vCenter=aCenter;
}
`;

const gridIcosahedronEdgeFragmentShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uWidth;
varying vec2 vUv;
varying vec3 vCenter;

float edgeFactorTri(){
    vec3 d=fwidth(vCenter);
    vec3 a3=smoothstep(d*(uWidth-.5),d*(uWidth+.5),vCenter);
    return min(min(a3.x,a3.y),a3.z);
}

float invert(float n){
    return 1.-n;
}

void main(){
    float line=invert(edgeFactorTri());
    if(line<.1){
        discard;
    }
    vec4 color=vec4(vec3(line),1.);
    gl_FragColor=color;
}
`;

const gridIcosahedronPostprocessingVertexShader = `
varying vec2 vUv;

void main(){
    vec4 modelPosition=modelMatrix*vec4(position,1.);
    vec4 viewPosition=viewMatrix*modelPosition;
    vec4 projectedPosition=projectionMatrix*viewPosition;
    gl_Position=projectedPosition;
    
    vUv=uv;
}
`;

const gridIcosahedronPostprocessingFragmentShader = `
#define GLSLIFY 1
float hash(vec2 p){return fract(1e4*sin(17.*p.x+p.y*.1)*(.1+abs(sin(p.y*13.+p.x))));}

vec3 blackAndWhite(vec3 color){
    return vec3((color.r+color.g+color.b)/5.);
}

vec4 RGBShift(sampler2D t,vec2 rUv,vec2 gUv,vec2 bUv,float isBlackWhite){
    vec4 color1=texture2D(t,rUv);
    vec4 color2=texture2D(t,gUv);
    vec4 color3=texture2D(t,bUv);
    if(isBlackWhite==1.){\
        color1.rgb=blackAndWhite(color1.rgb);
        color2.rgb=blackAndWhite(color2.rgb);
        color3.rgb=blackAndWhite(color3.rgb);
    }
    vec4 color=vec4(color1.r,color2.g,color3.b,color2.a);
    return color;
}

uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform sampler2D tDiffuse;
uniform float uRGBShift;

varying vec2 vUv;

void main(){
    vec2 newUv=vUv;
    
    vec2 rUv=vUv+vec2(.01)*uRGBShift;
    vec2 gUv=vUv+vec2(0.);
    vec2 bUv=vUv+vec2(.01)*uRGBShift*-1.;
    vec4 color=RGBShift(tDiffuse,rUv,gUv,bUv,1.);
    
    float noise=hash(newUv+uTime)*.15;
    color.rgb+=vec3(noise);
    
    // Ensure background noise is visible if alpha is low
    color.a = max(color.a, 0.1); 

    gl_FragColor=color;
}
`;

class GridIcosahedron extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
        { name: "refractionStrength", defaultVal: 0.2, type: "number", min: 0, max: 1 },
        { name: "edgeWidth", defaultVal: 2, type: "number", min: 0.5, max: 5 },
        { name: "rgbShift", defaultVal: 0.3, type: "number", min: 0, max: 1 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setRefractionStrength",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.2, type: "number", min: 0, max: 1 }],
    },
    {
      name: "setEdgeWidth",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2, type: "number", min: 0.5, max: 5 }],
    },
    {
      name: "setRGBShift",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 0.3, type: "number", min: 0, max: 1 }],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = GridIcosahedron.name;
    this.customGroup = new THREE.Group();
    this.clock = new THREE.Clock();
    this.mousePos = new THREE.Vector2(0, 0);
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.audioReactive = true;
    
    // Smooth audio values
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;

    this.params = {
      uNoiseDensity: 0.1
    };
    this.gridIcosahedronShapeMaterial = null;
    this.gridIcosahedronEdgeMaterial = null;
    this.customPass = null;
    this.icoShapeMesh = null;
    this.icoEdgeMesh = null;
    this.composer = null;
    this.texture = null;
    this.destroyed = false;
    
    this.init();
  }

  async start({ sensitivity = 2.0, refractionStrength = 0.2, edgeWidth = 2, rgbShift = 0.3 } = {}) {
    const sensVal = Number(sensitivity);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    
    if (this.gridIcosahedronShapeMaterial) {
      this.gridIcosahedronShapeMaterial.uniforms.uRefractionStrength.value = Math.max(0, Math.min(1, Number(refractionStrength) || 0.2));
    }
    if (this.gridIcosahedronEdgeMaterial) {
      this.gridIcosahedronEdgeMaterial.uniforms.uWidth.value = Math.max(0.5, Math.min(5, Number(edgeWidth) || 2));
    }
    if (this.customPass) {
      this.customPass.uniforms.uRGBShift.value = Math.max(0, Math.min(1, Number(rgbShift) || 0.3));
    }
    
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
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

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setRefractionStrength({ value }) {
    if (this.gridIcosahedronShapeMaterial) {
      this.gridIcosahedronShapeMaterial.uniforms.uRefractionStrength.value = Math.max(0, Math.min(1, Number(value) || 0.2));
    }
  }

  setEdgeWidth({ value }) {
    if (this.gridIcosahedronEdgeMaterial) {
      this.gridIcosahedronEdgeMaterial.uniforms.uWidth.value = Math.max(0.5, Math.min(5, Number(value) || 2));
    }
  }

  setRGBShift({ value }) {
    if (this.customPass) {
      this.customPass.uniforms.uRGBShift.value = Math.max(0, Math.min(1, Number(value) || 0.3));
    }
  }

  init() {
    this.createMaterials();
    this.createMeshes();
    this.createPostprocessingEffect();
    this.trackMousePos();
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.animate.bind(this));
    this.loadTexture();
  }

  loadTexture() {
    const textureUrl = typeof assetUrl === "function" 
      ? assetUrl("images/grid-icosahedron.jpg") 
      : "https://i.loli.net/2021/03/09/1Cglerjx3yLauOo.jpg";
    
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (texture) => {
        this.texture = texture;
        texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
        if (this.gridIcosahedronShapeMaterial) {
          this.gridIcosahedronShapeMaterial.uniforms.uTexture.value = texture;
          this.gridIcosahedronShapeMaterial.needsUpdate = true;
        }
      },
      undefined,
      (err) => {
        console.error("[GridIcosahedron] Failed to load texture:", err);
      }
    );
  }

  createMaterials() {
    if (!this.texture) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      const gridSize = 32;
      const cellSize = canvas.width / gridSize;
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const isEven = (i + j) % 2 === 0;
          ctx.fillStyle = isEven ? '#5a9bd4' : '#3a7bb4';
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= gridSize; i++) {
        const pos = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
      }
      
      this.texture = new THREE.CanvasTexture(canvas);
      this.texture.wrapS = this.texture.wrapT = THREE.MirroredRepeatWrapping;
      this.texture.needsUpdate = true;
    }
    
    if (this.gridIcosahedronShapeMaterial && this.gridIcosahedronEdgeMaterial) {
      return;
    }

    this.gridIcosahedronShapeMaterial = new THREE.ShaderMaterial({
      vertexShader: gridIcosahedronShapeVertexShader,
      fragmentShader: gridIcosahedronShapeFragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uTexture: { value: this.texture },
        uRefractionStrength: { value: 0.2 },
        uNoiseDensity: { value: this.params.uNoiseDensity },
        cameraPosition: { value: new THREE.Vector3() }
      }
    });

    this.gridIcosahedronEdgeMaterial = new THREE.ShaderMaterial({
      vertexShader: gridIcosahedronEdgeVertexShader,
      fragmentShader: gridIcosahedronEdgeFragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uWidth: { value: 2 },
        uNoiseDensity: { value: this.params.uNoiseDensity }
      }
    });
  }

  createMeshes() {
    if (!this.gridIcosahedronShapeMaterial || !this.gridIcosahedronEdgeMaterial) {
      return;
    }

    const shapeGeometry = new THREE.IcosahedronGeometry(1, 1);
    this.icoShapeMesh = new THREE.Mesh(shapeGeometry, this.gridIcosahedronShapeMaterial);
    this.customGroup.add(this.icoShapeMesh);

    const edgeGeometry = new THREE.IcosahedronGeometry(1.001, 1);
    getBaryCoord(edgeGeometry);
    this.icoEdgeMesh = new THREE.Mesh(edgeGeometry, this.gridIcosahedronEdgeMaterial);
    this.customGroup.add(this.icoEdgeMesh);
    
    this.customGroup.scale.set(2, 2, 2);

    this.scene.add(this.customGroup);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
  }

  createPostprocessingEffect() {
    if (!this.renderer) return;

    const EffectComposer = window.EffectComposer || THREE.EffectComposer;
    const RenderPass = window.RenderPass || THREE.RenderPass;
    const ShaderPass = window.ShaderPass || THREE.ShaderPass;

    if (typeof EffectComposer === 'undefined' || typeof RenderPass === 'undefined' || typeof ShaderPass === 'undefined') {
      console.warn("[GridIcosahedron] Postprocessing addons not available, RGB shift disabled. Module will work without postprocessing.");
      return;
    }

    try {
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      this.customPass = new ShaderPass({
        vertexShader: gridIcosahedronPostprocessingVertexShader,
        fragmentShader: gridIcosahedronPostprocessingFragmentShader,
        uniforms: {
          tDiffuse: { value: null },
          uTime: { value: 0 },
          uRGBShift: { value: 0.3 }
        }
      });
      this.customPass.renderToScreen = true;
      this.composer.addPass(this.customPass);
    } catch (err) {
      console.warn("[GridIcosahedron] Postprocessing setup failed:", err);
    }
  }

  trackMousePos() {
    const handleMouseMove = (e) => {
      const { x, y } = getNormalizedMousePos(e);
      this.mousePos.x = x;
      this.mousePos.y = y;
    };

    window.addEventListener("mousemove", handleMouseMove);
    this.mouseMoveHandler = handleMouseMove;
  }

  animate() {
    if (this.destroyed || !this.clock) return;

    // Get time delta for smooth incremental rotation
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    if (!this.gridIcosahedronShapeMaterial || !this.camera) {
      this.markNeedsRender();
      return;
    }

    // Smooth audio reactivity values
    let targetVolume, targetBass, targetMid, targetTreble;

    if (this.audioReactive && this.analyzer && this.audioReady) {
      targetVolume = this.analyzer.getVolume() * this.sensitivity;
      targetBass = this.analyzer.getBass() * this.sensitivity;
      targetMid = this.analyzer.getMid() * this.sensitivity;
      targetTreble = this.analyzer.getTreble() * this.sensitivity;
    } else {
      const timeVariation = Math.sin(elapsedTime * 0.8) * 0.5 + 0.5;
      const timeVariation2 = Math.sin(elapsedTime * 1.2) * 0.5 + 0.5;
      targetVolume = 0.25 + timeVariation * 0.2;
      targetBass = 0.15 + timeVariation2 * 0.15;
      targetMid = 0.25 + timeVariation * 0.2;
      targetTreble = 0.15 + timeVariation2 * 0.15;
    }

    // Lerp values to reduce jitter
    const lerpFactor = 0.1;
    this.volume = THREE.MathUtils.lerp(this.volume, targetVolume, lerpFactor);
    this.bass = THREE.MathUtils.lerp(this.bass, targetBass, lerpFactor);
    this.mid = THREE.MathUtils.lerp(this.mid, targetMid, lerpFactor);
    this.treble = THREE.MathUtils.lerp(this.treble, targetTreble, lerpFactor);

    if (this.gridIcosahedronShapeMaterial && this.camera) {
      this.gridIcosahedronShapeMaterial.uniforms.uTime.value = elapsedTime;
      this.gridIcosahedronShapeMaterial.uniforms.uMouse.value = this.mousePos;
      this.gridIcosahedronShapeMaterial.uniforms.cameraPosition.value.copy(this.camera.position);
      
      if (this.customGroup) {
        const baseRotationSpeed = 0.3;
        const rotationSpeed = baseRotationSpeed + this.volume * 0.4;
        
        // FIXED: Use incremental rotation (+= delta * speed) instead of absolute (time * speed)
        // This prevents the "hectic" jumping when speed changes
        this.customGroup.rotation.x += delta * rotationSpeed;
        this.customGroup.rotation.y += delta * rotationSpeed * 0.8;
        this.customGroup.rotation.z += delta * rotationSpeed * 0.4;
        
        const baseScale = 2.0;
        const scalePulse = 1.0 + this.bass * 0.25 + Math.sin(elapsedTime * 3) * 0.08;
        const currentScale = this.customGroup.scale.x;
        const targetScale = baseScale * scalePulse;
        const scaleDelta = targetScale - currentScale;
        const easingFactor = 1.0 - Math.exp(-0.12 * 16.67);
        const smoothScale = currentScale + scaleDelta * easingFactor;
        this.customGroup.scale.set(smoothScale, smoothScale, smoothScale);
      }
      
      const baseNoise = 0.12 + Math.sin(elapsedTime * 1.5) * 0.05;
      const targetNoiseDensity = baseNoise + this.volume * 0.5;
      const currentNoiseDensity = this.gridIcosahedronShapeMaterial.uniforms.uNoiseDensity.value;
      const noiseDelta = targetNoiseDensity - currentNoiseDensity;
      const easingFactor = 1.0 - Math.exp(-0.15 * 16.67);
      const newNoiseDensity = currentNoiseDensity + noiseDelta * easingFactor;
      
      const clampedNoise = Math.max(0.08, Math.min(0.5, newNoiseDensity));
      this.gridIcosahedronShapeMaterial.uniforms.uNoiseDensity.value = clampedNoise;
      if (this.gridIcosahedronEdgeMaterial) {
        this.gridIcosahedronEdgeMaterial.uniforms.uNoiseDensity.value = clampedNoise;
      }
    }

    if (this.customPass) {
      this.customPass.uniforms.uTime.value = elapsedTime;
      const baseRGBShift = 0.25;
      const targetRGBShift = baseRGBShift + this.bass * 0.15 + Math.sin(elapsedTime * 2) * 0.08;
      const currentRGBShift = this.customPass.uniforms.uRGBShift.value;
      const shiftDelta = targetRGBShift - currentRGBShift;
      const easingFactor = 1.0 - Math.exp(-0.12 * 16.67);
      this.customPass.uniforms.uRGBShift.value = currentRGBShift + shiftDelta * easingFactor;
    }
    
    if (this.renderer && this.scene && this.camera) {
      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    }
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
    
    if (this.mouseMoveHandler) {
      window.removeEventListener("mousemove", this.mouseMoveHandler);
    }

    if (this.gridIcosahedronShapeMaterial) {
      this.gridIcosahedronShapeMaterial.dispose();
    }
    if (this.gridIcosahedronEdgeMaterial) {
      this.gridIcosahedronEdgeMaterial.dispose();
    }
    if (this.icoShapeMesh && this.icoShapeMesh.geometry) {
      this.icoShapeMesh.geometry.dispose();
    }
    if (this.icoEdgeMesh && this.icoEdgeMesh.geometry) {
      this.icoEdgeMesh.geometry.dispose();
    }
    if (this.texture) {
      this.texture.dispose();
    }
    if (this.composer) {
      this.composer.dispose();
    }

    super.destroy();
  }
}

export default GridIcosahedron;
