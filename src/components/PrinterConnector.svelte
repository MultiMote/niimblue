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
    ribbonRfidInfo,
    refreshRfidInfo,
  } from "$/stores";
  import type { ConnectionType } from "$/types";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { Toasts } from "$/utils/toasts";
  import { onMount } from "svelte";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import type { MaterialIcon } from "material-icons";
  import FirmwareUpdater from "$/components/basic/FirmwareUpdater.svelte";

  let connectionType = $state<ConnectionType>("bluetooth");
  let featureSupport = $state<AvailableTransports>({ webBluetooth: false, webSerial: false, capacitorBle: false });

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
    if (value > 4) {
      value = Math.min(4, Math.max(1, Math.ceil(value / 25)));
    }

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

<div class="nb-printer-card {$connectionState === 'connected' ? 'connected' : ''} {$connectionState === 'connecting' ? 'connecting' : ''}">
  <!-- Decorative circles (clipped) -->
  <div class="nb-circles-clip">
    <div class="nb-circle-1"></div>
    <div class="nb-circle-2"></div>
  </div>

  <div class="nb-card-content">
    <div class="nb-card-left">
      {#if $connectionState === "connected"}
        <div class="nb-card-label">
          {#if connectionType === "serial"}
            USB
          {:else}
            BLUETOOTH
          {/if}
        </div>
        <div class="nb-card-name-row">
          <span class="nb-card-name">{$printerMeta?.model ?? $connectedPrinterName}</span>
          {#if $heartbeatData?.chargeLevel}
            <span class="nb-battery-inline">
              <MdIcon icon={batteryIcon($heartbeatData.chargeLevel)} class="r-90"></MdIcon>
              {$heartbeatData.chargeLevel}%
            </span>
          {/if}
          {#if $heartbeatFails > 0}
            <span class="nb-badge warn">
              <MdIcon icon="warning" />
            </span>
          {/if}
        </div>
      {:else}
        <div class="nb-card-label">
          {$connectionState === "connecting" ? "CONNECTING..." : "NO PRINTER"}
        </div>
      {/if}
    </div>

    <div class="nb-card-actions">
      {#if $connectionState === "connected"}
        <button class="nb-settings-btn" data-bs-toggle="collapse" data-bs-target="#printerInfoPanel">
          <MdIcon icon="settings" />
        </button>

        <button class="nb-bt-btn connected" onclick={onDisconnectClicked}>
          <MdIcon icon="bluetooth" />
        </button>
      {:else}
        <button
          class="nb-bt-btn {$connectionState === 'connecting' ? 'scanning' : ''}"
          disabled={$connectionState === "connecting" ||
            (!featureSupport.capacitorBle && !featureSupport.webBluetooth && !featureSupport.webSerial)}
          onclick={onConnectClicked}>
          <MdIcon icon="bluetooth" />
        </button>
      {/if}
    </div>
  </div>

  {#if $connectionState === "connected"}
    <div class="collapse nb-info-panel" id="printerInfoPanel">
      {#if $printerInfo}
        <div class="nb-info-section">
          <div class="nb-section-title">Printer info</div>
          <ul class="nb-info-list">
            {#each Object.entries($printerInfo) as [key, value] (key)}
              <li><span class="nb-info-key">{key}</span><strong>{value ?? "-"}</strong></li>
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
          <ul class="nb-info-list">
            {#each Object.entries($printerMeta) as [key, value] (key)}
              <li><span class="nb-info-key">{key}</span><strong>{value ?? "-"}</strong></li>
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
          RFID info <MdIcon icon="expand_more" />
        </button>
        <div class="collapse" id="rfidInfo">
          <button class="btn btn-outline-secondary btn-sm mt-1" onclick={refreshRfidInfo}>Update</button>
          <ul class="nb-info-list">
            {#each Object.entries($rfidInfo) as [key, value] (key)}
              <li><span class="nb-info-key">{key}</span><strong>{value ?? "-"}</strong></li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if $ribbonRfidInfo}
        <button
          class="btn btn-sm btn-outline-secondary d-block w-100 mt-1"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#ribbonRfidInfo">
          Ribbon RFID info <MdIcon icon="expand_more" />
        </button>
        <div class="collapse" id="ribbonRfidInfo">
          <button class="btn btn-outline-secondary btn-sm mt-1" onclick={refreshRfidInfo}>Update</button>
          <ul class="nb-info-list">
            {#each Object.entries($ribbonRfidInfo) as [key, value] (key)}
              <li><span class="nb-info-key">{key}</span><strong>{value ?? "-"}</strong></li>
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
          <ul class="nb-info-list">
            {#each Object.entries($heartbeatData) as [key, value] (key)}
              <li><span class="nb-info-key">{key}</span><strong>{value ?? "-"}</strong></li>
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
  {/if}

  {#if $connectionState !== "connected"}
    <div class="nb-transport-selector">
      {#if featureSupport.webBluetooth}
        <button
          disabled={$connectionState === "connecting"}
          class="nb-transport-btn {connectionType === 'bluetooth' ? 'active' : ''}"
          onclick={() => switchConnectionType("bluetooth")}>
          <MdIcon icon="bluetooth" />
          {$tr("connector.bluetooth")}
        </button>
      {/if}
      {#if featureSupport.webSerial}
        <button
          disabled={$connectionState === "connecting"}
          class="nb-transport-btn {connectionType === 'serial' ? 'active' : ''}"
          onclick={() => switchConnectionType((connectionType = "serial"))}>
          <MdIcon icon="usb" />
          {$tr("connector.serial")}
        </button>
      {/if}
      {#if featureSupport.capacitorBle}
        <button
          disabled={$connectionState === "connecting"}
          class="nb-transport-btn {connectionType === 'capacitor-ble' ? 'active' : ''}"
          onclick={() => switchConnectionType((connectionType = "capacitor-ble"))}>
          <MdIcon icon="usb" />
          Capacitor BLE
        </button>
      {/if}
    </div>
  {/if}

  {#if $connectionState === "connecting"}
    <div class="nb-scanning-indicator">
      <div class="nb-spinner"></div>
      Searching for printers...
    </div>
  {/if}
</div>

<style>
  .nb-printer-card {
    background: linear-gradient(135deg, #475569 0%, #64748B 100%);
    border-radius: 14px;
    padding: 12px 16px;
    color: #fff;
    position: relative;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    transition: all 0.4s ease;
    margin-bottom: 8px;
  }

  .nb-printer-card.connected {
    background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%);
    box-shadow: 0 8px 32px rgba(37,99,235,0.3);
  }

  .nb-circles-clip {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
  }

  .nb-circle-1 {
    position: absolute;
    top: -30px;
    right: -30px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
  }

  .nb-circle-2 {
    position: absolute;
    bottom: -20px;
    left: -20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }

  .nb-card-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .nb-card-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.6);
    margin-bottom: 2px;
  }

  .nb-card-name-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .nb-card-name {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 0;
  }

  .nb-battery-inline {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-weight: 500;
    opacity: 0.85;
  }

  .nb-badge.warn {
    color: #FCD34D;
    font-size: 14px;
  }

  .nb-card-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .nb-settings-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.1);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nb-settings-btn:hover {
    background: rgba(255,255,255,0.2);
  }

  .nb-bt-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.15);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .nb-bt-btn.connected {
    background: rgba(239,68,68,0.3);
    border-color: rgba(239,68,68,0.5);
  }

  .nb-bt-btn.scanning {
    animation: nb-pulse 1.5s infinite;
  }

  .nb-bt-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .nb-transport-selector {
    display: flex;
    gap: 6px;
    margin-top: 8px;
    position: relative;
    z-index: 1;
  }

  .nb-transport-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    color: rgba(255,255,255,0.7);
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .nb-transport-btn.active {
    background: rgba(255,255,255,0.2);
    border-color: rgba(255,255,255,0.3);
    color: #fff;
  }

  .nb-transport-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .nb-scanning-indicator {
    margin-top: 8px;
    padding: 6px 12px;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 1;
  }

  .nb-spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    animation: nb-spin 0.8s linear infinite;
  }

  @keyframes nb-pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255,255,255,0.4);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 12px rgba(255,255,255,0);
    }
  }

  @keyframes nb-spin {
    to { transform: rotate(360deg); }
  }

  .nb-info-panel {
    margin-top: 10px;
    padding: 12px;
    background: var(--nb-surface);
    border-radius: 12px;
    position: relative;
    z-index: 1;
    max-height: 60vh;
    overflow-y: auto;
  }

  .nb-info-section {
    padding: 8px;
  }

  .nb-section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--nb-text-tertiary);
    margin-bottom: 8px;
  }

  .nb-info-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .nb-info-list li {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
    border-bottom: 1px solid var(--nb-border-light);
    color: var(--nb-text);
  }

  .nb-info-list li:last-child {
    border-bottom: none;
  }

  .nb-info-key {
    color: var(--nb-text-secondary);
  }
</style>
