<script lang="ts">
  import type { ExportedLabelTemplate, LabelProps } from "$/types";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";

  interface Props {
    onItemClicked: (index: number) => void;
    onItemDelete: (index: number) => void;
    onItemExport: (index: number) => void;
    labels: ExportedLabelTemplate[];
    selectedIndex?: number;
    class?: string;
  }

  let { onItemClicked, onItemDelete, onItemExport, labels, selectedIndex = -1, class: className }: Props = $props();

  let deleteIndex = $state<number>(-1);

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

<div class="labels-browser overflow-y-auto border d-flex p-2 gap-1 flex-wrap {className}">
  {#each labels as item, idx (item.id ?? item.timestamp)}
    <div
      tabindex="0"
      class="btn p-0 card-wrapper d-flex justify-content-center align-items-center {selectedIndex === idx
        ? 'border-primary'
        : ''}"
      onkeydown={() => onItemClicked(idx)}
      onclick={() => onItemClicked(idx)}
      role="button">
      <div
        class="card print-start-{item.label.printDirection} shape-{item.label.shape ?? 'rect'} d-flex justify-content-center align-items-center"
        style="width: {scaleDimensions(item.label).width}%; height: {scaleDimensions(item.label).height}%;">
        <div class="buttons d-flex">
          {#if deleteIndex === idx}
            <button class="btn-action cancel-btn text-secondary" onclick={(e) => deleteRejected(e)}>
              <MdIcon icon="close" />
            </button>
            <button class="btn-action confirm-btn text-danger-emphasis" onclick={(e) => deleteConfirmed(e, idx)}>
              <MdIcon icon="delete" />
            </button>
          {:else}
            <button
              class="btn-action export-btn text-primary-emphasis"
              onclick={(e) => exportRequested(e, idx)}
              title={$tr("params.saved_labels.save.json")}>
              <MdIcon icon="download" />
            </button>
            <button class="btn-action trigger-btn text-danger-emphasis" onclick={(e) => deleteRequested(e, idx)}>
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
    </div>
  {/each}
</div>

<style>
  .labels-browser {
    max-height: 200px;
    max-width: 100%;
    min-height: 96px;
    border-radius: var(--nb-radius-sm) !important;
    border-color: var(--nb-border) !important;
    background: var(--nb-surface-alt) !important;
  }

  .card-wrapper {
    width: 96px;
    height: 96px;
    border-radius: var(--nb-radius-xs) !important;
    border: 1px solid var(--nb-border) !important;
    transition: all 0.15s ease;
  }

  .card-wrapper:hover {
    border-color: var(--nb-primary) !important;
  }

  .card {
    background-color: var(--nb-surface-raised);
    position: relative;
    border-radius: 4px;
    border: 1px solid var(--nb-border);
  }

  .card.shape-rounded_rect {
    border-radius: 12px;
  }

  .card.shape-circle {
    border-radius: 50%;
  }

  .card > .buttons {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2;
  }

  .card > .buttons > .btn-action {
    position: absolute;
    padding: 0;
    line-height: 100%;
    font-size: 14px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--nb-text-tertiary);
  }

  .card > .buttons > .export-btn {
    left: 0;
    top: 0;
  }

  .card > .buttons > .trigger-btn,
  .card > .buttons > .confirm-btn {
    right: 0;
    top: 0;
  }

  .card > .buttons > .cancel-btn {
    left: 0;
    top: 0;
  }

  .card > .label {
    background-color: var(--nb-primary-light);
    color: var(--nb-primary);
    border-radius: 6px;
    z-index: 1;
    font-size: 11px;
    font-weight: 600;
  }

  .card.print-start-left {
    position: relative;
  }
  .card.print-start-left::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 0;
    bottom: 0;
    width: 5px;
    background: #EF4444;
    border-radius: 3px;
  }
  .card.print-start-top {
    border-top: 5px solid #EF4444;
    border-radius: 2px 2px 4px 4px;
  }

  .card .thumbnail {
    width: 100%;
    height: 100%;
    position: absolute;
  }
</style>
