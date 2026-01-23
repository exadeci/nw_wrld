declare module "webmidi" {
  export interface MidiNote {
    number: number;
  }

  export interface MidiMessage {
    channel: number;
  }

  export interface MidiController {
    number: number;
  }

  export interface NoteOnEvent {
    note: MidiNote;
    message: MidiMessage;
    velocity: number;
  }

  export interface ControlChangeEvent {
    controller: MidiController;
    message: MidiMessage;
    value: number;
  }

  export interface MidiInput {
    id: string;
    name: string;
    manufacturer?: string;
    addListener(event: "noteon", handler: (e: NoteOnEvent) => void): void;
    addListener(event: "controlchange", handler: (e: ControlChangeEvent) => void): void;
    removeListener(): void;
    removeListener(event: "noteon"): void;
    removeListener(event: "controlchange"): void;
  }

  export interface WebMidiStatic {
    enabled: boolean;
    inputs: MidiInput[];
    enable(callback: (err: Error | null) => void): void;
    disable(): void | Promise<void>;
    getInputById?(id: string): MidiInput | null;
    getInputByName(name: string): MidiInput | null;
  }

  export const WebMidi: WebMidiStatic;
}

declare module "osc" {
  export interface OscArg {
    value: number | string | boolean | null;
  }

  export interface OscMessage {
    address: string;
    args?: OscArg[];
  }

  export interface OscError extends Error {
    code?: string;
  }

  export interface UDPPortOptions {
    localAddress: string;
    localPort: number;
    metadata: boolean;
  }

  export class UDPPort {
    constructor(options: UDPPortOptions);
    on(event: "ready", handler: () => void): void;
    on(event: "message", handler: (msg: OscMessage) => void): void;
    on(event: "error", handler: (err: OscError) => void): void;
    open(): void;
    close(): void;
  }
}
