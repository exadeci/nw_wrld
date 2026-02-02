import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

const isTopLevelFrame = () => {
  try {
    return window === window.top;
  } catch {
    return true;
  }
};

const nwWrldAppBridge = {
  json: {
    read: (filename: string, defaultValue: unknown) =>
      ipcRenderer.invoke("bridge:json:read", filename, defaultValue),
    readSync: (filename: string, defaultValue: unknown) =>
      ipcRenderer.sendSync("bridge:json:readSync", filename, defaultValue),
    write: (filename: string, data: unknown) =>
      ipcRenderer.invoke("bridge:json:write", filename, data),
    writeSync: (filename: string, data: unknown) =>
      ipcRenderer.sendSync("bridge:json:writeSync", filename, data),
  },
  logToMain: (message: unknown) => ipcRenderer.send("log-to-main", message),
};

type IpcHandler = (event: IpcRendererEvent, payload: unknown) => void;

const nwWrldBridge = {
  project: {
    getDir: () => ipcRenderer.sendSync("bridge:project:getDir") as unknown,
    isRequired: () => ipcRenderer.sendSync("bridge:project:isRequired") as unknown,
    isDirAvailable: () => ipcRenderer.sendSync("bridge:project:isDirAvailable") as unknown,
  },
  os: {
    openExternal: (url: unknown) => ipcRenderer.sendSync("bridge:os:openExternal", url) as unknown,
  },
  sandbox: {
    registerToken: (token: unknown) =>
      ipcRenderer.sendSync("bridge:sandbox:registerToken", token) as unknown,
    unregisterToken: (token: unknown) =>
      ipcRenderer.sendSync("bridge:sandbox:unregisterToken", token) as unknown,
    ensure: () => ipcRenderer.invoke("sandbox:ensure"),
    request: (token: unknown, type: unknown, props: unknown) =>
      ipcRenderer.invoke("sandbox:request", { token, type, props }),
    destroy: () => ipcRenderer.invoke("sandbox:destroy"),
  },
  workspace: {
    listModuleFiles: () => ipcRenderer.invoke("bridge:workspace:listModuleFiles"),
    listModuleSummaries: () => ipcRenderer.invoke("bridge:workspace:listModuleSummaries"),
    listModuleSummariesWithSkipped: () =>
      ipcRenderer.invoke("bridge:workspace:listModuleSummariesWithSkipped"),
    getModuleUrl: (moduleName: unknown) =>
      ipcRenderer.invoke("bridge:workspace:getModuleUrl", moduleName),
    readModuleText: (moduleName: unknown) =>
      ipcRenderer.invoke("bridge:workspace:readModuleText", moduleName),
    readModuleWithMeta: (moduleName: unknown) =>
      ipcRenderer.invoke("bridge:workspace:readModuleWithMeta", moduleName),
    writeModuleTextSync: (moduleName: unknown, text: unknown) =>
      ipcRenderer.sendSync("bridge:workspace:writeModuleTextSync", moduleName, text) as unknown,
    moduleExists: (moduleName: unknown) =>
      ipcRenderer.sendSync("bridge:workspace:moduleExists", moduleName) as unknown,
    showModuleInFolder: (moduleName: unknown) =>
      ipcRenderer.send("bridge:workspace:showModuleInFolder", moduleName),
    assetUrl: (relPath: unknown) =>
      ipcRenderer.sendSync("bridge:workspace:assetUrl", relPath) as unknown,
    listAssets: (relDir: unknown) => ipcRenderer.invoke("bridge:workspace:listAssets", relDir),
    readAssetText: (relPath: unknown) =>
      ipcRenderer.invoke("bridge:workspace:readAssetText", relPath),
    readAssetArrayBuffer: (relPath: unknown) =>
      ipcRenderer.invoke("bridge:workspace:readAssetArrayBuffer", relPath),
    writeAudioAsset: (payload: unknown) =>
      ipcRenderer.invoke("bridge:workspace:writeAudioAsset", payload),
  },
  audio: {
    getInputDevices: () => ipcRenderer.invoke("bridge:audio:getInputDevices"),
    getOutputDevices: () => ipcRenderer.invoke("bridge:audio:getOutputDevices"),
    getSystemAudioSources: () => ipcRenderer.invoke("bridge:audio:getSystemAudioSources"),
    getStatus: () => ipcRenderer.invoke("bridge:audio:getStatus"),
    getStream: () => ipcRenderer.invoke("bridge:audio:getStream"),
    getAudioLevels: () => ipcRenderer.invoke("bridge:audio:getAudioLevels"),
  },
  app: {
    getBaseMethodNames: () => ipcRenderer.sendSync("bridge:app:getBaseMethodNames") as unknown,
    getMethodCode: (moduleName: unknown, methodName: unknown) =>
      ipcRenderer.sendSync("bridge:app:getMethodCode", moduleName, methodName) as unknown,
    getKickMp3ArrayBuffer: () =>
      ipcRenderer.sendSync("bridge:app:getKickMp3ArrayBuffer") as unknown,
    getVersion: () => ipcRenderer.sendSync("bridge:app:getVersion") as unknown,
    getRepositoryUrl: () => ipcRenderer.sendSync("bridge:app:getRepositoryUrl") as unknown,
    isPackaged: () => ipcRenderer.sendSync("bridge:app:isPackaged") as unknown,
    openProjectorDevTools: () => ipcRenderer.send("bridge:app:openProjectorDevTools"),
  },
  messaging: {
    sendToProjector: (type: unknown, props: unknown = {}) =>
      ipcRenderer.send("dashboard-to-projector", { type, props }),
    sendToDashboard: (type: unknown, props: unknown = {}) =>
      ipcRenderer.send("projector-to-dashboard", { type, props }),
    onFromProjector: (handler: IpcHandler) => {
      if (typeof handler !== "function") return undefined;
      const wrapped = (event: IpcRendererEvent, data: unknown) => handler(event, data);
      ipcRenderer.on("from-projector", wrapped);
      return () => ipcRenderer.removeListener("from-projector", wrapped);
    },
    onFromDashboard: (handler: IpcHandler) => {
      if (typeof handler !== "function") return undefined;
      const wrapped = (event: IpcRendererEvent, data: unknown) => handler(event, data);
      ipcRenderer.on("from-dashboard", wrapped);
      return () => ipcRenderer.removeListener("from-dashboard", wrapped);
    },
    onInputEvent: (handler: IpcHandler) => {
      if (typeof handler !== "function") return undefined;
      const wrapped = (event: IpcRendererEvent, payload: unknown) => handler(event, payload);
      ipcRenderer.on("input-event", wrapped);
      return () => ipcRenderer.removeListener("input-event", wrapped);
    },
    onInputStatus: (handler: IpcHandler) => {
      if (typeof handler !== "function") return undefined;
      const wrapped = (event: IpcRendererEvent, payload: unknown) => handler(event, payload);
      ipcRenderer.on("input-status", wrapped);
      return () => ipcRenderer.removeListener("input-status", wrapped);
    },
    onWorkspaceModulesChanged: (handler: IpcHandler) => {
      if (typeof handler !== "function") return undefined;
      const wrapped = (event: IpcRendererEvent, payload: unknown) => handler(event, payload);
      ipcRenderer.on("workspace:modulesChanged", wrapped);
      return () => ipcRenderer.removeListener("workspace:modulesChanged", wrapped);
    },
    onWorkspaceLostSync: (handler: IpcHandler) => {
      if (typeof handler !== "function") return undefined;
      const wrapped = (event: IpcRendererEvent, payload: unknown) => handler(event, payload);
      ipcRenderer.on("workspace:lostSync", wrapped);
      return () => ipcRenderer.removeListener("workspace:lostSync", wrapped);
    },
    configureInput: (payload: unknown) => ipcRenderer.invoke("input:configure", payload),
    getMidiDevices: () => ipcRenderer.invoke("input:get-midi-devices"),
    emitAudioBand: (payload: unknown) => ipcRenderer.invoke("input:audio:emitBand", payload),
    emitFileBand: (payload: unknown) => ipcRenderer.invoke("input:file:emitBand", payload),
    selectWorkspace: () => ipcRenderer.invoke("workspace:select"),
    setWorkspace: (workspacePath: unknown) => ipcRenderer.invoke("workspace:set", workspacePath),
  },
};

