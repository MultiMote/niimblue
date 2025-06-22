<script lang="ts">
  import type { ExportedLabelTemplate, LabelProps } from "../../types";
  import { tr } from "../../utils/i18n";
  import MdIcon from "../basic/MdIcon.svelte";

  export let onItemClicked: (index: number) => void;
  export let onItemDelete: (index: number) => void;
  export let onItemExport: (index: number) => void;
  export let labels: ExportedLabelTemplate[];
  export let selectedIndex: number = -1;

  let deleteIndex: number = -1;

  const scaleDimensions = (preset: LabelProps): { width: number; height: number } => {
    const scaleFactor = Math.min(100 / preset.size.width, 100 / preset.size.height);
    return {
      width: Math.round(preset.size.width * scaleFactor),
      height: Math.round(preset.size.height * scaleFactor),
    };
  };

  const deleteConfirmed = (e: MouseEvent, idx: number) => {
    e.stopPropagation();
    deleteIndex = -1;
    onItemDelete(idx);
  };

  const deleteRejected = (e: MouseEvent) => {
    e.stopPropagation();
    deleteIndex = -1;
  };

  const deleteRequested = (e: MouseEvent, idx: number) => {
    e.stopPropagation();
    deleteIndex = idx;
  };

  const exportRequested = (e: MouseEvent, idx: number) => {
    e.stopPropagation();
    onItemExport(idx);
  };
</script>

<div class="labels-browser overflow-y-auto border d-flex p-2 gap-1 flex-wrap {$$props.class}">
  {#each labels as item, idx}
    <button
      class="btn p-0 card-wrapper d-flex justify-content-center align-items-center {selectedIndex === idx
        ? 'border-primary'
        : ''}"
      on:click={() => onItemClicked(idx)}>
      <div
        class="card print-start-{item.label.printDirection} d-flex justify-content-center align-items-center"
        style="width: {scaleDimensions(item.label).width}%; height: {scaleDimensions(item.label).height}%;">
        <div class="buttons d-flex">
          <button
            class="btn text-primary-emphasis"
            on:click={(e) => exportRequested(e, idx)}
            title={$tr("params.saved_labels.save.json")}>
            <MdIcon icon="download" />
          </button>

          {#if deleteIndex === idx}
            <button class="remove btn text-danger-emphasis" on:click={(e) => deleteConfirmed(e, idx)}>
              <MdIcon icon="delete" />
            </button>
            <button class="remove btn text-success" on:click={(e) => deleteRejected(e)}>
              <MdIcon icon="close" />
            </button>
          {:else}
            <button class="remove btn text-danger-emphasis" on:click={(e) => deleteRequested(e, idx)}>
              <MdIcon icon="delete" />
            </button>
          {/if}
        </div>

        {#if item.thumbnailBase64}
          <img class="thumbnail" src={item.thumbnailBase64} alt="thumbnail" />
        {/if}

        {#if item.title}
          <span class="label p-1">
            {item.title}
          </span>
        {/if}
      </div>
    </button>
  {/each}
</div>

<style>
  .labels-browser {
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

  .card > .buttons {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 2;
  }

  .card > .buttons > button {
    padding: 0;
    line-height: 100%;
  }

  .card > .label {
    background-color: rgba(255, 255, 255, 0.8);
    color: black;
    border-radius: 8px;
    z-index: 1;
  }

  .card.print-start-left {
    border-left: 2px solid #ff4646;
  }
  .card.print-start-top {
    border-top: 2px solid #ff4646;
  }

  .card .thumbnail {
    width: 100%;
    height: 100%;
    position: absolute;
  }
</style>
