<script lang="ts">
  import { fabric } from "fabric";
  import { tr } from "../utils/i18n";
  import MdIcon from "./MdIcon.svelte";

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
  <MdIcon icon="vertical_distribute"/>
</button>
<button class="btn btn-sm btn-secondary" on:click={putToCenterH} title={$tr("params.generic.center.horizontal", "Center horizontally")}>
  <MdIcon icon="horizontal_distribute"/>
</button>

<style>
</style>
