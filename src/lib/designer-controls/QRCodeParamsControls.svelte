<script lang="ts">
  import { QRCode } from "../../fabric-object/qrcode";
  import { tr } from "../../utils/i18n";
  import MdIcon from "../basic/MdIcon.svelte";
  import * as fabric from "fabric";

  export let selectedObject: fabric.FabricObject | undefined;
  export let valueUpdated: () => void;
  let selectedQRCode: QRCode | undefined;

  $: {
    selectedQRCode = selectedObject instanceof QRCode ? (selectedObject as QRCode) : undefined;
  }
</script>

{#if selectedQRCode}
  <div class="input-group input-group-sm flex-nowrap">
    <span class="input-group-text" title={$tr("params.qrcode.ecl")}>
      <MdIcon icon="auto_fix_high" />
    </span>
    <select
      class="form-select"
      value={selectedQRCode.ecl}
      on:change={(e) => {
        selectedQRCode?.set("ecl", e.currentTarget.value);
        valueUpdated();
      }}>
      <option value="L">Level L</option>
      <option value="M">Level M</option>
      <option value="Q">Level Q</option>
      <option value="H">Level H</option>
    </select>
  </div>
  <textarea
    class="qrcode-content form-control"
    value={selectedQRCode.text}
    on:input={(e) => {
      selectedQRCode?.set("text", e.currentTarget.value);
      valueUpdated();
    }} />
{/if}

<style>
  .input-group {
    width: fit-content;
  }

  .qrcode-content {
    height: 100px;
  }
</style>
