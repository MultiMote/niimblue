<script lang="ts">
  import { tr } from "../utils/i18n";
  import { csvParse } from "d3-dsv";
  import MdIcon from "./MdIcon.svelte";

  export let enabled: boolean;
  export let csv: string;
  export let onUpdate: (enabled: boolean, csv: string) => void;
  export let onPlaceholderPicked: (name: string) => void;

  let placeholders: string[] = [];
  let rows: number = 0;

  const refresh = () => {
    const result = csvParse(csv);
    placeholders = result.columns;
    rows = result.length;
  };

  const onDataChanged = () => {
    onUpdate(enabled, csv);
  };

  $: csv, refresh();
</script>

<div class="dropdown">
  <button
    class="btn btn-sm btn-{enabled ? 'warning' : 'secondary'}"
    data-bs-toggle="dropdown"
    data-bs-auto-close="outside"
    title={$tr("params.csv.title", "Dynamic label data (CSV)")}>
    <MdIcon icon="dataset" />
  </button>
  <div class="dropdown-menu">
    <h6 class="dropdown-header">{$tr("params.csv.title", "Dynamic label data (CSV)")}</h6>
    <div class="p-3 text-body-secondary">
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          id="enabled"
          bind:checked={enabled}
          on:change={onDataChanged} />
        <label class="form-check-label" for="enabled">{$tr("params.csv.enabled", "Enabled")}</label>
      </div>

      <div class="mt-3">
        {$tr("params.csv.tip", "First row is a header. It used as variable names. Commas are used as separators.")}
      </div>

      <textarea class="dsv form-control my-3" bind:value={csv} on:input={onDataChanged} />

      <div class="placeholders pt-1">
        {$tr("params.csv.rowsfound", "Data rows found:")} <strong>{rows}</strong>
      </div>
      <div class="placeholders pt-1">
        {$tr("params.csv.placeholders", "Variables:")}
        {#each placeholders as p}
          <button class="btn btn-sm btn-outline-info px-1 py-0" on:click={() => onPlaceholderPicked(p)}>{`{${p}}`}</button>
          {" "}
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    min-width: 450px;
  }
  textarea.dsv {
    font-family: monospace;
    min-height: 240px;
  }
</style>
