<script lang="ts">
  import type { ChangeEventHandler } from "svelte/elements";
  import { QRCode, type QRCodeType } from "../fabric-object/qrcode.class";
  import FaIcon from "./FaIcon.svelte";

  export let selectedObject: fabric.Object | undefined;
  export let valueUpdated: () => void;
  let selectedQRCode: QRCodeType | undefined;
  let text: string | undefined;
  let ecl: string | undefined;
  $: {
    selectedQRCode =
      selectedObject instanceof QRCode
        ? (selectedObject as QRCodeType)
        : undefined;
    text = selectedQRCode?.text;
    ecl = selectedQRCode?.ecl;
  }

  const textChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    if (selectedQRCode) {
      text = e.currentTarget.value;
      selectedQRCode.set({ text });
      valueUpdated();
    }
  };

  const eclChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (selectedQRCode) {
      ecl = e.currentTarget.value;
      selectedQRCode.set({ ecl: ecl as QRCodeType["ecl"] });
      valueUpdated();
    }
  };
</script>

{#if selectedQRCode}
  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title="Error Correction Level"
      ><FaIcon icon="pen-to-square" /></span
    >
    <select class="from-select" value={ecl} on:change={eclChange}>
      <option value="L">Level L</option>
      <option value="M">Level M</option>
      <option value="Q">Level Q</option>
      <option value="H">Level H</option>
    </select>
  </div>
  <textarea class="qrcode-content" value={text} on:change={textChange} />
{/if}

<style>
  .input-group {
    width: fit-content;
  }

  .qrcode-content {
    width: 100%;
    height: 100px;
  }
</style>
