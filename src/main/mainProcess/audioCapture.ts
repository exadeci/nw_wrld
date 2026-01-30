import { desktopCapturer } from "electron";

class AudioCaptureManager {
  isCapturing = false;

  async getSystemAudioSources() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 0, height: 0 },
      });

      return sources
        .filter(
          (source) =>
            source.name.toLowerCase().includes("audio") ||
            source.name.toLowerCase().includes("sound") ||
            source.name.toLowerCase().includes("system")
        )
        .map((source) => ({
          id: source.id,
          name: source.name,
          type: "system",
        }));
    } catch (error) {
      console.error("[AudioCapture] Error getting system audio sources:", error);
      return [];
    }
  }

  async stopCapture() {
    this.isCapturing = false;
    return { ok: true };
  }

  getStatus() {
    return {
      isCapturing: this.isCapturing,
    };
  }
}

export const audioCaptureManager = new AudioCaptureManager();
export { AudioCaptureManager };
