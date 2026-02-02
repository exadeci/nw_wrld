/*
@nwWrld name: UjiRandomThreeInfinite
@nwWrld category: 3D
@nwWrld imports: BaseThreeJsModule, THREE
*/

// Official UJI Presets from doersino/uji
const PRESETS = {
  "Custom": {},
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
  "ⵁ": "r200e1.002ex1.002t0.5se10000sk0.5i470w1920h1280ho0.3canv0li10li10n66line0.1f33tr0.6j0.5fa420",
  "ⵃ": "s2r130ro-0.1t0.4i259w1698c44ca44can44l179li179lin179b6f225re25wa816wav336wavi3.2sa140saw48canva0.05"
};

function parseUjiPreset(presetStr) {
  if (!presetStr) return {};
  const opts = {};
  
  // Mapping of UJI parameter codes to our internal options
  const mapping = {
    's': 'shape',
    'r': 'radius',
    'ro': 'rotationspeed',
    'e': 'expansion',
    'ex': 'expansion', // some presets use ex
    'se': 'segments',
    'j': 'jitter',
    'wa': 'wavinessAmp',
    'wav': 'wavinessPeriod',
    'wavi': 'wavinessPeriod', // UJI has multiple waviness params, we simplify
    'i': 'maxLines',
    'c': 'color_r',
    'ca': 'color_g',
    'can': 'color_b'
  };

  // Improved regex to find parameter-value pairs
  // Matches letters followed by a number (including negative and decimal)
  const regex = /([a-z]+)(-?\d*\.?\d+)/g;
  let match;
  while ((match = regex.exec(presetStr)) !== null) {
    const code = match[1];
    const val = parseFloat(match[2]);
    const internalName = mapping[code];
    if (internalName) {
        if (internalName.startsWith('color_')) {
            opts[internalName] = val;
        } else {
            opts[internalName] = val;
        }
    }
  }

  // Handle color construction if RGB components are present
  if (opts.color_r !== undefined || opts.color_g !== undefined || opts.color_b !== undefined) {
      const r = Math.round(opts.color_r || 255);
      const g = Math.round(opts.color_g || 255);
      const b = Math.round(opts.color_b || 255);
      opts.color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      delete opts.color_r;
      delete opts.color_g;
      delete opts.color_b;
  }

  return opts;
}

