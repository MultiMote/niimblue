<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import { heartbeatData, printerClient, printerInfo, printerMeta, rfidInfo } from "$/stores";
  import { tr } from "$/utils/i18n";

  let { show = $bindable() } = $props();
</script>

<AppModal title={$tr("debug.title")} bind:show>
  <h6>Printer info</h6>
  <button class="btn btn-sm btn-secondary" onclick={() => $printerClient.fetchPrinterInfo()}>Update</button>
  <code>
    <pre>{JSON.stringify($printerInfo, null, 2)}</pre>
  </code>

  <h6>RFID info</h6>
  <button class="btn btn-sm btn-secondary" onclick={() => $printerClient.fetchRfidInfo()}>Update</button>
  <code>
    <pre>{JSON.stringify($rfidInfo, null, 2)}</pre>
  </code>

  <h6>Last heartbeat info</h6>
  <code>
    <pre>{JSON.stringify($heartbeatData, null, 2)}</pre>
  </code>

  <h6>Offline model metadata</h6>
  <code>
    <pre>{JSON.stringify($printerMeta, null, 2)}</pre>
  </code>
</AppModal>
