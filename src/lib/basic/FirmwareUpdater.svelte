<script lang="ts">
  import type { FirmwareProgressEvent } from "@mmote/niimbluelib";
  import { printerClient } from "../../stores";
  import { Toasts } from "../../utils/toasts";
  import { FileUtils } from "../../utils/file_utils";

  let fwVersion: string = "";
  let fwVersionValid: boolean = false;
  let fwProgress: string = "";

  $: fwVersionValid = /^\d+\.\d+$/.test(fwVersion);

  const upgradeFw = async () => {
    if (!confirm("Flashing wrong firmware can make your printer dead. Are you sure?")) {
      return;
    }

    const data = await FileUtils.pickAndReadBinaryFile("bin");

    const listener = (e: FirmwareProgressEvent) => {
      fwProgress = `${e.currentChunk}/${e.totalChunks}`;
    };

    $printerClient.stopHeartbeat();

    try {
      $printerClient.on("firmwareprogress", listener);
      fwProgress = "...";
      await $printerClient.abstraction.firmwareUpgrade(data, fwVersion);
      $printerClient.off("firmwareprogress", listener);
      await $printerClient.disconnect();

      Toasts.message("Flashing is finished, the printer will shut down now");
    } catch (e) {
      $printerClient.startHeartbeat();
      $printerClient.off("firmwareprogress", listener);

      Toasts.error(e);
    }

    fwProgress = "";
  };
</script>

<div class="input-group input-group-sm mt-1">
  {#if fwProgress}
    <span class="input-group-text">Uploading {fwProgress}</span>
  {:else}
    <span class="input-group-text">Upgrade FW to</span>
    <input class="form-control" placeholder="version (x.x)" type="text" size="6" bind:value={fwVersion} />
    <button class="btn btn-sm btn-primary" on:click={upgradeFw} disabled={!!fwProgress || !fwVersionValid}>Browse</button>
  {/if}
</div>
