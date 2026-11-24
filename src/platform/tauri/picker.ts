import { get, writable } from "svelte/store";
import type { BleDevice } from "@mnlphlp/plugin-blec";

interface BlePickerState {
  show: boolean;
  resolve: ((device: BleDevice | null) => void) | null;
}

export const blePickerState = writable<BlePickerState>({
  show: false,
  resolve: null,
});

/**
 * Open the BLE device picker and wait for the user to choose a device.
 * Resolves to `null` when the dialog is closed without a selection.
 */
export const requestBleDevice = (): Promise<BleDevice | null> =>
  new Promise((resolve) => {
    const previous = get(blePickerState);
    previous.resolve?.(null);

    blePickerState.set({ show: true, resolve });
  });

export const closeBlePicker = (device: BleDevice | null): void => {
  const { resolve } = get(blePickerState);

  blePickerState.set({ show: false, resolve: null });
  resolve?.(device);
};

/** A serial port chosen in the picker. */
export interface SerialPortPick {
  /** Port path (COM3, /dev/ttyUSB0, ...). */
  path: string;
  /** Human-readable port description. */
  name: string;
}

interface SerialPickerState {
  show: boolean;
  resolve: ((port: SerialPortPick | null) => void) | null;
}

export const serialPickerState = writable<SerialPickerState>({
  show: false,
  resolve: null,
});

/**
 * Open the serial port picker and wait for the user to choose a port.
 * Resolves to `null` when the dialog is closed without a selection.
 */
export const requestSerialDevice = (): Promise<SerialPortPick | null> =>
  new Promise((resolve) => {
    const previous = get(serialPickerState);
    previous.resolve?.(null);

    serialPickerState.set({ show: true, resolve });
  });

export const closeSerialPicker = (port: SerialPortPick | null): void => {
  const { resolve } = get(serialPickerState);

  serialPickerState.set({ show: false, resolve: null });
  resolve?.(port);
};
