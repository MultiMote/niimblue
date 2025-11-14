<script lang="ts">
  import { NiimbotCapacitorBleClient, SoundSettingsItemType, Utils, type AvailableTransports } from "@mmote/niimbluelib";
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
  import FirmwareUpdater from "./basic/FirmwareUpdater.svelte";

  let connectionType: ConnectionType = $state("bluetooth");
  let featureSupport: AvailableTransports = $state({ webBluetooth: false, webSerial: false, capacitorBle: false });

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
            {#each Object.entries($printerInfo) as [k, v] (k)}
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
            {#each Object.entries($printerMeta) as [k, v] (k)}
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
          <button class="btn btn-outline-secondary btn-sm mt-1" onclick={getRfidInfo}>Update</button>

          <ul>
            {#each Object.entries($rfidInfo) as [k, v] (v)}
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
            {#each Object.entries($heartbeatData) as [k, v] (v)}
              <li>{k}: <strong>{v ?? "-"}</strong></li>
            {/each}
          </ul>
        </div>
      {/if}

      <FirmwareUpdater />

      <button
        class="btn btn-sm btn-outline-secondary d-block w-100 mt-1"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#tests">
        Tests <MdIcon icon="expand_more" />
      </button>

      <div class="collapse" id="tests">
        <div class="d-flex flex-wrap gap-1 mt-1">
          <button class="btn btn-sm btn-primary" onclick={startHeartbeat}>Heartbeat on</button>
          <button class="btn btn-sm btn-primary" onclick={stopHeartbeat}>Heartbeat off</button>
          <button class="btn btn-sm btn-primary" onclick={soundOn}>Sound on</button>
          <button class="btn btn-sm btn-primary" onclick={soundOff}>Sound off</button>
          <button class="btn btn-sm btn-primary" onclick={fetchInfo}>Fetch info again</button>
          <button class="btn btn-sm btn-primary" onclick={reset}>Reset</button>
        </div>
      </div>
    </div>
    <span class="input-group-text">
      {#if connectionType === "serial"}
        <MdIcon icon="usb" />
      {:else}
        <MdIcon icon="bluetooth" />
      {/if}
    </span>
    <span class="input-group-text {$heartbeatFails > 0 ? 'text-warning' : ''}">
      {$printerMeta?.model ?? $connectedPrinterName}
    </span>
    {#if $heartbeatData}
      <span class="input-group-text">
        <MdIcon icon={batteryIcon($heartbeatData.powerLevel)} class="r-90"></MdIcon>
      </span>
    {/if}
  {:else}
    {#if featureSupport.webBluetooth}
      <button
        disabled={$connectionState === "connecting"}
        class="btn text-nowrap {connectionType === 'bluetooth' ? 'btn-light' : 'btn-outline-secondary'}"
        onclick={() => switchConnectionType("bluetooth")}>
        <MdIcon icon="bluetooth" />
        {$tr("connector.bluetooth")}
      </button>
    {/if}
    {#if featureSupport.webSerial}
      <button
        disabled={$connectionState === "connecting"}
        class="btn text-nowrap {connectionType === 'serial' ? 'btn-light' : 'btn-outline-secondary'}"
        onclick={() => switchConnectionType((connectionType = "serial"))}>
        <MdIcon icon="usb" />
        {$tr("connector.serial")}
      </button>
    {/if}
    {#if featureSupport.capacitorBle}
      <button
        disabled={$connectionState === "connecting"}
        class="btn text-nowrap {connectionType === 'capacitor-ble' ? 'btn-light' : 'btn-outline-secondary'}"
        onclick={() => switchConnectionType((connectionType = "capacitor-ble"))}>
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
      onclick={onConnectClicked}>
      <MdIcon icon="power" />
    </button>
  {/if}

  {#if $connectionState === "connected"}
    <button class="btn btn-danger" onclick={onDisconnectClicked}>
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
