/*
@nwWrld name: Uji Random (Three.js)
@nwWrld category: 2D
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
*/

const UJI_OPTION_KEYS = [
  "shape", "radius", "rotationspeed", "rotationoriginhori", "rotationoriginverti",
  "expansionhori", "expansionverti", "thickness", "segments", "skipchance", "iterations",
  "width", "height", "horicenter", "vericenter", "canvasred", "canvasgreen", "canvasblue",
  "canvasopacity", "linered", "linegreen", "lineblue", "lineopacity", "blendmode",
  "fadeoutspeed", "initialrotation", "revealspeed", "translationhori", "translationverti",
  "rotationperiod", "wavinessphori", "wavinesspverti", "wavinessahori", "wavinessaverti",
  "jitter", "rotationuntil", "fadeoutstart", "sawtoothfadeoutsize", "sawtoothfadeoutstart",
  "expansionhoriexp", "expansionvertiexp", "canvasnoise", "shadowblur", "linecap",
  "fadeinspeed", "hueshiftspeed", "segmentrotation", "segmentlengthening", "rotationspeedup",
  "lineswappiness"
];

const UJI_DEFAULTS = {
  shape: 1, radius: 500, rotationspeed: 0, rotationoriginhori: 0.5, rotationoriginverti: 0.5,
  expansionhori: 1, expansionverti: 1, thickness: 1, segments: 1000, skipchance: 0, iterations: 500,
  width: 1024, height: 1024, horicenter: 0.5, vericenter: 0.5, canvasred: 255, canvasgreen: 255,
  canvasblue: 255, canvasopacity: 1, linered: 0, linegreen: 0, lineblue: 0, lineopacity: 1,
  blendmode: 0, fadeoutspeed: -1, initialrotation: 0, revealspeed: -1, translationhori: 0,
  translationverti: 0, rotationperiod: -1, wavinessphori: -1, wavinesspverti: -1, wavinessahori: 1,
  wavinessaverti: 1, jitter: 1, rotationuntil: -1, fadeoutstart: 0, sawtoothfadeoutsize: -1,
  sawtoothfadeoutstart: 0, expansionhoriexp: 0, expansionvertiexp: 0, canvasnoise: 0, shadowblur: 0,
  linecap: 1, fadeinspeed: 0, hueshiftspeed: 0, segmentrotation: 0, segmentlengthening: 100,
  rotationspeedup: 0, lineswappiness: 0
};

function ujiOptionShorts() {
  const optionShorts = {};
  const shortsOptions = {};
  UJI_OPTION_KEYS.forEach((n) => {
    for (let i = 1; i <= n.length; i++) {
      const prefix = n.substring(0, i);
      if (!Object.values(optionShorts).includes(prefix)) {
        optionShorts[n] = prefix;
        shortsOptions[prefix] = n;
        break;
      }
    }
  });
  return shortsOptions;
}

const UJI_SHORTS_OPTIONS = ujiOptionShorts();

function parseUjiHash(hash) {
  if (!hash || typeof hash !== "string") return null;
  const regex = /([a-z]+)([0-9.\-]+)/g;
  const opts = {};
  let m;
  while ((m = regex.exec(hash)) !== null) {
    const name = UJI_SHORTS_OPTIONS[m[1]];
    if (!name) continue;
    const v = parseFloat(m[2]);
    if (v === undefined || Number.isNaN(v)) continue;
    opts[name] = v;
  }
  return opts;
}

