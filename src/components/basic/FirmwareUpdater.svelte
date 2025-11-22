<script lang="ts">
  import { run } from 'svelte/legacy';

  import type { FirmwareProgressEvent } from "@mmote/niimbluelib";
  import { printerClient } from "../../stores";
  import { Toasts } from "../../utils/toasts";
  import { FileUtils } from "../../utils/file_utils";

  let fwVersion: string = $state("");
  let fwVersionValid: boolean = $state(false);
  let fwProgress: string = $state("");
  let fwData: Uint8Array | undefined = $state();
  let fwName: string = $state("");

  run(() => {
    fwVersionValid = /^\d+\.\d+$/.test(fwVersion);
  });

  const browseFw = async () => {
    const file = await FileUtils.pickAndReadBinaryFile("bin");
    fwData = file.data;
    fwName = file.name;

    const match = fwName.match(/(\d+\.\d+)/);

    // For modern firmware images version is stored in header
    if (fwData[0] === 0x18) {
      const verNumber = (fwData[0x15] << 8) + fwData[0x14];
      fwVersion = (verNumber / 100).toFixed(2);
    } else if (match) {
      fwVersion = match[1];
    } else {
      fwVersion = "";
    }
  };

  const upgradeFw = async () => {
    if (fwData === undefined) {
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
      await $printerClient.abstraction.firmwareUpgrade(fwData, fwVersion);
      $printerClient.off("firmwareprogress", listener);
      await $printerClient.disconnect();

      Toasts.message("Flashing is finished, the printer will shut down now");
      
      fwData = undefined;
      fwName = "";
      fwVersion = "";
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
      <button class="btn btn-sm btn-secondary" title={fwName} onclick={browseFw} disabled={!!fwProgress}>
        {fwName.length > 0 ? fwName.slice(0, 8) + "..." : "Browse..."}
      </button>
      <span class="input-group-text">ver.</span>
      <input class="form-control" placeholder="x.x" type="text" size="6" bind:value={fwVersion} />

      <button
        class="btn btn-sm btn-danger"
        onclick={upgradeFw}
        disabled={!!fwProgress || !fwVersionValid || fwData === undefined}>Burn</button>
    {/if}
  </div>
</div>
