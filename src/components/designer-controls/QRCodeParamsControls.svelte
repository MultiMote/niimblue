<script lang="ts">
  import { QRCode } from "$/fabric-object/qrcode";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";

  interface Props {
    selectedQRCode: QRCode;
    valueUpdated: () => void;
  }

  let { selectedQRCode, valueUpdated }: Props = $props();
</script>

<div class="input-group input-group-sm flex-nowrap">
  <span class="input-group-text" title={$tr("params.qrcode.ecl")}>
    <MdIcon icon="auto_fix_high" />
  </span>
  <select
    class="form-select"
    value={selectedQRCode.ecl}
    onchange={(e) => {
      selectedQRCode?.set("ecl", e.currentTarget.value);
      valueUpdated();
    }}>
    <option value="L">Level L</option>
    <option value="M">Level M</option>
    <option value="Q">Level Q</option>
    <option value="H">Level H</option>
  </select>
</div>

<div class="input-group input-group-sm flex-nowrap">
  <span class="input-group-text" title={$tr("params.qrcode.mode")}>
    <MdIcon icon="abc" />
  </span>
  <select
    class="form-select"
    value={selectedQRCode.mode}
    onchange={(e) => {
      selectedQRCode?.set("mode", e.currentTarget.value);
      valueUpdated();
    }}>
    <option value="Byte">Byte</option>
    <option value="Numeric">Numeric</option>
    <option value="Alphanumeric">Alphanumeric</option>
    <option value="Kanji">Kanji</option>
  </select>
</div>

<div class="input-group input-group-sm flex-nowrap">
  <span class="input-group-text" title={$tr("params.qrcode.version")}>
    <MdIcon icon="123" />
  </span>
  <select
    class="form-select"
    value={selectedQRCode.qrVersion}
    onchange={(e) => {
      selectedQRCode?.set("qrVersion", parseInt(e.currentTarget.value));
      valueUpdated();
    }}>
    <option value={0}>Auto</option>
    {#each { length: 40 }, i (i)}
      <option value={i + 1}>{i + 1}</option>
    {/each}
  </select>
</div>

<textarea
  class="qrcode-content form-control"
  value={selectedQRCode.text}
  oninput={(e) => {
    selectedQRCode?.set("text", e.currentTarget.value);
    valueUpdated();
  }}></textarea>

<style>
  .input-group {
    width: fit-content;
  }

  .qrcode-content {
    height: 100px;
  }
</style>
