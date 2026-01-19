# Shared Method Definitions

This folder contains `_SHARED_METHOD_TEMPLATES.js` which provides reusable method patterns for your modules.

## Why Copy-Paste Instead of Import?

Workspace modules run in a sandboxed environment and **cannot use `import` statements**. Instead, we provide templates that you copy-paste into your modules.

## How to Use

### 1. Open `_SHARED_METHOD_TEMPLATES.js`

This file contains:
- **Method definitions** for the `static methods` array
- **Method implementations** for the class body
- **Complete templates** for common module patterns

### 2. Copy What You Need

**Example: Adding audio controls to a new module**

```javascript
// 1. Copy method definitions into static methods:
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

// 2. Copy method implementation into class:
setSensitivity({ value = 2.0 } = {}) {
  const val = Number(value);
  this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
}
```

### 3. Customize for Your Module

Adjust defaults and ranges to fit your specific needs:

```javascript
// Different default sensitivity
setSensitivity({ value = 1.5 } = {}) {
  const val = Number(value);
  this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 1.5));
}
```

## Available Templates

### Audio Method Templates

- `setSensitivity` - Audio reactivity multiplier
- `setSmoothing` - Smoothing factor for audio values
- `setViscosity` - Viscosity/fluidity control
- `setColorMode` - Color scheme selection
- `setColorHue` - Hue value (0-360)
- `setColorSaturation` - Saturation (0-100)
- `setColorBrightness` - Brightness (0-100)
- `setBaseHue` - Base hue offset
- `setParticleCount` - Particle system count

### Base Module Range Mode Variants

Many base ModuleBase methods now have **three range mode variants** to match different fader types:

#### 1. Standard (Unipolar)
- Range: `0` to `max`
- Default: `0` or `max` (at one end)
- Use when: Fader starts at bottom/top
- Examples: `setBlur`, `setSaturation`, `setBrightness`

#### 2. Centered
- Range: `0` to `max`
- Default: `50%` (center position)
- Use when: Fader starts at center (50%)
- Examples: `setBlurCentered`, `setSaturationCentered`, `setBrightnessCentered`

#### 3. Bipolar
- Range: `-range` to `+range`
- Default: `0` (center)
- Use when: Fader is bipolar (like panning/EQ)
- Examples: `setBlurBipolar`, `setSaturationBipolar`, `setBrightnessBipolar`

**Available Range Mode Methods:**
- `setBlur` / `setBlurCentered` / `setBlurBipolar`
- `setSaturation` / `setSaturationCentered` / `setSaturationBipolar`
- `setBrightness` / `setBrightnessCentered` / `setBrightnessBipolar`
- `setContrast` / `setContrastCentered` / `setContrastBipolar`
- `setHueShift` / `setHueShiftCentered` / `setHueShiftBipolar`
- `setGlitch` / `setGlitchCentered` / `setGlitchBipolar`
- `setZoom` / `setZoomCentered` / `setZoomBipolar`

### Complete Module Templates

The file includes complete templates for:
- **Audio Reactive Module** - Full audio analyzer setup
- **Audio Start Method** - Common initialization pattern
- **Audio Analyzer Setup** - Stream polling and initialization

## Best Practices

### 1. Keep Consistent Naming

If multiple modules use the same concept, use the same parameter names:
- `sensitivity` for audio reactivity
- `viscosity` for smoothing/fluidity
- `colorMode` for color schemes

### 2. Use Number.isFinite()

Always use this pattern to handle `0` correctly:

```javascript
const val = Number(value);
this.property = Math.max(min, Math.min(max, Number.isFinite(val) ? val : default));
```

**Why?** Because `Number(0) || default` returns `default` (wrong!), but `Number.isFinite(0)` returns `true` (correct!).

### 3. Document Your Ranges

Add comments when using non-standard ranges:

```javascript
setSensitivity({ value = 3.0 } = {}) {
  const val = Number(value);
  // Using higher default (3.0) for more reactive visuals
  this.sensitivity = Math.max(0.5, Math.min(10.0, Number.isFinite(val) ? val : 3.0));
}
```

## Example: Creating a New Audio Module

```javascript
/*
@nwWrld name: MyNewAudioModule
@nwWrld category: Audio
@nwWrld imports: ModuleBase, p5, AudioAnalyzer
*/

class MyNewAudioModule extends ModuleBase {
  static methods = [
    // Copy from templates:
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
    
    // Copy standard audio properties:
    this.analyzer = null;
    this.audioReady = false;
    this.pollInterval = null;
    this.sensitivity = 2.0;
    this.volume = 0;
    
    this.init();
  }

  // Copy standard audio methods from template:
  async start({ sensitivity = 2.0 } = {}) {
    const val = Number(sensitivity);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
    await this.tryInitializeAudio();
    if (!this.audioReady) this.startStreamPolling();
  }

  setSensitivity({ value = 2.0 } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(0.1, Math.min(5.0, Number.isFinite(val) ? val : 2.0));
  }

  // ... your custom code ...
}

export default MyNewAudioModule;
```

## Range Mode Selection Guide

### When to Use Each Mode

**Standard (Unipolar):**
- ✅ Fader starts at 0% (bottom)
- ✅ Effect should be off at 0
- ✅ Example: Blur fader - 0 = no blur, 100 = max blur

**Centered:**
- ✅ Fader starts at 50% (center)
- ✅ Effect should be at neutral/mid at 50
- ✅ Example: Saturation fader - 50 = normal, 0 = desaturated, 100 = oversaturated

**Bipolar:**
- ✅ Fader is centered and goes negative/positive
- ✅ Effect should have a neutral center point
- ✅ Example: Panning - -50 = left, 0 = center, +50 = right
- ✅ Example: EQ - -50 = cut, 0 = flat, +50 = boost

### Mapping Examples

```javascript
// DJ Controller fader (0-100, starts at 0)
Channel 1 → setBlur

// DJ Controller fader (0-100, starts at 50)
Channel 2 → setBlurCentered

// DJ Controller knob (bipolar, -50 to +50)
Channel 3 → setBlurBipolar
```

## Tips

- **Start with a template** - Copy the complete template and modify it
- **Mix and match** - Combine different method templates as needed
- **Keep it consistent** - Use the same patterns across your modules
- **Test with faders** - Make sure `0` values work correctly
- **Choose the right range mode** - Match your controller's fader behavior

## Need More Templates?

If you create useful method patterns, add them to `_SHARED_METHOD_TEMPLATES.js` so other modules can use them!
