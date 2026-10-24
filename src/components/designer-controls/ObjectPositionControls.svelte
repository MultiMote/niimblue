<script lang="ts">
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { tr } from "$/utils/i18n";
  import * as fabric from "fabric";
  import { onDestroy, untrack } from "svelte";
  import QRCode from "$/fabric-object/qrcode";
  import Barcode from "$/fabric-object/barcode";

  interface Props {
    selectedObject: fabric.FabricObject;
    /** Changes whenever something edits the object from outside (center buttons, arrow keys, ...) */
    editRevision?: number;
  }

  let { selectedObject, editRevision }: Props = $props();
  let prevObject: fabric.FabricObject | undefined;
  let prevCanvas: fabric.Canvas | undefined;

  let x = $state<number>();
  let y = $state<number>();
  let width = $state<number>();
  let height = $state<number>();
  let widthScaled = $state<number>();
  let heightScaled = $state<number>();
  let keepAspectRatio = $state<boolean>(false);

  // Images and circles are resized through scaleX/scaleY, not through width/height
  // (a circle is drawn from its radius, so changing width/height only grows its selection box).
  const usesScaledSize = $derived(
    selectedObject instanceof fabric.FabricImage || selectedObject instanceof fabric.Circle,
  );

  const objectDimensionsChanged = (e?: fabric.ModifiedEvent) => {
    const pos = selectedObject.getPointByOrigin("left", "top");
    x = pos.x;
    y = pos.y;
    width = selectedObject.width;
    height = selectedObject.height;

    updateScales(e?.action);
  };

  /** Re-read the values from the object without touching the aspect ratio toggle */
  const syncFromObject = () => {
    const pos = selectedObject.getPointByOrigin("left", "top");
    x = pos.x;
    y = pos.y;
    width = selectedObject.width;
    height = selectedObject.height;
    widthScaled = Math.round(width * selectedObject.scaleX);
    heightScaled = Math.round(height * selectedObject.scaleY);
  };

  /** Show the position live while the object is dragged (runs after the snapping handler) */
  const canvasObjectMoving = (e: { target: fabric.FabricObject }) => {
    if (e.target !== selectedObject) return;
    const pos = selectedObject.getPointByOrigin("left", "top");
    x = pos.x;
    y = pos.y;
  };

  const objectChanged = (newObject: fabric.FabricObject) => {
    if (prevObject !== undefined) {
      prevObject.off("modified", objectDimensionsChanged);
    }
    prevCanvas?.off("object:moving", canvasObjectMoving);

    newObject.on("modified", objectDimensionsChanged);
    prevCanvas = newObject.canvas;
    prevCanvas?.on("object:moving", canvasObjectMoving);
    objectDimensionsChanged();

    prevObject = newObject;
  };

  const updateObject = (e: Event, source?: "width" | "height") => {
    // Inputs are applied live (oninput): skip transient empty/invalid values while typing.
    if (![x, y, width, height, widthScaled, heightScaled].every(Number.isFinite)) return;

    const newPos = new fabric.Point(Math.round(x!), Math.round(y!));

    selectedObject.setPositionByOrigin(newPos, "left", "top");

    if (usesScaledSize) {
      if (keepAspectRatio) {
        let scale = source === "width" ? widthScaled! / selectedObject.width! : heightScaled! / selectedObject.height!;

        selectedObject.scaleX = scale;
        selectedObject.scaleY = scale;
      } else {
        selectedObject.scaleX = widthScaled! / selectedObject.width!;
        selectedObject.scaleY = heightScaled! / selectedObject.height!;
      }

      updateScales();
    } else
      selectedObject.set({
        width: Math.round(Math.max(width!, 1)),
        height: Math.round(Math.max(height!, 1)),
      });

    selectedObject.setCoords();
    selectedObject.canvas?.requestRenderAll();
  };

  const toggleAspectRatio = (e: Event) => {
    if (keepAspectRatio) {
      selectedObject.scaleX = Math.min(selectedObject.scaleX, selectedObject.scaleY);
      selectedObject.scaleY = selectedObject.scaleX;
      updateScales();

      updateObject(e);
    }
  };

  const updateScales = (action?: string) => {
    widthScaled = Math.round(width! * selectedObject.scaleX);
    heightScaled = Math.round(height! * selectedObject.scaleY);

    if (action === "scaleX" || action === "scaleY") keepAspectRatio = false;
    if ((action === "scale" || action === undefined) && selectedObject.scaleX === selectedObject.scaleY)
      keepAspectRatio = true;
  };

  onDestroy(() => {
    selectedObject.off("modified", objectDimensionsChanged);
    prevCanvas?.off("object:moving", canvasObjectMoving);
  });

  // The object was changed from outside (center buttons, arrow keys, ...): refresh the inputs.
  $effect(() => {
    void editRevision;
    untrack(() => syncFromObject());
  });

  $effect(() => {
    const obj = selectedObject;
    // Only re-sync when the selected object changes. Without untrack the effect also tracks
    // width/height (read in updateScales) and resets the inputs on every keystroke.
    untrack(() => objectChanged(obj));
  });
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
      <input class="form-control" type="number" bind:value={x} oninput={updateObject} />
    </div>
    <div class="input-group flex-nowrap input-group-sm mb-2">
      <span class="input-group-text">y</span>
      <input class="form-control" type="number" bind:value={y} oninput={updateObject} />
    </div>
    {#if !(selectedObject instanceof fabric.FabricText || usesScaledSize || selectedObject instanceof QRCode || selectedObject instanceof Barcode)}
      <div class="input-group flex-nowrap input-group-sm mb-2">
        <input class="form-control" type="number" min="1" bind:value={width} oninput={updateObject} />
        <span class="input-group-text">x</span>
        <input class="form-control" type="number" min="1" bind:value={height} oninput={updateObject} />
      </div>
    {/if}
    {#if usesScaledSize}
      <div class="input-group flex-nowrap input-group-sm mb-2">
        <input
          class="form-control"
          type="number"
          min="1"
          bind:value={widthScaled}
          oninput={(e) => updateObject(e, "width")} />
        <span class="input-group-text">x</span>
        <input
          class="form-control"
          type="number"
          min="1"
          bind:value={heightScaled}
          oninput={(e) => updateObject(e, "height")} />
      </div>
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          id="keepImageAspectRatio"
          bind:checked={keepAspectRatio}
          onchange={toggleAspectRatio} />
        <label class="form-check-label" for="keepImageAspectRatio" style="text-wrap: nowrap">
          {$tr("params.generic.keepAspectRatio")}</label>
      </div>
    {/if}
  </div>
</div>
