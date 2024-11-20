<script lang="ts">
  import { SoundSettingsItemType, Utils, type AvailableTransports, type RfidInfo } from "@mmote/niimbluelib";
  import {
    printerClient,
    connectedPrinterName,
    connectionState,
    initClient,
    heartbeatData,
    printerInfo,
    printerMeta,
    heartbeatFails,
  } from "../stores";
  import type { ConnectionType } from "../types";
  import { tr } from "../utils/i18n";
  import MdIcon from "./MdIcon.svelte";
  import { Toasts } from "../utils/toasts";
  import { onMount } from "svelte";
  import { LocalStoragePersistence } from "../utils/persistence";
  import type { MaterialIcon } from "material-icons";

  let connectionType: ConnectionType = "bluetooth";
  let rfidInfo: RfidInfo | undefined = undefined;
  let featureSupport: AvailableTransports = { webBluetooth: false, webSerial: false, capacitorBle: false };

  const onConnectClicked = async () => {
    initClient(connectionType);
    connectionState.set("connecting");

    try {
      await $printerClient.connect();
    } catch (e) {
      connectionState.set("disconnected");
      Toasts.error(e);
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
    await $printerClient.fetchPrinterInfo();
  };

  const reset = async () => {
    await $printerClient.abstraction.printerReset();
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
        <div>
          Model metadata:
          <ul>
            {#each Object.entries($printerMeta) as [k, v]}
              <li>{k}: <strong>{v ?? "-"}</strong></li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if rfidInfo}
        <div>
          Rfid info:
          <ul>
            {#each Object.entries(rfidInfo) as [k, v]}
              <li>{k}: <strong>{v ?? "-"}</strong></li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if $heartbeatData}
        <div>
          Heartbeat data:
          <ul>
            {#each Object.entries($heartbeatData) as [k, v]}
              <li>{k}: <strong>{v ?? "-"}</strong></li>
            {/each}
          </ul>
        </div>
      {/if}

      <div>Tests</div>

      <button class="btn btn-sm btn-primary" on:click={getRfidInfo}>Rfid</button>
      <button class="btn btn-sm btn-primary" on:click={startHeartbeat}>Heartbeat on</button>
      <button class="btn btn-sm btn-primary" on:click={stopHeartbeat}>Heartbeat off</button>
      <button class="btn btn-sm btn-primary" on:click={soundOn}>Sound on</button>
      <button class="btn btn-sm btn-primary" on:click={soundOff}>Sound off</button>
      <button class="btn btn-sm btn-primary" on:click={fetchInfo}>Fetch info again</button>
      <button class="btn btn-sm btn-primary" on:click={reset}>Reset</button>
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
      disabled={$connectionState === "connecting" || (!featureSupport.capacitorBle && !featureSupport.webBluetooth && !featureSupport.webSerial)}
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
