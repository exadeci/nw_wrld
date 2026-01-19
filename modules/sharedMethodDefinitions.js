export const audioMethodDefinitions = {
  sensitivity: {
    name: "setSensitivity",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: 1.5,
        type: "number",
        min: 0.1,
        max: 5.0,
      },
    ],
  },

  smoothing: {
    name: "setSmoothing",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: 0.8,
        type: "number",
        min: 0.0,
        max: 1.0,
      },
    ],
  },

  viscosity: {
    name: "setViscosity",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: 0.5,
        type: "number",
        min: 0.1,
        max: 1.0,
      },
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
      {
        name: "value",
        defaultVal: 220,
        type: "number",
        min: 0,
        max: 360,
      },
    ],
  },

  colorSaturation: {
    name: "setColorSaturation",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: 70,
        type: "number",
        min: 0,
        max: 100,
      },
    ],
  },

  colorBrightness: {
    name: "setColorBrightness",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: 70,
        type: "number",
        min: 0,
        max: 100,
      },
    ],
  },

  baseHue: {
    name: "setBaseHue",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: 0,
        type: "number",
        min: 0,
        max: 360,
      },
    ],
  },

  particleCount: {
    name: "setParticleCount",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: 500,
        type: "number",
        min: 100,
        max: 2000,
      },
    ],
  },
};

export const audioMethodImplementations = {
  setSensitivity(defaultValue = 1.5) {
    return function ({ value = defaultValue } = {}) {
      const val = Number(value);
      this.sensitivity = Math.max(
        0.1,
        Math.min(5.0, Number.isFinite(val) ? val : defaultValue)
      );
    };
  },

  setSmoothing(defaultValue = 0.8) {
    return function ({ value = defaultValue } = {}) {
      const val = Number(value);
      this.smoothing = Math.max(
        0.0,
        Math.min(1.0, Number.isFinite(val) ? val : defaultValue)
      );
    };
  },

  setViscosity(defaultValue = 0.5) {
    return function ({ value = defaultValue } = {}) {
      const val = Number(value);
      this.viscosity = Math.max(
        0.1,
        Math.min(1.0, Number.isFinite(val) ? val : defaultValue)
      );
    };
  },

  setColorMode(validModes = ["rainbow", "mercury", "lava", "ocean", "toxic"]) {
    return function ({ value = "rainbow" } = {}) {
      this.colorMode = validModes.includes(value) ? value : "rainbow";
    };
  },

  setColorHue(defaultValue = 220) {
    return function ({ value = defaultValue } = {}) {
      const val = Number(value);
      this.colorHue = Math.max(
        0,
        Math.min(360, Number.isFinite(val) ? val : defaultValue)
      );
    };
  },

  setColorSaturation(defaultValue = 70) {
    return function ({ value = defaultValue } = {}) {
      const val = Number(value);
      this.colorSaturation = Math.max(
        0,
        Math.min(100, Number.isFinite(val) ? val : defaultValue)
      );
    };
  },

  setColorBrightness(defaultValue = 70) {
    return function ({ value = defaultValue } = {}) {
      const val = Number(value);
      this.colorBrightness = Math.max(
        0,
        Math.min(100, Number.isFinite(val) ? val : defaultValue)
      );
    };
  },

  setBaseHue(defaultValue = 0) {
    return function ({ value = defaultValue } = {}) {
      const val = Number(value);
      this.baseHue = Math.max(
        0,
        Math.min(360, Number.isFinite(val) ? val : defaultValue)
      );
    };
  },

  setParticleCount(defaultValue = 500) {
    return function ({ value = defaultValue } = {}) {
      const val = Number(value);
      const newCount = Math.max(
        100,
        Math.min(2000, Math.floor(Number.isFinite(val) ? val : defaultValue))
      );
      if (this.updateParticleCount) {
        this.updateParticleCount(newCount);
      } else {
        this.particleCount = newCount;
      }
    };
  },
};

export function createAudioStartMethod(options = {}) {
  const {
    includeParams = ["sensitivity", "viscosity"],
    defaults = { sensitivity: 2.0, viscosity: 0.5 },
  } = options;

  const methodOptions = [];
  
  if (includeParams.includes("sensitivity")) {
    methodOptions.push({
      name: "sensitivity",
      defaultVal: defaults.sensitivity || 2.0,
      type: "number",
      min: 0.1,
      max: 5.0,
    });
  }
  
  if (includeParams.includes("viscosity")) {
    methodOptions.push({
      name: "viscosity",
      defaultVal: defaults.viscosity || 0.5,
      type: "number",
      min: 0.1,
      max: 1.0,
    });
  }
  
  if (includeParams.includes("smoothing")) {
    methodOptions.push({
      name: "smoothing",
      defaultVal: defaults.smoothing || 0.8,
      type: "number",
      min: 0.0,
      max: 1.0,
    });
  }

  return {
    name: "start",
    executeOnLoad: true,
    options: methodOptions,
  };
}
