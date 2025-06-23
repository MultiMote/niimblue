<script lang="ts">
  import { tr } from "../../utils/i18n";
  import MdIcon from "../basic/MdIcon.svelte";
  import * as fabric from "fabric";

  export let selectedObject: fabric.FabricObject | undefined;
  export let valueUpdated: () => void;

  const roundRadiusChanged = (value: number) => {
    const rect = selectedObject as fabric.Rect;
    rect.set({
      rx: value,
      ry: value,
    });
    valueUpdated();
  };

  const strokeWidthChanged = (value: number) => {
    selectedObject!.set({ strokeWidth: value });
    valueUpdated();
  };

  const fillChanged = (value: string) => {
    selectedObject!.set({ fill: value });
    valueUpdated();
  };
</script>

{#if selectedObject instanceof fabric.Rect}
  <div class="input-group flex-nowrap input-group-sm">
    <span class="input-group-text" title={$tr("params.vector.round_radius")}>
      <MdIcon icon="rounded_corner" />
    </span>
    <input
      type="number"
      min="0"
      max={Math.min(selectedObject.width, selectedObject.height) / 2}
      class="form-control"
      value={selectedObject.rx}
      on:input={(e) => roundRadiusChanged(e.currentTarget.valueAsNumber)} />
  </div>
{/if}

{#if selectedObject instanceof fabric.Rect || selectedObject instanceof fabric.Circle || selectedObject instanceof fabric.Line}
  <div class="input-group flex-nowrap input-group-sm">
    <span class="input-group-text" title={$tr("params.vector.stroke_width")}>
      <MdIcon icon="line_weight" />
    </span>
    <input
      type="number"
      min="1"
      class="form-control"
      value={selectedObject.strokeWidth}
      on:input={(e) => strokeWidthChanged(e.currentTarget.valueAsNumber)} />
  </div>
{/if}

{#if selectedObject instanceof fabric.Rect || selectedObject instanceof fabric.Circle}
  <div class="input-group input-group-sm flex-nowrap fill">
    <span class="input-group-text" title={$tr("params.vector.fill")}>
      <MdIcon icon="format_color_fill" />
    </span>
    <select
      class="form-select"
      value={selectedObject.fill}
      on:change={(e) => fillChanged(e.currentTarget.value)}>
      <option value="transparent">{$tr("params.color.transparent")}</option>
      <option value="white">{$tr("params.color.white")}</option>
      <option value="black">{$tr("params.color.black")}</option>
    </select>
  </div>
{/if}

<style>
  .input-group {
    width: 7em;
  }
  .input-group.fill {
    width: 12em;
  }
</style>
