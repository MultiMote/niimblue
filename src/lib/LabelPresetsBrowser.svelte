<script lang="ts">
  import type { LabelPreset } from "../types";
  import { tr } from "../utils/i18n";
  import MdIcon from "./MdIcon.svelte";

  export let onItemSelected: (index: number) => void;
  export let onItemDelete: (index: number) => void;
  export let presets: LabelPreset[];
  let deleteIndex: number = -1;

  const scaleDimensions = (preset: LabelPreset): { width: number; height: number } => {
    const scaleFactor = Math.min(100 / preset.width, 100 / preset.height);
    return {
      width: Math.round(preset.width * scaleFactor),
      height: Math.round(preset.height * scaleFactor),
    };
  };

  const deleteConfirmed = (e: MouseEvent, idx: number) => {
    e.stopPropagation();
    deleteIndex = -1;
    onItemDelete(idx);
  };

  const deleteRejected = (e: MouseEvent, idx: number) => {
    e.stopPropagation();
    deleteIndex = -1;
  };

  const deleteRequested = (e: MouseEvent, idx: number) => {
    e.stopPropagation();
    deleteIndex = idx;
  };
</script>

<div class="preset-browser overflow-y-auto border d-flex gap-1 flex-wrap {$$props.class}">
  {#each presets as item, idx}
    <button
      class="btn p-0 card-wrapper d-flex justify-content-center align-items-center"
      on:click={() => onItemSelected(idx)}>
      <div
        class="card print-start-{item.printDirection} d-flex justify-content-center align-items-center"
        style="width: {scaleDimensions(item).width}%; height: {scaleDimensions(item).height}%;">
        <div class="remove d-flex">
          {#if deleteIndex === idx}
            <button class="remove btn text-danger-emphasis" on:click={(e) => deleteConfirmed(e, idx)}>
              <MdIcon icon="delete" />
            </button>
            <button class="remove btn text-success" on:click={(e) => deleteRejected(e, idx)}>
              <MdIcon icon="close" />
            </button>
          {:else}
            <button class="remove btn text-danger-emphasis" on:click={(e) => deleteRequested(e, idx)}>
              <MdIcon icon="delete" />
            </button>
          {/if}
        </div>

        <span class="label p-1">
          {#if item.title}
            {item.title}
          {:else}
            {item.width}x{item.height}{#if item.unit === "mm"}{$tr("params.label.mm")}{:else if item.unit === "px"}{$tr(
                "params.label.px",
              )}{/if}
          {/if}
        </span>
      </div>
    </button>
  {/each}
</div>

<style>
  .preset-browser {
    max-height: 200px;
    max-width: 100%;
    min-height: 96px;
  }

  .card-wrapper {
    width: 96px;
    height: 96px;
  }

  .card {
    background-color: white;
    position: relative;
  }

  .card > .remove {
    position: absolute;
    top: 0;
    right: 0;
  }

  .card > .remove > button {
    padding: 0;
    line-height: 100%;
  }

  .card > .label {
    background-color: rgba(255, 255, 255, 0.8);
    color: black;
    border-radius: 8px;
  }

  .card.print-start-left {
    border-left: 2px solid #ff4646;
  }
  .card.print-start-top {
    border-top: 2px solid #ff4646;
  }
</style>