class UjiRandomThreeInfinite extends BaseThreeJsModule {
  static category = "3D";
  static methods = [
    {
      name: "configure",
      executeOnLoad: true,
      options: [
        {
          name: "preset",
          defaultVal: "ⵋ",
          type: "select",
          values: Object.keys(PRESETS),
        },
        {
          name: "shape",
          defaultVal: 4, 
          type: "select",
          values: [1, 2, 3, 4], // Circle, Square, Triangle, Line
        },
        {
          name: "segments",
          defaultVal: 500,
          type: "number",
        },
        {
          name: "radius",
          defaultVal: 200,
          type: "number",
        },
        {
          name: "maxLines",
          defaultVal: 200,
          type: "number",
        },
        {
          name: "rotationspeed", // degrees per iteration
          defaultVal: -0.2,
          type: "number",
          step: 0.01,
        },
        {
          name: "expansion", // 1.0 = stable
          defaultVal: 1.003,
          type: "number",
          step: 0.001,
        },
        {
          name: "jitter",
          defaultVal: 1,
          type: "number",
        },
        {
          name: "wavinessAmp",
          defaultVal: 0,
          type: "number",
        },
        {
          name: "wavinessPeriod",
          defaultVal: -1,
          type: "number",
        },
        {
          name: "color",
          defaultVal: "#ffffff",
          type: "color",
        },
        {
          name: "hueshiftspeed",
          defaultVal: 0.5,
          type: "number",
        },
      ],
    },
    {
      name: "reset",
      executeOnLoad: false,
      options: [],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.linesGroup = new THREE.Group();
    this.lines = [];
    
    // Uji State
    this.currentPoints = [];
    this.iterationCount = 0;
    
    // Initialize with first real preset
    const defaultPreset = "ⵋ";
    const parsed = parseUjiPreset(PRESETS[defaultPreset]);
    
    this.opts = {
      preset: defaultPreset,
      segments: 500,
      shape: 4,
      radius: 200,
      maxLines: 200,
      rotationspeed: -0.2,
      expansion: 1.003,
      jitter: 1,
      wavinessAmp: 0,
      wavinessPeriod: -1,
      color: "#ffffff",
      hueshiftspeed: 0,
      ...parsed
    };

    this.animateLoop = this.animateLoop.bind(this);
    this.setCustomAnimate(this.animateLoop);

    this.init();
  }

  init() {
    if (this.destroyed) return;
    this.setModel(this.linesGroup);
    this.reset();
  }

  configure(newOpts = {}) {
    if (newOpts.preset && PRESETS[newOpts.preset] && newOpts.preset !== "Custom") {
      const presetStr = PRESETS[newOpts.preset];
      const parsed = parseUjiPreset(presetStr);
      this.opts = { ...this.opts, ...parsed, preset: newOpts.preset };
    } else {
      this.opts = { ...this.opts, ...newOpts };
      if (!newOpts.preset) {
         this.opts.preset = "Custom";
      }
    }

    // Ensure numeric types
    this.opts.segments = Math.min(parseInt(this.opts.segments, 10), 10000); // Sanity cap
    this.opts.shape = parseInt(this.opts.shape, 10);
    this.opts.maxLines = parseInt(this.opts.maxLines, 10);
    this.opts.radius = parseFloat(this.opts.radius);
    this.opts.rotationspeed = parseFloat(this.opts.rotationspeed);
    this.opts.expansion = parseFloat(this.opts.expansion);
    this.opts.jitter = parseFloat(this.opts.jitter);
    this.opts.wavinessAmp = parseFloat(this.opts.wavinessAmp);
    this.opts.wavinessPeriod = parseFloat(this.opts.wavinessPeriod);
    this.opts.hueshiftspeed = parseFloat(this.opts.hueshiftspeed);

    this.reset();
  }

  reset() {
    if (this.destroyed) return;

    // Clear existing lines
    while (this.lines.length > 0) {
      const line = this.lines.shift();
      this.linesGroup.remove(line);
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
    }
    
    this.iterationCount = 0;
    this.generateInitialShape();
  }

  generateInitialShape() {
    this.currentPoints = [];
    const { shape, segments, radius } = this.opts;
    
    const cx = 0;
    const cy = 0;

    for (let i = 0; i < segments; i++) {
      let x, y;
      if (shape == 1) { // Circle
        x = cx + radius * Math.cos((i / segments) * 2 * Math.PI);
        y = cy + radius * Math.sin((i / segments) * 2 * Math.PI);
      } else if (shape == 2) { // Square
        if (i < segments / 4) {
          x = cx - radius + 2 * radius * (i / (segments / 4));
          y = cy - radius;
        } else if (i < segments / 2) {
          x = cx + radius;
          y = cy - radius + 2 * radius * ((i - segments / 4) / (segments / 4));
        } else if (i < 3 * segments / 4) {
          x = cx + radius - 2 * radius * ((i - segments / 2) / (segments / 4));
          y = cy + radius;
        } else {
          x = cx - radius;
          y = cy + radius - 2 * radius * ((i - 3 * segments / 4) / (segments / 4));
        }
      } else if (shape == 3) { // Triangle
        if (i < segments / 3) {
          x = cx - radius + 2 * radius * (i / (segments / 3));
          y = cy + radius;
        } else if (i < 2 * segments / 3) {
          x = cx + radius - radius * ((i - segments / 3) / (segments / 3));
          y = cy + radius - 2 * radius * ((i - segments / 3) / (segments / 3));
        } else {
          x = cx - radius * ((i - 2 * segments / 3) / (segments / 3));
          y = cy - radius + 2 * radius * ((i - 2 * segments / 3) / (segments / 3));
        }
      } else if (shape == 4) { // Line
        x = cx - radius + 2 * radius * (i / segments);
        y = cy;
      } else {
        // Default to Circle if shape is unknown (UJI sometimes uses other values)
        x = cx + radius * Math.cos((i / segments) * 2 * Math.PI);
        y = cy + radius * Math.sin((i / segments) * 2 * Math.PI);
      }
      
      this.currentPoints.push(new THREE.Vector3(x, y, 0));
    }
  }

  rotatePoint(p, angle) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const xnew = p.x * c - p.y * s;
    const ynew = p.x * s + p.y * c;
    p.x = xnew;
    p.y = ynew;
  }

  animateLoop() {
    if (this.destroyed) return;
    if (this.currentPoints.length === 0) return;

    this.iterationCount++;
    const n = this.iterationCount;
    const opts = this.opts;
    const r = Math.random;

    const geometry = new THREE.BufferGeometry().setFromPoints(this.currentPoints);
    
    let color = new THREE.Color(opts.color);
    if (opts.hueshiftspeed !== 0) {
       const hsl = {};
       color.getHSL(hsl);
       let newHue = (hsl.h * 360 + opts.hueshiftspeed * n) % 360;
       if (newHue < 0) newHue += 360;
       color.setHSL(newHue / 360, hsl.s, hsl.l);
    }

    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
    });

    const line = new THREE.Line(geometry, material);
    this.linesGroup.add(line);
    this.lines.push(line);

    while (this.lines.length > opts.maxLines) {
      const oldLine = this.lines.shift();
      this.linesGroup.remove(oldLine);
      if (oldLine.geometry) oldLine.geometry.dispose();
      if (oldLine.material) oldLine.material.dispose();
    }

    const center = new THREE.Vector3(0, 0, 0); 
    const angle = opts.rotationspeed * (Math.PI / 180);

    for (let i = 0; i < this.currentPoints.length; i++) {
        const p = this.currentPoints[i];

        // Apply Jitter
        p.x += (r() - 0.5) * opts.jitter;
        p.y += (r() - 0.5) * opts.jitter;
        
        // Apply Waviness
        if (opts.wavinessPeriod > 0) {
             const wave = opts.wavinessAmp * Math.sin(2 * Math.PI * i / opts.wavinessPeriod);
             p.x += wave;
             p.y += wave;
        }

        // Apply Expansion
        p.x = center.x + (p.x - center.x) * opts.expansion;
        p.y = center.y + (p.y - center.y) * opts.expansion;

        // Apply Rotation
        this.rotatePoint(p, angle);
    }
  }

  destroy() {
    this.reset();
    this.linesGroup = null;
    this.lines = null;
    this.currentPoints = null;
    super.destroy();
  }
}

export default UjiRandomThreeInfinite;