const UJI_PRESET_HASHES = {
  "ⵋ": "s4r320ro-0.2ex1.003t0.5se5000i450v0.13c223ca216can168l201li96lin34line0.25b10f711re100tra1.1rotat100wav2740wavi0.8wavin0.1sa460saw168",
  "ⴼ": "s2r1250ro0.025e0.994ex0.994t0.5se8000sk0.74i1388w2560h2560line0.35wav1300",
  "ⵛ": "s3r1560ro-0.4e0.988ex0.988t0.2se8000i297c170ca181can180l232li255lin222b3tr-0.9wa239wav95wavi0.3wavin2j4.7",
  "ⵍ": "s4r460ro0.05rot0.68rota1e0.999ex1.05t2se3000sk0.5i201v0.94c0ca34can28l238li169lin54line0.75b3f196rotat9j0.2",
  "ⵟ": "r170ro-0.4e1.013ex1.01t1.8se9000i192w2560h2560c16ca12can26l159li157lin161b3f153j2fa77sa170saw58rotatio-0.02",
  "ⵥ": "s4r1080ro-0.9t0.5se5600sk0.31i201w2560h2560c44ca55can78l163li183lin201b6f201re172tr0.9wav2200hu0.4",
  "ⵣ": "s2r820ro-0.55e0.996ex0.996t0.8sk0.47i192w2095h2104ho0.46v0.58c0ca0can0l200li233lin255in21re18wav336j1.5sa70saw72exp-10expa58canva0.4seg90",
  "ⵠ": "r590ro-0.5e0.995ex0.995t0.8se4000i134w1659h1381c81ca91can103l255li255lin255line0.8f129in150wa913wav1586wavi0.2wavin0.3j0.5fa14sa70saw34exp15expa183sh20",
  "ⵒ": "s3r1820ro5rot0.46rota0.22e0.96ex0.965t1.5se4000i297w2560h2560ho0.77v0.52c0ca0can0l233li243lin255b8f384rotat192wa432wav143wavi1.2wavin0.5j0.1",
  "ⴱ": "s2r320ro0.15e0.997ex0.997se10510i1474line0.02f1000re37canva0.04",
  "ⴶ": "r1080ro-0.9e0.999ex0.997t0.5se5600sk0.31i201w2560h2560c44ca55can78l192li183lin201b6f201re172tr0.9wav2200",
  "ⵅ": "s2r100ro-1e1.01ex1.01t0.3se10000sk0.5i259ho0.56v0.46c13ca13can51l238li243lin230f302tr1tra1rotat500j0.1",
  "ⵙ": "r10ro2.55rot0.51rota0e1.05ex1.05t0.2se5000i100w1342h1342ho1v0c177ca63can32l227li173lin99rotat100wa47wavi8j0.1canva0.08",
  "ⵢ": "r2550ro-3.2rot0.19rota0.53e0.97ex0.97t0.4se5700sk0.27i48w2300h2218ho0.89v0.43c194ca248can190canv0l254li218lin66line0.8tr0.5tra2j8sa0exp48expa-13hu10",
  "ⵉ": "s2r300ro-0.2e1.002ex0.995t0.5se5000i460c42ca47can72l158li180lin212line0.25b3tra0.9rotat100wav576wavin0.1j1.3sa100saw53canva0.04",
  "ⵚ": "s4r1500ro-0.1t4se10sk0.26w2000h2000v0.12c221ca223can242li15lin26line0.67b3f300tr0.5tra3.5j3.5fa200canva0.1sh7hu100seg49",
  "ⴳ": "s4r850ro1.5rot0.16rota0.16e1.008ex1.014t3.4se21sk0.1w2560h1966ho0.47v0.19c33ca40can49l213li226lin205line0.8b8in359re1tr2.6tra10rotat52wa3wav3wavi0.7j1.4exp-17expa-23canva0.13hu1",
  "ⵞ": "r160ro-0.65e1.005ex1.006t0.5i402w2560h2560c0ca0can17l255li244lin204line0.05f1000wa300j10",
  "ⵓ": "s4r390ro0.15e0.994se5000i565w857h1372v0.04c53ca39can48l255li255lin255line0.24b3f803tra1.8wa6000wav6000wavi0.1wavin0.4j0.1",
  "ⵘ": "s4ro4e0.99ex0.983t0.8i278v0.01c16ca26can27l173li179lin147b8in183tr-3.7wa50wav40j0.2",
  "ⵆ": "s3r650ro5t2se400sk0.25i77w1995h1995c20ca23can39l227li235lin255b8in41j0sh5",
  "ⵐ": "s2r1010ro-0.95rot0.65rota0.2e0.977ex0.969i58w1401h1401ho0.33v0.31f384re35wa95wav47wavi1.2wavin2j0.1",
  "ⵖ": "r400ro-0.4rota0.64e1.01ex1.01se10000i192h2560v0.64c229ca210can136l172li102lin194b7f71tra-1.3rotat201wa1874wav3557wavi1.2wavin0.9j0.2fa82",
  "ⵤ": "s4r330ro-0.45ex1.022t0.3se4000sk0.2i316w1679h2164ho0.29v0.97c66ca69can71l218li223lin218line0.7in3re66tr2.5tra-5rotat33wa1634wav864wavi0.1wavin0.2j0.4rotati220sa120saw183expa-6canva0.05sh10",
  "ⴵ": "s4r100ro-2.5e0.98ex1.01i1005ho0.22v0.22c7ca10can16l196li219lin255line0.16f1000rotat384wa287wav576wavi3wavin3j0.2",
  "ⴻ": "s3r550ro-0.2e0.999ex0.985t0.5se2900i335ho0.36v0.42c26ca22can47l204li181lin145line0.66f336in238tra-3wa150wav24wavi0.1wavin0.1j0.7",
  "ⵡ": "s3r360ro-0.95e0.995ex0.997t1.5i460v0.46c33ca33can89l194li202lin255b8f105j0.2fa34sa120saw10exp17expa-25",
  "ⴸ": "s3r1600ro0.2e0.99ex0.998se6400i402w1114h1580v0c5ca23can37l175li141lin140line0.27b8f403wav747j3.4sa410",
  "ⴲ": "r1850ro0.7rot0.25rota0.25e0.994ex0.994t0.5se11000sk0.74i603w2560h2560ho0.52ca238can239l172li168lin168line0.04b10rotat170wav1300j8",
  "ⵌ": "r200ro4e1.05ex0.958se5000sk0.8i508w1580h1580ho0.51v0.52c44ca55can96l126li164lin240b2tr10tra10j0.2lines5",
  "ⴷ": "r10ro-1e1.037ex1.037t2se1300sk0.1i220w946h946ho0.43c11ca15can20l159li204lin148re13rotat60wa358wav415wavi0.4wavin0.3j0canva0.1sh30linec2",
  "ⵎ": "s4r630ro0.1t0.3se4000i1206v0c244ca242can222l53lin12line0.3tr-0.1tra1rotat403wav3749wavin0.1j0.4",
  "ⴿ": "r30ro2.75e1.05ex1.05t0.2se2000sk0.5i58w2005c16ca21can60l130li163lin199b6wa432wav47wavi5wavin5j10canva0.3sh7.5",
  "ⵄ": "r900ro-1e0.99ex0.99t4se20sk0.8i150w2560h2560c31ca32can47l255li255lin255line0.66j0canva0.1sh40seg90segm210",
  "ⵇ": "s4r980ro-4.65e0.995ex0.995t4se100sk0.5i240w2372h1708c89ca107can72l255li255lin255line0.66b3rotat730j0canva0.07linec3",
  "ⴾ": "r200ro0.3rota0.4e1.007ex1.007t0.8se8000i508w2560ho0.14c4ca4can12l196li174lin211line0.8b6f658in357tr4rotat66wa1970wav2643wavi0.2wavin0.2j0.5sh15fad50hu-5",
  "ⴴ": "s2r1280ro-0.35rot0.12rota0.13e0.989ex0.989t4se100sk0.67i450w2560h2560c38ca18can10l188li72b6f1000rotat600wa18wav47wavi0.1wavin0.1seg30segm500",
  "ⵁ": "r200e1.002ex1.002t0.5se10000sk0.5i470w1920h1280ho0.3canv0li10lin66line0.1f33tr0.6j0.5fa420",
  "ⵃ": "s2r130ro-0.1t0.4i259w1698c44ca44can44l179li179lin179b6f225re25wa816wav336wavi3.2sa140saw48canva0.05"
};

