import Toastify from "toastify-js";
import { z } from "zod";

export class Toasts {
  static error(e: any) {
    Toastify({
      text: `${e}`,
      gravity: "bottom",
      duration: 5000,
      className: "toast-danger",
    }).showToast();
  }

  static zodErrors(e: any, prefix: string) {
    if (e instanceof z.ZodError) {
      console.error(e);
      e.issues.forEach((i) => {
        this.error(`${prefix} "${i.path.join("→")}" ${i.message}`);
      });
    }
  }
}
