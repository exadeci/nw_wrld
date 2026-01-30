import { registerAppBridge } from "./ipcBridge/registerAppBridge";
import { registerAudioBridge } from "./ipcBridge/registerAudioBridge";
import { registerInputBridge } from "./ipcBridge/registerInputBridge";
import { registerJsonBridge } from "./ipcBridge/registerJsonBridge";
import { registerLogBridge } from "./ipcBridge/registerLogBridge";
import { registerOsBridge } from "./ipcBridge/registerOsBridge";
import { registerProjectBridge } from "./ipcBridge/registerProjectBridge";
import { registerTestMidiBridge } from "./ipcBridge/registerTestMidiBridge";
import { registerWorkspaceBridge } from "./ipcBridge/registerWorkspaceBridge";

export function registerIpcBridge(): void {
  registerProjectBridge();
  registerWorkspaceBridge();
  registerJsonBridge();
  registerAppBridge();
  registerAudioBridge();
  registerOsBridge();
  registerInputBridge();
  registerTestMidiBridge();
  registerLogBridge();
}
