import ModuleBase from "./helpers/moduleBase.ts";
import BaseThreeJsModule from "./helpers/threeBase.js";
import * as THREE from "three";
import p5 from "p5";
import * as d3 from "d3";
import { Noise } from "noisejs";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { PCDLoader } from "three/addons/loaders/PCDLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createNoise2D, createNoise3D } from "simplex-noise";
import { parseNwWrldDocblockMetadata } from "../shared/nwWrldDocblock.ts";
import {
  buildMethodOptions,
  parseMatrixOptions,
} from "../shared/utils/methodOptions.ts";
import { createSdkHelpers } from "../shared/utils/sdkHelpers.ts";
import { AudioAnalyzer } from "../shared/audio/audioAnalyzer.ts";

if (!globalThis.THREE) globalThis.THREE = THREE;
if (!globalThis.p5) globalThis.p5 = p5;
if (!globalThis.d3) globalThis.d3 = d3;
if (!globalThis.Noise) globalThis.Noise = Noise;
if (!globalThis.OBJLoader) globalThis.OBJLoader = OBJLoader;
if (!globalThis.PLYLoader) globalThis.PLYLoader = PLYLoader;
if (!globalThis.PCDLoader) globalThis.PCDLoader = PCDLoader;
if (!globalThis.GLTFLoader) globalThis.GLTFLoader = GLTFLoader;
if (!globalThis.STLLoader) globalThis.STLLoader = STLLoader;
if (!globalThis.EffectComposer) globalThis.EffectComposer = EffectComposer;
if (!globalThis.RenderPass) globalThis.RenderPass = RenderPass;
if (!globalThis.ShaderPass) globalThis.ShaderPass = ShaderPass;
if (!globalThis.OrbitControls) globalThis.OrbitControls = OrbitControls;
if (!globalThis.createNoise2D) globalThis.createNoise2D = createNoise2D;
if (!globalThis.createNoise3D) globalThis.createNoise3D = createNoise3D;
if (!globalThis.AudioAnalyzer) globalThis.AudioAnalyzer = AudioAnalyzer;

const getTokenFromLocation = () => {
  try {
    const hash = String(window.location.hash || "");
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    const params = new URLSearchParams(raw);
    const token = params.get("token");
    return token ? String(token) : null;
  } catch {
    return null;
  }
};

const TOKEN =
  getTokenFromLocation() || globalThis.__NW_WRLD_SANDBOX_TOKEN__ || null;

const WORKSPACE_MODULE_ALLOWED_IMPORTS = new Set([
  "ModuleBase",
  "BaseThreeJsModule",
  "AudioAnalyzer",
  "assetUrl",
  "readText",
  "loadJson",
  "listAssets",
  "THREE",
  "p5",
  "d3",
  "Noise",
  "OBJLoader",
  "PLYLoader",
  "PCDLoader",
  "GLTFLoader",
  "STLLoader",
  "EffectComposer",
  "RenderPass",
  "ShaderPass",
  "OrbitControls",
  "createNoise2D",
  "createNoise3D",
]);

const safeAssetRelPath = (relPath) => {
  const raw = String(relPath ?? "").trim();
  if (!raw) return null;
  if (raw.includes(":")) return null;
  if (raw.startsWith("/") || raw.startsWith("\\")) return null;
  if (/^[A-Za-z]:[\\/]/.test(raw)) return null;
  if (raw.includes("\\")) return null;
  const parts = raw.split("/").filter(Boolean);
  if (!parts.length) return null;
  for (const p of parts) {
    if (p === "." || p === "") continue;
    if (p === "..") return null;
  }
  return parts.join("/");
};

const ensureTrailingSlash = (url) => {
  const s = String(url || "");
  return s.endsWith("/") ? s : `${s}/`;
};

const buildWorkspaceImportPreamble = (moduleId, importsList) => {
  const requested = Array.isArray(importsList) ? importsList : [];
  if (!requested.length) {
    throw new Error(
      `[Sandbox] Workspace module "${moduleId}" missing required @nwWrld imports.`
    );
  }
  for (const token of requested) {
    if (!WORKSPACE_MODULE_ALLOWED_IMPORTS.has(token)) {
      throw new Error(
        `[Sandbox] Workspace module "${moduleId}" requested unknown import "${token}".`
      );
    }
  }

  const sdkImports = requested.filter(
    (t) =>
      t === "ModuleBase" ||
      t === "BaseThreeJsModule" ||
      t === "assetUrl" ||
      t === "readText" ||
      t === "loadJson" ||
      t === "listAssets"
  );
  const globalImports = requested.filter((t) => !sdkImports.includes(t));

  const lines = [];
  if (sdkImports.length) {
    lines.push(
      `const { ${sdkImports.join(", ")} } = globalThis.nwWrldSdk || {};`
    );
  }
  for (const g of globalImports) {
    lines.push(`const ${g} = globalThis.${g};`);
  }
  for (const token of requested) {
    lines.push(
      `if (!${token}) { throw new Error("Missing required import: ${token}"); }`
    );
  }
  return `${lines.join("\n")}\n`;
};

