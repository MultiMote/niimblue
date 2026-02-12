<script lang="ts">
  import Dropdown from "bootstrap/js/dist/dropdown";
  import { tr } from "$/utils/i18n";
  import { csvParse } from "d3-dsv";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { type CsvParams } from "$/types";
  import { csvData } from "$/stores";

  interface Props {
    enabled: boolean;
    onPlaceholderPicked: (name: string) => void;
  }

  let { enabled = $bindable(), onPlaceholderPicked }: Props = $props();

  let placeholders = $state<string[]>([]);
  let rows = $state<number>(0);
  let dropdownBtn: HTMLButtonElement;

  const parse = (csv: CsvParams) => {
    const result = csvParse(csv.data);
    placeholders = result.columns;
    rows = result.length;
  };

  $effect(() => {
    parse($csvData);
  });
</script>

<div class="dropdown">
  <button
    bind:this={dropdownBtn}
    class="btn btn-sm btn-{enabled ? 'warning' : 'secondary'}"
    data-bs-toggle="dropdown"
    data-bs-auto-close="outside"
    title={$tr("params.csv.title")}>
    <MdIcon icon="dataset" />
  </button>
  <div class="dropdown-menu nb-modal-dropdown">
    <div class="nb-picker-header">
      <h6 class="dropdown-header">{$tr("params.csv.title")}</h6>
      <button class="nb-close-btn" onclick={() => { const dd = Dropdown.getInstance(dropdownBtn); dd?.hide(); }}>
        <MdIcon icon="close" />
      </button>
    </div>
    <div class="p-3" style="color: var(--nb-text)">
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" id="enabled" bind:checked={enabled} />
        <label class="form-check-label" for="enabled">{$tr("params.csv.enabled")}</label>
      </div>

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
  .nb-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 8px;
  }
  .nb-close-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--nb-text-secondary);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nb-close-btn:hover {
    background: var(--nb-surface-alt);
    color: var(--nb-text);
  }
  textarea.dsv {
    font-family: monospace;
    min-height: 240px;
  }
</style>
