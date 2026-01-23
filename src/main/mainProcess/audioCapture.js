const { desktopCapturer } = require("electron");

/**
 * Audio capture manager for real-time waveform analysis
 * Note: Actual audio capture happens in renderer process via Web Audio API
 * This module provides system-level helpers
 */

class AudioCaptureManager {
  constructor() {
    this.isCapturing = false;
  }

  /**
   * Get system audio sources (for capturing system audio output)
   */
  async getSystemAudioSources() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 0, height: 0 },
      });

      // Filter for audio sources (system audio)
      return sources
        .filter((source) => 
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

  /**
   * Stop capturing audio (called from renderer)
   */
  async stopCapture() {
    this.isCapturing = false;
    return { ok: true };
  }

  /**
   * Get current capture status
   */
  getStatus() {
    return {
      isCapturing: this.isCapturing,
    };
  }
}

// Create singleton instance
const audioCaptureManager = new AudioCaptureManager();

module.exports = {
  audioCaptureManager,
  AudioCaptureManager,
};