const isTestEnv = process.env.NODE_ENV === "test";
const isMockMidi = process.env.NW_WRLD_TEST_MIDI_MOCK === "1";
const isMockAudio = process.env.NW_WRLD_TEST_AUDIO_MOCK === "1";
const isMockFile = process.env.NW_WRLD_TEST_FILE_MOCK === "1";
if (isTestEnv && (isMockMidi || isMockAudio || isMockFile)) {
  const testing: Record<string, unknown> = {};
  if (isMockMidi) {
    testing.midi = {
      reset: (devices: unknown) => ipcRenderer.invoke("test:midi:reset", devices),
      disconnect: (deviceId: unknown) => ipcRenderer.invoke("test:midi:disconnect", deviceId),
      reconnect: (device: unknown) => ipcRenderer.invoke("test:midi:reconnect", device),
      noteOn: (payload: unknown) => ipcRenderer.invoke("test:midi:noteOn", payload),
    };
  }
  if (isMockAudio) {
    testing.audio = {
      emitBand: (payload: unknown) => ipcRenderer.invoke("test:audio:emitBand", payload),
    };
  }
  if (isMockFile) {
    testing.file = {
      emitBand: (payload: unknown) => ipcRenderer.invoke("test:file:emitBand", payload),
    };
  }
  (nwWrldBridge as unknown as { testing?: unknown }).testing = testing;
}

const forwardConsoleToMain = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  const formatMessage = (args: unknown[]): string => {
    return args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack}`;
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      })
      .join(" ");
  };

  console.log = (...args: unknown[]) => {
    originalLog.apply(console, args);
    ipcRenderer.send("log-to-main", `[LOG] ${formatMessage(args)}`);
  };

  console.error = (...args: unknown[]) => {
    originalError.apply(console, args);
    ipcRenderer.send("log-to-main", `[ERROR] ${formatMessage(args)}`);
  };

  console.warn = (...args: unknown[]) => {
    originalWarn.apply(console, args);
    ipcRenderer.send("log-to-main", `[WARN] ${formatMessage(args)}`);
  };

  console.info = (...args: unknown[]) => {
    originalInfo.apply(console, args);
    ipcRenderer.send("log-to-main", `[INFO] ${formatMessage(args)}`);
  };

  console.debug = (...args: unknown[]) => {
    originalDebug.apply(console, args);
    ipcRenderer.send("log-to-main", `[DEBUG] ${formatMessage(args)}`);
  };
};

if (isTopLevelFrame()) {
  forwardConsoleToMain();
  contextBridge.exposeInMainWorld("nwWrldBridge", nwWrldBridge);
  contextBridge.exposeInMainWorld("nwWrldAppBridge", nwWrldAppBridge);
}
