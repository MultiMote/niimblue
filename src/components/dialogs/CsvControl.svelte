<script lang="ts">
  import { tr } from "$/utils/i18n";
  import { csvParse } from "d3-dsv";
  import { type CsvParams } from "$/types";
  import { csvData } from "$/stores/app";
  import AppModal from "$/components/basic/AppModal.svelte";

  interface Props {
    enabled: boolean;
    onPlaceholderPicked: (name: string) => void;
    onClose?: () => void;
  }

  let { enabled = $bindable(), onPlaceholderPicked, onClose }: Props = $props();

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
</script>

<AppModal title={$tr("editor.iconpicker.title")} {onClose}>
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
      <button class="btn btn-sm btn-outline-info px-1 py-0" onclick={() => onPlaceholderPicked(p)}>{`{${p}}`} </button>
    {/each}
  </div>
</AppModal>

<style>
  textarea.dsv {
    font-family: monospace;
    min-height: 240px;
  }
</style>
