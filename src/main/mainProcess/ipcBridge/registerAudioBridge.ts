import { ipcMain } from "electron";
import { state } from "../state";
import { audioCaptureManager } from "../audioCapture";

export function registerAudioBridge(): void {
  ipcMain.handle("bridge:audio:getInputDevices", async (event) => {
    try {
      const wc = event.sender;
      const devices = await wc.executeJavaScript(`
        (async () => {
          const d = await navigator.mediaDevices.enumerateDevices();
          return d.filter(x => x.kind === 'audioinput').map(x => ({
            deviceId: x.deviceId,
            id: x.deviceId,
            label: x.label || ('Input ' + (x.deviceId || '').slice(0, 8)),
            name: x.label || ('Input ' + (x.deviceId || '').slice(0, 8)),
            kind: x.kind
          }));
        })()
      `);
      return { ok: true, devices: devices || [] };
    } catch (error) {
      return { ok: false, error: (error as Error)?.message };
    }
  });

  ipcMain.handle("bridge:audio:getOutputDevices", async (event) => {
    try {
      const wc = event.sender;
      const devices = await wc.executeJavaScript(`
        (async () => {
          const d = await navigator.mediaDevices.enumerateDevices();
          return d.filter(x => x.kind === 'audiooutput').map(x => ({
            deviceId: x.deviceId,
            id: x.deviceId,
            label: x.label || ('Output ' + (x.deviceId || '').slice(0, 8)),
            name: x.label || ('Output ' + (x.deviceId || '').slice(0, 8)),
            kind: x.kind
          }));
        })()
      `);
      return { ok: true, devices: devices || [] };
    } catch (error) {
      return { ok: false, error: (error as Error)?.message };
    }
  });

  ipcMain.handle("bridge:audio:getSystemAudioSources", async () => {
    try {
      const sources = await audioCaptureManager.getSystemAudioSources();
      return { ok: true, sources: sources || [] };
    } catch (error) {
      return { ok: false, error: (error as Error)?.message };
    }
  });

  ipcMain.handle("bridge:audio:getStatus", async () => {
    try {
      const sandboxView = (state as {
        sandboxView?: { webContents?: { executeJavaScript: (code: string) => Promise<unknown> } };
      }).sandboxView;
      const wc = sandboxView?.webContents;
      if (!wc?.executeJavaScript) {
        return { ok: true, isCapturing: false };
      }
      const isCapturing = await wc.executeJavaScript(`
        !!(typeof globalThis !== 'undefined' && globalThis.__nwWrldAudioStream)
      `);
      return { ok: true, isCapturing: !!isCapturing };
    } catch {
      return { ok: true, isCapturing: false };
    }
  });

  ipcMain.handle("bridge:audio:getStream", async () => {
    return { ok: true, stream: null };
  });

  ipcMain.handle("bridge:audio:getAudioLevels", async () => {
    try {
      const sandboxView = (state as {
        sandboxView?: { webContents?: { executeJavaScript: (code: string) => Promise<unknown> } };
      }).sandboxView;
      const wc = sandboxView?.webContents;
      if (!wc?.executeJavaScript) {
        return { ok: true, bass: 0, mid: 0, treble: 0, overall: 0 };
      }
      const levels = await wc.executeJavaScript(`
        (() => {
          const sdk = typeof globalThis !== 'undefined' ? globalThis.nwWrldSdk : null;
          const analyzer = sdk?.audio?.__analyzer;
          if (!analyzer || typeof analyzer.getLevels !== 'function') {
            return { bass: 0, mid: 0, treble: 0, overall: 0 };
          }
          try {
            return analyzer.getLevels();
          } catch {
            return { bass: 0, mid: 0, treble: 0, overall: 0 };
          }
        })()
      `);
      return { ok: true, ...(levels || { bass: 0, mid: 0, treble: 0, overall: 0 }) };
    } catch {
      return { ok: true, bass: 0, mid: 0, treble: 0, overall: 0 };
    }
  });
}