const injectWorkspaceModuleImports = (moduleId, sourceText) => {
  if (typeof parseNwWrldDocblockMetadata !== "function") {
    throw new Error(`[Sandbox] Docblock parser is unavailable.`);
  }
  const meta = parseNwWrldDocblockMetadata(sourceText);
  const preamble = buildWorkspaceImportPreamble(moduleId, meta?.imports);

  const text = String(sourceText || "");
  const docblockMatch = text.match(/^[\uFEFF\s]*\/\*[\s\S]*?\*\/\s*/);
  if (!docblockMatch) {
    throw new Error(
      `[Sandbox] Workspace module "${moduleId}" is missing required docblock header.`
    );
  }
  const head = docblockMatch[0];
  const rest = text.slice(head.length);
  return `${head}${preamble}\n${rest}`;
};

const getCallableMethodNames = (instance) => {
  const names = new Set();
  let proto = instance ? Object.getPrototypeOf(instance) : null;
  while (proto && proto !== Object.prototype) {
    for (const n of Object.getOwnPropertyNames(proto)) {
      if (n === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(proto, n);
      if (desc && typeof desc.value === "function") names.add(n);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return Array.from(names);
};

const getCallableMethodNamesFromClass = (Cls) => {
  const names = new Set();
  let proto = Cls && Cls.prototype ? Cls.prototype : null;
  while (proto && proto !== Object.prototype) {
    for (const n of Object.getOwnPropertyNames(proto)) {
      if (n === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(proto, n);
      if (desc && typeof desc.value === "function") names.add(n);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return Array.from(names);
};

let assetsBaseUrl = null;
let audioReactiveConfig = null;
let trackRoot = null;
const moduleClassCache = new Map(); // moduleType -> Promise<ModuleClass>
const instancesById = new Map(); // instanceId -> { moduleType, instances: [] }

let rpcSeq = 0;
const pending = new Map();

const postToHost = (payload) => {
  try {
    if (!globalThis.nwSandboxIpc) {
      return;
    }
    if (typeof globalThis.nwSandboxIpc.send !== 'function') {
      return;
    }
    globalThis.nwSandboxIpc.send(payload);
  } catch (error) {
    console.error("[Sandbox] postToHost error:", error);
  }
};

const forwardConsoleToMain = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const sendToMain = (level, args) => {
    try {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      
      if (!globalThis.nwSandboxIpc) {
        return;
      }
      
      if (typeof postToHost !== 'function') {
        return;
      }
      
      postToHost({
        __nwWrldConsole: true,
        level,
        message,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("[Sandbox] Error forwarding log to main:", error);
    }
  };

  console.log = (...args) => {
    originalLog.apply(console, args);
    sendToMain('log', args);
  };

  console.error = (...args) => {
    originalError.apply(console, args);
    sendToMain('error', args);
  };

  console.warn = (...args) => {
    originalWarn.apply(console, args);
    sendToMain('warn', args);
  };
};

forwardConsoleToMain();

const rpcRequest = (type, props) =>
  new Promise((resolve, reject) => {
    const requestId = `${Date.now()}:${++rpcSeq}`;
    pending.set(requestId, { resolve, reject });
    postToHost({
      __nwWrldSandbox: true,
      token: TOKEN,
      type,
      requestId,
      props: props || {},
    });
    setTimeout(() => {
      const p = pending.get(requestId);
      if (!p) return;
      pending.delete(requestId);
      reject(new Error("RPC_TIMEOUT"));
    }, 3000);
  });

const createSdk = () => {
  const sdk = { ModuleBase, BaseThreeJsModule, AudioAnalyzer };

  const { assetUrl, readText, loadJson } = createSdkHelpers({
    normalizeRelPath: safeAssetRelPath,
    assetUrlImpl: (safeRelPath) => {
      if (!assetsBaseUrl) return null;
      try {
        const base = ensureTrailingSlash(assetsBaseUrl);
        return new URL(safeRelPath, base).href;
      } catch {
        return null;
      }
    },
    readTextImpl: async (safeRelPath) => {
      const res = await rpcRequest("sdk:readAssetText", {
        relPath: safeRelPath,
      });
      return typeof res?.text === "string" ? res.text : null;
    },
  });

  sdk.assetUrl = assetUrl;
  sdk.readText = readText;
  sdk.loadJson = loadJson;
  sdk.listAssets = async (relDir) => {
    const safe = safeAssetRelPath(relDir);
    if (!safe) return [];
    try {
      const res = await rpcRequest("sdk:listAssets", { relDir: safe });
      const entries = Array.isArray(res?.entries) ? res.entries : [];
      return entries.filter(
        (e) => typeof e === "string" && e.trim().length > 0
      );
    } catch {
      return [];
    }
  };

  // Audio capture API - direct capture in sandbox context
  sdk.audio = {
    getInputDevices: async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return {
          ok: true,
          devices: devices
            .filter((d) => d.kind === "audioinput")
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Input ${d.deviceId.slice(0, 8)}`,
              kind: d.kind,
            })),
        };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    },
    getOutputDevices: async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return {
          ok: true,
          devices: devices
            .filter((d) => d.kind === "audiooutput")
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Output ${d.deviceId.slice(0, 8)}`,
              kind: d.kind,
            })),
        };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    },
    startCapture: async (options) => {
      try {
        if (globalThis.__nwWrldAudioStream) {
          globalThis.__nwWrldAudioStream.getTracks().forEach((t) => t.stop());
          globalThis.__nwWrldAudioStream = null;
        }

        const { deviceId = null, type = "input" } = options || {};
        let stream = null;

        if (type === "system") {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: false,
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          });
        } else if (type === "output") {
          const constraints = {
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          };
          if (deviceId) {
            constraints.audio.deviceId = { exact: deviceId };
          }
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
          const constraints = {
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          };
          if (deviceId) {
            constraints.audio.deviceId = { exact: deviceId };
          }
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }

        globalThis.__nwWrldAudioStream = stream;
        return {
          ok: true,
          streamId: stream.id,
          tracks: stream.getAudioTracks().map((t) => ({
            id: t.id,
            label: t.label,
            enabled: t.enabled,
          })),
        };
      } catch (error) {
        console.error("🎤 [SDK] Capture error:", error);
        console.error("🎤 [SDK] Error name:", error.name);
        console.error("🎤 [SDK] Error message:", error.message);
        return { ok: false, error: error.message || "CAPTURE_FAILED" };
      }
    },
    stopCapture: async () => {
      if (globalThis.__nwWrldAudioStream) {
        globalThis.__nwWrldAudioStream.getTracks().forEach((t) => t.stop());
        globalThis.__nwWrldAudioStream = null;
      }
      return { ok: true };
    },
    getStatus: () => {
      return {
        isCapturing: !!globalThis.__nwWrldAudioStream,
      };
    },
    getStream: () => {
      return globalThis.__nwWrldAudioStream || null;
    },
    getAudioReactiveConfig: () => {
      const config = audioReactiveConfig || {
        enabled: true,
        inputGain: 1.0,
        reactivity: 1.0,
        bassResponse: 1.0,
        midResponse: 1.0,
        trebleResponse: 1.0,
        smoothing: 0.8,
        fftSize: 256,
      };
      return config;
    },
  };

  return sdk;
};

globalThis.nwWrldSdk = createSdk();

const mergeMethodsByName = (baseMethods, declaredMethods) => {
  const out = new Map();
  const base = Array.isArray(baseMethods) ? baseMethods : [];
  const declared = Array.isArray(declaredMethods) ? declaredMethods : [];
  for (const m of base) {
    const name = m && typeof m.name === "string" ? m.name : null;
    if (name) out.set(name, m);
  }
  for (const m of declared) {
    const name = m && typeof m.name === "string" ? m.name : null;
    if (name) out.set(name, m);
  }
  return Array.from(out.values());
};

const getBaseMethodsForClass = (Cls) => {
  try {
    if (Cls?.prototype instanceof BaseThreeJsModule)
      return BaseThreeJsModule.methods;
    if (Cls?.prototype instanceof ModuleBase) return ModuleBase.methods;
  } catch {}
  return [];
};

const ensureRoot = () => {
  if (trackRoot && trackRoot.isConnected) return trackRoot;
  document.documentElement.style.width = "100%";
  document.documentElement.style.height = "100%";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
  const el = document.createElement("div");
  el.id = "nwWrldTrackRoot";
  el.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;overflow:hidden;";
  document.body.appendChild(el);
  trackRoot = el;
  return trackRoot;
};

const getInstanceIndex = (trackModules, instanceId) => {
  const list = Array.isArray(trackModules) ? trackModules : [];
  const idx = list.findIndex((m) => m && m.id === instanceId);
  return idx >= 0 ? idx : 0;
};

const loadModuleClassFromSource = async (moduleType, sourceText) => {
  try {
    const injected = injectWorkspaceModuleImports(moduleType, sourceText);
    const blob = new Blob([injected], { type: "text/javascript" });
    const blobUrl = URL.createObjectURL(blob);
    try {
      const imported = await import(/* webpackIgnore: true */ blobUrl);
      const Cls = imported?.default || null;
      if (!Cls) {
        throw new Error(
          `[Sandbox] Module "${moduleType}" did not export default.`
        );
      }
      return Cls;
    } catch (importError) {
      console.error(`[Sandbox] Failed to import module "${moduleType}":`, importError);
      console.error(`[Sandbox] Error stack:`, importError?.stack);
      throw importError;
    } finally {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }
  } catch (injectError) {
    console.error(`[Sandbox] Failed to inject imports for module "${moduleType}":`, injectError);
    console.error(`[Sandbox] Error stack:`, injectError?.stack);
    throw injectError;
  }
};

const getModuleClass = (moduleType, moduleSources) => {
  const safeType = String(moduleType || "").trim();
  if (!safeType) {
    throw new Error("INVALID_MODULE_TYPE");
  }
  
  if (moduleClassCache.has(safeType)) {
    return moduleClassCache.get(safeType);
  }
  const src = moduleSources?.[safeType];
  const text = typeof src?.text === "string" ? src.text : null;
  if (!text) {
    throw new Error(`MISSING_SOURCE:${safeType}`);
  }
  const p = loadModuleClassFromSource(safeType, text);
  moduleClassCache.set(safeType, p);
  return p;
};

const destroyTrack = () => {
  for (const [, entry] of instancesById.entries()) {
    const arr = Array.isArray(entry?.instances) ? entry.instances : [];
    for (const inst of arr) {
      try {
        if (inst && typeof inst.destroy === "function") inst.destroy();
      } catch {}
    }
  }
  instancesById.clear();
  moduleClassCache.clear();
  try {
    if (trackRoot && trackRoot.parentNode)
      trackRoot.parentNode.removeChild(trackRoot);
  } catch {}
  trackRoot = null;
};

const destroyInstance = (instanceId) => {
  const safeId = String(instanceId || "").trim();
  if (!safeId) return;
  try {
    const entry = instancesById.get(safeId) || null;
    const arr = Array.isArray(entry?.instances) ? entry.instances : [];
    for (const inst of arr) {
      try {
        if (inst && typeof inst.destroy === "function") inst.destroy();
      } catch {}
    }
  } catch {}
  try {
    const nodes = document.querySelectorAll(`[data-instance-id="${safeId}"]`);
    nodes.forEach((n) => {
      try {
        n.parentNode && n.parentNode.removeChild(n);
      } catch {}
    });
  } catch {}
  try {
    instancesById.delete(safeId);
  } catch {}
};

globalThis.nwSandboxIpc?.on?.(async (data) => {
  if (!data || typeof data !== "object") return;

  if (data.__nwWrldSandboxResult && data.token === TOKEN) {
    const { requestId } = data;
    const p = pending.get(requestId);
    if (!p) return;
    pending.delete(requestId);
    p.resolve(data.result);
    return;
  }

  if (!data.__nwWrldSandbox || data.token !== TOKEN) return;

  const type = data.type;
  const requestId = data.requestId;
  const props = data.props || {};

  const respond = (result) => {
    postToHost({
      __nwWrldSandboxResult: true,
      token: TOKEN,
      type,
      requestId,
      result,
    });
  };

  try {
    if (type === "destroyTrack") {
      destroyTrack();
      respond({ ok: true });
      return;
    }

    if (type === "audioStartCapture") {
      const sdk = globalThis.nwWrldSdk;
      if (sdk?.audio?.startCapture) {
        const result = await sdk.audio.startCapture(props);
        respond(result);
      } else {
        respond({ ok: false, error: "SDK_UNAVAILABLE" });
      }
      return;
    }

    if (type === "audioStopCapture") {
      const sdk = globalThis.nwWrldSdk;
      if (sdk?.audio?.stopCapture) {
        const result = await sdk.audio.stopCapture();
        respond(result);
      } else {
        respond({ ok: false, error: "SDK_UNAVAILABLE" });
      }
      return;
    }

    if (type === "initTrack") {
      destroyTrack();
      assetsBaseUrl = props.assetsBaseUrl || null;
      audioReactiveConfig = props.audioReactive || null;
      globalThis.nwWrldSdk = createSdk();

      const root = ensureRoot();
      const track = props.track || {};
      const trackModules = Array.isArray(track.modules) ? track.modules : [];
      const modulesData = track.modulesData || {};
      const moduleSources = props.moduleSources || {};

      for (const m of trackModules) {
        const instanceId = String(m?.id || "").trim();
        const moduleType = String(m?.type || "").trim();
        if (!instanceId || !moduleType) continue;

        const moduleData = modulesData?.[instanceId] || {};
        const isDisabled = moduleData.disabled === true;
        if (isDisabled) continue;

        const constructorMethods = Array.isArray(
          moduleData?.constructor
        )
          ? moduleData.constructor
          : [];
        const matrixMethod =
          constructorMethods.find((mm) => mm?.name === "matrix") || null;
        const matrix = parseMatrixOptions(matrixMethod?.options);

        const zIndex = getInstanceIndex(trackModules, instanceId) + 1;
        const width = `${100 / matrix.cols}%`;
        const height = `${100 / matrix.rows}%`;
        const border = matrix.border ? "1px solid white" : "none";

        try {
          const ModuleClass = await getModuleClass(moduleType, moduleSources);
          const instances = [];

          for (let row = 1; row <= matrix.rows; row++) {
            for (let col = 1; col <= matrix.cols; col++) {
              const cellKey = `${row}-${col}`;
              if (matrix.excludedCells.includes(cellKey)) continue;
              const el = document.createElement("div");
              el.className = `module z-index-container ${moduleType}`;
              el.dataset.instanceId = instanceId;
              const top = `${(100 / matrix.rows) * (row - 1)}%`;
              const left = `${(100 / matrix.cols) * (col - 1)}%`;
              el.style.cssText = [
                "position:absolute",
                `width:${width}`,
                `height:${height}`,
                `top:${top}`,
                `left:${left}`,
                `z-index:${zIndex}`,
                `border:${border}`,
                "overflow:hidden",
                "transform-origin:center",
              ].join(";");
              root.appendChild(el);
              try {
                const inst = new ModuleClass(el);
                instances.push(inst);
              } catch (instError) {
                console.error(`[Sandbox] Failed to instantiate module "${moduleType}" for instance "${instanceId}":`, instError);
                console.error(`[Sandbox] Instance error stack:`, instError?.stack);
                throw instError;
              }
            }
          }

          instancesById.set(instanceId, { moduleType, instances });

          const nonMatrix = constructorMethods.filter(
            (mm) => mm?.name && mm.name !== "matrix"
          );
          for (const mm of nonMatrix) {
            const methodName = String(mm.name || "").trim();
            if (!methodName) continue;
            const opts = buildMethodOptions(mm.options);
            for (const inst of instances) {
              const fn = inst?.[methodName];
              if (typeof fn !== "function") continue;
              const r = fn.call(inst, opts);
              if (r && typeof r.then === "function") await r;
            }
          }
        } catch (moduleError) {
          console.error(`[Sandbox] Failed to load/instantiate module "${moduleType}" for instance "${instanceId}":`, moduleError);
          console.error(`[Sandbox] Module error stack:`, moduleError?.stack);
          throw moduleError;
        }
      }

      respond({ ok: true });
      return;
    }

    if (type === "invokeOnInstance") {
      const instanceId = String(props.instanceId || "").trim();
      const methodName = String(props.methodName || "").trim();
      const options = props.options || {};
      const entry = instancesById.get(instanceId);
      const arr = Array.isArray(entry?.instances) ? entry.instances : [];
      if (!arr.length) {
        respond({ ok: false, error: "INSTANCE_NOT_FOUND" });
        return;
      }
      for (const inst of arr) {
        const fn = inst?.[methodName];
        if (typeof fn !== "function") continue;
        const r = fn.call(inst, options);
        if (r && typeof r.then === "function") await r;
      }
      respond({ ok: true });
      return;
    }

    if (type === "setMatrixForInstance") {
      const instanceId = String(props.instanceId || "").trim();
      const track = props.track || {};
      const trackModules = Array.isArray(track.modules) ? track.modules : [];
      const modulesData = track.modulesData || {};
      const moduleSources = props.moduleSources || {};
      assetsBaseUrl = props.assetsBaseUrl || assetsBaseUrl || null;
      globalThis.nwWrldSdk = createSdk();

      if (!instanceId) {
        respond({ ok: false, error: "INVALID_INSTANCE_ID" });
        return;
      }
      const moduleEntry =
        trackModules.find((m) => m && m.id === instanceId) || null;
      const moduleType = String(moduleEntry?.type || "").trim();
      if (!moduleType) {
        respond({ ok: false, error: "INSTANCE_NOT_IN_TRACK" });
        return;
      }

      const matrix = parseMatrixOptions(props.matrixOptions);
      destroyInstance(instanceId);

      const root = ensureRoot();
      const zIndex = getInstanceIndex(trackModules, instanceId) + 1;
      const width = `${100 / matrix.cols}%`;
      const height = `${100 / matrix.rows}%`;
      const border = matrix.border ? "1px solid white" : "none";

      const ctor = Array.isArray(modulesData?.[instanceId]?.constructor)
        ? modulesData[instanceId].constructor
        : [];
      const nonMatrix = ctor.filter((mm) => mm?.name && mm.name !== "matrix");

      const ModuleClass = await getModuleClass(moduleType, moduleSources);
      const instances = [];
      for (let row = 1; row <= matrix.rows; row++) {
        for (let col = 1; col <= matrix.cols; col++) {
          const cellKey = `${row}-${col}`;
          if (matrix.excludedCells.includes(cellKey)) continue;
          const el = document.createElement("div");
          el.className = `module z-index-container ${moduleType}`;
          el.dataset.instanceId = instanceId;
          const top = `${(100 / matrix.rows) * (row - 1)}%`;
          const left = `${(100 / matrix.cols) * (col - 1)}%`;
          el.style.cssText = [
            "position:absolute",
            `width:${width}`,
            `height:${height}`,
            `top:${top}`,
            `left:${left}`,
            `z-index:${zIndex}`,
            `border:${border}`,
            "overflow:hidden",
            "transform-origin:center",
          ].join(";");
          root.appendChild(el);
          const inst = new ModuleClass(el);
          instances.push(inst);
        }
      }

      instancesById.set(instanceId, { moduleType, instances });

      for (const mm of nonMatrix) {
        const methodName = String(mm.name || "").trim();
        if (!methodName) continue;
        const opts = buildMethodOptions(mm.options);
        for (const inst of instances) {
          const fn = inst?.[methodName];
          if (typeof fn !== "function") continue;
          const r = fn.call(inst, opts);
          if (r && typeof r.then === "function") await r;
        }
      }

      respond({ ok: true });
      return;
    }

    if (type === "introspectModule") {
      const moduleType = String(props.moduleType || "").trim();
      const sourceText = String(props.sourceText || "");
      const ModuleClass = await loadModuleClassFromSource(
        moduleType,
        sourceText
      );
      const callable = getCallableMethodNamesFromClass(ModuleClass);
      const baseMethods = getBaseMethodsForClass(ModuleClass);
      const declaredMethods = Array.isArray(ModuleClass?.methods)
        ? ModuleClass.methods
        : [];
      const methods = mergeMethodsByName(baseMethods, declaredMethods);
      respond({
        ok: true,
        callableMethods: callable,
        name:
          ModuleClass?.displayName ||
          ModuleClass?.title ||
          ModuleClass?.label ||
          ModuleClass?.name ||
          moduleType,
        category: ModuleClass?.category || "Workspace",
        methods,
      });
      return;
    }

    respond({ ok: false, error: "UNKNOWN_MESSAGE_TYPE" });
  } catch (e) {
    console.error(`[Sandbox] Error handling message type "${type}":`, e);
    console.error(`[Sandbox] Error message:`, e?.message);
    console.error(`[Sandbox] Error stack:`, e?.stack);
    respond({ ok: false, error: e?.message || "SANDBOX_ERROR" });
  }
});

postToHost({ __nwWrldSandboxReady: true, token: TOKEN });