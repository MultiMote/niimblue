<script lang="ts">
  import { Barcode, type BarcodeCoding } from "../fabric-object/barcode.class";
  import FaIcon from "./FaIcon.svelte";

  export let selectedObject: fabric.Object | undefined;
  export let valueUpdated: () => void;
  let selectedBarcode: Barcode | undefined;
  let encoding: BarcodeCoding | undefined;
  let text: string | undefined;
  let printText: boolean | undefined;

  const init = () => {
    text = selectedBarcode?.text;
    encoding = selectedBarcode?.encoding;
    printText = selectedBarcode?.printText;
  };

  const togglePrintText = () => {
    printText = !printText;
    selectedBarcode!.set("printText", printText ?? true);
    valueUpdated();
  };

  const textChange = () => {
    selectedBarcode!.set("text", text ?? "");
    valueUpdated();
  };

  const encodingChange = () => {
    selectedBarcode!.set("encoding", encoding ?? "EAN13");
    valueUpdated();
  };

  $: {
    selectedBarcode = selectedObject instanceof Barcode ? (selectedObject as Barcode) : undefined;
    init();
  }
</script>

{#if selectedBarcode}
  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title="Encoding"><FaIcon icon="code" /></span>
    <select class="form-select" bind:value={encoding} on:change={encodingChange}>
      <option value="EAN13">EAN13</option>
      <option value="CODE128B">Code128 B</option>
    </select>
  </div>
  <button class="btn btn-sm {printText ? 'btn-secondary' : ''}" title="Enable caption" on:click={togglePrintText}>
    <FaIcon icon="font" />
  </button>

  {#if encoding === "EAN13"}
    <div class="input-group input-group-sm flex-nowrap">
      <span class="input-group-text" title="Content"><FaIcon icon="barcode" /></span>
      <input class="barcode-content form-control" maxlength="12" bind:value={text} on:input={textChange} />
    </div>
  {:else}
    <textarea class="barcode-content form-control" bind:value={text} on:input={textChange} />
  {/if}
{/if}

<style>
  .input-group {
    width: fit-content;
  }

  textarea.barcode-content {
    height: 100px;
  }
</style>
