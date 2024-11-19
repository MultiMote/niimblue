<script lang="ts">
  import type { fabric } from "fabric";
  import { Barcode, type BarcodeCoding } from "../fabric-object/barcode.class";
  import { tr } from "../utils/i18n";
  import MdIcon from "./MdIcon.svelte";

  export let selectedObject: fabric.Object | undefined;
  export let valueUpdated: () => void;
  let selectedBarcode: Barcode | undefined;
  let encoding: BarcodeCoding | undefined;
  let text: string | undefined;
  let scale: number | undefined;
  let fontSize: number | undefined;
  let printText: boolean | undefined;

  const init = () => {
    if (selectedBarcode !== undefined) {
      text = selectedBarcode.text;
      encoding = selectedBarcode.encoding;
      printText = selectedBarcode.printText;
      scale = selectedBarcode.scaleFactor;
      fontSize = selectedBarcode.fontSize;
    }
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

  const scaleChange = () => {
    selectedBarcode!.set("scaleFactor", Math.max(1, scale ?? 1));
    valueUpdated();
  };

  const fontSizeChange = () => {
    selectedBarcode!.set("fontSize", fontSize ?? 12);
    valueUpdated();
  };

  $: {
    selectedBarcode = selectedObject instanceof Barcode ? (selectedObject as Barcode) : undefined;
    init();
  }
</script>

{#if selectedBarcode}
  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title={$tr("params.barcode.encoding")}><MdIcon icon="code" /></span>
    <select class="form-select" bind:value={encoding} on:change={encodingChange}>
      <option value="EAN13">EAN13</option>
      <option value="CODE128B">Code128 B</option>
    </select>
  </div>

  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title={$tr("params.barcode.scale")}>
      <MdIcon icon="settings_ethernet" />
    </span>
    <input class="barcode-width form-control" type="number" min="1" bind:value={scale} on:input={scaleChange} />
  </div>

  <button
    class="btn {printText ? 'btn-secondary' : ''}"
    title={$tr("params.barcode.enable_caption")}
    on:click={togglePrintText}>
    123
  </button>

  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title={$tr("params.barcode.font_size")}>
      <MdIcon icon="format_size" />
    </span>
    <input class="barcode-width form-control" type="number" min="1" bind:value={fontSize} on:input={fontSizeChange} />
  </div>

  {#if encoding === "EAN13"}
    <div class="input-group input-group-sm flex-nowrap">
      <span class="input-group-text" title={$tr("params.barcode.content")}><MdIcon icon="view_week" /></span>
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

  input.barcode-width {
    max-width: 64px;
  }
</style>
