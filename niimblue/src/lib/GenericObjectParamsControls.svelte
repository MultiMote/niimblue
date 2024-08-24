<script lang="ts">
  import { fabric } from "fabric";
  import FaIcon from "./FaIcon.svelte";

  export let selectedObject: fabric.Object;
  export let valueUpdated: () => void;

  const putToCenterV = () => {
    selectedObject.canvas?.centerObjectH(selectedObject);
    selectedObject.centerV();
    valueUpdated();
  };

  const putToCenterH = () => {
    selectedObject.centerH();
    valueUpdated();
  };
</script>

<button class="btn btn-sm btn-secondary" on:click={putToCenterV} title="Center vertically">
  <FaIcon icon="up-down" />
</button>
<button class="btn btn-sm btn-secondary" on:click={putToCenterH} title="Center horizontally">
  <FaIcon icon="left-right" />
</button>

<style>
</style>
