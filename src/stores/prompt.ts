
import { writable } from "svelte/store";

interface PromptOptions {
  title: string;
  message?: string;
  defaultValue?: string;
  multiline?: boolean;
}

interface PromptState extends PromptOptions {
  show: boolean;
  resolve: ((value: string | null) => void) | null;
}

export const promptState = writable<PromptState>({
  show: false,
  title: "",
  message: "",
  defaultValue: "",
  multiline: false,
  resolve: null,
});

export function appPrompt({
  title,
  message = "",
  defaultValue = "",
  multiline = false,
}: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    promptState.set({
      show: true,
      title,
      message,
      defaultValue,
      multiline,
      resolve,
    });
  });
}
