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
