<script lang="ts">
  import {
    LabelType,
    NiimbotCapacitorBleClient,
    SoundSettingsItemType,
    Utils,
    type AvailableTransports,
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
  } from "$/stores";
  import type { ConnectionType } from "$/types";
  import { tr, type TranslationKey } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { Toasts } from "$/utils/toasts";
  import { onMount } from "svelte";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import type { MaterialIcon } from "material-icons";
  import FirmwareUpdater from "$/components/basic/FirmwareUpdater.svelte";
  import PrinterVerboseInfo from "$/components/PrinterVerboseInfo.svelte";

  let connectionType = $state<ConnectionType>("bluetooth");
  let featureSupport = $state<AvailableTransports>({ webBluetooth: false, webSerial: false, capacitorBle: false });
  let verboseInfoShow = $state<boolean>(false);

  const percentage = (cur?: number, total?: number) => {
    if (cur === undefined || total === undefined) {
      return 0;
    }
    const usage = Math.floor((cur / total) * 100);
    return Math.min(Math.max(usage, 0), 100);
  };

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

  const reset = async () => {
    await $printerClient.protocol.printerReset();
  };

  const switchConnectionType = (c: ConnectionType) => {
    LocalStoragePersistence.saveLastConnectionType(c);
    connectionType = c;
  };

  const batteryIcon = (value: number): MaterialIcon => {
    if (value >= 90) return "battery_full";
    if (value >= 65) return "battery_5_bar";
    if (value >= 40) return "battery_3_bar";
    if (value >= 15) return "battery_2_bar";
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

    <div class="dropdown-menu p-3">
      {#if $printerInfo}
        <div class="text-secondary">{$tr("connector.device_version")}</div>

        <div class="d-flex border rounded">
          <div class="px-1 bg-light-subtle border-end">HW</div>
          <div class="px-1 flex-grow-1 border-end text-center">{$printerInfo.hardwareVersion}</div>
          <div class="px-1 flex-grow-1 border-end text-center">{$printerInfo.softwareVersion}</div>
          <div class="px-1 bg-body-secondary">FW</div>
        </div>
      {/if}

      <div class="text-secondary mt-2">
        {$tr("connector.rfid.paper")}
        <button class="btn btn-sm p-0" onclick={() => $printerClient.fetchRfidInfo()}><MdIcon icon="loop" /></button>
      </div>

      {#if $rfidInfo.labelRfidInfo?.tagPresent}
        <div class="d-flex border rounded mt-1">
          <div class="px-1 bg-light-subtle border-end">{$tr("connector.rfid.usage")}</div>
          <div class="px-1 flex-grow-1 d-flex align-items-center gap-1">
            <div class="progress flex-grow-1" role="progressbar" style:height="0.6rem">
              <div
                class="progress-bar"
                style:width={`${percentage($rfidInfo.labelRfidInfo.usedPaper, $rfidInfo.labelRfidInfo.allPaper)}%`}>
              </div>
            </div>
            <div class="fs-08">
              {$rfidInfo.labelRfidInfo?.usedPaper} / {$rfidInfo.labelRfidInfo?.allPaper}
            </div>
          </div>
        </div>

        <div class="d-flex border rounded mt-1">
          <div class="px-1 bg-light-subtle border-end">{$tr("connector.rfid.type")}</div>
          <div class="px-1 flex-grow-1 text-center">
            {$tr(`preview.label_type.${LabelType[$rfidInfo.labelRfidInfo?.consumablesType]}` as TranslationKey)} ({$rfidInfo
              .labelRfidInfo?.consumablesType})
          </div>
        </div>

        {#if $rfidInfo.paperInfo?.paperWidth !== undefined && $rfidInfo.paperInfo?.paperHeight !== undefined}
          <div class="d-flex border rounded mt-1">
            <div class="px-1 bg-light-subtle border-end">{$tr("connector.rfid.dimensions")}</div>
            <div class="px-1 flex-grow-1 text-center">
              {$rfidInfo.paperInfo.paperWidth}x{$rfidInfo.paperInfo.paperHeight}mm
            </div>
          </div>
        {/if}
      {:else}
        {$tr("connector.rfid.no_tag")}
      {/if}

      {#if $rfidInfo.ribbonRfidInfo?.tagPresent}
        <div class="text-secondary mt-2">
          {$tr("connector.rfid.ribbon")}
          <button class="btn btn-sm p-0" onclick={() => $printerClient.fetchRfidInfo()}><MdIcon icon="loop" /></button>
        </div>

        <div class="d-flex border rounded mt-1">
          <div class="px-1 bg-light-subtle border-end">{$tr("connector.rfid.usage")}</div>
          <div class="px-1 flex-grow-1 d-flex align-items-center gap-1">
            <div class="progress flex-grow-1" role="progressbar" style:height="0.6rem">
              <div
                class="progress-bar"
                style:width={`${percentage($rfidInfo.ribbonRfidInfo.usedPaper, $rfidInfo.ribbonRfidInfo.allPaper)}%`}>
              </div>
            </div>
            <div class="fs-08">
              {$rfidInfo.ribbonRfidInfo?.usedPaper} / {$rfidInfo.ribbonRfidInfo?.allPaper}
            </div>
          </div>
        </div>
      {/if}

      <div class="text-secondary mt-2">{$tr("connector.settings")}</div>

      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          id="power-sound-switch"
          checked={$printerInfo.settings.powerSound}
          onchange={() =>
            $printerClient.setSoundEnabled(SoundSettingsItemType.PowerSound, !$printerInfo.settings.powerSound)} />
        <label class="form-check-label" for="power-sound-switch">{$tr("connector.settings.power_sound")}</label>
      </div>

      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          id="connection-sound-switch"
          checked={$printerInfo.settings.connectionSound}
          onchange={() =>
            $printerClient.setSoundEnabled(
              SoundSettingsItemType.BluetoothConnectionSound,
              !$printerInfo.settings.connectionSound,
            )} />
        <label class="form-check-label" for="connection-sound-switch"
          >{$tr("connector.settings.connection_sound")}</label>
      </div>


      <button class="btn btn-sm btn-outline-secondary w-100 mt-3" onclick={() => (verboseInfoShow = true)}
        >{$tr("connector.open_verbose")}</button>

      <button
        class="btn btn-sm btn-outline-secondary d-block w-100 mt-1"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#firmware_flashing">
        {$tr("connector.firmware_flashing")}
        <MdIcon icon="expand_more" />
      </button>

      <div class="collapse" id="firmware_flashing">
        <FirmwareUpdater />
      </div>

      <button
        class="btn btn-sm btn-outline-secondary d-block w-100 mt-1"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#tests">
        {$tr("debug.title")} <MdIcon icon="expand_more" />
      </button>

      <div class="collapse" id="tests">
        <div class="d-flex flex-wrap gap-1 mt-1">
          <button class="btn btn-sm btn-primary" onclick={startHeartbeat}>Heartbeat on</button>
          <button class="btn btn-sm btn-primary" onclick={stopHeartbeat}>Heartbeat off</button>
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
    <span class="input-group-text">
      <MdIcon icon={batteryIcon($heartbeatData?.batteryPercents ?? $printerInfo?.batteryPercents ?? 0)} class="r-90"
      ></MdIcon>
    </span>
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

  {#if verboseInfoShow}
    <PrinterVerboseInfo bind:show={verboseInfoShow} />
  {/if}
</div>

<style>
  .dropdown-menu {
    width: 100vw;
    max-width: 300px;
  }
</style>
