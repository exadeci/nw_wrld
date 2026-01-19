/*
 * SHARED METHOD TEMPLATES
 * 
 * This file contains reusable method definitions and implementations
 * that you can copy-paste into your modules.
 * 
 * NOTE: This is not imported - copy the parts you need into your modules!
 */

// ============================================================================
// METHOD DEFINITIONS (for static methods array)
// ============================================================================

const AUDIO_METHOD_DEFINITIONS = {
  sensitivity: {
    name: "setSensitivity",
    executeOnLoad: false,
    options: [
      { name: "value", defaultVal: 1.5, type: "number", min: 0.1, max: 5.0 },
    ],
  },

  smoothing: {
    name: "setSmoothing",
    executeOnLoad: false,
    options: [
      { name: "value", defaultVal: 0.8, type: "number", min: 0.0, max: 1.0 },
    ],
  },

  viscosity: {
    name: "setViscosity",
    executeOnLoad: false,
    options: [
      { name: "value", defaultVal: 0.5, type: "number", min: 0.1, max: 1.0 },
    ],
  },

  colorMode: {
    name: "setColorMode",
    executeOnLoad: true,
    options: [
      {
        name: "value",
        defaultVal: "rainbow",
        type: "select",
        values: ["rainbow", "mercury", "lava", "ocean", "toxic"],
      },
    ],
  },

  colorHue: {
    name: "setColorHue",
    executeOnLoad: false,
    options: [
      { name: "value", defaultVal: 220, type: "number", min: 0, max: 360 },
    ],
  },

  colorSaturation: {
    name: "setColorSaturation",
    executeOnLoad: false,
    options: [
      { name: "value", defaultVal: 70, type: "number", min: 0, max: 100 },
    ],
  },

  colorBrightness: {
    name: "setColorBrightness",
    executeOnLoad: false,
    options: [
      { name: "value", defaultVal: 70, type: "number", min: 0, max: 100 },
    ],
  },

  baseHue: {
    name: "setBaseHue",
    executeOnLoad: false,
    options: [
      { name: "value", defaultVal: 0, type: "number", min: 0, max: 360 },
    ],
  },

  particleCount: {
    name: "setParticleCount",
    executeOnLoad: false,
    options: [
      { name: "value", defaultVal: 500, type: "number", min: 100, max: 2000 },
    ],
  },
};

// ============================================================================
// METHOD IMPLEMENTATIONS (copy into your class)
// ============================================================================

// USAGE EXAMPLE:
// Copy the methods you need and paste them into your module class

/*
  // In your module class:

  setSensitivity({ value = 1.5 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.5));
  }

  setSmoothing({ value = 0.8 } = {}) {
    const val = Number(value);
    this.smoothing = Math.max(0.0, Math.min(1.0, Number.isFinite(val) ? val : 0.8));
  }

  setViscosity({ value = 0.5 } = {}) {
    const val = Number(value);
    this.viscosity = Math.max(0.1, Math.min(1.0, Number.isFinite(val) ? val : 0.5));
  }

  setColorMode({ value = "rainbow" } = {}) {
    const validModes = ["rainbow", "mercury", "lava", "ocean", "toxic"];
    this.colorMode = validModes.includes(value) ? value : "rainbow";
  }

  setColorHue({ value = 220 } = {}) {
    const val = Number(value);
    this.colorHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 220));
  }

  setColorSaturation({ value = 70 } = {}) {
    const val = Number(value);
    this.colorSaturation = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 70));
  }

  setColorBrightness({ value = 70 } = {}) {
    const val = Number(value);
    this.colorBrightness = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 70));
  }

  setBaseHue({ value = 0 } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(0, Math.min(360, Number.isFinite(val) ? val : 0));
  }

  setParticleCount({ value = 500 } = {}) {
    const val = Number(value);
    const newCount = Math.max(100, Math.min(2000, Math.floor(Number.isFinite(val) ? val : 500)));
    // Custom logic for updating particles - implement in your module
    if (typeof this.updateParticleCount === 'function') {
      this.updateParticleCount(newCount);
    } else {
      this.particleCount = newCount;
    }
  }
*/

