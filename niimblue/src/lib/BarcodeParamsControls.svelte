<script lang="ts">
  import type { ChangeEventHandler } from "svelte/elements";
  import { Barcode, type BarcodeCoding } from "../fabric-object/barcode.class";
  import FaIcon from "./FaIcon.svelte";

  export let selectedObject: fabric.Object | undefined;
  export let valueUpdated: () => void;
  let selectedBarcode: Barcode | undefined;
  let encoding: BarcodeCoding | undefined;
  let text: string | undefined;
  let printText: boolean | undefined;

  $: {
    selectedBarcode =
      selectedObject instanceof Barcode
        ? (selectedObject as Barcode)
        : undefined;
    text = selectedBarcode?.text;
    encoding = selectedBarcode?.encoding;
    printText = selectedBarcode?.printText;
  };

  const togglePrintText = () => {
    if (selectedBarcode) {
      printText = !printText;
      selectedBarcode.set('printText', printText);
      valueUpdated();
    }
  }

  const textChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    if (selectedBarcode) {
      text = e.currentTarget.value;
      selectedBarcode.set('text', text);
      valueUpdated();
    }
  };

  const encodingChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (selectedBarcode) {
      encoding = e.currentTarget.value as BarcodeCoding;
      selectedBarcode.set('encoding', encoding);
      valueUpdated();
    }
  };
</script>

{#if selectedBarcode}
  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title="Encoding"><FaIcon icon="code" /></span
    >
    <select class="form-select" value={encoding} on:change={encodingChange}>
      <option value="EAN13">EAN13</option>
      <option value="CODE128B">Code128 B</option>
    </select>
  </div>
  <button class="btn btn-sm {printText ? 'btn-secondary' : ''}" on:click={togglePrintText}>
    <FaIcon icon="font" />
  </button>
  <textarea
    class="qrcode-content form-control"
    value={text}
    on:change={textChange}
  />
{/if}

<style>
  .input-group {
    width: fit-content;
  }

  .qrcode-content {
    height: 100px;
  }
</style>
