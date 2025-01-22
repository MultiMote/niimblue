<script lang="ts">
  import * as fabric from "fabric";
  import { tr } from "../utils/i18n";
  import MdIcon from "./basic/MdIcon.svelte";

  export let selectedObject: fabric.FabricObject;
  export let valueUpdated: () => void;

  const putToCenterV = () => {
    selectedObject.canvas!.centerObjectV(selectedObject);
    valueUpdated();
  };

  const putToCenterH = () => {
    selectedObject.canvas!.centerObjectH(selectedObject);
    valueUpdated();
  };

  const fit = () => {
    selectedObject.set({
      left: 0,
      top: 0,
      scaleX: selectedObject.canvas!.width / selectedObject.width,
      scaleY: selectedObject.canvas!.height / selectedObject.height,
    });
    valueUpdated();
  };
</script>

<button class="btn btn-sm btn-secondary" on:click={putToCenterV} title={$tr("params.generic.center.vertical")}>
  <MdIcon icon="vertical_distribute" />
</button>
<button class="btn btn-sm btn-secondary" on:click={putToCenterH} title={$tr("params.generic.center.horizontal")}>
  <MdIcon icon="horizontal_distribute" />
</button>
{#if selectedObject instanceof fabric.FabricImage}
  <button class="btn btn-sm btn-secondary" on:click={fit} title={$tr("params.generic.fit")}>
    <MdIcon icon="fit_screen" />
  </button>
{/if}
