<script lang="ts">
  import * as fabric from "fabric";
  import { tr } from "../../utils/i18n";
  import MdIcon from "../basic/MdIcon.svelte";
  import { appConfig } from "../../stores";
  import ObjectPositionControls from "./ObjectPositionControls.svelte";

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

  const bringTo = (to: "top" | "bottom") => {
    if (to === "top") {
      selectedObject.canvas?.bringObjectToFront(selectedObject);
    } else if (to === "bottom") {
      selectedObject.canvas?.sendObjectToBack(selectedObject);
    }
  };

  const fit = () => {
    const imageRatio = selectedObject.width / selectedObject.height;
    const canvasRatio = selectedObject.canvas!.width / selectedObject.canvas!.height;

    if ($appConfig.fitMode === "ratio_min") {
      if (imageRatio > canvasRatio) {
        selectedObject.scaleToWidth(selectedObject.canvas!.width);
      } else {
        selectedObject.scaleToHeight(selectedObject.canvas!.height);
      }
      selectedObject.canvas!.centerObject(selectedObject);
    } else if ($appConfig.fitMode === "ratio_max") {
      if (imageRatio > canvasRatio) {
        selectedObject.scaleToHeight(selectedObject.canvas!.height);
      } else {
        selectedObject.scaleToWidth(selectedObject.canvas!.width);
      }
      selectedObject.canvas!.centerObject(selectedObject);
    } else {
      selectedObject.set({
        left: 0,
        top: 0,
        scaleX: selectedObject.canvas!.width / selectedObject.width,
        scaleY: selectedObject.canvas!.height / selectedObject.height,
      });
    }
    valueUpdated();
  };

  const fitModeChanged = (e: Event & { currentTarget: HTMLSelectElement }) => {
    const fitMode = e.currentTarget.value as "stretch" | "ratio_min" | "ratio_max";
    appConfig.update((v) => ({ ...v, fitMode: fitMode }));
  };
</script>

<button class="btn btn-sm btn-secondary" on:click={putToCenterV} title={$tr("params.generic.center.vertical")}>
  <MdIcon icon="vertical_distribute" />
</button>
<button class="btn btn-sm btn-secondary" on:click={putToCenterH} title={$tr("params.generic.center.horizontal")}>
  <MdIcon icon="horizontal_distribute" />
</button>

<ObjectPositionControls {selectedObject} />

<div class="dropdown">
  <button
    class="btn btn-sm btn-secondary dropdown-toggle"
    type="button"
    data-bs-toggle="dropdown"
    title={$tr("params.generic.arrange")}>
    <MdIcon icon="segment" />
  </button>
  <div class="dropdown-menu arrangement p-2">
    <button class="btn btn-sm" on:click={() => bringTo("top")}>
      {$tr("params.generic.arrange.top")}
    </button>
    <button class="btn btn-sm" on:click={() => bringTo("bottom")}>
      {$tr("params.generic.arrange.bottom")}
    </button>
  </div>
</div>

{#if selectedObject instanceof fabric.FabricImage}
  <div class="btn-group btn-group-sm">
    <button type="button" class="btn btn-secondary" on:click={fit} title={$tr("params.generic.fit")}>
      <MdIcon icon="fit_screen" />
    </button>
    <button type="button" class="btn btn-secondary dropdown-toggle dropdown-toggle-split px-1" data-bs-toggle="dropdown"
    ></button>
    <div class="dropdown-menu p-1">
      <select class="form-select form-select-sm" value={$appConfig.fitMode ?? "stretch"} on:change={fitModeChanged}>
        <option value="stretch">{$tr("params.generic.fit.mode.stretch")}</option>
        <option value="ratio_min">{$tr("params.generic.fit.mode.ratio_min")}</option>
        <option value="ratio_max">{$tr("params.generic.fit.mode.ratio_max")}</option>
      </select>
    </div>
  </div>
{/if}

<style>
  .dropdown-menu.arrangement {
    text-align: center;
  }
</style>
