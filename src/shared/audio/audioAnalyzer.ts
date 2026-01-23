/**
 * Audio Analyzer helper class for real-time waveform and frequency analysis
 * Use this in modules to analyze captured audio
 */

type AudioReactiveConfig = {
  inputGain?: unknown;
};

type NwWrldSdk = {
  audio?: {
    getAudioReactiveConfig?: () => AudioReactiveConfig | null | undefined;
  };
};

declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
  var nwWrldSdk: NwWrldSdk | undefined;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;
  private frequencyData: Uint8Array | null = null;
  private isInitialized = false;
  private inputGain = 1.0;

  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.gainNode = null;
    this.source = null;
    this.stream = null;
    this.dataArray = null;
    this.frequencyData = null;
    this.isInitialized = false;
    this.inputGain = 1.0;
  }

  /**
   * Initialize analyzer with an audio stream
   */
  async init(stream: MediaStream): Promise<boolean> {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("AudioContext not supported");
      }
      this.audioContext = new AudioContextClass();
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.gainNode = this.audioContext.createGain();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      this.source.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      
      const sdk = globalThis.nwWrldSdk;
      console.log("🎵 [AudioAnalyzer] Initializing, SDK available:", !!sdk, "audio available:", !!sdk?.audio);
      if (sdk?.audio?.getAudioReactiveConfig) {
        const config = sdk.audio.getAudioReactiveConfig();
        console.log("🎵 [AudioAnalyzer] Got audio reactive config:", config);
        if (config && typeof config === "object" && "inputGain" in config && config.inputGain !== undefined) {
          this.inputGain = Math.max(0.1, Math.min(10, Number(config.inputGain) || 1.0));
          console.log("🎵 [AudioAnalyzer] Set inputGain to:", this.inputGain);
        }
      } else {
        console.warn("🎵 [AudioAnalyzer] getAudioReactiveConfig not available");
      }
      if (this.gainNode) {
        this.gainNode.gain.value = this.inputGain;
        console.log("🎵 [AudioAnalyzer] Gain node value set to:", this.gainNode.gain.value);
      }

      if (!this.analyser) {
        throw new Error("Analyser not created");
      }
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.frequencyData = new Uint8Array(bufferLength);

      this.stream = stream;
      this.isInitialized = true;

      return true;
    } catch (error) {
      console.error("[AudioAnalyzer] Initialization error:", error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Set input gain multiplier (0.1 to 10)
   */
  setInputGain(gain: unknown): void {
    this.inputGain = Math.max(0.1, Math.min(10, Number(gain) || 1.0));
    if (this.gainNode) {
      this.gainNode.gain.value = this.inputGain;
    }
  }

  /**
   * Get waveform data (time domain)
   * Returns array of values 0-255
   */
  getWaveform(): number[] | null {
    if (!this.isInitialized || !this.analyser || !this.dataArray) {
      return null;
    }
    this.analyser.getByteTimeDomainData(this.dataArray);
    return Array.from(this.dataArray);
  }

  /**
   * Get frequency data
   * Returns array of values 0-255 representing frequency bins
   */
  getFrequencyData(): number[] | null {
    if (!this.isInitialized || !this.analyser || !this.frequencyData) {
      return null;
    }
    this.analyser.getByteFrequencyData(this.frequencyData);
    return Array.from(this.frequencyData);
  }

  /**
   * Get normalized waveform (0-1 range)
   */
  getWaveformNormalized(): number[] | null {
    const waveform = this.getWaveform();
    if (!waveform) return null;
    return waveform.map((v) => (v - 128) / 128);
  }

  /**
   * Get normalized frequency data (0-1 range)
   */
  getFrequencyDataNormalized(): number[] | null {
    const freq = this.getFrequencyData();
    if (!freq) return null;
    return freq.map((v) => v / 255);
  }

  /**
   * Get overall volume level (0-1)
   */
  getVolume(): number {
    const waveform = this.getWaveformNormalized();
    if (!waveform || waveform.length === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < waveform.length; i++) {
      sum += Math.abs(waveform[i]);
    }
    return sum / waveform.length;
  }

  /**
   * Get bass level (low frequencies, 0-1)
   */
  getBass(): number {
    const freq = this.getFrequencyDataNormalized();
    if (!freq || freq.length === 0) return 0;
    
    // Bass is roughly the first 10% of frequency bins
    const bassEnd = Math.floor(freq.length * 0.1);
    let sum = 0;
    for (let i = 0; i < bassEnd; i++) {
      sum += freq[i];
    }
    return bassEnd > 0 ? sum / bassEnd : 0;
  }

  /**
   * Get mid level (mid frequencies, 0-1)
   */
  getMid(): number {
    const freq = this.getFrequencyDataNormalized();
    if (!freq || freq.length === 0) return 0;
    
    // Mid is roughly 10-50% of frequency bins
    const midStart = Math.floor(freq.length * 0.1);
    const midEnd = Math.floor(freq.length * 0.5);
    let sum = 0;
    for (let i = midStart; i < midEnd; i++) {
      sum += freq[i];
    }
    return midEnd > midStart ? sum / (midEnd - midStart) : 0;
  }

  /**
   * Get treble level (high frequencies, 0-1)
   */
  getTreble(): number {
    const freq = this.getFrequencyDataNormalized();
    if (!freq || freq.length === 0) return 0;
    
    // Treble is roughly 50-100% of frequency bins
    const trebleStart = Math.floor(freq.length * 0.5);
    let sum = 0;
    for (let i = trebleStart; i < freq.length; i++) {
      sum += freq[i];
    }
    return trebleStart < freq.length ? sum / (freq.length - trebleStart) : 0;
  }

  /**
   * Cleanup and stop analysis
   */
  destroy(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = null;
    this.frequencyData = null;
    this.isInitialized = false;
  }
}
