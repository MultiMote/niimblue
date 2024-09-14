import "./style.scss";
import "@popperjs/core";
import "bootstrap/js/dist/dropdown";
import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
