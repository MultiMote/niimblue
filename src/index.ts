import "$/styles/style.scss";
import "@popperjs/core";
import "toastify-js/src/toastify.css";
import "bootstrap/js/dist/dropdown";
import "bootstrap/js/dist/collapse";
import App from "$/App.svelte";
import { mount } from "svelte";
import { configureFabric } from "$/defaults";
import { initI18n } from "$/utils/i18n";

configureFabric();

const app = initI18n()
  .catch((e: unknown) => console.error("Unable to initialize i18n:", e))
  .then(() =>
    mount(App, {
      target: document.getElementById("app")!,
    }),
  );

export default app;
