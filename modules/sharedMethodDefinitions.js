export const audioMethodDefinitions = {
  sensitivity: {
    name: "setSensitivity",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: 1.5,
        type: "number",
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
    });
  }
  
  if (includeParams.includes("viscosity")) {
    methodOptions.push({
      name: "viscosity",
      defaultVal: defaults.viscosity || 0.5,
      type: "number",
    });
  }
  
  if (includeParams.includes("smoothing")) {
    methodOptions.push({
      name: "smoothing",
      defaultVal: defaults.smoothing || 0.8,
      type: "number",
    });
  }

  return {
    name: "start",
    executeOnLoad: true,
    options: methodOptions,
  };
}

export function updateAudioValuesForNonReactive(instance) {
  const sensitivity = instance.sensitivity || 1.0;
  instance.volume = 0.3 * sensitivity;
  instance.bass = 0.2 * sensitivity;
  instance.mid = 0.3 * sensitivity;
  instance.treble = 0.2 * sensitivity;
}

export const audioReactiveMethodDefinition = {
  name: "setAudioReactive",
  executeOnLoad: false,
  options: [{ name: "enabled", defaultVal: true, type: "boolean" }],
};

export const audioReactiveMethodImplementation = {
  setAudioReactive() {
    return function ({ enabled = true } = {}) {
      this.audioReactive = Boolean(enabled);
    };
  },
};

export function createSetSensitivityMethod(defaultValue = 2.0) {
  return {
    name: "setSensitivity",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: defaultValue,
        type: "number",
      },
    ],
  };
}

export function createSetSensitivityImplementation(defaultValue = 2.0) {
  return function ({ value = defaultValue } = {}) {
    const val = Number(value);
    this.sensitivity = Math.max(
      0.1,
      Math.min(5.0, Number.isFinite(val) ? val : defaultValue)
    );
  };
}

export function createSetBaseHueMethod(defaultValue = 0) {
  return {
    name: "setBaseHue",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: defaultValue,
        type: "number",
      },
    ],
  };
}

export function createSetBaseHueImplementation(defaultValue = 0) {
  return function ({ value = defaultValue } = {}) {
    const val = Number(value);
    this.baseHue = Math.max(
      0,
      Math.min(360, Number.isFinite(val) ? val : defaultValue)
    );
  };
}

export function createSetSpeedMethod(defaultValue = 1.0) {
  return {
    name: "setSpeed",
    executeOnLoad: false,
    options: [
      {
        name: "value",
        defaultVal: defaultValue,
        type: "number",
      },
    ],
  };
}

export function createSetSpeedImplementation(defaultValue = 1.0) {
  return function ({ value = defaultValue } = {}) {
    const val = Number(value);
    this.speed = Number.isFinite(val) ? val : defaultValue;
  };
}

export function updateAudioValues(instance) {
  if (instance.audioReactive && instance.analyzer && instance.audioReady) {
    const sensitivity = instance.sensitivity || 1.0;
    instance.volume = instance.analyzer.getVolume() * sensitivity;
    instance.bass = instance.analyzer.getBass() * sensitivity;
    instance.mid = instance.analyzer.getMid() * sensitivity;
    instance.treble = instance.analyzer.getTreble() * sensitivity;
  } else if (!instance.audioReactive) {
    updateAudioValuesForNonReactive(instance);
  }
}

export const audioInitializationMethods = {
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
  },

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
  },
};
