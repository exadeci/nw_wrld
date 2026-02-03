/*
@nwWrld name: Elevated Mountain
@nwWrld category: Shader
@nwWrld imports: BaseThreeJsModule, THREE, ShaderArt
*/

// Copyright Inigo Quilez, 2013 / 2016 - https://iquilezles.org/
// Educational use; see original comments in shader.
// Terrain raymarching: derivatives noise, soft shadows, fog, outdoor lighting.

const POSITION_BUFFER = "[-1, 1, -1,-1, 1,1, 1, 1, -1,-1, 1,-1]";
const UV_BUFFER = "[ 0,0, 0,1, 1,0, 1,0, 0,1, 1,1 ]";

const VERT_SOURCE = `
precision highp float;
attribute vec4 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = position;
}
`.trim();

const QUALITY_PRESETS = {
  low: { MAX_RAY_STEPS: 80, MAX_SHADOW_STEPS: 24, TERRAIN_H_OCTAVES: 10, TERRAIN_M_OCTAVES: 6 },
  medium: { MAX_RAY_STEPS: 140, MAX_SHADOW_STEPS: 48, TERRAIN_H_OCTAVES: 12, TERRAIN_M_OCTAVES: 7 },
  high: { MAX_RAY_STEPS: 300, MAX_SHADOW_STEPS: 80, TERRAIN_H_OCTAVES: 16, TERRAIN_M_OCTAVES: 9 },
};

