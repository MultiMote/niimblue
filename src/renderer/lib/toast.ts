import { writable } from "svelte/store";

export type ToastKind = "info" | "success" | "error" | "warning";

export type Toast = {
  id: number;
  message: string;
  kind: ToastKind;
  ttl: number;
};

export const toasts = writable<Toast[]>([]);

let nextId = 1;

export const toast = (message: string, kind: ToastKind = "info", ttl = 4000) => {
  const id = nextId++;
  toasts.update((list) => [...list, { id, message, kind, ttl }]);
  if (ttl > 0) {
    setTimeout(() => dismiss(id), ttl);
  }
};

export const dismiss = (id: number) => {
  toasts.update((list) => list.filter((t) => t.id !== id));
};
