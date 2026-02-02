/*
@nwWrld name: Shipibo Gateway Ascended
@nwWrld category: Shader
@nwWrld imports: BaseThreeJsModule, THREE, ShaderArt
*/

// Original Shipibo Gateway — Ascended Version: fullscreen shader-art element with buffers + vert/frag

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

const FRAG_SOURCE = `
precision highp float;
varying vec2 vUv;
uniform float time;
uniform vec2 resolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.31, 31.77))) * 71421.54);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f*f*(3.0 - 2.0*f);
  return mix(
    mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
  f.y);
}

vec3 palette(float t) {
  vec3 a = vec3(0.45, 0.4, 0.38);
  vec3 b = vec3(0.30, 0.25, 0.25);
  vec3 c = vec3(1.0, 0.9, 0.8);
  vec3 d = vec3(0.05, 0.25, 0.55);
  return a + b*cos(6.28318*(c*t + d));
}

mat2 rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c,-s,s,c);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / resolution.y;
  vec2 base = uv;

  float t = time * 0.35;
  vec3 color = vec3(0.0);

  for(float i = 0.0; i < 7.0; i++) {
    uv = abs(uv);
    uv = uv * rot(0.4 + t * 0.25 + i * 0.1);

    float m = noise(uv * 3.5 + t * 1.2);
    uv += 0.25 * vec2(
      sin(uv.y * 4.0 + t*1.5 + m*2.0),
      sin(uv.x * 4.0 + t*1.7 + m*2.0)
    );

    float d = length(uv) * exp(-length(base)*0.7);
    float wave = sin(d*12.0 + t*3.0 + i*0.6);
    wave = abs(wave);
    wave = pow(0.006 / wave, 1.35);

    vec3 col = palette(d*0.7 + i*0.35 + t*0.5);
    color += col * wave;
  }

  float center = exp(-length(base) * 1.2);
  color *= center * 1.3;
  color = pow(color, vec3(0.72));

  gl_FragColor = vec4(color, 1.0);
}
`.trim();

class ShipiboGatewayAscended extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "speed", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 },
      ],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 1.0, type: "number", min: 0.1, max: 5.0 }],
    },
  ];

  constructor(container) {
    super(container);
    this.name = "Shipibo Gateway Ascended";
    this.speed = 1.0;
    this.shaderArtEl = null;
    this.destroyed = false;
  }

  async start({ speed = 1.0 } = {}) {
    const val = Number(speed);
    this.speed = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.0));

    if (!this.elem) {
      console.error("ShipiboGatewayAscended: Container element not available");
      return;
    }

    this.elem.style.position = "relative";
    this.elem.style.overflow = "hidden";

    if (!ShaderArt) {
      console.error("ShipiboGatewayAscended: ShaderArt not available");
      return;
    }

    ShaderArt.register();

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.setProperty("display", "none");
    }

    const shaderArt = document.createElement("shader-art");
    shaderArt.setAttribute("autoplay", "");
    shaderArt.setAttribute("role", "img");
    shaderArt.setAttribute("aria-label", "Hyper-real psychedelic Shipibo fractal visuals");
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
    fragScript.textContent = FRAG_SOURCE;

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

export default ShipiboGatewayAscended;
