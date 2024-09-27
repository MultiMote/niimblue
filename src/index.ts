import "./style.scss";
import "@popperjs/core";
import "bootstrap/js/dist/dropdown";
import App from "./App.svelte";
// import "@fontsource/material-icons";

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
