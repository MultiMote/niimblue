import Toastify from "toastify-js";
import { z } from "zod";

export class Toasts {
  static error(e: any) {
    console.error(e);

    Toastify({
      text: `${e}`,
      gravity: "bottom",
      duration: 5000,
      className: "toast-danger",
    }).showToast();
  }

  static message(text: string) {
    Toastify({
      text,
      gravity: "bottom",
      duration: 5000,
      className: "toast-info",
    }).showToast();
  }

  static zodErrors(e: any, prefix: string) {
    if (e instanceof z.ZodError) {
      e.issues.forEach((i) => {
        this.error(`${prefix} "${i.path.join("→")}" ${i.message}`);
      });
    }
  }
}
