<script lang="ts">
  import type { LabelPreset } from "$/types";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";

  interface Props {
    onItemSelected: (index: number) => void;
    onItemDelete: (index: number) => void;
    presets: LabelPreset[];
    class?: string;
  }

  let { class: className = "", onItemDelete, onItemSelected, presets }: Props = $props();
  let deleteIndex = $state<number>(-1);

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

  const deleteRejected = (e: MouseEvent) => {
    e.stopPropagation();
    deleteIndex = -1;
  };

  const deleteRequested = (e: MouseEvent, idx: number) => {
    e.stopPropagation();
    deleteIndex = idx;
  };
</script>

<div class="preset-browser overflow-y-auto border d-flex p-2 gap-1 flex-wrap {className}">
  <!-- fixme: key -->
  {#each presets as item, idx (item)}
    <div
      role="button"
      class="btn p-0 card-wrapper"
      tabindex="0"
      onkeydown={() => onItemSelected(idx)}
      onclick={() => onItemSelected(idx)}>
      <div class="card-actions">
        {#if deleteIndex === idx}
          <button class="action-btn cancel" onclick={(e) => deleteRejected(e)}>
            <MdIcon icon="close" />
          </button>
          <button class="action-btn confirm" onclick={(e) => deleteConfirmed(e, idx)}>
            <MdIcon icon="delete" />
          </button>
        {:else}
          <button class="action-btn trigger" onclick={(e) => deleteRequested(e, idx)}>
            <MdIcon icon="delete" />
          </button>
        {/if}
      </div>
      <div class="card-preview">
        <div
          class="card print-start-{item.printDirection} shape-{item.shape ?? 'rect'} d-flex justify-content-center align-items-center"
          style="width: {scaleDimensions(item).width}%; height: {scaleDimensions(item).height}%;">
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
      </div>
    </div>
  {/each}
</div>

<style>
  .preset-browser {
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
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .card-wrapper:hover {
    border-color: var(--nb-primary) !important;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 20px;
    flex-shrink: 0;
    position: relative;
  }

  .action-btn {
    background: none;
    border: none;
    padding: 1px 4px;
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
    color: var(--nb-text-tertiary);
  }

  .action-btn.trigger:hover,
  .action-btn.confirm {
    color: var(--nb-accent);
  }

  .action-btn.cancel {
    position: absolute;
    left: 0;
  }

  .action-btn.confirm,
  .action-btn.trigger {
    position: absolute;
    right: 0;
  }

  .card-preview {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 4px 4px;
    overflow: visible;
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

  .card > .label {
    background-color: var(--nb-primary-light);
    color: var(--nb-primary);
    border-radius: 6px;
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
</style>
