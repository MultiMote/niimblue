<script lang="ts">
  import * as fabric from "fabric";
  import { Barcode } from "../fabric-object/barcode";
  import { tr } from "../utils/i18n";
  import MdIcon from "./basic/MdIcon.svelte";

  export let selectedObject: fabric.FabricObject | undefined;
  export let valueUpdated: () => void;
  let selectedBarcode: Barcode | undefined;

  $: {
    selectedBarcode = selectedObject instanceof Barcode ? (selectedObject as Barcode) : undefined;
  }
</script>

{#if selectedBarcode}
  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title={$tr("params.barcode.encoding")}><MdIcon icon="code" /></span>
    <select
      class="form-select"
      value={selectedBarcode.encoding}
      on:change={(e) => {
        selectedBarcode?.set("encoding", e.currentTarget.value ?? "EAN13");
        valueUpdated();
      }}>
      <option value="EAN13">EAN13</option>
      <option value="CODE128B">Code128 B</option>
    </select>
  </div>

  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title={$tr("params.barcode.scale")}>
      <MdIcon icon="settings_ethernet" />
    </span>
    <input
      class="barcode-width form-control"
      type="number"
      min="1"
      value={selectedBarcode.scaleFactor}
      on:input={(e) => {
        selectedBarcode?.set("scaleFactor", e.currentTarget.valueAsNumber ?? 1);
        valueUpdated();
      }} />
  </div>

  <button
    class="btn btn-sm {selectedBarcode.printText ? 'btn-secondary' : ''}"
    title={$tr("params.barcode.enable_caption")}
    on:click={() => {
      selectedBarcode?.set("printText", !selectedBarcode.printText);
      valueUpdated();
    }}>
    123
  </button>

  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title={$tr("params.barcode.font_size")}>
      <MdIcon icon="format_size" />
    </span>
    <input
      class="barcode-width form-control"
      type="number"
      min="1"
      value={selectedBarcode.fontSize}
      on:input={(e) => {
        selectedBarcode?.set("fontSize", e.currentTarget.valueAsNumber ?? 12);
        valueUpdated();
      }} />
  </div>

  {#if selectedBarcode.encoding === "EAN13"}
    <div class="input-group input-group-sm flex-nowrap">
      <span class="input-group-text" title={$tr("params.barcode.content")}><MdIcon icon="view_week" /></span>
      <input
        class="barcode-content form-control"
        maxlength="12"
        value={selectedBarcode.text}
        on:input={(e) => {
          selectedBarcode?.set("text", e.currentTarget.value);
          valueUpdated();
        }} />
    </div>
  {:else}
    <textarea
      class="barcode-content form-control"
      value={selectedBarcode.text}
      on:input={(e) => {
        selectedBarcode?.set("text", e.currentTarget.value);
        valueUpdated();
      }} />
  {/if}
{/if}

<style>
  .input-group {
    width: fit-content;
  }

  textarea.barcode-content {
    height: 100px;
  }

  input.barcode-width {
    max-width: 64px;
  }
</style>
