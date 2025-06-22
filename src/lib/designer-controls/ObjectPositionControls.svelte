<script lang="ts">
  import MdIcon from "../basic/MdIcon.svelte";
  import { tr } from "../../utils/i18n";
  import * as fabric from "fabric";
  import { onDestroy } from "svelte";
  import QRCode from "../../fabric-object/qrcode";
  import Barcode from "../../fabric-object/barcode";

  export let selectedObject: fabric.FabricObject;
  let prevObject: fabric.FabricObject | undefined;

  let x: number;
  let y: number;
  let width: number;
  let height: number;

  const objectDimensionsChanged = () => {
    const pos = selectedObject.getPointByOrigin("left", "top");
    x = pos.x;
    y = pos.y;
    width = selectedObject.width;
    height = selectedObject.height;
  };

  const objectChanged = (newObject: fabric.FabricObject) => {
    if (prevObject !== undefined) {
      prevObject.off("modified", objectDimensionsChanged);
    }

    newObject.on("modified", objectDimensionsChanged);
    objectDimensionsChanged();

    prevObject = newObject;
  };

  const updateObject = () => {
    const newPos = new fabric.Point(Math.round(Math.max(x, 1)), Math.round(Math.max(y, 1)));

    selectedObject.setPositionByOrigin(newPos, "left", "top");

    selectedObject.set({
      width: Math.round(Math.max(width, 1)),
      height: Math.round(Math.max(height, 1)),
    });

    selectedObject.setCoords();
    selectedObject.canvas?.requestRenderAll();
  };

  onDestroy(() => selectedObject.off("modified", objectDimensionsChanged));

  $: objectChanged(selectedObject);
</script>

<div class="dropdown">
  <button
    class="btn btn-sm btn-secondary dropdown-toggle"
    type="button"
    data-bs-toggle="dropdown"
    title={$tr("params.generic.position")}>
    <MdIcon icon="control_camera" />
  </button>
  <div class="dropdown-menu arrangement p-2">
    <div class="input-group flex-nowrap input-group-sm mb-2">
      <span class="input-group-text">x</span>
      <input class="form-control" type="number" min="1" bind:value={x} on:change={updateObject} />
    </div>
    <div class="input-group flex-nowrap input-group-sm mb-2">
      <span class="input-group-text">y</span>
      <input class="form-control" type="number" min="1" bind:value={y} on:change={updateObject} />
    </div>
    {#if !(selectedObject instanceof fabric.FabricText || selectedObject instanceof fabric.FabricImage || selectedObject instanceof QRCode || selectedObject instanceof Barcode)}
      <div class="input-group flex-nowrap input-group-sm mb-2">
        <input class="form-control" type="number" min="1" bind:value={width} on:change={updateObject} />
        <span class="input-group-text">x</span>
        <input class="form-control" type="number" min="1" bind:value={height} on:change={updateObject} />
      </div>
    {/if}
  </div>
</div>
