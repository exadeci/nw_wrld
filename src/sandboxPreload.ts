import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

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
    try {
      ipcRenderer.send("log-to-main", `[SANDBOX-LOG] ${formatMessage(args)}`);
    } catch {}
  };

  console.error = (...args: unknown[]) => {
    originalError.apply(console, args);
    try {
      ipcRenderer.send("log-to-main", `[SANDBOX-ERROR] ${formatMessage(args)}`);
    } catch {}
  };

  console.warn = (...args: unknown[]) => {
    originalWarn.apply(console, args);
    try {
      ipcRenderer.send("log-to-main", `[SANDBOX-WARN] ${formatMessage(args)}`);
    } catch {}
  };

  console.info = (...args: unknown[]) => {
    originalInfo.apply(console, args);
    try {
      ipcRenderer.send("log-to-main", `[SANDBOX-INFO] ${formatMessage(args)}`);
    } catch {}
  };

  console.debug = (...args: unknown[]) => {
    originalDebug.apply(console, args);
    try {
      ipcRenderer.send("log-to-main", `[SANDBOX-DEBUG] ${formatMessage(args)}`);
    } catch {}
  };
};

forwardConsoleToMain();

contextBridge.exposeInMainWorld("nwSandboxIpc", {
  send: (payload: unknown) => {
    try {
      ipcRenderer.send("sandbox:toMain", payload);
    } catch {}
  },
  on: (handler: (payload: unknown) => void) => {
    if (typeof handler !== "function") return undefined;
    const wrapped = (_event: IpcRendererEvent, payload: unknown) => handler(payload);
    ipcRenderer.on("sandbox:fromMain", wrapped);
    return () => {
      try {
        ipcRenderer.removeListener("sandbox:fromMain", wrapped);
      } catch {}
    };
  },
});