function buildUjiPresetNames() {
  return Object.keys(UJI_PRESET_HASHES)
    .filter((sym) => UJI_PRESET_HASHES[sym])
    .map((sym) => ({ name: sym, hash: UJI_PRESET_HASHES[sym] }));
}

const UJI_PRESETS = buildUjiPresetNames();
const UJI_PRESET_VALUES = UJI_PRESETS.map((p) => p.name);
const UJI_PRESET_BY_NAME = Object.fromEntries(UJI_PRESETS.map((p) => [p.name, p.hash]));

function rotate(o, p, angle) {
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  const x = p[0] - o[0];
  const y = p[1] - o[1];
  return [x * c - y * s + o[0], x * s + y * c + o[1]];
}

const UJI_PRESET_VALUES_SAFE = Array.isArray(UJI_PRESET_VALUES) && UJI_PRESET_VALUES.length
  ? UJI_PRESET_VALUES
  : [Object.keys(UJI_PRESET_HASHES).find((k) => UJI_PRESET_HASHES[k]) || "ⵋ"];

function randomizeMovement(opts) {
  const r = () => Math.random();
  const out = Object.assign({}, opts);
  if (opts.rotationspeed !== undefined) out.rotationspeed = opts.rotationspeed * (0.3 + 0.7 * r()) * (r() < 0.5 ? -1 : 1);
  if (opts.initialrotation !== undefined) out.initialrotation = (opts.initialrotation + r() * 360) % 360;
  if (opts.translationhori !== undefined) out.translationhori = opts.translationhori + (r() - 0.5) * 4;
  if (opts.translationverti !== undefined) out.translationverti = opts.translationverti + (r() - 0.5) * 4;
  if (opts.jitter !== undefined) out.jitter = Math.max(0.1, opts.jitter * (0.4 + 0.8 * r()));
  if (opts.expansionhori !== undefined) out.expansionhori = opts.expansionhori * (0.98 + 0.04 * r());
  if (opts.expansionverti !== undefined) out.expansionverti = opts.expansionverti * (0.98 + 0.04 * r());
  if (opts.wavinessahori !== undefined) out.wavinessahori = Math.max(0.1, opts.wavinessahori * (0.5 + r()));
  if (opts.wavinessaverti !== undefined) out.wavinessaverti = Math.max(0.1, opts.wavinessaverti * (0.5 + r()));
  if (opts.rotationperiod !== undefined && opts.rotationperiod > -1) out.rotationperiod = opts.rotationperiod * (0.5 + r());
  if (opts.rotationspeedup !== undefined) out.rotationspeedup = opts.rotationspeedup + (r() - 0.5) * 0.2;
  if (opts.segmentrotation !== undefined) out.segmentrotation = opts.segmentrotation + (r() - 0.5) * 20;
  if (opts.rotationoriginhori !== undefined) out.rotationoriginhori = Math.max(0, Math.min(1, opts.rotationoriginhori + (r() - 0.5) * 0.2));
  if (opts.rotationoriginverti !== undefined) out.rotationoriginverti = Math.max(0, Math.min(1, opts.rotationoriginverti + (r() - 0.5) * 0.2));
  if (opts.expansionhoriexp !== undefined) out.expansionhoriexp = opts.expansionhoriexp + (r() - 0.5) * 0.1;
  if (opts.expansionvertiexp !== undefined) out.expansionvertiexp = opts.expansionvertiexp + (r() - 0.5) * 0.1;
  return out;
}

