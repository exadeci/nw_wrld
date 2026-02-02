import React, {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Modal } from "../shared/Modal.tsx";
import { ModalHeader } from "../components/ModalHeader.tsx";
import { Button } from "../components/Button.tsx";
import {
  Select,
  NumberInput,
  RadioButton,
  ColorInput,
  TextInput,
  RangeInput,
  LevelMeter,
} from "../components/FormInputs.tsx";
import { HelpIcon } from "../components/HelpIcon.tsx";
import { HELP_TEXT } from "../../shared/helpText.ts";
import { AUDIO_DEFAULTS } from "../core/audio/audioTuning.ts";

const SETTINGS_TABS = [
  { id: "general", label: "General" },
  { id: "audio-reactive", label: "Audio Reactive" },
];

const TabNavigation = ({ activeTab, setActiveTab }) => (
  <div className="flex gap-1 mb-6 border-b border-neutral-800 pb-3">
    {SETTINGS_TABS.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`px-4 py-2 text-[11px] font-mono transition-all ${
          activeTab === tab.id
            ? "text-white bg-neutral-800 border border-neutral-600"
            : "text-neutral-500 hover:text-neutral-300 border border-transparent"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

const AudioReactiveSettings = ({ config, updateConfig, isOpen }) => {
  const audioReactive = config?.audioReactive || {
    enabled: true,
    inputGain: 1.0,
    reactivity: 1.0,
    bassResponse: 1.0,
    midResponse: 1.0,
    trebleResponse: 1.0,
    smoothing: 0.8,
    fftSize: 256,
  };

  const [audioLevels, setAudioLevels] = useState({
    bass: 0,
    mid: 0,
    treble: 0,
    overall: 0,
  });

  const animationFrameRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const updateAudioReactive = useCallback((updates) => {
    const newConfig = {
      ...audioReactive,
      ...updates,
    };
    console.log("🎵 [Settings] Updating audio reactive config:", { old: audioReactive, updates, new: newConfig });
    updateConfig({
      audioReactive: newConfig,
    });
  }, [audioReactive, updateConfig]);

  useEffect(() => {
    const updateLevels = () => {
      const now = performance.now();
      if (now - lastUpdateRef.current > 50) {
        const bridge = globalThis.nwWrldBridge;
        if (bridge?.audio?.getAudioLevels) {
          const levels = bridge.audio.getAudioLevels();
          if (levels) {
            setAudioLevels({
              bass: levels.bass || 0,
              mid: levels.mid || 0,
              treble: levels.treble || 0,
              overall: levels.overall || 0,
            });
          }
        }
        lastUpdateRef.current = now;
      }
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    animationFrameRef.current = requestAnimationFrame(updateLevels);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 font-mono">
      <div className="pl-12">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="audio-reactive-enabled"
            checked={audioReactive.enabled}
            onChange={(e) => updateAudioReactive({ enabled: e.target.checked })}
            className="w-4 h-4 accent-white cursor-pointer"
          />
          <label
            htmlFor="audio-reactive-enabled"
            className="text-[11px] text-neutral-300 cursor-pointer"
          >
            Enable Audio Reactive
          </label>
        </div>
      </div>

      <div className="pl-12 border-t border-neutral-800 pt-4">
        <div className="opacity-50 mb-3 text-[11px]">Live Audio Levels:</div>
        <div className="space-y-2">
          <div>
            <div className="text-[10px] text-neutral-400 mb-1">Bass</div>
            <LevelMeter value={audioLevels.bass} color="#ef4444" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 mb-1">Mid</div>
            <LevelMeter value={audioLevels.mid} color="#f59e0b" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 mb-1">Treble</div>
            <LevelMeter value={audioLevels.treble} color="#22c55e" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 mb-1">Overall</div>
            <LevelMeter value={audioLevels.overall} color="#3b82f6" />
          </div>
        </div>
        <div className="mt-2 text-[9px] text-neutral-600">
          When enabled, audio is captured automatically using the source below
        </div>
      </div>

      <div className="pl-12 border-t border-neutral-800 pt-4">
        <div className="opacity-50 mb-3 text-[11px]">Response Settings:</div>
        <div className="space-y-4">
          <div>
            <div className="text-[10px] text-neutral-400 mb-2">
              Input Gain (boost low volume signals)
            </div>
            <RangeInput
              value={audioReactive.inputGain ?? 1.0}
              min={0.1}
              max={10}
              step={0.1}
              onChange={(e) =>
                updateAudioReactive({ inputGain: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 mb-2">
              Audio Reactivity (global multiplier)
            </div>
            <RangeInput
              value={audioReactive.reactivity}
              min={0}
              max={10}
              step={0.1}
              onChange={(e) =>
                updateAudioReactive({ reactivity: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 mb-2">Bass Response</div>
            <RangeInput
              value={audioReactive.bassResponse}
              min={0}
              max={10}
              step={0.1}
              onChange={(e) =>
                updateAudioReactive({ bassResponse: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 mb-2">Mid Response</div>
            <RangeInput
              value={audioReactive.midResponse}
              min={0}
              max={10}
              step={0.1}
              onChange={(e) =>
                updateAudioReactive({ midResponse: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 mb-2">Treble Response</div>
            <RangeInput
              value={audioReactive.trebleResponse}
              min={0}
              max={10}
              step={0.1}
              onChange={(e) =>
                updateAudioReactive({ trebleResponse: parseFloat(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      <div className="pl-12 border-t border-neutral-800 pt-4">
        <div className="opacity-50 mb-3 text-[11px]">Advanced:</div>
        <div className="space-y-4">
          <div>
            <div className="text-[10px] text-neutral-400 mb-2">
              Smoothing (0 = instant, 1 = slow)
            </div>
            <RangeInput
              value={audioReactive.smoothing}
              min={0}
              max={0.99}
              step={0.01}
              onChange={(e) =>
                updateAudioReactive({ smoothing: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 mb-2">
              FFT Size (frequency resolution)
            </div>
            <Select
              value={audioReactive.fftSize}
              onChange={(e) =>
                updateAudioReactive({ fftSize: parseInt(e.target.value) })
              }
              className="py-1 w-full"
            >
              <option value="64" className="bg-[#101010]">
                64 (fast, low resolution)
              </option>
              <option value="128" className="bg-[#101010]">
                128
              </option>
              <option value="256" className="bg-[#101010]">
                256 (balanced)
              </option>
              <option value="512" className="bg-[#101010]">
                512
              </option>
              <option value="1024" className="bg-[#101010]">
                1024 (slow, high resolution)
              </option>
              <option value="2048" className="bg-[#101010]">
                2048
              </option>
            </Select>
          </div>
        </div>
      </div>

      <AudioCaptureSettings isOpen={isOpen} config={config} updateConfig={updateConfig} />
    </div>
  );
};

const isValidHexColor = (value) => /^#([0-9A-F]{3}){1,2}$/i.test(value);

const clampMidiChannel = (value, fallback = 1) => {
  const n = parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(16, n));
};

const normalizeMidiNoteMatchMode = (value) =>
  value === "exactNote" ? "exactNote" : "pitchClass";

const normalizeHexColor = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (!isValidHexColor(withHash)) return null;
  const hex = withHash.toLowerCase();
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
};

const DraftIntInput = React.memo(({ value, fallback, onCommit, ...props }) => {
  const [draft, setDraft] = React.useState(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const skipCommitRef = React.useRef(false);

  React.useEffect(() => {
    if (!isFocused) setDraft(null);
  }, [isFocused, value]);

  const displayed = draft !== null ? draft : String(value ?? "");

  const commitIfValid = React.useCallback(
    (raw) => {
      const s = String(raw);
      const isIntermediate =
        s === "" ||
        s === "-" ||
        s === "." ||
        s === "-." ||
        s.endsWith(".") ||
        /e[+-]?$/i.test(s);
      if (isIntermediate) return;
      const n = parseInt(s, 10);
      if (!Number.isFinite(n)) return;
      onCommit(n);
    },
    [onCommit]
  );

  const commitOnBlur = React.useCallback(() => {
    if (draft === null) return;
    const s = String(draft);
    const isIntermediate =
      s === "" ||
      s === "-" ||
      s === "." ||
      s === "-." ||
      s.endsWith(".") ||
      /e[+-]?$/i.test(s);
    if (isIntermediate) {
      onCommit(fallback);
      return;
    }
    const n = parseInt(s, 10);
    if (!Number.isFinite(n)) {
      onCommit(fallback);
      return;
    }
    onCommit(n);
  }, [draft, fallback, onCommit]);

  return (
    <NumberInput
      {...props}
      value={displayed}
      onFocus={() => {
        skipCommitRef.current = false;
        setIsFocused(true);
        setDraft(String(value ?? ""));
      }}
      onChange={(e) => {
        const next = e.target.value;
        setDraft(next);
        commitIfValid(next);
      }}
      onBlur={() => {
        setIsFocused(false);
        if (skipCommitRef.current) {
          skipCommitRef.current = false;
          return;
        }
        commitOnBlur();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          skipCommitRef.current = true;
          setDraft(null);
          e.currentTarget.blur();
        }
      }}
    />
  );
});

type DraftFloatInputProps = {
  value: number;
  fallback: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  style?: React.CSSProperties;
  "data-testid"?: string;
};

const DraftFloatInput = memo(({ value, fallback, onCommit, ...props }: DraftFloatInputProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const skipCommitRef = useRef(false);

  useEffect(() => {
    if (!isFocused) setDraft(null);
  }, [isFocused, value]);

  const displayed = draft !== null ? draft : String(value ?? "");

  const commitIfValid = useCallback(
    (raw: string) => {
      const s = String(raw);
      const isIntermediate =
        s === "" || s === "-" || s === "." || s === "-." || s.endsWith(".") || /e[+-]?$/i.test(s);
      if (isIntermediate) return;
      const n = parseFloat(s);
      if (!Number.isFinite(n)) return;
      onCommit(n);
    },
    [onCommit]
  );

  const commitOnBlur = useCallback(() => {
    if (draft === null) return;
    const s = String(draft);
    const isIntermediate =
      s === "" || s === "-" || s === "." || s === "-." || s.endsWith(".") || /e[+-]?$/i.test(s);
    if (isIntermediate) {
      onCommit(fallback);
      return;
    }
    const n = parseFloat(s);
    if (!Number.isFinite(n)) {
      onCommit(fallback);
      return;
    }
    onCommit(n);
  }, [draft, fallback, onCommit]);

  return (
    <NumberInput
      {...props}
      value={displayed}
      onFocus={() => {
        skipCommitRef.current = false;
        setIsFocused(true);
        setDraft(String(value ?? ""));
      }}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        setDraft(next);
        commitIfValid(next);
      }}
      onBlur={() => {
        setIsFocused(false);
        if (skipCommitRef.current) {
          skipCommitRef.current = false;
          return;
        }
        commitOnBlur();
      }}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          skipCommitRef.current = true;
          setDraft(null);
          e.currentTarget.blur();
        }
      }}
    />
  );
});

type UserColorsProps = {
  config: { userColors?: string[] };
  updateConfig: (updates: { userColors: string[] }) => void;
};

const UserColors = ({ config, updateConfig }: UserColorsProps) => {
  const userColors = useMemo(
    () => (Array.isArray(config?.userColors) ? config.userColors : []),
    [config]
  );
  const [draft, setDraft] = useState(
    userColors[0] && isValidHexColor(userColors[0]) ? userColors[0] : "#ffffff"
  );
  const [draftText, setDraftText] = useState(String(draft));

  useEffect(() => {
    setDraftText(String(draft));
  }, [draft]);

  const addColor = useCallback(() => {
    const normalized = normalizeHexColor(draftText);
    if (!normalized) return;
    const next = Array.from(new Set([...userColors, normalized]));
    updateConfig({ userColors: next });
  }, [draftText, updateConfig, userColors]);

  const removeColor = useCallback(
    (hex) => {
      const safe = String(hex || "").trim();
      if (!safe) return;
      const next = userColors.filter((c) => c !== safe);
      updateConfig({ userColors: next });
    },
    [updateConfig, userColors]
  );

  React.useEffect(() => {
    setDraftText(String(draft));
  }, [draft]);

  return (
    <div className="flex flex-col gap-2 font-mono border-t border-neutral-800 pt-6">
      <div className="pl-6">
        <div className="mb-1 text-[11px]">
          <span className="opacity-50">User Colors:</span>
        </div>
        <div className="pl-6">
          <div className="flex items-center gap-2">
            <ColorInput
              value={draft}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const next = normalizeHexColor(e.target.value) || "#ffffff";
                setDraft(next);
              }}
            />
            <TextInput
              value={draftText}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDraftText(e.target.value)}
              className="w-24 py-0.5"
            />
            <Button onClick={addColor} className="flex-1">
              ADD
            </Button>
          </div>
          {userColors.length > 0 ? (
            <div className="mt-2 flex flex-col gap-1">
              {userColors.map((hex) => (
                <div
                  key={hex}
                  className="flex items-center justify-between gap-2 text-[11px] text-neutral-300/80"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 border border-neutral-600"
                      style={{ backgroundColor: hex }}
                    />
                    <span>{hex}</span>
                  </div>
                  <div
                    className="px-1 text-red-500/50 cursor-pointer text-[11px]"
                    onClick={() => removeColor(hex)}
                    title="Remove"
                  >
                    [{"\u00D7"}]
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-[10px] text-neutral-500">No user colors saved.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectorSettings = ({
  aspectRatio,
  setAspectRatio,
  bgColor,
  setBgColor,
  settings,
  config,
  updateConfig,
}) => {
  const showFps = config?.showFps ?? false;

  return (
    <div className="flex flex-col gap-2 font-mono">
      <div className="pl-6">
        <div className="pl-6">
          <div className="mb-1 text-[11px] relative inline-block">
            <span className="opacity-50">Aspect Ratio:</span>
            <HelpIcon helpText={HELP_TEXT.aspectRatio} />
          </div>
          <Select
            id="aspectRatio"
            value={aspectRatio}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setAspectRatio(e.target.value)}
            className="py-1 w-full"
          >
            {settings.aspectRatios.map((ratio) => (
              <option key={ratio.id} value={ratio.id} className="bg-[#101010]">
                {ratio.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="pl-6">
        <div className="pl-6">
          <div className="opacity-50 mb-1 text-[11px]">Background Color:</div>
          <Select
            id="bgColor"
            value={bgColor}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setBgColor(e.target.value)}
            className="py-1 w-full"
          >
            {settings.backgroundColors.map((color) => (
              <option key={color.id} value={color.id} className="bg-[#101010]">
                {color.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="pl-12">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="showFps"
            checked={showFps}
            onChange={(e) => updateConfig({ showFps: e.target.checked })}
            className="w-4 h-4 accent-white cursor-pointer"
          />
          <label
            htmlFor="showFps"
            className="text-[11px] text-neutral-300 cursor-pointer"
          >
            Show FPS Display
          </label>
        </div>
      </div>
    </div>
  );
};

const AudioCaptureSettings = ({ isOpen, config, updateConfig }) => {
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [systemAudioSources, setSystemAudioSources] = useState([]);
  const audioCaptureConfig = config?.audioCapture || { sourceType: "input", deviceId: "", systemAudioId: "" };
  const [selectedSourceType, setSelectedSourceType] = useState(audioCaptureConfig.sourceType || "input");
  const [selectedDeviceId, setSelectedDeviceId] = useState(audioCaptureConfig.deviceId || "");

  useEffect(() => {
    if (!isOpen) return;

    const loadDevices = async () => {
      const bridge = globalThis.nwWrldBridge;
      if (!bridge?.audio) return;

      try {
        const [inputResult, outputResult, systemResult] = await Promise.all([
          bridge.audio.getInputDevices(),
          bridge.audio.getOutputDevices(),
          bridge.audio.getSystemAudioSources(),
        ]);

        if (inputResult?.ok) {
          setAudioInputDevices(inputResult.devices || []);
        }
        if (outputResult?.ok) {
          setAudioOutputDevices(outputResult.devices || []);
        }
        if (systemResult?.ok) {
          setSystemAudioSources(systemResult.sources || []);
        }
      } catch (error) {
        console.error("Error loading audio devices:", error);
      }
    };

    loadDevices();

    const savedConfig = config?.audioCapture || {};
    if (savedConfig.sourceType) {
      setSelectedSourceType(savedConfig.sourceType);
    }
    if (savedConfig.deviceId) {
      setSelectedDeviceId(savedConfig.deviceId);
    }
  }, [isOpen, config]);

  const availableDevices = 
    selectedSourceType === "input"
      ? audioInputDevices
      : selectedSourceType === "output"
      ? audioOutputDevices
      : systemAudioSources;

  return (
    <div className="flex flex-col gap-3 font-mono border-t border-neutral-800 pt-6">
      <div className="pl-12">
        <div className="mb-1 text-[11px] relative inline-block">
          <span className="opacity-50">Audio Capture:</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <RadioButton
              id="audio-source-input"
              name="audioSource"
              value="input"
              checked={selectedSourceType === "input"}
              onChange={() => {
                setSelectedSourceType("input");
                setSelectedDeviceId("");
                updateConfig({
                  audioCapture: {
                    ...audioCaptureConfig,
                    sourceType: "input",
                    deviceId: "",
                    systemAudioId: "",
                  },
                });
              }}
            />
            <label
              htmlFor="audio-source-input"
              className="cursor-pointer text-[11px] font-mono text-neutral-300"
            >
              Audio Input
            </label>
          </div>
          <div className="flex items-center gap-3">
            <RadioButton
              id="audio-source-output"
              name="audioSource"
              value="output"
              checked={selectedSourceType === "output"}
              onChange={() => {
                setSelectedSourceType("output");
                setSelectedDeviceId("");
                updateConfig({
                  audioCapture: {
                    ...audioCaptureConfig,
                    sourceType: "output",
                    deviceId: "",
                    systemAudioId: "",
                  },
                });
              }}
            />
            <label
              htmlFor="audio-source-output"
              className="cursor-pointer text-[11px] font-mono text-neutral-300"
            >
              Audio Output
            </label>
          </div>
          <div className="flex items-center gap-3">
            <RadioButton
              id="audio-source-system"
              name="audioSource"
              value="system"
              checked={selectedSourceType === "system"}
              onChange={() => {
                setSelectedSourceType("system");
                setSelectedDeviceId("");
                updateConfig({
                  audioCapture: {
                    ...audioCaptureConfig,
                    sourceType: "system",
                    deviceId: "",
                    systemAudioId: "",
                  },
                });
              }}
            />
            <label
              htmlFor="audio-source-system"
              className="cursor-pointer text-[11px] font-mono text-neutral-300"
            >
              System Audio
            </label>
          </div>
        </div>

        {selectedSourceType !== "system" && (
          <div className="mt-3">
            <div className="opacity-50 mb-1 text-[11px]">
              Device:
            </div>
            <Select
              value={selectedDeviceId}
              onChange={(e) => {
                const newDeviceId = e.target.value;
                setSelectedDeviceId(newDeviceId);
                updateConfig({
                  audioCapture: {
                    ...audioCaptureConfig,
                    deviceId: newDeviceId,
                    systemAudioId: "",
                  },
                });
              }}
              className="py-1 w-full"
            >
              <option value="" className="bg-[#101010]">
                Default (Built-in Microphone)
              </option>
              {availableDevices.map((device) => (
                <option
                  key={device.deviceId || device.id}
                  value={device.deviceId || device.id}
                  className="bg-[#101010]"
                >
                  {device.label || device.name || `Device ${(device.deviceId || device.id || "").slice(0, 8)}`}
                </option>
              ))}
            </Select>
            {availableDevices.length === 0 && (
              <div className="mt-1 text-[10px] text-neutral-500">
                Grant microphone permission to see available devices
              </div>
            )}
          </div>
        )}

        {config?.audioReactive?.enabled !== false && (
          <div className="mt-3 text-[10px] text-green-400">
            ✓ Audio capture active – available to modules
          </div>
        )}
      </div>
    </div>
  );
};

type AudioDevice = {
  id: string;
  label: string;
};

type InputConfig = {
  type?: string;
  deviceId?: string;
  deviceName?: string;
  audioThresholds?: { low?: number; medium?: number; high?: number };
  audioMinIntervalMs?: number;
  fileAssetRelPath?: string;
  fileAssetName?: string;
  fileThresholds?: { low?: number; medium?: number; high?: number };
  fileMinIntervalMs?: number;
  methodTriggerChannel?: number;
  trackSelectionChannel?: number;
  noteMatchMode?: string;
  port?: number;
};

type AspectRatio = { id: string; label: string };
type BackgroundColor = { id: string; label: string };
type MidiDevice = { id: string; name: string };
type Config = Record<string, unknown>;

const GeneralSettings = ({
  aspectRatio,
  setAspectRatio,
  bgColor,
  setBgColor,
  settings,
  inputConfig,
  setInputConfig,
  availableMidiDevices,
  availableAudioDevices,
  refreshAudioDevices,
  audioCaptureState,
  fileAudioState,
  onOpenMappings,
  config,
  updateConfig,
  workspacePath,
  onSelectWorkspace,
  isOpen,
}: {
  aspectRatio: string;
  setAspectRatio: (v: string) => void;
  bgColor: string;
  setBgColor: (v: string) => void;
  settings: { aspectRatios: AspectRatio[]; backgroundColors: BackgroundColor[] };
  inputConfig: InputConfig;
  setInputConfig: (c: InputConfig) => void;
  availableMidiDevices: MidiDevice[];
  availableAudioDevices?: AudioDevice[];
  refreshAudioDevices?: () => Promise<void>;
  audioCaptureState?: unknown;
  fileAudioState?: unknown;
  onOpenMappings: () => void;
  config: Config;
  updateConfig: (u: Partial<Config>) => void;
  workspacePath: string | null;
  onSelectWorkspace: () => void;
  isOpen: boolean;
}) => {
  const normalizedInputType =
    inputConfig?.type === "osc"
      ? "osc"
      : inputConfig?.type === "audio"
        ? "audio"
        : inputConfig?.type === "file"
          ? "file"
          : "midi";
  const signalSourceValue = config.sequencerMode
    ? "sequencer"
    : normalizedInputType === "osc"
      ? "external-osc"
      : normalizedInputType === "audio"
        ? "external-audio"
        : normalizedInputType === "file"
          ? "file-upload"
          : "external-midi";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 font-mono border-b border-neutral-800 pb-6">
        <div className="pl-12">
          <div className="mb-1 text-[11px] relative inline-block">
            <span className="opacity-50">Signal Source:</span>
            <HelpIcon helpText={HELP_TEXT.sequencerMode} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 py-1">
              <RadioButton
                id="signal-sequencer"
                name="signalSource"
                value="sequencer"
                checked={signalSourceValue === "sequencer"}
                onChange={() => updateConfig({ sequencerMode: true })}
              />
              <label
                htmlFor="signal-sequencer"
                className="cursor-pointer text-[11px] font-mono text-neutral-300"
              >
                Sequencer (Pattern Grid)
              </label>
            </div>
            <div className="flex items-center gap-3 py-1">
              <RadioButton
                id="signal-external-midi"
                name="signalSource"
                value="external-midi"
                checked={signalSourceValue === "external-midi"}
                onChange={() => {
                  updateConfig({ sequencerMode: false });
                  setInputConfig({ ...inputConfig, type: "midi" });
                }}
              />
              <label
                htmlFor="signal-external-midi"
                className="cursor-pointer text-[11px] font-mono text-neutral-300"
              >
                External MIDI
              </label>
            </div>
            <div className="flex items-center gap-3 py-1">
              <RadioButton
                id="signal-external-osc"
                name="signalSource"
                value="external-osc"
                checked={signalSourceValue === "external-osc"}
                onChange={() => {
                  updateConfig({ sequencerMode: false });
                  setInputConfig({ ...inputConfig, type: "osc" });
                }}
              />
              <label
                htmlFor="signal-external-osc"
                className="cursor-pointer text-[11px] font-mono text-neutral-300"
              >
                External OSC
              </label>
            </div>
          </div>
        </div>

        {!config.sequencerMode && (
          <>
            {normalizedInputType === "midi" && (
              <>
                <div className="pl-12">
                  <div className="opacity-50 mb-1 text-[11px]">
                    MIDI Device:
                  </div>
                  {(() => {
                    const selectedMidiDeviceId =
                      inputConfig.deviceId ||
                      (availableMidiDevices.find(
                        (d) => d.name === inputConfig.deviceName
                      )?.id ??
                        "");
                    return (
                      <Select
                        id="midiDevice"
                        value={selectedMidiDeviceId}
                        onChange={(e) => {
                          const nextDeviceId = e.target.value;
                          const selected = availableMidiDevices.find(
                            (d) => d.id === nextDeviceId
                          );
                          setInputConfig({
                            ...inputConfig,
                            deviceId: nextDeviceId,
                            deviceName: selected?.name || "",
                          });
                        }}
                        className="py-1 w-full"
                      >
                        <option value="" className="bg-[#101010]">
                          Not configured
                        </option>
                        {availableMidiDevices.map((device) => (
                          <option
                            key={device.id}
                            value={device.id}
                            className="bg-[#101010]"
                          >
                            {device.name}
                          </option>
                        ))}
                      </Select>
                    );
                  })()}
                </div>

                <div className="pl-12">
                  <div className="mb-1 text-[11px] relative inline-block">
                    <span className="opacity-50">MIDI Channels:</span>
                    <HelpIcon helpText={HELP_TEXT.midiChannels} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="opacity-50 mb-1 text-[11px]">
                        Method Triggers MIDI channel:
                      </div>
                      <DraftIntInput
                        value={inputConfig.methodTriggerChannel ?? 1}
                        fallback={inputConfig.methodTriggerChannel ?? 1}
                        onCommit={(next) =>
                          setInputConfig({
                            ...inputConfig,
                            methodTriggerChannel: clampMidiChannel(
                              next,
                              inputConfig.methodTriggerChannel ?? 1
                            ),
                          })
                        }
                        min={1}
                        max={16}
                        className="py-1 w-full"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <div className="opacity-50 mb-1 text-[11px]">
                        Track Select MIDI channel:
                      </div>
                      <DraftIntInput
                        value={inputConfig.trackSelectionChannel ?? 2}
                        fallback={inputConfig.trackSelectionChannel ?? 2}
                        onCommit={(next) =>
                          setInputConfig({
                            ...inputConfig,
                            trackSelectionChannel: clampMidiChannel(
                              next,
                              inputConfig.trackSelectionChannel ?? 2
                            ),
                          })
                        }
                        min={1}
                        max={16}
                        className="py-1 w-full"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pl-12">
                  <div className="mb-1 text-[11px] relative inline-block">
                    <span className="opacity-50">MIDI Note Match:</span>
                    <HelpIcon helpText={HELP_TEXT.midiNoteMatchMode} />
                  </div>
                  <Select
                    id="midiNoteMatchMode"
                    value={normalizeMidiNoteMatchMode(
                      inputConfig.noteMatchMode
                    )}
                    onChange={(e) =>
                      setInputConfig({
                        ...inputConfig,
                        noteMatchMode: normalizeMidiNoteMatchMode(
                          e.target.value
                        ),
                      })
                    }
                    className="py-1 w-full"
                  >
                    <option value="pitchClass" className="bg-[#101010]">
                      Pitch Class (C..B)
                    </option>
                    <option value="exactNote" className="bg-[#101010]">
                      Exact Note (0–127)
                    </option>
                  </Select>
                </div>

                <div className="pl-12">
                  <div className="text-[10px] opacity-50">
                    Velocity set to 127
                  </div>
                </div>
              </>
            )}

            {normalizedInputType === "osc" && (
              <>
                <div className="pl-12">
                  <div className="mb-1 text-[11px] relative inline-block">
                    <span className="opacity-50">OSC Port:</span>
                    <HelpIcon helpText={HELP_TEXT.oscPort} />
                  </div>
                  <NumberInput
                    id="oscPort"
                    value={inputConfig.port}
                    onChange={(e) =>
                      setInputConfig({
                        ...inputConfig,
                        port: parseInt(e.target.value) || 8000,
                      })
                    }
                    className="py-1 w-full"
                    min={1024}
                    max={65535}
                  />
                </div>

                <div className="pl-12">
                  <div className="text-[10px] opacity-50">
                    Send OSC to: localhost:{inputConfig.port}
                  </div>
                </div>
              </>
            )}

            <div className="pl-12">
              <div className="opacity-50 mb-1 text-[11px]">
                Global Input Mappings:
              </div>
              <Button onClick={onOpenMappings} className="w-full">
                CONFIGURE MAPPINGS
              </Button>
            </div>
          </>
        )}

        {config.sequencerMode && (
          <div className="pl-12">
            <div className="mb-1 text-[11px] relative inline-block">
              <span className="opacity-50">Sequencer BPM:</span>
              <HelpIcon helpText={HELP_TEXT.sequencerBpm} />
            </div>
            <DraftIntInput
              value={config.sequencerBpm ?? 120}
              fallback={config.sequencerBpm ?? 120}
              onCommit={(next) => updateConfig({ sequencerBpm: next })}
              step={1}
              className="py-1 w-full"
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>

      <ProjectorSettings
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        bgColor={bgColor}
        setBgColor={setBgColor}
        settings={settings}
        config={config}
        updateConfig={updateConfig}
      />

      <UserColors config={config} updateConfig={updateConfig} />

      <div className="flex flex-col gap-2 font-mono border-t border-neutral-800 pt-6">
        <div className="pl-12">
          <div className="opacity-50 mb-1 text-[11px]">Project Folder:</div>
          <div className="text-[11px] text-neutral-300/70 break-all">
            {workspacePath || "Not set"}
          </div>
        </div>
        <div className="pl-12">
          <Button onClick={onSelectWorkspace} className="w-full">
            {workspacePath ? "OPEN ANOTHER PROJECT" : "OPEN PROJECT"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal = ({
  isOpen,
  onClose,
  aspectRatio,
  setAspectRatio,
  bgColor,
  setBgColor,
  settings,
  inputConfig,
  setInputConfig,
  availableMidiDevices,
  availableAudioDevices,
  refreshAudioDevices,
  audioCaptureState,
  fileAudioState,
  onOpenMappings,
  config,
  updateConfig,
  workspacePath,
  onSelectWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="SETTINGS" onClose={onClose} />

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "audio-reactive" && (
        <AudioReactiveSettings config={config} updateConfig={updateConfig} isOpen={isOpen} />
      )}

      {activeTab === "general" && (
        <GeneralSettings
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          bgColor={bgColor}
          setBgColor={setBgColor}
          settings={settings}
          inputConfig={inputConfig}
          setInputConfig={setInputConfig}
          availableMidiDevices={availableMidiDevices}
          availableAudioDevices={availableAudioDevices}
          refreshAudioDevices={refreshAudioDevices}
          audioCaptureState={audioCaptureState}
          fileAudioState={fileAudioState}
          onOpenMappings={onOpenMappings}
          config={config}
          updateConfig={updateConfig}
          workspacePath={workspacePath}
          onSelectWorkspace={onSelectWorkspace}
          isOpen={isOpen}
        />
      )}
    </Modal>
  );
};
