<script lang="ts">
  import type { FirmwareProgressEvent } from "@mmote/niimbluelib";
  import { printerClient } from "../../stores";
  import { Toasts } from "../../utils/toasts";
  import { FileUtils } from "../../utils/file_utils";

  let fwVersion: string = "";
  let fwVersionValid: boolean = false;
  let fwProgress: string = "";
  let firmwareData: Uint8Array | undefined;
  let firmwareName: string = "";

  $: fwVersionValid = /^\d+\.\d+$/.test(fwVersion);

  const browseFw = async () => {
    const file = await FileUtils.pickAndReadBinaryFile("bin");
    firmwareData = file.data;
    firmwareName = file.name;

    const match = firmwareName.match(/(\d+\.\d+)/);

    // For modern firmware images version is stored in header
    if (firmwareData[0] === 0x18) {
      const verNumber = (firmwareData[0x15] << 8) + firmwareData[0x14];
      fwVersion = (verNumber / 100).toFixed(2);
    } else if (match) {
      fwVersion = match[1];
    } else {
      fwVersion = "";
    }
  };

  const upgradeFw = async () => {
    if (firmwareData === undefined) {
      return;
    }

    if (!confirm("Flashing wrong firmware can make your printer dead. Are you sure?")) {
      return;
    }

    const listener = (e: FirmwareProgressEvent) => {
      fwProgress = `${e.currentChunk}/${e.totalChunks}`;
    };

    $printerClient.stopHeartbeat();

    try {
      $printerClient.on("firmwareprogress", listener);
      fwProgress = "...";
      await $printerClient.abstraction.firmwareUpgrade(firmwareData, fwVersion);
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

<div class="firmware-updater">
  Firmware flashing
  <div class="input-group input-group-sm mt-1">
    {#if fwProgress}
      <span class="input-group-text">Uploading {fwProgress}</span>
    {:else}
      <span class="input-group-text">To</span>
      <button class="btn btn-sm btn-secondary" title={firmwareName} on:click={browseFw} disabled={!!fwProgress}>
        {firmwareName.length > 0 ? firmwareName.slice(0, 8) + "..." : "Browse..."}
      </button>
      <span class="input-group-text">ver.</span>
      <input class="form-control" placeholder="x.x" type="text" size="6" bind:value={fwVersion} />

      <button
        class="btn btn-sm btn-danger"
        on:click={upgradeFw}
        disabled={!!fwProgress || !fwVersionValid || firmwareData === undefined}>Burn</button>
    {/if}
  </div>
</div>
