<script lang="ts">
  import { fabric } from "fabric";
  import FaIcon from "./FaIcon.svelte";
  import { tr } from "../utils/i18n";

  export let selectedObject: fabric.Object;
  export let valueUpdated: () => void;

  const putToCenterV = () => {
    selectedObject.centerV();
    valueUpdated();
  };

  const putToCenterH = () => {
    selectedObject.centerH();
    valueUpdated();
  };
</script>

<button class="btn btn-sm btn-secondary" on:click={putToCenterV} title={$tr("params.generic.center.vertical", "Center vertically")}>
  <FaIcon icon="up-down" />
</button>
<button class="btn btn-sm btn-secondary" on:click={putToCenterH} title={$tr("params.generic.center.horizontal", "Center horizontally")}>
  <FaIcon icon="left-right" />
</button>

<style>
</style>
