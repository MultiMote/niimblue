import "./style.scss";
import "@popperjs/core";
import "toastify-js/src/toastify.css";
import "bootstrap/js/dist/dropdown";
import "bootstrap/js/dist/collapse";
import App from "./App.svelte";
import { config as FabricConfig } from "fabric";

FabricConfig.disableStyleCopyPaste = true;

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
