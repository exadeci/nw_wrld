/*
@nwWrld name: Audio Water Gradient
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

// Gradient + audio‑reactive water shader based on the snippet you provided,
// adapted to the nwWrld BaseThreeJsModule system (no mouse/touch, no external UI).

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_speed;
  uniform sampler2D u_waterTexture;
  uniform float u_waterStrength;
  uniform float u_ripple_time;
  uniform vec2 u_ripple_position;
  uniform float u_ripple_strength;
  uniform sampler2D u_logoTexture;
  uniform bool u_showLogo;
  uniform float u_audioLow;
  uniform float u_audioMid;
  uniform float u_audioHigh;
  uniform float u_audioOverall;
  uniform float u_audioReactivity;
  uniform int u_gradientTheme;

  varying vec2 vUv;

  vec4 electricPlasma(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 8.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += sin(i - d + 0.15 * t - a * u.x);
    }
    vec3 c = mix(vec3(0.1, 0.0, 0.8), vec3(0.5, 0.2, 1.0), 0.5 + 0.5 * cos(a));
    c = mix(c, vec3(1.0), 0.5 + 0.5 * sin(d));
    return vec4(c, 1.0);
  }

  vec4 moltenGold(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 10.0; d += cos(i * u.y * 0.8 + a)) {
      i += 1.0;
      a += cos(i - d + 0.1 * t - a * u.x + length(u));
    }
    vec3 c = mix(vec3(0.0), vec3(0.6, 0.1, 0.0), smoothstep(-1.0, 1.0, cos(d)));
    c = mix(c, vec3(1.0, 0.5, 0.0), smoothstep(-0.5, 0.5, sin(a)));
    c = mix(c, vec3(1.0, 0.9, 0.3), smoothstep(0.8, 1.0, cos(a + d)));
    return vec4(pow(c, vec3(1.5)), 1.0);
  }

  vec4 emeraldMist(vec2 u, float t) {
    float angle = t * 0.05;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    u = rot * u;
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 5.0; d += sin(i * u.y + a) * 0.5) {
      i += 1.0;
      a += cos(i - d + 0.1 * t - a * u.x);
    }
    vec3 c = mix(vec3(0.0, 0.1, 0.1), vec3(0.1, 0.8, 0.6), 0.5 + 0.5 * cos(a));
    c = mix(c, vec3(0.9, 1.0, 0.9), 0.5 + 0.5 * sin(d));
    return vec4(c, 1.0);
  }

  vec4 auroraWarp(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 12.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += sin(i - d + 0.1 * t - a * u.x);
    }
    vec4 o;
    o.r = 0.5 + 0.5 * cos(a + d);
    o.g = 0.5 + 0.5 * cos(a + d + 2.09);
    o.b = 0.5 + 0.5 * cos(a + d + 4.18);
    o.a = 1.0;
    return cos(0.5 + 0.5 * cos(vec4(d, a, 2.5, 0.0)) * o);
  }

  vec4 cosmicOcean(vec2 u, float t) {
    vec2 p = vec2(u.x * 0.2, u.y);
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 8.0; d += sin(i * p.y + a + t * 0.08)) {
      i += 1.0;
      a += cos(i - d + 0.1 * t - a * p.x);
    }
    vec3 c = mix(vec3(0.0, 0.05, 0.2), vec3(0.1, 0.2, 0.7), smoothstep(-1.0, 1.0, cos(a)));
    c = mix(c, vec3(0.8, 0.8, 1.0), pow(smoothstep(0.5, 1.0, sin(d * 2.0)), 4.0));
    return vec4(c, 1.0);
  }

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  vec4 staticInterference(vec2 u, float t) {
    u += (random(u + t * 0.5) - 0.5) * 0.02;
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 8.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + 0.3 * t - a * u.x);
    }
    float grey = 0.5 + 0.5 * cos(a + d);
    grey += (random(u * 150.0) - 0.5) * 0.15;
    return vec4(vec3(grey), 1.0);
  }

  vec4 liquidCrystal(vec2 u, float t) {
    u *= 1.2;
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 9.0; d += cos(i * u.y + a)) {
      i += 1.0;
      a += sin(i * 0.5 - d + 0.1 * t - a * u.x);
    }
    vec3 c = 0.6 + 0.4 * cos(vec3(0.0, 2.1, 4.2) + a + d);
    float gloss = pow(smoothstep(0.6, 1.0, sin(d * 2.0 + a)), 10.0);
    c += vec3(0.8) * gloss;
    return vec4(clamp(c, 0.0, 1.0), 1.0);
  }

  vec4 solarFlare(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 9.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + 0.05 * t - a * u.x);
    }
    float v = 0.5 + 0.5 * cos(a + d);
    vec3 c = mix(vec3(0.0), vec3(1.0, 0.1, 0.0), smoothstep(0.6, 0.7, v));
    c = mix(c, vec3(1.0, 0.8, 0.2), smoothstep(0.85, 0.9, v));
    c = mix(c, vec3(1.0), smoothstep(0.98, 0.99, v));
    return vec4(c, 1.0);
  }

  vec4 dreamscapePastel(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 6.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + 0.04 * t - a * u.x);
    }
    vec3 c1 = vec3(1.0, 0.8, 0.9);
    vec3 c2 = vec3(0.8, 0.9, 1.0);
    vec3 c3 = vec3(0.9, 0.8, 1.0);
    vec3 c = mix(c1, c2, 0.5 + 0.5 * cos(a + d));
    c = mix(c, c3, 0.5 + 0.5 * sin(d));
    return vec4(c, 1.0);
  }

  vec4 dataStream(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 8.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + 0.1 * t - a * u.x);
    }
    float g = 0.0;
    for (i = 0.0; i < 4.0; ) {
      g += cos(i * u.x + a);
      i += 1.0;
      a += sin(i - d + 2.0 * t - g * u.y);
    }
    vec3 color = 0.5 + 0.5 * cos(vec3(0.0, 1.0, 2.0) + d);
    vec2 grid_uv = u * 8.0;
    vec2 grid = abs(fract(grid_uv) - 0.5);
    float lines = pow(1.0 - (grid.x + grid.y), 40.0);
    float glitch = pow(fract(g * 4.0), 20.0);
    return vec4(color * (lines * 0.5 + glitch * 2.0), 1.0);
  }

  float gradientPattern(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 8.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + 0.2 * t - a * u.x);
    }
    return 0.5 + 0.5 * cos(a + d);
  }

  vec4 chromaticFlow(vec2 u, float t) {
    vec2 oR = vec2(cos(t * 0.2), sin(t * 0.2)) * 0.015;
    vec2 oG = vec2(cos(t * 0.25), sin(t * 0.25)) * 0.015;
    vec2 oB = vec2(cos(t * 0.3), sin(t * 0.3)) * 0.015;
    float r = gradientPattern(u + oR, t);
    float g = gradientPattern(u - oG, t);
    float b = gradientPattern(u + oB, t);
    return vec4(pow(r, 2.0), pow(g, 2.0), pow(b, 2.0), 1.0);
  }

  vec4 wovenDimensions(vec2 u, float t) {
    float a1 = 0.0;
    float d1 = 0.0;
    float i = 0.0;
    for (; i < 8.0; d1 += sin(i * u.y + a1)) {
      i += 1.0;
      a1 += cos(i - d1 + 0.1 * t - a1 * u.x);
    }
    float a2 = 0.0;
    float d2 = 0.0;
    for (i = 0.0; i < 8.0; d2 += sin(i * u.x + a2)) {
      i += 1.0;
      a2 += cos(i - d2 + 0.12 * t - a2 * u.y);
    }
    float v1 = 0.5 + 0.5 * sin(a1 + d1);
    float v2 = 0.5 + 0.5 * cos(a2 + d2);
    vec3 c = vec3(0.6, 0.7, 0.8) * v1 * v2 * 2.5;
    return vec4(pow(c, vec3(1.2)), 1.0);
  }

  vec2 hash2(vec2 p) {
    return fract(
      sin(vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3))
      )) * 43758.5453
    );
  }

  vec4 cellularMatrix(vec2 u, float t) {
    u *= 2.0;
    vec2 i_u = floor(u);
    vec2 f_u = fract(u);
    float m_dist = 1.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 n = vec2(float(x), float(y));
        vec2 p = hash2(i_u + n);
        p = 0.5 + 0.5 * sin(t * 0.2 + 6.2831 * p);
        m_dist = min(m_dist, length(n + p - f_u));
      }
    }
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 5.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + 0.1 * t - a * u.x);
    }
    vec3 c = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + a + d);
    return vec4(c * (1.0 - m_dist) + pow(m_dist, 5.0) * c, 1.0);
  }

  float cellularNoise(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 5.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + t - a * u.x);
    }
    return a + d;
  }

  vec4 pearlBloom(vec2 u, float t) {
    float w = cellularNoise(u, t * 0.05) * 0.2;
    vec2 off = vec2(cos(w), sin(w)) * 0.1;
    float f = 0.5 + 0.5 * cellularNoise(u + off, t * 0.1);
    vec3 base = vec3(0.85 + f * 0.15);
    float edge = smoothstep(0.1, 0.0, fwidth(f * 5.0));
    vec3 spec = 0.5 + 0.5 * cos(f * 10.0 + vec3(0.0, 2.0, 4.0));
    return vec4(mix(base, spec, pow(edge, 2.0)), 1.0);
  }

  float darkNoise(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 8.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + t - a * u.x);
    }
    return a + d;
  }

  vec4 darkBloom(vec2 u, float t) {
    float w = darkNoise(u, t * 0.05) * 0.2;
    vec2 off = vec2(cos(w), sin(w)) * 0.1;
    float f = 0.5 + 0.5 * cos(darkNoise(u + off, t * 0.1));
    vec3 c = vec3(0.05);
    c = mix(c, vec3(0.25), smoothstep(0.5, 0.8, f));
    return vec4(c, 1.0);
  }

  vec4 voxelSunset(vec2 u, float t) {
    vec2 b = floor(u * 25.0) / 25.0;
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 8.0; d += sin(i * b.y + a)) {
      i += 1.0;
      a += cos(i - d + 0.15 * t - a * b.x);
    }
    vec3 c = 0.5 + 0.5 * cos(vec3(0.0, 1.0, 2.0) + d * 2.0);
    float l = dot(normalize(vec2(1.0, 1.0)), u);
    return vec4(c * (0.8 + l * 0.4), 1.0);
  }

  float inkNoise(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 8.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + t - a * u.x);
    }
    return a + d;
  }

  vec4 inkBloom(vec2 u, float t) {
    float w = inkNoise(u, t * 0.05) * 0.2;
    vec2 off = vec2(cos(w), sin(w)) * 0.1;
    float f = inkNoise(u + off, t * 0.1);
    return vec4(vec3(0.5 + 0.5 * cos(f)), 1.0);
  }

  float strataFloor(vec3 u, float t) {
    u += t;
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 5.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + u.z - a * u.x);
    }
    return a + d;
  }

  vec4 etherealStrata(vec2 u, float t) {
    vec3 pos = vec3(u * 1.5, t * 0.1);
    float v = strataFloor(pos, 0.0);
    return vec4(0.6 + 0.4 * cos(v + vec3(0.0, 2.0, 4.0)), 1.0);
  }

  float solarNoise(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 5.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + t - a * u.x);
    }
    return 0.5 + 0.5 * cos(a + d);
  }

  vec4 solarPlasma(vec2 u, float t) {
    float f = 0.0;
    vec2 p = u * 1.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    f = 0.5 * solarNoise(p, t * 0.1);
    p = m * p;
    f += 0.25 * solarNoise(p, t * 0.1);
    vec3 c = mix(vec3(0.1, 0.0, 0.0), vec3(1.0, 0.2, 0.0), smoothstep(0.4, 0.7, f));
    c = mix(c, vec3(1.0, 0.9, 0.5), pow(smoothstep(0.8, 0.85, f), 10.0));
    return vec4(c, 1.0);
  }

  float silkNoise(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 5.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + t - a * u.x);
    }
    return 0.5 + 0.5 * cos(a + d);
  }

  vec4 warpedSilk(vec2 u, float t) {
    vec2 p = u;
    p.y *= 5.0;
    p.x += sin(p.y * 0.5 + t) * 0.2;
    float n = silkNoise(p, t * 0.1);
    vec3 base_color = vec3(0.2, 0.1, 0.5);
    float sheen = pow(smoothstep(0.5, -0.5, u.x + n * 0.2), 2.0);
    return vec4(base_color + sheen, 1.0);
  }

  float cellPattern(vec2 u, float t) {
    float a = 0.0;
    float d = 0.0;
    float i = 0.0;
    for (; i < 8.0; d += sin(i * u.y + a)) {
      i += 1.0;
      a += cos(i - d + t - a * u.x);
    }
    return 0.5 + 0.5 * cos(a + d);
  }

  vec4 livingCells(vec2 u, float t) {
    float w = cellPattern(u, t * 0.05) * 6.28;
    vec2 off = vec2(cos(w), sin(w)) * 0.1;
    float cell_shape = cellPattern(u + off, t * 0.1);
    float mask = smoothstep(0.4, 0.6, cell_shape);
    float internal_noise = cellPattern(u * 3.0, t * 0.2);
    vec3 c1 = vec3(0.2, 0.8, 0.5);
    vec3 c2 = vec3(0.8, 0.5, 0.2);
    vec3 internal_color = mix(c1, c2, internal_noise);
    return vec4(mix(vec3(0.05), internal_color, mask), 1.0);
  }

  vec4 getGradientColor(vec2 u, float t, int theme) {
    if (theme == 0) return electricPlasma(u, t);
    else if (theme == 1) return moltenGold(u, t);
    else if (theme == 2) return emeraldMist(u, t);
    else if (theme == 3) return auroraWarp(u, t);
    else if (theme == 4) return cosmicOcean(u, t);
    else if (theme == 5) return staticInterference(u, t);
    else if (theme == 6) return liquidCrystal(u, t);
    else if (theme == 7) return solarFlare(u, t);
    else if (theme == 8) return dreamscapePastel(u, t);
    else if (theme == 9) return dataStream(u, t);
    else if (theme == 10) return chromaticFlow(u, t);
    else if (theme == 11) return wovenDimensions(u, t);
    else if (theme == 12) return cellularMatrix(u, t);
    else if (theme == 13) return pearlBloom(u, t);
    else if (theme == 14) return darkBloom(u, t);
    else if (theme == 15) return voxelSunset(u, t);
    else if (theme == 16) return inkBloom(u, t);
    else if (theme == 17) return etherealStrata(u, t);
    else if (theme == 18) return solarPlasma(u, t);
    else if (theme == 19) return warpedSilk(u, t);
    else return livingCells(u, t);
  }

  void main() {
    vec2 r = u_resolution;
    vec2 FC = gl_FragCoord.xy;
    vec2 uv = vec2(FC.x / r.x, 1.0 - FC.y / r.y);
    vec2 screenP = (FC.xy * 2.0 - r) / r.y;

    vec2 wCoord = vec2(FC.x / r.x, FC.y / r.y);
    float waterHeight = texture2D(u_waterTexture, wCoord).r;
    float waterInfluence = clamp(waterHeight * u_waterStrength, -0.5, 0.5);

    float audioPulse = u_audioOverall * u_audioReactivity * 0.1;
    float waterPulse = waterInfluence * 0.3;

    vec2 gradientUV = screenP;
    float totalWaterInfluence = clamp(waterInfluence * u_waterStrength, -0.8, 0.8);
    float audioInfluence = (u_audioLow * 0.3 + u_audioMid * 0.4 + u_audioHigh * 0.3) * u_audioReactivity;

    gradientUV += vec2(totalWaterInfluence * 0.3, totalWaterInfluence * 0.2);
    gradientUV += vec2(audioInfluence * 0.1, audioInfluence * 0.15);

    float rippleTime = u_time - u_ripple_time;
    vec2 ripplePos = u_ripple_position * r;
    float rippleDist = distance(FC.xy, ripplePos);

    float clickRipple = 0.0;
    if (rippleTime < 3.0 && rippleTime > 0.0) {
      float rippleRadius = rippleTime * 150.0;
      float rippleWidth = 30.0;
      float rippleDecay = 1.0 - rippleTime / 3.0;
      clickRipple = exp(-abs(rippleDist - rippleRadius) / rippleWidth) * rippleDecay * u_ripple_strength;
    }

    float totalWaterEffect = totalWaterInfluence + clickRipple * 0.2 + audioPulse + waterPulse;
    gradientUV += vec2(totalWaterEffect * 0.4, totalWaterEffect * 0.3);

    float modifiedTime = u_time * u_speed + totalWaterEffect * 2.0 + audioInfluence * 1.5;
    vec4 gradientColor = getGradientColor(gradientUV, modifiedTime, u_gradientTheme);

    vec3 finalColor = gradientColor.rgb;

    if (u_showLogo) {
      vec2 waterCoords = vec2(FC.x / r.x, FC.y / r.y);
      float step = 1.0 / r.x;
      vec2 waterGrad = clamp(vec2(
        texture2D(u_waterTexture, vec2(waterCoords.x + step, waterCoords.y)).r -
        texture2D(u_waterTexture, vec2(waterCoords.x - step, waterCoords.y)).r,
        texture2D(u_waterTexture, vec2(waterCoords.x, waterCoords.y + step)).r -
        texture2D(u_waterTexture, vec2(waterCoords.x, waterCoords.y - step)).r
      ) * u_waterStrength, -0.3, 0.3);

      vec2 logoDistortedUV = uv + waterGrad * 0.25;

      if (logoDistortedUV.x >= 0.0 && logoDistortedUV.x <= 1.0 &&
          logoDistortedUV.y >= 0.0 && logoDistortedUV.y <= 1.0) {
        vec4 logoColor = texture2D(u_logoTexture, logoDistortedUV);
        if (logoColor.a > 0.1) {
          finalColor = mix(finalColor, logoColor.rgb, logoColor.a);
        }
      }
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Theme names <-> indices used in the shader
const GRADIENT_THEMES = {
  "Electric Plasma": 0,
  "Molten Gold": 1,
  "Emerald Mist": 2,
  "Aurora Warp": 3,
  "Cosmic Ocean": 4,
  "Static Interference": 5,
  "Liquid Crystal": 6,
  "Solar Flare": 7,
  "Dreamscape Pastel": 8,
  "Data Stream": 9,
  "Chromatic Flow": 10,
  "Woven Dimensions": 11,
  "Cellular Matrix": 12,
  "Pearl Bloom": 13,
  "Dark Bloom": 14,
  "Voxel Sunset": 15,
  "Ink Bloom": 16,
  "Ethereal Strata": 17,
  "Solar Plasma": 18,
  "Warped Silk": 19,
  "Living Cells": 20,
};

const GRADIENT_THEME_NAMES = Object.keys(GRADIENT_THEMES);

class AudioWaterGradient extends BaseThreeJsModule {
  static methods = [
    ...BaseThreeJsModule.methods,
    {
      name: "start",
      executeOnLoad: true,
      options: [
        {
          name: "theme",
          defaultVal: "Electric Plasma",
          type: "select",
          values: GRADIENT_THEME_NAMES,
        },
        {
          name: "animationSpeed",
          defaultVal: 1.3,
          type: "number",
          min: 0.1,
          max: 3.0,
        },
        {
          name: "waterStrength",
          defaultVal: 0.55,
          type: "number",
          min: 0.0,
          max: 1.0,
        },
        {
          name: "audioReactivity",
          defaultVal: 1.0,
          type: "number",
          min: 0.0,
          max: 3.0,
        },
        {
          name: "showLogo",
          defaultVal: true,
          type: "boolean",
        },
      ],
    },
    {
      name: "setTheme",
      executeOnLoad: false,
      options: [
        {
          name: "value",
          defaultVal: "Electric Plasma",
          type: "select",
          values: GRADIENT_THEME_NAMES,
        },
      ],
    },
    {
      name: "setAnimationSpeed",
      executeOnLoad: false,
      options: [
        {
          name: "value",
          defaultVal: 1.3,
          type: "number",
          min: 0.1,
          max: 3.0,
        },
      ],
    },
    {
      name: "setWaterStrength",
      executeOnLoad: false,
      options: [
        {
          name: "value",
          defaultVal: 0.55,
          type: "number",
          min: 0.0,
          max: 1.0,
        },
      ],
    },
    {
      name: "setAudioReactivity",
      executeOnLoad: false,
      options: [
        {
          name: "value",
          defaultVal: 1.0,
          type: "number",
          min: 0.0,
          max: 3.0,
        },
      ],
    },
    {
      name: "setAudioReactive",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
    {
      name: "setShowLogo",
      executeOnLoad: false,
      options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.name = AudioWaterGradient.name;
    this.customGroup = new THREE.Group();

    // Shader + geometry
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.clock = null;
    this.time = 0;

    // Water sim
    this.waterSettings = {
      resolution: 256,
      damping: 0.913,
      tension: 0.02,
      rippleStrength: 0.2,
      mouseIntensity: 1.2,
      clickIntensity: 3.0,
      rippleRadius: 8,
    };
    const res = this.waterSettings.resolution;
    this.waterBuffers = {
      current: new Float32Array(res * res),
      previous: new Float32Array(res * res),
      velocity: new Float32Array(res * res * 2),
      vorticity: new Float32Array(res * res),
      pressure: new Float32Array(res * res),
    };
    for (let i = 0; i < res * res; i++) {
      this.waterBuffers.current[i] = 0.0;
      this.waterBuffers.previous[i] = 0.0;
      this.waterBuffers.velocity[i * 2] = 0.0;
      this.waterBuffers.velocity[i * 2 + 1] = 0.0;
      this.waterBuffers.vorticity[i] = 0.0;
      this.waterBuffers.pressure[i] = 0.0;
    }
    this.waterTexture = new THREE.DataTexture(
      this.waterBuffers.current,
      res,
      res,
      THREE.RedFormat,
      THREE.FloatType
    );
    this.waterTexture.minFilter = THREE.LinearFilter;
    this.waterTexture.magFilter = THREE.LinearFilter;
    this.waterTexture.needsUpdate = true;

    // Audio
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.audioReactive = true;
    this.audioReactivity = 1.0;
    this.sensitivity = 1.0;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.smoothVolume = 0;
    this.smoothBass = 0;
    this.smoothMid = 0;
    this.smoothTreble = 0;

    // Settings
    this.animationSpeed = 1.3;
    this.waterStrength = 0.55;
    this.showLogo = true;
    this.currentThemeName = "Electric Plasma";

    // Logo
    this.logoTexture = null;
    this.lastWidth = 0;
    this.lastHeight = 0;

    this.destroyed = false;
  }

  async start({
    theme = "Electric Plasma",
    animationSpeed = 1.3,
    waterStrength = 0.55,
    audioReactivity = 1.0,
    showLogo = true,
  } = {}) {
    if (!this.renderer || !this.scene || !this.camera) {
      console.error("AudioWaterGradient: Renderer, scene, or camera not available");
      return;
    }

    this.animationSpeed = this._clampNumber(animationSpeed, 0.1, 3.0, 1.3);
    this.waterStrength = this._clampNumber(waterStrength, 0.0, 1.0, 0.55);
    this.audioReactivity = this._clampNumber(audioReactivity, 0.0, 3.0, 1.0);
    this.showLogo = !!showLogo;

    if (GRADIENT_THEMES[theme] == null) {
      this.currentThemeName = "Electric Plasma";
    } else {
      this.currentThemeName = theme;
    }

    this.renderer.setClearColor(0x000000, 1);
    this.clock = new THREE.Clock();

    this._createShaderPlane();

    this.scene.add(this.customGroup);
    this.setModel(this.customGroup);

    // Simple camera setup similar to Ocean shader plane
    const width = this.elem.offsetWidth || this.renderer.domElement.width || 1920;
    const height = this.elem.offsetHeight || this.renderer.domElement.height || 1080;
    const aspect = width / height || 16 / 9;
    this.camera.aspect = aspect;
    this.camera.fov = 75;
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    if (this.controls) {
      this.controls.enableDamping = false;
      this.controls.enableZoom = false;
      this.controls.enablePan = false;
      this.controls.enableRotate = false;
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }

    await this._tryInitializeAudio();
    if (!this.audioReady) this._startStreamPolling();

    // Initial center ripple
    this._addRipple(width / 2, height / 2, 1.5, width, height);

    this.setCustomAnimate(this._animate.bind(this));
    this.markNeedsRender();
    this.render(true);
  }

  // --- Public setters used by nwWrld methods ---

  setTheme({ value = "Electric Plasma" } = {}) {
    if (GRADIENT_THEMES[value] == null) return;
    this.currentThemeName = value;
    if (this.material && this.material.uniforms && this.material.uniforms.u_gradientTheme) {
      this.material.uniforms.u_gradientTheme.value = GRADIENT_THEMES[value];
    }
  }

  setAnimationSpeed({ value = 1.3 } = {}) {
    this.animationSpeed = this._clampNumber(value, 0.1, 3.0, 1.3);
    if (this.material && this.material.uniforms && this.material.uniforms.u_speed) {
      this.material.uniforms.u_speed.value = this.animationSpeed;
    }
  }

  setWaterStrength({ value = 0.55 } = {}) {
    this.waterStrength = this._clampNumber(value, 0.0, 1.0, 0.55);
    if (this.material && this.material.uniforms && this.material.uniforms.u_waterStrength) {
      this.material.uniforms.u_waterStrength.value = this.waterStrength;
    }
    this.waterSettings.rippleStrength = this.waterStrength;
  }

  setAudioReactivity({ value = 1.0 } = {}) {
    this.audioReactivity = this._clampNumber(value, 0.0, 3.0, 1.0);
    if (this.material && this.material.uniforms && this.material.uniforms.u_audioReactivity) {
      this.material.uniforms.u_audioReactivity.value = this.audioReactivity;
    }
  }

  setAudioReactive({ enabled = true } = {}) {
    this.audioReactive = Boolean(enabled);
  }

  setShowLogo({ enabled = true } = {}) {
    this.showLogo = Boolean(enabled);
    if (this.material && this.material.uniforms && this.material.uniforms.u_showLogo) {
      this.material.uniforms.u_showLogo.value = this.showLogo;
    }
  }

  // --- Internal helpers ---

  _clampNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  _createShaderPlane() {
    if (this.mesh) {
      this.customGroup.remove(this.mesh);
      if (this.geometry) this.geometry.dispose();
      if (this.material) this.material.dispose();
    }

    const width = this.elem.offsetWidth || this.renderer.domElement.width || 1920;
    const height = this.elem.offsetHeight || this.renderer.domElement.height || 1080;

    this.geometry = new THREE.PlaneGeometry(2, 2);

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(width, height) },
        u_speed: { value: this.animationSpeed },
        u_waterTexture: { value: this.waterTexture },
        u_waterStrength: { value: this.waterStrength },
        u_ripple_time: { value: -10.0 },
        u_ripple_position: { value: new THREE.Vector2(0.5, 0.5) },
        u_ripple_strength: { value: 0.5 },
        u_logoTexture: { value: null },
        u_showLogo: { value: this.showLogo },
        u_audioLow: { value: 0.0 },
        u_audioMid: { value: 0.0 },
        u_audioHigh: { value: 0.0 },
        u_audioOverall: { value: 0.0 },
        u_audioReactivity: { value: this.audioReactivity },
        u_gradientTheme: {
          value: GRADIENT_THEMES[this.currentThemeName] ?? 0,
        },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.frustumCulled = false;

    const aspect = width / height;
    this.mesh.scale.set(aspect, 1, 1);

    this.customGroup.add(this.mesh);

    this._setupLogoTexture(width, height);
    this.lastWidth = width;
    this.lastHeight = height;
  }

  async _tryInitializeAudio() {
    if (this.audioReady || this.destroyed) return;
    const sdk = globalThis.nwWrldSdk;
    const stream = sdk?.audio?.getStream?.();
    if (stream && typeof AudioAnalyzer !== "undefined") {
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

  _startStreamPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      if (this.destroyed) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
        return;
      }
      this._tryInitializeAudio();
    }, 1000);
  }

  _updateAudioAnalysis() {
    if (!this.audioReactive) {
      // Gentle idle motion if not reactive
      const sens = this.sensitivity || 1.0;
      this.volume = 0.25 * sens;
      this.bass = 0.25 * sens;
      this.mid = 0.25 * sens;
      this.treble = 0.25 * sens;
    } else if (this.analyzer && this.audioReady) {
      const sens = this.sensitivity || 1.0;
      this.volume = this.analyzer.getVolume() * sens;
      this.bass = this.analyzer.getBass() * sens;
      this.mid = this.analyzer.getMid() * sens;
      this.treble = this.analyzer.getTreble() * sens;
    } else {
      // No analyzer yet: minimal idle motion
      this.volume = 0.1;
      this.bass = 0.1;
      this.mid = 0.1;
      this.treble = 0.1;
    }

    const smoothing = 0.8;
    this.smoothBass = this.smoothBass * smoothing + this.bass * (1 - smoothing);
    this.smoothMid = this.smoothMid * smoothing + this.mid * (1 - smoothing);
    this.smoothTreble = this.smoothTreble * smoothing + this.treble * (1 - smoothing);
    this.smoothVolume = this.smoothVolume * smoothing + this.volume * (1 - smoothing);

    if (!this.material || !this.material.uniforms) return;
    const uni = this.material.uniforms;
    uni.u_audioLow.value = this.smoothBass;
    uni.u_audioMid.value = this.smoothMid;
    uni.u_audioHigh.value = this.smoothTreble;
    uni.u_audioOverall.value = this.smoothVolume;
  }

  _updateWaterSimulation(delta, width, height) {
    const { current, previous, velocity, vorticity } = this.waterBuffers;
    const { damping, resolution } = this.waterSettings;
    const safeTension = Math.min(this.waterSettings.tension, 0.05);
    const velocityDissipation = 0.08;
    const densityDissipation = 1.0;
    const vorticityInfluence = 0.2;

    // Decay velocities
    for (let i = 0; i < resolution * resolution * 2; i++) {
      velocity[i] *= 1.0 - velocityDissipation * delta * 60;
    }

    // Compute vorticity
    for (let i = 1; i < resolution - 1; i++) {
      for (let j = 1; j < resolution - 1; j++) {
        const index = i * resolution + j;
        const left = velocity[(index - 1) * 2 + 1];
        const right = velocity[(index + 1) * 2 + 1];
        const bottom = velocity[(index - resolution) * 2];
        const top = velocity[(index + resolution) * 2];
        vorticity[index] = (right - left - (top - bottom)) * 0.5;
      }
    }

    // Vorticity confinement
    if (vorticityInfluence > 0.001) {
      for (let i = 1; i < resolution - 1; i++) {
        for (let j = 1; j < resolution - 1; j++) {
          const index = i * resolution + j;
          const velIndex = index * 2;
          const left = Math.abs(vorticity[index - 1]);
          const right = Math.abs(vorticity[index + 1]);
          const bottom = Math.abs(vorticity[index - resolution]);
          const top = Math.abs(vorticity[index + resolution]);
          const gradX = (right - left) * 0.5;
          const gradY = (top - bottom) * 0.5;
          const len = Math.sqrt(gradX * gradX + gradY * gradY) + 1e-5;
          const safeVorticity = Math.max(-1.0, Math.min(1.0, vorticity[index]));
          const forceX = (gradY / len) * safeVorticity * vorticityInfluence * 0.1;
          const forceY = (-gradX / len) * safeVorticity * vorticityInfluence * 0.1;
          velocity[velIndex] += Math.max(-0.1, Math.min(0.1, forceX));
          velocity[velIndex + 1] += Math.max(-0.1, Math.min(0.1, forceY));
        }
      }
    }

    // Height update
    for (let i = 1; i < resolution - 1; i++) {
      for (let j = 1; j < resolution - 1; j++) {
        const index = i * resolution + j;
        const velIndex = index * 2;
        const top = previous[index - resolution];
        const bottom = previous[index + resolution];
        const left = previous[index - 1];
        const right = previous[index + 1];

        current[index] = (top + bottom + left + right) / 2 - current[index];
        current[index] = current[index] * damping + previous[index] * (1 - damping);
        current[index] += (0 - previous[index]) * safeTension;

        const velMag = Math.sqrt(
          velocity[velIndex] * velocity[velIndex] +
            velocity[velIndex + 1] * velocity[velIndex + 1]
        );
        const safeVelInfluence = Math.min(velMag * 0.01, 0.1);
        current[index] += safeVelInfluence;
        current[index] *= 1.0 - densityDissipation * 0.01 * delta * 60;
        current[index] = Math.max(-2.0, Math.min(2.0, current[index]));
      }
    }

    // Boundary conditions
    for (let i = 0; i < resolution; i++) {
      current[i] = 0;
      current[(resolution - 1) * resolution + i] = 0;
      velocity[i * 2] = 0;
      velocity[i * 2 + 1] = 0;
      velocity[((resolution - 1) * resolution + i) * 2] = 0;
      velocity[((resolution - 1) * resolution + i) * 2 + 1] = 0;
      current[i * resolution] = 0;
      current[i * resolution + (resolution - 1)] = 0;
      velocity[i * resolution * 2] = 0;
      velocity[i * resolution * 2 + 1] = 0;
      velocity[(i * resolution + (resolution - 1)) * 2] = 0;
      velocity[(i * resolution + (resolution - 1)) * 2 + 1] = 0;
    }

    // Swap and upload
    const tmp = this.waterBuffers.current;
    this.waterBuffers.current = this.waterBuffers.previous;
    this.waterBuffers.previous = tmp;
    this.waterTexture.image.data = this.waterBuffers.current;
    this.waterTexture.needsUpdate = true;

    // Audio‑driven ripples: bass pulses generate soft ripples
    const bassLevel = this.smoothBass;
    if (bassLevel > 0.05) {
      const intensity = Math.min(bassLevel * 2.0 * this.audioReactivity, 3.0);
      const x = width * (0.25 + 0.5 * (Math.random()));
      const y = height * (0.25 + 0.5 * (Math.random()));
      this._addRipple(x, y, intensity, width, height);
    }
  }

  _addRipple(x, y, strength, width, height) {
    const { resolution, rippleRadius } = this.waterSettings;
    const normalizedX = x / width;
    const normalizedY = 1.0 - y / height;
    const texX = Math.floor(normalizedX * resolution);
    const texY = Math.floor(normalizedY * resolution);
    const radius = Math.max(rippleRadius, Math.floor(0.1 * resolution));
    const rippleStrength = (strength || 1.0) * (50000 / 100000);
    const radiusSquared = radius * radius;

    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const distanceSquared = i * i + j * j;
        if (distanceSquared > radiusSquared) continue;
        const posX = texX + i;
        const posY = texY + j;
        if (posX < 0 || posX >= resolution || posY < 0 || posY >= resolution) continue;
        const index = posY * resolution + posX;
        const velIndex = index * 2;
        const distance = Math.sqrt(distanceSquared);
        const falloff = 1.0 - distance / radius;
        const rippleValue =
          Math.cos((distance / radius) * 3.14159265 * 0.5) * rippleStrength * falloff;

        this.waterBuffers.previous[index] += rippleValue;

        const angle = Math.atan2(j, i || 1e-5);
        const velocityStrength = rippleValue * 0.2;
        this.waterBuffers.velocity[velIndex] += Math.cos(angle) * velocityStrength;
        this.waterBuffers.velocity[velIndex + 1] += Math.sin(angle) * velocityStrength;
      }
    }
  }

  _setupLogoTexture(width, height) {
    if (!this.material || !this.material.uniforms) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const logoSize = Math.max(180, Math.min(360, width * 0.18));
      const x = width / 2 - logoSize / 2;
      const y = height / 2 - logoSize / 2 - 100;

      ctx.drawImage(img, x, y, logoSize, logoSize);

      const scale = Math.max(0.4, Math.min(1.2, width / 1920));
      const fontSize = Math.max(16, Math.min(28, 22 * scale));
      const textY = y + logoSize + 60;

      ctx.font = "400 " + fontSize + "px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const paragraphLines = [
        "Reality bends to the rhythm of consciousness, where every thought",
        "ripples through the quantum field of infinite possibility.",
        "We are not mere observers but co-creators in this dance",
        "of energy, frequency, and vibrational harmony.",
      ];
      const lineHeight = fontSize * 1.5;
      for (let i = 0; i < paragraphLines.length; i++) {
        const yy = textY + i * lineHeight;
        ctx.fillText(paragraphLines[i], width / 2, yy);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.flipY = false;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;

      this.logoTexture = tex;
      this.material.uniforms.u_logoTexture.value = tex;
    };
    img.src = "https://assets.codepen.io/7558/sphere.png";
  }

  _animate() {
    if (this.destroyed || !this.clock || !this.material || !this.renderer || !this.scene || !this.camera) {
      return;
    }

    const delta = this.clock.getDelta();
    this.time += delta * this.animationSpeed;

    // Resolution + plane scale update
    const width = this.elem.offsetWidth || this.renderer.domElement.width || 1920;
    const height = this.elem.offsetHeight || this.renderer.domElement.height || 1080;
    if (this.material.uniforms.u_resolution) {
      this.material.uniforms.u_resolution.value.set(width, height);
    }
    if (this.mesh) {
      const aspect = width / height;
      this.mesh.scale.set(aspect, 1, 1);
    }

    // Recreate logo texture if size changed
    if ((width !== this.lastWidth || height !== this.lastHeight) && this.showLogo) {
      this._setupLogoTexture(width, height);
      this.lastWidth = width;
      this.lastHeight = height;
    }

    if (this.material.uniforms.u_time) {
      this.material.uniforms.u_time.value = this.time;
    }

    this._updateAudioAnalysis();
    this._updateWaterSimulation(delta, width, height);

    this.renderer.render(this.scene, this.camera);
    this.markNeedsRender();
  }

  destroy() {
    this.destroyed = true;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.analyzer && typeof this.analyzer.destroy === "function") {
      this.analyzer.destroy();
      this.analyzer = null;
    }

    if (this.mesh && this.customGroup) {
      this.customGroup.remove(this.mesh);
    }
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.logoTexture) this.logoTexture.dispose();

    this.mesh = null;
    this.geometry = null;
    this.material = null;
    this.logoTexture = null;

    super.destroy();
  }
}

export default AudioWaterGradient;

