import "./style.scss";
import "@popperjs/core";
import "toastify-js/src/toastify.css"
import "bootstrap/js/dist/dropdown";
import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
