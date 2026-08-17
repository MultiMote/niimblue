<script lang="ts">
  import * as fabric from "fabric";
  import { ArUcoMarker } from "$/fabric-object/aruco";
  import { Barcode } from "$/fabric-object/barcode";
  import { QRCode } from "$/fabric-object/qrcode";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { tr } from "$/utils/i18n";
  import type { MaterialIcon } from "$/styles/mdi_icons";
  import { CustomCanvas } from "$/fabric-object/custom_canvas";

  interface Props {
    canvas: CustomCanvas | undefined;
    selectedObject: fabric.FabricObject | undefined;
    editRevision: number;
    onVisibilityChange?: () => void;
  }

  let { canvas, selectedObject, editRevision, onVisibilityChange }: Props = $props();

  const iconFor = (obj: fabric.FabricObject): MaterialIcon => {
    if (obj instanceof fabric.IText) return "title";
    if (obj instanceof QRCode) return "qr_code_2";
    if (obj instanceof Barcode) return "view_week";
    if (obj instanceof ArUcoMarker) return "grid_on";
    if (obj instanceof fabric.FabricImage) return "image";
    if (obj instanceof fabric.Circle || obj instanceof fabric.Ellipse) return "radio_button_unchecked";
    if (obj instanceof fabric.Line || obj instanceof fabric.Polyline) return "remove";
    if (obj instanceof fabric.Rect) return "crop_square";
    return "layers";
  };

  const labelFor = (obj: fabric.FabricObject): string => {
    if (obj instanceof fabric.IText) return obj.text?.trim() || $tr("editor.objectpicker.text");
    if (obj instanceof QRCode) return $tr("editor.objectpicker.qrcode");
    if (obj instanceof Barcode) return $tr("editor.objectpicker.barcode");
    if (obj instanceof ArUcoMarker) return $tr("editor.objectpicker.aruco");
    if (obj instanceof fabric.FabricImage) return $tr("editor.objectpicker.image");
    if (obj instanceof fabric.Ellipse) return $tr("editor.objectpicker.ellipse");
    if (obj instanceof fabric.Circle) return $tr("editor.objectpicker.circle");
    if (obj instanceof fabric.Line || obj instanceof fabric.Polyline) return $tr("editor.objectpicker.line");
    if (obj instanceof fabric.Rect) return $tr("editor.objectpicker.rectangle");
    return obj.type ?? "object";
  };

  let visEpoch = $state(0);
  let objectIds = new WeakMap<fabric.FabricObject, number>();
  let nextObjectId = 1;

  const idFor = (obj: fabric.FabricObject) => {
    let id = objectIds.get(obj);
    if (id === undefined) {
      id = nextObjectId++;
      objectIds.set(obj, id);
    }
    return id;
  };

  let rows = $derived.by(() => {
    void editRevision;
    void visEpoch;
    const list = canvas?.getObjects() ?? [];
    return [...list].reverse().map((obj, i, arr) => ({
      obj,
      id: idFor(obj),
      hidden: obj.visible === false,
      label: labelFor(obj),
      index: arr.length - i,
    }));
  });

  const selectObject = (obj: fabric.FabricObject) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
  };

  const toggleVisible = (obj: fabric.FabricObject, e: MouseEvent) => {
    e.stopPropagation();
    obj.set({ visible: obj.visible === false });
    obj.dirty = true;
    canvas?.requestRenderAll();
    visEpoch += 1;
    onVisibilityChange?.();
  };
</script>

<div class="d-flex flex-column gap-1">
  {#if rows.length === 0}
    <div class="text-secondary small">{$tr("ui.objects.empty")}</div>
  {:else}
    {#each rows as row (`${row.id}:${row.label}:${row.hidden}`)}
      <div class="object-item {selectedObject === row.obj ? 'active' : ''} {row.hidden ? 'is-hidden' : ''}">
        <button class="object-select" type="button" onclick={() => selectObject(row.obj)}>
          <MdIcon icon={iconFor(row.obj)} />
          <span class="text-truncate">{row.label}</span>
        </button>
        <span class="object-index text-secondary small">{row.index}</span>
        <button
          class="object-vis {row.hidden ? 'off' : 'on'}"
          type="button"
          title={row.hidden ? $tr("ui.objects.show") : $tr("ui.objects.hide")}
          onclick={(e) => toggleVisible(row.obj, e)}>
          <MdIcon icon={row.hidden ? "visibility_off" : "visibility"} />
        </button>
      </div>
    {/each}
  {/if}
</div>

<style>
  .object-item.is-hidden .object-select,
  .object-item.is-hidden .object-index {
    color: var(--nb-muted);
    opacity: 0.4;
  }

  .object-item.is-hidden .object-select :global(.mdi) {
    color: var(--nb-muted);
  }

  .object-vis.on :global(.mdi) {
    color: var(--nb-muted);
  }

  .object-vis.off :global(.mdi) {
    color: var(--nb-muted);
    opacity: 0.35;
  }
</style>

