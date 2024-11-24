<script lang="ts">
  import type { ChangeEventHandler } from "svelte/elements";
  import { QRCode, type ErrorCorrectionLevel } from "../fabric-object/qrcode.class";
  import { tr } from "../utils/i18n";
  import MdIcon from "./basic/MdIcon.svelte";
  import type { fabric } from "fabric";

  export let selectedObject: fabric.Object | undefined;
  export let valueUpdated: () => void;
  let selectedQRCode: QRCode | undefined;
  let text: string | undefined;
  let ecl: string | undefined;

  const init = () => {
    text = selectedQRCode?.text;
    ecl = selectedQRCode?.ecl;
  };

  const textChange: ChangeEventHandler<HTMLTextAreaElement> = () => {
    if (selectedQRCode) {
      selectedQRCode.set({ text });
      valueUpdated();
    }
  };

  const eclChange: ChangeEventHandler<HTMLSelectElement> = () => {
    if (selectedQRCode) {
      selectedQRCode.set({ ecl: ecl as ErrorCorrectionLevel });
      valueUpdated();
    }
  };

  $: {
    selectedQRCode = selectedObject instanceof QRCode ? (selectedObject as QRCode) : undefined;
    init();
  }
</script>

{#if selectedQRCode}
  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title={$tr("params.qrcode.ecl")}>
      <MdIcon icon="auto_fix_high" />
    </span>
    <select class="form-select" bind:value={ecl} on:change={eclChange}>
      <option value="L">Level L</option>
      <option value="M">Level M</option>
      <option value="Q">Level Q</option>
      <option value="H">Level H</option>
    </select>
  </div>
  <textarea class="qrcode-content form-control" bind:value={text} on:input={textChange} />
{/if}

<style>
  .input-group {
    width: fit-content;
  }

  .qrcode-content {
    height: 100px;
  }
</style>
