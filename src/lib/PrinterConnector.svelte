<script lang="ts">
  import { SoundSettingsItemType, type RfidInfo } from "@mmote/niimbluelib";
  import { printerClient, connectedPrinterName, connectionState, initClient, heartbeatData, printerInfo, printerMeta } from "../stores";
  import type { ConnectionType } from "../types";
  import { tr } from "../utils/i18n";
  import MdIcon from "./MdIcon.svelte";

  let connectionType: ConnectionType = "bluetooth";
  let rfidInfo: RfidInfo|undefined = undefined;

  const onConnectClicked = async () => {
    initClient(connectionType);
    connectionState.set("connecting");

    try {
      await $printerClient.connect();
    } catch (e) {
      connectionState.set("disconnected");
      alert(e);
    }
  };
  const onDisconnectClicked = () => {
    $printerClient.disconnect();
  };
  const getRfidInfo = async () => {
    rfidInfo = await $printerClient.abstraction.rfidInfo();
  };

  const startHeartbeat = async () => {
    $printerClient.startHeartbeat();
  };
  const stopHeartbeat = async () => {
    $printerClient.stopHeartbeat();
  };

  const soundOn = async () => {
    await $printerClient.abstraction.setSoundEnabled(SoundSettingsItemType.BluetoothConnectionSound, true);
    await $printerClient.abstraction.setSoundEnabled(SoundSettingsItemType.PowerSound, true);
  };

  const soundOff = async () => {
    await $printerClient.abstraction.setSoundEnabled(SoundSettingsItemType.BluetoothConnectionSound, false);
    await $printerClient.abstraction.setSoundEnabled(SoundSettingsItemType.PowerSound, false);
  };

  const fetchInfo = async () => {
    await $printerClient.fetchPrinterInfo()
  };

  const reset = async () => {
    await $printerClient.abstraction.printerReset()
  };
</script>

<div class="input-group flex-nowrap justify-content-end">
  {#if $connectionState === "connected"}
    <button class="btn btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside"
      ><MdIcon icon="settings" />
    </button>
    <div class="dropdown-menu p-1">
      <div>
        Model metadata:
        <pre>{JSON.stringify($printerMeta, null, 1)}</pre>
      </div>

      <div>
        Printer info:
        <pre>{JSON.stringify($printerInfo, null, 1)}</pre>
      </div>

      <div>
        Rfid info:
        <pre>{JSON.stringify(rfidInfo || {}, null, 1)}</pre>
      </div>

      <div>
        Heartbeat data:
        <pre>{JSON.stringify($heartbeatData, null, 1)}</pre>
      </div>


      <div>
        Tests
      </div>

      <button class="btn btn-sm btn-primary" on:click={getRfidInfo}>Rfid</button>
      <button class="btn btn-sm btn-primary" on:click={startHeartbeat}>Heartbeat on</button>
      <button class="btn btn-sm btn-primary" on:click={stopHeartbeat}>Heartbeat off</button>
      <button class="btn btn-sm btn-primary" on:click={soundOn}>Sound on</button>
      <button class="btn btn-sm btn-primary" on:click={soundOff}>Sound off</button>
      <button class="btn btn-sm btn-primary" on:click={fetchInfo}>Fetch info again</button>
      <button class="btn btn-sm btn-primary" on:click={reset}>Reset</button>
    </div>
    <span class="input-group-text">{$printerMeta?.model ?? $connectedPrinterName}</span>
  {:else}
    <select class="form-select" disabled={$connectionState === "connecting"} bind:value={connectionType}>
      <option value="bluetooth">{$tr("connector.bluetooth", "Bluetooth")}</option>
      <option value="serial">{$tr("connector.serial", "Serial (USB)")}</option>
    </select>
  {/if}

  {#if $connectionState !== "connected"}
    <button class="btn btn-primary" disabled={$connectionState === "connecting"} on:click={onConnectClicked}>
      <MdIcon icon="power" />
    </button>
  {/if}

  {#if $connectionState === "connected"}
    <button class="btn btn-danger" on:click={onDisconnectClicked}>
      <MdIcon icon="power_off" />
    </button>
  {/if}
</div>

<style>
</style>