function getFragSource(quality) {
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.medium;
  const { MAX_RAY_STEPS, MAX_SHADOW_STEPS, TERRAIN_H_OCTAVES, TERRAIN_M_OCTAVES } = preset;
  return `
precision highp float;
varying vec2 vUv;
uniform float time;
uniform vec2 resolution;

#define iResolution resolution
#define iTime time
#define iTimeDelta 0.016
#define iMouse vec4(0.,0.,0.,0.)

#define AA 1
#define USE_SMOOTH_NOISE 0
#define SC (250.0)
#define MAX_RAY_STEPS ${MAX_RAY_STEPS}
#define MAX_SHADOW_STEPS ${MAX_SHADOW_STEPS}
#define TERRAIN_H_OCTAVES ${TERRAIN_H_OCTAVES}
#define TERRAIN_M_OCTAVES ${TERRAIN_M_OCTAVES}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 noised(vec2 x) {
  vec2 f = fract(x);
  #if USE_SMOOTH_NOISE==0
  vec2 u = f*f*(3.0-2.0*f);
  vec2 du = 6.0*f*(1.0-f);
  #else
  vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
  vec2 du = 30.0*f*f*(f*(f-2.0)+1.0);
  #endif
  vec2 p = floor(x);
  float a = hash(p+vec2(0.0,0.0));
  float b = hash(p+vec2(1.0,0.0));
  float c = hash(p+vec2(0.0,1.0));
  float d = hash(p+vec2(1.0,1.0));
  return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,
              du*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));
}

const mat2 m2 = mat2(0.8,-0.6,0.6,0.8);

float terrainH(vec2 x) {
  vec2 p = x*0.003/SC;
  float a = 0.0;
  float b = 1.0;
  vec2 d = vec2(0.0);
  for (int i=0; i<TERRAIN_H_OCTAVES; i++) {
    vec3 n = noised(p);
    d += n.yz;
    a += b*n.x/(1.0+dot(d,d));
    b *= 0.5;
    p = m2*p*2.0;
  }
  #if USE_SMOOTH_NOISE==1
  a *= 0.9;
  #endif
  return SC*120.0*a;
}

float terrainM(vec2 x) {
  vec2 p = x*0.003/SC;
  float a = 0.0;
  float b = 1.0;
  vec2 d = vec2(0.0);
  for (int i=0; i<TERRAIN_M_OCTAVES; i++) {
    vec3 n = noised(p);
    d += n.yz;
    a += b*n.x/(1.0+dot(d,d));
    b *= 0.5;
    p = m2*p*2.0;
  }
  #if USE_SMOOTH_NOISE==1
  a *= 0.9;
  #endif
  return SC*120.0*a;
}

float terrainL(vec2 x) {
  vec2 p = x*0.003/SC;
  float a = 0.0;
  float b = 1.0;
  vec2 d = vec2(0.0);
  for (int i=0; i<3; i++) {
    vec3 n = noised(p);
    d += n.yz;
    a += b*n.x/(1.0+dot(d,d));
    b *= 0.5;
    p = m2*p*2.0;
  }
  #if USE_SMOOTH_NOISE==1
  a *= 0.9;
  #endif
  return SC*120.0*a;
}

float raycast(vec3 ro, vec3 rd, float tmin, float tmax) {
  float t = tmin;
  float prevH = 0.;
  for (int i=0; i<MAX_RAY_STEPS; i++) {
    vec3 pos = ro + t*rd;
    float h = pos.y - terrainM(pos.xz);
    if (h<(0.0015*t) || t>tmax) {
      float ff = (prevH - (0.0015*t)) / (prevH-h);
      if (ff > 0.) t += 0.4*h * ff;
      return t;
    }
    t += 0.4*h;
    prevH = h;
  }
  return t;
}

float softShadow(vec3 ro, vec3 rd, float dis) {
  float minStep = clamp(dis*0.01, SC*0.5, SC*50.0);
  float res = 1.0;
  float t = 0.001;
  for (int i=0; i<MAX_SHADOW_STEPS; i++) {
    vec3 p = ro + t*rd;
    float h = p.y - terrainM(p.xz);
    res = min(res, 16.0*h/t);
    t += max(minStep, h);
    if (res<0.001 || p.y>(SC*200.0)) break;
  }
  return clamp(res, 0.0, 1.0);
}

vec3 calcNormal(vec3 pos, float t) {
  vec2 eps = vec2(0.001*t, 0.0);
  return normalize(vec3(terrainH(pos.xz-eps.xy) - terrainH(pos.xz+eps.xy),
                        2.0*eps.x,
                        terrainH(pos.xz-eps.yx) - terrainH(pos.xz+eps.yx)));
}

float fbm(vec2 p) {
  float f = 0.0;
  f += 0.5000*noised(p).x; p = m2*p*2.02;
  f += 0.2500*noised(p).x; p = m2*p*2.03;
  f += 0.1250*noised(p).x; p = m2*p*2.01;
  f += 0.0625*noised(p).x;
  return f/0.9375;
}

const float kMaxT = 5000.0*SC;

vec4 render(vec3 ro, vec3 rd) {
  vec3 light1 = normalize(vec3(-0.8, 0.4, -0.3));
  float tmin = 1.0;
  float tmax = kMaxT;
  float maxh = 250.0*SC;
  float tp = (maxh-ro.y)/rd.y;
  if (tp>0.0) {
    if (ro.y>maxh) tmin = max(tmin, tp);
    else tmax = min(tmax, tp);
  }
  float sundot = clamp(dot(rd, light1), 0.0, 1.0);
  vec3 col;
  float t = raycast(ro, rd, tmin, tmax);
  if (t>tmax) {
    col = vec3(0.3, 0.5, 0.85) - rd.y*rd.y*0.5;
    col = mix(col, 0.85*vec3(0.7, 0.75, 0.85), pow(1.0-max(rd.y, 0.0), 4.0));
    col += 0.25*vec3(1.0, 0.7, 0.4)*pow(sundot, 5.0);
    col += 0.25*vec3(1.0, 0.8, 0.6)*pow(sundot, 64.0);
    col += 0.2*vec3(1.0, 0.8, 0.6)*pow(sundot, 512.0);
    vec2 sc = ro.xz + rd.xz*(SC*1000.0-ro.y)/rd.y;
    col = mix(col, vec3(1.0, 0.95, 1.0), 0.5*smoothstep(0.5, 0.8, fbm(0.0005*sc/SC)));
    col = mix(col, 0.68*vec3(0.4, 0.65, 1.0), pow(1.0-max(rd.y, 0.0), 16.0));
    t = -1.0;
  } else {
    vec3 pos = ro + t*rd;
    vec3 nor = calcNormal(pos, t);
    vec3 ref = reflect(rd, nor);
    float fre = clamp(1.0+dot(rd, nor), 0.0, 1.0);
    vec3 hal = normalize(light1-rd);
    float r = noised((7.0/SC)*pos.xz).x;
    col = (r*0.25+0.75)*0.9*mix(vec3(0.08, 0.05, 0.03), vec3(0.10, 0.09, 0.08),
                                noised(0.00007*vec2(pos.x, pos.y*48.0)).x);
    col = mix(col, 0.20*vec3(0.45, 0.30, 0.15)*(0.50+0.50*r), smoothstep(0.70, 0.9, nor.y));
    col = mix(col, 0.15*vec3(0.30, 0.30, 0.10)*(0.25+0.75*r), smoothstep(0.95, 1.0, nor.y));
    col *= 0.1+1.8*sqrt(fbm(pos.xz*0.04)*fbm(pos.xz*0.005));
    float h = smoothstep(55.0, 80.0, pos.y/SC + 25.0*fbm(0.01*pos.xz/SC));
    float e = smoothstep(1.0-0.5*h, 1.0-0.1*h, nor.y);
    float o = 0.3 + 0.7*smoothstep(0.0, 0.1, nor.x+h*h);
    float s = h*e*o;
    col = mix(col, 0.29*vec3(0.62, 0.65, 0.7), smoothstep(0.1, 0.9, s));
    float amb = clamp(0.5+0.5*nor.y, 0.0, 1.0);
    float dif = clamp(dot(light1, nor), 0.0, 1.0);
    float bac = clamp(0.2+0.8*dot(normalize(vec3(-light1.x, 0.0, light1.z)), nor), 0.0, 1.0);
    float sh = 1.0;
    if (dif>=0.0001) sh = softShadow(pos+light1*SC*0.05, light1, t);
    vec3 lin = vec3(0.0);
    lin += dif*vec3(8.00, 5.00, 3.00)*1.3*vec3(sh, sh*sh*0.5+0.5*sh, sh*sh*0.8+0.2*sh);
    lin += amb*vec3(0.40, 0.60, 1.00)*1.2;
    lin += bac*vec3(0.40, 0.50, 0.60);
    col *= lin;
    col += (0.7+0.3*s)*(0.04+0.96*pow(clamp(1.0+dot(hal, rd), 0.0, 1.0), 5.0))*
           vec3(7.0, 5.0, 3.0)*dif*sh*pow(clamp(dot(nor, hal), 0.0, 1.0), 16.0);
    col += s*0.65*pow(fre, 4.0)*vec3(0.3, 0.5, 0.6)*smoothstep(0.0, 0.6, ref.y);
    float fo = 1.0-exp(-pow(0.001*t/SC, 1.5));
    vec3 fco = 0.65*vec3(0.4, 0.65, 1.0);
    col = mix(col, fco, fo);
  }
  col += 0.3*vec3(1.0, 0.7, 0.3)*pow(sundot, 8.0);
  col = sqrt(col);
  return vec4(col, t);
}

vec3 camPath(float time) {
  return SC*1100.0*vec3(cos(0.0+0.23*time), 0.0, cos(1.5+0.21*time));
}

mat3 setCamera(vec3 ro, vec3 ta, float cr) {
  vec3 cw = normalize(ta-ro);
  vec3 cp = vec3(sin(cr), cos(cr), 0.0);
  vec3 cu = normalize(cross(cw, cp));
  vec3 cv = normalize(cross(cu, cw));
  return mat3(cu, cv, cw);
}

void moveCamera(float time, out vec3 oRo, out vec3 oTa, out float oCr, out float oFl) {
  vec3 ro = camPath(time);
  vec3 ta = camPath(time + 3.0);
  ro.y = terrainL(ro.xz) + 22.0*SC;
  ta.y = ro.y - 20.0*SC;
  float cr = 0.2*cos(0.1*time);
  oRo = ro;
  oTa = ta;
  oCr = cr;
  oFl = 3.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float time = iTime*0.1 - 0.1 + 0.3 + 4.0*iMouse.x/iResolution.x;
  vec3 ro, ta;
  float cr, fl;
  moveCamera(time, ro, ta, cr, fl);
  mat3 cam = setCamera(ro, ta, cr);
  vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;
  float t = kMaxT;
  vec3 tot = vec3(0.0);
  #if AA>1
  for (int m=0; m<AA; m++)
  for (int n=0; n<AA; n++) {
    vec2 o = vec2(float(m), float(n)) / float(AA) - 0.5;
    vec2 s = (-iResolution.xy + 2.0*(fragCoord+o))/iResolution.y;
  #else
    vec2 s = p;
  #endif
    vec3 rd = cam * normalize(vec3(s, fl));
    vec4 res = render(ro, rd);
    t = min(t, res.w);
    tot += res.xyz;
  #if AA>1
  }
  tot /= float(AA*AA);
  #endif
  vec2 uv = fragCoord/iResolution.xy;
  tot *= 0.5 + 0.5*pow(16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y), 0.1);
  tot = clamp(tot, 0.0, 1.0);
  tot = tot*0.6 + 0.4*tot*tot*(3.0-2.0*tot) + vec3(0.0, 0.0, 0.04);
  fragColor = vec4(tot, 1.0);
}

void main() {
  vec4 fragColor;
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}
`.trim();
}

