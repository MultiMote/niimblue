<script lang="ts">
  import { iconCodepoints, type MaterialIcon } from "../../mdi_icons";
  export let icon: MaterialIcon;
</script>

<span class="mdi {$$restProps.class || ''}">
  {String.fromCodePoint(iconCodepoints[icon])}
</span>

<style>
  .mdi {
    font-family: "Material Icons";
    font-weight: normal;
    font-style: normal;
    line-height: 1;
    font-size: 1.5em;
    vertical-align: -0.24em;
    /*vertical-align: middle;*/
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "liga";
  }

  .mdi.r-90 {
    transform: rotate(90deg);
  }
</style>
