<script lang="ts">
  import type { FirmwareProgressEvent } from "@mmote/niimbluelib";
  import { printerClient } from "$/stores";
  import { Toasts } from "$/utils/toasts";
  import { FileUtils } from "$/utils/file_utils";
  import { tr } from "$/utils/i18n";

  let fwVersion = $state<string>("");
  let fwVersionValid: boolean = $derived(/^\d+\.\d+$/.test(fwVersion));
  let fwProgress = $state<string>("");
  let fwData = $state<Uint8Array>();
  let fwName = $state<string>("");

  const browseFw = async () => {
    const file = await FileUtils.pickAndReadBinaryFile("bin");
    fwData = new Uint8Array(file.data);
    fwName = file.name;

    const match = fwName.match(/(\d+\.\d+)/);

    // For modern firmware images version is stored in header
    if (fwData.length >= 0x1c && fwData[0] === 0x18) {
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

    if (!confirm($tr("connector.firmware_flashing.warning"))) {
      return;
    }

    const listener = (e: FirmwareProgressEvent) => {
      fwProgress = `${e.currentChunk}/${e.totalChunks}`;
    };

    $printerClient.stopHeartbeat();

    try {
      $printerClient.on("firmwareprogress", listener);
      fwProgress = "...";
      await $printerClient.protocol.firmwareUpgrade(fwData, fwVersion);
      $printerClient.off("firmwareprogress", listener);
      await $printerClient.disconnect();

      Toasts.message($tr("connector.firmware_flashing.done"));

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
  <div class="input-group input-group-sm mt-1">
    {#if fwProgress}
      <span class="input-group-text">{$tr("connector.firmware_flashing.uploading")} {fwProgress}</span>
    {:else}
      <span class="input-group-text">{$tr("connector.firmware_flashing.to")}</span>
      <button class="btn btn-sm btn-secondary" title={fwName} onclick={browseFw} disabled={!!fwProgress}>
        {fwName.length > 0 ? fwName.slice(0, 8) + "..." : $tr("connector.firmware_flashing.browse")}
      </button>
      <span class="input-group-text">{$tr("connector.firmware_flashing.ver")}</span>
      <input class="form-control" placeholder="x.x" type="text" size="6" bind:value={fwVersion} />

      <button
        class="btn btn-sm btn-danger"
        onclick={upgradeFw}
        disabled={!!fwProgress || !fwVersionValid || fwData === undefined}
        >{$tr("connector.firmware_flashing.burn")}</button>
    {/if}
  </div>
</div>