function getPathSegments(currentLine, iter, opts, w, h, r) {
  const segs = [];
  let preceding = null;
  for (let i = 0; i < currentLine.length; i++) {
    const p = currentLine[i];
    let x = p[0];
    let y = p[1];
    const fadeOut = opts.fadeoutspeed > -1 && iter - opts.fadeoutstart > (i % (r() + 0.001)) * opts.fadeoutspeed;
    const skip = i === 0 || r() < opts.skipchance || (opts.revealspeed > -1 && i / opts.revealspeed > iter) || (opts.fadeinspeed > 0 && iter < r() * opts.fadeinspeed) || fadeOut || (opts.sawtoothfadeoutsize > -1 && iter - opts.sawtoothfadeoutstart > i % opts.sawtoothfadeoutsize);
    if (!skip && preceding) {
      let sx, sy, ex, ey;
      if (opts.segmentrotation !== 0 || opts.segmentlengthening !== 100) {
        const midPt = [(x + preceding[0]) / 2, (y + preceding[1]) / 2];
        let start = [midPt[0] + (preceding[0] - midPt[0]) * (opts.segmentlengthening / 100), midPt[1] + (preceding[1] - midPt[1]) * (opts.segmentlengthening / 100)];
        let end = [midPt[0] + (x - midPt[0]) * (opts.segmentlengthening / 100), midPt[1] + (y - midPt[1]) * (opts.segmentlengthening / 100)];
        if (opts.segmentrotation !== 0) {
          start = rotate(midPt, start, opts.segmentrotation * (Math.PI / 180));
          end = rotate(midPt, end, opts.segmentrotation * (Math.PI / 180));
        }
        sx = start[0]; sy = start[1]; ex = end[0]; ey = end[1];
      } else {
        sx = preceding[0]; sy = preceding[1]; ex = x; ey = y;
      }
      segs.push(sx, sy, ex, ey);
    }
    preceding = p;
  }
  const numPoints = (segs.length / 4) * 2;
  const fa = new Float32Array(numPoints * 3);
  for (let j = 0; j < segs.length; j += 4) {
    const k = (j / 4) * 6;
    fa[k] = segs[j];
    fa[k + 1] = h - segs[j + 1];
    fa[k + 2] = 0;
    fa[k + 3] = segs[j + 2];
    fa[k + 4] = h - segs[j + 3];
    fa[k + 5] = 0;
  }
  return fa;
}

