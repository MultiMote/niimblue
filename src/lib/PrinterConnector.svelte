<script lang="ts">
  import {
    FirmwareProgressEvent,
    NiimbotCapacitorBleClient,
    SoundSettingsItemType,
    Utils,
    type AvailableTransports,
    type RfidInfo,
  } from "@mmote/niimbluelib";
  import {
    printerClient,
    connectedPrinterName,
    connectionState,
    initClient,
    heartbeatData,
    printerInfo,
    printerMeta,
    heartbeatFails,
    automation,
    rfidInfo,
  } from "../stores";
  import type { ConnectionType } from "../types";
  import { tr } from "../utils/i18n";
  import MdIcon from "./basic/MdIcon.svelte";
  import { Toasts } from "../utils/toasts";
  import { onMount } from "svelte";
  import { LocalStoragePersistence } from "../utils/persistence";
  import type { MaterialIcon } from "material-icons";
  import { FileUtils } from "../utils/file_utils";

  let connectionType: ConnectionType = "bluetooth";
  let featureSupport: AvailableTransports = { webBluetooth: false, webSerial: false, capacitorBle: false };
  let fwVersion: string = "";
  let fwProgress: string = "";

  const onConnectClicked = async () => {
    initClient(connectionType);
    connectionState.set("connecting");

    try {
      if ($printerClient instanceof NiimbotCapacitorBleClient && $automation?.autoConnectDeviceId !== undefined) {
        await $printerClient.connect({ deviceId: $automation.autoConnectDeviceId });
      } else {
        await $printerClient.connect();
      }
    } catch (e) {
      connectionState.set("disconnected");
      Toasts.error(e);
    }
  };
  const onDisconnectClicked = () => {
    $printerClient.disconnect();
  };
  const getRfidInfo = async () => {
    $rfidInfo = await $printerClient.abstraction.rfidInfo();
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
    await $printerClient.fetchPrinterInfo();
  };

  const reset = async () => {
    await $printerClient.abstraction.printerReset();
  };

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

  const switchConnectionType = (c: ConnectionType) => {
    LocalStoragePersistence.saveLastConnectionType(c);
    connectionType = c;
  };

  const batteryIcon = (value: number): MaterialIcon => {
    if (value === 4) {
      return "battery_full";
    } else if (value === 3) {
      return "battery_5_bar";
    } else if (value === 2) {
      return "battery_3_bar";
    } else if (value === 1) {
      return "battery_2_bar";
    }
    return "battery_0_bar";
  };

  onMount(() => {
    featureSupport = Utils.getAvailableTransports();

    connectionType = LocalStoragePersistence.loadLastConnectionType() ?? "bluetooth";

    if (!featureSupport.capacitorBle && connectionType === "capacitor-ble") {
      connectionType = "bluetooth";
    }
    if (!featureSupport.webSerial && connectionType === "serial") {
      connectionType = "bluetooth";
    }
    if (!featureSupport.webBluetooth && connectionType === "bluetooth" && featureSupport.capacitorBle) {
      connectionType = "capacitor-ble";
    }

    if ($automation !== undefined && $automation.autoConnect && connectionType === "capacitor-ble") {
      onConnectClicked();
    }
  });
</script>

