import { writable } from "svelte/store";

export type ConfirmButton = "ok" | "yes" | "no" | "cancel";

interface ConfirmOptions {
  title: string;
  message?: string;
  buttons?: ConfirmButton[];
  defaultButton?: ConfirmButton;
}

interface ConfirmState extends ConfirmOptions {
  show: boolean;
  resolve: ((value: ConfirmButton | null) => void) | null;
}

export const confirmState = writable<ConfirmState>({
  show: false,
  title: "",
  message: "",
  buttons: ["ok"],
  defaultButton: "ok",
  resolve: null,
});

export function appConfirm({
  title,
  message = "",
  buttons = ["ok"],
  defaultButton = "ok",
}: ConfirmOptions): Promise<ConfirmButton | null> {
  return new Promise((resolve) => {
    const availableButtons = [...new Set(buttons)];

    confirmState.set({
      show: true,
      title,
      message,
      buttons: availableButtons,
      defaultButton: availableButtons.includes(defaultButton) ? defaultButton : (availableButtons[0] ?? "ok"),
      resolve,
    });
  });
}