function updateLine(currentLine, iter, opts, center, w, h, r, rotationDeg, jitterMult) {
  return currentLine.map((p, i) => {
    let x = p[0];
    let y = p[1];
    const expH = opts.expansionhori ** (1 + (opts.expansionhoriexp || 0) * iter / 1000);
    const expV = opts.expansionverti ** (1 + (opts.expansionvertiexp || 0) * iter / 1000);
    const jitter = opts.jitter * jitterMult;
    x = center[0] + (x - center[0] + (r() - 0.5) * jitter) * expH + opts.translationhori + (opts.wavinessphori > -1 ? opts.wavinessahori * Math.sin(2 * Math.PI * i / opts.wavinessphori) : 0);
    y = center[1] + (y - center[1] + (r() - 0.5) * jitter) * expV + opts.translationverti + (opts.wavinesspverti > -1 ? opts.wavinessaverti * Math.sin(2 * Math.PI * i / opts.wavinesspverti) : 0);
    let angle = (opts.rotationspeed + rotationDeg) * (Math.PI / 180);
    if (opts.rotationspeedup !== 0) angle *= 1 + opts.rotationspeedup * iter;
    if (opts.rotationperiod > -1) angle *= Math.sin(2 * Math.PI * iter / opts.rotationperiod);
    if (opts.rotationuntil > -1) angle *= (opts.rotationuntil - Math.min(iter, opts.rotationuntil)) / opts.rotationuntil;
    return rotate([w * opts.rotationoriginhori, h * opts.rotationoriginverti], [x, y], angle);
  });
}