<div class="input-group w-auto input-group-sm flex-nowrap justify-content-end">
  {#if $connectionState === "connected"}
    <button class="btn btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
      <MdIcon icon="settings" />
    </button>
    <div class="dropdown-menu p-1">
      {#if $printerInfo}
        <div>
          Printer info:
          <ul>
            {#each Object.entries($printerInfo) as [k, v]}
              <li>{k}: <strong>{v ?? "-"}</strong></li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if $printerMeta}
        <button
          class="btn btn-sm btn-outline-secondary d-block w-100 mt-1"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#modelMeta">
          Model metadata <MdIcon icon="expand_more" />
        </button>

        <div class="collapse" id="modelMeta">
          <ul>
            {#each Object.entries($printerMeta) as [k, v]}
              <li>{k}: <strong>{v ?? "-"}</strong></li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if $rfidInfo}
        <button
          class="btn btn-sm btn-outline-secondary d-block w-100 mt-1"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#rfidInfo">
          Rfid info <MdIcon icon="expand_more" />
        </button>

        <div class="collapse" id="rfidInfo">
          <button class="btn btn-outline-secondary btn-sm mt-1" on:click={getRfidInfo}>Update</button>

          <ul>
            {#each Object.entries($rfidInfo) as [k, v]}
              <li>{k}: <strong>{v ?? "-"}</strong></li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if $heartbeatData}
        <button
          class="btn btn-sm btn-outline-secondary d-block w-100 mt-1"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#heartbeatData">
          Heartbeat data <MdIcon icon="expand_more" />
        </button>

        <div class="collapse" id="heartbeatData">
          <ul>
            {#each Object.entries($heartbeatData) as [k, v]}
              <li>{k}: <strong>{v ?? "-"}</strong></li>
            {/each}
          </ul>
        </div>
      {/if}

      <div class="input-group input-group-sm mt-1">
        {#if fwProgress}
          <span class="input-group-text">Uploading {fwProgress}</span>
        {:else}
          <button class="btn btn-sm btn-primary" on:click={upgradeFw} disabled={!!fwProgress}>Upgrade FW</button>
          <span class="input-group-text">To version</span>
          <input class="form-control" placeholder="x.x" type="text" size="6" bind:value={fwVersion} />
        {/if}
      </div>

      <button
        class="btn btn-sm btn-outline-secondary d-block w-100 mt-1"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#tests">
        Tests <MdIcon icon="expand_more" />
      </button>

      <div class="collapse" id="tests">
        <div class="d-flex flex-wrap gap-1 mt-1">
          <button class="btn btn-sm btn-primary" on:click={startHeartbeat}>Heartbeat on</button>
          <button class="btn btn-sm btn-primary" on:click={stopHeartbeat}>Heartbeat off</button>
          <button class="btn btn-sm btn-primary" on:click={soundOn}>Sound on</button>
          <button class="btn btn-sm btn-primary" on:click={soundOff}>Sound off</button>
          <button class="btn btn-sm btn-primary" on:click={fetchInfo}>Fetch info again</button>
          <button class="btn btn-sm btn-primary" on:click={reset}>Reset</button>
        </div>
      </div>
    </div>
    <span class="input-group-text {$heartbeatFails > 0 ? 'text-warning' : ''}">
      {$printerMeta?.model ?? $connectedPrinterName}
      {#if $heartbeatData}
        <MdIcon icon={batteryIcon($heartbeatData.powerLevel)} class="r-90"></MdIcon>
      {/if}
    </span>
  {:else}
    {#if featureSupport.webBluetooth}
      <button
        class="btn text-nowrap {connectionType === 'bluetooth' ? 'btn-light' : 'btn-outline-secondary'}"
        on:click={() => switchConnectionType("bluetooth")}>
        <MdIcon icon="bluetooth" />
        {$tr("connector.bluetooth")}
      </button>
    {/if}
    {#if featureSupport.webSerial}
      <button
        class="btn text-nowrap {connectionType === 'serial' ? 'btn-light' : 'btn-outline-secondary'}"
        on:click={() => switchConnectionType((connectionType = "serial"))}>
        <MdIcon icon="usb" />
        {$tr("connector.serial")}
      </button>
    {/if}
    {#if featureSupport.capacitorBle}
      <button
        class="btn text-nowrap {connectionType === 'capacitor-ble' ? 'btn-light' : 'btn-outline-secondary'}"
        on:click={() => switchConnectionType((connectionType = "capacitor-ble"))}>
        <MdIcon icon="usb" />
        Capacitor BLE
      </button>
    {/if}
  {/if}

  {#if $connectionState !== "connected"}
    <button
      class="btn btn-primary"
      disabled={$connectionState === "connecting" ||
        (!featureSupport.capacitorBle && !featureSupport.webBluetooth && !featureSupport.webSerial)}
      on:click={onConnectClicked}>
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
  .dropdown-menu {
    width: 100vw;
    max-width: 300px;
  }
</style>
