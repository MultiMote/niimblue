<script lang="ts">
  import { onMount } from "svelte";
  import Dropdown from "bootstrap/js/dist/dropdown";
  import { tr } from "$/utils/i18n";
  import { csvParse } from "d3-dsv";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { type CsvParams } from "$/types";
  import { csvData } from "$/stores";

  interface Props {
    enabled: boolean;
    onPlaceholderPicked: (name: string) => void;
    labeled?: boolean;
  }

  let { enabled = $bindable(), onPlaceholderPicked, labeled = false }: Props = $props();

  let toggleEl: HTMLButtonElement | undefined;
  let placeholders = $state<string[]>([]);
  let rows = $state<number>(0);

  const parse = (csv: CsvParams) => {
    const result = csvParse(csv.data);
    placeholders = result.columns;
    rows = result.length;
  };

  $effect(() => {
    parse($csvData);
  });

  const hideMenu = () => {
    if (toggleEl) Dropdown.getInstance(toggleEl)?.hide();
  };

  onMount(() => {
    // Canvas pan calls preventDefault on pointerdown, which swallows the click
    // Bootstrap uses for auto-close. Close when the workspace is pressed instead.
    const stage = document.querySelector(".canvas-stage");
    stage?.addEventListener("pointerdown", hideMenu);
    return () => stage?.removeEventListener("pointerdown", hideMenu);
  });
</script>

<div class="dropdown dropend">
  <button
    bind:this={toggleEl}
    class={labeled ? `tool-btn ${enabled ? "active" : ""}` : `btn btn-sm btn-${enabled ? "warning" : "secondary"}`}
    data-bs-toggle="dropdown"
    data-bs-auto-close="outside"
    title={$tr("params.csv.title")}>
    <MdIcon icon="dataset" />
    {#if labeled}<span class="tool-btn-label">{$tr("editor.rail.csv")}</span>{/if}
  </button>
  <div class="dropdown-menu">
    <h6 class="dropdown-header">{$tr("params.csv.title")}</h6>
    <div class="csv-sheet-body p-3 text-body-secondary">
      <label class="csv-enable-bar {enabled ? 'on' : ''}">
        <span>{$tr("params.csv.use")}</span>
        <span class="form-check form-switch mb-0">
          <input class="form-check-input" type="checkbox" role="switch" bind:checked={enabled} />
        </span>
      </label>

      <div class="mt-3">
        {$tr("params.csv.tip")}
      </div>

      <textarea class="dsv form-control my-3" bind:value={$csvData.data} oninput={() => (enabled = true)}></textarea>

      <div class="placeholders pt-1">
        {$tr("params.csv.rowsfound")} <strong>{rows}</strong>
      </div>
      <div class="placeholders pt-1">
        {$tr("params.csv.placeholders")}
        {#each placeholders as p (p)}
          <button class="btn btn-sm btn-outline-info px-1 py-0" onclick={() => onPlaceholderPicked(p)}
            >{`{${p}}`}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    width: 100vw;
    max-width: 450px;
  }
  textarea.dsv {
    font-family: monospace;
    min-height: 8rem;
    height: 14rem;
  }

  :global(.dropdown-menu-sheet) .csv-sheet-body {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  :global(.dropdown-menu-sheet) textarea.dsv {
    flex: 1 1 auto;
    min-height: 8rem;
    height: auto;
  }

  .csv-enable-bar {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    border: 1px solid var(--nb-border-strong);
    background: var(--nb-surface);
    color: var(--nb-text);
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .csv-enable-bar.on {
    background: var(--nb-accent-strong);
    border-color: var(--nb-accent-border-strong);
  }

  .csv-enable-bar :global(.form-check-input) {
    width: 2.4rem;
    height: 1.25rem;
    cursor: pointer;
    margin: 0;
  }
</style>