class UjiRandomThree extends BaseThreeJsModule {
  static methods = [
    {
      name: "draw",
      executeOnLoad: true,
      options: [
        { name: "preset", defaultVal: UJI_PRESET_VALUES_SAFE[0], type: "select", values: UJI_PRESET_VALUES_SAFE },
        { name: "background", defaultVal: "preset", type: "select", values: ["preset", "none"] },
        { name: "backgroundColor", defaultVal: "", type: "color" },
        { name: "lineColor", defaultVal: "", type: "color" },
        { name: "speed", defaultVal: 1, type: "number", min: 0.25, max: 8 },
      ],
    },
    { name: "setBackground", executeOnLoad: false, options: [{ name: "mode", defaultVal: "preset", type: "select", values: ["preset", "none"] }, { name: "color", defaultVal: "", type: "color" }] },
    { name: "setLineColor", executeOnLoad: false, options: [{ name: "color", defaultVal: "", type: "color" }] },
    { name: "setAudioReactive", executeOnLoad: false, options: [{ name: "enabled", defaultVal: true, type: "boolean" }] },
    { name: "setAudioSensitivity", executeOnLoad: false, options: [{ name: "value", defaultVal: 1.5, type: "number", min: 0.1, max: 5 }] },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;
    this.customGroup = new THREE.Group();
    this.linePool = [];
    this.opts = null;
    this.w = 1024;
    this.h = 1024;
    this.line = null;
    this.n = 0;
    this.speedAcc = 0;
    this.maxIter = 500;
    this.orthoCamera = null;
    this.backgroundMode = "preset";
    this.backgroundColor = null;
    this.lineColorOverride = null;
    this.drawSpeed = 1;
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.audioReactive = true;
    this.audioSensitivity = 1.5;
    this.currentPreset = null;
    this.paramOverridesByPreset = {};
    this.init();
  }

  init() {
    if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;
  }

  getBaseOpts() {
    const preset = this.currentPreset;
    if (!preset) return null;
    const hash = UJI_PRESET_BY_NAME[preset];
    if (!hash) return null;
    const presetOpts = Object.assign({}, UJI_DEFAULTS, parseUjiHash(hash) || {});
    const overrides = this.paramOverridesByPreset[preset] || {};
    return Object.assign({}, presetOpts, overrides);
  }

  async tryInitializeAudio() {
    if (this.audioReady || this.destroyed) return;
    const sdk = globalThis.nwWrldSdk;
    const stream = sdk?.audio?.getStream?.();
    if (stream && typeof AudioAnalyzer !== "undefined") {
      this.analyzer = new AudioAnalyzer();
      const initialized = await this.analyzer.init(stream);
      if (initialized) {
        this.audioReady = true;
        if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
      }
    }
  }

  startStreamPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      if (this.destroyed) { clearInterval(this.pollInterval); this.pollInterval = null; return; }
      this.tryInitializeAudio();
    }, 1000);
  }

  draw({ preset, background, backgroundColor, lineColor, speed } = {}) {
    const chosen = preset != null && UJI_PRESET_BY_NAME[preset] ? preset : UJI_PRESET_VALUES_SAFE[0];
    const hash = UJI_PRESET_BY_NAME[chosen];
    if (!hash) return;
    this.currentPreset = chosen;
    if (background === "preset" || background === "none") this.backgroundMode = background;
    if (backgroundColor != null && String(backgroundColor).trim()) this.backgroundColor = String(backgroundColor).trim();
    else if (backgroundColor !== undefined && !backgroundColor) this.backgroundColor = null;
    if (lineColor != null) this.lineColorOverride = String(lineColor).trim() || null;
    if (typeof speed === "number" && speed >= 0.25 && speed <= 8) this.drawSpeed = speed;
    const baseOpts = this.getBaseOpts();
    if (!baseOpts) return;
    const opts = randomizeMovement(baseOpts);
    this.startRun(opts);
  }

  startRun(opts) {
    if (!this.renderer || !this.scene || this.destroyed) return;
    const w = Math.max(500, Math.min(2560, this.elem?.offsetWidth || opts.width || UJI_DEFAULTS.width));
    const h = Math.max(500, Math.min(2560, this.elem?.offsetHeight || opts.height || UJI_DEFAULTS.height));
    this.w = w;
    this.h = h;
    const fullOpts = Object.assign({}, opts, { width: w, height: h });
    this.opts = fullOpts;
    const center = [w * fullOpts.horicenter, h * fullOpts.vericenter];
    const radius = fullOpts.radius;
    const segments = Math.max(100, Math.min(20000, fullOpts.segments));
    const r = Math.random;
    let line = [];
    for (let i = 0; i < segments; i++) {
      let x, y;
      if (fullOpts.shape === 1) {
        x = center[0] + radius * Math.cos((i / segments) * 2 * Math.PI);
        y = center[1] + radius * Math.sin((i / segments) * 2 * Math.PI);
      } else if (fullOpts.shape === 2) {
        if (i < segments / 4) { x = center[0] - radius + 2 * radius * (i / (segments / 4)); y = center[1] - radius; }
        else if (i < segments / 2) { x = center[0] + radius; y = center[1] - radius + 2 * radius * ((i - segments / 4) / (segments / 4)); }
        else if (i < (3 * segments) / 4) { x = center[0] + radius - 2 * radius * ((i - segments / 2) / (segments / 4)); y = center[1] + radius; }
        else { x = center[0] - radius; y = center[1] + radius - 2 * radius * ((i - (3 * segments) / 4) / (segments / 4)); }
      } else if (fullOpts.shape === 3) {
        if (i < segments / 3) { x = center[0] - radius + 2 * radius * (i / (segments / 3)); y = center[1] + radius; }
        else if (i < (2 * segments) / 3) { x = center[0] + radius - radius * ((i - segments / 3) / (segments / 3)); y = center[1] + radius - 2 * radius * ((i - segments / 3) / (segments / 3)); }
        else { x = center[0] - radius * ((i - (2 * segments) / 3) / (segments / 3)); y = center[1] - radius + 2 * radius * ((i - (2 * segments) / 3) / (segments / 3)); }
      } else {
        x = center[0] - radius + 2 * radius * (i / segments);
        y = center[1];
      }
      line.push([x, y]);
    }
    if (fullOpts.lineswappiness > 0) {
      for (let i = 0; i < line.length; i++) {
        if (r() < fullOpts.lineswappiness / fullOpts.segments) {
          const j = Math.floor(r() * line.length);
          [line[i], line[j]] = [line[j], line[i]];
        }
      }
    }
    if (fullOpts.initialrotation > 0) {
      line = line.map((p) => rotate([w / 2, h / 2], p, fullOpts.initialrotation * (Math.PI / 180)));
    }
    this.maxIter = Math.max(10, Math.min(2000, fullOpts.iterations));
    this.line = line;
    this.n = 0;
    this.speedAcc = 0;
    if (this.linePool.length !== this.maxIter) {
      this.customGroup.remove(...this.customGroup.children);
      this.linePool.forEach((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.linePool = [];
      const lr = fullOpts.linered / 255;
      const lg = fullOpts.linegreen / 255;
      const lb = fullOpts.lineblue / 255;
      const col = this.lineColorOverride
        ? (() => { const hex = this.lineColorOverride.replace(/^#/, ""); return new THREE.Color(hex.length <= 4 ? `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` : this.lineColorOverride); })()
        : new THREE.Color(lr, lg, lb);
      for (let i = 0; i < this.maxIter; i++) {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
        geom.setDrawRange(0, 0);
        const mat = new THREE.LineBasicMaterial({ color: col, opacity: fullOpts.lineopacity, transparent: fullOpts.lineopacity < 1 });
        const lineObj = new THREE.LineSegments(geom, mat);
        this.linePool.push(lineObj);
        this.customGroup.add(lineObj);
      }
    }
    const clearCol = this.backgroundMode === "none" ? 0x000000 : (this.backgroundColor
      ? parseInt(String(this.backgroundColor).replace(/^#/, ""), 16)
      : (fullOpts.canvasred << 16) | (fullOpts.canvasgreen << 8) | fullOpts.canvasblue);
    this.renderer.setClearColor(clearCol, this.backgroundMode === "none" ? 0 : fullOpts.canvasopacity);
    if (!this.orthoCamera) {
      this.orthoCamera = new THREE.OrthographicCamera(0, w, h, 0, 0.1, 10);
      this.orthoCamera.position.set(w / 2, h / 2, 1);
      this.orthoCamera.lookAt(w / 2, h / 2, 0);
    } else {
      this.orthoCamera.right = w;
      this.orthoCamera.top = h;
      this.orthoCamera.updateProjectionMatrix();
    }
    this.setModel(this.customGroup);
    this.setCustomAnimate(this.animate.bind(this));
    this.tryInitializeAudio();
    this.startStreamPolling();
    this.markNeedsRender();
  }

  animate() {
    if (this.destroyed || !this.opts || !this.line) return;
    const opts = this.opts;
    const w = this.w;
    const h = this.h;
    const center = [w * opts.horicenter, h * opts.vericenter];
    const r = Math.random;
    let volume = 0, bass = 0, treble = 0;
    if (this.audioReactive && this.analyzer && this.audioReady) {
      const sens = this.audioSensitivity || 1;
      volume = this.analyzer.getVolume() * sens;
      bass = this.analyzer.getBass() * sens;
      treble = this.analyzer.getTreble() * sens;
    }
    const audioRotationDeg = bass * 8 + volume * 3;
    const audioJitter = 1 + bass * 0.4 + volume * 0.2;
    const speed = Math.max(0.25, Math.min(8, this.drawSpeed || 1));
    this.speedAcc += speed;
    let steps = Math.floor(this.speedAcc);
    if (this.n < this.maxIter) steps = Math.min(steps, this.maxIter - this.n);
    else steps = Math.min(steps, 12);
    this.speedAcc -= steps;
    for (let s = 0; s < steps; s++) {
      this.n++;
      const slot = (this.n - 1) % this.maxIter;
      const segs = getPathSegments(this.line, this.n, opts, w, h, r);
      const lineObj = this.linePool[slot];
      if (lineObj && lineObj.geometry) {
        const pos = lineObj.geometry.attributes.position;
        if (pos.count !== segs.length / 3) {
          lineObj.geometry.dispose();
          lineObj.geometry = new THREE.BufferGeometry();
          lineObj.geometry.setAttribute("position", new THREE.BufferAttribute(segs, 3));
        } else {
          pos.array.set(segs);
          pos.needsUpdate = true;
        }
        lineObj.geometry.setDrawRange(0, segs.length / 3);
        lineObj.geometry.computeBoundingSphere();
      }
      this.line = updateLine(this.line, this.n, opts, center, w, h, r, audioRotationDeg, audioJitter);
    }
    this.linePool.forEach((obj, i) => {
      obj.renderOrder = (i - (this.n % this.maxIter) + this.maxIter) % this.maxIter;
    });
    if (this.renderer && this.scene && this.orthoCamera) {
      this.renderer.render(this.scene, this.orthoCamera);
    }
    this.markNeedsRender();
  }

  setBackground(options = {}) {
    const { mode, color } = options;
    if (mode === "preset" || mode === "none") this.backgroundMode = mode;
    if (color != null && String(color).trim()) this.backgroundColor = String(color).trim();
    else this.backgroundColor = null;
  }

  setLineColor(options = {}) {
    const c = options?.color;
    this.lineColorOverride = c != null && String(c).trim() ? String(c).trim() : null;
  }

  setAudioReactive(options = {}) {
    this.audioReactive = Boolean(options?.enabled !== false);
  }

  setAudioSensitivity(options = {}) {
    const val = Number(options?.value ?? this.audioSensitivity);
    this.audioSensitivity = Math.max(0.1, Math.min(5, Number.isFinite(val) ? val : 1.5));
  }

  destroy() {
    this.linePool.forEach((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.linePool = [];
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
    if (this.analyzer && typeof this.analyzer.destroy === "function") { this.analyzer.destroy(); this.analyzer = null; }
    super.destroy();
  }
}

export default UjiRandomThree;
