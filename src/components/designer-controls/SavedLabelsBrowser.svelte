<script lang="ts">
  import type { ExportedLabelTemplate, LabelProps } from "$/types";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { browserInfo } from "$/utils/browser.svelte";

  interface Props {
    onItemClicked: (index: number) => void;
    onItemDelete: (index: number) => void;
    onItemExport: (index: number) => void;
    labels: ExportedLabelTemplate[];
    selectedIndex?: number;
    class?: string;
  }

  let {
    class: className = "",
    onItemClicked,
    onItemDelete,
    onItemExport,
    labels,
    selectedIndex = -1,
  }: Props = $props();

  let deleteIndex = $state<number>(-1);
  let menuIndex = $state<number>(-1);
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  const scaleDimensions = (preset: LabelProps): { width: number; height: number } => {
    const scaleFactor = Math.min(100 / preset.size.width, 100 / preset.size.height);

    return {
      width: Math.round(preset.size.width * scaleFactor),
      height: Math.round(preset.size.height * scaleFactor),
    };
  };

  const deleteConfirmed = (e: Event, idx: number) => {
    e.stopPropagation();
    deleteIndex = -1;
    menuIndex = -1;
    onItemDelete(idx);
  };

  const deleteRejected = (e: Event) => {
    e.stopPropagation();
    deleteIndex = -1;
  };

  const deleteRequested = (e: Event, idx: number) => {
    e.stopPropagation();
    deleteIndex = idx;
  };

  const exportRequested = (e: Event, idx: number) => {
    e.stopPropagation();
    menuIndex = -1;
    onItemExport(idx);
  };

  const startLongPress = (e: TouchEvent, idx: number) => {
    if (!browserInfo.isMobile) return;

    longPressTimer = setTimeout(() => {
      menuIndex = idx;
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const closeMenu = () => {
    menuIndex = -1;
    deleteIndex = -1;
  };
</script>

<div class="labels-browser border {className}">
  <div class="labels-list overflow-y-auto d-flex p-2 gap-1 flex-wrap">
    {#each labels as item, idx (item.id ?? item.timestamp)}
      <div
        role="button"
        class="btn p-0 card-wrapper d-flex justify-content-center align-items-center {selectedIndex === idx
          ? 'border-primary'
          : ''}"
        tabindex="0"
        oncontextmenu={(e) => e.preventDefault()}
        onkeydown={() => onItemClicked(idx)}
        onclick={() => onItemClicked(idx)}
        ontouchstart={(e) => startLongPress(e, idx)}
        ontouchend={cancelLongPress}
        ontouchmove={cancelLongPress}
        ontouchcancel={cancelLongPress}>
        <div
          class="card print-start-{item.label.printDirection} d-flex justify-content-center align-items-center"
          style="width: {scaleDimensions(item.label).width}%; height: {scaleDimensions(item.label).height}%;">
          {#if !browserInfo.isMobile}
            <div class="buttons d-flex">
              <button
                class="btn text-primary-emphasis"
                onclick={(e) => exportRequested(e, idx)}
                title={$tr("params.saved_labels.save.json")}>
                <MdIcon icon="download" />
              </button>

              {#if deleteIndex === idx}
                <button class="remove btn text-danger-emphasis" onclick={(e) => deleteConfirmed(e, idx)}>
                  <MdIcon icon="delete" />
                </button>
                <button class="remove btn text-success" onclick={(e) => deleteRejected(e)}>
                  <MdIcon icon="close" />
                </button>
              {:else}
                <button class="remove btn text-danger-emphasis" onclick={(e) => deleteRequested(e, idx)}>
                  <MdIcon icon="delete" />
                </button>
              {/if}
            </div>
          {/if}

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

  {#if browserInfo.isMobile && menuIndex >= 0}
    <div class="popup-layer">
      <div class="popup-backdrop" onclick={closeMenu}></div>

      <div class="popup bg-body border rounded shadow">
        <button class="btn w-100" onclick={(e) => exportRequested(e, menuIndex)}>
          <MdIcon icon="download" />
          {$tr("params.saved_labels.save.json")}
        </button>

        {#if deleteIndex === menuIndex}
          <button class="btn w-100 text-danger" onclick={(e) => deleteConfirmed(e, menuIndex)}>
            <MdIcon icon="delete" /> {$tr("params.label.delete.confirm")}
          </button>
          <button class="btn w-100" onclick={deleteRejected}>
            <MdIcon icon="close" /> {$tr("params.label.delete.cancel")}
          </button>
        {:else}
          <button class="btn w-100 text-danger" onclick={(e) => deleteRequested(e, menuIndex)}>
            <MdIcon icon="delete" /> {$tr("params.label.delete")}
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .labels-browser {
    max-width: 100%;
    min-height: 96px;
    max-height: 200px;
    position: relative;
    overflow: hidden;
  }

  .labels-list {
    width: 100%;
    height: 100%;
    max-height: 200px;
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

  .popup-layer {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
  }

  .popup-backdrop {
    position: absolute;
    inset: 0;
    pointer-events: auto;
  }

  .popup {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 160px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    pointer-events: auto;
  }
</style>
