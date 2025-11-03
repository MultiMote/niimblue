import "./style.scss";
import "@popperjs/core";
import "toastify-js/src/toastify.css";
import "bootstrap/js/dist/dropdown";
import "bootstrap/js/dist/collapse";
import App from "./App.svelte";
import { config as FabricConfig } from "fabric";
import { mount } from "svelte";

FabricConfig.disableStyleCopyPaste = true;

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