// ============================================================================
// AUDIO START METHOD TEMPLATE
// ============================================================================

/*
  // Copy this into your static methods array, customize the options:

  {
    name: "start",
    executeOnLoad: true,
    options: [
      { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
      { name: "viscosity", defaultVal: 0.5, type: "number", min: 0.1, max: 1.0 },
    ],
  },

  // Then copy this into your class:

  async start({ sensitivity = 2.0, viscosity = 0.5 } = {}) {
    const sensVal = Number(sensitivity);
    const viscVal = Number(viscosity);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(sensVal) ? sensVal : 2.0));
    this.viscosity = Math.max(0.1, Math.min(1.0, Number.isFinite(viscVal) ? viscVal : 0.5));
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }
*/

// ============================================================================
// AUDIO ANALYZER SETUP (copy into your class)
// ============================================================================

/*
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
*/

// ============================================================================
// RANGE MODES FOR FADER METHODS
// ============================================================================

/*
 * Many base ModuleBase methods now have three range mode variants:
 * 
 * 1. STANDARD (unipolar): 0 to max, default at 0 or max
 *    Example: setBlur - 0 to 50, default 0
 * 
 * 2. CENTERED: 0 to max, default at center (50%)
 *    Example: setBlurCentered - 0 to 50, default 25
 *    Perfect for faders that start at center position
 * 
 * 3. BIPOLAR: -range to +range, default at 0
 *    Example: setBlurBipolar - -25 to 25, default 0
 *    Perfect for panning/EQ-style controls
 * 
 * Available range mode variants in ModuleBase:
 * - setBlur / setBlurCentered / setBlurBipolar
 * - setSaturation / setSaturationCentered / setSaturationBipolar
 * - setBrightness / setBrightnessCentered / setBrightnessBipolar
 * - setContrast / setContrastCentered / setContrastBipolar
 * - setHueShift / setHueShiftCentered / setHueShiftBipolar
 * - setGlitch / setGlitchCentered / setGlitchBipolar
 * - setZoom / setZoomCentered / setZoomBipolar
 * 
 * USAGE:
 * When mapping a fader, choose the variant that matches your controller:
 * - Fader starts at bottom (0): use standard method (setBlur)
 * - Fader starts at center (50): use Centered variant (setBlurCentered)
 * - Fader is bipolar (-50 to +50): use Bipolar variant (setBlurBipolar)
 */

// ============================================================================
// COMPLETE AUDIO MODULE TEMPLATE
// ============================================================================

/*
@nwWrld name: MyAudioModule
@nwWrld category: Audio
@nwWrld imports: BaseThreeJsModule, THREE, AudioAnalyzer
(or ModuleBase, p5, AudioAnalyzer for 2D modules)

class MyAudioModule extends BaseThreeJsModule {
  static methods = [
    {
      name: "start",
      executeOnLoad: true,
      options: [
        { name: "sensitivity", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 },
      ],
    },
    {
      name: "setSensitivity",
      executeOnLoad: false,
      options: [{ name: "value", defaultVal: 2.0, type: "number", min: 0.1, max: 5.0 }],
    },
  ];

  constructor(container) {
    super(container);
    
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    
    this.sensitivity = 2.0;
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    
    this.init();
  }

  async start({ sensitivity = 2.0 } = {}) {
    const val = Number(sensitivity);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
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

  init() {
    // Your init code here
    this.setCustomAnimate(this.audioAnimate.bind(this));
  }

  audioAnimate() {
    if (this.destroyed) return;
    
    if (this.analyzer && this.audioReady) {
      this.volume = this.analyzer.getVolume() * this.sensitivity;
      this.bass = this.analyzer.getBass() * this.sensitivity;
      this.mid = this.analyzer.getMid() * this.sensitivity;
      this.treble = this.analyzer.getTreble() * this.sensitivity;
    }
    
    // Your animation code here
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
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
    
    super.destroy();
  }
}

export default MyAudioModule;
*/