class ElevatedMountain extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
        { name: "quality", defaultVal: "medium", type: "select", values: ["low", "medium", "high"] },
      ],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
    {
      name: "setQuality",
      executeOnLoad: false,
      options: [{ name: "quality", defaultVal: "medium", type: "select", values: ["low", "medium", "high"] }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = "Elevated Mountain";
    this.speed = 1.0;
    this.quality = "medium";
    this.shaderArtEl = null;
    this.destroyed = false;
  }

  async start({ speed = 1.0, quality = "medium" } = {}) {
    const val = Number(speed);
    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.0));
    this.quality = ["low", "medium", "high"].includes(quality) ? quality : "medium";

    if (!this.elem) {
      console.error("ElevatedMountain: Container element not available");
      return;
    }

    this.elem.style.position = "relative";
    this.elem.style.overflow = "hidden";

    if (!ShaderArt) {
      console.error("ElevatedMountain: ShaderArt not available");
      return;
    }

    ShaderArt.register();

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.setProperty("display", "none");
    }

    const shaderArt = document.createElement("shader-art");
    shaderArt.setAttribute("autoplay", "");
    shaderArt.setAttribute("role", "img");
    shaderArt.setAttribute("aria-label", "Elevated Mountain terrain by Inigo Quilez");
    shaderArt.style.display = "block";
    shaderArt.style.width = "100%";
    shaderArt.style.height = "100%";
    shaderArt.style.position = "absolute";
    shaderArt.style.left = "0";
    shaderArt.style.top = "0";
    shaderArt.style.right = "0";
    shaderArt.style.bottom = "0";

    const posScript = document.createElement("script");
    posScript.type = "text/buffer";
    posScript.id = "position";
    posScript.setAttribute("data-size", "2");
    posScript.textContent = POSITION_BUFFER;

    const uvScript = document.createElement("script");
    uvScript.type = "text/buffer";
    uvScript.id = "uv";
    uvScript.setAttribute("data-size", "2");
    uvScript.textContent = UV_BUFFER;

    const vertScript = document.createElement("script");
    vertScript.type = "text/vert";
    vertScript.textContent = VERT_SOURCE;

    const fragScript = document.createElement("script");
    fragScript.type = "text/frag";
    fragScript.textContent = getFragSource(this.quality);

    shaderArt.appendChild(posScript);
    shaderArt.appendChild(uvScript);
    shaderArt.appendChild(vertScript);
    shaderArt.appendChild(fragScript);

    this.elem.appendChild(shaderArt);
    this.shaderArtEl = shaderArt;
  }

  setSpeed({ value = 1.0 } = {}) {
    const val = Number(value);
    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.0));
  }

  setQuality({ quality = "medium" } = {}) {
    if (["low", "medium", "high"].includes(quality)) this.quality = quality;
  }

  destroy() {
    this.destroyed = true;

    if (this.shaderArtEl && this.shaderArtEl.parentNode) {
      this.shaderArtEl.parentNode.removeChild(this.shaderArtEl);
      this.shaderArtEl = null;
    }

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.removeProperty("display");
    }

    super.destroy();
  }
}

export default ElevatedMountain;
